Title: WebGL2 Framebuffers
Description: Что такое framebuffers в WebGL?
TOC: Framebuffers

Эта статья предназначена для того, чтобы дать вам мысленный образ
того, что такое framebuffer в WebGL. Framebuffers появляются,
когда они позволяют вам [рендерить в текстуру](webgl-render-to-texture.html).

Framebuffer это просто *коллекция attachments*. Вот и все! Он
используется для того, чтобы позволить рендеринг в текстуры и renderbuffers.

Вы можете думать об объекте Framebuffer так

```
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // attachments по attachment point
    this.drawBuffers = [gl.BACK, gl.NONE, gl.NONE, gl.NONE, ...];
    this.readBuffer = gl.BACK,
  }
}
```

И `WebGL2RenderingContext` (объект `gl`) так

```js
// псевдо код
gl = {
  drawFramebufferBinding: defaultFramebufferForCanvas,
  readFramebufferBinding: defaultFramebufferForCanvas,
}
```

Есть 2 binding points. Они устанавливаются так

```js
gl.bindFramebuffer(target, framebuffer) {
  framebuffer = framebuffer || defaultFramebufferForCanvas; // если null используем canvas
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

`DRAW_FRAMEBUFFER` binding используется при рисовании в framebuffer через `gl.clear`, `gl.draw???`, или `gl.blitFramebuffer`.
`READ_FRAMEBUFFER` binding используется при чтении из framebuffer через `gl.readPixels` или `gl.blitFramebuffer`.

Вы можете добавлять attachments к framebuffer через 3 функции, `framebufferTexture2D`,
`framebufferRenderbuffer`, и `framebufferTextureLayer`.

Мы можем представить их реализацию чем-то вроде

```js
// псевдо код
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

Вы можете установить массив drawing buffer с `gl.drawBuffers`, который мы можем
представить реализованным так

```js
// псевдо код
gl.drawBuffers(drawBuffers) {
  const framebuffer = this._getFramebufferByTarget(gl.DRAW_FRAMEBUFFER);
  for (let i = 0; i < maxDrawBuffers; ++i) {
    framebuffer.drawBuffers[i] = i < drawBuffers.length
        ? drawBuffers[i]
        : gl.NONE
  }
}
```

Массив drawBuffers определяет, рендерится ли в конкретный attachment или нет.
Допустимые значения либо `gl.NONE`, что означает *не рендерить в этот attachment*, либо
`gl.COLOR_ATTACHMENTx`, где `x` то же самое, что и индекс attachment. Еще одно
значение это `gl.BACK`, которое допустимо только когда `null` привязан к текущему framebuffer,
в этом случае `gl.BACK` означает 'рендерить в backbuffer (canvas)'

Вы можете установить read buffer с `gl.readBuffer`

```js
// псевдо код
gl.readBuffer(readBuffer) {
  const framebuffer = this._getFramebufferByTarget(gl.READ_FRAMEBUFFER);
  framebuffer.readBuffer = readBuffer;
}
```

readBuffer устанавливает, какой attachment читается при вызове `gl.readPixels`.

Важная часть в том, что *framebuffer* это просто простая коллекция attachments.
Сложности в ограничениях на то, чем могут быть эти attachments
и какие комбинации работают. Например, attachment с floating point текстурой
не может быть отрендерен по умолчанию. Расширения могут включить это, такие как
`EXT_color_buffer_float`. Аналогично, если есть
больше одного attachment, они все должны быть одинаковых размеров. 