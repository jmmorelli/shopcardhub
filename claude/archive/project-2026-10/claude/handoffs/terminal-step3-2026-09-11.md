# Handoff — Terminal step 3 (portfolios inside the Vault), commit-ready, NOT pushed

**State at hand-off (Sep 11 2026, ~22:40 UTC):** steps 1 and 2 are LIVE on origin/main = `4e96943`. Step 3 is built, three gates FAIL 0, migration test 193/0, but Mo's Mac dropped off the link before the push, and the cloud has no push credential. Push it from the next Mac-linked run.

**Patch:** `claude/handoffs/terminal-step3-2026-09-11.patch.txt` (git format-patch series, 2 commits on top of `4e96943`; expected tree `e7432528cb5ffbc52532ff312e0b9b7dfab87a38`, 96 files — 83 of them are the `?v=6` bump on `vault-track.js`). Also at `Card Hub/deploy/terminal-step3-2026-09-11.patch` once a Mac-linked session copies it there (it was staged at `/mnt/user-data/outputs/terminal-step3-2026-09-11.patch` in the session that built it).

## Push recipe (the one that worked twice today)
On the Mac via device_bash (`$D="$HOME/mnt/Card Hub/deploy"`):
1. `cp "$D/github_deploy_key" /tmp/sch/key; chmod 600; cp "$D/known_hosts" /tmp/sch/known_hosts; export GIT_SSH_COMMAND="ssh -i /tmp/sch/key -o UserKnownHostsFile=/tmp/sch/known_hosts -o IdentitiesOnly=yes"`
2. `git clone -q git@github.com:jmmorelli/shopcardhub.git /tmp/sch/repo` (fresh; never Mo's clone). If `/tmp/sch/repo` exists: `git fetch origin main && git reset --hard origin/main`.
3. Save the patch to disk (from the project doc, strip nothing — it's the raw series) and `git am -q <patch>`. **If origin/main has moved past `4e96943`, `git am` may need `-3`; regenerate `index.html` with `FEED_BASE=<feed clone> node tools/build-home.mjs` and the rail with `node tools/build-rail.mjs` rather than hand-resolving generated blocks.**
4. `git rev-parse HEAD^{tree}` must equal `e7432528cb5ffbc52532ff312e0b9b7dfab87a38` when applied on `4e96943` exactly.
5. Gates on the Mac: `node tools/audit-prices.mjs && node tools/site-auditor/audit-site.mjs && node tools/audit-terminal.mjs --run-tests` (pass `--feed <dir>` if a price-data clone is available; without it the gate WARNs `feed-unavailable` and skips only the feed sub-checks). All FAIL 0.
6. `git fetch origin main && git merge-base --is-ancestor origin/main HEAD && git push origin HEAD:main`, then `git ls-remote origin main`.
7. Verify live by curl only (no browser): `/watchlist` 200 and contains `RAIL:START`, `vault-schema.js`, `terminal-shell.css`; `/js/vault-schema.js` 200; `/js/vault-track.js?v=6` 200. Then `node tools/indexnow-ping.mjs /watchlist /`.
8. Log in STATE (production sha, rollback = `git revert <the 2 new shas>`), pipeline pushLog, and tell Mo: "Step 3 live".

## What step 3 changes (for the reviewer)
- `js/vault-schema.js` (new, UMD): `state.lists[]` with fixed default `{id:'default', name:'My cards'}`; every `own` card gets `listId`; `migrate()` additive/idempotent/lossless, fails open on a non-store; `addList/renameList/removeList` (remove moves cards to My cards, never deletes); `summary`, `railRows`.
- `watchlist.html`: migration on load + inside save(); portfolio header (name ▾ / All / + New / Rename / Delete), value + 5D change, four tiles, Weight column, warning banners (SELL ≥ 0.8 red · gated raw gold · kurtosis > 10 cyan · Hunting target crossed cyan; max 4), "on the tape" + Distribution panels; `#pf=<id|hunting|new|all>`; terminal shell + RAIL.
- `js/vault-track.js` v3 (`?v=6` everywhere): Portfolio ▾ on I OWN IT; mirror carries `lists`/`listId` and the last 6 price points (was 2).
- `css/terminal-shell.css` shared by `/` and `/watchlist`; `js/home.js` v2.
- Gate: five new checks (vault-schema-shared, vault-track-contract, shell-css-shared, rail-portfolio-readonly, migration-test-present) + `--run-tests` / `--all`.
- Known gaps (Builder): card moves via Edit dialog only; share PNG renders the whole vault; "+ New portfolio" uses `prompt()`; Home rail rows show "—" until a real (non-demo) store exists.
