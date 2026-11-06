#!/usr/bin/env python3
"""Map Git changes to likely AGENTS.md and README.md documentation owners."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any


def run_git(root: Path, args: list[str]) -> bytes:
    try:
        result = subprocess.run(
            ["git", *args], cwd=root, check=True, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("Git executable was not found on PATH") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(detail or f"git {' '.join(args)} failed") from exc
    return result.stdout


def parse_name_status_z(raw: bytes) -> list[dict[str, str]]:
    """Parse `git diff --name-status -z`, including rename/copy records."""
    fields = raw.decode("utf-8", errors="surrogateescape").split("\0")
    changes: list[dict[str, str]] = []
    index = 0
    while index < len(fields):
        status = fields[index]
        index += 1
        if not status:
            continue
        if status[0] in {"R", "C"}:
            if index + 1 >= len(fields):
                break
            old_path, new_path = fields[index], fields[index + 1]
            index += 2
            changes.append({"status": status, "path": new_path, "previous_path": old_path})
        else:
            if index >= len(fields):
                break
            path = fields[index]
            index += 1
            changes.append({"status": status, "path": path})
    return changes


def nearest_agents(root: Path, changed_path: Path) -> str | None:
    parent = changed_path.parent
    current = root / parent
    while True:
        candidate = current / "AGENTS.md"
        if candidate.is_file():
            return candidate.relative_to(root).as_posix()
        if current == root:
            return None
        if root not in current.parents:
            return None
        current = current.parent


def ancestor_readmes(root: Path, changed_path: Path) -> list[str]:
    parent = changed_path.parent
    current = root / parent
    found: list[str] = []
    while True:
        candidate = current / "README.md"
        if candidate.is_file():
            found.append(candidate.relative_to(root).as_posix())
        if current == root:
            break
        if root not in current.parents:
            break
        current = current.parent
    return found


def collect_changes(root: Path, base: str | None, staged: bool, include_untracked: bool) -> list[dict[str, str]]:
    if base and staged:
        raise ValueError("--base and --staged cannot be used together")
    if base:
        diff_args = ["diff", "--name-status", "-z", f"{base}...HEAD"]
    elif staged:
        diff_args = ["diff", "--cached", "--name-status", "-z", "HEAD"]
    else:
        diff_args = ["diff", "--name-status", "-z", "HEAD"]
    changes = parse_name_status_z(run_git(root, diff_args))

    if include_untracked and not staged:
        untracked_raw = run_git(root, ["ls-files", "--others", "--exclude-standard", "-z"])
        existing = {item["path"] for item in changes}
        for path in untracked_raw.decode("utf-8", errors="surrogateescape").split("\0"):
            if path and path not in existing:
                changes.append({"status": "?", "path": path})
    return sorted(changes, key=lambda item: item["path"].lower())


def enrich(root: Path, changes: list[dict[str, str]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for item in changes:
        rel = Path(item["path"])
        owning_agents = nearest_agents(root, rel)
        readmes = ancestor_readmes(root, rel)
        record: dict[str, Any] = {
            **item,
            "owning_agents_md": owning_agents,
            "ancestor_readmes": readmes,
            "documentation_file": rel.name.lower() in {"agents.md", "readme.md", "claude.md", "gemini.md"},
        }
        result.append(record)
    return result


def render_text(root: Path, base: str | None, staged: bool, changes: list[dict[str, Any]]) -> str:
    scope = f"{base}...HEAD" if base else ("staged changes vs HEAD" if staged else "working tree vs HEAD")
    lines = [f"# Changed files: `{root}`", "", f"Comparison: `{scope}`", ""]
    if not changes:
        lines.append("No changes detected.")
        return "\n".join(lines)
    for item in changes:
        previous = f" (from `{item['previous_path']}`)" if "previous_path" in item else ""
        lines.append(f"- `{item['status']}` `{item['path']}`{previous}")
        lines.append(f"  - Nearest AGENTS.md: `{item['owning_agents_md']}`" if item["owning_agents_md"] else "  - Nearest AGENTS.md: **not found**")
        lines.append("  - Ancestor README candidates: " + (", ".join(f"`{x}`" for x in item["ancestor_readmes"]) or "none"))
        if item["documentation_file"]:
            lines.append("  - Changed documentation file: review inbound links and adjacent ownership rules")
    lines += ["", "> These are impact candidates only. A changed source file does not automatically require a documentation edit."]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", help="Git repository root (default: current directory)")
    parser.add_argument("--base", help="Compare merge-base(base, HEAD) to HEAD")
    parser.add_argument("--staged", action="store_true", help="Inspect only staged changes")
    parser.add_argument("--include-untracked", action=argparse.BooleanOptionalAction, default=True,
                        help="Include untracked non-ignored files (default: true)")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    args = parser.parse_args()
    root = Path(args.root).expanduser().resolve()
    if not root.is_dir():
        parser.error(f"root is not a directory: {root}")
    try:
        raw_changes = collect_changes(root, args.base, args.staged, args.include_untracked)
        changes = enrich(root, raw_changes)
    except (RuntimeError, ValueError) as exc:
        parser.error(str(exc))
    if args.format == "json":
        print(json.dumps({"root": str(root), "base": args.base, "staged": args.staged, "changes": changes}, indent=2, ensure_ascii=False))
    else:
        print(render_text(root, args.base, args.staged, changes))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
