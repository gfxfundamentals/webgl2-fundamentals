Title: WebGL2 实现 DrawImage 接口
Description: 如何用 WebGL 实现画布的二维接口 drawImage
TOC: 二维 DrawImage

此文上接[WebGL 三维正射投影](webgl-3d-orthographic.html)，
如果没读建议从[那里开始](webgl-3d-orthographic.html)，
你也应了解纹理和纹理坐标，如果不清楚可以看看[WebGL 三维纹理](webgl-3d-textures.html)。

实现大多数二维游戏只需要一个方法去绘制一个图像，当然也有一些二维游戏用线等技术做一些有趣的东西，
但是如果你有绘制二维图像的方法，基本上可以做大多数二维游戏。

画布有一个非常灵活的二维接口叫做 `drawImage`，用于绘制图像。
它有三个版本

    ctx.drawImage(image, dstX, dstY);
    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

用你现在学到的所有东西如何使用 WebGL 实现这个接口？你想到的办法可能是创建一些顶点，
像本站第一篇文章那样。将顶点传送到 GPU 是一个比较耗时的操作（尽管某些情况下比较快）。

这就是 WebGL 发挥作用的地方，讲究富有创造性地编写着色器和使用它们去解决问题。

让我们从第一个版本开始

    ctx.drawImage(image, x, y);

它可以在 `x, y` 位置处绘制一个原始大小的图像，为了实现相似的功能，
WebGL 需要上传`x, y`, `x + width, y`, `x, y + height`, 和
`x + width, y + height` 对应的顶点，当绘制不同的图像或不同的位置时就创建不同的顶点集合。

一个更常用的方式是只使用一个单位矩形，我们上传一个长度为 1 个单位的正方形，
然后使用[矩阵运算](webgl-2d-matrices.html)缩放和平移单位矩形，
以达到期望的大小和位置。

这是代码。

首先需要一个简单的顶点着色器

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = a_texcoord;
    }

和一个简单的片断着色器

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       outColor = texture(texture, v_texcoord);
    }

然后轮到方法

    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
      gl.useProgram(program);

      // 为矩形设置属性
      gl.bindVertexArray(vao);

      var textureUnit = 0;
      // 将纹理放在纹理单元 0 上
      gl.uniform1i(textureLocation, textureUnit);

      // 将纹理绑定到纹理单元 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // 从像素空间转换到裁剪空间
      var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

      // 平移到 dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // 将单位矩形的宽和高缩放 texWidth, texHeight 个单位长度
      matrix = m4.scale(matrix, texWidth, texHeight, 1);

      // 设置矩阵
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // 绘制矩形 (2 个三角形, 6 个顶点)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

我们来加载一些图像用于纹理

    // 创建一个纹理信息 { width: w, height: h, texture: tex }
    // 纹理起初为 1x1 像素，当图像加载完成后更新大小
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var textureInfo = {
        width: 1,   // 图像加载前不知道大小
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      });

      return textureInfo;
    }

    var textureInfos = [
      loadImageAndCreateTextureInfo('resources/star.jpg'),
      loadImageAndCreateTextureInfo('resources/leaves.jpg'),
      loadImageAndCreateTextureInfo('resources/keyboard.jpg'),
    ];

绘制到随机位置

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var ii = 0; ii < numToDraw; ++ii) {
      var drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      };
      drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
      drawInfos.forEach(function(drawInfo) {
        drawInfo.x += drawInfo.dx * speed * deltaTime;
        drawInfo.y += drawInfo.dy * speed * deltaTime;
        if (drawInfo.x < 0) {
          drawInfo.dx = 1;
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1;
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1;
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1;
        }
      });
    }

    function draw() {
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);

      // 告诉 WebGL 如何从裁剪空间转换到像素空间
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // 清空画布
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      drawInfos.forEach(function(drawInfo) {
        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          drawInfo.x,
          drawInfo.y);
      });
    }

    var then = 0;
    function render(time) {
      var now = time * 0.001;
      var deltaTime = Math.min(0.1, now - then);
      then = now;

      update(deltaTime);
      draw();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

可以在这里看到运行结果

{{{example url="../webgl-2d-drawimage-01.html" }}}

处理 `drawImage` 方法的第二个版本

    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);

没什么特别的地方，只是用 `dstWidth` 和 `dstHeight` 代替了
`texWidth` 和 `texHeight`。

    *function drawImage(tex, texWidth, texHeight, dstX, dstY, dstWidth, dstHeight) {
    +  if (dstWidth === undefined) {
    +    dstWidth = texWidth;
    +  }
    +
    +  if (dstHeight === undefined) {
    +    dstHeight = texHeight;
    +  }

      gl.useProgram(program);

      // 为矩形设置属性
      gl.bindVertexArray(vao);

      var textureUnit = 0;
      // 将纹理放在纹理单元 0 上
      gl.uniform1i(textureLocation, textureUnit);

      // 将纹理绑定到纹理单元 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // 从像素空间转换到裁剪空间
      var matrix = m4.orthographic(0, canvas.width, canvas.height, 0, -1, 1);

      // 将矩形平移到 dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

    *  // 单位矩形的宽和高缩放 dstWidth, dstHeight 个单位长度
    *  matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // 设置矩阵
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // 绘制矩形 (2 个三角形, 6 个顶点)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

我将代码修改为使用不同的大小

{{{example url="../webgl-2d-drawimage-02.html" }}}

这很简单，但是 `drawImage` 的第三个版本呢？

    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);t

