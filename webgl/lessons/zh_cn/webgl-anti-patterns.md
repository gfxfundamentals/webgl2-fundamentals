Title: WebGL2 反模式
Description: WebGL 编程禁忌：问题所在与正确做法
TOC: 反模式


这是一些 WebGL 中的**反模式**列表。反模式指的是你在编写 WebGL 程序时应当**避免采用的做法**。

1.  <a id="viewportwidth"></a>在 `WebGLRenderingContext` 上添加 `viewportWidth` 和 `viewportHeight` 属性

    有些代码会为视口的宽度和高度添加属性，并将它们直接附加到 `WebGLRenderingContext` 对象上，类似这样：

        gl = canvas.getContext("webgl2");
        gl.viewportWidth = canvas.width;    //  ❌ 错误做法！
        gl.viewportHeight = canvas.height;  //  ❌ 错误做法！

    之后可能会这样使用这些属性：

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    **为什么这样做不好：**

    从客观角度来看，这样做不好是因为你引入了两个属性，在每次更改 canvas 大小时都需要手动更新它们。  
    例如：当用户调整窗口大小时，如果你没有重新设置 `gl.viewportWidth` 和 `gl.viewportHeight`，它们的值就会出错。

    从主观角度来看，这样做也不好，因为任何一个刚接触 WebGL 的程序员在看到你的代码时，  
    很可能会以为 `gl.viewportWidth` 和 `gl.viewportHeight` 是 WebGL 规范的一部分，  
    从而产生误解，甚至困扰数月。

    **正确的做法：**

    为什么要给自己增加额外的工作量？WebGL 上下文对象中已经包含了其对应的 canvas，而且 canvas 本身就有宽高属性可用。
    
    <pre class="prettyprint">
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    </pre>

    上下文对象本身也直接提供了其绘图缓冲区的宽度和高度。

        // 当你需要将视口设置为与 canvas 的 drawingBuffer 大小时，这种方式总是正确的
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    甚至更好的是，使用`gl.drawingBufferWidth` 和 `gl.drawingBufferHeight` 能处理极端情况，而使用 `gl.canvas.width` 和 `gl.canvas.height` 则无法做到。为什么会这样[请见此处](#drawingbuffer)。
    
2.  <a id="canvaswidth"></a>使用 canvas.width 和 canvas.height 来计算宽高比（aspect ratio）

    很多代码会像下面这样，使用 `canvas.width` 和 `canvas.height` 来计算宽高比：

        var aspect = canvas.width / canvas.height;
        perspective(fieldOfView, aspect, zNear, zFar);

    **为什么这样做不好：**

    画布的 width 和 height 属性与画布在页面上的实际显示尺寸没有关系。 真正控制画布显示大小的是 CSS。

    **正确的做法：**

    使用 `canvas.clientWidth` 和 `canvas.clientHeight`。这些值表示画布在屏幕上实际的显示尺寸。使用它们可以确保你始终获得正确的纵横比，而不受 CSS 设置的影响。

        var aspect = canvas.clientWidth / canvas.clientHeight;
        perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    以下是一些示例：画布的绘图缓冲区尺寸相同（width="400" height="300"），但我们通过 CSS 指定浏览器以不同的尺寸显示该画布。 请注意，这些示例中的 “F” 字母都显示在正确的宽高比下。

    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="400" height="150" }}}

    如果我们使用的是 `canvas.width` 和 `canvas.height`，那么就不会是这种正确的显示效果了。

    {{{diagram url="../webgl-canvas-width-height.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-width-height.html" width="400" height="150" }}}

