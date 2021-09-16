---
title: openwrt使用记录
date: 2021-09-10 14:32:23
categories: "未分类"
tags:
---

# Openwrt使用记录

openwrt是针对于嵌入式设备的Linux操作系统，编译后会创建一个静态的固件。Openwrt提供了一个可写的包管理工具，在编译时可以通过供应商提供的应用程序选择和配置，通过使用包来定制设备以适应任何应用程序。对于开发人员而言，OpenWrt是通过包来构建应用程序的框架。
    
[Openwrt github地址](https://github.com/openwrt/openwrt.git)
[Quick Start Guide](https://openwrt.org/docs/guide-quick-start/start)
[User Guide](https://openwrt.org/docs/guide-user/start)
[Developer Documentation](https://openwrt.org/docs/guide-developer/start)
[Technical Reference](https://openwrt.org/docs/techref/start)

## 一、安装Openwrt

### 1.1 安装依赖

```
    sudo apt install g++ libncurses5-dev zlib1g-dev bison flex unzip autoconf gawk make gettext gcc binutils patch bzip2 libz-dev asciidoc subversion sphinxsearch libtool sphinx-common
```

### 1.2 下载源码

Openwrt源码有最新版和稳定版两种版本，下面是直接从git拉取的最新版

```
    git clone https://github.com/openwrt/openwrt.git
```

### 1.3 编译源码（根据源码中的README.md文件操作）

1. 检查依赖

Openwrt依赖以下工具,如果编译过程出错，可以检查当前环境是否满足以下的依赖

```
    binutils bzip2 diff find flex gawk gcc-6+ getopt grep install libc-dev libz-dev make4.1+ perl python3.6+ rsync subversion unzip which
```

2. 开始编译

```
./scripts/feeds update -a           # 更新最新的包
./scripts/feeds install -a          # 安装最新的包
make menuconfig
make                                # 如果执行make -j1 V=99可以看到编译过程的详细信息
```

> 编译过程中遇到提示相对路径"Files"存在于PATH环境变量中的问题，遇到后直接把PATH中带有"Files"的路径删除即可

## 二、添加包

[参考1](https://blog.csdn.net/xiaopang1122/article/details/50586097)

Openwrt通过添加软件包来扩展功能，软件包可以是网上的开源软件，也可以自行开发。主要步骤是在package目录下创建一个目录来保存软件包的各种信息和与Openwrt联系的文件，然后创建一个Makefile与Openwrt建立联系。
Makefile需要遵循Openwrt的约定：

1. 引入文件
```
include $(TOPDIR)/rules.mk                  # 一般在开头引入
include $(INCLUDE_DIR)/kernel.mk            # 软件包为内核包时必不可缺时引入

# 这里添加软件包的基本信息 #

include $(INCLUDE_DIR)/package.mk           # 添加软件包的基本信息后引入
```

> 注：1. `include xx.mk`语句表示将xx.mk的内容放在当前位置，类似于C语言的宏。2.\$(TOPDIR)表示最顶层目录,\$(INCLUDE_DIR)表示最顶层目录下的include目录,相关变量的位置可以通过关键字`MACRO_NAME:`来搜索，MACRO_NAME表示要搜索的变量。

2. 软件包基本信息

在引入package.mk文件前会添加软件包的基本信息，这些信息都以PKG_开头，作用如下：

- PKG_NAME 软件包的名字，会在menuconfig和ipkg上显示
- PKG_VERSION 软件包的版本
- PKG_RELEASE 当前makefile的版本
- PKG_BUILD_DIR 编译软件包的目录
- PKG_SOURCE 要下载的软件包的名字，一般是由 PKG_NAME 和 PKG_VERSION 组成
- PKG_SOURCE_URL 下载这个软件包的链接，@SF表示在sourceforge网站，@GNU表示在GNU网站
- PKG_MD5SUM 软件包的 MD5 值
- PKG_CAT 解压软件包的方法 (zcat, bzcat, unzip)
- PKG_BUILD_DEPENDS 需要预先构建的软件包，但只是在构建本软件包时，而不是运行的时候。它的语法和下面的DEPENDS一样

3. 软件包配置信息

软件包也分内核软件包和用户软件包，内核软件包用KernelPackage开头，用户软件包用Package开头
两个示例：
```makefile
# 用户软件包示例：
define Package/base-files
  SECTION:=base
  CATEGORY:=Base system
  DEPENDS:=+netifd +libc +jsonfilter +SIGNED_PACKAGES:usign +SIGNED_PACKAGES:openwrt-keyring +NAND_SUPPORT:ubi-utils +fstools +fwtool
  TITLE:=Base filesystem for OpenWrt
  URL:=http://openwrt.org/
  VERSION:=$(PKG_RELEASE)-$(REVISION)
endef
```

```makefile
# 内核软件包示例
define KernelPackage/acx-mac80211
  SUBMENU:=Wireless Drivers
  TITLE:=ACX1xx mac80211 driver
  DEPENDS:=@PCI_SUPPORT @mipsel +kmod-mac80211
  FILES:=$(PKG_BUILD_DIR)/acx-mac80211.ko
  AUTOLOAD:=$(call AutoProbe,acx-mac80211)
  MENU:=1
endef
```

上述示例中变量的含义(包括一些未使用的变量)：
- SECTION 软件包类型 (尚未使用)
- CATEGORY menuconfig中软件包所属的一级目录，如Network
- SUBMENU menuconfig中软件包所属的二级目录，如dial-in/up
- TITLE 软件包标题
- DESCRIPTION 软件包的详细说明
- URL 软件的原始位置，一般是软件作者的主页
- MAINTAINER (optional) 软件包维护人员
- DEPENDS (optional) 依赖项，运行本软件依赖的其他包，如果存在多个依赖，则每个依赖需用空格分开。依赖前使用+号表示默认显示，即对象沒有选中时也会显示，使用@则默认为不显示，即当依赖对象选中后才显示。

4. 软件包的执行动作

以下只是举部分例子，要总结全部还需要逐步完善。

软件包安装的配置文件，可以有多行文件，如果文件尾使用/则表示目录。示例：
```makefile
define Package/$(PKG_NAME)/conffiles
    # ...
endef
```

软件包的详细描述，会取代前面配置信息里的DESCRIPTION，示例：
```makefile
define Package/$(PKG_NAME)/description
    # ...
endef
```

编译前的准备。自行开发的软件包必须说明编译准备方法，示例：
```makefile
define Build/Prepare
        mkdir -p $(PKG_BUILD_DIR)
        $(CP) ./src/* $(PKG_BUILD_DIR)/
endef
```

对于需要进行./configure配置的包时添加，示例：
```makefile
define Build/Compile
        $(MAKE) -C $(PKG_BUILD_DIR) \
        $(TARGET_CONFIGURE_OPTS) CFLAGS="$(TARGET_CFLAGS) -I$(LINUX_DIR)/include"
endef
```

软件包的安装，其中$1一般表示嵌入式系统的镜像文件系统目录，示例：
```makefile
define Package/$(PKG_NAME)/install
        $(INSTALL_DIR) $(1)/usr/bin
        $(INSTALL_BIN) $(PKG_BUILD_DIR)/ $(PKG_NAME) $(1)/usr/bin/
endef

# 如果用户态软件在boot时要自动运行，则需要在安装方法中增加自动运行的脚本文件和配置文件的安装方法
define Package/mountd/install
        $(INSTALL_DIR) $(1)/sbin/ $(1)/etc/config/ $(1)/etc/init.d/
        $(INSTALL_BIN) $(PKG_BUILD_DIR)/mountd $(1)/sbin/

        $(INSTALL_DATA) ./files/mountd.config $(1)/etc/config/mountd
        $(INSTALL_BIN) ./files/mountd.init $(1)/etc/init.d/mountd
endef
```

