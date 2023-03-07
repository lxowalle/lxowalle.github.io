---
title: 在linux上搭建lwip测试环境
tags:
---

# 在linux上搭建lwip测试环境

1. 下载lwip仓库

```shell
# 个人仓库
git clone git@github.com:lxowalle/lwip.git

# 官网仓库
git clone https://github.com/lwip-tcpip/lwip.git
```

2. 编译和运行

```shell
# 复制一份默认的配置文件(默认配置文件保存路径lwip/contrib/examples/example_app/lwipcfg.h.example)
cp lwip/contrib/examples/example_app/lwipcfg.h.example lwip/contrib/ports/unix/example_app/lwipcfg.h

# 进入
cd lwip/contrib/ports/unix/example_app

# 编译运行
make && ./example_app
```

注：
对于提示找不到tap文件的情况，可以尝试执行lwip自带的更新tapif脚本

```shell
bash contrib/ports/unix/setup-tapif
```

setup-tapif脚本内容

```shell
export PRECONFIGURED_TAPIF=tap0
sudo ip tuntap add dev $PRECONFIGURED_TAPIF mode tap user `whoami`
sudo ip link set $PRECONFIGURED_TAPIF up
sudo brctl addbr lwipbridge
sudo brctl addif lwipbridge $PRECONFIGURED_TAPIF
sudo ip addr add 192.168.1.1/24 dev lwipbridge
sudo ip link set dev lwipbridge up
```