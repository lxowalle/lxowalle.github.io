---
title: Linux内核学习-编译内核
date: 2021-10-25 11:23:55
tags:
---

# Linux内核学习-编译内核

## 一、前言

​	由于没找到合适关于Linux内核学习的网络资料，现在准备通过《深入理解Linux内核》和《趣谈Linux操作系统》来学习。但是由于前者书中介绍使用的Linux Kernel是2.6.11版，所以只能现从2.6.11版开始入手。



## 二、编译GCC

​	这一步骤是由于内核的版本太低，和我电脑的GCC不匹配导致出现了很多依赖问题，我又不愿意降低电脑默认GCC版本，所以干脆另外编译一个低版本GCC来编译内核。电脑本地的GCC版本为9.3.0

##### 1. 获取GCC源码

点击[这里](http://mirrors.concertpass.com/gcc/releases/)获取需要的GCC版本，我选择了[GCC 2.6.2](https://ftp.gnu.org/gnu/gcc/gcc-4.6.2/gcc-4.6.2.tar.bz2)

##### 2. 解压

```
tar -xf gcc-4.6.2.tar.bz2 
```

##### 3. 配置编译环境

```
cd gcc-4.6.2
./contrib/download_prerequisites 			# 安装依赖（mpc,mpfr,gmp）
./configure --prefix=/usr/local/gcc-4.6.2	# 这里让GCC安装到指定目录
```

##### 4. 编译和安装

```
make -j8
make install
```

**出现错误：**

问题1：提示linux-unwind.h文件中的字段‘info’的类型不完全,字段‘uc’的类型不完全

解决方法：

```
1. 通过命令`find . name "linux-unwind.h"`查询该文件路径
2. 将报错位置的struct siginfo替换为siginfo_t
3. 将报错位置的struct ucontext替换为ucontext_t
```

问题2：error ：dereferencing pointer to incomplete type

解决方法:

```
原理同问题1，找到错误的结构体并修改
```

问题3：找不到 crti.o: 没有那个文件或目录

解决方法：

```
1. 通过命令`find /usr -name "crti*"`找到crti.o的路径，并添加路径到环境变量LIBRARY_PATHZHONG
2. export LIBRARY_PATH=/usr/lib/x86_64-linux-gnu	

需要注意：LIBRARY_PATH不能有空元素(例如符号:后面为空)，否则编译器可能会报错
```

问题4：error： 对不完全的类型‘struct _Jv_catch_fpe(int, siginfo_t*, void*)::ucontext’的非法使用

解决方法：

```
同问题1，我干脆把GCC源码所有的struct siginfo替换为siginfo_t，所有的struct ucontext替换为ucontext_t
```

问题5：undefined reference to `__cxa_call_unexpected'

解决方法：

> 需要替换/gcc-4.6.2/libjava目录下的prims.cc文件

需要替换的prims.cc内容在[这里](https://gcc.gnu.org/git/?p=gcc.git;a=blob_plain;f=libjava/prims.cc;hb=b33ddba240f10fbabd5e8ce12bb95038f0650886)复制

##### 5. 安装（可选）

```
make check
sudo make install
```

问题6：error: relink `libgfortran.la' with the above command before installing it

解决方法：

```

```

问题7：autogen：未找到命令（该问题是执行make check出现）

解决方法：

```
sudo apt install autoconf automake libtool autogen
```

问题8：runtest: 未找到命令（该问题是执行make check出现）

解决方法：

```
sudo apt install dejagnu 
```

问题8参考自[这里](https://command-not-found.com/runtest)

问题9：

make[6]: 进入目录“/home/liuxo/third_party/gcc-4.6.2/x86_64-unknown-linux-gnu/32/libjava/libltdl”
make[6]: *** 没有规则可制作目标“x86_64-unknown-linux-gnu/libgfortran/libgfortran.la”，由“all-am” 需求。 停止。



## 二、编译Kernel 2.6.11内核

##### 1. 下载内核

​	点击[这里](https://cdn.kernel.org/pub/linux/kernel/v2.6/linux-2.6.11.1.tar.bz2)下载内核2.6.11版

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

