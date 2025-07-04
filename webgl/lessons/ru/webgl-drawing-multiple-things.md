Title: WebGL2 - Рисование множественных объектов
Description: Как рисовать множество различных типов объектов в WebGL
TOC: Рисование множественных объектов


Эта статья является продолжением [предыдущих статей о WebGL](webgl-fundamentals.html).
Если вы их не читали, я предлагаю начать оттуда.

Один из самых распространенных вопросов после того, как что-то впервые заработало в WebGL, это как
рисовать множество объектов.

Первое, что нужно понять, это то, что с немногими исключениями, WebGL похож на функцию,
которую кто-то написал, где вместо передачи множества параметров в функцию у вас вместо этого
есть одна функция, которая рисует вещи, и 70+ функций, которые настраивают состояние для
этой одной функции. Так, например, представьте, что у вас есть функция, которая рисует круг. Вы
могли бы запрограммировать её так

    function drawCircle(centerX, centerY, radius, color) { ... }

Или вы могли бы закодировать её так

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL работает вторым способом. Функции типа `gl.createBuffer`, `gl.bufferData`, `gl.createTexture`,
и `gl.texImage2D` позволяют вам загружать данные в буферы (данные вершин) и данные в текстуры (цвет, и т.д.).
`gl.createProgram`, `gl.createShader`, `gl.compileShader`, и `gl.linkProgram` позволяют вам создавать
ваши GLSL шейдеры. Почти все остальные функции WebGL настраивают эти глобальные
переменные или *состояние*, которое используется когда `gl.drawArrays` или `gl.drawElements` наконец вызывается.

Зная это, типичная программа WebGL в основном следует этой структуре

Во время инициализации

*   создать все шейдеры и программы и найти местоположения
*   создать буферы и загрузить данные вершин
*   создать vertex array для каждой вещи, которую вы хотите нарисовать
    *   для каждого атрибута вызвать `gl.bindBuffer`, `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`
    *   привязать любые индексы к `gl.ELEMENT_ARRAY_BUFFER`
*   создать текстуры и загрузить данные текстур

Во время рендеринга

*   очистить и установить viewport и другое глобальное состояние (включить depth testing, включить culling, и т.д.)
*   Для каждой вещи, которую вы хотите нарисовать
    *   вызвать `gl.useProgram` для нужной программы для рисования.
    *   привязать vertex array для этой вещи.
        *   вызвать `gl.bindVertexArray`
    *   настроить uniforms для вещи, которую вы хотите нарисовать
        *   вызвать `gl.uniformXXX` для каждого uniform
        *   вызвать `gl.activeTexture` и `gl.bindTexture` чтобы назначить текстуры texture units.
    *   вызвать `gl.drawArrays` или `gl.drawElements`

Вот и все. Вам решать, как организовать ваш код для выполнения этой задачи.

Некоторые вещи, такие как загрузка данных текстур (и возможно даже данных вершин), могут происходить асинхронно, потому что
вам нужно ждать, пока они загрузятся по сети.

Давайте сделаем простое приложение для рисования 3 вещей. Куб, сферу и конус.

Я не буду вдаваться в детали того, как вычислять данные куба, сферы и конуса. Давайте просто
предположим, что у нас есть функции для их создания, и они возвращают [объекты bufferInfo, как описано в
предыдущей статье](webgl-less-code-more-fun.html).

Итак, вот код. Наш шейдер тот же простой шейдер из нашего [примера с перспективой](webgl-3d-perspective.html),
кроме того, что мы добавили `u_colorMult` чтобы умножать цвета вершин.

    #version 300 es
    precision highp float;

    // Передается из вершинного шейдера.
    in vec4 v_color;

    uniform vec4 u_colorMult;

    out vec4 outColor;

    void main() {
    *   outColor = v_color * u_colorMult;
    }


Во время инициализации

    // Наши uniforms для каждой вещи, которую мы хотим нарисовать
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // Перевод для каждого объекта.
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

Во время рисования

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ Рисуем сферу --------

    gl.useProgram(programInfo.program);

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(sphereVAO);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // Устанавливаем uniforms, которые мы только что вычислили
    twgl.setUniforms(programInfo, sphereUniforms);

    twgl.drawBufferInfo(gl, sphereBufferInfo);

    // ------ Рисуем куб --------

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(cubeVAO);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // Устанавливаем uniforms, которые мы только что вычислили
    twgl.setUniforms(programInfo, cubeUniforms);

    twgl.drawBufferInfo(gl, cubeBufferInfo);

    // ------ Рисуем конус --------

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(coneVAO);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // Устанавливаем uniforms, которые мы только что вычислили
    twgl.setUniforms(programInfo, coneUniforms);

    twgl.drawBufferInfo(gl, coneBufferInfo);

