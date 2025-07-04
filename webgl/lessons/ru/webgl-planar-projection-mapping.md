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

out vec2 v_texcoord;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;

  // Передаём текстурные координаты во фрагментный шейдер.
  v_texcoord = a_texcoord;
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

uniform vec4 u_colorMult;
uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_texcoord) * u_colorMult;
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