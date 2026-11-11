#!/usr/bin/env python3
"""Expand a compact Bowman class universe file back to its original form.

Usage: python3 expand.py BOW13-universe.compact.json [out.json]
       (no out path -> writes to stdout)

Compact rule (see the file's "_compact" key):
  * top-level "noteDefault" = the most common row note string, verbatim
  * a row with no "note" and no "noteExtra" key had note == noteDefault
  * a row with "noteExtra" had note == noteDefault + "; " + noteExtra
  * a row with "note" kept its note verbatim
  * a row with no "pcPath" key had "pcPath": null (top-level "pcPathDefault")
  * minified JSON
Original key order: top level = original keys (the three compact keys are
removed); in each row "pcPath" sits right after "firstAuto" and "note" is
the last key. The original text is re-emitted as json.dumps(indent=N,
ensure_ascii=False) where N and a trailing newline come from the "_format"
key (default: indent 1, no trailing newline).
"""
import json
import sys

COMPACT_KEYS = ("_compact", "_format", "noteDefault", "pcPathDefault")


def expand_row(row, note_default, pc_default):
    out = {}
    for k, v in row.items():
        if k == "noteExtra":
            continue
        out[k] = v
        if k == "firstAuto" and "pcPath" not in row:
            out["pcPath"] = pc_default
    if "note" not in row:
        if "noteExtra" in row:
            out["note"] = note_default + "; " + row["noteExtra"]
        else:
            out["note"] = note_default
    return out


def expand(obj):
    note_default = obj["noteDefault"]
    pc_default = obj.get("pcPathDefault")
    out = {}
    for k, v in obj.items():
        if k in COMPACT_KEYS:
            continue
        if k == "rows":
            v = [expand_row(r, note_default, pc_default) for r in v]
        out[k] = v
    return out


def dumps_original(obj, fmt=None):
    fmt = fmt or {}
    text = json.dumps(obj, indent=fmt.get("indent", 1), ensure_ascii=False)
    if fmt.get("trailingNewline"):
        text += "\n"
    return text


def main():
    src = sys.argv[1]
    with open(src, encoding="utf-8") as f:
        obj = json.load(f)
    text = dumps_original(expand(obj), obj.get("_format"))
    if len(sys.argv) > 2:
        with open(sys.argv[2], "w", encoding="utf-8") as f:
            f.write(text)
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
