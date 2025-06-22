Title: WebGL2 顶点拉取
Description: 使用独立索引
TOC: 顶点拉取

本文假设你已经阅读了其他许多文章，从 [基础知识](webgl-fundamentals.html) 开始。如果你还没有阅读它们，请先从那里开始。

传统上，WebGL应用会将几何数据放入缓冲区中，然后通过属性（attributes）自动将这些缓冲区中的顶点数据传递给顶点着色器，由程序员编写代码将其转换为裁剪空间（clip space）坐标。

这里的 **“传统上”** 非常重要。  
这只是一种**传统做法**，并不是必须如此。  
WebGL 并不关心我们是如何处理的，它只关心顶点着色器是否为 `gl_Position` 赋予了裁剪空间坐标。

让我们使用类似于 [纹理](webgl-3d-textures.html) 中示例的方式，绘制一个带纹理映射的立方体。我们通常会说需要至少 24 个唯一顶点，这是因为虽然立方体只有 8 个角点位置，但每个角点会出现在立方体的 3 个不同面上，而每个面又需要不同的纹理坐标。

<div class="webgl_center"><img src="resources/cube-vertices-uv.svg" style="width: 400px;"></div>

在上面的图示中，我们可以看到左侧面的角点 3 需要的纹理坐标是 (1,1)，而右侧面对角点 3 的使用则需要纹理坐标 (0,1)。顶部面则会需要另一组不同的纹理坐标。

通常，我们是通过将 8 个角点位置扩展为 24 个顶点来实现这一点的。


```js
  // front
  { pos: [-1, -1,  1], uv: [0, 1], }, // 0
  { pos: [ 1, -1,  1], uv: [1, 1], }, // 1
  { pos: [-1,  1,  1], uv: [0, 0], }, // 2
  { pos: [ 1,  1,  1], uv: [1, 0], }, // 3
  // right
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 4
  { pos: [ 1, -1, -1], uv: [1, 1], }, // 5
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 6
  { pos: [ 1,  1, -1], uv: [1, 0], }, // 7
  // back
  { pos: [ 1, -1, -1], uv: [0, 1], }, // 8
  { pos: [-1, -1, -1], uv: [1, 1], }, // 9
  { pos: [ 1,  1, -1], uv: [0, 0], }, // 10
  { pos: [-1,  1, -1], uv: [1, 0], }, // 11
  // left
  { pos: [-1, -1, -1], uv: [0, 1], }, // 12
  { pos: [-1, -1,  1], uv: [1, 1], }, // 13
  { pos: [-1,  1, -1], uv: [0, 0], }, // 14
  { pos: [-1,  1,  1], uv: [1, 0], }, // 15
  // top
  { pos: [ 1,  1, -1], uv: [0, 1], }, // 16
  { pos: [-1,  1, -1], uv: [1, 1], }, // 17
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 18
  { pos: [-1,  1,  1], uv: [1, 0], }, // 19
  // bottom
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 20
  { pos: [-1, -1,  1], uv: [1, 1], }, // 21
  { pos: [ 1, -1, -1], uv: [0, 0], }, // 22
  { pos: [-1, -1, -1], uv: [1, 0], }, // 23
```

这些位置和纹理坐标通常会被放入缓冲区中，并通过属性传递给顶点着色器。

但我们真的需要以这种方式来做吗？如果我们实际上只想保留 8 个角点和 4 个纹理坐标，会怎样？  
类似于下面这样：

```js
positions = [
  -1, -1,  1,  // 0
   1, -1,  1,  // 1
  -1,  1,  1,  // 2
   1,  1,  1,  // 3
  -1, -1, -1,  // 4
   1, -1, -1,  // 5
  -1,  1, -1,  // 6
   1,  1, -1,  // 7
];
uvs = [
  0, 0,  // 0
  1, 0,  // 1
  0, 1,  // 2
  1, 1,  // 3
];
```

然后，对于这 24 个顶点中的每一个，我们指定要使用哪一个位置和哪一个纹理坐标。

```js
positionIndexUVIndex = [
  // front
  0, 1, // 0
  1, 3, // 1
  2, 0, // 2
  3, 2, // 3
  // right
  1, 1, // 4
  5, 3, // 5
  3, 0, // 6
  7, 2, // 7
  // back
  5, 1, // 8
  4, 3, // 9
  7, 0, // 10
  6, 2, // 11
  // left
  4, 1, // 12
  0, 3, // 13
  6, 0, // 14
  2, 2, // 15
  // top
  7, 1, // 16
  6, 3, // 17
  3, 0, // 18
  2, 2, // 19
  // bottom
  1, 1, // 20
  0, 3, // 21
  5, 0, // 22
  4, 2, // 23
];
```

我们能在 GPU 上使用这种方式吗？为什么不可以！

我们会将位置和纹理坐标分别上传到各自的纹理中，就像我们在 [数据纹理](webgl-data-textures.html) 中讲到的那样。

