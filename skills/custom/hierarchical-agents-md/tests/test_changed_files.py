from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import changed_files  # noqa: E402


class ChangedFilesHelpersTest(unittest.TestCase):
    def test_parse_name_status_handles_rename_and_delete(self) -> None:
        raw = b"M\0README.md\0R100\0old/name.go\0new/name.go\0D\0gone.txt\0"
        self.assertEqual(
            changed_files.parse_name_status_z(raw),
            [
                {"status": "M", "path": "README.md"},
                {"status": "R100", "path": "new/name.go", "previous_path": "old/name.go"},
                {"status": "D", "path": "gone.txt"},
            ],
        )

    def test_nearest_agents_and_ancestor_readmes(self) -> None:
        root = ROOT / "tests" / "fixtures" / "repo"
        nested = root / "backend" / "billing"
        nested.mkdir(parents=True, exist_ok=True)
        (root / "AGENTS.md").write_text("# Root\n", encoding="utf-8")
        (root / "README.md").write_text("# Root\n", encoding="utf-8")
        (root / "backend" / "AGENTS.md").write_text("# Backend\n", encoding="utf-8")
        (root / "backend" / "README.md").write_text("# Backend\n", encoding="utf-8")
        try:
            changed = Path("backend/billing/invoice.go")
            self.assertEqual(changed_files.nearest_agents(root, changed), "backend/AGENTS.md")
            self.assertEqual(
                changed_files.ancestor_readmes(root, changed),
                ["backend/README.md", "README.md"],
            )
        finally:
            import shutil
            shutil.rmtree(root)
            try:
                root.parent.rmdir()
            except OSError:
                pass


if __name__ == "__main__":
    unittest.main()
