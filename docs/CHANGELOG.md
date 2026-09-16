# 更新记录 / Changelog

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