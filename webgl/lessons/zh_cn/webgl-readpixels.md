Title: WebGL2 readPixels
Description: readPixels 的详细信息
TOC: readPixels


在 WebGL 中，调用 `readPixels` 时需要传入一个 format/type（格式/类型）对。对于一个给定的纹理内部格式（附加到帧缓冲上的纹理），只有两种 format/type 组合是合法的。

来自规范的说明：

> 对于标准化的定点渲染表面，接受格式是 `RGBA` 和类型 `UNSIGNED_BYTE`的组合。  
> 对于有符号整数渲染表面，接受的格式是 `RGBA_INTEGER` 和类型 `INT`的组合。  
> 对于无符号整数渲染表面，接受的格式是 `RGBA_INTEGER` 和类型 `UNSIGNED_INT`的组合。

第二种组合是实现定义的  
<span style="color:red;">这很可能意味着，如果你想让你的代码具有可移植性，就不应该在 WebGL 中使用它</span>。  
你可以通过查询以下内容来查看当前实现所支持的 format/type 组合：

```js
// 假设已经绑定了一个附有要读取纹理的 framebuffer
const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

还需要注意，哪些纹理格式是 可渲染 的（即你可以将它们附加到 framebuffer 并对其进行渲染） 在某种程度上也是实现定义的。
WebGL2 列出了[许多格式](webgl-data-textures.html)，但其中有些是可选的（例如 `LUMINANCE`），
而有些则默认不可渲染，除非通过扩展启用（例如 `RGBA32F`）。

**下表是实时的**。你可能会注意到，它在不同的设备、操作系统、GPU 甚至浏览器上可能会给出不同的结果。
我在自己的机器上发现 Chrome 和 Firefox 在某些实现定义值上的表现是不同的。

<div class="webgl_center" data-diagram="formats"></div>
<script src="../resources/twgl-full.min.js"></script>
<script src="resources/webgl-readpixels.js"></script>
