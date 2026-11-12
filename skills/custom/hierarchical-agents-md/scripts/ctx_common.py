"""Shared helpers for agent-context scanning (stdlib only, read-only)."""
from __future__ import annotations

import os
import re
from pathlib import Path

IGNORED_DIRS = {
    ".git", ".hg", ".svn", ".idea", ".vscode", ".venv", "venv", "env",
    "node_modules", "vendor", "dist", "build", "coverage", "target", "bin",
    "tmp", ".cache", ".next", ".nuxt", ".turbo", "__pycache__", ".pytest_cache",
}
_KEY_RE = re.compile(r"^([A-Za-z_][\w-]*):\s*(.*)$")


def list_files(root: Path) -> list[str]:
    """Repo-relative POSIX paths of regular files, skipping ignored dirs/symlinks."""
    found: list[str] = []
    for current, dirs, files in os.walk(root, followlinks=False):
        cur = Path(current)
        dirs[:] = sorted(d for d in dirs if d not in IGNORED_DIRS and not (cur / d).is_symlink())
        for name in sorted(files):
            p = cur / name
            if p.is_file() and not p.is_symlink():
                found.append(p.relative_to(root).as_posix())
    return found


def split_frontmatter(text: str) -> tuple[dict[str, object], str]:
    """Tiny YAML-subset parser: scalars, [a, b], '- item' lists, >/| blocks."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        return {}, text
    meta: dict[str, object] = {}
    i = 1
    while i < end:
        m = _KEY_RE.match(lines[i])
        i += 1
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        block: list[str] = []
        while i < end and (not lines[i].strip() or lines[i][:1] in " \t-"):
            block.append(lines[i])
            i += 1
        if val[:1] in {">", "|"}:
            sep = " " if val[0] == ">" else "\n"
            meta[key] = sep.join(b.strip() for b in block if b.strip())
        elif val == "":
            items = [b.strip()[1:].strip().strip("'\"") for b in block if b.strip().startswith("-")]
            meta[key] = items if items else " ".join(b.strip() for b in block if b.strip())
        elif val.startswith("[") and val.endswith("]"):
            meta[key] = [x.strip().strip("'\"") for x in val[1:-1].split(",") if x.strip()]
        else:
            extra = " ".join(b.strip() for b in block if b.strip())
            meta[key] = (val + (" " + extra if extra else "")).strip("'\"")
    return meta, "\n".join(lines[end + 1:])


def split_commas(value: str) -> list[str]:
    parts, depth, cur = [], 0, ""
    for ch in value:
        depth += ch == "{"
        depth -= ch == "}"
        if ch == "," and depth == 0:
            parts.append(cur.strip())
            cur = ""
        else:
            cur += ch
    parts.append(cur.strip())
    return [p for p in parts if p]


def normalize_globs(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str) and value.strip():
        return split_commas(value)
    return []


def expand_braces(pattern: str) -> list[str]:
    m = re.search(r"\{([^{}]*)\}", pattern)
    if not m:
        return [pattern]
    out: list[str] = []
    for alt in m.group(1).split(","):
        out += expand_braces(pattern[:m.start()] + alt + pattern[m.end():])
    return out


def glob_to_regex(pattern: str) -> re.Pattern[str]:
    pattern = pattern.lstrip("/")
    if pattern.startswith("./"):
        pattern = pattern[2:]
    i, out = 0, ""
    while i < len(pattern):
        if pattern.startswith("**/", i):
            out += "(?:.*/)?"
            i += 3
        elif pattern.startswith("**", i):
            out += ".*"
            i += 2
        elif pattern[i] == "*":
            out += "[^/]*"
            i += 1
        elif pattern[i] == "?":
            out += "[^/]"
            i += 1
        else:
            out += re.escape(pattern[i])
            i += 1
    return re.compile(out + r"\Z")


def glob_matches(pattern: str, files: list[str]) -> list[str]:
    regexes = [glob_to_regex(p) for p in expand_braces(pattern)]
    return [f for f in files if any(r.match(f) for r in regexes)]


def rule_globs(meta: dict[str, object]) -> list[str]:
    """Globs from `paths:` (Claude Code) or `globs:` (Cursor)."""
    return normalize_globs(meta.get("paths") or meta.get("globs"))


def is_rule_file(rel: str) -> bool:
    return bool(re.match(r"(?:.*/)?\.(?:claude|cursor)/rules/.+\.(?:md|mdc)\Z", rel))
