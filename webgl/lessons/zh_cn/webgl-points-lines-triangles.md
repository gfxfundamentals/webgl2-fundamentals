Title: WebGL2 点、线段与三角形
Description: WebGL2 中点、线段与三角形的绘制详解
TOC: Points, Lines, and Triangles

这个网站的大部分内容都是用三角形来绘制所有图形的。可以说，这是 99% 的 WebGL 程序的常规做法。不过，为了内容的完整性，我们再来讨论一些其他情况。

正如[第一篇文章](webgl-fundamentals.html)所述，WebGL 能够绘制点、线段和三角形。
当我们调用`gl.drawArrays`或`gl.drawElements`方法时就会执行这种绘制操作。
我们提供的顶点着色器会输出裁剪空间坐标，然后 WebGL 会根据`gl.drawArrays`或`gl.drawElements`的第一个参数来决定是绘制点、线段还是三角形。

`gl.drawArrays`和`gl.drawElements`方法的第一个参数有效取值包括：

* `点 POINTS`

  对于顶点着色器输出的每个裁剪空间顶点，WebGL会以该点为中心绘制一个正方形。正方形的大小通过在顶点着色器中设置特殊变量`gl_PointSize`来指定，其数值表示该正方形的像素尺寸。

    注意：正方形（纹理/渲染缓冲）的最大（及最小）尺寸取决于具体实现，您可以通过以下方式查询：

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

    另请参阅[此处](webgl-drawing-without-data.html#pointsissues)的另一个问题。

* `线 LINES`

  对于顶点着色器输出的每2个裁剪空间顶点，将绘制一条连接这2个点的线段。如果存在点A、B、C、D、E、F，则会生成3条线。

   <div class="webgl_center"><img src="resources/gl-lines.svg" style="width: 400px;"></div>

  规范说明可通过调用`gl.lineWidth`并指定像素值来设置线宽， 但实际上最大线宽取决于具体实现，且绝大多数设备仅支持1像素的最大线宽。

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

   > 这主要是因为大于1像素的线宽值在核心版桌面OpenGL中已被弃用。

* `折线 LINE_STRIP`

  对于顶点着色器输出的每个裁剪空间顶点，将从该顶点到前一个顶点绘制一条线段。

  因此，如果顶点着色器依次输出裁剪空间顶点 A、B、C、D、E、F，使用 LINE_STRIP 模式将会生成 5 条连接的线段。

   <div class="webgl_center"><img src="resources/gl-line-strip.svg" style="width: 400px;"></div>

* `闭合折线 LINE_LOOP`

  `LINE_LOOP`的绘制逻辑与`LINE_STRIP`相同，但会额外增加一条从末尾顶点返回到起始顶点的线段，形成闭合轮廓。

   <div class="webgl_center"><img src="resources/gl-line-loop.svg" style="width: 400px;"></div>

* `三角形 TRIANGLES`

  对于顶点着色器输出的每3个裁剪空间顶点，系统将绘制一个由这3个点构成的三角形。这是最常用的图元渲染模式。

   <div class="webgl_center"><img src="resources/gl-triangles.svg" style="width: 400px;"></div>

* `三角形带 TRIANGLE_STRIP`

  对于顶点着色器输出的每个裁剪空间顶点，系统将基于最后3个顶点绘制一个三角形。具体而言：
  若输出6个顶点A、B、C、D、E、F，则会依次绘制以下4个三角形： 
  * △ABC（由前3个顶点构成） 
  * △BCD（复用B、C，新增D） 
  * △CDE（复用C、D，新增E） 
  * △DEF（复用D、E，新增F）

       <div class="webgl_center"><img src="resources/gl-triangle-strip.svg" style="width: 400px;"></div>

* `三角形扇区 TRIANGLE_FAN`

  对于顶点着色器输出的每个裁剪空间顶点，系统将使用第一个顶点和最后两个顶点绘制三角形。具体而言：
  若输出6个顶点A、B、C、D、E、F，则会依次生成以下4个三角形：

  * △ABC（首个三角形：顶点A+B+C） 
  * △ACD（固定A，复用C，新增D） 
  * △ADE（固定A，复用D，新增E） 
  * △AEF（固定A，复用E，新增F）

   <div class="webgl_center"><img src="resources/gl-triangle-fan.svg" style="width: 400px;" align="center"></div>

尽管可能有人持不同意见，但根据我的实际开发经验，最好避免使用`TRIANGLE_FAN（三角扇）`和`TRIANGLE_STRIP（三角带）`。
它们仅适用于少数特殊场景，而为这些例外情况编写额外的处理代码，其代价往往超过了直接统一使用`TRIANGLES（独立三角形）`模式的收益。
尤其是当你需要处理顶点数据的法线生成、纹理坐标计算或其他复杂操作时，统一使用 TRIANGLES（独立三角形）模式能让所有工具函数直接兼容，无需针对特殊模式适配。
特别地，当您需要构建法线（normals）、生成纹理坐标（texture coordinates）或执行其他顶点数据处理操作时，严格采用 `TRIANGLES（三角形）`模式可确保所有功能函数无需适配即可正常运行。

一旦引入 `TRIANGLE_FAN（三角扇）`和 `TRIANGLE_STRIP（三角带）`模式，就必须编写更多分支函数来处理额外情况。
当然，你完全可以持不同意见并自主选择方案。此处仅陈述个人经验，以及我咨询过的多位3A级游戏开发者的共同实践认知。

同样的，`LINE_LOOP（线环）`和`LINE_STRIP（线带）`模式也不实用，也存在类似问题。
与`TRIANGLE_FAN`和`TRIANGLE_STRIP`相同，它们的适用场景极为罕见。
例如，您可能认为需要绘制由4个点组成的4条连续线段（注：此处指误用场景，实际应使用 LINES 模式）。

<div class="webgl_center"><img src="resources/4-lines-4-points.svg" style="width: 400px;" align="center"></div>

如果使用`LINE_STRIP`，需要调用4次`gl.drawArrays`，并且要为每条线设置属性而进行更多调用。而如果直接使用`LINES`，就可以通过单次`gl.drawArrays`调用插入绘制全部4组线所需的所有点。
这样会快得多。

此外，`LINES（线段）`模式虽然适用于调试或简单效果，但由于大多数平台上限宽仅为1像素，它往往并非最佳选择。如需绘制图表网格或3D建模程序中的多边形轮廓，使用`LINES`可能很合适。
但若要绘制SVG或Adobe Illustrator等结构化图形，则必须改用其他渲染方式（[通常基于三角形绘制线条](https://mattdesl.svbtle.com/drawing-lines-is-hard)）。


