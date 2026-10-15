# Hotfix · Fischer image crop + stale hype copy — Sep 3 2026

Reported by Mo (homepage Fischer image cropped; site hyping Fischer while X faded him). Diagnosed, patched and verified in the cloud clone (base 965bb4d). **Not yet committed — needs a Mac-linked run.**

## Diagnosis
1. **Image crop:** the nightly engine picked a **landscape front+back composite** listing photo for `ebay:andrew-fischer` (`i.ebayimg.com/images/g/OkIAAeSwMk1qmNvj`, 500×347). Every `.sch-cimg` slot is portrait with `object-fit:cover`, so the browser center-crops it to a sliver of two card edges — that's the glitch on the homepage top-5 row (and the same image renders on /bowman-bangers entry 03).
2. **Messaging:** board, verdict and X all agree (Sep 1: three red weeks, dip call suspended, HOLD). The only contradiction was the **essay lede** on /bowman-bangers entry 03, still reading "The value call of this class… this is now a momentum name" from the July re-rate. Stale copy, not a call conflict. The call itself is untouched.

## Patch (verified; screenshots in the Sep 3 session)
- `js/card-img.js`: on load, if `naturalWidth > naturalHeight × 1.05`, add `is-wide`; new CSS rule `.sch-cimg img.is-wide{object-fit:contain}`. Letterboxes any landscape photo on the dark slot background instead of cover-cropping — fixes the whole class of glitch site-wide, all pages, no markup changes.
- `bowman-bangers.html` entry 03: lede → "The June value call already cashed — now it's a hold while the price cools."; closing line → "…after three straight down weeks the price is cooling, so this is a name you hold, not chase. The verdict below has the details." (Hold-oriented plain language per Mo's Aug 21 rule; facts unchanged.)

```diff
--- a/bowman-bangers.html
+++ b/bowman-bangers.html
@@ (entry 03, .entry-body)
-        <strong>The value call of this class &mdash; and it already cashed.</strong> Fischer is a pure power threat at third base — he set Duke's freshman home run record and the power transferred immediately to pro ball. Scout projections of a 25-homer ceiling are conservative if his bat speed continues to optimize. The Italy WBC connection adds an international storyline that opens him to a wider collector audience.
+        <strong>The June value call already cashed &mdash; now it&rsquo;s a hold while the price cools.</strong> Fischer is a pure power threat at third base — he set Duke's freshman home run record and the power transferred immediately to pro ball. Scout projections of a 25-homer ceiling are conservative if his bat speed continues to optimize. The Italy WBC connection adds an international storyline that opens him to a wider collector audience.
         <br><br>
-        With Topps producing a new Purple /250 full-name auto parallel for 2026 Bowman, Fischer's low-numbered autos re-rated with the base auto (his Packfractor /89 now outsells Holliday's). The June discount is gone &mdash; this is now a momentum name, not a value entry.
+        With Topps producing a new Purple /250 full-name auto parallel for 2026 Bowman, Fischer's low-numbered autos re-rated with the base auto (his Packfractor /89 now outsells Holliday's). The June discount is gone &mdash; and after three straight down weeks the price is cooling, so this is a name you hold, not chase. The verdict below has the details.
--- a/js/card-img.js
+++ b/js/card-img.js
@@ (real.onload)
         imgEl.src = src; imgEl.classList.add('is-photo');
+        // A landscape listing photo (e.g. a front+back composite) in a portrait slot
+        // gets center-cropped to a sliver by object-fit:cover - letterbox it instead.
+        if (real.naturalWidth > real.naturalHeight * 1.05) imgEl.classList.add('is-wide');
@@ (css string)
     '.sch-cimg img.is-photo{animation:sch-cimg-in .4s ease both}' +
+    '.sch-cimg img.is-wide{object-fit:contain}' +
```

## Follow-ups (queued in STATE)
- **Engine (permanent cure):** the nightly image picker should prefer portrait photos — check candidate image aspect (fetch the s-l64 thumb, measure) and skip landscape/composite shots when a portrait candidate exists; fall through to the next listing otherwise. Owner: weekly run (test against the Action before committing). Letterboxing stays as the safety net.
- **Consistency sweep (Mo's "little things slip" point):** per-entry check that verdict stance and essay lede agree (a HOLD/suspended verdict must not sit under "momentum name"/"buy the dip" copy), plus homepage tag vs board stance. Added to Content Editor's brief (CHARTER §2) and the weekly checklist.

## Rollback
Single commit; `git revert <sha>`.
