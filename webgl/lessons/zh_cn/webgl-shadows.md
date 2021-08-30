Title: WebGL2 阴影
Description: 如何计算阴影
TOC: 阴影

让我们绘制一些阴影！

## 前提条件

计算基本的阴影并没有*那么*难，但是需要一些背景知识。为了能够理解本文，你需要已经理解以下话题。

-   [正射投影](webgl-3d-orthographic.html)
-   [透视投影](webgl-3d-perspective.html)
-   [聚光灯](webgl-3d-lighting-spot.html)
-   [纹理](webgl-3d-textures.html)
-   [渲染到纹理](webgl-render-to-texture.html)
-   [投影纹理](webgl-planar-projection-mapping.html)
-   [可视化相机](webgl-visualizing-the-camera.html)

因此，如果你还没有阅读过这些话题，请先去读一下。

首先，本文假设你已经读过
[码少趣多](webgl-less-code-more-fun.html)，因为本文使用到了那里提到的库，以便使得本文的例子更整洁。如果你不明白缓冲区，顶点数组和属性是什么，或者不明白 `twgl.setUniforms` 函数是设置 uniforms 的，等等... 那么你可能要往回读
[基础概念](webgl-fundamentals.html).

首先，绘制阴影的方法不止一种。每一种方法都有它们的优缺点。绘制阴影最常见的方法是使用阴影映射（shadow map）。

阴影映射是通过组合上面前提条件文章中提到的技术来实现的。

在 [平面的投影映射文章](webgl-planar-projection-mapping.html) 中，我们知道了如何将一张图像投影到物体上

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

回想一下，我们并没有把那张图像绘制在场景的物体上，而是在物体被渲染的时候，对于每一个像素，我们都会检查被投影的纹理是否在范围内，如果在范围内，我们会从被投影的纹理中采样相应的颜色，如果不在范围内，则我们就会从另一个不同的纹理中采样一个颜色，纹理的颜色是通过使用纹理坐标进行查找的，纹理坐标把一个纹理映射到了物体上。

如果被投影的纹理里包含了来自光源视角的深度数据，则会怎么样？换句话说，假设上面的例子中，在视椎体的顶端有一个光源，而被投影的纹理包含了在该光源视角下的深度信息。结果是，球体会得到一个更加接近光源的深度值，而平面会得到一个稍微远离光源的深度值。

<div class="webgl_center"><img class="noinvertdark" src="resources/depth-map-generation.svg" style="width: 600px;"></div>

如果我们具有了这些深度信息，那么我们在选择要渲染哪个颜色的时候，我们就可以从被投影的纹理中进行采样，得到一个采样深度值，然后和当前正在绘制的像素的深度值进行比较。如果当前像素的深度值比采样得到的深度值大，则说明还有其他东西比当前像素更加接近光源。也就是说，某样东西挡住了光源，因此该像素是处于阴影中的。

<div class="webgl_center"><img class="noinvertdark" src="resources/projected-depth-texture.svg" style="width: 600px;"></div>

其中，深度纹理被投影到光源视角下的视椎体内。当我们绘制地板的像素时，我们会计算在光源视角下，该像素的深度值（在上图中是 0.3）。然后我们在被投影的深度纹理中找到对应的深度值。在光源视角下，纹理内的深度值是 0.1，因为光线首先击中的是球体。因为 0.1 &lt; 0.3，所以我们知道该位置的地板一定在阴影内。

首先，我们来绘制阴影映射。 我们会取 [平面的投影映射文章](webgl-planar-projection-mapping.html)的最后一个示例，但我们并不是加载一个纹理，
的最后一个示例，但我们并不是加载一个纹理，我们会 [渲染到纹理](webgl-render-to-texture.html)
所以我们创建一个深度纹理并并将它作为`DEPTH_ATTACHMENT`附加到帧缓冲上

```js
const depthTexture = gl.createTexture()
const depthTextureSize = 512
gl.bindTexture(gl.TEXTURE_2D, depthTexture)
gl.texImage2D(
    gl.TEXTURE_2D, // 目标
    0, // 贴图级别
    gl.DEPTH_COMPONENT32F, // 内部格式
    depthTextureSize, // 宽
    depthTextureSize, // 高
    0, // 边框
    gl.DEPTH_COMPONENT, // 格式
    gl.FLOAT, // 类型
    null
) // 数据
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

const depthFramebuffer = gl.createFramebuffer()
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer)
gl.framebufferTexture2D(
    gl.FRAMEBUFFER, // 目标
    gl.DEPTH_ATTACHMENT, // 附着点
    gl.TEXTURE_2D, // 纹理目标
    depthTexture, // 纹理
    0
) // 贴图级别
```

