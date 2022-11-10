---
title: Fatfs文件系统的移植
date: 2021-11-12 20:01:23
tags:
---

# Fatfs文件系统的移植

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