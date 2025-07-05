Title: WebGL2 Выбор объектов
Description: Как выбирать объекты в WebGL
TOC: Выбор объектов (клик по объектам)

Эта статья о том, как использовать WebGL для того, чтобы пользователь мог выбирать или выделять
объекты.

Если вы читали другие статьи на этом сайте, вы, надеюсь, поняли,
что WebGL сам по себе - это просто библиотека растеризации. Он рисует треугольники,
линии и точки на canvas, поэтому у него нет концепции "объектов для
выбора". Он просто выводит пиксели через шейдеры, которые вы предоставляете. Это означает,
что любая концепция "выбора" чего-либо должна исходить из вашего кода. Вам нужно
определить, что это за вещи, которые вы позволяете пользователю выбирать.
Это означает, что хотя эта статья может охватывать общие концепции, вам нужно будет
самостоятельно решить, как перевести то, что вы видите здесь, в применимые
концепции в вашем собственном приложении.

## Клик по объекту

Один из самых простых способов выяснить, на какую вещь кликнул пользователь, это
придумать числовой id для каждого объекта, затем мы можем нарисовать
все объекты, используя их id как цвет, без освещения
и без текстур. Это даст нам изображение силуэтов
каждого объекта. Буфер глубины будет обрабатывать сортировку за нас.
Затем мы можем прочитать цвет пикселя под
мышью, который даст нам id объекта, который был отрендерен там.

Для реализации этой техники нам нужно будет объединить несколько предыдущих
статей. Первая - это статья о [рисовании множественных объектов](webgl-drawing-multiple-things.html),
которую мы будем использовать, потому что, учитывая, что она рисует множество вещей, мы можем попытаться
выбрать их.

Помимо этого, мы обычно хотим рендерить эти id вне экрана,
[рендеря в текстуру](webgl-render-to-texture.html), поэтому мы
также добавим этот код.

Итак, давайте начнем с последнего примера из
[статьи о рисовании множественных вещей](webgl-drawing-multiple-things.html),
которая рисует 200 объектов.

К нему давайте добавим framebuffer с присоединенной текстурой и буфером глубины из
последнего примера в [статье о рендеринге в текстуру](webgl-render-to-texture.html).

```js
// Создаем текстуру для рендеринга
const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// создаем буфер глубины
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

function setFramebufferAttachmentSizes(width, height) {
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  // определяем размер и формат уровня 0
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

// Создаем и привязываем framebuffer
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// присоединяем текстуру как первое цветовое вложение
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const level = 0;
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

// делаем буфер глубины того же размера, что и targetTexture
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

Мы поместили код для установки размеров текстуры и
буфера глубины в функцию, чтобы мы могли
вызывать ее для изменения их размера в соответствии с размером
canvas.

В нашем коде рендеринга, если canvas изменяет размер,
мы скорректируем текстуру и renderbuffer, чтобы они соответствовали.

```js
function drawScene(time) {
  time *= 0.0005;

  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
    // canvas был изменен, делаем вложения framebuffer соответствующими
    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
  }

