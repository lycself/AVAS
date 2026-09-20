# 参数与文件参考 {#reference-home}

来源：docs/使用说明20260427.docx。以下为整理版，保留技术正文和格式信息，移除旧界面步骤与重复参数表。逐章注明核对范围；“来自原手册”不等于所有模式已经在当前版本实测。原始 Word 保留在仓库，不作修改。

参数表由当前 schema 动态提供。可在上方搜索输入文件名、命令或物理量。

## 场模型元件与射频相位 {#ref-field}

> 来源：原手册对应章节。核对状态：与当前 schema 对照；补充已核实的场强和相位约定。

场模型元件

用户给出元件的电磁场分布文件，在场模型元件中AVAS采用t-code进行模拟。

```text
Drift   长度（m）  半径（m）   0
Field   长度（m）  半径（m）   V3 类型  频率   同步相位  Ke   Kb   场文件名
```

场类型：1 为高频场，2 为静电场，3 为静磁场；静磁场中不使用的参数写 0。

V3：0代表同步相位 1代表粒子到入口的RF相位 2 代表t=0时刻的rf相位

例：

```text
start
drift 0.0835 0.02 0
!静磁场
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
!高频场
field 0.1 0.02 0 1 162.5e6 -33 3 -1.36 hwr010b
end
```

电场为 MV/m × Ke，磁场为 T × Kb；射频电场使用 cos(ωt+φ₀)，磁场使用 sin。V3=0 的同步相位按积分定义：atan2(∫E sinφ, ∫E cosφ)。场图存储顺序应按同组分量文件判断。

