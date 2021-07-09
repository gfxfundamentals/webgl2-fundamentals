Title: WebGL2 Framebuffer
Description: WebGL의 framebuffer는 뭔가요?
TOC: Framebuffer


이 글은 WebGL에서 framebuffer가 무엇인지에 대한 대략적인 이미지를 제공할 겁니다.
Framebuffer는 [텍스처에 렌더링](webgl-render-to-texture.html)할 때 언급되는데요.

Framebuffer는 그냥 *attachment collection*입니다.
그게 전부에요!
텍스처와 renderbuffer로 렌더링하는데 사용되죠.

이런식으로 framebuffer 객체를 생각하실 수 있으며

```
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // attachment point별 attachment
    this.drawBuffers = [gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE, gl.NONE, ...];
    this.readBuffer = gl.COLOR_ATTACHMENT0,
  }
}
```

그리고 `WebGL2RenderingContext`(`gl` 객체)는 이렇게

```js
// 의사 코드
gl = {
  drawFramebufferBinding: defaultFramebufferForCanvas,
  readFramebufferBinding: defaultFramebufferForCanvas,
}
```

바인딩 포인트는 2개입니다.
이런식으로 설정되는데

```js
gl.bindFramebuffer(target, framebuffer) {
  framebuffer = framebuffer || defaultFramebufferForCanvas; // null이면 캔버스 사용
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

`framebufferTexture2D`, `framebufferRenderbuffer`, `framebufferTextureLayer`, 3개의 함수를 통해 attachment를 framebuffer에 추가할 수 있습니다.

구현이 이런식으로 되어 있을 것이라 상상할 수 있는데

```js
// 의사 코드
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

이렇게 구현되어 있을 것이라 상상할 수 있는 `gl.drawBuffers`로 drawing buffer 배열을 설정할 수 있는데

```js
// 의사 코드
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

중요한 건 *framebuffer*는 단순한 attachment 모음이라는 겁니다.
문제는 attachment가 될 수 있는 것들과 작동하는 조합에 대한 제한인데요.
예를 들어 floating point texture attachment는 기본적으로 렌더링될 수 없습니다.
extension은 `EXT_color_buffer_float`같은 걸 활성화할 수 있습니다.
마찬가지로 2개 이상의 attachment가 있다면 모두 동일한 넓이여야 합니다.

