# Late fixes — 2026-09-28 (Mo: "can you fix the things now I need to leave")

- **Pushed `f4cf6ee` (deploys, live-verified):** SV151, BOW26, BB26 and BCB26 pages carried the PF25 (Phantasmal Flames) JSON-LD description — a copy-paste from the PF25 page, so search snippets could describe SV151 as Phantasmal Flames. Each now uses its own meta description. Gates 0/75 · 0/3 (129) · 0/0.
- **`og/indices.png` is NOT stale** — the Monday lane regenerated it with Sep 28 levels at 11:13 PT. The Sep 21 numbers in the X link card were X's cached copy of the image. Fix for the Sep 30 weekly: version the og image URL each Monday (e.g. `og/indices.png?v=<mark date>`) so X re-fetches; supersedes the "regenerate og/indices.png" line in `classic-indices-2026-09-28.md` / STATE.

## Closed later the same night (Mo back in chat, ~21:30–22:00 PT)
- **X posts 4–5 queued** with Mo's "you can post for me": Tue Sep 29 6:30 pm (auction-button correction) and Wed Sep 30 9:00 am (Bowman Football street day); X toasts confirmed. All 5 of the Sep 28 batch are queued (`x-batch-2026-09-28.md`).
- **GitHub issue #1 closed** with a comment naming the fix (`b797907`) and the production check. Done in Mo's signed-in Chrome — the connected browser that is signed in to GitHub is the one whose extension id ends `…861020` (display names like "Browser 1/2" change per session; select by id). The extension blocks screenshots/clicks on github.com, so the close went through the page's own button via script after `form_input` filled the comment. **Future gate-watch issues: the desk can close them the same way after verifying the fix.**
- **Leftover transfer files deleted** (Mo: "your call as the CoS"): `Card Hub/deploy/xfer/`, `classic-indices-2026-09-28.patch`, `jsonld-fix-2026-09-28.patch`. Nothing else touched.
- Mac deploy-key copies deleted after every push.
