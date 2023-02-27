---
title: lv_font_conv工具生成lvgl字体
date: 2023-02-27 20:50:20
tags:
---

# lv_font_conv工具生成lvgl字体



操作步骤：

1. 下载lv_font_conv代码

    ```shell
    https://github.com/lvgl/lv_font_conv.git
    ```

2. 安装lv_font_conv

    ```shell
    cd lv_font_conv
    sudo npm i lv_font_conv -g	# 根据提示可能需要更新npm到指定版本
    ```

3. 运行lv_font_conv

    参考[将LVGL的中文字体编译为文件写入Flash中并读取](https://yuanze.wang/posts/lvgl-chinese-font-in-bin/), 下载字体[字体天下](https://www.fonts.net.cn/fonts-zh-1.html)

    ```shell
    lv_font_conv --bpp 4 --size 19 -o sh_19.c --font FangZhengHeiTiJianTi-1.ttf --format lvgl --no-kerning --no-prefilter --range 0x20-0xBF --range 0x3000-0x3011 --range 0x4E00-0x9FAF --range 0xFF00-0xFF64
    ```

    `--bpp`参数指定生成的字体中，1个显示像素使用多少字体像素。当此参数大于1时，代表启用灰度抗锯齿，字体的边缘将更加清晰，但是会占用更大的空间。为了显示效果，建议使用4像素抗锯齿。

    `--size`参数指定生成字体的高度，可根据需要自行选择。

    `--format`参数指定生成字体的格式，共有`lvgl`与`bin`两种格式可选，分别对应生成`.c`格式与`.bin`格式的字体。

    `--no-kerning`参数用于关闭字体可变间距的功能。此功能在汉字显示过程中效果不明显，且会带来额外的查表时间并占用更多的存储空间，建议关闭。

    `--font`参数用于指定使用的字体文件。其后所接的所有`--range`参数与`--symbols`参数均只对此字体起效，直到出现下一个`--font`参数之前。

    `--range`参数用于指定要添加进入字体的[Unicode字符范围](https://www.ssec.wisc.edu/~tomw/java/unicode.html)，可以重复使用以指定多个范围。在本例中，`0x20-0xBF`包含所有ASCII字符与一些增补字符（例如`©`），`0x3000-0x3011`包含一些CJK括号（例如`《` `【`等），`0x4E00-0x9FAF`包含所有简体繁体与日文汉字，`0xFF00-0xFF64`包含全角英文数字与标点（例如`、` `０`）等。在此基础上，还可以根据需要自行添加或删除字体。下表包含了一些常用的Unicode字符范围。

    |   编码范围    | 字符数量  |          编码内容          |
    | :-----------: | :-------: | :------------------------: |
    | 0x0020-0x007F |    96     |          ASCII码           |
    | 0x0080-0x00BF |    64     |   ASCII码增补（`™` `©`）   |
    | 0x2600-0x26FF |    256    | 各种符号（`☆` `♂` `♫` `♡`) |
    | 0x3000-0x301F |    32     |    CJK符号（`《` `【`）    |
    | 0x3040-0x309F |    94     |         日文平假名         |
    | 0x30A0-0x30FF |    94     |         日文片假名         |
    | 0x4E00-0x9FAF | **20902** |  所有简体、繁体、日文汉字  |
    | 0xAC00-0xD7A3 | **11172** |          韩文音节          |
    | 0xFF00-0xFF64 |    100    |     全角英文数字与标点     |