...
```

Далее нам нужен второй шейдер. Шейдер в
примере рендерит, используя цвета вершин, но нам нужен
тот, который мы можем установить в сплошной цвет для рендеринга с id.
Итак, сначала вот наш второй шейдер

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

И нам нужно скомпилировать, связать и найти местоположения,
используя наши [помощники](webgl-less-code-more-fun.html).

```js
// настройка GLSL программы
// примечание: нам нужны позиции атрибутов, чтобы соответствовать между программами
// чтобы нам нужен был только один vertex array на форму
const options = {
  attribLocations: {
    a_position: 0,
    a_color: 1,
  },
};
const programInfo = twgl.createProgramInfo(gl, [vs, fs], options);
const pickingProgramInfo = twgl.createProgramInfo(gl, [pickingVS, pickingFS], options);
```

Одно отличие выше от большинства примеров на этом сайте, это один
из немногих случаев, когда нам нужно было рисовать те же данные с 2 разными
шейдерами. Из-за этого нам нужны местоположения атрибутов, чтобы соответствовать
между шейдерами. Мы можем сделать это 2 способами. Один способ - установить их
вручную в GLSL

```glsl
layout (location = 0) in vec4 a_position;
layout (location = 1) in vec4 a_color;
```

Другой - вызвать `gl.bindAttribLocation` **до** связывания
шейдерной программы

```js
gl.bindAttribLocation(someProgram, 0, 'a_position');
gl.bindAttribLocation(someProgram, 1, 'a_color');
gl.linkProgram(someProgram);
```

Этот последний стиль необычен, но он более
[D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
Наша библиотека помощников вызовет `gl.bindAttribLocation` для нас,
если мы передадим имена атрибутов и местоположение, которое мы хотим,
что и происходит выше.

Это означает, что мы можем гарантировать, что атрибут `a_position` использует
местоположение 0 в обеих программах, поэтому мы можем использовать тот же vertex array
с обеими программами.

Далее нам нужно иметь возможность рендерить все объекты
дважды. Один раз с любым шейдером, который мы назначили
им, и снова с шейдером, который мы только что написали,
поэтому давайте извлечем код, который в настоящее время рендерит
все объекты в функцию.

```js
function drawObjects(objectsToDraw, overrideProgramInfo) {
  objectsToDraw.forEach(function(object) {
    const programInfo = overrideProgramInfo || object.programInfo;
    const bufferInfo = object.bufferInfo;
    const vertexArray = object.vertexArray;

    gl.useProgram(programInfo.program);

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(vertexArray);

    // Устанавливаем uniforms.
    twgl.setUniforms(programInfo, object.uniforms);

    // Рисуем (вызывает gl.drawArrays или gl.drawElements)
    twgl.drawBufferInfo(gl, object.bufferInfo);
  });
}
```

`drawObjects` принимает опциональный `overrideProgramInfo`,
который мы можем передать, чтобы использовать наш picking шейдер вместо
назначенного объекту шейдера.

Давайте вызовем его один раз, чтобы нарисовать в текстуру с
id, и снова, чтобы нарисовать сцену на canvas.

```js
// Рисуем сцену.
function drawScene(time) {
  time *= 0.0005;

  ...

  // Вычисляем матрицы для каждого объекта.
  objects.forEach(function(object) {
    object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time);
  });

+  // ------ Рисуем объекты в текстуру --------
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  gl.enable(gl.CULL_FACE);
+  gl.enable(gl.DEPTH_TEST);
+
+  // Очищаем canvas И буфер глубины.
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+
+  drawObjects(objectsToDraw, pickingProgramInfo);
+
+  // ------ Рисуем объекты на canvas

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  drawObjects(objectsToDraw);

  requestAnimationFrame(drawScene);
}
```

И с этим мы должны иметь возможность двигать мышью по
сцене, и объект под мышью будет мигать

{{{example url="../webgl-picking-w-gpu.html" }}}

Одна оптимизация, которую мы можем сделать, мы рендерим
id в текстуру того же размера,
что и canvas. Это концептуально самая простая
вещь для выполнения.

Но мы могли бы вместо этого просто рендерить пиксель
под мышью. Для этого мы используем усеченную пирамиду,
математика которой будет покрывать только пространство для этого
1 пикселя.

До сих пор для 3D мы использовали функцию под названием
`perspective`, которая принимает в качестве входных данных поле зрения, соотношение сторон и
ближнее и дальнее значения для z-плоскостей и создает
матрицу перспективной проекции, которая преобразует из
усеченной пирамиды, определенной этими значениями, в clip space.

Большинство 3D математических библиотек имеют другую функцию под названием
`frustum`, которая принимает 6 значений, левое, правое, верхнее,
и нижнее значения для ближней z-плоскости, а затем
z-ближнее и z-дальнее значения для z-плоскостей и генерирует
матрицу перспективы, определенную этими значениями.

Используя это, мы можем сгенерировать матрицу перспективы для
одного пикселя под мышью

Сначала мы вычисляем края и размер того, чем была бы наша ближняя плоскость,
если бы мы использовали функцию `perspective`

```js
// вычисляем прямоугольник, который покрывает ближняя плоскость нашей усеченной пирамиды
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const top = Math.tan(fieldOfViewRadians * 0.5) * near;
const bottom = -top;
const left = aspect * bottom;
const right = aspect * top;
const width = Math.abs(right - left);
const height = Math.abs(top - bottom);
```

Итак, `left`, `right`, `width` и `height` - это
размер и позиция ближней плоскости. Теперь на этой
плоскости мы можем вычислить размер и позицию
одного пикселя под мышью и передать это в
функцию `frustum` для генерации матрицы проекции,
которая покрывает только этот 1 пиксель

```js
// вычисляем часть ближней плоскости, которая покрывает 1 пиксель
// под мышью.
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

