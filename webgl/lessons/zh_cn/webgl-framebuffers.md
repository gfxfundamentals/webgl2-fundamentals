Title: WebGL2 帧缓冲区（Framebuffers）  
Description: WebGL 中的 帧缓冲区（Framebuffers） 是什么？  
TOC: 帧缓冲区（Framebuffers）

本文旨在帮助你建立对 WebGL 中 framebuffer 的一个直观理解。  
framebuffer 之所以重要，是因为它们允许你[渲染到纹理](webgl-render-to-texture.html)。

一个 `Framebuffer` 其实就是一个**附件的集合（attachments）**。就是这样！  
它的作用是让你可以将内容渲染到`纹理`或`渲染缓冲区`中。

你可以将一个 Framebuffer 对象想象成这样：

```
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // attachments by attachment point
    this.drawBuffers = [gl.BACK, gl.NONE, gl.NONE, gl.NONE, ...];
    this.readBuffer = gl.BACK,
  }
}
```

而 `WebGL2RenderingContext`（也就是 `gl` 对象）可以理解为如下结构：

```js
// pseudo code
gl = {
  drawFramebufferBinding: defaultFramebufferForCanvas,
  readFramebufferBinding: defaultFramebufferForCanvas,
}
```

这里有两个绑定点（binding point），设置方式如下：

```js
gl.bindFramebuffer(target, framebuffer) {
  framebuffer = framebuffer || defaultFramebufferForCanvas; // if null use canvas
  switch (target) {
    case: gl.DRAW_FRAMEBUFFER:
      this.drawFramebufferBinding = framebuffer;
      break;
    case: gl.READ_FRAMEBUFFER:
      this.readFramebufferBinding = framebuffer;
      break;
    case: gl.FRAMEBUFFER:
      this.drawFramebufferBinding = framebuffer;
      this.readFramebufferBinding = framebuffer;
      break;
    default:
      ... error ...
  }
}
```

`DRAW_FRAMEBUFFER`：用于向 `framebuffer` 绘制内容，如通过 `gl.clear`、`gl.draw???` 或 `gl.blitFramebuffer`。
`READ_FRAMEBUFFER`：用于从 `framebuffer` 中读取内容，如通过 `gl.readPixels` 或 `gl.blitFramebuffer`。

你可以通过三个函数向 framebuffer 添加附件，`framebufferTexture2D`、
`framebufferRenderbuffer` 和 `framebufferTextureLayer`。

它们的内部逻辑可以想象成如下实现：

```js
// pseudo code
gl._getFramebufferByTarget(target) {
  switch (target) {
    case gl.FRAMEBUFFER:
    case gl.DRAW_FRAMEBUFFER:
      return this.drawFramebufferBinding;
    case gl.READ_FRAMEBUFFER:
      return this.readFramebufferBinding;
  }
}
gl.framebufferTexture2D(target, attachmentPoint, texTarget, texture, mipLevel) {
  const framebuffer = this._getFramebufferByTarget(target);
  framebuffer.attachments.set(attachmentPoint, {
    texture, texTarget, mipLevel,
  });
}
gl.framebufferTextureLayer(target, attachmentPoint, texture, mipLevel, layer) {
  const framebuffer = this._getFramebufferByTarget(target);
  framebuffer.attachments.set(attachmentPoint, {
    texture, texTarget, mipLevel, layer
  });
}
gl.framebufferRenderbuffer(target, attachmentPoint, renderbufferTarget, renderbuffer) {
  const framebuffer = this._getFramebufferByTarget(target);
  framebuffer.attachments.set(attachmentPoint, {
    renderbufferTarget, renderbuffer
  });
}
```

你可以使用 `gl.drawBuffers` 设置 `framebuffer` 的绘制目标数组，其内部实现如下所示：


```js
// pseudo code
gl.drawBuffers(drawBuffers) {
  const framebuffer = this._getFramebufferByTarget(gl.DRAW_FRAMEBUFFER);
  for (let i = 0; i < maxDrawBuffers; ++i) {
    framebuffer.drawBuffers[i] = i < drawBuffers.length
        ? drawBuffers[i]
        : gl.NONE
  }
}
```

`drawBuffers` 数组决定了哪些附件会被渲染。

合法值包括：

* `gl.NONE`：不渲染到这个附件
* `gl.COLOR_ATTACHMENTx`：其中 `x` 和附件索引一样
* `gl.BACK`：仅在当前 `framebuffer` 为 `null` 时有效，表示渲染到默认 canvas 的 `backbuffer`

你还可以使用 `gl.readBuffer` 设置读缓冲：

```js
// pseudo code
gl.readBuffer(readBuffer) {
  const framebuffer = this._getFramebufferByTarget(gl.READ_FRAMEBUFFER);
  framebuffer.readBuffer = readBuffer;
}
```

readBuffer 决定在调用 `gl.readPixels` 时会从哪个附件读取。

重点总结：framebuffer 本质上只是一个附件的简单集合。
真正复杂的是这些附件之间的限制与兼容性。
例如：浮点纹理附件默认不能被渲染，除非通过扩展如 `EXT_color_buffer_float` 开启支持。
此外，如果 framebuffer 包含多个附件，它们必须具有相同的尺寸。

