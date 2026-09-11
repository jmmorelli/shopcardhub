#!/usr/bin/env node
/* vault-migration.test.cjs — proof that the Vault v1 → v2 (portfolios) migration is lossless (Terminal step 3).
 *
 * Runs js/vault-schema.js migrate() — the same function watchlist.html and js/vault-track.js call — over
 * three v1 fixtures: the demo store, a real-shaped store (6 cards, prices, costs, qty, buyDate, private,
 * feedKey, notes, comc) and a corrupt store. Asserts: every v1 field survives byte-for-byte, every own card
 * gets listId 'default', lists carries the fixed default, corrupt input fails open (ok:false, untouched),
 * re-running is a no-op, and list ops (add / move / remove) never drop a card.
 * Usage: node tools/qa/vault-migration.test.cjs   → exit 1 on any failure. */
const path = require("node:path");
const assert = require("node:assert/strict");
const V = require(path.resolve(__dirname, "../../js/vault-schema.js"));

const now = 1757600000000, day = 86400000;
const hist = (pts, src) => pts.map((p, i) => ({ t: now - (pts.length - 1 - i) * day, p, src: src || "feed" }));
const fixtures = {
  demo: { demo: true, cards: [
    { id: "d1", status: "watch", cat: "basketball", name: "Cooper Flagg Prizm Silver RC #8", set: "2025-26 Panini Prizm", grade: "Raw", target: 340, prices: hist([428, 415, 402, 388]) },
    { id: "d2", status: "own", cat: "baseball", name: "Jackson Holliday 1st Bowman Chrome PSA 10", set: "2023 Bowman Chrome", grade: "PSA 10", cost: 95, qty: 2, buyDate: "2026-01-14", prices: hist([96, 102, 99, 111]) },
  ] },
  real: { demo: false, slim: false, cards: [
    { id: "r1", status: "own", cat: "baseball", name: "Ethan Holliday 1st Bowman Chrome Auto", set: "2026 Bowman", grade: "Raw", target: null, cost: 172, qty: 2, buyDate: "2026-08-20", feedKey: "ebay:ethan-holliday", notes: "Tracked from /ethan-holliday-rookie-cards", prices: hist([182.5, 180, 176.25, 175, 170, 168, 165]) },
    { id: "r2", status: "own", cat: "baseball", name: "Andrew Fischer 1st Bowman Chrome Auto", set: "2026 Bowman", grade: "Raw", cost: 140, qty: 1, buyDate: "2026-08-22", private: true, feedKey: "ebay:andrew-fischer", prices: hist([145, 147.5, 150, 155, 160, 187]) },
    { id: "r3", status: "own", cat: "pokemon", name: "Umbreon ex SIR #161", set: "Prismatic Evolutions", grade: "Raw", cost: 1350, qty: 1, buyDate: "2026-07-02", feedKey: "ebay:umbreon-ex-sir-pe", prices: hist([1400, 1375, 1358.59]) },
    { id: "r4", status: "own", cat: "other", name: "2019 Topps Chrome Vlad Jr RC PSA 9", set: "2019 Topps Chrome", grade: "PSA 9", cost: 60.5, qty: 3, buyDate: "2025-11-04", added: now - 30 * day, comc: { key: "2019 topps chrome vlad jr rc psa 9", ids: ["A1", "A2", "A3"], nfs: 1, fs: 2, ask: 85, lo: 70, hi: 120, n: 12, snap: now - 3 * day }, prices: hist([70], "comc") },
    { id: "r5", status: "watch", cat: "baseball", name: "Konnor Griffin 2026 Bowman Sapphire", set: "2026 Bowman Sapphire", grade: "Raw", target: 14, feedKey: "ebay:konnor-griffin-sapphire", prices: hist([15.5, 15.99, 16.99]) },
    { id: "r6", status: "watch", cat: "pokemon", name: "Mega Darkrai ex SIR #116/084", set: "Pitch Black", grade: "Raw", target: 200, notes: "wait for the SIR to settle", prices: [] },
  ] },
  corrupt: { demo: false, cards: "not-an-array" },
};

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("  FAIL " + msg); } };
const clone = (x) => JSON.parse(JSON.stringify(x));
/* every key present on the v1 object must be present and deep-equal after migration */
const subsetEqual = (before, after, where) => { for (const k of Object.keys(before)) { checks++; try { assert.deepEqual(after[k], before[k]); } catch (e) { fails++; console.log(`  FAIL ${where}.${k} changed: ${JSON.stringify(before[k])} → ${JSON.stringify(after[k])}`); } } };

