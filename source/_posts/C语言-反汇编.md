---
title: C语言-反汇编
date: 2021-11-12 20:01:23
tags:
---

# C语言-反汇编

当只拿到程序退出的地址时，通过objdump反汇编代码来获取代码每行指令的地址，从而定位到问题位置。

应用方法：

1. 获取对应程序的工具链，工具链中会自带有反汇编的工具指令obj_dump
2. 执行反汇编

    ```shell
    riscv64-unknown-elf-objdump -d Ai_Module_Lib		# 反汇编
    riscv64-unknown-elf-objdump -dl Ai_Module_Lib		# 反汇编并插入源代码行号和文件名
    riscv64-unknown-elf-objdump -d Ai_Module_Lib > code	# 将反汇编代码保存到code中
    ```
3. 根据code文件查询目标地址的代码，定位故障代码的位置

参考文章：

[嵌入式Linux编程之交叉编译](https://www.cnblogs.com/zyly/p/14826438.html)
[objdump的用法](https://ivanzz1001.github.io/records/post/linux/2018/04/09/linux-objdump)