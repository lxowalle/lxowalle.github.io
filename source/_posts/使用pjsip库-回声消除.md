---
title: 使用pjsip库-回声消除
date: 2021-10-26 19:57:40
tags: Linux
categories: pjsip
---

# 使用pjsip库-回声消除

pjsip库内置了回声消除（Accoustic Echo Cancellation）的方法,参考[这里](https://www.pjsip.org/pjmedia/docs/html/group__PJMEDIA__Echo__Cancel.htm)获取API详细信息

## 一、简述回声

### 2.1 简述

在电话环境中，当A和B正在通话中，A传给B的声音通过B的麦克风又传回给了A的扬声器，也就是说A说了一句话之后能在扬声器听到自己的声音，这就是回声。

### 2.2 产生回声的条件

回声的产生条件通常有两种：

- 声音信号从扬声器播放后又被麦克风捕获传递了回去
- 通过发送线路传输的电信号被相邻的线路捕获（线路回波）

### 2.3 处理回声的方法

通用使用回声消除和回声抑制来解决回声

**回声消除：**系统接收到传入的语音流后，会监视传出的语音流，如果在传出的语音流中检测到了传入语音流的副本，则会在返回流上通过数学减法来消除该副本的影响。

**回声抑制：**系统在接收到传入语音流时将其他的流静音，这样就不会有语音流从接收者发送出去。

## 二、 pjsip内置的回声消除

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

需要快速启动内置的回声消除时，可以在pjsua_init()前修改media_cfg参数的ec_options选项即可，将该值设为PJMEDIA_ECHO_USE_SW_ECHO即可开启软件回声消除。

```c
/* 开启回声消除 */
app_config.media_cfg.ec_options |= PJMEDIA_ECHO_USE_SW_ECHO;
/* 初始化pjsua */
status = pjsua_init(&app_config.cfg, &app_config.log_cfg, &app_config.media_cfg);
```

