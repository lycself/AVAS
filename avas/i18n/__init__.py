"""UI translations.

Layout of this directory::

    avas_zh_CN.ts   - Qt Linguist source file (editable with Qt Linguist or any text editor)
    avas_zh_CN.qm   - compiled form, produced by ``lrelease avas_zh_CN.ts``

At runtime :func:`install_translator` prefers the ``.qm`` file.  When it is
missing (for example after editing the ``.ts`` without recompiling) the
``.ts`` XML is parsed directly by :class:`TsTranslator`, so no Qt build tools
are required to run the program in Chinese.
"""
import os
import xml.etree.ElementTree as ET

from PyQt5.QtCore import QLibraryInfo, QLocale, QTranslator

from avas.paths import I18N_DIR

LANGUAGES = {
    "en": "English",
    "zh_CN": "简体中文",
}


class TsTranslator(QTranslator):
    """A QTranslator that reads a Qt Linguist ``.ts`` file directly."""

    def __init__(self, ts_path, parent=None):
        super().__init__(parent)
        self._messages = {}
        self._load(ts_path)

    def _load(self, ts_path):
        root = ET.parse(ts_path).getroot()
        for context in root.iter("context"):
            name = context.findtext("name", "")
            for message in context.iter("message"):
                source = message.findtext("source")
                translation = message.find("translation")
                if source is None or translation is None:
                    continue
                if translation.get("type") == "unfinished" and not (translation.text or "").strip():
                    continue
                text = translation.text or ""
                if text:
                    self._messages[(name, source)] = text
                    # allow lookups without context as a fallback
                    self._messages.setdefault(("", source), text)

    def isEmpty(self):  # noqa: N802 (Qt naming)
        return not self._messages

    def translate(self, context, source_text, disambiguation=None, n=-1):  # noqa: D401
        text = self._messages.get((context or "", source_text))
        if text is None:
            text = self._messages.get(("", source_text))
        return text if text is not None else source_text


_current = {"language": "en"}


def available_languages():
    return dict(LANGUAGES)


def current_language():
    """Language code last passed to :func:`install_translator` ("en" before any call)."""
    return _current["language"]


def pick(text):
    """Choose from a bilingual ``(english, chinese)`` pair for the current language.

    Used for domain documentation that lives in data tables (element and
    keyword descriptions taken from the user manual) rather than in ``tr()``.
    """
    if isinstance(text, str):
        return text
    en, zh = text
    return zh if current_language().lower().startswith("zh") and zh else en


def install_translator(app, language):
    """Install translators for *language* ("en", "zh_CN", ...) on *app*.

    Returns the list of installed QTranslator objects (kept alive on the app
    object as ``app._avas_translators``).
    """
    translators = []
    _current["language"] = language or "en"
    if not language or language.lower() in ("en", "en_us", "english"):
        app._avas_translators = translators
        return translators

    # 1) Qt's own strings (Yes/No buttons, file dialogs, ...)
    qt_dir = QLibraryInfo.location(QLibraryInfo.TranslationsPath)
    for base in ("qtbase", "qt"):
        qt_tr = QTranslator(app)
        if qt_tr.load(QLocale(language), base, "_", qt_dir):
            app.installTranslator(qt_tr)
            translators.append(qt_tr)
            break

    # 2) AVAS strings
    qm_path = os.path.join(I18N_DIR, f"avas_{language}.qm")
    ts_path = os.path.join(I18N_DIR, f"avas_{language}.ts")
    avas_tr = None
    if os.path.exists(qm_path):
        avas_tr = QTranslator(app)
        if not avas_tr.load(qm_path):
            avas_tr = None
    if avas_tr is None and os.path.exists(ts_path):
        avas_tr = TsTranslator(ts_path, app)
    if avas_tr is not None:
        app.installTranslator(avas_tr)
        translators.append(avas_tr)

    app._avas_translators = translators
    return translators
