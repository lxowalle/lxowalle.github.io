# 搭建gitlab

#### 搭建gitlab

[gitlab官网](https://about.gitlab.com/install/)

[gitlab-ce清华源](https://mirrors.tuna.tsinghua.edu.cn/help/gitlab-ce/)

需要注意gitlab有ce和ee两个版本，其中ce是社区版可以免费使用，ee是企业版会收费。

```shell
# 安装依赖
sudo apt-get update
sudo apt-get install -y curl openssh-server ca-certificates tzdata perl

# 使用清华源安装,先安装证书
curl https://packages.gitlab.com/gpg.key 2> /dev/null | sudo apt-key add - &>/dev/null

# 再添加仓库源，把deb https://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/ubuntu focal main写入到/etc/apt/sources.list.d/gitlab-ce.list中

# 开始安装
sudo apt-get update
sudo EXTERNAL_URL="192.168.0.144:8083" apt-get install gitlab-ce

# 配置gitlab
sudo gitlab-ctl reconfigure

# 启动gitlab
sudo gitlab-ctl start

# 启动后可以开始登录了，网页端输入"http://192.168.0.144:8083/"即可登录
```

检查端口是否占用

```shell
# 使用lsof
lsof -i:端口号

# 使用netstat
netstat -tunlp | grep 8083
```

如果端口被占用，则修改gitlab配置文件`/etc/gitlab/gitlab.rb`中的`external_url 'http://192.168.0.144:8083'`内容

检查和修改sshd是否支持对应的ssh端口

```shell
# 查看ssh配置
sudo vim /etc/ssh/sshd_config
# 添加需要的Port xxx ,并保存
# 重启sshd
sudo /etc/init.d/ssh restart
```

修改gitlab端口号

```shell
# 打开/etc/gitlab/gitlab.rb
sudo vim /etc/gitlab/gitlab.rb
# 使能并配置ssh端口
gitlab_rails['gitlab_shell_ssh_port'] = 22111
# 重写配置
sudo gitlab-ctl reconfigure
```

基础命令

```shell
# 配置
gitlab-ctl reconfigure
# 启动
sudo gitlab-ctl start
# 停止
sudo gitlab-ctl stop
# 重启
sudo gitlab-ctl restart
# 开机启动
systemctl enable gitlab-runsvdir.service
# 禁止开机自启动
systemctl disable gitlab-runsvdir.service
```

获取管理员密码

```shell
# 1. 进入/opt/gitlab/bin目录
cd /opt/gitlab/bin
# 2. 管理用户
sudo gitlab-rails console -e production
# 3. 在第2步出现的命令栏输入指令来管理用户
--------------------------------------------------------------------------------
 Ruby:         ruby 2.7.5p203 (2021-11-24 revision f69aeb8314) [x86_64-linux]
 GitLab:       15.2.2 (4ecb014a935) FOSS
 GitLab Shell: 14.9.0
 PostgreSQL:   13.6
------------------------------------------------------------[ booted in 24.62s ]
Loading production environment (Rails 6.1.4.7)
irb(main):001:0> u=User.where(id:1).first			# 获取第一个用户，即root
=> #<User id:1 @root>
irb(main):003:0> u.password='sipeed123'				# 修改密码为'sipeed123'
=> "sipeed123"
irb(main):004:0> u.password_confirmation='sipeed123'	# 确认密码为'sipeed123'
=> "sipeed123"
irb(main):005:0> u.save!							# 保存
=> true
irb(main):006:0> exit								# 退出
```
