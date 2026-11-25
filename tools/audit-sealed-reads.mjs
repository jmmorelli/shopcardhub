#!/usr/bin/env node
// audit-sealed-reads.mjs — O-67 (Night Crew Nov 25, 2026). Lists every published sealed-product SOLD read and whether
// it carries the title rule (sports: the title names the product and the sport; Pokémon: the exact product page and a
// title that names its own set and no other). Read-only: prints a table, writes nothing.
//
// Part 1: the generated sealed tables (each builder also refuses to build without the rule — tools/lib/sealed-title-rule.mjs).
// Part 2: hand-written pages that print a sports box median outside those files (league guides, set guides). Their read
//         rule lives in the page or its league manifest, not in a data file, so they are listed for their owner to
//         confirm or re-read; this tool cannot pass them.
//
// Usage: node tools/audit-sealed-reads.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSealedTitleRule } from './lib/sealed-title-rule.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (f) => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8'));

const FILES = [
  ['data/boxes.json', 'sport', '/best-hobby-boxes-2026'],
  ['data/sealed-prices.json', 'set', '/pokemon-booster-box-prices'],
  ['data/black-friday.json', 'set', '/pokemon-black-friday-2026'],
  ['data/gift-guide.json', 'ref', '/pokemon-card-gift-guide-2026'],
  ['data/stocking-stuffers.json', 'set', '/pokemon-stocking-stuffers-under-25'],
  ...fs.readdirSync(path.join(REPO, 'data/vs')).filter((f) => f.endsWith('.json')).map((f) => ['data/vs/' + f, 'set', '/' + f.replace(/\.json$/, '')]),
];
const generated = FILES.map(([f, kind, page]) => ({ page, ...checkSealedTitleRule(J(f), f, kind, { repo: REPO, ref: 'data/sealed-prices.json' }) }));
const built = new Set(FILES.map(([, , p]) => p.slice(1) + '.html'));

// Part 2: a sports box median printed by hand.
const BOX = /(hobby|jumbo|mega|blaster|value) box(es)?[^<.]{0,160}?(median|sold for)[^<.]{0,80}?\$\s?[\d,]+(\.\d\d)?|(hobby|jumbo|mega) box[^<]{0,120}?\$\s?[\d,]+(\.\d\d)? (sold )?median/i;
const SPORT_PAGE = /topps|bowman|panini|donruss|prizm|football|basketball|baseball|hockey|formula-1|nfl|nba|mlb|wnba|soccer/i;
const hand = [];
for (const f of fs.readdirSync(REPO).filter((x) => x.endsWith('.html') && !built.has(x) && SPORT_PAGE.test(x))) {
  const html = fs.readFileSync(path.join(REPO, f), 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&ndash;|&mdash;/g, '-').replace(/&nbsp;|\s+/g, ' ');
  const m = text.match(BOX);
  if (!m) continue;
  const slug = f.replace(/\.html$/, '');
  const man = fs.existsSync(path.join(REPO, 'tools/league/manifests', slug + '.json')) ? J('tools/league/manifests/' + slug + '.json') : null;
  const blob = man ? JSON.stringify(man) : text;
  const sport = /title[^."]{0,120}(names?|says?)[^."]{0,60}sport|sport[^."]{0,40}in the title/i.test(blob);
  hand.push({ page: '/' + slug, owner: man ? 'Growth League (' + (man.owner || man.agent || 'manifest') + ')' : 'page owner', says: m[0].trim().slice(0, 140), sportRuleStated: sport });
}

if (process.argv.includes('--json')) { console.log(JSON.stringify({ generated, hand }, null, 2)); process.exit(0); }
console.log('Sealed sold reads — O-67 title rule\n\nGenerated tables (builder refuses without the rule):');
for (const r of generated) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.page.padEnd(38)} ${r.file.padEnd(36)} read ${r.read || '?'} · ${r.why}`);
console.log(`\nHand-written sports pages printing a box median (${hand.length}) — owner confirms or re-reads with the rule:`);
for (const h of hand) console.log(`  ${h.sportRuleStated ? 'stated' : 'NOT STATED'}  ${h.page.padEnd(40)} ${h.owner} · "${h.says}"`);
const bad = generated.filter((r) => !r.ok).length;
console.log(`\n${generated.length - bad}/${generated.length} generated reads carry the rule · ${hand.filter((h) => !h.sportRuleStated).length} hand pages without a stated sport rule`);
process.exit(bad ? 1 : 0);
