# GA4 nightly snapshot — setup record (2026-09-18)

**Why:** cloud lanes have no browser; GA4 was read only when a Chrome-linked session looked (13-day key-event blackout, Sep 4–16). Mo said yes on 2026-09-18 to a read-only service account. This makes the read nightly, browserless, free — **and keyless**: Mo said he would not handle GitHub secrets, so GitHub Actions authenticates to Google with its own OIDC token through Workload Identity Federation. No JSON key was ever created.

**Google side (done 2026-09-18 by the CoS in Mo's Chrome, account shopcardhub@gmail.com):**
- Cloud project **`shopcardhub-analytics`** (project number **61398544448**), no billing, no organization.
- APIs enabled: Google Analytics Data API, IAM Service Account Credentials API.
- Service account **`ga4-reader@shopcardhub-analytics.iam.gserviceaccount.com`** — no project roles.
- Workload Identity pool **`github`**, provider **`github-actions`** (OIDC, issuer `https://token.actions.githubusercontent.com`), mappings `google.subject=assertion.sub`, `attribute.repository=assertion.repository`, attribute condition `assertion.repository == "jmmorelli/shopcardhub"`.
- Grant: principals with `attribute.repository = jmmorelli/shopcardhub` may impersonate `ga4-reader` (Workload Identity User).
- GA4 Admin → Property access management: `ga4-reader@…` added as **Viewer** on property 541047014 (2 rows now).

**Pieces in the repo:**
- `tools/ga4-snapshot.mjs` — pulls 12 Data API reports, writes `data/ga4-latest.json` + `data/ga4-history.json` on the `price-data` branch. Reads `GA4_ACCESS_TOKEN` from the auth step (fallback `GA4_SA_KEY` for local use only). `--dry` prints the requests.
- `.github/workflows/ga4-snapshot.yml` — added through the GitHub web UI (the `auto` deploy key has no `workflow` scope, CHARTER §5). Contents below.

**Who reads it:** Integrity Watch Part A (key events vs trailing median — the check that would have caught Sep 4), the CoS daily/weekly Business Read (organic-channel KE rate beside blended; returning share; landing mix), the Ideas Desk. Read URL: `https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/ga4-latest.json`.

**Public-branch note:** the `price-data` branch is public, like `STATE.md`, which already publishes these same aggregate figures. Nothing user-level is pulled (the script cannot; the account is Viewer). If Mo ever wants them private, point `--out` at a private repo instead.

**Rollback:** delete the workflow file; delete the WIF pool `github` in the Cloud project; remove `ga4-reader` from GA4 property access. Nothing else holds state.

## `.github/workflows/ga4-snapshot.yml`

```yaml
# GA4 nightly snapshot — keyless read of the Data API via Workload Identity Federation.
# Writes data/ga4-latest.json + data/ga4-history.json to the price-data branch next to the price feed,
# so cloud lanes with no browser can read analytics. Created 2026-09-18 (Mo's yes, NEEDS-MO item 2).
# No secrets: GitHub's OIDC token is exchanged for a short-lived Google token scoped to ga4-reader.

name: ga4-snapshot

on:
  schedule:
    - cron: "0 9 * * *"   # 09:00 UTC = 02:00 PT, ahead of the 04:15 PT Ideas Desk and 05:00 PT Integrity Watch
  workflow_dispatch: {}

permissions:
  contents: write
  id-token: write

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

      - name: Authenticate to Google (keyless)
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/61398544448/locations/global/workloadIdentityPools/github/providers/github-actions
          service_account: ga4-reader@shopcardhub-analytics.iam.gserviceaccount.com
          token_format: access_token
          access_token_scopes: https://www.googleapis.com/auth/analytics.readonly

      - name: Run GA4 snapshot
        env:
          GA4_ACCESS_TOKEN: ${{ steps.auth.outputs.access_token }}
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
