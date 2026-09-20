# AVAS 开发约定（给 AI 编程助手和开发者）

本文件是本仓库**唯一的**开发规则来源，Codex、Cursor、Copilot、Claude Code 等工具都应先读它（`CLAUDE.md` 只是引用本文件）。
改动设计时，同一次修改里同步更新本文件。从头到尾的构建 / 调试 / 打包步骤见 [CONTRIBUTING.md](CONTRIBUTING.md)（面向人类贡献者，规则仍以本文件为准，两者不要各写一份互相矛盾的步骤）。

## 1. 项目概况

AVAS（Advanced Virtual Accelerator Software）是直线加速器束流动力学模拟程序：

- C++ 计算内核：`avas/engine/AVAS.dll`（Linux 为 `libAVAS.so`），只有二进制，没有源码，不要修改。
- Python 包 `avas/`：模拟流程、前后处理、命令行 `avas run / plot / gui / serve / info / doctor`。
- 界面：React 网页前端（`frontend/`）+ Python 后端（`avas/gui/services/`），二者只通过 HTTP / WebSocket 通信（`avas/gui/server.py`）。
  `avas gui` 把页面放进 pywebview + Edge WebView2 桌面窗口；`avas serve` 不开窗口，在浏览器里用同一个页面（将来部署到服务器的基础，
  目前没有用户管理和工作区隔离，只在本机或可信网络使用）。
- 右侧 AI 助手：OpenAI 兼容接口（含本地模型），修改必须经用户批准。

用户是加速器物理研究人员，界面有中文 / 英文，**和用户交流用中文**。

## 2. 目录地图

```
avas/
  cli/            命令行入口（main.py；scan_cmd.py 是 avas scan）
  gui/            界面后端：server.py HTTP / WebSocket 服务（RPC、事件、blob、下载、令牌），bridge.py RPC 注册与事件队列，
                  app.py 桌面窗口（avas gui），serve.py 浏览器模式（avas serve），devserver.py 旧命令的别名
    services/     每个页面一个模块，函数用 @rpc("page.action") 注册；fs.py 给页面自带的文件选择器列目录；runs.py 运行记录归档；scan.py 参数扫描
    web/          前端编译结果（提交到仓库，用户不需要 Node.js）
  ai/             AI 助手：client.py、agent.py、avas_tools.py（工具）、sandbox.py（副本上运行模拟）、avas_prompt.py
  data/           schema.py（全部关键字的参数、单位、中英文说明）、lattice_doc.py（lattice 解析与检查）、segment.py（分段运行物理）、
                  lattice_edit.py（按名称 / 行号定位元件并改一个参数，beam/input 关键字改值；AI 工具、扫描、命令行共用）、inputs.py（复制文本输入）
  sim/            模拟流程；linear_optics.py 线性包络预览；error.py 误差研究；scan.py 参数扫描（GUI 与命令行共用）
  post/           后处理（analysis/、plot/）
  core/ api/ utils/ engine/ static/ gpu/    api/basic.py 只有运行入口（惰性导入），api/plotting.py 是命令行画图；无人调用的旧代码在仓库外 archive/
                  utils/readfile.py 的 read_lattice_mulp* 只是 LatticeDocument 之上的适配层（tests/test_lattice_parsers.py 有逐字节金标准）；
                  utils/keywordconfig.py 让 BeamConfig / InputConfig 的键表和类型来自 schema.py，不要再手写键列表；constants.py 的关键字集合同样派生自 schema
frontend/src/
  bridge.ts       与后端的通信（fetch + WebSocket、令牌、blob）；host.ts 桌面窗口 / 浏览器的差异（文件对话框、打开文件、退出、缩放）
  components/     ui.tsx（按钮、输入框等基础组件）、overlays.tsx（菜单、对话框、toast）、Plot.tsx（Plotly 封装）、FileDialog.tsx（浏览器模式的文件选择器）
  pages/          八个页面（ScanPage 是参数扫描）
  lattice/        文本编辑器（Monaco）、结构编辑器、可视化编辑器、2D 布局、3D 视图（Beamline3D.tsx 只是 React 壳，b3dViewer.ts / b3dHud.ts / b3dGeometry.ts 单向依赖）
  results/ files/ assistant/ shell/ store/（zustand）；util.ts（basename、cssColor、niceStep、debounce）；shell/shortcuts.ts（全部快捷键的唯一表）；results/CompareTab.tsx 运行对比
  i18n/zh_CN.json 中文翻译（英文原文 → 中文）
  styles/tokens.css 全部颜色变量（浅色 + 深色）
tests/            pytest；test_gui.py 覆盖页面调用的每个接口；前端 vitest（frontend/src/**/*.test.ts）
.github/workflows/ci.yml  CI：ruff + 快速 pytest（Windows，含 smoke）、npm test + build
examples/hwr010/  示例项目（跑一次约 10–30 秒）
docs/             使用说明（以 使用说明20260427.docx 为准，121 版已过时）、CHANGELOG
scripts/          用户个人分析脚本，不属于软件本体，不要重构
packaging/        PyInstaller + Inno Setup 打包
```

