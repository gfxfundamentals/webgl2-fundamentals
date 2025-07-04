Title: Эффект Дросте в WebGL
Description: Эффект Дросте в WebGL
TOC: Эффект Дросте в WebGL

## Вопрос:

Я пытаюсь использовать WebGL для создания [эффекта Дросте](https://en.wikipedia.org/wiki/Droste_effect) на гранях куба. В viewport'е один меш — куб, и все его грани используют одну текстуру. Для создания эффекта Дросте я обновляю текстуру на каждом кадре, делая снимок `canvas`, в WebGL-контекст которого рисую, что со временем даёт эффект Дросте, так как снимок содержит всё больше и больше вложенных прошлых кадров.

Демо того, что у меня сейчас работает, здесь:

https://tomashubelbauer.github.io/webgl-op-1/?cubeTextured

Код выглядит так:

```
// Set up fragment and vertex shader and attach them to a program, link the program
// Create a vertex buffer, an index buffer and a texture coordinate buffer
// Tesselate the cube's vertices and fill in the index and texture coordinate buffers
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 256;
textureCanvas.height = 256;
const textureContext = textureCanvas.getContext('2d');

// In every `requestAnimationFrame`:
textureContext.drawImage(context.canvas, 0, 0);
const texture = context.createTexture();
context.bindTexture(context.TEXTURE_2D, texture);
context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, textureCanvas);
context.generateMipmap(context.TEXTURE_2D);
// Clear the viewport completely (depth and color buffers)
// Set up attribute and uniform values, the projection and model view matrices
context.activeTexture(context.TEXTURE0);
context.bindTexture(context.TEXTURE_2D, texture);
context.uniform1i(fragmentShaderTextureSamplerUniformLocation, 0);
context.drawElements(context.TRIANGLES, 36, context.UNSIGNED_SHORT, 0)
```

Это основная часть. Есть отдельный canvas от WebGL, на который рисуется WebGL canvas перед каждым WebGL кадром, и этот canvas используется для создания текстуры для данного кадра, которая применяется к граням куба согласно буферу координат текстуры и uniform'у сэмплера текстуры, переданному во фрагментный шейдер, который просто использует `gl_FragColor = texture2D(textureSampler, textureCoordinate)`, как и ожидается.

Но это очень медленно (30 FPS на этом простом демо с одним кубом, тогда как все мои другие демо с порядком больше треугольников всё ещё держат 60 FPS `requestAnimationFrame`).

Также странно делать это "вне" WebGL, используя внешний canvas, когда кажется, что это должно быть достижимо только с помощью WebGL.

Я знаю, что WebGL держит два буфера — один для активного кадра и back buffer для недавно нарисованного кадра, и они меняются местами с каждым кадром для мгновенного обновления экрана. Можно ли получить доступ к этому back buffer и использовать его как текстуру? Можете ли вы предоставить пример кода, как это сделать?

## Ответ:

Из [этой статьи](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html)

Обычный способ — рендерить в текстуру, прикрепив её к framebuffer.

```
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 /* level */) 
```

Теперь для рендеринга в текстуру:

```
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, textureWidth, textureHeight);
```

Для рендеринга в canvas:

```
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
```

Для того, что вы хотите, нужны 2 текстуры, поскольку нельзя одновременно читать из и писать в одну текстуру, так что вы рисуете:

* Рисуете изображение в TextureA
* Рисуете предыдущий кадр (TextureB) в TextureA
* Рисуете куб с TextureA в TextureB
* Рисуете TextureB в Canvas

{{{example url="../webgl-qna-webgl-droste-effect-example-1.html"}}}

Что касается canvas и его 2 буферов — нет, нельзя напрямую использовать их как текстуры. Можно вызвать `gl.copyTexImage2D` или `gl.copyTexSubImage2D` для копирования части canvas в текстуру, так что это другое решение. Оно менее гибкое и, думаю, медленнее, чем метод framebuffer.

<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 4.0 у
    <a data-href="http://hubelbauer.net/">Tomáš Hübelbauer</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/56841018">stackoverflow</a>
  </div>
</div> 