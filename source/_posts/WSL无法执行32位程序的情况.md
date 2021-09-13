---
title: WSL无法执行32位程序的情况
date: 2021-09-10 13:10:47
categories: "none class"
tags:
---
# WSL无法执行32位程序的情况

#### 问题：

```
在WSL下编译Tina Linux后，在打包时出现了
```

`/home/sipeed/sipeed/v831_SDK/sdk/out/host/bin/dragon: cannot execute binary file: Exec format error`的错误，从网上得出了问题的原因时WSL默认使用64bit的程序，不支持32位程序。

#### 解决方法：

安装QEMU来虚拟化内核：

1. 安装QEMU

```
sudo apt update
sudo apt install qemu-user-static
sudo update-binfmts --install i386 /usr/bin/qemu-i386-static --magic '\x7fELF\x01\x01\x01\x03\x00\x00\x00\x00\x00\x00\x00\x00\x03\x00\x03\x00\x01\x00\x00\x00' --mask '\xff\xff\xff\xff\xff\xff\xff\xfc\xff\xff\xff\xff\xff\xff\xff\xff\xf8\xff\xff\xff\xff\xff\xff\xff'
```

2. 启动服务

调用32位程序前需要启动一次

```
sudo service binfmt-support start
```

3. 启动32位架构

```
sudo dpkg --add-architecture i386
sudo apt update
sudo apt-get install libc6:i386 libncurses5:i386 libstdc++6:i386
```
