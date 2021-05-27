Title: WebGL2 是如何工作的
Description: WebGL 的底层到底做了什么
TOC: 如何工作的

这篇文章延续[WebGL 基本原理](webgl-fundamentals.html)。 在继续之前，
我们需要探讨一个基本问题：WebGL 和 GPU 到底在做什么。CPU 基本做了两部分事情：
第一部分是处理顶点(数据流)，变成裁剪空间节点；第二部分是基于第一部分的结果绘制像素。

当你调用

    gl.drawArrays(gl.TRIANGLES, 0, 9);

数字9意味着处理“9个顶点”，相应地就有9个点被处理。

<div class="webgl_center"><img src="resources/vertex-shader-anim.gif" /></div>

左边是你提供的数据。点着色器是用[GLSL](webgl-shaders-and-glsl.html)写的函数。
每个顶点都用调用一次它。在这个函数里面， 做了一些数学运算和设置裁剪空间的顶点坐标
到一个特殊变量`gl_position`。GPU 获得了这些坐标值并在内部存起来。

假设你在画一些三角形，每次 GPU 都会取出 3 个顶点来生成三角形。它指出三角形的 3 个点对应哪些像素，
然后这些像素值画出这个三角形，这个过程就叫“像素栅格化”。对于每个像素，都会调用片段着色器。
它有一个 vec4 类型的输出变量，它指示绘制像素的颜色是什么。

整个过程会非常有意思。但是你观察我们之前的例子中，片段着色器只有很少关于像素的信息。
实际上，我们能够传给它更多信息。“varyings”就能够从点着色器传值到片段着色器。

我们先简单示例如何将裁剪空间坐标系的值从点着色器到片段着色器。

为方便演示，我们修改之前的一个[例子](webgl-2d-matrices.html)，将绘制的图形从长方形变成三角形。

    // Fill the buffer with the values that define a triangle.
    function setGeometry(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
                 0, -100,
               150,  125,
              -175,  100]),
          gl.STATIC_DRAW);
    }

我们只有三个顶点。

    // Draw the scene.
    function drawScene() {
      ...
      // Draw the geometry.
    *  gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

在点着色器代码中，我们声明了前面带`out`的*varying*变量，它能够传给片段着色器。

    out vec4 v_color;
    ...
    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // Convert from clip space to color space.
      // Clip space goes -1.0 to +1.0
      // Color space goes from 0.0 to 1.0
    *  v_color = gl_Position * 0.5 + 0.5;
    }

相应地，在片段着色器中,我们以前置`in`声明了同样的*varying*变量。

    #version 300 es

    precision highp float;

    in vec4 v_color;

    out vec4 outColor;

    void main() {
    *  outColor = v_color;
    }

WebGL 将会连接在点着色器和片段着色器中拥有相同名称和类型的 varying 变量。

下面是演示版本

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

你可以移动，缩放和翻转这个三角形。注意由于颜色值是在裁剪空间计算出来的，
所以它们不会随三角形一起移动。它们相对于背景。

现在想一想，我们只计算了 3 个顶点。点着色器仅仅调用 3 次，也只计算 3 种颜色，
但是三角形却又许多种颜色。也就是我们叫它*varying*的原因。

实际上，当 GPU 栅格化这个三角形的时候，它会基于这个三个顶点的颜色值做插值计算。
然后，WebGL 会基于这些插值来调用片段着色器。

下面例子中，我们用到下面 3 个顶点。

<style>
table.vertex_table {
  border: 1px solid black;
  border-collapse: collapse;
  font-family: monospace;
  font-size: small;
}

table.vertex_table th {
  background-color: #88ccff;
  padding-right: 1em;
  padding-left: 1em;
}

table.vertex_table td {
  border: 1px solid black;
  text-align: right;
  padding-right: 1em;
  padding-left: 1em;
}
</style>
<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">Vertices</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

我们的顶点着色器应用矩阵来平移，旋转，缩放和转换为裁剪空间。
平移，旋转和比例的默认值是平移= 200、150，旋转= 0，比例= 1,1，因此实际上仅是平移。
给定我们的后缓冲区为 400x300，我们的顶点着色器将应用矩阵，然后计算以下 3 个裁剪空间顶点。

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">values written to gl_Position</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

还将这些值转换到色彩空间，并写入到我们声明的 _varying_ 变量 v_color。

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">values written to v_color</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

然后，写入到 v_color 的 3 个值被插值计算并传给绘制每个像素的片段着色器。

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_color is interpolated between v0, v1 and v2" }}}

我们还可以将更多数据传递给点着色器，然后再传递给片段着色器。
例如，让我们绘制一个由 2 个不同颜色三角形组成的矩形。
为此，我们将向点着色器添加另一个属性，以便我们可以向其传递更多数据，
并将该数据直接传递给片段着色器。

    in vec2 a_position;
    +in vec4 a_color;
    ...
    out vec4 v_color;

    void main() {
       ...
      // Copy the color from the attribute to the varying.
    *  v_color = a_color;
    }

现在，我们必须提供供 WebGL 使用的颜色。

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");
    +  var colorLocation = gl.getAttribLocation(program, "a_color");
      ...
    +  // Create a buffer for the colors.
    +  var buffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    +
    +  // Set the colors.
    +  setColors(gl);

      // setup attributes
      ...
    +  // tell the color attribute how to pull data out of the current ARRAY_BUFFER
    +  gl.enableVertexAttribArray(colorLocation);
    +  var size = 4;
    +  var type = gl.FLOAT;
    +  var normalize = false;
    +  var stride = 0;
    +  var offset = 0;
    +  gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);

      ...

    +// Fill the buffer with colors for the 2 triangles
    +// that make the rectangle.
    +function setColors(gl) {
    +  // Pick 2 random colors.
    +  var r1 = Math.random();
    +  var b1 = Math.random();
    +  var g1 = Math.random();
    +
    +  var r2 = Math.random();
    +  var b2 = Math.random();
    +  var g2 = Math.random();
    +
    +  gl.bufferData(
    +      gl.ARRAY_BUFFER,
    +      new Float32Array(
    +        [ r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1]),
    +      gl.STATIC_DRAW);
    +}

