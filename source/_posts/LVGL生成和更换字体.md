---
title: LVGL生成和更换字体
date: 2021-11-10 20:05:11
tags:
---

# 一、LVGL生成和更换字体

LVGL内部支持各种大小的字体，但是默认都不支持中文，所以使用LVGL时想要显示中文就需要利用工具生成汉字库。
我使用的`LvglFontTool v0.3`工具来生成字体，这里下载[LvglFontTool v0.4](http://www.lfly.xyz/forum.php?mod=viewthread&tid=24&extra=)，应该操作区别不大。


## 1.1 使用LVGL内置字体的方法

LVGL内置的字体只支持英文，不支持中文。使用内置字体的步骤如下：

1. 找到`lv_conf.h`文件下的`LV_FONT_MONTSERRAT_xxx`宏，这些宏代表了不同大小的字体，使能对应宏会使能该字体。
2. 通过`lv_style_set_text_font`函数选择要使用的字体，代码示例如下：

```c
/** 代码示例 */
void show_str_demo(char * str)
{
    static lv_style_t style;

    lv_style_init(&style);

    lv_style_set_text_color(&style, LV_STATE_DEFAULT, LV_COLOR_RED);
    lv_style_set_text_opa(&style, LV_STATE_DEFAULT, LV_OPA_50);

    /* 在这里设置字体 */
    lv_style_set_text_font(&style, LV_STATE_DEFAULT, &lv_font_montserrat_28);

    lv_obj_t *obj = lv_label_create(lv_scr_act(), NULL);
    lv_obj_add_style(obj, LV_OBJ_PART_MAIN, &style);
    
    lv_label_set_text(obj, str);
    lv_obj_align(obj, NULL, LV_ALIGN_IN_TOP_LEFT, 0, 0);
}

/** 调用 */
show_str_demo("Hello! 你好啊世界");
```
注意：
> 调用上面示例函数来打印字符"Hello! 你好啊世界"时，会发现界面只显示了"Hello!"，这是因为LVGL默认的字体库不支持中文。需要显示中文时，请参考下文的步骤。

## 1.2 使用LvglFontTool工具生成中文字体库

使用LvglFontTool工具可以根据用户的需求生成自定义格式和大小的字体。配置自定义字体的步骤如下：

1. 安装LvglFontTool工具，点击[这里](http://www.lfly.xyz/forum.php?mod=viewthread&tid=24&extra=)下载
2. 使用LvglFontTool生成字体库。注意字体库会以*.c文件的形式保存
```
待补图片
```
注意：
> 由于该软件在转换字体可能出现软件卡死的情况，遇到该情况时重新启动软件即可

3. 将生成的字体库文件(C文件)加入工程中
4. 通过`LV_FONT_DECLARE(font_name)`声明新加的字体库，然后通过lv_style_set_text_font设置字体即可。font_name表示字体库的名称。以下是使用的代码示例：
 ```c
/** 代码示例 */
void show_str_demo(char * str)
{
    static lv_style_t style;

    lv_style_init(&style);

    lv_style_set_text_color(&style, LV_STATE_DEFAULT, LV_COLOR_RED);
    lv_style_set_text_opa(&style, LV_STATE_DEFAULT, LV_OPA_50);

    /* 在这里设置字体样式 */
    LV_FONT_DECLARE(myFont);									  // 声明字体库
    lv_style_set_text_font(&style, LV_STATE_DEFAULT, &myFont);    // 应用字体库

    lv_obj_t *obj = lv_label_create(lv_scr_act(), NULL);
    lv_obj_add_style(obj, LV_OBJ_PART_MAIN, &style);
    
    lv_label_set_text(obj, str);
    lv_obj_align(obj, NULL, LV_ALIGN_IN_TOP_LEFT, 0, 0);
}

/** 调用 */
show_str_demo("Hello! 你好啊世界");
```