## 3. 环境与常用命令（Windows）

- Python：只用仓库里的 `.venv`（Python 3.11），命令写 `.venv\Scripts\python.exe`。**不要用 Anaconda base 解释器**；不要新增创建 venv 的安装脚本（用户明确不要，README 写手动步骤）。
- 测试：`.venv\Scripts\python.exe -m pytest`。`tests/test_gui.py`、`tests/test_segment.py`、`tests/test_scan.py` 会真正运行内核，较慢；改哪部分至少跑对应的测试文件。
- 静态检查：`.venv\Scripts\python.exe -m ruff check avas tests packaging`（只开缺陷类规则，见 pyproject.toml；旧代码不重排风格）。前端 `cd frontend && npm test`（vitest，纯函数测试）。
- 前端：`cd frontend && npm run build`（先 `tsc --noEmit` 再 `vite build`），输出到 `avas/gui/web/` 并写 `source-hash.json`。**改了前端就要重新构建，并把 `avas/gui/web/` 一起提交。**
- 浏览器调试界面：`.venv\Scripts\python.exe -m avas serve --port 8765 --token dev --settings <临时 json>`，打开它打印的地址
  （`http://127.0.0.1:8765/index.html?host=browser&token=dev`；`python -m avas.gui.devserver` 是同样效果的旧命令）。改了 Python 代码要重启它。
  脚本调用后端：`POST /api/rpc`（JSON `{"method","params"}`，头 `X-AVAS-Token`），事件用 WebSocket `/api/events?token=…`。
  加 `--fake-engine 60 [--fake-lose 0.1]` 时运行不调用内核，而是重放输出目录里已有的 DataSet.txt（`avas/gui/fake_engine.py`），用来检查实时显示。
  **不要在用户的真实项目上用假引擎**（它会改写 OutputFile），先把项目复制到临时目录。
- 打包：`python packaging/build.py`。生成的 exe 不会随源码更新，改代码后要重新打包。
- 模拟结果每次运行略有差别（内核多线程），比较 DataSet.txt 要带容差，不能要求完全相同。

## 4. 修改完成前的检查清单

1. 相关的 pytest 通过；前端有改动时 `npm run build` 成功，且 `tests/test_design_rules.py` 通过（颜色、翻译、构建是否过期）。
2. 新增的界面文字都用 `t("English")`，并在 `frontend/src/i18n/zh_CN.json` 加中文。
3. 新增颜色只加在 `styles/tokens.css`，浅色和深色两套都要给。
4. 新增或修改的后端接口在 `tests/test_gui.py`（或对应测试文件）里有测试。
5. 改动物理计算时，用示例项目跑内核对比，并说明误差。
6. 用户能感觉到的行为变化写进 `README.md`（中英文两部分）；设计规则变化写进本文件。
7. 不要自行 `git commit` / `push`，除非用户要求。

## 5. 不能破坏的设计

### 5.1 界面技术与风格

- 使用说明在当前窗口内以非模态浮动页面显示，不遮罩、不阻挡工作区操作；支持拖动、边缘缩放、最大化和还原。每次关闭再打开恢复默认位置和大小，不持久化几何状态。中英文操作指南在 `frontend/src/help/manual.*.md`，随前端构建离线打包；参数参考读取 `schema.all`，不另写参数表。Word 保留为物理原始参考。浮动页分“操作指南／案例教程／参数与文件参考”三栏；搜索跨栏并显示来源，Markdown 用稳定章节 ID 互链。`cases.*.md` 和 `reference.*.md` 保留来源与核对状态，原案例片段在 `help/cases/`，迁移清单与验证条件随源代码保留；未复现的旧包络／匹配流程不得标为当前可运行功能。

