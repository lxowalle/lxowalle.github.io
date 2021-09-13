---
title: lvgl gui工具使用
date: 2021-09-10 11:00:51
categories: "none class"
tags:
---
# LVGL GUI Guider工具使用

## 一、下载和安装工具

### 1.1 安装GUI Guider

[GUI Guider工具下载](https://www.nxp.com/design/software/development-software/gui-guider:GUI-GUIDER)

- 进入官网，找到并点击`Download`
- 选择下载Linux or Windows版的软件
- 安装软件
- 完成

### 1.2 安装Java环境

[Java环境下载](https://www.oracle.com/java/technologies/javase-jdk16-downloads.html)

- 进入下载网站，找到并点击`Java SE Downloads`
- 选择下载Linux or Windows版的软件找到使用
- 安装软件
- 完成

Tips:

> 下载GUI Guider工具时，如果没有NXP的账号，需要注册一个账号，填写下信息然后邮箱验证一下就OK了

## 二、 使用工具

### 2.1 创建一个工程

- 打开创建Project
- 设置工程名，工程目录、选择模板（或选择空模板）、选择颜色深度(16bit)、选择尺寸(可以自定义长宽)
- 设置完后点击CREATE

### 2.2 工程应用

- 语言设置
  根据个人爱好选择语言:点击右边设置栏的Systerm->LANGUAGE->English/Chinese->拉到最下边，点击保存修改
- 添加控件
  拖动左边的组件到屏幕中央，即可添加一个组件。
- 添加控件的属性
  点击选中控件->打开右侧Widget->根据需求配置控件属性
- 添加控件的事件
  点击选中控件->打开右侧Event->点击+号图标->根据需求配置控件事件

  > 注：不支持事件的控件无法设置事件
  >
- 预览配置

  点击 `Run Simulator`->选择要预览的工程->等待显示预览结果
- 生成代码

  1. 点击`Generate Code`->等待生成代码
  2. 点击`Code Viewer`查看代码
- 获取代码

  方法1：点击 `File `->`Export Code `->`IAR Code `or `MCUx Code`（实际没用起来）

  方法2：直接到工程目录中获取，代码保存在目录 `project_dir/project name/generated下`

### 2.3 生成字体

- 点击File->Generate Fonts，此时弹出配置界面
- 选择字体格式->选择字体尺寸->设置需要的文字内容
- 点击Submit，开始生成
- 生成的字体保存在目录`project_dir/project name/generated/guider_fonts`下
