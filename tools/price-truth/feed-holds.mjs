#!/usr/bin/env node
// tools/price-truth/feed-holds.mjs — apply watchlist markHold rows to the served feed now
// (Price Truth, Nov 17 2026; Bowman KB G25).
//
// The nightly engine (tools/price-engine/snapshot-free.mjs) applies markHold itself from the next
// snapshot on. A hold is set the same day it is found (charter step 3, "hold first"), so this applies
// the same exported function, applyMarkHold(), to data/feed/prices-latest.json as it stands. Rows
// without an active hold are left byte-for-byte as they were. Idempotent.
//
// Usage: node tools/price-truth/feed-holds.mjs [--feed data/feed] [--dry]
// Then:  node tools/build-home.mjs (FEED_BASE=data/feed) and node tools/build-card-pages.mjs, gates, push.
import fs from "node:fs";
import path from "node:path";
import { applyMarkHold } from "../price-engine/snapshot-free.mjs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const fi = args.indexOf("--feed");
const FEED = fi >= 0 ? args[fi + 1] : "data/feed";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

const wl = JSON.parse(fs.readFileSync(path.join(ROOT, "data/watchlist.json"), "utf8"));
const byKey = new Map((wl.cards || []).filter((c) => c && c.source && c.id).map((c) => [c.source + ":" + c.id, c]));
const p = path.resolve(ROOT, FEED, "prices-latest.json");
const raw = fs.readFileSync(p, "utf8");
const feed = JSON.parse(raw);
const day = feed.day || new Date().toISOString().slice(0, 10);
let held = 0;
feed.cards = (feed.cards || []).map((row) => {
  const out = applyMarkHold(row, byKey.get(row.key), day);
  if (out !== row) { held++; console.log(`hold: ${row.key} (was last ${row.last}, signal ${row.signal}) -> last null, HOLD`); }
  return out;
});
if (!held) { console.log("feed-holds: no active markHold rows - feed unchanged"); process.exit(0); }
const indent = (raw.match(/^\{\n( +)/) || [, "  "])[1].length;
if (!dry) fs.writeFileSync(p, JSON.stringify(feed, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
console.log(`feed-holds: ${held} row(s) held in ${path.relative(ROOT, p)}${dry ? " (dry run)" : ""}`);
