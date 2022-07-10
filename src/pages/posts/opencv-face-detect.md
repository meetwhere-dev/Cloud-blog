---
title: Opencv Face Detect
description: 
date: 2022-03-01T16:00:00.000+00:00
duration: 30min
---

> 在浏览器端实现人脸识别

先上<a href="/faceDetect/index.html" target="_blank">人脸识别Demo</a>

为了实现浏览器端的人脸识别，我们先引入OpenCV工具库

它有什么作用呢 先给大家简单介绍一下——

1. OpenCV 是一个开源跨平台计算机视觉库和机器学习软件库，
2. 由C函数和少量C++类构成，提供了多个语言（Python，Ruby，MATLAB等）的接口。
3. OpenCV提供了大量图像处理的功能，从图像显示，到像素操作，到目标检测等，大大简化了图形处理以及深度学习应用的开发过程。

由于它是C开发的，所以需要编译后才能在浏览器中使用。这里我们直接从

[OpenCV.js官方文档](https://docs.opencv.org/4.5.1/d5/d10/tutorial_js_root.html) 中取得编译完成的 4.5.1 版本 [OpenCV.js](https://docs.opencv.org/4.5.1/opencv.js)



## 基本流程

1. 输入图片
2. 转为OpenCV 矩阵格式储存
3. 结合人脸模型进行识别人脸位置
4. 绘制结果

>  其中第3步 模型是什么。
>
> 模型是由机器学习（深度学习）框架生成的一种分类规则（神经网络模型），常用的框架有TensorFlow / PyTorch / Caffe 等
>
> 它不仅可以生成人脸模型，还可以生成🐱🐱🐶🐶 等事件万物，图像分类还只是它的冰山一角。
>
> 文本恶意检测 / 语音识别 / 语义分割 / 人体姿势检测 等等。坑很大

## Demo代码

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Hello OpenCV.js</title>
<style>
  .img_dectect, .video_dectect{
    display: flex;
  }
  .caption {
    text-align: center;
    border: 2px solid rgb(6, 155, 193);
    border-radius: 10px;
  }
</style>
</head>
<body>
<h2>Hello OpenCV.js</h2>
<p id="status">OpenCV.js 读取中...</p>
<div>
  <h1>图片人脸识别</h1>
  <div><input type="file" id="imgInput" name="file" accept="image/*"> 请上传需要识别的图片</div>
  <button id="imgDectectButton" disabled>正在读取OpenCV...</button>
  <div class="img_dectect">
    <div class="caption"><p>图片输入</p> <canvas id="imgCanvasInput" width="640"  height="480"></canvas></div>
    <div class="caption"><p>输出识别</p> <canvas id="imgCanvasOutput" width="640"  height="480"></canvas></div>
  </div>

  <h1>视频人脸识别</h1>
  <button id="videoDectectButton" disabled>正在读取OpenCV...</button>
  <div class="video_dectect">
    <div class="caption">视频输入<video id="videoInput"  width="640"  height="480"></video></div>
    <div class="caption">视频输出<canvas id="canvasOutput" width="640"  height="480" ></canvas></div>
    <div class="caption">视频中间状态输出<canvas id="canvasOutput2"></canvas></div>
  </div>


</div>
<script type="text/javascript">

//  ----------------------- 图片人脸识别 ----------------------
let imgDectectButton = document.getElementById('imgDectectButton');
imgDectectButton.addEventListener('click', startImgDectect);
let inputElement = document.getElementById('imgInput');
let imgCanvasInput = document.getElementById('imgCanvasInput');
let imgCanvasOutput = document.getElementById('imgCanvasOutput');
inputElement.addEventListener('change', (e) => {
    let files = e.target.files;
    if (files.length > 0) {
        let imgUrl = URL.createObjectURL(files[0]);
        let ctx = imgCanvasInput.getContext('2d');
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            imgCanvasInput.width = img.width;
            imgCanvasInput.height = img.height;
            imgCanvasOutput.width = img.width;
            imgCanvasOutput.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
        };
        img.src = imgUrl;
    }
}, false);

function startImgDectect () {
  let src = new cv.imread('imgCanvasInput');  // 读取canvas内图片 放入容器
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  let classifier = new cv.CascadeClassifier(); // 级联 分类器
  classifier.load('face.xml'); // 加载训练模型
  let faces = new cv.RectVector();
  classifier.detectMultiScale(gray, faces, 1.1, 3, 0); // 侦测脸部
  for (let i = 0; i < faces.size(); ++i) {
      let roiGray = gray.roi(faces.get(i));
      let roiSrc = src.roi(faces.get(i));
      let point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
      let point2 = new cv.Point(faces.get(i).x + faces.get(i).width,
                                faces.get(i).y + faces.get(i).height);
      cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
  }
  
  // 绘制到canvas
  cv.imshow('imgCanvasOutput', src);

  // 清除缓存
  src.delete();
  gray.delete();
  classifier.delete();
}
//  ----------------------- 图片人脸识别 ----------------------

