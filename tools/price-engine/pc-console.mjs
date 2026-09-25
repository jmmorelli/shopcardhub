const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function get(u){ for(let a=1;a<=3;a++){ const r=await fetch(u,{headers:{"User-Agent":UA}}); if(r.status===429||r.status===403){await sleep(4000*a);continue;} return {status:r.status,url:r.url,text:await r.text()}; } }
function parseRows(text){
  const out=[];
  for(const m of text.matchAll(/<tr id="product-(\d+)"[\s\S]*?<\/tr>/g)){ const a=m[0].match(/<td class="title"[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/); if(a) out.push({id:m[1], path:a[1].split('?')[0].replace(/^https?:\/\/[^/]+\/game\//,'').replace(/^\/game\//,'').replace(/&amp;/g,'&'), title:a[2].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()}); }
  return out;
}
// Every product on a set's console page, all pages. Pokémon consoles page with a GET cursor on pricecharting.com; a
// SPORTS console (baseball-cards-…) redirects to sportscardspro.com, whose GET cursor is ignored — its pager is a POST
// to the same URL with sort/when/cursor form fields (verified Sep 25 2026 while building the Bowman indices; the
// Sep 24 sold-catalog note had it right: a POST to pricecharting.com is redirected to a GET and loses the cursor).
export async function consoleCards(slug){
  const out=[], seen=new Set(); let cursor=0;
  const sports=/^baseball-cards-|^football-cards-|^basketball-cards-|^hockey-cards-|^soccer-cards-/.test(slug);
  for(let page=0;page<80;page++){
    let text;
    if(sports){
      let r=null; for(let a=1;a<=3;a++){ r=await fetch(`https://www.sportscardspro.com/console/${slug}`,{method:"POST",headers:{"User-Agent":UA,"Content-Type":"application/x-www-form-urlencoded",Accept:"text/html"},body:`sort=name&when=none&cursor=${cursor}`}); if(r.status===429||r.status===403){await sleep(4000*a);continue;} break; }
      text=await r.text();
    } else {
      text=(await get(`https://www.pricecharting.com/console/${slug}?sort=name&cursor=${cursor}`)).text;
    }
    const rows=parseRows(text); let added=0;
    for(const x of rows){ if(seen.has(x.id)) continue; seen.add(x.id); out.push({path:x.path,title:x.title}); added++; }
    if(!rows.length||!added) break;
    if(sports){ cursor+=rows.length; } else { const nc=text.match(/name="cursor" value="(\d+)"/); if(!nc) break; cursor=nc[1]; }
    await sleep(1200);
  }
  return out;
}
