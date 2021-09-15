---
title: 创建并使用SDK
date: 2021-09-15 20:01:32
categories: "none class"
tags:
---

# 创建并使用SDK

这里使用了[Neucrack](https://github.com/Neutree)的SDK模板，快速创建并应用，感谢[Neucrack](https://github.com/Neutree)开源的SDK模板！！！

## 一、获取与编译SDK

1. 通过Github克隆代码到本地

    ```shell
    git clone https://github.com/Neutree/c_cpp_project_framework --recursive
    ```
2. 根据自己的需求更换SDK的名称

    ```shell
    mv c_cpp_project_framework knb
    ```

3. 更换git仓库的地址为自己的地址

    ```shell
    # 方法1
    git remote set-url origin [url] # 修改为新的远程仓库地址

    # 方法2
    git remote rm origin
    git remote add origin [url]

    # 方法3
    # 直接从.git/config文件修改，如果出现问题则执行：git pull origin master --allow-unrelated-histories
    ```

    这里我使用方法1：

    ```shell
    git remote set-url origin git@github.com:lxowalle/knb.git
    git push origin main
    git push origin --delete master     # 删除远程分支
    git branch -d master                # 删除本地分支
    ```
4. 编译

    ```shell
    cd knb/example/demo1
    mkdir build && cd build
    cmake ..
    make
    ./demo1             # 执行编译生成的可执行文件
    ```
5. 至此基础使用结束


## 二、修改SDK

### 2.1 新建并修改工程

#### 2.1.1 新建工程并编译

    直接复制工程文件demo1并编译即可
    ```shell
    cp demo1 test -r
    cd test
    mkdir build && cd build
    cmake .. && make
    ./test              # 执行编译生成的可执行文件
    ```
#### 2.1.2 为新工程的添加.c/.h文件路径

1. 创建.c/.h文件
    ```shell
    mkdir inc2 src2
    touch inc2/inc2.h src2/src2.c
    ```
2. src2.c和inc2.h文件以及main.c文件的内容
    src2.c文件：
    ```c
    #include "inc2.h"

    int hello_world(void)
    {
        printf("hello world~~\n");

        return 0;
    }
    ```
    inc2.h文件：
    ```h
    #ifndef __INC2_H
    #define __INC2_H
    #include <stdio.h>

    int hello_world(void);

    #endif
    ```

    main.c文件：
    ```c
    #include "inc2.h"

    int main()
    {
        hello_world();
        return 0;
    }
    ```
3. 更新CMakeLists配置

    这时候编译会提示找不到.c文件，因为还没有将新加的文件路径更新SDK中

    添加头文件路径的方法：
    ```cmake
    # 方法1，在ADD_INCLUDE后面添加目标头文件路径，list会将该路径下的所有文件加入到ADD_INCLUDE变量中
    list(APPEND ADD_INCLUDE "include" "inc2")

    # 方法2，在ADD_PRIVATE_INCLUDE后添加目标文件路径，list会将该路径下的所有文件加入到ADD_PRIVATE_INCLUDE变量中，这个变量是私有的，不会被其他模块获取
    list(APPEND ADD_PRIVATE_INCLUDE "")
    ```

    添加C文件路径的方法：
    ```cmake
    # 方法1，在ADD_SRCS中依次加入C文件，list会将所有C文件加入到ADD_SRCS变量中
    list(APPEND ADD_SRCS  "src/main.c"
                        "src/test.c"
        )

    # 方法2，在ADD_SRCS前加入C文件的目录，cmake会将该目录的源文件加入到ADD_SRC变量中。注意，每个目录都需要新调用一次该函数
    aux_source_directory(src ADD_SRCS)
    aux_source_directory(src2 ADD_SRCS)

    # 方法3，在ADD_SRCS后加如C文件的目录，该脚本会将目录中的源文件加入到ADD_SRC变量中
    append_srcs_dir(ADD_SRCS "src" "src2")
    ```

    > Tips:还有一个操作是`list(REMOVE_ITEM COMPONENT_SRCS "src/test.c")`，猜测是移除组件中的某些源文件，防止与本地相同名字的源文件冲突。
4. 编译并执行

    ```shell
    cd build && cmake .. && make && make -j8 && ./test
    ```
#### 2.1.3 创建子模块

通过子模块可以让代码更易移植，简化代码结构。
子模块其实和上面的工程中的配置很相似，目录结构大致为：
```
--- include         头文件目录
--- include_private 私有头文件目录(其实只是CmakeLists配置上的区别)
--- lib             库文件目录
--- src             源文件目录
--- CMakeLists      Cmake编译配置文件
--- Kconfig         Menuconfig配置文件
```

1. 创建新的子模块
    为了方便，直接复制已存在的模块
    ```shell
    # 复制component2到新模块
    cp component2 component_test -r

    # 重命名新模块的文件
    mv include/lib2.h include/component_test.h
    mv include_private/lib2_private.h include_private/component_private_test.h
    mv src/lib2.c  src/component_test.c

    # 修改新模块文件内的函数
    # 略
    ```
2. 配置子模块
    配置子模块也就是配置CMakeLists.txt文件，这里除了配置头文件和源文件的路径外，还增加添加依赖模块和注册本模块的方法。
    ```cmake
    # 配置头文件和源文件
    list(APPEND ADD_INCLUDE "include")
    list(APPEND ADD_PRIVATE_INCLUDE "include_private")
    append_srcs_dir(ADD_SRCS "src")

    # 添加依赖模块，在ADD_REQUIREMENTS后面添加需要依赖的模块名，这个名字是模块的文件名
    list(APPEND ADD_REQUIREMENTS component1)

    # 注册本模块，注册模块后就可以被其他模块添加和使用
    register_component()
    ```

3. 使用,按上面添加依赖模块的方法，在工程main文件下的CMakeList文件中注册component_test模块,此时即可通过component_test模块的头文件调用api。

    ```cmake
    list(APPEND ADD_REQUIREMENTS component_test)
    ```
    > Tips:component_test文件的component_private_test文件夹下的头文件不能被工程调用，因为在配置该子模块的头文件目录时被添加到了私有变量ADD_PRIVATE_INCLUDE中。

#### 2.1.4 自定义menuconfig选项

通过`make menuconfig`命令可以打开menuconfig图形配置界面，在这个界面可以快速裁剪和配置模块。
通过编辑KConfig文件来自定义menuconfig选项

config字段：创建一个变量，该变量添加前缀CONFIG_后可以被CMakeList识别，可以用来控制CMake的编译动作
```kconfig
config COMPONENT_TEST_ENABLE      # 变量名，Cmake使用   CONFIG_COMPONENT_TEST_ENABLE可以访问该变量的值
    bool    "config的名称"
    default n       # 默认值，填x or y
    help
        这里填写config的详细说明
    depends on COMPONENT_TEST_MENUCONFIG    # 只是config依赖于变量COMPONENT_TEST_MENUCONFIG
endconfig
```

menu字段：创建一个目录
```kconfig
menu "menu的名称"
    visible if COMPONENT_TEST_ENABLE # 指示menu依赖于变量COMPONENT_TEST_ENABLE
    xxx
endmenu
```

menuconfig字段：既是menu，又是config
```kconfig
menuconfig COMPONENT_TEST_MENUCONFIG
    bool "component test menuconfig"
    default n
```

choice字段：列出一系列选项
```kconfig
choice COMPONENT2_TEST_STR
    prompt "Component2 test string"         # 附加信息
    depends on COMPONENT_TEST_MENUCONFIG    # 依赖
    defaule CHOICE1                         # 默认值
    help
        详细说明信息
    config CHOICE1
        bool "choice1"
    config CHOICE2
        bool "choice2"
    config CHOICE3
        bool "choice3"
endchoice
```

另外还有mainmenu（主菜单）、comment（注释）、if/endif（条件判断）、source（导入其他Kconfig），以后用到再看。参考文章[KConfig使用介绍](https://blog.csdn.net/qq_23274715/article/details/104880443)