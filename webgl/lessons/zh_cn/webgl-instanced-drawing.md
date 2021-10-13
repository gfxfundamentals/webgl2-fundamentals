Title: WebGL2 性能优化 - 实例化绘制
Description: 绘制同一物体的多个实例
TOC: 实例化绘制

WebGL 有一个拓展叫做*实例化绘制*。
一般来说，使用这种方法绘制多个相同的物体比一个一个绘制要快得多。

首先让我们来演示一下如何绘制同一物体的多个实例。

下面的代码*类似*于我们在
[正射投影](webgl-3d-orthographic.html)
这篇文章中的结尾部分。我们先来看下面两个着色器的代码。

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
uniform mat4 matrix;

out vec4 v_color;

void main() {
  // 顶点位置与矩阵相乘。
  gl_Position = matrix * a_position;
}
`

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 color;

out vec4 outColor;

void main() {
  outColor = color;
}
`
```

在顶点着色器里我们像[那篇文章](webgl-3d-orthographic.html)
一样让实例的每个顶点与一个矩阵相乘，因为这样非常的灵活。
在片元着色器中则使用通过 uniform 传递的颜色变量。

要进行绘制我们得先编译着色器并连接为一个 program，
然后再找到所有 attribute 和 uniform 的地址。

```js
const program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource
])

const positionLoc = gl.getAttribLocation(program, 'a_position')
const colorLoc = gl.getUniformLocation(program, 'color')
const matrixLoc = gl.getUniformLocation(program, 'matrix')
```

并制作一个顶点数组对象来保存属性状态

```js
// 创建顶点数组对象（属性状态）
const vao = gl.createVertexArray()

// 并使它成为我们目前正在使用的
gl.bindVertexArray(vao)
```

之后我们需要使用一个缓冲区提供顶点数据。

```js
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
        -0.1, 0.4, -0.1, -0.4, 0.1, -0.4, 0.1, -0.4, -0.1, 0.4, 0.1, 0.4, 0.4,
        -0.1, -0.4, -0.1, -0.4, 0.1, -0.4, 0.1, 0.4, -0.1, 0.4, 0.1
    ]),
    gl.STATIC_DRAW
)
const numVertices = 12

// 设置位置属性
gl.enableVertexAttribArray(positionLoc)
gl.vertexAttribPointer(
    positionLoc, // 位置
    2, // 大小（每次迭代从缓冲区里取出的数量）
    gl.FLOAT, // 缓冲区中的数据类型
    false, // 归一化
    0, // stride (0 = 根据size和数据类型进行推断)
    0 // 在缓冲区中的偏移
)
```

让我们绘制 5 个实例。 每个实例我们将制作 5 个矩阵和 5 种颜色。

```js
const numInstances = 5
const matrices = [
    m4.identity(),
    m4.identity(),
    m4.identity(),
    m4.identity(),
    m4.identity()
]