const subLeft = left + pixelX * width / gl.canvas.width;
const subBottom = bottom + pixelY * height / gl.canvas.height;
const subWidth = width / gl.canvas.width;
const subHeight = height / gl.canvas.height;

// делаем усеченную пирамиду для этого 1 пикселя
const projectionMatrix = m4.frustum(
    subLeft,
    subLeft + subWidth,
    subBottom,
    subBottom + subHeight,
    near,
    far);
```

Для использования этого нам нужно внести некоторые изменения. Как сейчас наш шейдер
просто принимает `u_matrix`, что означает, что для рисования с другой
матрицей проекции нам нужно будет пересчитывать матрицы для каждого объекта
дважды каждый кадр, один раз с нашей нормальной матрицей проекции для рисования
на canvas и снова для этой матрицы проекции 1 пикселя.

Мы можем убрать эту ответственность из JavaScript, переместив это
умножение в вершинные шейдеры.

```html
const vs = `#version 300 es

in vec4 a_position;
in vec4 a_color;

-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;

out vec4 v_color;

void main() {
  // Умножаем позицию на матрицу.
-  gl_Position = u_matrix * a_position;
+  gl_Position = u_viewProjection * u_world * a_position;

  // Передаем цвет в фрагментный шейдер.
  v_color = a_color;
}
`;

...

const pickingVS = `#version 300 es
  in vec4 a_position;
  
-  uniform mat4 u_matrix;
+  uniform mat4 u_viewProjection;
+  uniform mat4 u_world;
  
  void main() {
    // Умножаем позицию на матрицу.
-   gl_Position = u_matrix * a_position;
+    gl_Position = u_viewProjection * u_world * a_position;
  }
`;
```

Затем мы можем сделать наш JavaScript `viewProjectionMatrix` общим
среди всех объектов.

```js
const objectsToDraw = [];
const objects = [];
const viewProjectionMatrix = m4.identity();

// Создаем информацию для каждого объекта для каждого объекта.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
  const id = ii + 1;

  // выбираем форму
  const shape = shapes[rand(shapes.length) | 0];

  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_world: m4.identity(),
      u_viewProjection: viewProjectionMatrix,
      u_id: [
        ((id >>  0) & 0xFF) / 0xFF,
        ((id >>  8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF,
      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
  objects.push(object);

  // Добавляем его в список вещей для рисования.
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shape.bufferInfo,
    vertexArray: shape.vertexArray,
    uniforms: object.uniforms,
  });
}
```

И где мы вычисляем матрицы для каждого объекта, нам больше не нужно
включать матрицу проекции вида

```js
function computeMatrix(translation, xRotation, yRotation) {
  let matrix = m4.translation(
      translation[0],
      translation[1],
      translation[2]);
  matrix = m4.xRotate(matrix, xRotation);
  return m4.yRotate(matrix, yRotation);
}
```

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  drawObjects(objectsToDraw);

  requestAnimationFrame(drawScene);
}
```