为了使用深度纹理，我们还需要能够使用不同的着色器来渲染场景多次。一次是一个简单的着色器，只是为了渲染到深度纹理上，然后再使用我们当前的着色器，该着色器会投影一个纹理。

因此，首先让我们来修改一下 `drawScene` 函数，以便我们可以传入我们想要用来渲染的着色器程序

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix) {
+function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

-  gl.useProgram(textureProgramInfo.program);
+  gl.useProgram(programInfo.program);

  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
-  twgl.setUniforms(textureProgramInfo, {
+  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
*    u_textureMatrix: textureMatrix,
-    u_projectedTexture: imageTexture,
+    u_projectedTexture: depthTexture,
  });

  // ------ 绘制球体 --------

  // 设置所有需要的 attributes.
  gl.bindVertexArray(sphereVAO);

  // 设置球体特有的 uniforms
-  twgl.setUniforms(textureProgramInfo, sphereUniforms);
+  twgl.setUniforms(programInfo, sphereUniforms);

  // 调用 gl.drawArrays 或 gl.drawElements
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ 绘制平面 --------

  // 设置所有需要的 attributes.
  gl.bindVertexArray(planeVAO);

  // 设置我们刚刚计算的 uniforms
-  twgl.setUniforms(textureProgramInfo, planeUniforms);
+  twgl.setUniforms(programInfo, planeUniforms);

  // 调用 gl.drawArrays 或 gl.drawElements
  twgl.drawBufferInfo(gl, planeBufferInfo);
}
```

现在我们将在多个着色器程序中使用相同的顶点数组，我们需要确保这些程序使用相同的属性。
这是在谈论顶点数组（上面代码中的 VAO）时提出的，但我认为这是该站点上第一个实际遇到此问题的示例。 换句话说， 我们将使用投影纹理着色器程序和纯色着色器程序绘制球体和平面。
投影纹理着色器程序有 2 个属性， `a_position` 和
`a_texcoord`。 纯色着色器程序只有 1 个属性， `a_position`。
如果我们不告诉 WebGL 使用哪个属性位置，那么可能会使着色器的 `a_position` 的位置为 0 ，其他的位置为 1 (或者实际上 WebGL 可以选择任意位置). 如果出现这种情况，我们给 `sphereVAO` 和 `planeVAO` 设置的属性将不匹配

我们可以通过两种方式解决这个问题。

1. 在 GLSL 中，每个属性前加入 `layout(location = 0)`

```glsl
layout(location = 0) in vec4 a_position;
layout(location = 1) in vec4 a_texcoord;
```

如果我们有 150 个着色器，我们必须在所有着色器上重复这些并跟踪哪些着色器使用哪些位置

2. 在链接着色器之前调用 `gl.bindAttribLocation`

    在这种情况下，在调用 `gl.linkProgram` 之前，我们先调用 `gl.bindAttribLocation`.
    (见 [第一篇文章](webgl-fundamentals.html))

```js
gl.bindAttribLocation(program, 0, "a_position");
gl.bindAttribLocation(program, 1, "a_texcoord");
gl.linkProgram(program);
...
```

我们将使用第二种方式，因为它更 [D.R.Y 即不要重复你自己](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

我们用来编译和链接着色器的库为我们提供了执行此操作的选项。 我们只需将属性的名称及其位置传递给它，
它就会调用`gl.bindAttribLocation`

```js
// 设置 GLSL 程序
+// 注意：由于我们将在多个着色器程序中使用相同的 VAO，因此我们需要确保所有程序使用相同的属性位置。
+// 有两种方法可以做到这一点。
+// (1) 在 GLSL 中分配它们。 (2) 通过调用 `gl.bindAttribLocation` 分配它们
+// 在链接之前。我们正在使用方法 2，因为它更 D.R.Y.
+const programOptions = {
+  attribLocations: {
+    'a_position': 0,
+    'a_normal':   1,
+    'a_texcoord': 2,
+    'a_color':    3,
+  },
+};
-const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
-const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS],);
+const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs], programOptions);
+const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS], programOptions);
```

现在，让我们使用 `drawScene` 从光源视角绘制一次场景，然后使用深度纹理再绘制一次场景

```js
function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // 首先从光源的视角绘制一次
-  const textureWorldMatrix = m4.lookAt(
+  const lightWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
-  const textureProjectionMatrix = settings.perspective
+  const lightProjectionMatrix = settings.perspective
      ? m4.perspective(
          degToRad(settings.fieldOfView),
          settings.projWidth / settings.projHeight,
          0.5,  // near
          10)   // far
      : m4.orthographic(
          -settings.projWidth / 2,   // left
           settings.projWidth / 2,   // right
          -settings.projHeight / 2,  // bottom
           settings.projHeight / 2,  // top
           0.5,                      // near
           10);                      // far

+  // 绘制到深度纹理
+  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
+  gl.viewport(0, 0, depthTextureSize, depthTextureSize);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

-  drawScene(textureProjectionMatrix, textureWorldMatrix, m4.identity());
+  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);

