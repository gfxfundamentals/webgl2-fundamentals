Title: WebGL2 多视图与多画布
Description: 绘制多个视图
TOC: 多视图与多画布

本文假设你已经阅读过[码少趣多](webgl-less-code-more-fun.html)一文，
因为我们将使用其中提到的库来简化示例。
如果你不理解缓冲区（buffers）、顶点数组（vertex arrays）、属性（attributes）是什么，
或者不明白像 `twgl.setUniforms` 这样的函数如何设置 uniform 变量，
那么你可能需要先回顾[基本原理](webgl-fundamentals.html)。

假设你想绘制同一场景的多个视图，该如何实现？ 
一种方法是将场景[渲染到纹理](webgl-render-to-texture.html)，然后将这些纹理绘制到画布上。
这确实是一种可行的方法，而且在某些情况下可能是最合适的解决方案。
但这种方式需要我们额外分配纹理，先将场景渲染到这些纹理上，然后再把纹理绘制到画布上。
这意味着我们实际上进行了双重渲染。
这种方案在某些场景下是合理的，比如在赛车游戏中，当我们需要渲染后视镜视野时，
可以先将车后方的场景渲染到纹理上，再用这个纹理来绘制后视镜画面。

另一种方法是设置视口并启用剪刀测试。
这种方法特别适合视图互不重叠的场景，更棒的是它完全避免了上述方案中的双重渲染问题。

在[首篇文章](webgl-fundamentals.html)中已经提到，我们可以通过调用以下方法来设置WebGL如何将裁剪空间(clip space)转换到像素空间(pixel space)：

```js
gl.viewport(left, bottom, width, height);
```
最常见的做法是将这些参数分别设置为 `0`、`0`、`gl.canvas.width` 和 `gl.canvas.height`，这样就能覆盖整个画布。

但我们可以将视口设置为画布的一部分，这样绘制操作就只会影响画布的指定区域。
WebGL会在裁剪空间(clip space)中对顶点进行裁剪。
如前所述，我们在顶点着色器中设置的`gl_Position`值在x、y、z轴上范围都是-1到+1。
WebGL会在这个范围内对我们传入的三角形和线条进行裁剪。完成裁剪后，`gl.viewport`的设置才会生效。
举个例子，如果我们这样设置：

