---
title: Linux内核学习-模块编写
date: 2021-10-25 11:23:55
tag: Linux
categories: Linux内核学习
---

# Linux内核学习-模块编写

下面通过一个[github项目](https://github.com/junhuanchen/linux_python_ioctl_driver)来学习ko模块的编写过程。

## 一、用示例代码编译模块并使用（简单应用）

1. 拉取代码

```
git clone https://github.com/junhuanchen/linux_python_ioctl_driver
```

2. 工程简介

```
+---app				# 应用
+---dev				# 示例模块源码和编译框架源码
+---load_driver.sh	# 加载示例模块脚本
+---gitignore
+---README.md
```

3. 编译示例模块和应用程序，并加载模块

```
cd linux_driver/app && make				# 进入app目录，执行make
cd linux_driver/dev && make				# 进入dev目录，执行make
cd linux_driver && bash load_driver.sh	# 加载dev编译好的模块
```

4. 查看模块是否加载成功

```shell
# 方法1：查看是否加载这个模块
lsmod | grep ioctl	# 列出名字带有ioctl的模块
# 结果：
liuxo@liuxo-ubuntu:~/third_party/ioctl_driver/dev$ lsmod | grep ioctl
ioctl                  16384  0

# 方法2：查看/dev目录下是否有ioctl设备
ls /dev/ioctl
# 结果：
/dev/ioctl		
```

ps：

> 模块的基本操作有lsmod（列出所有已加载的模块）、insmod（加载一个模块）、rmmod（删除一个模块），详情谷歌百度

5. 运行app的可执行文件

```
cd linux_driver/app
sudo ./ioctl_app						# 运行可执行文件

#结果:
* Open Driver
Value is 305419896
* Close Driver
```



## 二、模块的代码框架

Linux的模块编写有固定的代码框架，主要包括c源文件、c头文件和Makefile文件。

以上面的dev文件下示例代码为例：

- 源文件：ioctl_interface.c 

- 头文件：ioctl.h、ioctl_dev.h

- Makefile：Makefile

注意：

> 文件名不受约束，可以自定义

### 2.1 源文件结构

先把示例模块的源文件基本内容整理出来：

```c
#include <linux/cdev.h>
#include <linux/fcntl.h>
#include <linux/init.h>
#include <linux/fs.h>
#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/semaphore.h>
#include <linux/slab.h>
#include <linux/types.h>
#include <asm/atomic.h>
#include <asm/io.h>
#include <asm/uaccess.h>
#include <linux/delay.h>
#include <linux/cdev.h>	

#include "ioctl_dev.h"
#include "ioctl.h"

/* store the major number extracted by dev_t */
int ioctl_d_interface_major = 0;
int ioctl_d_interface_minor = 0;

#define DEVICE_NAME "ioctl_d"
char* ioctl_d_interface_name = DEVICE_NAME;

ioctl_d_interface_dev ioctl_d_interface;

struct file_operations ioctl_d_interface_fops = {
	.owner = THIS_MODULE,
	.read = NULL,
	.write = NULL,
	.open = ioctl_d_interface_open,
	.unlocked_ioctl = ioctl_d_interface_ioctl,
	.release = ioctl_d_interface_release
};

/* Private API */
static int ioctl_d_interface_dev_init(ioctl_d_interface_dev * ioctl_d_interface)
{
}

static void ioctl_d_interface_dev_del(ioctl_d_interface_dev * ioctl_d_interface) 
{
}

static int ioctl_d_interface_setup_cdev(ioctl_d_interface_dev * ioctl_d_interface)
{
}

static int ioctl_d_interface_init(void)
{
}

static void ioctl_d_interface_exit(void)
{
}

/* Public API */
int ioctl_d_interface_open(struct inode *inode, struct file *filp)
{
}

int ioctl_d_interface_release(struct inode *inode, struct file *filp)
{
}

long ioctl_d_interface_ioctl(struct file *filp, unsigned int cmd, unsigned long arg)
{
}


module_init(ioctl_d_interface_init);
module_exit(ioctl_d_interface_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Florian Depraz <florian.depraz@outlook.com>");
MODULE_DESCRIPTION("IOCTL Interface driver");
MODULE_VERSION("0.1");
```

从上面可以看出源文件主要内容为：

```c
/* 头文件 */
// ...
/* 变量声明 */
// ...
/* 私有函数 */
// ...
/* 公开函数 */
// ...
/* 模块宏 */
```

#### 2.1.1 源文件的数据结构

用户根据功能定义的结构体暂不关注。

1. file_operations结构体

file_operations结构体是用来把系统调用和驱动程序关联起来的关键数据结构。这个结构的每一个成员都对应着一个系统调用。读取file_operation中相应的函数指针，接着把控制权转交给函数，从而完成了Linux设备驱动程序的工作。

**示例模块初始化file_operation:**

```c
struct file_operations ioctl_d_interface_fops = {
	.owner = THIS_MODULE,							// 模块拥有者,THIS_MODULE定义于<linux/module.h>
	.read = NULL,									// 操作文件时read()函数入口
	.write = NULL,									// 操作文件时write()函数入口
	.open = ioctl_d_interface_open,					// 操作文件时open()函数入口
	.unlocked_ioctl = ioctl_d_interface_ioctl,		// 操作文件时ioctl()函数入口
	.release = ioctl_d_interface_release			// 操作文件时release()函数入口
};
```

由上可以看出在Linux应用编程时读写文件的open,close之类的操作都是通过这个结构体实现的，在对文件执行系统调用时会指向这个函数的结构体成员。关于该结构体成员的更多解释见[Linux中的File_operations结构体](https://www.cnblogs.com/ZJoy/archive/2011/01/09/1931379.html)

#### 2.1.2 模块函数

源文件的一些其他函数与模块函数有关系，所以先看一下模块函数。

```c
module_init(ioctl_d_interface_init);						// 模块初始化入口
module_exit(ioctl_d_interface_exit);						// 模块反初始化入口

MODULE_LICENSE("GPL");											// 声明模块的证书
MODULE_AUTHOR("Florian Depraz <florian.depraz@outlook.com>");	// 声明模块的作者
MODULE_DESCRIPTION("IOCTL Interface driver");					// 模块的简单描述
MODULE_ALIAS("alias");											// 模块的别名
MODULE_VERSION("0.1");											// 模块的版本
MODULE_DEVICE_TABLE("support dev")								// 告诉用户空间该模块支持的设备类型
```

1. 关于module_init和module_exit

这两个函数用来传入模块初始化的函数指针，以及模块反初始化的函数指针

2. MODULE_xxx

这类宏用来作为模块的一些描述性声明，通常放在代码末尾。

ps:

> 关于module_init和module_exit较深入理解
>
> ​	最初在任意功能初始化时，都会在程序开始依次调用初始化函数，例如:
>
> ```c
> void init(void)
> {
>  init_a();
>  init_b();
> }
> ```
>
> ​	但是上面的初始化方法会反复修改init()函数，因此选择了通过一系列的宏来完成功能的初始化：
>
> ```c
> /**
> 功能：通过__attribute__来添加属性，让__init修饰的变量加入到".initlist"段中，这样在初始化的时候就可以在".initlist"段找到所有初始化函数。
> 说明：unused表示忽略不使用的编译警告，__section__(".initlist")表示链接时将目标内容加入到名为".initlist"的区段中。
> */
> #define __init   __attribute__((unused, __section__(".initlist")))
> 
> /**
> 功能：
> 说明：具体原理还没搞懂
> */
> #define __initlist(fn, lvl) 				\
> static initlist_t  __init_##fn __init = { 	\
> magic:    INIT_MAGIC, 					\
> callback: fn, 							\
> level:   lvl }
> ```
>
> ​	通过上面的宏，调用__initlist(fn, lvl)就可以将需要执行初始化的函数添加到".initlist"段，初始化程序只需要在这个段里查找初始化函数并执行即可，不需要反复修改init()函数。
>
> ​	内核也使用这种方法来添加模块：
>
> ```c
> #define module_init(x)     		__initcall(x);         	//include/linux/init.h 
> #define __initcall(fn) 			device_initcall(fn)  
> #define device_initcall(fn)     __define_initcall("6",fn,6) // 普通驱动优先级为6
> 
> /**
> 功能：将需要执行的模块初始化函数指针放到".initcall" level ".init"(这里的level决定了初始化等级，数值越低优先级越高)
> */
> #define __define_initcall(level,fn,id) \  
>       static initcall_t __initcall_##fn##id __used \
>       __attribute__((__section__(".initcall" level ".init"))) = fn  
> ```
>
> ​	通过调用module_init(x)宏可以将模块初始化指针加入到".initcall"区段，并统一初始化。还有其他类型的模块初始化，数值越低优先级越高
>
> ```c
> #define pure_initcall(fn)           __define_initcall("0",fn,0)  
> 
> #define core_initcall(fn)            __define_initcall("1",fn,1)  
> 
> #define core_initcall_sync(fn)          __define_initcall("1s",fn,1s)  
> 
> #define postcore_initcall(fn)             __define_initcall("2",fn,2)  
> 
> #define postcore_initcall_sync(fn)  __define_initcall("2s",fn,2s)  
> 
> #define arch_initcall(fn)            __define_initcall("3",fn,3)  
> 
> #define arch_initcall_sync(fn)          __define_initcall("3s",fn,3s)  
> 
> #define subsys_initcall(fn)                 __define_initcall("4",fn,4)  
> 
> #define subsys_initcall_sync(fn)      __define_initcall("4s",fn,4s)  
> 
> #define fs_initcall(fn)                          __define_initcall("5",fn,5)  
> 
> #define fs_initcall_sync(fn)               __define_initcall("5s",fn,5s)  
> 
> #define rootfs_initcall(fn)                  __define_initcall("rootfs",fn,rootfs)  
> 
> #define device_initcall(fn)                 __define_initcall("6",fn,6)  
> 
> #define device_initcall_sync(fn)       __define_initcall("6s",fn,6s)  
> 
> #define late_initcall(fn)             __define_initcall("7",fn,7)  
> 
> #define late_initcall_sync(fn)           __define_initcall("7s",fn,7s)
> ```

#### 2.1.3 模块内的函数

已经了解了外部如何与模块交互(通过file_operations结构体的函数成员)，以及模块的初始化、反初始化内容，那么现在可以看一下内部函数的实现。

1. ioctl_d_interface_dev_init

很普通的为所有变量赋予初值

```c
static int ioctl_d_interface_dev_init(ioctl_d_interface_dev * ioctl_d_interface)
{
	int result = 0;
    
    /* 清空ioctl_d_interface_dev配置 */
	memset(ioctl_d_interface, 0, sizeof(ioctl_d_interface_dev));
    
    /* 设置原子变量值为1 */
	atomic_set(&ioctl_d_interface->available, 1);
	
    /* 初始化信号量为1 */
    sema_init(&ioctl_d_interface->sem, 1);
	return result;
}
```

2. ioctl_d_interface_dev_del

```c
// 空
```

3. ioctl_d_interface_setup_cdev

更新自定义变量的值

```c
static int ioctl_d_interface_setup_cdev(ioctl_d_interface_dev * ioctl_d_interface)
{
  	int error = 0;
    /* 转换设备编号 */
	dev_t devno = MKDEV(ioctl_d_interface_major, ioctl_d_interface_minor);
	
    /* 初始化字符设备 */
	cdev_init(&ioctl_d_interface->cdev, &ioctl_d_interface_fops);
    ioctl_d_interface->cdev.owner = THIS_MODULE;			// 字符设备拥有者
	ioctl_d_interface->cdev.ops = &ioctl_d_interface_fops;	// 添加字符设备操作函数结构体
    
    /* 添加字符设备 */
	error = cdev_add(&ioctl_d_interface->cdev, devno, 1);

	return error;
}
```

4. ioctl_d_interface_init

```c
static int ioctl_d_interface_init(void)
{
	dev_t           devno = 0;
	int             result = 0;

    /* 调用上面自己编写的初始化函数 */
	ioctl_d_interface_dev_init(&ioctl_d_interface);

    /* 申请/注册主设备号 */
	result = alloc_chrdev_region(&devno, ioctl_d_interface_minor, 1, ioctl_d_interface_name);
	ioctl_d_interface_major = MAJOR(devno);
	if (result < 0) {
		printk(KERN_WARNING "ioctl_d_interface: can't get major number %d\n", ioctl_d_interface_major);
		goto fail;
	}

    /* 注册字符设备驱动(调用了上面自己编写的函数) */
	result = ioctl_d_interface_setup_cdev(&ioctl_d_interface);
	if (result < 0) {
		printk(KERN_WARNING "ioctl_d_interface: error %d adding ioctl_d_interface", result);
		goto fail;
	}

	printk(KERN_INFO "ioctl_d_interface: module loaded\n");
	return 0;

fail:
	ioctl_d_interface_exit();
	return result;
}
```

4. ioctl_d_interface_exit

```c
static void ioctl_d_interface_exit(void)
{
	dev_t devno = MKDEV(ioctl_d_interface_major, ioctl_d_interface_minor);

    /* 删除字符设备 */
	cdev_del(&ioctl_d_interface.cdev);
    
    /* 注销设备号 */
	unregister_chrdev_region(devno, 1);
	
    /* 调用自己编写的删除函数 */
    ioctl_d_interface_dev_del(&ioctl_d_interface);

	printk(KERN_INFO "ioctl_d_interface: module unloaded\n");
}
```

5. ioctl_d_interface_open

```c
int ioctl_d_interface_open(struct inode *inode, struct file *filp)
{
	ioctl_d_interface_dev *ioctl_d_interface;

   	/* 获取cdev成员的指针(目标inode->i_cdev指针，认为该指针是ioctl_d_interface_dev类型指针，并返回该类型中成员cdev所属结构体的首地址) */
	ioctl_d_interface = container_of(inode->i_cdev, ioctl_d_interface_dev, cdev);
	filp->private_data = ioctl_d_interface;

	if (!atomic_dec_and_test(&ioctl_d_interface->available)) // 原子读，会让该原子值-1；值减为0时返回1，反之返回0
    {
		atomic_inc(&ioctl_d_interface->available);	// 将该原子增1
		printk(KERN_ALERT "open ioctl_d_interface : the device has been opened by some other device, unable to open lock\n");
		return -EBUSY;		/* already open */
	}

	return 0;
}
```

6. ioctl_d_interface_release

被原子锁住时调用来释放原子锁

```c
int ioctl_d_interface_release(struct inode *inode, struct file *filp)
{
	ioctl_d_interface_dev *ioctl_d_interface = filp->private_data;
	atomic_inc(&ioctl_d_interface->available);	// 将该原子增1
	return 0;
}
```

7. ioctl_d_interface_ioctl

操作字符设备时很常用，通过ioctl函数调用该函数来配置模块功能。

```c
long ioctl_d_interface_ioctl(struct file *filp, unsigned int cmd, unsigned long arg)
{
	switch (cmd) {
		// Get the number of channel found
		case IOCTL_BASE_GET_MUIR:
			printk(KERN_INFO "<%s> ioctl: IOCTL_BASE_GET_MUIR\n", DEVICE_NAME);
			uint32_t value = 0x12345678;
			if (copy_to_user((uint32_t*) arg, &value, sizeof(value))){
				return -EFAULT;
			}
			break;

		default:
			break;
	}

	return 0;
}
```

### 2.2 头文件结构

从这个项目来看头文件对于模块的编写没有特殊作用，暂时略过

### 2.3 Makefile文件结构

先来整理一下Makefile文件的内容：

```makefile
MODULE = ioctl

## 检查KERNELRELEASE变量是否为空 ##
ifneq ($(KERNELRELEASE),)		# 判断KERNELRELEASE变量是否为空

## 添加内核模块编译对象和编译选项 ##
obj-m  		:= $(MODULE).o			# 告诉$(MODULE).o的模块对象(如果时内核模块，则使用obj-y)，内核Makefile会将该对象编译为.ko
$(MODULE)-y := ioctl_interface.o	# 加入当前模块依赖的其他对象文件
ccflags-y 	:= -std=gnu89 -g -Wall -Wno-unused-function -Wno-declaration-after-statement	# 配置编译选项

else

## 设置内核Makefile的路径 ##
ifeq ($(KDIR),)

DEFAULT_KDIR := /lib/modules/$(shell uname -r)/build
ERR_TEXT=export KDIR=<linux_src_dir> is empty. Using /lib/modules/$(shell uname -r)/build
$(warning $(ERR_TEXT))
KDIR := $(DEFAULT_KDIR)

endif 

## 执行内核Makefile ##
all:
	$(MAKE) clean
	$(MAKE) -C $(KDIR) M=$$PWD	// -C表示跳转到$(KDIR)目录读取Makefile；M=表示跳转后返回到$$PWD目录，继续执行当前Makefile

clean:
	rm -f *.o *~ core .depend .*.cmd *.ko *.mod.c modules.order Module.symvers
	rm -rf .tmp_versions

endif
```

这里Makefile文件的执行次序是先检查KERNELRELEASE变量是否为空（检查这个是为了判断是否加载了内核的Makefile），如果KERNELRELEASE变量为空则开始设置KDIR变量的路径（这个路径保存了内核Makefile的路径，后面会用到）。设置好KDIR变量后，开始通过$(MAKE) -C跳转到内核Makefile路径，并读取内核Makefile文件，然后通过M=设置读取完后返回的路径。并执行内核的Makefile。

这里Makefile的命令执行顺序还有些不懂，还需要多看些资料来了解。

​	kbuild的对象配置包括有：obj-y,obj-m,module_name-y,lib-y。此外还有extra-y,alway-y；编译标志有：ccflags-y,asflags-y,ldflags-y等等，这里扩展开后细节很多，需要了解的时候参考[官方说明](https://www.kernel.org/doc/html/latest/kbuild/makefiles.html)

 ps:

>ifeq(a,b)	判断a是否等于b
>
>KERNELRELEASE变量在内核Makefile中被定义，如果该变量值为空，则表示没有引用内核Makefile
>
>= 是最基本的赋值
>:= 是覆盖之前的值
>?= 是如果没有被赋值过就赋予等号后面的值
>+= 是添加等号后面的值



## 三、加载模块

工程的load_driver.sh文件时加载模块的脚本,我删减了一些不重要的信息：

```shell
#!/bin/bash

device_name=ioctl

## 加载模块
/sbin/insmod "./dev/$device_name.ko" || exit 1

## 获取模块的主设备号
major=$(cat /proc/devices | grep "$device_name")
major_number=($major)

## 删除旧设备文件
rm -f /dev/${device_name}

## 申请新设备文件（注意c表示字符设备，最后两个参数分别是主设备号和次设备号）
mknod /dev/${device_name} c ${major_number[0]} 0
```

 按脚本的内容来加载模块，注意mknod命令中c表示申请"字符设备"，b表示新建"块设备"

ps：

>系统通过一个32无符号数据为设备分配了设备号，其中高12位代表主设备号，低20位代表次设备号。

参考资料：

[Linux中的File_operations结构体](https://www.cnblogs.com/ZJoy/archive/2011/01/09/1931379.html)

[linux驱动的入口函数module_init的加载和释放](http://www.embeddedlinux.org.cn/emb-linux/kernel-driver/201710/25-7671.html#)

[The Linux kernel user’s and administrator’s guide](https://www.kernel.org/doc/html/latest/admin-guide/index.html)

