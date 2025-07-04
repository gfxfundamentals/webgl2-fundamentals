Title: WebGL2 Пикинг (выбор объектов)
Description: Как выбирать объекты в WebGL
TOC: Пикинг (клик по объектам)

Эта статья о том, как использовать WebGL, чтобы позволить пользователю выбирать или выделять объекты.

Если вы читали другие статьи на этом сайте, вы, вероятно, уже поняли,
что сам WebGL — это просто библиотека растеризации. Он рисует треугольники,
линии и точки на canvas, поэтому у него нет понятия «объекты для выбора».
Он просто выводит пиксели через ваши шейдеры. Это значит,
что любая концепция «пикинга» должна реализовываться в вашем коде. Вы должны
определить, что это за объекты, которые пользователь может выбрать.
То есть, хотя эта статья может охватить общие концепции, вам нужно будет
самостоятельно решить, как применить их в вашем приложении.

## Клик по объекту

Один из самых простых способов определить, по какому объекту кликнул пользователь —
присвоить каждому объекту числовой id, затем отрисовать
все объекты, используя их id как цвет, без освещения
и текстур. Это даст нам изображение силуэтов
каждого объекта. Буфер глубины сам отсортирует объекты.
Затем мы можем считать цвет пикселя под мышью — это даст нам id объекта, который был отрисован в этой точке.

Чтобы реализовать этот метод, нам нужно объединить несколько предыдущих
статей. Первая — [о рисовании множества объектов](webgl-drawing-multiple-things.html),
потому что она показывает, как рисовать много объектов, которые мы и будем выбирать.

Обычно мы хотим рендерить эти id вне экрана —
[рендеря в текстуру](webgl-render-to-texture.html), так что добавим и этот код.

Начнем с последнего примера из
[статьи о рисовании множества объектов](webgl-drawing-multiple-things.html),
который рисует 200 объектов.

Добавим к нему framebuffer с прикреплённой текстурой и depth-буфером из
последнего примера в [статье о рендере в текстуру](webgl-render-to-texture.html).

```js
// Создаем текстуру для рендера
const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// создаем depth renderbuffer
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

function setFramebufferAttachmentSizes(width, height) {
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  // задаем размер и формат уровня 0
  const level = 0;
  const internalFormat = gl.RGBA;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border,
                format, type, data);

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
}

// Создаем и биндим framebuffer
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// прикрепляем текстуру как первый цветовой attachment
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const level = 0;
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

// создаем depth-буфер такого же размера, как targetTexture
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

Мы вынесли код установки размеров текстуры и depth renderbuffer в функцию, чтобы
можно было вызывать её при изменении размера canvas.

В рендер-цикле, если размер canvas изменился,
мы подгоним текстуру и renderbuffer под новые размеры.

```js
function drawScene(time) {
  time *= 0.0005;

-  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
+    // canvas изменился, подгоняем framebuffer attachments
+    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
+  }

...
```

Далее нам нужен второй шейдер. В примере используется рендер по цветам вершин, но нам нужен
шейдер, который будет рисовать сплошным цветом (id).
Вот наш второй шейдер:

```js
const pickingVS = `#version 300 es
  in vec4 a_position;
  
  uniform mat4 u_matrix;
  
  void main() {
    // Умножаем позицию на матрицу.
    gl_Position = u_matrix * a_position;
  }
`;

const pickingFS = `#version 300 es
  precision highp float;
  
  uniform vec4 u_id;

  out vec4 outColor;
  
  void main() {
     outColor = u_id;
  }
`;
```

И нам нужно скомпилировать, связать и найти локации
используя наши [хелперы](webgl-less-code-more-fun.html).

```js
// настройка GLSL программ
// важно: нам нужно, чтобы атрибуты совпадали между программами
// чтобы можно было использовать один и тот же vertex array для разных шейдеров
const options = {
  attribLocations: {
    a_position: 0,
    a_color: 1,
  },
};
const programInfo = twgl.createProgramInfo(gl, [vs, fs], options);
const pickingProgramInfo = twgl.createProgramInfo(gl, [pickingVS, pickingFS], options);
```

В отличие от большинства примеров на сайте, здесь нам нужно рисовать одни и те же данные двумя разными шейдерами.
Поэтому нам нужно, чтобы локации атрибутов совпадали между шейдерами. Это можно сделать двумя способами. Первый — явно указать их в GLSL:

```glsl
layout (location = 0) in vec4 a_position;
layout (location = 1) in vec4 a_color;
```

Второй — вызвать `gl.bindAttribLocation` **до** линковки программы:

```js
gl.bindAttribLocation(someProgram, 0, 'a_position');
gl.bindAttribLocation(someProgram, 1, 'a_color');
gl.linkProgram(someProgram);
```

Этот способ нечасто используется, но он более
[D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
Наша хелпер-библиотека вызывает `gl.bindAttribLocation` за нас,
если мы передаем имена атрибутов и нужные локации — это и происходит выше.

Это гарантирует, что атрибут `a_position` будет использовать локацию 0 в обеих программах, так что мы можем использовать один и тот же vertex array.

Далее нам нужно уметь рендерить все объекты дважды: сначала обычным шейдером, потом — только что написанным.
Вынесем код рендера всех объектов в функцию.

```js
function drawObjects(objectsToDraw, overrideProgramInfo) {
  objectsToDraw.forEach(function(object) {
    const programInfo = overrideProgramInfo || object.programInfo;
    const bufferInfo = object.bufferInfo;
    const vertexArray = object.vertexArray;

    gl.useProgram(programInfo.program);

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(vertexArray); 