Нашему picking шейдеру нужен `u_id`, установленный в id, поэтому давайте
добавим это к нашим данным uniform, где мы настраиваем наши объекты.

```js
// Создаем информацию для каждого объекта для каждого объекта.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
  const id = ii + 1;

  // выбираем форму
  const shape = shapes[rand(shapes.length) | 0];

  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
      u_id: [
        ((id >>  0) & 0xFF) / 0xFF,
        ((id >>  8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF,
      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
  objects.push(object);

  // Добавляем его в список вещей для рисования.
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shape.bufferInfo,
    vertexArray: shape.vertexArray,
    uniforms: object.uniforms,
  });
}
```

Это будет работать, потому что наша [библиотека помощников](webgl-less-code-more-fun.html)
обрабатывает применение uniforms для нас.

Нам пришлось разделить id по R, G, B и A. Потому что формат/тип нашей
текстуры - `gl.RGBA`, `gl.UNSIGNED_BYTE`,
мы получаем 8 бит на канал. 8 бит представляют только 256 значений,
но, разделив id по 4 каналам, мы получаем 32 бита всего,
что составляет > 4 миллиарда значений.

Мы добавляем 1 к id, потому что мы будем использовать 0 для обозначения
"ничего под мышью".

Теперь давайте выделим объект под мышью.

Сначала нам нужен код для получения позиции мыши относительно canvas.

```js
// mouseX и mouseY находятся в CSS display space относительно canvas
let mouseX = -1;
let mouseY = -1;

...

gl.canvas.addEventListener('mousemove', (e) => {
   const rect = canvas.getBoundingClientRect();
   mouseX = e.clientX - rect.left;
   mouseY = e.clientY - rect.top;
});
```

Обратите внимание, что с кодом выше `mouseX` и `mouseY`
находятся в CSS пикселях в display space. Это означает,
что они находятся в пространстве, где отображается canvas,
а не в пространстве того, сколько пикселей в canvas.
Другими словами, если у вас был canvas как этот

```html
<canvas width="11" height="22" style="width:33px; height:44px;"></canvas>
```

тогда `mouseX` будет идти от 0 до 33 по canvas и
`mouseY` будет идти от 0 до 44 по canvas. Смотрите [это](webgl-resizing-the-canvas.html)
для получения дополнительной информации.

Теперь, когда у нас есть позиция мыши, давайте добавим код
для поиска пикселя под мышью

```js
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
    pixelX,            // x
    pixelY,            // y
    1,                 // width
    1,                 // height
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // typed array to hold result
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
```

Код выше, который вычисляет `pixelX` и `pixelY`, преобразует
из `mouseX` и `mouseY` в display space в пиксели в пространстве canvas.
Другими словами, учитывая пример выше, где `mouseX` шел от
0 до 33 и `mouseY` шел от 0 до 44. `pixelX` будет идти от 0 до 11
и `pixelY` будет идти от 0 до 22.

В нашем фактическом коде мы используем нашу утилитную функцию `resizeCanvasToDisplaySize`
и мы делаем нашу текстуру того же размера, что и canvas, поэтому display
размер и размер canvas совпадают, но, по крайней мере, мы готовы к случаю,
когда они не совпадают.

Теперь, когда у нас есть id, чтобы фактически выделить выбранный объект,
давайте изменим цвет, который мы используем для его рендеринга на canvas.
Шейдер, который мы использовали, имеет uniform `u_colorMult`,
который мы можем использовать, поэтому если объект под мышью, мы найдем его,
сохраним его значение `u_colorMult`, заменим его цветом выделения,
и восстановим его.

```js
// mouseX и mouseY находятся в CSS display space относительно canvas
let mouseX = -1;
let mouseY = -1;
let oldPickNdx = -1;
let oldPickColor;
let frameCount = 0;

// Рисуем сцену.
function drawScene(time) {
  time *= 0.0005;
  ++frameCount;

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
```

