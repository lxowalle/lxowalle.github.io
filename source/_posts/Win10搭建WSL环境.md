---
title: Win10搭建WSL环境
date: 2021-09-14 13:08:48
categories: "未分类"
tags:
---

# Win10搭建WSL环境

[参考资料](https://www.jianshu.com/p/741fc78eb262)

记录搭建WSL环境的过程，以便以后不用每次搭建前都到处查找资料

## 一、基本步骤

1. 启动windows的Linux子系统功能
2. 下载并安装Linux子系统（通过微软商店或者[微软官网](https://docs.microsoft.com/zh-cn/windows/wsl/install-manual)）
3. 启动

### 1.1 启动windows的Linux子系统功能

控制面板->卸载程序->启用或关闭Windows功能->适用于Linux的Windows子系统  打上对勾，并确定

### 2.2 下载Linux子系统

1. 通过微软商店下载安装

    打开商店，搜索ubuntu并安装即可

2. 通过微软官网下载安装

    在[微软官网](https://docs.microsoft.com/zh-cn/windows/wsl/install-manual)下载需要的子系统，将扩展名修改为zip，解压放在D盘（自定义），打开ubuntu.exe安装

### 2.3 启动

找到wsl ubuntu的图标点击即可