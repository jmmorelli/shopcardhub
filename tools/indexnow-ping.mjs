// IndexNow ping — tells Bing/Yandex/etc. which URLs changed. Free, no account needed.
// Key file lives at the site root (<key>.txt). Run after every deploy:
//   node tools/indexnow-ping.mjs            # every URL in sitemap.xml
//   node tools/indexnow-ping.mjs /a /b     # specific paths
// Google ignores IndexNow; this is for the Bing index (Bing/Yahoo/DDG ≈ 95% of our search traffic, Sep 2026).
import { readFileSync } from 'node:fs';
const HOST = 'www.shopcardhub.com';
const KEY  = '657d60950f58c9015178a8c915eceb43';
const args = process.argv.slice(2);
let urls;
if (args.length) urls = args.map(p => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`);
else {
  const xml = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}
const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(0, 10000) };
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log(`IndexNow: ${urls.length} URLs → HTTP ${r.status} ${r.status === 200 || r.status === 202 ? 'OK' : await r.text()}`);
