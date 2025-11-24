# MySQL的学习笔记
尚硅谷的基础篇加高级篇：https://www.bilibili.com/video/BV12b411K7Zu?spm_id_from=333.788.player.switch&vd_source=35450fe553c5b3e35dc064c98d2bcf6d&p=15
## 常见命令

1.看有哪些数据库：show databases;

2.打开想要打开的库：use mysql;

3.看已经打开的库里面所有的表：show tables;

4.或者打开指定的库里的表：show tables from 库名;

5.查看我现在在哪个库：select database();

6.在库里新建一个表：

create table 表名(

列名 列类型,

列名 列类型);

7.想看这个表的结构：desc 表名;

8.查看里面还有什么数据：select * from 表名;

9.在表中插入数据：insert into 表名(列名,列名) values(1,'join');

10.更改数据的名字：update 表名 set name='zheng' where 列名=1;

11.删除表里的某一行：delete from 表名 where 列名=1;

## 语法规范
1.不区分大小写，但建议关键字大写，表名，列名小写

2.每条命令用;结尾

3.每条命令根据需要，可以进行缩进和换行

4.注释

（1)单行注释：#注释文字

（2）多行注释：/* 注释文字 */

## sql语言
按照功能分为四个：

1.DQL语言：数据查询语言

2.DML语言：数据操纵语言

3.DDL语言：数据定义语言

4.TCL语言：数据控制语言