for (const [name, fx] of Object.entries(fixtures)) {
  console.log(`fixture: ${name}`);
  const before = clone(fx), state = clone(fx);
  const r = V.migrate(state);
  if (name === "corrupt") {
    ok(r.ok === false, "corrupt store must fail open (ok:false)");
    ok(JSON.stringify(state) === JSON.stringify(before), "corrupt store must be untouched");
    continue;
  }
  ok(r.ok === true, "migrate ok");
  ok(r.changed === true, "first run reports changed");
  ok(Array.isArray(state.lists) && state.lists[0] && state.lists[0].id === "default" && state.lists[0].name === "My cards", "lists carries the fixed default first");
  ok(state.cards.length === before.cards.length, `card count ${before.cards.length} preserved`);
  before.cards.forEach((c, i) => {
    subsetEqual(c, state.cards[i], `${name}.cards[${i}]`);
    ok(c.status !== "own" || state.cards[i].listId === "default", `own card ${c.id} gets listId 'default'`);
    ok(c.status !== "watch" || !("listId" in state.cards[i]), `watch card ${c.id} gains no listId`);
  });
  ok(state.demo === before.demo, "demo flag preserved");
  /* idempotent */
  const snap = JSON.stringify(state);
  const r2 = V.migrate(state);
  ok(r2.ok && r2.changed === false, "re-run reports no change");
  ok(JSON.stringify(state) === snap, "re-run leaves the store byte-identical");
  /* list ops never drop cards */
  if (name === "real") {
    const id = V.addList(state, "Kids' Box");
    ok(!!id && state.lists.length === 2, "addList adds one list");
    ok(V.addList(state, "kids' box") === id, "addList dedupes by name (case-insensitive)");
    state.cards[1].listId = id; state.cards[3].listId = id;
    ok(V.ownIn(state, id).length === 2 && V.ownIn(state, "default").length === 2 && V.ownIn(state, "all").length === 4, "ownIn partitions the own cards");
    ok(V.renameList(state, id, "Kids") && V.listName(state, id) === "Kids", "renameList");
    ok(V.removeList(state, id) && state.cards.every((c) => c.status !== "own" || c.listId === "default"), "removeList moves cards to My cards");
    ok(!V.removeList(state, "default") && state.lists.length === 1, "default cannot be removed");
    ok(state.cards.length === before.cards.length, "no card lost through list ops");
    before.cards.forEach((c, i) => subsetEqual(c, state.cards[i], `${name}.after-ops.cards[${i}]`));
    /* unknown listId on a card (e.g. a mirror written by a newer page) → default, nothing else touched */
    state.cards[0].listId = "ghost"; const r3 = V.migrate(state);
    ok(r3.changed && state.cards[0].listId === "default", "unknown listId falls back to default");
    const sm = V.summary(V.ownIn(state, "all"));
    ok(sm.n === 4 && Math.abs(sm.val - (165 * 2 + 187 + 1358.59 + 70 * 3)) < 1e-6, "summary value = Σ last × qty");
    ok(sm.chgp != null, "5D change computes from the 5th-previous point (or the first)");
    ok(/data-pf="default"/.test(V.railRows(state, {})) && /Hunting/.test(V.railRows(state, {})), "railRows renders lists + Hunting");
  }
}
console.log(`\n${checks} checks · ${fails} failed`);
process.exit(fails ? 1 : 0);
