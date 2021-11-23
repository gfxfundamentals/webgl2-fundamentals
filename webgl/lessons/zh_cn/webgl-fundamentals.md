Title: WebGL2的基本原理
Description: 你的WebGL2第一课:基本原理
TOC: 基本原理

首先，这些文章是关于WebGL2的。 如果你对WebGL1.0感兴趣，请[转到这里](https://webglfundamentals.org/)。 注意WebGL2几乎100%向后兼容[WebGL1](webgl1-to-webgl2.html)。 就是说，一旦启用WebGL2，原来WebGL1写的代码还是会如预期的那样执行。
这个教程遵循如下的路径：

WebGL通常被认为是一种3D API。 人们认为“我会使用了WebGL魔法，我就会拥有酷酷的3D技能”。 实际上WebGL仅仅是栅格化(rasterization)引擎。它会基于你的代码来画点，线条和三角形。 而你需要使用点、线、三角形组合来完成复杂的3D任务。

WebGL是在GPU上运行的。在GPU上运行的WebGL代码是以一对函数的形式，分别叫做点着色器(Vetex Shader)和片段着色器(Fragment Shader). 他们是用一种类似C++的强类型语言[GLSL](webgl-shaders-and-glsl.html)编写的。这一对函数组合被叫做程序(Program)。

点着色器的任务是计算点的的位置。基于函数输出的位置，WebGL能够栅格化(rasterize)不同种类的基本元素，如[点、线和三角形](webgl-points-lines-triangles.html)。当栅格化这些基本元素的同时，也会调用第二种函数：片段着色器。它的任务就是计算当前正在绘制图形的每个像素的颜色。

几乎所有的WebGL API是为这些函数对的运行来[设置状态](resources/webgl-state-diagram.html)。你需要做的是：设置一堆状态，然后调用`gl.drawArrays`和`gl.drawElements`在GPU上运行你的着色器。

这些函数需要用到的任意数据都必须提供给GPU。 着色器有如下四种方法能够接收数据。

1. 属性(Attributes)，缓冲区(Buffers)和顶点数组(Vetex Arrays)

   缓存区以二进制数据形式的数组传给GPU。缓存区可以放任意数据，通常有位置，归一化参数，纹理坐标，顶点颜色等等
  
   属性用来指定数据如何从缓冲区获取并提供给顶点着色器。比如你可能将位置信息以3个32位的浮点数据存在缓存区中， 一个特定的属性包含的信息有：它来自哪个缓存区，它的数据类型(3个32位浮点数据)，在缓存区的起始偏移量，从一个位置到下一个位置有多少个字节等等。

   缓冲区并非随机访问的，而是将顶点着色器执行指定次数。每次执行时，都会从每个指定的缓冲区中提取下一个值并分配给一个属性。

   属性的状态收集到一个顶点数组对象（VAO）中，该状态作用在每个缓冲区，以及如何从这些缓冲区中提取数据。

2. Uniforms

   Uniforms是在执行着色器程序前设置的全局变量

3. 纹理(Textures)

   纹理是能够在着色器程序中随机访问的数组数据。大多数情况下纹理存储图片数据，但它也用于包含颜色以为的数据。

4. Varyings

   Varyings是一种从点着色器到片段着色器传递数据的方法。根据显示的内容如点，线或三角形， 顶点着色器在Varyings中设置的值，在运行片段着色器的时候会被解析。

## WebGL Hello World

WebGL只关注两件事：剪辑空间坐标(Clip space coordinates)和颜色。 所以作为程序员，你的任务是向WebGL提供这两件事--编写两种着色器的代码: 点着色器提供剪辑空间坐标；片段着色器提供颜色。

不管你的画布大小，剪辑空间坐标的取值范围是-1到1. 下面是一个很简单的WebGL程序例子。

首先从顶点着色器开始。

    #version 300 es

    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }

运行的时候，如果所有的代码是用Javascript(而非GLSL)写的，你可以想象它是如下形式：

    // *** PSEUDO CODE!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
         // copy the next 4 values from positionBuffer to the a_position attribute
         const start = offset + i * stride;
         attributes.a_position = positionBuffer.slice(start, start + size);
         runVertexShader();
         ...
         doSomethingWith_gl_Position();
    }

