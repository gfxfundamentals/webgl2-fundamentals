Title: WebGL2 Планарное и перспективное проекционное отображение
Description: Проецирование текстуры как плоскости
TOC: Планарное и перспективное проекционное отображение

В этой статье предполагается, что вы уже прочитали статью
[меньше кода — больше удовольствия](webgl-less-code-more-fun.html),
так как здесь используется упомянутая там библиотека для
упрощения примера. Если вы не понимаете, что такое буферы, вершинные массивы, атрибуты или
что значит функция `twgl.setUniforms`, как устанавливать uniforms и т.д.,
то вам стоит вернуться и [прочитать основы](webgl-fundamentals.html).

Также предполагается, что вы прочитали [статьи о перспективе](webgl-3d-perspective.html),
[статью о камерах](webgl-3d-camera.html), [статью о текстурах](webgl-3d-textures.html)
и [статью о визуализации камеры](webgl-visualizing-the-camera.html),
поэтому если вы их не читали, начните с них.

Проекционное отображение — это процесс «проецирования» изображения, как если бы вы
направили кинопроектор на экран и спроецировали на него фильм.
Кинопроектор проецирует перспективную плоскость. Чем дальше экран от проектора,
тем больше изображение. Если наклонить экран, чтобы он был не перпендикулярен проектору,
получится трапеция или произвольный четырёхугольник.

<div class="webgl_center"><img src="resources/perspective-projection.svg" style="width: 400px"></div>

Конечно, проекционное отображение не обязательно должно быть плоским. Существуют
цилиндрические, сферические и другие виды проекционного отображения.

Сначала рассмотрим планарное проекционное отображение. В этом случае
можно представить, что проектор такого же размера, как и экран,
поэтому изображение не увеличивается с удалением экрана от проектора, а остаётся одного размера.

<div class="webgl_center"><img src="resources/orthographic-projection.svg" style="width: 400px"></div>

Для начала создадим простую сцену с плоскостью и сферой.
Мы наложим на обе объекты простую 8x8 текстуру в виде шахматной доски.

Шейдеры похожи на те, что были в [статье о текстурах](webgl-3d-textures.html),
только матрицы разделены, чтобы не умножать их в JavaScript.

```js
const vs = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;

void main() {
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // Передаём текстурные координаты во фрагментный шейдер.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;
}
`;
```

Также я добавил uniform `u_colorMult`, чтобы умножать цвет текстуры.
Используя монохромную текстуру, мы можем менять её цвет таким образом.

```js
const fs = `#version 300 es
precision highp float;

// Передано из вершинного шейдера.
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;

out vec4 outColor;

void main() {
  // делим на w, чтобы получить правильное значение. См. статью о перспективе
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  float projectedAmount = inRange ? 1.0 : 0.0;
  outColor = mix(texColor, projectedTexColor, projectedAmount);
}
`;
```

Вот код для настройки программы, буферов сферы и плоскости:

```js
// настройка GLSL программы
// компиляция шейдеров, линковка программы, поиск локаций
const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // радиус
    12, // делений по кругу
    6,  // делений по высоте
);
const sphereVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, sphereBufferInfo);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // ширина
    20,  // высота
    1,   // делений по ширине
    1,   // делений по высоте
);
const planeVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, planeBufferInfo);
```

и код для создания 8x8 текстуры-шахматки
(см. [статью о data-текстурах](webgl-data-textures.html)):

```js
// создаём 8x8 текстуру-шахматку
const checkerboardTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip уровень
    gl.LUMINANCE,     // внутренний формат
    8,                // ширина
    8,                // высота
    0,                // граница
    gl.LUMINANCE,     // формат
    gl.UNSIGNED_BYTE, // тип
    new Uint8Array([  // данные
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
    ]));
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Для рендера создадим функцию, которая принимает матрицу проекции
и матрицу камеры, вычисляет view-матрицу из матрицы камеры,
а затем рисует сферу и плоскость:

