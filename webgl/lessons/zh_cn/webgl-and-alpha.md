Title: WebGL2 和 Alpha
Description: WebGL 中的 Alpha 与 OpenGL 中的 Alpha 有何不同
TOC: WebGL2 和 Alpha

我注意到一些 OpenGL 开发者在使用 WebGL 时遇到了关于后缓冲区（即画布）中 alpha 的问题，所以我觉得有必要讲一下 WebGL 和 OpenGL 在 alpha 处理上的一些差异。

OpenGL 和 WebGL 最大的区别是，OpenGL 渲染到一个不会被任何东西合成的后缓冲区，或者说操作系统的窗口管理器实际上不会对它进行合成，所以无论 alpha 怎么设置都无所谓。

而 WebGL 是由浏览器与网页内容合成的，默认使用预乘 alpha（premultiplied alpha），这和带透明通道的 PNG `<img>` 标签以及 2D canvas 标签的行为相同。

WebGL 有几种方式可以使其行为更像 OpenGL。

### #1) 告诉 WebGL 你希望使用非预乘 alpha 合成

    gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false  // Ask for non-premultiplied alpha
    });

默认值是 true。

当然，结果仍会与画布下方的背景颜色合成（画布背景色、画布容器背景色、页面背景色，或者当画布 z-index 大于 0 时背后的内容），
换句话说，是网页该区域 CSS 定义的颜色。

判断是否存在 alpha 问题的一个好方法是将画布背景设置为鲜艳颜色，例如红色。你能立刻看到效果：

    <canvas style="background: red;"><canvas>

你也可以设置成黑色，黑色会掩盖任何 alpha 问题。

### #2) 告诉 WebGL 你不需要后缓冲区的 alpha

    gl = canvas.getContext("webgl", { alpha: false }};

这样它的行为更像 OpenGL，因为后缓冲区只会有 RGB。 这可能是最好的选择，因为优秀的浏览器能检测到你不需要 alpha， 从而优化 WebGL 的合成方式。 但这也意味着后缓冲区实际上没有 alpha，如果你确实依赖它可能会不适用。 我所知道的应用中很少使用后缓冲区 alpha。 从某种角度看，我认为这应该是默认行为。

### #3) 在渲染结束时清除 alpha 通道

    ..
    renderScene();
    ..
    // Set the backbuffer's alpha to 1.0 by
    // Setting the clear color to 1
    gl.clearColor(1, 1, 1, 1);

    // Telling WebGL to only affect the alpha channel
    gl.colorMask(false, false, false, true);

    // clear
    gl.clear(gl.COLOR_BUFFER_BIT);

清除操作通常非常快，因为大多数硬件对此有特殊优化。 我在许多早期 WebGL 示例中都这么做过。 如果聪明的话，应该用上面方法 #2。 也许我发完这条就去改。 大多数 WebGL 库也应该默认采用这种方法。 真正使用 alpha 进行合成效果的开发者可以主动开启。 其余人则能获得最佳性能和最少意外。


### #4) 清除 Alpha 通道一次，之后不再渲染到该通道

    // At init time. Clear the back buffer.
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Turn off rendering to alpha
    gl.colorMask(true, true, true, false);

当然如果你在渲染自定义的帧缓冲区时， 可能需要重新开启 alpha 渲染， 然后切回渲染画布时再关闭。

### #5) 处理带 alpha 的图片

默认情况下，加载带 alpha 的图片到 WebGL，WebGL 会提供文件中的原始颜色值， 且颜色值未做预乘。 这一般符合我对 OpenGL 程序的使用习惯， 因为未预乘是无损的，而预乘会有损失。

    1, 0.5, 0.5, 0  // RGBA

这是一个可能的未预乘值， 但预乘情况下不可能出现这种值， 因为 alpha = 0，r、g、b 必须都是 0。

加载图像时，如果需要，可以让 WebGL 对 Alpha 进行预乘。
你可以通过如下方式将 UNPACK_PREMULTIPLY_ALPHA_WEBGL 设置为 true 来实现。

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

默认情况下是不进行预乘的。

请注意，大多数（如果不是全部的话）Canvas 2D 实现都使用预乘 alpha。 这意味着当你将它们传输到 WebGL 并且 UNPACK_PREMULTIPLY_ALPHA_WEBGL 设置为 false 时，WebGL 会将它们转换回非预乘状态。

### #6) 使用与预乘 alpha 兼容的混合方程

我写过或参与过的几乎所有 OpenGL 应用， 默认都是这样设置混合函数。

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

这适用于非预乘 alpha 的纹理。

如果你确实想使用预乘 alpha 纹理，那么你可能需要使用以下设置

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

这些是我所知道的方法。如果你了解更多，请在下方分享。



