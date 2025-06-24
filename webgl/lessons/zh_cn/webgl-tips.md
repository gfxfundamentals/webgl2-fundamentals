Title: WebGL2 小贴士
Description: 使用 WebGL 时可能遇到的一些小问题
TOC: #

本文收集了一些你在使用 WebGL 时可能遇到的、看起来太小而不值得单独写一篇文章的问题。

---

<a id="screenshot" data-toc="Taking a screenshot"></a>

# 画布截屏

在浏览器中，实际上有两种函数可以对画布进行截图。  
一种旧方法是：
[`canvas.toDataURL`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)
另一种新的更好的方法是：
[`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

所以你可能会认为，只需添加如下代码就能轻松截图：

```html
<canvas id="c"></canvas>
+<button id="screenshot" type="button">Save...</button>
```

```js
const elem = document.querySelector('#screenshot');
elem.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});

const saveBlob = (function() {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  return function saveData(blob, fileName) {
     const url = window.URL.createObjectURL(blob);
     a.href = url;
     a.download = fileName;
     a.click();
  };
}());
```

这是来自[动画那篇文章](webgl-animation.html)的示例，在其中加入了上面的代码，并添加了一些 CSS 来放置按钮。

{{{example url="../webgl-tips-screenshot-bad.html"}}}

当我尝试时，我得到了这样的截图。

<div class="webgl_center"><img src="resources/screencapture-398x298.png"></div>

是的，这是一个空白图像。

根据你的浏览器/操作系统，它可能对你有效，但通常情况下它是无法工作的。

问题在于，出于性能和兼容性的考虑，浏览器默认会在你绘制完后，清除 WebGL 画布的绘图缓冲区。

有三种解决方案。

1.  在截图之前调用渲染代码

    我们使用的代码是一个 `drawScene` 函数。  
    最好让这段代码不改变任何状态，这样我们就可以在截图时调用它来进行渲染。

    ```js
    elem.addEventListener('click', () => {
    +  drawScene();
      canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
      });
    });
    ```

2.  在渲染循环中调用截图代码

    在这种情况下，我们只需设置一个标志表示我们想要截图，然后在渲染循环中实际执行截图操作。

    ```js
    let needCapture = false;
    elem.addEventListener('click', () => {
       needCapture = true;
    });
    ```
    
    然后在我们的渲染循环中，也就是当前实现于 `drawScene` 的函数中，在所有内容绘制完成之后的某个位置。

    ```js
    function drawScene(time) {
      ...

    +  if (needCapture) {
    +    needCapture = false;
    +    canvas.toBlob((blob) => {
    +      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    +    });
    +  }

      ...
    }
    ```

3. 在创建 WebGL 上下文时，设置 `preserveDrawingBuffer: true`

    ```js
    const gl = someCanvas.getContext('webgl2', {preserveDrawingBuffer: true});
    ```

   这会让 WebGL 在将画布与页面其他部分合成后不清除画布，但会阻止某些*可能的*优化。

我会选择上面的第 1 种方法。对于这个特定示例，我首先会把更新状态的代码部分与绘制的代码部分分离开。

```js
  var then = 0;

-  requestAnimationFrame(drawScene);
+  requestAnimationFrame(renderLoop);

+  function renderLoop(now) {
+    // Convert to seconds
+    now *= 0.001;
+    // Subtract the previous time from the current time
+    var deltaTime = now - then;
+    // Remember the current time for the next frame.
+    then = now;
+
+    // Every frame increase the rotation a little.
+    rotation[1] += rotationSpeed * deltaTime;
+
+    drawScene();
+
+    // Call renderLoop again next frame
+    requestAnimationFrame(renderLoop);
+  }

  // Draw the scene.
