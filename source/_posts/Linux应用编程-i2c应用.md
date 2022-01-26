---
title: Linux应用编程-i2c应用
date: 2021-11-26 11:05:04
tags:
---

# Linux应用编程-i2c应用

应用程序通过/dev/i2c-xxx文件来访问i2c驱动

## i2c应用编程

```c
#include <sys/ioctl.h>
#include <unistd.h>
#include <stdint.h>
#include <fcntl.h>
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


## 应用

### 基于I2C协议读写温度传感器

```c
    /* iic test */
    uint8_t buff[256], data;
    char *iic_dev = "/dev/i2c-4";
    uint8_t slave_addr = 0x2c, reg_addr = 0x3c;     // 从机地址，寄存器地址

    int i2cfd = _i2c_init(iic_dev, NULL);
    if (i2cfd < 0)
        printf("Open ii2 dev failed!\n");   

    /* 读第一次 */
    _i2c_read(i2cfd, slave_addr, reg_addr, 1, buff);
    printf("%s read byte %#.2x from %#.2x\n", iic_dev, buff[0], slave_addr);

    /* 写第一次 */
    data = 0x99;
    _i2c_write(i2cfd, slave_addr, reg_addr, 1, &data);
    printf("%s write byte %#.2x from %#.2x\n", iic_dev, data, slave_addr);

    /* 读第二次 */
    _i2c_read(i2cfd, slave_addr, reg_addr, 1, buff);
    printf("%s read byte %#.2x from %#.2x\n", iic_dev, buff[0], slave_addr);

    /* 写第二次(写回去方便观察下次测试结果) */
    data = 0x45;
    _i2c_write(i2cfd, slave_addr, reg_addr, 1, &data);
    printf("%s write byte %#.2x from %#.2x\n", iic_dev, data, slave_addr);

    _i2c_deinit(i2cfd);
```

### 基于SMBus协议读写红外探头MLX90614

```c
    uint8_t buff[256], data;
    char *iic_dev = "/dev/i2c-4";
    uint8_t slave_addr = 0x00, reg_addr = 0x07;     // 从机地址，寄存器地址

    int i2cfd = _i2c_init(iic_dev, NULL);
    if (i2cfd < 0)
        printf("Open ii2 dev failed!\n");

    while (1)
    {
        float env_tmp = 0.0, obj_tmp = 0.0;
        /* 测试MLX90614红外温度探头 */
        /* 读环境温度 */
        slave_addr = 0x00;
        reg_addr = 0x06;
        _i2c_smbus_read(i2cfd, slave_addr, reg_addr, 4, buff);
        env_tmp = (buff[1] << 8 | buff[0]) * 0.02 - 273.15;
        
        /* 读物体温度 */
        slave_addr = 0x00;
        reg_addr = 0x07;
        _i2c_smbus_read(i2cfd, slave_addr, reg_addr, 4, buff);
        obj_tmp = (buff[1] << 8 | buff[0]) * 0.02 - 273.15;

        printf("env_tmp:%f    obj_tmp:%f\n", env_tmp, obj_tmp);
        usleep (100 * 1000);
    }

    _i2c_deinit(i2cfd);    
```


参考资料：

[Infrared Temperature Sensor用户手册](https://datasheet.lcsc.com/szlcsc/1909291034_Waveshare-Infrared-Temperature-Sensor_C431937.pdf)
[MLX90614 family](https://www.melexis.com/zh/documents/documentation/datasheets/datasheet-mlx90614)