---
title: C语言-可变参数应用
date: 2021-11-10 20:24:28
tags:
---

# C语言-可变参数应用

由Linux的ioctl函数想到使用可变参数可以固定一些功能的接口，简化封装API的难度。

## 1.1 实现可变参数的原理

可变参数的原理很简单，首先要知道3个概念：
- 栈的地址是由高向低分配
- 函数的参数是从右往左取出，并依次压入栈中
- 压栈时会进行sizeof(int)字节对齐

从上面3个概念可以发现，只要知道一个参数的压栈后的地址，以及该参数占用地址大小，就可以通过减法推算出下一个参数的地址，可变参数实现就是这样。由于需要知道第一个参数的数据结构大小，所以要实现可变参数就必须有一个固定参数。

这里有一组宏专门用来简化可变参数的实现，`va_start(ap, A)` `va_arg(ap, T)` `va_end(ap)`,一般使用方法如下：
```c
#include "stdarg.h"

void test(int arg, ...)
{
    va_list ap;         // 声明一个参数列表
    va_start(ap, arg);  // 初始化ap，将参数arg右边第一个参数的地址赋给ap

    int a = va_arg(ap, int);            // 声明当前参数为int类型，并获得第一个可变参数的值
    double b = va_arg(ap, double);      // 声明当前参数为double类型，并获得第二个可变参数的值
    void *c = va_arg(ap, void*);        // 声明当前参数为void *类型，并获得第三个可变参数的值

    // 依次轮询所有的可变参数
    // ...

    va_end(ap);         // 注释掉ap指针
}
```
PS:
> 黑客就是在堆栈中修改函数返回地址,执行自己的代码来达到执行自己插入的代码段的目的

## 1.2 编写可变参数函数

测试案例一

1. 编写可变参数函数
```c
#include "stdarg.h"
static int test_ctl1(char *fmt, ...)
{
    va_list ap;
    va_start(ap, fmt);

    printf("%d ", va_arg(ap, int));
    printf("%d ", va_arg(ap, int));
    printf("%s\n", va_arg(ap, char*));

    va_end(ap);
}
```
2. 调用可变参数函数

```c
test_ctl1("%d %d %s\n", (int)1, (int)2, "hello");
```

3. 输出结果

```c
1 2 hello
```

测试案例二
1. 编写可变参数函数

下面的可变参数测试了传入两个int类型，或两个double类型、或两个void*类型可变参数的情况

```c
#include "stdarg.h"

typedef struct
{
    int a;
    double b;
    char str[30];
}test_type_t;

static int test_ctl2(char *obj, int cmd, ...)   // 这里cmd其实没有用到
{
    va_list ap;
    va_start(ap, cmd);

    if (!strcmp(obj, "int"))
    {
        printf("%d ", va_arg(ap, int));
        printf("%d\n", va_arg(ap, int));
    }
    else if (!strcmp(obj, "double"))
    {
        printf("%f ", va_arg(ap, double));
        printf("%f\n", va_arg(ap, double));
    }
    else if (!strcmp(obj, "string"))
    {
        printf("%s ", va_arg(ap, char*));
        printf("%s\n", va_arg(ap, char*));
    }
    else if (!strcmp(obj, "void"))
    {
        test_type_t *test1 = va_arg(ap, void*);
        printf("%d  %f  %s\n", test1->a, test1->b, test1->str);

        test_type_t *test2 = va_arg(ap, void*);
        printf("%d  %f  %s\n", test2->a, test2->b, test2->str);
    }

    va_end(ap);
}
```
2. 调用可变参数函数

```c
test_ctl2("int", 0, 1, 2);
test_ctl2("double", 0, 3.4, 5.6);
test_ctl2("string", 0, "123", "456");

test_type_t test1 = 
{
    .a = 10,
    .b = 13.14,
    .str = "PASS"
};

test_type_t test2 = 
{
    .a = 3,
    .b = 3.14,
    .str = "FAIL"
};
test_ctl2("void", 0, &test1, &test2);
```
3. 输出结果
```c
1 2                     
3.400000 5.600000
123 456
10  13.140000  PASS
3  3.140000  FAIL
```


参考文章：

[C语言可变参数的原理和应用](https://cloud.tencent.com/developer/article/1769446)
[C语言中可变参数函数实现原理](https://zhuanlan.zhihu.com/p/26712052)