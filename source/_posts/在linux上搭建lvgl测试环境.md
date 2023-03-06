---
title: 在linux上搭建lvgl测试环境
tags:
---

# 在linux上搭建lvgl测试环境

1. 安装依赖

```shell
sudo apt-get install -y build-essential libsdl2-dev
```

2. 下载测试仓库

```shell
# 下载测试代码，二选一
git clone git@github.com:lxowalle/lvgl_test_project.git
git clone https://github.com/lxowalle/lv_port_pc_vscode.git
```

3. 下载子模块

```shell
cd lvgl_test_project    # or cd lv_port_pc_vscode
git submodule update --init --recursive
```

4. 编译运行

```shell
cd lvgl_test_project    # or cd lv_port_pc_vscode
make && ./build/bin/demo
```
