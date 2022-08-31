# iverlog+GTKWave使用

[全平台轻量开源verilog仿真工具iverilog+GTKWave使用教程](https://zhuanlan.zhihu.com/p/95081329)

#### 安装

```shell
# 安装 Iverilog：
sudo apt-get install iverilog
# 安装 GTKWave：
sudo apt-get install gtkwave
```

安装完成后将会得到以下3个命令工具，功能如下：

- iverilog：用于编译verilog和vhdl文件，进行语法检查，生成可执行文件
- vvp：根据可执行文件，生成仿真波形文件
- gtkwave：用于打开仿真波形文件，图形化显示波形

执行错误：

1. `Gtk-Message: 09:10:26.571: Failed to load module "canberra-gtk-module"`

    ```shell
    sudo apt-get install libcanberra-gtk-module
    ```

2. `GLib-GIO-ERROR **: 18:28:23.682: Settings schema 'com.geda.gtkwave' is not installed`
