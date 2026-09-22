# 贡献 AVAS / Contributing to AVAS

[中文](#中文) · [English](#english)

面向想要修改代码、调试界面或打包发布的开发者。软件规则与设计约束的唯一来源是 [AGENTS.md](AGENTS.md)（AI 编程助手和人类开发者共用），这里是从头到尾的操作步骤。
For developers changing code, debugging the interface or packaging a release. The single source of design rules and conventions is [AGENTS.md](AGENTS.md) (shared by AI coding assistants and human developers); this page is the step-by-step version.

---

## 中文

### 环境

先按 [README「源码安装」](README.md#源码安装)建好 `.venv`，开发再装一组额外依赖：

```bash
pip install -e .[dev]
```

### 前端开发

界面源码在 `frontend/`（React + TypeScript + Vite），编译结果在 `avas/gui/web/`（已提交到仓库，运行 AVAS 不需要 Node.js）。
修改界面需要 Node.js：

```bash
cd frontend && npm install && npm run build
```

前后端只通过 HTTP 通信（`avas/gui/server.py`：`POST /api/rpc` 调用、WebSocket `/api/events` 事件、`/blob/` 二进制数组），
桌面窗口和浏览器用同一条通路，pywebview 只负责窗口和原生文件对话框。调试界面：

```bash
avas serve --settings <临时 json>                                  # 在浏览器里打开界面
avas serve --settings <临时 json> --fake-engine 60 --fake-lose 0.1  # 「运行」不调内核，重放已有 DataSet.txt，用于检查实时显示
```

`python -m avas.gui.devserver` 是等价的旧命令（固定 `--token dev`）。后端接口在 `avas/gui/services/`，每个页面调用的函数在
`tests/test_gui.py` 中有测试，HTTP / WebSocket 通信层在 `tests/test_server.py`；`tests/test_design_rules.py` 检查写死的颜色、
缺少的中文翻译，以及 `avas/gui/web/` 是否由当前前端源码构建。

### 打包独立程序与安装包

```bash
python packaging/fetch_webview2.py
```

```bash
python packaging/build.py
```

第一条命令（只需一次）从微软官方地址下载 WebView2 安装程序（约 1.7 MB）。第二条命令写入构建信息（时间、git 提交，显示在
**帮助 → 关于** 和 `AVAS.exe info` 中），用 PyInstaller 生成 `dist/AVAS/`（`AVAS.exe` 命令行、`AVASGui.exe` 界面、
WebView2 安装程序），如果安装了 [Inno Setup 6](https://jrsoftware.org/isinfo.php)（`winget install JRSoftware.InnoSetup`），
再生成安装包 `dist/installer/AVAS-2.0.0-setup.exe`：默认为当前用户安装（无需管理员），开始菜单和桌面快捷方式，
可选把 `AVAS.exe` 加入 PATH，缺少 WebView2 时自动安装。界面源码有改动时加 `--frontend` 先重新编译前端。
**exe 不会随源码自动更新**，修改代码后需要重新运行 `build.py`。安装后可运行 `AVAS.exe doctor` 自检。

安装包中文翻译固定保存在 `packaging/languages/`（来源、版本与许可证见该目录），不依赖编译器附带中文文件。打包脚本在 PyInstaller 开始前检查翻译文件；更新翻译后须验证中英文安装脚本编译。

### 目录结构

完整的目录地图（含每个模块的作用）见 [AGENTS.md 第 2 节](AGENTS.md#2-目录地图)，两处不重复维护。

### 翻译维护

界面文字以英文写在前端代码中（`t("...")`），中文翻译在 `frontend/src/i18n/zh_CN.json`（英文原文 → 中文）。
修改后重新编译前端（`npm run build`）。手册中的关键字、参数说明是 `avas/data/schema.py` 中的中英文对照。

### 测试

```bash
pytest
```

`tests/test_gui.py`、`tests/test_segment.py` 会真正运行内核，较慢，只改动对应部分时建议单独跑那个文件。
更多约定（环境、常用命令、修改前的检查清单）见 [AGENTS.md](AGENTS.md)。

---

## English

### Environment

Build `.venv` as in [README's Source installation section](README.md#source-installation) first, then add the development extras:

```bash
pip install -e .[dev]
```

### Front-end development

The front end lives in `frontend/` (React + TypeScript + Vite); its build output `avas/gui/web/` is committed, so running AVAS needs no Node.js. Rebuild with:

```bash
cd frontend && npm install && npm run build
```

Front end and back end talk only over HTTP (`avas/gui/server.py`, FastAPI + uvicorn: `POST /api/rpc` for calls, a WebSocket
`/api/events` for events, `/blob/` for binary arrays); the desktop window and a browser use the same transport, pywebview only
provides the window and the native dialogs. To debug the interface:

```bash
avas serve --settings <scratch json>                                  # opens the GUI in a browser
avas serve --settings <scratch json> --fake-engine 60 --fake-lose 0.1  # a run replays an existing DataSet.txt instead of the engine
```

`python -m avas.gui.devserver` is an equivalent alias (fixes the token to `dev`). Back-end calls are in `avas/gui/services/` and
tested in `tests/test_gui.py`, the HTTP / WebSocket transport in `tests/test_server.py`; `tests/test_design_rules.py` checks for
hard-coded colours, missing Chinese translations and a stale `avas/gui/web/` build.

### Stand-alone build

```bash
python packaging/fetch_webview2.py
```

```bash
python packaging/build.py
```

`build.py` stamps the build (time, git commit; shown in Help > About and `AVAS.exe info`), runs PyInstaller (`dist/AVAS/`:
`AVAS.exe` command line, `AVASGui.exe` GUI, WebView2 bootstrapper) and, when [Inno Setup 6](https://jrsoftware.org/isinfo.php) is
installed, compiles `dist/installer/AVAS-<version>-setup.exe` (per-user install without admin rights, shortcuts, optional PATH
entry, WebView2 installed when missing). Add `--frontend` to rebuild the web page first. The exe does not follow source changes:
rebuild after editing. `AVAS.exe doctor` checks an installation.

The pinned Chinese installer translation is in `packaging/languages/`, with its provenance and license. It does not depend on a compiler-supplied Chinese file. The build checks it before PyInstaller starts; compile the bilingual installer after updating the translation.

### Directory layout

```
avas/            Python package
  cli/           command-line entry points (avas run / plot / gui / serve / info / doctor)
  gui/           GUI back end: server.py HTTP/WebSocket service, app.py desktop window, serve.py browser mode,
                 services/ per-page RPC handlers (fs.py for the browser's own file chooser), web/ the built front end
  ai/            AI assistant: OpenAI-compatible client, tool-call loop, AVAS tools, sandbox simulation, manual search, secrets
  api/           basic.py: unified entry point for simulation and plotting; qt/: interface used by the GUI
  core/          ctypes wrapper around the C++ engine
  sim/           simulation flow: multi-particle, envelope, error studies, matching, acceptance; linear_optics.py preview
  post/          post-processing: analysis/ data analysis, plot/ plotting
  data/          output file parsing (DataSet, BeamSet, dst, ...)
  utils/         I/O and configuration utilities
  engine/        AVAS.dll / libAVAS.so and its dependencies
  static/        atomic mass table, field tables
  gpu/ hpc/      GPU engine and HPC job scripts
frontend/        GUI front-end source (React + TypeScript)
examples/        example project (hwr010)
tests/           pytest test suite
scripts/         personal analysis scripts (not part of the software itself)
packaging/       packaging: build.py, PyInstaller config, Inno Setup installer script, icon
docs/            user manual and changelog
```

This mirrors [AGENTS.md's map](AGENTS.md) (Chinese); keep the two in sync when either changes.

### Translation maintenance

UI text is written in English in the front-end code (`t("...")`), with the Chinese translation in
`frontend/src/i18n/zh_CN.json` (English source → Chinese). Rebuild the front end after changes (`npm run build`). Keyword and
parameter descriptions in the manual come from the English/Chinese pairs in `avas/data/schema.py`.

### Automatic update publishing

安装器更新入口 `avas-latest/setup-latest.ini` 使用稳定的 ASCII schema 1（Schema、Commit、Revision、Name、SHA256）。Revision 为完整历史 `git rev-list --count`，构建传入同一计数与完整提交；官方 CI 必须完整检出。发布从固定版本元数据生成入口，在完整／短标签附件就绪后上传，随后更新应用内 `update.json`。两个入口短暂不同步只会选择各自完整发布的版本。无需更改旧安装器即可继续读取该协议。`/NOCHECKUPDATE` 和静默安装固定使用内置内容。

`.venv\Scripts\python.exe packaging/test_setup_installer.py --iscc <ISCC.exe>` 编译原始中英文安装脚本，并在临时安装器中以脚本化下载、对话框和子进程执行边界验证 Pascal 流程；不安装 AVAS、不访问发布服务。发布 CI 在正式打包前运行它。交接时若指定 `/LOG=文件`，子安装器写入 `文件.latest.log`，避免占用父安装器日志。

AI / 开发者在每次提交前新增 `docs/changes/*.md`，内容要求和汇总规则见 [变更记录](docs/changes/README.md)。不要修改已提交的条目，不手动维护生成的 `docs/update-notes.md`。CI 检查新增非空条目；发布从上次成功发布提交汇总，因此失败构建的说明不会丢失。

Before committing, add a reviewed change fragment under `docs/changes/`. Keep committed fragments immutable. CI checks for new nonempty entries; publishing collects all entries since the last successful release without an AI service or a generated Git commit.

The `publish-update` job in `.github/workflows/ci.yml` runs only for pushes to `lycself/AVAS:main`, after both CI jobs pass. It builds `AVASUpdate.exe` as an independent one-file executable, builds the Windows bundle and requires Inno Setup to produce the installer, runs startup/helper checks, then runs `packaging/update_release.py --publish`. GitHub Actions must be enabled and the job's `contents: write` permission permitted. No personal access token is needed; the job uses `github.token`.

Each `avas-<full SHA>` release holds `AVAS-<version>-setup.exe`, `avas-source.zip`, `avas-windows.zip` and `update.json`. Only after these are ready is the `avas-latest` metadata asset replaced. Fixed-version assets are not overwritten. The publisher checks ancestry to keep a slower old workflow from replacing a newer update pointer. During replacement a transient metadata download failure is treated as a failed check, never as “up to date”.

Run `.venv\Scripts\python.exe -m pytest tests/test_updates.py` for disposable-installation regressions. After `packaging/build.py --no-installer`, run `.venv\Scripts\python.exe packaging/test_update_helper.py` to verify that the frozen helper runs outside the application folder, preserves diagnostics and restores files after a failed packaged startup check. Do not run a real update against a working developer checkout. The release builder uses `git archive HEAD`, so uncommitted work is intentionally not a publishable source package.

### Tests

```bash
pytest
```

`tests/test_gui.py` and `tests/test_segment.py` actually run the engine and are slow; run just that file when your change only
touches it. More conventions (environment, common commands, the pre-change checklist) are in [AGENTS.md](AGENTS.md).
