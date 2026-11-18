// Vercel Serverless Function — the private Control Room (Nov 18 2026, CoS with Mo).
//
// WHY: Mo wants to open the control room from any computer (work included) behind a password, and
// answer the things that wait on him right on the page, like the old dungeon's approve/decline.
// The repo and the price-data branch are PUBLIC, so nothing here is stored in the clear:
//   * the room state and Mo's decisions are AES-256-GCM encrypted before they are committed;
//   * the password is never stored — only scrypt(password) keyed again with a server-only pepper,
//     so the committed hash cannot be attacked offline;
//   * every key derives from the GITHUB_TOKEN env var (already in Vercel), so no new env var.
//     If that token is ever rotated: the CoS re-runs `setpw` and `publish` and everything is back.
//
// Two callers:
//   MO (browser, session cookie)
//     POST {op:"login", password}                → sets the cookie
//     POST {op:"logout"}
//     GET  /api/room                             → { state, decisions }
//     POST {op:"decide", id, decision, note?, label?}   decision: approved | declined | done | clear
//   THE CHIEF OF STAFF (header x-room-key; its sha256 is the constant below, the key is not in the repo)
//     POST {op:"publish", state}                 → replaces the room state
//     GET  /api/room?op=state                    → { state, decisions }  (read, edit, publish back)
//     GET  /api/room?op=decisions                → { decisions }
//     POST {op:"ack", acks:[{id, text}]}         → marks a decision as acted on (shown on the page)
//     POST {op:"setpw", password}                → sets or changes Mo's password
//
// Storage (price-data branch, via _lib/store.js): data/room/state.json, data/room/decisions.json,
// data/room/auth.json.

import crypto from "node:crypto";
import { readJson, writeJson } from "./_lib/store.js";

const WRITE_KEY_SHA256 = "3aa640039c00178041bca542077f208acb32af051bcf3ff4f5eca6c432e72d84";
const P_STATE = "data/room/state.json";
const P_DEC = "data/room/decisions.json";
const P_AUTH = "data/room/auth.json";
const COOKIE = "sch_room";
const SESSION_DAYS = 30;
const MAX_STATE_BYTES = 300_000;
const MAX_DECISIONS = 400;
const HOSTS = new Set(["www.shopcardhub.com", "shopcardhub.com", "localhost", "127.0.0.1"]);

const hmac = (key, msg) => crypto.createHmac("sha256", key).update(msg).digest();
const base = () => hmac(process.env.GITHUB_TOKEN, "sch-control-room-v1");
const kEnc = () => hmac(base(), "enc");
const kSess = () => hmac(base(), "session");
const kPep = () => hmac(base(), "pepper");
const b64 = (buf) => Buffer.from(buf).toString("base64");
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", kEnc(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return { v: 1, alg: "A256GCM", note: "Encrypted. Read it through /api/room.", iv: b64(iv), tag: b64(c.getAuthTag()), ct: b64(ct), at: new Date().toISOString() };
}
function open(env) {
  if (!env || !env.ct) return null;
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", kEnc(), Buffer.from(env.iv, "base64"));
    d.setAuthTag(Buffer.from(env.tag, "base64"));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(env.ct, "base64")), d.final()]).toString("utf8"));
  } catch { return null; }
}

const scrypt = (pw, salt) => new Promise((ok, no) =>
  crypto.scrypt(pw, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 }, (e, k) => (e ? no(e) : ok(k))));
const pwHash = async (pw, salt) => hmac(kPep(), await scrypt(pw, salt)).toString("hex");

