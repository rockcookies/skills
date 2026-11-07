#!/usr/bin/env python3
"""Lightweight, dependency-free structural validator for an Agent Skill directory."""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LINK_PATTERN = re.compile(r"(?<!!)\[[^\]]*\]\(([^)]+)\)")


@dataclass
class Finding:
    level: str
    code: str
    message: str
    path: str | None = None
    line: int | None = None


def add(findings: list[Finding], level: str, code: str, message: str,
        path: Path | None = None, line: int | None = None) -> None:
    findings.append(Finding(level, code, message, str(path) if path else None, line))


def parse_frontmatter(text: str) -> tuple[dict[str, str], str | None]:
    if text.startswith("\ufeff"):
        return {}, "SKILL.md must not start with a UTF-8 BOM"
    if not text.startswith("---\n") and not text.startswith("---\r\n"):
        return {}, "SKILL.md must begin with YAML frontmatter delimited by ---"

    lines = text.splitlines()
    closing = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if closing is None:
        return {}, "YAML frontmatter closing --- was not found"

    # Parse only the two required scalar fields. This intentionally avoids a YAML dependency.
    fields: dict[str, str] = {}
    for line in lines[1:closing]:
        match = re.match(r"^(name|description):\s*(.*?)\s*$", line)
        if match:
            value = match.group(2).strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
                value = value[1:-1]
            fields[match.group(1)] = value
    return fields, None


def markdown_links(skill_dir: Path, text: str) -> Iterable[tuple[int, str]]:
    for line_number, line in enumerate(text.splitlines(), start=1):
        for match in LINK_PATTERN.finditer(line):
            destination = match.group(1).strip().split(maxsplit=1)[0].strip("<>")
            if not destination or destination.startswith(("http://", "https://", "mailto:", "#")):
                continue
            destination = destination.split("#", 1)[0].split("?", 1)[0]
            if destination:
                yield line_number, destination


def validate(skill_dir: Path) -> list[Finding]:
    findings: list[Finding] = []
    skill_file = skill_dir / "SKILL.md"

    if not skill_dir.exists() or not skill_dir.is_dir():
        add(findings, "ERROR", "PATH001", "Skill directory does not exist or is not a directory", skill_dir)
        return findings
    if not skill_file.is_file():
        add(findings, "ERROR", "SKILL001", "Required SKILL.md file is missing", skill_file)
        return findings

    try:
        content = skill_file.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        add(findings, "ERROR", "SKILL002", f"Cannot read SKILL.md: {exc}", skill_file)
        return findings

    fields, error = parse_frontmatter(content)
    if error:
        add(findings, "ERROR", "FM001", error, skill_file)
        return findings

    name = fields.get("name", "")
    description = fields.get("description", "")
    if not name:
        add(findings, "ERROR", "FM002", "Required frontmatter field 'name' is missing", skill_file)
    elif len(name) > 64 or not NAME_PATTERN.fullmatch(name):
        add(findings, "ERROR", "FM003", "name must be 1-64 chars: lowercase letters, digits, and single hyphens", skill_file)
    elif name != skill_dir.name:
        add(findings, "ERROR", "FM004", f"name '{name}' must match directory name '{skill_dir.name}'", skill_file)

    if not description:
        add(findings, "ERROR", "FM005", "Required frontmatter field 'description' is missing", skill_file)
    elif len(description) > 1024:
        add(findings, "ERROR", "FM006", "description must not exceed 1024 characters", skill_file)

    body = content.split("---", 2)[-1] if content.count("---") >= 2 else ""
    if not re.search(r"^#{1,6}\s+\S", body, flags=re.MULTILINE):
        add(findings, "WARN", "BODY001", "Skill body should contain at least one Markdown heading", skill_file)

    line_count = len(content.splitlines())
    if line_count > 500:
        add(findings, "WARN", "BODY002", f"SKILL.md has {line_count} lines; consider moving detailed guidance into references/", skill_file)

    for line_number, destination in markdown_links(skill_dir, content):
        candidate = (skill_dir / destination).resolve()
        try:
            candidate.relative_to(skill_dir.resolve())
        except ValueError:
            add(findings, "WARN", "LINK002", f"Local link escapes the Skill directory: {destination}", skill_file, line_number)
            continue
        if not candidate.exists():
            add(findings, "ERROR", "LINK001", f"Referenced local path does not exist: {destination}", skill_file, line_number)

    scripts_dir = skill_dir / "scripts"
    if scripts_dir.is_dir():
        for script in sorted(scripts_dir.rglob("*.py")):
            try:
                source = script.read_text(encoding="utf-8")
                ast.parse(source, filename=str(script))
            except (OSError, UnicodeError, SyntaxError) as exc:
                add(findings, "ERROR", "PY001", f"Python syntax/read error: {exc}", script)

    if not any(item.level == "ERROR" for item in findings):
        add(findings, "PASS", "SKILL000", "No structural errors detected. Workflow quality and runtime behavior still require separate review.", skill_file)
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skill_dir", nargs="?", default=".", help="Path to the Skill directory (default: current directory)")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args()

    skill_dir = Path(args.skill_dir).expanduser().resolve()
    findings = validate(skill_dir)
    errors = sum(item.level == "ERROR" for item in findings)
    warnings = sum(item.level == "WARN" for item in findings)

    if args.json:
        print(json.dumps({
            "skill_dir": str(skill_dir),
            "summary": {"errors": errors, "warnings": warnings},
            "findings": [asdict(item) for item in findings],
        }, ensure_ascii=False, indent=2))
    else:
        for item in findings:
            location = item.path or ""
            if item.line is not None:
                location += f":{item.line}"
            prefix = f"{location}: " if location else ""
            print(f"[{item.level}] {item.code}: {prefix}{item.message}")
        print(f"\nSummary: {errors} error(s), {warnings} warning(s)")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