+  // 现在绘制场景到画布，把深度纹理投影到场景内
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let textureMatrix = m4.identity();
  textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
  textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
-  textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+  textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
  // 使用该世界矩阵的逆矩阵来创建一个
  // 可以变换其他坐标为相对于这个世界空间
  // 的矩阵。
  textureMatrix = m4.multiply(
      textureMatrix,
-      m4.inverse(textureWorldMatrix));
+      m4.inverse(lightWorldMatrix));

  // 计算投影矩阵
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // 使用 look at 计算相机的矩阵
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix);
+  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo);
}
```

注意，我把 `textureWorldMatrix` 重命名成了 `lightWorldMatrix`，而 `textureProjectionMatrix` 重命名成了 `lightProjectionMatrix`。它们和之前还是一样的，只不过之前我们是投影纹理到一个任意空间内的。现在我们尝试从光源视角投影一个阴影映射。在数学上是一样的，但重命名这些变量似乎更合适。

在上面的代码中，我们首先使用之前绘制视椎体线框的着色器来渲染球体和平面到深度纹理中。那个着色器只会绘制了纯色的东西，并没有做什么特别的事情，这就是当渲染到深度纹理时我们所需要做的全部事情。

然后，我们再渲染场景到画布中，就像我们之前做的那样，把纹理投影到场景内。当我们在着色器内引用深度纹理时，只有红色分量是有效的，所以我们会重复红色分量作为绿色分量和蓝色分量。

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
+  // 'r' 通道内包含深度值
+  vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
```

趁此机会，让我们添加一个立方体到场景中

```js
+const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(
+    gl,
+    2,  // 大小
+);

...

+const cubeUniforms = {
+  u_colorMult: [0.5, 1, 0.5, 1],  // 绿色的光源
+  u_color: [0, 0, 1, 1],
+  u_texture: checkerboardTexture,
+  u_world: m4.translation(3, 1, 0),
+};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {

    ...

+    // ------ 绘制立方体 --------
+
+    // 设置所需要的所有 attributes.
+    gl.bindVertexArray(cubeVAO);
+
+    // 设置我们刚刚计算的 uniforms
+    twgl.setUniforms(programInfo, cubeUniforms);
+
+    // 调用 gl.drawArrays 或 gl.drawElements
+    twgl.drawBufferInfo(gl, cubeBufferInfo);

...
```

然后让我们来调整一下设置。我们会移动相机和为了使纹理投影可以覆盖到的范围更大，我们会加宽视场角。

```js
const settings = {
-  cameraX: 2.5,
+  cameraX: 6,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
-  fieldOfView: 45,
+  fieldOfView: 120,
};
```

注意：我把绘制表示视椎体的线框立方体的代码移到了 `drawScene` 函数的外面。

{{{example url="../webgl-shadows-depth-texture.html"}}}

这和上面的例子是完全一样的，只不过我们不是通过加载一个图像，而是通过渲染场景来生成一个深度纹理。如果你想要验证的话，可以把 `cameraX` 改回 2.5，把 `fieldOfView` 改回 45，这样就会和上面例子看起来一样了，除了我们投影的是深度纹理，而不是加载一个图像外。

深度值的范围是 0.0 到 1.0，代表它们在视椎体内的位置，因此 0.0（暗）表示接近视椎体的顶端的那端，而 1.0（亮）则是位于较远的开口那端。