```js
// Uniforms для каждого объекта.
const planeUniforms = {
  u_colorMult: [0.5, 0.5, 1, 1],  // светло-голубой
  u_texture: checkerboardTexture,
  u_world: m4.translation(0, 0, 0),
};
const sphereUniforms = {
  u_colorMult: [1, 0.5, 0.5, 1],  // розовый
  u_texture: checkerboardTexture,
  u_world: m4.translation(2, 3, 4),
};

function drawScene(projectionMatrix, cameraMatrix) {
  // Получаем view-матрицу из матрицы камеры.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(textureProgramInfo.program);

  // Устанавливаем uniforms, общие для сферы и плоскости
  twgl.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
  });

  // ------ Рисуем сферу --------

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(sphereVAO);

  // Устанавливаем uniforms, уникальные для сферы
  twgl.setUniforms(textureProgramInfo, sphereUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ Рисуем плоскость --------

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(planeVAO);

  // Устанавливаем uniforms, уникальные для плоскости
  twgl.setUniforms(textureProgramInfo, planeUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, planeBufferInfo);
}
```

Эту функцию можно вызывать из функции `render` примерно так:

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
};
const fieldOfViewRadians = degToRad(60);

function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // Говорим WebGL, как конвертировать из clip space в пиксели
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Очищаем canvas И буфер глубины.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Вычисляем матрицу проекции
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // Вычисляем матрицу камеры, используя look at.
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  drawScene(projectionMatrix, cameraMatrix);
}
render();
```

Теперь у нас есть простая сцена с плоскостью и сферой.
Я добавил несколько слайдеров, чтобы вы могли изменить позицию камеры
и лучше понять сцену.

{{{example url="../webgl-planar-projection-setup.html"}}}

Теперь давайте планарно спроецируем текстуру на сферу и плоскость.

Первое, что нужно сделать — [загрузить текстуру](webgl-3d-textures.html).

```js
function loadImageTexture(url) {
  // Создаём текстуру.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Заполняем текстуру 1x1 синим пикселем.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // Асинхронно загружаем изображение
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // Теперь, когда изображение загружено, копируем его в текстуру.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // предполагаем, что эта текстура имеет размер степени 2
    gl.generateMipmap(gl.TEXTURE_2D);
    render();
  });
  return texture;
}

const imageTexture = loadImageTexture('resources/f-texture.png');
```

Вспомним из [статьи о визуализации камеры](webgl-visualizing-the-camera.html),
мы создали куб от -1 до +1 и нарисовали его, чтобы представить усечённую пирамиду камеры.
Наши матрицы сделали так, что пространство внутри этой пирамиды представляет некоторую
область в форме усечённой пирамиды в мировом пространстве, которая преобразуется
из этого мирового пространства в clip space от -1 до +1. Мы можем сделать аналогичную вещь здесь.

Давайте попробуем. Сначала в нашем фрагментном шейдере мы будем рисовать спроецированную текстуру
везде, где её текстурные координаты находятся между 0.0 и 1.0.
За пределами этого диапазона мы будем использовать текстуру-шахматку.

```js
const fs = `#version 300 es
precision highp float;

// Передано из вершинного шейдера.
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;

out vec4 outColor;

void main() {
  // делим на w, чтобы получить правильное значение. См. статью о перспективе
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  float projectedAmount = inRange ? 1.0 : 0.0;
  outColor = mix(texColor, projectedTexColor, projectedAmount);
}
`;
```

Для вычисления спроецированных текстурных координат мы создадим
матрицу, которая представляет 3D пространство, ориентированное и позиционированное
в определённом направлении, точно так же, как камера из [статьи о визуализации камеры](webgl-visualizing-the-camera.html).
Затем мы спроецируем мировые позиции
вершин сферы и плоскости через это пространство. Там, где
они находятся между 0 и 1, код, который мы только что написали, покажет
текстуру.

Давайте добавим код в вершинный шейдер для проецирования мировых позиций
сферы и плоскости через это *пространство*.

```js
const vs = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;

