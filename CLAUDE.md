@AGENTS.md

# Claude Code 补充说明

以上规则全部适用；下面只是 Claude Code 在本机工作时的实际经验。

- 编辑代码用 Write / Edit 工具。通过 bash heredoc 写含正则或反斜杠的 Python / TypeScript 会被破坏（`\b`、`\\n` 等），大文件也不要用 sed 批量改。
- 浏览器面板检查界面：先启动 devserver（见 AGENTS.md 第 3 节），用 `?devrpc` 打开。
  - 面板被子代理共用时，先 `tabs_create` 开自己的标签页再截图。
  - 截图超时或只截到局部时，把视口调到 960–1400 px 宽再试。
  - 面板隐藏时 `requestAnimationFrame` 不运行：3D 视图和动画只在截图时才渲染。3D 视图实例在 `document.querySelector(".b3d").__b3d`。
  - `window.__avasDebug` 提供 `useApp`、`setPage`、`runSimulation` 等，方便脚本化操作。
- 浏览器面板报告 `prefers-reduced-motion: reduce`（本机 Windows 动画效果关闭），动效选"自动"时会解析成"关闭"；默认是"完整"，检查时确认 `ui/motion` 没被设成 auto / off。
- 面板截图经常只返回左上角的放大局部。检查 3D 画面可以在 `renderNow()` 之后用 `gl.readPixels` 统计颜色像素，
  或者把 `renderer.domElement.toDataURL()` 放进一个固定定位、宽 50vw 的 `<img>` 再截图。
- 真实内核检查实时显示：devserver（不加假引擎）+ 脚本经 `POST /rpc` 调 `run.start`、读 `GET /events`，结束后比较实时行和 DataSet.txt。
- 检查真实窗口：给 `webview.start` 打补丁，在自动化线程里用 `evaluate_js` 驱动，用 `PIL.ImageGrab` 按窗口句柄截图。
- 同一个 pytest 进程里同时跑 `test_gui.py` 和 `test_assistant.py` 会共用一个设置对象，测试不能假设 gui.json 是干净的。
