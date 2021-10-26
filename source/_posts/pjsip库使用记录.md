---
title: pjsip lib使用记录
date: 2021-10-13 14:31:44
tags:
---

# pjsip库使用记录

### 2. pjsip库的一些API使用记录（官网有更详细的解释）

打印错误信息

```c
/** 打印错误信息 */
pjsua_perror(THIS_FILE, "NAT detection failed", res->status);
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