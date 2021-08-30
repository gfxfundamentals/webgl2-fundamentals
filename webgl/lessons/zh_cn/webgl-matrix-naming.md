Title: WebGL2 矩阵命名
Description: 矩阵的通用命名
TOC: WebGL2 三维矩阵命名

这篇文章是 WebGL2 系列文章的延续。从[基础概念](webgl-fundamentals.html)开始，上篇是关于[三维相机](webgl-3d-camera.html)的文章。

整个网站都指出几乎所有关于 WebGL 的 100%的内容是由你决定的。除了一些预定义的名称像`gl_Position`，几乎所有关于 WebGL 的东西是由程序员定义的。

有一些通用的或者半通用的命名约定。尤其与矩阵相关时。我不知道谁率先使用了这些名称。我想我是从[NVidia 的标准注释和语义](https://www.nvidia.com/object/using_sas.html)学到的。这更加正式，通过确定的命名，尝试让着色器在更多的情况下工作。有点过时，但基本部分仍然奏效。

这是我想到的列表

-   世界矩阵 world matrix (或者有时被成为模型矩阵 model matrix)

    转换模型顶点到世界空间的矩阵

-   相机矩阵 camera matrix

    代表相机在世界空间中位置的矩阵。另一种说法是相机的*世界矩阵*。

-   视图矩阵 view matrix

    把世界空间中所有东西移到相机前。这是*相机矩阵*的逆。

-   投影矩阵 projection matrix

    矩阵转换视锥体空间到裁剪空间或者一些正交空间到裁剪空间。 另一种说法是你的矩阵数学库透视函数`perspective`和正交函数`ortho`或者
    `orthographic`返回的矩阵。

-   本地矩阵 local matrix

    当使用[场景图](webgl-scene-graph.html)时，本地矩阵是是某一节点和其他节点相乘之前的矩阵。

如果着色器需要矩阵的组合，它们通常从右向左列出，即使着色器中它们是乘在*右边的*。例如：

    worldViewProjection = projection * view * world

另外两个对于矩阵常见的操作是求逆

    viewMatrix = inverse(cameraMatrix)

和转置

    worldInverseTranpose = transpose(inverse(world))

希望了解这些术语，在你看其他人的着色器代码时，如果你很幸运他们使用接近或类似的名字时，你可以理解实际上在做什么。

现在，让我们接着学习[动画](webgl-animation.html).
