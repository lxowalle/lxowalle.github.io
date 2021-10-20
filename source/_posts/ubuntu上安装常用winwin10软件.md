---
title: ubuntu上安装常用winwin10软件
date: 2021-10-19 19:38:28
tags:
---

# ubuntu上安装常用win10软件

[参考链接](https://github.com/zq1997/deepin-wine)

安装方法：

- 添加仓库

```
wget -O- https://deepin-wine.i-m.dev/setup.sh | sh
```

- 安装应用

```
sudo apt-get install com.qq.weixin.deepin   # 微信
sudo apt-get install com.qq.im.deepin       # QQ
sudo apt-get install com.dingtalk.deepin    # 钉钉
# 更多安装包见:https://deepin-wine.i-m.dev
```

- 点击图标来启动程序(如果未出现图标，尝试重启电脑)