```js
gl.viewport(
   10,   // left
   20,   // bottom
   30,   // width
   40,   // height
);
```
此时，裁剪空间中x=-1的值将对应像素坐标x=10的位置，
而x=+1则对应像素坐标x=40的位置（即左边界10加上宽度30）。(不过这种对应关系实际上是个简化的描述，[更精确的解释见下文](#pixel-coords)。)

因此，经过裁剪处理后，我们绘制的三角形将完全呈现在视口范围内。
现在让我们来绘制[之前文章](webgl-3d-perspective.html)中使用过的"F"模型。

这里使用的顶点着色器和片段着色器与我们在[正交投影](webgl-3d-orthographic.html)和[透视投影](webgl-3d-perspective.html)文章中采用的完全相同。

```glsl
#version 300 es
// vertex shader
in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the vertex color to the fragment shader.
  v_color = a_color;
}
```

```glsl
#version 300 es
// fragment shader
precision highp float;

// Passed in from the vertex shader.
in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}
```

在初始化阶段，我们需要为这个"F"模型创建着色器程序(program)、缓冲区(buffers)和顶点数组对象(vertex array)。

```js
// setup GLSL programs
// compiles shaders, links program, looks up locations
const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

// Tell the twgl to match position with a_position,
// normal with a_normal etc..
twgl.setAttributePrefix("a_");

// create buffers and fill with data for a 3D 'F'
const bufferInfo = twgl.primitives.create3DFBufferInfo(gl);
const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);
```

接下来我们创建一个绘制函数，该函数可接收三个矩阵参数：投影矩阵(projection matrix)、相机矩阵(camera matrix)和世界矩阵(world matrix)。

```js
function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix);

  let mat = m4.multiply(projectionMatrix, viewMatrix);
  mat = m4.multiply(mat, worldMatrix);

  gl.useProgram(programInfo.program);

  // ------ Draw the F --------

  // Setup all the needed attributes.
  gl.bindVertexArray(vao);

  // Set the uniforms
  twgl.setUniforms(programInfo, {
    u_matrix: mat,
  });

  // calls gl.drawArrays or gl.drawElements
  twgl.drawBufferInfo(gl, bufferInfo);
}
```

接下来我们调用这个函数来绘制"F"模型。

```js
function degToRad(d) {
  return d * Math.PI / 180;
}

const settings = {
  rotation: 150,  // in degrees
};
const fieldOfViewRadians = degToRad(120);

function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // Compute a perspective projection matrix
  const perspectiveProjectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, near, far);

  // Compute the camera's matrix using look at.
  const cameraPosition = [0, 0, -75];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // rotate the F in world space
  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // center the 'F' around its origin
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
}
render();
```
这基本上与[透视投影](webgl-3d-perspective.html)文章中的最终示例相同。
唯一不同的是，这里我们使用了[简化库](webgl-less-code-more-fun.html)来保持代码更简洁。

{{{example url="../webgl-multiple-views-one-view.html"}}}
现在，我们将使用`gl.viewport`方法，在画布上并排绘制两个"F"模型的视图。

```js
function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

-  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // we're going to split the view in 2
-  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+  const effectiveWidth = gl.canvas.clientWidth / 2;
+  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // Compute a perspective projection matrix
  const perspectiveProjectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, near, far);

+  // Compute an orthographic projection matrix
+  const halfHeightUnits = 120;
+  const orthographicProjectionMatrix = m4.orthographic(
+      -halfHeightUnits * aspect,  // left
+       halfHeightUnits * aspect,  // right
+      -halfHeightUnits,           // bottom
+       halfHeightUnits,           // top
+       -75,                       // near
+       2000);                     // far

  // Compute the camera's matrix using look at.
  const cameraPosition = [0, 0, -75];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // center the 'F' around its origin
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

+  const {width, height} = gl.canvas;
+  const leftWidth = width / 2 | 0;
+
+  // draw on the left with orthographic camera
+  gl.viewport(0, 0, leftWidth, height);
+
+  drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

+  // draw on the right with perspective camera
+  const rightWidth = width - leftWidth;
+  gl.viewport(leftWidth, 0, rightWidth, height);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
}
```

如您所见，我们首先将视口(viewport)设置为覆盖画布左半部分并绘制，然后再设置为覆盖右半部分进行绘制。
虽然两侧绘制的是相同内容，但区别在于我们使用了不同的投影矩阵(projection matrix)。

{{{example url="../webgl-multiple-views.html"}}}

现在让我们为两侧设置不同的清除颜色。
首先，在`drawScene`函数中调用`gl.clear`方法：

```js
  function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
+    // Clear the canvas AND the depth buffer.
+    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    ...
```

接下来，在调用`drawScene`之前，我们需要先设置清除颜色：

```js
  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // draw on left with orthographic camera
  gl.viewport(0, 0, leftWidth, height);
+  gl.clearColor(1, 0, 0, 1);  // red

  drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

  // draw on left with orthographic camera
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.clearColor(0, 0, 1, 1);  // blue

+  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
```

{{{example url="../webgl-multiple-views-clear-issue.html"}}}

哎呀，出什么问题了？为什么左侧什么都没有显示？

原来，`gl.clear`操作并不受视口(`viewport`)设置的影响。要解决这个问题，我们可以使用*裁剪测试(scissor test)*。裁剪测试允许我们定义一个矩形区域，当启用时，该区域外的任何内容都不会受到影响。

裁剪测试默认是关闭的。我们可以通过调用以下方法来启用它：

```js
gl.enable(gl.SCISSOR_TEST);
```

与视口(viewport)类似，裁剪测试(scissor test)默认使用画布的初始尺寸。
但我们可以通过调用`gl.scissor`方法来设置自定义范围，其参数格式与gl.viewport完全相同，例如：

```js
gl.scissor(
   10,   // left
   20,   // bottom
   30,   // width
   40,   // height
);
```

现在让我们将剪裁测试的相关设置添加到代码中：

```js
function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
+  gl.enable(gl.SCISSOR_TEST);

  ...

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // draw on left with orthographic camera
  gl.viewport(0, 0, leftWidth, height);
+  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0, 0, 1);  // red

  drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

  // draw on left with orthographic camera
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
+  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0, 0, 1, 1);  // blue

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
}
```

现在，这样的设置应该就能正常工作了。

{{{example url="../webgl-multiple-views-clear-fixed.html"}}}

当然，并不局限于在每个视图中绘制相同的内容。
通过合理设置视口和剪裁区域，你可以在每个独立视图中自由绘制完全不同的场景元素。

## 多画布渲染方案

这是模拟多画布场景的理想解决方案。
例如，当您需要为游戏开发角色选择界面时，可以在列表中展示每个角色的3D头部模型供用户选择。
再比如，假设您要开发一个电商网站，希望在页面中同时展示多个商品的3D模型。
最直观的实现方式是在每个需要展示3D元素的位置都放置一个`<canvas>`元素。但这种方式会带来一系列技术问题：

首先，每个`<canvas>`元素都需要独立的WebGL上下文。由于WebGL上下文之间无法共享资源，因此您必须：

为每个画布单独编译着色器(shaders)

为每个画布重复加载纹理(textures)

为每个画布重新上传几何数据(geometry)


另一个关键限制是：多数浏览器对同时活跃的WebGL画布数量有严格限制，通常最多支持8个上下文。这意味着当您在第9个`<canvas>`上创建WebGL上下文时，第一个创建的上下文会被自动释放。

我们可以通过以下方案解决这些问题：
只需创建一个覆盖整个窗口的主画布，然后在需要绘制3D内容的位置放置占位`<div>`元素。
通过调用[`element.getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)方法获取这些占位元素的精确位置信息，
据此设置视口(viewport)和剪裁区域(scissor area)来实现精准绘制。

这一方案可完美解决上述所有问题：仅需维护单个WebGL上下文，既能实现资源共享，又能彻底规避上下文数量限制。

让我们通过一个具体示例来说明实现方式。

首先创建基础HTML结构，包含背景层画布和前景内容层：

```html
<body>
  <canvas id="canvas"></canvas>
  <div id="content"></div>
</body>
```

接下来配置CSS样式

```css
body {
  margin: 0;
}
#content {
  margin: 10px;
}
#canvas {
  position: absolute;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  display: block;
}
```

现在让我们创建几个要绘制的对象。

```js
// create buffers and fill with data for various things.
const bufferInfosAndVAOs = [
  twgl.primitives.createCubeBufferInfo(
      gl,
      1,  // width
      1,  // height
      1,  // depth
  ),
  twgl.primitives.createSphereBufferInfo(
      gl,
      0.5,  // radius
      8,    // subdivisions around
      6,    // subdivisions down
  ),
  twgl.primitives.createTruncatedConeBufferInfo(
      gl,
      0.5,  // bottom radius
      0,    // top radius
      1,    // height
      6,    // subdivisions around
      1,    // subdivisions down
  ),
].map((bufferInfo) => {
  return {
    bufferInfo,
    vao: twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo),
  };
});
```
现在让我们创建100个HTML项。每个项包含一个容器`div`，内部包含一个视图`div`和一个标签`div`。
其中视图`div`是空容器，用于后续绘制3D内容。

```js
function createElem(type, parent, className) {
  const elem = document.createElement(type);
  parent.appendChild(elem);
  if (className) {
    elem.className = className;
  }
  return elem;
}