- 技术栈固定：React 19 + TypeScript + Vite + zustand 前端，FastAPI + uvicorn 后端服务，桌面窗口用 pywebview；文本编辑用 Monaco，图用 Plotly，3D 用 three.js。不要引入其他 UI 框架或组件库。
- **桌面与浏览器两种宿主**：页面地址里的 `host=webview|browser` 决定（`bridge.ts` 的 `isDesktop()`）。所有依赖宿主的操作
  （文件对话框、打开文件 / 文件夹、外部链接、退出、缩放）只写在 `host.ts` 里，页面调用 `pickFolder` / `pickFile` / `openPath` 等，
  **不要在页面里直接调 `dialog.*` / `shell.*` / `app.quit` / `app.zoom`**。浏览器里用 `components/FileDialog.tsx`（后端 `fs.list`）、下载链接 `/download?path=`。
- 优先复用 `components/ui.tsx`、`components/overlays.tsx`（`openMenu`、`choiceDialog`、`toast`、`reportError` 等）、`components/Plot.tsx`。
- **颜色**只来自 `styles/tokens.css` 的 CSS 变量；canvas 和 three.js 通过 `getComputedStyle` / `cssColor()` 读取变量。确实需要写死颜色时（Plotly 调色板、Monaco 主题）在该行注明 `design:allow-colour 原因`。主题切换必须保持一帧内完成，不要做逐元素重新计算样式的方案。
- **文字**：界面文字写英文原文 `t("...")`，中文放 `zh_CN.json`；带参数用 `t("… {name}", { name })`。关键字、参数的物理说明来自 `avas/data/schema.py` 的中英文对照，前端用 `pick()` 选择，不要在组件里另写说明文字。
- 布局仿 VS Code：菜单栏、左侧导航、页面、下方日志面板、状态栏。页面切换时**页面保持挂载**（`display: none`），写 effect 时要考虑页面隐藏的情况。
- 界面缩放、主题、语言等偏好保存在 `%LOCALAPPDATA%\AVAS\gui.json`（`persist()`）；只影响单个视图的小状态可以放 `localStorage`，读写要 try/catch。

### 5.2 前后端通信

- 前端只通过 `call(method, params)` 调用后端（`POST /api/rpc`）；后端函数放在 `avas/gui/services/<页面>.py`，用 `@rpc("页面.动作")` 注册。
  桌面窗口和浏览器走同一条 HTTP 通路，pywebview **不再**提供 js_api，也不用 `evaluate_js` 推送事件。
- 每个请求必须带启动时生成的**访问令牌**（头 `X-AVAS-Token`，WebSocket 和下载链接用 `?token=`），页面从自己的地址里读取；
  不要加免令牌的接口，也不要放开 CORS（RPC 能读写本机文件）。服务器默认只监听 127.0.0.1。
- 需要显示给用户的错误抛 `bridge.UserError("…")`；其他异常会作为程序错误记录日志。
- 大的数值数组用 `bridge.blob(array)` 以二进制传输，不要塞进 JSON。
- 后端主动通知用 `bridge.emit(name, payload)`（批量经 WebSocket 发送），前端 `on(name, fn)` 接收。payload 要是发送时刻的快照（深拷贝），不要传之后还会被修改的对象。
  没有页面连接时事件直接丢弃，不排队；页面重连后收到本地事件 `bridge.reconnected`，需要的状态自己重新取（`store/app.ts` 已取运行状态和项目摘要）。
- `project` 事件在项目摘要任何变化时都会发出，不只是切换项目；重置"每个项目"的界面状态前先比较项目路径。
- 后端 `UserError` 的文字是英文，前端在 `zh_CN.json` 有对应条目时自动翻译（`bridge.ts`）；给用户看的固定提示请同时加翻译。
- 运行记录 `avas_run.json` 里的 `lattice_sha1` 是运行所用 lattice 文本的指纹（`avas/gui/textio.py` 的 `text_fingerprint`，前端 `textFingerprint` 必须算出相同结果），用于提示"上次运行后 lattice 已修改"。
- **绝不能在 pywebview 的界面线程事件（如窗口关闭）里调用 `evaluate_js`**，会死锁；需要的状态保存在 Python 端（正常代码路径已不用 `evaluate_js`，只有自动化检查脚本用）。

