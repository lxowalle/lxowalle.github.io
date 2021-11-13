---
title: Linux内核学习-编译运行内核4.9
date: 2021-11-13 14:36:28
tags:
---

# Linux内核学习-编译运行内核4.9



## 一、 配置和编译Linux内核4.9

在[这里](https://mirrors.edge.kernel.org/pub/linux/kernel/)下载Linux内核，下面内核版本为4.9.229

本地编译(x86)：

```shell
tar -xvf linux-4.9.229.tar.gz
cd linux-4.9.229
export ARCH=x86
make x86_64_defconfig
make menuconfig
# menuconfig 配置内容
General setip->
	[*]Initial RAM filesystem and RAM disk (initramfs/initrd) support
Device Drivers->
	[*]Block devices --->
          (16)    Default number of RAM disks                                       		(65536) Default RAM disk size (kbytes) 
# end
make
```

编译完成后，可以在`linux-4.9.229/arch/x86_64/boot`目录下看到编译好的内核文件bzImage

## 二、配置和编译busybox

在[这里](https://busybox.net/downloads/)下载busybox，下面的busybox版本为1.34.1

编译安装:

```shell
tar -xvf busybox-1.34.1.tar.bz2
cd busybox-1.34.1
make menuconfig
make && make install
```

编译、安装完成后，可以在`busybox-1.34.1/_install`目录下看到安装结果

配置：

下面的操作都是基于_install目录下完成

1. 创建自定义的目录

   ```shell
   mkdir etc dev mnt proc sys tmp		# 创建配置目录、设备目录、挂载目录、
   mkdir -p etc/init.d/				# 创建初始化配置目录
   ```

2. 创建自定义配置

   ```shell
   vim etc/fstab
   
   # 内容
   proc        /proc           proc         defaults        0        0
   tmpfs       /tmp            tmpfs    　　defaults        0        0
   sysfs       /sys            sysfs        defaults        0        0
   ```

   ```shell
   vim etc/init.d/rcS
   chmod 755 etc/init.d/rcS
   
   # 内容
   echo -e "Welcome to tinyLinux"
   /bin/mount -a
   echo -e "Remounting the root filesystem"
   mount  -o  remount,rw  /
   mkdir -p /dev/pts
   mount -t devpts devpts /dev/pts
   echo /sbin/mdev > /proc/sys/kernel/hotplug
   mdev -s
   ```

   ```shell
   vim etc/inittab
   chmod 755 etc/inittab
   
   # 内容
   ::sysinit:/etc/init.d/rcS
   ::respawn:-/bin/sh
   ::askfirst:-/bin/sh
   ::ctrlaltdel:/bin/umount -a -r
   ```

3. 创建设备文件

   ```shell
   cd dev
   sudo mknod console c 5 1		# c表示字符设备，5是主设备号，1是次设备号
   sudo mknod null c 1 3
   sudo mknod tty1 c 4 1
   ```

编写脚本来打包根文件系统：

```shell
vim create_rootfs.sh
chmod +x create_rootfs.sh

# 内容
#!/bin/bash
rm -rf rootfs.ext3
rm -rf fs
dd if=/dev/zero of=./rootfs.ext3 bs=1M count=32
mkfs.ext3 rootfs.ext3
mkdir fs
mount -o loop rootfs.ext3 ./fs
cp -rf ./_install/* ./fs
umount ./fs
gzip --best -c rootfs.ext3 > rootfs.img.gz
```

## 三、安装qemu

qemu的安装方法和地址点[这里](https://www.qemu.org/download/):

安装依赖库：

```shell
sudo apt install ninja-build libglib2.0-dev build-essential zlib1g-dev pkg-config libpixman-1-dev libsdl1.2-dev libsdl2-dev
```

编译安装方法1：

```shell
wget https://download.qemu.org/qemu-6.1.0.tar.xz
tar xvJf qemu-6.1.0.tar.xz
cd qemu-6.1.0
sudo ./configure --enable_sdl
sudo make && make install
```

编译安装方法2：

```shell
git clone https://gitlab.com/qemu-project/qemu.git
cd qemu
git submodule init
git submodule update --recursive
sudo ./configure --enable_sdl
sudo make && make install
```

## 四、运行内核

```
qemu-system-x86_64 \
-kernel linux-4.9.229/arch/x86_64/boot/bzImage \
-initrd busybox-1.34.1/rootfs.img.gz \
-append "root=/dev/ram init=/linuxrc" \
-serial file:output.txt
```

注意：

```shell
在qemu中弹出鼠标的快捷键：Ctrl+Alt+G
```



## 问题

1. 内核启动后报错

   ```
   Kernel panic - not syncing: VFS: unable to mount root fs on unknown block
   ```

   



参考文章:

[Ubuntu20.04编译安装qemu6.0](https://blog.csdn.net/qq_36393978/article/details/118086216)

[带你阅读linux内核源码：下载源码、编译内核并运行一个最小系统](https://www.bilibili.com/read/cv7118525)

[qemu运行虚拟机无反应，只输出一行提示信息:VNC server running on 127.0.0.1:5900](https://blog.csdn.net/qq_36393978/article/details/118353939)
