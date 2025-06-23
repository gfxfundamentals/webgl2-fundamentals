Title: WebGL2中的矩阵vs数学中的矩阵
Description: WebGL约定与数学约定之间的差异。
TOC: WebGL2中的矩阵vs数学中的矩阵


这篇文章是对若干讨论矩阵的文章的补充说明，尤其包括：[介绍矩阵的文章](webgl-2d-matrices.html)，
以及 [介绍3D的文章](webgl-3d-orthographic.html)、[透视投影的文章](webgl-3d-perspective.html) 和 [摄像机相关的文章](webgl-3d-camera.html)。

在编程中，通常“行”是从左到右的，“列”是从上到下的。

> ## col·umn
> /ˈkäləm/
>
> *名词*
> 1. 一个直立的柱子，通常是圆柱形，由石头或混凝土制成，用于支撑檐部、拱门或其他结构，或作为独立的纪念碑而存在。
>
>    *同义词*: 柱子、柱杆、杆、立柱、垂直物体、...
>
> 2. 一页或一段文字的垂直分栏。

> ## row
> /rō/
>
> *名词*
> * 表格中一行水平排列的条目。

我们可以在各种软件中看到这些术语的使用。例如，我使用的文本编辑器中显示了“行（Lines）”和“列（columns）”，
在这种情况下，“行”就是“row”的另一种说法，因为“column”这个词已经被用于表示垂直方向了。

<div class="webgl_center"><img src="resources/editor-lines-and-columns.gif" class="gman-border-bshadow" style="width: 372px;"></div>

请注意左下角区域，状态栏中显示了当前的行（line）和列（column）。

在电子表格软件中，我们可以看到行是横向排列的。

<div class="webgl_center"><img src="resources/spreadsheet-row.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

而列是纵向排列的。

<div class="webgl_center"><img src="resources/spreadsheet-column.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

因此，当我们在 JavaScript 中为 WebGL 创建一个 3x3 或 4x4 的矩阵时，我们这样写：

```js
const m3x3 = [
  0, 1, 2,  // row 0
  3, 4, 5,  // row 1
  6, 7, 8,  // row 2
];

const m4x4 = [
   0,  1,  2,  3,  // row 0 
   4,  5,  6,  7,  // row 1
   8,  9, 10, 11,  // row 2
  12, 13, 14, 15,  // row 3
];
```

根据上述惯例，`3x3`矩阵的第一行是 `0, 1, 2`，而 `4x4` 矩阵的最后一行是 `12, 13, 14, 15`。

正如我们在[矩阵](webgl-2d-matrices.html)中看到的，要制作一个相当标准的 WebGL 3x3 二维平移矩阵，平移值 `tx` 和 `ty` 位于位置 6 和 7。


```js
const some3x3TranslationMatrix = [
   1,  0,  0,
   0,  1,  0,
  tx, ty,  1,
];
```

或者在[3D基础](webgl-3d-orthographic.html)中介绍的 4x4 矩阵中，平移值（tx, ty, tz）位于第 12、13、14 的位置。

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

但这里有一个问题：数学中的矩阵运算通常按列优先（column-major）的惯例来书写。数学家会这样表示一个 3x3 的平移矩阵：

<div class="webgl_center"><img src="resources/3x3-math-translation-matrix.svg" style="width: 120px;"></div>

以及一个 4x4 的平移矩阵如下：

<div class="webgl_center"><img src="resources/4x4-math-translation-matrix.svg" style="width: 150px;"></div>

这样就留下了一个问题。如果我们想让矩阵看起来像数学中的矩阵，
我们可能尝试这样写 4x4 的矩阵：

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  tx,
   0,  1,  0,  ty,
   0,  0,  1,  tx,
   0,  0,  0,  1,
];
```

不幸的是，这样做会有问题。正如[摄像机一文](webgl-3d-camera.html)中提到的，
4x4 矩阵的每一列通常都有特定含义。

第一、第二和第三列通常分别表示 x、y 和 z 轴，而最后一列表示位置或平移。

问题是，在代码中单独获取这些部分会很麻烦。
想要获取 Z 轴？你得这样写：


```js
const zAxis = [
  some4x4Matrix[2],
  some4x4Matrix[6],
  some4x4Matrix[10],
];
```

唉！

WebGL（以及它所基于的OpenGL ES）的解决方案居然是——把‘行’硬说成‘列’。

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,   // this is column 0
   0,  1,  0,  0,   // this is column 1
   0,  0,  1,  0,   // this is column 2
  tx, ty, tz,  1,   // this is column 3
];
```

现在它就符合数学定义了。对比上面的例子，如果我们想要获取 Z 轴，只需要做：

```js
const zAxis = some4x4Matrix.slice(8, 11);
```

对于熟悉 C++ 的人来说，OpenGL 本身要求一个 4x4 矩阵的 16 个值在内存中是连续的，因此在 C++ 中我们可以创建一个 `Vec4` 结构体或类：

```c++
// C++
struct Vec4 {
  float x;
  float y;
  float z;
  float w;
};
```

然后我们可以用这四个 `Vec4` 来创建一个 4x4 矩阵：

```c++
// C++
struct Mat4x4 {
  Vec4 x_axis;
  Vec4 y_axis;
  Vec4 z_axis;
  Vec4 translation;
}
```

或者直接写成

```c++
// C++
struct Mat4x4 {
  Vec4 column[4];
}
```

看似这样就能正常工作。

但遗憾的是，当你在代码中真正静态声明一个矩阵时，它的形式与数学中的矩阵表示法相去甚远。

```C++
// C++
Mat4x4 someTranslationMatrix = {
  {  1,  0,  0,  0, },
  {  0,  1,  0,  0, },
  {  0,  0,  1,  0, },
  { tx, ty, tz,  1, },
};
```

回到 JavaScript 环境（我们通常没有类似 C++ 结构体的数据结构），情况就有所不同。

```js
const someTranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

因此，采用将“行”称为“列”的这种约定，有些事情会变得更简单，但如果你是数学背景的人，可能会觉得更困惑。

我提到这些是因为这些文章是从程序员的视角写的，而不是数学家的视角。这意味着就像其他被当作二维数组使用的一维数组一样，行是横向排列的。


```js
const someTranslationMatrix = [
   1,  0,  0,  0,  // row 0
   0,  1,  0,  0,  // row 1
   0,  0,  1,  0,  // row 2
  tx, ty, tz,  1,  // row 3
];
```

就像

```js
// happy face image
const dataFor7x8OneChannelImage = [
    0, 255, 255, 255, 255, 255,   0,  // row 0
  255,   0,   0,   0,   0,   0, 255,  // row 1
  255,   0, 255,   0, 255,   0, 255,  // row 2
  255,   0,   0,   0,   0,   0, 255,  // row 3
  255,   0, 255,   0, 255,   0, 255,  // row 4
  255,   0, 255, 255, 255,   0, 255,  // row 5
  255,   0,   0,   0,   0,   0, 255,  // row 6
    0, 255, 255, 255, 255, 255,   0,  // row 7
]
```

所以这些文章会把它们称作“行”。

如果你是数学专业出身，可能会觉得有些困惑。很抱歉，我没有更好的解决方案。我本可以把明显的第3行称作“列”，但那样也会让人迷惑，因为这不符合其他编程语言的习惯。

无论如何，希望这些解释能帮助你理解为什么文中的说明看起来不像数学书里的内容，而更像代码，且遵循了编程中的惯例。希望这能帮助你搞清楚其中的原理，也不会让习惯数学规范的人觉得太难理解。
