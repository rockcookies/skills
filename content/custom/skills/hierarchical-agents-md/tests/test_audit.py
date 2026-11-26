from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import audit  # noqa: E402


class AuditHelpersTest(unittest.TestCase):
    def test_extract_inline_links_ignores_fenced_code(self) -> None:
        content = """# Title

[good](docs/guide.md)

```md
[not-a-link](missing.md)
```

![image](assets/diagram.svg)
"""
        self.assertEqual(
            audit.extract_inline_links(content),
            [(3, "docs/guide.md"), (9, "assets/diagram.svg")],
        )

    def test_heading_slugs_ignores_fenced_code(self) -> None:
        content = """# Real Heading

~~~
## Not a heading
~~~

## Another Heading
"""
        self.assertEqual(audit.heading_slugs(content), {"real-heading", "another-heading"})

    def test_audit_finds_broken_link_and_duplicate_agent_heading(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "AGENTS.md").write_text(
                "# Instructions\n\n## Rules\n\n[missing](does-not-exist.md)\n\n## Rules\n",
                encoding="utf-8",
            )
            result = audit.audit_repository(root)
            codes = [finding["code"] for finding in result["findings"]]
            self.assertIn("broken-link", codes)
            self.assertIn("duplicate-heading", codes)
            self.assertEqual(result["summary"]["errors"], 1)

    def test_nested_agents_without_root_agents_emits_warning(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            nested = root / "backend"
            nested.mkdir()
            (nested / "AGENTS.md").write_text("# Backend\n", encoding="utf-8")
            result = audit.audit_repository(root)
            codes = [finding["code"] for finding in result["findings"]]
            self.assertIn("missing-root-agents", codes)

    def test_absolute_repository_link_is_checked_from_root(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs"
            docs.mkdir()
            source = root / "README.md"
            (docs / "guide.md").write_text("# Guide\n", encoding="utf-8")
            finding = audit.inspect_link(root, source, 1, "/docs/guide.md")
            self.assertIsNone(finding)


if __name__ == "__main__":
    unittest.main()