### 5.3 Lattice 编辑

- 可视化编辑器 2D / 3D 选中元件时，列表展开其全部祖先分组并滚动到高亮行；重复点击同一元件也触发定位。搜索或筛选挡住目标时只清除阻挡目标的条件；手动折叠、输入筛选本身不触发重新展开。

- 结构 / 可视化编辑器共用的元件列表显示具体类型，并支持中英文类型搜索；场图射频 / 静电 / 静磁分类来自场类型，静磁元件复用图形的场文件名推测规则，必须标注“推测”。无法识别时保留场类别或关键字名称，不把名称推测作为物理数据。

- 二维布局图与结构页小束线图按真实 z 区间将重叠元件上下分层，横向位置和长度不变；分层仅用于示意，不表示横向偏移。各层独立点击选中，悬停列出当前位置全部叠加元件，superpose 组用括线标识；层数不限，多层或小窗口允许滚动，不压缩成无法辨认的图形。显示层号不能改变孔径等物理数据的选择规则。

- 2D / 3D 视图区左上角统一使用 ViewNavigation 的放大、缩小、显示全部按钮，外层不再重复提供入口；2D 为工具栏预留顶部空间。按钮围绕当前观察中心缩放，不依赖指针检测。3D 双击空白显示全部、双击元件聚焦；2D 双击视图显示全部，图例双击仍只显示该曲线。3D 手动缩放停止漫游和束团跟随。

- 可视化编辑器的 2D / 3D 上方视图区随可用高度收缩（最低 160px），下方元件列表和参数面板至少保留 180px；空间不足时编辑器滚动，不能裁掉下方面板。窗口缩小时不覆盖用户保存的视图区高度，恢复窗口后恢复该高度；拖动分隔条从实际显示高度开始计算。
- 一个 lattice 文件在界面里只有**一个 Monaco 文本模型**，它是唯一的数据源。结构编辑器、可视化编辑器、AI 助手的修改都以"一次修改 = 一步撤销"写回这个文本模型，再重新解析（`lattice.parse`）。不要另存一份可以单独修改的元件数据。
- `LatticeEditor` 用带 key 的子元素切换"文本 + 结构"和"可视化编辑器"两种模式，保证文本面板不被重新挂载（未保存的文字和撤销历史不丢）。
- 修改只改写对应的行，保留注释和页面不认识的关键字；beam.txt、input.txt 保存时同样只改页面管理的关键字。
- 参数含义、单位、取值、检查规则以 `docs/使用说明20260427.docx` 为准，集中写在 `avas/data/schema.py` 和 `avas/data/lattice_doc.py`。schema 是唯一的关键字表：改类型 / 取值时只改 schema，配置类、常量表、界面都会跟着变。
- 运行使用的 lattice 是 `ini.ini` 里 `[lattice] source` 指定的文件，用 `avas.paths.lattice_source_path()` 获取；**不要写死 `lattice_mulp.txt`**。路径一律用 `avas.paths` 里的函数，不要用 `__file__` 层层向上找。
- TraceWin `.dat` lattice 目前只读。
- **可视化编辑器的浏览 / 编辑状态**：打开、切换项目、重新载入、运行开始时都回到浏览状态（`store/latticeUi.ts` 的 `visualEditing`，不持久化）。
  浏览状态下可视化编辑器和旁边的文本栏都是只读，改动入口（元件面板、手柄、参数、结构树拖动、快捷键）一律不可用并给出提示；
  「完成」时有未保存修改必须询问「保存 / 放弃本次编辑 / 继续编辑」。「文本 + 结构」模式不受此限制。
  页面发来的整段替换（还原、已批准的 AI 修改）在浏览状态下也要生效（`TextEditor.setText` 临时解除只读）。

### 5.4 运行

