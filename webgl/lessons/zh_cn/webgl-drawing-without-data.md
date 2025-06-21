Title: WebGL2 无数据绘制
Description: 创意编程 - 无数据绘制技术
TOC: 无数据绘制

本文假设您已阅读从[基础教程](webgl-fundamentals.html)开始的多篇相关文章。若尚未阅读，请先查阅。

在[WebGL2 最小的程序](webgl-smallest-programs.html)一文中，
我们演示了极简代码的绘制示例。本文将实现无数据绘制。

传统WebGL应用将几何数据存入缓冲区，通过属性(attribute)从缓冲区提取顶点数据到着色器，
最终转换为裁剪空间坐标。

需注意**传统**一词仅表示惯例做法，并非强制要求。
WebGL仅关注顶点着色器向 `gl_Position` 赋值裁剪空间坐标，并不关心如何实现。

GLSL ES 3.0为顶点着色器提供了 `gl_VertexID` 特殊变量，可对顶点进行计数。
我们将基于此变量计算圆形顶点坐标，实现无数据绘制。

```glsl
#version 300 es
uniform int numVerts;

#define PI radians(180.0)

void main() {
  float u = float(gl_VertexID) / float(numVerts);  // 0 到 1
  float angle = u * PI * 2.0;                      // 0 到 2π
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;
  
  gl_Position = vec4(pos, 0, 1);
  gl_PointSize = 5.0;
}
```

上述代码逻辑应较为直观： `gl_VertexID` 将从0开始计数至我们指定的顶点数量（通过 `numVerts` 传递）。基于此生成圆形顶点坐标。

若止步于此，圆形将显示为椭圆——因为裁剪空间在画布横纵方向上采用归一化坐标（-1到1范围）。
通过传入分辨率参数，可解决横向-1到1与纵向-1到1实际表示空间比例不一致的问题。


```glsl
#version 300 es
uniform int numVerts;
+uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  float u = float(gl_VertexID) / float(numVerts);  // goes from 0 to 1
  float angle = u * PI * 2.0;                      // goes from 0 to 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;
  
+  float aspect = resolution.y / resolution.x;
+  vec2 scale = vec2(aspect, 1);
  
+  gl_Position = vec4(pos * scale, 0, 1);
  gl_PointSize = 5.0;
}
```

而片段着色器仅需输出一个纯色。

```glsl
#version 300 es
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(1, 0, 0, 1);
}
```

在JavaScript初始化阶段，我们将编译着色器并获取uniform变量的位置。

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
const resolutionLoc = gl.getUniformLocation(program, 'resolution');
```

渲染时我们将使用着色器程序，设置 `resolution` 和 `numVerts` uniform变量并绘制顶点。

```js
gl.useProgram(program);

const numVerts = 20;

// tell the shader the number of verts
gl.uniform1i(numVertsLoc, numVerts);
// tell the shader the resolution
gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

const offset = 0;
gl.drawArrays(gl.POINTS, offset, numVerts);
```

最终将呈现点阵构成的圆形。

{{{example url="../webgl-no-data-point-circle.html"}}}

该技术是否实用？通过创造性编码，我们几乎无需数据且仅用单次绘制调用即可实现星空或简单降雨效果。

以下以降雨效果为例。首先修改顶点着色器

```glsl
#version 300 es
uniform int numVerts;
uniform float time;

void main() {
  float u = float(gl_VertexID) / float(numVerts);  // goes from 0 to 1
  float x = u * 2.0 - 1.0;                         // -1 to 1
  float y = fract(time + u) * -2.0 + 1.0;          // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 5.0;
}
```

此场景无需分辨率参数。

我们添加了 `time` uniform变量，表示从页面加载完成后的秒数。

x坐标设置为-1到1范围。

y坐标通过 `time + u` 计算，但 `fract` 仅返回小数部分（0.0到1.0）。
将其扩展至1.0到-1.0范围，可获得随时间不断循环但各点偏移不同的y坐标。

将片段着色器中的颜色改为蓝色。

```glsl
precision highp float;

out vec4 outColor;

