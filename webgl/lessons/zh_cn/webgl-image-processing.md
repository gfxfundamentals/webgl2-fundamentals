Title: WebGL2 图像处理
Description: 如何使用 WebGL 处理图像的
TOC: 图像处理

WebGL 处理图像是一件很容易的事情。多简单呢？ 请看下文。

文本延续了[WebGL2 基本原理](webgl-fundamentals.html)。如果你没读过它，
建议您先[跳到这里](webgl-fundamentals.html)阅读。

要在 WebGL 中绘制图像，我们需要使用纹理。与 WebGL 渲染时使用裁剪空间坐标的方式类似，
WebGL 在读取纹理时通常需要纹理坐标。无论纹理的尺寸如何，纹理坐标都从 0.0 到 1.0。

WebGL2 还增加了使用像素坐标读取纹理的功能。哪种方法取决于您。个人人觉得使用纹理坐标比使用像素坐标更方便。

如果只绘制一个矩形(两个三角形), 我们需要告诉 WebGL 纹理中每个点在矩形中的对应位置。
我们使用一种特殊的变量“varyings”，将位置信息从点着色器传递给片段着色器。
之所以称为"varyings"，因为它的值可以变化的。 当 WebGL 使用片段着色器绘制每个像素时，
它会对我们在点着色器中提供的值进行[插值](webgl-how-it-works.html)。


借用[上一篇文章](webgl-fundamentals.html)结尾用到的点着色器，
我们需要添加一个属性以传递纹理坐标，然后将其传递给片段着色器。

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // pass the texCoord to the fragment shader
    +   // The GPU will interpolate this value between points
    +   v_texCoord = a_texCoord;
    }

然后，我们从纹理中查找颜色来供给片段着色器使用。

    #version 300 es
    precision highp float;

    // our texture
    uniform sampler2D u_image;

    // the texCoords passed in from the vertex shader.
    in vec2 v_texCoord;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
       // Look up a color from the texture.
       outColor = texture(u_image, v_texCoord);
    }

最后，我们需要加载图像，创建纹理并将图像复制到纹理中。 因为在
浏览器中图像是异步加载的，因此我们必须重新编排代码以等待纹理图片加载结束。 
一旦加载完后，我们将绘制它。

    +function main() {
    +  var image = new Image();
    +  image.src = "https://someimage/on/our/server";  // MUST BE SAME DOMAIN!!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // look up where the vertex data needs to go.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // lookup uniforms
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // provide texture coordinates for the rectangle.
    +  var texCoordBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    +      0.0,  0.0,
    +      1.0,  0.0,
    +      0.0,  1.0,
    +      0.0,  1.0,
    +      1.0,  0.0,
    +      1.0,  1.0]), gl.STATIC_DRAW);
    +  gl.enableVertexAttribArray(texCoordAttributeLocation);
    +  var size = 2;          // 2 components per iteration
    +  var type = gl.FLOAT;   // the data is 32bit floats
    +  var normalize = false; // don't normalize the data
    +  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    +  var offset = 0;        // start at the beginning of the buffer
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // Create a texture.
    +  var texture = gl.createTexture();
    +
    +  // make unit 0 the active texture uint
    +  // (ie, the unit all other texture commands will affect
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // Bind it to texture unit 0' 2D bind point
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // Set the parameters so we don't need mips and so we're not filtering
    +  // and we don't repeat
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // Upload the image into the texture.
    +  var mipLevel = 0;               // the largest mip
    +  var internalFormat = gl.RGBA;   // format we want in the texture
    +  var srcFormat = gl.RGBA;        // format of data we are supplying
    +  var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      // Pass in the canvas resolution so we can convert from
      // pixels to clip space in the shader
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // Tell the shader to get the texture from texture unit 0
    +  gl.uniform1i(imageLocation, 0);

    +  // Bind the position buffer so gl.bufferData that will be called
    +  // in setRectangle puts data in the position buffer
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // Set a rectangle the same size as the image.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

下面就是用WebGL渲染的图片了。

{{{example url="../webgl-2d-image.html" }}}

这并不让人感到新奇，因此我们图片做一些处理。交换颜色红色和蓝色部分，看看什么效果？

    ...
    outColor = texture(u_image, v_texCoord).bgra;
    ...

现在，红色和蓝色部分交换了。

{{{example url="../webgl-2d-image-red2blue.html" }}}

如果我们处理图像时要用到周围的其他像素，该怎么办呢？WebGL是在0.0到1.0的纹理坐标中引用纹理，
首先我们需要计算1个像素的宽度：onePixel = 1.0 / textureSize.

下面的片段着色器平均左右两边纹理中的像素值。

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
+  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
+
+  // average the left, middle, and right pixels.
+  outColor = (
+      texture(u_image, v_texCoord) +
+      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
+      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
```

你可以对比下上面没有做模糊处理的图片。

{{{example url="../webgl-2d-image-blend.html" }}}

知道如何引用其他像素后，我们用卷积核来做一些常见的图像处理操作。在这个例子中，我们将使用3X3的核。
卷积核只是一个3x3矩阵，其中矩阵中的每个条目代表将要渲染像素周围的8个像素乘的数量。 然后我们
将结果除以核权重（核中所有值的总和）或1.0，以较大者为准。 关于卷积核，请看[这篇文章](https://docs.gimp.org/2.6/en/plug-in-convmatrix.html)。
[另一篇文章](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx)用C++代码演示了卷积核的应用。

在我们例子里，我们将要在着色器中做卷积操作。下面是片段着色器。

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

// the convolution kernel data
uniform float u_kernel[9];
uniform float u_kernelWeight;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

  vec4 colorSum =
      texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
      texture(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
      texture(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
  outColor = vec4((colorSum / u_kernelWeight).rgb, 1);
}
```

在JavaScript中，我们需要提供卷积核和权重。

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];

    // set the kernel and it's weight
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

显示结果中，你可以使用下拉框选择不同的核。

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

我希望这篇文章传达给你的信息是：在WebGL中做图片处理相当简单。
接下的文章，我将介绍[如何对对象应用多个特效](webgl-image-processing-continued.html)。

<div class="webgl_bottombar">
<h3>纹理单元式什么？</h3>
当你调用方法 <code>gl.draw???</code>， 你的着色器就引用了纹理。纹理被绑定到纹理单元。
所有的WebGL2实现必须支持至少16个纹理单元(一般用户机器会支持更多)。
每个uniform采样器引用的纹理单元是是通过查找采样器的位置，然后设置你要引用的纹理单元索引。
例如：

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

为了设置纹理到不同的单元，你需要调用gl.activeTexture，然后绑定纹理到你相应的单元上去。如下：

<pre class="prettyprint showlinemods">
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

也可以这样：

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>a_, u_, and v_ 这些前缀在GLSL中什么意思？</h3>
<p>
仅仅是命名规范。这不是必要的，但是能够很容易从中看出这些值的来源。
a_是缓冲区提供数据的属性。u_是输入到着色器中的uniforms。
v_用于varyings，即从点着色器到片段着色器传递的值和在绘制每个像素的顶点之间进行插值的值。
请看 <a href="webgl-how-it-works.html">WebGL如何工作的</a> 获取更多信息.
</p>
</div>
