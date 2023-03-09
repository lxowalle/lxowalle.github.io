---
title: 在linux上搭建lwip测试环境
tags:
---

# 在linux上搭建lwip测试环境



## 一、搭建lwip开发环境

1. 下载lwip仓库

```shell
# 个人仓库
git clone git@github.com:lxowalle/lwip.git

# 官网仓库
git clone https://github.com/lwip-tcpip/lwip.git
```

2. 编译和运行

```shell
# 复制一份默认的配置文件(默认配置文件保存路径lwip/contrib/examples/example_app/lwipcfg.h.example)
cp lwip/contrib/examples/example_app/lwipcfg.h.example lwip/contrib/ports/unix/example_app/lwipcfg.h

# 修改lwip默认ip为tap0的地址（如果没有tap0设备见下文创建）,应用程序的main函数位于lwip/contrib/ports/unix/example_app/test.c
# 1. 打开初始化函数
code lwip/contrib/ports/unix/example_app/test.c
# 2. 设置固件的ip地址。这里的环境是(tap0 ip: 192.168.5.1 gw:255.255.255.0)
IP4_ADDR(&ipaddr, 192, 168, 5, 5);
IP4_ADDR(&netmask, 255, 255, 255, 0);
IP4_ADDR(&gw, 192, 168, 5, 1);

# 编译运行
cd lwip/contrib/ports/unix/example_app
make && ./example_app
```

注：
1. 对于没有tap设备的解决方法

方法1：
尝试执行lwip自带的更新tapif脚本
```shell
# 执行lwip自带脚本来配置tapif
./contrib/ports/unix/setup-tapif
```

```shell
# setup-tapif脚本内容
export PRECONFIGURED_TAPIF=tap0
sudo ip tuntap add dev $PRECONFIGURED_TAPIF mode tap user `whoami`
sudo ip link set $PRECONFIGURED_TAPIF up
sudo brctl addbr lwipbridge
sudo brctl addif lwipbridge $PRECONFIGURED_TAPIF
sudo ip addr add 192.168.1.1/24 dev lwipbridge
sudo ip link set dev lwipbridge up
```

方法2：

手动创建tap0

```shell
# 1. 安装uml工具
sudo apt install uml-utilities

# 2. 创建一个tap设备给指定用户使用
sudo tunctl -u sipeed       # sipeed是用户名

# 3. 分配IP地址并启动tap0
sudo ifconfig tap0 192.168.100.1 up

# 4. 将使用eth0的设备设置为需要通过tap0
sudo route add -host 192.168.0.1 dev tap0     # 10.42.0.1 是本地wifi的地址

# 5. （可选）删除tap0设备
sudo tunctl -d tap0
```

2. 找不到doxygen

```shell
-- Could NOT find Doxygen (missing: DOXYGEN_EXECUTABLE) 
Doxygen needs to be installed to generate the doxygen documentation
-- Configuring done
CMake Error at CMakeLists.txt:20 (add_dependencies):
  The dependency target "lwipdocs" of target "dist" does not exist.
```

尝试安装doxygen. `sudo apt install doxygen`



## 二、搭建本地MQTT服务端和客户端

- 安装mosquitto

```shell
# 安装mosquitto服务和客户端
sudo apt-get install mosquitto
sudo apt-get install mosquitto-clients

# 查询/启动/停止mosquitto服务
sudo service mosquitto status       # 查看mosquitto服务状态
sudo service mosquitto start        # 启动服务
sudo service mosquitto stop         # 关闭服务

# mosquitto服务的默认配置文件在/etc/mosquitto/mosquitto.conf
# 停止mosquitto服务后，手动启动来使用自定义的配置文件
mosquitto -c my.conf
```
- 本地环境测试

```shell
# 关闭mosquitto服务
sudo service mosquitto stop
# 新开一个终端，手动启动mqtt服务
mosquitto -c /etc/mosquitto/mosquitto.conf -v
# 新开一个终端，模拟订阅主题topic1
mosquitto_sub -v -t topic1
# 新开一个终端，模拟向主题topic1发布消息
mosquitto_pub -v -t topic1 -m 123456
mosquitto_pub -v -t topic1 -m "hello world"
```

- 作为参考的mosquitto配置文件

