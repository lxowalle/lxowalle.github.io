---
title: Linux随笔记录
date: 2021-10-28 19:59:14
tags:
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

1. 复制时如果需要保留软链接，则添加-d选项

   
