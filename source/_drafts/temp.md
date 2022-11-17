---
title: temp
tags:
---

```
mount -o rw,remount /dev/root
```

```
fseek(fdopen(ts->fd, "a"), SEEK_END, 0);
```

#### 似乎有点看头的Rust教程，点击[这里](https://rust-book.junmajinlong.com/ch1/01_expression.html)跳转


#### 操作系统概述
1. 准备环境
    架构：x86  CISC指令集，运行快，功耗高(为了兼容导致寄存器)
        arm  RISC指令集，运行慢，功耗低
        RISC-V 基于RISC指令集的开源指令集
    CPU：指令执行效率、数据寄存效率、指令寄存效率
    内存：32位理论支持最大4G，64位理论最大支持16EB（也就是17179869184个G），实际只用了48位，对应支持最大内存256TB
    硬盘/ROM：保存程序和其他数据
2. 启动操作系统
    步骤1：上电
    步骤2：执行BIOS。BIOS只有1M内存空间，其中0xF0000~0xFFFFF地址(64K)映射到ROM，ROM里面保存了BIOS的执行程序，程序的内容会检查一些系统硬件是否正常，以及设置中断向量表和中断服务程序，用来应对需要使用鼠标或键盘的情况，程序初始化完外设后开始启动引导扇区boot.img
    步骤3：启动引导扇区（boot.img）。boot.img保存在启动盘的第一个扇区(512K)，通常称为主引导记录扇区(MBR)。BIOS程序会将boot.img加载到内存的0x7c00地址处运行。boot.img会加载grub2的另一个镜像core.img。
    步骤4：运行core.img。core.img包括diskboot.img、lzma_decompress.img、kernel.img和各个模块对应的镜像。diskboot.img主要是加载其余的img；lzma_decompress让程序从实模式进入到保护模式，建立分段分页，内存地址扩大；kernel.img提示用户选择需要启动的操作系统
3. 操作系统初始化
    步骤1：初始化进程列表，包括0号进程、1号进程、2号进程
    步骤2：调用trap_init()，初始化中断服务和系统调用
    步骤3：调用mm_init()，初始化内存管理系统
    步骤4：调用sched_init()，初始化调度器
    步骤5：初始化VFS
    步骤6：调用kernel_init（）初始化1号进程init，这是用户态进程的祖先
    步骤7：调用kthreadd初始化2号进程，这是内核进程的祖先
4. 进程创建与运行
    步骤1：从父进程fork一个子进程，再调用exec系统调用执行子程序。exec进入内核态后调用sys_execve->do_execve->load_elf_binary来加载和执行可执行文件(ELF文件)
    步骤2：进程加入到tasks链表中随时准备运行，有几个状态来标识进程：TASK_RUNNING表示进程运行中或等待被运行中，TASK_INTERRUPTIBLE表示进程处于可中断的睡眠状态，TASK_UNINTERRUPTIBLE表示进程处于不可中断的睡眠状态，TASK_KILLABLE表示进程处于只能被KILL的状态，TASK_ZOMBIE表示进程处于僵死状态，TASK_DEAD表示进程处于结束状态。
    步骤3：维护进程的运行消息，例如进程再用户态和内核态消耗的时间、上下文的切换次数等
    步骤4：维护进程的权限控制
    步骤5：进程调度。线程和进程都在一个链表上，可以使用不同的调度算法来调度进程。其中完全公平调度的算法通过vruntime记录每个进程的运行时间，优先运行vruntime占比少的进程，CFS使用了红黑树结构，红黑树的每个节点是一个sched_entity，每个sched_entity都属于一个task_struct表示进程或线程。关于调度的4个时机：
    - 对于用户态进程，系统调用返回时，是一个被抢占的时机
    - 对于用户态进程，中断返回时，是一个被抢占的时机
    - 对于内核态，一般会用preempt_disable和preempt_enable来制造临界区让某些操作不被打断，在调用preempt_disable()时，是一个内核态代码被抢占的时机
    - 内核态中断返回时仍然是内核态，是一个被抢占的时机
5. 内存管理
    步骤1：物理内存的管理。CPU和内存的物理关系有两种：1. 对称多处理器SMP，多个CPU访问通过一个总线访问内存。2.非统一内存访问，CPU访问最近的内存。一般选择第二种方式。

    内存分布。将内存分为多个节点，每个节点用struct pglist_data表示。每个节点分多个区域，一般有ZONE_NORMAL和ZONE_MOVABLE区域，每个区域用struct zone表示。每个区域再分位多个页，每个页大小为4KB。为了方便分配页内存，将连续页作为页块，有1、2、4、8、16、32、64、128、256、512、1024共11类页块，用11个块链表包含。因此一次最大可以申请1024个连续页，对应于4MB的连续内存。每个页块的第一个页的物理地址是该页块大小的整数倍。

    swap，将长时间不使用的内存暂时写到磁盘上，成为换出。可以有效提高物理内存的利用率，一般会通过进程kswapd来完成。

    步骤2：虚拟内存的管理
    将256TB内存(以x86_64为例)分为内核空间和用户空间，用户态下内核空间仍然不能访问。在用户空间，从低位依次保存.text段,.data段,.bss段，然后是堆、内存映射段（可以将依赖的.so文件映射到内存中），最后是栈段。

    内核代码不能访问用户空间的内存。
    用户空间可以访问内核空间，但是需要加锁保护。

    步骤3：虚拟地址和物理地址的映射

    关于页表：
    |虚拟地址|物理地址|
    |-|-|
    |0x00000000|0xD0000000|
    |0x00000400|0xF0000000|

6. 文件系统
    步骤1：文件以块为单位存储，块的大小是扇区大小的整数倍，默认4K。
    步骤2：文件通过索引区索引，每个文件都有一个inode，保存了文件的读写权限、所属用户、所属组、大小、占用块数量、占用块的地址等
    步骤3：文件有缓存区
    步骤4：文件方便管理和查询
    步骤5：维护一套数据结构，保存哪些文件被进程打开和使用。
        打开文件会获得files_struct，这个结构体有文件对应的inode，可以得到file_operation来操作文件，也可以得到dentry(directory entry)来获取inode，通过inode_operations来读写磁盘的文件系统
7. 外设
    层外：硬件设备
    第1层：设备控制器，屏蔽不同硬件的差异
    第2层：驱动程序，屏蔽不同的设备控制器
    第3层：中断控制器，统一外部事件的处理
    第4层：用文件系统屏蔽驱动程序的差异
    IPC通信

#### 解决`Package busybox-init-base-files is missing dependencies for the following libraries: tslib.so.0`问题

由于缺少依赖，但是脚本又没有去绑定依赖，因此可以手动绑定一下依赖。