```shell
# =================================================================
# General configuration
# =================================================================
# 客户端心跳的间隔时间
#retry_interval 20

# 系统状态的刷新时间
#sys_interval 10

# 系统资源的回收时间，0表示尽快处理
#store_clean_interval 10

# 服务进程的PID
#pid_file /var/run/mosquitto.pid

# 服务进程的系统用户
#user mosquitto

# 客户端心跳消息的最大并发数
#max_inflight_messages 10

# 客户端心跳消息缓存队列
#max_queued_messages 100

# 用于设置客户端长连接的过期时间，默认永不过期
#persistent_client_expiration

# =================================================================
# Default listener
# =================================================================

# 监听1883端口的任何IP
listener 1883

# 服务绑定的IP地址
#bind_address

# 服务绑定的端口号
#port 1883

# 允许的最大连接数，-1表示没有限制
#max_connections -1

# cafile：CA证书文件
# capath：CA证书目录
# certfile：PEM证书文件
# keyfile：PEM密钥文件
#cafile
#capath
#certfile
#keyfile

# 必须提供证书以保证数据安全性
#require_certificate false

# 若require_certificate值为true，use_identity_as_username也必须为true
#use_identity_as_username false

# 启用PSK（Pre-shared-key）支持
#psk_hint

# SSL/TSL加密算法，可以使用“openssl ciphers”命令获取
# as the output of that command.
#ciphers

# =================================================================
# Persistence
# =================================================================

# 消息自动保存的间隔时间
#autosave_interval 1800

# 消息自动保存功能的开关
#autosave_on_changes false

# 持久化功能的开关
persistence true

# 持久化DB文件
#persistence_file mosquitto.db

# 持久化DB文件目录
#persistence_location /var/lib/mosquitto/

# =================================================================
# Logging
# =================================================================

# 4种日志模式：stdout、stderr、syslog、topic
# none 则表示不记日志，此配置可以提升些许性能
log_dest none

# 选择日志的级别（可设置多项）
#log_type error
#log_type warning
#log_type notice
#log_type information

# 是否记录客户端连接信息
#connection_messages true

# 是否记录日志时间
#log_timestamp true

# =================================================================
# Security
# =================================================================

# 客户端ID的前缀限制，可用于保证安全性
#clientid_prefixes

# 允许匿名用户
allow_anonymous true

# 用户/密码文件，默认格式：username:password
#password_file

# PSK格式密码文件，默认格式：identity:key
#psk_file

# pattern write sensor/%u/data
# ACL权限配置，常用语法如下：
# 用户限制：user <username>
# 话题限制：topic [read|write] <topic>
# 正则限制：pattern write sensor/%u/data
#acl_file

# =================================================================
# Bridges
# =================================================================

# 允许服务之间使用“桥接”模式（可用于分布式部署）
#connection <name>
#address <host>[:<port>]
#topic <topic> [[[out | in | both] qos-level] local-prefix remote-prefix]

# 设置桥接的客户端ID
#clientid

# 桥接断开时，是否清除远程服务器中的消息
#cleansession false

# 是否发布桥接的状态信息
#notifications true

# 设置桥接模式下，消息将会发布到的话题地址
# $SYS/broker/connection/<clientid>/state
#notification_topic

# 设置桥接的keepalive数值
#keepalive_interval 60

# 桥接模式，目前有三种：automatic、lazy、once
#start_type automatic

# 桥接模式automatic的超时时间
#restart_timeout 30

# 桥接模式lazy的超时时间
#idle_timeout 60

# 桥接客户端的用户名
#username

# 桥接客户端的密码
#password

# bridge_cafile：桥接客户端的CA证书文件
# bridge_capath：桥接客户端的CA证书目录
# bridge_certfile：桥接客户端的PEM证书文件
# bridge_keyfile：桥接客户端的PEM密钥文件
#bridge_cafile
#bridge_capath
#bridge_certfile
#bridge_keyfile
```

## 三、配置lwip的mqtt测试环境

1. 下载和编译lwip

    见搭建lwip开发环境

2. 下载、安装和配置mosquitto

    见搭建本地MQTT服务端和客户端

    配置mosquitto

    ```shell
    # 修改配置文件/etc/mosquitto/mosquitto.conf，添加以下内容，否则mosquitto可能只支持通过地址127.0.0.1访问
    listener 1883
    allow_anonymous true
    ```

3. 配置lwip

    - 配置固定IP地址

        ```c
        // 1. 在mqtt_example.c文件添加MQTT的目标服务器地址
        static ip_addr_t mqtt_ip = IPADDR4_INIT_BYTES(10, 42, 0, 1);	// 这里10.42.0.1是本机地址，如果eth0地址为192.168.1.23，也可以填写192.168.1.23
        // 2. 在test.c文件添加本地地址
        #define LWIP_PORT_INIT_IPADDR(addr)   IP4_ADDR((addr), 10,42,0,204)
        #define LWIP_PORT_INIT_GW(addr)       IP4_ADDR((addr), 10,42,0,1)
        #define LWIP_PORT_INIT_NETMASK(addr)  IP4_ADDR((addr), 255,255,255,0)
        LWIP_PORT_INIT_GW(&gw);
        LWIP_PORT_INIT_IPADDR(&ipaddr);		# 注：该地址会被DHCP改变
        LWIP_PORT_INIT_NETMASK(&netmask);
        ```

    - 在配置文件lwipcfg.h中添加和使能宏LWIP_MQTT_APP

        ```shell
        #define LWIP_MQTT_APP 1
        ```

4. 创建虚拟网卡

    ```shell
    # 1. 找到本地路由的地址。以下命令基于路由地址10.42.0.1
    # 2. 创建一个tap设备给指定用户使用
    sudo tunctl -u sipeed       # sipeed是用户名
    # 3. 分配IP地址并启动tap0
    sudo ifconfig tap0 10.42.0.1 up
    ```

5. 编译运行

    ```shell
    cd lwip/contrib/ports/unix/example_app
    make && ./example_app
    
    # lwip打印的日志应当如下：
    status_callback==UP, local interface IP is 10.42.0.204
    MQTT client "test" connection cb: status 0
    MQTT client "test" request cb: err 0
    MQTT client "test" request cb: err 0
    status_callback==UP, local interface IP is 10.42.0.204
    ```

6. 通过mosquitto_pub发布消息

    ```shell
    # lwip的mqtt示例程序默认订阅了两个主题topic_qos1和topic_qos0,可以按需选择主题测试
    mosquitto_pub -t topic_qos1 -m 12
    
    # lwip打印的日志应当如下：
    MQTT client "test" publish cb: topic topic_qos1, len 3
    MQTT client "test" data cb: len 3, flags 1MQTT client "test" publish cb: topic topic_qos1, len 3
    MQTT client "test" data cb: len 3, flags 1
    ```

    





