Title: WebGL2 属性（Attributes）
Description: WebGL 中的 attributes 是什么？
TOC: 属性（Attributes）

本文旨在帮助你建立对 WebGL 中属性状态是如何设置的一个直观理解。  
另有[关于纹理单元的类似文章](webgl-texture-units.html)以及[framebuffer 的文章](webgl-framebuffers.html)。

前置知识建议阅读：[WebGL 是如何工作的](webgl-how-it-works.html) 和  
[WebGL 着色器和 GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)。

## Attributes（属性）

在 WebGL 中，attributes 是传入顶点着色器的输入，数据来自 buffer。  
每当调用 `gl.drawArrays` 或 `gl.drawElements` 时，WebGL 会执行用户提供的顶点着色器 N 次。  
每次迭代，attributes 定义了如何从绑定到它们的 buffer 中提取数据，  
并将其传递给顶点着色器中的属性变量。

如果用 JavaScript 来模拟实现，它们可能像这样：

```js
// pseudo code
const gl = {
  arrayBuffer: null,
  vertexArray: {
    attributes: [
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
    ],
    elementArrayBuffer: null,
  },
}
```

如上所示，总共有 16 个 attributes。

当你调用 `gl.enableVertexAttribArray(location)` 或 `gl.disableVertexAttribArray`，可以将其理解为如下操作：

```js
// pseudo code
gl.enableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = true;
};

gl.disableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = false;
};
```

换句话说，location 就是 attribute 的索引。

类似地，`gl.vertexAttribPointer` 用来设置 attribute 的几乎所有其他属性。
实现可能如下所示：

```js
// pseudo code
gl.vertexAttribPointer = function(location, size, type, normalize, stride, offset) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.size = size;
  attrib.type = type;
  attrib.normalize = normalize;
  attrib.stride = stride ? stride : sizeof(type) * size;
  attrib.offset = offset;
  attrib.buffer = gl.arrayBuffer;  // !!!! <-----
};
```

注意，调用 `gl.vertexAttribPointer` 时，`attrib.buffer` 会设置为当前的 `gl.arrayBuffer`。
`gl.arrayBuffer` 如上述伪代码所示，通过调用 `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)` 设置。


```js
// pseudo code
gl.bindBuffer = function(target, buffer) {
  switch (target) {
    case ARRAY_BUFFER:
      gl.arrayBuffer = buffer;
      break;
    case ELEMENT_ARRAY_BUFFER;
      gl.vertexArray.elementArrayBuffer = buffer;
      break;
  ...
};
```

接下来是顶点着色器。在顶点着色器中你声明属性，例如：

```glsl
#version 300 es
in vec4 position;
in vec2 texcoord;
in vec3 normal;

...

void main() {
  ...
}
```

当你使用 `gl.linkProgram(someProgram)` 将顶点着色器和片段着色器链接时，
WebGL（驱动/GPU/浏览器）会自行决定每个属性使用哪个索引（location）。
除非你手动分配位置（见下文），否则你无法预知它们会选哪个索引。
因此你需要通过 `gl.getAttribLocation` 查询它们：

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

假设 `positionLoc` = `5`，意味着在执行顶点着色器时（即调用 `gl.drawArrays` 或 `gl.drawElements`），
WebGL 期待你已经为 attribute 5 设置好了正确的 `type`、`size`、`offset`、`stride`、`buffer` 等。

注意：在调用 `gl.linkProgram` *之前*，你可以使用`gl.bindAttribLocation(program, location, nameOfAttribute) `指定位置，例如：

```js
// Tell `gl.linkProgram` to assign `position` to use attribute #7
gl.bindAttribLocation(program, 7, 'position');
```

如果使用的是GLSL ES 3.00着色器，您也可以直接在着色器中指定要使用的location位置，例如：

```glsl
layout(location = 0) in vec4 position;
layout(location = 1) in vec2 texcoord;
layout(location = 2) in vec3 normal;

...
```

