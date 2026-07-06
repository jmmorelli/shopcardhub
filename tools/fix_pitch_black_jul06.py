#!/usr/bin/env python3
"""One-shot corrector for pitch-black-set-guide.html (Jul 6, 2026).
Fixes phantom cards + wrong numbering + wrong JP set name against the verified
ME05 checklist (118 cards: 81 main + 37 secrets; SIRs #112-117; MHR Darkrai #118;
JP source set = Abyss Eye, released May 22 2026; SIR artist Akira Egawa).
Every replacement asserts exactly-one occurrence. Run once, then delete or keep for audit.
"""
import io, sys

PATH = "pitch-black-set-guide.html"
with io.open(PATH, encoding="utf-8") as f:
    html = f.read()

R = []
def rep(old, new):
    R.append((old, new))

# ── Hero / banner ────────────────────────────────────────────────────────────
rep("<span>⭐ 5 SIRs Projected</span>", "<span>⭐ 6 SIRs Confirmed</span>")
rep("Based on Japan's Shadow Surge set.", "Based on Japan's Abyss Eye set (JP release May 22, 2026).")
rep('<div class="banner-stat-label">Total Cards</div><div class="banner-stat-value pb">~128</div>',
    '<div class="banner-stat-label">Total Cards</div><div class="banner-stat-value pb">118</div>')
rep('<div class="banner-stat-label">SIRs in Set</div><div class="banner-stat-value">5</div>',
    '<div class="banner-stat-label">SIRs in Set</div><div class="banner-stat-value">6</div>')
rep('<div class="banner-stat-label">Hyper Rare</div><div class="banner-stat-value">1 (Gold)</div>',
    '<div class="banner-stat-label">Mega Hyper Rare</div><div class="banner-stat-value">1 — Darkrai #118</div>')
rep("Projections based on Japan's Shadow Surge comps,",
    "Projections based on Japan's Abyss Eye comps,")

# ── Chase table rows ─────────────────────────────────────────────────────────
rep('<span class="roi-name">Mega Darkrai ex</span><span class="roi-sub">★ SIR · Set Mascot · Dark-type · #124/090</span>',
    '<span class="roi-name">Mega Darkrai ex</span><span class="roi-sub">★ SIR · Set Mascot · Dark-type · #114/081</span>')
rep('<span class="roi-name">Mega Darkrai ex</span><span class="roi-sub">Hyper Rare Gold · #128/090 · Rarest card</span>',
    '<span class="roi-name">Mega Darkrai ex</span><span class="roi-sub">Mega Hyper Rare Gold · #118/081 · Rarest card</span>')
rep('<span class="roi-name">Darkrai — Trainer SIR</span><span class="roi-sub">Supporter/Item · Dark-themed narrative · Story-driven</span>',
    '<span class="roi-name">Gwynn — Trainer SIR</span><span class="roi-sub">Supporter SIR · #117/081 · New-character chase</span>')
rep('<span class="roi-name">Mega Absol ex</span><span class="roi-sub">★ SIR · Dark-type · Absol collector base</span>',
    '<span class="roi-name">Morpeko ex</span><span class="roi-sub">★ SIR · #115/081 · Hangry-mode fan favorite</span>')
rep('<span class="roi-sub">Loyal Absol fan base</span>',
    '<span class="roi-sub">Loyal Morpeko fan base</span>')
rep('<span class="roi-name">Darkrai ex IR</span><span class="roi-sub">Illustration Rare · Full art solo Darkrai</span>',
    '<span class="roi-name">Gladion&#39;s Decisive Battle — Trainer SIR</span><span class="roi-sub">Supporter SIR · #116/081 · Story-driven art</span>')
rep('<span class="roi-sub">Budget Darkrai entry point</span>',
    '<span class="roi-sub">Second Trainer SIR chase</span>')
rep('<span class="roi-name">Zeraora ex IR</span><span class="roi-sub">Illustration Rare · Electric panels · Clean art</span>',
    '<span class="roi-name">Mega Darkrai ex — Ultra Rare</span><span class="roi-sub">Full-art UR · #99/081 · Budget Darkrai entry</span>')
rep('<span class="roi-sub">Accessible spec</span>',
    '<span class="roi-sub">Cheapest full-art Darkrai</span>')
