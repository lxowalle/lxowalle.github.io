---
title: SQLite库的使用记录.md
date: 2021-11-05 19:08:01
tags:
---

# SQLite库的使用记录

SQLite是一个适用于嵌入式设备的数据库，实现了无服务器、不需要配置、无事务性的SQL数据库引擎。使用时先参考[菜鸟教程](https://www.runoob.com/sqlite/sqlite-tutorial.html)了解数据库基本的增删查改功能，然后再通过C语言实现这些功能。

## 一、命令行操作SQLite

```shell
# 创建数据库
sqlite3 newdb.db	# 实际测试需要一些操作才会被创建,例如`进入数据库后，输入.database 和.quit`, 版本3.31.1

# 在命令栏输入.open打开（不存在则创建并打开）数据库
.open test.db

# .dump导出数据库
sqlite3 testDB.db .dump > testDB.sql

# 导入数据库
sqlite3 testDB.db < testDB.sql

# 创建一张表COMPANY
CREATE TABLE COMPANY(
ID INT PRIMARY KEY NOT NULL,
NAME TEXT NOT NULL
);

# 查看已有的表
.table

# .schema可以看到创建表时的命令？？
.schema COMPANY

# 删除表COMPANY
 DROP TABLE COMPANY;
 
# 向表COMPANY插入数据
INSERT INTO COMPANY (ID,NAME)
   ...> VALUES (1, 'test1');

INSERT INTO COMPANY (ID,NAME)
   ...> VALUES (2, 'test2');
   
# 显示表COMPANY的内容
.header on 						# 显示每列的名称
.mode column 					# 对齐
SELECT * FROM COMPANY;			# 显示所有列
SELECT ID,NAME FROM COMPANY;	# 只显示ID,NAME列
```

关于SQLite数据库的一些字段的解释：

```c
char *sql = "CREATE TABLE IF NOT EXISTS face("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "uid BLOB,"
            "auth INTEGER,"
            "name TEXT NOT NULL,"
            "job TEXT,"
            "note TEXT,"
            "ftr_passwd BLOB,"
            "ftr_face BLOB,"
            "ftr_finger BLOB,"
            "ftr_card BLOB,"
            "ftr_idcard BLOB"
            ");";
```
在上面的表格名后的类型解释：
1. INTEGER，带符号的整数
2. REAL，浮点值
3. TEXT，字符串（可选utf-8,utf-16be或utf-16le存储）
4. BLOB，根据输入类型存储

表格的约束条件：
NOT NULL 约束：确保某列不能有 NULL 值。
DEFAULT 约束：当某列没有指定值时，为该列提供默认值。
UNIQUE 约束：确保某列中的所有值是不同的。
PRIMARY Key 约束：唯一标识数据库表中的各行/记录。
CHECK 约束：CHECK 约束确保某列中的所有值满足一定条件。
NOT NULL 约束
默认情况下，列可以保存 NULL 值。如果您不想某列有 NULL 值，那么需要在该列上定义此约束，指定在该列上不允许 NULL 值。
NULL 与没有数据是不一样的，它代表着未知的数据
上面参考自[这里](https://blog.csdn.net/u014084081/article/details/32124799)

## 二、C语言操作数据库

[这里](https://developer.51cto.com/art/202009/627136.htm)

### 2.1 创建数据库
   创建一个数据库，直接调用sqlite提供的API创建。
```c
/**
 * @brief 创建数据库
 * @return
*/
int mf_sqlite_create_database(char *filename, sqlite3 **ppDb)
{
    if (filename == NULL || ppDb == NULL)
        return -1;

    int res = -1;

    /* 初始化数据库 */
    res = sqlite3_open(filename, ppDb);
    if (res)
    {
        printf("Can't open database:%s\n", sqlite3_errmsg(*ppDb));
        sqlite3_close(*ppDb);
        return -1;
    }

    return 0;
}
```

### 2.2 创建一张表
   
通过指令`CREATE TABLE IF NOT EXISTS table_name(table_member);`来创建表，其中`IF NOT EXISTS`表示表不存在时才创建，table_name表示新建表的名字，table_member表示新建表的字段类型和约束条件。

参考：
```
CREATE TABLE IF NOT EXISTS table_name(
   key BLOB NOT NULL,
   uid BLOB NOT NULL);
```

C代码：
```c
/**
 * @brief 创建一张表
 * @details
 * "key BLOB NOT NULL,uid BLOB NOT NULL"
 * @return
*/
int mf_sqlite_create_table(sqlite3 *database, char *table_name, char *member)
{
   if (database == NULL || table_name == NULL || member == NULL)
      return -1;

   sqlite3 *db = (sqlite3 *)database;
   char *err_msg = NULL;
   int ret = -1;
   char sql[256] = {0};

   /* 填充sql语句 */
   int len = snprintf(sql, sizeof(sql), "CREATE TABLE IF NOT EXISTS %s(%s);", table_name, member);
   if (len >= sizeof(sql)) return -1;

   /* 执行sql语句 */
   ret = sqlite3_exec(db, sql, NULL, 0, NULL);
   if (ret != SQLITE_OK)
   {
      fprintf(stderr, "DB error: %s %d\n", err_msg, ret);
      sqlite3_free(err_msg);
      return -1;
   }

   return 0;
}
```

### 2.3 删除一张表
通过指令`DROP TABLE table_name;`来删除表。

参考：
```
CREATE TABLE table_name;
```

C代码：
```c
int mf_sqlite_delete_table(sqlite3 *database, char *table_name)
{
   if (database == NULL || table_name == NULL)
      return -1;

   sqlite3 *db = (sqlite3 *)database;
   char *err_msg = NULL;
   int ret = -1;
   char sql[256] = {0};

   /* 填充sql语句 */
   int len = snprintf(sql, sizeof(sql), "DROP TABLE %s;", table_name);
   if (len >= sizeof(sql)) return -1;
   
   /* 执行sql语句 */
   ret = sqlite3_exec(db, sql, NULL, 0, NULL);
   if (ret != SQLITE_OK)
   {
      fprintf(stderr, "DB error: %s %d\n", err_msg, ret);
      sqlite3_free(err_msg);
      return -1;
   }

   return 0;
}
```

### 2.4 查询一张表是否存在
通过指令`SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'table_name';`来查看sqlite_master表中是否有目标表的信息。其中sqlite_master是数据库默认存在的表，用来保存用户的信息。table_name是需要查询的表的名字。

参考：
```
SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'table_name';
```

```c
/**
 * @brief 查看表是否存在
 * @return 返回表的数量
*/
int mf_sqlite_check_table(sqlite3 *database, char *table_name)
{
   if (database == NULL || table_name == NULL)
      return -1;

   sqlite3 *db = (sqlite3 *)database;
   sqlite3_stmt *stmt = NULL;
   int ret = -1, count = 0;
   char sql[256] = {0};

   /* 填充sql语句 */
   int len = snprintf(sql, sizeof(sql), "SELECT count(*) FROM sqlite_master WHERE type='table' AND name = '%s';", table_name);
   if (len >= sizeof(sql)) return -1;

   /* 将sql语句转换为二进制语句 */
   ret = sqlite3_prepare_v2(db, sql, strlen(sql), &stmt, NULL);
   if (ret != SQLITE_OK)
   {
      fprintf(stderr, "DB perpare error: %d\n", ret);
      return -1;
   }

   /* 执行二进制sql语句，并获取返回值 */
   while (sqlite3_step(stmt) == SQLITE_ROW)
   {
      count = sqlite3_column_int(stmt, 0);
   }

   /* 释放二进制sql语句的资源 */
   sqlite3_finalize(stmt);

   return count;
}
```

累了累了,待补..