# Reocrd2207

TODO:

- [ ] 准备最新固件用于淘宝



07-05

---

- [x] 搭建黑子的开发环境，找uvc的问题

  - 搭建espidf开发环境
  - 找出uvc不能使用的问题：传回的视频流的帧头不带时间戳和设备时钟源，所以头部长度为2；其次我们每帧数据末尾默认是不带EOF标志的，sdk默认判断了这个标志，连续的两帧数据被认为是一帧，导致溢出

- [ ] Audio的回声消除不足以消除回声，还需要进行一次降噪

  回声消除的代码：

  ```c
  #define NN      800     // 存放一帧16位有符号整型单声道原始音频数据的采样数量，单位个，一般为10毫秒到20毫秒。例如：8000Hz采样频率20毫秒本参数就是160。本参数具体大小要慢慢调，调的好不好直接影响回音消除的效果。
  #define TAIL    4800    // 存放回音消除过滤器的采样数量，单位个，一般为100毫秒到500毫秒。如果采样频率是8000Hz，选择300毫秒，本参数就是8000÷1000×300。
  
  static uint16_t tmp_pcm[record_len >> 2];
  static int tmp_pcm_cnt = 0;
  static void audio_record_task(void *par)
  {
      size_t ret;
      /* Speex init */
      static short echo_buf[NN] = {0}, ref_buf[NN] = {0}, e_buf[NN] = {0};
      int tmp_cnt = 0;
      int sampleRate = 16000;
      SpeexEchoState *st;
      SpeexPreprocessState *den;
      st = speex_echo_state_init(NN, TAIL);
      den = speex_preprocess_state_init(NN, sampleRate);
      speex_echo_ctl(st, SPEEX_ECHO_SET_SAMPLING_RATE, &sampleRate);
      speex_preprocess_ctl(den, SPEEX_PREPROCESS_SET_ECHO_STATE, st);
      uint16_t *record_buf16 = (uint16_t *)record_buf;
      player->fifo_start(player);
      while (1) {
  #if 1
          ret = player->record_read(player, record_buf, sizeof(ref_buf) << 1); 
          if (ret) {
              /* 取单声道 */
              tmp_cnt = 0;
              for (int i = 0; i < ret >> 1; i += 2) {
                  ref_buf[tmp_cnt] = record_buf16[i];
                  tmp_cnt ++;
              }
  
              /* TODO 回音消除 */
              speex_echo_cancellation(st, ref_buf, echo_buf, e_buf);
              speex_preprocess_run(den, e_buf);
  
              /* 播放双声道 */
              tmp_cnt = 0;
              memset(record_buf, 0, sizeof(record_buf));
              for (int i = 0; i < NN; i ++) {
                  record_buf16[tmp_cnt] = e_buf[i];
                  tmp_cnt += 2;
              }
              player->fifo_write(player, record_buf, sizeof(ref_buf) << 1, 0);
          }
      }
  }
  ```

- [x] 准备双IR样品和双IR单模块

07-06

---

- [ ] Audio的回声消除，降噪可能不能满足要求，先再调一下参数试试

  - 尝试NN=20ms(320)，TAIL=1~100ms（16~1600）,未成功

  - 用软件抓取回声间隔

    叩击桌面一次，看到回声数据间隔约10ms，且渐渐消失。

  - 回声消除先放下，把音频代码移植到当前版本上

- [ ] 移植Audio到当前代码，需要解决几个问题：

    - [ ] e907抓到的音频数据需要通过串口协议发送，串口协议是在906上跑的，串口实际发数据是通过907发送的，所以需要一个同步机制来防止e907和c906代码抢占串口导致串口收发不正常

        方案1：906标记自身使用串口的状态，由907判断串口空闲时占用串口并发送音频数据

        方案2：907将读到的音频缓存，并通知906读取和发送(数据量很大，可能遭不住，906会先写到缓存，再发给907，再从串口发出，绕了一圈)

    - [ ] c906在业务逻辑需要播放音频时，需要通知907播报音频，可能还需要知道音频是否播报完成

        方案：通过xram通知907，907同样通过xram通知906

    - [ ] 步骤：

        - [ ] 需要升级之前的核间通信方式，从bl的那一套改进。先不支持大批数据流。
        - [ ] 更新串口：
            - [ ] 串口接收不能很好的抵抗错误代码（与这次方案无关，但趁现在花时间解决）
            - [ ] 串口需要在每次占用串口时能正确标记为占用、空闲状态
        - [ ] 实现906发送播放音频请求，907播放音频
        - [ ] 实现906和907在串口抢占串口的功能

  ```c
  static int do_playback(const uint8_t *data, size_t data_len)
  {
      if (!data)
          return -1;
      audio_player_t *player = NULL;
      audio_player_get(&player);
      if (player == NULL) {
          printf("player no init \r\n");
          return -2;
      }
  
      player->fifo_start(player);
      size_t remain_len = data_len;
      size_t w_len = 0, ret = 0;
      while (remain_len > 0) {
          w_len = remain_len > 4096 ? 4096 : remain_len; /* once write len any value is ok */
          ret = player->fifo_write(player, data + data_len - remain_len, w_len, 1); //write block
          remain_len -= ret;
      }
      player->fifo_stop(player, 0);
      return 0;
  }
  ```

 

