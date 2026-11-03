#!/usr/bin/env node
// move-guard.test.mjs — both-way tests for the move-confirmation guard (tools/lib/move-guard.mjs, Nov 3 2026).
// Run: node tools/qa/move-guard.test.mjs   (exit 1 on any miss). Cases are the live shapes from Pokémon KB P14 / P40 / P41
// plus the clean cases the guard must let through. Synthetic inputs — nothing here is published.
import { guardMove, holdIfUnconfirmed } from "../lib/move-guard.mjs";

let fail = 0;
const t = (name, got, want) => { const ok = got === want; if (!ok) fail++; console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` — got ${got}, want ${want}`}`); };
const H = (o) => guardMove({ bv: 16000, ...o }).hold;

// held
t("BS1E Mewtwo #10 $372.50 → $800, n 11, PriceCharting $403 (P41)", H({ prior: 372.5, proposed: 800, n: 11, pc: 403.22, unl: 33.62 }), true);
t("SK03 Charizard #146 $9,650 → $34,100 on 1 sale (P14)", H({ prior: 9650, proposed: 34100, n: 1, pc: null }), true);
t("ND1E Shining Charizard #107 $2,987.50 → $1,600 on 1 sale (P40)", H({ prior: 2987.5, proposed: 1600, n: 1, pc: null, unl: 1482.99 }), true);
t("ND1E #107 → $1,600 also leaves the 1.2–30× edition band (1.08× Unlimited)", guardMove({ prior: 2987.5, proposed: 1600, n: 9, pc: null, unl: 1482.99, bv: 16000 }).why.some((w) => /1st Edition/.test(w)), true);
t("edition band alone: $500 → $400 at 1.08× Unlimited $370, n 3", H({ prior: 500, proposed: 400, n: 3, pc: null, unl: 370 }), true);
t("deep but off PriceCharting: n 40, $100 → $200, PC $110", H({ prior: 100, proposed: 200, n: 40, pc: 110 }), true);
t("second read too far from the held proposal (800 held, 1,000 now)", H({ prior: 372.5, proposed: 1000, n: 4, pc: 403.22, held: { proposed: 800, since: "2026-11-02" } }), true);
// released
t("second read within 20% of the held proposal (800 held, 760 now)", H({ prior: 372.5, proposed: 760, n: 4, pc: 403.22, held: { proposed: 800, since: "2026-11-02" } }), false);
t("depth + PriceCharting agree: n 8, $110 → $185, PC $133 (SK03 Forretress)", H({ prior: 110.52, proposed: 184.59, n: 8, pc: 133.26 }), false);
t("depth, no PriceCharting figure: n 12 (Bowman)", H({ prior: 50, proposed: 90, n: 12, pc: null }), false);
t("a 49% move is not held", H({ prior: 100, proposed: 149, n: 1, pc: null }), false);
t("immaterial: a 40¢ common tripling in a $16,000 basket", H({ prior: 0.4, proposed: 1.32, n: 2, pc: 0.7 }), false);
t("material by impact: $4 → $9 in a $1,000 basket (0.5%)", guardMove({ prior: 4, proposed: 9, n: 2, pc: null, bv: 1000 }).hold, true);
t("first mark / entrant (no prior) is never held", H({ prior: null, proposed: 800, n: 1 }), false);
t("prior already outside the edition band: not frozen by the band", H({ prior: 400, proposed: 420, n: 3, pc: null, unl: 380 }), false);

// row mechanics
const row = { num: "10", name: "Mewtwo", path: "x/mewtwo-10", price: 372.5, asOf: "2026-10-26", prevPrice: 400, prevAsOf: "2026-10-22", n30: 9 };
const ctx = { root: "/nonexistent", idx: {}, ticker: "BS1E", today: "2026-11-02", window: 90, bv: 16000 };
t("holdIfUnconfirmed returns true on a held move", holdIfUnconfirmed(row, { price: 800, win: 90, n: 3 }, ctx), true);
t("held row keeps the prior price", row.price, 372.5);
t("held row: prevPrice = prior (no reader sees a move)", row.prevPrice, 372.5);
t("held row carries heldMove.proposed", row.heldMove && row.heldMove.proposed, 800);
t("held row is dated to this read", row.asOf, "2026-11-02");
t("second read within 20% releases the hold", holdIfUnconfirmed(row, { price: 790, win: 90, n: 5 }, { ...ctx, today: "2026-11-05" }), false);
t("released row drops heldMove", row.heldMove, undefined);

console.log(fail ? `\n${fail} FAILED` : "\nall passed");
process.exit(fail ? 1 : 0);
