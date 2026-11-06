#!/usr/bin/env python3
"""Read-only static audit for AGENTS.md, README.md, and Markdown documentation."""
from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit

IGNORED_DIRS = {
    ".git", ".hg", ".svn", ".idea", ".vscode", ".venv", "venv", "env",
    "node_modules", "vendor", "dist", "build", "coverage", "target", "bin",
    "tmp", ".cache", ".next", ".nuxt", ".turbo", "__pycache__", ".pytest_cache",
}
INLINE_LINK_RE = re.compile(r"!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)")
HEADING_RE = re.compile(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$")


def markdown_files(root: Path) -> list[Path]:
    found: list[Path] = []
    for current, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = sorted(
            d for d in dirs
            if d not in IGNORED_DIRS and not (Path(current) / d).is_symlink()
        )
        for filename in files:
            if filename.lower().endswith(".md"):
                path = Path(current) / filename
                if not path.is_symlink() and path.is_file():
                    found.append(path)
    return sorted(found, key=lambda p: p.as_posix().lower())


def _inside_fence(line: str, fence_char: str | None, fence_len: int) -> tuple[str | None, int]:
    stripped = line.lstrip()
    marker = re.match(r"(`{3,}|~{3,})", stripped)
    if marker:
        token = marker.group(1)
        if fence_char is None:
            return token[0], len(token)
        if token[0] == fence_char and len(token) >= fence_len:
            return None, 0
    return fence_char, fence_len


def extract_inline_links(text: str) -> list[tuple[int, str]]:
    """Return (1-based line number, target) for common inline links/images."""
    links: list[tuple[int, str]] = []
    fence_char: str | None = None
    fence_len = 0
    for line_number, line in enumerate(text.splitlines(), start=1):
        before = fence_char
        fence_char, fence_len = _inside_fence(line, fence_char, fence_len)
        if before is not None or fence_char is not None:
            continue
        for match in INLINE_LINK_RE.finditer(line):
            target = match.group(1)
            if target.startswith("<") and target.endswith(">"):
                target = target[1:-1]
            links.append((line_number, target))
    return links


def _slug_heading(text: str) -> str:
    text = re.sub(r"[`*_~]", "", text).strip().lower()
    text = re.sub(r"[^\w\-\s]", "", text, flags=re.UNICODE)
    return re.sub(r"\s+", "-", text)


def heading_slugs(text: str) -> set[str]:
    slugs: set[str] = set()
    fence_char: str | None = None
    fence_len = 0
    for line in text.splitlines():
        before = fence_char
        fence_char, fence_len = _inside_fence(line, fence_char, fence_len)
        if before is not None or fence_char is not None:
            continue
        match = HEADING_RE.match(line)
        if match:
            slugs.add(_slug_heading(match.group(2)))
    return slugs


def inspect_link(root: Path, source: Path, line_number: int, target: str) -> dict[str, Any] | None:
    parsed = urlsplit(target)
    if parsed.scheme or target.startswith("//"):
        return None
    path_text = unquote(parsed.path)
    if not path_text:
        return None  # Fragment-only links are intentionally not validated here.
    if path_text.startswith("/"):
        destination = root / path_text.lstrip("/")
    else:
        destination = source.parent / path_text
    destination = destination.resolve()
    try:
        destination.relative_to(root)
    except ValueError:
        return {
            "severity": "error", "code": "link-outside-root", "file": source.relative_to(root).as_posix(),
            "line": line_number, "message": f"Local link escapes repository root: {target}",
        }
    if not destination.exists():
        return {
            "severity": "error", "code": "broken-link", "file": source.relative_to(root).as_posix(),
            "line": line_number, "message": f"Local link target does not exist: {target}",
        }
    return None


def audit_repository(root: Path, max_agents_lines: int = 120, max_readme_lines: int = 400) -> dict[str, Any]:
    docs = markdown_files(root)
    findings: list[dict[str, Any]] = []
    agents_files: list[Path] = []

    for path in docs:
        rel = path.relative_to(root).as_posix()
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            findings.append({
                "severity": "warning", "code": "non-utf8-markdown", "file": rel,
                "line": 1, "message": "Markdown file is not valid UTF-8; skipped content checks.",
            })
            continue
        line_count = len(content.splitlines())
        lower_name = path.name.lower()
        if lower_name == "agents.md":
            agents_files.append(path)
            if max_agents_lines > 0 and line_count > max_agents_lines:
                findings.append({
                    "severity": "warning", "code": "agents-too-long", "file": rel,
                    "line": line_count, "message": f"{line_count} lines exceeds the review threshold ({max_agents_lines}). Consider routing detail to references/docs/.",
                })
            seen: dict[str, int] = {}
            fence_char: str | None = None
            fence_len = 0
            for line_number, line in enumerate(content.splitlines(), start=1):
                before = fence_char
                fence_char, fence_len = _inside_fence(line, fence_char, fence_len)
                if before is not None or fence_char is not None:
                    continue
                match = HEADING_RE.match(line)
                if match:
                    heading = re.sub(r"\s+", " ", match.group(2)).strip().lower()
                    if heading in seen:
                        findings.append({
                            "severity": "warning", "code": "duplicate-heading", "file": rel,
                            "line": line_number, "message": f"Heading duplicates line {seen[heading]}: {match.group(2).strip()}",
                        })
                    else:
                        seen[heading] = line_number
        elif lower_name == "readme.md" and max_readme_lines > 0 and line_count > max_readme_lines:
            findings.append({
                "severity": "warning", "code": "readme-too-long", "file": rel,
                "line": line_count, "message": f"{line_count} lines exceeds the review threshold ({max_readme_lines}). Consider linking to focused docs.",
            })

        for line_number, target in extract_inline_links(content):
            finding = inspect_link(root, path, line_number, target)
            if finding:
                findings.append(finding)

    root_agents = root / "AGENTS.md"
    if agents_files and any(path.parent != root for path in agents_files) and not root_agents.is_file():
        findings.append({
            "severity": "warning", "code": "missing-root-agents", "file": ".",
            "line": 1, "message": "Nested AGENTS.md files exist but the repository has no root AGENTS.md. Confirm that this is intentional.",
        })

    findings.sort(key=lambda f: (0 if f["severity"] == "error" else 1, f["file"].lower(), f["line"], f["code"]))
    return {
        "root": str(root),
        "summary": {
            "markdown_files": len(docs),
            "agents_md_files": len(agents_files),
            "errors": sum(f["severity"] == "error" for f in findings),
            "warnings": sum(f["severity"] == "warning" for f in findings),
        },
        "findings": findings,
    }


def render_text(result: dict[str, Any]) -> str:
    summary = result["summary"]
    lines = [
        f"# Markdown audit: `{result['root']}`", "",
        f"- Markdown files: {summary['markdown_files']}",
        f"- AGENTS.md files: {summary['agents_md_files']}",
        f"- Errors: {summary['errors']}",
        f"- Warnings: {summary['warnings']}", "",
    ]
    if not result["findings"]:
        lines.append("No static findings.")
    else:
        for finding in result["findings"]:
            lines.append(
                f"- **{finding['severity'].upper()}** `{finding['file']}:{finding['line']}` "
                f"`{finding['code']}` — {finding['message']}"
            )
    lines += ["", "> A clean static audit does not establish semantic correctness or documentation freshness."]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", help="Repository root (default: current directory)")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--max-agents-lines", type=int, default=120,
                        help="Warn above this many AGENTS.md lines; 0 disables (default: 120)")
    parser.add_argument("--max-readme-lines", type=int, default=400,
                        help="Warn above this many README.md lines; 0 disables (default: 400)")
    args = parser.parse_args()
    root = Path(args.root).expanduser().resolve()
    if not root.is_dir():
        parser.error(f"root is not a directory: {root}")
    if args.max_agents_lines < 0 or args.max_readme_lines < 0:
        parser.error("line thresholds must be >= 0")
    result = audit_repository(root, args.max_agents_lines, args.max_readme_lines)
    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(render_text(result))
    return 1 if result["summary"]["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
