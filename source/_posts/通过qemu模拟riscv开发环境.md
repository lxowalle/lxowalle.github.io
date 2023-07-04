---
title: 通过MEMU模拟开发环境
date: 2021-09-13 09:20:06
categories: "未分类"
tags:
---

# 通过MEMU模拟开发环境

#### 一、安装riscv开发环境

1. 安装qemu环境

对于ubuntu22.04

```shell
sudo apt install qemu-system-misc
```

安装完成后可以通过`qemu-system-riscv32` 或`qemu-system-riscv64`来启动qemu，分别对应32位的系统和64位的系统

2. 安装riscv交叉编译工具链

对于linux运行环境的工具链

```shell
sudo apt install gcc-riscv64-linux-gnu
sudo apt install binutils-riscv64-linux-gnu
```

对于裸机运行环境的工具链

```shell
sudo apt install gcc-riscv64-unknown-elf
sudo apt install binutils-riscv64-unknown-elf
```

检验安装是否成功

```shell
riscv64-linux-gnu-gcc -v
riscv64-unknown-elf-gcc -v
```



