"""Collect reviewed, committed change fragments without generating prose."""
from pathlib import Path
import subprocess


def git(root, *args):
    return subprocess.check_output(["git", *args], cwd=root, encoding="utf-8").strip()


def collect(root, base=None, head="HEAD"):
    folder = "docs/changes/"
    current = git(root, "ls-tree", "-r", "--name-only", head, "--", folder).splitlines()
    previous = set(git(root, "ls-tree", "-r", "--name-only", base, "--", folder).splitlines()) if base else set()
    if base:
        git(root, "merge-base", "--is-ancestor", base, head)
        changed = git(root, "diff", "--name-only", base, head, "--", folder).splitlines()
        for name in changed:
            if name not in previous or not name.endswith(".md") or name.endswith("/README.md"):
                continue
            # Repair an accidentally edited record without making subsequent
            # CI runs permanently unfixable. Only its original Git blob qualifies.
            additions = git(root, "log", "--format=%H", "--diff-filter=A", base, "--", name).splitlines()
            if (name in current and additions
                    and git(root, "rev-parse", f"{head}:{name}") == git(root, "rev-parse", f"{additions[-1]}:{name}")):
                continue
            raise ValueError(f"Keep existing change records immutable; add a new fragment instead: {name}")
    entries = []
    for name in sorted(set(current) - previous):
        if not name.endswith(".md") or name.endswith("/README.md"):
            continue
        text = git(root, "show", f"{head}:{name}").lstrip("\ufeff").strip()
        if not text:
            raise ValueError(f"Empty change record: {name}")
        entries.append(text)
    if not entries:
        raise ValueError("Add a reviewed docs/changes/*.md record (explicitly describe internal maintenance if applicable)")
    return "\n\n".join(entries)


def main():
    import argparse
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--base")
    ap.add_argument("--head", default="HEAD")
    args = ap.parse_args()
    collect(Path(__file__).resolve().parents[1], args.base, args.head)
    print("Reviewed change records are present and valid.")


if __name__ == "__main__":
    main()