3.  <a id="innerwidth"></a>使用 `window.innerWidth` 和 `window.innerHeight` 来进行计算

    许多 WebGL 程序在许多地方使用 `window.innerWidth` 和 `window.innerHeight`，例如：

        canvas.width = window.innerWidth;                    // ❌ 错误做法！！
        canvas.height = window.innerHeight;                  // ❌ 错误做法！！

    **为什么这很糟糕：**

    这不具备通用性。是的，对于那些你希望 canvas 填满整个屏幕的 WebGL 页面来说，它是可行的。但问题是，当你不这么做时，它就不合适了。也许你正在写一篇教程文章，canvas 只是页面中一个小图示；或者你需要一个侧边的属性编辑器，或者是一个游戏的计分面板。
    当然你可以通过修改代码来应对这些情况，但何不一开始就写出可以适用于这些场景的代码？这样你在将这段代码拷贝到一个新项目或在旧项目中以新方式使用时，就不需要再进行调整。

    **好的做法：**

    与其对抗 Web 平台，不如按它的设计方式来使用它。使用 CSS 和 `clientWidth`、`clientHeight`。

        var width = gl.canvas.clientWidth;
        var height = gl.canvas.clientHeight;

        gl.canvas.width = width;
        gl.canvas.height = height;

    下面是 9 个不同场景的案例，它们都使用完全相同的代码。请注意，这些代码中 都没有引用 `window.innerWidth` 或 `window.innerHeight`。

    <a href="../webgl-same-code-canvas-fullscreen.html" target="_blank">一个只包含 canvas 的页面，使用 CSS 让其全屏显示</a>
    
    <a href="../webgl-same-code-canvas-partscreen.html" target="_blank">一个页面中的 canvas 设置为 70% 宽度，为编辑器控件留出空间</a>
    
    <a href="../webgl-same-code-canvas-embedded.html" target="_blank">一个将 canvas 嵌入段落中的页面</a>
    
    <a href="../webgl-same-code-canvas-embedded-border-box.html" target="_blank">一个将 canvas 嵌入段落并使用 <code>box-sizing: border-box;</code> 的页面</a>

    <code>box-sizing: border-box;</code> 会让边框和内边距从元素本身的尺寸中占用空间，而不是额外扩展到元素之外。换句话说，在默认的 box-sizing 模式下，一个 400x300 像素的元素加上 15 像素的边框，会得到一个内容区域为 400x300 像素、总尺寸为 430x330 像素的元素。而在 <code>box-sizing: border-box;</code> 模式中，边框会向内缩进，因此该元素保持 400x300 像素大小，但内容区域将缩小为 370x270 像素。

    这也是为什么使用 `clientWidth` 和 `clientHeight` 如此重要的又一原因。如果你设置了例如 `1em` 的边框，就无法预知 canvas 的实际渲染尺寸——不同的字体、不同的设备或浏览器都会导致 canvas 显示大小不同。

    <a href="../webgl-same-code-container-fullscreen.html" target="_blank">一个只有容器的页面，使用 CSS 使其全屏显示，代码会在其中插入一个 canvas</a>

    <a href="../webgl-same-code-container-partscreen.html" target="_blank">一个容器占据页面 70% 宽度的页面，为编辑控件预留空间，代码会在其中插入一个 canvas</a>
    
    <a href="../webgl-same-code-container-embedded.html" target="_blank">一个将容器嵌入段落中的页面，代码会在其中插入一个 canvas</a>
    
    <a href="../webgl-same-code-container-embedded-border-box.html" target="_blank">一个使用 <code>box-sizing: border-box;</code> 将容器嵌入段落中的页面，代码会在其中插入一个 canvas</a>
    
    <a href="../webgl-same-code-body-only-fullscreen.html" target="_blank">一个没有任何元素，仅通过 CSS 设置为全屏的页面，代码会在其中插入一个 canvas</a>
    
    再次强调，如果你遵循上述技术并拥抱 Web 平台的设计思路，无论遇到哪种使用场景，你都无需修改任何代码。