rep('<span class="roi-name">Lunala ex IR</span><span class="roi-sub">Illustration Rare · Moon/dark aesthetic · Surprise spec</span>',
    '<span class="roi-name">Illustration Rares (field)</span><span class="roi-sub">12 IRs · #82–93 · Zarude / Silvally / Primarina</span>')
rep('<span class="roi-sub">Moon aesthetics = collector niche</span>',
    '<span class="roi-sub">Art-driven — buy the standouts</span>')
rep('<span class="roi-name">Dark Energy Full Art Trainer</span><span class="roi-sub">Ultra Rare · Competitive staple potential</span>',
    '<span class="roi-name">Ultra Rare Trainers &amp; Items</span><span class="roi-sub">#102–111 · Dark Bell / Misty&#39;s Energy / Crushing Hammer</span>')

# Fix rarity-cell labels for the two rows that changed rarity class
rep('''<td><span class="roi-name">Gladion&#39;s Decisive Battle — Trainer SIR</span><span class="roi-sub">Supporter SIR · #116/081 · Story-driven art</span></td>
            <td><span class="roi-sub">Illus. Rare</span></td>''',
    '''<td><span class="roi-name">Gladion&#39;s Decisive Battle — Trainer SIR</span><span class="roi-sub">Supporter SIR · #116/081 · Story-driven art</span></td>
            <td><span class="roi-sub" style="color:var(--pb);">★ SIR</span></td>''')
rep('''<td><span class="roi-name">Mega Darkrai ex — Ultra Rare</span><span class="roi-sub">Full-art UR · #99/081 · Budget Darkrai entry</span></td>
            <td><span class="roi-sub">Illus. Rare</span></td>''',
    '''<td><span class="roi-name">Mega Darkrai ex — Ultra Rare</span><span class="roi-sub">Full-art UR · #99/081 · Budget Darkrai entry</span></td>
            <td><span class="roi-sub">Ultra Rare</span></td>''')

# ── Deep dive 01 (Darkrai SIR) ───────────────────────────────────────────────
rep('<div class="entry-tag">🌑 Special Illustration Rare · #124/090 · Dark-type</div>',
    '<div class="entry-tag">🌑 Special Illustration Rare · #114/081 · Dark-type</div>')
rep('<div class="entry-stat"><div class="entry-stat-label">Japan Comp (Shadow Surge)</div><div class="entry-stat-value">¥95,000+</div></div>',
    '<div class="entry-stat"><div class="entry-stat-label">JP Source Set</div><div class="entry-stat-value">Abyss Eye · May 2026</div></div>')
rep("The Japan Shadow Surge equivalent pulled ¥95,000+ at auction before the English set was even confirmed — that's roughly $630 USD at the time, a real data point.",
    "The Japanese Abyss Eye version has been out since May 22, 2026, so real JP sold comps exist — pull completed listings for the Abyss Eye Mega Darkrai SIR to anchor expectations before the English release.")
rep("The artwork for Mega Darkrai ex SIR is a dark, atmospheric full-bleed composition — Mega Darkrai rising from shadow over a moonlit arena, in a style reminiscent of what Maeya did with Greninja but executed with a darker palette that suits the subject. The SIR is the <strong>final card of a connected triptych</strong> with the Darkrai ex and Darkrai IR, making all three cards relevant to collectors who want the panorama complete.",
    "The Mega Darkrai ex SIR is illustrated by <strong>Akira Egawa</strong> — one of the marquee artists behind the era's biggest SIR chases. It also anchors a deep Darkrai run in the set: base Double Rare #46, full-art Ultra Rare #99, this SIR #114, and the gold Mega Hyper Rare #118 — rainbow collectors will want all four.")
rep("<strong>The pre-release auction signal matters here:</strong> Prerelease events ran July 4–12. Within 48 hours of the first prerelease events, raw copies of Mega Darkrai ex SIR were being listed and trading at $620–$750 in sealed-condition graded-potential raw state — before the general release. Chaos Rising Greninja SIR prerelease data showed similar early spikes that settled +15–20% below the initial auction peak. Apply that same correction and $550–$700 is the realistic settled range.",
    "<strong>The pre-release signal matters here:</strong> prerelease events run July 4–12 and the first raw copies list on eBay before the general release — watch those early sales rather than guessing. Chaos Rising's Greninja SIR prerelease spike settled 15–20% below its initial peak; apply the same correction to whatever the early Darkrai prints show, and $550–$700 remains our working settled range.")

