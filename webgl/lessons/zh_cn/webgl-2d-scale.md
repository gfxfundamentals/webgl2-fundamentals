Title: WebGL2 二维缩放
Description: 如何在二维中缩放物体
TOC: 二维缩放

此文上接一系列文章，先[从基础概念开始](webgl-fundamentals.html)，上一篇是
[物体旋转](webgl-2d-rotation.html)。

缩放和[平移](webgl-2d-translation.html)一样简单。

让我们将位置乘以期望的缩放值，这是[前例](webgl-2d-rotation.html)中的变化部分。

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // 缩放
+  vec2 scaledPosition = a_position * u_scale;

  // 旋转
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // 平移
  vec2 position = rotatedPosition + u_translation;
```

然后需要在 JavaScript 中绘制的地方设置缩放量。

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];


   // 绘制场景
   function drawScene() {
     webglUtils.resizeCanvasToDisplaySize(gl.canvas);

     // 告诉WebGL如何从裁剪空间对应到像素
     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

     // 清空画布
     gl.clearColor(0, 0, 0, 0);
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     // 使用我们的程序
     gl.useProgram(program);

     // 绑定属性/缓冲
     gl.bindVertexArray(vao);

     // 在着色器中通过画布分辨率转换像素坐标为裁剪空间坐标
     gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

     // 设置颜色
     gl.uniform4fv(colorLocation, color);

     // 设置平移
     gl.uniform2fv(translationLocation, translation);

     // 设置旋转
     gl.uniform2fv(rotationLocation, rotation);

+     // 设置缩放
+     gl.uniform2fv(scaleLocation, scale);

     // 绘制矩形
     var primitiveType = gl.TRIANGLES;
     var offset = 0;
     var count = 18;
     gl.drawArrays(primitiveType, offset, count);
   }
```

现在我们有了缩放，拖动滑块试试。

{{{example url="../webgl-2d-geometry-scale.html" }}}

值得一提的是，缩放值为负数的时候会翻转几何体。

另一件要注意的事情是它从 0, 0 缩放，对于我们的 F 是
左上角。 这是有道理的，因为我们将位置乘以它们远离 0, 0 的比例。你可能可以
想象解决这个问题的方法。 例如，您可以在缩放之前添加另一个平移，先进行 _pre scale_ 平移。 另一种解决方案是更改实际 F 位置数据。 我们很快就会学到另一个方式。

希望之前的 3 篇文章能够帮助你理解[平移](webgl-2d-translation.html)，
[旋转](webgl-2d-rotation.html) 和缩放。接下来我们将复习
[神奇的矩阵](webgl-2d-matrices.html)，这三种操作将包含在一个矩阵中，
并表现为一种常用形式。

<div class="webgl_bottombar">
<h3>为什么使用'F'做示例?</h3>
<p>
起初我看到有人在纹理上使用'F'，'F'本身并不重要，重要的是你可以从任何角度辨别出它的方向。如果我们使用心形❤或者三角形△，就无法判断出在水平方向是否翻转，一个圆形○就更糟糕了。理论上使用一个四个角有不同颜色的矩形也可以，但这样你就要记住每个角是什么颜色，F的方向可以立即判断出来。
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
可以分辨方向的任何形状都是可以的，自从我知道了这些后就一直用的'F'。
</p>
</div>
