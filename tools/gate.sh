#!/usr/bin/env bash
# tools/gate.sh — the three site gates as ONE pass/fail command (R49, 2026-11-25).
#
#   bash tools/gate.sh                     gates on the working tree; exit 1 on any FAIL
#   bash tools/gate.sh --base origin/main  also runs them on that ref and exits 1 if any
#                                          gate's WARN count is above the base (R48 a)
#
# Prints one summary line a lane can paste into its log:
#   GATE PASS · prices 0/63 · site 0/3 · terminal 0/1 · base 63/3/1
# The gates themselves are unchanged: audit-prices, audit-site, audit-terminal (R24).
set -u
cd "$(git rev-parse --show-toplevel)" || exit 2

BASE=""
if [ "${1:-}" = "--base" ]; then BASE="${2:-origin/main}"; fi

# run_gates <dir> → prints "pf pw sf sw tf tw" (FAIL/WARN per gate); 'x' = no summary line found
run_gates() {
  (
    cd "$1" || { echo "x x x x x x"; exit; }
    p=$(node tools/audit-prices.mjs 2>&1 | grep -E 'FAIL: *[0-9]+ +WARN: *[0-9]+' | tail -1)
    s=$(node tools/site-auditor/audit-site.mjs 2>&1 | grep -E 'FAIL: *[0-9]+ · WARN: *[0-9]+' | tail -1)
    t=$(node tools/audit-terminal.mjs --feed data/feed 2>&1 | grep -E 'FAIL: *[0-9]+ · WARN: *[0-9]+' | tail -1)
    for line in "$p" "$s" "$t"; do
      f=$(printf '%s' "$line" | sed -nE 's/.*FAIL: *([0-9]+).*/\1/p')
      w=$(printf '%s' "$line" | sed -nE 's/.*WARN: *([0-9]+).*/\1/p')
      printf '%s %s ' "${f:-x}" "${w:-x}"
    done
    echo
  )
}

read -r PF PW SF SW TF TW <<<"$(run_gates .)"
status="PASS"; why=""
for v in "$PF" "$PW" "$SF" "$SW" "$TF" "$TW"; do
  [ "$v" = "x" ] && { status="FAIL"; why="$why a gate printed no summary line (it crashed);"; break; }
done
if [ "$status" = "PASS" ]; then
  [ "$PF" -eq 0 ] && [ "$SF" -eq 0 ] && [ "$TF" -eq 0 ] || { status="FAIL"; why="$why FAIL count above 0;"; }
fi

basetxt=""
if [ -n "$BASE" ]; then
  tmp=$(mktemp -d)
  if git worktree add --detach "$tmp/base" "$BASE" >/dev/null 2>&1; then
    read -r bPF bPW bSF bSW bTF bTW <<<"$(run_gates "$tmp/base")"
    git worktree remove --force "$tmp/base" >/dev/null 2>&1
    basetxt=" · base $bPW/$bSW/$bTW"
    if [ "$status" = "PASS" ]; then
      if [ "$bPW" = "x" ] || [ "$bSW" = "x" ] || [ "$bTW" = "x" ]; then
        status="FAIL"; why="$why base gates printed no summary;"
      elif [ "$PW" -gt "$bPW" ] || [ "$SW" -gt "$bSW" ] || [ "$TW" -gt "$bTW" ]; then
        status="FAIL"; why="$why WARN count above the base;"
      fi
    fi
  else
    status="FAIL"; why="$why could not check out base ref $BASE;"
  fi
  rm -rf "$tmp"
fi

echo "GATE $status · prices $PF/$PW · site $SF/$SW · terminal $TF/$TW$basetxt${why:+ ·$why}"
[ "$status" = "PASS" ]
