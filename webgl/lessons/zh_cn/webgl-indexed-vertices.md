Title: WebGL2 顶点索引
Description: 如何使用 gl.drawElements
TOC: 顶点索引 (gl.drawElements)

这篇文章假设你至少阅读了 [关于基础的文章](webgl-fundamentals.html)。
如果你没有读过，你应该从那里开始。

这是一篇短文，介绍 `gl.drawElements`。在 WebGL 中有两个基本的绘制函数。
`gl.drawArrays` 和 `gl.drawElements`。
这个网站的文章中，大部分是调用 `gl.drawArrays` 的。

`gl.drawElements` 需要一个填充了顶点索引的缓存，然后以此来绘制。

举个例子，我们根据 [第一篇文章](webgl-fundamentals.html) 来绘制一个矩形，但使用 `gl.drawElements`。

在那里的代码中，我们用两个三角形构建了一个矩形，每个三角形 3 个顶点，一共 6 个顶点。

这是提供 6 个顶点的代码：

```js
var x1 = x
var x2 = x + width
var y1 = y
var y2 = y + height
gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
        x1,
        y1, // 顶点 0
        x2,
        y1, // 顶点 1
        x1,
        y2, // 顶点 2
        x1,
        y2, // 顶点 3
        x2,
        y1, // 顶点 4
        x2,
        y2 // 顶点 5
    ]),
    gl.STATIC_DRAW
)
```

我们可以使用 4 个顶点来代替：

```js
var x1 = x
var x2 = x + width
var y1 = y
var y2 = y + height
gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
        x1,
        y1, // 顶点 0
        x2,
        y1, // 顶点 1
        x1,
        y2, // 顶点 2
        x2,
        y2 // 顶点 3
    ]),
    gl.STATIC_DRAW
)
```

但是，我们还需要添加一个存放索引的缓存。
因为 WebGL 必须要 6 个顶点来绘制两个三角形。

为了这么做，我们需要创建另一个缓存，但使用不同的绑定点。
我们使用 `ELEMENT_ARRAY_BUFFER` 而不是 `ARRAY_BUFFER`，它使用来存放索引的。

```js
// 创建缓存
const indexBuffer = gl.createBuffer()

// 将这个缓存设置为当前 `ELEMENT_ARRAY_BUFFER`
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

// 填充数据
const indices = [
    0,
    1,
    2, // 第一个三角形
    2,
    1,
    3 // 第二个三角形
]
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
```

像其它所有 WebGL 中的数据一样，我们需要指定索引的类型。
我们将用 `new Uint16Array(indices)` 将索引转换成无符号 16 位整型，然后传到缓存。

需要注意的是，与 `ARRAY_BUFFER` 绑定点不同是全局状态，`ELEMENT_ARRAY_BUFFER` 绑定点是当前顶点数组的一部分。

在代码中，我们创建并绑定了一个顶点数组，然后设置了索引缓冲区。 这意味着，就像属性一样，无论何时我们绑定这个顶点数组，索引缓冲区也将被绑定。 有关更多信息，请参阅 [关于属性的文章](webgl-attributes.html)。

在绘制时，我们调用 `drawElements`

```js
// 绘制矩形
var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 6;
-gl.drawArrays(primitiveType, offset, count);
+var indexType = gl.UNSIGNED_SHORT;
+gl.drawElements(primitiveType, count, indexType, offset);
```

我们得到了和之前一样的结果，但是只提供了 4 个顶点的数据，而不是 6 个。
尽管我们还是得告诉 WebGL 绘制 6 个顶点，但通过索引我们复用了 4 个顶点的数据。

{{{example url="../webgl-2d-rectangles-indexed.html"}}}

是否使用这样使用数据取决与你。

值得注意的是，顶点索引不用来绘制含 8 个顶点位置的立方体，
因为通常你会将其它数据关联到每个顶点上，取决与顶点被用的那个面，数据会不一样。
例如，你想给立方体的每个面不一样的颜色，你需要提供每个位置的颜色。
所以，尽管每个顶点被用了 3 次，每个面访问顶点时都需要重复位置信息，每个面关联的不同颜色。
这意味着你需要 24 个顶点来绘制立方体，每个面 4 个，36 个索引来绘制需要的 12 个三角形。

Valid types for `indexType` above are `gl.UNSIGNED_BYTE`
where you can only have indices from 0 to 255, in which case you'd use `new Uint8Array(indices)`,
`gl.UNSIGNED_SHORT` where the maximum index is 65535 which we used above,
and `gl.UNSIGNED_INT` which has a maximum index of 4294967296 and where you'd use
`new Uint32Array(indices)`.
上面的 `indexType` 的有效类型是`gl.UNSIGNED_BYTE`索引只能是 0 到 255 之间，在这种情况下，使用 `new Uint8Array(indices)`、`gl.UNSIGNED_SHORT`，最大索引为 65535，以及`gl.UNSIGNED_INT` 最大索引为 4294967296，也可以使用“new Uint32Array(indices)”。