void main() {
-  outColor = vec4(1, 0, 0, 1);
+  outColor = vec4(0, 0, 1, 1);
}
```

随后在JavaScript中需获取 `time` uniform变量的位置。

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
-const resolutionLoc = gl.getUniformLocation(program, 'resolution');
+const timeLoc = gl.getUniformLocation(program, 'time');
```
通过创建渲染循环并设置 `time` uniform变量，将代码改为[动画](webgl-animation.html)。

```js
+function render(time) {
+  time *= 0.001;  // convert to seconds

+  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  const numVerts = 20;

  // tell the shader the number of verts
  gl.uniform1i(numVertsLoc, numVerts);
+  // tell the shader the time
+  gl.uniform1f(timeLoc, time);

  const offset = 0;
  gl.drawArrays(gl.POINTS, offset, numVerts);

+  requestAnimationFrame(render);
+}
+requestAnimationFrame(render);
```

{{{example url="../webgl-no-data-point-rain-linear.html"}}}

当前效果为顺序下落的点阵，需添加随机性。GLSL没有随机数生成器，但可使用伪随机函数实现近似效果。


如下所示：

```glsl
// hash function from https://www.shadertoy.com/view/4djSRW
// given a value between 0 and 1
// returns a value between 0 and 1 that *appears* kind of random
float hash(float p) {
  vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
  p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
  return fract(p2.x * p2.y * 95.4337);
}
```

我们可以这样使用

```glsl
void main() {
  float u = float(gl_VertexID) / float(numVerts);  // goes from 0 to 1
-  float x = u * 2.0 - 1.0;                         // -1 to 1
+  float x = hash(u) * 2.0 - 1.0;                   // random position
  float y = fract(time + u) * -2.0 + 1.0;          // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 5.0;
}
```

向`hash`函数传入0到1区间的值，将返回对应的伪随机0到1区间值。

同时缩小点尺寸。

```glsl
  gl_Position = vec4(x, y, 0, 1);
-  gl_PointSize = 5.0;
+  gl_PointSize = 2.0;
```

并增加绘制点的数量。

```js
-const numVerts = 20;
+const numVerts = 400;
```

最终实现效果如下：

{{{example url="../webgl-no-data-point-rain.html"}}}

仔细观察可发现降雨存在重复模式。注意特定点群从底部消失后又在顶部重现。若背景存在更多元素（如3D游戏场景），这种循环可能不易察觉。

我们可通过增加一点随机性来修正这种重复感。

```glsl
void main() {
  float u = float(gl_VertexID) / float(numVerts);  // goes from 0 to 1
+  float off = floor(time + u) / 1000.0;           // changes once per second per vertex
-  float x = hash(u) * 2.0 - 1.0;                  // random position
+  float x = hash(u + off) * 2.0 - 1.0;            // random position
  float y = fract(time + u) * -2.0 + 1.0;         // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 2.0;
}
```

上述代码通过添加 `off` 变量，利用 `floor(time + u)` 为每个顶点生成每秒变化一次的次级计时器。
该偏移量与点下移逻辑同步：当点从屏幕底部跳回顶部时，`hash`函数将获得新输入值，从而使该点获得新的水平随机位置。

最终实现无重复模式的降雨效果。

{{{example url="../webgl-no-data-point-rain-less-repeat.html"}}}

能否实现比`gl.POINTS`更复杂的绘制？当然可以！

让我们绘制圆形：这需要围绕中心点构建三角形扇面（类似披萨切片）。
我们可以将每个三角形想象成饼图边缘上的两个点，以及中心上的一个点。
然后，我们对饼图的每一片重复上述步骤。

<div class="webgl_center"><img src="resources/circle-points.svg" style="width: 400px;"></div>

首先需要构建一个计数器，该计数器在每处理一个切片时递增。

```glsl
int sliceId = gl_VertexID / 3;
```

其次需要构建圆周边缘的顶点计数器，其数值范围

    0, 1, ?, 1, 2, ?, 2, 3, ?, ...

该?值实际无关紧要——如图所示，第三个顶点始终位于中心点(0,0)，因此可直接乘以0忽略其值。