这个例子只是给你演示顶点着色器是怎么运行的。实际没有这么简单，因为`positionBuffer`需要被转换成二进制数据，从而取出数据会有些不同。

接下来我们需要片段着色器

    #version 300 es

    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      // Just set the output to a constant reddish-purple
      outColor = vec4(1, 0, 0.5, 1);
    }

上面，我们声明了`outColor`作为片段着色器的输出，并设置值为`1, 0, 0.5, 1`。颜色值范围是0~1, 上面颜色值的红色为1，绿色为0，蓝色为0.5，透明性为1.

我们已经写了两个着色器函数，接下来我们开始使用WebGL。

首先我们需要一个HTML canvas元素

     <canvas id="c"></canvas>

然后再Javascript中查找到该元素

     var canvas = document.querySelector("#c");

现在我们创建一个WebGL2RenderingContext

     var gl = canvas.getContext("webgl2");
     if (!gl) {
        // no webgl2 for you!
        ...

为了让着色器代码能够在GPU上运行，你需要编译这些着色器代码。编译前，通过字符串连接的方式把这些GLSL的代码片段作为Javascript的string，当然也可以使用AJAX下载方式，或把他们放到non-javascript标签中，或者像下例一样以多行字符串模板的形式。

    var vertexShaderSource = `#version 300 es

    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      // Just set the output to a constant reddish-purple
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

实际上，大多数3D引擎在运行过程中用不同形式的字符串模板、连接等等产生GLSL着色器。然而，本章实例中没有那么复杂，不需要再运行中实时生成GLSL。

> 注意： `#version 300 es` **必须位于着色器代码的第一行**。 它前面不允许有任何的注释或空行！ `#version 300 es` 的意思是你想要使用WebGL2的着色器语法:GLSL ES 3.00。
> 如果你没有把它放到第一行，将默认设置为GLSL ES 1.00,即WebGL1.0的语法。相比WebGL2的语法，会少很多特性。

接下来，我们需要一个函数创建着色器实例、上传GLSL源码和编译着色器。下面代码很容易从名称中猜测它的意思，所以我没有添加任何注释。

    function createShader(gl, type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }

我调用上面方法创建两个着色器

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

然后我们*链接*这两个着色器成一个*程序(program)*

    function createProgram(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

并调用它

    var program = createProgram(gl, vertexShader, fragmentShader);

在GPU上已经创建了一个GLSL程序后，我们还需要提供数据给它。大多数WebGL API是有关设置状态来供给GLSL程序数据的。
在我们的例子中，GLSL程序唯一的输入属性是`a_position`。我们做的第一件事就是查找这个属性的位置。记住在查找属性是在程序初始化的时候，而不是render循环的时候。

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

属性从缓存区中取数据，所以我们需要创建缓冲区。

    var positionBuffer = gl.createBuffer();

WebGL通过绑定点来处理许多WebGL资源。你可以认为绑定点是WebGL内部的全局变量。首先你绑定一个资源到某个绑定点，然后所有方法通过这个绑定点来对这个资源的访问。下面我们来绑定缓冲区。

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

现在我们通过绑定点把数据存放到缓冲区。

    // three 2d points
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

Javascript弱类型语言，而WebGL需要强类型数据，需要用`new Float32Array(positions)`创建32位的浮点数数组，然后用`gl.bufferData`函数将数组数据拷贝到GPU上的`positionBuffer`里面。因为前面把`positionBuffer`绑定到了`ARRAY_BUFFER`，所以我们直接使用绑定点。

最后一个参数`gl.STATIC_DRAW`提示WebGL如何使用数据，WebGL据此做相应的优化。`gl.STATIC_DRAW` 告诉WebGL我们不太可能去改变数据的值。

数据存放到缓存区后，接下来需要告诉属性如何从缓冲区取出数据。首先，我需要创建属性状态集合：顶点数组对象(Vertex Array Object)。

    var vao = gl.createVertexArray();

为了使所有属性的设置能够应用到WebGL属性状态集，我们需要绑定这个顶点数组到WebGL。

    gl.bindVertexArray(vao);

然后，我们还需要启用属性。如果没有开启这个属性，这个属性值会是一个常量。

    gl.enableVertexAttribArray(positionAttributeLocation);

接下来，我们需要设置属性值如何从缓存区取出数据。

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

`gl.vertexAttribPointer` 的隐含部分是它绑定当前的`ARRAY_BUFFER`到这个属性。换句话说，这个属性被绑定到`positionBuffer`。 从GLSL顶点着色器的角度看，属性`a_position`是`vec4`

    in vec4 a_position;

`vec4`是一个浮点型的数。以javascript来看，你可以认为它是这样的`a_position = {x: 0, y: 0, z: 0, w: 0}`。我们设置`size = 2`, 属性值被设置为`0, 0, 0, 1`。 属性获取前两个坐标值(x和y) ,z和w分别被默认设置为0和1。

在绘制之前，画布大小要设置成显示区域的大小。画布就像一个2维的图片，长和宽的单位为像素个数， **CSS**确定显示画布的大小。 **你应该通过CSS设置画布的大小**，因为它比其他方法灵活得多。

为了让画布大小匹配显示区域的大小，我通常使用这个[帮助函数](webgl-resizing-the-canvas.html))。

在我们的例子中，如果程序运行在自己独立的窗口中，画布大小被固定设置为400x300；如果作为iframe嵌在页面在，画布会尽量扩展到可用的空间。

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

通过设置`gl_Position`, 我们需要告诉WebGL如何从剪辑空间转换值转换到屏幕空间。 为此，我们调用`gl.viewport`并将其传递给画布的当前大小。

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

这行代码告诉WebGL将裁剪空间的-1~+1映射到x轴0~`gl.canvas.width`和y轴0~`gl.canvas.height`。

我们设置画布的清空颜色为`0,0,0,0`(分别表示为红色，绿色，蓝色，透明度)。所以这个画布是透明的。

接下来我们需要告诉WebGL运行着色器程序。

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

然后我们需要告诉它用哪个缓冲区和如何从缓冲区取出数据给到属性。

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

最后，我们告诉WebGL运行我们的GLSL程序。

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

由于counter被设置为3, 顶点着色器就会运行3次；第一次运行顶点着色器中的属性`a_position.x` 和 `a_position.y`的值是positionBuffer的头两个值；第二次是紧接着的两个值。

由于我们设置`primitiveType`的值为`gl.TRIANGLES`, 顶点着色器将会基于`a_position`设置的3对值画三角形。不管画布多大，这些值在裁剪空间坐标的范围是-1到1。

由于顶点着色器只是简单地从positionBuffer中拷贝值到`gl_position`, 最终画出的三角形也会在裁剪空间区域。

      0, 0,
      0, 0.5,
      0.7, 0,

如果画布大小恰好是400X300, 裁剪空间坐标转换成屏幕坐标如下所示：

     clip space      screen space
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL会用这三个顶点画出三角形。对于每个像素，WebGL调用片段着色器。片段着色器设置`outColor`为`1, 0, 0.5, 1`，加上画布上每个channel为8bit，WebGL把颜色值`[255, 0, 127, 255]`的像素写到画布。

请看下面的例子：

{{{example url="../webgl-fundamentals.html" }}}

从上面例子看出，顶点着色器只是简单地传数据。因为位置数据都在裁剪空间中，所以没有多余个事情做。*如果您想显示3D图形，则由您决定提供从3D转换为裁剪空间的着色器，因为WebGL只是一个光栅化API*

你可能想知道为什么三角形从中间开始，向右上方移动。因为裁剪空间的x轴从-1到+1. 则意味着0在中间，整数则是右边。

至于为什么在上面，因为-1时最下面，+1在顶部，也就是说0在中间，正数在中间上面。

对于2D，你可能更喜欢使用像素而不是裁剪空间坐标。下面我们提供给顶点着色器以像素形式的位置，着色器负责转换成裁剪空间坐标。

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // convert the position from pixels to 0.0 to 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // convert from 0->1 to 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // convert from 0->2 to -1->+1 (clip space)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

注意上面 `a_position`的数据类型是`vec2`，因为我们仅仅使用`x`和`y`两个坐标。接下来我们添加了一个叫`u_resolution`的`uniform`。相应地我们需要查找它的位置：

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

剩下的部分从注释中很容易看出来。通过设置`u_resolution`为画布的显示精度，着色器会把`positionBuffer`上的位置数据以像素坐标对待，并转换到裁剪坐标空间。

现在位置坐标的值从裁剪坐标变成像素坐标。这次我们来画一个两个三角形组成的长方形，每个三角形有3个点。

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

接下来，我们通过函数`gl.useProgram`设置使用的程序，以及通过`gl.uniformXXX`设置uniform的值。 
  
    gl.useProgram(program);

    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

我们画两个三角形，所有需要调用顶点着色器6次，即设置`count`为`6`。

    // draw
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

显示结果如下。

注意: 本页面中所有的例子都用到了 [`webgl-utils.js`](/webgl/resources/webgl-utils.js)， 它包含编译和链接着色器的函数。 No reason to clutter the examples with that [boilerplate](webgl-boilerplate.html) code.

{{{example url="../webgl-2d-rectangle.html" }}}

你可能注意到这个长方形靠近区域的下面部分。因为WebG把+Y轴当作向上，-Y当作向下。在裁剪空间中，左下角为-1, -1。我们没有改变任何符号，所以当前坐标原点就在左下角。为像原点在左上角的传统坐标空间一样，我们可以反转y坐标轴，如下：

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

现在长方形的显示位置就跟我们期望的一样了。

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

为了能够生成不同大小的正方形，我们把上面的画正方形的代码封装成了一个函数。

为了使得颜色值可以动态设置，，我们在片段着色器中声明了一个表示颜色的uniform输入变量。

    #version 300 es

    precision highp float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

下面代码在随机选择位置和颜色画了50个正方形。

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fills the buffer with the values that define a rectangle.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
      // whatever buffer is bound to the `ARRAY_BUFFER` bind point
      // but so far we only have one buffer. If we had more than one
      // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

显示如下：

{{{example url="../webgl-2d-rectangles.html" }}}

我希望你能看到WebGL实际上是很简单的API.简单的意思是，它仅仅运行两个函数(顶点着色器和片段着色器)来画三角形，线段和点。
然而3D绘制可以变得非常地复杂，这复杂性是由程序员来设计复杂着色器来实现的。 WebGL API仅仅是一个简单的栅格化工具(rasterizer)。

上面例子中，我们讲到了如何使用一个属性和两个uniforms来提供数据给GPU。 通常情况下会由更多的属性和uniforms。 关于文章开头提到的*varyings*和*纹理*（textures）。后面的课程将会陆续讲到。

在你继续阅读之前，通过更新缓冲区来更新数据的方式如`setRectangle`，在大多数应用中并不是很常见。我用这种方式是因为它很方便演示像素值作为输入，同时在GLSL中仅需要少量的数学计算。[后面课程中你会找到更加通用的方法来定位，定向和按比例缩放](webgl-2d-translation.html)。

如果对WebGL一无所知，对GLSL, 着色器，GPU在头脑中没有任何概念，你先阅读[WebGL运行的基本原理](webgl-how-it-works.html)。 
你也可能你想了解下[交互式的状态转换图](/webgl/lessons/resources/webgl-state-diagram.html)， 它从另外一种视角来理解WebGL的工作原理。

你应该简要地阅读下例子中用到的的[模板代码](webgl-boilerplate.html)。
同时，你还应该快速阅读下[如何绘制多个物体](webgl-drawing-multiple-things.html)， 它会告诉你一个经典WebGL apps的项目结构是怎么的。因为在我们例子中只画一个物体，所有没有展示出这个结构。

此外有两个方法: 对图像处理感兴趣的话，请看 [如何做2D图片处理](webgl-image-processing.html)； 对图形变换，翻转，和缩放感兴趣，请从[这里开始](webgl-2d-translation.html).


