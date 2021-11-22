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

   
