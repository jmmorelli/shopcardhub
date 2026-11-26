#!/usr/bin/env node
// build-ai-strip.mjs — "The number you asked about" strip for visitors who arrive from an AI assistant
// (Q-051, Build Loop, Nov 26 2026; BET-20261126-1, CEO Desk, CoS-approved).
//
// Why: AI-assistant arrivals (chatgpt.com, meta.ai …) already got an answer in the chat and land for the proof and the
// link; today they land on pages laid out for searchers. The bet: the page's own dated number plus one eBay button
// under the H1 gets more clicks from them. Everyone else sees the page unchanged.
//
// What it owns: one block per page, <!-- AISTRIP:START … --> … <!-- AISTRIP:END -->, holding
//   · an empty slot (zero height, nothing for anyone who is not an AI arrival),
//   · a <template> with the strip (not in the DOM, no link counted, until it is cloned),
//   · a tiny inline script that clones it into the slot during parse (before the content under it is painted, so
//     no layout shift) only when utm_source contains chatgpt.com / perplexity / copilot / gemini / meta.ai, or the
//     referrer host is chatgpt.com / perplexity.ai / copilot.microsoft.com / gemini.google.com / meta.ai (or a
//     subdomain, e.g. l.meta.ai), and fires GA4 ai_strip_view {page}; the button fires ai_strip_click {page}.
// No figure is typed here. The figure line is the first sentence with a "$" in the page's own lead element, copied
// verbatim from the page HTML (entities decoded). At DOMContentLoaded the script re-reads the same element and, if the
// page has since been re-baked, swaps in the sentence the page now prints (or drops the line if none). A page with no
// printed lead figure (/indices) gets the button and the page's existing date line (#asof, once its JS fills it).
// The button is the page's own buy-strip button (a.bs-go): same eBay search, same EPN format, customid swapped to
// ai-strip-<page slug>.
//
// Placement: right after the page's </h1>. A sector index page (h1 inside its <TICKER>:START block) is placed by
// tools/build-sector-index.mjs --bake, which cuts the AISTRIP block from wherever it sits and pastes it under the
// title (SIDX:AISTRIP slot); this tool puts it just before the ticker block on the first run and says so.
//
// Pages: the top 5 landing pages of aiLanding28 in the GA4 snapshot of 2026-11-26T18:42Z (price-data branch,
// data/ga4-latest.json), in the field's order: McDonald's 51, /indices 9, /bowman-chrome-2026-index 8,
// /pokemon-booster-box-prices 7, /pokemon-delta-reign-2026 5 sessions (28 d).
//
// Usage: node tools/build-ai-strip.mjs [--check]   (--check: exit 1 if any page would change; writes nothing)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// lead: browser selector + the same element as a regex over the HTML (inner HTML in group 1); drop: classes of spans
// left out of the sentence (the plain read's verdict word and its sub-note). date: selector of the existing date line.
const PAGES = [
  { file: "mcdonalds-pokemon-cards-2026.html", lead: { sel: ".hero-sub", re: /<p class="hero-sub">([\s\S]*?)<\/p>/ } },
  { file: "indices.html", date: "#asof" },
  { file: "bowman-chrome-2026-index.html", ticker: "BCB26", lead: { sel: '.pr[data-pr="read"] p', re: /data-pr="read"[^>]*><p>([\s\S]*?)<\/p>/, drop: ["pr-v", "pr-sub"] } },
  { file: "pokemon-booster-box-prices.html", lead: { sel: ".sp-answer", re: /<p class="q-answer sp-answer">([\s\S]*?)<\/p>/ } },
  { file: "pokemon-delta-reign-2026.html", lead: { sel: ".hero-sub", re: /<p class="hero-sub">([\s\S]*?)<\/p>/ } },
];

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", eacute: "é", middot: "·", rarr: "→", larr: "←", mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", times: "×", rsaquo: "›", lsaquo: "‹", deg: "°" };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    if (!(e in ENT)) throw new Error(`unknown entity ${m}`);
    return ENT[e];
  });
}
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => escHtml(s).replace(/"/g, "&quot;");
// Same rule as the browser side (PICK below): collapse whitespace, split after . ! ? followed by a space, first with "$".
const pick = (txt) => txt.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).find((x) => x.includes("$")) || "";

function leadSentence(html, lead) {
  const m = html.match(lead.re);
  if (!m) return "";
  let inner = m[1];
  for (const c of lead.drop || []) inner = inner.replace(new RegExp(`<span class="${c}[^"]*">[\\s\\S]*?</span>`, "g"), "");
  return pick(decode(inner.replace(/<[^>]+>/g, "")));
}

