#!/usr/bin/env node
// reprint-filter.test.mjs — self-test for tools/lib/reprint-filter.mjs (Oct 14 2026). Run: node tools/qa/reprint-filter.test.mjs
// Fixture titles are shaped on the PriceCharting sold rows read Oct 14 2026 (Aquapolis Lugia #149, Team Up Pikachu & Zekrom
// GX #33, Neo Genesis Sneasel #25, Neo Destiny Shining Celebi #106, Base Set Charizard #4 / Pikachu #58). Both ways: every
// reprint title must drop, every original title must stay — including 1st Edition, Unlimited, Holo, Shadowless, PSA 9.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isReprintTitle, inReprintScope, reprintFloor } from "../lib/reprint-filter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let fail = 0, n = 0;
const ok = (cond, msg) => { n++; if (!cond) { fail++; console.log("FAIL " + msg); } };

const LUGIA = "pokemon-aquapolis/lugia-149", PZ = "pokemon-team-up/pikachu-&-zekrom-gx-33", SNEASEL = "pokemon-neo-genesis/sneasel-25",
  CELEBI = "pokemon-neo-destiny/shining-celebi-106", ZARD = "pokemon-base-set/charizard-4", PIKA = "pokemon-base-set/pikachu-58",
  ZARD1E = "pokemon-base-set/charizard-1st-edition-4", TU_GOLD = "pokemon-team-up/pikachu-&-zekrom-gx-184";

const REPRINT = [
  [LUGIA, "✨️Pokemon 30th Anniversary Aquapolis Lugia 149/147 Holo Rare✨️ 149/147"],
  [LUGIA, "Pokemon TCG Lugia 149/147 30th Celebrations NM 149/147"],
  [LUGIA, "Pokemon TCG 30th Lugia 149/147 Aquapolis Secret Rare Crystal Type Holo 80 HP 149/147"],
  [LUGIA, "Lugia 149/147 Aquapolis Holo 30th Anniversary Pokemon Card Classic Collection 149/147"],
  [LUGIA, "The Pokémon Company Aquapolis Lugia 149/147 Secret Rare Holo Crystal 30th Celebr 149/147"],
  [LUGIA, "Pokémon Lugia 149/147 Aquapolis Crystal Type Holo Secret Rare 30th ANNIVERSARY 149/147"],
  [LUGIA, "Pokémon Crystal Lugia 149/147 Secret Rare – Aquapolis – 30th Anniversary Stamp 149/147"],
  [LUGIA, "Lugia 149/147 Aquapolis Gold Border Classic Collection"],
  [PZ, "2026 Pokemon 30th Anniversary Pikachu &amp; Zekrom GX 33/181 Sm-Team Up Holo 33/181"],
  [PZ, "Pokemon 30th Anniversary Collection Pikachu &amp; Zekrom GX 33/181 Sm-Team Up Holo 33/181"],
  [PZ, "Pokemon Pikachu &amp; Zekrom 30TH ANNIVERSARY GX 33/181 SM-Team Up TAG TEAM GX 2026 33/181"],
  [PZ, "Pikachu & Zekrom GX 33/181 Team Up Reprint Gold Stamp"],
  [PZ, "Pikachu & Zekrom GX 33/181 Gold-Bordered Classic"],
  [SNEASEL, "30th Anniversary Pokemon TCG Sneasel Neo Genesis Holo Rare 25/111 English 60 HP 25/111"],
  [SNEASEL, "Nintendo Sneasel 25/111 Neo Genesis Holo Promo Pokémon TCG English 60HP 2000 25/111"],
  [SNEASEL, "Pokemon Nintendo Sneasel Neo Genesis 25/111 Holo Rare English 2000 60 HP 25/111"],
  [SNEASEL, "Pokemon TCG Sneasel 25/111 Neo Genesis Gold Border Holo Rare 30th Pikachu Stamp 25/111"],
  [CELEBI, "Pokémon TCG Shining Celebi Neo Destiny 106/105 Holo Rare Eng 30th Anniversary 106/105"],
  [CELEBI, "Shining Celebi 106/105 - 2026 Pokemon 30th Anniversary / In-Hand / NM 106/105"],
  [ZARD, "Charizard 4/102 Celebrations Classic Collection Holo NM"],
  [ZARD, "Pokemon Charizard 4/102 Base Set 25th Anniversary Celebrations reprint"],
  [ZARD1E, "Charizard 4/102 Base Set 1st Edition 30th Celebration reprint"],
  [PIKA, "Pikachu 58/102 Base Set Holo Classic"],
];
const ORIGINAL = [
  [LUGIA, "Pokemon TCG Lugia Aquapolis 149/147 Secret Rare Holo English 80 HP 149/147"],
  [LUGIA, "2002 Lugia 149/147 Secret Rare Holo #149 Near Mint English"],
  [LUGIA, "Lugia Crystal w/ Photo #149 Near Mint English"],
  [LUGIA, "Aquapolis Crystal Lugia 149/147 PSA 9 WOTC 2003"],
  [LUGIA, "Crystal Lugia 149/147 Aquapolis ORIGINAL not a reprint, not 30th Celebration"],
  [PZ, "Pokemon TCG Pikachu &amp; Zekrom GX 33/181 SM Team Up TAG TEAM Holo English MP 33/181"],
  [PZ, "Pikachu &amp; Zekrom GX #33 Near Mint English"],
  [PZ, "Pikachu & Zekrom GX 33/181 Team Up 2019 Full Art Holo"],
  [TU_GOLD, "Pikachu & Zekrom GX 184/181 Gold Secret Rare Team Up"],
  [SNEASEL, "Sneasel 25/111 Rare Neo Genesis Pokemon Unlimited Moderately Played 25/111"],
  [SNEASEL, "2000 Sneasel Neo Genesis Pokemon Unlimited 25/111 Non-Holo NM/LP 25/111"],
  [SNEASEL, "Sneasel Neo Genesis 25/111 1st Edition Non Holo Rare"],
  [CELEBI, "2000 Pokemon Neo Destiny 106/105 Shining Celebi Holo Shining Holo Wotc LP&#43; 106/105"],
  [CELEBI, "Shining Celebi Neo Destiny Unlimited Holo Pokemon 106/105 NM 106/105"],
  [ZARD, "1999 Pokemon Base Set Charizard 4/102 Holo Rare Heavily Played Unlimited 4/102"],
  [ZARD, "Pokemon Card - Charizard 4/102 Base Set Holo w/ shadow 4/102"],
  [ZARD, "Charizard 4/102 Base Set Unlimited Holo PSA 9 MINT"],
  [ZARD1E, "1999 Pokemon Base Set 1st Edition Charizard 4/102 Holo Shadowless"],
  [ZARD, "Charizard 4/102 Base Set Holo - original WOTC, no reprints"],
  [PIKA, "Pikachu 58/102 Common (Non-Holo) Unlimited Base Set Pokemon LP"],
  [PIKA, "Vintage Pikachu 58/102 Yellow Cheeks Base Set Unlimited WOTC 1999 NM Pokémon TCG 58/102"],
  ["pokemon-neo-revelation/celebi-3", "Celebi 3/64 Neo Revelation Holo"],
  ["pokemon-team-up/nita-180", "2026 Pokemon Nita 180/181 Team Up Sun &amp; Moon Full Art Ultra Rare Card NM"],
  ["pokemon-base-set/blastoise-2", "Blastoise 2/102 Base Set Unlimited Holo listed 2026"],
];
for (const [p, t] of REPRINT) ok(isReprintTitle(t, p) === true, `reprint kept: [${p}] ${t}`);
for (const [p, t] of ORIGINAL) ok(isReprintTitle(t, p) === false, `original dropped: [${p}] ${t}`);

