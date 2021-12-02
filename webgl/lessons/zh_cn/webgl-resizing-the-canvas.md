Title: WebGL2 重置画布尺寸
Description: 如何重置一个 WebGL 画布以及设计的问题
TOC: 重置画布尺寸

这是重置画布尺寸时应该知道的知识。

每个画布都有两个尺寸，一个是 drawingbuffer 的尺寸，
这个表示画布中有多少个像素。另一是画布显示的尺寸，
CSS 决定画布显示的尺寸。

你可以通过两种方式设置画布的 drawingbuffer 尺寸。一种是使用 HTML

```html
<canvas id="c" width="400" height="300"></canvas>
```

另一种是使用 JavaScript

```html
<canvas id="c"></canvas>
```

JavaScript

```js
const canvas = document.querySelector('#c')
canvas.width = 400
canvas.height = 300
```

如果你没有使用 CSS 影响到画布的显示尺寸，画布的显示尺寸则和 drawingbuffer 尺寸相同。
所以在上述两个例子中画布的 drawingbuffer 尺寸和显示尺寸都是 400x300。

在下方的例子中画布的显示尺寸是 400x300，drawingbuffer 是 10x15

```html
<canvas
    id="c"
    width="10"
    height="15"
    style="width: 400px; height: 300px;"
></canvas>
```

或者像这样

```html
<style>
    #c {
        width: 400px;
        height: 300px;
    }
</style>
<canvas id="c" width="10" height="15"></canvas>
```

如果我们在画布上绘制以一个单像素宽度的线，就会得到这样的结果

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

为什么它被模糊了？因为浏览器得到 10x15 像素的画布，将它拉伸到 400x300 像素，
然后在拉伸的过程中进行了插值。

假设我们想让画布填充满窗口该怎么做？首先使用 CSS 让浏览器将画布铺满窗口，例如

    <html>
      <head>
        <style>
          /*  */
          html, body {
            height: 100%;
            margin: 0;
          }
          /* 设置画布大小为视域大小 */
          #c {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

现在只需要将 drawingbuffer 的尺寸设置为为浏览器拉伸后的画布尺寸。
这是一个复杂的话题。让我们来看看一些不同的方法

## 使用 `clientWidth` 和 `clientHeight`

这是最简单的方法。
`clientWidth` 和 `clientHeight` 属性是所有 HTML 元素都有的属性，可以告诉我们元素的大小（CSS 像素）。

> 注意： client rect 包含任何 CSS 内边距，所以如果你使用 `clientWidth` 和/或 `clientHeight` 最好不要给 canvas 设置任何的内边距。

使用 JavaScript 我们可以检查该元素正在显示的大小，然后调整绘图缓冲区大小以匹配。

```js
function resizeCanvasToDisplaySize(canvas) {
    // 获取浏览器显示的画布的CSS像素值
    const displayWidth = canvas.clientWidth
    const displayHeight = canvas.clientHeight

    // 检查画布大小是否相同。
    const needResize =
        canvas.width !== displayWidth || canvas.height !== displayHeight

    if (needResize) {
        // 使画布大小相同
        canvas.width = displayWidth
        canvas.height = displayHeight
    }

    return needResize
}
```

让我们在渲染之前调用这个函数，这样它总是会在绘制之前将画布调整到我们想要的大小。

```js
function drawScene() {
   resizeCanvasToDisplaySize(gl.canvas);

   ...
```

就是这样

{{{example url="../webgl-resize-canvas.html" }}}

哪里出问题了？为什么这条线没有覆盖整个区域？

原因是当我们重置画布尺寸的时候还需要调用`gl.viewport`设置视域，
`gl.viewport`告诉 WebGL 如何将裁剪空间（-1 到 +1）中的点转换到像素空间，
也就是画布内。当你第一次创建 WebGL 上下文的时候 WebGL 会设置视域大小和画布大小匹配，
但是在那之后就需要你自己设置。当你改变画布大小就需要告诉 WebGL 新的视域设置。