```js
function makeDataTexture(gl, data, numComponents) {
  // expand the data to 4 values per pixel.
  const numElements = data.length / numComponents;
  const expandedData = new Float32Array(numElements * 4);
  for (let i = 0; i < numElements; ++i) {
    const srcOff = i * numComponents;
    const dstOff = i * 4;
    for (let j = 0; j < numComponents; ++j) {
      expandedData[dstOff + j] = data[srcOff + j];
    }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,            // mip level
      gl.RGBA32F,   // format
      numElements,  // width
      1,            // height
      0,            // border
      gl.RGBA,      // format
      gl.FLOAT,     // type
      expandedData,
  );
  // we don't need any filtering
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

const positionTexture = makeDataTexture(gl, positions, 3);
const texcoordTexture = makeDataTexture(gl, uvs, 2);
```

由于纹理每个像素最多可以存储 4 个值，`makeDataTexture` 会将我们提供的数据扩展为每像素 4 个值。

接着，我们会创建一个顶点数组对象（vertex array）来保存我们的属性状态。


```js
// create a vertex array object to hold attribute state
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
```


Next we need upload the position and texcoord indices to a buffer.

```js
// Create a buffer for the position and UV indices
const positionIndexUVIndexBuffer = gl.createBuffer();
// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
// Put the position and texcoord indices in the buffer
gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(positionIndexUVIndex), gl.STATIC_DRAW);
```

接下来，我们需要将位置索引和纹理坐标索引上传到一个缓冲区。

```js
// Turn on the position index attribute
gl.enableVertexAttribArray(posTexIndexLoc);

// Tell the position/texcoord index attribute how to get data out
// of positionIndexUVIndexBuffer (ARRAY_BUFFER)
{
  const size = 2;                // 2 components per iteration
  const type = gl.INT;           // the data is 32bit integers
  const stride = 0;              // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0;              // start at the beginning of the buffer
  gl.vertexAttribIPointer(
      posTexIndexLoc, size, type, stride, offset);
}
```

注意这里调用的是 `gl.vertexAttribIPointer`，而不是 `gl.vertexAttribPointer`。  
其中的 `I` 表示整数，用于整数和无符号整数类型的属性。  
另外，`size` 设置为 2，因为每个顶点包含 1 个位置索引和 1 个纹理坐标索引。

虽然我们只需要 24 个顶点，但绘制 6 个面，每个面 12 个三角形，每个三角形 3 个顶点，总共 36 个顶点。
为了指定每个面使用哪 6 个顶点，我们将使用 [顶点索引](webgl-indexed-vertices.html)。


```js
const indices = [
   0,  1,  2,   2,  1,  3,  // front
   4,  5,  6,   6,  5,  7,  // right
   8,  9, 10,  10,  9, 11,  // back
  12, 13, 14,  14, 13, 15,  // left
  16, 17, 18,  18, 17, 19,  // top
  20, 21, 22,  22, 21, 23,  // bottom
];
// Create an index buffer
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// Put the indices in the buffer
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
```

由于我们想要在立方体上绘制一张图像，因此还需要第三个纹理存储这张图像。  
这里我们用一个 4x4 的数据纹理，内容是棋盘格图案。  
纹理格式使用 `gl.LUMINANCE`，因为这样每个像素只需要一个字节。


```js
// Create a checker texture.
const checkerTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Fill the texture with a 4x4 gray checkerboard.
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    4,
    4,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0xDD, 0x99, 0xDD, 0xAA,
      0x88, 0xCC, 0x88, 0xDD,
      0xCC, 0x88, 0xCC, 0xAA,
      0x88, 0xCC, 0x88, 0xCC,
    ]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

接下来是顶点着色器……  
我们可以像这样从纹理中查找一个像素：

```glsl
vec4 color = texelFetch(sampler2D tex, ivec2 pixelCoord, int mipLevel);
```

因此，给定一个整数像素坐标，上述代码将提取出对应的像素值。

使用 `texelFetch` 函数，我们可以将一维数组索引转换为二维纹理坐标，并从二维纹理中查找对应的值，方式如下：

```glsl
vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
```

有了这个函数，我们的着色器如下所示：

```glsl
#version 300 es
in ivec2 positionAndTexcoordIndices;

uniform sampler2D positionTexture;
uniform sampler2D texcoordTexture;

uniform mat4 u_matrix;

