Title: WebGL2 Framebuffers
Description: Que sont les framebuffers dans WebGL ?
TOC: Framebuffers

Cet article a pour but de vous donner une représentation mentale
de ce qu'est un framebuffer dans WebGL. Les framebuffers entrent en jeu
car ils permettent de [faire le rendu vers une texture](webgl-render-to-texture.html).

Un Framebuffer est juste une *collection de pièces jointes (attachments)*. C'est tout ! Il est
utilisé pour permettre le rendu vers des textures et des renderbuffers.

Vous pouvez penser à un objet Framebuffer comme ceci

```
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // attachments par point d'attache
    this.drawBuffers = [gl.BACK, gl.NONE, gl.NONE, gl.NONE, ...];
    this.readBuffer = gl.BACK,
  }
}
```

Et le `WebGL2RenderingContext` (l'objet `gl`) comme ceci

```js
// pseudo code
gl = {
  drawFramebufferBinding: defaultFramebufferForCanvas,
  readFramebufferBinding: defaultFramebufferForCanvas,
}
```

Il y a 2 points de liaison. Ils sont définis comme ceci

```js
gl.bindFramebuffer(target, framebuffer) {
  framebuffer = framebuffer || defaultFramebufferForCanvas; // si null, utiliser le canvas
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

Le point de liaison `DRAW_FRAMEBUFFER` est utilisé lors du dessin dans un framebuffer via `gl.clear`, `gl.draw???` ou `gl.blitFramebuffer`.
Le point de liaison `READ_FRAMEBUFFER` est utilisé lors de la lecture depuis un framebuffer via `gl.readPixels` ou `gl.blitFramebuffer`.

Vous pouvez ajouter des attachments à un framebuffer via 3 fonctions, `framebufferTexture2D`,
`framebufferRenderbuffer` et `framebufferTextureLayer`.

Nous pouvons imaginer leur implémentation comme quelque chose comme

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

Vous pouvez définir le tableau des buffers de dessin avec `gl.drawBuffers`, que nous pouvons
imaginer être implémenté comme ceci

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

Le tableau drawBuffers détermine si un attachment particulier reçoit le rendu ou non.
Les valeurs valides sont soit `gl.NONE` qui signifie *ne pas faire de rendu vers cet attachment*, soit
`gl.COLOR_ATTACHMENTx` où `x` est le même que l'index de l'attachment. Une autre
valeur est `gl.BACK` qui n'est valide que lorsque `null` est lié au framebuffer courant,
auquel cas `gl.BACK` signifie « faire le rendu vers le backbuffer (le canvas) ».

Vous pouvez définir le buffer de lecture avec `gl.readBuffer`

```js
// pseudo code
gl.readBuffer(readBuffer) {
  const framebuffer = this._getFramebufferByTarget(gl.READ_FRAMEBUFFER);
  framebuffer.readBuffer = readBuffer;
}
```

Le readBuffer définit quel attachment est lu lors de l'appel à `gl.readPixels`.

L'important est qu'un *framebuffer* est juste une simple collection d'attachments.
Les complications viennent des restrictions sur ce que ces attachments
peuvent être et les combinaisons qui fonctionnent. Par exemple, un attachment de texture flottante
ne peut pas recevoir de rendu par défaut. Des extensions peuvent l'activer comme
`EXT_color_buffer_float`. De même, s'il y a
plus d'un attachment, ils doivent tous avoir les mêmes dimensions.
