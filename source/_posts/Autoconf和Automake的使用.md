---
title: Autoconf和Automake的使用
date: 2021-11-24 22:01:50
tags:
---

# 使用Autoconf和Automake搭建自己的库

​	对于想做开放源代码软件的开发人员，使用autoconf和automake工具可以帮助我们自动的生成符合自由软件惯例的Makefile，实现使用`./configure`，`make`，`make install`来编译和安装程序。

安装依赖

```
sudo apt install autoconf automake libtool
```

这个过程中会使用到命令有：autoscan(autoconf)，aclocal(automake)，autoheader(autoconf)，autoconf，automake命令，下面先介绍这些命令

## 简介

#### autoscan(autoconf)

autoscan是用来扫描源码目录来生成一个configure.scan文件，这个文件在后续步骤中会被改名为configure.ac（或configure.in）。默认源码目录为当前目录。

关于configure.ac的配置项可以参考下面内容：

| 标签             | 功能                                                         |
| ---------------- | ------------------------------------------------------------ |
| AC_PREREQ        | 声明autoconf要求的版本号。                                   |
| AC_INIT          | 定义软件名称、版本号、联系方式                               |
| AM_INIT_AUTOMAKE | 必须要的                                                     |
| AC_CONFIG_SCRDIR | 宏用来侦测所指定的源码文件是否存在, 来确定源码目录的有效性.。此处为当前目录下main.c |
| AC_CONFIG_HEADER | 宏用于生成config.h文件，以便autoheader命令使用。             |
| AC_PROG_CC       | 指定编译器，默认是GCC                                        |
| AC_CONFIG_FILES  | 生成相应的Makefile文件，不同文件夹下的Makefile通过空格分隔。例如：AC_CONFIG_FILES([Makefile, src/Makefile]) |
| AC_OUTPUT        | 用来设定 configure 所要产生的文件，如果是makefile，configure 会把它检查出来的结果带入makefile.in文件产生合适的makefile。 |

#### aclocal(automake)

该命令根据用户定义的宏和acinclude.m4文件的宏，将configure.ac文件所需要的宏定义到文件aclocal.m4中

#### autoheader(autoconf)

该命令根据configure.ac和acconfig.h文件生成config.h.in文件，其中acconfig.h由用户定义

#### automake

该命令会根据Makefile.am中的配置建立Makefile.in，然后执行configure将生成的Makefile.in转换为Makefile，一般使用`automake --add-missing`，它会补全软件需要的必须文件。

关于Makefile.am文件，这个文件由用户手动创建，配置内容见下文：

```shell
# 标准检查
AUTOMAKE_OPTIONS = foreign

# 定义子目录
SUBDIRS = .

# 定义可执行文件名（有多个可执行文件时，用空格隔开）
bin_PROGRAMS = hello_bin

# 指定可执行文件依赖的文件，与bin_PROGRAMS定义的执行文件对应
hello_bin_SOURCES = main.c

# 定义依赖的库
# xxx_DEPENDENCIES = 
# xxx_LDADD = 

# 定义依赖库的源文件
# xxx_SOURCES = 

# 定义install时不被导出的库
noinst_LTLIBRARIES = 

# 定义install时不被导出的文件
noinst_HEADERS = 
```

#### autoconf

该命令会将configure.ac的宏展开来生成configure。



## 编写简单的程序

1. 编写一个c文件

   ```c
   vim main.c
       
   // 内容
   #include <stdio.h>
   
   int main(int argc, char *argv[])
   {
       printf("Hellor autotools\n");
   
       return 0;
   }
   ```

2. 运行`autoscan`，运行后会生成configure.scan，将文件名改为configure.ac，并修改文件内容

   ```shell
   autoscan
   mv configute.scan configure.ac
   vim configure.ac
   
   # 修改内容
   #                                               -*- Autoconf -*-
   # Process this file with autoconf to produce a configure script.
   
   AC_PREREQ([2.69])
   AC_INIT([my-test-pack], [0.0.1], [lxowalle@outlook.com])
   AC_CONFIG_SRCDIR([main.c])
   AC_CONFIG_HEADERS([config.h])		# 存在这行内容时，必须执行autoheader命令
   AM_INIT_AUTOMAKE					# 必须添加
   # Checks for programs.
   AC_PROG_CC
   
   # Checks for libraries.
   
   # Checks for header files.
   
   # Checks for typedefs, structures, and compiler characteristics.
   
   # Checks for library functions.
   
   AC_CONFIG_FILES([Makefile])
   AC_OUTPUT
   ```

