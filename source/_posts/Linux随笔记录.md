---
title: Linux随笔记录
date: 2021-10-28 19:59:14
tags: Linux
---

# Linux随笔记录

​	随笔记录

##### 使用apt卸载软件(参考[这里](https://blog.csdn.net/get_set/article/details/51276609))

1. apt的常规操作

   ```shell
   apt-get purge / apt-get --purge remove
   删除已安装包（不保留配置文件)。
   如软件包a，依赖软件包b，则执行该命令会删除a，而且不保留配置文件
   
   apt-get autoremove
   删除为了满足依赖而安装的，但现在不再需要的软件包（包括已安装包），保留配置文件。
   
   apt-get remove
   删除已安装的软件包（保留配置文件），不会删除依赖软件包，且保留配置文件。
   
   apt-get autoclean
   APT的底层包是dpkg, 而dpkg 安装Package时, 会将 *.deb 放在 /var/cache/apt/archives/中，apt-get autoclean 只会删除 /var/cache/apt/archives/ 已经过期的deb。
   
   apt-get clean
   使用 apt-get clean 会将 /var/cache/apt/archives/ 的 所有 deb 删掉，可以理解为 rm /var/cache/apt/archives/*.deb
   ```

2. 彻底卸载软件

   ```shell
   # 删除软件及其配置文件
   apt-get --purge remove <package>
   # 删除没用的依赖包
   apt-get autoremove <package>
   # 此时dpkg的列表中有“rc”状态的软件包，可以执行如下命令做最后清理：
   dpkg -l |grep ^rc|awk '{print $2}' |sudo xargs dpkg -P
   ```



#### cp命令

1. 复制时如果需要保留软链接，则添加-d



#### GCC链接时所有依赖库的顺序

