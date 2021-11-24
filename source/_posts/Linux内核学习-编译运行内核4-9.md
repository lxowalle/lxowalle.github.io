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
make menuconfig		# 注意需要在Setting中配置为静态编译，否则运行时会缺少动态库
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

   关于/etc/fstab：这是一个挂载文件，文件被手动挂载后必须将挂载信息写入到/etc/fstab文件中，否则下次启动仍然需要重新挂载。系统会在启动后主动读取/etc/fstab的配置来挂载文件。详细内容见附录。

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
   
   # 注册热拔插事件的处理程序
   echo /sbin/mdev > /proc/sys/kernel/hotplug	
   # 扫描/sys/class和/sys/block的dev文件
   mdev -s										
   ```

   关于/etc/init.d/rcS：这是一个脚本文件，在inittab文件中解析调用，一般用来配置Linux系统。

   关于/dev/pts:这是伪终端的Slave端(pseudo-terminal slave)，在该文件下有以数字为名的文件，每个文件都代表一个伪终端。通过`tty`命令可以查询当前终端的设备文件名，详细内容见附录。

   ```shell
   vim etc/inittab
   chmod 755 etc/inittab
   
   # 内容
   ::sysinit:/etc/init.d/rcS
   ::respawn:-/bin/sh
   ::askfirst:-/bin/sh
   ::ctrlaltdel:/bin/umount -a -r
   ```

   关于/etc/initab:Linux启动配置文件，通过这个文件来配置不同的运行级别启动相应的进程或执行相应的操作。详细内容见附录。

   

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

   ```shell
   Kernel panic - not syncing: VFS: unable to mount root fs on unknown block
   
   # 选择RAM block device support时错误勾选了M，导致只编译成了模块，没有编译进内核
   ```
   
2. 增加根文件系统分区后报错

   ```shell
   Kernel Panic not syncing: IO APIC+timer dos'nt work!
   
   # 把根文件系统分区大小修改为64M
   ```

3. 内核启动报错

   ```shell
   end Kernel panic - not syncing: Requested init /linuxrc failed (error -2).
   
   # 缺少busybox依赖的动态库，需要静态编译busybox，编译前在menuconfig的Setting选项中勾选静态编译
   ```

   

## 附录

### /etc/fstab文件

1. 功能

   系统启动时会读取/etc/fstab文件的内容来挂载磁盘。修改这个文件可以让系统自动挂载磁盘。

2. 挂载的限制

   - 根目录必须挂载，且必须第一个挂载。因为其他目录都是由根目录衍生出来的。
   - 挂载点必须是已存在的目录
   - 挂载点可以任意指定，但必须遵循系统目录架构原理
   - 所有挂载点同一时间只能被挂载一次
   - 所有分区同一时间只能挂载一次
   - 若进行卸载，必须先将当前工作的目录退出挂载目录外

3. 参数

   ```shell
   # This file is edited by fstab-sync - see 'man fstab-sync' for details
   # Device                Mount point        filesystem   parameters  dump fsck
   LABEL=/                 /                       ext3    defaults        1 1
   LABEL=/boot             /boot                   ext3    defaults        1 2
   none                    /dev/pts                devpts  gid=5,mode=620  0 0
   none                    /dev/shm                tmpfs   defaults        0 0
   none                    /proc                   proc    defaults        0 0
   none                    /sys                    sysfs   defaults        0 0
   LABEL=SWAP-sda3         swap                    swap    defaults        0 0
   /dev/sdb1               /u01                    ext3    defaults        1 2
   UUID=18823fc1-2958-49a0-9f1e-e1316bd5c2c5       /u02    ext3    defaults        1 2
   /dev/hdc                /media/cdrom1           auto    pamconsole,exec,noauto,managed 0 0
   /dev/fd0                /media/floppy           auto    pamconsole,exec,noauto,managed 0 0
   ```

   上面是一个/etc/fstab文件的内容，可以发现内容就是一个表格，每一行代表一个挂载点，下面依次解释每一列的含义：

   1. Device，磁盘设备文件或者该设备的Label或UUID。Label就是安装Linux系统时填写的挂载点的名字。通过`dumpe2fs -h`查看superblock可以找到UUID和Label name，通过UUID和Label name就可以防止磁盘顺序变化导致无法正确挂载磁盘的问题。

      查看分区的Label和uuid的方法：

      ```shell
      # 查看分区的Label和uuid，方法1:(Filesystem volume name后面是Label，Filesystem UUID后面是UUID)
      ~ » sudo dumpe2fs -h /dev/nvme1n1p2                                                           19 ↵ liuxo@liuxo
      dumpe2fs 1.45.5 (07-Jan-2020)
      Filesystem volume name:   <none>			# Label
      Last mounted on:          /
      Filesystem UUID:          6217e8fa-c2a4-45dc-9279-3639fcdec529	#UUID
      Filesystem magic number:  0xEF53
      Filesystem revision #:    1 (dynamic)
      Filesystem features:      has_journal ext_attr resize_inode dir_index filetype needs_recovery extent 64bit flex_bg sparse_super large_file huge_file dir_nlink extra_isize metadata_csum
      # ...
      
      # 查看分区的Label和uuid，方法2:(LABLE为none可能不会打印)
      ~ » blkid /dev/nvme1n1p2                                                  
      /dev/nvme1n1p2: LABEL="/" UUID="3b10fe13-def4-41b6-baae-9b4ef3b3616c" SEC_TYPE="ext3" TYPE="ext4"
      ```

   2. Mount point，设备挂载点

   3. filesystem，磁盘文件系统的格式，包括ext2、ext3、reiserfs、nfs、vfat等

   4. Parameters，文件系统的参数，通过这个参数来配置挂载的文件系统属性。下面列举常用的几个参数：

      | 参数        | 说明                                  |
      | ----------- | ------------------------------------- |
      | async/sync  | 设置是否为同步方式执行                |
      | auto/noauto | 执行mount -a命令时，是否主动被挂载    |
      | rw/ro       | 文件系统是否读写/只读                 |
      | exec/noexec | 文件系统是否能够拥有"执行"操作        |
      | user/nouser | 是否允许用户用mount挂载               |
      | suid/nosuid | 是否允许SUID的存在                    |
      | defaults    | 同时拥有async,auto,rw,exec,suid等功能 |

   5. fask，开机时是否检验系统是否完整。有3个值可以设置：

      0，不检验

      1，检验（优先级最高，一般根目录会选择

      2，检验

### tty

​	tty是终端设备的统称，包括有虚拟控制台，串口和伪终端设备。在/dev目录下可以看到很多。

1. /dev/tty设备是当前进程的控制终端的设备特殊文件，它会将输入重定向到当前终端上。

   ```shell
   ~ » echo Hello > /dev/tty                                           
   Hello
   ```

2. /dev/ttyn

   tty0~tty63是虚拟终端的设备特殊文件。/dev/tty0代表当前虚拟控制台，/dev/tty1代表第1个虚拟控制台。使用alt+[f1-f6]可以切换虚拟控制台。

3. /dev/ttySn

   ttySn代表串行终端设备，这些设备文件映射到物理串行端口。

### pty

​	pty是伪终端设备，一般用于远程连接。pty由Master和Slave端主动，/deb/ptmx是Master端，/dev/pty/n是Slave端，任何一段的输入都会传达到另一端。

​	使用`tty`命令查看当前用户的登录终端：

```shell
~ » tty                                                                          
/dev/pts/0
```

### /etc/inittab

​	通过/etc/inittab文件来配置Linux启动时执行进程的顺序和运行级别。示例如下：

```shell
cat etc/inittab
# id:runlevel:action:process
::sysinit:/etc/init.d/rcS
::respawn:-/bin/sh
::askfirst:-/bin/sh
::ctrlaltdel:/bin/umount -a -r
```

​	etc/inittab文件内由多个登记项组成，每个登机项有4个参数：

1. id：用来作为每个登机项的唯一标识符，不可重复。

2. runlevel：表示进程运行的级别，同一个进程可以有多个运行级别，各个级别之间不需要分隔符。如果为空，则表示在所有的运行级别中运行。Linux运行级别有：

   - 0，关机
   - 1，单用户模式
   - 2，多用户模式
   - 3，命令行模式
   - 4，保留
   - 5，图形用户模式
   - 6，重启

3. action：表示登记项的进程在一定条件下需要执行的动作。包括有：

   - respawn：当进程终止后马上启动一个新的
   - askfirst：当进程终止后先询问，再启动一个新的

   - wait：当进入指定的runlevels后进程会启动一次，离开这个runlevels后终止
   - initdefault：设置默认的运行级别
   - sysinit：当系统开机或重新启动时会执行一次
   - boot：在引导过程中执行一次，但不等待进程结束
   - bootwait：在引导过程中执行一次，并等待进程结束
   - off：如果进程已经在运行，则发出警告信号，并在20s后发送强制终止该进程。
   - once：启动进程一次
   - process：启动程序、脚本或命令
   - powerfail：当接收到电源失败信号时执行一次
   - powerwait：当接收到电源失败信号时执行一次；如果init有进程运行，等待这个进程完成后再启动
   - powerokwait：电源已经故障，但是又恢复来电时执行一次
   - powerfailnow：当电源故障并且init被通知UPS电源已经块耗尽时执行一次
   - ctrlaltdel：用户按下ctrl+alt+delete组合键时执行一次





参考文章:

[Ubuntu20.04编译安装qemu6.0](https://blog.csdn.net/qq_36393978/article/details/118086216)

[带你阅读linux内核源码：下载源码、编译内核并运行一个最小系统](https://www.bilibili.com/read/cv7118525)

[qemu运行虚拟机无反应，只输出一行提示信息:VNC server running on 127.0.0.1:5900](https://blog.csdn.net/qq_36393978/article/details/118353939)

[linux  /etc/fstab 功能说明](https://icodding.blogspot.com/2015/09/linux-etcfstab.html)

[Linux中的tty、pty、pts与ptmx辨析](https://blog.csdn.net/zhoucheng05_13/article/details/86510469)

