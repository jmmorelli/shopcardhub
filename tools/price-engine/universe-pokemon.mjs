#!/usr/bin/env node
// universe-pokemon.mjs — resolve Pokémon cards to PriceCharting item paths for data/price-universe.json.
// Sources: every basket card of the live Pokémon set indices (data/indices.json) + any COMC-style
// strings passed with --comc <file.json>. Resolution is by the set's console listing (card number +
// name tokens, never a reverse holo unless asked) — no guessing of URL slugs.
// Usage: node tools/price-engine/universe-pokemon.mjs [--comc names.json] > /tmp/poke-universe.json
import fs from 'node:fs';
import { consoleCards } from './pc-console.mjs';
const args = process.argv.slice(2), opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SETS = { PB26: ['pokemon-pitch-black', 'Pitch Black'], CR26: ['pokemon-chaos-rising', 'Chaos Rising'], AH26: ['pokemon-ascended-heroes', 'Ascended Heroes'], PRIS25: ['pokemon-prismatic-evolutions', 'Prismatic Evolutions'], DR25: ['pokemon-destined-rivals', 'Destined Rivals'], PF25: ['pokemon-phantasmal-flames', 'Phantasmal Flames'] };
const COMC_SET = [[/ascended heroes/i, 'AH26'], [/chaos rising/i, 'CR26'], [/pitch black/i, 'PB26'], [/destined rivals/i, 'DR25'], [/prismatic/i, 'PRIS25'], [/phantasmal/i, 'PF25'], [/generations/i, 'pokemon-generations'], [/scarlet & violet - 151|\b151\b/i, 'pokemon-scarlet-&-violet-151']];
const norm = s => (s || '').toLowerCase().replace(/&#39;|'/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
const cache = {};
async function listing(slug) { if (!cache[slug]) { cache[slug] = await consoleCards(slug); await new Promise(r => setTimeout(r, 1200)); } return cache[slug]; }
function pick(cards, num, name) {
  const n = String(num).replace(/^0+/, ''), nt = norm(name).filter(t => t !== 'ex' || true);
  const hits = cards.filter(c => { const m = c.title.match(/#([A-Za-z0-9]+)\s*$/); return m && m[1].replace(/^0+/, '') === n && !/\[/.test(c.title) && nt.every(t => norm(c.title).includes(t)); });
  return hits.length === 1 ? hits[0] : null;
}
const idx = JSON.parse(fs.readFileSync('data/indices.json', 'utf8'));
const out = [], miss = [];
for (const [tk, [slug, setName]] of Object.entries(SETS)) {
  const b = (idx[tk] && idx[tk].basket) || [];
  const cards = await listing(slug);
  for (const r of b) {
    const hit = pick(cards, r.num, r.name);
    if (hit) out.push({ key: 'idx:' + tk + ':' + r.num, label: `${r.name} #${r.num} — ${setName}`, name: `#${r.num} ${r.name}`, set: setName, path: hit.path, cond: 'Raw', src: 'index:' + tk });
    else miss.push(tk + ' #' + r.num + ' ' + r.name);
  }
}
const comcFile = opt('--comc', null);
if (comcFile) for (const s of JSON.parse(fs.readFileSync(comcFile, 'utf8'))) {
  const set = COMC_SET.find(([re]) => re.test(s)); if (!set) { miss.push('comc(no set): ' + s); continue; }
  const slug = SETS[set[1]] ? SETS[set[1]][0] : set[1];
  const m = s.match(/#(\d+)(?:\.\d+)?\s+(?:[^-]*? - )?(.+?)\s*\[(?:Near Mint|PSA|SGC|CGC)/i) || s.match(/#(\d+)(?:\.\d+)?\s+(?:[^-]*? - )?(.+?)$/);
  if (!m) { miss.push('comc(parse): ' + s); continue; }
  const grade = (s.match(/\[(PSA|SGC|CGC|BGS)\s*([\d.]+)/i) || []);
  const hit = pick(await listing(slug), m[1], m[2].replace(/\(.*?\)/g, ''));
  if (hit) out.push({ key: 'comc:' + hit.path, label: s.replace(/\s*\[Near Mint\]/, ''), comc: s.toLowerCase(), path: hit.path, cond: grade[1] ? grade[1].toUpperCase() + ' ' + grade[2] : 'Raw', src: 'inventory' });
  else miss.push('comc: ' + s);
}
console.error('resolved', out.length, 'missed', miss.length); miss.forEach(x => console.error('  miss', x));
process.stdout.write(JSON.stringify(out, null, 1));
