Title: WebGL2 - 绘制多个物体
Description: 如何使用 WebGL 绘制多个物体
TOC: 绘制多个物体

此文上接[一系列 WebGL 相关文章](webgl-fundamentals.html)，
如果没读请从那里开始。

学到 WebGL 的一些基础以后，面临的一个问题可能是如何绘制多个物体。

这里有一些特别的地方你需要提前了解，WebGL 就像是一个方法，
但不同于一般的方法直接传递参数，它需要调用一些方法去设置状态，
最后用某个方法执行绘制，并使用之前设置的状态。你在写代码时可能会用这种形式的方法

    function drawCircle(centerX, centerY, radius, color) { ... }

或者用这种形式的方法

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL 使用的是后一种形式，例如 `gl.createBuffer`,
`gl.bufferData`, `gl.createTexture`, 和 `gl.texImage2D`
方法让你上传缓冲（顶点）或者纹理（颜色等）数据，
`gl.createProgram`, `gl.createShader`, `gl.compileProgram`, 和
`gl.linkProgram` 让你创建自己的 GLSL 着色器，
剩下的所有方法几乎都是设置全局变量或者最终方法 `gl.drawArrays` 或 `gl.drawElements`
需要的**状态**。

清楚这个以后，WebGL 应用基本都遵循以下结构

初始化阶段

-   创建所有着色器和程序并寻找参数位置
-   创建缓冲并上传顶点数据
-   为您要绘制的每个事物创建一个顶点数组
    -   为每个属性调用 `gl.bindBuffer`, `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`
    -   绑定索引到 `gl.ELEMENT_ARRAY_BUFFER`
-   创建纹理并上传纹理数据

渲染阶段

-   清空并设置视图和其他全局状态（开启深度检测，剔除等等）
-   对于想要绘制的每个物体
    -   调用 `gl.useProgram` 使用需要的程序
    -   为物体绑定顶点数组
        -   调用 `gl.bindVertexArray`
    -   设置物体的全局变量
        -   为每个全局变量调用 `gl.uniformXXX`
        -   调用 `gl.activeTexture` 和 `gl.bindTexture` 设置纹理到纹理单元
    -   调用 `gl.drawArrays` 或 `gl.drawElements`

基本上就是这些，详细情况取决于你的实际目的和代码组织情况。

有的事情例如上传纹理数据（甚至时顶点数据）可能遇到异步，
你就需要等所有资源下载完成后才能开始。

让我们来做一个简单的应用，绘制三个物体，一个立方体，一个球体，一个椎体。

我不会详细介绍如何计算出立方体，球体和椎体数据，
假设有方法能够返回[上篇文章中的 bufferInfo 对象](webgl-less-code-more-fun.html).

这是代码，着色器是[透视示例](webgl-3d-perspective.html)中的简单的着色器，
新添加了一个 `u_colorMult` 全局变量和顶点颜色相乘。

    #version 300 es
    precision highp float;

    // 从顶点着色器中传入的值
    in vec4 v_color;

    +uniform vec4 u_colorMult;

    out vec4 outColor;

    void main() {
    *   outColor = v_color * u_colorMult;
    }

初始化阶段

    // 每个物体需要的全局变量
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // 每个物体的平移量
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

绘制阶段

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ 绘制球体 --------

    gl.useProgram(programInfo.program);

    // 设置所需的属性变量
    gl.bindVertexArray(sphereVAO);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // 设置刚才计算出的全局变量
    twgl.setUniforms(programInfo, sphereUniforms);

    twgl.drawBufferInfo(gl, sphereBufferInfo);

    // ------ 绘制立方体 --------

    // 设置所需的属性变量
    gl.bindVertexArray(cubeVAO);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // 设置刚才计算出的全局变量
    twgl.setUniforms(programInfo, cubeUniforms);

    twgl.drawBufferInfo(gl, cubeBufferInfo);

    // ------ 绘制椎体 --------

    // 设置所需的属性变量
    gl.bindVertexArray(coneVAO);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // 设置刚才计算出的全局变量
    twgl.setUniforms(programInfo, coneUniforms);

    twgl.drawBufferInfo(gl, coneBufferInfo);