function randArrayElement(array) {
  return array[Math.random() * array.length | 0];
}

function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}

const contentElem = document.querySelector('#content');
const items = [];
const numItems = 100;
for (let i = 0; i < numItems; ++i) {
  const outerElem = createElem('div', contentElem, 'item');
  const viewElem = createElem('div', outerElem, 'view');
  const labelElem = createElem('div', outerElem, 'label');
  labelElem.textContent = `Item ${i + 1}`;
  const {bufferInfo, vao} = randArrayElement(bufferInfosAndVAOs);
  const color = [rand(1), rand(1), rand(1), 1];
  items.push({
    bufferInfo,
    vao,
    color,
    element: viewElem,
  });
}
```

现在让我们为这些元素添加如下样式：

```css
.item {
  display: inline-block;
  margin: 1em;
  padding: 1em;
}
.label {
  margin-top: 0.5em;
}
.view {
  width: 250px;
  height: 250px;
  border: 1px solid black;
}
```

`items`数组中每个元素都包含`bufferInfo`、`vao`、`color`和`element`属性。
我们逐个遍历所有元素，调用[`element.getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)，使用返回的矩形区域判断该元素是否与画布相交。
如果相交，就设置对应的视口和剪裁区域，然后绘制该对象。

```js
function render(time) {
  time *= 0.001;  // convert to seconds

  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // move the canvas to top of the current scroll position
  gl.canvas.style.transform = `translateY(${window.scrollY}px)`;

  for (const {bufferInfo, vao, element, color} of items) {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top  > gl.canvas.clientHeight ||
        rect.right  < 0 || rect.left > gl.canvas.clientWidth) {
      continue;  // it's off screen
    }

    const width  = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const left   = rect.left;
    const bottom = gl.canvas.clientHeight - rect.bottom - 1;

    gl.viewport(left, bottom, width, height);
    gl.scissor(left, bottom, width, height);
    gl.clearColor(...color);

    const aspect = width / height;
    const near = 1;
    const far = 2000;

    // Compute a perspective projection matrix
    const perspectiveProjectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, near, far);

    // Compute the camera's matrix using look at.
    const cameraPosition = [0, 0, -2];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // rotate the item
    const rTime = time * 0.2;
    const worldMatrix = m4.xRotate(m4.yRotation(rTime), rTime);

    drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix, bufferInfo, vao);
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

我将上述代码改为使用[requestAnimationFrame 循环](webgl-animation.html)以实现对象动画效果。
同时向`drawScene`函数传入需要绘制的bufferInfo参数。
着色器仅使用法线数据作为颜色输出以保持简洁。若添加[光照效果](webgl-3d-lighting-spot.html)将使代码复杂度大幅增加。

{{{example url="../webgl-multiple-views-items.html"}}}

当然，您可以为每个项目绘制完整的3D场景或其他任何内容。
只要正确设置视口(viewport)和剪裁区域(scissor)，
并配置与区域宽高比匹配的投影矩阵(projection matrix)，就能正常渲染。


代码中另一个需要注意的地方是：我们通过这行指令移动画布：

```
gl.canvas.style.transform = `translateY(${window.scrollY}px)`;
```

之所以这样做，是因为若将画布设为 `position: fixed;`，它将不再随页面滚动。
这两种方式的差异很微妙：浏览器会尽可能流畅地滚动页面，其速度可能超过我们绘制对象的速度。
因此我们有两种选择方案：

1. 使用固定定位画布

   在这种情况下，若渲染速度跟不上，画布前方的HTML内容会正常滚动，而画布本身保持静止，将导致短暂的内容不同步现象。
   
   <img src="resources/multi-view-skew.gif" style="border: 1px solid black; width: 266px;" class="webgl_center">

2. 将画布置于内容层下方移动

   在此方案下，若渲染速度不足，画布会与HTML保持同步滚动，但新进入视区的绘制区域将暂时空白，直至完成渲染绘制。

   <img src="resources/multi-view-fixed.gif" style="border: 1px solid black; width: 266px;" class="webgl_center">

   这正是前文采用的解决方案。

希望本文为您提供了实现多视图渲染的思路。
我们将在后续文章中运用这些技术，其中多视图展示将有助于理解相关概念。

<div class="webgl_bottombar" id="pixel-coords">
<h3>像素坐标</h3>
<p>在WebGL中，像素坐标以边缘为基准进行定位。举例来说，如果我们有一个3×2像素大小的画布，并设置视口如下：</p>
<pre class="prettyprint"><code>
gl.viewport(
  0, // left
  0, // bottom
  3, // width
  2, // height
);
</code></pre>
<p>此时我们实际定义的矩形区域将精确包围3×2个像素，其边界对应关系如下：</p>
<div class="webgl_center"><img src="resources/webgl-pixels.svg" style="width: 500px;"></div>
<p>这意味着裁剪空间X = -1.0对应矩形的左边缘，X = 1.0对应右边缘。前文所述"X = -1.0对应最左像素"实际应理解为对应左边缘。</p>
</div>
