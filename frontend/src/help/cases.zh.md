# 案例教程 {#cases-home}

来源：docs/案例.docx 的全部 6 组片段，以及原使用说明的接受度章节。原文片段完整保留，修订明确标出；旧版案例不标作当前可运行功能。

## 通用准备与验证条件 {#cases-setup}

1. 把 examples/hwr010 整个项目复制到新的练习目录。不要直接覆盖原示例。
2. 前三个案例使用示例 beam.txt 参数；本次短验证将 particlenumber 改为 300，input.txt 的 randomseed 设为 12345。误差研究的 Python 种子另设为 7。其余输入沿用示例。
3. 在副本 InputFile 中新建 manual_case.txt，复制对应代码。在结构页打开并设为运行结构，保存修改；选择相应运行模式。
4. 运行结束后检查日志、轨迹长度、存活数与目标值，不能只看“完成”。需要保留结果时使用运行记录的保留功能。

验证日期：2026-09-20。每个案例一次验证，输入副本未被内核改写；数值用于识别明显异常，不是高精度金标准。原始 Word 不包含完整 beam/input，因此这些是已明确补充条件的复现。

命令行也可运行（在练习目录中）：

```text
avas run --input InputFile --output OutputFile --lattice manual_case.txt --mode basic
```

误差案例把模式换成 stat_dyn，校正案例用 stat，并加 --seed 7。

## 叠加场多粒子入门 {#cases-superpose}

> 验证状态：已运行：300 粒子全部存活，305 行 DataSet，末端能量约 1.87937 MeV。仅验证这组输入能完成，不代表所有束流设置都得到相同结果。

认识 superpose、静磁场与射频场叠加。复制示例项目，保留 sol 和 hwr010 的全部分量场图。使用下面的结构内容，并选择普通运行（basic）。

```text
start
drift      0.085  0.02   0
superpose  0 0 0 0 0 0
field      0.35   0.02     0   3   0   0   1    0.531  sol
superpose  0.345 0 0 0 0 0 0
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010
superposeend
end
```

观察运行页包络，并在结果页检查能量、存活粒子数和输出分布。叠加区域最多包含一个 RF 腔，第一条 superpose 全为零。

[叠加场规则](#ref-superpose)

## 静态与动态误差研究 {#cases-errors}

> 验证状态：修订版已运行：基准加 2 组 × 2 次，均得到 353 行 DataSet；误差运行末端能量约 2.36336–2.36582 MeV，存活 283–287 / 300。原版缺参数，不能直接作为正常教程。

观察误差组幅度和重复抽样的区别。选择静态 + 动态误差（stat_dyn），误差随机种子设为 7；设置页保留基准运行。err_step 2 2 表示两组，每组两次。

修订版仅在最后一条 drift 后补上 0；原文为 `drift 0.000001 0.02`，内核日志报告参数不足，原版只得到 4 行 DataSet。

### 当前修订版

```text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02 0
end
```

### 原文片段（保留用于对照，不直接运行）

```text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02
end
```

查看 error_output/output_0_0 基准和 output_1_1 至 output_2_2，结合 errors_par.txt、errors_par_tot.txt 分析。存在一定粒子损失，不应将本例描述为无损传输。

[误差编号与抽样说明](#ref-errors)

## 静态误差校正示例 {#cases-correction}

> 验证状态：已运行但未达目标：原文 DIAG_ENERGY 的目标为 5 MeV；本次记录的基准末能量约 2.31270 MeV，error_adjust/output_0 约 2.28948 MeV。不能据此宣称校正成功；保留作进阶诊断示例。

理解 ADJUST 选择参数、约束范围和 DIAG_ENERGY 设置目标的关系。使用静态误差模式（stat）；不要直接把这组目标值当作已收敛的设计。

```text
start
err_step 1 1
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 1 0 1.0 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
ADJUST 1 7 5 0 3 0
field      0.21  0.02     0   1   162.5e6   -33  3    -1.36   hwr010
drift 0.0835 0.02 0
DIAG_ENERGY 1 5 0
drift 0.000001 0.02 0
end
```

检查目标能量与 Ke 范围是否物理可达，再检查校正前后记录。退出码为 0 不表示优化达到目标；进一步改变目标或范围属于新的物理研究，需要重新验证。

[校正与束诊命令](#ref-correction)

## 旧版包络模型 {#cases-legacy-envelope}

> 验证状态：旧版待核实：当前未提供这一段旧语法的已验证运行流程。

原代码只有元件片段，没有完整的项目输入。其 QUAD 参数数量与当前多粒子格式不同，不可直接贴入多粒子结构作为可运行例子。

```text
DRIFT 0.76486 1 1
QUAD 0.97277 1 0.40328
DRIFT 0.1355 1 1
QUAD 0.15 1 -2.2265
DRIFT 0.381 1 1
QUAD 0.324 1 0.664
DRIFT 0.59197 1 1
```

保留源代码供迁移核对；不以当前线性包络预览冒充原包络算法。

## 旧版 Twiss 匹配 {#cases-legacy-matching}

> 验证状态：旧版待核实：MATCHING、SETTWISS 的原流程未在当前界面验证。

保留原文匹配范围及目标。迁移前需核对所用算法、输入格式、目标定义和单位。

```text
MATCHING 1 1 0.1 1
DRIFT 0.76486 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.97277 1 0.40328
MATCHING 1 1 0.1 1
DRIFT 0.1355 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 -10 0
QUAD 0.150 1 -2.2265
MATCHING 1 1 0.1 1
DRIFT 0.381 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.324 1 0.664
MATCHING 1 1 0.1 1
DRIFT 0.59197 1 1
SETTWISS 1 2 3 2 3
```

不改名为 AI 优化教程；两者可能采用不同目标和算法。

## 旧版周期匹配 {#cases-legacy-periodic}

> 验证状态：旧版待核实：CIRCLE_MATCH、RF_GAP 等命令的可用入口与结果尚未核实。

原文用四个周期计算入口 Twiss，缺少完整输入和预期结果。

```text
CIRCLE_MATCH 1 2 0
LATTICE 1 4 5
;cell1
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell2
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell3
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell4
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
LATTICE_END
```

保留 LATTICE 与周期结构原文，不将其视为当前多粒子分组语法。

## 接受度测量 {#cases-acceptance}

> 来源：使用说明20260427.docx“接受度测量使用方法”。步骤已按当前界面与结果服务改写；本次未用有代表性的束损分布验证接受度数值。

1. 准备输入束流；若从 dst 导入，先在束流页检查文件与束流参数。原版“Import all beam parameters from file”按钮的操作不能照搬。若需要由 Twiss 重新生成束流，应切回生成分布并确认参数，不能只删除文件路径。
2. 选择要研究的平面，设置适合研究的初始发射度。原手册建议扩大该方向发射度以覆盖接受边界；具体幅度需要根据束线确定。
3. 在设置页把“Output every N steps (plt)”设为大于 0（例如 1）。这会保存逐步粒子记录，文件可能较大。
4. 完成模拟，在结果页选择这次输出，打开“接受度”，选择 x-x′、y-y′、z-z′ 或 φ-E 平面。
5. 查看拟合椭圆、发射度、归一化发射度及位置／角度；结合束损情况判断。全部粒子通过、缺少粒子记录或无法构成边界时不能把报错解释为零接受度。

接受度属于结果分析，不是原 Word 截图里的独立 accept 页面。三张旧截图已由当前文字步骤替代。

[粒子记录文件](#ref-beamset)