// scope: the reprint consoles themselves and modern sets are never filtered
ok(!inReprintScope("pokemon-30th-celebration/lugia-149"), "30th console in scope");
ok(!inReprintScope("pokemon-celebrations/charizard-4"), "Celebrations console in scope");
ok(!inReprintScope("pokemon-evolving-skies/umbreon-vmax-215"), "EVS in scope");
ok(isReprintTitle("Lugia 149 30th Celebration", "pokemon-30th-celebration/lugia-149") === false, "30th page row filtered");
for (const s of ["base-set", "jungle", "fossil", "team-rocket", "neo-genesis", "neo-discovery", "neo-revelation", "neo-destiny", "aquapolis", "skyridge", "team-up"])
  ok(inReprintScope(`pokemon-${s}/x-1`), `${s} not in scope`);

// combined with the tool's TITLE_BAD (read from the source, so the test follows the live regex): a clean original stays clean
const src = fs.readFileSync(path.join(ROOT, "tools/build-sector-index.mjs"), "utf8");
const m = src.match(/^const TITLE_BAD = \/(.*)\/i;$/m);
ok(!!m, "TITLE_BAD not found in build-sector-index.mjs");
const TITLE_BAD = new RegExp(m[1], "i");
const clean = (t, p) => !TITLE_BAD.test(t) && !isReprintTitle(t, p);
ok(clean("1999 Pokemon Base Set Charizard 4/102 Holo Rare Heavily Played Unlimited 4/102", ZARD), "combined: Unlimited Charizard dropped");
ok(clean("Pokemon TCG Lugia Aquapolis 149/147 Secret Rare Holo English 80 HP 149/147", LUGIA), "combined: Lugia original dropped");
ok(!clean("Pokemon 30th Anniversary Pikachu & Zekrom GX 33/181 Sm-Team Up Holo", PZ), "combined: P&Z reprint kept");

// price-band guard
ok(reprintFloor(3176.86, 230) === 575, "floor Lugia");
ok(reprintFloor(375, 30.93) === 77.33, "floor Celebi");
ok(reprintFloor(399.99, 179.53) === null, "floor Charizard should be off (bands overlap)");
ok(reprintFloor(31.49, 30.5) === null, "floor P&Z should be off");
ok(reprintFloor(3.99, 26.99) === null, "floor Pikachu should be off");
ok(reprintFloor(null, 230) === null && reprintFloor(3000, null) === null, "floor with a missing mark");

console.log(`reprint-filter self-test: ${n - fail}/${n} pass${fail ? ` · ${fail} FAIL` : ""}`);
process.exit(fail ? 1 : 0);
