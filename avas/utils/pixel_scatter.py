"""Pixel / block density image of a particle cloud (numba-compiled on first use).

numba is imported lazily: importing this module is cheap, the first call to
:func:`pixel_scatter` (or :func:`warmup`) compiles the kernel and caches it.
"""
import numpy as np

prange = range          # replaced by numba.prange when the kernel is compiled (numba reads globals then)
_kernel = None


def _pixel_scatter_impl(x, y,
                        xmin, xmax, ymin, ymax,
                        W, H, block_num,
                        fill_value):

    # 1. 像素级统计
    n1 = np.full((H, W), fill_value, dtype=np.float32)

    dx = xmax - xmin
    dy = ymax - ymin

    N = x.shape[0]

    # 块大小（可以根据需要改）

    block_h = block_num
    block_w = block_num

    # 块的数量
    h_blocks = H // block_h
    if H % block_h != 0:
        h_blocks += 1

    w_blocks = W // block_w
    if W % block_w != 0:
        w_blocks += 1

    # 每个块的粒子总数
    n2_small = np.zeros((h_blocks, w_blocks), dtype=np.float32)

    # ========= 1 + 2：在同一轮循环里统计 n1 和 n2_small =========

    # n1：每个像素格里有多少点
    # n2：每个大块block里有多少点，然后把这个块值铺回这个块覆盖的所有像素
    for k in prange(N):
        X = x[k]
        Y = y[k]

        if X < xmin or X > xmax or Y < ymin or Y > ymax:
            continue

        i = int((X - xmin) / dx * (W - 1))  #求出像素位置
        j = int(((Y - ymin) / dy) * (H - 1))  #求出像素位置

        if 0 <= i < W and 0 <= j < H:
            n1[j, i] += 1.0   #每个像素点代表多少粒子

            # 关键：直接算出所在块
            bh = j // block_h   #像素位置÷ 每块像素的大小 = 像素位于哪个格子里
            bw = i // block_w
            if bh < h_blocks and bw < w_blocks:
                n2_small[bh, bw] += 1.0        #每个block块里有多少个粒子

    # ========= 3. 把块值铺回到每个像素 -> n2 =========
    n2 = np.zeros_like(n1)

    for bh in prange(h_blocks):
        j1 = bh * block_h
        j2 = H if (bh + 1) * block_h > H else (bh + 1) * block_h  #这个快覆盖的起始像素和终点像素

        for bw in range(w_blocks):
            i1 = bw * block_w
            i2 = W if (bw + 1) * block_w > W else (bw + 1) * block_w   # 对应的w像素

            v = n2_small[bh, bw]
            for jj in range(j1, j2):
                for ii in range(i1, i2):
                    n2[jj, ii] = v   #为每个像素赋值

    # ========= 4. 用块总数替换 n1 中非零像素 =========
    for j in prange(H):
        for i in range(W):
            if n1[j, i] > 0.0:
                n1[j, i] = n2[j, i]

    return n1


def _compile():
    global _kernel, prange
    from numba import njit
    from numba import prange as numba_prange
    prange = numba_prange
    _kernel = njit(parallel=True, cache=True)(_pixel_scatter_impl)
    return _kernel


def pixel_scatter(x, y, xmin, xmax, ymin, ymax, W, H, block_num, fill_value):
    """Density image ``(H, W)``: every pixel that holds particles gets the count of its ``block_num``² block."""
    return (_kernel or _compile())(x, y, xmin, xmax, ymin, ymax, W, H, block_num, fill_value)


def warmup():
    # 用小数据触发一次编译
    x_dummy = np.linspace(0, 1, 1000, dtype=np.float64)
    y_dummy = np.linspace(0, 1, 1000, dtype=np.float64)

    x_dummy = np.ascontiguousarray(x_dummy)
    y_dummy = np.ascontiguousarray(y_dummy)

    _ = pixel_scatter(x_dummy, y_dummy,
                      0.0, 1.0, 0.0, 1.0,
                      100, 75, 4, 0.0)