[查看 field 参数](#lattice-field)

## 矩阵模型元件与端部限制 {#ref-matrix}

> 来源：原手册对应章节。核对状态：元件参数以实时参考为准；首末矩阵元件限制来自原手册，本次未做独立内核验证。

用户给出元件的对应参数，在矩阵模型元件中AVAS采用z-code进行模拟。

```text
Quad     长度（m）半径（m）  0 磁场梯度（T/m）
Solenoid  长度（m）半径（m）  0  磁场（T）
Bend     |αρ|（m） 半径（m）  0 偏转角α(°)  曲率半径ρ(m) 四极场指数 方向(0/1)
```

*二极铁的长度默认等于|αρ|。方向：横向(x)偏转为0，纵向(y)偏转为1

```text
Steerer        0      半径（m）  0   Bx/Ex(T or V/m)   By/Ey   类型   最大值
```

*矫正铁长度必须为0，长度默认为下个元件的长度并位于下个元件的中间。类型：磁场校正铁为0，电场校正铁为1.

Bend

Edge

多粒子模型第一个和最后一个元件避免使用矩阵模型元件，可以加超级短的drift避免这个问题.

Bend、Edge 的逐项参数统一见 [bend](#lattice-bend)、[edge](#lattice-edge)、[quad](#lattice-quad)、[solenoid](#lattice-solenoid)、[steerer](#lattice-steerer)。

## 误差分析与分布编号 {#ref-errors}

> 来源：原手册对应章节。核对状态：已对照当前误差生成代码，修正原文中高斯分布与等步长的编号颠倒。

当添加误差后，模拟的结果将放在outputFile文件夹下的error_output文件夹下。相关命令如下：

err_step a b

a为分组数， b为每组运行多少次

动态误差

```text
err_beam_dyn  r  dx   dy    dφ    dxp    dyp    de    dEx    dEy    dEz    mx    my    mz    dib
(mm)   (°)   (mrad)  (MeV)      (%)          (%)        (mA)
```

*用于设定初始束团的误差，不需要写满参数，后续空置参数默认不设置误差。

```text
err_quad_ncpl_dyn   N   r  dx   dy    dφ_x    dφ_y    dφ_z    dG     dz     Nb
(mm)        (°)       (%) (mm)
```

*用于设定静磁元件的误差，不需要写满参数，后续空置参数默认不设置误差。

```text
err_cav_ncpl_dyn   N   r  dx      dy       dφ_x       dφ_y        kekb       φ_s         dz       Nb
(mm)         (°)        (%)   (°)   (mm)
```

*用于设定射频腔的误差，不需要写满参数，后续空置参数默认不设置误差。

静态误差

```text
err_beam_stat  0  dx   dy    dφ    dxp    dyp    de    dEx    dEy    dEz    mx    my    mz    dib
(mm)   (°)   (mrad)  (MeV)      (%)          (%)        (mA)
```

*用于设定初始束团的误差，不需要写满参数，后续空置参数默认不设置误差。

```text
err_quad_ncpl_stat   N  r  dx   dy    dφ_x    dφ_y    dφ_z    dG     dz     Nb
(mm)        (°)       (%) (mm)
```

*用于设定静磁元件的误差，不需要写满参数，后续空置参数默认不设置误差。

```text
err_cav_ncpl_stat   N   r  dx      dy       dφ_x       dφ_y        kekb       φ_s         dz       Nb
(mm)         (°)        (%)   (°)   (mm)
```

*用于设定射频腔的误差，不需要写满参数，后续空置参数默认不设置误差。

参数解释:

N: 作用于命令下面元件的数量， 想做用于所有元件，可以填写一个较大值

R：误差类型

r=0：固定值误差

r=1: 均匀分布的误差

r=2: 高斯分布的误差

r = -1：等步长误差（等价于tracewin中的0类型）

例：

```text
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 r 2 0 0.0 0.0 0.0 0.0 0.0
```

以上面的为例：

当r为1，那么第一组为[-1, +1]之间的误差，第二组为[-2, +2]之间的误差

当 r=2 时，第一组为标准差 1 的高斯分布误差，第二组为标准差 2 的高斯分布误差。原文在此误写为 r=-1，已按当前代码修正。

当 r=-1 时，以上射频腔例子的第一组误差为 1，第二组为 2。原文在此误写为 r=2。束流误差命令的等步长实现与元件分支不同，不能直接套用本例；使用前应核查实际抽样文件。

误差开启

```text
err_beam_dyn_on   dx      dy      dφ …
err_quad_dyn_on   dx      dy      dφ_x…
err_cav_dyn_on    dx      dy      dφ_x…
err_beam_stat_on   dx      dy      dφ …
err_quad_stat_on   dx      dy      dφ_x…
err_cav_stat_on    dx      dy      dφ_x…
```

这些命令用于启用相应误差，参数顺序与对应命令一致：0 关闭，1 开启。

例：

```text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
field      0.21   0.02     0   1   162.5e6   -33  3    -1.36   hwr010b
field      0.21   0.02     0   1   162.5e6   -33  3    -1.36   hwr010b
end
```

当前组幅度通常按“给定幅度 ÷ 总组数 × 当前组号”计算；固定值分支不做该缩放。Python 与内核的随机种子不是同一个设置。详见 [误差案例](#cases-errors)。

## 静态误差校正与束诊 {#ref-correction}

> 来源：原手册对应章节。核对状态：与当前校正流程对照；示例使用的场图名称需对应项目文件。

```text
Adjust N, v, n, min, max, first_step
```

N：目前无意义，写0即可

v: 修改下面元件的第v个参数

n:具有相同n的元件参数，他们矫正时具有相同的值,默认为0

min:参数的最小值

max: 参数的最大值

first_step：是否使用元件的初值作为梯度下降的初始值，0 不使用， 1使用

束诊命令

```text
DIAG_ENERGY N w dw
```

N: 无意义 填写0即可

W：目标能量（MeV）

Dw：无意义 填写0即可

```text
DIAG_SIZE 0 sx sy 0
```

Sx: x方向包络（mm）

Sy：y方向包络（mm）

```text
DIAG_position 0 x y 0
```

x: x方向中心位置（mm）

y：y方向中心位置（mm）

例：

```text
start
err_step 1 1
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 5 1 2 0 0 0 0 0 0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
adjust 1 7 5 0 3 0
!修改第七个值，也就是ke
field      0.21  0.02     0   1   162.5e6   -3  3    -1.36   hwr010b
drift 0.0835 0.02 0
DIAG_ENERGY 1 5 0
drift 0.000001 0.02 0
end
```

[查看静态误差校正案例及验证状态](#cases-correction)

## 叠加场规则 {#ref-superpose}

> 来源：原手册对应章节。核对状态：与当前 schema 对照。

```text
Superpose  z_0   x_0    y_0    θ_z0     θ_x0    θ_y0
Superposeend
Superposeout  z_0   x_0    y_0    θ_z0     θ_x0    θ_y0
```

* 1、第一条Superpose命令后面的参数必须全为0，以提供其他Superpose命令的零点。

2、Superpose（Superposeout）后面的6个参数给出该命令之后一个元件的入口平面（转换平面）相对于第一条Superpose命令后元件的入口平面的位置和角度。

3、在一段叠加场结束后需要添加Superposeend或者Superposeout命令来结束叠加场，并且只有以Superposeout命令结束时，Superpose命令后z_0以外的参数才会生效，即以Superposeend命令结束时，元件只会在纵向位置上叠加。

4、一组叠加场中只能存在小于等于一个射频腔。

5、在一段叠加场中，每个元件前要有且只有一个Superpose命令。

例：

```text
start
drift      0.085  0.02   0
superpose  0 0 0 0 0 0
field      0.35   0.02     0   3   0   0   1    0.531  sol_yuan
superpose  0.345 0 0 0 0 0 0
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010
superposeend
end
```

[查看叠加场案例](#cases-superpose)

## 结构分组与折叠 {#ref-lattice}

> 来源：原手册对应章节。核对状态：与当前结构解析规则配合使用；原拼写 sction 保留。

```text
lattice n1 n2
```

n1：每个基础lattice的元件数量

n2: 写为1.

Lattice终点

```text
lattice_end
```

Lattice结束.

折叠命令

```text
Sction module{
}
```

使用这个命令，在页面上可以让{}中间的内容进行折叠复制。

例：

```text
sction mebt
{
drift 0.05089 0.025 0
drift 0.1254 0.025 0
}
```



## 输出平面 {#ref-planes}

> 来源：原手册对应章节。核对状态：补充已核实的末端限制。

outputplane V1：在该命令所在位置下游（正值）或上游（负值）输出束流分布，V1 单位 m。

automaticoutput V1 V2 V3：等间距插入输出面；依次为第一个输出面的相对位置、间隔和最大跨度，单位均为 m。

已核实：输出面超出末端会失败，距末端仅 5 mm 也可能失败，2 cm 的测试可以运行。分段功能自动去掉距末端 5 cm 内的输出面；内核结束会输出末端分布。

## 输入文件组织与模拟设置 {#ref-inputs}

> 来源：原手册对应章节。核对状态：当前输入快照和路径机制已更新；关键字表统一读取 schema。

用户编辑 beam.txt、input.txt 和 ini.ini 指定的结构源文件。完整运行及误差研究在输出目录的 inputs/ 快照中生成内核读取的 lattice.txt，不改写项目 InputFile。

input.txt 用于设置程序功能及算法信息，beam.txt 用于输入束团信息，lattice.txt 用于输入加速器元件信息。输入文件中!开头的行代表注释，注释内容不生效。关键字不区分大小写。

input.txt

input.txt中大部分关键字在程序中存在默认参数，不设置也可以正常模拟。

meshRms三个方向上的网格边长，按对应方向束团的 RMS 尺寸乘以 2 进行缩放V1 double；Lx = V1 × x 方向 RMS 尺寸 × 2V2 double；Ly = V2 × y 方向 RMS 尺寸 × 2V3 double；Lz = V3 × z 方向 RMS 尺寸 × 2

  当启用二次粒子输运功能时，应在 beam.txt 中设置加速器同步粒子参数。

  当启用纵向周期性边界条件时，空间电荷效应求解算法会自动切换为 FFT，并且纵向网格长度会实时设置为束团的周期长度，需要设置更多的纵向网格点数（Numofgrid）。

  当单独设置边界时，lattice.txt 中的半径设置将不再生效，束流损失将根据 boundary.txt 中设置的边界来判断。

输入参数表见下方 input 参考。multithreading 只写 1；关闭时删除整行，不能写 0。原文 stepPerCycle 的时间公式存在量纲疑问，未作为确定公式迁入，推进步长应按当前 schema 和实际运行核对。

[查看多线程参数](#input-multithreading)

## 束流文件与 Twiss 约定 {#ref-beam}

> 来源：原手册对应章节。核对状态：补充已核实的归一化 rms 发射度及单位；二次粒子模式有例外。

说明：

普通束团文件导入时，原手册说明除 numofcharge 外的生成参数不生效。二次粒子模式仍需同步粒子信息，见 SeParticle.txt；不要将普通导入规则当作所有模式的通则。

束流关键字表见下方 beam 参考。twiss β 单位 mm/mrad，ε 为归一化 rms 发射度，单位 π·mm·mrad。rms_x = sqrt(β_x·ε_x/(β_rel·γ))；纵向 z′ = Δp/p。

[查看 twissx](#beam-twissx)

## 运行结构文件 {#ref-source}

> 来源：原手册对应章节。核对状态：运行文件不限定为 lattice_mulp.txt。

第一个start之后到第一个end之前的内容为有效内容，程序会模拟第一个start之后到第一个end之前的元件。

使用 ini.ini 的 [lattice] source 指定源文件；运行结构与当前打开查看的结构可能不同。

## scanData.txt 射频扫相文件 {#ref-scan-data}

> 来源：原手册对应章节。核对状态：来自原手册；与参数扫描产生的 scan.csv 不同。

用于记录AVAS扫相结果或手动设置射频场相位，文件的每一行分别为一个射频腔的 入口相位（角度）、入口时间（s）。射频场在lattice中的排列顺序即为数据的排列顺序。



## SeParticle.txt 二次粒子 {#ref-secondary}

> 来源：原手册对应章节。核对状态：来自原手册及 schema 文件列定义；本次未运行二次粒子案例。

当在input.txt 中将 secondarybeam 设置为 1 时，可以在 ReadParticleDistribution 之后输入此文件。SeParticle.txt 文件用于记录二次粒子束，每一行代表一个粒子。

由于二次粒子束不包含同步粒子信息，为了正确模拟某些元件的作用，即使已经提供了初始束团分布，仍然需要在 beam.txt 文件中设置同步粒子信息。

| x | y | z | vx | vy | vz | charge | mass | weight | time | Kind |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m | m | m | m/s | m/s | m/s | e | MeV | double | s | string |



## Boundary.txt 独立边界 {#ref-boundary}

> 来源：原手册对应章节。核对状态：来自原手册；本次未运行独立边界案例。

当在 input.txt 中将 boundary 设置为 1 时，Boundary.txt 文件生效。束流损失将根据该文件中设定的边界进行判断，束流损失的粒子信息将输出到 CollisionData.txt 文件中。此时，lattice.txt 中设置的元件半径将被屏蔽。

文件格式如下：

| type | material | Length | r1 | r2 | RLP | z0 | x0 | y0 | θz0 | θx0 | θy0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| int | string | m | m | m | m | m | m | m | deg | deg | deg |



## edst 混合束团格式 {#ref-edst}

> 来源：原手册对应章节。核对状态：保留原手册的格式定义并修正 esdt 拼写；本次未逐字节验证混合束团格式。

.edst 为扩展束团分布文件，用于多种粒子混合束团。ReadParticleDistribution 指向 .edst 时，原手册说明程序切换到混合束团模拟，分布输出也相应使用 .edst。

.edst文件中记录每个粒子的六维坐标及电荷量、静止质量、权重。具体格式为：

```text
2xCHAR+INT(Np)+DOUBLE(Ib(mA))+DOUBLE(freq(MHz))+CHAR+
(Np+1)×[9×DOUBLE(x(cm),x'(rad),y(cm),y'(rad),phi(rad),Energie(MeV),Charge(e),mc2(Mev),weight)]+DOUBLE(mc2(MeV))
```

其中最后一个粒子为束团同步粒子，weight的含义为当前宏粒子代表多少个真实粒子。

CHAR的长度为1字节，INT的长度为4字节，DOUBLE的长度为8字节。

Np是粒子的数量，Ib是流强（这里不生效），freq是束流频率，mc2是粒子的静止质量。



## inData.dst 与 outData_x.dst {#ref-dst}

> 来源：原手册对应章节。核对状态：来自原手册，结合当前输出快照说明。

记录了模拟中使用的初始束团分布。

outData_x.dst

输出了指定平面上的束团分布，x为输出平面的位置，为二进制文件。



## DataSet.txt 束团参数 {#ref-dataset}

> 来源：原手册对应章节。核对状态：列索引从 0 开始；已结合当前 41 列约定补充位置、单位及不完整行处理。

记录了模拟过程中的束团参数（s坐标系下），每一行为一组束团参数，每一行的格式为：

| 索引（从 0 开始） | 物理量 |
| --- | --- |
| 0 | `mean(E_k)` |
| 1 | `mean(x)` |
| 2 | `mean(γβ_x)` |
| 3 | `mean(y)` |
| 4 | `mean(γβ_y)` |
| 5 | `mean(z)` |
| 6 | `mean(γβ_z)` |
| 7 | `α_x` |
| 8 | `α_y` |
| 9 | `α_z` |
| 10 | `β_x` |
| 11 | `β_y` |
| 12 | `β_z` |
| 13 | `Emit_x` |
| 14 | `Emit_y` |
| 15 | `Emit_z` |
| 16 | `SizeX_RMS` |
| 17 | `SizeX'_RMS` |
| 18 | `SizeY_RMS` |
| 19 | `SizeY'_RMS` |
| 20 | `SizeZ_RMS` |
| 21 | `SizeZ'_RMS` |
| 22 | `MaxX` |
| 23 | `MaxX'` |
| 24 | `MaxY` |
| 25 | `MaxY'` |
| 26 | `MaxZ` |
| 27 | `MaxZ'` |
| 28 | `N_p` |
| 29 | `x_s` |
| 30 | `γβ_xs` |
| 31 | `y_s` |
| 32 | `γβ_ys` |
| 33 | `z_s` |
| 34 | `γβ_zs` |
| 35 | `sign` |
| 36 | `dir` |
| 37 | `∆x/∆y` |
| 38 | `∆z` |
| 39 | `Index` |
| 40 | `t` |

*sign==0：这组束团数据处于直线段。sign==1：这组束团数据处于曲线段。sign==2:这组数据无效，处理时跳过这组数据。当存在束流轨迹包含曲线时从DataSet.txt中读取有效数据的代码如下：

x 中心 = 第 29 列（同步粒子 x）+ 第 1 列（质心相对偏移）；示例最大 x = 第 29 列 + 第 1 列 + 第 22 列。

最大值x = 同步粒子x + 质心相对于同步粒子的偏移  + 最大值 （ 29 + 1 + 22）

每行 41 列。直线段纵向位置为第 5 列加第 33 列，含弯铁时按当前 dataset_envelope 规则累加弧长；不能把直线公式用于所有弯曲轨迹。rms x/y/z 是第 16/18/20 列，单位 m；第 28 列为存活宏粒子数，第 0 列为能量 MeV。读取实时写入文件时丢弃不完整末行。

## Phase.txt 射频腔出入口 {#ref-phase}

> 来源：原手册对应章节。核对状态：来自原手册；文件名大小写按实际输出确认。

每两行输出1个射频腔入口及出口处的信息。具体格式如下：

```text
射频腔序号 射频腔入口时间(s)  射频腔入口位置(m)  同步粒子在射频腔入口处能量(MeV)
射频腔序号 射频腔出口时间(s)  射频腔出口位置(m)  同步粒子在射频腔出口处能量(MeV)
```



## synParticle.txt 同步粒子轨迹 {#ref-syn-particle}

> 来源：原手册对应章节。核对状态：来自原手册。

记录了同步粒子在传输中的相关信息。具体格式如下：

```text
T     z_s    Ek_s      x_s      y_s       γβ_x      γβ_y        γβ_z         dir       α
```

*T：现实时间。dir==0：同步粒子沿z方向飞行；dir==1:同步粒子向x方向偏转；dir==2:同步粒子向y方向偏转。α：偏转角度（rad）。



## DynamicErrorData.txt 误差记录 {#ref-dynamic-errors}

> 来源：原手册对应章节。核对状态：原手册命名保留；当前 Python 误差抽样还会生成 Error_Datas_<组>_<次>.txt。

当存在误差时，会生成该文件，这个文件中记录了初始束团和每个元件的具体误差。第一行是初始束团的误差，从第二行开始每一行是一个元件的具体误差。



## BeamSet.plt 逐步粒子记录 {#ref-beamset}

> 来源：原手册对应章节。核对状态：保留单束与双束两套格式；单位、记录标志不可混用，双束格式本次未做二进制验证。

.plt是一个二进制文件，该文件存储了束流传输过程中每一步束团的信息，

```text
Char + Char + dumpPeriodicity(int) + Np(int) + Ib[mA](double) + freq[MHz](double) + mc2[MeV](double)
+ Nx * [Char + tpye(int) + Index(int) + time[s](double) + location[m](double) +
Np * [x(double) + px(double) +  y(double) + py(double) + z(double) + pz(double) + lossFlag(int)]]（场元件）
Np * [x(double) + px(double) +  y(double) + py(double) + t(double) + pz(double) + recordFlag(int)]] （矩阵元件）
```

说明

dumpPeriodicity：每推进多少步记录一次

Np: 粒子总数

Ib：流强

Freq：频率

mc2：静止能量（MeV），不是束流动能。

tpye：zcode(1)或 tcode(0)

index：步序号，0 为初始分布；与 DataSet 的对应需按当前读取器检查，不假定有缺失记录时仍能逐行直接配对。

times：tcode为同步粒子运行至该位置时间，zcode为所有粒子的平均时间

location：tcode为同步粒子位置， zcode所有粒子位置

p：动量（βγ）

lossflag: 1(损失) 2（通过输出平面）0（未丢失）

recordFlag：1（未丢失），0（丢失）

双束的plt文件与单束的结构不一样

```text
File format =
char
+ char
+ dumpPeriod(int)
+ Np(int)
+ Ib[mA](double)
+ Freq[MHz](double)
+ RestMass[MeV/c^2](double)
+ Nx × {
char
+ type(int)
+ index(int)
+ time[s](double)
+ location[m](double)
+ Np × [
x(double)
+ px(double)
+ y(double)
+ py(double)
+ z(double) or t(double)
+ pz(double)
+ lossFlag(int)
+ particleIndex(int)
+ charge[e](int)
+ RestMass[MeV/c^2](double)
+ weight(double)
]
}
```

接受度分析需要粒子逐步记录，dumpPeriodicity 必须大于 0。文件存在但没有粒子记录时仍不可计算。

[当前接受度操作步骤](#cases-acceptance)

## density 密度数据 {#ref-density}

> 来源：原手册对应章节。核对状态：原手册格式；max/min 字段文字存在歧义，下面明确保留待核实标记。

```text
zg(f) + emit_x(f) + emit_y(f) + emit_z(f) + rms_x(f) + rms_y(f) + rms_z(f) + nownumofp(i)
+ lost(i) + maxlost(i) + minlost(i) + moy( 4* f) + maxb(4*f) + minb(4*f) + maxr(4*f) + minr(4*f)
tab_x(i * 300) + tab_y(i * 300) + tab_r(i * 300)+ tab_z(i * 300)
```

x, y, r, z

（指束团中的单个粒子）

Zg:纵向距离

emit_x（f） + emit_y（f） + emit_z（f）： 发射度

rms_x(f) + rms_y(f) + rms_z(f)： 包络

nownumofp(i)：粒子数

loss（i）： 束损

maxlost(i)：最大束损 ，

minlost : 最小束损

moy( 4* f)： x, y, r, z的平均值

maxb、minb：原手册分别描述为最大、最小偏移粒子的最大值；说明不充分，具体含义待核实。

maxr、minr：原手册描述为最大、最小偏移粒子的最小值，但 max/min 文字相互交叉；含义待核实，不把这些文字作为已验证计算定义。

tab_x： (i) * 300, 统计粒子，将x_min – x_max分为300个网格， 统计每个网格内的粒子数



## synData.txt 元件入口参数 {#ref-syn-data}

> 来源：原手册对应章节。核对状态：补充已核实的 RF 相位换算；原文的字段序号不一致，不直接据此编写读取器。

该文件记录了同步粒子到达每个元件入口时的时间和能量。

字段说明：

```text
order name length zstart tin γβ ϕs ϕRF
原文列名数和标出的 0…8 序号不一致；此处不提供未经核实的序号映射。
```

如果设置了 RF 相位或同步相位，将计算对应的同步相位或 RF 相位。

φRF = phase_t0 + 360·f·t_in。分段把入口时间重置为 T_entry 时，phase_t0,new = φRF − 360·f·(t_in − T_entry)。频率用 Hz、时间用 s、相位用度，不能直接沿用中段绝对相位。

## pchistogram.dat 粒子直方图 {#ref-histogram}

> 来源：原手册对应章节。核对状态：原手册二进制格式；本次未逐字节验证。

当在 input.txt 中将 pchistogram 的 V1 设置为 1 时，会生成 pchistogram.dat 文件。

该文件记录了将每个方向的最小值到最大值范围划分为 V2 等份，并统计每一份中宏粒子的数量。

```text
该文件为二进制文件，格式为：char + Index(int) + V2(int) + V2 · tabx(int) + V2 · taby(int) + V2 · tabr(int) + V2 · tabz(int) + xmin(double) + xmax(double) + avex(double) + ymin(double) + ymax(double) + avey(double) + rmin(double) + rmax(double) + aver(double) + zmin(double) + zmax(double) + avez(double)
```



## SingleParticle.txt 单粒子输出 {#ref-single}

> 来源：原手册对应章节。核对状态：修正 displacepos 的单位为 mm，保留原文说明并标出差异。

在 beam.txt 中将关键字 particlenumber 设置为 1 时，将启用单粒子模拟，输出 SingleParticle.txt 文件，并记录该单粒子的轨迹。

| x | y | z | γβx | γβy | γβz | Ek | time |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m | m | m |  |  |  | MeV | s |  |

此时，beam.txt 中与多粒子相关的关键字（如 twissx、twissy、twissz、current 和 distribution）将不再生效。关键词 displacepos 和 displacedpos 会生效，用于设置初始单粒子的位置和动量偏移。

displacepos dx dy dz：内核按 mm 读取。原手册写 m，已依据仓库实测约定修正。

displacedpos dpx dpy dpz：动量偏移单位 %。

单粒子运行的 rms 列可能为 NaN，属于正常情况，需结合轨迹和存活数解读。

## errors_par.txt 误差统计 {#ref-error-summary}

> 来源：原手册对应章节。核对状态：字段顺序保留；与逐次结果表区分。

```text
step_err  误差组数
ave(ratio_loss)
ave(emit_x_increase)
ave(emit_y_increase)
ave(emit_z_increase)
ave(x_center(m))
ave(y_center(m))
ave(x_'(rad))
ave(y_'(rad))
ave(rms_x(m))
ave(rms_y(m))
ave(rms_x'(rad))
ave(rms_y'(rad))
ave(delat_energy)
rms(x_center(m))
rms(y_center(m))
rms(x_'(rad))
rms(y_'(rad))
rms(rms_x(m))
rms(rms_y(m))
rms(rms_x'(rad))
rms(rms_y'(rad))
rms(delat_energy(MeV))
```



## errors_par_tot.txt 逐次误差结果 {#ref-error-detail}

> 来源：原手册对应章节。核对状态：字段顺序保留。

```text
step_err 误差组数与次数
ratio_loss 误差损失率， 损失粒子数/总的粒子数
emit_x_increase   emit_x(output)/ emit_x(input) - 1
emit_y_increase   emit_y(output)/ emit_y(input) - 1
emit_z_increase   emit_z(output)/ emit_z(input) - 1
x_center(m)
y_center(m)
x_'(rad)
y_'(rad)
rms_x(m)
rms_y(m)
rms_x'(rad)
rms_y'(rad)
delat_energy(MeV),
alpha_xx’,
beta_xx’,
alpha_yy’,
beta_yy’,
alpha_zz’,
beta_zz’,
```


