"""Language helpers shared by the data tables.

The GUI's own strings are translated in the web front end
(``frontend/src/i18n/zh_CN.json``).  Domain texts that live in Python data
tables (keyword and element descriptions in :mod:`avas.data.schema`, lattice
check messages) are ``(english, chinese)`` pairs; the GUI sends both and the
page picks one, while Python callers use :func:`pick`.
"""

LANGUAGES = {
    "en": "English",
    "zh_CN": "简体中文",
}

_current = {"language": "en"}


def available_languages():
    return dict(LANGUAGES)


def set_language(language):
    _current["language"] = language or "en"


def current_language():
    return _current["language"]


def pick(text):
    """Choose from a bilingual ``(english, chinese)`` pair for the current language."""
    if isinstance(text, str):
        return text
    en, zh = text
    return zh if current_language().lower().startswith("zh") and zh else en
