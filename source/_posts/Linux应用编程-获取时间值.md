---
title: Linux应用编程-获取时间值
date: 2021-11-09 16:52:44
tags: Linux
---

# Linux应用编程-获取时间值

获取时间值可以用来同步任务，或者控制任务的执行时间。下面记录了4种方法，常用time()获取精度为秒的时间，gettimeofday获取精度为毫秒的时间，clock_gettime()获取精度为纳秒的时间

## 使用time()获取系统时间

time()可以方便的获取当前时间，精度为秒。

```c
/* 获取当前时间，写法1 */
t = time(NULL);   // 精度s

/* 获取当前时间，写法2 */
time(&t);
```

PS：打印时间的方式
```c
time(&t);   // 精度s
printf("t :%lds\n", t);

// 打印时间 方法1
struct tm *p_tm;
p_tm = gmtime(&t);
printf("t is:%d:%d:%d\n", p_tm->tm_hour, p_tm->tm_min, p_tm->tm_sec);

// 打印时间 方法2
p_tm = localtime(&t);
printf("t is:%d.%d.%d  %d:%d:%d\n",
    (1900 + p_tm->tm_year), (1 + p_tm->tm_mon), p_tm->tm_mday, p_tm->tm_hour, p_tm->tm_min, p_tm->tm_sec);

// 打印时间 方法3
printf("t is:%s\n", ctime(&t));
```

## 使用clock()获取程序运行时间

```c
clock_t start, end;
/* 获取程序当前占用cpu的时间，保存到start */
start = clock() / CLOCKS_PER_SEC;    

/* 获取程序当前占用cpu的时间，保存到end */
end = clock() / CLOCKS_PER_SEC;   

/* 比较两个时间的间隔,保存到t */
double t = difftime(start, end);
printf("diff:%f\n", t);
```

## 使用gettimeofday()获取系统时间

使用gettimeofday()获取时间，实际时间值是结构体两个成员转换后之和,精度为微秒。

```c
#include <sys/time.h>

/* 获取当前时间，并转换为毫秒 */
struct timeval t;
gettimeofday(&t, NULL);
uint64_t time_ms = t.tv_sec * 1000 + t.tv_usec / 1000; // 获取实际时间，单位毫秒

/* 打印结构体成员的值 */
printf("%lds  %ldus\n", t.tv_sec, t.tv_usec);   // 获取当前时间，精度可以到us
```

## 使用clock_gettime()获取当前时间

这是个使用上很灵活，并且精度很高的方法，精度纳秒

```c
#include <time.h>

struct timespec time1;

// 获取系统时间
clock_gettime(CLOCK_REALTIME, &time1);
printf("CLOCK_REALTIME: %d, %d\n", time1.tv_sec, time1.tv_nsec);

// 获取系统重启到现在的时间
clock_gettime(CLOCK_MONOTONIC, &time1);     
printf("CLOCK_MONOTONIC: %d, %d\n", time1.tv_sec, time1.tv_nsec);

// 获取系统重启到现在的时间
clock_gettime(CLOCK_MONOTONIC_RAW, &time1);
printf("CLOCK_MONOTONIC_RAW: %d, %d\n", time1.tv_sec, time1.tv_nsec);

// 获取进程运行的时间
clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &time1);
printf("CLOCK_PROCESS_CPUTIME_ID: %d, %d\n", time1.tv_sec,
    time1.tv_nsec);

// 获取线程运行的时间
clock_gettime(CLOCK_THREAD_CPUTIME_ID, &time1);
printf("CLOCK_THREAD_CPUTIME_ID: %d, %d\n", time1.tv_sec,
    time1.tv_nsec);

printf("ts is:%s\n", ctime(&ts));
```