# ── Deep dive 02 / 03 / 04 ───────────────────────────────────────────────────
rep('<div class="entry-tag gold">🌟 Hyper Rare Gold · #128/090 · Rarest Card in Set</div>',
    '<div class="entry-tag gold">🌟 Mega Hyper Rare Gold · #118/081 · Rarest Card in Set</div>')
rep("In Japan's Shadow Surge, the Zeraora SIR equivalent opened as the #2 most sought card right after release.",
    "In Japan's Abyss Eye, the Zeraora SIR opened as one of the most-watched cards after release — JP solds are the live anchor until English comps exist.")
rep("If the artwork delivers — and Japan's Shadow Surge data suggests it does — this is the Cinccino-style breakout candidate for Pitch Black.",
    "If the artwork delivers — and Japan's Abyss Eye reception suggests it does — this is the Cinccino-style breakout candidate for Pitch Black.")

# ── Set composition ──────────────────────────────────────────────────────────
rep("90 base cards + 38 secret rares = 128 total projected. The English set typically adds 3–5 cards not in the Japanese Shadow Surge base — pull rates update on English release week.",
    "81 main-set cards + 37 secret rares = 118 total, verified against the full English checklist. The master set runs 200 with reverse holos — pull rates update on English release week.")
rep('<div class="rarity-count">Darkrai · Zeraora · Chandelure · Absol</div>',
    '<div class="rarity-count">Darkrai · Zeraora · Chandelure · Excadrill</div>')
rep('''<div class="rarity-name">4–5 Pokémon ex</div>
        <div class="rarity-count">Lunala ex · Sableye ex · Spiritomb ex · Weavile ex</div>''',
    '''<div class="rarity-name">4 Pokémon ex</div>
        <div class="rarity-count">Lurantis ex · Wailord ex · Rampardos ex · Morpeko ex</div>''')
rep('''<div class="rarity-name">~12 IRs</div>
        <div class="rarity-count">Darkrai · Zeraora · Lunala · Mismagius · Drifblim + more</div>''',
    '''<div class="rarity-name">12 IRs · #82–93</div>
        <div class="rarity-count">Zarude · Silvally · Primarina · Bastiodon + more</div>''')
rep('''<div class="rarity-name">5 SIRs</div>
        <div class="rarity-count">Mega Darkrai ex · Mega Zeraora ex · Mega Chandelure ex · Mega Absol ex · Trainer SIR</div>''',
    '''<div class="rarity-name">6 SIRs · #112–117</div>
        <div class="rarity-count">M Darkrai · M Zeraora · M Chandelure · Morpeko · Gladion&#39;s Decisive Battle · Gwynn</div>''')
rep('''<div class="rarity-name">~20 UltraRares</div>
        <div class="rarity-count">Full-art Pokémon ex + Full-art Trainers. Dark Energy Full Art is the competitive target.</div>''',
    '''<div class="rarity-name">18 URs · #94–111</div>
        <div class="rarity-count">Full-art ex + Trainer/Item URs — Dark Bell, Misty&#39;s Energy, Crushing Hammer.</div>''')
rep('<div class="rarity-label gold">Hyper Rare</div>',
    '<div class="rarity-label gold">Mega Hyper Rare</div>')
rep('<div class="rarity-count">Mega Darkrai ex #128/090 · Gold finish · ~1:1,800 packs est.</div>',
    '<div class="rarity-count">Mega Darkrai ex #118/081 · Gold finish · ~1:1,800 packs est.</div>')
rep('<div class="rarity-count">Dark-themed supporters, items. Dark Energy FA and the Trainer SIR are the chases here.</div>',
    '<div class="rarity-count">Dark-themed supporters + items. The Gwynn and Gladion&#39;s Decisive Battle SIRs are the chases here.</div>')
rep('''<div class="rarity-name">~210 Cards</div>
        <div class="rarity-count">Includes reverse holofoils + 38 secret rares. Darkrai reverse holo will carry a premium.</div>''',
    '''<div class="rarity-name">200 Cards</div>
        <div class="rarity-count">118 set cards + 82 reverse holos. Darkrai reverse holo will carry a premium.</div>''')

# ── Mechanic block (drop phantom Mega Absol) ─────────────────────────────────
rep("makes Mega Darkrai ex and Mega Absol ex more consistent than the average Mega deck",
    "makes Mega Darkrai ex more consistent than the average Mega deck")

