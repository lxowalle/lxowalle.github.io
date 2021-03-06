---
title: temp
tags:
---

## hexo创建草稿

```shell
hexo new draft <title>
```

将草稿发布为正式文章,其中 `<filename>` 为不包含 md 后缀的文章名称。它的原理只是将文章从 source/_drafts 移动到 source/_posts 而已。

```shell
hexo P <filename>
```

## 关于IOU

在目标检测当中，有一个重要的概念就是 IOU。一般指代模型预测的 bbox 和 Groud Truth 之间的交并比。交并比是指两张图片交集部分与两张图片的并集部分相比的值，即(P1 ∩ P2)/(P1 ∪ P2)

计算IOU总结为：两张图片相交部分面积除以两张图片叠加后的总面积(图片叠加后重叠的部分只计算一次)

IOU代码
```c
typedef struct
{
  int32_t x;
  int32_t y;
} mf_point_t;


/**
 * @brief 计算IOU(只考虑了两张图片不旋转的情况)
 * @details
 *                               x
 *                               |
 *                               |____ y  (注意坐标轴是颠倒的)
 *       _________B(x,y)
 *      |         |
 *      |     ____|F(x,y)___D(x,y)
 *      |    |    |         |
 *      |    |    |         |
 *      |____|____|         |
 *  A(x,y)   |E(x,y)        |
 *           |______________|
 *          C(x,y)
 * 
 * 交集：a = (B(y) - C(y)) * (D(x) - A(x))
 * 并集：b = 两个图片面积之和 - a
 * 计算IOU: res = a / b 
 * @param 
 * @return 返回IOU值
*/
static double _caculate_face_iou(face_obj_t *rgb_face, face_obj_t *ir_face)
{
    if (rgb_face == NULL || ir_face == NULL)    return 0;

    /* 坐标映射 */
    mf_point_t A = {.x = rgb_face->x1,.y = rgb_face->y1};
    mf_point_t B = {.x = rgb_face->x2,.y = rgb_face->y2};
    mf_point_t C = {.x = ir_face->x1,.y = ir_face->y1}; // 手动映射
    mf_point_t D = {.x = ir_face->x2,.y = ir_face->y2};  // 手动映射
    mf_point_t E,F;
    E.x = (C.x <= B.x && C.x >= A.x) ? C.x : A.x;
    E.y = (C.y <= B.y && C.y >= A.y) ? C.y : A.y;
    F.x = (D.x <= B.x && D.x >= A.x) ? D.x : B.x;
    F.y = (D.y <= B.y && D.y >= A.y) ? D.y : B.y;
#if 0
    printf("A:(%d,%d)  B:(%d,%d)\n", A.x, A.y, B.x, B.y);
    printf("C:(%d,%d)  D:(%d,%d)\n", C.x, C.y, D.x, D.y);
    printf("E:(%d,%d)  F:(%d,%d)\n", E.x, E.y, F.x, F.y);
#endif

    /* 交集部分 */
    int32_t a = abs(F.y - E.y) * abs(F.x - E.x);

    /* 并集部分 */
    int32_t rgb_area = abs(B.y - A.y) * abs(B.x - A.x);
    int32_t ir_area = abs(D.y - C.y) * abs(D.x - C.x);
    int32_t b = abs(rgb_area) + abs(ir_area) - a;

    /* 计算iou */
    if (b == 0 || a > b)  return 0;
    double res = (double)a / (double)b;

#if 0
    printf("IOU res: %f\n", res);
#endif
    return res;
}
```

测试IOU代码
```c
#include "mf_gui.h"
static void config_line_points_par(lv_point_t *line_points, 
                                  uint16_t x1, uint16_t y1,                                                        
                                  uint16_t x2, uint16_t y2,
                                  uint16_t x3, uint16_t y3)
{
  line_points[0].x = x1;
  line_points[0].y = y1;

  line_points[1].x = x2;
  line_points[1].y = y2;

  line_points[2].x = x3;
  line_points[2].y = y3;
}

static void del_face_frame_line(lv_obj_t **line)
{
  if (*line)
  {
    lv_obj_del(*line);
    *line = NULL;
  }
}

static int _ui_show_face_frame1(int show, uint16_t x, uint16_t y, 
                        uint16_t w, uint16_t h, lv_color_t color)
{
    static uint8_t face_frame_init = 0;
    static lv_obj_t * line1 = NULL, * line2 = NULL;
    static lv_style_t style_line;
    static lv_point_t line_points1[3] = {0};
    static lv_point_t line_points2[3] = {0};

    if (face_frame_init)
    {
        del_face_frame_line(&line1);
        del_face_frame_line(&line2);
        lv_style_set_line_color(&style_line, LV_STATE_DEFAULT, color);

        if (show)
        {
            config_line_points_par(line_points1, x, y + h, x, y, x + w, y);
            config_line_points_par(line_points2, x, y + h, x + w, y + h, x + w, y);

            /*Create a line and apply the new style*/
            line1 = lv_line_create(lv_scr_act(), NULL);
            lv_line_set_points(line1, line_points1, 3);     /*Set the points*/
            lv_obj_add_style(line1, LV_LINE_PART_MAIN, &style_line);     /*Set the points*/
            lv_obj_align(line1, NULL, LV_ALIGN_IN_TOP_LEFT, 0, 0);

            /*Create a line and apply the new style*/
            line2 = lv_line_create(lv_scr_act(), NULL);
            lv_line_set_points(line2, line_points2, 3);     /*Set the points*/
            lv_obj_add_style(line2, LV_LINE_PART_MAIN, &style_line);     /*Set the points*/
            lv_obj_align(line2, NULL, LV_ALIGN_IN_TOP_LEFT, 0, 0);
        }
    }
    else
    {
        lv_style_init(&style_line);
        lv_style_set_line_width(&style_line, LV_STATE_DEFAULT, 5);
        lv_style_set_line_color(&style_line, LV_STATE_DEFAULT, color);
        lv_style_set_line_rounded(&style_line, LV_STATE_DEFAULT, true);
        face_frame_init = 1;
    }

    return 0;
}

static int _ui_show_face_frame2(int show, uint16_t x, uint16_t y, 
                        uint16_t w, uint16_t h, lv_color_t color)
{
    static uint8_t face_frame_init = 0;
    static lv_obj_t * line1 = NULL, * line2 = NULL;
    static lv_style_t style_line;
    static lv_point_t line_points1[3] = {0};
    static lv_point_t line_points2[3] = {0};

    if (face_frame_init)
    {
        del_face_frame_line(&line1);
        del_face_frame_line(&line2);
        lv_style_set_line_color(&style_line, LV_STATE_DEFAULT, color);

        if (show)
        {
            config_line_points_par(line_points1, x, y + h, x, y, x + w, y);
            config_line_points_par(line_points2, x, y + h, x + w, y + h, x + w, y);

            /*Create a line and apply the new style*/
            line1 = lv_line_create(lv_scr_act(), NULL);
            lv_line_set_points(line1, line_points1, 3);     /*Set the points*/
            lv_obj_add_style(line1, LV_LINE_PART_MAIN, &style_line);     /*Set the points*/
            lv_obj_align(line1, NULL, LV_ALIGN_IN_TOP_LEFT, 0, 0);

            /*Create a line and apply the new style*/
            line2 = lv_line_create(lv_scr_act(), NULL);
            lv_line_set_points(line2, line_points2, 3);     /*Set the points*/
            lv_obj_add_style(line2, LV_LINE_PART_MAIN, &style_line);     /*Set the points*/
            lv_obj_align(line2, NULL, LV_ALIGN_IN_TOP_LEFT, 0, 0);
        }
    }
    else
    {
        lv_style_init(&style_line);
        lv_style_set_line_width(&style_line, LV_STATE_DEFAULT, 5);
        lv_style_set_line_color(&style_line, LV_STATE_DEFAULT, color);
        lv_style_set_line_rounded(&style_line, LV_STATE_DEFAULT, true);
        face_frame_init = 1;
    }

    return 0;
}

#if 0
    /* 测试代码，显示红外和可见光的人脸框，使用这里的代码需要编写_ui_show_face_frame函数才能使用，可以从gui的demo中复制 */
    _ui_show_face_frame1(1, A.y, 854 - B.x, B.y - A.y, B.x - A.x, LV_COLOR_YELLOW);
    _ui_show_face_frame2(1, C.y, 854 - D.x, D.y - C.y, D.x - C.x, LV_COLOR_GREEN); 
    mf_gui_loop();
#endif
```

