---
title: 在WSL上使用adb
date: 2021-09-14 20:40:42
categories: "未分类"
tags:
---

# 在WSL上使用ADB

在WSL上安装后是不能直接连接adb设备，需要保证Linux子系统与Windows都安装了相同版本的adb工具

工具下载链接：
[Windows ADB工具](https://dl.google.com/android/repository/platform-tools-latest-windows.zip)
[Linux ADB工具](https://dl.google.com/android/repository/platform-tools-latest-linux.zip)

## Windows安装过程

- 下载压缩包并解压
- 将解压后的路径添加到环境变量PATH中
- 检查adb是否成功安装，命令:adb --version

## Linux安装过程

- 下载压缩包并解压(可以用wget命令下载)
- 将解压的路径添加到环境变量PATH中；如果Linux本身带有adb命令，则可以将解压的platform-tools文件替换到路径/usr/lib/android-adk/下
- 检查adb是否成功安装，命令:adb --version
