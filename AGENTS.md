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

- 侧栏、首页和关于统一显示版本号与 7 位短提交号；侧栏／首页不显示日期，本地修改以星号和提示标识。关于提供完整提交号、提交时间、软件／界面构建时间及复制版本信息。Git 源码以当前 HEAD 为准，不读遗留打包标记；源码 ZIP 和打包版复用更新模块的发布清单／export-subst 标记，无法识别时明确显示未知。提交时间写入源码归档标记与打包标记；界面构建时间写入 `source-hash.json`，不得用文件修改时间替代。旧包缺少记录时显示未知。

- 构建时间以带时区的 ISO 8601 保存（UTC），关于弹窗按客户端本地时区显示并注明 UTC 偏移；旧包无时区的时间不猜测，标注时区未知。关于弹窗单列参考文献与反馈区（维护者 Yuchen Lin，yuchenlin@stu.xmu.edu.cn）。

- 输入设备模式为全局设置 `ui/pointerDevice`（自动／鼠标／触控板），设置页、设置菜单与 3D 快捷入口同步；未设置时沿用旧 `ui/b3dPointer`。2D、3D 与 Plotly 共用手势识别，鼠标滚轮缩放，触控板双指平移、捏合缩放；二维束线图将纵向滑动也映射到束线方向。选择跨重启保存，自动识别按手势更新。

- 使用说明在当前窗口内以非模态浮动页面显示，不遮罩、不阻挡工作区操作；支持拖动、边缘缩放、最大化和还原。每次关闭再打开恢复默认位置和大小，不持久化几何状态。中英文操作指南在 `frontend/src/help/manual.*.md`，随前端构建离线打包；参数参考读取 `schema.all`，不另写参数表。Word 保留为物理原始参考。浮动页分“操作指南／案例教程／参数与文件参考”三栏；搜索跨栏并显示来源，Markdown 用稳定章节 ID 互链。`cases.*.md` 和 `reference.*.md` 保留来源与核对状态，原案例片段在 `help/cases/`，迁移清单与验证条件随源代码保留；未复现的旧包络／匹配流程不得标为当前可运行功能。

- 技术栈固定：React 19 + TypeScript + Vite + zustand 前端，FastAPI + uvicorn 后端服务，桌面窗口用 pywebview；文本编辑用 Monaco，图用 Plotly，3D 用 three.js。不要引入其他 UI 框架或组件库。
- **桌面与浏览器两种宿主**：页面地址里的 `host=webview|browser` 决定（`bridge.ts` 的 `isDesktop()`）。所有依赖宿主的操作
  （文件对话框、打开文件 / 文件夹、外部链接、退出、缩放）只写在 `host.ts` 里，页面调用 `pickFolder` / `pickFile` / `openPath` 等，
  **不要在页面里直接调 `dialog.*` / `shell.*` / `app.quit` / `app.zoom`**。浏览器里用 `components/FileDialog.tsx`（后端 `fs.list`）、下载链接 `/download?path=`。
- 优先复用 `components/ui.tsx`、`components/overlays.tsx`（`openMenu`、`choiceDialog`、`toast`、`reportError` 等）、`components/Plot.tsx`。
- 非模态浮动窗口一律用 `components/FloatingWindow.tsx`（拖动、八向缩放、最大化／还原、Esc 关闭、跟随界面缩放），使用说明和元件场分布窗口都基于它；几何不持久化，每次打开回到 `initialRect`。不要再各写一套拖拽缩放。
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

- 元件图框内右上角提供图标加文字的“查看场图／查看场分布”按钮，分别对应场图文件和解析模型；按钮占独立一行，不覆盖图形，不放在参数区远端。

- 可视化二维拖放命中具体非漂移元件图形时，以该元件入口对齐叠加（优先于纵向区间判断），支持连续建立多元件同起点叠加。二维／三维元件右键复用结构菜单，提供叠加元件、复制、删除等；浏览／运行锁下写操作禁用。

- 元件列表、详情、场分布窗口与 2D／3D 共用类型识别，仅文件名推断的元件类型附加“（推测）”，不附加“场图”；识别依据放入详情说明。拖放到普通非漂移元件内部自动创建 superpose 组，端点仍按顺序插入，漂移段沿用拆分；组内位置相对首元件，首元件固定零，组长度变化会移动下游。组操作按钮必须明确说明作用于整组。

