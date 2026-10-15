# Email capture / Signal Alerts — built Jul 30-31 2026

Decision (Mo): Kit (ConvertKit) free plan (10k subs), promise = weekly Tape Recap + automated BUY/SELL flip alerts; recap is auto-DRAFTED in Kit (Mo reviews + sends), flip alerts auto-scheduled with 15-min undo window.

## Built
- Signup blocks ("Signal Alerts") on /bowman-bangers (under signal board), homepage (after ticker), /roy-watch-2026 (before social strip). Ship DARK: they render only when `data/newsletter.json` has a non-empty `kitFormId`. Submit POSTs to app.kit.com/forms/{id}/subscriptions with a `fields[source]` tag per page. jsdom-tested (hidden w/o config, subscribes w/ config).
- `tools/price-engine/newsletter.mjs`: runs in the nightly Action after the snapshot. Flip detection = analyze(series) vs analyze(series minus last point), only when points >= 20 (BUILDING noise can't alert; first possible flip ~Sep 19). Monday (UTC) → drafts Tape Recap broadcast (movers table + [EDITOR NOTE] placeholder). Uses Kit v4 API (X-Kit-Api-Key header); inert without KIT_API_KEY secret; all failures non-fatal so the snapshot commit never blocks.
- Workflow step added via GitHub web UI (commit ff63a14), guarded with -f check so order of pushes doesn't matter. Emails link back to board/vault with EPN-tagged eBay links (customid=signal-alerts for attribution).

## Remaining for Mo (in order)
1. Push the 5 files from Mac (pull first — workflow commit is remote-only): bowman-bangers.html, index.html, roy-watch-2026.html, data/newsletter.json, tools/price-engine/newsletter.mjs.
2. Create free Kit account → create a Form (inline) named "Signal Alerts" → copy its form ID into data/newsletter.json → push (blocks go live on next deploy).
3. Kit → Settings → Developer → V4 API key → GitHub repo → Settings → Secrets → Actions → `KIT_API_KEY`.
4. Kit domain verification (DNS records) for deliverability before first real send.
5. Watch: Vercel webhook flaked on the last push — verify a deployment appears; manual Deploy to Production works if not. First live flip alert (~Sep 19) deserves a sanity check of the Kit v4 payload.
