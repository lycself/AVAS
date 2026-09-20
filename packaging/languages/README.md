# Installer translations

`ChineseSimplified.isl` is vendored without modifications from
[kira-96/Inno-Setup-Chinese-Simplified-Translation](https://github.com/kira-96/Inno-Setup-Chinese-Simplified-Translation),
commit `1ff90acc4ed4aee82b1cda43253243deee3daed4`.
The upstream header targets Inno Setup 6.5.0+.

SHA-256: `bf0751fa176569c6faa2f6e17ed2734617bef325d5cc06eae030fdd0258ee778`.
The upstream MIT license is included in `LICENSE`; author attribution remains
in the language file. Preserve its UTF-8 encoding and original bytes.

The installer uses this repository copy instead of assuming that the compiler
installation includes a Chinese translation. Builds do not download translations.
When updating, record the new upstream commit and checksum, retain its license,
and compile `packaging/avas.iss` with both languages enabled.