- 恢复历史先备份当前编辑文本，作为独立撤销步骤放入编辑器，成功保存后才形成恢复版本；保留后续已有版本。保存记录携带同文件的来源版本 ID，后台按实际写入内容区分“从版本 N 恢复”和“从版本 N 恢复后修改”。恢复来源随 Monaco 撤销／重做分支变化，撤销恢复后的普通编辑不带恢复标记，成功保存后清除本次来源；相邻相同内容不重复记录，保存失败不记录为成功恢复。

- 文件历史跟随具体文件，不设全局主导航入口。文件页在左侧文件列表下方设置可折叠、可拖动调高的历史区，两区独立滚动，标明当前文件；选择版本在右侧主区域对比，文件树保留可用。结构页在文件选择框旁提供「历史」按钮，弹窗左侧版本列表、右侧差异，下方恢复操作。两处共用版本与恢复逻辑；原编辑器保持挂载，恢复仍可撤销、另行保存且遵守运行锁。切换文件／项目清除旧对比；恢复前校验目标及当前编辑内容。元件栏全部类型按单行横向滚动展示，名称不因窗口变窄隐藏，左右箭头、触控板横滑及 Shift＋滚轮可导航，保留点击／拖拽插入。

- 文件历史由 `gui/filehistory.py` 统一记录，存于项目 `.avas_history/`，支持 lattice、beam.txt、input.txt（单文件最多 2 MB），保存前保留旧文本、成功写入后记录新文本，相邻相同内容不重复。文本／结构／可视化编辑、文件页、束流页、设置页、已批准 AI 写入共用；历史按项目内相对文件路径归属，重命名后视为另一文件，不自动清理版本。结构页和文件页提供历史对比，`history.prepareRestore` 先检查运行锁并留存当前编辑内容，只返回历史文本，由编辑器以独立撤销步骤应用，保存仍走原接口，不新增绕过 AI 批准或运行锁的输入写入通道。历史从启用后的保存开始；外部修改在下次 AVAS 保存时留存，不监视外部编辑过程。

- 可视化编辑的撤销／重做直接使用当前 Monaco 文本模型的历史，不依赖键盘焦点；无对应历史时按钮禁用。「撤销本次所有修改」恢复到进入本次编辑时的文本，保持编辑状态，恢复本身作为独立一步可撤销，写入文件仍需保存。文本点击按鼠标命中的实际模型行选中元件，重复点击仍定位；键盘移动同步选中，程序定位、编辑和撤销／重做造成的光标移动不得覆盖元件选择。

- 元件定位使用独立的整行高亮与左侧标记，失焦／只读仍可见；定位展开目标折叠并立即居中，重复点击也生效。文本＋结构右侧复用 ComponentView 展示元件及场曲线，修改仍经同一个 Monaco 模型一步撤销。

- 场的图形一律区分**数据**与**示意**。场图文件的切片是数据：读取、缓存与切面集中在 `avas/gui/fieldcache.py`（`files.fieldSlice` 按路径、`lattice.fieldSlice` 按场图名字，两个 service 都调它，彼此不互相 import），整个 cube 留在后端，只把要看的那一个平面按 `bridge.blob` 传出，同一 family（`bs`／`es`／`bd`／`ed`）中网格相同的分量一起切，供模与面内箭头使用；色标用 `Plot.tsx` 的 `fieldScale()`，有符号分量必须配 `zmid: 0`。矩阵模型元件孔径内的场由 `lattice/analyticField.ts` 按元件参数算出，是示意图，必须用 `.cv-schematic` 或视图里的说明标注，不得与场图数据混为一谈；螺线管横向无场，横截面不画网格。
- 两种来源经 `files/slice.ts` 归一成同一个 `Slice`（后端 payload 走 `fromPayload`，解析场走 `analyticSlice`），`files/FieldSlice.tsx` 一套视图渲染两者，文件页和元件场分布窗口共用。解析场按**硬边界**生成：元件外恒为零，纵切面向两端各留 14 % 余量把这条边画出来；零长度元件（校正铁）只有 `xy` 一个平面，请求别的平面时由 `analyticSlice` 改回来，所以渲染一律用 `data.plane` 而不是组件 state。
- 场分布窗口开着时由 `ComponentView` 推送更新（`useFieldWindow`）：换元件换内容，改参数实时重画。窗口内容的 React key 只能用元件标题，不能用 source 全量，否则拖一下滑块就把用户选的切面和分量重置了。箭头位移在数据坐标下正比于场分量（`files/quiver.ts`），因此屏幕方向随坐标轴拉伸，只有等比例时才是真实方向，界面要说明这一点。**所有横截面一律从下游往上游看，束流垂直屏幕向外**（2026-09-21 统一；校正铁原先按射入屏幕画受力，已改号）：这样同一张图里的场箭头和受力箭头可以直接用 F = qv × B 相互核对。圆心的 ⊙ 记号（`BeamOut`、`.cv-beam-ring`）标出这个方向，新的横截面都要带上它，不要再引入别的观察方向。校正磁铁倒三角加竖线符号提供图例，场图类型的文件名识别依据在详情说明中标明。