Перед рендерингом id вне экрана мы устанавливаем матрицу проекции вида,
используя нашу матрицу проекции для 1 пикселя, а при рисовании на canvas
используем исходную матрицу проекции.

```js
// Вычисляем матрицу камеры с помощью lookAt.
const cameraPosition = [0, 0, 100];
const target = [0, 0, 0];
const up = [0, 1, 0];
const cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Создаём матрицу вида из матрицы камеры.
const viewMatrix = m4.inverse(cameraMatrix);

// Вычисляем матрицы для каждого объекта.
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});

// ------ Рисуем объекты в текстуру --------

// Определяем, какой пиксель под мышью, и настраиваем
// усечённую пирамиду для рендера только этого пикселя

{
  // вычисляем прямоугольник, который покрывает ближнюю плоскость нашей усечённой пирамиды
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const top = Math.tan(fieldOfViewRadians * 0.5) * near;
  const bottom = -top;
  const left = aspect * bottom;
  const right = aspect * top;
  const width = Math.abs(right - left);
  const height = Math.abs(top - bottom);

  // вычисляем часть ближней плоскости, которая покрывает 1 пиксель под мышью
  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

  const subLeft = left + pixelX * width / gl.canvas.width;
  const subBottom = bottom + pixelY * height / gl.canvas.height;
  const subWidth = width / gl.canvas.width;
  const subHeight = height / gl.canvas.height;

  // создаём усечённую пирамиду для этого 1 пикселя
  const projectionMatrix = m4.frustum(
      subLeft,
      subLeft + subWidth,
      subBottom,
      subBottom + subHeight,
      near,
      far);
  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
}

gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, 1, 1);

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

drawObjects(objectsToDraw, pickingProgramInfo);

// читаем 1 пиксель
const data = new Uint8Array(4);
gl.readPixels(
    0,                 // x
    0,                 // y
    1,                 // width
    1,                 // height
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // typed array to hold result
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

// восстанавливаем цвет объекта
if (oldPickNdx >= 0) {
  const object = objects[oldPickNdx];
  object.uniforms.u_colorMult = oldPickColor;
  oldPickNdx = -1;
}

// выделяем объект под мышью
if (id > 0) {
  const pickNdx = id - 1;
  oldPickNdx = pickNdx;
  const object = objects[pickNdx];
  oldPickColor = object.uniforms.u_colorMult;
  object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
}

// ------ Рисуем объекты на canvas

{
  // Вычисляем матрицу проекции
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, near, far);

  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
}

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

drawObjects(objectsToDraw);

requestAnimationFrame(drawScene);
}
```

Как видно, математика работает: мы рендерим только один пиксель
и всё равно определяем, что находится под мышью.

{{{example url="../webgl-picking-w-gpu-1pixel.html"}}}

Эта оптимизация может быть полезна, если у вас много объектов
и вы хотите минимизировать использование памяти. Вместо создания
текстуры размером с canvas, вы создаете текстуру размером 1x1 пиксель.

Но есть компромисс. Теперь мы должны вычислять усеченную пирамиду
для каждого пикселя, что может быть дороже, чем просто создание
большей текстуры. Это зависит от вашего случая использования.

Также обратите внимание, что мы больше не читаем пиксель из позиции
мыши. Мы читаем пиксель из позиции (0,0), потому что теперь мы
рендерим только 1 пиксель в позиции (0,0) нашей 1x1 текстуры.

Это одна из многих техник, которые вы можете использовать для выбора
объектов в WebGL. Другие включают:

1. **Ray casting** - бросание луча из позиции мыши в 3D пространство
2. **Bounding box/sphere testing** - проверка, находится ли точка внутри ограничивающего прямоугольника/сферы
3. **GPU picking** - то, что мы только что сделали
4. **Hierarchical picking** - выбор на основе иерархии объектов

Каждая техника имеет свои преимущества и недостатки в зависимости
от вашего случая использования.
