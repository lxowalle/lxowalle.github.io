---
title: pjsip lib使用记录
date: 2021-10-13 14:31:44
tags:
---

# pjsip库使用记录



## 一、简单介绍

​		pjsip库是一个用C写的多媒体通信库，核心功能就是实现语音和视频通话，围绕这两个功能添加了很多协议支持。SIP信令协议实现会话的创建、修改和终止，SDP协议用来双方描述自身会话信息。RTP协议实现单播和多播网络中实时传输提供时间信息和流同步。STUN用于协助NAT穿越等等。

### 1.1 SIP信令协议

参考自：[RFC3261](https://www.rfc-editor.org/rfc/inline-errata/rfc3261.html)

下面描述中atlanta.com和biloxi.com是用于SIP电话(可以称为softpthoe或软电话)通信的服务器。Alice和Bob是两个SIP电话。下面的示例是Alice向Bob播出电话的示例:

```
                     atlanta.com  . . . biloxi.com
                 .      proxy              proxy     .
               .                                       .
       Alice's  . . . . . . . . . . . . . . . . . . . .  Bob's
      softphone                                        SIP Phone
         |                |                |                |
         |    INVITE F1   |                |                |
         |--------------->|    INVITE F2   |                |
         |  100 Trying F3 |--------------->|    INVITE F4   |
         |<---------------|  100 Trying F5 |--------------->|
         |                |<-------------- | 180 Ringing F6 |
         |                | 180 Ringing F7 |<---------------|
         | 180 Ringing F8 |<---------------|     200 OK F9  |
         |<---------------|    200 OK F10  |<---------------|
         |    200 OK F11  |<---------------|                |
         |<---------------|                |                |
         |                       ACK F12                    |
         |------------------------------------------------->|
         |                   Media Session                  |
         |<================================================>|
         |                       BYE F13                    |
         |<-------------------------------------------------|
         |                     200 OK F14                   |
         |------------------------------------------------->|
         |                                                  |
```

上面的示例中：

1. 在通话，Alice会提前注册到atlanta.com服务器，Bob会提前注册到biloxi.com服务器。
2. 现在开始通话，首先是Alice向Bob发起通话，但是由于不知道biloxi.com服务器和Bob的位置，所以将邀请发送给代理服务器atlanta.com，atlanta.com服务器会转发INVITE请求并返回一个100(trying)来响应Alice，Alice会将响应的文本与INVITE文本关联。注意：Alice发起INVITE时会附带SDP信息
3. atlanta.com代理服务器会通过特定类型的DNS来找到为biloxi.com提供服务的SIP服务器，并获取到biloxi.com的IP地址，然后在Alice的INVITE请求文本前添加保存了自己IP地址的Via头字段并向biloxi.com服务器转发请求。biloxi.com服务器接收到INVATE请求后会返回一个100 (Trying)来响应atlanta.com服务器，随后通过查询数据库（定位服务）找到Bob的地址，biloxi.com服务器将带有自己地址的Via头字段添加到INVITE并代理到Bob的电话。
4. Bob接受到INVITE后会提醒Bob有来自Alice的电话，并返回180 (Ring)来表示正在响铃。返回的180 (Ringing)会根据之前添加的Via字段依次返回到biloxi.com服务器，atlanta.com服务器和Alice（每次返回都会先删除自己添加的Via头字段），Alice此时也能收到回铃音的反馈。
5. 如果Bob接受了电话，则会返回200 (OK)并附带SDP消息来描述会话信息。

发起邀请的文本：

```
INVITE sip:bob@biloxi.com SIP/2.0
Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bK776asdhds
Max-Forwards: 70
To: Bob <sip:bob@biloxi.com>
From: Alice <sip:alice@atlanta.com>;tag=1928301774
Call-ID: a84b4c76e66710@pc33.atlanta.com
CSeq: 314159 INVITE
Contact: <sip:alice@pc33.atlanta.com>
Content-Type: application/sdp
Content-Length: 142
```

接受邀请的文本：

```
SIP/2.0 200 OK
Via: SIP/2.0/UDP server10.biloxi.com				# biloxi.com
;branch=z9hG4bKnashds8;received=192.0.2.3
Via: SIP/2.0/UDP bigbox3.site3.atlanta.com			# atlanta.com添加
;branch=z9hG4bK77ef4c2312983.1;received=192.0.2.2	
Via: SIP/2.0/UDP pc33.atlanta.com					# Alice添加
;branch=z9hG4bK776asdhds ;received=192.0.2.1
To: Bob <sip:bob@biloxi.com>;tag=a6c85cf
From: Alice <sip:alice@atlanta.com>;tag=1928301774
Call-ID: a84b4c76e66710@pc33.atlanta.com
CSeq: 314159 INVITE
Contact: <sip:bob@192.0.2.4>
Content-Type: application/sdp
Content-Length: 131
```

### 1.2 SDP协议

参考自：[RFC8866](https://www.rfc-editor.org/rfc/rfc8866.html)

#### 1.2.1 描述

​	SDP与SIP一起使用时，SDP被用来格式化SIP创建会话的消息中携带会话描述。这些SDP描述包括以下内容：

- 会话名称和目的
- 会话处于活动状态的时间
- 包含会话的媒体
- 接受这些媒体所需的信息
  - 媒体类型（video,audio）
  - 媒体传输协议（RTP/UDP/IP,H.320）
  - 媒体格式（H.261 video,MPEG video）
  - 媒体多组播地址
  - 媒体传输端口
  - 媒体远程地址（单播IP会话）
  - 媒体的远程传输端口（单播IP会话）
- 会话使用的带宽信息
- 会议负责人的联系方式

​	SDP必须传达足够的信息以使应用程序能够加入会话，并向可能需要知道的任何非参与者宣布要使用的资源

#### 1.2.2 规范

##### 基本格式

SDP协议由多行文本信息组成，基本格式如下：

```
<type>=<value>
```

说明：

>type:是一个区分大小写的字符。
>
>=：等号两侧不使用空格分割符。如果有空格，那么这个空格代表value的一部分
>
>value:是一个取决于type的结构化文本，由单个空格字符或自由格式字符串分隔的多个子字段，除非特定字段另有定义，否则区分大小写

##### SDP描述说明

​	SDP描述中某些行必须存在，某些行可选。下面的格式中带*号表示可选行。

```
   会话描述
      v=（会话描述协议的版本）
      o=（发起者和会话标识符）
      s=（会话名称）
      i=*（会话信息）
      u=*（描述的URI）
      e=*（电子邮件地址）
      p=*（电话号码）
      c=*（连接信息——如果包含在所有媒体描述）
      b=*（零个或多个带宽信息行）
      一个或多个时间描述：
        （“t=”、“r=”和“z=”行；见下文）
      k=*（已过时）
      a=*（零个或多个会话属性行）
      零个或多个媒体描述

   时间说明
      t=（会话处于活动状态的时间）
      r=*（零次或多次重复）
      z=*（可选时区偏移线）

   媒体描述（如果有）
      m=（媒体名称和传输地址）
      i=*（媒体标题）
      c=*（连接信息——可选，如果包含在
           会话级别）
      b=*（零个或多个带宽信息行）
      k=*（已过时）
      a=*（零个或多个媒体属性行）
```

##### SDP描述的实例

```sdp
v=0
o=jdoe 3724394400 3724394405 IN IP4 198.51.100.1
s=Call to John Smith
i=SDP Offer #1
u=http://www.jdoe.example.com/home.html
e=Jane Doe <jane@jdoe.example.com>
p=+1 617 555-6011
c=IN IP4 198.51.100.1
t=0 0
m=audio 49170 RTP/AVP 0
m=audio 49180 RTP/AVP 0
m=video 51372 RTP/AVP 99
c=IN IP6 2001:db8::2
a=rtpmap:99 h263-1998/90000
```

对上面实例的注释：

```shell
# 会话描述协议的版本，没有次版本号
v=0
# o=<username> <sess-id> <sess-version> <nettype> <addrtype> <unicast-address>
# 会话发起者jdoe,会话id：3724394400，会话版本：3724394405，网络类型：IN(IN表示Internet)，地址类型：IP4,单播地址：198.51.100.1
o=jdoe 3724394400 3724394405 IN IP4 198.51.100.1
# s=<会话名称>
s=Call to John Smith
# i=<会话信息>
i=SDP Offer #1
# u=<uri>
# 指向与会话有关的可读信息的指针
u=http://www.jdoe.example.com/home.html
# e=<电子邮件地址> 
e=Jane Doe <jane@jdoe.example.com>
# p=<电话号码>
p=+1 617 555-6011
# c=<nettype> <addrtype> <connection-address>
# 连接信息
c=IN IP4 198.51.100.1
# t=<开始时间> <停止时间>
# 开始时间为0表示立即开始，停止时间为0表示会话永不停止
t=0 0
# m=<media> <port> <proto> <fmt> ...
# 媒体为audio，端口49170，协议为RTP/AVP，格式0
m=audio 49170 RTP/AVP 0
m=audio 49180 RTP/AVP 0
# 媒体为vedio，端口51372，协议为RTP/AVP，格式99
m=video 51372 RTP/AVP 99
# 这里c=表示地址映射
c=IN IP6 2001:db8::2
# a=表示某个属性，这里属性是rtpmap
a=rtpmap:99 h263-1998/90000
```

> RTP,STUN,TURN,ICE协议暂时用不到，先不关注。

## 二、pjsip库

[pjsip官网](https://www.pjsip.org/)

pjsip库的主要有7个文件目录，在每个目录都对应一类功能，并且可以编译为单独的库，每个目录内都有对应的测试程序。

```shell
+---pjlib			# 基础库，所有库的基础库
+---pjlib-util		# 辅助库，包含XML、STUN、MD5算法等
+---pjmedia			# 媒体库，包含各种媒体的编解码器
+---pjnath			# 网络相关库，包含STUN、TURN、ICE的实现
+---pjsip			# SIP协议栈
+---pjsip-apps		# 示例程序的实现，可以在这里参考一些API的使用
+---third_party		# 第三方库的源码，Speex、iLBC 和 GSM 编解码器
```

### 2.1 编译

​	pjsip库最新版是2.11.1版，在github上[获取源码](https://github.com/pjsip/pjproject)。基本编译方法：

```shell
# 安装依赖
sudo apt-get install build-essential git-core checkinstall yasm texi2html libvorbis-dev libx11-dev libvpx-dev libxfixes-dev zlib1g-dev pkg-config netcat libncurses5-dev nasm libx264-dev libv4l-dev libasound2-dev libsdl2-dev libxext-dev ffmpeg libavutil-dev

# 拉取代码
git clone https://github.com/pjsip/pjproject.git

# 更改配置文件`pjproject/pjlib/include/pj/config_site.h`的内容(没有该文件就新建一个)
#include <pj/config_site_sample.h>
#define PJMEDIA_AUDIO_DEV_HAS_ALSA	1

#define PJMEDIA_HAS_VIDEO		1
#define PJMEDIA_HAS_FFMPEG		1
#define PJMEDIA_HAS_FFMPEG_CODEC_H264   1
#define PJMEDIA_VIDEO_DEV_HAS_SDL	1
#define PJMEDIA_VIDEO_DEV_HAS_V4L2	1

# 编译代码
cd pjproject
git checkout 2.11.1
make distclean
./configure --prefix=$PWD/install --disable-libwebrtc --disable-libyuv --enable-shared --disable-static
make dep
make -j8
make install

# 编译代码（交叉编译）
cd pjproject
git checkout 2.11.1
make distclean
PATH=$PATH:/opt/toolchain-sunxi-musl/toolchain/bin	# 添加工具链到PATH
./configure --host=arm-openwrt-linux-muslgnueabi --prefix=$PWD/install --disable-libwebrtc --disable-libyuv --enable-shared --disable-static	# 交叉编译
make dep
make -j8
make install
```

tips:

出现错误1：找不到-lasound

>错误：arm-openwrt-linux-muslgnueabi/bin/ld: cannot find -lasound
>解决1：将libasound.so复制到pjproject/pjlib/lib目录下

出现错误2：函数未定义

>output/pjlib-test-arm-openwrt-linux-gnu-muslgnueabi/main.o: In function > > `print_stack':
>
>main.c:(.text+0x14): undefined reference to `backtrace'
>
>main.c:(.text+0x44): undefined reference to `backtrace_symbols_fd'
>解决2：注销掉backtrace和backtrace_symbols_fd的相关调用

出现错误3：交叉编译时出现编译平台错误

>解决3：在pjproject/pjlib/include/pj/config.h下定义宏PJ_AUTOCONF

### 2.2 pjsip库相关说明文档获取方法

官网有很详细的资料，基本上所有说明都从官网获取

**PJSIP函数、结构体、变量查询：**

例如需要查询`pjsua_perror()`函数的用法：

- 打开[官网](https://www.pjsip.org/)
- 找到网页最上方的搜索栏，填入`pjsua_perror`并点击Search，确认提交表单
- 查看弹出的网页可以找到关于`pjsua_perror`的说明

ps：

>1. 可能需要科学上网
>
>2. 函数、结构体、变量的说明都可以通过上述方式查到

**PJSIP API使用方式参考**

可以通过运行和看test源码来快速应用。pjproject/pjsip-apps目录下有很多pjsip库的应用测试程序，如果用C编程可以参考pjproject/pjsip-apps/pjsua目录下的程序，该程序对应的可执行文件位于pjproject/pjsip-apps/bin目录下的pjsua可执行文件。

通过应用pjsua程序测试，并观察源码的调用来快速掌握API的使用方法。

**PJSIP Video使用方法参考(未成功)**

pjsip库的Video支持有专门的文档介绍，可以参考[这里](https://trac.pjsip.org/repos/wiki/Video_Users_Guide)

### 2.3 运行测试

编译完成后通过pjproject/pjsip-apps/bin/pjsua程序进行测试。pjsua是基于pjsip库编译得到的一个命令行sip用户代理。

#### 2.2.1 准备SIP服务器

miniSIPServer作为SIP服务器，[PortSIP](http://www.portsip.cn/download-portsip-softphone/)软件作为手机端SIP客户端，Deepin编译出pjsua程序作为电脑端SIP客户端

#### 2.2.2 pjsua测试

**语音通话测试：**

1. miniSIPServer设置ip地址(192.168.0.15)，从机地址(100,101)

2. 手机端打开PortSIP软件，输入用户名101，密码101，SIP Domain:192.168.0.15向SIP服务器注册

3. pjsua端执行命令`pjsua --config-file pjsua-cfg pjsua.cfg`向SIP服务器注册

   ```shell
   # pjsua.cfg是用户创建的配置信息，内容如下
   --id sip:100@192.168.0.15
   --registrar sip:192.168.0.15
   --realm *
   --username 100
   --password 100
   
   --color
   ```

4. 手机端拨号100，播出后应当能在pjsua端听到呼叫提示音

5. pjusa输入a并回车，再次输入200并回车，此时通话建立

6. 正常通话

**视频通话测试（未成功）：**

注意：

> 使用cheese工具可以验证摄像头是否可用
>
> 启动视频通话需要有以下支持
>
> - 格式转换和视频需要：SDL(Version 2.0)
> - H263编解码需要：libyuv 或 ffmpeg
> - H264编解码需要：OpenH264或libx264或ffmpeg
> - VP8或VP9编解码需要：libvpx
> - Linux环境还需要支持：Video4Linux2(v4l2)

1. 执行命令`pjsua --config-file pjsua.cfg`注册本机（参考步骤1）

2. 在弹出的命令行输入：

   ```
   vid enable           # 打开设备
   vid acc autotx on    # 自动发送视频流
   vid acc autorx on    # 自动接收视频流
   ```

3. 拨号或接通电话

4. 拨通后可以视频和语音

5. (可选)在命令行输入：`vid dev prev on -1` 可以打开采集的设备的预览窗口

[视频通话说明文档](https://trac.pjsip.org/repos/wiki/Video_Users_Guide)

## 附录

### 1. pjsua命令使用基本用法

基本用法：

```
pjsua [选项] [sip的url调用]
```

一般选项：

```
     --config-file=file     读取从文件的配置/参数；
     --help         显示此帮助屏幕；
     --version         显示版本信息，配置信息；
```

日志记录选项：

```
    --log-file=fname    日志文件名（默认是stderr）；
    --log-level=N       设置日志的最大级别为N（0（无）6（跟踪））（默认值= 5）；
    --app-log-level=N   设置日志的最大水平为stdout显示（默认值= 4）；
    --color             运用丰富多彩的日志（在Win32默认开启）；
    --no-color          禁用丰富多彩的日志；
    --light-bg          使用白底黑字的颜色（默认是黑暗的背景）；
```

SIP帐户选项：

```
    --use-ims           开启和这个账号相关的3GPP/IMS设置；
    --use-srtp=N        是否使用SRTP?  0:不使用, 1:可选, 2:强制使用 (默认:0)；
    --srtp-secure=N     SRTP 是否需要安全的SIP? 0:不需要, 1:tls方式, 2:sips (默认:1)；
    --registrar=url     设置注册服务器的URL；
    --id=url            设置本地账户的URL
    --contact=url       选择性的覆盖联系人信息
    --contact-params=S  给指定的联系URI添加S参数
    --proxy=url         可选择的访问代理服务器的URL                     
    --reg-timeout=SEC   注册时间间隔 (default 55)
    --realm=string      设置域
    --username=string   设置用户名
    --password=string   设置密码
    --publish           发PUBLISH
    --use-100rel        需要可靠的临时响应(100rel)
    --auto-update-nat=N n为0或1来启用/禁用SIP遍历后面对称NAT(默认1)
    --next-cred         添加其他凭据
```

SIP帐户控制：

```
	--next-account      添加更多的账户
```

传输选项：

```
    --ipv6              使用IPv6
    --local-port=port   端口
    --ip-addr=IP        ip地址
    --bound-addr=IP     绑定端口
    --no-tcp            禁用TCP传输
    --no-udp            禁用UDP传输
    --nameserver=NS     域名服务器
    --outbound=url      设置全局代理服务器的URL，可以指定多次
    --stun-srv=name     设置STUN服务器主机或域名
```

TLS选项：

```
    --use-tls           启用TLS传输（默认不开启）
    --tls-ca-file       指定TLS CA文件（默认为无）
    --tls-cert-file     指定TLS证书文件（默认为无）
    --tls-privkey-file  指定TLS私钥文件（默认值=无）
    --tls-password      指定TLS私钥文件密码（默认为无）
    --tls-verify-server 验证服务器的证书（默认=没有）
    --tls-verify-client 验证客户端的证书（默认=没有）
    --tls-neg-timeout   指定超时（默认值无）
    --tls-srv-name      指定TLS服务器名称为多宿主服务器（可选）
```

媒体选项：

```
    --add-codec=name    手工添加编解码(默认开启所有)
    --dis-codec=name    禁用某个编解码
    --clock-rate=N      覆盖会议桥时钟频率
    --snd-clock-rate=N  覆盖音频设备时钟频率
    --stereo            音频设备及会议桥开通立体声模式
    --null-audio        使用NULL音频设备
    --play-file=file    在会议桥中注册WAV文件
    --play-tone=FORMAT  向会议桥注册音调，格式是'F1,F2,ON,OFF'，其中F1,F2为频率，
            ON,OFF=on/off ,可以指定多次。
    --auto-play         自动播放文件（仅来电）
    --auto-loop         自动循环传入RTP到传出RTP
    --auto-conf         自动加入会议
    --rec-file=file     录音文件(扩展名可以使.wav 或者 .mp3）
    --auto-rec          自动记录通话
    --quality=N         指定媒介质量(0-10,默认6)
    --ptime=MSEC        覆盖编解码器ptime的毫秒的
    --no-vad            停用VAD方案/沉默探测器（默认启用VAD）
    --ec-tail=MSEC      设置回波抵消尾长度（默认值256）
    --ec-opt=OPT        选择回波抵消算法（0 =默认，1 = SPEEX，2 =抑制）
    --ilbc-mode=MODE    设置iLBC语音编解码器模式（20或30，默认是30）
    --capture-dev=id    音频捕获的设备ID（默认值= -1）
    --playback-dev=id   音频播放设备ID（默认值= -1）
    --capture-lat=N     音频捕获延迟（毫秒,默认值= 100）
    --playback-lat=N    音频播放延迟（毫秒,默认值= 100）
    --snd-auto-close=N  闲置N秒后自动关闭音频设备
                      指定n = -1（默认）禁用此功能。
                      指定即时关闭不使用时，N = 0。
    --no-tones          禁用听见音频
    --jb-max-size       指定最大值抖动缓冲(帧，默认= 1)
```

媒体传输选项：

```
    --use-ice           使用ICE（默认：不使用）
    --ice-no-host       禁用ICE主机候选（默认:no）
    --ice-no-rtcp       禁用RTCP组件（默认:no）
    --rtp-port=N        RTP尝试端口基数(默认4000)
    --rx-drop-pct=PCT   Drop PCT percent of RX RTP (for pkt lost sim, default: 0)
    --tx-drop-pct=PCT   Drop PCT percent of TX RTP (for pkt lost sim, default: 0)
    --use-turn          Enable TURN relay with ICE (default:no)
    --turn-srv          TURN服务器的域或主机名称
    --turn-tcp          使用TCP连接到TURN服务器（默认:no）
    --turn-user         TURN用户名
    --turn-passwd       TURN密码
```

好友名单（可以是多个）：

```
    --add-buddy url     添加指定的URL到好友列表中
```

用户代理选项：

```
    --auto-answer=code  自动接听来电的应答代码（如200）
    --max-calls=N       最大并发呼叫数（默认：4，最大：255）
    --thread-cnt=N      工作线程数目（默认：1）
    --duration=SEC      设置最大通话时间（默认是：没有限制）
    --norefersub        转接通话时禁止事件订阅
    --use-compact-form  最小的SIP消息大小
    --no-force-lr       允许使用严格路由
    --accept-redirect=N 指定如何处理呼叫重定向响应（3XX）。
                       0：拒绝，1：自动（默认），2：询问
```

### 2. 打印错误信息

```c
/** 打印错误信息 */
pjsua_perror(THIS_FILE, "NAT detection failed", res->status);
```

内置回声消除
```c
pjmedia_echo_stat_default() // 初始化回声消除器统计
pjmedia_echo_create()       // 创建回声消除器
pjmedia_echo_create2()      // 创建回声消除器（多通道）
pjmedia_echo_destroy()      // 销毁回声消除器
pjmedia_echo_reset()        // 重置回声消除器
pjmedia_echo_get_stat()     // 获取回声消除器的统计信息
pjmedia_echo_playback()     // 通知回声消除器已经播放了一帧
pjmedia_echo_capture()      // 通知回声消除器已经捕获了一帧
pjmedia_echo_cancel()       // 回声消除器处理
```


接入一个外部的音频设备
```c
pjsua_media_config_default() // 初始化媒体配置
pjsua_snd_dev_param_default() // 初始化设备参数
pjsua_conf_connect_param_default() // 初始化连接参数
pjsua_conf_get_max_ports()  // 获取会议桥最大端口数
pjsua_conf_get_active_ports()   // 获取会议桥活动端口数
pjsua_enum_conf_ports()     // 枚举会议桥所有端口的ID
pjsua_conf_get_port_info()  // 根据端口号获取端口信息
pjsua_conf_add_port()       // 将媒体端口添加到会议桥端口
pjsua_conf_remove_port()    // 删除指定会议桥端口的插槽
pjsua_conf_connect()        // 建立媒体源，可以是一个源到多个端口，也可以是多个源到一个端口，后者会将媒体混合
pjsua_conf_connect2()       // 同上，多了一个参数来控制媒体流
pjsua_conf_disconnect()     // 断开两个媒体流
pjsua_conf_adjust_tx_level()    // 调节会议桥端口发送音频的大小
pjsua_conf_adjust_rx_level()    // 调节会议桥端口接收音频的大小

pjsua_player_create()       // 创建一个文件播放器并自动添加到会议桥
pjsua_playlist_create()     // 创建文件播放器列表端口，并自动将该端口添加到会议桥
jsua_player_get_conf_port() // 获取与文件播放器列表关联的会议桥端口
pjsua_player_get_port()     // 获取播放器列表、播放器的端口
pjsua_player_get_info()     // 获取播放器的信息（无法作用于播放器列表）
pjsua_player_get_pos()      // 获取播放器播放的位置（无法作用于播放器列表）
pjsua_player_set_pos()      // 设置播放器播放的位置（无法作用于播放器列表）
pjsua_player_destroy()      // 释放播放器、播放器列表，同时释放与会议桥连接的所有资源

pjsua_recorder_create()     // 创建一个录音器并自动添加到会议桥
pjsua_recorder_get_conf_port()  // 获取与录音器关联的会议桥端口
pjsua_recorder_get_port()   // 获取录音器的端口
pjsua_recorder_destroy()    // 释放录音器，同时完成录音

pjsua_enum_aud_devs()       // 枚举会议桥上的所有音频设备
pjsua_get_snd_dev()         // 获取当前正在活跃的音频设备
pjsua_set_snd_dev()         // 替换音频设备（选择音频设备的设备号）
pjsua_set_snd_dev2()        // 替换音频设备，根据更多的设备参数来更改
pjsua_set_null_snd_dev()    // 设置pjsua使用空设备
pjsua_set_no_snd_dev()      // 断开会议桥上的所有音频设备

pjsua_set_ec()              // 回音消除
pjsua_get_ec_tail()         // 获取回音消除的尾部长度(ms)
pjsua_get_ec_stat()         // 获取回音消除器的统计信息

pjsua_snd_is_active()       // 获取当前音频设备是否活跃
pjsua_snd_set_setting()     // 将音频设备设为正在使用，如果音频设备当前处于活动状态，则该功能会将设置转发到音频设备实例以立即应用（使用时需要参考一下说明）
pjsua_snd_get_setting()     // 获取音频设备的设置
pjsua_ext_snd_dev_create()  // 创建一个额外音频设备并注册到设备桥
pjsua_ext_snd_dev_destroy() // 销毁一个额外音频设备并从会议桥中取消注册
pjsua_ext_snd_dev_get_snd_port()    // 获取额外音频设备的媒体端口
pjsua_ext_snd_dev_get_conf_port()   // 获取额外音频设备的会议桥端口

pjsua_enum_codecs()         // 枚举系统支持的编解码器
pjsua_codec_set_priority()  // 修改编解码器的优先级
pjsua_codec_get_param()     // 获取编解码器的参数


```

内置内存池的使用

```c
pool = pjsua_pool_create("pjsua-app", 1000, 1000);   // 创建内存池，par:名称，内存池大小，内存池增量
pj_pool_release(pool)                                 // 释放内存池，par:内存池句柄
```

音频的使用

```c
/** 使用空的音频设备，该音频设备不会与硬件交互，但协议正常执行 */
pjsua_set_null_snd_dev();

/** 修改音频设备 */
pjsua_set_snd_dev(app_config.capture_dev,           // 录音
				   app_config.playback_dev);        // 播放

/** 创建音频发生器 */
pjmedia_tonegen_create2(app_config.pool,            // 内存池句柄
                        &label,                     // 名称
                        8000,                       // 采样率
                        1,                          // 通道
                        160,                        // 每帧样本数
                        16,                         // 每样本的bit数
                        PJMEDIA_TONEGEN_LOOP,       // 播放选项
                        &tport);                    // 音频发生器实例

/** 将媒体实例添加到会议端口 */
pjsua_conf_add_port(app_config.pool,                // 内存池
                    tport,                          // 音频实例
				    &app_config.tone_slots[i]);     // 端口

/** 播放 */
pjmedia_tonegen_play(tport,                         
                    1,                              // 数组中音调数量
                    &app_config.tones[i],           // 要播放的音调数组
                    0);                             // 播放选项
```


SIP传输协议配置

```c
/** 创建传输协议 */
pjsua_transport_create(type,                        // 传输类型
					&app_config.udp_cfg,            // 配置
					&transport_id)                  // 传输协议句柄

/** 添加本地账户 */
pjsua_acc_add_local(transport_id,                   // 传输协议句柄
                    PJ_TRUE,                        // 是否作为默认账户
                    &aid);                          // 新账户的指针

/** 更改本地账户配置 */
{
    pjsua_acc_get_config(aid, tmp_pool, &acc_cfg);  // 获取当前账户的acc配置
    app_config_init_video(&acc_cfg);                // 配置acc，这里不是官方的api
    pjsua_acc_modify(aid, &acc_cfg);                // 修改账户配置
}

/** 更改默认账户的在线状态 */
pjsua_acc_set_online_status(current_acc, PJ_TRUE);


```

添加好友

```c
/** 添加好友 */
pjsua_buddy_add(&app_config.buddy_cfg[i],   // 好友配置
                NULL);                      // 好友句柄
```

编解码器配置

```c
/** 设置编解码器优先级 */
pjsua_codec_set_priority(&app_config.codec_dis[i],      // 编解码器id
				 PJMEDIA_CODEC_PRIO_DISABLED);          // 优先级

/** 设置视频编解码器优先级 */
pjsua_vid_codec_set_priority(&app_config.codec_dis[i],  // 编解码器id
				     PJMEDIA_CODEC_PRIO_DISABLED);      // 优先级
```

打电话配置

```c
/** 获取默认电话配置 */
pjsua_call_setting_default(&call_opt);

/** 主动呼叫 */
pjsua_call_make_call(current_acc,   // 当前账户
                    &uri_arg,       // 目标uri
                    &call_opt,      // 呼叫选项
                    NULL,           // 要附加到呼叫的任意用户数据，并且可以稍后检索。
                    NULL,           // 添加到传出 INVITE 请求的可选标头等，如果不需要自定义标头，则为 NULL。
                    NULL);          // 接收呼叫标识的指针
```

接电话配置

```c
/** 获取默认电话配置 */
pjsua_call_setting_default(&opt);

/** 应答来电 */
pjsua_call_answer(call_id,                     // 来电标识
                    app_config.auto_answer,     // 状态代码(100-699)
                    NULL,                       // 原因
                    NULL);                      // 要传出的标头信息

/** 应答来电 */
pjsua_call_answer2(call_id,                     // 来电标识
                    &opt,                       // 呼叫配置
                    app_config.auto_answer,     // 状态代码(100-699)
                    NULL,                       // 原因
			        NULL);                      // 要传出的标头信息
```


清除TLS缓存区的证书和密钥

```c
pjsip_tls_setting_wipe_keys(&app_config.udp_cfg.tls_setting);       // 传入需要擦除的数据的指针
```



### 2. pjsip库的一些API使用记录（官网有更详细的解释）

打印错误信息

```c
/** 打印错误信息 */
pjsua_perror(THIS_FILE, "NAT detection failed", res->status);
```

内置内存池的使用

```c
pool = pjsua_pool_create("pjsua-app", 1000, 1000);   // 创建内存池，par:名称，内存池大小，内存池增量
pj_pool_release(pool)                                 // 释放内存池，par:内存池句柄
```

音频的使用

```c
/** 使用空的音频设备，该音频设备不会与硬件交互，但协议正常执行 */
pjsua_set_null_snd_dev();

/** 修改音频设备 */
pjsua_set_snd_dev(app_config.capture_dev,           // 录音
				   app_config.playback_dev);        // 播放

/** 创建音频发生器 */
pjmedia_tonegen_create2(app_config.pool,            // 内存池句柄
                        &label,                     // 名称
                        8000,                       // 采样率
                        1,                          // 通道
                        160,                        // 每帧样本数
                        16,                         // 每样本的bit数
                        PJMEDIA_TONEGEN_LOOP,       // 播放选项
                        &tport);                    // 音频发生器实例

/** 将媒体实例添加到会议端口 */
pjsua_conf_add_port(app_config.pool,                // 内存池
                    tport,                          // 音频实例
				    &app_config.tone_slots[i]);     // 端口

/** 播放 */
pjmedia_tonegen_play(tport,                         
                    1,                              // 数组中音调数量
                    &app_config.tones[i],           // 要播放的音调数组
                    0);                             // 播放选项
```


SIP传输协议配置

```c
/** 创建传输协议 */
pjsua_transport_create(type,                        // 传输类型
					&app_config.udp_cfg,            // 配置
					&transport_id)                  // 传输协议句柄

/** 添加本地账户 */
pjsua_acc_add_local(transport_id,                   // 传输协议句柄
                    PJ_TRUE,                        // 是否作为默认账户
                    &aid);                          // 新账户的指针

/** 更改本地账户配置 */
{
    pjsua_acc_get_config(aid, tmp_pool, &acc_cfg);  // 获取当前账户的acc配置
    app_config_init_video(&acc_cfg);                // 配置acc，这里不是官方的api
    pjsua_acc_modify(aid, &acc_cfg);                // 修改账户配置
}

/** 更改默认账户的在线状态 */
pjsua_acc_set_online_status(current_acc, PJ_TRUE);


```

添加好友

```c
/** 添加好友 */
pjsua_buddy_add(&app_config.buddy_cfg[i],   // 好友配置
                NULL);                      // 好友句柄
```

编解码器配置

```c
/** 设置编解码器优先级 */
pjsua_codec_set_priority(&app_config.codec_dis[i],      // 编解码器id
				 PJMEDIA_CODEC_PRIO_DISABLED);          // 优先级

/** 设置视频编解码器优先级 */
pjsua_vid_codec_set_priority(&app_config.codec_dis[i],  // 编解码器id
				     PJMEDIA_CODEC_PRIO_DISABLED);      // 优先级
```

打电话配置

```c
/** 获取默认电话配置 */
pjsua_call_setting_default(&call_opt);

/** 主动呼叫 */
pjsua_call_make_call(current_acc,   // 当前账户
                    &uri_arg,       // 目标uri
                    &call_opt,      // 呼叫选项
                    NULL,           // 要附加到呼叫的任意用户数据，并且可以稍后检索。
                    NULL,           // 添加到传出 INVITE 请求的可选标头等，如果不需要自定义标头，则为 NULL。
                    NULL);          // 接收呼叫标识的指针
```

接电话配置

```c
/** 获取默认电话配置 */
pjsua_call_setting_default(&opt);

/** 应答来电 */
pjsua_call_answer(call_id,                     // 来电标识
                    app_config.auto_answer,     // 状态代码(100-699)
                    NULL,                       // 原因
                    NULL);                      // 要传出的标头信息

/** 应答来电 */
pjsua_call_answer2(call_id,                     // 来电标识
                    &opt,                       // 呼叫配置
                    app_config.auto_answer,     // 状态代码(100-699)
                    NULL,                       // 原因
			        NULL);                      // 要传出的标头信息
```


清除TLS缓存区的证书和密钥

```c
pjsip_tls_setting_wipe_keys(&app_config.udp_cfg.tls_setting);       // 传入需要擦除的数据的指针
```

## 