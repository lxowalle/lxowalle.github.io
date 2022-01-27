---
title: OpenCV-Python使用记录
date: 2022-01-26 11:59:22
tags:
---

# openCV-Python使用记录

[OpenCV官方手册](http://woshicver.com/)
[测试资源下载](https://www.cnuseful.com/down/)

## 一、安装

**通过apt安装opencv-python**

```shell
# python2(未测试)
python2 -m pip install opencv-python    

# python3
sudo apt install python3-opencv    
```

**源码安装opencv-python**
嫌麻烦，具体方法参考[手册](http://woshicver.com/SecondSection/1_4_%E5%9C%A8Ubuntu%E4%B8%AD%E5%AE%89%E8%A3%85OpenCV-Python/)

## 二、GUI操作

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

**鼠标处理事件=>双击画圆,长点画矩形**

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

## 三、核心操作


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

**图像上的算法运算**

```python
import cv2 as cv
import numpy as np

def show_tmp_img(img):
    cv.imshow('tmp', img)
    cv.waitKey(0)

# 加法
x = np.uint8([250])
y = np.uint8([10])
print(cv.add(x, y))     # 结果255，250+10=260溢出，取临界值255
print(x + y)            # 结果4，250+10=260溢出，取溢出值4

# 图像融合
img1 = cv.imread('test.jpg')
img2 = cv.imread('test2.jpg')
img3 = img1[100:400, 900:1200]
img4 = img2[0:300, 0:300]
dst = cv.addWeighted(img3, 0.5, img4, 0.5, 0)
# cv.imshow('dst', dst)
# cv.waitKey(0)

# 按位运算，下面将img2作为logo插入到img1中
rows,cols,channels = img2.shape                                 # 1. 获取要logo的尺寸
roi = img1[0:rows, 0:cols]                                      # 2. 根据logo尺寸来截取RIO区域(RIO指感兴趣的区域)
# show_tmp_img(roi)
                                                                # 3. 取出logo图片背景区域
img2gray = cv.cvtColor(img2, cv.COLOR_BGR2GRAY)                 #   - 将logo转灰度图
# show_tmp_img(img2gray)
ret, mask = cv.threshold(img2gray, 50, 255, cv.THRESH_BINARY)   #   - 将logo二值化，取出需要显示的logo区域
show_tmp_img(mask)
mask_inv = cv.bitwise_not(mask)                                 #   - 取出logo背景区域(图像取反操作)
# show_tmp_img(mask_inv)
img1_bg = cv.bitwise_and(roi, roi, mask = mask_inv)             # 4. 将ROI的logo区域涂黑
# show_tmp_img(img1_bg)
img2_fg = cv.bitwise_and(img2, img2, mask=mask)                 # 5. 从logo图像提取logo区域
show_tmp_img(img2_fg)
dst = cv.add(img1_bg, img2_fg)                                  # 6. 将logo放入ROI并修改主图像
show_tmp_img(dst)
img1[0:rows, 0:cols] = dst
show_tmp_img(img1)

cv.destroyAllWindows()
```

**性能衡量与提升**

```python
import cv2 as cv

en = cv.useOptimized()                      # 检查是否启用优化(默认启用)
print("Use opetimized?", en)
if en != True:
    print("Enable opetimized")
    cv.setUseOptimized(True)                # 设置是否启用优化

img1 = cv.imread('test.jpg')                ### 测试代码执行时间
e1 = cv.getTickCount()                      # 1. 开始时间

for i in range(5, 49, 2):                   # 2. 执行过程
    img1 = cv.medianBlur(img1, i)

e2 = cv.getTickCount()                      # 3. 结束时间
time = (e2 - e1) / cv.getTickFrequency()    # 4. 计算结果，单位s
print(time)
```

## OPENCV中的图像处理

**改变颜色空间**

```python
import cv2 as cv
import numpy as np

#### 改变颜色空间
# 获取支持的颜色空间
flags = [i for i in dir(cv) if i.startswith('COLOR_')]
print(flags)

#### 将BGR图像转HSV，并取出蓝色通道图像
img = cv.imread('test.jpg')                     # 1. 获取BGR图像
hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)        # 2. BGR转HSV

lower_blue = np.array([110, 50, 50])            # 3. 提取蓝色部分的图像
upper_blue = np.array([130, 255, 255])
mask = cv.inRange(hsv, lower_blue, upper_blue)

res = cv.bitwise_and(img, img, mask = mask)     # 4. 将提取的图片叠加到原图
cv.imshow('img', img)
cv.waitKey(0)
cv.imshow('hsv', hsv)
cv.waitKey(0)
cv.imshow('mask', mask)
cv.waitKey(0)
cv.imshow('res', res)
cv.waitKey(0)
cv.destroyAllWindows()

#### 获取BGR颜色空间对应HSV颜色空间的值
b = np.uint8([[[255, 0, 0]]])
g = np.uint8([[[0, 255, 0]]])
r = np.uint8([[[0, 0, 255]]])
hsv_b = cv.cvtColor(b, cv.COLOR_BGR2HSV)
hsv_g = cv.cvtColor(g, cv.COLOR_BGR2HSV)
hsv_r = cv.cvtColor(r, cv.COLOR_BGR2HSV)
print(hsv_b, hsv_g, hsv_r)

```

**图像的几何变换**

包括：

- 缩放
- 平移
- 旋转
- 放射变换

```python
# 缩放
img = cv.imread('test.jpg')
h1,w1 = img.shape[:2]
print(h1, w1)

# interpolation来设置插值方法
#   - cv.INTER_LINEAR   线性插值(默认)
#   - cv.INTER_NEAREST  最邻近插值
#   - cv.INTER_AREA     基于像素关系进行重采样
#   - cv.INTER_CUBIC    4×4邻域双3次插值
#   - cv.INTER_LANCZOS4 8×8邻域兰索斯插值
img = cv.resize(img, None, fx = 0.5, fy = 0.5, interpolation=cv.INTER_CUBIC)    # 缩小为0.5倍
h2,w2 = img.shape[:2]
print("img size:", h2, w2)

img = cv.resize(img, None, fx=2, fy=2, interpolation=cv.INTER_CUBIC)            # 放大为2倍
h2,w2 = img.shape[:2]
print("img size:", h2, w2)

img = cv.resize(img, (500, 500))                                                # 重置尺寸为(500, 500)
h2,w2 = img.shape[:2]
print("img size:", h2, w2)

# 平移
img = cv.imread('test.jpg')
rows,cols = img.shape[:2]
print("img size:", rows, cols)
M = np.float32([[1,0,100], [0,1,100]])                                          # 生成2*3的变换矩阵M
                                                                                #   M = [ 1 0 tx ]
                                                                                #       [ 0 1 ty ]
                                                                                #   其中tx表示x方向的偏移，ty表示y方向的偏移
dst = cv.warpAffine(img, M, (cols, rows))                                       # 根据M实现平移


# 旋转                              
M = cv.getRotationMatrix2D(((cols - 1) / 2.0, (rows - 1) / 2.0), 45, 0.5)       # 生成变换矩阵M，可以设置旋转中心，旋转角度，缩放比例
                                                                                # 方法1:
                                                                                #   M = [ cosθ  -sinθ ]
                                                                                #       [ sinθ   cosθ ]
                                                                                #   其中θ表示缩放角度
                                                                                # 方法2:
                                                                                #   M = [ α  β  (1-α)*x - β * y ]
                                                                                #       [-β  α  (1-α)*y + β * x ]
                                                                                #   其中 
                                                                                #       α = scale * cosθ    
                                                                                #       β = scale * sinθ
                                                                                #   θ表示旋转角度，x表示旋转中心x坐标，y表示旋转中心y坐标，scale表示缩放倍数
dst = cv.warpAffine(img, M, (cols, rows))                                       # 根据M实现旋转
cv.imshow('img', dst)
cv.waitKey(0)

# 放射变换
from matplotlib import pyplot as plt
pts1 = np.float32([[50, 50], [200, 50], [50, 200]])
pts2 = np.float32([[10, 100], [200, 50], [100, 250]])
M = cv.getAffineTransform(pts1, pts2)
dst = cv.warpAffine(img, M, (cols, rows))
plt.subplot(121), plt.imshow(img), plt.title('Input')
plt.subplot(122), plt.imshow(dst), plt.title('Output')
plt.show()

# 透视变换，通过4个点获取目标区域的视图，需要保证变换前后直线仍然保持直线
pts1 = np.float32([[56, 65], [368, 52], [28, 387], [389, 390]])                 # 通过4个坐标选择需要变换的区域
pts2 = np.float32([[0,0], [300, 0], [0, 300], [300, 300]])                      # 通过4个坐标设置变换后的区域
M = cv.getPerspectiveTransform(pts1, pts2)
dst = cv.warpPerspective(img, M, (300, 300))
plt.subplot(121), plt.imshow(img), plt.title('Input')
plt.subplot(122), plt.imshow(dst), plt.title('Output')
plt.show()

cv.destroyAllWindows()
```

**图像阈值**

包括：

- 简单的阈值过滤
- 自适应阈值
- Otsu二值化

```python
# 简单阈值
# 简单的阈值类型：
# cv2.THRESH_BINARY         低于阈值的像素点灰度值置为0；高于阈值置为参数3
# cv2.THRESH_BINARY_INV     大于阈值的像素点灰度值置为0；小于阈值置为参数3
# cv2.THRESH_TRUNC          小于阈值的像素点灰度值不变，大于阈值的像素点置为该阈值
# cv2.THRESH_TOZERO         小于阈值的像素点灰度值不变，大于阈值的像素点置为0,其中参数3任取
# cv2.THRESH_TOZERO_INV     大于阈值的像素点灰度值不变，小于阈值的像素点置为0,其中参数3任取
img = cv.imread('test.jpg', cv.IMREAD_GRAYSCALE)
img = cv.cvtColor(img, cv.COLOR_BGR2RGB)
ret,thresh1 = cv.threshold(img, 127, 255, cv.THRESH_BINARY)
ret,thresh2 = cv.threshold(img, 127, 255, cv.THRESH_BINARY_INV)
ret,thresh3 = cv.threshold(img, 127, 255, cv.THRESH_TRUNC)
ret,thresh4 = cv.threshold(img, 127, 255, cv.THRESH_TOZERO)
ret,thresh5 = cv.threshold(img, 127, 255, cv.THRESH_TOZERO_INV)

plt.subplot(231),plt.imshow(img),plt.title('NORMAL')
plt.subplot(232),plt.imshow(thresh1),plt.title('THRESH_BINARY')
plt.subplot(233),plt.imshow(thresh2),plt.title('THRESH_BINARY_INV')
plt.subplot(234),plt.imshow(thresh3),plt.title('THRESH_TRUNC')
plt.subplot(235),plt.imshow(thresh4),plt.title('THRESH_TOZERO')
plt.subplot(236),plt.imshow(thresh5),plt.title('THRESH_TOZERO_INV')
plt.show()

# 自适应阈值
img = cv.imread('test.jpg', cv.IMREAD_GRAYSCALE)
thresh1 = cv.adaptiveThreshold(img, 255, cv.ADAPTIVE_THRESH_MEAN_C , cv.THRESH_BINARY, 5, 2)
# cv.imshow('th', thresh1)
# cv.waitKey(0)

thresh1 = cv.adaptiveThreshold(img, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C , cv.THRESH_BINARY_INV, 5, 2)
# cv.imshow('th', thresh1)
# cv.waitKey(0)
# cv.destroyWindow('th')

# Otsu的二值化
img = cv.imread('test.jpg', 0)
ret, th1 = cv.threshold(img, 127, 255, cv.THRESH_BINARY)                    # 全局阈值
ret, th2 = cv.threshold(img, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)     # Otsu阈值
blur = cv.GaussianBlur(img, (5, 5), 0)
ret, th3 = cv.threshold(blur, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)    # 高斯滤波，再用Otsu阈值
images = [  img, 0, th1,
            img, 0, th2,
            blur, 0, th3]
titles = ['Original Noisy Image','Histogram','Global Thresholding (v=127)',
          'Original Noisy Image','Histogram',"Otsu's Thresholding",
          'Gaussian filtered Image','Histogram',"Otsu's Thresholding"]
for i in range(3):
    plt.subplot(3,3,i*3+1),plt.imshow(images[i*3],'gray')
    plt.title(titles[i*3]), plt.xticks([]), plt.yticks([])
    plt.subplot(3,3,i*3+2),plt.hist(images[i*3].ravel(),256)
    plt.title(titles[i*3+1]), plt.xticks([]), plt.yticks([])
    plt.subplot(3,3,i*3+3),plt.imshow(images[i*3+2],'gray')
    plt.title(titles[i*3+2]), plt.xticks([]), plt.yticks([])
plt.show()
cv.destroyAllWindows()
```

**图像平滑**

包括：

- 平均滤波
- 中值滤波
- 高斯滤波
- 双边滤波

```python
#### 图像平滑

# 2D卷积(图像过滤)
img = cv.imread('test.jpg')
kernel = np.ones((5,5), np.float32) / 25                    # 除以25是因为矩阵有25个元素，方便后面平均值计算
# print(kernel)
dst = cv.filter2D(img, -1, kernel)                          # 将取每个像素周围的25个元素的平均值
# cv.imshow('temp', dst)
# cv.waitKey(0)

# 图像模糊，共4种模糊技术
# 1. 平均,提取内核区域的平均值作为中心像素值
blur = cv.blur(img, (5, 5))                                 # 
# cv.imshow('temp', blur)
# cv.waitKey(0)

# 2. 高斯模糊，采用像素周围的邻域并找到其高斯加权平均值
blur = cv.GaussianBlur(img, (5, 5), 0)                      # 高斯模糊
# cv.imshow('temp', blur)
# cv.waitKey(0)

blur = cv.GaussianBlur(img, (5, 5), sigmaX=50, sigmaY=50)   # 高斯模糊
# cv.imshow('temp', img)
# cv.waitKey(0)

# 3. 中值模糊，提取内核区域的中值作为中心像素值
blur = cv.medianBlur(img, 7)                                # 中值模糊
# cv.imshow('temp', blur)
# cv.waitKey(0)

# 4. 双边滤波,一种强度较差的高斯函数，仅仅考虑强度与中心像素相似的像素的模糊。可以保留边缘
blur = cv.bilateralFilter(img, 25, 75, 75)                  # 双边滤波
cv.imshow('temp', blur)
cv.waitKey(0)

```