И вот это

{{{example url="../webgl-multiple-objects-manual.html" }}}

Одна вещь, которую нужно заметить, это то, что поскольку у нас только одна программа шейдера, мы вызвали `gl.useProgram`
только один раз. Если бы у нас были разные программы шейдеров, вам нужно было бы вызвать `gl.useProgram` перед... эм...
использованием каждой программы.

Это еще одно место, где хорошо упростить. Есть эффективно 4 основные вещи для комбинирования.

1.  Программа шейдера (и её информация о uniforms и атрибутах)
2.  Vertex array (который содержит настройки атрибутов)
3.  Uniforms, нужные для рисования этой вещи с данным шейдером.
4.  Количество для передачи в gl.drawXXX и вызывать ли gl.drawArrays или gl.drawElements

Итак, простое упрощение было бы сделать массив вещей для рисования и в этом массиве
поместить 4 вещи вместе

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        vertexArray: sphereVAO,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: cubeVAO,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        vertexArray: coneVAO,
        uniforms: coneUniforms,
      },
    ];

Во время рисования нам все еще нужно обновлять матрицы

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // Вычисляем матрицы для каждого объекта.
    sphereUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

Но код рисования теперь просто простой цикл

    // ------ Рисуем объекты --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;

      gl.useProgram(programInfo.program);

      // Настраиваем все нужные атрибуты.
      gl.bindVertexArray(object.vertexArray);

      // Устанавливаем uniforms.
      twgl.setUniforms(programInfo, object.uniforms);

      // Рисуем
      twgl.drawBufferInfo(gl, bufferInfo);
    });


И это, возможно, основной цикл рендеринга большинства 3D движков в существовании. Где-то
какой-то код или коды решают, что попадает в список `objectsToDraw`, и количество
вариантов, которые им нужно, может быть больше, но большинство из них отделяют вычисление того, что
попадает в этот список, от фактического вызова функций `gl.draw___`.

{{{example url="../webgl-multiple-objects-list.html" }}}

В общем, считается *лучшей практикой* не вызывать WebGL избыточно.
Другими словами, если какое-то состояние WebGL уже установлено в то, что вам нужно, чтобы оно
было установлено, то не устанавливайте его снова. В этом духе мы могли бы проверить, если
программа шейдера, которая нам нужна для рисования текущего объекта, та же программа шейдера,
что и предыдущий объект, то нет необходимости вызывать `gl.useProgram`. Аналогично,
если мы рисуем той же формой/геометрией/вершинами, нет необходимости вызывать
`gl.bindVertexArray`

Итак, очень простая оптимизация может выглядеть так

```js
var lastUsedProgramInfo = null;
var lastUsedVertexArray = null;

objectsToDraw.forEach(function(object) {
  var programInfo = object.programInfo;
  var vertexArray = object.vertexArray;

  if (programInfo !== lastUsedProgramInfo) {
    lastUsedProgramInfo = programInfo;
    gl.useProgram(programInfo.program);
  }

  // Настраиваем все нужные атрибуты.
  if (lastUsedVertexArray !== vertexArray) {
    lastUsedVertexArray = vertexArray;
    gl.bindVertexArray(vertexArray);
  }

  // Устанавливаем uniforms.
  twgl.setUniforms(programInfo, object.uniforms);

  // Рисуем
  twgl.drawBufferInfo(gl, object.bufferInfo);
});
```

На этот раз давайте нарисуем намного больше объектов. Вместо просто 3 как раньше давайте сделаем
список вещей для рисования больше

