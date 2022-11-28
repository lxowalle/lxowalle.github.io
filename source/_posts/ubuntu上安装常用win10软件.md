---
title: ubuntu上安装常用win10软件
date: 2021-10-19 19:38:28
tags:
---

# ubuntu上安装常用win10软件

[参考链接](https://github.com/zq1997/deepin-wine)

##### 安装Windows软件方法

1. 添加仓库

```
wget -O- https://deepin-wine.i-m.dev/setup.sh | sh
```

2. 安装应用

```
sudo apt-get install com.qq.weixin.deepin   # 微信
sudo apt-get install com.qq.im.deepin       # QQ
sudo apt-get install com.dingtalk.deepin    # 钉钉
# 更多安装包见:https://deepin-wine.i-m.dev
```

3. 安装完成并重启电脑后会生成运行图标，点击图标来启动程序
##### 微信不能输入中文

在deepin-wine的运行脚本目录中加载输入法

```shell
cd /opt/deepinwine/tools/
sudo chmod 666 run.sh  			#文件默认为只读，修改权限
vim run.sh   					#修改脚本
# 加入以下内容
export GTK_IM_MODULE="fcitx"
export QT_IM_MODULE="fcitx" 
export XMODIFIERS="@im=fcitx"
```

#### ubuntu 上微信不能压缩图片的问题

需要安装微信支持的压缩库
```shell
sudo apt-get install libjpeg62:i386
```

#### 解决微信输入汉字是方块的问题
https://github.com/wszqkzqk/deepin-wine-ubuntu/issues/136

##### 20220428更新

参考[这里](https://github.com/lovechoudoufu/wechat_for_linux)的步骤也可以使用微信

```shell
# 下载
http://archive.ubuntukylin.com/ubuntukylin/pool/partner/weixin_2.1.1_amd64.deb

# 安装
sudo dpkg -i weixin_2.1.1_amd64.deb

# 启动
./weixin
```