为了实现选择部分纹理，就需要操控纹理坐标。纹理坐标的工作原理在
[这篇文章](webgl-3d-textures.html)中讲到，在那篇文章中我们手工创建纹理坐标，
是一个非常常见的方式，但是我们也可以在运行时创建，然后使用矩阵简单的修改纹理坐标。

让我们给顶点着色器添加一个纹理坐标矩阵，
然后将纹理坐标和矩阵相乘。

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;
    +uniform mat4 u_textureMatrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
    *   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

现在我们要找到纹理矩阵的位置

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    +var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");

在 `drawImage` 方法中需要设置它，用于选择我们需要的部分。
我们知道纹理坐标是一个单位矩形所以可以简单的修改，就像对位置的处理一样。

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    srcX, srcY, srcWidth, srcHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstX === undefined) {
    +    dstX = srcX;
    +    srcX = 0;
    +  }
    +  if (dstY === undefined) {
    +    dstY = srcY;
    +    srcY = 0;
    +  }
    +  if (srcWidth === undefined) {
    +    srcWidth = texWidth;
    +  }
    +  if (srcHeight === undefined) {
    +    srcHeight = texHeight;
    +  }
      if (dstWidth === undefined) {
    *    dstWidth = srcWidth;
    +    srcWidth = texWidth;
      }
      if (dstHeight === undefined) {
    *    dstHeight = srcHeight;
    +    srcHeight = texHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      // 从像素空间转换到裁剪空间
      var matrix = m4.orthographic(
          0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

      // 平移到 dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // 单位矩形的宽和高缩放 dstWidth, dstHeight 个单位长度
      matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // 设置矩阵
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

    +  // 因为纹理坐标的范围是 0 到 1
    +  // 并且我们的纹理坐标是一个单位矩形
    +  // 我们可以选择一部分纹理平移缩放
    +  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    +  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
    +
    +  // 设置纹理矩阵
    +  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

      // 绘制矩形 (2 个三角形, 6 个顶点)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

我也上传了这个版本的例子，这是结果

{{{example url="../webgl-2d-drawimage-03.html" }}}

不同于画布的二维接口，WebGL 对 `drawImage` 的情况做了更多的处理。

一个是我们可以给源或者目标宽高传递负值，负的 `srcWidth` 会选择 `srcX`
左边的像素，负的 `dstWidth` 会将图像绘制在 `dstX` 的左边，
在画布的二维接口中报错是好一点的情况，坏一点时会出现 udefined。

{{{example url="../webgl-2d-drawimage-04.html" }}}

另一个是我们使用矩阵就可以实现[任何矩阵运算可以实现的效果](webgl-2d-matrices.html)。

例如绕纹理中心旋转纹理坐标。

修改纹理坐标的矩阵代码

    *  // 像二维投影矩阵那样将坐标从纹理空间转换到像素空间
    *  var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);
    *
    *  // 选择一个旋转中心
    *  // 移动到中心旋转后在回来
    *  var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
    *  var texMatrix = m4.zRotate(texMatrix, srcRotation);
    *  var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);
    *
    *  // 因为在像素空间，缩放和平移现在是按像素单位
    *  var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    *  var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

      // 设置纹理矩阵
      gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

这是结果

{{{example url="../webgl-2d-drawimage-05.html" }}}

可以看出一个问题，在旋转的过程中会看到超出边缘的纹理，由于设置的是 `CLAMP_TO_EDGE` 所以得到重复的边缘。

我们可以在着色器中丢弃超出 0 到 1 范围的纹理，`discard` 将会立即退出着色器，不写入像素。

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
    +   if (v_texcoord.x < 0.0 ||
    +       v_texcoord.y < 0.0 ||
    +       v_texcoord.x > 1.0 ||
    +       v_texcoord.y > 1.0) {
    +     discard;
    +   }
       outColor = texture(texture, v_texcoord);
    }

现在边缘消失了

{{{example url="../webgl-2d-drawimage-06.html" }}}

或者你想的话也可以对超出的部分使用纯色

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       if (v_texcoord.x < 0.0 ||
           v_texcoord.y < 0.0 ||
           v_texcoord.x > 1.0 ||
           v_texcoord.y > 1.0) {
    *     outColor = vec4(0, 0, 1, 1); // 蓝色
    +     return;
       }
       outColor = texture(texture, v_texcoord);
    }

{{{example url="../webgl-2d-drawimage-07.html" }}}

快学到极限了？不存在的，一切都取决于你对于着色器的使用创意。

接下来讲[实现画布二维接口中的矩阵栈](webgl-2d-matrix-stack.html)。

<div class="webgl_bottombar">
<h3>一个小优化</h3>
<p>我并不是要建议使用这个优化，而是想提出更多创意性的想法，因为使用WebGL
就是利用它提供的特性去做创意。
</p>
<p>你可能会注意到我们使用的位置单位矩形和纹理坐标刚好匹配，所以我们就可以使用位置作为纹理坐标。</p>
<pre class="prettyprint showlinemods">
#version 300 es
in vec4 a_position;
-in vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;

void main() {
gl_Position = u_matrix \* a_position;

-   v_texcoord = (u_textureMatrix \* a_position).xy;
}
</pre>
<p>现在移除关于纹理坐标设置的代码，得到的结果和之前是相同的。</p>
{{{example url="../webgl-2d-drawimage-08.html" }}}
</div>