//  ----------------------- 视频人脸识别 ----------------------
let videoDectectButton = document.getElementById('videoDectectButton');
videoDectectButton.addEventListener('click', startVideo);
let video = document.getElementById('videoInput');

function startVideo() {
  let src = new cv.Mat(video.height, video.width, cv.CV_8UC4); // 图像容器 8位 4通道
  let gray = new cv.Mat();  // 灰度图容器
  let cap = new cv.VideoCapture(video); // 视频采集器
  let classifier = new cv.CascadeClassifier(); // 级联 分类器
  classifier.load('face.xml'); // 加载训练模型

  const FPS = 30;
  function processVideo() {
    let begin = Date.now();
    // 截取一帧图像
    cap.read(src);

    // 转换为灰度图
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    
    let downSampled = new cv.Mat();
    cv.pyrDown(gray, downSampled); // 把图片变小点 以减少侦测时间
    cv.pyrDown(downSampled, downSampled);

    // 侦测脸部
    let faces = new cv.RectVector();
    classifier.detectMultiScale(downSampled, faces); // 侦测脸部

    // 绘制边框
    let size = downSampled.size();
    let xRatio = video.width / size.width;
    let yRatio = video.height / size.height;
    for (let i = 0; i < faces.size(); ++i) {
        let face = faces.get(i);
        let point1 = new cv.Point(face.x * xRatio, face.y * yRatio);
        let point2 = new cv.Point((face.x + face.width) * xRatio, (face.y + face.height) * xRatio);
        cv.rectangle(src, point1, point2, [255, 0, 0, 255])
    }

    // 绘制最终结果
    cv.imshow('canvasOutput', src);
    cv.imshow('canvasOutput2', downSampled);

    // 释放内存
    downSampled.delete();
    faces.delete();

    let delay = 1000/FPS - (Date.now() - begin);
    setTimeout(processVideo, delay);
  };
  setTimeout(processVideo, 0);
}
//  ----------------------- 视频人脸识别 ----------------------

// 读取摄像头api 输出到canvas
let constraints = { audio: false, video: { width: video.width, height: video.height } }; 
navigator.mediaDevices.getUserMedia(constraints)
.then(function(mediaStream) {
  let video = document.getElementById('videoInput');
  video.srcObject = mediaStream;
  video.onloadedmetadata = function(e) {
    video.play();
  };
})
.catch(function(err) { console.log(err.name + ": " + err.message); });

// ------------------------- 初始化 ----------------------
// 读取训练模型 人脸识别 需要用
function loadXmlData() {
  let request = new XMLHttpRequest();
  request.open('GET', 'face.xml');
  request.responseType = 'arraybuffer';
  request.onload = function(ev) {
      if (request.readyState === 4) {
          if (request.status === 200) {
              let data = new Uint8Array(request.response);
              cv.FS_createDataFile('/', 'face.xml', data, true, false, false);
              imgDectectButton.removeAttribute('disabled');
              videoDectectButton.removeAttribute('disabled');
              document.getElementById('status').innerHTML = 'OpenCV.js 已就绪.';
              imgDectectButton.innerHTML = '开始识别';
              videoDectectButton.innerHTML = '开始识别';
          }
      }
  };
  request.send();
}

// 等待 opencv 读取系统信息
async function onOpenCvReady() {
  if (cv.getBuildInformation) {
      console.log(cv.getBuildInformation());
      loadXmlData();
  } else {
    if (cv instanceof Promise) {
      cv = await cv;
      console.log(cv.getBuildInformation());
      loadXmlData();
    } else {
      cv.onRuntimeInitialized = () => {
        console.log(cv.getBuildInformation());
        loadXmlData();
      }
    }
  }
}
// ------------------------- 初始化 ----------------------
</script>
<script async src="opencv.js" onload="onOpenCvReady();" type="text/javascript"></script>
</body>
</html>
```





## 搭建 Demo 过程中踩的坑

1. 需要运行在服务器环境下，不然在获取模型xml文件时会产生跨域请求。可以 npm install http-server --save 安装一个本地简易的服务器，方便开发。
2. 上传到服务器端，需要服务器端部署 https 不然浏览器不会给该网站读取摄像头的权限
3. 在侦测脸部以及输出过程中 canvas 的框高需要与 mat 的宽高一致，不然会bug