```js
// помещаем формы в массив, чтобы легко выбирать их случайно
var shapes = [
  { bufferInfo: sphereBufferInfo, vertexArray: sphereVAO, },
  { bufferInfo: cubeBufferInfo,   vertexArray: cubeVAO, },
  { bufferInfo: coneBufferInfo,   vertexArray: coneVAO, },
];

var objectsToDraw = [];
var objects = [];

// Создаем информацию для каждого объекта для каждого объекта.
var baseHue = rand(360);
var numObjects = 200;
for (var ii = 0; ii < numObjects; ++ii) {
  // выбираем форму
  var shape = shapes[rand(shapes.length) | 0];

  // создаем объект.
  var object = {
    uniforms: {
      u_colorMult: chroma.hsv(emod(baseHue + rand(120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
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

Во время рендеринга

```js
// Вычисляем матрицы для каждого объекта.
objects.forEach(function(object) {
  object.uniforms.u_matrix = computeMatrix(
      viewProjectionMatrix,
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});
```

Затем рисуем объекты используя цикл выше.

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

> Примечание: Я изначально вырезал раздел выше из этой версии статьи WebGL2.
> [Оригинальная версия WebGL1 этой статьи](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html) имела раздел об оптимизации. Причина, по которой я вырезал её,
> в том, что с vertex array objects я не так уверен, что оптимизации имеют большое значение.
> В WebGL1 без vertex arrays, рисование одного объекта часто требует
> 9 до 16 вызовов для настройки атрибутов для рисования объекта. В WebGL2 все это
> происходит во время инициализации путем настройки vertex array для каждого объекта, а затем во время рендеринга
> это один вызов `gl.bindVertexArray` для каждого объекта.
>
> Кроме того, в общем, большинство приложений WebGL не достигают предела рисования. Им
> нужно работать на множестве машин, от каких-то 8-летних низкоуровневых Intel
> интегрированных графических GPU до каких-то топовых машин. Оптимизации, упомянутые
> в разделе выше, вряд ли сделают разницу между производительными
> и не производительными. Скорее, для получения производительности требуется уменьшение количества
> вызовов рисования, например, используя [инстансинг](webgl-instanced-drawing.html) и
> другие подобные техники.
>
> Причина, по которой я добавил раздел обратно, в том, что было указано
> в отчете об ошибке, что последний пример, рисование 200 объектов, упоминается
> в [статье о пикинге](webgl-picking.html). 😅

## Рисование прозрачных вещей и множественных списков

В примере выше есть только один список для рисования. Это работает, потому что все объекты
непрозрачные. Если мы хотим рисовать прозрачные объекты, они должны быть нарисованы сзади вперед
с самыми дальними объектами, нарисованными первыми. С другой стороны, для скорости, для непрозрачных
объектов мы хотим рисовать спереди назад, это потому что DEPTH_TEST означает, что GPU
не будет выполнять наш фрагментный шейдер для любых пикселей, которые были бы позади других вещей.
поэтому мы хотим нарисовать вещи спереди первыми.

Большинство 3D движков обрабатывает это, имея 2 или более списков объектов для рисования. Один список для непрозрачных вещей.
Другой список для прозрачных вещей. Непрозрачный список сортируется спереди назад.
Прозрачный список сортируется сзади вперед. Также могут быть отдельные списки для других
вещей, таких как оверлеи или эффекты постобработки.

## Рассмотрите использование библиотеки

Важно заметить, что вы не можете рисовать любую геометрию любым шейдером.
Например, шейдер, который требует нормали, не будет работать с геометрией, у которой нет
нормалей. Аналогично, шейдер, который требует текстуры, не будет работать без текстур.

Это одна из многих причин, почему здорово выбрать 3D библиотеку, такую как [Three.js](https://threejs.org),
потому что она обрабатывает все это за вас. Вы создаете некоторую геометрию, вы говорите three.js, как вы хотите её
рендерить, и она генерирует шейдеры во время выполнения для обработки вещей, которые вам нужны. Практически все 3D движки
делают это от Unity3D до Unreal до Source до Crytek. Некоторые генерируют их офлайн, но важная
вещь для понимания в том, что они *генерируют* шейдеры.

Конечно, причина, по которой вы читаете эти статьи, в том, что вы хотите знать, что происходит глубоко внутри.
Это здорово и весело писать все самостоятельно. Просто важно осознавать, что
[WebGL супер низкоуровневый](webgl-2d-vs-3d-library.html),
поэтому есть тонна работы для вас, если вы хотите сделать это самостоятельно, и это часто включает
написание генератора шейдеров, поскольку разные функции часто требуют разных шейдеров.

Вы заметите, что я не поместил `computeMatrix` внутрь цикла. Это потому что рендеринг должен
возможно быть отделен от вычисления матриц. Обычно вычисляют матрицы из
[scene graph, и мы рассмотрим это в другой статье](webgl-scene-graph.html).

Теперь, когда у нас есть фреймворк для рисования множественных объектов, [давайте нарисуем немного текста](webgl-text-html.html). 