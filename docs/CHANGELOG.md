# 更新记录 / Changelog

## 2026-09-17  v2.0.0  输入文件可视化编辑（以《使用说明20260427》为准）

- 结构页：可选择**运行使用的结构文件**。InputFile 中任意文件名的 AVAS 结构都能选，选择写入 `ini.ini` 的
  `[lattice] source`；命令行新增 `avas run --lattice FILE`，`avas_run.json` 记录所用结构。原来写死
  `lattice_mulp.txt` 的约 20 处（运行、误差分析、校正、后处理、画图）统一改为读取这一设置。
- 新的物理参数结构编辑器（结构页与 Files 页共用）：束线示意图、按 `!name` 与分组注释组织的结构树、带单位和下拉
  选项的属性表单、按关键字的参数表（支持批量设置）；修改直接改写文本对应行，可撤销，注释保留。
- 按使用说明检查：参数个数与数值、枚举取值、叠加场规则、校正铁长度、首末元件、场图文件是否齐全。
- 新增 `avas/data/schema.py`：lattice、beam.txt、input.txt、ini.ini 全部关键字的参数名、单位、取值与说明，
  作为界面和检查的唯一来源。
- Files 页按内容识别文件并分组；beam/input 关键字表、ini 表、SeParticle 表、TraceWin 结构只读表、
  dst/edst 束流参数与相空间图（可设为初始束流）、场图网格与轴上场曲线。
- 修复：Settings 页保存时会把 `ini.ini` 中其他节重置为默认值；`IniConfig` 读到未知键时报错。
- 修复：点击 Files 页「重新加载」「保存」等按钮报 `takes 1 positional argument but 2 were given`
  （`guarded` 装饰器把按钮的 checked 参数传给了槽函数，Beam / Lattice 页的同类按钮一并修复）。
- 测试改用独立的 `AVAS-test` 配置，不再改动用户自己的界面设置。
- 仓库不再跟踪例子的模拟输出（`examples/*/OutputFile/`）和自动生成的 `lattice.txt`；GUI 测试开始前先跑一次例子生成结果。

## 2026-09-16  v2.0.0  界面第三轮：VS Code 式布局与浅色 / 深色主题

- 主题：新增浅色 / 深色 / 跟随系统三种模式（**View → Theme**，状态栏按钮一键切换），即时生效；配色参照 VS Code
  Light Modern / Dark Modern，全部颜色集中在 `avas/gui/theme.py` 的令牌表里。深色模式下 Windows 标题栏同步变深；
  跟随系统时，Windows 切换应用颜色模式后界面自动跟随。
- 侧边栏：宽度可拖动（记住上次宽度），拖窄自动收成图标栏，往外拖展开；去掉原来的 ☰ 按钮，改为 `Ctrl+B`、
  双击分隔条、工具栏右侧布局按钮切换。
- 日志面板：面板标题 + 强调色下划线、独立背景和分隔线，与页面区分清楚；可拖动高度、最大化、清空、隐藏（`Ctrl+J`）；
  切换主题时日志按新配色重绘。
- 新增状态栏：项目名、运行模式、错误 / 警告计数、最后一条消息；运行中整条变蓝并显示实时进度。
- 图标：导航、工具栏、面板、状态栏、路径选择按钮统一改用 Codicons（新增依赖 `qtawesome`），不再使用 Unicode 字符和
  Qt 自带图标；工具栏只显示图标，悬停提示含快捷键。
- 图形：界面中的 matplotlib 图随主题配色，切换主题时自动重绘；保存图片始终导出浅色白底样式。绘图代码中写死的黑色
  改为读取 `rcParams`，命令行出图不受影响。
- Lattice 编辑器语法高亮、行号栏、当前行，Lattice 参数表底色，Files 页只读文件颜色都随主题变化。
- 所有页面放入滚动区域，窗口较窄时出现滚动条，而不是限制侧边栏宽度。

## 2026-09-16  v2.0.0  界面第二轮：进度直读、可折叠、扁平化、文件页

- 修复：结果文件中的 `-nan(ind)` / `inf`（如单粒子束的 rms 尺寸）按 NaN 读取，不再让进度轮询与后处理报
  `could not convert string to float`；运行前拦截粒子数 < 2 的多粒子输入。
- 进度：模拟改在子进程 `avas run` 中执行（QProcess），界面逐行解析内核输出的
  `Simulate progress …` 行（百分比 / 剩余时间 / 耗时 / 位置），与终端一致；内核输出同步到日志。
  Windows 上把 C 运行库 stdout 设为无缓冲，管道里也能实时拿到进度。
- 布局：侧边栏可折叠成图标栏（`Ctrl+B`）；日志面板改为 VS Code 式底部面板，标题栏常驻显示最后一条消息 / 实时进度，
  `Ctrl+J` 收起；删除了始终空白的状态栏。
- 缩放：「字号」菜单改为 **View → UI scale**（90–150 %，`Ctrl+=` / `Ctrl+-` / `Ctrl+0`），样式表按基准字号生成并整体重绘，
  不再只影响弹出菜单。
- 视觉：去掉多层卡片嵌套，分区改为「小标题 + 细线」；运行页重排为标题行 + 主按钮、细进度条、内联统计。
- 新页面 **Files**：列出 `InputFile/` 全部文件及角色；任意文本文件可编辑保存，`boundary.txt` / `scanData.txt` 有表格视图，
  自动生成文件只读，二进制数据显示信息。
- Lattice 页新增「参数表」：与文本双向绑定的可编辑元件 / 命令表格，按元件类型提示各参数含义。
- Settings 新增 `multithreading`、`scanphase`、`numofgrid`、`meshrms`；保存时保留页面不认识的 `input.txt` 关键字；
  关键字读取不区分大小写。
- 翻译：新增 80 余条中文；运行时直接读取 `.ts`，不再依赖过期的 `.qm`。

## 2026-09-16  v2.0.0  图形界面重做

- 界面按工作流重排为 Project / Beam / Lattice / Settings / Run / Results 六页，左侧导航栏、顶部工具栏、底部日志面板。
- 互斥选项全部改为单选按钮；Lattice 页合并编辑器与元件表；误差分析作为 Settings 里的一种运行模式。
- 图形嵌入主窗口标签页（可刷新、可保存图片），不再弹出散落的 matplotlib 窗口。
- 运行前自动保存并校验；进度、耗时、上次运行状态记录在 OutputFile/avas_run.json。
- 语言与字号切换即时生效；新增 Fusion 风格主题。

## 2026-09-16  v2.0.0  项目重构

- 目录重构：全部代码移入 `avas/` 包（cli / gui / api / core / sim / post / data / utils / engine / static / i18n），
  可 `pip install -e .`；历史 DLL、旧脚本归档到仓库外的 `archive/`。
- 新命令行：`avas run --input DIR --output DIR`、`avas plot TYPE ...`、`avas gui`；输入/输出目录完全解耦。
- 图形界面：启用 Qt 高 DPI 缩放；新增 Settings → Language（中文 / English）与 Font size。
- 界面文字全部改为 `tr()`，翻译文件 `avas/i18n/avas_zh_CN.ts`。
- 修复：柱状图基类缺少 `fig_size`；相移图在无周期时给出明确错误；移除硬编码的开发者路径。

## 旧记录

3.20 
 重构了AVAS的GUI

5.7 优化误差部分代码