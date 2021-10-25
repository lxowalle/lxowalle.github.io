---
title: Linux内核学习-编译内核
date: 2021-10-25 11:23:55
tags:
---

# Linux内核学习-编译内核

## 一、前言

​	由于没找到合适关于Linux内核学习的网络资料，现在准备通过《深入理解Linux内核》和《趣谈Linux操作系统》来学习。但是由于前者书中介绍使用的Linux Kernel是2.6.12版，所以只能现从2.6.12版开始入手。



## 二、编译Kernel 2.6.12内核

##### 1. 下载内核

​	点击[这里](https://cdn.kernel.org/pub/linux/kernel/v2.6/linux-2.6.12.1.tar.bz2)下载内核2.6.12版

##### 2. 解压缩

```
tar -xvf linux-2.6.12.1.tar.bz2
```

注意不能解压到`/usr/local/linux`，这个目录会被自己电脑使用。

##### 3. 验证签名和打补丁

​	没有验证，可以参考[这里](https://www.cnblogs.com/papam/archive/2009/08/31/1557563.html)

##### 4. 配置内核

​	使用menuconfig来配置内核，输入命令：

```
make menuconfig
```

关于内核配置的相关命令：

```
make oldconfig		: 基于已有的.config进行配置, 若有新的符号, 它将询问用户.
make defconfig		: 按默认选项对内核进行配置(386的默认配置是Linus做的).
make allnoconfig	: 除必须的选项外, 其它选项一律不选. (常用于嵌入式系统).
make clean			: 删除生成的目标文件, 往往用它来实现对驱动的重新编译.
make mrproper 		: 删除包括.config在内的生成的目标文件.
```

Tips:

- 缺少依赖

  ```
  sudo apt install libncurses-dev flex bison
  ```

##### 5. 配置

​	在工程根目录下的Makefile中可以修改内核版本，一般修改EXTRAVERSION宏

```
VERSION = 2					# 内核主版本号
PATCHLEVEL = 6				# 内核次版本号
SUBLEVEL = 12				# 内核子版本号
EXTRAVERSION = .1			# 额外版本号
```

##### 6. 编译

​	配置完成，开始编译

```
# 方法1
make -jN					# N表示使用的CPU个数
# 方法2
make -jN > /dev/null		# 此时不会有编译信息，但是能看到Error和Warning
```

Tips:

- 缺少依赖

  ```
  sudo apt install libelf-dev
  ```

- 出现错误`code model kernel does not support PIC mode`

  > 由于gcc 6+版本在默认情况启用了PIE，gcc 5.0也可能会出错。需要手动禁用这个功能。





参考文档：

[编译Linux2.6 内核总结](https://www.cnblogs.com/papam/archive/2009/08/31/1557563.html)

