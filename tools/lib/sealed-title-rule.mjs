// sealed-title-rule.mjs — O-67 (CoS, Nov 2026; Night Crew Nov 25): every sealed-product SOLD read we print must
// say, in its own data file, that a sale counted only when its listing title named the product AND (sports) the
// sport, or (Pokémon) the product's own set and no other set. A read without that rule is the Oct 20 hobby-box
// failure: a "Topps Chrome hobby box" median that could hold another sport's box or another product.
//
// The reads are taken by the lanes (Deal Hunter et al.) by hand from PriceCharting / SportsCardsPro, so the rule
// can only be checked where the read is declared: the data file's readRule / _comment and its read date. Each
// sealed builder calls requireSealedTitleRule() right after loading its file and refuses to build without it.
// It never edits a price; it only stops a build. `node tools/audit-sealed-reads.mjs` lists every file and page.
//
//   kind 'sport' — title must name the product and the sport (hobby/jumbo/blaster boxes, any sport)
//   kind 'set'   — Pokémon sealed: exact product page + title names its own set and no other
//   kind 'ref'   — the file's sealed rows come from another file's read (gift guide → sealed-prices.json)

import fs from 'node:fs';
import path from 'node:path';

// The read date from which each rule is on record (a read older than this predates the rule).
export const RULE_FROM = {
  sport: '2026-11-19', // data/boxes.json readRule: "Title must name the product and the sport" (Deal Hunter re-mark Nov 19)
  set: '2026-11-08',   // data/sealed-prices.json: "A sale also has to name its own set in the title and no other set" (Nov 8 read)
};

const sentences = (t) => String(t || '').split(/(?<=[.;])\s+/);
const has = (t, re) => sentences(t).some((s) => /title/i.test(s) && re.test(s));

export function checkSealedTitleRule(cfg, file, kind, opts = {}) {
  const text = [cfg.readRule, cfg._comment].filter(Boolean).join(' ');
  const readDay = typeof cfg.read === 'string' ? cfg.read : (cfg.read && cfg.read.sealed) || null;
  const out = { file, kind, read: readDay, ok: false, why: '' };
  if (kind === 'sport') {
    const product = has(text, /product/i), sport = has(text, /sport/i);
    out.ok = product && sport && !!readDay && readDay >= RULE_FROM.sport;
    out.why = out.ok ? 'title names product + sport' : !product || !sport ? 'read rule does not say the title must name ' + [!product && 'the product', !sport && 'the sport'].filter(Boolean).join(' and ') : 'read ' + readDay + ' predates the rule (' + RULE_FROM.sport + ')';
  } else if (kind === 'set') {
    const ownSet = has(text, /own set/i), exact = /exact (sealed )?(product|item)/i.test(text);
    out.ok = ownSet && exact && !!readDay && readDay >= RULE_FROM.set;
    out.why = out.ok ? 'exact product + title names its own set' : !ownSet || !exact ? 'read rule missing ' + [!exact && 'the exact-product page', !ownSet && 'the own-set title rule'].filter(Boolean).join(' and ') : 'read ' + readDay + ' predates the rule (' + RULE_FROM.set + ')';
  } else if (kind === 'ref') {
    const ref = JSON.parse(fs.readFileSync(path.join(opts.repo, opts.ref), 'utf8'));
    const r = checkSealedTitleRule(ref, opts.ref, 'set');
    const names = new RegExp(opts.ref.replace(/^data\//, '').replace(/[.]/g, '\\.'), 'i').test(text) && /title rules/i.test(text);
    out.ok = r.ok && names && !!readDay && readDay >= RULE_FROM.set;
    out.why = out.ok ? 'sealed rows from ' + opts.ref + ' (' + r.why + ')' : !names ? 'does not name the read it takes its sealed rows from' : !r.ok ? opts.ref + ': ' + r.why : 'sealed read ' + readDay + ' predates the rule';
  } else throw new Error('unknown kind ' + kind);
  return out;
}

export function requireSealedTitleRule(cfg, file, kind, opts = {}) {
  const r = checkSealedTitleRule(cfg, file, kind, opts);
  if (!r.ok) throw new Error(`O-67 title rule: ${file} — ${r.why}. Re-read the sealed rows with the title rule (product + ${kind === 'sport' ? 'sport' : 'own set'}) and say so in the file's read rule before building.`);
  return r;
}