- 同一时间只运行一个任务：`avas/gui/services/runner.py` 的 `Job`（可含多个 `Stage`）。暂停是挂起整个子进程树（`avas/gui/proctree.py`），不是停止。
- 开始运行前前端会先检查并保存所有有修改的页面（`actions.ts` 的 `prepareRun`）。
- 分段运行（`avas/data/segment.py`、`services/segments.py`）结果写在 `<项目>/Segments/<名称>_<时间>/`，不改项目的 OutputFile。
- **运行记录**（`services/runs.py`）：完整运行总是写 OutputFile 并覆盖上一次；`runs.archive` 把 OutputFile（含 `inputs/` 快照）复制到
  `<项目>/Runs/<时间>_<名称>/`，并在 OutputFile/avas_run.json 记 `archived`。前端开始运行前先调 `runs.unsaved`，上次结果完成且未保留时
  询问「保留并运行 / 直接运行 / 取消」（`actions.ts` 的 `resolveUnsavedRun`）。`results.sources` 列出 OutputFile、已保留运行（kind `archived`）和分段运行；
  `runs.delete` 三种都能移到回收站。
- **参数扫描**（`avas/sim/scan.py`、`services/scan.py`、`avas scan`）：在 `<项目>/Scans/<名称>_<时间>/` 下用 `Sandbox(root=...)` 跑副本，
  每个取值一个 `run_NNN/`，结果 `scan.json` / `scan.csv`。扫描是一个 activity（source `scan`），运行页 / 状态栏 / 实时显示按 assistant 同样处理，
  期间不能开始普通运行；`scan.start` 在返回前就占住 runner（`prepare_scan`），不要改成线程里再占。改 lattice 参数用 `avas/data/lattice_edit.py`。
- AI 助手的参数扫描 / 优化在 `<项目>/.avas_ai/runs/` 的副本里运行（`avas/ai/sandbox.py`），开始时复制输入文件，**不能改动项目的 InputFile 和 OutputFile**。
- **运行锁**：完整运行、误差研究、分段运行进行中（包括暂停）时，所有输入文件只读。原因：分段运行每个阶段开始时才复制 InputFile，
  而且 `<输出>/inputs/` 快照与实时显示都对应运行开始时的输入（完整运行和误差研究自 2026-09-20 起都在该快照上运行，不再读 InputFile）。
  实现分三层，新增写输入文件的入口时三层都要照顾到：
  后端写入接口先调用 `avas/gui/locks.py` 的 `require_unlocked()`；前端用 `useInputsLocked()` 让页面只读并显示 `RunLockBanner`；
  AI 修改提案在提出和应用时都检查（`assistant.py` 的 `_refuse_if_locked`），直接拒绝而不是挂起等待。AI 自己的沙盒试算不加锁。
  结构页的文件下拉框只是"打开"（查看 / 编辑），任何时候都可用，运行中只读；把文件设为运行使用（`lattice.setSource`，写 ini.ini）
  是单独的「设为运行结构」按钮，只有它受运行锁约束。不要把"打开哪个文件"和"运行用哪个文件"重新耦合到一个控件上。
- **实时显示**：`avas/data/dataset_stream.py` 增量读取正在写的 DataSet.txt（比运行开始时间更早的文件是上一次运行的，忽略到被重写为止）；
  `avas/gui/services/live.py` 每秒轮询当前运行（一个 job 或一次 AI 研究，每次内核运行一个 episode），用 `run.live` 事件推送新增行，
  `run.liveSnapshot` 一次取全；前端 `store/live.ts` 保存，`lattice/bunchPlayer.ts` 统一给出束团位置（实时跟随 / 回放），
  2D（`LayoutView`）、3D（`Beamline3D`）、运行页（`LiveBeamPanel`）只负责画。束团和粒子云是按 rms 包络画的**示意**，界面上必须标注，
  不能画成像真实分布。可视化编辑器只显示本项目的完整运行、误差研究和分段运行；AI 试算只在运行页显示。
- **回放的分工**（2026-09-20 与用户商定）：运行页是回放的主场——实时面板在运行结束后回放本次运行，「运行记录」列表里每条完成的记录
  有「回放」按钮，`run.replay(outputDir)` 从记录的 DataSet.txt 读包络（完整运行按 `inputs/` 快照里的 lattice 画，分段运行用项目当前 lattice
  加 z 偏移），前端 `store/live.ts` 的 `record` 让 `LiveBeamPanel` 切换到该记录，新运行开始（`begin` 事件）时自动清掉。
  结构页只回放「上次运行」（曲线绑定正在编辑的 lattice），不做历史选择；结果页不放播放器。运行页的「与前一次运行对比」灰线和结构页一样
  默认关闭（`localStorage` `avas.live.compare`）。结构页「上次运行」曲线默认不显示（显示设置存 `avas.visual.show.v2`，旧键会迁移），
  回放条不依赖它，点回放时自动打开。图例每项左侧的 × 隐藏该曲线（×放右侧会和 x/y 字母混淆），隐藏集合存 `localStorage` `avas.layout.hidden`，
  所有布局图共用。
  动画遵守 **视图 → 动效** 设置（用户要求默认「完整」；「自动」才跟随 Windows 动画效果），最多 30 帧 / 秒，不可见时停止。