使用 `bindAttribLocation` 看起来更符合 [D.R.Y. 原则](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)，
不过你可以根据个人偏好选择不同的方式。

## 完整的属性状态

上面的描述中省略了一点：每个 attribute 实际上都有一个默认值。
这在实际应用中较少使用，所以之前没有提及。

```js
attributeValues: [
  [0, 0, 0, 1],
  [0, 0, 0, 1],
  ...
],
vertexArray: {
  attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, },
   ...
```

你可以通过一系列 `gl.vertexAttribXXX` 函数设置每个 attribute 的值。
当 `enable` 为 `false` 时，会使用这些值；当 `enable` 为 `true`，则会从分配的 `缓冲区buffer` 中读取数据。

<a id="vaos"></a>
## 顶点数组对象（VAO）

```js
const vao = gl.createVertexArray();
```

这会创建一个如上伪代码中 `gl.vertexArray` 所示的对象。
调用 `gl.bindVertexArray(vao)` 将你创建的 VAO 设为当前 VAO：

```js
// pseudo code
gl.bindVertexArray = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

这样你就可以在当前 VAO 中设置所有 `attributes` 和 `ELEMENT_ARRAY_BUFFER`。
当你要绘制某个图形时，只需调用一次 `gl.bindVertexArray` 即可设置所有属性。
否则你可能需要为每个属性分别调用 `gl.bindBuffer`、`gl.vertexAttribPointer`、`gl.enableVertexAttribArray`。

由此可见，使用 VAO 是很有价值的。
不过，要正确使用 VAO 需要更好的组织结构。

举个例子，假设你想用 `gl.TRIANGLES` 和一个着色器绘制一个立方体，
再用 `gl.LINES` 和另一个着色器重新绘制它。

假设用三角形绘制时要做光照处理，因此顶点着色器声明了这些属性：

```glsl
#version 300 es
// lighting-shader
// 用于绘制三角形的着色器

in vec4 a_position;
in vec3 a_normal;
```

然后使用这些位置和法线向我在[第一篇光照文章](webgl-3d-lighting-directional.html)中做的那样。

对于不需要光照的线条，您需要使用纯色，可以参照本教程系列[第一页](webgl-fundamentals.html)中的基础着色器实现方式。
声明一个uniform的颜色变量。 这意味着在顶点着色器中只需处理位置数据即可

```glsl
#version 300 es
// solid-shader
// shader for cube with lines

in vec4 a_position;
```

我们并不知道 WebGL 为每个 shader 分配的 attribute 位置是多少。
假设 lighting-shader 的分配结果是：

```
a_position location = 1
a_normal location = 0
```

solid-shader只有一个attribute属性。

```
a_position location = 0
```

显然，在切换着色器时需要重新设置属性。
一个着色器期望 `a_position` 的数据出现在attribute 0，另一个着色器期望它出现在attribute 1。

重新设置属性是一件麻烦事。更糟的是，使用 VAO 的初衷就是避免这些重复操作。
为了解决这个问题，我们需要在链接程序之前使用 bindAttribLocation 显式指定位置：

重新设置属性是一件麻烦事。更糟的是，使用 VAO 的初衷就是避免这些重复操作。
为了解决这个问题，我们需要在链接程序之前使用 `bindAttribLocation` 显式指定位置。

我们告诉 WebGL：

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

务必在**调用 `gl.linkProgram` 之前**执行以上操作。
这样 WebGL 在链接着色器时就会使用我们指定的位置。
现在这两个着色器就可以使用相同的 `VAO`。

## 最大属性数量

WebGL2 要求至少支持 16 个 attribute，但具体设备 / 浏览器 / 驱动可能支持更多。
你可以通过下面的方式获取实际支持数量：

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

如果你打算使用超过 16 个 attributes，建议检查支持数量，
并在设备不足时提示用户，或者降级使用更简单的着色器。
