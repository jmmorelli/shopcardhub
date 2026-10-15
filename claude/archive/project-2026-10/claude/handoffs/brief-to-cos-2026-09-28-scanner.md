# Brief to the CoS — card scanner and pokemontcg.io (Mo in chat, 2026-09-28)

**1. Private scanner: KEEP (built today).** A private claude.ai artifact, "ShopCardHub Scanner" (https://claude.ai/artifact/QwQGKCH8hMvJaDZ7zieoWY), owner-only, runs on Mo's Claude plan with $0 spend. Mo and his son take a photo or pick from the camera roll; Claude identifies the card; it's priced from an embedded catalog of 891 cards (index baskets + `sold-marks.json`, Sep 27 read) and saved to My cards / Hunting. Its eBay links are deliberately **untagged** (EPN self-click rule). Details: `claude/scanner-2026-09-28.md`.
- *CoS to know:* its prices only refresh when the page is republished. A rebuild means re-running the catalog build against a fresh clone and republishing to the same URL. There is no standing job; do it when Mo asks or the catalog grows.

**2. Public scanner: TABLED by Mo.** "Let's table this for public for now … I don't want to spend more money just yet." No `/api/scan`, no Anthropic API key, no watchlist button, no spend. The spec is kept for revival only on Mo's word: `claude/handoffs/scanner-live-2026-09-28.md`. **Nothing to build; don't queue it.**

**3. pokemontcg.io: CoS's call** (Mo: "I will let the CoS decide on that"). What was measured on Sep 28, ~11:40 PT:
- **Current on sets and images.** `/v2/sets` lists 30th Celebration (me55 + me55c, Sep 16), Pitch Black, Chaos Rising, Perfect Order and Ascended Heroes. Card images serve from images.scrydex.com.
- **Unreliable on prices.** Pitch Black #116 returned no TCGplayer price block, and two card queries returned 500/502. Don't use it as a price source until a fresh read shows dated prices on current-set cards.
- **Candidate site uses (both need your ruling; R25 applies):** (a) official card images in place of eBay-listing photos on the index tables and chase strips. That fills the remaining placeholders and removes a dependence on eBay listing content (R17 spirit). Card art is © The Pokémon Company, so decide whether that's acceptable. (b) Full set checklists for Pokémon pages.
- **Key:** free and optional (1,000 requests/day, 30/min without one; 20,000/day with one). Signing up is only worth Mo's 2 minutes once a build uses it.

No NEEDS-MO item from this conversation.