```shell 
## 修改对应包的Makefile
vim package/busybox-init-base-files/Makefile
define Package/busybox-init-base-files
  SECTION:=base
  CATEGORY:=Base system
  DEPENDS:=+libc +SIGNED_PACKAGES:usign libmaix
  DEPENDS+= @SYSTEM_INIT_BUSYBOX
  DEPENDS+=tslib                    # 在这里添加tslib依赖
  TITLE:=Busybox init base system
  URL:=http://openwrt.org/
  MENU:=1
  VERSION:=$(PKG_RELEASE)-$(REVISION)
endef

## 重新编译，编译过程脚本会将tslib库加入到依赖中
make

## 完成
```

808 SDK内容(20211224)

目录：

```shell
- components
    + freetype                      字体库
    - fs
        +vfs                        虚拟文件系统
    + libc                          c库
    + lvgl                          lvgl gui库
    - network
        + lwip                      网络协议
        + lwip_dhcpd                网络协议dhcpd
        + mjpeg_sender_bl808        发送图片
    - platform
        + hosal                     808驱动(应用层)
        - soc
            + bl808                 808启动程序
            + bl808_c906_freertos   FreeRTOS源码
            + bl808_std             808硬件驱动
    - stage
        + bl_mm                     图像处理
        + blfdt                     设备树
        + blog                      日志
        + cli                       命令行
        + helper                    示例代码？
        + isp                       ISP
        + isp_cli_demo              
        + sensor                    摄像头相关
        + yloop                     AliOS的异步事件框架
        + zmodem                    XMODEM协议中的zmodem协议，用来发送/接收文件
    + utils                         杂项，很多有用的小功能
    + video                         视频相关
+ customer_app
+ make_scripts_riscv
+ make_scripts_thead_riscv
+ toolchain
- version.mk
```

```shell
+ apps
+ driver
- modules
    + fr ota facedb
    + audio camera i2c lcd qrcode rtc gui network
+ third_party
+ docs
+ tools
```




## FreeRTOS