# ── Speculation angles ───────────────────────────────────────────────────────
rep("🎴 <strong>Darkrai IR (Illustration Rare):</strong> At a projected $40–$80, the Darkrai ex IR is the lowest-cost entry into the Darkrai collector market. If the IR artwork features the connected-triptych panorama that Japan's version suggests, demand from collectors who want all three connected pieces will drive this card well above its baseline IR comp. Floor is real, ceiling exists. <strong>Best low-cost spec in the set.</strong>",
    "🎴 <strong>Mega Darkrai ex Ultra Rare (#99/081):</strong> At a projected $40–$80, the full-art Ultra Rare is the lowest-cost full-art entry into the Darkrai market. With four Darkrai cards in the set (base #46, UR #99, SIR #114, gold MHR #118), rainbow collectors need this copy — layered demand keeps the floor real while the SIR sets the ceiling. <strong>Best low-cost spec in the set.</strong>")
rep('🌕 <strong>Lunala ex IR:</strong> Lunala is Cosmog\'s evolved form, deeply tied to the Moon/Dark aesthetic of Pitch Black\'s theme, and has a devoted fanbase from Sun/Moon-era nostalgia. The IR is projected at $15–$40 pre-release — if the artwork is strong, Lunala IR could follow Glaceon IR in Prismatic Evolutions and trade well above its pull-rate expectation. Glaceon IR hit $450 despite being "just" an IR. Darkrai-adjacent Pokémon with good artwork carry a real premium. <strong>Risky but asymmetric — buy one.</strong>',
    "🌕 <strong>Gwynn — Trainer SIR (#117/081):</strong> New trainer characters with strong SIR art have a habit of outrunning their projections once character collectors find them. Gwynn debuts in this set, projected $80–$150 pre-release — a thin initial supply of graded copies plus a new-character fanbase is exactly the setup that produces asymmetric moves. <strong>Risky but asymmetric — buy one.</strong>")
rep("🕯 <strong>Gengar ex from the set:</strong> Gengar is typically in the background of Dark-themed sets and consistently outperforms expectations. If there's a Gengar ex SIR or full-art inclusion in Pitch Black (unconfirmed), it will immediately be in the top 3 most wanted cards regardless of position on the checklist. Ghost-type collector crossover with Dark-type theme is automatic demand. Watch prerelease card reveals closely — if Gengar shows up with strong artwork, it's a buy immediately.",
    "🕯 <strong>Japanese Abyss Eye singles arbitrage:</strong> the JP set has been out since May 22, so JP copies of the same chase cards (Mega Darkrai SIR, Zeraora SIR) already trade with real price history — typically below English launch prices. If English launch premiums run hot, JP copies are the disciplined way to own the card while English prices settle. Confirmed: there is no Gengar in ME05 — don't chase that rumor.")

# ── Watch item + avoid item + disclosure ─────────────────────────────────────
rep("Japan tournament data from Shadow Surge showed Darkrai ex in top cuts — watch the first major English Mega Evolution tournament result in August.",
    "Watch JP tournament results since Abyss Eye's May release, then the first major English Mega Evolution event in August.")
rep("<strong>Non-chase SIRs at launch premiums</strong> — Mega Absol ex SIR and the Trainer SIR will both see launch-week inflation. The actual settled prices for these — $60–$110 range — reflect their relative fan bases accurately. Don't pay $150+ for an Absol SIR at launch hype because it's in the same set as Darkrai.",
    "<strong>Non-chase SIRs at launch premiums</strong> — Morpeko ex SIR and the two Trainer SIRs (Gwynn, Gladion&#39;s Decisive Battle) will all see launch-week inflation. The settled prices for these — roughly $60–$150 — reflect their fan bases accurately. Don't pay double at launch hype just because they share a set with Darkrai.")
rep("based on prerelease auction data, Japan's Shadow Surge comps, and Chaos Rising launch patterns",
    "based on prerelease data, Japan's Abyss Eye comps, and Chaos Rising launch patterns")

# ── Apply with assertions ────────────────────────────────────────────────────
errs = 0
for old, new in R:
    n = html.count(old)
    if n != 1:
        print(f"[{'MISSING' if n==0 else f'x{n}'}] {old[:90]!r}")
        errs += 1
    else:
        html = html.replace(old, new, 1)
if errs:
    print(f"\n{errs} replacement(s) failed — file NOT written.")
    sys.exit(1)

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(html)
print(f"OK — {len(R)} replacements applied to {PATH}")
