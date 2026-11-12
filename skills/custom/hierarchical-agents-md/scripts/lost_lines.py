#!/usr/bin/env python3
"""List lines that exist in OLD context docs but nowhere in NEW (read-only).

Use after a trim: every vanished line must map to a user-confirmed deletion.
Lines that merely moved are counted, not listed.

  lost_lines.py OLD_DIR NEW_DIR
  lost_lines.py REPO --base REF      # REF (committed) vs working tree
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ctx_common as ctx  # noqa: E402

TEXT_SUFFIXES = {".md", ".mdc", ".toml", ".yaml", ".yml", ".json"}
NOISE_RE = re.compile(r"^(?:[-|:\s`~#>*_=]*)$")


def norm(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip()


def keep(line: str) -> bool:
    return bool(line) and not NOISE_RE.match(line)


def is_text(rel: str) -> bool:
    return Path(rel).suffix.lower() in TEXT_SUFFIXES


def read_dir(root: Path) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for rel in ctx.list_files(root):
        if is_text(rel):
            try:
                out[rel] = (root / rel).read_text(encoding="utf-8").splitlines()
            except (UnicodeDecodeError, OSError):
                pass
    return out


def read_git(root: Path, ref: str) -> dict[str, list[str]]:
    def git(*args: str) -> bytes:
        return subprocess.run(["git", *args], cwd=root, check=True, stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE).stdout

    names = git("ls-tree", "-r", "--name-only", "-z", ref).decode("utf-8", "replace").split("\0")
    out: dict[str, list[str]] = {}
    for rel in filter(None, names):
        if is_text(rel) and not set(rel.split("/")) & ctx.IGNORED_DIRS:
            try:
                out[rel] = git("show", f"{ref}:{rel}").decode("utf-8").splitlines()
            except (subprocess.CalledProcessError, UnicodeDecodeError):
                pass
    return out


def compare(old: dict[str, list[str]], new: dict[str, list[str]]) -> dict[str, object]:
    new_lines = {norm(l) for ls in new.values() for l in ls if keep(norm(l))}
    lost: list[tuple[str, int, str]] = []
    moved = 0
    for rel, lines in sorted(old.items()):
        same_file = {norm(l) for l in new.get(rel, [])}
        for n, raw in enumerate(lines, start=1):
            text = norm(raw)
            if not keep(text) or text in new_lines:
                moved += text in new_lines and text not in same_file
                continue
            lost.append((rel, n, text))
    return {"lost": lost, "moved": moved}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("old", help="OLD directory, or the repo when --base is given")
    ap.add_argument("new", nargs="?", help="NEW directory (omit with --base)")
    ap.add_argument("--base", help="Git ref holding the old state; new = working tree of the repo")
    args = ap.parse_args()
    if args.base:
        root = Path(args.old).expanduser().resolve()
        old, new = read_git(root, args.base), read_dir(root)
    elif args.new:
        old = read_dir(Path(args.old).expanduser().resolve())
        new = read_dir(Path(args.new).expanduser().resolve())
    else:
        ap.error("give OLD NEW, or REPO --base REF")
    result = compare(old, new)
    lost = result["lost"]
    print(f"# Vanished lines: {len(lost)} (moved elsewhere, not listed: {result['moved']})\n")
    for rel, n, text in lost:
        print(f"- `{rel}:{n}` {text}")
    print("\n> Exact-line comparison after whitespace normalization. A reworded line also shows up here;"
          " check meaning, not wording, before restoring.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
