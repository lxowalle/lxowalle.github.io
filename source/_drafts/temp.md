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

计算IOU总结为：两张图片相交部分面积除以两张图片叠加后的总面积

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
    mf_point_t C = {.x = ir_face->x1 + 122,.y = ir_face->y1 - 124}; // 手动映射
    mf_point_t D = {.x = ir_face->x2 + 185,.y = ir_face->y2 - 65};  // 手动映射
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
// 标记函数，该函数会在main之前被执行
_attribute__((constructor)) static void pre_main(void)
{
    printf("Hello!\n");
}

// 标记函数，并赋予优先级(1~100保留？未验证)
_attribute__((constructor(101))) static void pre_main1(void)
{
    printf("Hello pre_main1!\n");
}

_attribute__((constructor(102))) static void pre_main2(void)
{
    printf("Hello pre_main2!\n");
}
```

`_attribute__((constructor))`可以标记一个函数，让这个函数在main()或exit()之后执行。使用方法类似`_attribute__((constructor))`

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
1. `git fsck -full`
2. `find . type f -empty -delete -print`   ,目的是删除空文件，这行代码有可能会删掉有用的空文件，这时候可以选择手动删除空文件
3. `tail -n 2 .git/logs/refs/heads/xxx`,获取xxx分支的最后两个提交
4. `git update-ref HEAD`,将HEAD指针指向最后第二提交
5. `git pull`,拉取代码
6. 完成

#### git取消跟踪文件
1. 取消跟踪所有文件,保留本地文件：git rm -r --cached
2. 取消跟踪所有文件,删除本地文件：git rm -r --f
3. 取消跟踪xxx文件,保留本地的xxx文件：git rm --cache   xxx
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

FAT区用来标识一个文件的簇数.FAT32的FAT区每个单元有4字节,其中FAT[0]表示FAT介质类型,FAT[1]表示FAT错误标志,从FAT[2]开始表示文件,每个FAT单元代表一个簇,当该FAT单元的值为0xFFFFFFF8时表示文件末尾.因此可以推断从上个文件末尾到下一个文件末尾的FAT单元数量来推断出文件的大小(簇数).

数据区(TODO)

TODO:


1. UI
