---
title: 创建hexo博客
date: 2021-09-08 20:48:56
categories: "未分类"
tags:
---
# 创建hexo博客

参考自[这里](https://butterfly.js.org)

#### 一、 博客搭建过程

1. 安装git和nodejs

```shell
sudo apt-get install git
sudo apt-get install nodejs
sudo apt-get install npm
```

> 更新nodejs到最新版本
> sudo npm cache clean -f
> sudo npm install -g n
> sudo n lastest
> PATH="$PATH"

2. 安装hexo

```shell
sudo npm install hexo-cli -g
```

> 安装hexo过程中可卡在loadDep:use: sill install loadAllDepsIntoIdealTree时，删除博客目录下的package-lock.json后重试

1. 创建hexo博客

```shell
hexo init my_blog
cd my_blog
npm install
npm install hexo-deployer-git --save
```

4. 生成和部署博客

```shell
hexo g -d
```

5. 在github创建一个仓库，仓库名`username.github.io`，其中username表示github用户名。并为仓库创建一个分支hexo，设置分支hexo为默认分支。
6. 将仓库`username.github.io`克隆到本地，并将前面创建的博客文件全部复制到git中，添加.gitignore文件

```
### .gitignore的内容
.DS_Store
Thumbs.db
db.json
*.log
node_modules/
public/
.deploy*/
```

7. 更新分支

```
git add .
git commit –m "add branch"
git push origin hexo
```

#### 二、 博客转移方法

1. 克隆博客的git仓库

```
git clone git@xxx.github.io
```

2. 部署博客环境

```shell
cd xxx.github.io

sudo apt-get install git
sudo apt-get install nodejs
sudo apt-get install npm
sudo npm install hexo-cli -g

# 更新nodejs到最新版本:
> sudo npm cache clean -f
> sudo npm install -g n
> sudo n lastest
> PATH="$PATH"

sudo npm install
sudo npm install hexo-deployer-git --save

# 更新插件
npm install hexo-githubcalendar --save
npm install hexo-generator-search --save

hexo g && hexo d
```



Tips:

1. 通过该命令查看是否有git仓库的权限

> ssh -T git@github.com

2. 每次写完最好把源文件上传以下

```
git add .
git commit –m "xxxx"
git push 
```

#### 三、 HEXO指令

[参考链接](https://hexo.io/zh-cn/docs/commands.html)

##### 3.1 创建文章

```
hexo new "name"
```

##### 3.2 添加分类

1. 创建分类

```
hexo new page "未分类"
```

2. 找到"未分类"文件夹的index.md文件，在头部添加type属性，目的是给该分类一个别名，其他文章通过这个属性加入到该分类

```
title: 未分类
date: 2021-09-10 20:03:22
type: "none class"
```

3. 加入分类,在头部添加categories属性，并指定分类名

```
title: 创建博客
date: 2021-09-08 20:48:56
categories: "none class"
tags:
```
## 其他

1. 域名绑定

域名解析配置，阿里云的DNS配置点[这里](https://dns.console.aliyun.com/?spm=a2c63.p38356.879954.3.16456995sPbLcC#/dns/setting)
操作：
- 记录类型：CNAME
- 主机记录：@
- 线路类型：默认
- 记录值：lxowalle.github.io
- TTL:24H
- 完成

github pages的配置
操作：
- 进入xxx.github.io仓库
- 点击进入Setting
- 点击进入Page
- 找到Custom domain项，填入域名并保存(例如填入"lxowalle.cc")
- 完成

> 如果执行hexo g -d后发现github page配置的域名消失，尝试在source目录下新建一个CNAME文件，并填入自己的域名，例如"lxowalle.cc"

2. 添加github贡献度显示

操作：
- 安装插件
```
npm i hexo-githubcalendar --save
```

- 在hexo的config.yml添加配置

```yml
githubcalendar:
  enable: true
  enable_page: /  # 表示只在根目录(首页)显示
  user: lxowalle	  # 替换成你 GitHub 的用户名
  layout_id: recent-posts
  githubcalendar_html: '<div class="recent-post-item" style="width:100%;height:auto;padding:10px;"><div id="github_loading" style="width:10%;height:100%;margin:0 auto;display: block"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 50 50" style="enable-background:new 0 0 50 50" xml:space="preserve"><path fill="#d0d0d0" d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z" transform="rotate(275.098 25 25)"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"></animateTransform></path></svg></div><div id="github_container"></div></div>'
  pc_minheight: 280px
  mobile_minheight: 0px
  color: "['#ebedf0', '#fdcdec', '#fc9bd9', '#fa6ac5', '#f838b2', '#f5089f', '#c4067e', '#92055e', '#540336', '#48022f', '#30021f']"
  api: https://python-github-calendar-api.vercel.app/api
  # api: https://python-gitee-calendar-api.vercel.app/api
  calendar_js: https://cdn.jsdelivr.net/gh/Zfour/hexo-github-calendar@1.16/hexo_githubcalendar.js
```
颜色可以更换：
```
# 橘黄色调
color: "['#e4dfd7', '#f9f4dc', '#f7e8aa', '#f7e8aa', '#f8df72', '#fcd217', '#fcc515', '#f28e16', '#fb8b05', '#d85916', '#f43e06']"
# 翠绿色调
color: "['#ebedf0', '#f0fff4', '#dcffe4', '#bef5cb', '#85e89d', '#34d058', '#28a745', '#22863a', '#176f2c', '#165c26', '#144620']"
# 天青色调
color: "['#ebedf0', '#f1f8ff', '#dbedff', '#c8e1ff', '#79b8ff', '#2188ff', '#0366d6', '#005cc5', '#044289', '#032f62', '#05264c']"
```

- 更新配置

```
hexo clean && hexo g -d
```

3. 添加搜索功能

操作：
- 安装插件
```
npm install pug
npm install hexo-generator-search --save
```

如果出现问题，尝试运行
```
npm clean-install
```

- 修改全局配置_config.yml
```
search:
  path: search.xml
  field: post
  content: true
  template: ./search.xml
```
- 修改主题配置
```
local_search:
  enable: true
  labels:
    input_placeholder: Search for Posts
    hits_empty: "We didn't find any results for the search: ${query}" # if there are no result
```

参考链接:

[关于我 Butterfly 主题的所有美化](https://blog.imzjw.cn/posts/b74f504f)

[Hexo博客之butterfly主题优雅魔改系列](https://blog.csdn.net/u012208219/article/details/106883001/?utm_medium=distribute.pc_relevant.none-task-blog-2~default~baidujs_title~default-0.no_search_link&spm=1001.2101.3001.4242.0)