这是结果

{{{example url="../webgl-multiple-objects-manual.html" }}}

需要注意的是，由于我们只有一个程序，所以只调用了一次 `gl.useProgram`，
如果我们有不同的着色程序，则需要在使用前调用 `gl.useProgram`。

这还有一个值得简化的地方，将这四个相关的事情组合到一起。

1.  着色程序（和它的全局变量以及属性 info)
2.  顶点数组 (包含属性设置)
3.  绘制物体所需程序的全局变量
4.  传递给 gl.drawXXX 的计数以及是否调用 gl.drawArrays 或 gl.drawElements

简单的简化后制作一个序列对象，将四个属性放在其中

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        vertexArray: sphereVAO,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: cubeVAO,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        vertexArray: coneVAO,
        uniforms: coneUniforms,
      },
    ];

绘制的时候仍然需要更新矩阵

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // 为每个物体计算矩阵
    sphereUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

但是绘制代码就会变成一个简单的循环

    // ------ 绘制几何体 --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;

      gl.useProgram(programInfo.program);

      // 设置所需的属性
      gl.bindVertexArray(object.vertexArray);

      // 设置全局变量
      twgl.setUniforms(programInfo, object.uniforms);

      // 绘制
      twgl.drawBufferInfo(gl, bufferInfo);
    });

理论上这就是大多数现有三维引擎的主要渲染循环。
其他地方的某些代码控制 `objectsToDraw` 列表中的对象，他们需要的选项数量可能更多，但大多数人都将计算列表中的对象和实际调用 `gl.draw___` 函数分开

{{{example url="../webgl-multiple-objects-list.html" }}}

一般来说， _最好的做法_ 是不重复调用 WebGL。
换句话说，如果 WebGL 的某些状态已经设置为您需要设置的状态，则不要再次设置它。在这种情况下，我们可以检查，如果我们需要绘制当前对象的着色器程序与前一个对象的着色器程序相同，则无需调用`gl.useProgram`。同样，如果我们使用相同的形状/几何体/顶点，则无需调用 `gl.bindVertexArray`

所以，简单的优化后可能像这样

```js
+var lastUsedProgramInfo = null;
+var lastUsedVertexArray = null;

objectsToDraw.forEach(function(object) {
  var programInfo = object.programInfo;
  var vertexArray = object.vertexArray;

+  if (programInfo !== lastUsedProgramInfo) {
+    lastUsedProgramInfo = programInfo;
    gl.useProgram(programInfo.program);
+  }

  // 设置所需的属性
+  if (lastUsedVertexArray !== vertexArray) {
+    lastUsedVertexArray = vertexArray;
    gl.bindVertexArray(vertexArray);
+  }

  // 设置全局变量
  twgl.setUniforms(programInfo, object.uniforms);

  // 绘制
  twgl.drawBufferInfo(gl, object.bufferInfo);
});
```

这次我们多绘制一些物体，用包含更多物体的序列代替之前的三个物体。

```js
// 将图形放在数组中以便随机抽取
var shapes = [
    { bufferInfo: sphereBufferInfo, vertexArray: sphereVAO },
    { bufferInfo: cubeBufferInfo, vertexArray: cubeVAO },
    { bufferInfo: coneBufferInfo, vertexArray: coneVAO }
]

var objectsToDraw = []
var objects = []

// 创建每个物体的信息
var baseHue = rand(360)
var numObjects = 200
for (var ii = 0; ii < numObjects; ++ii) {
    // 选择一个形状
    var shape = shapes[rand(shapes.length) | 0]

    // 创建一个物体
    var object = {
        uniforms: {
            u_colorMult: chroma
                .hsv(emod(baseHue + rand(120), 360), rand(0.5, 1), rand(0.5, 1))
                .gl(),
            u_matrix: m4.identity()
        },
        translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
        xRotationSpeed: rand(0.8, 1.2),
        yRotationSpeed: rand(0.8, 1.2)
    }
    objects.push(object)

    // 添加到绘制数组中
    objectsToDraw.push({
        programInfo: programInfo,
        bufferInfo: shape.bufferInfo,
        vertexArray: shape.vertexArray,
        uniforms: object.uniforms
    })
}
```

