---
title: Linux应用编程-i2c应用
date: 2021-11-26 11:05:04
tags:
---

# Linux应用编程-i2c应用

应用程序通过/dev/i2c-xxx文件来访问i2c驱动

## i2c应用编程

```c
#include <linux/i2c-dev.h>

/* 初始化iic设备 */
int _i2c_init(char* dev, void* param)
{
    int fd, res;
    (void)param;

    fd = open(dev, O_RDWR);
    if (fd < 0)
        return -1;

    res = ioctl(fd, I2C_TENBIT, 0);     // 禁止地址10bit
    if (res < 0)
        return -1;

    return fd;
}

/* 反初始化iic设备 */
void _i2c_deinit(int fd)
{
    close(fd);
}

/* iic写数据 */
void _i2c_write(int i2cfd, uint8_t addr, uint16_t reg_addr, int cnt, uint8_t* buf)
{
    int fd = i2cfd;

    /* 设置从机地址 */
    ioctl(fd, I2C_SLAVE, addr);     

    /* 写数据，注意如果把reg_addr和buf单独用write写，有可能写入失败 */
    uint8_t data[cnt + 1];
    data[0] = reg_addr;
    memcpy(data + 1, buf, cnt);
    write(fd, data, cnt + 1);
}


void _i2c_read(int i2cfd, uint8_t addr, uint16_t reg_addr, int cnt, uint8_t* buf)
{
    int fd = i2cfd;

    /* 设置从机地址 */
    ioctl(fd, I2C_SLAVE, addr);

    /* 读数据 */
    write(fd, &reg_addr, 1);
    read(fd, buf, cnt);
}
```

## SMBus应用编程

Linux的i2c驱动提供SMBus的方式读写，这是个和i2c很相似的协议。下面例子是使用SMBus读写单字节的例子

```c
#include <linux/i2c-dev.h>
#include <linux/i2c.h>

/* 初始化iic设备 */
int _i2c_init(char* dev, void* param)
{
    int fd, res;
    (void)param;

    fd = open(dev, O_RDWR);
    if (fd < 0)
        return -1;

    res = ioctl(fd, I2C_TENBIT, 0);     // 禁止地址10bit
    if (res < 0)
        return -1;

    return fd;
}

/* 反初始化iic设备 */
void _i2c_deinit(int fd)
{
    close(fd);
}

/* i2c smbus写数据 */
void _i2c_smbus_write(int i2cfd, uint8_t addr, uint16_t reg_addr, int cnt, uint8_t* buf)
{
    int fd = i2cfd;
    union i2c_smbus_data data;
    struct i2c_smbus_ioctl_data ioctl_data = {0};

    /* 设置从机地址 */
    ioctl(fd, I2C_SLAVE, addr);

    /* 设置要写入的内容 */
    data.byte = buf[0];

    /* 配置SMBus，并执行写数据 */
    ioctl_data.read_write = I2C_SMBUS_WRITE;    // 写操作
    ioctl_data.size = I2C_SMBUS_BYTE_DATA;      // 按字节写
    ioctl_data.command = reg_addr;              // 写的命令码(可以看成i2c协议的寄存器地址)
    ioctl_data.data = &data;                    // 写的数据内容
    ioctl(fd, I2C_SMBUS, &ioctl_data);
}

/* i2c smbus读数据 */
void _i2c_smbus_read(int i2cfd, uint8_t addr, uint16_t reg_addr, int cnt, uint8_t* buf)
{
    int fd = i2cfd;
    union i2c_smbus_data data;
    struct i2c_smbus_ioctl_data ioctl_data = {0};

    /* 设置从机地址 */
    ioctl(fd, I2C_SLAVE, addr);

    /* 配置SMBus，并执行读数据 */
    ioctl_data.read_write = I2C_SMBUS_READ;     // 读操作
    ioctl_data.size = I2C_SMBUS_BYTE_DATA;      // 按字节读
    ioctl_data.command = reg_addr;              // 读的命令码(可以看成i2c协议的寄存器地址)
    ioctl_data.data = &data;                    // 读的数据内容
    ioctl(fd, I2C_SMBUS, &ioctl_data);

    /* 返回读出的内容 */
    buf[0] = data.byte;
}
```