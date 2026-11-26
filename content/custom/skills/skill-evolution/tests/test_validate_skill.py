"""Regression tests for scripts/validate_skill.py (stdlib unittest only)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))
import validate_skill as VALIDATOR  # noqa: E402


class ValidateSkillTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.skill = self.root / "demo-skill"
        self.skill.mkdir()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def write_skill(self, body: str = "# Demo\n") -> None:
        (self.skill / "SKILL.md").write_text(
            "---\nname: demo-skill\ndescription: A demo skill for validation tests.\n---\n\n" + body,
            encoding="utf-8",
        )

    def test_valid_skill_has_no_errors(self) -> None:
        self.write_skill("# Demo\n\nUse this skill for a test.\n")
        findings = VALIDATOR.validate(self.skill)
        self.assertFalse([item for item in findings if item.level == "ERROR"])

    def test_missing_skill_file_is_an_error(self) -> None:
        findings = VALIDATOR.validate(self.skill)
        self.assertIn("SKILL001", {item.code for item in findings})

    def test_directory_name_must_match_frontmatter(self) -> None:
        self.write_skill()
        path = self.skill / "SKILL.md"
        path.write_text(path.read_text(encoding="utf-8").replace("demo-skill", "other-skill", 1), encoding="utf-8")
        findings = VALIDATOR.validate(self.skill)
        self.assertIn("FM004", {item.code for item in findings})

    def test_missing_local_reference_is_an_error(self) -> None:
        self.write_skill("# Demo\n\nRead [guide](references/missing.md).\n")
        findings = VALIDATOR.validate(self.skill)
        self.assertIn("LINK001", {item.code for item in findings})

    def test_python_syntax_error_is_an_error(self) -> None:
        self.write_skill()
        scripts = self.skill / "scripts"
        scripts.mkdir()
        (scripts / "broken.py").write_text("def broken(:\n    pass\n", encoding="utf-8")
        findings = VALIDATOR.validate(self.skill)
        self.assertIn("PY001", {item.code for item in findings})


if __name__ == "__main__":
    unittest.main()
