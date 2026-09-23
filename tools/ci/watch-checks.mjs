// R24 (2026-09-23): independent daily checks — live feed freshness + the CoS desk heartbeat.
// Exit 1 on any FAIL; prints one line per check.
import fs from "node:fs";
const fails = [], out = [];
const ptDate = (d) => new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
const ymd = (d) => d.toISOString().slice(0, 10);
const now = ptDate(new Date());
const today = ymd(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
const yest = ymd(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1)));

// 1. live feed freshness
try {
  const r = await fetch("https://shopcardhub.com/feed/prices-latest.json", { headers: { "X-ShopCardHub-Client": "tool" } });
  const d = await r.json();
  const cards = Array.isArray(d.cards) ? d.cards : [];
  const numeric = cards.filter((c) => typeof (c.last ?? c.price ?? c.mark) === "number").length;
  const titles = JSON.stringify(d).includes('"title"');
  const ok = r.ok && (d.day === today || d.day === yest) && cards.length >= 30 && numeric >= 25 && !titles;
  (ok ? out : fails).push(`feed-freshness: HTTP ${r.status} · day ${d.day} (want ${yest}/${today}) · ${cards.length} cards · ${numeric} numeric · titles ${titles ? "PRESENT" : "none"}`);
} catch (e) { fails.push(`feed-freshness: could not read live feed — ${e.message}`); }

// 2. desk heartbeat (Tue–Sat mornings PT check the previous weekday)
const dow = now.getDay(); // 0 Sun
if (dow >= 2 && dow <= 6) {
  const prev = new Date(now); prev.setDate(now.getDate() - 1);
  const label = prev.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const lbl = `${prev.toLocaleString("en-US", { month: "short" })} ${prev.getDate()}`;
  const state = fs.readFileSync("claude/cos/STATE.md", "utf8");
  const hit = state.split("\n").some((l) => l.includes(lbl) && l.includes("CoS · desk"));
  (hit ? out : fails).push(`desk-heartbeat: STATE RUN LOG ${hit ? "has" : "has NO"} a "${lbl} … CoS · desk" entry`);
} else out.push("desk-heartbeat: not checked (Sun/Mon — no desk run the day before)");

for (const l of out) console.log("PASS  " + l);
for (const l of fails) console.log("FAIL  " + l);
process.exit(fails.length ? 1 : 0);
