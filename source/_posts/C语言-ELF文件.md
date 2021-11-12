---
title: C语言-ELF文件
date: 2021-11-11 20:36:31
tags:
---

# C语言-ELF文件

在某些时候必须要通过内存地址来寻找代码BUG时，可以通过分析ELF文件来定位问题

## 一、ELF文件简述

ELF文件就是ELF格式的文件。ELF全名为`Executable and Linkable Format`(可执行和链接格式)，是一种文件格式，主要有3类：

- 可重定向文件
- 共享库文件
- 可执行文件

**可重定位文件**：该类型文件主要用来保存二进制代码和数据，可以被其他目标文件链接成可执行文件或共享库。一般是.o文件，.a和.so文件也属于可重定位文件。
**共享库文件**：是特殊的可重定位文件，可以在加载或运行时被动态的加载进内存并链接。一般为.so文件
**可执行文件**：该类型主要保存直接加载到内存就能执行的二进制数据

## 二、ELF文件组成

ELF文件主要由4部分构成：

- ELF Header
- ELF Program Header Table
- ELF Sections
- ELF Section Header Table

### 2.1 ELF Header

ELF Header存在于ELF文件的头部，可以通过一个结构体来解析头部信息,也可以直接使用`readelf`命令来获取头部信息：

1. 通过命令获取ELF Header信息

```shell
readelf -h Ai_Module_Lib	# 读取elf文件的头部信息
```

2. 通过结构体获取ELF Header信息

```c
#define EI_NIDENT 16
 
typedef struct {                             
    unsigned char e_ident[EI_NIDENT];    //包含一个magic number、ABI信息，该文件使用的平台、大小端规则        
    uint16_t      e_type;                //文件类型，表示该文件属于可执行文件、可重定位文件、core dump文件或共享库    
    uint16_t      e_machine;             //机器类型，ELF文件的CPI平台属性    
    uint32_t      e_version;             //通常都是1    
    ElfN_Addr     e_entry;               //表示程序执行的入口地址    
    ElfN_Off      e_phoff;               //表示Program Header的入口偏移量（以字节为单位）    
    ElfN_Off      e_shoff;               //表示Section Header的入口偏移量（以字节为单位）    
    uint32_t      e_flags;               //保存了这个ELF文件相关的特定处理器的flag    
    uint16_t      e_ehsize;              //表示ELF Header大小（以字节为单位）    
    uint16_t      e_phentsize;           //表示Program Header大小（以字节为单位）   
    uint16_t      e_phnum;               //表示Program Header数量（十进制）   
    uint16_t      e_shentsize;           //表示Section Header大小（以字节为单位）    
    uint16_t      e_shnum;               //表示Section Header数量（十进制）    
    uint16_t      e_shstrndx;            //表示字符串表的索引，字符串表用来保存ELF文件中的字符串，如段名，变量名。然后通过字符串在表中的偏移访问字符串
}ElfN_Ehdr;
 
ElfN_Addr    Unsigned program address,uintN_t
ElfN_OFF     Unsigned file offset,uintN_t
```

### 2.2 Program Header Table

Program Header Table下面简称为程序表头。了解程序表头前需要稍微了解一下Section，ELF会按照目标文件的功能来划分为不同的部分（Section），又会根据Sections的内容是否存在读写属性而划分为不同的段（Segment），程序表头描述了各个段（Segment）在ELF文件中的位置以及程序执行过程中徐通需要准备的其他信息。

我们可以通过一个结构体来解析程序表头,也可以直接使用`readelf`命令来获取程序表头信息：

1. 通过命令获取程序表头信息

```shell
readelf -l Ai_Module_Lib 	# 读取程序表头信息
```

2. 通过结构体获取程序表头信息