- 可视化编辑器 2D / 3D 选中元件时，列表展开其全部祖先分组并滚动到高亮行；重复点击同一元件也触发定位。搜索或筛选挡住目标时只清除阻挡目标的条件；手动折叠、输入筛选本身不触发重新展开。

- 结构 / 可视化编辑器共用的元件列表显示具体类型，并支持中英文类型搜索；场图射频 / 静电 / 静磁分类来自场类型，静磁元件复用图形的场文件名推测规则，在详情说明中说明文件名识别依据，在推断的元件类型后加“（推测）”，不加“场图”后缀。无法识别时保留场类别或关键字名称，不把名称推测作为物理数据。

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

- 结构页回放条同步控制其显示的项目／分段回放，显示来源以及暂停／继续、结束按钮；结束只停止动画，保留历史记录。运行页返回箭头退出历史记录并结束动画；最大化使用四角展开／收拢图标，结束回放使用实心停止图标，互不混用。

- 运行页束流实时／回放面板默认按元件分层高度加曲线空间自动增高（上限 720px，极多层仍可图内滚动），页面整体可滚动。视图底边可拖动调高（240–1200px，`avas.live.height` 持久化），双击或“自动调整视图高度”恢复自动。最大化只占运行页工作区，保留回放控制与统计，还原不丢失普通高度和回放状态；最大化状态不持久化。

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

- 更新网络请求每次独立创建连接器并重新读取系统／环境代理，不复用首次请求的全局 urllib opener。独立窗口交接已解析主题与动效，旧调用缺失时从当前设置兜底；Windows 图形超采样抗锯齿、文字按原生 DPI 绘制，最终双缓冲显示。等待条复用主程序的 30 % 宽、1.2 秒 ease-in-out 从左向右循环，不能往返运动或伪造百分比；关闭动效时静止、最小化时停止重绘。各安装类型都将 AVAS 图标复制至更新工作目录，更新窗口设置大小图标与独立任务栏标识，打包更新器也嵌入同一图标。

- 更新确认、下载与取消结果集中在基于 FloatingWindow 的非模态更新面板，使用浅／深色更新配色与束线式阶段图；版本、说明和进度均来自实际更新状态，百分比仅表示当前下载，未知大小不伪造总进度。关闭面板只收起显示，准备期间的「取消更新」才中止任务，正在等待版本确认时关闭视为稍后。取消后保留结果与再次更新入口，重新更新仍需重新检测与确认。独立安装窗口沿用更新面板配色、版本信息和下载／校验／准备／安装／重启阶段图；备份、依赖及启动检查显示为安装阶段的详细状态，百分比只表示当前可测量操作，不伪造整体进度。

- ZIP 更新下载遇到暂时网络错误、不完整响应或校验失败最多尝试四次，间隔 1／2／4 秒；目标附件缓存按含完整版本的 URL 与 SHA-256 隔离，用独占文件锁防止同时写入，取消或重启后可复用。完整缓存重新校验后使用，残缺缓存用 Range 续传，严格校验 Content-Range，不支持续传或返回 416 时重新下载，完整校验失败从零下载。未校验的旧源码基线不续传。下载、解压、准备完成前及实际替换前检查相关磁盘空间，备份和目标同盘时合并预算，保留 64 MiB 余量；空间预检不能替代写入错误处理，也不保证 pip／Git 的未知空间需求。
- 更新准备阶段支持协作取消，下载读取、校验、解压与文件预检检查取消信号，Git fetch 可终止自身子进程树；网络连接／读取等待可能延迟到本次返回或超时。取消请求不能提前释放 maintenance 预约，任务实际退出才释放；准备完成发布安装计划前再次检查。取消是正常结果，不弹失败提示，保留目标包缓存；进入独立安装后前后端均拒绝取消，不中断文件替换。

