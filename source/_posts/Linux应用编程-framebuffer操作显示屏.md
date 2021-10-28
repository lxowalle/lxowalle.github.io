---
title: Linux应用编程-framebuffer操作显示屏
date: 2021-10-28 19:26:09
tags:
---

# Linux应用编程-framebuffer操作显示屏

## 一、简述

​	Linux framebuffer框架可以让上层程序通过操作内存（称为帧缓存）的方式来向显示屏读/写显示数据。framebuffer还支持双缓存，用一个帧填充显示数据，另一个帧显示，然后交换彼此的功能，一般用来应用于高频率显示的场景。

​	需要注意有些平台的framebuffer会自动将数据刷新到显示屏上，也有部分需要调用ioctl(fp, FBIOPAN_DISPLAY, &vinfo)参数才能刷新显示屏的数据。



## 二、应用

​	应用层一般通过操作文件的方式来操作framebuffer，一般framebuffer文件格式为/dev/fbx,下面的例子中操作的framebuffer的文件名为`/dev/fb0`。

​	下面的操作会从`/dev/fb0`读取当前显示屏的参数，然后通过mmap将显示区域映射到一个指针，这个指针指向了一块内存，读写这块内存的数据就等同于写入/读取显示屏的数据，非常简单。

```c
int main ()   
{  
    int fp=0;  
    struct fb_var_screeninfo vinfo;  
    struct fb_fix_screeninfo finfo;  
    long screensize=0;  
    char *fbp = NULL, *test_fbp=NULL;    

    /* 读/写的方式打开framebuffer的设备文件 */
    fp = open("/dev/fb0", O_RDWR);  
    if(fp < 0) {  
        printf("Error : Can not open framebuffer device/n");  
        exit(1);  
    }  

    /* 获取硬件决定的显示参数（这部分参数不能被修改） */
    if(ioctl(fp, FBIOGET_FSCREENINFO, &finfo)){  
        printf("Error reading fixed information/n");  
        exit(2);  
    }  

    /* 获取软件决定的显示参数（这部分参数可以由用户修改） */
    if(ioctl(fp, FBIOGET_VSCREENINFO, &vinfo)){  
        printf("Error reading variable information/n");  
        exit(3);  
    }  

    /* 获取一些显示参数 */
    screensize = vinfo.xres * vinfo.yres * vinfo.bits_per_pixel / 8;  
    printf("The phy mem = 0x%x, total size = %d(byte)\n", finfo.smem_start, finfo.smem_len);  
    printf("xres =  %d, yres =  %d, bits_per_pixel = %d\n", vinfo.xres, vinfo.yres, vinfo.bits_per_pixel);  
    printf("So the screensize = %d(byte), using %d frame\n", screensize, finfo.smem_len/screensize);
    printf("vinfo.xoffset = %d, vinfo.yoffset = %d\n", vinfo.xoffset, vinfo.yoffset);  
    printf("vinfo.vmode is :%d\n", vinfo.vmode);  
    printf("finfo.ypanstep is :%d\n", finfo.ypanstep);  
    printf("vinfo.red.offset=0x%x\n", vinfo.red.offset);
    printf("vinfo.red.length=0x%x\n", vinfo.red.length);
    printf("vinfo.green.offset=0x%x\n", vinfo.green.offset);
    printf("vinfo.green.length=0x%x\n", vinfo.green.length);
    printf("vinfo.blue.offset=0x%x\n", vinfo.blue.offset);
    printf("vinfo.blue.length=0x%x\n", vinfo.blue.length);
    printf("vinfo.transp.offset=0x%x\n", vinfo.transp.offset);
    printf("vinfo.transp.length=0x%x\n", vinfo.transp.length);
    
    /* 将显示内存映射出来，从这里开始，就可以通过操作fbp指向的内存来操作显示屏了 */
    fbp =(char *)mmap(0, screensize, PROT_READ | PROT_WRITE, MAP_SHARED, fp,0);  
    if ((int)fbp == -1)  
    {    
        printf ("Error: failed to map framebuffer device to memory./n");  
        exit (4);  
    }
    printf("Get virt mem = %p\n", fbp);  

    /* 刷新显示（有些framebuffer实现了自刷新，就可以不调用这个api） */
    ioctl(fp, FBIOPAN_DISPLAY, &vinfo);

	/* 解除映射 */
    munmap(fbp, screensize);
    
    /* 关闭fb驱动设备 */
    close (fp);
    return 0;
}  
```

​	根据上面的代码操作，就能实现通过framebuffer操作显示屏了，当然显示数据的写入方式和显示效果就是另一回事了。这里总结一下上面的流程：

- 打开framebuffer设备文件，一般是/dev/fb0
- 通过ioctl()获取显示屏的参数
- 通过mmap()将显示内存映射到一个指针fbp上
- 向这个指针fbp指向的内存读/写数据，相当于操作显示屏的显示
- 需要关闭时，使用munmap()解除映射并关闭设备文件