参考资料：
[FreeRTOS参考手册](https://deepinout.com/freertos-tutorials)
[FreeRTOS官方API说明](https://www.freertos.org/a00125.html)

### API应用

**FreeRTOS共有5组：**
- 任务和调度程序相关函数
- 队列相关函数
- 信号量相关函数
- 软件计时器相关函数
- 事件相关函数

**注意事项：**
- 不以FromISR结尾的API禁止在中断服务程序中执行。此外，对于硬件中断的优先级高于configMAX_SYSCALL_INTERRUPT_PRIORITY(或configMAX_API_CALL_INTERRUPT_PRIORITY)的情况，禁止使用任何(包括FromISR结尾)的API，这是确保目标硬件中断的确定性和延时不受FreeRTOS影响。
- 调度程序挂起时，禁止调用可能导致上下文(任务)切换的API
- 在临界区禁止调用可能导致上下文(任务)切换的API

#### 任务和调度程序API

**xTaskAbortDelay()**

将任务从阻塞态退出就绪态。返回pdPASS表示任务从阻塞链表删除，返回pdFAIL表示任务不在阻塞态
在FreeRTOSConfig.h中，INCLUDE_xTaskAbortDelay必须设置为1才能使xTaskAbortDelay()可用。

```c
#include "FreeRTOS.h"
#include "task.h"

BaseType_t xTaskAbortDelay( TaskHandle_t xTask );
```

示例:

示例让句柄为user_handler0的任务从阻塞态退出。

```c
void user_task1(void *param)
{
    BaseType_t res;
    while (1)
    {
        res = xTaskAbortDelay(user_handle0);
        if (res == pdPASS)
        {
            printf("Task was in the blocked, but is not now\n");
        }
        else
        {
            printf("Task is not in the blocked anyway\n");
        }

        vTaskDelay(50);
    }
}
```

**xTaskGetHandle**

根据任务名称，获取任务句柄。

```c
TaskHandle_t handle = xTaskGetHandle("handle");
```

**vTaskSetApplicationTaskTag**

为任务添加标签，也可以添加回调函数。需要在configUSE_APPLICATION_TASK_TAG 定义为 1 时才能使用。

功能：
- 标签(数字):用来记录多任务下不同任务的状态切换等信息
- 回调函数(函数指针):为当前绑定回调函数,在任务in或out时被调用。
(由于是通过一个参数保存pxCurrentTCB->pxTaskTag，因此上述功能只能生效一个)

功能1-标签：

```c
#include "task.h"

void user_task0(void *param)
{
    int a = 0;
    
    while (1)
    {
        vTaskSetApplicationTaskTag(NULL, (void *)a ++);         // 设置当前任务的标签为a
        int tag = xTaskGetApplicationTaskTag(NULL);             // 获取当前任务的标签值
        printf("tag:%d\n", tag);

        vTaskDelay(1000);
    }
}      
```

功能2-回调函数

```c
#include "task.h"

BaseType_t user_task0_hook( void * param)
{
    printf("Hook %d\n", __LINE__);
    
    return 0;
}

void user_task0(void *param)
{
    vTaskSetApplicationTaskTag(NULL, (void *)user_task0_hook);      // 设置钩子函数
    while (1)
    {
        xTaskCallApplicationTaskHook(NULL, 0);                      // 执行钩子函数

        vTaskDelay(1000);
    }
}
```

**xTaskCheckForTimeOut**

进入阻塞态并等待一个事件,如果在超时事件内多次触发该事件，则会调整超时时间但不会重置超时时间。超时后会重置超时时间。

```c
#include "FreeRTOS.h"
#include "task.h"
BaseType_t xTaskCheckForTimeOut( TimeOut_t * const pxTimeOut, 
                                 TickType_t * const pxTicksToWait );
```

**xTaskCreate**

创建一个任务。任务运行内存从FreeRTOS栈中分配。通过configTOTAL_HEAP_SIZE来配置FreeRTOS堆大小，用xPortGetFreeHeapSize()函数查询剩余可用堆的内存量(heap3无法使用)。

```c
#include "FreeRTOS.h"
#include "task.h"
BaseType_t xTaskCreate( TaskFunction_tpvTaskCode,       /* The function that implements the task. */
                        const char* const pcName,       /* The text name assigned to the task - for debug only as it is not used by the kernel. */
                        unsigned shortusStackDepth,     /* The size of the stack to allocate to the task. */
                        void *pvParameters,             /* The parameter passed to the task - not used in this simple case. */
                        UBaseType_t uxPriority,         /* The priority assigned to the task. */
                        TaskHandle_t *pxCreatedTask);   /* The task handle is not required, so NULL is passed. */
```

示例：

```c
static TaskHandle_t user_handle0 = NULL;
BaseType_t res;

void user_task0(void *param)
{
    while (1)
    {
        printf("=>%d\n", __LINE__);
        vTaskDelay(3000);
    }

    vTaskDelete( NULL );
}

res = xTaskCreate(user_task0, "user task0", configMINIMAL_STACK_SIZE, (void *)1, 3, &user_handle0);
if (res == pdPASS)
{
    printf("Create task successfully!\n");
}                     
```

**xTaskCreateStatic**

创建一个任务。任务运行内存由用户自定义分配。使用此函数需要将宏configSUPPORT_STATIC_ALLOCATION定义为1，同时需要实现vApplicationGetIdleTaskMemory()和vApplicationGetTimerTaskMemory()这两个函数

注意任务的优先级范围为[0, `configMAX_PRIORITIES – 1`],如果`configUSE_PORT_OPTIMISED_TASK_SELECTION = 0`，则优先级没有上限。

```c
#include "FreeRTOS.h"
#include "task.h"

TaskHandle_t xTaskCreateStatic( TaskFunction_t pvTaskCode,              /* Function that implements the task. */
                                const char * const pcName,              /* Human readable name for the task. */
                                uint32_t ulStackDepth,                  /* Task's stack size, in words (not bytes!). */
                                void *pvParameters,                     /* Parameter to pass into the task. */
                                UBaseType_t uxPriority,                 /* The priority of the task. */
                                StackType_t * const puxStackBuffer,     /* The buffer to use as the task's stack. */
                                StaticTask_t * const pxTaskBuffer );    /* The variable that will hold that task's TCB. */			
```

示例:

```c
#define STACK_SIZE  (200)
static TaskHandle_t user_handle2 = NULL;
static StaticTask_t xTaskBuffer;
static StackType_t variables;
static StackType_t xStack[STACK_SIZE];

void user_task2(void *param)
{
    while (1)
    {
        printf("=>%d\n", __LINE__);
        vTaskDelay(3000);
    }

    vTaskDelete( NULL );
}

user_handle2 = xTaskCreateStatic(user_task2, "user task2", STACK_SIZE, NULL,  1, xStack, &xTaskBuffer);
if (user_handle2 != NULL)
{
    printf("Create task successfully!\n");
}
```

**vTaskDelete**

删除任务。允许删除自己

注意如果执行vTaskDelete来删除任务，则需要确保空闲任务可以被运行，否则无法释放被删除任务的内存

```c
void vTaskDelete( TaskHandle_t xTaskToDelete );
```

**uxTaskPriorityGet和vTaskPrioritySet**

设置/获取任务的优先级。取值范围是0~(configMAX_PRIORITIES – 1

```c
UBaseType_t uxTaskPriorityGet( const TaskHandle_t xTask );
void vTaskPrioritySet( TaskHandle_t xTask,
                       UBaseType_t uxNewPriority );
```

**vTaskSuspend和vTaskResume**

暂停/恢复任务

```c
void vTaskSuspend( TaskHandle_t xTaskToSuspend );
void vTaskResume( TaskHandle_t xTaskToResume );
```

**vTaskDelay和vTaskDelayUntil**

延时函数。延时时会让任务进入阻塞状态。其中vTaskDelay表示等待指定Tick个时钟后让任务恢复，而vTaskDelayUntil也是等待Tick个时钟，但是更加严格，会等待上次执行vTaskDelayUntil到这次执行vTaskDelayUntil之间的时间

使用pdMS_TO_TICKS(x)宏可以将Tick值转换为毫秒

```c
void vTaskDelay( const TickType_t xTicksToDelay ); /* xTicksToDelay: 等待多少给Tick */

/* pxPreviousWakeTime: 上一次被唤醒的时间
 * xTimeIncrement: 要阻塞到(pxPreviousWakeTime + xTimeIncrement)
 * 单位都是Tick Count
 */
BaseType_t xTaskDelayUntil( TickType_t * const pxPreviousWakeTime,
                            const TickType_t xTimeIncrement );
```

示例
```c
/** 下面是xTaskDelayUntil的使用示例 */
void user_task2(void *param)
{
    TickType_t last_wake_time = xTaskGetTickCount();

    while (1)
    {
        xTaskDelayUntil(&last_wake_time, pdMS_TO_TICKS(4000));
    }
}
```

**空闲任务**

vTaskStartScheduler()函数会在启动调度器时创建空闲任务，空闲任务有以下特点:
- 空闲任务优先级为0
- 空闲任务只会在运行态和就绪态，禁止阻塞空闲任务

可以为空闲任务添加钩子函数，钩子函数的作用：
- 执行一些低优先级、后台的、需要连续执行的函数
- 测量系统的空闲时间。空闲任务能被执行就意味着所有的高优先级任务都停止了，所以测量空闲任务占据的时间，就可以算出处理器占用率。
- 让系统进入省电模式

钩子函数的限制：
- 不允许让空闲任务进入阻塞或暂停状态
- 尽量让空闲任务高效运行，否则空闲任务可能没有时间来释放vTaskDelete删除任务的内存

使用钩子函数需要定义宏configUSE_IDLE_HOOK=1，此外钩子函数固定为`void vApplicationIdleHook(void)`

```c
/** C file */
void vApplicationIdleHook( void )
{
    printf("idle hook\n");
}

/** H file */
void vApplicationIdleHook( void );
```

**调度算法**

使用宏configUSE_PREEMPTION、configUSE_TIME_SLICING和configUSE_TICKLESS_IDLE来配置调度算法

configUSE_PREEMPTION：1 可抢占，0 不可抢占
configUSE_TIME_SLICING：1 时间片轮转，0 非时间片轮转
configIDLE_SHOULD_YIELD：1 空闲任务让步，0 空闲任务不让步

关于可抢占：高优先级的任务就绪后可以立即抢占运行态的低优先级任务。（可抢占调度）
关于不可抢占：高优先级的任务就绪后只能等待运行态任务主动释放资源。（合作调度
时间片轮转：相同优先级的任务会轮流执行，且每个任务每次轮流执行固定时间后会释放CPU让下一个任务执行
非时间片轮转：任务不会主动释放，直到主动释放或被高优先级任务抢占
空闲任务让步：空闲任务每次循环都会检查是否有其他任务执行，并让步给其他任务执行
空闲任务不让步：空闲任务和其他任务调度方式相同

#### 队列

队列在读/写时都会检查是否可读/写，并且在可读写时返回pdTRUE,在不可读写时阻塞，阻塞超时时返回pdFALSE

```c
#include "queue.h"

/* 创建队列 */
QueueHandle_t xQueueCreate( UBaseType_t uxQueueLength,      // 队列项数
                            UBaseType_t uxItemSize );       // 队列每项字节数

/* 删除队列 */
void vQueueDelete( QueueHandle_t xQueue );

/* 清空队列 */
BaseType_t xQueueReset( QueueHandle_t xQueue );

/* 向队列写入数据(与xQueueSendToBack效果相同) */
BaseType_t xQueueSend(  QueueHandle_t xQueue，
                        const void * pvItemToQueue,         // 需要发送的数据的指针(数据被复制到队列上)
                        TickType_t xTicksToWait             // 等待队列可用的阻塞时间
                        );

/* 向队列写入数据，写在队列头部 */
BaseType_t xQueueSendToFront( QueueHandle_t xQueue,
                            const void * pvItemToQueue,     // 需要发送的数据的指针(数据被复制到队列上)
                            TickType_t xTicksToWait );      

/* 从队列取数据 */
BaseType_t xQueueReceive(   QueueHandle_t xQueue,
                            void *pvBuffer,                 // 保存取出数据的指针,数据会被复制到缓冲上
                            TickType_t xTicksToWait);

/* 从队列取数据，但不删除 */
BaseType_t xQueuePeek(  QueueHandle_t xQueue,
                        void *pvBuffer,                 // 保存取出数据的指针,数据会被复制到缓冲上
                        TickType_t xTicksToWait);

/* 为队列分配名称，并将队列添加到注册表 */
void vQueueAddToRegistry(   QueueHandle_t xQueue，
                            char *pcQueueName);

/* 从注册表删除队列 */
void vQueueUnregisterQueue( QueueHandle_t xQueue);

/* 从注册表中查找队列的名称 */
const char *pcQueueGetName( QueueHandle_t xQueue );

/* 队列空闲单元数 */
UBaseType_t uxQueueSpacesAvailable( QueueHandle_t xQueue );      

/* 队列已存在消息数 */
UBaseType_t uxQueueMessagesWaiting( QueueHandle_t xQueue );

/* 向队列覆盖写入数据，一般用来向队列空间总数为1的队列写数据 */
BaseType_t xQueueOverwrite( QueueHandle_t xQueue，
                            const void * pvItemToQueue);

/* 查询队列是否为空  队列空pdTRUE,队列不空pdFALSE*/
BaseType_t xQueueIsQueueEmptyFromISR( const QueueHandle_t xQueue );

/* 查询队列是否已满 队列满pdTRUE,队列不满pdFALSE*/
BaseType_t xQueueIsQueueFullFromISR(const QueueHandle_t xQueue);
```

#### 信号量

由于二进制信号量、计数信号量、互斥量、递归互斥量的API有部分相同，所以API也放到了一起

二进制信号量：
1. 二进制信号量不继承优先级，因此二进制信号量可以无视任务间的优先级进行同步。
2. 多个任务阻塞在同一个二进制信号量时，一般优先级最高的任务优先获得信号量。
3. 二进制信号量使用只容纳一项的队列来实现，通过队列空或者满来同步任务与中断。
4. 中断处理程序总是给出信号量(向队列写)，普通任务总是获取信号量(向队列读)。

计数信号量:
1. 计数信号量与二进制信号量相似，区别是计数信号量可以多次获取资源，直到计数值为0后无法获取资源，直到某个任务释放资源

互斥量：
1. 互斥量用来保护临界资源
2. 互斥量会包含一个优先级继承的机制，因此不允许在中断中使用互斥量
3. 优先级继承机制时为了减少优先级反转的问题，但没有彻底解决

递归互斥量：
1. 递归互斥量与互斥量相似。区别是递归互斥量可以多次被加锁，但对应的也需要进行多次解锁
2. 递归互斥量同样包含优先级继承的机制，因此不允许在中断中使用递归互斥量

```c
#include "semphr.h"

/* 创建信号量/互斥量 */
SemaphoreHandle_t xSemaphoreCreateBinary( void );
SemaphoreHandle_t xSemaphoreCreateCounting( UBaseType_t uxMaxCount,         // 最大计数值
                                            UBaseType_t uxInitialCount);    // 初始计数值
SemaphoreHandle_t xSemaphoreCreateMutex( void );                            
SemaphoreHandle_t xSemaphoreCreateRecursiveMutex( void );            

/* 删除信号量/互斥量(二进制信号量、计数信号量、互斥量、递归互斥量) */
void vSemaphoreDelete( SemaphoreHandle_t xSemaphore );

/* 获取信号量/互斥量(不包括递归互斥量) */
xSemaphoreTake( SemaphoreHandle_t xSemaphore,
                TickType_t xTicksToWait );              // 获取信号/互斥量，不包括递归互斥量
xSemaphoreTakeRecursive( SemaphoreHandle_t xMutex,
                         TickType_t xTicksToWait );     // 获取递归互斥量

/* 释放信号量/互斥量(不包括递归互斥量) */
xSemaphoreGive( SemaphoreHandle_t xSemaphore );         // 释放信号/互斥量，不包括递归互斥量
xSemaphoreGiveRecursive( SemaphoreHandle_t xMutex );    // 释放递归互斥量

/* 查询互斥锁的句柄 */
TaskHandle_t xSemaphoreGetMutexHolder( SemaphoreHandle_t xMutex );

/* 返回信号量的计数值 */
UBaseType_t uxSemaphoreGetCount( SemaphoreHandle_t xSemaphore );


```

### 任务通知

FreeRTOS V8.2.0开始可用，V10.4.0开始支持每个任务有多个通知

```c
#include "task.h"

/* 发起通知 */
BaseType_t xTaskNotifyGive( TaskHandle_t xTaskToNotify );       
BaseType_t xTaskNotifyGiveIndexed( TaskHandle_t xTaskToNotify, 
                                UBaseType_t uxIndexToNotify );  // 任务通知数组的索引数，最大不超过configTASK_NOTIFICATION_ARRAY_ENTRIES

/* 接收通知 */
uint32_t ulTaskNotifyTake( BaseType_t xClearCountOnExit,
                        TickType_t xTicksToWait );

uint32_t ulTaskNotifyTakeIndexed( UBaseType_t uxIndexToWaitOn,    // 任务通知数组的索引数，最大不超过configTASK_NOTIFICATION_ARRAY_ENTRIES
                                BaseType_t xClearCountOnExit，  // 
                                TickType_t xTicksToWait );      

/* 任务通知 */
BaseType_t xTaskNotify( TaskHandle_t xTaskToNotify,
                        uint32_t ulValue，
                        eNotifyAction eAction );

BaseType_t xTaskNotifyIndexed( TaskHandle_t xTaskToNotify, 
                            UBaseType_t uxIndexToNotify, 
                            uint32_t ulValue， 
                            eNotifyAction eAction );
```

### 内存管理

FreeRTOS有自己管理内存的方法。内存管理的实现保存在FreeRTOS/Source/portable/MemMang下，一共5种方式

heap_1.c	分配简单，时间确定	只分配、不回收
heap_2.c	动态分配、最佳匹配	碎片、时间不定
heap_3.c	调用标准库函数	速度慢、时间不定
heap_4.c	相邻空闲内存可合并	可解决碎片问题、时间不定
heap_5.c	在heap_4基础上支持分隔的内存块	可解决碎片问题、时间不定

注意：除了heap_3的内存总大小是由链接器的配置决定，其他内存分配方案使用configTOTAL_HEAP_SIZE宏定义

**pvPortMalloc/vPortFree**

申请和释放内存

```c
void * pvPortMalloc( size_t xWantedSize );
void vPortFree( void * pv );
```

**xPortGetFreeHeapSize**

获取剩余堆内存大小。heap_3不支持该函数。

```c
size_t xPortGetFreeHeapSize( void );
```

**xPortGetMinimumEverFreeHeapSize**

获取堆内存分配过程中，空闲内存最小的值。

```c
size_t xPortGetMinimumEverFreeHeapSize( void );
```

**vApplicationMallocFailedHook**

内存分配失败时的钩子函数，需要定义configUSE_MALLOC_FAILED_HOOK = 1

```c
#define configUSE_MALLOC_FAILED_HOOK    (1)

void vApplicationMallocFailedHook( void )
{
	taskDISABLE_INTERRUPTS();
	for( ;; );
}
```

**栈溢出检查**

定义宏configCHECK_FOR_STACK_OVERFLOW，来开启栈溢出检查。此时需要定义栈溢出的钩子函数来确认是哪个地方栈溢出了。

由于栈溢出检查会引入上下文切换开销，因此在开发/测试阶段外应该禁止该宏。

configCHECK_FOR_STACK_OVERFLOW的值会印象栈检查的方法:

configCHECK_FOR_STACK_OVERFLOW=1,RTOS内核会检查堆栈指针是否处于有效的堆栈空间内，如果越界则调用栈溢出钩子函数
configCHECK_FOR_STACK_OVERFLOW=2,任务在创建时它的堆栈被已知的值填充，让任务退出运行状态时，RTOS内核可以检测栈最后16字节，检查这些已知值是否被其他操作覆盖。如果有覆盖，则调用栈溢出钩子函数。


## 适配ch341转uart的驱动
https://github.com/allanbian1017/i2c-ch341-usb
编译并安装ko后，可以使用iic设备文件来操作ch341a模块

libusb函数说明：https://blog.csdn.net/wince_lover/article/details/70337809
github示例代码：https://github.com/craftor/usb2iic/blob/master/Example/linux/ezusb.c

#### Linux qemu

[linux内核](https://github.com/torvalds/linux)
[利用 qemu 模拟嵌入式系统制作全过程](https://tinylab.org/using-qemu-simulation-inserts-the-type-system-to-produce-the-whole-process/)


**编译内核：**

安装依赖：
```
sudo apt insall bison
```

```shell
git clone https://github.com/torvalds/linux
cd linux
git checkout v5.16
export ARCH=x86
make x86_64_defconfig   # 加载默认配置
make menuconfig         # 修改编译配置
make -j8
```

```shell
# 交叉编译
make -j12 ARCH=arm CROSS_COMPILE=arm-none-linux-gnueabi-
```

---
注：如果环境变量ARCH=x86，则编译生成的内核镜像的路径为arch/x86_64/boot/bzImage



**直接尝试用qemu运行内核**

1. 修改CMDLINE配置，选择启动信息的输出端口为ttyS0,即当前终端的端口

```shell
make menuconfig

# 修改配置(CMDLINE)
 [*] Built-in kernel command line                                
    (console=ttyS0 root=/dev/ram0) Built-in kernel command
```

2. 制作根文件系统

**编译busybox**
```shell
git clone https://github.com/mirror/busybox.git
cd busybox
git checkout origin/1_35_stable
export ARCH=x86
make defconfig
make menuconfig
# 修改为静态编译(STATIC)
Settings  --->
    ---Build Options
    [*] Build static binary (no shared libs)


make -j8
```
-----

注：编译成功后可以在busybox工程的主目录下可以找到可执行文件`busybox`

---



```shell
# 交叉编译
make -j12 ARCH=arm CROSS_COMPILE=arm-none-linux-gnueabi-
```

**编写ramfs中的init程序**

```shell
vim busybox_init.sh
# 内容如下：

#!/bin/sh
echo
echo "###########################################################"
echo "## THis is a init script for initrd/initramfs ##"
echo "## Author: wengpingbo@gmail.com ##"
echo "## Date: 2013/08/17 16:27:34 CST ##"
echo "###########################################################"
echo

# 1. 检查是否存在/bin/busybox命令
PATH="/bin:/sbin:/usr/bin:/usr/sbin"
if [ ! -f "/bin/busybox" ];then
  echo "cat not find busybox in /bin dir, exit"
  exit 1
fi

# 2. 构建根文件系统
BUSYBOX="/bin/busybox"
echo "build root filesystem..."
$BUSYBOX --install -s

# 3、挂载proc文件系统
if [ ! -d /proc ];then
  echo "/proc dir not exist, create it..."
  $BUSYBOX mkdir /proc
fi
echo "mount proc fs..."
$BUSYBOX mount -t proc proc /proc

# 4. 创建/dev目录
if [ ! -d /dev ];then
  echo "/dev dir not exist, create it..."
  $BUSYBOX mkdir /dev
fi
# echo "mount tmpfs in /dev..."
# $BUSYBOX mount -t tmpfs dev /dev

# 5. 挂载devpts文件系统
$BUSYBOX mkdir -p /dev/pts
echo "mount devpts..."
$BUSYBOX mount -t devpts devpts /dev/pts
if [ ! -d /sys ];then
  echo "/sys dir not exist, create it..."
  $BUSYBOX mkdir /sys
fi

# 6. 挂载sysfs文件系统
echo "mount sys fs..."
$BUSYBOX mount -t sysfs sys /sys

# 7. 加载外设
echo "/sbin/mdev" > /proc/sys/kernel/hotplug
echo "populate the dev dir..."
$BUSYBOX mdev -s

# 8. 完成
echo "drop to shell..."
$BUSYBOX sh
exit 0
```

**next**

目前已经准备好了Linux内核镜像，busybox可执行文件，init启动脚本，现在开始考虑根文件系统的目录结构了。kernel支持很多种文件系统，例如：ext4、ext3、ext2、cramfs、nfs、jffs2、reoserfs等，还有一些伪文件系统，例如：sysfs、proc、ramfs等。根文件系统的目录结构标准是由kernel开发者制定的，但这里只考虑了一些必须的目录结构。如下：

```shell
/
├── bin
│   ├── busybox
│   └── sh -> busybox
├── dev
│   └── console
├── etc
│   └── init.d
│       └── rcS
├── init
├── sbin
└── usr
    ├── bin
    └── sbin
```
使用下面的命令来构建上面的文件系统

```shell
mkdir ramfs && cd ramfs

# 创建目录
mkdir -pv bin dev etc/init.d sbin usr/{bin,sbin}

# 添加busybox命令
cp ../busybox/busybox ./bin
ln -s busybox bin/sh

# 创建console字符设备
sudo mknod -m 644 dev/console c 5 1

# 创建启动文件
cp ../busybox_init.sh ./init
touch etc/init.d/rcS
chmod +x bin/busybox etc/init.d/rcS init
```
目前已经有了基本的initramfs，下一步就是制作initramfs镜像并让kernel加载它。我们可以将initramfs直接集成到kernel里，也可以单独加载initramfs。

直接集成到kernel里（未完全测试）
- 使用kernel源码的usr目录下(或scripts目录)的gen_initramfs_list.sh脚本
```shell
cd linux
./usr/gen_initramfs.sh -o ramfs.gz ../ramfs/

make menuconfig
# 修改INITRAMFS_SOUCE来包含ramfs.gz文件
General setup  --->  
   (ramfs.gz) Initramfs source file(s)
```

- 手动制作initramfs并从外部加载

```shell
# 生成ramfs压缩包
find . | cpio -o -H newc | gzip -9 > ramfs.gz

# 运行 
qemu-system-x86_64 \
-kernel linux/arch/x86_64/boot/bzImage \
-nographic \
-initrd ramfs/ramfs.gz
```

至此就可以运行起一个小型的外挂ramfs的Linux系统了



3. 配置物理文件系统，切换根文件系统

​	一般使用initramfs/initrd的场景是为了不违背kernel版本协议，又达到不开源的目的。正常的linux发行版中，在kernel初始化完成后会先挂载initramfs/initrd来加载其他驱动，并做一些初始化设置，然后才会挂载真正的根文件系统。

​	kernel会执行两个init，一个是initramfs的init，另一个是根文件系统的init程序，上面已经完成了第一个init，接下来开始完成第二个init，我们需要挂载物理文件系统，并切换到根文件系统，然后执行init

**使用dd命令生成一个物理磁盘**

```shell
dd if=/dev/zero of=./hda.img bs=16M count=1
mkfs -t ext2 hda.img
mkdir hda
sudo mount hda.img hda
sudo cp -r ramfs/* hda 
sudo umount hda && rm -rf hda	
```

将前面制作的ramfs目录结构拷贝到一个ext2文件系统的磁盘后即完成根文件系统的制作，其中根文件系统的目录以及磁盘格式可以根据实际需求更改。

修改init文件,内容如下：

```shell
#!/bin/sh
echo
echo "###########################################################"
echo "## THis is a init script for sd ext2 filesystem ##"
echo "## Author: wengpingbo@gmail.com ##"
echo "## Date: 2013/08/17 16:27:34 CST ##"
echo "###########################################################"
echo

# 1. 检查是否存busybox命令
PATH="/bin:/sbin:/usr/bin:/usr/sbin"
if [ ! -f "/bin/busybox" ];then
  echo "cat not find busybox in /bin dir, exit"
  exit 1
fi
BUSYBOX="/bin/busybox"

# 2. 构建基本的根文件系统
echo "build root filesystem..."
$BUSYBOX --install -s

# 3. 挂载proc文件系统
if [ ! -d /proc ];then
  echo "/proc dir not exist, create it..."
  $BUSYBOX mkdir /proc
fi
echo "mount proc fs..."
$BUSYBOX mount -t proc proc /proc

# 4. 创建/dev目录
if [ ! -d /dev ];then
  echo "/dev dir not exist, create it..."
  $BUSYBOX mkdir /dev
fi
# echo "mount tmpfs in /dev..."
# $BUSYBOX mount -t tmpfs dev /dev
$BUSYBOX mkdir -p /dev/pts

# 5. 挂载devpts文件系统
echo "mount devpts..."
$BUSYBOX mount -t devpts devpts /dev/pts

# 6. 挂载sysfs文件系统
if [ ! -d /sys ];then
  echo "/sys dir not exist, create it..."
  $BUSYBOX mkdir /sys
fi
echo "mount sys fs..."
$BUSYBOX mount -t sysfs sys /sys

# 7. 热启动
echo "/sbin/mdev" > /proc/sys/kernel/hotplug
echo "populate the dev dir..."

# 8. 加载驱动模块
$BUSYBOX mdev -s

# 9. 挂载根文件系统
echo "dev filesystem is ok now, log all in kernel kmsg" >> /dev/kmsg
echo "you can add some third part driver in this phase..." >> /dev/kmsg
echo "begin switch root directory to sd card" >> /dev/kmsg
$BUSYBOX mkdir /newroot
if [ ! -b "/dev/mmcblk0" ];then
  echo "can not find /dev/mmcblk0, please make sure the sd \
card is attached correctly!" >> /dev/kmsg
  echo "drop to shell" >> /dev/kmsg
  $BUSYBOX sh
else
  $BUSYBOX mount /dev/mmcblk0 /newroot
  if [ $? -eq 0 ];then
        echo "mount root file system successfully..." >> /dev/kmsg
  else
        echo "failed to mount root file system, drop to shell" >> /dev/kmsg
        $BUSYBOX sh
  fi
fi

# 10. 根文件系统挂载完毕，清空根文件系统
# the root file system is mounted, clean the world for new root file system
echo "" > /proc/sys/kernel/hotplug
$BUSYBOX umount -f /proc
$BUSYBOX umount -f /sys
$BUSYBOX umount -f /dev/pts
# $BUSYBOX umount -f /dev
echo "enter new root..." >> /dev/kmsg

# 11. 执行根文件下的init程序
exec $BUSYBOX switch_root -c /dev/console /newroot /init
if [ $? -ne 0 ];then
  echo "enter new root file system failed, drop to shell" >> /dev/kmsg
  $BUSYBOX mount -t proc proc /proc
  $BUSYBOX sh
fi

# 12. 完成
```

重新更新ramfs镜像

```shell
cd ramfs && rm ramfs.gz
find . | cpio -o -H newc | gzip -9 > ramfs.gz
```

启动系统

```shell
# x86_64
qemu-system-x86_64 \
-M pc \
-kernel linux/arch/x86_64/boot/bzImage \
-nographic \
-initrd ramfs/ramfs.gz \
-device sdhci-pci \
-device sd-card,drive=mysd \
-drive file=hda.img,id=mysd,if=sd,format=raw


-sd hda.img \
```



4. uboot

```shell
./u-boot/tools/mkimage -A x86_64 -O linux -T ramdisk -C none -a 0x00808000 -e 0x00808000 -n ramdisk -d ramfs/ramfs.gz ramfs-uboot.img

# u-boot编译配置
#define CONFIG_ARCH_VERSATILE_QEMU
#define CONFIG_INITRD_TAG
#define CONFIG_SYS_PROMPT  "myboard > "
#define CONFIG_BOOTCOMMAND \
  "sete ipaddr 10.0.2.15;"\
  "sete serverip 10.0.2.2;"\
  "set bootargs 'console=ttyAMA0,115200 root=/dev/mmcblk0';"\
  "tftpboot 0x00007fc0 uImage;"\
  "tftpboot 0x00807fc0 ramfs-uboot.img;"\
  "bootm 0x7fc0 0x807fc0"
```



#### Linux模拟arm

##### 制作Linux内核

```shell
cd linux
export ARCH=arm
export CROSS_COMPILE=arm-linux-gnueabihf-
make versatile_defconfig
make menuconfig
# 修改.config配置，进入menuconfig后，输入/并查找并修改下面的宏。注意搜索时不需要CONFIG_前缀
CONFIG_AEABI=y
CONFIG_OABI_COMPAT=y
CONFIG_PRINTK_TIME=y
CONFIG_EARLY_PRINTK=y
CONFIG_CMDLINE="earlyprintk console=ttyS0 root=/dev/ram0 console=ttyAMA0"
    
make -j12 
```

-----

注：Linux内核默认添加了-msoft-float选项，默认编译为软浮点程序。对于支持硬件浮点计算的机器，一般是在`arch/xxx/Makefile`中将编译选项-msoft-float去掉。对于一般的程序，也可以使用编译选项"-mfloat-abi=hard"使能硬浮点计算。

-----



##### 制作busybox

- 编译busybox

```shell
<<<<<<< Updated upstream
qemu-system-x86_64 \
-kernel arch/x86_64/boot/bzImage \
-nographic
```

#### uboot

```shell
git clone https://github.com/u-boot/u-boot.git
git checkout v2022.01
export ARCH=x86_64
make qemu-x86_64_defconfig
make -j8
```

#### 交叉编译链
[参考文章](https://mp.weixin.qq.com/s?__biz=MzAwMjQ1ODYyOQ==&mid=2247483673&idx=1&sn=2df104549a462b36d46c828ca88e98e5&chksm=9acb5473adbcdd656771483ef000e08d3bfb9f761c7f6c036cbbaae28c590593abab5f89e71f&mpshare=1&srcid=&sharer_sharetime=1573647854905&sharer_shareid=025223779ea46de7b8ccafe0bbfa3cc1&scene=21#wechat_redirect)

apt安装：
```shell
#在主机上执行如下命令
sudo apt install gcc-arm-linux-gnueabihf

#安装完成后使用如下命令查看版本
arm-linux-gnueabihf-gcc -v  或 arm-linux-gnueabihf-gcc --version

#卸载
udo apt remove --auto-remove gcc-arm-linux-gnueabihf
```

下载包安装：
[工具链地址old](http://releases.linaro.org/components/toolchain/binaries/)
[工具链地址new](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/downloads)
[工具链地址-镜像站](https://mirrors.tuna.tsinghua.edu.cn/armbian-releases/_toolchain/)
```shell
# arm64 
wget https://mirrors.tuna.tsinghua.edu.cn/armbian-releases/_toolchain/gcc-arm-9.2-2019.12-x86_64-aarch64-none-linux-gnu.tar.xz

# arm32
wget https://mirrors.tuna.tsinghua.edu.cn/armbian-releases/_toolchain/gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf.tar.xz

# 解压并安装到/usr/local/toolchain目录
xz -d gcc-arm-9.2-2019.12-x86_64-aarch64-none-linux-gnu.tar.xz
xz -d gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf.tar.xz

sudo mkdir -p /usr/local/toolchain
sudo tar -xvJf gcc-arm-9.2-2019.12-x86_64-aarch64-none-linux-gnu.tar -C /usr/local/toolchain
sudo tar -xvJf gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf.tar.xz -C /usr/local/toolchain

# 添加到环境变量(也可以写到~/.bashrc文件并执行source ~/.bashrc生效)
export PATH=$PATH:/usr/local/toolchain/gcc-arm-9.2-2019.12-x86_64-aarch64-none-linux-gnu/bin

export PATH=$PATH:/usr/local/toolchain/gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf/bin

# 查看工具链版本
aarch64-linux-gnu-gcc -v
arm-linux-gnueabihf-gcc -v
```

#### u-boot
```shell
git clone https://github.com/u-boot/u-boot.git
git checkout v2022.01
make vexpress_ca9x4_defconfig
sudo make CROSS_COMPILE=arm-none-linux-gnueabihf- all -j12

```

#### QEMU

[qemu官网下载](https://www.qemu.org/download/)

编译安装：
```shell
# 获取源码
git clone https://gitlab.com/qemu-project/qemu.git
cd qemu
git submodule init
git submodule update --recursive
git switch stable-6.1

# 编译
./configure
make

# 安装
make install

# 检查版本
qemu-system-arm --version
```

-----
> 最好手动安装qemu的最新版
-----

#### buildroot

```shell
git clone git://git.buildroot.net/buildroot

# 修改Target options选项
Target options
Target Architecture (ARM (little endian))  ---> 
Target Binary Format (ELF)  --->                   
Target Architecture Variant (cortex-A9)  --->       
[ ] Enable NEON SIMD extension support (NEW)
[*] Enable VFP extension support 
Target ABI (EABIhf)  --->
Floating point strategy (VFPv3-D16)  --->
ARM instruction set (ARM)  ---> 
# 修改Build options选项
Build options
($(CONFIG_DIR)/configs/ca9_mini_defconfig) Location to save build

# 修改Toolchain选项
Toolchain
Toolchain type (External toolchain)  --->  
*** Toolchain External Options ***         
Toolchain (Custom toolchain)  --->         
Toolchain origin (Pre-installed toolchain)  --->  
(/usr/local/toolchain/gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf) Toolchain path     
($(ARCH)-none-linux-gnueabihf) Toolchain prefix     
External toolchain gcc version (9.x)  --->        
External toolchain kernel headers series (4.20.x)  ---> 
External toolchain C library (glibc/eglibc)  ---> 

# 修改System configuration->Run a getty(login prompt) after boot选项
(ttyAMA0) TTY port

# 修改Filesystem images选项
[*] cpio the root filesystem (for use as an initial RAM filesyste
        Compression method (lz4)  --->  

# 修改Target packages来自定义需要增加的busybox命令
# ...

# 保存并生成defconfig配置文件
make savedefconfig

make ca9_mini_defconfig
make -j12
```

-----
> 1. 查看arm-linux-gnueabihf-gcc的版本号
>     arm-linux-gnueabihf-gcc -v
> 2. 查看工具链位置
> 3. 查看kernel头版本
>     进入工具链的linux/version.h文件，通过宏LINUX_VERSION_CODE的值获取，该宏的bit23-bit16是大版本号，bit15-bit8是中版本号，bit7-bit0是小版本号
-----

### 根文件系统？？
cd busybox
make defconfig ARCH=arm
make menuconfig
# 修改.config配置(STATIC)
Settings  --->
    ---Build Options
    [*] Build static binary (no shared libs)
    
make -j12 ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf-
```

- 编写init程序内容，这里是一个shell脚本

```shell
#!/bin/sh
echo
echo "###########################################################"
echo "## THis is a init script for sd ext2 filesystem ##"
echo "## Author: wengpingbo@gmail.com ##"
echo "## Date: 2013/08/17 16:27:34 CST ##"
echo "###########################################################"
echo

# 1. 检查是否存busybox命令
PATH="/bin:/sbin:/usr/bin:/usr/sbin"
if [ ! -f "/bin/busybox" ];then
  echo "cat not find busybox in /bin dir, exit"
  exit 1
fi
BUSYBOX="/bin/busybox"

# 2. 构建基本的根文件系统
echo "build root filesystem..."
$BUSYBOX --install -s

# 3. 挂载proc文件系统
if [ ! -d /proc ];then
  echo "/proc dir not exist, create it..."
  $BUSYBOX mkdir /proc
fi
echo "mount proc fs..."
$BUSYBOX mount -t proc proc /proc

# 4. 创建/dev目录
if [ ! -d /dev ];then
  echo "/dev dir not exist, create it..."
  $BUSYBOX mkdir /dev
fi
# echo "mount tmpfs in /dev..."
# $BUSYBOX mount -t tmpfs dev /dev
$BUSYBOX mkdir -p /dev/pts

# 5. 挂载devpts文件系统
echo "mount devpts..."
$BUSYBOX mount -t devpts devpts /dev/pts

# 6. 挂载sysfs文件系统
if [ ! -d /sys ];then
  echo "/sys dir not exist, create it..."
  $BUSYBOX mkdir /sys
fi
echo "mount sys fs..."
$BUSYBOX mount -t sysfs sys /sys

# 7. 热启动
echo "/sbin/mdev" > /proc/sys/kernel/hotplug
echo "populate the dev dir..."

# 8. 加载驱动模块
$BUSYBOX mdev -s

# 9. 挂载根文件系统
echo "dev filesystem is ok now, log all in kernel kmsg" >> /dev/kmsg
echo "you can add some third part driver in this phase..." >> /dev/kmsg
echo "begin switch root directory to sd card" >> /dev/kmsg
$BUSYBOX mkdir /newroot
if [ ! -b "/dev/mmcblk0" ];then
  echo "can not find /dev/mmcblk0, please make sure the sd \
card is attached correctly!" >> /dev/kmsg
  echo "drop to shell" >> /dev/kmsg
  $BUSYBOX sh
else
  $BUSYBOX mount /dev/mmcblk0 /newroot
  if [ $? -eq 0 ];then
        echo "mount root file system successfully..." >> /dev/kmsg
  else
        echo "failed to mount root file system, drop to shell" >> /dev/kmsg
        $BUSYBOX sh
  fi
fi

# 10. 根文件系统挂载完毕，清空根文件系统
# the root file system is mounted, clean the world for new root file system
echo "" > /proc/sys/kernel/hotplug
$BUSYBOX umount -f /proc
$BUSYBOX umount -f /sys
$BUSYBOX umount -f /dev/pts
# $BUSYBOX umount -f /dev
echo "enter new root..." >> /dev/kmsg

# 11. 执行根文件下的init程序
exec $BUSYBOX switch_root -c /dev/console /newroot /init
if [ $? -ne 0 ];then
  echo "enter new root file system failed, drop to shell" >> /dev/kmsg
  $BUSYBOX mount -t proc proc /proc
  $BUSYBOX sh
fi

# 12. 完成
```

- 制作ramfs文件系统

```shell
#! /bin/bash

mkdir ramfs && cd ramfs
# 创建目录
mkdir -pv bin dev etc/init.d sbin usr/{bin,sbin}
# 添加busybox命令
cp ../busybox/busybox ./bin
ln -s busybox bin/sh
# 创建console字符设备
sudo mknod -m 644 dev/console c 5 1
# 创建启动文件
cp ../init ./init
touch etc/init.d/rcS
chmod +x bin/busybox etc/init.d/rcS init
cd ..
```

-----

注：上面脚本实现的ramfs目录结构如下所示：

```shell
/
├── bin
│   ├── busybox
│   └── sh -> busybox
├── dev
│   └── console
├── etc
│   └── init.d
│       └── rcS
├── init
├── sbin
└── usr
    ├── bin
    └── sbin
```

-----


- 打包ramfs

```shell
cd ./ramfs
find . | cpio -o -H newc | gzip -9 > ramfs.gz
```

- 运行一次

```shell
qemu-system-arm -M versatilepb \
-dtb linux/arch/arm/boot/dts/versatile-pb.dtb \
-kernel linux/arch/arm/boot/zImage \
-nographic \
-initrd ramfs/ramfs.gz
```

-----

注：如果遇到`Kernel panic -not syncing:Attempted to kill init!`的问题，尝试使用readelf读`linux/vmlinux`和`busybox/busybox`的Flag是否相同。例如`vmlinux`是软浮点计算，`busybox`是硬浮点计算，则可能导致内核panic

-----

##### 制作根文件系统

- 制作物理磁盘

```shell
dd if=/dev/zero of=./hda.img bs=16M count=1
mkfs -t ext2 hda.img
mkdir hda
sudo mount hda.img hda
sudo cp -r ramfs/* hda 
sudo umount hda && rm -rf hda	
```

- 运行一次

```shell
qemu-system-arm -M versatilepb \
-dtb linux/arch/arm/boot/dts/versatile-pb.dtb \
-kernel linux/arch/arm/boot/zImage \
-nographic \
-sd hda.img \
-initrd ramfs/ramfs.gz

```



##### 
stack_wifi

wifi_sta_ip_set 192.168.1.212 255.255.255.0 192.168.1.1 114.114.114.114 114.114.114.114
wifi_sta_connect Sipeed_2.4G aPy5W9x.
wifi_sta_info

#### 移植LWIP到Linux

[LWIP官网](https://savannah.nongnu.org/projects/lwip/)

依赖：

```shell
sudo apt-get install bridge-utils	# 用来配置网桥的工具
```

下载代码

```shell
git clone https://git.savannah.nongnu.org/git/lwip.git
```


