Title: WebGL2 着色器和 GLSL 语言
Description: 什么是着色器和 GLSL 语言
TOC: 着色器和 GLSL 语言

这篇文章延续 [WebGL 基本原理](webgl-fundamentals.html).
如果你还不了解 WebGL 如何工作的，请先读[这篇文章](webgl-how-it-works.html).

我们已经讨论了着色器和 GLSL，但还没有涉及它们任何特定的细节。我希望通过本文的示例帮助你弄清楚相关的概念。

如[工作原理](webgl-how-it-works.html)中所述，每次画图你都需要 2 个着色器：
*点着色器*和*片段着色器*。 每个着色器都是一个*函数*。 点着色器和片段着色器链接在一起，
成为一个着色器程序（或仅仅是程序）。典型的 WebGL 应用程序将具有许多着色器程序。

## 点着色器

点着色器的工作是生成裁剪空间坐标。 它总是采用如下形式：

    #version 300 es
    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

绘制的每个点都需要调用这个着色器函数一次。每次调用，都需要通过设置一个全局变量`gl_Position`来设置该点在裁剪空间的坐标。

裁剪器需要获得的数据来源有下面三种方式：

1.  [属性](#属性) (从缓冲区取数据)
2.  [Uniforms](#uniforms) (在单次绘制过程中，它的值对所有顶点都是一样的)
3.  [纹理](#点着色器中的纹理) (来自 pixels/texels 的数据)

### 属性

点着色器获取数据的最常见方法是通过缓冲区和*属性*。[WebGL 工作原理](webgl-how-it-works.html)介绍了缓冲区和
属性。 首先创建缓冲区

    var buf = gl.createBuffer();

把数据放入到缓冲区

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

在着色器程序中查找属性的位置，

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

然后，告诉 WebGL 如何将数据从这些缓冲区中取出并放入属性中

    // turn on getting data out of a buffer for this attribute
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;
    var normalize = false;  // leave the values as they are
    var offset = 0;         // start at the beginning of the buffer
    var stride = 0;         // how many bytes to move to the next vertex
                            // 0 = use the correct stride for type and numComponents

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

在[WebGL 基本原理](webgl-fundamentals.html)中， 我们只是简单地传数据，并没有做任何数学换算。

    #version 300 es

    in vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

我们直接把裁剪空间的点放入到缓冲中，它就能正常工作。

属性类型可以是 `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, `mat4`,
`int`, `ivec2`, `ivec3`, `ivec4`, `uint`, `uvec2`, `uvec3`, `uvec4`.

### Uniforms

对于任何顶点来说，在调用点着色器的时候，uniforms 的值都是一样的。下面例子中我们通过 uniform 为点着色器添加偏移量。

    #version 300 es

    in vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

现在，我们给每个点都添加同样的偏移量。首先，我们查找 uniform 的位置。

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

绘制之前，我们要给 uniform 赋值。

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // offset it to the right half the screen

Uniforms 可以是各种不同的数据类型。每种类型对应不同名称的赋值方法调用。

    gl.uniform1f (floatUniformLoc, v);                 // for float
    gl.uniform1fv(floatUniformLoc, [v]);               // for float or float array
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // for vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // for vec2 or vec2 array
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // for vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // for vec3 or vec3 array
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // for vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // for vec4 or vec4 array

    gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // for mat2 or mat2 array
    gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // for mat3 or mat3 array
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // for mat4 or mat4 array

    gl.uniform1i (intUniformLoc,   v);                 // for int
    gl.uniform1iv(intUniformLoc, [v]);                 // for int or int array
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // for ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // for ivec2 or ivec2 array
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // for ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // for ivec3 or ivec3 array
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // for ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // for ivec4 or ivec4 array

    gl.uniform1u (intUniformLoc,   v);                 // for uint
    gl.uniform1uv(intUniformLoc, [v]);                 // for uint or uint array
    gl.uniform2u (ivec2UniformLoc, v0, v1);            // for uvec2
    gl.uniform2uv(ivec2UniformLoc, [v0, v1]);          // for uvec2 or uvec2 array
    gl.uniform3u (ivec3UniformLoc, v0, v1, v2);        // for uvec3
    gl.uniform3uv(ivec3UniformLoc, [v0, v1, v2]);      // for uvec3 or uvec3 array
    gl.uniform4u (ivec4UniformLoc, v0, v1, v2, v4);    // for uvec4
    gl.uniform4uv(ivec4UniformLoc, [v0, v1, v2, v4]);  // for uvec4 or uvec4 array

    // for sampler2D, sampler3D, samplerCube, samplerCubeShader, sampler2DShadow,
    // sampler2DArray, sampler2DArrayShadow
    gl.uniform1i (samplerUniformLoc,   v);
    gl.uniform1iv(samplerUniformLoc, [v]);

是否有`bool`, `bvec2`, `bvec3`, 和`bvec4`的类型呢？ 是的，可以使用类似 `gl.uniform?f?`, `gl.uniform?i?`,
or `gl.uniform?u?`的方法名。

注意，对于一个数组，你可以一次性设置这个数组每个元素的值。比如：

    // in shader
    uniform vec2 u_someVec2[3];

    // in JavaScript at init time
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // at render time
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // set the entire array of u_someVec2

如果你想分别设置数组元素的值，你必须分别查找数组的各个元素。

    // in JavaScript at init time
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // at render time
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // set element 0
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // set element 1
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // set element 2

类似做法，还可以创建结构体

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

这样，你不得不分别查找这个结构体的各个域：

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### 点着色器中的纹理

请看 [片段着色器中的纹理](#片段着色器中的纹理).

## 片段着色器

片段着色器的任务是给栅格化的像素提供颜色。通常采用下面的形式：

    #version 300 es
    precision highp float;

    out vec4 outColor;  // you can pick any name

    void main() {
       outColor = doMathToMakeAColor;
    }

对每个像素都会调用一次片段着色器。每次调用，它要求你赋值颜色值给这个输出变量。

片段着色器获取数据的方式有一下三种：

1.  [Uniforms](#uniforms) (每个像素的每次调用，其值都是相同)
2.  [纹理](#textures-in-fragment-shaders) (来自于像素或纹素(texel)的数据)
3.  [Varyings](#varyings) (来自于点着色器的数据或插值的数据)

### 片段着色器中的 Uniforms

请阅读 [点着色器中的 Uniforms](#uniforms).

### 片段着色器中的纹理

为从着色器中的纹理获取值，我们创建一个`sampler2D`的 Uniform 并使用 GLSL 函数`texture`从中提取一个值。

    precision highp float;

    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5)  // get a value from the middle of the texture
       outColor = texture(u_texture, texcoord);
    }

从纹理中输出什么数据[取决于很多设置](webgl-3d-textures.html)。至少我们需要创建数据并放入到纹理去中。

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var internalFormat = gl.RGBA,
    var width = 2;
    var height = 1;
    var border = 0; // MUST ALWAYS BE ZERO
    var format = gl.RGBA;
    var type = gl.UNSIGNED_BYTE;
    var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D,
                  level,
                  internalFormat,
                  width,
                  height,
                  border,
                  format,
                  type,
                  data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

然后再着色器程序中查找 uniform 的位置。

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

WebGL 要求你必须绑定它到纹理单元去。

    var unit = 5;  // Pick some texture unit
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

最后告诉着色器要绑定哪个单元(unit)到纹理中去。

    gl.uniform1i(someSamplerLoc, unit);

### Varyings

Varying 是一种从点着色器到片段着色器传值的方式，我们在文章[WebGL 如何工作](webgl-how-it-works.html)中已经讲述。

使用 varying 时，我们首先要在点着色器和片段着色器中声明匹配的 varyings。输出 varying 的值在点着色器中设置。
当 WebGL 画像素的时候，它将可选地在这些值之间插值，并将它们传递给对应输入片段着色器。

点着色器

    #version 300 es

    in vec4 a_position;

    uniform vec4 u_offset;

    +out vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

片段着色器

    #version 300 es
    precision highp float;

    +in vec4 v_positionWithOffset;

    out vec4 outColor;

    void main() {
    +  // convert from clipsapce (-1 <-> +1) to color space (0 -> 1).
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5;
    +  outColor = color;
    }

上面的例子实际意义不大。直接从裁剪空间到片段着色器复制颜色值，通常意义不是很大。

## GLSL

GLSL 全称是[图形库着色器语言](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf).
它是一种编写着色器的语言。它有一些在 Javascript 中不常见的特性。它主要被设计用来执行数学计算，以对图形进行光栅化。
因此，它内置了 vec2, vec3 和 vec4 之类的类型，分别表示 2 维，3 维和 4 维向量。类似也有`mat2`, `mat3`和`mat4`，
分别表示 2X2, 3X3 和 4X4的矩阵。你可以执行一些操作，如将vec乘以标量。

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b is now vec4(2, 4, 6, 8);

类似地，它可以执行矩阵乘法运行和向量与矩阵的乘法运行

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

同时，它有选择向量不同部分的选择器。对于vec4,

    vec4 v;

- `v.x`与 `v.s`、`v.r`和`v[0]`的意思一样.
- `v.y`与 `v.t`、`v.g` 和 `v[1]`的意思一样.
- `v.z` 与 `v.p`、 `v.b` 和 `v[2]`的意思一样.
- `v.w` 与 `v.q` 、 `v.a` 和 `v[3]`的意思一样.

你还可以交换或重复向量的部分，实例如下：

    v.yyyy

的意思是：

    vec4(v.y, v.y, v.y, v.y)

类似的

    v.bgra

的意思是

    vec4(v.b, v.g, v.r, v.a)

当构建一个向量或矩阵的时候，你能够一次性提供多部分的数据。请看示例：

    vec4(v.rgb, 1)

的意思是

    vec4(v.r, v.g, v.b, 1)

一点需要注意的是，GLSL的类型检查非常严格。

    float f = 1;  // ERROR 1 is an int. You can't assign an int to a float

正确的方式应该是

    float f = 1.0;      // use float
    float f = float(1)  // cast the integer to a float

前面的例子`vec4(v.rgb, 1)`并没有对`1`的类型报错，是因为`vec4`内部做了强制转化`float(1)`

GLSL有大量的内置函数。许多操作能够一次性处理向量的多个部分。例如

    T sin(T angle)

这里的T能够是`float`, `vec2`, `vec3` or `vec4`。如果你传参`vec4`,返回也是`vec4`类型。
如下，`v`是`vec4`


    vec4 s = sin(v);

的意思是

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

有时一个参数是浮点数，剩下的是`T`，意味着这个浮点数会作用到向量的所有部分。
例如下面例子里，`v1`和`v2`是`vec4`，`f`是浮点数，

    vec4 m = mix(v1, v2, f);

它的意思是

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

你可以从[OpenGL ES 3.0引用卡片](https://www.khronos.org/files/opengles3-quick-reference-card.pdf)的最后三页看到所有的GLSL函数列表
如果你喜欢枯燥冗长的文档，你可以阅读[GLSL ES 3.00规范](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf)。

## 总结

这就是整个系列文章的重点了。 WebGL就是创建各种着色器，提供数据到那些着色器，
然后调用`gl.drawArrays`，`gl.drawElements`等进行处理---为每个顶点调用当
前的顶点着色器来绘制顶点，然后为每个像素通调用当前片段着色器。

实际上创建着色器仅需几行代码。 由于这些代码在大多数WebGL程序是一样的。一旦编写完后，您几乎可以忽略它们[如何编译GLSL着色器
并将它们链接到着色器程序中，请参见此处]（webgl-boilerplate.html）。

到这里为止，你有两个学习方向选择：如果对图像处理感兴趣，可以转到[如何处理二维图片](webgl-image-processing.html)；
如果想学习转换，翻转和缩放，可以从[这里开始](webgl-2d-translation.html)。
