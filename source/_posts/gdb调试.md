---
title: gdb调试
date: 2022-11-17 20:14:06
tags:
---

# GDB调试

#### GDB调试常用命令

[参考](https://www.jianshu.com/p/b7896e9afeb7)

```
// 部分指令
file <file-name>    加载需要调试的程序
attach <pid>        关联指定进程id
help <cmd>          查看指定命令说明

r                   运行程序，直到断点
c                   继续运行程序，直到断点
b <line>            断点
b <func>            断点
b *<code_addr>      断点
d [id]              删除断点
si                  执行一行代码
ni                  执行一行代码，函数也会当成是一行
p $pc               显示pc的值
x/10i $pc           查看pc指向的地址后10行的汇编代码
display /i $pc      每次执行命令后，显示下一条汇编命令
undisplay <id>      取消display的显示
call <函数名>        跳转到目标函数的位置
q                   退出gdb
```



#### 使用平头哥T-HEAD Debug调试工具

[T-HEAD Debug Server 用户手册](https://occ.t-head.cn/document?temp=console-edition-t-head-debugserver&slug=t-head-debug-server-user-manual)

基本调试环境的搭建可以参考[这里](https://occ.t-head.cn/document?temp=linux&slug=t-head-debug-server-user-manual)

#####  1. T-Head DebugServer 安装步骤

1、在进行安装过程中，用户需要获得 sudo 权限。

2、通过命令 `chmod+x` 增加安装包的执行权限。

3、执行 `sudo ./T-Head-DebugServer-linux-*.sh –i` 开始安装。

4、给出提示 “Do you agree to install the DebugServer[yes/no]”，输入 “yes”。

5、系统提示设置安装路径 “Set full installing path:”

- 安装到用户指定目录：用户输入安装路径（绝对路径），安装会给出提示“This software will be installed to the path:（用户输入的路径）？[yes/no/cancel]:”，确认路径无误，输入“yes”并按下回车键。此时安装包将进行安装，安装完成后将提示：

    “Done！

    You can use command “DebugServerConsole” to start DebugServerConsole！

    (NOTE：The full path of ‘DebugServerConsole.elf’ is 用户输入的路径/T-Head_DebugServer) ”

- 默认路径安装：直接按回车，那么会给出提示“This software will be installed to the default path: (/usr/bin/)?[yes/no/cancel]:”，用户输入 “yes”，软件会安装到默认路径“/usr/bin/”目录下。安装完成后提示：

    “Done ！

    You can use command “DebugServerConsole” to start DebugServerConsole！

    (NOTE：The full path of ‘DebugServerConsole.elf’ is /usr/bin/T-Head_DebugServer) ”

##### 2. 连接T-Head DebugServer到目标开发板

1. 连接JTAG线到开发板，运行T-Head DebugServer

    ```shell
    DebugServerConsole
    ```

    注意：如果JTAG未连接到开发板，则T-Head DebugServer会打开失败

2. 准备待调试的可执行文件(ELF格式，编译时需要注意添加-g选项来保存符号名)

3. 运行工具链的gdb命令打开可执行文件

    ```shell
    riscv64-unknown-elf-gdb ../../../../M1s_BL808_example/e907_app/build_out/firmware.elf
    ```

4. 在gdb的窗口中输入 T-Head DebugServer 界面上的提示的GDB 连接命令

    ```shell
    (gdb) target remote 127.0.0.1:1025
    ```

5. 开始进行gdb调试

    ```shell
    load                     #下载程序至开发板
    break main               #在 main 函数处设置断点
    continue                 #运行程序
    info registers r0        #查看寄存器 r0
    print var_a              #查看程序变量 var_a
    ```

    