```
mount -o rw,remount /dev/root
```
```
fseek(fdopen(ts->fd, "a"), SEEK_END, 0);
```

[Select函数使用参考](https://blog.csdn.net/star871016/article/details/108550363)

互斥锁简单使用

```c
#include <pthread.h>

/* 互斥锁创建 */ 
static pthread_mutex_t __mutex_lock = PTHREAD_MUTEX_INITIALIZER;

/* 互斥锁初始化 */
int _mutex_lock_init(void)
{
	return !pthread_mutex_init(&__mutex_lock, NULL);
}

/* 互斥锁加锁 */
int _mutex_lock(void)
{
	 return !pthread_mutex_lock(&__mutex_lock); 
}

/* 互斥锁加锁 */
int mf_gui_mutex_trylock(void)
{
    return !pthread_mutex_trylock(&_gui_mutex_lock); 
}

/* 互斥锁解锁 */
int _mutex_unlock(void)
{
	return !pthread_mutex_unlock(&__mutex_lock); 
}
```

```c
#include <pthread.h>
#include <sys/select.h>

static void *mf_gui_thread(void *args)
{
    int fd = -1;
    while ((fd = evdev_get_fd()) < 0);

    fd_set fds;

    while(1)
    {
        FD_ZERO(&fds);
        FD_SET(fd, &fds);
        int fd_res = select(fd + 1, &fds, NULL, NULL, NULL);
        if (fd_res > 0 && FD_ISSET(fd, &fds))
        {
            mf_gui_mutex_lock();
            mf_gui_loop();
            mf_gui_mutex_unlock();
        }
    }

    return NULL;
}

pthread_create(&gui_pthread, NULL, mf_gui_thread, NULL);
```

##### 坐标映射简单算法，833 MF5

```c
// 水平
    // {
    //     int evdev_hor = evdev_hor_max - evdev_hor_min;
    //     printf("evdev_her:%d  evdev_float:%f\n", evdev_hor,  (double)disp_hor_res / evdev_hor);
    //     data->point.x = evdev_root_x * disp_hor_res / evdev_hor;
    // }

// 垂直
    // {
    //     int evdev_ver = evdev_ver_max - evdev_ver_min;
    //     printf("evdev_ver:%d  evdev_float:%f\n", evdev_ver,  (double)disp_ver_res / evdev_ver);
    //     data->point.y = (evdev_ver_max - evdev_root_y) * disp_ver_res / evdev_ver;
    // }   

// 调试打印
    // printf("disp_hor_res:%d disp_ver_res:%d\n", disp_hor_res, disp_ver_res);
    // printf("evdev_ver_min:%d evdev_ver_max:%d\n", evdev_ver_min, evdev_ver_max);
    // printf("evdev_hor_min:%d evdev_hor_max:%d\n", evdev_hor_min, evdev_hor_max); 
```


LVGL创建一个键盘

```c
    static lv_style_t style;
    lv_style_init(&style);
    lv_style_set_image_recolor_opa(&style, LV_STATE_PRESSED, LV_OPA_30);
    lv_style_set_image_recolor(&style, LV_STATE_PRESSED, LV_COLOR_BLACK);
    lv_style_set_text_color(&style, LV_STATE_DEFAULT, LV_COLOR_WHITE);
    lv_obj_t *obj = lv_keyboard_create(lv_scr_act(), NULL);
    lv_keyboard_set_cursor_manage(obj, true);
    lv_obj_add_style(obj, LV_IMGBTN_PART_MAIN, &style);
    lv_obj_set_size(obj, 600, 140);
    lv_obj_set_pos(obj, 0, 450);
    lv_keyboard_set_mode(obj, LV_KEYBOARD_MODE_NUM);
```

MF5,MF7 IOU直接的坐标映射

```c
    mf_point_t C = {.x = ir_face->x1 + 139,.y = ir_face->y1 + 60}; // 手动映射
    mf_point_t D = {.x = ir_face->x2 + 204,.y = ir_face->y2 + 139};  // 手动映射

    double x_a = (double)1.5;
    double y_a = (double)1.5;
    mf_point_t C = {.x = ir_face->x1 * x_a + 30,.y = ir_face->y1 * y_a - 6}; // 手动映射
    mf_point_t D = {.x = ir_face->x2 * y_a + 48,.y = ir_face->y2 * y_a + 9};  // 手动映射
```

    uint8_t uid[16] = {0x41, 0x92, 0x00, 0x23};
    uint32_t id, id2;
    id =  *(uint32_t *)uid;
    printf("id:%#x\n", id);
    #define uid2id32(a) (((a)[0]) | ((a)[1] << 8) | ((a)[2] << 16) | ((a)[3] << 24))
    #define uid2id16(a) (((a)[0]) | ((a)[1] << 8))
    printf("id2:%#x\n", uid2id32(uid));
    printf("id3:%#x\n", uid2id16(uid));

#### 2021 12 07

反射弧=感受器、传入神经、中间神经元、传出神经和效应器
TODO：感受器，传入神经，传出神经，效应器

1. 解决IOU阈值被误改的问题

#### Linux字节转换
[参考](https://jason--liu.github.io/2018/02/07/cputole/)
kernel里面经常能看见下面几个函数:be32_to_cpu, cpu_to_be32, cpu_to_le16,cpu_to_le32等
1. le叫做little endian, be叫做big endian,这是两种字节序,分别称为小段和大端.
2. 凡是xx_to_cpu就说明结果是给cpu使用的.反之,cpu_to_xx就说明从cpu的字节序转换成目标字节序
3. 如果cpu本身就是小端模式,那么cput_to_le32这类函数就会do nothing

### Linux驱动中的gpio_desc结构体

```c
struct gpio_desc {
	struct gpio_device	*gdev;
	unsigned long		flags;
	/* Connection label */
	const char		*label;
	/* Name of the GPIO */
	const char		*name;
};
```
其中
1. gdev包含了gpio设备详细参数
2. flags是gpio被占用的情况
3. label保存说明
4. name保存名称

```c
struct gpio_device {
	int			id;
	struct device		dev;
	struct cdev		chrdev;
	struct device		*mockdev;
	struct module		*owner;
	struct gpio_chip	*chip;
	struct gpio_desc	*descs;
	int			base;
	u16			ngpio;
	char			*label;
	void			*data;
	struct list_head        list;
};
```
其中
1. gpio的主要操作在struct gpio_chip结构体中

##### 设计模式资料

[设计模式的C语言应用](https://bbs.huaweicloud.com/blogs/113179)

每个C文件有两个头文件，一个头文件私有，由当前类的所有成员可以访问；一个头文件公有，由当前类的所有成员和外部访问


#define LOGI(format, ...)   do {\
    printf(TERMINAL_COLOR_GREEN);\
    printf(" (%d): " format, __LINE__, ##__VA_ARGS__);\
    printf(TERMINAL_COLOR_END);\
    printf(TERMINAL_COLOR_END);\
}while(0)
// 

##### DHCPC命令

udhcpc -i eth0 -T 1 -n

1. -i 选择要发现的网络
2. -T 检测网络的间隔,单位s。默认3s
3. -n 没有检测到网络则退出

##### poll函数使用

[参考资料](https://blog.csdn.net/weixin_36332642/article/details/116822020?utm_medium=distribute.pc_relevant.none-task-blog-2~default~baidujs_baidulandingword~default-0.opensearchhbase&spm=1001.2101.3001.4242.1)
可以监控多个文件的数据是否可读写
基本方式：定义一个数组保存多个文件描述符，为每个文件描述符绑定需要读写事件，调用poll函数轮询这些事件

```c
// 只检测一个文件
#include <poll.h>

int fd = 3;
struct pollfd pollfds;

void test(void)
{
    // 配置
    pollfds.fd = fd;
    fds.events = POLLIN | POLLOUT;

    // 轮询检测
    while (1)
    {
        int res = poll(&pollfds, 1, 50);
        if (res > 0)
        {
            if (pollfds.fd == fd && pollfds.revents & POLLIN)
            {
                // User handle
            }
        }
    }
}
```

#### git合并多个分支
方法1：
```shell
# 分支1(当前分支):aaaa
# 分支2:bbbb
# 分支3:cccc

# 需要合并分支1和分支2，则执行以下步骤：
# 步骤1：
git rebase -i cccc      # cccc不参与合并
# 步骤2，通过vi填写命令操作：
pick bbbb               # pick表示会commit这个提交
squash aaaa             # squash表示这个commit会被合并到前一个commit
#执行:wq保存并退出
#步骤3,修改合并后的message
#步骤4，完成

#注意：如果出现操作错误，执行git rebase --abort回到合并前的状态

```

##### __attribute__

`_attribute__((constructor))`可以标记一个函数，让这个函数会在main()之前执行。
```c
// 标记函数，该函数会在main之前被执行(默认优先级65535)
_attribute__((constructor)) static void pre_main(void)
{
    printf("Hello!\n");
}

// 标记函数，并赋予优先级(范围0~65535，相同优先级时，先标记的函数优先执行)
_attribute__((constructor(101))) static void pre_main1(void)
{
    printf("Hello pre_main1!\n");
}

_attribute__((constructor(102))) static void pre_main2(void)
{
    printf("Hello pre_main2!\n");
}
```

`_attribute__((destructor))`可以标记一个函数，让这个函数在main()或exit()之后执行。使用方法类似`_attribute__((constructor))`

#### 似乎有点看头的Rust教程，点击[这里](https://rust-book.junmajinlong.com/ch1/01_expression.html)跳转

#### 前后台进程切换

```shell
    命令 &      # 让进程后台运行
    jobs        # 查看后台进程
    fg %n       # 将进程n从后台切换到前台(n是jobs看到的进程编号)
    bg %n       # 让进程n切换到后台(n是jobs看到的进程编号)
```

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


##### 替换wifi账号和密码

```shell
sed 's/ssid=".*"$/ssid=\"1234\"/g' /etc/wpa_supplicant.conf

sed 's/psk=".*"$/psk=\"1234\"/g' /etc/wpa_supplicant.conf


sed -i 's/ssid=".*"$/ssid=\"1234\"/g' /etc/wpa_supplicant.conf
```

```c
void sacn_and_config_wifi(image_t *img)
{
    static uint8_t need_change_wifi_config = 1;
    uint8_t need_change_auth = 0;
    char data[256], cmd[256];

    if (need_change_wifi_config)
    {
        int num = mf_qr_scan_pic(img->addr, img->width, img->height, (uint8_t *)data, 1);
        if (num)
        {
            need_change_wifi_config = 0;

            /* 二维码识别成功 */
            printf("\n\n --- OK! QR SCAN RESULT: %s ---\n\n", data);

            cJSON* root, *sub;
            char ssid[50] = {0}, psk[50] = {0};
            root = cJSON_Parse(data);
            if(root) 
            {
#if 1
                char* json_str = cJSON_Print(root);
                if (json_str)
                {
                    printf("%s\n", json_str);
                    cJSON_free(json_str);
                }
#endif
                sub = cJSON_GetObjectItem(root, "ssid");
                strcpy(ssid, sub->valuestring);
                sub = cJSON_GetObjectItem(root, "psk");
                strcpy(psk, sub->valuestring);
                cJSON_Delete(root);
                
                printf("ssid:%s  psk:%s\n", ssid, psk);
                if (access("/", W_OK))
                {
                    need_change_auth = 1;
                    printf("/ dir is readonly, remount / to readwrite!\n");
                    system("mount -o rw,remount /");
                }

                snprintf(cmd, sizeof(cmd), "sed -i 's/ssid=\".*\"$/ssid=\"%s\"/g' /etc/wpa_supplicant.conf", ssid);
                system(cmd);
                snprintf(cmd, sizeof(cmd), "sed -i 's/psk=\".*\"$/psk=\"%s\"/g' /etc/wpa_supplicant.conf", psk);
                system(cmd);

                need_change_wifi_config = 0;
                if (need_change_auth)
                {
                    need_change_auth = 0;
                    printf("Remount / to readonly!\n");
                    system("mount -o ro,remount /");
                }
            }
            else
            {
                printf("Can't find json string\n");
            }
        }
    }
}
```

```c

void scan_and_config_wifi_cb(int num, char *res)
{
    static uint8_t need_change_wifi_config = 1;
    uint8_t need_change_auth = 0;
    char cmd[256];
    char *data = res;

    if (need_change_wifi_config)
    {
        need_change_wifi_config = 0;

        /* 二维码识别成功 */
        printf("\n\n --- OK! QR SCAN RESULT: %s ---\n\n", data);

        cJSON* root, *sub;
        char ssid[50] = {0}, psk[50] = {0};
        root = cJSON_Parse(data);
        if(root) 
        {
#if 1
            char* json_str = cJSON_Print(root);
            if (json_str)
            {
                printf("%s\n", json_str);
                cJSON_free(json_str);
            }
#endif
            sub = cJSON_GetObjectItem(root, "ssid");
            strcpy(ssid, sub->valuestring);
            sub = cJSON_GetObjectItem(root, "psk");
            strcpy(psk, sub->valuestring);
            cJSON_Delete(root);
            
            printf("ssid:%s  psk:%s\n", ssid, psk);
            if (access("/", W_OK))
            {
                need_change_auth = 1;
                printf("/ dir is readonly, remount / to readwrite!\n");
                system("mount -o rw,remount /");
            }

            snprintf(cmd, sizeof(cmd), "sed -i 's/ssid=\".*\"$/ssid=\"%s\"/g' /etc/wpa_supplicant.conf", ssid);
            system(cmd);
            snprintf(cmd, sizeof(cmd), "sed -i 's/psk=\".*\"$/psk=\"%s\"/g' /etc/wpa_supplicant.conf", psk);
            system(cmd);

            need_change_wifi_config = 0;
            if (need_change_auth)
            {
                need_change_auth = 0;
                printf("Remount / to readonly!\n");
                system("mount -o ro,remount /");
            }
        }
        else
        {
            printf("Can't find json string\n");
        }
    }
}

mf_qr_scan_ctl(QR_CTLSET_HANDLECB, sacn_and_config_wifi_cb);

```


#### git出现object file is empty问题的解决方法

[参考文章](https://segmentfault.com/a/1190000008734662)

步骤：
1. `git fsck --full`
2. `find . type f -empty -delete -print`   ,目的是删除空文件，如果不想删掉有用的空文件可以选择手动删除空文件(一般有用的空文件都被git追踪了，大部分情况不需要担心)
3. `tail -n 2 .git/logs/refs/heads/xxx`,获取目标分支的最后两个提交，xxx填分支名称
4. `git update-ref HEAD xxx`,将HEAD指针指向最后第二提交,xxx填第二个分支的hash值
5. `git pull`,拉取代码
6. 完成

#### git取消跟踪文件
1. 取消跟踪所有文件,保留本地文件：git rm -r --cached
2. 取消跟踪所有文件,删除本地文件：git rm -r --f
3. 取消跟踪xxx文件,保留本地的xxx文件：git rm --cached   xxx
4. 取消跟踪xxx文件,删除本地的xxx文件: git rm --f xxx

**取消跟踪后本地的.gitignore仍然不生效的解决方法**

```shell
git rm -r --cached .
git add .
git commit -m "Update .gitignore"
```

#### 动态调833 0328摄像头曝光度
```shell
# 列出i2c-0的从机地址
i2cdetect -y 0      

# 设置/读取0xfe寄存器的值（对于0328，0xfe寄存器被用来设置分页）
i2cset -y -f 0 0x21 0xfe 0x01
i2cget -y -f 0 0x21 0xfe

# 获取当前的AEC所有配置，用来对照实际值（需要切换到分页1下，通过设置0xfe寄存器来切换）
i2cdump -y -f 0 0x21

# 获取/设置曝光（需要切换到分页1下，通过设置0xfe寄存器来切换）
i2cget -y -f 0 0x21 0x13
i2cset -y -f 0 0x21 0x13 0x61


# 设置页地址(只运行一次)
i2cset -y -f 0 0x21 0xfe 0x01

# 设置曝光值，下面设置的曝光值是0x61
i2cset -y -f 0 0x21 0x13 0x61
```

#### 831活体测试
```shell
# 三档曝光时间值，范围0~0x0f
0x2b    0x02
0x2d    0x04
0x2f    0x0a
0x31    无效（3挡）

i2cset -y -f 0 0x21 0x2b 0x02
i2cset -y -f 0 0x21 0x2d 0x04
i2cset -y -f 0 0x21 0x2a 0x0a
```

#### i2c-tools交叉编译

步骤：
1. 下载i2c-tools
2. 设置CC为交叉编译工具`export CC=/opt/toolchain-sunxi-musl/toolchain/bin/arm-openwrt-linux-gcc`
3. 在Makefile添加`USE_STATIC_LIB ?= 1`
4. 执行`make`
5. 完成，生成的指令在tools目录下

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

## Fatfs文件系统的移植

参考文章:
[FatFs文件系统结构分析（强烈推荐）](https://www.sunev.cn/embedded/943.html)
[FAT Filesystem](http://elm-chan.org/docs/fat_e.html)
Fatfs文件系统的移植主要关注diskio.c文件和ffconf.h文件,需要在diskio.c文件里写好操作磁盘的接口,在ffconf.h文件配置Fatfs.下面是我在Linux环境下,用文件代替Flash移植的Fatfs文件系统.

**diskio.c**
```c
/** diskio.c文件 */
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#define DISK_FILE_SIZE  (1024 * 1024 * 5)      // Flash总容量
const char *disk_file = "fatfs_vdisk";
#define PRINF_HEX_ARR(str,buf,len)\
do{\
    char *buff = (char *)buf;\
    printf("\e[32m[%s](%d):\e[0m", str, len);\
    for (int i = 0;i < len; ++i)\
    {\
        printf("0x%.2X ", buff[i] & 0xff);\
    }\
    printf("\r\n");\
} while (0);

DSTATUS disk_status (
	BYTE pdrv		/* Physical drive nmuber to identify the drive */
)
{
	DSTATUS stat = RES_OK;

    printf("Get disk status:%d\n", stat);

	return stat;
}

DSTATUS disk_initialize (
	BYTE pdrv				/* Physical drive nmuber to identify the drive */
)
{
	DSTATUS stat;

    if (access(disk_file, F_OK))
    {
        printf("Create file %s\n", disk_file);
        creat(disk_file, 0666);
    }
    stat = RES_OK;

	return stat;
}

DRESULT disk_read (
	BYTE pdrv,		/* Physical drive nmuber to identify the drive */
	BYTE *buff,		/* Data buffer to store read data */
	LBA_t sector,	/* Start sector in LBA */
	UINT count		/* Number of sectors to read */
)
{
	DRESULT res;

    printf("pdrv:%d sector:%d  count:%d", pdrv, sector, count);
    if (!access(disk_file, F_OK))
    {
        int fd = open(disk_file, O_RDWR);
        if (fd)
        {
            lseek(fd, FF_MIN_SS * sector, SEEK_SET);
            int len = read(fd, buff, FF_MIN_SS * count);
            printf("\e[32m[%s](%d):\e[0m", "read", len);
            for (int i = 0;i < len; ++i)
            {
                printf("0x%.2X ", buff[i] & 0xff);
            }
            printf("\r\n");
            close(fd);
        }
    }
    res = RES_OK;

	return res;
}

DRESULT disk_write (
	BYTE pdrv,			/* Physical drive nmuber to identify the drive */
	const BYTE *buff,	/* Data to be written */
	LBA_t sector,		/* Start sector in LBA */
	UINT count			/* Number of sectors to write */
)
{
	DRESULT res;

    printf("pdrv:%d sector:%d  count:%d", pdrv, sector, count);
    if (!access(disk_file, F_OK))
    {
        int fd = open(disk_file, O_RDWR);
        if (fd)
        {
            lseek(fd, FF_MIN_SS * sector, SEEK_SET);
            int len = write(fd, buff, count * FF_MIN_SS);

            printf("write:%s\n", buff);
            printf("\e[32m[%s](%d):\e[0m", "write", len);
            for (int i = 0;i < len; ++i)
            {
                printf("0x%.2X ", buff[i] & 0xff);
            }
            printf("\r\n");

            close(fd);
        }
    }
    res = RES_OK;

	return res;
}

DRESULT disk_ioctl (
	BYTE pdrv,		/* Physical drive nmuber (0..) */
	BYTE cmd,		/* Control code */
	void *buff		/* Buffer to send/receive control data */
)
{
	DRESULT res = RES_OK;

    printf("disk ioctl,pdrv:%d cmd:%d\n", pdrv, cmd);

    int fd = -1;
    if (!access(disk_file, F_OK))
        fd = open(disk_file, O_RDWR);
    if (fd < 0) return RES_NOTRDY;

    switch (cmd)
    {
    case CTRL_SYNC:
        fsync(fd);
        break;
    case GET_SECTOR_COUNT:
        *(DWORD *)buff = DISK_FILE_SIZE / 512;
        break;
    case GET_SECTOR_SIZE:
        *(WORD *)buff = FF_MIN_SS;
        break;
    case GET_BLOCK_SIZE:
        *(WORD *)buff = 8;
        break;
    default:
        res = RES_PARERR; 
        break;
    }
    
    if (fd)
        close(fd);

	return res;
}

```

**ffconf.h文件**
```c
/** 下面只写了修改的部分 */
#define FF_USE_MKFS		    1   // 使能f_mkfs API(因为需要主动将Linux的新文件格式化为FAT文件系统)
#define FF_MULTI_PARTITION	1   // 使用多个逻辑盘
#define FF_VOLUMES		    5   // 创建了5个逻辑盘
#define FF_STR_VOLUME_ID	2   // 创建了2个分区

```

**ff.c文件**
```c
/** 如果使能了FF_MULTI_PARTITION宏,则还需要创建一个PARTITION结构体来配置分区信息 */
PARTITION VolToPart[FF_VOLUMES] = { 
    {0, 1},     /* "0:" 内部flash, 分区1 板级配置信息 */ 
    {0, 2},     /* "1:" 内部flash，分区2 人脸数据库*/ 
    {0, 3},     /* "2:" 内部flash，分区3 资源文件和其他数据*/
    {1, 1},     /* "3:" 外部flash，分区1 数据区 */
    {1, 2},     /* "4:" 外部flash，分区2 数据区 */
    {2, 0}      /* "5:" 可移动磁盘，注意如果有多个卷，移动磁盘前必须卸载这些卷 */
};

/** 分析上述数组,一共有编号为0,1,2的3个分区,这个分区编号对应于API中的pdrv参数.其中0分区又划分了1,2,3共3个逻辑盘,注意最多划分1-4个逻辑盘.1分区划分了1,2共2个逻辑盘.2分区的逻辑盘编号设置为0表示自动分配,一般用于可移动磁盘 */
```

**测试代码(TODO:整理代码)**
```c
int main(void)
{
    printf("libfatfs test\n");

#if 0
    /** 测试读写文件是否正常 */
    const char *disk_file = "fatfs_vdisk";
    int sector = 0, count = 1;
    if (!access(disk_file, F_OK))
    {
        int fd = open(disk_file, O_RDWR);
        if (fd)
        {
            uint8_t buff0[128] = "1234566";
            lseek(fd, FF_MIN_SS * sector, SEEK_SET);
            int len0 = write(fd, buff0, sizeof(buff0));

            uint8_t buff[128] = "";
            lseek(fd, FF_MIN_SS * sector, SEEK_SET);
            int len = read(fd, buff, sizeof(buff));

            printf("\e[32m[%s](%d):\e[0m", "read", len);
            for (int i = 0;i < len; ++i)
            {
                printf("0x%.2X ", buff[i] & 0xff);
            }
            printf("\r\n");

            close(fd);
        }
    }

    return 0;
#endif
    FATFS fs;
    FIL fil;
    FRESULT res;

    /**配置磁盘，需要搭配VolToPart来配置。VolToPort是由用户定义的磁盘映射表 
    // PARTITION VolToPart[FF_VOLUMES] = { 
    //     {0, 1},     /* "0:" 内部flash, 分区1 板级配置信息 */ 
    //     {0, 2},     /* "1:" 内部flash，分区2 人脸数据库*/ 
    //     {0, 3},     /* "2:" 内部flash，分区3 资源文件和其他数据*/
    //     {1, 1},     /* "3:" 外部flash，分区1 数据区 */
    //     {1, 2}      /* "4:" 外部flash，分区2 数据区 */
    // };
    BYTE work[FF_MAX_SS];
    LBA_t plist[] = {20, 20, 100, 0};    /* 定义逻辑盘的分区大小。小于等于100时表示百分比，大于100表示扇区数，最后一位为0作为结尾 */
    res = f_fdisk(0, plist, work);
    printf("f_fdisk res:%d\n", res);
    // PRINF_HEX_ARR("work", work, sizeof(work));
    _read_mbr();
    
    #define BRDCFG_PATH         "0:"
    // #define FACEDB_PATH         "b"
    // #define RESOURCE_PATH       "c"
    res = f_mkfs(BRDCFG_PATH, 0, work, sizeof(work));
    printf("f_mkfs %s res:%d\n", BRDCFG_PATH, res);
    // res = f_mkfs(FACEDB_PATH, 0, work, sizeof(work));
    // printf("f_mkfs %s res:%d\n", FACEDB_PATH, res);
    // res = f_mkfs(RESOURCE_PATH, 0, work, sizeof(work));
    // printf("f_mkfs %s res:%d\n", RESOURCE_PATH, res);

    // #define ROOT_PATH1   "/1"
    // res = f_mkfs(ROOT_PATH1, 0, work, sizeof(work));
    // printf("f_mkfs / res:%d\n", res);

    fs.fs_type = FS_FAT32;
    res = f_mount(&fs, BRDCFG_PATH, 1);
    printf("f_mount 0: res:%d\n", res);

    // res = f_mount(&fs, ROOT_PATH1, 1);
    // printf("f_mount /1 res:%d\n", res);
    _read_mbr();
    _read_dbr();
#if 0
    {
        FIL fp;
        res = f_open(&fp, "0:a", FA_CREATE_NEW | FA_WRITE | FA_READ);
        if (!fp.obj.fs)
            printf("fp obj fs is NULL\n");
        printf("f_open res:%d\n", res);

        int bw;
        res = f_write(&fp, "123456789", strlen("123456789"), &bw);
        printf("write data(%d)  f_write res:%d\n", bw, res);

        res = f_sync(&fp);
        printf("f_sync res:%d\n", res);

        uint8_t read_buff[100];
        int br;
        f_lseek(&fp, 0);

        res = f_read(&fp, read_buff, sizeof(read_buff), &br);
        printf("read 0:a data(%d):%s  f_read res:%d\n", br, read_buff, res);

        f_close(&fp);
    }
#endif

#if 0
    {
        FIL fp;
        res = f_open(&fp, "b", FA_CREATE_NEW | FA_WRITE | FA_READ);
        if (!fp.obj.fs)
            printf("fp obj fs is NULL\n");
        printf("f_open res:%d\n", res);

        int bw;
        res = f_write(&fp, "123123123123", strlen("123123123123"), &bw);
        printf("write data(%d)  f_write res:%d\n", bw, res);

        res = f_sync(&fp);
        printf("f_sync res:%d\n", res);

        uint8_t read_buff[100];
        int br;
        f_lseek(&fp, 0);

        res = f_read(&fp, read_buff, sizeof(read_buff), &br);
        printf("read 1:a data(%d):%s  f_read res:%d\n", br, read_buff, res);

        f_close(&fp);
    }
#endif

    // printf("\n\n\n");
    // f_unmount("");

    return 0;
}
```

Fatfs文件系统有主引导记录(MBR)和操作系统引导记录(DBR).通过MBR可以获取最多4个分区(逻辑盘)的位置和状态.每个分区都有一个DBR来记录当前分区的信息.

**MBR一般保存在磁盘的第一个扇区,其内容如下**
```c
/**
 * @brief MBR中分区的字段信息
*/
typedef struct
{
    uint8_t PT_BootID;  // 开机指示 0 不可启动，0x80 可启动。只能有一个分区可以设置为可启动
    uint8_t PT_StartHd; // CHS形式的分区起始扇区的头部编号[0,254]
    uint16_t PT_StartCySc;  // CHS形式的分区起始扇区的柱面号(bit9~bit0, 0~1023)和柱面中的扇区号(bit15~bit10, 1~63)
    uint8_t PT_System;  // 分区的类型。经典值：
                            /**
                             * 0x00, 空白分区。此时其他字段必须为0
                             * 0x01, FAT12(CHS/LBA <65536 sectors)
                             * 0x04, FAT16(CHS/LBA <65536 sectors)
                             * 0x05, 扩展分区(CHS/LBA)
                             * 0x06, FAT12/16(CHS/LBA >=65536 sectors)
                             * 0x07, HPFS/NTFS/exFAT(CHS/LBA)
                             * 0x0B, FAT32(CHS/LBA)
                             * 0x0C, FAT32(LBA)
                             * 0x0E, FAT12/16(LBA)
                             * 0x0F, 扩展分区(LBA)
                            */
    uint8_t PT_EndHd;       /* CHS形式分区的结束扇区的头部编号(0~254) */
    uint16_t PT_EndCySc;    /* CHS形式分区的结束扇区的柱面号(bit9~0， 0~1023)和柱面中的扇区号(bit15~10, 1~63) */
    uint32_t PT_LbaOfs;     /* 在32位LBA(1-0xFFFFFFFF)中分区起始扇区(引导扇区(DBR)位置) */
    uint32_t PT_LabSize;    /* 以扇区为单位的分区大小(1 - 0xFFFFFFFF) */
}__attribute__ ((packed)) MBR_Partation_t;

/**
 * @brief MBR字段
*/
typedef struct
{
    uint8_t MBR_bootcode[446];          // 引导程序。不使用时用0填充
    MBR_Partation_t MBR_Partation1;     // 分区表条目1，保存分区类型和状态，会指向该分区DBR的扇区位置
    MBR_Partation_t MBR_Partation2;
    MBR_Partation_t MBR_Partation3;
    MBR_Partation_t MBR_Partation4;
    uint16_t MBR_Sig;                    // 固定为0xAA55，表示这是有效的MBR
}__attribute__ ((packed)) MBR_t; 
```
通过MBR可以知道每个分区的位置,而DBR位于分区的第一个扇区,因此可以通过MBR获取到DBR的位置.

Fatfs格式化后分为Fat12/16/32共3种文件系统,它们格式化后的分区DBR字段的含义有些区别.


**DBR**
```c

/**
 * @brief DBR中FAT12/16/32卷的公共字段(0-35字节)
*/
typedef struct
{
    uint8_t BS_JmpBoot[3];          /** 跳转指令，跳转到操作系统引导序列使用的引导代码(x86)，如果不符合格式，Windows会无法识别该卷
                                        格式1: 0xEB 0x?? 0x90   // Short jump + NOP
                                        格式2: 0xE9 0x?? 0x??   // Nearjunp
                                        其中??决定跳转的位置
                                    */
    uint8_t BS_OEMName[8];          /** 创建卷的系统的名称，常用"MSWIN4.1"或"MSDOS5.0" */
    uint16_t BPB_BytesPerSec;       /** 每扇区的字节数，有效值为512,1024,2048或4096 */
    uint8_t BPB_SecPerClus;         /** 每簇(块)的连续扇区数,有效值必须是2的幂次方。为了兼容性尽量不超过32KB */
    uint16_t BPB_RsvdSecCnt;        /** 保留区的扇区数。该字段不能为0，为了兼容性在FAT12/16卷上设为1，在FAT32卷上为32 */
    uint8_t BPB_NumFATs;            /** FAT数量。任何大于1的值都有效，一般设为2 */
    uint16_t BPB_RootEntCnt;        /** 根目录中32字节目录的数量。FAT16卷设置为512，FAT32卷必须设置为0 */
    uint16_t BPB_TotSec16;          /** 卷的扇区总数(2字节表示)。FAT12/16卷的扇区数超过该区域(>=0x10000)时，设置为0，并将实际值保存到BPB_TotSec32字段。FAT32卷必须设为0 */
    uint8_t BPB_Media;              /** 值必须为0xF0,0xF8~0xFF。0xF8是不可移动磁盘的标准，0xF0是非分区可移动磁盘。需要注意FAT[0]的低8位需要放入相同的值,这是由MS-DOS Ver.1的媒体决定 */
    uint16_t BPB_FATSz16;           /** 每个FAT的扇区数。此字段仅用于FAT12/16，对于FAT32卷必须是0 */
    uint16_t BPB_SecPerTrk;         /** 每个磁道的扇区数。此字段仅与具有几何形状且仅用于 IBM PC 的磁盘 BIOS 的介质相关 */
    uint16_t BPB_NumHeads;          /** 针头数。此字段仅与具有几何形状且仅用于 IBM PC 的磁盘 BIOS 的介质相关 */
    uint32_t BPB_HiddSec;           /** FAT卷前的隐藏物理扇区数 */
    uint32_t BPB_TotSec32;          /** 卷的扇区总数(4字节表示)。FAT12/16卷的扇区数<0x10000时，设置为0，并将实际值保存到BPB_TotSec16字段。FAT32卷该字段始终有效 */
}__attribute__((packed)) DBR_GLOBAL_t;         // FAT12/16/32的公共字段。注意任何以BPB_命令的字段是BPB的一部分，以BS_命名的字段只是引导扇区的一部分

/**
 * @brief DBR中FAT12/16卷的字段(从36字节开始偏移)
*/
typedef struct
{
    uint8_t BS_DrvNum;              /** 用于 MS-DOS 引导程序，0x00 用于软盘，0x80 用于固定磁盘。其实这取决于操作系统 */
    uint8_t BS_Reserved;            /** 保留，创建卷时设为0 */
    uint8_t BS_Sig;                 /** 扩展启动签名(0x29)，用来标志存在下面的三个字段 */
    uint32_t BS_VolID;              /** 与BS_VolLab一起使用的卷序列号，用来跟踪可移动存储的卷 */
    uint8_t BS_VolLab[11];           /** 与根目录中记录的卷匹配。 */
    uint8_t BS_FilSysType[8];       /** FAT类型，设为FAT12、FAT16或FAT。但一般不会用这个字段来判断FAT类型 */
    uint8_t BS_BootCode[448];       /** 引导程序。默认填充0 */
    uint16_t BS_BootSig;            /** 引导签名。固定0xaa55 */
}__attribute__((packed)) DBR_FAT1216_t;         // FAT12/16的字段(从36字节开始)。

/**
 * @brief DBR中FAT32卷的字段(从36字节开始偏移)
*/
typedef struct
{
    uint32_t BPB_FATSz32;           /** FAT的扇区数。FAT区域的大小为BPB_FATSz32 * BPB_NumFATs。这是确定FAT类型需要参考的字段 */
    uint16_t BPB_ExtFlags;          /** 指示FAT状态
                                        Bit3-0  从0开始的活动FAT。当bit7=1时有效
                                        Bit6-4  保留，默认填充0
                                        Bit7    表示每个FAT都处于活动状态。
                                        bit15-8 保留，默认填充0
                                     */
    uint16_t BPB_FSVer;             /** FAT32的版本。高字节是主要版本，低字节是次要版本 */
    uint32_t BPB_RootClus;          /** 根目录的第一个簇号。一般设为2，即卷的第一个簇 */
    uint16_t BPB_FSInfo;            /** 与 FAT32 卷顶部偏移的 FSInfo 结构扇区。它通常设置为 1，在引导扇区旁边 */
    uint16_t BPB_BkBootSec;         /** 与 FAT32 卷顶部偏移的备份引导扇区的扇区。它通常设置为 6，在引导扇区旁边，但不推荐使用 6 和任何其他值 */
    uint8_t BPB_Reserved[12];       /** 保留，默认填充0 */
    uint8_t BS_DrvNum;              /** 与FAT12/16字段描述相同 */
    uint8_t BS_Reserved;            /** 与FAT12/16字段描述相同 */
    uint8_t BS_BootSig;             /** 与FAT12/16字段描述相同 */
    uint32_t VolID;                 /** 与FAT12/16字段描述相同 */
    uint8_t VolLab[11];             /** 与FAT12/16字段描述相同 */
    uint8_t BS_FilSysType[8];       /** 文件系统类型。一般始终为"FAT32"，一般不会用此字段来判断文件类型 */
    uint8_t BS_BootCode32[420];     /** 引导程序。不使用时填充0 */
    uint16_t BS_BootSign;           /** 引导签名。固定0xaa55 */
}__attribute__((packed)) DBR_FAT32_t;           // FAT32的字段(从36字节开始)。

/**
 * @brief DBR字段
*/
typedef struct
{
    DBR_GLOBAL_t global;
    union
    {
        DBR_FAT1216_t fat1216;
        DBR_FAT32_t fat32;
    };
}__attribute__((packed)) DBR_t;
```

通过DBR字段就可以推断出FAT区和数据区的位置和大小了.

一些打印信息来读取字段
```c
/**
 * @brief 打印MBR中指示分区的信息
*/
static void _print_mbr_partation(MBR_Partation_t *partation)
{
    if (!partation) return;

    printf("PT_BootID(0 boot，1 not boot):%#x\n"
            "PT_StartHd():%#x\n"
            "PT_StartCySc:%#x   %#x(bit9-0: 0-1023)  %#x(bit15-10:1-63)\n"// 0000 0001
            "PT_System:%#x\n"
            "PT_EndHd:%#x\n"
            "PT_EndCySc:%#x\n"
            "PT_LbaOfs:%#x(%#x)\n"
            "PT_LabSize:%#x(%#x  %d kb)\n",
            partation->PT_BootID,
            partation->PT_StartHd,
            partation->PT_StartCySc, partation->PT_StartCySc & 0x03FF, (partation->PT_StartCySc & 0xFC00) >> 10,
            partation->PT_System,
            partation->PT_EndHd,
            partation->PT_EndCySc,
            partation->PT_LbaOfs, partation->PT_LbaOfs * 512,
            partation->PT_LabSize, partation->PT_LabSize * 512, partation->PT_LabSize * 512 / 1024);
}

/**
 * @brief 读取MBR字段
*/
static void _read_mbr(void)
{
    MBR_t mbr;
    disk_read(0, &mbr, 0, 1);

    printf("MBR_bootcode:xxx\n"
            "MBR_Sig:%#x\n", mbr.MBR_Sig);

    MBR_Partation_t *partation;
    printf("分区1信息:\n");
    _print_mbr_partation(&mbr.MBR_Partation1);
    printf("分区2信息:\n");
    _print_mbr_partation(&mbr.MBR_Partation2);
    printf("分区3信息:\n");
    _print_mbr_partation(&mbr.MBR_Partation3);
    printf("分区4信息:\n");
    _print_mbr_partation(&mbr.MBR_Partation4);
}

/**
 * @brief 读取DBR字段,在这里可以获取较详细的数据信息
*/
static void _read_dbr(void)
{
    DBR_t data;
    disk_read(0, &data, 63, 1);

    DBR_t *dbr = (DBR_t *)&data;

    int BPB_TotSec = dbr->global.BPB_TotSec16 ? dbr->global.BPB_TotSec16 : dbr->global.BPB_TotSec32;
    int BPB_FATSz = dbr->global.BPB_FATSz16 ? dbr->global.BPB_FATSz16 : dbr->fat32.BPB_FATSz32;


    /** FAT区偏移量和大小 */
    int FatStartSector = dbr->global.BPB_RsvdSecCnt;                        /** FAT区起始扇区位置 */
    int FatSectors = BPB_FATSz * dbr->global.BPB_NumFATs;                   /** FAT区占用扇区数 */
    printf("FAT区数量:%d FAT区偏移量:%d  FAT区大小:%d  单位:扇区\n", dbr->global.BPB_NumFATs, FatStartSector, FatSectors);

    /** 根目录偏移量和大小(FAT32不存在根目录区，该位置会被数据区顶替) */
    int RootDirStartSector = FatStartSector + FatSectors;  
    int RootDirSector = 0;  
    if (dbr->global.BPB_RootEntCnt)                                                               /** 根目录起始扇区 */
    {
        RootDirSector = (32 * dbr->global.BPB_RootEntCnt + dbr->global.BPB_BytesPerSec - 1) / dbr->global.BPB_BytesPerSec;  /** 根目录占用扇区数 */
        printf("根目录偏移量:%d  根目录大小:%d  单位:扇区\n", RootDirStartSector, RootDirSector);
    }
    else
    {
        RootDirSector = 0;
        printf("不存在根目录\n");
    }


    /** 数据区偏移量和大小 */
    int DataStartSector = RootDirStartSector + RootDirSector;           /** 数据区起始扇区 */
    int DataSectors = BPB_TotSec - DataStartSector;                     /** 数据区扇区总数 */
    printf("数据区偏移量:%d  数据区大小:%d  单位:扇区\n", DataStartSector, DataSectors);

    /** 获取本卷上簇的数量 */
    int CountofClusters = DataSectors / dbr->global.BPB_SecPerClus;
    printf("卷内簇总数:%d\n", CountofClusters);
    if (CountofClusters <= 4085)
    {
        printf("卷类型:FAT12\n");
    }
    else if (CountofClusters >= 4086 && CountofClusters <= 65525)
    {
        printf("卷类型:FAT16\n");
    }
    else
    {
        printf("卷类型:FAT32\n");
    }

    /** 卷的扇区总数 */
    printf("卷内扇区总数:%d 每扇区字节数:%d 卷总字节数:%dkb\n", BPB_TotSec, dbr->global.BPB_BytesPerSec, dbr->global.BPB_BytesPerSec * BPB_TotSec / 1024);
    printf("每簇扇区数:%d 每磁道扇区数:%d\n", dbr->global.BPB_SecPerClus, dbr->global.BPB_SecPerTrk);
}

```

FAT区

[文件分配表(FAT)及其结构_千金甜果的专栏](https://www.bthss.com/info/%E6%96%87%E4%BB%B6%E5%88%86%E9%85%8D%E8%A1%A8FAT%E7%9A%84%E4%BD%9C%E7%94%A8%E5%8F%8A%E7%B1%BB%E5%88%AB.html)

FAT区用来标识一个文件的簇数.FAT32的FAT区每个单元有4字节,其中FAT[0]表示FAT介质类型,FAT[1]表示FAT错误标志,从FAT[2]开始表示文件,每个FAT单元填入一个簇号(0x00000001-0xffffffef)代表一个簇,当该FAT单元的值为0xFFFFFFF8时表示文件末尾.因此可以推断从上个文件末尾到下一个文件末尾的FAT单元数量来推断出文件的大小(簇数).

数据区(TODO)


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



## 海曼红外图像传感器调试


示例时序:

```shell
# 依次操作以下时序
i2c_addr    reg_addr    value
0x1A        0x01        0x01
0x1A        0x03        0x0C
0x1A        0x04        0x0C
0x1A        0x05        0x0C
0x1A        0x06        0x14
0x1A        0x07        0x0C
0x1A        0x08        0x0C
0x1A        0x09        0x88

0x1A        0x01        0x09
0x1A        0x02        ??

#> wait 30ms
0x1A        0x02        ??
0x1A        0x0A        PTAT1(MSB) PTAT1(LSB) P0,0(MSB) P0,0(LSB) ... Px,y(MSB) Px,y(LSB)
0x1A        0x0B        PTAT2(MSB) PTAT2(LSB) P0,0(MSB) P0,0(LSB) ... Px,y(MSB) Px,y(LSB)
0x1A        0x01        0X00
```




## 查看elf文件

```shell
readelf -s link_example.o   // 查看符号表
objdump -r link_example.o   // 查看重定位表
```

## 适配ch341转uart的驱动
https://github.com/allanbian1017/i2c-ch341-usb
编译并安装ko后，可以使用iic设备文件来操作ch341a模块

libusb函数说明：https://blog.csdn.net/wince_lover/article/details/70337809
github示例代码：https://github.com/craftor/usb2iic/blob/master/Example/linux/ezusb.c

## 配置ssh默认链接

[vscode SSH 保存密码自动登录服务器](https://www.jianshu.com/p/cc1f599c8841)

1. 生成本地RSA密钥
2. 输入`ssh-copy-id -i ~/.ssh/id_rsa.pub username@192.168.2.22`
3. 根据提示输入密码，并得到以下界面
   ```shell
    /usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/Users/username/.ssh/id_rsa.pub"
    /usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
    /usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
    username@192.168.2.22's password: 
   
    Number of key(s) added:        1
   
    Now try logging into the machine, with:   "ssh 'username@192.168.2.22'"
    and check to make sure that only the key(s) you wanted were added.    
   ```
4. 完成，此时执行`ssh username@192.168.2.22`可以直接通过ssh登录远程主机


Windows添加ssh密钥远程连接主机
1. 生成ssh密钥,执行`ssh-keygen.exe -t rsa -C "lxowalle@outlook.com"`
2. 在远程主机上添加本地密钥,执行` ssh-copy-id -i ~/.ssh/id_rsa.pub lxo@192.168.43.128`
3. VSCODE上添加本地密钥路径:
```shell
Host 192.168.43.128
  HostName 192.168.43.128
  User lxo
  IdentityFile "~/.ssh/id_rsa"
# Host 任意填写
# HostName 目标主机的地址或域名
# User  登录时的用户名
# IdentityFile 私钥文件路径
```


#### RISCV 汇编

[RISCV 手册](http://riscvbook.com/chinese/RISC-V-Reader-Chinese-v2p1.pdf)
[RISCV 汇编伪指令](http://events.jianshu.io/p/3f7387faceef)
[RISCV 汇编特权指令](https://juejin.cn/post/6891962672892837901)


#### Bootloader的说明

[bootloader 详细介绍](https://www.cnblogs.com/anandexuechengzhangzhilu/p/10719869.html)


#### lwip移植

[LWIP官网地址](https://savannah.nongnu.org/projects/lwip/)
[GIT下载地址](https://git.savannah.gnu.org/git/lwip.git)

#### 更新fork的仓库

```shell
# 1. 进入本地仓库
cd pjproject
# 2. 执行git remote -v查看当前分支
lxo@ubuntu:~/pjproject$ git remote -v
origin  git@github.com:lxowalle/pjproject.git (fetch)
origin  git@github.com:lxowalle/pjproject.git (push)

# 3. 上述是没有上游分支的，所以先添加上游分支
lxo@ubuntu:~/pjproject$ git remote add upstream https://github.com/pjsip/pjproject.git
lxo@ubuntu:~/pjproject$ git remote -v
origin  git@github.com:lxowalle/pjproject.git (fetch)
origin  git@github.com:lxowalle/pjproject.git (push)
upstream        https://github.com/pjsip/pjproject.git (fetch)
upstream        https://github.com/pjsip/pjproject.git (push)

# 4. 拉取上游分支最新代码
lxo@ubuntu:~/pjproject$ git fetch upstream 

# 5. 将上游分支的代码合并到本地分支
lxo@ubuntu:~/pjproject$ git merge upstream/master

# 6. 上推拉取的仓库
lxo@ubuntu:~/pjproject$ git push
```

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



#### 解决Rust执行cargo build时提示Waiting for File Lock on Package Cache Lock的问题

删除`~/.cargo/.package-cache`文件
#### --

```c
#if 1
    uint8_t *buffer = pvPortMalloc(FACEDB_SECTOR_SIZE);
    if (!buffer) {printf("buffer is BULL\n"); exit(-1);}

    int fd = aos_open("/romfs/facedb", O_RDWR);
    if (fd)
    {
        int j = 0x01;
        int len = 0;
        for (int i = DB_START_ADDRESS; i < DB_START_ADDRESS + DB_REAL_ADDR_SIZE; i += FACEDB_SECTOR_SIZE)
        {
            memset(buffer, j, FACEDB_SECTOR_SIZE);

            len = db_device_write(i, buffer, FACEDB_SECTOR_SIZE);
            if (len <= 0) {printf("l:%d  i:%#x j:%d len:%d\n", __LINE__, i, j, len); exit(-1);}

            len = db_device_read(i, buffer, FACEDB_SECTOR_SIZE);
            if (len <= 0) {printf("l:%d  i:%#x j:%d len:%d\n", __LINE__, i, j, len); exit(-1);}

            for (int k = 0; k < FACEDB_SECTOR_SIZE; k ++)
            {
                if (buffer[k] != j)
                {
                    printf("l:%d  i:%#x j:%d k:%d  data:%d\n", __LINE__, i, j, k, buffer[i]);
                    exit(-1);
                }
            }
            j ++;
        }
        aos_close(fd);
        vPortFree(buffer);
    }

    exit(-1);
#endif
```



#### 获取程序执行时间的简化宏

```c
// 开始
#define _TIME_BEGIN(name) uint64_t tv##name; \
        tv##name = CPU_Get_MTimer_US();

// 结束
#define _TIME_END(name) uint64_t tv2##name = CPU_Get_MTimer_US();\
        printf("[%s] exectime is %lld us, %lld ms\n", #name, tv2##name - tv##name, (tv2##name - tv##name) / 1000);
```



#### Rust二进制转结构体，unsafe实现

```rust
#[repr(C)]
struct Row {
    header: [u8; 16],
    version: [u8; 8]
}

unsafe fn deserialize_row(src: Vec<u8>) ->  Row{
    std::ptr::read(src.as_ptr() as *const _)
 }

fn main(){
    unsafe {
        let row = deserialize_row(contents);
        println!("row header: {:?}", row.header);
        println!("row version: {:?}", row.version);
    }
    
}
```



#### 查找rust的库

https://crates.io/



#### Rust序列化/反序列化框架

[Rust 序列化反序列框架 Serde](https://www.rectcircle.cn/posts/rust-serde/)

- 对JSON进行序列化和反序列化

  ```c
  // Cargo.toml添加依赖
  serde = { version = "1.0", features = ["derive"] }
  serde_json = "1.0"
      
  // main.rs
  use serde::{Serialize, Deserialize};
  use serde_json;
  
  #[derive(Serialize, Deserialize)]
  struct Color {
      r: u8,
      g: u8,
      b: u8
  }
  
  fn main(){
      let data = r#"
          {
              "r": 31,
              "g": 43,
              "b": 12
          }"#;
  
      // 解析字符串到Person对象。
      let p: Color = serde_json::from_str(data).unwrap();
      println!("Color: {} {} {}", p.r, p.g, p.b);
      
      // Person对象转为JSON字符串.
      let serialized = serde_json::to_string(&p).unwrap();
      println!("serialized = {}", serialized);
  }
  ```

#### 解决微信输入汉字是方块的问题
https://github.com/wszqkzqk/deepin-wine-ubuntu/issues/136


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

#### loop设备使用

loop用来模拟块设备

```shell
# 创建一个文件
dd if=/dev/zero of=sd_card bs=1M count=128

# 将文件转换为块设备
losetup -f                  # 1. 先找到空闲的loop设备
losetup /dev/loop15 sd_card # 2. 将空闲loop设备连接到文件

# 查看刚刚创建的块设备
lsblk | grep /dev/loop15
losetup -a

# 删除块设备(断开连接)
losetup -d /dev/loop15
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
>   arm-linux-gnueabihf-gcc -v
> 2. 查看工具链位置
> 3. 查看kernel头版本
>   进入工具链的linux/version.h文件，通过宏LINUX_VERSION_CODE的值获取，该宏的bit23-bit16是大版本号，bit15-bit8是中版本号，bit7-bit0是小版本号
-----


#### 数据结构体与算法

[数据结构与算法](https://www.cxyxiaowu.com/7072.html)


#### ubuntu创建桌面启动文件

1. 创建desktop后缀的文件

```shell
touch my_app.desktop
```

2. 写入代码

**不需要root权限**
```shell
[Desktop Entry]
Name=MyAPP
Exec=your/path/my_app
Icon=your/path/pic_for_myapp.jpg
Terminal=false
StartupNotify=false
Type=Application
```
**需要root权限**
```shell
[Desktop Entry]
Name=MyAPP
Exec=sudo your/path/my_app          # sudo
Icon=your/path/pic_for_myapp.jpg
Terminal=false
StartupNotify=false
Type=Application
```
注：
> 1. 在添加sudo权限后，可以再添加-p来指定密码，但是这样不安全。
> 2. 在添加sudo权限后，可以通过visudo命令来修改/etc/sudoers文件来让该程序无需输入密码，这样更安全。修改方式：执行visudo，在打开的文件末尾添加`sipeed ALL=NOPASSWD:/home/sipeed/sipeed/tools_for_bl/flash_tool/BLDevCube`，如果不在末尾添加这段代码，则可能会被其他代码覆盖导致不生效。

3. 更改文件权限

```shell
sudo chown -R $USER:$USER my_app.desktop
sudo chmod +x my_app.desktop
```

4. 检查文件是否合法

```shell
desktop-file-validate my_app.desktop
```

5. 完成，双击启动

#### c警告

```c
// 将`char-subscripts`当成警告处理
#pragma GCC diagnostic warning "-Wchar-subscripts"

// 忽略`-Wchar-subscripts`检查
#pragma GCC diagnostic ignored "-Wchar-subscripts"
```

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

// 忽略`-Wformat`检查
#pragma GCC diagnostic push 
#pragma GCC diagnostic ignored "-Wformat" 
// code
// ...
#pragma GCC diagnostic pop
```

#### GDB命令调试rv
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
q                   退出gdb
```

##### 
stack_wifi

wifi_sta_ip_set 192.168.1.212 255.255.255.0 192.168.1.1 114.114.114.114 114.114.114.114
wifi_sta_connect Sipeed_2.4G aPy5W9x.
wifi_sta_info

#### 抓摄像头数据
1. 检查是否支持debugfs文件系统

```shell
# 检测内核是否支持 debugfs 文件系统
cat /proc/filesystems | grep "debugfs"
# 挂载 debugfs 文件系统
sudo mount -t debugfs none_debugs /sys/kernel/debug
```
2. 安装usbmon,参考[这里](https://blog.51cto.com/u_11616959/4754739)

```shell
# 确认内核支持 usbmon 模块
ls /sys/module/usbmon
# 安装 usbmon 模块
modprobe usbmon
```

3. 安装使用tcpdump和libpcap

```shell
# 安装tcpdump
sudo apt install tcpdump
# 安装libpcap-dev
sudo apt install libpcap-dev
# 查看设备,可以看到有usbmon设备
tcpdump -D
# 通过bus编号确认是哪个usbmon设备
sudo cat /sys/kernel/debug/usb/devices  # 找到对应设备的BUS=01，则代表usbmon1设备
# 截取设备数据,这里假设设备为usbmon1
tcpdump -i usbmon1 -w ~/usb_log.pcap
```

4. 安装wireshark解析usb_log.pcap文件

```shell
# 安装wireshark
sudo add-apt-repository ppa:wireshark-dev/stable
sudo apt update
sudo apt install wireshark          # 也可以直接安装，但可能不是最新版wireshark
# 将当前用户添加到wireshark组
sudo usermod -aG wireshark $(whoami)
# 启动wireshark->文件->打开并找到usb_log.pcap文件
```


#### 5点关键点计算欧拉角

注：
pitch 俯仰角 绕x轴旋转
yaw 偏航角 绕y轴旋转
roll 摆动角 绕z轴旋转

```c
static float get_roll(int l_eye_x, int l_eye_y, int r_eye_x, int r_eye_y) {
    float a = r_eye_x - l_eye_x;
    float b = r_eye_y - l_eye_y;

    if (fabs(a) < 0.0000001f)   return 0.f;
    else {
        float res = atanf(1 - a / b) * 180.0f / 3.1415926;
        return res >= 0 ? res - 90 : res + 90;        
    }
}

static float get_yaw(int nose_x, int face_x, int face_w) {
    float a = nose_x - face_x;
    float b = a / (face_w >> 1) - 1;
    return asinf(b) * 180 / 3.1415926;
}

static float get_pitch(int nose_y, int face_y, int face_h)
{
	float a = nose_y - face_y;
	float b = a / (face_h * 0.6f) - 1;
	return asinf(b) * 180 / 3.1415926;
}
```

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


### openssl加解密

```shell
# 加密
openssl enc -e -aes-128-cbc -in input.bin -out encrypt.bin -K 112233445566778899AABBCCDDEEFF00 -iv 112233445566778899AABBCC00000000 -p -nosalt

# 解密
openssl aes-128-cbc -d -in encrypt.bin -out decode.bin -K 112233445566778899AABBCCDDEEFF00 -iv 112233445566778899AABBCC00000000 -p -nosalt
```

### uvc摄像头

使用lsusb检查uvc摄像头
```shell
lsusb -d ffff:ffff -v | grep "14 Video"     # lsusb -d pid:vid -v | grep "14 Video" 
```

使用v4l-utils检查uvc摄像头
```shell
sudo apt install v4l-utils
v4l2-ctl --list-devices
v4l2-ctl -d /dev/video0 --list-formats
```

使用python-cv2显示摄像头数据
```python
import cv2

cap = cv2.VideoCapture(0)
cap.set(3,640)#宽
cap.set(4,480)#高

while True:
    # 一帧一帧的获取图像
    ret,frame = cap.read()
    if ret == True:
        frame = cv2.flip(frame, 1)
    # 显示结果帧
    cv2.imshow("frame", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
# 释放摄像头资源
cap.release()
cv2.destroyAllWindows()
```

#### ubuntu 上微信不能压缩图片

需要安装微信支持的压缩库
```shell
sudo apt-get install libjpeg62:i386
```