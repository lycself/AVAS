# AVAS – Advanced Virtual Accelerator Software

[中文说明](#中文说明) · [English](#english)

---

## 中文说明

AVAS 是一个直线加速器束流动力学模拟程序：C++ 计算内核（`avas/engine/`）+ Python 前后处理 + 桌面图形界面（pywebview + 网页前端）+ 命令行工具。

### Python 版本

| 版本 | 状态 |
|------|------|
| 3.11 | 已验证（开发和测试所用版本） |
| 3.12 / 3.13 | 支持 |
| 3.10 及以下 | 不支持（`pyproject.toml` 要求 `>=3.11`） |

注意事项：

* 必须是 **64 位** Python，计算内核 `avas/engine/AVAS.dll` 是 64 位库，32 位解释器加载会失败。
* 不要把系统里现成的 Anaconda base 环境当作运行环境：它自带的 numpy / numba 等版本经常互相不匹配，请按下面的方法建立项目自己的 `.venv`。
* Linux 上使用 `avas/engine/libAVAS.so`，其余要求相同。
* 图形界面用 Windows 自带的 **Microsoft Edge WebView2** 显示（Windows 11 已内置，Windows 10 通常随 Edge 更新安装）。
  缺少时 AVAS 会提示安装：打包版附带微软的安装程序，源码运行时会打开微软下载页面。

### 安装：在项目目录下手动创建 `.venv`

在仓库根目录用满足上面版本要求的 64 位 Python 创建虚拟环境（把 `python` 换成你要用的解释器路径，例如 `C:\Python311\python.exe`）：

```bash
python -m venv .venv
```

激活并安装 AVAS 及全部依赖（可编辑模式，改代码即时生效）：

```bash
.venv\Scripts\activate
```

```bash
python -m pip install --upgrade pip
```

```bash
pip install -e .[dev]
```

Linux / macOS 的激活命令是 `source .venv/bin/activate`，其余相同。

安装完成后：

* `.\run_avas.py ...` 和 `run_avas.cmd ...` **总是**使用 `.venv` 里的 Python，无论你在哪个终端、用哪个 `python` 启动它，不需要先激活（不想这样时设环境变量 `AVAS_NO_VENV=1`）。
* 激活 `.venv` 后可以直接用 `avas ...` 和 `avas-gui`。
* `.venv/` 已在 `.gitignore` 中，不会进入仓库。

不想用 `.venv` 的话，在任意满足版本要求的环境里 `pip install -e .` 即可。依赖列表见 `requirements.txt`。

### 命令行

输入目录和输出目录完全解耦：`--input` 指向包含 `input.txt`、`beam.txt` 和结构文件的目录（或包含 `InputFile/` 的项目目录），`--output` 指向任意目录（不存在会自动创建）。结构文件默认是 `ini.ini` 中 `[lattice] source` 指定的文件（在界面「结构」页选择），没有指定时为 `lattice_mulp.txt`；也可以用 `--lattice` 临时指定。

```bash
# 运行模拟（等价于 avas run ...）
avas --input "C:\proj\InputFile" --output "C:\proj\Results_001"

# 用 InputFile 里的另一个结构文件运行
avas run --input "C:\proj\InputFile" --output "C:\proj\Results_48Ca" --lattice lattice_init.txt

# 误差分析：--mode stat | dyn | stat_dyn ；默认 auto = 读取 InputFile/ini.ini，否则 basic
avas run --input "C:\proj\InputFile" --output "C:\proj\err_001" --mode stat --seed 7

# 画图（--save 保存为文件；不加 --save 则弹出窗口）
avas plot emittance_x --output "C:\proj\Results_001" --save emit_x.png
avas plot rms_x       --output "C:\proj\Results_001"
avas plot phase       --dst "C:\proj\Results_001\outData_0.210000.dst" --plane x-x1 --plane phi-w
avas plot syn_phase   --output "C:\proj\Results_001"
avas plot cavity_voltage --output "C:\proj\Results_001" --ratio efield=1.0

# 图形界面 / 版本信息
avas gui --lang zh_CN
avas info
```

`avas plot --help` 列出全部图类型。画图时输入目录默认从输出目录里的 `avas_run.json` 读取，也可以用 `--input` 指定。

### 图形界面

```bash
avas gui
```

界面是一个普通的桌面窗口（pywebview + Edge WebView2），里面用网页技术绘制，不需要打开浏览器。布局与 VS Code 相同：
顶部菜单栏和工具按钮、左侧导航栏、中间页面、下方日志面板、底部状态栏。按工作流分为七页：

1. **Project** 新建 / 打开 / 最近项目（单击打开，可从列表移除），显示当前项目摘要；可关闭项目。
2. **Beam** 束流参数、分布、Twiss，或从 .dst 文件读入（可「从文件填入参数」）。保存时只改写页面管理的关键字，
   `randomseed`、`initpos` 等其他关键字和注释原样保留。「预览 rms 椭圆」按填写的 α、β、ε 画出 x/y/z 三个相平面。
3. **Lattice** 顶部选择**运行使用的结构文件**（记在 `ini.ini` 的 `[lattice] source`，界面和 `avas run` 都按它运行）。
   左边是文本编辑器（Monaco，即 VS Code 的编辑器）：语法着色、按元件编号或行号、折叠（section、叠加场、周期、注释分组）、
   查找替换、`Ctrl+/` 注释、按手册的关键字补全与悬停说明、问题直接标在对应行上。右边按物理参数编辑同一个文件：
   * **束线示意图**：沿 z 画出全部元件，滚轮缩放、拖动平移、点击选中、双击复位，悬停显示元件信息。
   * **结构树**：按 `!name` 显示元件名，按叠加场、`section { }`、`lattice … lattice_end` 以及 `;;;buncher1;;;` 注释分组，
     可搜索、可只看元件 / 命令 / 有问题的行。
   * **属性表单**：带单位和下拉选项，场图显示 .bsx/.bsy/.bsz 等分量是否齐全；显示起止位置和二极铁弧长。
   * **参数表**：按关键字列出同类元件，选中元件时自动切到它的关键字；可多选单元格「批量设置」。
   * **检查**：参数个数和数值、枚举取值、叠加场规则、校正铁长度、首末元件、场图文件。
   * 所有修改都改写文本中的对应一行（一次修改一步撤销），`Ctrl+Z` 可撤销。
4. **Settings** 模拟类型、步长、多线程、相位扫描、空间电荷、场文件目录、纵向限制、边界、密度输出，以及误差分析模式。
5. **Files** `InputFile/` 下的全部文件，按内容识别类型并分组，每类用显示物理含义的视图打开（结构编辑器、关键字表、
   ini 表、boundary / scanData / SeParticle 表格、.dst 相空间图、场图曲线、TraceWin 结构只读表），「表格 / 文本」两个
   标签页编辑同一内容，数据行上的注释保留。右键菜单：重命名、创建副本、移到回收站、在资源管理器中显示、用默认程序打开、
   复制路径；工具栏可新建文件、把外部文件复制进 InputFile。
6. **Run** 一键运行：先检查并保存有修改的页面，再在子进程中运行 `avas run`；进度、剩余时间（秒 / 分钟 / 小时都能识别）、
   位置、误差分析的步数实时显示，内核输出进入日志面板。
7. **Results** 左边选择分析项，右边以标签页显示**可交互的图**（拖动放大、双击复原、悬停读数）：包络、发射度、损失、能量、
   相移、同步相位、腔压、误差分析、密度、接受度。粒子文件查看器和 plt 步查看器是 4 个相空间密度图 + rms 椭圆 +
   百分比发射度文字，放大后自动按新范围重新统计密度；改坐标、改百分比立即重画。「保存图片」用 matplotlib 输出
   白底的论文用图（PNG / PDF / SVG）。可以切换到项目 OutputFile 以外的结果文件夹。工具：扩充粒子数、plt 步转 dst。

外观与操作：

* 主题：**视图 → 主题** 选择 跟随系统 / 浅色 / 深色，状态栏最右边按钮一键切换；切换在一帧内完成（约 20 ms）。
* 缩放：**视图 → 界面缩放**（90 – 150 %，`Ctrl+=` / `Ctrl+-` / `Ctrl+0`）；**设置 → 语言** 即时切换中文 / English。
* 快捷键：`Ctrl+S` 保存全部、`F5` 运行、`Shift+F5` 停止、`Ctrl+O` / `Ctrl+N` 打开 / 新建项目、`Ctrl+B` 侧边栏、
  `Ctrl+J` 日志面板、`Ctrl+1` … `Ctrl+7` 切换页面。
* 有未保存修改的页面在侧边栏显示圆点；打开其他项目、关闭窗口前会询问是否保存；运行中关闭窗口会先确认。
* 设置保存在 `%LOCALAPPDATA%\AVAS\gui.json`，日志在 `%LOCALAPPDATA%\AVAS\logs`。

### 开发界面

界面源码在 `frontend/`（React + TypeScript + Vite），编译结果在 `avas/gui/web/`（已提交到仓库，运行 AVAS 不需要 Node.js）。
修改界面需要 Node.js：

```bash
cd frontend && npm install && npm run build
```

`python -m avas.gui.devserver` 可以在普通浏览器里打开界面调试（`http://127.0.0.1:8765/index.html?devrpc`，文件对话框不可用）。
后端接口在 `avas/gui/services/`，每个页面调用的函数都在 `tests/test_gui.py` 中有测试。

### 打包独立程序

```bash
python packaging/fetch_webview2.py
```

```bash
pyinstaller packaging/avas.spec
```

第一条命令从微软官方地址下载 WebView2 安装程序（约 1.7 MB）；`dist/AVAS/` 中包含 `AVAS.exe`（命令行）、
`AVASGui.exe`（无控制台窗口的界面）和该安装程序，在缺少 WebView2 的电脑上启动时会提示安装。

### 目录结构

```
avas/            Python 包
  cli/           命令行入口（avas run / plot / gui / info）
  gui/           桌面界面后端：app.py 窗口入口，services/ 各页面调用的接口，web/ 编译好的前端
  api/           basic.py：模拟与画图的统一入口；qt/：界面用接口
  core/          ctypes 封装的 C++ 计算内核
  sim/           模拟流程：多粒子、包络、误差、匹配、接受度
  post/          后处理：analysis/ 数据分析，plot/ 画图
  data/          输出文件解析（DataSet、BeamSet、dst …）
  utils/         读写与配置工具
  engine/        AVAS.dll / libAVAS.so 及依赖库
  static/        原子质量表、场表
  gpu/ hpc/      GPU 内核与 HPC 作业脚本
frontend/        界面前端源码（React + TypeScript）
examples/        示例项目（hwr010）
tests/           pytest 冒烟测试
scripts/         个人分析脚本（不属于软件本体）
packaging/       PyInstaller 打包脚本
docs/            使用说明与更新记录
```

### 翻译维护

界面文字以英文写在前端代码中（`t("...")`），中文翻译在 `frontend/src/i18n/zh_CN.json`（英文原文 → 中文）。
修改后重新编译前端（`npm run build`）。手册中的关键字、参数说明是 `avas/data/schema.py` 中的中英文对照。

### 引用

如果您在科研工作或发表论文中使用了本项目代码，请引用：

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602

---

## English

AVAS is a linear-accelerator beam-dynamics code: a C++ engine (`avas/engine/`), Python pre/post-processing, a desktop GUI (pywebview + web front end) and a command-line interface.

### Python version

| Version | Status |
|---------|--------|
| 3.11 | verified (used for development and the test suite) |
| 3.12 / 3.13 | supported |
| ≤ 3.10 | not supported (`pyproject.toml` requires `>=3.11`) |

A **64-bit** interpreter is required because the engine `avas/engine/AVAS.dll` (`libAVAS.so` on Linux) is a 64-bit library. Avoid running from an Anaconda *base* environment, whose bundled numpy / numba versions are often inconsistent; create the project `.venv` instead. The GUI is rendered by Microsoft Edge WebView2 (built into Windows 11); when it is missing AVAS offers to install it.

### Install: create `.venv` in the project directory

From the repository root, using a 64-bit Python that satisfies the table above (replace `python` with the interpreter you want, e.g. `C:\Python311\python.exe`):

```bash
python -m venv .venv
```

Activate it and install AVAS with all dependencies in editable mode:

```bash
.venv\Scripts\activate
```

```bash
python -m pip install --upgrade pip
```

```bash
pip install -e .[dev]
```

On Linux / macOS activate with `source .venv/bin/activate`.

Afterwards `.\run_avas.py ...` and `run_avas.cmd ...` always execute inside `.venv`, whichever Python launched them and without activating first (set `AVAS_NO_VENV=1` to opt out). With the venv activated the `avas` and `avas-gui` commands are available directly. `.venv/` is git-ignored. Without a venv, `pip install -e .` in any suitable environment works too.

### Command line

Input and output directories are independent. `--input` is the directory holding `input.txt`, `beam.txt` and the lattice (or a project directory containing `InputFile/`); `--output` is any directory and is created if needed. The lattice is `[lattice] source` from `ini.ini` (chosen on the Lattice page), else `lattice_mulp.txt`; `--lattice FILE` overrides it.

```bash
avas --input "C:\proj\InputFile" --output "C:\proj\Results_001"      # same as: avas run ...
avas run --input ... --output ... --lattice lattice_init.txt         # another lattice file of the input dir
avas run --input ... --output ... --mode stat --seed 7               # error study: stat | dyn | stat_dyn
avas plot emittance_x --output "C:\proj\Results_001" --save emit_x.png
avas plot phase --dst "C:\proj\Results_001\outData_0.210000.dst"
avas gui --lang en
avas info
```

`avas plot --help` lists every plot type. The input directory for plots is read from `avas_run.json` in the output directory, or given with `--input`.

### GUI

`avas gui` (or `avas-gui`) opens a desktop window (pywebview + Edge WebView2; no browser involved) with a VS Code-like layout: menu bar, side bar, pages, log panel, status bar. Seven pages follow the workflow: **Project**, **Beam** (saving keeps keywords the page does not manage, and comments), **Lattice** (run-lattice selection; Monaco text editor with highlighting, folding, completion, hover help and problem markers, side by side with the physical-parameter editor: beamline schematic, element tree, property form, per-keyword parameter table), **Settings**, **Files** (content-aware views of everything in `InputFile/`, table and text tabs on the same content, rename / duplicate / recycle bin / import), **Run** (child `avas run` process, live progress incl. min/h ETAs, engine output in the log) and **Results** (interactive Plotly plots; phase-space viewers with density re-binning on zoom and percent emittances; publication-quality export through matplotlib; any results folder). Theme switching (system / light / dark) takes one frame (~20 ms); UI scale 90–150 %; Chinese / English switch instantly. Unsaved pages are marked and prompted for before closing or switching projects. Settings: `%LOCALAPPDATA%\AVAS\gui.json`; logs: `%LOCALAPPDATA%\AVAS\logs`.

The front end lives in `frontend/` (React + TypeScript + Vite); its build output `avas/gui/web/` is committed, so running AVAS needs no Node.js. Rebuild with `cd frontend && npm install && npm run build`. `python -m avas.gui.devserver` serves the GUI to an ordinary browser for development. Back-end calls are in `avas/gui/services/` and tested in `tests/test_gui.py`.

### Stand-alone build

```bash
python packaging/fetch_webview2.py
```

```bash
pyinstaller packaging/avas.spec
```

`dist/AVAS/` then holds `AVAS.exe` (command line), `AVASGui.exe` (GUI without a console) and the WebView2 bootstrapper that is offered on machines without the runtime.

### Tests

```bash
pytest
```

### Citation

If you use this code in your research, please cite:

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602