+  function drawScene() {
- function drawScene(now) {
-    // Convert to seconds
-    now *= 0.001;
-    // Subtract the previous time from the current time
-    var deltaTime = now - then;
-    // Remember the current time for the next frame.
-    then = now;
-
-    // Every frame increase the rotation a little.
-    rotation[1] += rotationSpeed * deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    ...

-    // Call drawScene again next frame
-    requestAnimationFrame(drawScene);
  }
```

现在我们只需在截图之前调用 `drawScene` 即可

```js
elem.addEventListener('click', () => {
+  drawScene();
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});
```

现在它应该可以正常工作了。

{{{example url="../webgl-tips-screenshot-good.html" }}}

如果你实际检查捕获的图像，会看到背景是透明的。  
详情请参见[这篇文章](webgl-and-alpha.html)。

---

<a id="preservedrawingbuffer" data-toc="Prevent the Canvas Being Cleared"></a>

# 防止画布被清除

假设你想让用户用一个动画对象进行绘画。  
在创建 WebGL 上下文时，需要传入 `preserveDrawingBuffer: true`。  
这可以防止浏览器清除画布。

采用[动画那篇文章](webgl-animation.html)中的最后一个示例

```js
var canvas = document.querySelector("#canvas");
-var gl = canvas.getContext("webgl2");
+var gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
```

并修改对 `gl.clear` 的调用，使其只清除深度缓冲区。

```
-// Clear the canvas.
-gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+// Clear the depth buffer.
+gl.clear(gl.DEPTH_BUFFER_BIT);
```

{{{example url="../webgl-tips-preservedrawingbuffer.html" }}}

注意，如果你真想做一个绘图程序，这不是一个解决方案，  
因为每当我们改变画布的分辨率时，浏览器仍然会清除画布。  
我们是根据显示尺寸来改变分辨率的。显示尺寸会在窗口大小改变时变化，  
这可能发生在用户下载文件时，甚至在另一个标签页，浏览器添加状态栏时。  
还包括用户旋转手机，浏览器从竖屏切换到横屏时。

如果你真的想做绘图程序，应该[渲染到纹理](webgl-render-to-texture.html)。

---

<a id="tabindex" data-toc="Get Keyboard Input From a Canvas"></a>

# 获取键盘输入

如果你制作的是全页面/全屏的 WebGL 应用，那么你可以随意处理，  
但通常你希望某个 canvas 只是页面的一部分，  
并希望用户点击 canvas 时它能接收键盘输入。  
不过 canvas 默认是无法获取键盘输入的。为了解决这个问题，  
需要将 canvas 的 [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex)  
设置为 0 或更大。例如：

```html
<canvas tabindex="0"></canvas>
```

不过这会引发一个新问题。任何设置了 `tabindex` 的元素在获得焦点时都会被高亮显示。  
为了解决这个问题，需要将其获得焦点时的 CSS 边框（outline）设置为 none。

```css
canvas:focus {
  outline:none;
}
```

为演示起见，这里有三个 canvas

```html
<canvas id="c1"></canvas>
<canvas id="c2" tabindex="0"></canvas>
<canvas id="c3" tabindex="1"></canvas>
```

以及仅针对最后一个 canvas 的一些 CSS

```css
#c3:focus {
    outline: none;
}
```

让我们给所有 canvas 都附加相同的事件监听器

```js
document.querySelectorAll('canvas').forEach((canvas) => {
  const ctx = canvas.getContext('2d');

  function draw(str) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, canvas.width / 2, canvas.height / 2);
  }
  draw(canvas.id);

  canvas.addEventListener('focus', () => {
    draw('has focus press a key');
  });

  canvas.addEventListener('blur', () => {
    draw('lost focus');
  });

  canvas.addEventListener('keydown', (e) => {
    draw(`keyCode: ${e.keyCode}`);
  });
});
```

注意，第一个 canvas 无法接受键盘输入。  
第二个 canvas 可以，但它会被高亮显示。  
第三个 canvas 同时应用了这两个解决方案。

{{{example url="../webgl-tips-tabindex.html"}}}

---

<a id="html-background" data-toc="Use WebGL2 as Background in HTML"></a>

# 将背景设为WebGL动画

一个常见问题是如何将WebGL动画设置为网页背景。

以下是两种最常用的实现方式：

* 将Canvas的CSS `position` 设置为 `fixed`，如下所示：

```css
#canvas {
 position: fixed;
 left: 0;
 top: 0;
 z-index: -1;
 ...
}
```

并将 `z-index` 设为 -1。

这种方案的一个小缺点是：你的 JavaScript 代码必须与页面其他部分兼容，如果页面比较复杂，就需要确保 WebGL 代码中的 JavaScript 不会与页面其他功能的 JavaScript 产生冲突。

* 使用 `iframe`

这正是本站[首页](/)采用的解决方案。

在您的网页中，只需插入一个iframe即可实现，例如：

```html
<iframe id="background" src="background.html"></iframe>
<div>
  Your content goes here.
</div>
```

接下来将这个iframe设置为全屏背景样式，本质上和我们之前设置canvas的代码相同——只是需要额外将 `border` 设为 `none`，因为iframe默认带有边框。具体实现如下：

```css
#background {
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: -1;
    border: none;
    pointer-events: none;
}
```

{{{example url="../webgl-tips-html-background.html"}}}
