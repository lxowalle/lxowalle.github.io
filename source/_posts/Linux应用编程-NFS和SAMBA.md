---
title: Linux应用编程-NFS和SAMBA
tags:
---

## 部署NFS

### 部署NFS服务器

1. 安装NFS服务端

```shell
sudo apt install nfs-kernel-server
```

2. 查看用户id

```shell
id
```

3. 修改/etc/exports文件的内容

```shell
sudo vim /etc/exports

# 内容如下：
/home/share 192.168.100.0/24(rw,sync,all_squash,anonuid=1000,anongid=1000,no_subtree_check)

## 解释：
# /home/share	本地需要共享的目录
# 192.168.100.0/24	表示局域网内的所有主机都可以访问该目录
# rw	访问权限
# sync	数据是否同步到内存和硬盘
# anonuid=1000	从机访问时借用的用户ID
# anongid=1000	从机访问时借用的用户组ID
# no_subtree_check	不检查子目录权限
```

4. 创建共享目录

```shell
mkdir /home/share	# 填写在/etc/exports文件配置的共享目录路径
```

5. 更新exports配置

```shell
sudo exportfs -arv

## 解释：
-a	全部挂载或全部卸载/etc/exports中的共享目录
-r	重新挂载/etc/exports中的共享目录
-u	卸载共享目录
-v	输出运行过程的信息
```

6. 查看NFS共享的情况

```shell
showmount -e
```

### 部署NFS客户端

1. 安装NFS客户端

```shell
sudo apt install nfs-common -y 
```

2. 查看NFS服务器的共享信息

```shell
showmount -e 192.168.100.231
```

3. 挂载NFS文件系统到开发板下

```shell
sudo mount -t nfs 192.168.100.231:/home/share /mnt/nfs

## 解释：
-t nfs	指定挂载的文件系统格式
192.168.100.231	NFS服务器的IP地址
/home/share	NFS服务器的NFS共享目录
/mnt	本地挂载目录。
```

### 测试NFS服务器与NFS客户端是否正常共享

1. 在NFS服务器的共享目录下保存文件和内容

```shell
# NFS服务器
echo Hello Slave > /home/share/test
```

2. 在NFS客户端尝试显示文件

```shell
# NFS客户端
cat /mnt/nfs/test
```

客户端取消NFS挂载

```shell
sudo umount /mnt/nfs	# /mnt/nfs是需要取消的挂载目录
```


## 部署Samba

### 部署Samba服务器

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
        wide links = yes
        unix extensions = no
        
# 重启samba服务
sudo service smbd restart
```

### 测试Samba服务

```c
# 使用linux测试Samba服务
sudo apt install smbclient
smbclient //192.168.43.128 -U lxo@liuxo
```

