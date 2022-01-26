---
title: OpenCV-Python使用记录
date: 2022-01-26 11:59:22
tags:
---

# openCV-Python使用记录

[OpenCV官方手册](http://woshicver.com/)
[测试资源下载](https://www.cnuseful.com/down/)

## 安装

**通过apt安装opencv-python**
```shell
# python2(未测试)
python2 -m pip install opencv-python    

# python3
sudo apt install python3-opencv    
```

**源码安装opencv-python**
嫌麻烦，具体方法参考[手册](http://woshicver.com/SecondSection/1_4_%E5%9C%A8Ubuntu%E4%B8%AD%E5%AE%89%E8%A3%85OpenCV-Python/)

## GUI操作

**显示/保存图片**

```python
import cv2 as cv

cv.namedWindow('win_name', cv.WINDOW_NORMAL)
cv.waitKey(0)

'''
cv.IMREAD_COLOR = 1：       加载彩色图像。任何图像的透明度都会被忽视。它是默认标志。
cv.IMREAD_GRAYSCALE = 0：   以灰度模式加载图像
cv.IMREAD_UNCHANGED = -1：  加载图像，包括alpha通道
'''
img = cv.imread('test.jpg', cv.IMREAD_COLOR)    # 默认配置，读图片，不带alpha通道
cv.imshow('win_name', img)
cv.waitKey(0)

img = cv.imread('test.jpg', cv.IMREAD_UNCHANGED)    # 读图片，带alpha通道
cv.imshow('win_name', img)
cv.waitKey(0)

img = cv.imread('test.jpg', cv.IMREAD_GRAYSCALE)    # 读图片，灰度模式
cv.imshow('win_name', img)
cv.waitKey(0)

# 图像格式有：bmp、jpg（或jpeg）、png、pnm、ppm、ras、tif（或tiff）
cv.imwrite('test.png', img)

cv.destroyAllWindows()
```

**显示图片(通过matplotlib库显示)**
Matplotlib是Python的绘图库，提供多种绘图方法。
注意：OpenCV加载的彩色图像处于BGR模式。但是Matplotlib以RGB模式显示。

```python
import cv2 as cv
from matplotlib import pyplot as plt

img = cv.imread('test.bmp', 0)
plt.imshow(img, cmap = 'gray', interpolation='bicubic')
plt.show()

img2 = cv.imread('test.bmp', 1)
plt.imshow(img)
plt.show()
```

**摄像头捕获/显示/翻转/保存视频**
Linux上通过/dev/video设备访问摄像头

```python
import cv2 as cv
from cv2 import destroyAllWindows

cap = cv.VideoCapture(0)
fourcc = cv.VideoWriter_fourcc(*'XVID')
out = cv.VideoWriter('output.avi', fourcc, 20.0, (640, 480))
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Can't recv frame.Exiting ...")
        break
    frame = cv.flip(frame, 0)    # 翻转
    out.write(frame)
    cv.imshow('frame', frame)
    if cv.waitKey(1) == ord('q'):
        break
cap.release()
out.release()
cv.destroyAllWindows()
```

**显示/翻转本地视频**

```python
import cv2 as cv
from cv2 import destroyAllWindows

cap = cv.VideoCapture('test.avi')
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Can't recv frame.Exiting ...")
        break
    frame = cv.flip(frame, 0)    # 翻转
    cv.imshow('frame', frame)
    if cv.waitKey(1) == ord('q'):
        break
cap.release()
cv.destroyAllWindows()
```

**画图功能**

```python
import numpy as np
import cv2 as cv

img = np.zeros((512, 512, 3), np.uint8)

# 画直线
cv.line(img, (0, 0), (511, 511), (255, 0, 0), 5)
cv.imshow("img", img)
cv.waitKey(0)

# 画矩形
cv.rectangle(img, (384, 0), (510, 128), (0, 255, 0), 3)
cv.imshow("img", img)
cv.waitKey(0)

# 画圆圈
cv.circle(img, (447, 63), 63, (0, 0, 255), -1)
cv.imshow("img", img)
cv.waitKey(0)

# 画椭圆
cv.ellipse(img, (256, 256), (100, 50), 0, 0, 180, 255, -1)
cv.imshow("img", img)
cv.waitKey(0)

# 画多边形
pts = np.array([[10, 5], [20, 30], [70, 20], [50, 10]], np.int32)
pts = pts.reshape((-1, 1, 2))
cv.polylines(img, [pts], True, (0, 255, 255))
cv.imshow("img", img)
cv.waitKey(0)

# 添加文本
font = cv.FONT_HERSHEY_SIMPLEX
cv.putText(img, 'OpenCV', (10, 500), font, 4, (255,255,255), 2, cv.LINE_AA)
cv.imshow("img", img)
cv.waitKey(0)
```

#### 鼠标处理事件=>双击画圆,长点画矩形

```python
import numpy as np
import cv2 as cv

# 列出所有可用事件
events = [i for i in dir(cv) if 'EVENT' in i]
print(events)

drawing = False # 如果按下鼠标，则为真
mode = True # 如果为真，绘制矩形。按 m 键可以切换到曲线
ix,iy = -1,-1
# 鼠标回调函数
# 鼠标事件处理函数
# EVENT_MOUSEMOVE 0             //滑动  
# EVENT_LBUTTONDOWN 1           //左键点击  
# EVENT_RBUTTONDOWN 2           //右键点击  
# EVENT_MBUTTONDOWN 3           //中键点击  
# EVENT_LBUTTONUP 4             //左键放开  
# EVENT_RBUTTONUP 5             //右键放开  
# EVENT_MBUTTONUP 6             //中键放开  
# EVENT_LBUTTONDBLCLK 7         //左键双击  
# EVENT_RBUTTONDBLCLK 8         //右键双击  
# EVENT_MBUTTONDBLCLK 9         //中键双击 
# -----------------------------------
def draw_circle(event,x,y,flags,param):
    global ix,iy,drawing,mode
    if event == cv.EVENT_LBUTTONDOWN:
        drawing = True
        ix,iy = x,y
    elif event == cv.EVENT_MOUSEMOVE:
        if drawing == True:
            if mode == True:
                cv.rectangle(img,(ix,iy),(x,y),(0,255,0),-1)
            else:
                cv.circle(img,(x,y),5,(0,0,255),-1)
    elif event == cv.EVENT_LBUTTONUP:
        drawing = False
        if mode == True:
            cv.rectangle(img,(ix,iy),(x,y),(0,255,0),-1)
        else:
            cv.circle(img,(x,y),5,(0,0,255),-1)
    elif event == cv.EVENT_LBUTTONDBLCLK:
        cv.circle(img, (x, y), 20, (255, 0, 0), -1)

# 画窗口
img = np.zeros((512,512,3), np.uint8)
cv.namedWindow('image')

# 设置回调
cv.setMouseCallback('image', draw_circle)

# 显示
while(1):
    cv.imshow('image', img)
    if cv.waitKey(20) & 0xFF == ord('q'):
        break
cv.destroyAllWindows()
```

**画轨迹栏来操作调色板**
```python
import numpy as np
import cv2 as cv

def nothing(x):
    pass

img = np.zeros((512, 512, 3), np.uint8)
cv.namedWindow('image')

cv.createTrackbar('R', 'image', 0, 255, nothing)
cv.createTrackbar('G', 'image', 0, 255, nothing)
cv.createTrackbar('B', 'image', 0, 255, nothing)
switch = '0 : OFF \n1 : ON'
cv.createTrackbar(switch, 'image', 0, 1, nothing)
while(1):
    cv.imshow('image', img)
    k = cv.waitKey(1) & 0xff
    if k == 27:
        break
    r = cv.getTrackbarPos('R', 'image')
    g = cv.getTrackbarPos('G', 'image')
    b = cv.getTrackbarPos('B', 'image')
    s = cv.getTrackbarPos(switch, 'image')
    if s == 0:
        img[:] = 0
    else:
        img[:] = [b,g,r]
cv.destroyAllWindows()
```

## 核心操作


**图像的基本操作**

```python
from cv2 import merge
import numpy as np
import cv2 as cv

# 读图片
img = cv.imread('test.jpg')

# 读/写图片的某个像素，方法1
px = img[100, 100]              # 读第100行，第100列的像素值(BGR顺序)
print(px)
blue = img[100, 100, 0]         # 读第100行，第100列像素的RGB值
green = img[100, 100, 1]
red = img[100, 100, 2]
print(blue, green, red)     
img[100, 100] = [255, 100, 0]   # 写第100行，第100列的像素值

# 读/写图片的某个像素，方法2
blue = img.item(100, 100, 0)    # 第100行，第100列像素的RGB值
green = img.item(100, 100, 1)
red = img.item(100, 100, 2)
print(blue, green, red)

img.itemset((100, 100, 0), 100) # 写第100行，第100列像素的blue通道为100
img.itemset((100, 100, 1), 200) # 写第100行，第100列像素的green通道为200
img.itemset((100, 100, 2), 255) # 写第100行，第100列像素的red通道为255

# 获取图片属性
print(img.shape)                # 获取图片的行，列和通道数
print(img.size)                 # 获取图片的像素总数
print(img.dtype)                # 获取图片的像素数据类型

# 复制图片的某个区域，粘贴图片
cpy = img[100:300,200:600]      # 将第100~500行，第200~600列的区域图片复制，保存到cpy
img[500:700,200:600] = cpy      # 将cpy的内容覆盖到第100~500行，第500~900列的区域

# 拆分/合并色彩通道
b,g,r = cv.split(img)           # 拆分为BGR
cv.imshow('b', b)
cv.waitKey(0)
cv.imshow('g', b)
cv.waitKey(0)
cv.imshow('r', b)
cv.waitKey(0)

img = cv.merge((b,g,r))         # 将BGR合并为图像
cv.imshow('merge', img)
cv.waitKey(0)

# 按一定配置扩展图像边界像素
from matplotlib import pyplot as plt
BLUE = [255, 0, 0]
# 边界的类型有以下几种:
#        1)BORDER_REPLICATE:重复，就是对边界的像素进行复制
# 		 2)BORDER_REFLECT:反射,对感兴趣的图像中的像素在两边进行复制例如:fedcba|abcdefgh|hgfedcb反射
# 		 3)BORDER_REFLECT_101:反射101:例子：gfedcb|abcdefgh|gfedcba
# 		 4)BORDER_WRAP:外包装：cdefgh|abcdefgh|abcdefg
# 		 5)BORDER_CONSTANT:常量复制：例子：iiiiii|abcdefgh|iiiiiii

replicate = cv.copyMakeBorder(img, 10, 10, 10, 1000, cv.BORDER_REPLICATE)
reflect = cv.copyMakeBorder(img, 10, 10, 500, 500, cv.BORDER_REFLECT)
reflect101 = cv.copyMakeBorder(img, 10, 10, 500, 500, cv.BORDER_REFLECT_101)
wrap = cv.copyMakeBorder(img, 10, 10, 10, 1000, cv.BORDER_WRAP)
constant = cv.copyMakeBorder(img, 10, 10, 10, 1000, cv.BORDER_CONSTANT, value=BLUE)

plt.subplot(231),plt.imshow(img, 'gray'),plt.title('ORIGINAL')
plt.subplot(232),plt.imshow(replicate,'gray'),plt.title('REPLICATE')
plt.subplot(233),plt.imshow(reflect,'gray'),plt.title('REFLECT')
plt.subplot(234),plt.imshow(reflect101,'gray'),plt.title('REFLECT_101')
plt.subplot(235),plt.imshow(wrap,'gray'),plt.title('WRAP')
plt.subplot(236),plt.imshow(constant,'gray'),plt.title('CONSTANT')
plt.show()
cv.waitKey(0)

cv.namedWindow('img')
cv.imshow('img', img)
cv.waitKey(0)
cv.destroyAllWindows()
```