### 5.5 AI 助手

- 必须支持 OpenAI 兼容接口和本地模型（数据可能不能离开本机）；客户端只用标准库。API 密钥存在 Windows 凭据管理器，不写进设置文件。
- 对项目文件的每一处修改都是一张提案卡片，用户批准后才写入（或用户在该对话打开了自动应用）；写入前备份到 `<项目>/.avas_ai/backups/`，可撤销。不要增加绕过批准的写文件途径。
- 本机没有真实的大模型服务，测试用 `tests/test_assistant.py` 里的脚本化模拟服务器。

### 5.6 软件更新

- 官方源固定为 `lycself/AVAS`。main 通过 CI 后生成源码包与 Windows 程序包并验证，再发布 `avas-latest/update.json`；固定提交的包放 `avas-<完整 SHA>` 发布中，不覆盖。发布时检查祖先关系，较旧流水线不得覆盖较新的指针。
- 后端 `services/updates.py` 统一检测与准备，`avas/updates.py` 下载校验，标准库独立程序 `avas/update_worker.py` 在主进程退出后安装；Windows 打包成独立的 `AVASUpdate.exe`，不能依赖将被替换的 `_internal`。
- 自动检测缓存 6 小时，帮助菜单可强制检查；用户确认前重新检查，目标变化要重新确认。确认后所有获取与安装锁定 SHA，禁止裸 `git pull` 或下载可变分支压缩包。忽略版本按 SHA 保存，弹窗明确提醒仍可从帮助菜单获取更新。
- 每次提交前，AI / 开发者必须主动新增 `docs/changes/*.md` 简短变更条目，用用户能理解的语言说明变化；内部维护也须明确说明范围。尚未提交的本次条目可编辑，已提交条目不可修改或删除，纠正时另增条目。CI 检查提交范围内新增非空条目。发布脚本按 `avas-latest/update.json` 的上次成功提交汇总新条目，生成 `dist/updates/docs/update-notes.md`（源码包内为 `docs/update-notes.md`），不回写提交；同一份文字固定写入该版本的 `update.json` 和 GitHub Release。弹窗按纯文本展示，不执行 HTML，也不从 Git 提交标题生成说明；新版本重新确认时同时展示新版本说明。
- 正式发布同时包含 Windows Inno Setup 安装包 `AVAS-版本-setup.exe`、`avas-windows.zip`、`avas-source.zip` 和 `update.json`。首次安装推荐 setup.exe，自动更新继续使用 ZIP；CI 缺少安装编译器必须失败，不能静默跳过。Release 正文统一解释所有附件（含 GitHub 自动源码归档），自动更新入口注明供程序使用并链接正式版本。
- Git 更新仅支持官方 origin 的干净 main，快进到确认的提交，不 stash/reset/clean；源码与打包版按 `.avas-install.json` 哈希验证本地改动，备份后替换并处理移除的程序文件，不覆盖用户新增文件。GitHub 源码 ZIP 用 `.avas-source.json` 的 export-subst 标记读取基准版本；中间提交无发布包时取该 SHA 的官方源码归档，不能以现有文件冒充基准。源码/打包版用 GitHub 提交比较防止降级。
- 更新准备通过 `gui/maintenance.py` 与 runner、sandbox 启动共享锁；模拟、暂停、扫描或 AI 试算活跃时拒绝，准备期间不允许新模拟。安装退出由 `host.ts` 触发，保存/放弃编辑仍须询问。浏览器模式仅检测与下载入口，服务器需本机维护。
- `.venv`、项目与结果、个人设置保留。替换失败尝试恢复备份；打包启动检查失败恢复旧程序。源码依赖失败保留日志与修复入口，不能声称环境已完整回退。回归测试只用临时安装目录和本地临时 Git 仓库。
- `installation_lock.py` 为当前用户同一安装目录的 CLI、桌面与服务进程持有共享文件锁；独立更新器取得独占锁后才替换，其他进程仍运行时拒绝。更新准备状态可在页面重连后恢复，重启后读取持久化结果，错误日志与备份不自动删除。