const colors = [
    [1, 0, 0, 1], // 红色
    [0, 1, 0, 1], // 绿色
    [0, 0, 1, 1], // 蓝色
    [1, 0, 1, 1], // 紫红色
    [0, 1, 1, 1] // 青色
]
```

要绘制它们我们首先得使用着色器程序，并设置 attribute，
然后在一个循环当中为这 5 个实例分别计算新的矩阵，
再去设置矩阵和颜色的 uniform，最后把它们绘制出来。

```js
function render(time) {
  time *= 0.001; // 秒

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // 告诉 WebGL 如何从裁剪空间转换为像素
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  // 设置所有属性
  gl.bindVertexArray(vao);

  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

    const color = colors[ndx];

    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(matrixLoc, false, mat);

    gl.drawArrays(
        gl.TRIANGLES,
        0,             // 偏移
        numVertices,   // 每个实例的顶点数量
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

注意到这个数学矩阵库里所有关于矩阵函数的最后一个参数都是一个可选的
目标矩阵。在其它大多数文章里我们并没有用到这个参数，而是让它自行创建一个
新的矩阵，但这一次我们想让结果存放在已经创建好的矩阵上。

于是乎我们得到了 5 个不同颜色而且还在自转的加号。

{{{example url="../webgl-instanced-drawing-not-instanced.html"}}}

对于每个实例来说，每绘制一次要调用一次`gl.uniform4v`，`gl.uniformMatrix4fv`
还有`gl.drawArrays`，一共是 15 个 WebGL 的函数调用。如果我们的着色器
更加复杂，像是[聚光灯那篇文章](webgl-3d-lighting-spot.html)一样的话，
每个物体至少要有 7 次函数调用，分别是 6 次调用`gl.uniformXXX`，
最后一次调用`gl.drawArrays`。如果我们要绘制 400 个物体的话
那将会是 2800 个 WebGL 函数调用。

实例化就是一个帮助我们减少函数调用的好路子。
它的工作原理是让你告诉 WebGL 你想绘制多少次相同的物体（实例的数量）。
对于每个 attribute，你可以让它每次调用顶点着色器时迭代到缓冲区的
_下一个值_（默认行为），或者是每绘制 N（N 通常为 1）个实例时才迭代到
_下一个值_。

举个栗子，我们不妨使用 attribute 来提供`matrix`和`color`的值以取代 uniform。
我们会在缓冲区里为每个实例提供矩阵和颜色，设置好从缓冲区里读取数据的
attribute，然后告诉 WebGL 只有在绘制下一个实例的时候才迭代到下一个值。

我们开始做吧！

首先我们改一下这些着色器，用 attribute 给`matrix`和`color`提供数据。

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
-uniform mat4 matrix;
+in vec4 color;
+in mat4 matrix;
+
+out vec4 v_color;

void main() {
  // 顶点位置与矩阵相乘
  gl_Position = matrix * a_position;

+  // 传递颜色到片元着色器
+  v_color = color;
}
`
```

and

```js
const fragmentShaderSource = `#version 300 es
precision highp float;

-uniform vec4 color;
+// 从顶点着色器传入
+in vec4 v_color;

void main() {
-  gl_FragColor = color;
+  gl_FragColor = v_color;
}
`
```

因为 attribute 只能在顶点着色器中声明所以我们需要用 varying
把颜色传递到片元着色器。

然后我们需要找到所有 attribute 的位置。

```js
const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

const positionLoc = gl.getAttribLocation(program, 'a_position');
-const colorLoc = gl.getUniformLocation(program, 'color');
-const matrixLoc = gl.getUniformLocation(program, 'matrix');
+const colorLoc = gl.getAttribLocation(program, 'color');
+const matrixLoc = gl.getAttribLocation(program, 'matrix');
```

现在，我们需要一个缓冲区来储存所有一会我们要提供给 attribute 的矩阵。
因为缓冲区最好在一个*chunk*中更新，所以我们把所有的矩阵放在一个
`Float32Array`当中。

```js
// 为每一个实例设置矩阵
const numInstances = 5;
+// 制作一个每个矩阵一个视图的类型化数组
+const matrixData = new Float32Array(numInstances * 16);
```

然后我们再为每一个矩阵创建一个更小的`Float32Array`的观察视图。

```js
-const matrices = [
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-];
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  const byteOffsetToMatrix = i * 16 * 4;
  const numFloatsForView = 16;
  matrices.push(new Float32Array(
      matrixData.buffer,
      byteOffsetToMatrix,
      numFloatsForView));
}
```

这样做的话我们可以用`matrixData`来取得所有矩阵的数据，
当需要取得某一个矩阵的数据的时候只要用`matrices[ndx]`即可。

同时我们也需要在 GPU 上创建缓冲区来储存这些数据。
目前只需要申请一段合适大小的缓冲区就好了，我们暂时不需要提供数据给它，
所以`gl.bufferData`第二个参数设置为要为缓冲区申请的字节数。

```js
const matrixBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer)
// 只为缓冲区申请特定大小的空间
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW)
```

注意到最后一个参数是`gl.DYNAMIC_DRAW`。这是一个给 WebGL 的*指示*，
告诉它我们要经常刷新这里的数据。

Now we need to set up the attributes for the matrices.
The matrix attribute is a `mat4`. A `mat4` actually uses
4 consecutive attribute slots.

```js
const bytesPerMatrix = 4 * 16
for (let i = 0; i < 4; ++i) {
    const loc = matrixLoc + i
    gl.enableVertexAttribArray(loc)
    // note the stride and offset
    const offset = i * 16 // 4 floats per row, 4 bytes per float
    gl.vertexAttribPointer(
        loc, // location
        4, // size (num values to pull from buffer per iteration)
        gl.FLOAT, // type of data in buffer
        false, // normalize
        bytesPerMatrix, // stride, num bytes to advance to get to next set of values
        offset // offset in buffer
    )
    // this line says this attribute only changes for each 1 instance
    gl.vertexAttribDivisor(loc, 1)
}
```

The most important point relative to instanced drawing is
the call to `gl.vertexAttribDivisor`. It sets this
attribute to only advance to the next value once per instance.
This means the `matrix` attributes will use the first matrix for
every vertex for the first instance, the second matrix for the
second instance and so on.

接下来颜色值也需要储存在缓冲区当中。因为在这个例子当中颜色不会改变，
所以我们直接上传数据即可。

```js
-const colors = [
-  [ 1, 0, 0, 1, ],  // 红色
-  [ 0, 1, 0, 1, ],  // 绿色
-  [ 0, 0, 1, 1, ],  // 蓝色
-  [ 1, 0, 1, 1, ],  // 品红
-  [ 0, 1, 1, 1, ],  // 青色
-];
+// 为每一个实例设置颜色
+const colorBuffer = gl.createBuffer();
+gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
+gl.bufferData(gl.ARRAY_BUFFER,
+    new Float32Array([
+        1, 0, 0, 1,  // 红色
+        0, 1, 0, 1,  // 绿色
+        0, 0, 1, 1,  // 蓝色
+        1, 0, 1, 1,  // 品红
+        0, 1, 1, 1,  // 青色
+      ]),
+    gl.STATIC_DRAW);
```

我们还需要设置颜色属性

```js
// 设置颜色属性
gl.enableVertexAttribArray(colorLoc)
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
// 此行表示此属性仅针对每 1 个实例更改
gl.vertexAttribDivisor(colorLoc, 1)
```

在绘制的时候，我们再也不用在循环中设置矩阵和颜色的 uniform，
而是先来计算一下每个实例的矩阵。

```js
// 更新所有矩阵
matrices.forEach((mat, ndx) => {
  m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
  m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

-  const color = colors[ndx];
-
-  gl.uniform4fv(colorLoc, color);
-  gl.uniformMatrix4fv(matrixLoc, false, mat);
-
-  gl.drawArrays(
-      gl.TRIANGLES,
-      0,             // 偏移
-      numVertices,   // 每个实例的顶点数量
-  );
});
```

因为我们的矩阵已经作为了目标矩阵参数来传递，同时它还是一个
`Float32Array`的数组，所以在计算完以后我们就可以把数据直接上传给 GPU 了。

```js
// 上传新的矩阵数据
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer)
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData)
```

最后我们总算是可以在一个 draw call 当中绘制所有的实例了。

```js
gl.drawArraysInstanced(
    gl.TRIANGLES,
    0, // 偏移
    numVertices, // 每个实例的顶点数
    numInstances // 实例的数量
)
```

{{{example url="../webgl-instanced-drawing.html"}}}

在之前的例子当中每个实例需要三次函数调用，所以一共是 15 次的调用。
但是现在我们只需要总共两次函数调用即可，第一次上传所有的矩阵数据，
第二次就是请求绘制了。

我不知道我是不是显得有点啰嗦了，还有一点我想说的是，上面的代码我们并没有
考虑到关于 canvas 方面的东西。我是说，我们并没有使用任何的
[投影矩阵](webgl-3d-orthographic.html)或是[视图矩阵](webgl-3d-camera.html)。
因为我们只是为了去演示如何实例化绘制罢了。如果你想往里加点投影或是视图矩阵的话，
那将意味着更多的计算会放到 JavaScript 当中，
这可能会引起一些性能问题。有个更好的办法是给顶点着色器添加一到两个
uniform 来储存这些矩阵。

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 color;
in mat4 matrix;
+uniform mat4 projection;
+uniform mat4 view;

out vec4 v_color;

void main() {
  // 顶点位置与矩阵相乘
-  gl_Position = matrix * a_position;
+  gl_Position = projection * view * matrix * a_position;

  // 传递颜色到片元着色器
  v_color = color;
}
`
```

然后在初始化的时候找到他们的位置

```js
const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
+const projectionLoc = gl.getUniformLocation(program, 'projection');
+const viewLoc = gl.getUniformLocation(program, 'view');
```

然后再渲染的时候设置它们。

```js
gl.useProgram(program);

+// 设置视图和投影矩阵
+// 因为对于所有实例来说它们是一样的
+const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+gl.uniformMatrix4fv(projectionLoc, false,
+    m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
+gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
```

{{{example url="../webgl-instanced-drawing-projection-view.html"}}}