要实现上述模式，可采用如下方案：

```glsl
int triVertexId = gl_VertexID % 3;
int edge = triVertexId + sliceId;
```

顶点分布需遵循此模式：2个边缘点后接1个中心点，如此循环往复。

    1, 1, 0, 1, 1, 0, 1, 1, 0, ...

可通过以下模式实现：

```glsl
float radius = step(1.5, float(triVertexId));
```

`step(a, b)`函数在a<b时返回0，否则返回1。可理解为：

```js
function step(a, b) {
  return a < b ? 0 : 1;
}
```

当1.5小于`triVertexId`时，`step(1.5, float(triVertexId))`返回1。该条件在每个三角形的前2个顶点成立，最后一个顶点不成立。

圆形三角形顶点可通过如下方式生成：

```glsl
int numSlices = 8;
int sliceId = gl_VertexID / 3;
int triVertexId = gl_VertexID % 3;
int edge = triVertexId + sliceId;
float angleU = float(edge) / float(numSlices);  // 0.0 to 1.0
float angle = angleU * PI * 2.0;
float radius = step(float(triVertexId), 1.5);
vec2 pos = vec2(cos(angle), sin(angle)) * radius;
```

将上面所有内容整合起来，绘制一个圆

```glsl
#version 300 es
uniform int numVerts;
uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  int numSlices = 8;
  int sliceId = gl_VertexID / 3;
  int triVertexId = gl_VertexID % 3;
  int edge = triVertexId + sliceId;
  float angleU = float(edge) / float(numSlices);  // 0.0 to 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(float(triVertexId), 1.5);
  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
  gl_Position = vec4(pos * scale, 0, 1);
}
```

注意我们已重新引入`resolution`参数以避免得到一个椭圆。

对于一个8切片的圆，需要 8 * 3 个顶点
For a 8 slice circle we need 8 * 3 vertices

```js
-const numVerts = 400;
+const numVerts = 8 * 3;
```

绘制需要使用 `TRIANGLES` 而不是 `POINTS`

```js
const offset = 0;
-gl.drawArrays(gl.POINTS, offset, numVerts);
+gl.drawArrays(gl.TRIANGLES, offset, numVerts);
```

{{{example url="../webgl-no-data-triangles-circle.html"}}}

如果想绘制多个圆呢？

只需生成`circleId`，用于为每个圆形确定位置，对于圆内的顶点都是一样的。

All we need to do is come up with a `circleId` which we
can use to pick some position for each circle that is
the same for all vertices in the circle.

```glsl
int numVertsPerCircle = numSlices * 3;
int circleId = gl_VertexID / numVertsPerCircle;
```

例如，现绘制由圆形组成的环形图案。

首先把上面的代码封装到一个函数。

```glsl
vec2 computeCircleTriangleVertex(int vertexId) {
  int numSlices = 8;
  int sliceId = vertexId / 3;
  int triVertexId = vertexId % 3;
  int edge = triVertexId + sliceId;
  float angleU = float(edge) / float(numSlices);  // 0.0 to 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(float(triVertexId), 1.5);
  return vec2(cos(angle), sin(angle)) * radius;
}
```
以下是本文开头绘制点阵圆形的原始代码：

```glsl
float u = float(gl_VertexID) / float(numVerts);  // goes from 0 to 1
float angle = u * PI * 2.0;                      // goes from 0 to 2PI
float radius = 0.8;

vec2 pos = vec2(cos(angle), sin(angle)) * radius;

float aspect = resolution.y / resolution.x;
vec2 scale = vec2(aspect, 1);

gl_Position = vec4(pos * scale, 0, 1);
```

只需将`vertexId`替换为`circleId`，并将除数改为圆圈数量而非顶点数量。

