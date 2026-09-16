# AVAS – Advanced Virtual Accelerator Software

[中文说明](#中文说明) · [English](#english)

---

## 中文说明

AVAS 是一个直线加速器束流动力学模拟程序：C++ 计算内核（`avas/engine/`）+ Python 前后处理 + PyQt5 图形界面 + 命令行工具。

### Python 版本

| 版本 | 状态 |
|------|------|
| 3.9  | 已验证（开发和测试所用版本） |
| 3.10 / 3.11 | 支持，推荐新装环境使用 |
| 3.12 | 支持（需要 numba ≥ 0.59） |
| 3.13 及以上 | 未验证，`pyproject.toml` 中已限制为 `<3.13` |
| 3.8 及以下 | 不支持 |

注意事项：

* 必须是 **64 位** Python，计算内核 `avas/engine/AVAS.dll` 是 64 位库，32 位解释器加载会失败。
* 不要把系统里现成的 Anaconda base 环境当作运行环境：它自带的 numpy / numba / PyQt 版本经常互相不匹配，请按下面的方法建立项目自己的 `.venv`。
* Linux 上使用 `avas/engine/libAVAS.so`，其余要求相同。

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

界面采用 VS Code 式布局：左侧导航栏、中间页面、下方日志面板、底部状态栏。按工作流分为七页：

1. **Project** 新建 / 打开 / 最近项目，显示当前项目摘要。
2. **Beam** 束流参数、分布、Twiss，或从 .dst 文件读入。
3. **Lattice** 顶部选择**运行使用的结构文件**：InputFile 中所有 AVAS 格式的结构（不限文件名，如 `lattice_init.txt`、
   `48Ca_280MeV.txt`）都可以选，选择记在 `ini.ini` 的 `[lattice] source`，界面和 `avas run` 都按它运行。
   左边是文本（查找替换、折叠、注释），右边按物理参数编辑同一个文件：
   * **束线示意图**：沿 z 画出全部元件（射频腔、静磁/静电场图元件、四极铁、螺线管、二极铁、校正铁、漂移段），
     叠加场里的元件嵌套显示；滚轮缩放、拖动平移、点击选中、双击复位。
   * **结构树**：按 `!name` 显示元件名，按叠加场、`section { }`、`lattice … lattice_end` 以及 `;;;buncher1;;;`
     这类注释分组；显示类型、参数摘要和起点 z，可搜索、可只看元件 / 命令 / 有问题的行。
   * **属性表单**：选中元件后按物理量逐项编辑（长度 m、孔径 m、场类型下拉、相位含义 V3 下拉、频率 Hz、相位 °、
     Ke、Kb、场图文件下拉并显示 .bsx/.bsy/.bsz 等分量是否齐全），显示起止位置和二极铁自动计算的弧长。
   * **参数表**：按关键字列出所有同类元件，表头是物理量和单位，枚举值用下拉；可多选单元格「批量设置」。
   * **检查**：按使用说明检查参数个数和数值、枚举取值、叠加场规则（第一条全 0、每个元件前一条 superpose、必须结束、
     最多一个射频腔）、校正铁长度为 0、首末元件避免矩阵模型、场图文件是否存在。
   * 所有修改都直接改写文本中的对应一行（保留注释和名称写法），可在文本编辑器里撤销。
4. **Settings** 模拟类型、步长、多线程、相位扫描、空间电荷（求解器 / 网格 / 网格边长）、场文件目录、纵向限制、边界、密度输出，以及误差分析模式。
   页面不认识的 `input.txt` 关键字在保存时原样保留。
5. **Files** `InputFile/` 下的全部文件，**按内容识别类型**并分组（内核输入 / 其他结构文件 / 粒子数据 / 场图 / 其他），
   每类文件用显示物理含义的视图打开：
   * AVAS 结构文件（任意文件名）：与结构页相同的物理参数编辑器，可「设为运行结构」；`lattice.txt` 只读显示。
   * `beam.txt`、`input.txt`：关键字表，列出每个关键字的含义、各个值的单位和说明（取自使用说明），枚举值下拉，
     可添加 / 删除关键字；`ini.ini`：节 / 键 / 值 / 含义。
   * `boundary.txt`、`scanData.txt`（行名为对应射频腔）、`SeParticle.txt`：带单位的表格。
   * `.dst` / `.edst`：粒子数、流强、频率、静止质量、平均能量、Twiss 参数（与束流页「从文件读取参数」一致）和
     x-x'、y-y'、φ-W 相空间图，可「设为初始束流」。
   * 场图（.edx/.bdx/.bsx/.esx 等，文本或二进制）：网格、长度、横向范围、同名分量是否齐全、被哪些元件引用，
     以及沿 z 的轴上场和截面最大场曲线。
   * TraceWin `.dat` 结构：只读的元件表（单位 mm）；TraceWin 的 `.ini` 工程文件标明 AVAS 不读取。
6. **Run** 一键运行：自动保存并检查全部页面。进度、剩余时间直接来自计算内核的输出行（与终端看到的一致），
   运行前会拦住粒子数 < 2 这类必然失败的输入。
7. **Results** 左边选择分析项，右边以标签页嵌入图形（包络、发射度、损失、能量、相移、同步相位、腔压、误差分析、密度、接受度等），可保存图片；相空间查看器和 plt 步查看器以独立窗口打开。

布局与外观：

* 侧边栏：拖动右侧分隔条调整宽度；拖到很窄时自动收成图标栏，再往外拖即展开。`Ctrl+B`、双击分隔条、
  工具栏右侧的布局按钮都可以切换；图标栏模式下点击当前页图标也会展开。
* 日志面板：拖动上方分隔条调整高度，`Ctrl+J` 或面板右上角 × 隐藏；面板上的按钮可清空、最大化（双击分隔条同样可以）。
* 状态栏：左侧是项目名（点击回到 Project 页）、运行模式、日志中的错误 / 警告数（点击打开日志）；右侧是最后一条消息，
  运行时显示实时进度，整条状态栏变为蓝色。
* 主题：**View → Theme** 选择 跟随系统 / 浅色 / 深色（默认跟随 Windows 的应用颜色模式，系统切换后自动跟随），
  状态栏最右边的按钮一键切换浅色 / 深色，即时生效。深色模式下 Windows 标题栏同步变深。
* 图形：界面里的图随主题配色；**保存图片（包括 matplotlib 工具栏的保存）始终导出白底的浅色样式**，可直接用于论文 / PPT。
  已打开的相空间 / plt 查看器窗口在下次打开时才会换色。
* 图标统一使用 VS Code 的 Codicons（随 `qtawesome` 安装，无需额外文件）。

其他要点：

* 高分屏：已启用 Qt 高 DPI 缩放并显式指定界面字体，150 % / 200 % 显示器下字号正常。
* 缩放：**View → UI scale**（90 – 150 %，`Ctrl+=` / `Ctrl+-` / `Ctrl+0`）即时缩放整个界面，包括页面、表格、日志。
* 语言：**Settings → Language** 即时切换中文 / English。
* 设置保存在系统用户配置中（Windows 注册表 `HKCU\Software\AVAS`），日志在 `%LOCALAPPDATA%\AVAS\logs`。
* 模拟在子进程 `avas run ...` 中执行，界面逐行读取其 stdout；结果文件里的 `-nan(ind)`（例如粒子太少时的 rms 尺寸）按 NaN 处理，不再中断读取。

### 目录结构

```
avas/            Python 包
  cli/           命令行入口（avas run / plot / gui / info）
  gui/           PyQt5 界面：main_window.py 外壳，pages/ 七个工作流页面，widgets/ 通用控件，
                 dialogs/ 相空间查看器等对话框，lattice_editor/ 结构文件编辑器
  api/           basic.py：模拟与画图的统一入口；qt/：界面用接口
  core/          ctypes 封装的 C++ 计算内核
  sim/           模拟流程：多粒子、包络、误差、匹配、接受度
  post/          后处理：analysis/ 数据分析，plot/ 画图
  data/          输出文件解析（DataSet、BeamSet、dst …）
  utils/         读写与配置工具
  engine/        AVAS.dll / libAVAS.so 及依赖库
  static/        原子质量表、场表
  i18n/          界面翻译（avas_zh_CN.ts，运行时直接读取；.qm 可选）
  gpu/ hpc/      GPU 内核与 HPC 作业脚本
examples/        示例项目（hwr010）
tests/           pytest 冒烟测试
scripts/         个人分析脚本（不属于软件本体）
packaging/       PyInstaller 打包脚本
docs/            使用说明与更新记录
```

### 翻译维护

界面文字全部通过 `self.tr("...")` 标记。修改 `avas/i18n/avas_zh_CN.ts`（可用 Qt Linguist 或文本编辑器）即可，
程序运行时直接读取 `.ts`。如需编译成 `.qm`（可选，加载稍快）：

```bash
lrelease avas/i18n/avas_zh_CN.ts
```

注意：目录里若存在过期的 `.qm`，它会优先于 `.ts` 被加载，新增的翻译就不会显示；改完 `.ts` 后要么重新编译，要么删掉 `.qm`。

没有 `lrelease` 时程序会直接读取 `.ts` 文件，功能不受影响。

### 引用

如果您在科研工作或发表论文中使用了本项目代码，请引用：

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602

---

## English

AVAS is a linear-accelerator beam-dynamics code: a C++ engine (`avas/engine/`), Python pre/post-processing, a PyQt5 GUI and a command-line interface.

### Python version

| Version | Status |
|---------|--------|
| 3.9 | verified (used for development and the test suite) |
| 3.10 / 3.11 | supported, recommended for new environments |
| 3.12 | supported (needs numba ≥ 0.59) |
| 3.13+ | untested; `pyproject.toml` pins `<3.13` |
| ≤ 3.8 | not supported |

A **64-bit** interpreter is required because the engine `avas/engine/AVAS.dll` (`libAVAS.so` on Linux) is a 64-bit library. Avoid running from an Anaconda *base* environment, whose bundled numpy / numba / PyQt versions are often inconsistent; create the project `.venv` instead.

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

`avas gui` opens a seven-page workflow (collapsible sidebar on the left, `Ctrl+B`): **Project** (new / open / recent), **Beam**, **Lattice** (choose which AVAS lattice of InputFile/ the run uses; text editor plus a physical-parameter editor on the same file: beamline schematic, element tree with names and groups, property form with units and drop-downs, per-keyword parameter table, checks from the user manual), **Settings** (tracking options incl. multithreading, phase scan, space-charge grid, and the error-study mode; unknown `input.txt` keywords survive a save), **Files** (every file in `InputFile/`, recognised by content: lattices of any name open in the structure editor, beam/input keywords with meaning and units, ini settings, boundary/scanData/SeParticle tables, .dst beam parameters and phase space, field-map grid and longitudinal profile, TraceWin lattices read-only), **Run** (saves and checks everything, then streams the engine's own progress lines: percent, ETA, elapsed) and **Results** (analyses in embedded plot tabs; the particle-file and plt-step viewers open in their own windows). The layout follows VS Code: a resizable side bar (drag the sash; dragging it narrow snaps to an icon strip, `Ctrl+B` toggles), a resizable log panel (`Ctrl+J`), and a status bar with project, run mode, error/warning counts and live progress. **View → Theme** offers follow-system / light / dark (live switch, dark Windows title bar); plots follow the theme on screen but saved images are always light. Icons are VS Code Codicons via `qtawesome`. High-DPI scaling is enabled and an explicit UI font is set; **View → UI scale** (90–150 %, `Ctrl+=` / `Ctrl+-`) and **Settings → Language** apply immediately. Settings are stored per user (`HKCU\Software\AVAS` on Windows); logs go to `%LOCALAPPDATA%\AVAS\logs`. The simulation runs as a child `avas run` process; `-nan(ind)` tokens in result files are read as NaN instead of aborting.

### Tests

```bash
pytest
```

### Citation

If you use this code in your research, please cite:

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602
