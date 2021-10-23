---
title: Linux内核编译
date: 2021-10-22 09:51:47
tags:
---



# Linux内核编译

[源码地址](https://github.com/torvalds/linux.git)

```
make clean
make mrproper
make menuconfig
make
```

make menuconfig遇到问题，需要安装依赖：

```
sudo apt install libncurses-dev flex bison
```

make遇到问题，需要安装依赖；

```
libelf-dev 
```