```
    uint8_t recv_buf[UARTP_RECV_BUFF_SIZE];
    LOGPOINTER(recv_buf); // 0x500b67c0
    
    uint8_t *recv_buf = pvPortMalloc(UARTP_RECV_BUFF_SIZE);
    LOGASSERT(recv_buf) // 0x500b6c80
    
    static uint8_t recv_buf[UARTP_RECV_BUFF_SIZE]; // 50049538
    
```



```
0x500c0d10
0x500bfd10
```



07-12

---

- [x] 测试当906和907同时写psram时，会导致cam取图失败。已经联系博流一铭，告知会给一个配置试试

    一铭已经复现问题，配合一铭解决bug

- [x] 开始捡起回音消除，之前对现象的期望有误，重新设计测试方法

    - 正常回音消除应该是：

        > A端扬声器+人声->A端麦克风->回音消除器获取A端信号作为参考->B端->B端扬声器+人声->B端麦克风->A端->回声消除器根据A端信号参考进行回声消除->A端扬声器

    - 测试时没有添加B端的音频，因此回音消除后扬声器应该播放为静音，因为语音已经被消除了，如下：

        > A端扬声器+人声->A端麦克风->回音消除器获取A端信号作为参考->A端->回声消除器根据A端信号参考进行回声消除->A端扬声器

    - 设计新测试方法

        1. 先在pc上测试，方便观察结果。

            方法：

            - 先尝试用基于Speex库进行回声消除，如果可行再考虑移植
            - 测试1：拿出一个pcm文件，进行回声消除后，观察波形是否静音
            - 测试2：网上找到混合pcm测试文件，进行回声消除后，观察是否消除干净

            

07-13

---

- [ ] 跟一铭联系目前e907和c906访问cam出现的bug
- [x] 解决黑子的问题
- [x] 用rust测试串口
- [x] 用rust测试音频播放



07-14

---

- [ ] 与黑子交流商汤加密协议，制定一下加密方式

    - [x] 问加密密码：Sensetime@0730

    - [x] mode2加密方法，详情需要参考黑子提供的手册

        > 1. 主机发送16字节秘钥
        >
        >     ***\*Host Send:\****    EFAA 53 0010 000102030405060708090A0B0C0D0E0F 43
        >
        >     ***\*Module Reply:\****	EFAA 00 00 02 53 00 51
        >
        > 2. 发送4Bytes随机数：3C56B385，mode：2，4Bytes时间戳：5E689A73；人脸模块采用生成的Key对模块SN号进行异或取反加密，并回复给主控。
        >
        >     ***\*Host Send:\****		EFAA 50 00 09    3C56B385    02    5E689A73   D8
        >
        >     ***\*Module Reply:\****
        >
        > 3. 完成，开始加密通信

        > 加密代码：
        >
        > ```c
        > status_t transcode(uint8_t *bytes, int length, const uint8_t *key, int stride, uint8_t *out)
        > {
        >     if (!out)
        > 		out = bytes;
        >     for(int index = 0; index < length; index++){
        > 		out[index] = bytes[index] ^ key[index % stride];
        >         out[index] = ~out[index];
        >     }
        >     return OK;
        > }
        > 
        > ```

    - [ ] 完成uartp mode2加密，优先级偏低，暂时滞后

- [x] 尝试将e907堆分配改到mram上，以减少对psram的访问

    不成功，e907会跑飞

- [ ] 准备尝试让e907运行在wifi的内存上，c906运行在psram上

    等一铭的修改

- [x] 准备天工的音频模块

    - [x] 音频流测试ok
    - [x] 播放有点不对，期望播放pass，实际播放start_record，已解决，代码bug
    - [x] 做新的模块，准备替换天工的

- [ ] 拍照不同识别环境的效果（强光/强逆光，正常室内/室内逆光，黑暗环境）

    - [ ] 强光/强逆光：去楼下拍，录入/识别=>无法快速判断人脸方向，换成双ir，逆光不行
    - [x] 室内/室内逆光：去实验室拍，录入/识别
    - [ ] 黑暗环境：去会议室拍，录入/识别=>噪点多，无法快速判断人脸方向

07-15

---

- [x] 追一下竞争psram导致的问题

    - [x] 用新分支测试psram问题是否仍然存在

        发现pc出现取指不对齐的情况，已反馈给一铭

- [ ] 完成uartp mode2加密

    - [x] 获取key

        `EFAA 53 0010 000102030405060708090A0B0C0D0E0F 43`

    - [x] 获取随机数，加密模式

    - [ ] 随机数md5加密，根据key读出16字节的加密key

    - [ ] 返回主机号时先用固定uid，后面考虑获取设备uid

    - [ ] 根据加密函数，对所有数据段加密和解密

- [ ] 
