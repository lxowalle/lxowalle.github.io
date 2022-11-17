---
title: git问题记录
date: 2021-11-12 20:01:23
tags:
---

# git问题记录


#### git出现object file is empty问题的解决方法

[参考文章](https://segmentfault.com/a/1190000008734662)

步骤：
1. `git fsck --full`
2. `find . type f -empty -delete -print`   ,目的是删除空文件，如果不想删掉有用的空文件可以选择手动删除空文件(一般有用的空文件都被git追踪了，大部分情况不需要担心)
3. `tail -n 2 .git/logs/refs/heads/xxx`,获取目标分支的最后两个提交，xxx填分支名称
4. `git update-ref HEAD xxx`,将HEAD指针指向最后第二提交,xxx填第二个分支的hash值
5. `git pull`,拉取代码
6. 完成

#### git取消跟踪文件
1. 取消跟踪所有文件,保留本地文件：git rm -r --cached
2. 取消跟踪所有文件,删除本地文件：git rm -r --f
3. 取消跟踪xxx文件,保留本地的xxx文件：git rm --cached   xxx
4. 取消跟踪xxx文件,删除本地的xxx文件: git rm --f xxx

**取消跟踪后本地的.gitignore仍然不生效的解决方法**

```shell
git rm -r --cached .
git add .
git commit -m "Update .gitignore"
```
#### 更新fork的仓库

```shell
# 1. 进入本地仓库
cd pjproject
# 2. 执行git remote -v查看当前分支
lxo@ubuntu:~/pjproject$ git remote -v
origin  git@github.com:lxowalle/pjproject.git (fetch)
origin  git@github.com:lxowalle/pjproject.git (push)

# 3. 上述是没有上游分支的，所以先添加上游分支
lxo@ubuntu:~/pjproject$ git remote add upstream https://github.com/pjsip/pjproject.git
lxo@ubuntu:~/pjproject$ git remote -v
origin  git@github.com:lxowalle/pjproject.git (fetch)
origin  git@github.com:lxowalle/pjproject.git (push)
upstream        https://github.com/pjsip/pjproject.git (fetch)
upstream        https://github.com/pjsip/pjproject.git (push)

# 4. 拉取上游分支最新代码
lxo@ubuntu:~/pjproject$ git fetch upstream 

# 5. 将上游分支的代码合并到本地分支
lxo@ubuntu:~/pjproject$ git merge upstream/master

# 6. 上推拉取的仓库
lxo@ubuntu:~/pjproject$ git push
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

#### git删除历史文件

参考自[Git如何永久删除文件(包括历史记录)](https://www.cnblogs.com/shines77/p/3460274.html)

```shell
# 1. 从本地仓库清除文件,在{path-to-your-remove-file}替换为需要删除的文件
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch {path-to-your-remove-file}' --prune-empty --tag-name-filter cat -- --all

# 2. 更新远程仓库
git push origin master --force --all

# 3. （如果打了标签）删除tag版本中的提交
git push origin master --force --tags

# 4. 清理残余的垃圾文件
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now
git gc --aggressive --prune=now
```