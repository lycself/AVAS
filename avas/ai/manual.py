"""Search in the AVAS user manual (``avas/static/manual_20260427_zh.txt``).

The text was extracted from ``docs/使用说明20260427.docx`` (the authoritative
manual).  Sections are overlapping windows of lines; a query is split into
words, and Chinese runs into overlapping character pairs, so both
``superpose`` and ``叠加场`` find the right place without a tokenizer.
"""
import os
import re

from avas.paths import STATIC_DIR

MANUAL = os.path.join(STATIC_DIR, "manual_20260427_zh.txt")
WINDOW = 14
STEP = 7
_cache = {}


def _lines():
    if "lines" not in _cache:
        try:
            with open(MANUAL, encoding="utf-8") as fh:
                _cache["lines"] = [ln.rstrip() for ln in fh]
        except OSError:
            _cache["lines"] = []
    return _cache["lines"]


def _terms(query):
    terms = []
    for word in re.findall(r"[A-Za-z_][A-Za-z_0-9']*|\d+(?:\.\d+)?|[一-鿿]+", query.lower()):
        if re.match(r"[一-鿿]", word):
            terms.append(word)
            terms.extend(word[i:i + 2] for i in range(len(word) - 1))
        elif len(word) > 1:
            terms.append(word)
    return list(dict.fromkeys(terms))


def search(query, max_results=4):
    lines = _lines()
    if not lines:
        return {"error": "The manual text is not available."}
    terms = _terms(query)
    if not terms:
        return {"error": "Empty query."}
    hits = []
    # skip the table of contents: the body starts at the second "使用方法" heading
    marks = [i for i, ln in enumerate(lines) if ln.strip() == "使用方法"]
    body = marks[1] if len(marks) > 1 else 0
    for start in range(body, max(body + 1, len(lines) - WINDOW + 1), STEP):
        chunk = "\n".join(lines[start:start + WINDOW])
        low = chunk.lower()
        score = sum(low.count(t) * (3 if len(t) > 2 else 1) for t in terms)
        if score:
            hits.append((score, start, chunk))
    hits.sort(key=lambda h: (-h[0], h[1]))
    chosen = []
    for score, start, chunk in hits:
        if any(abs(start - s) < WINDOW for _sc, s, _c in chosen):
            continue
        chosen.append((score, start, chunk))
        if len(chosen) >= max(1, min(int(max_results), 8)):
            break
    return {"source": "AVAS user manual 20260427 (Chinese)", "query": query,
            "sections": [{"lines": f"{s + 1}-{s + WINDOW}", "text": c} for _sc, s, c in sorted(chosen, key=lambda h: h[1])]}