```c
typedef uint64_t Elf64_Addr;
typedef uint64_t  Elf64_Off;
typedef uint32_t  Elf64_Word;
typedef uint64_t  Elf64_Xword;
 
typedef struct {
    Elf64_Word      p_type;         // 4    //描述了当前segment是何种类型的或者如何解释当前segment，比如是动态链接相关的或者可加载类型等
    Elf64_Word      p_flags;        // 4    //保存了该segment的flag
    Elf64_Off       p_offset;       // 8    //表示从ELF文件到该segment第一个字节的偏移量
    Elf64_Addr      p_vaddr;        // 8    //表示该segment的第一个字节在内存中的虚拟地址
    Elf64_Addr      p_paddr;        // 8    //对于使用物理地址的系统来讲，这个成员表示该segment的物理地址
    Elf64_Xword     p_filesz;       // 8    //表示该segment的大小，以字节表示
    Elf64_Xword     p_memsz;        // 8    //表示该segment在内存中的大小，以字节表示
    Elf64_Xword     p_align;        // 8    //表示该segment在文件中或者内存中需要以多少字节对齐
} Elf64_Phdr;
```

### 2.3 Sections

在ELF文件中，将数据和代码分开存放，根据数据和代码的功能划分成不同的Section。比较典型的Section有：

1. .text

    保存了一段程序代码指令，保存在text段。

2. .rodata

    保存了只读的数据。由于.rodata是只读的，只能存在可执行文件的只读段中。因此.rodata保存在text段。

3. .data

    保存了初始化的全局变量，静态变量等数据。保存在data段。

4. .bss

    保存了未初始化的全局变量，静态变量。程序加载时会被初始化为0。保存在data段。

5. .sysmtab

    符号表，保存了程序中定义、引用的函数和全局变量的信息

6. .debug

    调试符号表，需要使用'-g'编译选项后才能得到，保存了程序中定义的局部变量和类型定义、定义和引用的全局变量以及原始的C文件

7. .line

    保存C文件行号和.text中机器指令之间的映射

8. .strtab

    符号字符串表，保存内容包括.symtab和.debug的符号表

9.  .rel.text

    对于可重定义位文件，在编译时不能确定自身引用的外部函数和变量的地址信息，因此编译器生成目标文件是增加了.rel.text来保存程序中引用的外部函数的重定位信息，这些信息用于在链接时重定位其对应的符号。可执行文件不存在.rel.text

10. .rel.data

    对于可重定义位文件，在编译时不能确定自身引用的外部函数和变量的地址信息，因此编译器生成目标文件是增加了.rel.data来保存程序中引用的全局变量的重定位信息，这些信息用于在链接时重定位其对应的符号。可执行文件不存在.rel.data

11. .init

    可执行文件才存在.init，保存了程序运行前的初始化代码

### 2.4 Section Header Table

Section Header Table下面简称节表头。节表头保存了Section的大小和位置等具体信息。

我们可以通过一个结构体来解析程序表头,也可以直接使用`readelf`命令来获取节表头信息：

1. 通过命令获取节表头信息

```shell
readelf -S Ai_Module_Lib 	# 读取节表头信息
```

2. 通过结构体获取节表头信息

```c
typedef struct {     
    uint32_t   sh_name;         //section的名字是一个字符串，保存在 .shstetab 字符串表中，该section的名字相对于.shstrtab section的地址偏移量     
    uint32_t   sh_type;         //该section中存放的内容类型，比如符号表，可重定位段等     
    uint64_t   sh_flags;        //该section的一些属性，如是否可写，可执行等      
    Elf64_Addr sh_addr;         //该section在程序运行时的内存地址（虚拟地址）。如果该节可被加载，则是被加载后在进程地址空间中的虚拟地址，否则为0 
    Elf64_Off  sh_offset;       //该section相对于ELF文件起始地址的偏移量   
    uint64_t   sh_size;         //该section的大小 
    uint32_t   sh_link;         //配合 sh_info 保存section的额外信息 
    uint32_t   sh_info;         //保存该section相关的一些额外信息 
    uint64_t   sh_addralign;    //表示该section需要的地址对齐信息     
    uint64_t   sh_entsize;      //有些section里保存的是一些固定长度的条目，比如符号表。对于这些section来讲，sh_entsize保存的就是这些条目的长度  
} Elf64_Shdr;
```

参考文章：

[ELF文件详解](https://blog.csdn.net/wyzworld/article/details/114805643)