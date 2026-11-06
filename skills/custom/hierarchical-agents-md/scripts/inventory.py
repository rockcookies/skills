#!/usr/bin/env python3
"""Read-only repository inventory for hierarchical documentation maintenance."""
from __future__ import annotations

import argparse
import json
import os
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

IGNORED_DIRS = {
    ".git", ".hg", ".svn", ".idea", ".vscode", ".venv", "venv", "env",
    "node_modules", "vendor", "dist", "build", "coverage", "target", "bin",
    "tmp", ".cache", ".next", ".nuxt", ".turbo", "__pycache__", ".pytest_cache",
}
PROJECT_MARKERS = {
    "go.mod", "go.work", "package.json", "pnpm-workspace.yaml", "yarn.lock",
    "package-lock.json", "pyproject.toml", "requirements.txt", "Pipfile",
    "Cargo.toml", "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle",
    "Gemfile", "composer.json", "mix.exs", "Makefile", "Taskfile.yml", "Taskfile.yaml",
    "Dockerfile", "docker-compose.yml", "compose.yml", "justfile", "mise.toml",
    "deno.json", "deno.jsonc", "bun.lockb", "bun.lock",
}
SOURCE_EXTENSIONS = {
    ".go", ".js", ".jsx", ".ts", ".tsx", ".py", ".rs", ".java", ".kt", ".kts",
    ".rb", ".php", ".cs", ".c", ".h", ".cpp", ".hpp", ".swift", ".scala",
    ".ex", ".exs", ".vue", ".svelte", ".html", ".css", ".scss", ".sql",
}


def walk_files(root: Path, max_depth: int):
    root_depth = len(root.parts)
    for current, dirs, files in os.walk(root, followlinks=False):
        current_path = Path(current)
        depth = len(current_path.parts) - root_depth
        dirs[:] = sorted(
            d for d in dirs
            if d not in IGNORED_DIRS and depth < max_depth
            and not (current_path / d).is_symlink()
        )
        for filename in sorted(files):
            path = current_path / filename
            if path.is_symlink() or not path.is_file():
                continue
            yield path


def build_inventory(root: Path, max_depth: int, max_files_per_dir: int) -> dict[str, Any]:
    markers: list[str] = []
    docs: list[dict[str, str]] = []
    source_counts: dict[str, Counter[str]] = defaultdict(Counter)
    source_examples: dict[str, list[str]] = defaultdict(list)

    for path in walk_files(root, max_depth):
        rel = path.relative_to(root).as_posix()
        name = path.name
        if name in PROJECT_MARKERS:
            markers.append(rel)
        if path.suffix.lower() == ".md":
            kind = "instruction" if name.upper() == "AGENTS.MD" else (
                "readme" if name.upper() == "README.MD" else (
                    "client-instructions" if name.upper() in {"CLAUDE.MD", "GEMINI.MD"} else "markdown"
                )
            )
            docs.append({"path": rel, "kind": kind})
        if path.suffix.lower() in SOURCE_EXTENSIONS:
            parent = path.parent.relative_to(root).as_posix()
            parent = "." if parent == "." else parent
            source_counts[parent][path.suffix.lower()] += 1
            if len(source_examples[parent]) < max_files_per_dir:
                source_examples[parent].append(rel)

    docs.sort(key=lambda item: (item["kind"], item["path"].lower()))
    markers.sort()
    source_dirs = []
    for directory in sorted(source_counts):
        counts = source_counts[directory]
        source_dirs.append({
            "directory": directory,
            "total": sum(counts.values()),
            "extensions": dict(sorted(counts.items())),
            "examples": source_examples[directory],
        })

    return {
        "root": str(root),
        "project_markers": markers,
        "markdown_files": docs,
        "source_directories": source_dirs,
        "summary": {
            "markdown_files": len(docs),
            "agent_instruction_files": sum(d["kind"] == "instruction" for d in docs),
            "readme_files": sum(d["kind"] == "readme" for d in docs),
            "source_files": sum(item["total"] for item in source_dirs),
            "source_directories": len(source_dirs),
        },
        "limits": {"max_depth": max_depth, "max_files_per_dir": max_files_per_dir},
    }


def render_markdown(data: dict[str, Any]) -> str:
    lines = [f"# Repository inventory: `{data['root']}`", ""]
    summary = data["summary"]
    lines += [
        "## Summary",
        f"- Markdown files: {summary['markdown_files']}",
        f"- `AGENTS.md` files: {summary['agent_instruction_files']}",
        f"- `README.md` files: {summary['readme_files']}",
        f"- Source files (selected extensions): {summary['source_files']}",
        f"- Directories containing source files: {summary['source_directories']}",
        "",
        "## Project markers",
    ]
    lines.extend([f"- `{item}`" for item in data["project_markers"]] or ["- None detected"])
    lines += ["", "## Markdown documentation"]
    if data["markdown_files"]:
        for item in data["markdown_files"]:
            lines.append(f"- `{item['path']}` — {item['kind']}")
    else:
        lines.append("- No Markdown files detected")
    lines += ["", "## Source layout (selected extensions)"]
    for item in data["source_directories"]:
        ext_summary = ", ".join(f"{ext}: {count}" for ext, count in item["extensions"].items())
        lines.append(f"- `{item['directory']}/` — {item['total']} files ({ext_summary})")
        for example in item["examples"]:
            lines.append(f"  - `{example}`")
    lines += ["", "> Inventory is approximate and excludes ignored/generated/dependency directories by default."]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", help="Repository root (default: current directory)")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    parser.add_argument("--max-depth", type=int, default=8, help="Maximum directory depth to scan (default: 8)")
    parser.add_argument("--max-files-per-dir", type=int, default=8, help="Example paths per source directory (default: 8)")
    args = parser.parse_args()
    root = Path(args.root).expanduser().resolve()
    if not root.is_dir():
        parser.error(f"root is not a directory: {root}")
    if args.max_depth < 0 or args.max_files_per_dir < 0:
        parser.error("--max-depth and --max-files-per-dir must be >= 0")
    data = build_inventory(root, args.max_depth, args.max_files_per_dir)
    if args.format == "json":
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(render_markdown(data))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
