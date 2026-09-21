#!/usr/bin/env bash
# Vercel "Ignored Build Step" — exit 0 = SKIP the build, exit 1 = BUILD.
# Added 2026-09-21 (Mo: too many runs are causing issues with the site). 68 of the 110 commits in the
# week to Sep 21 touched only docs, the pipeline ledger, tooling or workflows — every one of them
# queued a production build on the Hobby plan's one-at-a-time queue, which is how the Sep 18 zombie
# build and the stale-older-build near-regression happened. Now a commit builds only if it changes
# something a visitor can load.
#
# Fail-safe: any git error → BUILD. Compares against the last deployed commit when Vercel gives it to
# us (so a docs commit still builds if the site commit before it was skipped by a missed webhook),
# else HEAD^.
set -u
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  BASE="HEAD^"
fi
if ! git rev-parse --verify -q "$BASE" >/dev/null; then
  echo "vercel-ignore: no base commit — building"; exit 1
fi
# Paths that never change what the site serves.
if git diff --quiet "$BASE" HEAD -- . \
     ':(exclude)claude' \
     ':(exclude)tools' \
     ':(exclude).github' \
     ':(exclude)data/pipeline.json' \
     ':(exclude)*.md' \
     ':(exclude).gitignore' \
     ':(exclude)package-lock.json'; then
  echo "vercel-ignore: only docs/tooling changed since $BASE — skipping build"; exit 0
fi
echo "vercel-ignore: site files changed since $BASE — building"; exit 1
