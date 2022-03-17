---
title: tslib库使用记录
tags:
---

## 简介

tslib库是一个用来作为触屏应用层和驱动的适配层，可以很方便的实现触屏校准和应用。

## 使用

1. 获取tslib库

2. 编译

```shell
git checkout 1.22
./autogen.sh
./configure --prefix=$PWD/install
make 
make install  
```

3. 编译(交叉编译)

```shell
git checkout 1.22
PATH=$PATH:/opt/toolchain-sunxi-musl/toolchain/bin
./autogen.sh
./configure --host=arm-openwrt-linux-muslgnueabi --prefix=$PWD/install
make 
make install 
```

4. 配置环境变量

tslib库需要根据环境变量来配置基本参数，其中下面选择了通过/dev/fb0文件操作显示屏,通过/dev/input/event1文件读取坐标，从$TSLIB_ROOT/etc/ts.conf读取控制参数,从$TSLIB_ROOT/lib/ts读取插件文件，从$TSLIB_ROOT/etc/pointercal文件读写触屏校准数据。

```shell
# 这里tslib安装的系统的目录为/lib/libts
export TSLIB_ROOT=/lib/libts
export TSLIB_FBDEVICE=/dev/fb0
export TSLIB_TSDEVICE=/dev/input/event1
export TSLIB_CONFFILE=$TSLIB_ROOT/etc/ts.conf
export TSLIB_PLUGINDIR=$TSLIB_ROOT/lib/ts
export TSLIB_CALIBFILE=$TSLIB_ROOT/etc/pointercal
export TSLIB_CONSOLEDEVICE=none
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$TSLIB_ROOT/lib
```

5. 配置ts.conf文件

tslib库会读取ts.conf文件来配置控制参数，以及选择需要加载的插件。配置文件的具体内容可以直接看ts.conf文件内容，有英文解释。

```shell
module_raw input
module debounce drop_threshold=100
module median depth=2
module dejitter delta=100
module linear
```

6. 运行程序

```shell
# 校准程序，运行./ts_calibrate程序来通过5点校准触屏，校准结果保存到$TSLIB_CALIBFILE的路径下
./ts_calibrate

# 测试程序，运行./ts_test程序来测试触点是否准确
./ts_test
```

## 83x移植tslib的代码记录

```shell
git switch v83x # 基于1.22

# 修改源码
# framebuffer需要主动刷新(共加了3个地方，open_framebuffer，close_framebuffer，put_cross)
ioctl(fb_fd, FBIOPAN_DISPLAY, &var);

# 83x的goodix无中断，手动在EV_SYN中将pressure=1
i->current_p = 0x255;
samp->pressure = i->current_p;

# 编译和安装
PATH=$PATH:/opt/toolchain-sunxi-musl/toolchain/bin
./autogen.sh
./configure --host=arm-openwrt-linux-muslgnueabi --prefix=$PWD/libts
make clean
make 
make install

# 上传库，注意adb不支持上传软链接
rm -rf libts/bin libts/share libts/lib/libts.so libts/lib/libts.so.0
mv libts/lib/libts.so.0.10.4 libts/lib/libts.so.0
adb shell "mount -o rw,remount /dev/root"
adb push libts /lib
adb shell "mount -o ro,remount /dev/root"

# 上传测试程序
adb push libts/bin/ /root

# 83x配置
export TSLIB_ROOT=/root/libts
export TSLIB_FBDEVICE=/dev/fb0
export TSLIB_TSDEVICE=/dev/input/event1
export TSLIB_CONFFILE=$TSLIB_ROOT/etc/ts.conf
export TSLIB_PLUGINDIR=$TSLIB_ROOT/lib/ts
export TSLIB_CALIBFILE=$TSLIB_ROOT/etc/pointercal
export TSLIB_CONSOLEDEVICE=none
export LD_LIBRARY_PATH=$TSLIB_ROOT/lib

# 加载触屏模块
insmod /lib/modules/4.9.118/goodix.ko

# conf配置
module_raw input
module pthres pmin=1
module debounce drop_threshold=100
module median depth=2
module dejitter delta=100
module linear

# 执行测试程序
mount -o rw,remount /dev/root
./ts_test
mount -o ro,remount /dev/root

### 修改源码时的测试记录，当时是tslib库上传在/root/install路径，所以要注意路径
# 修改并上传ts_test
make -j8 && adb push tests/.libs/ts_test /root/install/bin && adb shell "chmod +x /root/install/bin/*"
# 修改并上传ts_test和libts.so.0
make -j8 && adb push tests/.libs/ts_test /root/install/bin && rm src/.libs/libts.so.0 &&  cp src/.libs/libts.so.0.10.4 src/.libs/libts.so.0 && adb push src/.libs/libts.so.0 /root/install/lib &&adb shell "chmod +x /root/install/bin/*"
# 修改并上传ts_test和libts.so.0和Plugins库
make -j8 && adb push tests/.libs/ts_test /root/install/bin && rm src/.libs/libts.so.0 &&  cp src/.libs/libts.so.0.10.4 src/.libs/libts.so.0 && adb push src/.libs/libts.so.0 /root/install/lib && adb push plugins/.libs/*.so /root/install/lib/ts &&  adb shell "chmod +x /root/install/bin/*"
# 修改并上传ts_calibrate和libts.so.0和Plugins库
make -j8 && adb push tests/.libs/ts_calibrate /root/install/bin && rm src/.libs/libts.so.0 &&  cp src/.libs/libts.so.0.10.4 src/.libs/libts.so.0 && adb push src/.libs/libts.so.0 /root/install/lib && adb push plugins/.libs/*.so /root/install/lib/ts &&  adb shell "chmod +x /root/install/bin/*"

# 修改并上传ts_calibrate和libts.so.0和Plugins库
make -j8 && adb push tests/.libs/ts_calibrate /root/libts/bin && rm src/.libs/libts.so.0 &&  cp src/.libs/libts.so.0.10.4 src/.libs/libts.so.0 && adb push src/.libs/libts.so.0 /root/libts/lib && adb push plugins/.libs/*.so /root/libts/lib/ts &&  adb shell "chmod +x /root/libts/bin/*"

```