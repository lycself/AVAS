# AVAS — Advanced Virtual Accelerator Software

[中文说明](#中文说明) · [English](#english)

## 中文说明

AVAS 是面向直线加速器的束流动力学模拟软件，提供 C++ 计算内核、Python 前后处理、桌面与浏览器图形界面，以及命令行工具。界面支持中文和英文。

[下载与快速开始](#下载与快速开始) · [主要功能](#主要功能) · [源码安装](#源码安装) · [命令行与浏览器](#命令行与浏览器) · [更新与常见问题](#更新与常见问题) · [文档与反馈](#文档与反馈)

### 下载与快速开始

在[官方发布页](https://github.com/lycself/AVAS/releases)选择适合的文件：

| 使用方式 | 下载文件 | 启动方法 |
| --- | --- | --- |
| Windows 安装版（推荐） | `AVAS-版本-setup.exe` | 双击安装，再从快捷方式启动 |
| Windows 便携版 | `avas-windows.zip` | 完整解压，运行 `AVASGui.exe` |
| 源码运行或开发 | `avas-source.zip`，或克隆仓库 | 按下方“源码安装”配置环境 |

Windows 安装版和便携版无需 Python、Git 或 GitHub 账户。请保留便携包的完整目录，不能只复制 exe。GitHub 自动附带的 **Source code** 是源码；`update.json` 是供程序读取的元数据，无需手动下载。

桌面界面需要 Microsoft Edge WebView2，缺少时会提示安装。AVAS 安装包内置的程序可离线安装；缺少 WebView2 时仍需联网获取该运行时。安装器支持中文和英文，首次启动沿用安装器语言，后续保留个人设置。

首次使用：

1. 打开 AVAS，新建项目或打开已有项目；源码仓库提供 [hwr010 示例](examples/hwr010)。
2. 在“束流”“结构”“设置”页检查输入；需要切换运行文件时，在结构页点击“设为运行结构”。
3. 点击“运行”，在运行页查看进度和实时包络，在结果页分析输出。
4. 需要留下结果时点击“保留本次结果”；下次完整运行会覆盖 `OutputFile/`。

详细步骤可在 **帮助 → 使用说明** 中离线查看，或阅读[操作指南](frontend/src/help/manual.zh.md)。

### 主要功能

界面按工作流分为八页，支持浅色／深色主题、界面缩放和鼠标／触控板操作。

| 页面 | 用途 |
| --- | --- |
| 项目 Project | 新建、打开项目，查看输入与上次运行摘要 |
| 束流 Beam | 配置粒子、能量、分布、Twiss 参数，读取 `.dst` 粒子文件 |
| 结构 Lattice | 文本与参数联动编辑、关键字检查、二维布局与三维束线视图 |
| 设置 Settings | 配置模拟类型、步长、空间电荷、多线程与误差研究 |
| 文件 Files | 查看和编辑输入文件，检查场图曲线、切片及粒子分布 |
| 运行 Run | 启动、暂停、停止模拟，查看实时包络、运行记录与回放 |
| 扫描 Scan | 扫描元件或束流／模拟参数，汇总指标、表格与曲线 |
| 结果 Results | 分析包络、发射度、损失、能量等，对比运行并导出 PNG／PDF／SVG |

#### 结构编辑与文件历史

文本、结构和可视化编辑共用同一份内容与撤销历史。可视化编辑器默认处于浏览状态，点击“编辑”后可拖放元件、调整参数；完成时可保存、放弃本次编辑或继续编辑。

二维布局支持叠加元件：拖到已有非漂移元件图形上可对齐入口叠加；重叠元件上下分层显示，纵向位置保持真实比例。二维／三维右键菜单提供叠加、复制和删除，选中元件可定位对应文本与列表项。仅根据场文件名识别的类型标注“推测”，识别依据见详情。

结构页的文件选择框用于打开文件，运行中仍可切换查看；“设为运行结构”单独指定模拟使用的文件。文件页与结构页提供保存历史和差异对比，恢复先进入编辑器，可撤销，保存后才写入文件。历史存于项目 `.avas_history/`，支持不超过 2 MB 的 lattice、`beam.txt` 和 `input.txt`；从启用后的保存开始记录，版本不自动清理。

#### 场分布、实时显示与结果

元件视图的“查看场图／查看场分布”打开浮动窗口，可查看横截面、纵切面、热力图与方向箭头。场文件显示实际数据，解析模型显示按参数计算的硬边界示意场。横截面统一从下游往上游看，束流朝屏幕外（⊙）；箭头在坐标轴等比例时才表示真实方向。

运行页支持本次和历史运行的回放，结构页可回放上次运行；均可暂停、继续或结束。束团、粒子云和线性包络预览用于示意与快速评估，最终结果以内核计算为准。

完整运行与误差研究在输出目录的 `inputs/` 快照上运行；分段结果写入 `Segments/`，扫描结果写入 `Scans/`。完整运行、误差研究和分段运行期间（含暂停），输入文件只读。已保留的完整运行存入 `Runs/`，可在结果页与其他运行对比。

#### AI 助手

工具栏右侧或 `Ctrl+Shift+A` 打开助手。它支持 OpenAI 兼容接口和本地模型，可读取项目、解释结果、提出参数修改，并在副本中执行扫描与优化。在助手设置中配置服务地址、模型并测试连接。

每项文件修改以提案展示，经批准后应用；也可在单个对话中开启自动应用。写入前备份到 `.avas_ai/backups/`，试算保存在 `.avas_ai/runs/`，不改项目的 `InputFile/` 与 `OutputFile/`。运行锁期间拒绝输入修改。API 密钥保存在 Windows 凭据管理器中。

### 源码安装

使用 **64 位 Python 3.11 或更高版本**；开发和测试使用 3.11，3.12／3.13 支持。Windows 内核为 `avas/engine/AVAS.dll`，Linux 使用 `libAVAS.so`；解释器与内核平台必须匹配。

以下 Windows 命令在仓库根目录的 **PowerShell** 中执行。请手动创建独立 `.venv`，避免直接在 Anaconda base 中安装和运行；可将第一行的 `python` 换成指定的 Python 3.11 解释器路径。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m avas gui
```

上面的命令无需激活环境。想直接使用 `avas` 命令时，PowerShell 执行 `.\.venv\Scripts\Activate.ps1`，CMD 使用 `.venv\Scripts\activate.bat`；Linux 使用 `source .venv/bin/activate` 后执行相同的 pip 安装步骤。

仓库中的 `run_avas.py`／`run_avas.cmd` 默认使用本地 `.venv`，可用 `AVAS_NO_VENV=1` 关闭此行为。前端编译结果已随仓库提供，普通源码运行无需 Node.js。开发依赖、构建、调试和打包见 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 命令行与浏览器

以下命令在激活 `.venv` 后执行。`--input` 可指向输入目录或包含 `InputFile/` 的项目目录，`--output` 可指向任意输出目录。结构文件默认读取 `ini.ini` 的 `[lattice] source`，未指定时使用 `lattice_mulp.txt`；`--lattice` 可临时覆盖。

```powershell
# 运行模拟
avas run --input "C:\proj\InputFile" --output "C:\proj\Results_001"

# 指定结构文件；误差研究可使用 --mode stat、dyn 或 stat_dyn
avas run --input "C:\proj\InputFile" --output "C:\proj\Results_002" --lattice lattice_init.txt

# 绘图；不加 --save 时弹出窗口
avas plot emittance_x --output "C:\proj\Results_001" --save emit_x.png
avas plot phase --dst "C:\proj\Results_001\outData_0.210000.dst" --plane x-x1 --plane phi-w

# 参数扫描；结果写入项目 Scans/ 下的 scan.json、scan.csv 及各次输出目录
avas scan --input "C:\proj\InputFile" --target Q1 --param G --values 10,12,14

# 桌面、浏览器、版本与安装自检
avas gui --lang zh_CN
avas serve --open
avas info
avas doctor
```

`avas run --help`、`avas plot --help` 和 `avas scan --help` 提供完整选项。运行输入快照保存在 `<输出>/inputs/`，`avas_run.json` 记录其位置；场图从原目录读取。绘图默认从运行记录查找输入目录，也可用 `--input` 指定。

**浏览器模式：** `avas serve --open` 启动服务并打开带访问令牌的地址，页面与桌面版共用功能。文件选择使用页面内对话框，文件导出使用下载。默认只监听本机；使用 `--host 0.0.0.0` 开放局域网时，请仅用于可信网络，目前没有用户管理和工作区隔离。关闭标签页不等于停止后端服务。

### 更新与常见问题

#### 如何更新？

Windows 安装器在欢迎页点击“下一步”时检查最新版，可下载并校验新版安装器，保留语言与安装范围。失败时显示原因，可重试、选择“忽略”安装内置版本，或退出；`/NOCHECKUPDATE` 和静默安装使用内置版本。只有包含检查功能的新安装器支持此流程。

已安装的 AVAS 会在启动后检查官方更新，结果缓存 6 小时；**帮助 → 检查更新** 可立即重查。确认“更新并重启”后下载并准备安装，完成后自动重开 AVAS。“稍后”只收起本次会话提醒，“忽略此版本”保存对该提交的忽略记录，均可从帮助菜单重新查看。

下载与准备阶段可取消，关闭更新面板只收起显示；进入安装阶段后不能取消。网络中断后可重试并复用已下载内容。运行、暂停、扫描及 AI 试算期间不能安装，更新准备期间也不能开始新模拟。安装时请等待自动重启，避免手动重复启动。

更新保留项目、结果、个人设置和 `.venv`。Git 自动更新要求官方 origin、main 分支、工作区干净且可快进；源码包遇到文件修改或覆盖冲突时停止。源码更新需从安装目录的 `.venv` 启动。浏览器模式需在后端机器更新并重启服务。

#### 更新失败或旧版本无法升级？

先查看错误原因；切换系统代理后可直接重新检查，无需重启。日志、结果与备份位于 `%LOCALAPPDATA%\AVAS\updates\update-*\`。若旧版报告 `Update metadata is too large`，或更新器本身无法升级，请关闭 AVAS，从官方发布页手动安装新 setup；便携版完整解压到新目录。

请保留 `.avas-install.json`／`.avas-source.json` 版本标记。安装中断时保留备份与 `journal.json`，避免手动混合不同版本文件。源码更新的依赖安装失败时，可在安装目录执行：

```powershell
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m pip check
```

#### 在哪里找设置、日志和版本信息？

个人设置位于 `%LOCALAPPDATA%\AVAS\gui.json`，程序日志位于 `%LOCALAPPDATA%\AVAS\logs`。**帮助 → 关于 AVAS → 复制版本信息** 提供版本、提交与构建信息，便于反馈问题。界面快捷键见帮助菜单；`Ctrl+S` 保存，`F5` 运行，`Shift+F5` 停止。

### 文档与反馈

| 资料 | 内容 |
| --- | --- |
| [操作指南](frontend/src/help/manual.zh.md) | 项目设置、编辑、运行、扫描与分析 |
| [案例教程](frontend/src/help/cases.zh.md) | 示例步骤、原始资料与验证状态 |
| [参数与文件参考](frontend/src/help/reference.zh.md) | 输入文件、关键字与物理参考入口 |
| [原始物理手册](docs/使用说明20260427.docx) | 物理说明原文；旧案例是否可运行以教程验证状态为准 |
| [开发指南](CONTRIBUTING.md) · [开发约定](AGENTS.md) | 环境、调试、构建、测试与设计规则 |
| [发布变更记录](docs/changes/) · [早期更新记录](docs/CHANGELOG.md) | 各次改动说明 |

界面内的使用说明提供“操作指南／案例教程／参数与文件参考”，支持搜索和浮动阅读。维护者：Yuchen Lin，反馈邮箱：[yuchenlin@stu.xmu.edu.cn](mailto:yuchenlin@stu.xmu.edu.cn)。

#### 引用

科研工作使用 AVAS 时，请引用：

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). [DOI](https://doi.org/10.1103/PhysRevAccelBeams.28.044602)

---

## English

AVAS is a beam dynamics simulation code for linear accelerators, with a C++ engine, Python pre/post-processing, desktop and browser interfaces, and command-line tools. The interface supports English and Chinese.

[Download and quick start](#download-and-quick-start) · [Features](#features) · [Source installation](#source-installation) · [Command line and browser](#command-line-and-browser) · [Updates and troubleshooting](#updates-and-troubleshooting) · [Documentation and feedback](#documentation-and-feedback)

### Download and quick start

Choose a package from the [official releases](https://github.com/lycself/AVAS/releases):

| Installation | Download | Start |
| --- | --- | --- |
| Windows installer (recommended) | `AVAS-<version>-setup.exe` | Install, then use the shortcut |
| Windows portable | `avas-windows.zip` | Extract the entire archive and run `AVASGui.exe` |
| Source or development | `avas-source.zip`, or clone the repository | Follow Source installation below |

Windows packages need no Python, Git or GitHub account. Keep the portable directory intact; copying only the executable will not work. GitHub's **Source code** attachments contain source files; `update.json` is application metadata and needs no manual download.

The desktop interface requires Microsoft Edge WebView2 and prompts for installation when missing. The bundled AVAS can be installed offline, but a missing WebView2 runtime requires a download. The installer supports English and Chinese; AVAS adopts that language on first launch and preserves saved preferences afterward.

For your first run:

1. Open AVAS and create or open a project. The source repository includes the [hwr010 example](examples/hwr010).
2. Review Beam, Lattice and Settings. To change the simulation's lattice file, use Set as run lattice on the Lattice page.
3. Start a run, follow progress and live envelopes on Run, then analyze output on Results.
4. Use Keep this run to retain results; the next full run overwrites `OutputFile/`.

Open **Help → User manual** for offline instructions, or read the [user guide](frontend/src/help/manual.en.md).

### Features

Eight pages follow the simulation workflow. The interface supports light/dark themes, UI scaling, and mouse/touchpad gestures.

| Page | Purpose |
| --- | --- |
| Project | Create and open projects; inspect inputs and the last run |
| Beam | Configure particles, energy, distributions and Twiss parameters; load `.dst` files |
| Lattice | Edit linked text and parameters; validate keywords; inspect 2D and 3D beamlines |
| Settings | Configure simulation type, step size, space charge, threading and error studies |
| Files | Inspect and edit inputs, field profiles and slices, and particle distributions |
| Run | Start, pause and stop simulations; inspect live envelopes, records and replay |
| Scan | Sweep element, beam or simulation parameters; collect metrics, tables and curves |
| Results | Analyze envelopes, emittance, losses and energy; compare runs and export PNG/PDF/SVG |

#### Lattice editing and file history

Text, structure and visual editing share one document and undo history. The visual editor starts in browse mode; click Edit to insert elements or change parameters. Finishing offers saving, discarding session edits or continuing.

The 2D layout supports superposition: dropping onto a non-drift element's glyph aligns the new element to its entrance. Overlapping elements appear in separate rows while retaining their longitudinal coordinates. The 2D/3D context menus offer superposition, duplication and deletion; selecting an element locates its text and list entry. Types inferred only from field filenames are marked as inferred, with the basis explained in the details.

The Lattice file selector opens a document and remains available during runs; Set as run lattice separately chooses the simulation input. Files and Lattice offer saved history and comparisons. Restoring loads an undoable edit and requires saving to write the file. History lives in the project's `.avas_history/`, supports lattice, `beam.txt` and `input.txt` up to 2 MB, starts with saves after the feature is enabled, and is not automatically pruned.

#### Fields, live views and results

View field map / View field distribution opens a floating window with transverse and longitudinal slices, heatmaps and arrows. Field files supply actual data; analytical models supply schematic hard-edge fields calculated from parameters. Transverse views look upstream from downstream, with the beam coming out of the screen (⊙). Arrow directions represent physical directions only with equal axis scaling.

Run replays current and historical results; Lattice replays the last run. Both support pause, resume and end. Bunches, particle clouds and linear envelope previews are schematic or preliminary views; use engine results for final analysis.

Full runs and error studies use an `inputs/` snapshot in the output directory. Segment results go to `Segments/`, scans to `Scans/`. Inputs are read-only during full runs, error studies and segmented runs, including pauses. Retained full runs are stored in `Runs/` and can be compared on Results.

#### AI assistant

Open the assistant from the toolbar or with `Ctrl+Shift+A`. It supports OpenAI-compatible services and local models, reads projects, explains results, proposes parameter changes, and runs scans or optimization in copies. Configure the endpoint and model and test the connection in assistant settings.

Each file change is a proposal requiring approval; automatic application can be enabled for an individual conversation. Changes are backed up under `.avas_ai/backups/`. Trial runs use `.avas_ai/runs/` without changing project `InputFile/` or `OutputFile/`. Input changes are refused while the run lock is active. API keys are stored in Windows Credential Manager.

### Source installation

Use **64-bit Python 3.11 or newer**. Development and tests use 3.11; 3.12/3.13 are supported. The engine is `avas/engine/AVAS.dll` on Windows and `libAVAS.so` on Linux; interpreter and engine platforms must match.

Run these Windows commands in **PowerShell** at the repository root. Create a dedicated `.venv` manually, avoiding direct installation into Anaconda base. Replace the first `python` with a specific Python 3.11 interpreter path if needed.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m avas gui
```

These commands need no activation. To use `avas` directly, activate with `.\.venv\Scripts\Activate.ps1` in PowerShell or `.venv\Scripts\activate.bat` in CMD. On Linux use `source .venv/bin/activate`, then the same pip installation steps.

The repository's `run_avas.py` / `run_avas.cmd` use its `.venv` by default; `AVAS_NO_VENV=1` disables this behavior. Built frontend assets are included, so ordinary source installations need no Node.js. See [CONTRIBUTING.md](CONTRIBUTING.md) for development dependencies, builds, debugging and packaging.

### Command line and browser

Activate `.venv` before using these commands. `--input` accepts an input directory or a project containing `InputFile/`; `--output` accepts any output directory. The lattice defaults to `[lattice] source` in `ini.ini`, falling back to `lattice_mulp.txt`. Override it for one run with `--lattice`.

```powershell
# Run a simulation
avas run --input "C:\proj\InputFile" --output "C:\proj\Results_001"

# Select a lattice; error studies accept --mode stat, dyn or stat_dyn
avas run --input "C:\proj\InputFile" --output "C:\proj\Results_002" --lattice lattice_init.txt

# Plot; omit --save to open a window
avas plot emittance_x --output "C:\proj\Results_001" --save emit_x.png
avas plot phase --dst "C:\proj\Results_001\outData_0.210000.dst" --plane x-x1 --plane phi-w

# Scan; writes scan.json, scan.csv and per-run output under project Scans/
avas scan --input "C:\proj\InputFile" --target Q1 --param G --values 10,12,14

# Desktop, browser, version and installation diagnostics
avas gui --lang en
avas serve --open
avas info
avas doctor
```

Use `avas run --help`, `avas plot --help` and `avas scan --help` for full options. Input snapshots live in `<output>/inputs/` and are recorded in `avas_run.json`; field maps are read from their original directory. Plotting finds inputs from the run record unless overridden by `--input`.

**Browser mode:** `avas serve --open` starts the service and opens a token-bearing URL. It shares the desktop pages, with in-page file dialogs and downloads for exports. The default listener is local only. Use `--host 0.0.0.0` only on trusted networks: user management and workspace isolation are not implemented. Closing the tab does not stop the backend service.

### Updates and troubleshooting

#### How do I update?

Windows Setup checks for a newer installer when you click Next on the welcome page. It can download and verify the new installer while retaining language and installation scope. Failures show their cause and offer Retry, Ignore (install the bundled version), or Abort. `/NOCHECKUPDATE` and silent installation use the bundled version. Only installers containing this feature support discovery.

Installed AVAS checks official updates after startup and caches results for six hours. **Help → Check for updates** checks immediately. Confirm Update and restart to download, prepare and install; AVAS reopens automatically. Later hides the notice for the current session; Ignore this version persists for that revision. Both remain accessible through Help.

Download and preparation can be cancelled; closing the panel only hides it. Installation cannot be cancelled. Retry after a network interruption can reuse downloaded content. Installation is unavailable during running or paused simulations, scans and AI trials; preparation also blocks new simulations. Wait for the automatic restart instead of launching another instance.

Updates preserve projects, results, preferences and `.venv`. Git updates require the official origin, main branch, a clean working tree and a fast-forward path. Source archives stop on local file changes or overwrite conflicts. Source updates must run from the installation's `.venv`. Browser deployments require updating and restarting the service on the backend machine.

#### An update failed or an older version cannot upgrade

Check the reported cause. After changing a system proxy, check again without restarting. Logs, results and backups live under `%LOCALAPPDATA%\AVAS\updates\update-*\`. If an old version reports `Update metadata is too large`, or its updater cannot upgrade itself, close AVAS and manually install a new official setup. Extract portable updates in full into a new directory.

Keep `.avas-install.json` / `.avas-source.json` version markers. After an interrupted installation, retain backups and `journal.json` and avoid mixing files from different versions. If dependency installation fails during a source update, run in the installation directory:

```powershell
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m pip check
```

#### Where are settings, logs and version details?

Preferences are in `%LOCALAPPDATA%\AVAS\gui.json`, and application logs in `%LOCALAPPDATA%\AVAS\logs`. **Help → About AVAS → Copy version information** provides version, revision and build details for reports. Help lists keyboard shortcuts; `Ctrl+S` saves, `F5` runs and `Shift+F5` stops.

### Documentation and feedback

| Resource | Contents |
| --- | --- |
| [User guide](frontend/src/help/manual.en.md) | Project setup, editing, runs, scans and analysis |
| [Case tutorials](frontend/src/help/cases.en.md) | Examples, original sources and verification status |
| [Parameter and file reference](frontend/src/help/reference.en.md) | Input files, keywords and physics reference links |
| [Original physics manual](docs/使用说明20260427.docx) | Original Chinese reference; consult tutorial verification status for older cases |
| [Contributing](CONTRIBUTING.md) · [Development conventions](AGENTS.md) | Environment, debugging, builds, tests and design rules |
| [Release change records](docs/changes/) · [Earlier changelog](docs/CHANGELOG.md) | Descriptions of changes |

The in-app manual includes Guide, Cases and Reference with search and a floating reading window. Maintainer: Yuchen Lin, [yuchenlin@stu.xmu.edu.cn](mailto:yuchenlin@stu.xmu.edu.cn).

#### Citation

If you use AVAS in research, please cite:

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). [DOI](https://doi.org/10.1103/PhysRevAccelBeams.28.044602)
