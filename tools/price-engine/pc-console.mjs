const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function get(u){ for(let a=1;a<=3;a++){ const r=await fetch(u,{headers:{"User-Agent":UA}}); if(r.status===429||r.status===403){await sleep(4000*a);continue;} return {status:r.status,url:r.url,text:await r.text()}; } }
export async function consoleCards(slug){
  const out=[]; let cursor=0;
  for(let page=0;page<20;page++){
    const r=await get(`https://www.pricecharting.com/console/${slug}?sort=name&cursor=${cursor}`);
    const rows=[...r.text.matchAll(/<tr id="product-(\d+)"[\s\S]*?<\/tr>/g)];
    for(const m of rows){ const a=m[0].match(/<td class="title"[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/); if(a) out.push({path:a[1].split('?')[0].replace(/^https?:\/\/[^/]+\/game\//,'').replace(/^\/game\//,'').replace(/&amp;/g,'&'), title:a[2].replace(/\s+/g,' ').trim()}); }
    const nc=r.text.match(/name="cursor" value="(\d+)"/); if(!nc||!rows.length) break; cursor=nc[1]; await sleep(1200);
  }
  return out;
}
