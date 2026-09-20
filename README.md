# AVAS – Advanced Virtual Accelerator Software

[中文说明](#中文说明) · [English](#english)

---

## 中文说明

AVAS 是一个直线加速器束流动力学模拟程序：C++ 计算内核（`avas/engine/`）+ Python 前后处理 + 图形界面（桌面窗口或浏览器）+ 命令行工具。

### Python 版本

| 版本 | 状态 |
|------|------|
| 3.11 | 已验证（开发和测试所用版本） |
| 3.12 / 3.13 | 支持 |
| 3.10 及以下 | 不支持（`pyproject.toml` 要求 `>=3.11`） |

注意事项：

* 必须是 **64 位** Python，计算内核 `avas/engine/AVAS.dll` 是 64 位库，32 位解释器加载会失败。
* 请为 AVAS 创建独立的 `.venv` 环境，并在其中安装项目依赖，避免直接使用 Anaconda base 等已有环境运行。创建 `.venv` 时可以使用 Anaconda 提供的 Python 3.11；后续安装依赖和运行 AVAS 均使用 `.venv` 中的 Python。
* Linux 上使用 `avas/engine/libAVAS.so`，其余要求相同。
* 图形界面用 Windows 自带的 **Microsoft Edge WebView2** 显示（Windows 11 已内置，Windows 10 通常随 Edge 更新安装）。
  缺少时 AVAS 会提示安装：打包版附带微软的安装程序，源码运行时会打开微软下载页面。

### 安装：在项目目录下手动创建 `.venv`

**本文的 Windows 命令示例默认在 PowerShell 中执行**（Windows Terminal 中请选择 PowerShell 标签页）。AVAS 也支持命令提示符（CMD），但虚拟环境激活命令不同；在 CMD 中复制示例时，请去掉 `#` 及其后面的注释。

在仓库根目录用满足上面版本要求的 64 位 Python 创建虚拟环境（把 `python` 换成你要用的解释器路径，例如 `C:\Python311\python.exe`）：

```powershell
python -m venv .venv
```

激活并安装 AVAS 及全部依赖（可编辑模式，改代码即时生效）：

```powershell
.\.venv\Scripts\Activate.ps1
```

```powershell
python -m pip install --upgrade pip
```

```powershell
pip install -e .[dev]
```

CMD 的激活命令是 `.venv\Scripts\activate.bat`。Linux / macOS 的激活命令是 `source .venv/bin/activate`，其余相同。

安装完成后：

* `.\run_avas.py ...` 和 `.\run_avas.cmd ...` **总是**使用 `.venv` 里的 Python，无论你在哪个终端、用哪个 `python` 启动它，不需要先激活（不想这样时设环境变量 `AVAS_NO_VENV=1`）。
* 激活 `.venv` 后可以直接用 `avas ...` 和 `avas-gui`。
* `.venv/` 已在 `.gitignore` 中，不会进入仓库。

不想用 `.venv` 的话，在任意满足版本要求的环境里 `pip install -e .` 即可。依赖列表见 `requirements.txt`。

### 命令行

输入目录和输出目录完全解耦：`--input` 指向包含 `input.txt`、`beam.txt` 和结构文件的目录（或包含 `InputFile/` 的项目目录），`--output` 指向任意目录（不存在会自动创建）。结构文件默认是 `ini.ini` 中 `[lattice] source` 指定的文件（在界面「结构」页选择），没有指定时为 `lattice_mulp.txt`；也可以用 `--lattice` 临时指定。

```powershell
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

# 图形界面（桌面窗口 / 浏览器）/ 版本信息 / 安装自检（内核、WebView2、界面、AI 助手、线性预览）
avas gui --lang zh_CN
avas serve --open
avas info
avas doctor
```

`avas plot --help` 列出全部图类型。画图时输入目录默认从输出目录里的 `avas_run.json` 读取，也可以用 `--input` 指定。

参数扫描：对一个参数的每个取值各运行一次，结果表打印在终端并写入 `<项目>/Scans/<名称>_<时间>/`（`scan.json`、`scan.csv`），项目输入文件不变。

```powershell
avas scan --input "C:\proj\InputFile" --target Q1 --param G --values 10,12,14
avas scan --input "C:\proj\InputFile" --target 12 --param phase --values -40:-20:5          # 第 12 行，起点:终点:个数
avas scan --input "C:\proj\InputFile" --keyword beam.particlenumber --values 1000,5000 --metrics transmission,energy_out
```

普通运行不再改写输入目录：文本输入文件（input.txt、beam.txt、结构文件、ini.ini 以及 beam.txt 引用的粒子文件）先复制到
`<输出目录>/inputs/`，运行所用的 `lattice.txt` 生成在那里，内核以这个副本为输入、以原输入目录为场图目录（场图不复制）。
`avas_run.json` 的 `inputs_dir` 记录该副本，可以直接看到某次结果到底用了哪份输入。误差分析（`--mode stat | dyn | stat_dyn`）同样在这个副本里工作：
每个误差种子的 `lattice.txt` 都写在 `<输出目录>/inputs/`，输入目录里的任何文件都不会被改写。

### 图形界面

界面可以用**桌面窗口**打开，也可以在**浏览器**里打开（见下面「浏览器模式」）；两种方式的页面、功能和实时显示完全一致。

```powershell
avas gui
```

界面用网页技术绘制，布局与 VS Code 相同：顶部菜单栏和工具按钮、左侧导航栏、中间页面、下方日志面板、底部状态栏。按工作流分为八页：

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
     悬停显示该位置的全部数值。**3D** 视图可旋转缩放、沿束线漫游，并显示包络管。2D / 3D 视图区左上角统一提供「放大 / 缩小 / 显示全部」按钮，无需鼠标滚轮或触控板手势即可缩放。双击空白处恢复全景；3D 双击元件聚焦该元件，2D 双击视图仍恢复全景，双击图例仍只显示该曲线。
   * **元件视图**：选中元件后显示其示意图（四极铁截面与受力方向、螺线管线圈、射频腔 Ez(z) 与相位刻度盘、二极铁弧形、
     校正铁偏转方向、场图分布曲线），拖动手柄改长度 / 孔径 / 相位 / 偏转角，滑块改梯度、磁场、Ke、Kb。
     拖动过程中线性预览实时更新（约几十毫秒），松开后写入文本。
   * 点击 2D / 3D 图中元件，左下列表会自动展开所在分组、高亮并滚动到对应行；再次点击同一元件也可重新定位。阻挡该元件的搜索 / 筛选条件会自动清除。
   * 元件列表的类型区分射频腔、静电场、静磁场，以及根据场文件名推测的螺线管、四极铁等；场图类型带“场图”标记，推测类型另标“推测”。搜索支持中英文类型名称，结构编辑器共用此行为。
   * **浏览 / 编辑**：可视化编辑器打开时处于浏览状态（可以选中、缩放、查看数值，但不会改动 lattice），点工具栏「编辑」后才出现元件面板、
     手柄和参数输入；点「完成」时如有未保存修改，询问「保存 / 放弃本次编辑 / 继续编辑」。
   * **曲线高亮与隐藏**：单击布局图中的曲线或图例项高亮该曲线（其余变淡），双击图例项只显示这一条，Esc 取消；
     图例项左侧的 × 隐藏这条曲线（图例里保留为灰色划线项，再点恢复；「显示全部曲线」一次恢复），隐藏状态会记住。
     「上次运行」曲线默认不显示，在叠加显示菜单中打开，或点「回放」时自动打开。
   * **运行中实时显示**：模拟运行时，布局图下方的包络随 DataSet.txt 逐行增长，虚线标出束团当前位置，发生损失处闪红圈；
     前一次运行显示为灰线作对照（叠加显示菜单中可在运行结束后继续「与前一次运行对比」）。误差研究显示已完成的误差种子；
     分段运行结束后自动叠加该分段结果（按分段起点对齐 z，也可在叠加显示菜单中选择）。lattice 在上次运行后被修改时，状态栏提示。
   * **回放**：状态栏「回放」让示意束团按上次运行的包络沿束线走一遍，可暂停、拖动、调速，可选「匀速」或「束流速度」
     （按能量和静止质量换算飞行时间，β 小的地方走得慢）。3D 视图同时显示粒子云和「示意」标记，可让镜头跟随束团。
     束团和粒子只是按 rms 包络画出的示意，不是模拟得到的粒子分布。历史记录的回放在运行页（见下）。
   * **二维叠加元件**：保持真实 z 起止位置，上下分层显示重叠元件；各层可独立点击，悬停列出当前位置全部叠加元件，括线标出 superpose 组。分层仅用于示意，不表示横向偏移。结构页小束线图使用相同方式；层数较多时可滚动查看。
   * **小窗口布局**：窗口变矮时，2D / 3D 视图区自动缩小，为下方元件列表和参数面板保留空间；高度不足时可滚动编辑器查看全部内容。恢复窗口高度后恢复原来的分区大小，也可拖动分隔条调整。
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
   AI 助手的试算也在这里显示（用它自己的 lattice）。运行结束后保留最终状态，可以回放；完整运行进行中可勾选「与前一次运行对比」
   把上一次的包络画成灰线（默认不显示）。**历史记录回放**：下方「运行记录」列表里每条完成的记录（OutputFile、已保留的运行、
   分段运行）都有「回放」按钮，点后示意面板切换到这条记录（按它 `inputs/` 快照里的 lattice 画，分段运行按分段起点对齐）并开始回放，
   × 回到本次运行；新的运行开始时自动回到实时显示。鼠标在束线布局图内时，滚轮只缩放图形，不滚动页面；移到图外后正常滚动页面（结构页布局图同样如此）。
   **运行锁**：完整运行、误差研究和分段运行进行中（包括暂停）时，所有输入文件只读——结构、束流、设置、文件页以及运行用的 lattice
   选择都不能修改，后端同样拒绝写入，AI 助手此时提出的修改会被直接拒绝并说明原因。原因是分段运行每个阶段开始时才复制输入文件，
   而且运行记录里的输入快照和实时显示都以运行开始时的输入为准，运行中修改会让结果混入两套输入。AI 助手的参数扫描 / 优化和扫描页使用副本，不加锁。
   **运行记录**：每次完整运行都覆盖 `OutputFile/`，想留下的结果点「保留本次结果」（运行页、结果页）复制到 `Runs/<时间>_<名称>/`
   （连同 `inputs/` 里的输入快照）；开始新运行时，如果上次结果还没有保留，会先询问「保留并运行 / 直接运行 / 取消」。
   已保留的运行和分段运行一起列在运行记录里，可以查看、重命名、移到回收站。
7. **Scan** 参数扫描：选一个结构元件的参数（或 beam.txt / input.txt 的关键字），给出取值列表或 起点:终点:个数，
   对每个取值各运行一次模拟（在输入文件的副本上，项目文件不变），勾选要收集的结果（传输效率、出口能量、发射度增长、rms 最大值等），
   结果实时进入表格和曲线，保存在 `Scans/<名称>_<时间>/`（`scan.json`、`scan.csv`，每个取值一个结果文件夹，可在结果页打开）。
   扫描期间运行页显示进度，可暂停 / 继续 / 停止。命令行是 `avas scan`。
8. **Results** 左边选择分析项，右边以标签页显示**可交互的图**（拖动放大、双击复原、悬停读数）：包络、发射度、损失、能量、
   相移、同步相位、腔压、误差分析、密度、接受度。粒子文件查看器和 plt 步查看器是 4 个相空间密度图 + rms 椭圆 +
   百分比发射度文字，放大后自动按新范围重新统计密度；改坐标、改百分比立即重画。「保存图片」用 matplotlib 输出
   白底的论文用图（PNG / PDF / SVG）。结果来源可以在 OutputFile、已保留的运行、分段运行和任意文件夹之间切换。
   「运行对比」把几个运行的同一条曲线（rms、发射度、能量、损失等）画在一张图里，分段运行按入口 z 对齐。工具：扩充粒子数、plt 步转 dst。

帮助菜单：使用说明（内置中英文 Markdown 浮动窗口，可对照操作，支持目录、全文筛选、拖动、调整大小和最大化；每次重新打开恢复默认位置和大小，参数参考与编辑器共用 schema）、快捷键一览、关于。束流页和设置页支持撤销 / 重做（`Ctrl+Z` / `Ctrl+Y`）。

#### 浏览器模式

```powershell
avas serve --open
```

同一个界面可以在浏览器里用：`avas serve` 只启动后端并打印一个带随机访问令牌的地址（加 `--open` 自动打开；
`--port` / `--host` 指定地址，默认只接受本机连接，`--host 0.0.0.0` 会向局域网开放——目前没有用户管理，只在可信网络使用）。
浏览器里没有系统文件对话框，改用页面自带的文件夹 / 文件选择器；「打开输出文件夹」显示带下载按钮的目录，「用默认程序打开」和导出图会直接下载；
链接在新标签页打开；菜单里没有「退出」，关掉标签页即可。其他功能（实时显示、AI 助手等）完全相同。

### 软件更新

启动界面后会在后台检查 `lycself/AVAS` 的官方更新，检查结果缓存 6 小时；**帮助 → 检查更新** 可立即重查。网络失败不影响使用。点击提示查看版本和更新摘要，再选择**更新并重启**；确认时若发现更新的版本，会重新展示并要求确认。确认后锁定提交，下载期间的新发布不会改变此次安装目标。「忽略此版本」只忽略该提交，弹窗会提醒仍可从帮助菜单获取更新。

AI / 开发者提交前主动维护 [变更记录](docs/changes/README.md)，CI 检查新增条目。发布时自动汇总上次成功发布之后的说明，生成 `docs/update-notes.md` 发布产物并用于更新弹窗和 Release；不直接使用 Git 提交标题，也不调用模型临时撰写文案。

官方更新在 main 的 Python / 前端 CI、Windows 打包及基本启动检查全部通过后发布。Git 版仅对官方 origin、main 分支、干净且可快进的工作区自动更新；源码压缩包版按文件清单校验和替换；Windows 打包版由独立更新器替换程序并重启。用户项目、结果、个人设置及 `.venv` 保留，待替换文件有本地修改或覆盖冲突时停止。源码版必须从安装目录的 `.venv` 启动，更新会安装所需依赖；Python 版本不兼容时需先手动处理。

运行、暂停、参数扫描及 AI 试算期间不能安装。下载准备期间禁止启动新模拟；退出前询问未保存的编辑。同一用户仍有其他 AVAS 进程使用该安装目录时停止安装，请先关闭这些进程。刷新页面可恢复已准备好的更新，重启后显示更新结果。浏览器模式只提供检测与下载入口，需要在后端机器更新并重启 `avas serve`。

首次使用此功能需手动拉取一次新版，或下载包含更新信息的官方包。Windows 用户推荐下载发布页的 `AVAS-版本-setup.exe`，双击安装，无需 Python、Git 或 GitHub 账户；缺少 WebView2 时安装程序会联网安装。免安装用户下载 `avas-windows.zip`，完整解压后运行 `AVASGui.exe`，不能单独拷贝 exe。源码用户使用 `avas-source.zip` 并配置 Python 依赖。`update.json` 供程序读取，无需手动下载；GitHub 自动附带的 Source code 是源码，不是 Windows 程序。GitHub 的 Download ZIP 在包含版本标记时也可识别。即使所下载的中间提交没有发布更新包，也会读取该提交的官方归档作为文件基准。旧包缺少版本标记时会提示重新下载。不要删除 `.avas-install.json` / `.avas-source.json`。

更新日志、结果和程序备份位于 `%LOCALAPPDATA%\AVAS\updates\update-*\`。文件替换失败尝试恢复备份；打包版启动检查失败也恢复旧程序。源码版依赖安装失败会明确报错，保留源码和备份，不保证 Python 环境回退；可在安装目录执行 `.venv\Scripts\python.exe -m pip install -e .` 和 `.venv\Scripts\python.exe -m pip check` 修复，再重新启动。中断安装时请保留备份及 `journal.json`，不要手动混合两个版本的程序文件。

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

### 外观与操作

* 主题：**视图 → 主题** 选择 跟随系统 / 浅色 / 深色，状态栏最右边按钮一键切换；切换在一帧内完成（约 20 ms）。
* 缩放：**视图 → 界面缩放**（90 – 150 %，`Ctrl+=` / `Ctrl+-` / `Ctrl+0`）；**设置 → 语言** 即时切换中文 / English。
* 动效：**视图 → 动效** 选择 完整（默认，束团移动和粒子云）/ 精简（只移动位置标记）/ 关闭（每秒更新一次）/
  自动（跟随 Windows「动画效果」设置，该设置关闭时等同「关闭」）。动画最多 30 帧 / 秒，页面不可见时停止。
* 快捷键：`Ctrl+S` 保存全部、`F5` 运行、`Shift+F5` 停止、`Ctrl+O` / `Ctrl+N` 打开 / 新建项目、`Ctrl+B` 侧边栏、
  `Ctrl+J` 日志面板、`Ctrl+1` … `Ctrl+7` 切换页面。
* 有未保存修改的页面在侧边栏显示圆点；打开其他项目、关闭窗口前会询问是否保存；运行中关闭窗口会先确认。
* 设置保存在 `%LOCALAPPDATA%\AVAS\gui.json`，日志在 `%LOCALAPPDATA%\AVAS\logs`。

面向开发者的前端构建、调试服务器、打包和测试说明见 [CONTRIBUTING.md](CONTRIBUTING.md)；界面设计规则见 [AGENTS.md](AGENTS.md)。

### 引用

如果您在科研工作或发表论文中使用了本项目代码，请引用：

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602

---

## English

AVAS is a linear-accelerator beam-dynamics code: a C++ engine (`avas/engine/`), Python pre/post-processing, a GUI (desktop window or browser) and a command-line interface.

### Python version

| Version | Status |
|---------|--------|
| 3.11 | verified (used for development and the test suite) |
| 3.12 / 3.13 | supported |
| ≤ 3.10 | not supported (`pyproject.toml` requires `>=3.11`) |

A **64-bit** interpreter is required because the engine `avas/engine/AVAS.dll` (`libAVAS.so` on Linux) is a 64-bit library. Create a dedicated `.venv` for AVAS and install the project dependencies there to avoid running directly in an existing environment such as Anaconda *base*. You can use Python 3.11 provided by Anaconda to create `.venv`; use the Python interpreter inside `.venv` for subsequent dependency installation and running AVAS. The GUI is rendered by Microsoft Edge WebView2 (built into Windows 11); when it is missing AVAS offers to install it.

### Install: create `.venv` in the project directory

**Windows command examples in this README assume PowerShell** (select a PowerShell tab in Windows Terminal). AVAS also works in Command Prompt (CMD), but the virtual-environment activation command differs; when copying examples into CMD, remove `#` and the comment that follows it.

From the repository root, using a 64-bit Python that satisfies the table above (replace `python` with the interpreter you want, e.g. `C:\Python311\python.exe`):

```powershell
python -m venv .venv
```

Activate it and install AVAS with all dependencies in editable mode:

```powershell
.\.venv\Scripts\Activate.ps1
```

```powershell
python -m pip install --upgrade pip
```

```powershell
pip install -e .[dev]
```

In CMD, activate with `.venv\Scripts\activate.bat`. On Linux / macOS activate with `source .venv/bin/activate`.

Afterwards `.\run_avas.py ...` and `.\run_avas.cmd ...` always execute inside `.venv`, whichever Python launched them and without activating first (set `AVAS_NO_VENV=1` to opt out). With the venv activated the `avas` and `avas-gui` commands are available directly. `.venv/` is git-ignored. Without a venv, `pip install -e .` in any suitable environment works too.

### Command line

Input and output directories are independent. `--input` is the directory holding `input.txt`, `beam.txt` and the lattice (or a project directory containing `InputFile/`); `--output` is any directory and is created if needed. The lattice is `[lattice] source` from `ini.ini` (chosen on the Lattice page), else `lattice_mulp.txt`; `--lattice FILE` overrides it.

```powershell
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

Parameter scan: one run per value of one parameter, results printed as a table and written to `<project>/Scans/<label>_<time>/` (`scan.json`, `scan.csv`); the project's inputs are not changed.

```powershell
avas scan --input "C:\proj\InputFile" --target Q1 --param G --values 10,12,14
avas scan --input "C:\proj\InputFile" --target 12 --param phase --values -40:-20:5          # line 12, start:stop:count
avas scan --input "C:\proj\InputFile" --keyword beam.particlenumber --values 1000,5000 --metrics transmission,energy_out
```

A plain run no longer writes into the input directory: the text inputs (input.txt, beam.txt, the lattice, ini.ini and a particle
file named in beam.txt) are copied to `<output>/inputs/`, the generated `lattice.txt` is written there, and the engine runs on that
copy with the original input directory as field-map directory (field maps are not copied). `avas_run.json` records it as
`inputs_dir`, so every result folder shows exactly which inputs produced it. Error studies (`--mode stat | dyn | stat_dyn`) work on the
same copy: the `lattice.txt` of every error seed is written to `<output>/inputs/`, and nothing in the input directory is rewritten.

### GUI

The interface opens either as a **desktop window** or in a **browser** (see "Browser mode" below); the pages, features and live display are identical.

```powershell
avas gui
```

`avas gui` (or `avas-gui`) opens a desktop window (pywebview + Edge WebView2) with a VS Code-like layout: menu bar, side bar, pages, log panel, status bar. Eight pages follow the workflow: **Project** (a welcome page without a project; with one, an overview of the last run including DataSet diagnostics such as NaN columns or a lost beam, the beam, lattice statistics and settings; switching projects lives in the File menu and the project switcher in the title and status bars), **Beam** (saving keeps keywords the page does not manage, and comments), **Lattice** (run-lattice selection; Monaco text editor with highlighting, folding, completion, hover help and problem markers, side by side with the physical-parameter editor: beamline schematic, element tree, property form, per-keyword parameter table), **Settings**, **Files** (content-aware views of everything in `InputFile/`, table and text tabs on the same content, rename / duplicate / recycle bin / import), **Run** (child `avas run` process, live progress incl. min/h ETAs, engine output in the log; run records: every full run overwrites `OutputFile/`, so "Keep this run" copies it with its `inputs/` snapshot to `Runs/<time>_<label>/`, and a new run first asks about an unkept result), **Scan** (one parameter of a lattice element or a beam.txt / input.txt keyword over a list of values, each run on a copy of the inputs, live table and curve of the collected metrics, results in `Scans/`), and **Results** (interactive Plotly plots; phase-space viewers with density re-binning on zoom and percent emittances; publication-quality export through matplotlib; OutputFile, kept runs, segment runs or any folder as source; "Compare runs" overlays one quantity of several runs). Help menu: an offline bilingual Markdown manual in a non-modal floating window with contents, text search, dragging, resizing and maximize/restore; reopening resets its position and size. Parameter reference comes from the editor schema. Keyboard shortcuts and About are also available. Beam and Settings pages have undo / redo. Theme switching (system / light / dark) takes one frame (~20 ms); UI scale 90–150 %; Chinese / English switch instantly. Unsaved pages are marked and prompted for before closing or switching projects. Settings: `%LOCALAPPDATA%\AVAS\gui.json`; logs: `%LOCALAPPDATA%\AVAS\logs`.

The Lattice page also has a **visual editor** on the same text model (one undo history): a component palette to drag elements onto the beamline (dropping into a drift splits it so downstream positions stay put; dropping into a superpose block adds a superpose at that z0), a large layout with element glyphs and the x/y envelope of the last run, the **linear envelope preview** (`avas/sim/linear_optics.py`: reference particle, 4×4 moment transport through matrix elements and field maps, linear space charge; energies within ~0.01 % and rms sizes typically within 1–2 % of the engine), apertures, losses and energy; a three.js 3D view with fly-through; and a component inspector (quadrupole cross-section and forces, cavity Ez(z) and phase dial, …) whose handles and sliders update the preview live while dragging. The visual editor opens in a browse state and changes the lattice only after **Edit**; **Done** asks about unsaved changes (save / discard this editing session / keep editing). Clicking a curve or its legend entry highlights it, double-clicking a legend entry shows only that curve (the Results plots behave the same); the × on the left of a legend entry hides that curve (it stays in the legend struck through, *Show all curves* restores; remembered in the browser storage). The last run's curve is off by default (Overlays menu, or it turns on when its replay starts). While a simulation runs, the envelope grows row by row as the engine writes DataSet.txt, a schematic bunch marks the current position, losses flash where they happen and the previous run stays as a grey reference; error studies show the finished seeds, a finished segment run is overlaid at its entry, and the status bar tells when the lattice was edited after the last run. **Replay** walks the bunch along the last run at uniform speed or with the beam's time of flight; the 3D view draws a particle cloud (labelled *schematic*: sizes from the rms envelope, particles are random samples) and can follow it with the camera.

**Run page and input lock.** Below the progress, *Live beam* draws the lattice the run uses with the envelope written so far, the moving bunch and the losses, and shows the bunch position, macro-particles alive, transmission, energy and rms sizes (segment stages, error seeds and the assistant's sandbox evaluations included); after the run it keeps the final state and offers a replay; during a project run *Compare with the run before* (off by default) overlays the previous envelope in grey. Every finished record in the *Run records* list below (OutputFile, kept runs, segment runs) has a **Replay** button: the panel switches to that record (drawn on the lattice of its `inputs/` snapshot; a segment run at its entry z) and starts the replay, × returns to the last run, and a new run takes the panel back (`run.replay` reads the envelope from the record's DataSet.txt). While a project run, error study or segment run is running or paused, all input files are read-only (Lattice, Beam, Settings and Files pages, the run-lattice selection; the back end refuses writes too, and the assistant's change proposals are refused with an explanation), because segment runs copy InputFile at the start of every stage and the run record's input snapshot and the live display describe the inputs the run started with; editing in between would mix two configurations. The assistant's scans and the Scan page work on copies and do not lock. **View → Motion** chooses full (the default) / reduced / off / automatic (follows Windows' animation effects).

In the beamline layout on the Run and Lattice pages, the mouse wheel zooms the plot without scrolling the page. Move the pointer outside the plot to scroll the page normally.

Both the 2D layout and the compact structure schematic show overlapping elements in separate display lanes at their true z extents. Each lane can be selected independently; hovering lists all elements at that z, and brackets identify superpose groups. Lanes are schematic only and do not represent transverse offsets. Many lanes can be viewed by scrolling.

Both 2D and 3D views provide **Zoom in / Zoom out / Fit all** together at the top left, without requiring wheel or touchpad gestures. Double-click empty space to fit the whole view. In 3D, double-clicking an element focuses it; in 2D, double-clicking the view still fits all, and double-clicking a legend entry still shows only that curve.

Clicking an element in the 2D / 3D diagram expands its outline ancestors and scrolls to the highlighted row, including repeated clicks on the same element. Search or filter conditions that hide it are cleared.

Element lists show RF cavities, static electric/magnetic fields, and magnet types inferred from field-map names. Field-map types are marked as such; inferred types are explicitly labelled. Search accepts English and Chinese type names in both the visual and structure editors.

In a short window, the visual editor shrinks its 2D / 3D view to keep the element list and parameter panel accessible. If there is still too little room, the editor scrolls. Enlarging the window restores the preferred view height; the divider can also be dragged to adjust it.

#### Browser mode

```powershell
avas serve --open
```

`avas serve` runs the back end without a window and prints a URL (with a random access token) to open in any modern browser; `--open` opens it, `--port` / `--host` choose the address (the default binds to this machine only; `--host 0.0.0.0` exposes it to the network, where the token is the only protection because there is no user management yet). In a browser the native file dialogs are replaced by the page's own folder / file chooser, "open folder" shows the folder with download buttons, "open file" and plot export download the file, and links open in a new tab; the Exit entry is absent (close the tab). Everything else, including the live run display and the assistant, is identical.

### Software updates

The interface checks official updates from `lycself/AVAS` in the background and caches checks for six hours. **Help → Check for updates** checks immediately. Network errors do not block normal use. Review the update and choose **Update and restart**. If a newer version appeared before confirmation, review it again; after confirmation the exact commit is pinned. Ignoring a version affects only that commit; the dialog reminds you that updates remain available from Help.

Before committing, the AI or developer adds a reviewed [change fragment](docs/changes/README.md). CI checks for new entries. Publishing collects entries since the last successful release into the generated `docs/update-notes.md` artifact, update dialog and Release. It neither uses commit titles nor calls a model to write release prose.

Updates are published only after main passes Python/frontend CI, Windows packaging and startup checks. Git installations require the official origin, a clean main branch and a fast-forward update. Source archives use a verified file manifest; Windows bundles use an independent updater. Projects, results, settings and `.venv` are retained; local edits and file collisions stop the update. Source installations must run inside their own `.venv`; required dependencies are installed during updating. Incompatible Python versions require manual intervention.

Finish all simulations (including paused runs), scans and AI studies first. Preparing an update prevents new simulations; unsaved edits are handled before exit. Close other AVAS processes using the same installation under your account before installation. Prepared updates survive page refresh, and results are shown after restart. Browser mode provides checks and a download link; update the backend machine locally and restart `avas serve`.

Existing users need one manual pull or a new official package to obtain the updater. Windows users should download `AVAS-<version>-setup.exe`; no Python, Git or GitHub account is required. Setup downloads WebView2 if missing. For portable use, extract all of `avas-windows.zip` and run `AVASGui.exe`; do not copy the executable alone. Developers can use `avas-source.zip` with Python dependencies. `update.json` is machine-readable metadata, and GitHub’s Source code assets are source archives, not Windows applications. GitHub Download ZIP is also recognized when it contains the revision marker; an intermediate commit without published assets uses its exact official GitHub archive as the file baseline. Older unstamped archives require a fresh download. Keep `.avas-install.json` / `.avas-source.json`.

Logs, results and program backups are under `%LOCALAPPDATA%\AVAS\updates\update-*\`. Failed file replacement attempts backup restoration; a failed packaged startup check also restores the old bundle. Python dependency changes cannot be fully rolled back. For a dependency failure, retain the backup and log, repair using `.venv\Scripts\python.exe -m pip install -e .` and `.venv\Scripts\python.exe -m pip check`, then restart. Keep `journal.json` after an interrupted installation; do not mix program files from different versions.

### AI assistant

The **AI assistant** (`Ctrl+Shift+A`) works with any OpenAI-compatible endpoint, local (Ollama, LM Studio, vLLM, llama.cpp, Xinference) or hosted, with native or prompted tool calls. It reads the project, results, log and user manual; changes to the lattice, beam.txt, input.txt or ini.ini are proposals applied only after approval (backed up under `<project>/.avas_ai/backups`, undoable); it can run the simulation, scan parameters and optimise (Nelder-Mead / Powell / random) with the linear preview or with engine runs in a sandbox copy (`<project>/.avas_ai/runs`) that never touches the project's files. API keys go to the Windows Credential Manager.

Front-end build, debug server, packaging and test instructions for developers are in [CONTRIBUTING.md](CONTRIBUTING.md); interface design rules are in [AGENTS.md](AGENTS.md).

### Citation

If you use this code in your research, please cite:

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602

使用说明分为操作指南、案例教程、参数与文件参考，搜索跨栏目并显示来源。两份 Word 的技术内容已整理迁入，旧界面步骤改写；案例保留原文及验证状态。误差案例修订了末尾 drift 缺少参数的问题，校正案例未达到原文目标，旧包络与匹配案例标为待核实。原始 Word 保留不变。

The floating manual has Operation guide, Case tutorials, and Parameters and files, with cross-category search and chapter links. The Word references are migrated with provenance and verification notes. The error example fixes a missing drift parameter; the correction example did not reach its original target, and legacy envelope/matching workflows remain explicitly unverified. Original Word files are unchanged.
