---
title: pjsip lib使用记录
date: 2021-10-13 14:31:44
tags:
---


# pjsip lib使用记录

[pjsua-lib API说明](https://www.pjsip.org/docs/latest/pjsip/docs/html/group__PJSUA__LIB.htm)
[pjlib_util API说明](https://www.pjsip.org/docs/latest/pjlib-util/docs/html/group__PJLIB__UTIL__CLI.htm)

## 一、API

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