参考[这里](https://blog.csdn.net/csq_year/article/details/80146760)

1. LDFLAGS选项 -L 参数指定的路径
2. 系统环境变量 LIBRARY_PATH（某些系统或编译器下可能无效）
3. gcc安装时自身配置的搜索路径，gcc --print-search-dir | grep libraries 可查看，链接时会以-L参数形式传递给ld
4. ld安装时自身配置的搜索路径，ld -verbose | grep SEARCH_DIR 可查看



#### 解决Ubuntu微信不能发送图片的问题
sudo apt install libjpeg62:i386


#### 修改子仓库的地址

```
1. 直接在.gitmodules修改子仓库路径
2. 执行git submodule sync同步修改
3. 执行git submodule foreach -q git config remote.origin.url查看子仓库实际路径
4. 更新子仓库git submodule update --remote
```

#### 通过ngrok远程连接Linux

1. [下载ngrok](https://ngrok.com/download)

   ```shell
   # 1. 通过上面链接到官网直接下载
   # 2. 通过apt下载
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc
   sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null 
   sudo tee /etc/apt/sources.list.d/ngrok.list
   sudo apt update && sudo apt install ngrok   
   # 3. 通过snap下载
   snap install ngrok
   ```

2. 获取token

   使用github账号登录ngrok可以自动获取token

   ```shell
   # 配置token
   ngrok authtoken <token>
   ```

3. 启动ngrok

   执行下面的命令启动，启动后可以看到连接信息

   ```shell
   # 1. http
   ngrok http 80
   # 2. scp(ssh连接用这个)
   ngrok scp 22
   ```

4. 安装ssh守护进程

   ```shell
   sudo apt install openssh-server
   ```

5. 连接Linux

   ```shell
   # 根据ngrok的信息连接，例如`tcp://6.tcp.ngrok.io:14554 -> localhost:22`,连接命令参考下面的写法：
   ssh liuxo@6.tcp.ngrok.io -p14554
   ```

#### 使用libjpeg将rgb图片保存为jpg格式到本地

```c
/* 图片应用 */
#include "libjpeg.h"
uint8_t *buffer = img_addr;
if (NULL != buffer)
{
    jpeg_img_t img = 
    {
        .h = img_h,
        .w = img_w,
        .bpp = 3,
        .data = buffer
    };
    uint64_t jpeg_size = img_w * img_h * 3;
    uint8_t *jpeg = (uint8_t *)malloc(jpeg_size);
    if (NULL != jpeg && 0 == libjpeg_compress(&img, 100, &jpeg, &jpeg_size))
    {
        printf("shotsnap size: %lld bytes\r\n", jpeg_size);
        int ret0 = utils_save_bin("qrcode.jpg", (int)jpeg_size, jpeg);
        if (ret0)
            printf("Error ret0:%d\n", ret0);
        usleep(50 * 1000);
        free(jpeg);
    }
}
```

#### qrcode库使用，通过本地jpg图片验证二维码功能

```c
    #include "libjpeg.h"
    #include "stdio.h"
    #include <sys/stat.h>
    #define JPG_FILE_NAME   "qrcode.jpg"
    jpeg_img_t img;
    uint8_t buffer[24471];
    int buffer_len = 0;

    // struct stat statbuf;
    // stat(JPG_FILE_NAME, &statbuf);
    // buffer_len = statbuf.st_size;
    buffer_len = 24471;
    printf("File size:%d\n", buffer_len);

	FILE* fp = fopen(JPG_FILE_NAME, "rb");
	if (fp == NULL)
	{
		fprintf(stderr, "fopen %s failed\n", JPG_FILE_NAME);
		return -1;
	}
    int len = fread(buffer, 1, (int)buffer_len, fp);
    if (len != buffer_len)
    {
        fclose(fp);
		fprintf(stderr, "fread bin failed %d\n", len);
		return -1;
    }
    fclose(fp);

    libjpeg_decompress(&img, buffer, buffer_len);

    uint8_t qr_res[128];
    int num = mf_qr_scan_pic(img.data, img.w, img.h, qr_res, 0);
    if (num)
        printf("QR SCAN RESULT: %s\n", qr_res);

    libjpeg_decompress_free(&img);

    return 0;
```

#### 系统通过pdflush进程定时将文件缓存写入磁盘

参考自这里[这里]
Linux系统写文件的操作是异步的，这是为了提高程序执行效率，以及提升磁盘寿命。一般情况Linux先将数据写道cache，然后由pdflush进程将需要写的数据（被标记的脏页）写到磁盘中。在以下几个情况，系统会唤醒pdflush回写脏页：
1. 定时方式
   内核定时唤醒pdflush线程来写脏页，并且不是写回所有脏页。而是被标记为脏的时间超过`/proc/sys/vm/dirty_expire_centisecs`(单位0.01s)的页。定时唤醒的时间由`/proc/sys/vm/dirty_writeback_centisecs`决定(单位0.01s)

2. 内存不足的时候
   当内存不足时，将会持续写入脏页，每次写入1024个页面，直到满足空闲页为止。

3. 在写操作时发现脏页超过一定比例。
   当脏页占用系统内存的比例超过`/proc/sys/vm/dirty_background_ratio`时，write系统调用会唤醒pdflush回写脏页，直到脏页比例低于限制的值。

4. 用户调用sync系统调用
   sync系统调用会唤醒pdflush进程并且回写脏页，直到全部脏页写完为止。

#### 一些shell脚本的例子

```shell
ROOTFS_BACK_DIR=/rootfs_back
ROOTFS_BACK_DEV=/dev/mmcblk0p5
ROOTFS_DATA_DIR=/rootfs_data
ROOTFS_DATA_DEV=/dev/mmcblk0p6

RESET_APP_NAME=reset
RESET_APP_DEFAULT_PATH=/home
RESET_APP_PATH=${ROOTFS_BACK_DIR}

# Mount app directory as a readonly system
if [ ! "`df | grep ${ROOTFS_BACK_DEV}`" ]; then
    # Check dir
    echo "check app dir"
    if [ ! -e ${ROOTFS_BACK_DIR} ]; then
        echo "create app dev"
        mkdir ${ROOTFS_BACK_DIR}
    fi
    
    # Mount
    echo "mount app dev"
    fsck.ext4 -y ${ROOTFS_BACK_DEV} &> /dev/null
    mount -t ext4 -o ro ${ROOTFS_BACK_DEV} ${ROOTFS_BACK_DIR} 2> /dev/null
    if [ "$?" -ne "0" ]; then
        echo "mkfs app dev"
        mkfs.ext4 -m 0 ${ROOTFS_BACK_DEV} &> /dev/null
        mount -t ext4 -o ro ${ROOTFS_BACK_DEV} ${ROOTFS_BACK_DIR} 2> /dev/null
    fi
fi

# Mount log directory as a readwrite system
if [ ! "`df | grep ${ROOTFS_DATA_DEV}`" ]; then
    # Check dir
    echo "check log dir"
    if [ ! -e ${ROOTFS_DATA_DIR} ]; then
        echo "create log dir"
        mkdir ${ROOTFS_DATA_DIR}
    fi
    
    # Mount
    echo "mount log dev"
    fsck.ext4 -y ${ROOTFS_DATA_DEV} &> /dev/null
    mount -t ext4 -o rw ${ROOTFS_DATA_DEV} ${ROOTFS_DATA_DIR} 2> /dev/null
    if [ "$?" -ne "0" ]; then
        echo "mkfs log dev"
        mkfs.ext4 -m 0 ${ROOTFS_DATA_DEV} &> /dev/null
        mount -t ext4 -o rw ${ROOTFS_DATA_DEV} ${ROOTFS_DATA_DIR} 2> /dev/null
    fi
fi

# Move ota app to app dir
if [ "`df | grep ${ROOTFS_BACK_DEV}`" ]; then
    if [ ! -e ${RESET_APP_PATH}/${RESET_APP_NAME} ]; then
	    if [ -e ${RESET_APP_DEFAULT_PATH}/${RESET_APP_NAME} ]; then
            mount -t ext4 -o rw,remount ${ROOTFS_BACK_DIR}
            cp -rf ${RESET_APP_DEFAULT_PATH}/${RESET_APP_NAME} ${ROOTFS_BACK_DIR}
            mount -t ext4 -o ro,remount ${ROOTFS_BACK_DIR}
            cd ${RESET_APP_PATH}/${RESET_APP_NAME} && ./start_app &> /dev/null &
        fi
    fi
fi
```

#### getenv函数

getenv函数可以获取Linux系统环境变量的值

```c
getenv("TSLIB_TSDEVICE");
```

#### tslib库的使用（TODO：移到其他文章）

参考[tslib 移植与使用](https://blog.csdn.net/weixin_42832472/article/details/111303980)

833交叉编译命令：   
```shell
./autogen.sh
PATH=$PATH:/opt/toolchain-sunxi-musl/toolchain/bin
./configure --host=arm-openwrt-linux-muslgnueabi --prefix=/
make
make install DESTDIR=$PWD/install

adb push lib /root		# 删除了软链接文件
adb push ts.conf /etc
# 设置ts.conf
module_raw input

export TSLIB_TSDEVICE=/dev/input/event1
export TSLIB_CALIBFILE=/etc/pointercal	# 可忽略
export TSLIB_CONFFILE=/etc/ts.conf
export TSLIB_PLUGINDIR=/root/lib/ts
export TSLIB_CONSOLEDEVICE=none
export TSLIB_FBDEVICE=/dev/fb0
```

833静态编译命令：

```shell
# 静态编译
./autogen.sh
PATH=$PATH:/opt/toolchain-sunxi-musl/toolchain/bin
./configure --host=arm-openwrt-linux-muslgnueabi --prefix=/ --enable-static --disable-shared --enable-input=static --enable-linear=static --enable-iir=static
make
make install DESTDIR=$PWD/install
```

报错的解决：

1. 错误`Couldn't load module input`

解决：没设置TSLIB_PLUGINDIR

#### git删除分支

```shell
# 删除远程分支
git push origin --delete [分支名]
# 删除本地分支
git branch -d [分支名]
```



#### 安装LiveSuit

使用[这个仓库](https://github.com/jake5253/allwinner-livesuit)安装

```shell
# 进入仓库，执行以下命令
chmod +x livesuit_installer.run 
sudo ./livesuit_installer.run
sudo apt install dkms
# 完成
```



#### 缺少库libpng12-0

[Ubuntu 20.04, 19.10 or 19.04出现libqtgui4 : Depends: libpng12-0 (>= 1.2.13-4) but it is not installed](https://blog.csdn.net/TaChean/article/details/104873253)

```shell
sudo add-apt-repository ppa:linuxuprising/libpng12
sudo apt update
sudo apt install libpng12-0
```

#### 开启ssh服务

```shell
# 安装
sudo apt install openssh-server
# 启动
sudo service ssh start
# 查看是否启动
sudo ps -e | grep ssh
```

#### 开启Samba服务

```shell
# 安装samba服务器
sudo apt-get install samba samba-common
# 创建目录并更改权限
sudo mkdir ~/sipeed2/share
sudo chown nobody:nogroup ~/sipeed2/share
sudo chmod 777  ~/sipeed2/share
# 添加一个用户
sudo smbpasswd -a lxo
# 在最后一行(shift+g)配置smb.conf文件
sudo vim /etc/samba/smb.conf
# 添加smb.conf内容：
[share]
        comment = sipeed share
        path = /home/share
        browseable = yes
        writable = yes
        available = yes
        valid users = lxo
        create mask = 0777
        directory mask = 0777
# 添加smb.conf内容，这里是为了让外部能访问软链接
[global]
        follow symlinks = yes
        wide link = yes
        unix extensions = no
        
# 重启samba服务
sudo service smbd restart

# 使用linux测试Samba服务
sudo apt install smbclient
smbclient //192.168.43.128 -U lxo@liuxo
```

#### 访问动态库函数

dlsym() 功能是根据动态链接库操作句柄与符号，返回符号对应的地址，不但可以获取函数地址，也可以获取变量地址。 返回符号对应的地址
函数原型：
`void* dlsym(void* handle,const char* symbol)`

GCC命令行参考

点击[这里](http://tigcc.ticalc.org/doc/comopts.html#SEC3)查看gcc命令行的详细信息
