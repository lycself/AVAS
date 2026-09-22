"""Release fragments are selected from real temporary Git history."""
import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location("release_notes_test", Path(__file__).resolve().parents[1] / "packaging/release_notes.py")
notes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notes)


@pytest.fixture
def repo(tmp_path):
    notes.git(tmp_path, "init", "-b", "main")
    notes.git(tmp_path, "config", "user.name", "Test")
    notes.git(tmp_path, "config", "user.email", "test@example.invalid")
    (tmp_path / "docs/changes").mkdir(parents=True)
    return tmp_path


def commit(repo, name, text):
    (repo / "docs/changes" / name).write_text(text, encoding="utf-8")
    notes.git(repo, "add", ".")
    notes.git(repo, "commit", "-m", "technical title must not become notes")
    return notes.git(repo, "rev-parse", "HEAD")


def test_collect_since_success_includes_failed_build_entries(repo):
    base = commit(repo, "old.md", "• 旧说明")
    failed = commit(repo, "one.md", "• 修复显示问题")
    commit(repo, "two.md", "• 增加安装包")
    assert notes.collect(repo, base) == "• 修复显示问题\n\n• 增加安装包"
    assert notes.collect(repo, failed) == "• 增加安装包"
    assert "旧说明" in notes.collect(repo)


def test_missing_empty_and_mutated_records_fail(repo):
    base = commit(repo, "old.md", "• Old")
    with pytest.raises(ValueError, match="Add a reviewed"):
        notes.collect(repo, base)
    commit(repo, "empty.md", "  \n")
    with pytest.raises(ValueError, match="Empty"):
        notes.collect(repo, base)
    commit(repo, "old.md", "changed published prose")
    with pytest.raises(ValueError, match="immutable"):
        notes.collect(repo, base)


def test_readme_is_not_a_release_entry(repo):
    commit(repo, "README.md", "Author instructions")
    with pytest.raises(ValueError, match="Add a reviewed"):
        notes.collect(repo)


def test_restore_original_record_and_move_addition_to_new_fragment(repo):
    original = commit(repo, "old.md", "• Original\n")
    damaged = commit(repo, "old.md", "• Original\n• Added later\n")
    commit(repo, "old.md", "• Original\n")
    with pytest.raises(ValueError, match="Add a reviewed"):
        notes.collect(repo, damaged)
    commit(repo, "repair.md", "• Added later")
    assert notes.collect(repo, damaged) == "• Added later"
    assert notes.collect(repo, original) == "• Added later"


def test_repair_requires_exact_original_blob_and_rejects_deletion(repo):
    commit(repo, "old.md", "• Original\n")
    damaged = commit(repo, "old.md", "• Edited\n")
    commit(repo, "repair.md", "• Repair description")
    commit(repo, "old.md", "• Original\n\n")
    with pytest.raises(ValueError, match="immutable.*old.md"):
        notes.collect(repo, damaged)
    notes.git(repo, "rm", "docs/changes/old.md")
    notes.git(repo, "commit", "-m", "delete fixture")
    with pytest.raises(ValueError, match="immutable.*old.md"):
        notes.collect(repo, damaged)
