# MySQL的学习笔记
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