渲染时

```js
// 计算每个物体的矩阵
objects.forEach(function (object) {
    object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time
    )
})
```

然后在上方的循环中绘制所有物体。

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

> 注意：我最初从这篇文章的 WebGL2 版本中去除了上面的部分。
> [这篇文章的 WebGL1 版本](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html) 有一个关于优化的部分。 去除它的原因是
> 我不太确定顶点数组对象的优化有那么重要。
> 在 WebGL1 中没有顶点数组，绘制一个物体通常需要 9 到 16 次调用来设置绘制对象的属性。
> 在 WebGL2 中，所有这些都发生在初始化时，通过为每个对象设置一个顶点数组，然后在渲染时每个对象调用 gl.bindVertexArray。
>
> 此外，一般来说，大多数 WebGL 应用程序并没有突破绘图的极限。他们需要在一系列机器上运行，从一些 8 年前的低端英特尔集成图形 GPU 到一些高端机器。 上一节中提到的优化不太可能在高性能和非高性能之间产生差异。相反，要获得性能需要减少绘制调用的数量，例如通过使用 [实例化](webgl-instanced-drawing.html) 和其他类似技术。
>
> 我重新添加该部分的原因是，
> 在最后一个示例的错误报告中，绘制 200 个对象， 在[关于 picking 的文章](webgl-picking.html)中被引用了 😅

## 绘制透明物体和多个列表

在上面的例子中，只有一个列表要绘制。 因为所有的对象都是不透明的。如果我们要绘制透明对象，则必须从后到前绘制，最远的物体首先绘制。 另一方面，为了速度, 对于不透明的物体我们要从前往后绘制，这是因为 DEPTH_TEST 意味着在其他物体后面的任何像素 GPU 将不执行片段着色器。所以我们要先把前面的东西画出来。

大多数 3D 引擎通过绘制 2 个或更多对象列表来处理此问题。 一个列表给不透明的物体。
其他列表是给透明物体的。 不透明列表从前到后排序。透明列表按从后到前排序。可能还有其他内容的单独列表，例如叠加或后期处理效果。

## 考虑使用库

需要特别注意的是着色器和图形往往一一对应，
例如一个需要法向量的着色器就不能用在没有法向量的几何体上，
同样的一个需要纹理的着色器在没有纹理时就无法正常运行。

这就是需要选择一个优质的三维引擎（例如[Three.js](https://threejs.org)）的原因之一，
因为它可以帮你解决这些问题。你创建几何体时只需要告诉 three.js 你想如何渲染，
它就会在运行时为你创建你需要的着色器。几乎所有的三维引擎，从 Unity3D 到 Unreal
到 Source 到 Crytek，有些在离线时创建着色器，但是重要的是它们都会**创建**着色器。

当然，你阅读这些文章的目的是想知道底层原理，自己写所有的东西非常好并且也很有趣，
但是需要注意的是[WebGL 是非常底层的](webgl-2d-vs-3d-library.html)，
所以如果你想自己做所有的东西的话，要做的东西很多，通常包括着色器生成器，
因为不同的特性需要不同的着色器。

你可能注意到我并没有把 `computeMatrix` 放在循环中，
那是因为渲染理论上应该和矩阵计算分离，通常情况下矩阵计算放在接下来要讲的
[场景图](webgl-scene-graph.html)中。

现在我们有了绘制多个物体的框架，就可以[绘制一些文字了](webgl-text-html.html)。
