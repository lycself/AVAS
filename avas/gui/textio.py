"""Reading and writing the project's text files."""
import os


def read_text(path):
    """UTF-8 (with or without BOM), then GBK, then UTF-8 with replacement characters."""
    with open(path, "rb") as fh:
        raw = fh.read()
    for enc in ("utf-8-sig", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def write_text(path, text):
    """UTF-8, LF line endings, exactly one trailing newline (atomic replace)."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if text and not text.endswith("\n"):
        text += "\n"
    folder = os.path.dirname(path)
    if folder:
        os.makedirs(folder, exist_ok=True)
    tmp = path + ".avas-tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    os.replace(tmp, path)