function button(html, slug) {
  const m = html.match(/<a class="bs-go" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
  if (!m) return null;
  if (!/customid=[^&"]+/.test(m[1])) return null;
  const href = m[1].replace(/customid=[^&"]+/, "customid=ai-strip-" + slug);
  return { href, label: m[2].replace(/<[^>]+>/g, "").trim() };
}

const CSS = `<style>.aistrip{max-width:760px;margin:16px 0 4px;padding:14px 16px;border-radius:14px;background:var(--ds-surface-1,#161617);font:400 15px/1.45 var(--ds-font,system-ui,sans-serif);color:var(--text,#d2d2d7);text-align:left}.aistrip .ais-k{display:block;font-size:12px;font-weight:600;line-height:1.33;color:var(--text-dim,#a1a1a6);margin:0 0 4px}.aistrip .ais-f{margin:0;color:var(--text-head,#f5f5f7)}.aistrip .ais-d{margin:0;min-height:2.7em;font-size:12px;line-height:1.35;color:var(--text-dim,#a1a1a6)}.aistrip .ais-go{display:inline-flex;align-items:center;min-height:44px;margin-top:10px;padding:8px 20px;line-height:1.25;border-radius:980px;background:var(--accent,#00ccf5);color:#000!important;font-size:14px;font-weight:600;text-decoration:none}.aistrip .ais-go:hover{background:#5cdcf8}</style>`;

// Inline runtime: one copy per page, ~1 KB. PICK must match pick() above.
const JS = `(function(){try{var q=(new URLSearchParams(location.search).get('utm_source')||''),r='';try{r=document.referrer?new URL(document.referrer).hostname:''}catch(e){}var H=['chatgpt.com','perplexity.ai','copilot.microsoft.com','gemini.google.com','meta.ai'];if(!(/chatgpt\\.com|perplexity|copilot|gemini|meta\\.ai/i.test(q)||H.some(function(h){return r===h||r.slice(-h.length-1)==='.'+h})))return;var s=document.getElementById('aistrip'),t=document.getElementById('aistrip-t');if(!s||!t)return;s.appendChild(t.content.cloneNode(true));if(typeof gtag==='function')gtag('event','ai_strip_view',{page:location.pathname});var f=s.querySelector('[data-ais-src]'),d=s.querySelector('[data-ais-date]');document.addEventListener('DOMContentLoaded',function(){if(f){var el=document.querySelector(f.getAttribute('data-ais-src'));var c=el?el.cloneNode(true):null;if(c){(f.getAttribute('data-ais-drop')||'').split(' ').forEach(function(k){if(k)[].forEach.call(c.querySelectorAll('.'+k),function(n){n.remove()})})}var x=c?(c.textContent.replace(/\\s+/g,' ').trim().split(/(?<=[.!?])\\s+/).filter(function(y){return y.indexOf('$')>-1})[0]||''):'';if(!x){f.parentNode.removeChild(f);var k=s.querySelector('.ais-k');if(k)k.parentNode.removeChild(k)}else if(x!==f.textContent)f.textContent=x}if(d){var src=document.querySelector(d.getAttribute('data-ais-date'));var cp=function(){var v=src?src.textContent.trim():'';if(v&&!/loading/i.test(v))d.textContent=v};cp();if(src)new MutationObserver(cp).observe(src,{childList:true,characterData:true,subtree:true})}})}catch(e){}})();`;

function block(p, html) {
  const slug = p.file.replace(/\.html$/, "");
  const b = button(html, slug);
  if (!b) throw new Error(`${p.file}: no buy-strip button (a.bs-go with a customid) to reuse`);
  const fig = p.lead ? leadSentence(html, p.lead) : "";
  const parts = [];
  if (fig) {
    parts.push(`<span class="ais-k">The number you asked about:</span>`);
    parts.push(`<p class="ais-f" data-ais-src="${escAttr(p.lead.sel)}"${p.lead.drop ? ` data-ais-drop="${p.lead.drop.join(" ")}"` : ""}>${escHtml(fig)}</p>`);
  } else if (p.date) {
    parts.push(`<p class="ais-d" data-ais-date="${escAttr(p.date)}"></p>`);
  }
  parts.push(`<a class="ais-go" href="${b.href}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','ai_strip_click',{page:location.pathname})">${b.label}</a>`);
  return `<!-- AISTRIP:START — "the number you asked about" strip for AI-assistant arrivals only (Q-051, BET-20261126-1). Generated by tools/build-ai-strip.mjs. Do not hand-edit. -->
<div id="aistrip"></div><template id="aistrip-t">${CSS}<div class="aistrip" role="note">${parts.join("")}</div></template><script>${JS}</script>
<!-- AISTRIP:END -->`;
}

const RE = /<!-- AISTRIP:START[\s\S]*?<!-- AISTRIP:END -->/;
const changed = [], same = [], notes = [];
for (const p of PAGES) {
  const file = path.join(REPO, p.file);
  const html = fs.readFileSync(file, "utf8");
  const body = block(p, html);
  let out;
  if (RE.test(html)) out = html.replace(RE, () => body);
  else if (p.ticker) {
    const S = `<!-- ${p.ticker}:START -->`;
    if (!html.includes(S)) throw new Error(`${p.file}: no ${S}`);
    out = html.replace(S, () => body + "\n" + S);
    notes.push(`${p.file}: first placement before ${S}; run node tools/build-sector-index.mjs --ticker ${p.ticker} --bake to move it under the title`);
  } else {
    const i = html.indexOf("</h1>");
    if (i < 0) throw new Error(`${p.file}: no </h1>`);
    const before = html.slice(0, i);
    const open = [...before.matchAll(/<!--\s*([A-Z0-9:_-]+):START/g)].map((m) => m[1]).filter((n) => !before.includes(`<!-- ${n}:END`) && !before.includes(`${n}:END -->`));
    if (open.length) throw new Error(`${p.file}: </h1> sits inside generated block ${open.join(",")}`);
    out = html.slice(0, i + 5) + "\n" + body + html.slice(i + 5);
  }
  if (out === html) { same.push(p.file); continue; }
  changed.push(p.file);
  if (!CHECK) fs.writeFileSync(file, out);
}
for (const n of notes) console.log(n);
console.log(`ai-strip: ${changed.length} page(s) ${CHECK ? "would change" : "written"}${changed.length ? ": " + changed.join(", ") : ""} · ${same.length} unchanged`);
if (CHECK && changed.length) process.exit(1);
