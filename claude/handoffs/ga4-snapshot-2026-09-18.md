# GA4 nightly snapshot — setup handoff (2026-09-18)

**Why:** cloud lanes have no browser; GA4 was read only when a Chrome-linked session looked (13-day key-event blackout, Sep 4–16). Mo said yes on 2026-09-18 to a read-only service account. This makes the read nightly, browserless, and free.

**Pieces:**
- `tools/ga4-snapshot.mjs` — pulls 12 Data API reports for property 541047014, writes `data/ga4-latest.json` + `data/ga4-history.json` on the `price-data` branch. No npm deps. `--dry` prints the requests.
- `.github/workflows/ga4-snapshot.yml` — **must be added through the GitHub web UI** (the `auto` deploy key has no `workflow` scope, CHARTER §5). Contents below.
- GitHub Actions secret **`GA4_SA_KEY`** = the service-account JSON, pasted by Mo. Never stored in a doc, prompt, clone or Vercel.

**Google side (CoS drives in Mo's Chrome, Browser 2, signed in as shopcardhub@gmail.com):** Cloud project `shopcardhub-analytics` → enable *Google Analytics Data API* → service account `ga4-reader` (no roles needed) → GA4 Admin → Property access management → add the service-account email as **Viewer**. Mo clicks *Create key → JSON* himself and pastes it into the secret.

**Who reads it:** Integrity Watch Part A (key events vs trailing median — the check that would have caught Sep 4), the CoS daily/weekly Business Read (organic-channel KE rate beside blended; returning share; landing mix), the Ideas Desk (fresh numbers instead of week-old ones). Read URL: `https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/ga4-latest.json`.

**Public-branch note:** the `price-data` branch is public, like `STATE.md`, which already publishes these same aggregate figures. Nothing user-level is pulled (the script cannot). If Mo ever wants them private, point `--out` at a private repo instead.

## `.github/workflows/ga4-snapshot.yml`

```yaml
# GA4 nightly snapshot — read-only Data API pull with a service-account secret.
# Writes data/ga4-latest.json + data/ga4-history.json to the price-data branch next to the price feed,
# so cloud lanes with no browser can read analytics. Created 2026-09-18 (Mo's yes, NEEDS-MO item 2).

name: ga4-snapshot

on:
  schedule:
    - cron: "0 9 * * *"   # 09:00 UTC = 02:00 PT, ahead of the 04:15 PT Ideas Desk and 05:00 PT Integrity Watch
  workflow_dispatch: {}

permissions:
  contents: write

concurrency:
  group: price-data-writers
  cancel-in-progress: false

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout main
        uses: actions/checkout@v4

      - name: Checkout price-data branch
        uses: actions/checkout@v4
        continue-on-error: true
        with:
          ref: price-data
          path: price-data

      - name: Prepare data dir
        run: mkdir -p price-data/data

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run GA4 snapshot
        env:
          GA4_SA_KEY: ${{ secrets.GA4_SA_KEY }}
        run: node tools/ga4-snapshot.mjs --out price-data/data

      - name: Commit and push to price-data
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          cd price-data
          if [ ! -d .git ]; then
            git init -b price-data .
            git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
          fi
          git checkout -B price-data
          git config user.name "ga4-snapshot[bot]"
          git config user.email "actions@users.noreply.github.com"
          git add data/ga4-latest.json data/ga4-history.json
          if git diff --cached --quiet; then
            echo "No GA4 changes."
            exit 0
          fi
          git commit -m "ga4-snapshot: $(date -u +%F)"
          git pull --rebase origin price-data || true
          git push -u origin price-data
```