- 安装包、便携包、源码 ZIP 与 Git 版更新使用同一启动保护协议（`update_guard.py`）：独立更新器在主程序退出前持有同安装目录的更新锁，贯穿安装及自动重启；重复启动只通知更新窗口并立即退出，不在占用程序文件的第二个进程中弹出阻塞对话框。源码 CLI／GUI／serve 在加载运行依赖前获取启动许可，打包入口通过 `runtime_update_guard.py` 提前检查。自动重启用一次性票据通过更新锁，主窗口显示后确认，才关闭更新窗口和释放保护；异常退出由操作系统释放锁，遗留元数据不阻止正常启动。
- 主窗口退出前说明“更新完成自动重启，请勿手动打开”。安装期间 `update_status.py` 在独立更新器中持续显示等待、备份、安装、依赖、检查、恢复及重启状态；更新完成后自动关闭，安装时不能通过关闭按钮终止。该独立状态窗口是主界面技术栈的必要例外：Windows 只用标准库 ctypes + GDI 双缓冲绘制，其他源码桌面用标准库 Tk Canvas，共用 `update_view.py` 的布局。主窗口交接当前语言、经校验的主题颜色及更新面板屏幕位置／大小；Windows 按 WebView 客户区、界面缩放和显示器 DPI 换算并限制在显示器工作区内，旧调用方使用同风格默认值。窗口可拖动、最小化；首次绘制成功后才允许主程序退出。不加载将被替换的 WebView／React 或第三方 Python GUI 依赖，创建失败时不得通知主程序退出。源码更新需同时复制 worker、guard、status、view 四个独立模块。

- 下载进度通过 `updates.progress` 和 `updates.status` 同一份快照提供，包含阶段、已下载字节、可选总大小和平均速度；总大小未知时不伪造百分比，校验／解压阶段不沿用下载数值。准备、更新器启动、安装都有日志，主日志不可写时用系统临时目录兜底，错误详情独立保存到结果；日志与结果在重启前刷新落盘。主程序等独立更新器写入 `ready.json` 后才退出；Windows 使用已校验目标包里的独立更新器。替换前检查文件可写性，短暂占用限时重试，不强制关闭其他 AVAS；先复制到同目录临时文件再替换，清单最后写入，未变化文件不重写，失败仍遵守备份恢复规则。

- Windows 打包版 `AVAS.exe` 无参数时启动同目录 `AVASGui.exe`，有参数时保持命令行功能；源码入口行为不变。安装器将所选语言写入安装目录 `avas-install.ini`，打包版仅在用户设置没有 `ui/language` 时读取并持久化；升级、重装不得覆盖已保存的语言偏好。该安装配置不属于发布包文件清单，自动更新保留它。

- 安装包简体中文翻译随仓库保存在 `packaging/languages/`，保留上游固定提交、校验值和许可证；不依赖 Inno Setup 安装目录自带中文文件，也不在构建时下载翻译。调用编译器的构建在 PyInstaller 开始前检查该文件。
- 官方源固定为 `lycself/AVAS`。main 通过 CI 后生成源码包与 Windows 程序包并验证。正式发布使用 `avas-<7 位 SHA>`，缩短 GitHub 自动源码归档名称；发布前验证短标签实际指向完整 SHA，冲突时拒绝覆盖。完整 SHA 的兼容发布保留相同附件，新建时标为预发布，供旧更新器的严格下载地址校验和源码基线查询使用；短标签附件从已发布兼容包复制，重试不覆盖已发布文件。两处就绪后才发布 `avas-latest/update.json`，其下载说明链接短标签正式版本，元数据仍使用完整 SHA 地址。发布时检查祖先关系，较旧流水线不得覆盖较新的指针。
- 后端 `services/updates.py` 统一检测与准备，`avas/updates.py` 下载校验，标准库独立程序 `avas/update_worker.py` 在主进程退出后安装；Windows 打包成独立的 `AVASUpdate.exe`，不能依赖将被替换的 `_internal`。
- 自动检测缓存 6 小时，帮助菜单可强制检查；用户确认前重新检查，目标变化要重新确认。确认后所有获取与安装锁定 SHA，禁止裸 `git pull` 或下载可变分支压缩包。忽略版本按 SHA 保存，弹窗明确提醒仍可从帮助菜单获取更新。
- 每次提交前，AI / 开发者必须主动新增 `docs/changes/*.md` 简短变更条目，用用户能理解的语言说明变化；内部维护也须明确说明范围。尚未提交的本次条目可编辑，已提交条目不可修改或删除，纠正时另增条目。CI 检查提交范围内新增非空条目。发布脚本按 `avas-latest/update.json` 的上次成功提交汇总新条目，生成 `dist/updates/docs/update-notes.md`（源码包内为 `docs/update-notes.md`），不回写提交；同一份文字固定写入该版本的 `update.json` 和 GitHub Release。弹窗按纯文本展示，不执行 HTML，也不从 Git 提交标题生成说明；新版本重新确认时同时展示新版本说明。
- 正式发布同时包含 Windows Inno Setup 安装包 `AVAS-版本-setup.exe`、`avas-windows.zip`、`avas-source.zip` 和 `update.json`。首次安装推荐 setup.exe，自动更新继续使用 ZIP；CI 缺少安装编译器必须失败，不能静默跳过。Release 正文统一解释所有附件（含 GitHub 自动源码归档），自动更新入口注明供程序使用并链接正式版本。
- Git 更新仅支持官方 origin 的干净 main，快进到确认的提交，不 stash/reset/clean；源码与打包版按 `.avas-install.json` 哈希验证本地改动，备份后替换并处理移除的程序文件，不覆盖用户新增文件。GitHub 源码 ZIP 用 `.avas-source.json` 的 export-subst 标记读取基准版本；无安装清单时始终取该完整 SHA 的官方源码归档作为基准（包括 Release 自动 Source code ZIP 和 Code → Download ZIP），不得用同提交的 avas-source.zip 替代，两者换行符与生成文件可能不同；不能以现有文件冒充基准或放宽字节哈希校验。源码/打包版用 GitHub 提交比较防止降级；请求 `per_page=1&page=2`，只用全局 status，避开第一页文件补丁，保留 JSON 响应大小限制。
- 更新准备通过 `gui/maintenance.py` 与 runner、sandbox 启动共享锁；模拟、暂停、扫描或 AI 试算活跃时拒绝，准备期间不允许新模拟。安装退出由 `host.ts` 触发，保存/放弃编辑仍须询问。浏览器模式仅检测与下载入口，服务器需本机维护。
- `.venv`、项目与结果、个人设置保留。替换失败尝试恢复备份；打包启动检查失败恢复旧程序。源码依赖失败保留日志与修复入口，不能声称环境已完整回退。回归测试只用临时安装目录和本地临时 Git 仓库。
- `installation_lock.py` 为当前用户同一安装目录的 CLI、桌面与服务进程持有共享文件锁；独立更新器取得独占锁后才替换，其他进程仍运行时拒绝。更新准备状态可在页面重连后恢复，重启后读取持久化结果，错误日志与备份不自动删除。

