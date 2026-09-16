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

输入目录和输出目录完全解耦：`--input` 指向包含 `input.txt`、`beam.txt`、`lattice_mulp.txt` 的目录（或包含 `InputFile/` 的项目目录），`--output` 指向任意目录（不存在会自动创建）。

```bash
# 运行模拟（等价于 avas run ...）
avas --input "C:\proj\InputFile" --output "C:\proj\Results_001"

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

* 高分屏：已启用 Qt 高 DPI 缩放，150 % / 200 % 显示器下字号正常。
* 语言：菜单 **Settings → Language** 切换中文 / English，重启后生效。
* 字号：菜单 **Settings → Font size**。
* 设置保存在系统用户配置中（Windows 注册表 `HKCU\Software\AVAS`），日志在 `%LOCALAPPDATA%\AVAS\logs`。

### 目录结构

```
avas/            Python 包
  cli/           命令行入口（avas run / plot / gui / info）
  gui/           PyQt5 界面（dialogs/ 对话框，lattice_editor/ 结构文件编辑器）
  api/           basic.py：模拟与画图的统一入口；qt/：界面用接口
  core/          ctypes 封装的 C++ 计算内核
  sim/           模拟流程：多粒子、包络、误差、匹配、接受度
  post/          后处理：analysis/ 数据分析，plot/ 画图
  data/          输出文件解析（DataSet、BeamSet、dst …）
  utils/         读写与配置工具
  engine/        AVAS.dll / libAVAS.so 及依赖库
  static/        原子质量表、场表
  i18n/          界面翻译（avas_zh_CN.ts / .qm）
  gpu/ hpc/      GPU 内核与 HPC 作业脚本
examples/        示例项目（hwr010）
tests/           pytest 冒烟测试
scripts/         个人分析脚本（不属于软件本体）
packaging/       PyInstaller 打包脚本
docs/            使用说明与更新记录
```

### 翻译维护

界面文字全部通过 `self.tr("...")` 标记。修改 `avas/i18n/avas_zh_CN.ts`（可用 Qt Linguist 或文本编辑器），然后：

```bash
lrelease avas/i18n/avas_zh_CN.ts
```

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

Input and output directories are independent. `--input` is the directory holding `input.txt`, `beam.txt`, `lattice_mulp.txt` (or a project directory containing `InputFile/`); `--output` is any directory and is created if needed.

```bash
avas --input "C:\proj\InputFile" --output "C:\proj\Results_001"      # same as: avas run ...
avas run --input ... --output ... --mode stat --seed 7               # error study: stat | dyn | stat_dyn
avas plot emittance_x --output "C:\proj\Results_001" --save emit_x.png
avas plot phase --dst "C:\proj\Results_001\outData_0.210000.dst"
avas gui --lang en
avas info
```

`avas plot --help` lists every plot type. The input directory for plots is read from `avas_run.json` in the output directory, or given with `--input`.

### GUI

`avas gui` starts the interface with Qt high-DPI scaling enabled. **Settings → Language** switches between English and 简体中文, **Settings → Font size** changes the base font; both apply after a restart. Settings are stored per user (`HKCU\Software\AVAS` on Windows); logs go to `%LOCALAPPDATA%\AVAS\logs`.

### Tests

```bash
pytest
```

### Citation

If you use this code in your research, please cite:

> C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., *Advanced virtual accelerator software: A linear accelerator simulation code*, Phys. Rev. Accel. Beams **28**, 044602 (2025). https://doi.org/10.1103/PhysRevAccelBeams.28.044602
