Title: WebGL2 Framebuffers
Description: What are framebuffers in WebGL?
TOC: Framebuffers

This article is meant to try to give you a mental image
of what a framebuffer is in WebGL. Framebuffers come up
as they allow you to [render to a texture](webgl-render-to-texture.html).

A Framebuffer is just a *collection of attachments*. That's it! It is
used to allow rendering to textures and renderbuffers.

You can think of a Framebuffer object like this

```
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // attachments by attachment point
    this.drawBuffers = [gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE, gl.NONE, ...];
    this.readBuffer = gl.COLOR_ATTACHMENT0,
  }
}
```

And the `WebGL2RenderingContext` (the `gl` object) like this

```js
// pseudo code
gl = {
  drawFramebufferBinding: defaultFramebufferForCanvas,
  readFramebufferBinding: defaultFramebufferForCanvas,
}
```

There are 2 binding points. They are set like this

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

You can add attachments to a framebuffer via 3 functions, `framebufferTexture2D`,
`framebufferRenderbuffer`, and `framebufferTextureLayer`.

We can imagine their implementation to be something like

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

You can set the drawing buffer array with `gl.drawBuffers` which we can
imagine is implemented like this

```js
// pseudo code
gl.drawBuffers(drawBuffers) {
  const framebuffer = this._getFramebufferByTarget(gl.DRAW_FRAMEBUFFER);
  for (let i = 0; i > maxDrawBuffers; ++i) {
    framebuffer.drawBuffers[i] = i < drawBuffers.length
        ? drawBuffers[i]
        : gl.NONE
  }
}
```

And you can set the read buffer with `gl.readBuffer`

```js
// pseudo code
gl.readBuffer(readBuffer) {
  const framebuffer = this._getFramebufferByTarget(gl.READ_FRAMEBUFFER);
  framebuffer.readBuffer = readBuffer;
}
```

The important part is a *framebuffer* is just a simple collection of attachments.
The complications are the restrictions on what those attachments
can be and the combinations that work. For example a floating point texture 
attachment can not be rendered to by default. Extensions can enable that like
`EXT_color_buffer_float`. Similarly if there is
more than one attachment they must all be the same dimensions.