const sessSig = (exp, hash) => hmac(kSess(), `${exp}.${hash}`).toString("hex");
function cookieOf(req) {
  const m = String(req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : "";
}
function sessionOk(req, auth) {
  if (!auth || !auth.hash) return false;
  const [exp, sig] = cookieOf(req).split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEq(sig, sessSig(exp, auth.hash));
}
function setCookie(res, value, maxAge) {
  res.setHeader("Set-Cookie", `${COOKIE}=${value}; Path=/api/room; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
}
function chiefOk(req) {
  const k = req.headers["x-room-key"];
  if (!k || typeof k !== "string") return false;
  return safeEq(crypto.createHash("sha256").update(k).digest("hex"), WRITE_KEY_SHA256);
}
function sameOrigin(req) {
  const o = req.headers.origin;
  if (o) { try { return HOSTS.has(new URL(o).hostname.toLowerCase()); } catch { return false; } }
  return String(req.headers["sec-fetch-site"] || "").toLowerCase() === "same-origin";
}

// Login throttle, per warm instance: 6 tries per 10 minutes per IP, and 40 in total.
const tries = new Map();
function throttled(ip) {
  const now = Date.now(), W = 600_000;
  for (const k of [ip, "*"]) {
    const t = tries.get(k);
    if (!t || now - t.t > W) tries.set(k, { t: now, n: 1 });
    else t.n += 1;
  }
  if (tries.size > 5000) tries.clear();
  return (tries.get(ip)?.n || 0) > 6 || (tries.get("*")?.n || 0) > 40;
}

async function saveDecisions(mutate, message) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, sha } = await readJson(P_DEC);
      const store = open(data) || { decisions: {} };
      if (!store.decisions || typeof store.decisions !== "object") store.decisions = {};
      mutate(store.decisions);
      const ids = Object.keys(store.decisions);
      if (ids.length > MAX_DECISIONS) {
        ids.sort((a, b) => String(store.decisions[a].at || "").localeCompare(String(store.decisions[b].at || "")));
        for (const old of ids.slice(0, ids.length - MAX_DECISIONS)) delete store.decisions[old];
      }
      await writeJson(P_DEC, seal(store), sha || undefined, message);
      return store.decisions;
    } catch (e) { if (attempt === 2) throw e; }
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (!process.env.GITHUB_TOKEN) { res.status(503).json({ error: "store not configured" }); return; }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const op = req.method === "GET" ? String((req.query && req.query.op) || "") : String(body.op || "");

  try {
    // ── the Chief of Staff ───────────────────────────────────────────────────────────────────
    if (op === "publish" || op === "ack" || op === "setpw" || (req.method === "GET" && (op === "decisions" || op === "state"))) {
      if (!chiefOk(req)) { res.status(401).json({ error: "bad key" }); return; }

      if (op === "decisions") {
        const { data } = await readJson(P_DEC);
        res.status(200).json({ decisions: (open(data) || {}).decisions || {} }); return;
      }
      if (op === "state") {
        const [s, d] = await Promise.all([readJson(P_STATE), readJson(P_DEC)]);
        res.status(200).json({ state: open(s.data), stateAt: (s.data && s.data.at) || null, decisions: (open(d.data) || {}).decisions || {} }); return;
      }
      if (req.method !== "POST") { res.status(405).json({ error: "POST" }); return; }

      if (op === "publish") {
        const state = body.state;
        if (!state || typeof state !== "object" || Array.isArray(state)) { res.status(400).json({ error: "state object required" }); return; }
        const bytes = Buffer.byteLength(JSON.stringify(state));
        if (bytes > MAX_STATE_BYTES) { res.status(413).json({ error: `state is ${bytes} bytes; the cap is ${MAX_STATE_BYTES}` }); return; }
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { sha } = await readJson(P_STATE);
            await writeJson(P_STATE, seal(state), sha || undefined, "room: state");
            break;
          } catch (e) { if (attempt === 2) throw e; }
        }
        res.status(200).json({ ok: true, bytes, asOf: state.asOf || null }); return;
      }
      if (op === "ack") {
        const acks = Array.isArray(body.acks) ? body.acks.slice(0, 50) : [];
        let n = 0;
        await saveDecisions((d) => {
          for (const a of acks) {
            const id = clean(a && a.id, 120);
            if (!id || !d[id]) continue;
            d[id].acted = { at: new Date().toISOString(), text: clean(a.text, 300) };
            n += 1;
          }
        }, "room: ack");
        res.status(200).json({ ok: true, acked: n }); return;
      }
      if (op === "setpw") {
        const pw = String(body.password || "");
        if (pw.length < 12) { res.status(400).json({ error: "password must be at least 12 characters" }); return; }
        const salt = crypto.randomBytes(16).toString("hex");
        const { sha } = await readJson(P_AUTH);
        await writeJson(P_AUTH, { note: "Not a password. scrypt output keyed with a server-only secret.", salt, hash: await pwHash(pw, salt), setAt: new Date().toISOString() }, sha || undefined, "room: auth");
        res.status(200).json({ ok: true }); return;
      }
    }

    // ── Mo ───────────────────────────────────────────────────────────────────────────────────
    if (req.method === "POST" && op === "login") {
      if (!sameOrigin(req)) { res.status(403).json({ error: "forbidden" }); return; }
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
      if (throttled(ip)) { res.setHeader("Retry-After", "600"); res.status(429).json({ error: "Too many tries. Wait ten minutes." }); return; }
      const { data: auth } = await readJson(P_AUTH);
      const pw = String(body.password || "").slice(0, 200);
      const ok = !!(auth && auth.hash && pw && safeEq(await pwHash(pw, auth.salt), auth.hash));
      if (!ok) { res.status(401).json({ error: "Wrong password." }); return; }
      const exp = Date.now() + SESSION_DAYS * 86_400_000;
      setCookie(res, `${exp}.${sessSig(exp, auth.hash)}`, SESSION_DAYS * 86_400);
      res.status(200).json({ ok: true }); return;
    }
    if (req.method === "POST" && op === "logout") {
      setCookie(res, "x", 0);
      res.status(200).json({ ok: true }); return;
    }

    if (req.method === "GET" && !op) {
      const [a, s, d] = await Promise.all([readJson(P_AUTH), readJson(P_STATE), readJson(P_DEC)]);
      if (!sessionOk(req, a.data)) { res.status(401).json({ error: "sign in" }); return; }
      res.status(200).json({ state: open(s.data), stateAt: s.data && s.data.at || null, decisions: (open(d.data) || {}).decisions || {} }); return;
    }

    if (req.method === "POST" && op === "decide") {
      if (!sameOrigin(req)) { res.status(403).json({ error: "forbidden" }); return; }
      const { data: auth } = await readJson(P_AUTH);
      if (!sessionOk(req, auth)) { res.status(401).json({ error: "sign in" }); return; }
      const id = clean(body.id, 120);
      const decision = ["approved", "declined", "done", "clear"].includes(body.decision) ? body.decision : null;
      if (!id || !decision) { res.status(400).json({ error: "id and decision required" }); return; }
      const note = clean(body.note, 500), label = clean(body.label, 300);
      const decisions = await saveDecisions((d) => {
        if (decision === "clear") { delete d[id]; return; }
        d[id] = { decision, note: note || undefined, label: label || undefined, at: new Date().toISOString() };
      }, "room: decision");
      res.status(200).json({ ok: true, decisions }); return;
    }

    res.status(400).json({ error: "unknown request" });
  } catch (e) {
    res.status(502).json({ error: "store failed" });
  }
}