3. 运行`aclocal`，运行后成aclocal.m4文件

4. 运行`autoheader`，运行后生成config.h.in，这个文件会在./configure时被引用

5. 运行`autoconf`，运行后生成configure文件

6. 创建并编写Makefile.am文件

   ```shell
   # 标准检查
   AUTOMAKE_OPTIONS = foreign
   
   # 定义自目录
   SUBDIRS = .
   
   # 定义可执行文件名（有多个可执行文件时，用空格隔开）
   bin_PROGRAMS = hello_bin
   
   # 指定可执行文件依赖的文件，与bin_PROGRAMS定义的执行文件对应
   hello_bin_SOURCES = main.c
   
   # 定义依赖的库
   # xxx_DEPENDENCIES = 
   # xxx_LDADD = 
   
   # 定义依赖库的源文件
   # xxx_SOURCES = 
   
   # 定义install时不被导出的库
   noinst_LTLIBRARIES = 
   
   # 定义install时不被导出的文件
   noinst_HEADERS = 
   ```

7. 运行`automake --add-missing`，运行后生成Makefile.in和一些必要文件

8. 运行`./configure`，运行后生成Makefile

9. 运行`make && ./hello_bin`执行程序

10. 完成



运行autoconf出现`possibly undefined macro: AM_INIT_AUTOMAKE`

```shell
运行autoreconf --install
```



## 使用autogen脚本

1. 准备文件

   ```shell
   mkdir autogen_test
   cd autogen_test
   touch autogen.sh && chmod +x autogen.sh
   touch configure.ac
   touch Makefile.am
   
   mkdir src
   cd src
   touch auto_test.c
   touch Makefile.am
   
   # 当前目录结构
   ~/app/gunmake_test/autogen_test » tree                                   
   .
   ├── autogen.sh
   ├── configure.ac
   ├── Makefile.am
   └── src
       ├── auto_test.c
       └── Makefile.am
   ```

2. 添加autogen_test/src/auto_test.c内容

   ```c
   #include <stdio.h>
   
   int main(int argc, char *argv[])
   {
       printf("Hello autogen\n");
   
       return 0;
   }
   ```

3. 添加Makefile.am内容

   ```shell
   # autogen_test/Makefile.am
   SUBDIRS = src
   
   .PHONY: auto_clean
    
   auto_clean: distclean
   	find . -name Makefile.in -exec rm -f {} \;
   	rm -rf autom4te.cache
   	rm -f missing aclocal.m4 config.h.in config.guess config.sub ltmain.sh install-sh configure depcomp compile
   
   # autogen_test/src/Makefile.am
   bin_PROGRAMS=auto_test
   auto_test_SOURCES=auto_test.c
   auto_test_LDADD=
   LIBS=
   INCLUDES=
   ```

4. 添加configure.ac内容

   ```shell
   #                     -*- Autoconf -*-
   # Process this file with autoconf to produce a configure script.
    
   AC_PREREQ([2.69])
   AC_INIT([auto_test],[1.1.0],[lxowalle@outlook.com])
    
   AC_SUBST([PACKAGE_RELEASE],[1.1.0],[lxowalle@outlook.com])
    
   AM_INIT_AUTOMAKE(auto_test,1.0)
   AC_CONFIG_SRCDIR([src/auto_test.c])
   AC_CONFIG_HEADERS([config.h])
   AC_CONFIG_FILES([Makefile
                  src/Makefile])
    
   # Checks for programs.
   AC_PROG_CC
   AC_PROG_LIBTOOL
    
   # Checks for libraries.
    
   # Checks for header files.
   AC_CHECK_HEADERS([stddef.h string.h])
    
   # Checks for typedefs, structures, and compiler characteristics.
   AC_HEADER_STDBOOL
   AC_TYPE_SIZE_T
    
   # Checks for library functions.
   AC_FUNC_REALLOC
   AC_CHECK_FUNCS([memset socket])
    
   AC_OUTPUT
   
   ```

