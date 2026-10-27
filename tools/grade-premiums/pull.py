# tools/grade-premiums/pull.py — one-off sample pull behind data/grade-premiums.json (CoS, Oct 27 2026).
# Reads PriceCharting card pages for a random sample of cards with a PSA 10 mark; per card, 90-day medians by grade (title-checked);
# writes per-era aggregates only (no titles, sellers or item ids kept, R17). Usage: python3 tools/grade-premiums/pull.py vintage 160 ; ... modern 160
import json,glob,re,time,random,sys,urllib.request,statistics as st,datetime
VINT={'bs99','bs1e','bssl','ju99','ju1e','fo99','fo1e','tr00','tr1e','ng00','ng1e','nd02','nd1e','ndc01','ndc1e','nr01','nr1e','aq03','sk03'}
FIRST={'bs1e','ju1e','fo1e','tr1e','ng1e','nd1e','ndc1e','nr1e'}
TODAY=datetime.date(2026,10,27)
cards=[]
for gp in glob.glob('data/cards/g-*.json'):
    tk=gp.split('g-')[1][:-5]; g=json.load(open(gp)); paths=g.get('paths') or {}
    for num,gr in g['cards'].items():
        p10=gr.get('psa10') or {}
        if not p10.get('m'): continue
        path=paths.get(num) if isinstance(paths,dict) else None
        if not path: continue
        cards.append((tk,num,path))
random.seed(7); random.shuffle(cards)
era=sys.argv[1]; N=int(sys.argv[2])
sel=[c for c in cards if (c[0] in VINT)==(era=='vintage')][:N]
def rows(s,label):
    opts=re.findall(r'<option[^>]*value="completed-auctions-([a-z0-9-]+)"[^>]*>([^<(]+)',s)
    c=[x for x,l in opts if l.strip()==label]
    if not c: return []
    i=s.find('<div class="completed-auctions-'+c[0]+'"'); j=s.find('<div class="completed-auctions-',i+20); body=s[i:j if j>0 else None]
    out=[]
    for tr in body.split('<tr')[1:]:
        d=re.search(r'<td class="date">\s*(\d{4}-\d{2}-\d{2})',tr); p=re.search(r'class="js-price"[^>]*>\s*\$([\d,]+(?:\.\d+)?)',tr); t=re.search(r'<td class="title">\s*<a[^>]*>([^<]*)',tr)
        if d and p and t:
            age=(TODAY-datetime.date.fromisoformat(d.group(1))).days
            if age<=90: out.append((t.group(1),float(p.group(1).replace(',',''))))
    return out
def ed_ok(t,tk):
    first=bool(re.search(r'1st\s*ed|first\s*ed',t,re.I)); sl=bool(re.search(r'shadowless',t,re.I))
    if tk in FIRST: return first
    if tk=='bssl': return sl and not first
    if tk in VINT: return not first and not sl
    return True
bad=re.compile(r'\blot\b|proxy|custom|reprint',re.I)
res=[]
for tk,num,path in sel:
    try:
        req=urllib.request.Request('https://www.pricecharting.com/game/'+path,headers={'User-Agent':'Mozilla/5.0'})
        s=urllib.request.urlopen(req,timeout=20).read().decode('utf8','ignore')
    except Exception as e:
        continue
    def med(label,rx,extra=None):
        xs=[p for t,p in rows(s,label) if re.search(rx,t,re.I) and not bad.search(t) and ed_ok(t,tk) and (extra is None or extra(t))]
        return (st.median(xs),len(xs)) if len(xs)>=2 else None
    r={'tk':tk,'num':num,
       'raw':None,
       'p10':med('PSA 10',r'\bpsa\s*-?\s*10\b'),
       'p9':med('Grade 9',r'\bpsa\s*-?\s*9\b(?![.\d])',lambda t: not re.search(r'psa\s*10',t,re.I)),
       'p8':med('Grade 8',r'\bpsa\s*-?\s*8\b(?![.\d])'),
       'p7':med('Grade 7',r'\bpsa\s*-?\s*7\b(?![.\d])'),
       'p5':med('Grade 5',r'\bpsa\s*-?\s*5\b(?![.\d])'),
       'tagP':med('TAG 10',r'\btag\b',lambda t: re.search(r'pristine',t,re.I)),
       'tagG':med('TAG 10',r'\btag\b',lambda t: not re.search(r'pristine',t,re.I)),
       'rawm':med('Ungraded',r'.',lambda t: not re.search(r'\b(psa|bgs|cgc|sgc|tag|ace|graded|slab)\b',t,re.I))}
    res.append(r); time.sleep(1.2)
json.dump(res,open(f'/tmp/grade-premiums-{era}.json','w'))
print(era,len(res))
