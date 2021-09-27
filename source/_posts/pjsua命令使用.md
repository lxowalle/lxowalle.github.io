---
title: pjsua命令使用
date: 2021-09-26 10:48:11
categories: "未分类"
tags:
---

[参考](https://www.pjsip.org/docs/latest/pjsip/docs/html/group__PJSUA__LIB.htm)

# pjsua命令使用

pjsua是基于pjsip库编译得到的一个命令行sip用户代理。

基本用法：

```
    pjsua [选项] [sip的url调用]
```

一般选项：

```
(未测试)   --config-file=file     读取从文件的配置/参数；
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

> IMS是第三代移动通信合作伙伴项目(3GPP)提出的支持IP多媒体业务的子系统，采用了SIP协议，可以提供多种媒体业务，控制功能与承载能力分离、呼叫与会话分离、应用与服务分离、业务与网络分离、移动网与互联网业务融合
> SRTP是安全实时传输协议，是基于RTP（实时传输协议）定义的一个协议，主要为单播和多播应用程序的RTP提供加密，消息认证，完整性保证和重放保护。

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
    --no-tones          禁用听见声音
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


## pjsua功能验证

软件准备：

miniSIPServer作为SIP服务器，[PortSIP](http://www.portsip.cn/download-portsip-softphone/)软件作为手机端SIP客户端，Deepin编译出pjsua程序作为电脑端SIP客户端

步骤：
1. miniSIPServer设置ip地址(192.168.0.15)，从机地址(100,101)
2. 手机端通过输入101，101，192.168.0.15向服务器注册
3. pjsua端通过命令行向服务器注册
    - 创建一个pjsua.cfg文件夹，输入内容:
    ```
    --id sip:100@192.168.0.15
    --registrar sip:192.168.0.15
    --realm *
    --username 100
    --password 100

    --reg-timeout 55
    --color
    ```
    - 执行命令`pjsua --config-file pjsua-cfg pjsua.cfg`
4. 手机端拨号100，播出后应当能在pjsua端听到呼叫提示音
5. pjusa输入a并回车，再次输入200并回车，此时通话建立
6. 正常通话

## 交叉编译

命令：
```
# 依赖
sudo apt-get install build-essential git-core checkinstall yasm texi2html libvorbis-dev libx11-dev libvpx-dev libxfixes-dev zlib1g-dev pkg-config netcat libncurses5-dev nasm libx264-dev libv4l-dev libasound2-dev libsdl2-dev libxext-dev

cd pjproject
PATH=$PATH:/opt/toolchain-sunxi-musl/toolchain/bin 
./configure CC=arm-openwrt-linux-muslgnueabi-gcc --host=arm-openwrt-linux-muslgnueabi --libdir=/home/sipeed/sipeed/MF_SDK_v83x/components/libmaix/libmaix/components/libmaix/lib/arch/v833 LIBS=-ldl --disable-libwebrtc
make dep
make -j8
```

出现错误1：找不到-lasound
> ```
> 错误：arm-openwrt-linux-muslgnueabi/bin/ld: cannot find -lasound
> ```
解决1：将libasound.so复制到pjproject/pjlib/lib目录下

出现错误2：函数未定义
> ```
> output/pjlib-test-arm-openwrt-linux-gnu-muslgnueabi/main.o: In function > > `print_stack':
> main.c:(.text+0x14): undefined reference to `backtrace'
> main.c:(.text+0x44): undefined reference to `backtrace_symbols_fd'
> ```
解决2：注销掉backtrace和backtrace_symbols_fd的相关调用

