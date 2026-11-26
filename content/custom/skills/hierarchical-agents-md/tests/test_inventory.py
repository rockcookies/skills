from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import audit  # noqa: E402
import ctx_common as ctx  # noqa: E402
import inventory  # noqa: E402
import lost_lines  # noqa: E402


def write(root: Path, rel: str, text: str) -> None:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


class CtxCommonTest(unittest.TestCase):
    def test_frontmatter_list_block_and_inline(self) -> None:
        meta, body = ctx.split_frontmatter(
            "---\nname: x\npaths:\n  - 'a/**/*.go'\n  - b/*.ts\ndescription: >-\n  hello\n  world\ntags: [p, q]\n---\nbody")
        self.assertEqual(meta["paths"], ["a/**/*.go", "b/*.ts"])
        self.assertEqual(meta["description"], "hello world")
        self.assertEqual(meta["tags"], ["p", "q"])
        self.assertEqual(body, "body")

    def test_glob_double_star_and_braces(self) -> None:
        files = ["backend/a/b.go", "backend/go.mod", "x.go"]
        self.assertEqual(ctx.glob_matches("backend/**/*.{go,mod}", files), ["backend/a/b.go", "backend/go.mod"])
        self.assertEqual(ctx.glob_matches("**/*.go", files), ["backend/a/b.go", "x.go"])
        self.assertEqual(ctx.glob_matches("*.go", files), ["x.go"])


class InventoryContextTest(unittest.TestCase):
    def test_load_classification_and_skill_split(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write(root, "AGENTS.md", "# root\nrule\n")
            write(root, "backend/AGENTS.md", "# be\n")
            write(root, ".claude/rules/always.md", "no frontmatter\n")
            write(root, ".claude/rules/go.md", "---\npaths:\n  - backend/**/*.go\n---\nrule\n")
            write(root, "skills/s/SKILL.md", "---\nname: s\ndescription: abc\nwhen_to_use: de\n---\nbody text\n")
            write(root, "skills/s/references/r.md", "ref\n")
            items = {i["path"] + ":" + i["kind"]: i for i in inventory.scan_context(root)}
            self.assertEqual(items["AGENTS.md:instruction"]["load"], "every-turn")
            self.assertEqual(items["backend/AGENTS.md:instruction"]["load"], "on-subtree")
            self.assertEqual(items[".claude/rules/always.md:rule"]["load"], "every-turn")
            self.assertEqual(items[".claude/rules/go.md:rule"]["load"], "conditional")
            self.assertEqual(items["skills/s/SKILL.md:skill-description"]["chars"], 5)
            self.assertEqual(items["skills/s/SKILL.md:skill-body"]["load"], "on-demand")
            self.assertEqual(items["skills/s/references/r.md:skill-reference"]["load"], "on-demand")


class AuditGlobTest(unittest.TestCase):
    def test_paths_without_match_warns(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write(root, "AGENTS.md", "# a\n")
            write(root, "src/a.ts", "x")
            write(root, ".claude/rules/ok.md", "---\npaths: src/**/*.ts\n---\nr\n")
            write(root, ".claude/rules/bad.md", "---\npaths:\n  - lib/**/*.go\n---\nr\n")
            hits = [f for f in audit.audit_repository(root)["findings"] if f["code"] == "paths-no-match"]
            self.assertEqual([f["file"] for f in hits], [".claude/rules/bad.md"])


class LostLinesTest(unittest.TestCase):
    def test_moved_lines_not_reported_deleted_lines_are(self) -> None:
        old = {"AGENTS.md": ["keep", "moved line", "deleted line", "  ", "---"]}
        new = {"AGENTS.md": ["keep"], "docs/x.md": ["moved   line"]}
        result = lost_lines.compare(old, new)
        self.assertEqual([t for _, _, t in result["lost"]], ["deleted line"])
        self.assertEqual(result["moved"], 1)


if __name__ == "__main__":
    unittest.main()