结果显示如下：

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

注意，我们有 2 个纯色三角形。 但是，我们以 _varying_ 的形式传递值，
因此它们在三角形上变化或内插。 只是我们在每个三角形的 3 个顶点上使用了相同的颜色。
如果我们使每种颜色不同，我们将看到插值。

    // Fill the buffer with colors for the 2 triangles
    // that make the rectangle.
    function setColors(gl) {
      // Make every vertex a different color.
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(
    *        [ Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1]),
          gl.STATIC_DRAW);
    }

现在，你就能看到插值的 _varying_ 了。

{{{example url="../webgl-2d-rectangle-with-random-colors.html" }}}

我想这不是很令人兴奋，但是它确实演示了使用多个属性并将数据从顶点着色器传递到片段着色器的过程。
如果您查看[图像处理示例]（webgl-image-processing.html），您会发现它们还使用额外的属性来传递纹理坐标。

##缓冲区和属性的命令做了什么?

缓冲区是将顶点和将每个顶点数据传给GPU的方法。 `gl.createBuffer`创建一个缓冲区。 
`gl.bindBuffer`将该缓冲区设置为正在处理的缓冲区。 `gl.bufferData`将数据复制到当前缓冲区中。

数据进入缓冲区后，我们需要告诉WebGL如何获取数据并将其提供给顶点着色器的属性。


为此，首先我们要问WebGL给它分配给属性的位置。 例如，下面的代码：

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

一旦知道了属性的位置，便发出2条命令。

    gl.enableVertexAttribArray(location);

这条命令告诉WebGL我们想要从缓冲区取数据

    gl.vertexAttribPointer(
        location,
        numComponents,
        typeOfData,
        normalizeFlag,
        strideToNextPieceOfData,
        offsetIntoBuffer);

上面这条命令告诉WebGL：从最后调用gl.bindBuffer绑定的缓冲区中获取数据；
每个顶点有多少个（1-4）分量；数据类型是什么（BYTE，FLOAT，INT，UNSIGNED_SHORT等）；
从一条数据到下一条数据需要跳过的字节数; 以及数据在缓冲区的偏移量。

如果每种数据类型使用1个缓冲区，则步幅和偏移量都可以始终为0。
步幅0表示“使用与类型和大小匹配的步幅”。 偏移量为0表示从缓冲区的开头开始。
将它们设置为非0的值更为复杂，尽管在性能方面可能会有一些好处，
但是除非您试图将WebGL推向其绝对极限，否则不值得为此付出麻烦。

在此，我希望你能够明白缓冲区和属性的工作原理。如果想要从另一个角度理解WebGL原理，
可以看看这篇文章[交互式状态图](/webgl/lessons/resources/webgl-state-diagram.html)

接下来，我们看一下[着色器和GLSL](webgl-shaders-and-glsl.html).

<div class="webgl_bottombar"><h3>vertexAttribPointer中的normalizeFlag是什么？</h3>
<p>
normalizeFlag适用于所有非浮点类型。 如果通过如果为false，则值将被解释为它们的类型。 
BYTE从-128到127，UNSIGNED_BYTE从0到255，SHORT INTEGER从-32768到32767等...
</p>
<p>
如果将normalize标志设置为true，则BYTE的值（-128至127）表示值-1.0至+ 1.0，
UNSIGNED_BYTE（0至255）变为0.0至+1.0。标准化的SHORT INTEGER也从-1.0变为+1.0，它的分辨率比BYTE高。
</p>
<p>
归一化数据的最常见用途是颜色。 大多数时候颜色仅从0.0到1.0。
如果红色，绿色，蓝色和Alpha分别使用一个完整的浮点数,每个顶点的每种颜色将使用16个字节。 
如果您有复杂的几何体，将会可以增加很多字节。 相反，您可以将颜色转换为UNSIGNED_BYTEs
(其中0代表0.0，255代表1.0)。 现在每种颜色只需要4个字节,每个顶点可节省75％的空间。
</p>
<p>让我们更改代码以执行此操作。 当我们告诉WebGL如何提取颜色时，我们将使用如下代码：</p>
<pre class="prettyprint showlinemods">
  var size = 4;
*  var type = gl.UNSIGNED_BYTE;
*  var normalize = true;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);
</pre>
<p>当我们用颜色填充缓冲区时，我们将使用如下代码：</p>
<pre class="prettyprint showlinemods">
// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
function setColors(gl) {
  // Pick 2 random colors.
  var r1 = Math.random() * 256; // 0 to 255.99999
  var b1 = Math.random() * 256; // these values
  var g1 = Math.random() * 256; // will be truncated
  var r2 = Math.random() * 256; // when stored in the
  var b2 = Math.random() * 256; // Uint8Array
  var g2 = Math.random() * 256;

gl.bufferData(
gl.ARRAY_BUFFER,
new Uint8Array( // Uint8Array
[ r1, b1, g1, 255,
r1, b1, g1, 255,
r1, b1, g1, 255,
r2, b2, g2, 255,
r2, b2, g2, 255,
r2, b2, g2, 255]),
gl.STATIC_DRAW);
}

</pre>
<p>
下面是实例演示：
</p>

{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}

</div>