```glsl
void main() {
+  int circleId = gl_VertexID / numVertsPerCircle;
+  int numCircles = numVerts / numVertsPerCircle;

-  float u = float(gl_VertexID) / float(numVerts);  // goes from 0 to 1
+  float u = float(circleId) / float(numCircles);  // goes from 0 to 1
  float angle = u * PI * 2.0;                     // goes from 0 to 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

+  vec2 triPos = computeCircleTriangleVertex(gl_VertexID) * 0.1;
  
  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
-  gl_Position = vec4(pos * scale, 0, 1);
+  gl_Position = vec4((pos + triPos) * scale, 0, 1);
}
```

随后只需增加顶点数量

```js
-const numVerts = 8 * 3;
+const numVerts = 8 * 3 * 20;
```

在得到由20个圆形组成的环形结构。

{{{example url="../webgl-no-data-triangles-circles.html"}}}

当然，我们可以应用前文的降雨效果逻辑来实现"圆形雨"，尽管这缺乏实用价值故不展开说明，但确实演示了无数据情况下在顶点着色器生成三角形的技术。

上述技术可拓展应用于矩形/正方形的生成。
通过创建UV坐标并传递至片段着色器，实现生成几何体的纹理映射。
结合[3D透视](webgl-3d-perspective.html)文章中的三维技术，
该方案特别适合模拟3D场景中翻转的雪花或落叶效果。

需要强调的是，**此类技术**并非主流方案。虽然简易粒子系统（如前述降雨效果）或有使用场景，但过于复杂的计算将损害性能。通用准则是：为追求性能，应尽可能减少实时计算量——所有可预计算的数据，都应在初始化阶段以某种形式预置并传入着色器。

例如，这是一个计算立方体群的极端顶点着色器示例（注意，有声音）。

<iframe width="700" height="400" src="https://www.vertexshaderart.com/art/zd2E5vCZduc5JeoFz" frameborder="0" allowfullscreen></iframe>

作为"仅凭顶点ID能否绘制有趣图形"的智力探索，这种方案颇具巧思。
事实上[该网站](https://www.vertexshaderart.com)就专注于此类挑战。
但就性能而言，传统方案——通过缓冲区传入立方体顶点数据并用属性读取，或其他我们将介绍的技术——效率会高出许多。

需要权衡取舍：若需实现上文降雨效果，所述代码已相当高效。
两种方案的性能边界存在于某处中间地带——通常传统方案兼具更高灵活性，但具体采用何种方式仍需根据实际场景判断。

本文主要目的是介绍这些创新理念，并强调理解WebGL实际工作原理的不同视角。重申：WebGL仅要求您在着色器中设置gl_Position并输出颜色值，具体实现方式无关紧要。

<div class="webgl_bottombar" id="pointsissues">
<h3>关于<code>gl.POINTS</code>的一个问题</h3>
<p>
此类技术的一个实用场景是模拟<code>gl.POINTS</code>的绘制效果。
</p>

<code>gl.POINTS</code>存在两个主要问题：

<ol>
<li>存在最大尺寸限制<br/><br/>多数开发者使用<code>gl.POINTS</code>时选择较小尺寸，但若所需尺寸超过其上限，则需采用替代方案。
</li>
<li>屏幕外裁剪行为不一致问题：<br/><br/>
当点中心位于画布左边缘外1像素处，而<code>gl_PointSize</code>设为32.0。
<div class="webgl_center"><img src="resources/point-outside-canvas.svg" style="width: 400px"></div>
根据OpenGL ES 3.0规范：当32x32像素点中有15列仍处于画布内时，应予以绘制。但OpenGL(非ES版本)规范却完全相反——只要点中心位于画布外就完全不绘制。
更糟的是，OpenGL长期缺乏充分测试，导致不同驱动实现不一：有的驱动会绘制这些像素，有的则不会。😭
</li>
</ol>
<p>因此，若这两个问题影响您的需求，解决方案是改用<code>gl.TRIANGLES</code>绘制自定义四边形而非使用<code>gl.POINTS</code>。如此可同时解决：<br>
1. 最大尺寸限制问题<br>
2. 裁剪不一致问题<br>
绘制大量四边形的方法有多种，<a href="https://jsgist.org/?src=6306857bfd65adbdcd54b0051d441935">其中之一便是采用本文所述技术</a>。</p>
</div>
