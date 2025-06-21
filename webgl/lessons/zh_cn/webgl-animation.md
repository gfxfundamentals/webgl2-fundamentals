Title: WebGL2 - 动画
Description: WebGL动画实现方法
TOC: 动画


本文隶属于WebGL系列教程，首篇[基础教程](webgl-fundamentals.html)从核心概念讲起，前文则探讨了[3D相机](webgl-3d-camera.html)相关内容。若尚未阅读，请先参阅。

如何在WebGL中让物体动起来？

本质上，这并非WebGL特有机制——任何JavaScript动画都需要随时间改变状态并重绘。

我们选取一个前文示例进行动画改造。

    *var fieldOfViewRadians = degToRad(60);
    *var rotationSpeed = 1.2;

    *requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene() {
    *  // Every frame increase the rotation a little.
    *  rotation[1] += rotationSpeed / 60.0;

      ...
    *  // Call drawScene again next frame
    *  requestAnimationFrame(drawScene);
    }

效果如下：

{{{example url="../webgl-animation-not-frame-rate-independent.html" }}}

但存在一个潜在问题，代码中的 `rotationSpeed / 60.0` 是基于浏览器每秒60次响应 `requestAnimationFrame` 的假设，
这种帧率假设并不可靠。

该假设实际上并不成立。用户可能使用旧款智能手机等低性能设备，或后台运行重负载程序。
浏览器帧率受多种因素影响，未必保持60FPS——例如2020年后硬件或支持240FPS，或电竞玩家使用90Hz刷新率的CRT显示器。

可通过此示例观察该问题：

{{{diagram url="../webgl-animation-frame-rate-issues.html" }}}

上例中，我们想让所有'F'保持相同的转速。中间的F全速运行，帧率无关。
左右两侧的F，模拟浏览器只有1/8性能运行的情况。在左侧的F是帧率**无**关的。右边的F，帧率**相**关。

可见：左侧F因未考虑帧率下降而无法同步，右侧F即使以1/8帧率运行仍与全速运行的中央F保持同步。

实现帧率无关动画的核心方法是：计算帧间时间差，并据此确定当前帧的动画状态增量。

先需要获取时间值。幸运的是 `requestAnimationFrame` 在回调时会自动传入页面加载后的时间戳。

为简化计算，转换为以秒为单位最简单。由于 `requestAnimationFrame` 提供的时间单位为毫秒（1/1000秒），需乘以0.001转换为秒。

由此，可按下面的方式计算时间增量：

    *var then = 0;

    requestAnimationFrame(drawScene);

    // Draw the scene.
    *function drawScene(now) {
    *  // Convert the time to seconds
    *  now *= 0.001;
    *  // Subtract the previous time from the current time
    *  var deltaTime = now - then;
    *  // Remember the current time for the next frame.
    *  then = now;

       ...

一旦获得以秒为单位的`deltaTime`，我们所有的计算都可以基于"每秒单位量"进行。在本例中：
`rotationSpeed` 设为1.2,表示每秒旋转1.2弧度。约等于1/5圆周，完整旋转一周约需5秒，且该速率与帧率无关。


    *    rotation[1] += rotationSpeed * deltaTime;

以下是实现效果：

{{{example url="../webgl-animation.html" }}}

除非在低性能设备上运行，否则您可能难以察觉与本页顶部示例的差异。但若不实现帧率无关的动画，部分用户获得的体验将与您的设计预期大相径庭。s

接下来学习如何[应用纹理](webgl-3d-textures.html)。

<div class="webgl_bottombar">
<h3>请勿使用 setInterval 或 setTimeout ！</h3>
<p>若您曾用JavaScript实现动画，可能习惯使用<code>setInterval</code>或<code>setTimeout</code>调用绘制函数。</p>
<p> 这类方式存在双重缺陷：首先，<code>setInterval</code>和<code>setTimeout</code>与浏览器渲染流程无关，它们无法与屏幕刷新同步，最终将导致与用户设备不同步。
若您假设60FPS使用它们，而实际设备以其他帧率运行，就会出现同步问题。</p>
<p> 其次，浏览器无法识别您调用<code>setInterval</code>或<code>setTimeout</code>的意图。即使页面处于后台标签页（不可见状态），浏览器仍会执行这些代码。虽然这对每分钟检查邮件/Tweet的任务无碍，但若用于WebGL渲染上千个对象，将导致用户设备资源被不可见页面的渲染任务无意义消耗。</p>
<p> 
<code>requestAnimationFrame</code>能完美解决这些问题。
它在屏幕刷新最佳时机触发回调，且仅在标签页可见时执行。
</p> 
</div>