让我们来修改代码处理这个问题。由于 WebGL 上下文引用了画布，所以直接传递它的尺寸。

    function drawScene() {
       resizeCanvasToDisplaySize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

现在没问题了。

{{{example url="../webgl-resize-canvas-viewport.html" }}}

在新窗口中打开，改变窗口大小，发现它总是填满窗口。

我知道你会问，为什么 WebGL 不在画布尺寸改变的时候自动帮我们修改视域？
原因是它不知道你如何以及为什么使用视域，你可以 [渲染到一个帧缓冲](webgl-render-to-texture.html)
或者做其他的事情需要不同的视域尺寸。
WebGL 没办法知道你的意图所以就不能自动帮你设置视域。

---

## 处理 `devicePixelRatio` 和缩放

为什么这还没有结束？嗯，这就是事情变得复杂的地方。

首先要了解的是，浏览器中的大多数尺寸都是以 CSS 像素为单位的。这是一个使不同设备有不同尺寸的尝试。例如，在本文的顶部，我们将画布的显示大小设置为 400x300 CSS 像素。根据用户是否拥有 HD-DPI 显示器，或者进行了放大或缩小，或者设置了操作系统缩放级别，显示器上的实际像素数量会有所不同。

`window.devicePixelRatio` 一般会告诉我们实际像素与显示器上 CSS 像素的比率。例如，这是您浏览器的当前设置

> <div>devicePixelRatio = <span data-diagram="dpr"></span></div>

如果您使用的是台式机或笔记本电脑， 请尝试按 <kbd>ctrl</kbd>+<kbd>+</kbd> 和 <kbd>ctrl</kbd>+<kbd>-</kbd> 进行放大和缩小 (在 Mac 上为<kbd>⌘</kbd>+<kbd>+</kbd> and <kbd>⌘</kbd>+<kbd>-</kbd> )。您应该会看到数字发生变化。

因此，如果我们希望画布中的像素数与实际用于显示它的像素数相匹配
显而易见的解决方案是将 `clientWidth` 和 `clientHeight` 乘于 `devicePixelRatio` 像这样:

```js
function resizeCanvasToDisplaySize(canvas) {
  // 获取浏览器显示的画布的CSS像素值
-  const displayWidth  = canvas.clientWidth;
-  const displayHeight = canvas.clientHeight;
+  const dpr = window.devicePixelRatio;
+  const displayWidth  = Math.round(canvas.clientWidth * dpr);
+  const displayHeight = Math.round(canvas.clientHeight * dpr);

  // 检查画布尺寸是否相同
  const needResize = canvas.width  != displayWidth ||
                     canvas.height != displayHeight;

  if (needResize) {
    // 设置为相同的尺寸
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

我们需要调用 `Math.round` (或者 `Math.ceil`, 或者 `Math.floor` 或者 `| 0`) 来得到一个整数，
因为 `canvas.width` 和 `canvas.height` 总是整数，所以如果
`devicePixelRatio` 不是一个常见的整数，我们的比较可能会失败，
特别是如果用户进行了缩放。

> 注意：是否使用 `Math.floor` 或 `Math.ceil` 或 `Math.round` 不是由 HTML 定义的
> 这取决于浏览器。 🙄

在任何情况下，这 **不会** 实际工作。 新问题是，给定一个不是 1.0 的 `devicePixelRatio`
画布填充给定区域所需的 CSS 大小可能不是整数值
但是 `clientWidth` 和 `clientHeight` 被定义为整数。 假设窗口的实际设备像素宽是
999 您的 devicePixelRatio = 2.0 并且您要求 100% 大小的画布。没有一个整数的值符合 \* 2.0 = 999.

下一个解决方案是使用
[`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
它返回一个 [`DOMRect`](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect)
包含 `width` 和 `height`。 它与由 `clientWidth` 和 `clientHeight` 表示的客户端矩形相同，但它不需要是整数。

下面是一个紫色的 `<canvas>`，设置为容器的 `width: 100%`。 缩小几次到 75% 或 60%，你可能会看到它的 `clientWidth` 和它的 `getBoundingClientRect().width` 不一样。

> <div data-diagram="getBoundingClientRect"></div>

在我的机器上我得到这些数值

```
Windows 10, zoom level 75%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level 90%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level -1, Safari (safari does not show the zoom level)
clientWidth: 700
getBoundingClientRect().width = 699.9999389648438

Firefox, both Windows and MacOS all zoom levels
clientWidth: 700
getBoundingClientRect().width = 700
```

注意：Firefox 在此特定设置中显示 700，但通过足够多的各种测试，我看到它从`getBoundingClientRect` 给出非整数结果，例如使窗口变小，以便 100% 画布小于 700，你可能会得到一个 Firefox 上的非整数结果。

因此，鉴于此我们可以尝试使用 `getBoundingClientRect`。

```js
function resizeCanvasToDisplaySize(canvas) {
  // 查找浏览器在 CSS 像素中显示画布的大小。
  const dpr = window.devicePixelRatio;
-  const displayWidth  = Math.round(canvas.clientWidth * dpr);
-  const displayHeight = Math.round(canvas.clientHeight * dpr);
+  const {width, height} = canvas.getBoundingClientRect();
+  const displayWidth  = Math.round(width * dpr);
+  const displayHeight = Math.round(height * dpr);

  // 检查画布大小是否相同。
  const needResize = canvas.width  != displayWidth ||
                     canvas.height != displayHeight;

  if (needResize) {
    // 使画布大小相同
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

那么我们完成了吗？ 抱歉不行。 事实证明，`canvas.getBoundingClientRect()` 不能总是返回准确的大小。 原因很复杂，但这与浏览器决定绘制事物的方式有关。 有些部分是在 HTML 级别决定的，有些部分是稍后在“合成器”级别（实际绘制的部分）决定的。
`getBoundingClientRect()` 发生在 HTML 级别，但之后发生的某些事情可能会影响画布实际绘制的大小。

我认为一个例子是 HTML 部分在抽象中工作，而合成器在具体中工作。 因此，假设您有一个设备像素宽是 999 和 devicePixelRatio 是 2.0 的窗口。将两个元素并排设置为
`width: 50%`。所以 HTML 计算出每一个应该是 499.5 个设备像素。 但是当真正需要绘制时，合成器无法绘制 499.5 像素，因此一个元素获得 499，另一个获得 500。任何规范都未定义哪个获得或丢失像素。

浏览器供应商提出的解决方案是使用
[`ResizeObserver` API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
并通过它提供的 `devicePixelContextBoxSize` 属性获取到实际大小。它返回实际使用的设备像素数。 请注意，它被称为 `ContentBox` 而不是 `ClientBox` 这意味着它是画布元素的 _content_ 部分，因此不像`clientWidth`, `clientHeight` 和 `getBoundingClientRect` 包含画布的内间距

它以异步方式返回结果。 上面提到的“合成器”在页面中以异步的方式运行。 它可以计算出实际要使用的尺寸，然后将该尺寸发送给您。

不幸的是，虽然所有现代浏览器都可以使用 `ResizeObserver`，但`devicePixelContentBoxSize`目前仅适用于 Chrome/Edge。 这是如何使用它。

我们创建了一个 `ResizeObserver` 并传递给它一个函数，以便在观察到的任何元素大小改变时调用它。 在我们的例子中，是我们的画布。

```js
const resizeObserver = new ResizeObserver(onResize)
resizeObserver.observe(canvas, { box: 'content-box' })
```

上面的代码创建了一个 `ResizeObserver`，当观察到的元素改变大小时，它将调用函数 `onResize`（如下）。我们让它`观察`画布的`content-box`何时改变大小。这很重要，但有点令人困惑。 我们可以要求它告诉我们
`device-pixel-content-box` 何时改变大小， 但让我们想象一下我们有一个画布，它是窗口的某个百分比大小，就像上面常见的 100% 的行示例一样。在这种情况下，无论缩放级别如何，我们的画布都将始终具有相同数量的设备像素。 当我们缩放时窗口没有改变大小，所以仍然有相同数量的设备像素。 另一方面，`content-box` 会随着我们的缩放而改变，因为它是用 CSS 像素来衡量的，所以当我们缩放时，或多或少的 CSS 像素适合设备像素的数量。

如果我们不关心缩放级别，那么我们可以只观察 `device-pixel-content-box`.
如果不支持它会抛出一个错误所以我们会这样做

```js
const resizeObserver = new ResizeObserver(onResize)
try {
    // 只告诉我们改变的设备像素数
    resizeObserver.observe(canvas, { box: 'device-pixel-content-box' })
} catch (ex) {
    // 不支持 device-pixel-content-box 时回退到这个
    resizeObserver.observe(canvas, { box: 'content-box' })
}
```

`onResize` 函数将使用 [`ResizeObserverEntry`s](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry)数组调用。 每当大小改变时我们将把尺寸记录到 map 对象中以便我们处理多个元素。

```js
// 使用默认画布大小进行初始化
const canvasToDisplaySizeMap = new Map([[canvas, [300, 150]]])

function onResize(entries) {
    for (const entry of entries) {
        let width
        let height
        let dpr = window.devicePixelRatio
        if (entry.devicePixelContentBoxSize) {
            // 注意：只有这个方式给出了正确的尺寸
            // 其他方式用于不支持的浏览器
            width = entry.devicePixelContentBoxSize[0].inlineSize
            height = entry.devicePixelContentBoxSize[0].blockSize
            dpr = 1
        } else if (entry.contentBoxSize) {
            if (entry.contentBoxSize[0]) {
                width = entry.contentBoxSize[0].inlineSize
                height = entry.contentBoxSize[0].blockSize
            } else {
                width = entry.contentBoxSize.inlineSize
                height = entry.contentBoxSize.blockSize
            }
        } else {
            width = entry.contentRect.width
            height = entry.contentRect.height
        }
        const displayWidth = Math.round(width * dpr)
        const displayHeight = Math.round(height * dpr)
        canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight])
    }
}
```

这有点乱。 在支持 `devicePixelContentBoxSize` 之前，您可以看到该 API 至少提供了 3 个不同的版本 😂
现在我们修改调整大小的函数以使用此数据

```js
function resizeCanvasToDisplaySize(canvas) {
-  // 查找浏览器在 CSS 像素中显示画布的大小。
-  const dpr = window.devicePixelRatio;
-  const {width, height} = canvas.getBoundingClientRect();
-  const displayWidth  = Math.round(width * dpr);
-  const displayHeight = Math.round(height * dpr);
+  // 获取浏览器在设备像素中显示画布的大小。
+ const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);

  // 检查画布大小是否相同。
  const needResize = canvas.width  != displayWidth ||
                     canvas.height != displayHeight;

  if (needResize) {
    // 使画布大小相同
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

这是使用此代码的示例

{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}

可能很难看出任何差异。 如果您有 HD-DPI 显示器
就像您的智能手机或自 2019 年以来的所有 Mac 或 4k 显示器一样，那么这条线应该比上一个示例的线更细。

否则，如果您放大（我建议您在新窗口中打开示例），当您放大线条时，应保持相同的分辨率，而如果放大前一个示例，线条将变得更粗且分辨率更低，因为它没有适配 `devicePixelRatio`。

就像这里的测试一样，上面的所有 3 种方法都使用简单的 2d 画布。 为了简单起见，不使用 WebGL。 相反，它使用 Canvas 2D 并制作 2 个图案，一个 2x2 像素垂直黑白图案和一个 2x2 像素水平黑白图案。 它在左侧绘制水平图案 ▤，在右侧绘制垂直图案 ▥。

{{{example url="../webgl-resize-the-canvas-comparison.html"}}}

调整此窗口的大小，或者更好的是，在新窗口中打开它并使用快捷键放大。 在不同的缩放级别调整窗口大小，并注意只有底部的那个适用于所有情况（在 Chrome/Edge 中）。 请注意，您设备的`devicePixelRatio`越高，就越难发现问题。 您应该看到的是左侧和右侧是不变的。 如果您看到粗糙的图案或看到不同的黑暗（如渐变），则它不起作用。 因为它只能在 Chrome/Edge 中工作，所以你需要在那里尝试看看它是否工作。

另请注意，某些操作系统 (MacOS) 提供了一个操作系统级别的缩放选项，该选项通常对应用程序隐藏。 在这种情况下，您会在底部示例中看到轻微的图案（假设您在 Chrome/Edge 中），但它将是常规图案。

这带来了在其他浏览器上没有好的解决方案的问题，但是，您需要真正的解决方案吗？ 大多数 WebGL 应用程序会做一些事情，比如在 3D 中绘制一些带有纹理和/或光照的东西。 因此，通常我们忽略`devicePixelRatio`或者使用 `clientWidth`, `clientHeight` 或 `getBoundingClientRect()` \* `devicePixelRatio`

此外，盲目使用`devicePixelRatio`会降低性能。
在 iPhoneX 或 iPhone11 <code>window.devicePixelRatio</code> 是 <code>3</code> 这意味着将绘制 9 倍的像素。 在 Samsung Galaxy S8 这个值是 <code>4</code> 这意味着将绘制 16 倍的像素。 这会使程序变慢。
事实上，实际渲染的像素少于显示的像素，并让 GPU 放大它们,这是游戏中的一种常见优化。 这取决于您的需求。 如果您正在绘制用于打印的图形，您可能希望支持 HD-DPI。 如果您正在制作游戏，您可能不会，或者如果用户的系统速度不够快，无法绘制如此多的像素。您可能希望让用户选择打开或关闭支持 HD-DPI。

另一个警告是，至少到 2021 年 1 月为止， `round(getBoundingClientRect * devicePixelRatio)` 适用于所有现代浏览器 **当和仅当** 画布大小铺满窗口大小时，就像上面的线的示例,这是使用这种模式的示例

{{{example url="../webgl-resize-the-canvas-comparison-fullwindow.html"}}}

您会注意到，如果您缩放和调整 _当前页面_ 的大小，使用 `getBoundingClientRect` 会获取不到正确大小。
这是因为画布不是在完整的窗口，它在 iframe 中。 在单独的窗口中打开示例，它将起作用。

您使用哪种解决方案取决于您。 对我来说，99% 的时间我不使用`devicePixelRatio`。 它使我的页面变慢，除了少数图形专家外，大多数人不会注意到差异。 在这个站点上有一些图表使用它，但大多数示例没有。

如果您查看许多 WebGL 程序，它们会以许多不同的方式处理调整大小或设置画布的大小。
我认为最好的方法是让浏览器选择大小以使用 CSS 显示画布，然后查找它选择的大小并调整画布中的像素数作为响应。
如果你很好奇 <a href="webgl-anti-patterns.html">以下是一些原因</a> 我认为上述方式是更可取的方式。

<!-- just to shut up the build that this link used to exist
     and still exists in older translations -->

<a href="webgl-animation.html"></a>

<script type="module" src="resources/webgl-resizing-the-canvas.module.js"></script>
