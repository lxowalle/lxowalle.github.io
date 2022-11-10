---
title: 抓取和显示video数据
date: 2021-09-14 20:40:42
categories: "未分类"
tags:
---
# 抓取和显示video数据


#### 分析video数据
1. 检查是否支持debugfs文件系统

```shell
# 检测内核是否支持 debugfs 文件系统
cat /proc/filesystems | grep "debugfs"
# 挂载 debugfs 文件系统
sudo mount -t debugfs none_debugs /sys/kernel/debug
```
2. 安装usbmon,参考[这里](https://blog.51cto.com/u_11616959/4754739)

```shell
# 确认内核支持 usbmon 模块
ls /sys/module/usbmon
# 安装 usbmon 模块
modprobe usbmon
```

3. 安装使用tcpdump和libpcap

```shell
# 安装tcpdump
sudo apt install tcpdump
# 安装libpcap-dev
sudo apt install libpcap-dev
# 查看设备,可以看到有usbmon设备
tcpdump -D
# 通过bus编号确认是哪个usbmon设备
sudo cat /sys/kernel/debug/usb/devices  # 找到对应设备的BUS=01，则代表usbmon1设备
# 截取设备数据,这里假设设备为usbmon1
tcpdump -i usbmon1 -w ~/usb_log.pcap
```

4. 安装wireshark解析usb_log.pcap文件

```shell
# 安装wireshark
sudo add-apt-repository ppa:wireshark-dev/stable
sudo apt update
sudo apt install wireshark          # 也可以直接安装，但可能不是最新版wireshark
# 将当前用户添加到wireshark组
sudo usermod -aG wireshark $(whoami)
# 启动wireshark->文件->打开并找到usb_log.pcap文件
```

#### 使用python-cv2显示摄像头数据
```python
import cv2

cap = cv2.VideoCapture(0)
cap.set(3,640)#宽
cap.set(4,480)#高

while True:
    # 一帧一帧的获取图像
    ret,frame = cap.read()
    if ret == True:
        frame = cv2.flip(frame, 1)
    # 显示结果帧
    cv2.imshow("frame", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
# 释放摄像头资源
cap.release()
cv2.destroyAllWindows()
```