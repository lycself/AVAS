"""Design rules of the web GUI that code review alone tends to miss.

* Colours come from CSS tokens (``frontend/src/styles/tokens.css``) so both
  themes stay consistent.  Exceptions: neutral black shadows, the files listed
  in ``COLOUR_FILES`` and lines marked ``design:allow-colour`` with a reason.
* Every literal UI string ``t("...")`` has a Chinese translation in
  ``frontend/src/i18n/zh_CN.json``.
* The committed build ``avas/gui/web`` was made from the current front-end
  sources (the Vite build writes ``source-hash.json``; see vite.config.ts).
"""
import hashlib
import json
import os
import re

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(ROOT, "frontend")
SRC = os.path.join(FRONTEND, "src")
WEB = os.path.join(ROOT, "avas", "gui", "web")

# files that may hold literal colours, and why
COLOUR_FILES = {
    "styles/tokens.css": "the colour tokens themselves",
    "components/Plot.tsx": "Plotly needs literal colours: light/dark pairs of the series palette and fallbacks",
    "lattice/monaco.ts": "Monaco themes need hex colours; syntax colours follow VS Code's defaults",
}

HEX = re.compile(r"(?<![\w&#])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])")
FUNC = re.compile(r"\b(?:rgba?|hsla?)\(([^)]*)\)")
SHADOW = re.compile(r"^\s*0\s*,\s*0\s*,\s*0\s*,\s*[\d.]+\s*$")      # rgba(0,0,0,a)
TCALL = re.compile(r"(?<![\w.$])(?:t|tt|tr)\(\s*(\"(?:[^\"\\\n]|\\.)*\"|'(?:[^'\\\n]|\\.)*')\s*[,)]")


def _sources(exts):
    for base, dirs, files in os.walk(SRC):
        for name in files:
            if name.endswith(exts):
                path = os.path.join(base, name)
                yield os.path.relpath(path, SRC).replace(os.sep, "/"), path


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def test_no_hardcoded_colours():
    problems = []
    for rel, path in _sources((".ts", ".tsx", ".css")):
        if rel in COLOUR_FILES:
            continue
        for no, line in enumerate(_read(path).splitlines(), 1):
            if "design:allow-colour" in line or line.lstrip().startswith(("//", "/*", "*")):
                continue
            hits = [m.group(0) for m in HEX.finditer(line)]
            hits += [m.group(0) for m in FUNC.finditer(line) if not SHADOW.match(m.group(1))]
            if hits:
                problems.append(f"{rel}:{no}: {', '.join(hits)}")
    assert not problems, ("Literal colours outside tokens.css (use a CSS variable, or mark the line "
                          "'design:allow-colour <reason>'):\n" + "\n".join(problems))


def test_translations_complete():
    with open(os.path.join(SRC, "i18n", "zh_CN.json"), encoding="utf-8") as fh:
        zh = json.load(fh)
    missing = {}
    for rel, path in _sources((".ts", ".tsx")):
        for m in TCALL.finditer(_read(path)):
            raw = m.group(1)
            text = json.loads(raw) if raw[0] == '"' else raw[1:-1].replace("\\'", "'")
            if text not in zh:
                missing.setdefault(text, rel)
    assert not missing, "UI strings without a Chinese translation in zh_CN.json:\n" + "\n".join(
        f"{rel}: {text!r}" for text, rel in sorted(missing.items(), key=lambda kv: kv[1]))


def source_hash():
    """SHA-256 of the front-end sources; must match sourceHash() in vite.config.ts."""
    files = []
    for top in ("src", "public"):
        for base, dirs, names in os.walk(os.path.join(FRONTEND, top)):
            files += [os.path.join(base, n) for n in names]
    files += [os.path.join(FRONTEND, n) for n in ("index.html", "vite.config.ts", "tsconfig.json", "package.json")]
    rels = sorted(os.path.relpath(p, FRONTEND).replace(os.sep, "/") for p in files if os.path.isfile(p))
    h = hashlib.sha256()
    for rel in rels:
        with open(os.path.join(FRONTEND, rel), "rb") as fh:
            data = fh.read().replace(b"\r\n", b"\n")      # git may check files out with CRLF
        h.update(rel.encode("utf-8") + b"\0" + hashlib.sha256(data).hexdigest().encode("ascii") + b"\n")
    return h.hexdigest()


def test_web_build_is_current():
    if not os.path.isdir(SRC):
        pytest.skip("front-end sources not present")
    stamp = os.path.join(WEB, "source-hash.json")
    assert os.path.isfile(stamp), "avas/gui/web/source-hash.json is missing: run 'npm run build' in frontend/"
    with open(stamp, encoding="utf-8") as fh:
        built = json.load(fh).get("sha256")
    assert built == source_hash(), "avas/gui/web is older than frontend/: run 'npm run build' in frontend/ and commit avas/gui/web"