4.  <a id="resize"></a>使用 `'resize'` 事件来改变 canvas 的尺寸

    有些应用会监听窗口的 `'resize'` 事件来调整 canvas 的尺寸，比如这样：

        window.addEventListener('resize', resizeTheCanvas);

    或者

        window.onresize = resizeTheCanvas;

    **为什么这样不好：**

    这并不绝对错误，但对于*大多数*WebGL 程序来说，它的适用范围较小。
    具体来说，'resize' 事件只在窗口尺寸变化时触发。但当 canvas 因其他原因被调整大小时，它不会触发。
    举个例子：假设你正在制作一个 3D 编辑器。左边是 canvas，右边是设置面板，你可以拖动中间的分隔条来调整设置区域的宽度。在这种情况下，canvas 的尺寸会改变，但你不会收到任何 'resize' 事件。
    类似地，如果你的页面有其他内容被添加或移除，浏览器重新布局导致 canvas 尺寸变化，也不会触发 'resize' 事件。

    **正确做法：**

    就像前面提到的很多反模式一样，有一种更通用的写法可以让你的代码在大多数情况下都正常工作。
    对于那些每一帧都在渲染的 WebGL 应用，可以在每次绘制时检查 canvas 是否需要调整大小，方法如下：

        function resizeCanvasToDisplaySize() {
          var width = gl.canvas.clientWidth;
          var height = gl.canvas.clientHeight;
          if (gl.canvas.width != width ||
              gl.canvas.height != height) {
             gl.canvas.width = width;
             gl.canvas.height = height;
          }
        }

        function render() {
           resizeCanvasToDisplaySize();
           drawStuff();
           requestAnimationFrame(render);
        }
        render();

    现在无论哪种情况，canvas 都会自动缩放到正确的尺寸。你无需针对不同的使用场景修改代码。
    例如，使用上面第 3 点中相同的代码，这里是一个具有可调整大小编辑区域的编辑器示例。

    {{{example url="../webgl-same-code-resize.html" }}}

    这种情况下，以及所有由于页面中其他动态元素尺寸变化而导致 canvas 大小变化的场景中，都不会触发 `resize` 事件。

    对于不是每一帧都重绘的 WebGL 应用，以上代码依然适用，你只需要在 canvas 有可能被调整大小的场景中触发重绘即可。
    一个简单的做法是使用 `ResizeObserver`。

    <pre class="prettyprint">
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(gl.canvas, {box: 'content-box'});
    </pre>

5.  <a id="properties"></a>向 `WebGLObject` 添加属性

    `WebGLObject` 是指 WebGL 中的各种资源类型，比如 `WebGLBuffer` 或 `WebGLTexture` 等。  
    有些应用会给这些对象添加额外的属性。例如：

        var buffer = gl.createBuffer();
        buffer.itemSize = 3;        // ❌ 不推荐的做法！！
        buffer.numComponents = 75;  // ❌ 不推荐的做法！！

        var program = gl.createProgram();
        ...
        program.u_matrixLoc = gl.getUniformLocation(program, "u_matrix");  // ❌ 不推荐的做法！！

    **为什么这样不好：**

    这是一个不推荐的做法，是因为 WebGL 有可能会“丢失上下文”（context lost）。  
    这种情况可能由于多种原因发生，其中最常见的原因是：如果浏览器发现 GPU 资源占用过高，  
    它可能会故意让某些 `WebGLRenderingContext` 上下文失效，以释放资源。

    如果你希望 WebGL 程序能够稳定运行，就必须处理上下文丢失的问题。比如 Google Maps 就处理了这种情况。
    
    而上述代码的问题在于，一旦上下文丢失，像 `gl.createBuffer()` 这样的 WebGL 创建函数将返回 `null`，  
    这实际上等价于以下代码：

        var buffer = null;
        buffer.itemSize = 3;        // ERROR!
        buffer.numComponents = 75;  // ERROR!

    这很可能会让你的应用崩溃，并抛出如下错误：

        TypeError: Cannot set property 'itemSize' of null

    虽然很多应用在上下文丢失时崩溃也无所谓，但如果以后开发者决定要支持上下文丢失的处理，那写出这种代码显然不是个好主意，因为它们迟早都得被修复。

    **正确做法：**

    如果你想把 `WebGLObject` 和它的相关信息绑定在一起，一个可行的方法是使用 JavaScript 对象。例如：

        var bufferInfo = {
          id: gl.createBuffer(),
          itemSize: 3,
          numComponents: 75,
        };

        var programInfo = {
          id: program,
          u_matrixLoc: gl.getUniformLocation(program, "u_matrix"),
        };

    我个人建议[使用一些简单的辅助工具，这会让编写 WebGL 代码变得更加轻松](webgl-less-code-more-fun.html)。

