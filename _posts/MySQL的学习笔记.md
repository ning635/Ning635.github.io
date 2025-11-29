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

# DQL语言
## 基础查询
select 查询列表 from 表名

1.查询表中的单个字段

USE myemployees;(**一定要记得先进入对应的库**）

select last_name from employees;

2.查询表中的多个字段

USE myemployees;

select last_name,email,hiredate from employees;

3.查询表中的所有字段

（1）双击对应的字段可以直接写出来，不用一个一个敲：

USE myemployees;

SELECT `first_name`,`last_name`,`email`,`phone_number`,`job_id`,`salary`,`commission_pct`,`manager_id`,`department_id`,`hiredate` FROM employees;

**`这个是着重号，当字段名字可能与库冲突的时候，可读性会变差，可以手动加上`**

（2）

USE myemployees;

SELECT * FROM employees;

这种方法按顺序输出字段，第一种方法可以自由选择顺序

4.查询常量值

SELECT 100;


SELECT 'john';（mysql里面没有区分字符和字符串，都默认为字符串，查询时要加上'')

5.查询表达式

SELECT 100*100;

6.查询函数

SELECT VERSION();（得到这个函数的返回值）

7.为字段起别名

方式一：

select 100%98 as 结果;

select last_name as 姓,first_name as 名 from employees;

方式二：（不用AS）

select 100%98  结果;

select last_name  姓,first_name  名 from employees;

**为了避免部分关键字冲突，要给别名加上双引号**

SELECT last_name  "姓",first_name  "名" FROM employees;

8.去重

案例：查询员工表中所有的部门编号

select department_id from employees;

发现编号有很多相同重复的，只需加一个distinct即可

select distinct department_id from employees;

9.+号的作用

mysql中+的作用：

**仅仅只有一个功能:运算符**

1.select 100+90; 两者都为数值型，做加法运算

2.select '123'+90; 

其中一方为字符型，试图将字符型转换成数值型；

如果转换成功，则将做加法运算;

如果转换失败，则将字符型数值转换为0；（select 'john'+90; 结果为90）

3.select null+100;  结果为null

**只要一方为null，结果必定为null**

案例：查询员工名和姓组成一个字段，并显示为姓名

显然：select last_name+first_name as 姓名 from employees; 这个不可行，结果为0

使用concat（）函数：

select concat(first_name,' ',last_name) as 姓名 from employees;


















