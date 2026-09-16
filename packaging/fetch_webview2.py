"""Download Microsoft's WebView2 Evergreen bootstrapper for the stand-alone build.

    python packaging/fetch_webview2.py

writes ``packaging/redist/MicrosoftEdgeWebview2Setup.exe`` (about 1.7 MB, from
Microsoft's official link).  ``packaging/avas.spec`` ships it next to AVAS.exe;
when a computer lacks the WebView2 runtime, AVAS offers to run it
(see ``avas/gui/webview2.py``).  The file is not kept in git.
"""
import os
import sys
import urllib.request

URL = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
TARGET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "redist", "MicrosoftEdgeWebview2Setup.exe")


def main():
    os.makedirs(os.path.dirname(TARGET), exist_ok=True)
    print(f"downloading {URL}")
    with urllib.request.urlopen(URL, timeout=60) as resp, open(TARGET + ".part", "wb") as fh:
        fh.write(resp.read())
    os.replace(TARGET + ".part", TARGET)
    print(f"saved {TARGET} ({os.path.getsize(TARGET) / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