void main() {
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // Передаём текстурные координаты во фрагментный шейдер.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;
}
`;
```

Теперь всё, что осталось — это фактически вычислить матрицу, которая
определяет это ориентированное пространство. Всё, что нам нужно сделать — это вычислить
мировую матрицу, как мы бы делали для любого другого объекта, а затем взять
её обратную. Это даст нам матрицу, которая позволяет нам ориентировать
мировые позиции других объектов относительно этого пространства.
Это точно то же самое, что делает матрица вида из
[статьи о камерах](webgl-3d-camera.html).

Мы будем использовать нашу функцию `lookAt`, которую мы создали в [той же статье](webgl-3d-camera.html).

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 3.5,
  posY: 4.4,
  posZ: 4.7,
  targetX: 0.8,
  targetY: 0,
  targetZ: 4.7,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // Получаем view-матрицу из матрицы камеры.
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // позиция
      [settings.targetX, settings.targetY, settings.targetZ], // цель
      [0, 1, 0],                                              // up
  );
  textureWorldMatrix = m4.scale(
      textureWorldMatrix,
      settings.projWidth, settings.projHeight, 1,
  );

  // используем обратную этой мировой матрицы, чтобы сделать
  // матрицу, которая будет преобразовывать другие позиции
  // относительно этого мирового пространства.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  // устанавливаем uniforms, которые одинаковы для сферы и плоскости
  twgl.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: imageTexture,
  });

  // ------ Рисуем сферу --------

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(sphereVAO);

  // Устанавливаем uniforms, уникальные для сферы
  twgl.setUniforms(textureProgramInfo, sphereUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ Рисуем плоскость --------

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(planeVAO);

  // Устанавливаем uniforms, уникальные для плоскости
  twgl.setUniforms(textureProgramInfo, planeUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, planeBufferInfo);

  // ------ Рисуем каркасный куб --------

  gl.useProgram(colorProgramInfo.program);

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(cubeLinesVAO);

  // Устанавливаем uniforms для каркасного куба
  twgl.setUniforms(colorProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_world: textureWorldMatrix,
    u_color: [1, 1, 1, 1],  // белый
  });

  // Рисуем линии
  gl.drawElements(gl.LINES, cubeLinesBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}
```

Конечно, вам не обязательно использовать `lookAt`. Вы можете создать
мировую матрицу любым выбранным способом, например, используя
[граф сцены](webgl-scene-graph.html) или [стек матриц](webgl-2d-matrix-stack.html).

Перед тем как запустить, давайте добавим какой-то масштаб.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 3.5,
  posY: 4.4,
  posZ: 4.7,
  targetX: 0.8,
  targetY: 0,
  targetZ: 4.7,
  projWidth: 2,
  projHeight: 2,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // Получаем view-матрицу из матрицы камеры.
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // позиция
      [settings.targetX, settings.targetY, settings.targetZ], // цель
      [0, 1, 0],                                              // up
  );
  textureWorldMatrix = m4.scale(
      textureWorldMatrix,
      settings.projWidth, settings.projHeight, 1,
  );

  // используем обратную этой мировой матрицы, чтобы сделать
  // матрицу, которая будет преобразовывать другие позиции
  // относительно этого мирового пространства.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  ...
}
```

И с этим мы получаем спроецированную текстуру.

{{{example url="../webgl-planar-projection.html"}}}

Я думаю, может быть трудно увидеть пространство, в котором находится текстура.
Давайте добавим каркасный куб для визуализации.

Сначала нам нужен отдельный набор шейдеров. Эти шейдеры
могут просто рисовать сплошной цвет, без текстур.

```js
const colorVS = `#version 300 es
in vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
  // Умножаем позицию на матрицы.
  gl_Position = u_projection * u_view * u_world * a_position;
}
`;
```

```js
const colorFS = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
```

Затем нам нужно скомпилировать и связать эти шейдеры тоже.