因此，剩下要做的就是，我们不在投影纹理的颜色和映射纹理的颜色中做选择，我们可以使用深度纹理中的深度值来检查深度纹理的 Z 位置是离光源更近还是更远，然后再检查要绘制的像素的深度值。如果深度纹理的深度值更小，则表明有某物挡住了光源，该像素位于阴影中。

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+  float currentDepth = projectedTexcoord.z;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = vec4(texture(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
+  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
+  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
-  outColor = mix(texColor, projectedTexColor, projectedAmount);
+  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

在上面的代码中，如果 `projectedDepth` 小于 `currentDepth` ，则从光源视角来看，有某物更加接近光源，所以正在绘制的像素位于阴影中。

如果我们运行它，我们就会得到一个阴影

{{{example url="../webgl-shadows-basic.html" }}}

有点像样了，我们可以在地面看到球体的阴影，但是这些位于应该没有阴影的地方的奇怪图案是什么？这些图案被称为*阴影痤疮（shadow acne）*。这些图案的来源是因为存储在深度纹理里的深度数据已经被量化了，深度数据已经是一个纹理，一个像素网格了，它被从光源视角中投影出来，但是我们要把它和相机视角的深度值进行比较。即意味着在这个深度纹理网格中的值和我们相机没有对齐，因此，当我们计算 `currentDepth` 时，有时会出现比 `projectedDepth` 稍微大的值，有时会出现稍微小的值。

让我们添加一个偏差值（bias）。

```glsl
...

+uniform float u_bias;

void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
-  float currentDepth = projectedTexcoord.z;
+  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

而且我们需要设置它

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
  fieldOfView: 120,
+  bias: -0.006,
};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo, /**/u_lightWorldMatrix) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
  });

  ...
```

{{{example url="../webgl-shadows-basic-w-bias.html"}}}

滑动偏差值，你可以看到它如何影响图案的出现时间和出现地方。

为了更接近于完整，让我们真地添加一个聚光灯，聚光灯的计算方法从 [聚光灯文章](webgl-3d-lighting-spot.html) 中来。

首先，让我们直接从 [那篇文章](webgl-3d-lighting-spot.html) 中粘贴我们需要的部分到顶点着色器中。

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
+in vec3 a_normal;

+uniform vec3 u_lightWorldPosition;
+uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
+out vec3 v_normal;

+out vec3 v_surfaceToLight;
+out vec3 v_surfaceToView;

void main() {
  // 将坐标乘以矩阵
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // 将纹理坐标传给片段着色器
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

+  // 调整法线方位并传给片段着色器
+  v_normal = mat3(u_world) * a_normal;
+
+  // 计算物体表面的世界坐标
+  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
+
+  // 计算物体表面指向光源的向量
+  // 然后将它传给片段着色器
+  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+
+  // 计算物体表面指向相机的向量
+  // 然后将它传给片段着色器
+  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

接着是片段着色器

```glsl
#version 300 es
precision highp float;

// 从顶点着色器中传入
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;
+in vec3 v_normal;
+in vec3 v_surfaceToLight;
+in vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
+uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_innerLimit;          // 在点乘空间
+uniform float u_outerLimit;          // 在点乘空间

out vec4 outColor;

void main() {
+  // 因为 v_normal 是一个 varying，它已经被插值了
+  // 所以它不会是一个单位向量。对它进行归一化
+  // 使其再次成为单位向量
+  vec3 normal = normalize(v_normal);
+
+  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
+  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
+  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
+
+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
+  float light = inLight * dot(normal, surfaceToLightDirection);
+  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // 'r' 通道内包含深度值
  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
-  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
+  outColor = vec4(
+      texColor.rgb * light * shadowLight +
+      specular * shadowLight,
+      texColor.a);
}
```

注意，我们只需要使用 `shadowLight` 来调整 `light` 和 `specular` 的效果。如果一个物体位于阴影内，则没有光。

然后我们还需要设置好 uniforms

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
+function drawScene(
+    projectionMatrix,
+    cameraMatrix,
+    textureMatrix,
+    lightWorldMatrix,
+    programInfo) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
+    u_shininess: 150,
+    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
+    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
+    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
+    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
+    u_viewWorldPosition: cameraMatrix.slice(12, 15),
  });

...

function render() {
  ...

-  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);
+  drawScene(
+      lightProjectionMatrix,
+      lightWorldMatrix,
+      m4.identity(),
+      lightWorldMatrix,
+      colorProgramInfo);

  ...

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo);
+  drawScene(
+      projectionMatrix,
+      cameraMatrix,
+      textureMatrix,
+      lightWorldMatrix,
+      textureProgramInfo);

  ...
}
```

介绍一下其中一些 uniform 设置。回想一下 [聚光灯文章](webgl-3d-lighting-spot.html) 的 innerLimit 和 outerLimit 设置都是在点乘空间（余弦空间）内的，而我们只需要一半的视场角，因为它们会绕着光源的方向进行延伸。再回想一下 [相机文章](webgl-3d-camera.html) 中 4x4 矩阵的第 3 行是 Z 轴，所以我们从 `lightWorldMatrix` 的第 3 行中拉取前 3 个值，就会得到光源的 -Z 方向。我们想要的是 +Z 方向，所以我们对它进行翻转。类似地，相机文章还告诉了我们，第 4 行是世界坐标，所以我们可以通过从对应矩阵中把它们拉取出来得到 lightWorldPosition 和 viewWorldPosition（即相机的世界坐标）。当然，我们也可以通过暴露更多的设置或者传入更多的变量来得到它们。

让我们把背景清除为黑色，并设置视椎体线框为白色

```js
function render() {

  ...

  // 现在绘制场景到画布，并投影深度纹理到场景
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // ------ 绘制视椎体 ------
  {

    ...

          // 设置我们刚刚计算的 uniforms
    twgl.setUniforms(colorProgramInfo, {
-      u_color: [0, 0, 0, 1],
+      u_color: [1, 1, 1, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,
    });
```

现在，我们有了一个带阴影的聚光灯。

{{{example url="../webgl-shadows-w-spot-light.html" }}}

对于方向光源，我们可以从 [方向光源文章](webgl-3d-lighting-directional.html) 中拷贝它的着色器，然后将我们的投影从透视的改为正射的即可。

首先是顶点着色器

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
+in vec3 a_normal;

-uniform vec3 u_lightWorldPosition;
-uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
out vec3 v_normal;

-out vec3 v_surfaceToLight;
-out vec3 v_surfaceToView;

void main() {
  // 将坐标乘以矩阵
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // 将纹理坐标传给片段着色器
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

  // 调整法线方位并传给片段着色器
  v_normal = mat3(u_world) * a_normal;

-  // 计算物体表面的世界坐标
-  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
-
-  // 计算物体表面指向光源的向量
-  // 然后将它传给片段着色器
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
-
-  // 计算物体表面指向相机的向量
-  // 然后将它传给片段着色器
-  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

接着是片段着色器

```glsl
#version 300 es
precision highp float;

// 从顶点着色器中传入
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;
in vec3 v_normal;
-in vec3 v_surfaceToLight;
-in vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
-uniform float u_shininess;
-uniform vec3 u_lightDirection;
-uniform float u_innerLimit;          // 在点乘空间
-uniform float u_outerLimit;          // 在点乘空间
+uniform vec3 u_reverseLightDirection;

out vec4 outColor;

void main() {
  // 因为 v_normal 是一个 varying，它已经被插值了
  // 所以它不会是一个单位向量。对它进行归一化
  // 使其再次成为单位向量
  vec3 normal = normalize(v_normal);

+  float light = dot(normal, u_reverseLightDirection);

-  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
-
-  float dotFromDirection = dot(surfaceToLightDirection,
-                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
-  float light = inLight * dot(normal, surfaceToLightDirection);
-  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // 'r' 通道内包含深度值
  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
  outColor = vec4(
-      texColor.rgb * light * shadowLight +
-      specular * shadowLight,
+      texColor.rgb * light * shadowLight,
      texColor.a);
}
```

和 uniforms

```js
  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
-    u_shininess: 150,
-    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
-    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
-    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
-    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
-    u_viewWorldPosition: cameraMatrix.slice(12, 15),
+    u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
  });
```

我调整了相机位置以便看到更大的场景。

{{{example url="../webgl-shadows-w-directional-light.html"}}}

从上面的代码中应该可以看出某个问题，即我们的阴影映射分辨率只有那么大，所以即使计算方向光源只需要一个方向，不需要光源本身的位置，但为了能够决定哪块区域需要计算并应用阴影映射，我们仍然需要选择一个光源位置。

本文越来越长了，但还有很多和阴影相关的东西没有讲，所以我们把剩下的留到 [下一篇文章](webgl-shadows-continued.html)。
