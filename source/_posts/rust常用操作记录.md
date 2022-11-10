---
title: rust命令记录
date: 2021-10-13 14:31:44
tags:
---

# rust命令记录

#### rustup命令

命令	描述
rustup default nightly	将默认的工具链设置为最新的日更版。
rustup set profile minimal	设置默认的 "profile"（见 profiles）。
rustup target list	列出活动工具链的所有可用目标
rustup target add arm-linux-androideabi	安装Android目标
rustup target remove arm-linux-androideabi	删除Android目标
rustup run nightly rustc foo.rs	无论活动的工具链如何，都要运行日更版运行。
rustc +nightly foo.rs	运行日更版编译器的速记方法
rustup run nightly bash	运行为日更版编译器配置的外壳
rustup default stable-msvc	在 Windows 上，使用 MSVC 工具链而不是 GNU。
rustup override set nightly-2015-04-01	对于当前目录，使用特定日期的日更版编译器
rustup toolchain link my-toolchain "C:\RustInstallation"	通过符号链接现有的安装程序来安装一个自定义的工具链。
rustup show	显示当前目录下将使用的工具链
rustup toolchain uninstall nightly	卸载一个指定的工具链
rustup toolchain help	显示一个子命令（如toolchain）的帮助页面
rustup man cargo	(仅适用于Unix) 查看指定命令（如cargo）的手册页面
配置文件

#### 解决Rust更新速度慢的问题，提示"Updating crates.io index"

[参考](https://blog.csdn.net/rznice/article/details/112424406)


在 $HOME/.cargo/config 中添加如下内容：
```shell
# 放到 `$HOME/.cargo/config` 文件中
[source.crates-io]
#registry = "https://github.com/rust-lang/crates.io-index"

# 替换成你偏好的镜像源
replace-with = 'tuna'
#replace-with = 'sjtu'

# 清华大学
[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"

# 中国科学技术大学
[source.ustc]
registry = "git://mirrors.ustc.edu.cn/crates.io-index"

# 上海交通大学
[source.sjtu]
registry = "https://mirrors.sjtug.sjtu.edu.cn/git/crates.io-index"

# rustcc社区
[source.rustcc]
registry = "git://crates.rustcc.cn/crates.io-index"
```