```js
// настройка GLSL программ
const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS]);
```

И нам нужны данные для рисования куба из линий.

```js
const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // радиус
    12, // делений по кругу
    6,  // делений по высоте
);
const sphereVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, sphereBufferInfo);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // ширина
    20,  // высота
    1,   // делений по ширине
    1,   // делений по высоте
);
const planeVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, planeBufferInfo);
```

Теперь давайте создадим данные для каркасного куба.

```js
// Создаём данные для каркасного куба
const cubeLinesBufferInfo = twgl.createBufferInfoFromArrays(gl, {
  position: {
    numComponents: 3,
    data: [
      // передняя грань
      -1, -1,  1,
       1, -1,  1,
       1,  1,  1,
      -1,  1,  1,
      // задняя грань
      -1, -1, -1,
       1, -1, -1,
       1,  1, -1,
      -1,  1, -1,
    ],
  },
  indices: {
    numComponents: 2,
    data: [
      // передняя грань
      0, 1,  1, 2,  2, 3,  3, 0,
      // задняя грань
      4, 5,  5, 6,  6, 7,  7, 4,
      // соединяющие линии
      0, 4,  1, 5,  2, 6,  3, 7,
    ],
  },
});
const cubeLinesVAO = twgl.createVAOFromBufferInfo(
    gl, colorProgramInfo, cubeLinesBufferInfo);
```

Теперь давайте добавим код для рисования каркасного куба в нашу функцию `drawScene`.

```js
function drawScene(projectionMatrix, cameraMatrix) {
  // Получаем view-матрицу из матрицы камеры.
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // позиция
      [settings.targetX, settings.targetY, settings.targetZ], // цель
      [0, 1, 0],                                              // up
  );
  textureWorldMatrix = m4.scale(
      textureWorldMatrix,
      settings.projWidth, settings.projHeight, 1,
  );

  // используем обратную этой мировой матрицы, чтобы сделать
  // матрицу, которая будет преобразовывать другие позиции
  // относительно этого мирового пространства.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  // устанавливаем uniforms, которые одинаковы для сферы и плоскости
  twgl.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: imageTexture,
  });

  // ------ Рисуем сферу --------

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(sphereVAO);

  // Устанавливаем uniforms, уникальные для сферы
  twgl.setUniforms(textureProgramInfo, sphereUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ Рисуем плоскость --------

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(planeVAO);

  // Устанавливаем uniforms, уникальные для плоскости
  twgl.setUniforms(textureProgramInfo, planeUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, planeBufferInfo);

  // ------ Рисуем каркасный куб --------

  gl.useProgram(colorProgramInfo.program);

  // Настраиваем все нужные атрибуты.
  gl.bindVertexArray(cubeLinesVAO);

  // Устанавливаем uniforms для каркасного куба
  twgl.setUniforms(colorProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_world: textureWorldMatrix,
    u_color: [1, 1, 1, 1],  // белый
  });

  // Рисуем линии
  gl.drawElements(gl.LINES, cubeLinesBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}
```

И с этим мы получаем каркасный куб, который показывает пространство проекции.

{{{example url="../webgl-planar-projection-with-lines.html"}}}

Теперь вы можете видеть каркасный куб, который показывает, где проецируется текстура.
Вы можете изменить настройки, чтобы переместить проектор и изменить его ориентацию.

Это планарное проекционное отображение. Текстура проецируется как плоскость.
Если вы хотите перспективное проекционное отображение, где текстура увеличивается
с расстоянием, вам нужно будет изменить матрицу проекции.

Для перспективного проекционного отображения вы можете использовать
матрицу перспективы вместо ортографической матрицы в `u_textureMatrix`.
Это создаст эффект, где текстура увеличивается с расстоянием от проектора,
точно так же, как настоящий кинопроектор.

Проекционное отображение — это мощная техника для создания
реалистичных эффектов, таких как проецирование изображений на стены,
создание голографических эффектов или добавление динамического освещения
к статическим объектам.