out vec2 v_texcoord;

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
  int positionIndex = positionAndTexcoordIndices.x;
  vec3 position = getValueByIndexFromTexture(
      positionTexture, positionIndex).xyz;
 
  // Multiply the position by the matrix.
  gl_Position = u_matrix * vec4(position, 1);

  int texcoordIndex = positionAndTexcoordIndices.y;
  vec2 texcoord = getValueByIndexFromTexture(
      texcoordTexture, texcoordIndex).xy;

  // Pass the texcoord to the fragment shader.
  v_texcoord = texcoord;
}
```

在底部，它实际上和我们在 [纹理](webgl-3d-textures.html) 中使用的着色器是一样的。我们将 `position` 与 `u_matrix` 相乘，并将纹理坐标输出到 `v_texcoord`，以传递给片元着色器。

不同之处仅在于我们获取 `position` 和 `texcoord` 的方式。我们使用传入的索引，从各自的纹理中提取这些值。

要使用这个着色器，我们需要查找所有相关的变量位置。

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

+// look up where the vertex data needs to go.
+const posTexIndexLoc = gl.getAttribLocation(
+    program, "positionAndTexcoordIndices");
+
+// lookup uniforms
+const matrixLoc = gl.getUniformLocation(program, "u_matrix");
+const positionTexLoc = gl.getUniformLocation(program, "positionTexture");
+const texcoordTexLoc = gl.getUniformLocation(program, "texcoordTexture");
+const u_textureLoc = gl.getUniformLocation(program, "u_texture");
```

在渲染阶段，我们设置属性（attributes）。

```js
// Tell it to use our program (pair of shaders)
gl.useProgram(program);

// Set the buffer and attribute state
gl.bindVertexArray(vao);
```

然后，我们需要绑定全部 3 个纹理，并设置所有的 uniform。

```js
// Set the matrix.
gl.uniformMatrix4fv(matrixLoc, false, matrix);

// put the position texture on texture unit 0
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, positionTexture);
// Tell the shader to use texture unit 0 for positionTexture
gl.uniform1i(positionTexLoc, 0);

// put the texcoord texture on texture unit 1
gl.activeTexture(gl.TEXTURE0 + 1);
gl.bindTexture(gl.TEXTURE_2D, texcoordTexture);
// Tell the shader to use texture unit 1 for texcoordTexture
gl.uniform1i(texcoordTexLoc, 1);

// put the checkerboard texture on texture unit 2
gl.activeTexture(gl.TEXTURE0 + 2);
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Tell the shader to use texture unit 2 for u_texture
gl.uniform1i(u_textureLoc, 2);
```

最后，执行绘制操作。

```js
// Draw the geometry.
gl.drawElements(gl.TRIANGLES, 6 * 6, gl.UNSIGNED_SHORT, 0);
```

最终，我们只使用了 8 个位置和 4 个纹理坐标，就得到了一个带贴图的立方体。

{{{example url="../webgl-pulling-vertices.html"}}}

有几点需要注意：代码实现较为简化，使用了 1D 纹理来存储位置和纹理坐标。  
但纹理的宽度是有限的，[具体有多宽依赖于硬件](https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE)，  
你可以通过以下方式查询：

```js
const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
```

如果我们想处理比最大纹理宽度还多的数据，就需要选择一个合适的纹理尺寸，并将数据分布到多行中，可能还需要对最后一行进行填充以保持矩形结构。

我们在这里还做了另一件事：使用了两张纹理，一张存储位置，另一张存储纹理坐标。  
其实我们完全可以将这两类数据存储在同一张纹理中，例如交错（interleaved）存储。


    pos,uv,pos,uv,pos,uv...

或者将它们存储在纹理的不同区域。

    pos,pos,pos,...
    uv, uv, uv,...

我们只需要修改顶点着色器中的数学逻辑，以正确地从纹理中提取对应的数据。

那么问题来了：是否应该用这种方式？  
答案是“视情况而定”。具体效果可能因 GPU 而异，有些情况下这比传统方式还慢。

本文的重点再次强调：  
WebGL 并不在意你是如何为 `gl_Position` 设置裁剪空间坐标的，也不在意你是如何输出颜色的。它只关心你是否设置了这些值。纹理，本质上只是可以随机访问的二维数组。

当你在 WebGL 中遇到问题时，请记住，WebGL 只是运行一些着色器程序，而这些着色器可以通过以下方式访问数据。

- uniforms（全局变量）
- attributes（每个顶点着色器执行时接收的数据）
- textures（可以随机访问的二维数组）

不要让传统的 WebGL 使用方式限制了你的思维。  
WebGL 实际上具有极强的灵活性。

当你想在 WebGL 中解决问题时，请记住 WebGL 只是运行着色器，
这些着色器可以通过 uniforms（全局变量）、attributes（每次顶点着色器执行时传入的数据）
以及 textures（可随机访问的二维数组）来访问数据。
不要让传统的 WebGL 使用方式阻碍你发现它真正的灵活性。

<div class="webgl_bottombar">
<h3>为什么叫做顶点拉取（Vertex Pulling）？</h3>
<p>实际上我最近（2019年7月）才听到这个术语，  
尽管我之前就用过这种技术。  
它来源于  
<a href='https://www.google.com/search?q=OpenGL+Insights+"Programmable+Vertex+Pulling"+article+by+Daniel+Rakos'>  
OpenGL Insights 中 Daniel Rakos 撰写的“可编程顶点拉取”文章</a>。  
</p>
<p>之所以叫做顶点*拉取*，是因为顶点着色器决定读取哪个顶点数据，  
而传统方式是通过属性自动提供顶点数据。  
实际上，顶点着色器是在*拉取*内存中的数据。</p>
</div>