以上是我在网络上看到的一些 WebGL 反模式（Anti-Patterns）。  
希望我已经说明了为什么应当避免这些做法，并提供了简单实用的替代方案。

<div class="webgl_bottombar"><a id="drawingbuffer"></a><h3>什么是 drawingBufferWidth 和 drawingBufferHeight？</h3>
<p>
GPU 对它们支持的像素矩形（纹理、渲染缓冲）的大小是有限制的。这个限制通常是大于当时常见显示器分辨率的 2 的幂。例如，如果某个 GPU 是为支持 1280x1024 的屏幕设计的，它的限制可能是 2048；如果是为 2560x1600 的屏幕设计的，则可能是 4096。
</p><p>
这听起来很合理，但如果你有多个显示器会发生什么？假设我的 GPU 限制为 2048，但我有两个 1920x1080 的显示器。用户打开了一个 WebGL 页面，然后将窗口拉伸到两个显示器上。这时你的代码尝试将 <code>canvas.width</code> 设置为 <code>canvas.clientWidth</code>，也就是 3840。这种情况下该怎么办？
</p>
<p>我能想到只有 3 种选择：</p>
<ol>
<li>
 <p>抛出异常。</p>
 <p>这听起来很糟糕。大多数 Web 应用不会处理这个异常，结果就是程序崩溃。如果用户的数据没有保存，那就直接丢失了。</p>
</li>
<li>
 <p>将 canvas 大小限制在 GPU 支持的最大值。</p>
 <p>问题是这样也可能导致崩溃，或者页面显示错乱，因为代码以为 canvas 是它请求的大小，页面中的其他 UI 元素和布局也会依赖这个尺寸。</p>
</li>
<li>
 <p>让 canvas 显示为用户请求的尺寸，但将其绘图缓冲区限制为 GPU 的最大限制。</p>
 <p>这是 WebGL 实际采用的方案。如果代码写得正确，用户唯一会注意到的可能只是画面略微被缩放了。但总体来说一切工作正常。最坏情况下，如果 WebGL 程序没处理好，只是画面显示略微错位，等用户缩小窗口后就恢复正常了。</p>
</li>
</ol>
<p>大多数人并没有多个显示器，所以这个问题很少遇到。或者说至少以前是这样。Chrome 和 Safari（至少在 2015 年 1 月）对 canvas 尺寸有硬编码的最大限制为 4096。而苹果的 5K iMac 分辨率就超过了这个限制，因此许多 WebGL 应用出现了奇怪的显示问题。同样地，越来越多人开始在多屏环境中使用 WebGL 做展示类工作，也在碰到这个限制。</p>
<p>
所以，如果你想处理这些情况，请像上面第 #1 条建议中那样使用 <code>gl.drawingBufferWidth</code> 和 <code>gl.drawingBufferHeight</code>。对于大多数应用，只要你按照这些最佳实践来做，就能确保正常运行。但如果你的程序中需要知道绘图缓冲区的实际尺寸（比如 [拾取](webgl-picking.html)，也就是将鼠标坐标转换为 canvas 像素坐标），你就需要特别注意这点。另一个例子是任何类型的后处理效果，它们也需要知道实际的绘图缓冲区大小。
</p>
</div>