## 6. 物理与内核约定（已用内核实际运行核实，手册里没写清楚的以这里为准）

- **beam.txt twiss**：β 单位 mm/mrad；发射度是**归一化 rms**，π·mm·mrad（rms_x0 = sqrt(β·ε/(βγ))）；twissz 同样单位，z' = Δp/p。
- **场图**：电场 MV/m × Ke，磁场 T × Kb；射频电场按 E·cos(ωt+φ0)，射频磁场用 sin；V3=0 的同步相位 = atan2(∫E sinφ, ∫E cosφ)。场图存储顺序要按**一组分量文件**判断（`avas/data/fieldmap.py: group_order()`），不能按单个文件判断。
- **示例项目的场图本身有噪声**（2026-09-21 核实）：`examples/hwr010` 的 sol / bfield / hwr010 三组场图沿 z 的二阶差分平均为量程的 6～9 %，`sol.bsz` 在"平顶"区逐点在 5.9～10.1 之间跳。切片热图会把它显示成沿 z 的竖条纹——**那是数据，不是读取或切片的错误**。判断存储顺序的 `_cube_roughness` 在这种噪声下区分度很弱（sol 组两种顺序的粗糙度只差约 1 %），只能靠 `group_order()` 按整组投票，并用 Bz 峰值是否落在元件中心这类物理判据复核。横向场的正确性可以这样核实：螺线管端部横截面上 (Bx, By) 应处处指向轴心（已核实，偏差在噪声量级内），中心截面上横向场为零。
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

- **Git 提交不添加 AI 署名**：Claude、Codex 等 AI 助手不得把自己或模型名称写入提交的作者、提交者或共同作者，不得自动添加 `Co-Authored-By`、`Signed-off-by` 或 `Generated with` 等 AI 署名。沿用用户现有的 Git 身份，不修改 Git 身份配置；提交前检查最终提交说明，删除自动生成的 AI 署名，保留真实人类贡献者的署名。此规则同样适用于提交模板和工具自动追加的文字。
- 用户希望先看诊断和方案、讨论确定后再一次性完整实施；方案里的决策点要明确列出。
- 命令行保持简短好用：`avas run --input DIR --output DIR`、`avas plot 类型 --output DIR`、`avas scan --input DIR --target 元件 --param 参数 --values 1,2,3`。
- 旧代码、历史 DLL 和日志已移到仓库外的 `AVAS_NEW/archive/`，不要搬回仓库。
- 示例项目的输出（`examples/*/OutputFile/`）不提交。