5. 添加autogen.sh内容

   ```shell
   #!/bin/sh
    
   echo
   echo ... auto_test autogen ...
   echo
    
   ## Check all dependencies are present
   MISSING=""
    
   # Check for aclocal
   env aclocal --version > /dev/null 2>&1
   if [ $? -eq 0 ]; then
     ACLOCAL=aclocal
   else
     MISSING="$MISSING aclocal"
   fi
    
   # Check for autoconf
   env autoconf --version > /dev/null 2>&1
   if [ $? -eq 0 ]; then
     AUTOCONF=autoconf
   else
     MISSING="$MISSING autoconf"
   fi
    
   # Check for autoheader
   env autoheader --version > /dev/null 2>&1
   if [ $? -eq 0 ]; then
     AUTOHEADER=autoheader
   else
     MISSING="$MISSING autoheader"
   fi
    
   # Check for automake
   env automake --version > /dev/null 2>&1
   if [ $? -eq 0 ]; then
     AUTOMAKE=automake
   else
     MISSING="$MISSING automake"
   fi
    
   # Check for libtoolize or glibtoolize
   env libtoolize --version > /dev/null 2>&1
   if [ $? -eq 0 ]; then
     # libtoolize was found, so use it
     TOOL=libtoolize
   else
     # libtoolize wasn't found, so check for glibtoolize
     env glibtoolize --version > /dev/null 2>&1
     if [ $? -eq 0 ]; then
       TOOL=glibtoolize
     else
       MISSING="$MISSING libtoolize/glibtoolize"
     fi
   fi
    
   # Check for tar
   env tar -cf /dev/null /dev/null > /dev/null 2>&1
   if [ $? -ne 0 ]; then
     MISSING="$MISSING tar"
   fi
    
   ## If dependencies are missing, warn the user and abort
   if [ "x$MISSING" != "x" ]; then
     echo "Aborting."
     echo
     echo "The following build tools are missing:"
     echo
     for pkg in $MISSING; do
       echo "  * $pkg"
     done
     echo
     echo "Please install them and try again."
     echo
     exit 1
   fi
    
   ## Do the autogeneration
   echo Running ${ACLOCAL}...
   $ACLOCAL 
   echo Running ${AUTOHEADER}...
   $AUTOHEADER
   echo Running ${TOOL}...
   $TOOL --automake --copy --force
   echo Running ${AUTOCONF}...
   $AUTOCONF
   echo Running ${AUTOMAKE}...
   $AUTOMAKE --add-missing --force-missing --copy --foreign
    
   # Run autogen in the argp-standalone sub-directory
   #echo "Running autogen.sh in argp-standalone ..."
   #( cd contrib/argp-standalone;./autogen.sh )
    
   # Instruct user on next steps
   echo
   echo "Please proceed with configuring, compiling, and installing."
   ```

6. 执行autogen.sh

   ```shell
   # 运行结果
   ~/app/gunmake_test/autogen_test » ./autogen.sh                           liuxo@liuxo
   
   ... auto_test autogen ...
   
   Running aclocal...
   Running autoheader...
   Running libtoolize...
   Running autoconf...
   Running automake...
   configure.ac:9: warning: AM_INIT_AUTOMAKE: two- and three-arguments forms are deprecated.  For more info, see:
   configure.ac:9: https://www.gnu.org/software/automake/manual/automake.html#Modernize-AM_005fINIT_005fAUTOMAKE-invocation
   configure.ac:16: installing './compile'
   configure.ac:17: installing './config.guess'
   configure.ac:17: installing './config.sub'
   configure.ac:9: installing './install-sh'
   configure.ac:9: installing './missing'
   src/Makefile.am:5: warning: 'INCLUDES' is the old name for 'AM_CPPFLAGS' (or '*_CPPFLAGS')
   src/Makefile.am: installing './depcomp'
   
   Please proceed with configuring, compiling, and installing.
   ```

