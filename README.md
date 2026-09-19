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

# 图形界面 / 浏览器模式 / 版本信息 / 安装自检（内核、WebView2、界面、AI 助手、线性预览）
avas gui --lang zh_CN
avas serve --open
avas info
avas doctor
```

`avas plot --help` 列出全部图类型。画图时输入目录默认从输出目录里的 `avas_run.json` 读取，也可以用 `--input` 指定。

### 图形界面

```bash
avas gui
```

界面是一个普通的桌面窗口（pywebview + Edge WebView2），里面用网页技术绘制，不需要打开浏览器。
同一个界面也可以在浏览器里用：`avas serve` 只启动后端并打印一个带随机访问令牌的地址（加 `--open` 自动打开；
`--port` / `--host` 指定地址，默认只接受本机连接，`--host 0.0.0.0` 会向局域网开放，目前没有用户管理，只在可信网络使用）。
浏览器里没有系统文件对话框，改用页面自带的文件夹 / 文件选择器；「打开输出文件夹」显示带下载按钮的目录，「用默认程序打开」和导出图会直接下载；
链接在新标签页打开；菜单里没有「退出」，关掉标签页即可。其他功能（实时显示、AI 助手等）完全相同。
布局与 VS Code 相同：顶部菜单栏和工具按钮、左侧导航栏、中间页面、下方日志面板、底部状态栏。按工作流分为七页：

1. **Project** 没有打开项目时是欢迎页（新建 / 打开 / 最近项目）；打开项目后是项目概览：上次运行（状态、传输效率、
   末端能量，以及 DataSet.txt 中 NaN、全部丢束等诊断和原因提示）、束流、结构（元件统计、问题数）、模拟设置、文件，
   可直接进入可视化编辑器或运行。切换 / 关闭项目在 **文件** 菜单、标题栏项目名和状态栏左侧的项目切换菜单中。
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
   * 结构树右键 / 快捷键：在其后插入元件、创建副本（`Ctrl+D`）、上移下移（`Alt+↑/↓`，拖动行也可以）、删除（`Del`）。

   页面左上角切换到 **可视化编辑器**（与文本编辑同一份内容、同一套撤销）：
   * **元件面板**：把漂移段、四极铁、螺线管、射频腔 / 磁铁场图、二极铁、校正铁、束诊等拖到束线上。落在漂移段内时自动拆分漂移段，
     下游元件位置不变；落在叠加场范围内时自动生成对应 z0 的 superpose。删除叠加场的第一个元件时自动重设 z0 并在前面补漂移段，位置不变。
   * **布局图**：元件按类型绘制（聚焦四极铁在轴上方、散焦在下方），下方同一 z 轴上叠加 x（上）/ y（下）包络：
     上次运行的 rms / 最大值（DataSet.txt）、**线性包络预览**（虚线）、管道孔径、粒子损失位置、能量（右轴）。
     悬停显示该位置的全部数值。**3D** 视图可旋转缩放、沿束线漫游，并显示包络管。
   * **元件视图**：选中元件后显示其示意图（四极铁截面与受力方向、螺线管线圈、射频腔 Ez(z) 与相位刻度盘、二极铁弧形、
     校正铁偏转方向、场图分布曲线），拖动手柄改长度 / 孔径 / 相位 / 偏转角，滑块改梯度、磁场、Ke、Kb。
     拖动过程中线性预览实时更新（约几十毫秒），松开后写入文本。
   * **浏览 / 编辑**：可视化编辑器打开时处于浏览状态（可以选中、缩放、查看数值，但不会改动 lattice），点工具栏「编辑」后才出现元件面板、
     手柄和参数输入；点「完成」时如有未保存修改，询问「保存 / 放弃本次编辑 / 继续编辑」。
   * **曲线高亮**：单击布局图中的曲线或图例项高亮该曲线（其余变淡），双击图例项只显示这一条，Esc 取消。
   * **运行中实时显示**：模拟运行时，布局图下方的包络随 DataSet.txt 逐行增长，虚线标出束团当前位置，发生损失处闪红圈；
     前一次运行显示为灰线作对照（叠加显示菜单中可在运行结束后继续「与前一次运行对比」）。误差研究显示已完成的误差种子；
     分段运行结束后自动叠加该分段结果（按分段起点对齐 z，也可在叠加显示菜单中选择）。lattice 在上次运行后被修改时，状态栏提示。
   * **回放**：状态栏「回放」让示意束团按上次运行的包络沿束线走一遍，可暂停、拖动、调速，可选「匀速」或「束流速度」
     （按能量和静止质量换算飞行时间，β 小的地方走得慢）。3D 视图同时显示粒子云和「示意」标记，可让镜头跟随束团。
     束团和粒子只是按 rms 包络画出的示意，不是模拟得到的粒子分布。
   * **线性包络预览**（`avas/sim/linear_optics.py`）：参考粒子 + 4×4 二阶矩传输，支持 drift / quad / solenoid / bend / edge
     和场图（静磁场梯度与 Bz、射频腔能量增益与散焦，叠加场相加）、线性空间电荷。与内核对比：能量误差约 0.01 %，
     rms 尺寸通常差 1–2 %（多粒子非线性效应处最大约 13 %）。只用于快速评估，最终以模拟结果为准。
4. **Settings** 模拟类型、步长、多线程、相位扫描、空间电荷、场文件目录、纵向限制、边界、密度输出，以及误差分析模式。
5. **Files** `InputFile/` 下的全部文件，按内容识别类型并分组，每类用显示物理含义的视图打开（结构编辑器、关键字表、
   ini 表、boundary / scanData / SeParticle 表格、.dst 相空间图、场图曲线、TraceWin 结构只读表），「表格 / 文本」两个
   标签页编辑同一内容，数据行上的注释保留。右键菜单：重命名、创建副本、移到回收站、在资源管理器中显示、用默认程序打开、
   复制路径；工具栏可新建文件、把外部文件复制进 InputFile。
6. **Run** 一键运行：先检查并保存有修改的页面，再在子进程中运行 `avas run`；进度、剩余时间（秒 / 分钟 / 小时都能识别）、
   位置、误差分析的步数实时显示，内核输出进入日志面板。下方「束流实时示意」按运行使用的 lattice 画出紧凑束线图、已输出的包络、
   移动的束团和损失位置，并显示束团位置、存活宏粒子数、传输效率、能量和 rms 尺寸；分段运行显示所在阶段，误差研究显示第 i / n 个种子，
   AI 助手的试算也在这里显示（用它自己的 lattice）。运行结束后保留最终状态，可以回放。
   **运行锁**：完整运行、误差研究和分段运行进行中（包括暂停）时，所有输入文件只读——结构、束流、设置、文件页以及运行用的 lattice
   选择都不能修改，后端同样拒绝写入，AI 助手此时提出的修改会被直接拒绝并说明原因。原因是误差研究每组都会重新读取 lattice，
   分段运行每个阶段开始时才复制输入文件，运行中修改会让结果混入两套输入。AI 助手自己的参数扫描 / 优化使用副本，不加锁。
7. **Results** 左边选择分析项，右边以标签页显示**可交互的图**（拖动放大、双击复原、悬停读数）：包络、发射度、损失、能量、
   相移、同步相位、腔压、误差分析、密度、接受度。粒子文件查看器和 plt 步查看器是 4 个相空间密度图 + rms 椭圆 +
   百分比发射度文字，放大后自动按新范围重新统计密度；改坐标、改百分比立即重画。「保存图片」用 matplotlib 输出
   白底的论文用图（PNG / PDF / SVG）。可以切换到项目 OutputFile 以外的结果文件夹。工具：扩充粒子数、plt 步转 dst。

### AI 助手

工具栏右侧 **AI 助手**（`Ctrl+Shift+A`）打开右侧对话面板。助手可以读取项目（lattice、beam、设置、结果、日志、用户手册），
**修改参数**、**运行模拟**、**参数扫描**和**优化**：

* 模型：任何 **OpenAI 兼容接口**，包括本地模型（Ollama `http://localhost:11434/v1`、LM Studio、vLLM、llama.cpp、Xinference）
  和在线接口（OpenAI、DeepSeek、通义千问、Kimi、硅基流动、智谱、OpenRouter 等）。在助手设置中添加、测试连接、列出模型。
  模型不支持原生工具调用时自动改用提示词方式。API 密钥保存在 Windows 凭据管理器中，不写入设置文件。
