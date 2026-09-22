#!/usr/bin/env node
// reply-voice-check.mjs — grade @shopcardhub replies against x-desk-watch spec §0.
//
// §0 is Mo's, written 2026-09-21 after he deleted the vendor's first five replies:
// "they reek of AI bot replies … I want engagement with our twitter account, not
// 'check out our site' type replies." The standard he approved:
//
//   BAD:  "Nice pull! Check our index for where it sits."
//   GOOD: "That centering looks better than most I've seen. You keeping it raw?"
//
// This checks the MECHANICAL half only — the rules a machine can settle. The stranger test
// ("would someone who has never heard of us read this as an ad?") is judgment and stays with
// the Chief of Staff. A reply that passes every rule here can still fail the stranger test,
// and that call outranks this tool.
//
// It exists so the read happens BEFORE the post, not after. Monday's five were caught by Mo,
// live, on his own account. That is the wrong order and it is the only thing this changes.
//
// Usage:  node tools/reply-voice-check.mjs replies.txt     (one reply per line; blank lines ignored)
//         cat replies.txt | node tools/reply-voice-check.mjs
//         ... --json

import fs from "fs";

const argv = process.argv.slice(2);
const JSON_OUT = argv.includes("--json");
const file = argv.find(a => !a.startsWith("--"));
const raw = file ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8");
const replies = raw.split("\n").map(s => s.trim()).filter(Boolean);

// The no-link window: §0 pauses links in replies for two weeks from 2026-09-21.
const LINKS_RETURN = "2026-10-05";
const today = new Date().toISOString().slice(0, 10);
const linksStillPaused = today < LINKS_RETURN;

const SITE_WORDS = [
  "shopcardhub", "our index", "our board", "our page", "our site", "our tracker", "our chart",
  "we track", "we built", "we made", "we have a", "check out", "check our", "take a look at our",
  "link in bio", "see our", "on our", "the tape", "our vault",
];
const SIGNOFFS = [/\bcheers\b/i, /\bthanks for sharing\b/i, /\bhappy (collecting|hunting)\b/i, /\bDM (me|us)\b/i, /\bfollow (us|for more)\b/i];

const checks = [
  { id: "link", why: "no links in replies until " + LINKS_RETURN,
    test: t => linksStillPaused && /(https?:\/\/|www\.|\S+\.(com|net|org|co|io)\b)/i.test(t) },
  { id: "site-mention", why: "names the site or what it does — this is the 'check out our site' reply Mo deleted",
    test: t => SITE_WORDS.some(w => t.toLowerCase().includes(w)) },
  { id: "em-dash", why: "em dash — nobody types one on a phone",
    test: t => /—/.test(t) },
  { id: "not-x-but-y", why: "the 'not X, but Y' construction is a tell",
    test: t => /\bnot\s+(just\s+)?(?:[\w'’-]+\s+){0,4}[\w'’-]+,?\s+but\b/i.test(t) },
  { id: "list", why: "lists and bullets are not conversation",
    test: t => /(^|\s)[-•*]\s|\b1[.)]\s.*\b2[.)]\s/.test(t) },
  { id: "hashtag", why: "no hashtags",
    test: t => /#\w+/.test(t) },
  { id: "emoji-string", why: "more than one emoji in a row",
    test: t => /(\p{Extended_Pictographic}️?\s*){2,}/u.test(t) },
  { id: "signoff", why: "sign-offs read as customer service",
    test: t => SIGNOFFS.some(re => re.test(t)) },
  { id: "long", why: "over 280 characters is not a reply",
    test: t => t.length > 280 },
];

// Numbers can be right — "$90" in a thread already about $90 is how a collector talks. They can
// also be the desk voice leaking in. A machine cannot see the thread, so this WARNS and the
// CoS reads the thread. It never auto-fails.
const hasNumber = t => /(\$\s?\d|\b\d{2,}\b|\b\d+(\.\d+)?%)/.test(t);
const sourcey = t => /\b(per|according to|source|as of|our data|the data|psa \d|comps?)\b/i.test(t);

const shape = t => t.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/).slice(0, 3).join(" ");
const shapes = new Map();
for (const r of replies) { const k = shape(r); shapes.set(k, (shapes.get(k) || 0) + 1); }

const out = replies.map(text => {
  const fails = checks.filter(c => c.test(text)).map(c => ({ id: c.id, why: c.why }));
  const warns = [];
  if (hasNumber(text)) warns.push({ id: "number", why: "carries a number — read the thread: fine if the thread is already about it, a FAIL if it arrives with a source" });
  if (sourcey(text)) warns.push({ id: "source", why: "sounds sourced; §0 says never with a source" });
  // Mechanically clean and still empty. "Nice pull!" was in the batch Mo deleted: it reacts to
  // nothing, asks nothing, and could be posted under any card in the world by any bot. §0 wants
  // a reply that reacts to what the person actually said and asks more than it tells.
  if (/^(nice pull|great pull|congrats|nice card|great card|love (this|that)|awesome|beautiful card|sick pull)\b/i.test(text))
    warns.push({ id: "stock-opener", why: "opens with a stock compliment — says nothing about THIS card and asks nothing back" });
  if (!/\?/.test(text)) warns.push({ id: "no-question", why: "asks nothing; §0 wants a reply that asks more than it tells" });
  if (shapes.get(shape(text)) > 1) warns.push({ id: "repeat-shape", why: `opens the same way as another reply in this batch ("${shape(text)}…")` });
  return { text, verdict: fails.length ? "FAIL" : "CHECK", fails, warns };
});

if (JSON_OUT) { console.log(JSON.stringify({ linksStillPaused, replies: out }, null, 1)); process.exit(out.some(r => r.verdict === "FAIL") ? 1 : 0); }

console.log(`Reply voice check (spec §0) — ${out.length} replies · links ${linksStillPaused ? "PAUSED until " + LINKS_RETURN : "allowed"}\n`);
for (const r of out) {
  console.log(`[${r.verdict}] ${r.text}`);
  for (const f of r.fails) console.log(`    FAIL  ${f.id}: ${f.why}`);
  for (const w of r.warns) console.log(`    warn  ${w.id}: ${w.why}`);
  console.log();
}
const bad = out.filter(r => r.verdict === "FAIL").length;
console.log(bad ? `${bad} of ${out.length} fail a mechanical rule — none of these should post.`
                : `No mechanical failures. Now the stranger test, which is the one that matters:`);
console.log(`  Would someone who has never heard of us read this as an ad? Then it fails, whatever this tool says.`);
process.exit(bad ? 1 : 0);