7. 执行`./configure && make`，可以看到src目录下出现可执行文件

8. 执行./src/auto_test

9. 完成

## 关于Makefile.am文件的配置

通过Makefile.am文件能自定义目标文件的编译策略，实现灵活的搭建自己的工程。

### Makefile.am的常用全局变量

1. $(top_builddir) 生成目标文件的最上层目录，也就是添加了xxx_PROGRAMS的Makefile.am所在的目录
2. $(top_srcdir) 工程的最顶层目录，也就是第一个Makefile.am所在的目录
3. $(prefix) 安装路径，执行./configure --prefix=xxx可以更新这个变量的值

### Makefile.am的常用内容

我总结了一部分，但是因为实战还没有用到，所以解释简略，等待后续补充更多命令和说明

```make
## 
#   这是一个Makefile.am的模板，只在开发时作为参考使用
##
# noinst_PROGRAMS       = template              #   编译为可执行文件(不安装)
# bin_PROGRAMS          =                       #   编译为可执行文件(安装到bin目录)

# noinst_LIBRARIES      =                       #   编译为库文件(不安装)
# template_LIBRARIES    =                       #   编译为库文件(安装目录与可执行文件相同)
# template_LTLIBRARIES  =                       #   编译为库文件(libtool)(安装目录与可执行文件相同)

# template_SOURCES      = src/main.c \
#                         src/hello1.c \
#                         src/hello2.c \
#                         src/hello3.c          #   目标文件依赖的所有源文件
# noinst_HEADERS        = include/main.h \
#                         include/hello.h       #   目标文件依赖的所有头文件(不安装)
# template_HEADERS      =                       #   目标文件依赖的所有头文件(安装目录与可执行文件相同)

# template_LIBADD       =                       #   编译时需要加载的其他的库
# template_LDADD        =                       #   链接时需要的所有库文件

# template_CPPFLAGS     = -Iinclude             #   c预处理参数
# template_CFLAGS       =                       #   c编译选项
# template_CXXFLAGS     =                       #   c++编译选项

# template_LDFLAGS      =                       #   链接库标志位

# templatedir           =                       #   数据文件的安装目录
# template_DATA         =                       #   数据文件

# EXTRA_DIST            =                       #   需要打包的所有文件
# SUBDIR                =                       #   需要递归处理的目录(会找到Makefile.am并执行，注意先后顺序)

# AUTOMAKE_OPTIONS      = subdir-objects        #   AUTOMAKE编译选项,详情见(https://www.gnu.org/software/automake/manual/html_node/List-of-Automake-options.html)

# 编译动态库的方式
# projectlibdir=$(libdir)           //新建一个目录，就是该目录就是lib目录
# projectlib_PROGRAMS=project.so
# project_so_SOURCES=xxx.C
# project_so_LDFLAGS=-shared -fpic //GCC编译动态库的选项
```

### 遇到的问题

问题1：

```
apps/template/Makefile.am:11: warning: source file 'src/main.c' is in a subdirectory,
apps/template/Makefile.am:11: but option 'subdir-objects' is disabled
```

检查生成的库文件名是否正确，例如配置为`noinst_PROGRAM = template`和`template_SOURCES = src/main.c`，则检查txxx_SOURCES中的xxx是否正确

问题2:

```
apps/template/Makefile.am:11: warning: source file 'src/main.c' is in a subdirectory,
apps/template/Makefile.am:11: but option 'subdir-objects' is disabled
```

生成Makefile时添加参数`./configure  --disable-dependency-tracking`



参考文章：

[Linux下autoconf和automake使用](https://www.laruence.com/2009/11/18/1154.html)

[Linux | C語言開發 | 自動編譯工具autoconf、automake | MakeFile](https://tw511.com/a/01/9109.html)

[autotools 自动编译系列简介](https://blog.csdn.net/smilejiasmile/article/details/115423035)

[Makefile.am文件的实例讲解](https://blog.csdn.net/zmxiangde_88/article/details/8024223)