* 每一项修改都是一张「修改提案」卡片（元件、参数、旧值 → 新值），**点「应用」后才写入**；lattice 已在编辑器中打开时直接应用到
  编辑器（可撤销）并保存。每次应用前备份到项目下 `.avas_ai/backups/`，卡片上可一键「撤销」。可以在单个对话中打开「自动应用」。
  模拟运行中输入文件锁定，助手此时提出或应用修改都会被拒绝，并由助手向你说明、等运行结束后再提。
* 参数扫描 / 优化可以用线性预览（秒级）或内核模拟；模拟在 `.avas_ai/runs/` 中的副本上运行，不改动项目的 InputFile 和
  OutputFile，结束后把最优参数作为修改提案给出。优化目标可以是指标（如 `emit_x_growth`）或表达式
  （如 `abs(rms_x_out-1.5)+abs(rms_y_out-1.5)`），方法为 Nelder-Mead / Powell / 随机搜索。
* 对话按项目保存在 `%LOCALAPPDATA%\AVAS\assistant\`。

外观与操作：

* 主题：**视图 → 主题** 选择 跟随系统 / 浅色 / 深色，状态栏最右边按钮一键切换；切换在一帧内完成（约 20 ms）。
* 缩放：**视图 → 界面缩放**（90 – 150 %，`Ctrl+=` / `Ctrl+-` / `Ctrl+0`）；**设置 → 语言** 即时切换中文 / English。
* 动效：**视图 → 动效** 选择 完整（默认，束团移动和粒子云）/ 精简（只移动位置标记）/ 关闭（每秒更新一次）/
  自动（跟随 Windows「动画效果」设置，该设置关闭时等同「关闭」）。动画最多 30 帧 / 秒，页面不可见时停止。
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

前后端只通过 HTTP 通信（`avas/gui/server.py`：`POST /api/rpc` 调用、WebSocket `/api/events` 事件、`/blob/` 二进制数组），
桌面窗口和浏览器用同一条通路，pywebview 只负责窗口和原生文件对话框。调试时用 `avas serve --settings <临时 json>`
在浏览器里打开界面（`python -m avas.gui.devserver` 仍可用，等价于加了 `--token dev` 和独立设置文件的 `avas serve`）；
加 `--fake-engine 60` 时，「运行」不调用内核，而是把输出目录里已有的 DataSet.txt 在 60 秒内逐行重放（`--fake-lose 0.1` 模拟损失），
用于检查实时显示。后端接口在 `avas/gui/services/`，每个页面调用的函数都在 `tests/test_gui.py` 中有测试，通信层在 `tests/test_server.py`；
`tests/test_design_rules.py` 检查写死的颜色、缺少的中文翻译以及 `avas/gui/web/` 是否由当前前端源码构建。
给 AI 编程助手和开发者的规则见 [AGENTS.md](AGENTS.md)。

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

### 目录结构

```
avas/            Python 包
  cli/           命令行入口（avas run / plot / gui / info / doctor）
  gui/           桌面界面后端：app.py 窗口入口，services/ 各页面调用的接口，web/ 编译好的前端
  ai/            AI 助手：OpenAI 兼容客户端、工具调用循环、AVAS 工具、沙盒模拟、手册检索、密钥存储
  api/           basic.py：模拟与画图的统一入口；qt/：界面用接口
  core/          ctypes 封装的 C++ 计算内核
  sim/           模拟流程：多粒子、包络、误差、匹配、接受度；linear_optics.py 线性包络预览
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
packaging/       打包：build.py、PyInstaller 配置、Inno Setup 安装包脚本、图标
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
avas serve --open                                                    # the same interface in a web browser
avas info
avas doctor                                                          # self-test of an installation
```

`avas plot --help` lists every plot type. The input directory for plots is read from `avas_run.json` in the output directory, or given with `--input`.

### GUI

`avas gui` (or `avas-gui`) opens a desktop window (pywebview + Edge WebView2; no browser involved) with a VS Code-like layout: menu bar, side bar, pages, log panel, status bar. Seven pages follow the workflow: **Project** (a welcome page without a project; with one, an overview of the last run including DataSet diagnostics such as NaN columns or a lost beam, the beam, lattice statistics and settings; switching projects lives in the File menu and the project switcher in the title and status bars), **Beam** (saving keeps keywords the page does not manage, and comments), **Lattice** (run-lattice selection; Monaco text editor with highlighting, folding, completion, hover help and problem markers, side by side with the physical-parameter editor: beamline schematic, element tree, property form, per-keyword parameter table), **Settings**, **Files** (content-aware views of everything in `InputFile/`, table and text tabs on the same content, rename / duplicate / recycle bin / import), **Run** (child `avas run` process, live progress incl. min/h ETAs, engine output in the log) and **Results** (interactive Plotly plots; phase-space viewers with density re-binning on zoom and percent emittances; publication-quality export through matplotlib; any results folder). Theme switching (system / light / dark) takes one frame (~20 ms); UI scale 90–150 %; Chinese / English switch instantly. Unsaved pages are marked and prompted for before closing or switching projects. Settings: `%LOCALAPPDATA%\AVAS\gui.json`; logs: `%LOCALAPPDATA%\AVAS\logs`.

The Lattice page also has a **visual editor** on the same text model (one undo history): a component palette to drag elements onto the beamline (dropping into a drift splits it so downstream positions stay put; dropping into a superpose block adds a superpose at that z0), a large layout with element glyphs and the x/y envelope of the last run, the **linear envelope preview** (`avas/sim/linear_optics.py`: reference particle, 4×4 moment transport through matrix elements and field maps, linear space charge; energies within ~0.01 % and rms sizes typically within 1–2 % of the engine), apertures, losses and energy; a three.js 3D view with fly-through; and a component inspector (quadrupole cross-section and forces, cavity Ez(z) and phase dial, …) whose handles and sliders update the preview live while dragging. The visual editor opens in a browse state and changes the lattice only after **Edit**; **Done** asks about unsaved changes (save / discard this editing session / keep editing). Clicking a curve or its legend entry highlights it, double-clicking a legend entry shows only that curve (the Results plots behave the same). While a simulation runs, the envelope grows row by row as the engine writes DataSet.txt, a schematic bunch marks the current position, losses flash where they happen and the previous run stays as a grey reference; error studies show the finished seeds, a finished segment run is overlaid at its entry, and the status bar tells when the lattice was edited after the last run. **Replay** walks the bunch along the last run at uniform speed or with the beam's time of flight; the 3D view draws a particle cloud (labelled *schematic*: sizes from the rms envelope, particles are random samples) and can follow it with the camera.

The **AI assistant** (`Ctrl+Shift+A`) works with any OpenAI-compatible endpoint, local (Ollama, LM Studio, vLLM, llama.cpp, Xinference) or hosted, with native or prompted tool calls. It reads the project, results, log and user manual; changes to the lattice, beam.txt, input.txt or ini.ini are proposals applied only after approval (backed up under `<project>/.avas_ai/backups`, undoable); it can run the simulation, scan parameters and optimise (Nelder-Mead / Powell / random) with the linear preview or with engine runs in a sandbox copy (`<project>/.avas_ai/runs`) that never touches the project's files. API keys go to the Windows Credential Manager.

**Run page and input lock.** Below the progress, *Live beam* draws the lattice the run uses with the envelope written so far, the moving bunch and the losses, and shows the bunch position, macro-particles alive, transmission, energy and rms sizes (segment stages, error seeds and the assistant's sandbox evaluations included); after the run it keeps the final state and offers a replay. While a project run, error study or segment run is running or paused, all input files are read-only (Lattice, Beam, Settings and Files pages, the run-lattice selection; the back end refuses writes too, and the assistant's change proposals are refused with an explanation), because error studies re-read the lattice for every group and segment runs copy InputFile at every stage. The assistant's own scans work on copies and do not lock. **View → Motion** chooses full (the default) / reduced / off / automatic (follows Windows' animation effects).

**Browser mode.** `avas serve` runs the back end without a window and prints a URL (with a random access token) to open in any modern browser; `--open` opens it, `--port` / `--host` choose the address (the default binds to this machine only; `--host 0.0.0.0` exposes it to the network, where the token is the only protection because there is no user management yet). In a browser the native file dialogs are replaced by the page's own folder / file chooser, "open folder" shows the folder with download buttons, "open file" and plot export download the file, and links open in a new tab; the Exit entry is absent (close the tab). Everything else, including the live run display and the assistant, is identical.

The front end lives in `frontend/` (React + TypeScript + Vite); its build output `avas/gui/web/` is committed, so running AVAS needs no Node.js. Rebuild with `cd frontend && npm install && npm run build`. Front end and back end talk only over HTTP (`avas/gui/server.py`, Starlette + uvicorn: `POST /api/rpc`, a WebSocket `/api/events` for events, `/blob/` for binary arrays); the desktop window and a browser use the same transport, pywebview only provides the window and the native dialogs. For development `avas serve --settings <scratch json>` (or the old `python -m avas.gui.devserver`, which fixes the token to `dev`) serves the GUI to a browser; with `--fake-engine 60` a run replays the DataSet.txt already in the output folder over 60 s instead of starting the engine (`--fake-lose 0.1` loses particles), for checking the live display. Back-end calls are in `avas/gui/services/` and tested in `tests/test_gui.py`, the transport in `tests/test_server.py`; `tests/test_design_rules.py` checks for hard-coded colours, missing Chinese translations and a stale `avas/gui/web/` build. Rules for AI coding assistants and developers: [AGENTS.md](AGENTS.md).

### Stand-alone build

```bash
python packaging/fetch_webview2.py
```

```bash
python packaging/build.py
```

`build.py` stamps the build (time, git commit; shown in Help > About and `AVAS.exe info`), runs PyInstaller (`dist/AVAS/`: `AVAS.exe` command line, `AVASGui.exe` GUI, WebView2 bootstrapper) and, when [Inno Setup 6](https://jrsoftware.org/isinfo.php) is installed, compiles `dist/installer/AVAS-<version>-setup.exe` (per-user install without admin rights, shortcuts, optional PATH entry, WebView2 installed when missing). Add `--frontend` to rebuild the web page first. The exe does not follow source changes: rebuild after editing. `AVAS.exe doctor` checks an installation.

### Tests

```bash
pytest
```

### Citation

If you use this code in your research, please cite:

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602