## 6. 物理与内核约定（已用内核实际运行核实，手册里没写清楚的以这里为准）

- **beam.txt twiss**：β 单位 mm/mrad；发射度是**归一化 rms**，π·mm·mrad（rms_x0 = sqrt(β·ε/(βγ))）；twissz 同样单位，z' = Δp/p。
- **场图**：电场 MV/m × Ke，磁场 T × Kb；射频电场按 E·cos(ωt+φ0)，射频磁场用 sin；V3=0 的同步相位 = atan2(∫E sinφ, ∫E cosφ)。场图存储顺序要按**一组分量文件**判断（`avas/data/fieldmap.py: group_order()`），不能按单个文件判断。
- **displacepos** 内核按 **mm** 读取（手册写 m，已在 schema.py 注明）。
- **RF 相位 V3**：V3=2 是 t=0 时刻的绝对相位；synData.txt 的 φRF = phase_t0 + 360·f·t_in。分段运行把中段单独拿出来时，要用 φRF − 360·f·(t_in − T_entry) 重新换算（`segment.rephase`），不能直接沿用或改成 V3=0。
- **输出面**：超出 lattice 末端会报错；离末端太近（5 mm）也会失败，2 cm 可以，所以分段 lattice 会去掉离末端 5 cm 以内的输出面。内核结束时总会写 `outData_<末端>.dst`。
- **单粒子运行**（particlenumber 1 或关闭空间电荷）同步粒子数据相同但 rms 列为 NaN，属正常。
- **DataSet.txt**：每行 41 列；z = 第 5 列 + 第 33 列（有二极铁时按 `dataset_envelope` 的规则累加弧长）；rms x/y/z 为第 16/18/20 列（m），最大值第 22/24/26 列，存活宏粒子数第 28 列，能量第 0 列（MeV）。内核运行开始时重建该文件，之后**逐行追加**，读取正在写的文件要丢弃不完整的最后一行（`read_dataset_array` 已处理）。
- **进度行**形如 `Simulate progress 32.83%. Estimated remaining time 3s. Run time 3s.  5260  0.07m`，末尾两个数是存活宏粒子数和当前位置。
- **误差研究**每组都会重新读取项目里的 lattice 文件（`avas/sim/error.py`），当前一次的输出在 `OutputFile/error_middle/output_0/`，完成的结果复制到 `OutputFile/error_output/output_<组>_<次>/`。
- **线性包络预览**（`avas/sim/linear_optics.py`）只作快速评估：能量误差约 0.01 %，rms 通常差 1–2 %，多粒子效应强时可到 13 %；最终以内核结果为准。
- **GPU**：`avas/gpu/` 只封装了 Linux 预编译的 `libPIC.so`，没有源码；不要提议做 Windows GPU 版本。多线程（input.txt `multithreading 1`）是 CPU 上的加速手段。
- **`multithreading` 只能写 1 或不写**：手册写 0 = 关闭，但内核遇到 `multithreading 0`（2、3 也一样）会在起点丢失全部粒子，报 `End of simulation, all particles lost`（2026-09-19 用示例项目核实，与 particlenumber 无关）。关闭多线程就删掉这一行；设置页（`services/simsettings.py`）已按此处理，`avas/utils/inputconfig.py` 对值为 None 的关键字不写行。
- **运行不写 InputFile**：`basic_mulp` 和误差研究（`api/basic._error_study`）都把文本输入复制到 `<输出>/inputs/`，`lattice.txt`（误差研究还有每个种子的 lattice）生成在那里，内核以副本为输入、原目录为场图目录。`tests/test_error_study.py` 用固定 randomseed 的示例做回归（误差参数文件必须逐字节相同）。

## 7. 协作习惯

- 用户希望先看诊断和方案、讨论确定后再一次性完整实施；方案里的决策点要明确列出。
- 命令行保持简短好用：`avas run --input DIR --output DIR`、`avas plot 类型 --output DIR`、`avas scan --input DIR --target 元件 --param 参数 --values 1,2,3`。
- 旧代码、历史 DLL 和日志已移到仓库外的 `AVAS_NEW/archive/`，不要搬回仓库。
- 示例项目的输出（`examples/*/OutputFile/`）不提交。
