Title: Визуализация камеры в WebGL2
Description: Как нарисовать frustum камеры
TOC: Визуализация камеры

Эта статья предполагает, что вы прочитали [статью про множественные виды](webgl-multiple-views.html).
Если вы её не читали, пожалуйста, [прочитайте сначала](webgl-multiple-views.html).

Также предполагается, что вы прочитали статью [меньше кода — больше веселья](webgl-less-code-more-fun.html),
так как здесь используется библиотека оттуда для упрощения примера. Если вы не понимаете,
что такое буферы, vertex arrays и атрибуты, или что означает функция `twgl.setUniforms`
для установки uniform-переменных и т.д., то стоит вернуться назад и
[прочитать основы](webgl-fundamentals.html).

Часто полезно визуализировать то, что видит камера — её "frustum". Это удивительно просто.
Как указано в статьях про [ортографическую](webgl-3d-orthographic.html) и [перспективную](webgl-3d-perspective.html) проекции,
эти матрицы проекции преобразуют некоторое пространство в коробку от -1 до +1 в clip space.
Кроме того, матрица камеры — это просто матрица, представляющая положение и ориентацию камеры в мировом пространстве.

Итак, первое, что должно быть очевидно: если мы просто используем матрицу камеры для рисования чего-то,
у нас будет объект, представляющий камеру. Сложность в том, что камера не может видеть себя,
но используя техники из [статьи про множественные виды](webgl-multiple-views.html), мы можем иметь 2 вида.
Мы будем использовать разные камеры в каждом виде. Второй вид будет смотреть на первый и сможет видеть
объект, который мы рисуем для представления камеры, используемой в другом виде.

Сначала создадим данные для представления камеры. Сделаем куб и добавим конус на конец.
Будем рисовать это линиями. Используем [индексы](webgl-indexed-vertices.html) для соединения вершин.

[Камеры](webgl-3d-camera.html) смотрят в направлении -Z, поэтому поместим куб и конус на положительную сторону
с конусом, открытым в сторону -Z.

Сначала линии куба:

```js
// создаём геометрию для камеры
function createCameraBufferInfo(gl) {
  // сначала добавим куб. Он идёт от 1 до 3,
  // потому что камеры смотрят вниз по -Z, поэтому мы хотим,
  // чтобы камера начиналась с Z = 0.
  const positions = [
    -1, -1,  1,  // вершины куба
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // индексы куба
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Затем добавим линии конуса:

```js
// создаём геометрию для камеры
function createCameraBufferInfo(gl) {
  // сначала добавим куб. Он идёт от 1 до 3,
  // потому что камеры смотрят вниз по -Z, поэтому мы хотим,
  // чтобы камера начиналась с Z = 0.
  // Поместим конус перед этим кубом, открытый
  // в сторону -Z
  const positions = [
    -1, -1,  1,  // вершины куба
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // вершина конуса
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // индексы куба
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // добавляем сегменты конуса
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3; 
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // линия от вершины к краю
    indices.push(coneTipIndex, coneBaseIndex + i);
    // линия от точки на краю к следующей точке на краю
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

И наконец добавим масштаб, потому что наша F высотой 150 единиц, а эта камера размером 2-3 единицы,
она будет крошечной рядом с нашей F. Мы можем масштабировать её, умножая на матрицу масштаба при рисовании,
или можем масштабировать сами данные здесь.

```js
function createCameraBufferInfo(gl, scale = 1) {
  // сначала добавим куб. Он идёт от 1 до 3,
  // потому что камеры смотрят вниз по -Z, поэтому мы хотим,
  // чтобы камера начиналась с Z = 0.
  // Поместим конус перед этим кубом, открытый
  // в сторону -Z
  const positions = [
    -1, -1,  1,  // вершины куба
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // вершина конуса
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // индексы куба
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // добавляем сегменты конуса
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3; 
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // линия от вершины к краю
    indices.push(coneTipIndex, coneBaseIndex + i);
    // линия от точки на краю к следующей точке на краю
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }
  positions.forEach((v, ndx) => {
    positions[ndx] *= scale;
  });
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Наша текущая программа шейдеров рисует с цветами вершин. Сделаем ещё одну, которая рисует сплошным цветом.

```js
const colorVS = `#version 300 es
in vec4 a_position;

uniform mat4 u_matrix;

void main() {
  // Умножаем позицию на матрицу.
  gl_Position = u_matrix * a_position;
}
`;

const colorFS = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
```

Теперь используем их для рисования одной сцены с камерой, смотрящей на другую сцену:

```js
// настройка GLSL программ
// компилирует шейдеры, линкует программу, находит локации
const vertexColorProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
const solidColorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS]);

// создаём буферы и заполняем данными для 3D 'F'
const fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
const fVAO = twgl.createVAOFromBufferInfo(gl, vertexColorProgramInfo, fBufferInfo);

const cameraScale = 20;
const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);
const cameraVAO = twgl.createVAOFromBufferInfo(
    gl, solidColorProgramInfo, cameraBufferInfo);

const settings = {
  rotation: 150,  // в градусах
  cam1FieldOfView: 60,  // в градусах
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
};


function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // разделим вид на 2 части
  const effectiveWidth = gl.canvas.clientWidth / 2;
  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // Вычисляем матрицу перспективной проекции
  const perspectiveProjectionMatrix =
      m4.perspective(degToRad(settings.cam1FieldOfView), aspect, near, far);

  // Вычисляем матрицу камеры используя look at.
  const cameraPosition = [
      settings.cam1PosX, 
      settings.cam1PosY,
      settings.cam1PosZ,
  ];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // центрируем 'F' вокруг её начала
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // рисуем слева с ортографической камерой
  gl.viewport(0, 0, leftWidth, height);
  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0.8, 0.8, 1);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

  // рисуем справа с перспективной камерой
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0.8, 0.8, 1, 1);

  // вычисляем вторую матрицу проекции и вторую камеру
  const perspectiveProjectionMatrix2 =
      m4.perspective(degToRad(60), aspect, near, far);

  // Вычисляем матрицу камеры используя look at.
  const cameraPosition2 = [-600, 400, -400];
  const target2 = [0, 0, 0];
  const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

  drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

  // рисуем объект для представления первой камеры
  {
    // Создаём view matrix из матрицы второй камеры.
    const viewMatrix = m4.inverse(cameraMatrix2);

    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
    // используем матрицу первой камеры как матрицу для позиционирования
    // представителя камеры в сцене
    mat = m4.multiply(mat, cameraMatrix);

    gl.useProgram(solidColorProgramInfo.program);

    // ------ Рисуем представление камеры --------

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(cameraVAO);

    // Устанавливаем uniforms
    twgl.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    // вызывает gl.drawArrays или gl.drawElements
    twgl.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);
  }
}
render();
```

И теперь мы можем видеть камеру, используемую для рендера левой сцены, в сцене справа.

{{{example url="../webgl-visualize-camera.html"}}}

Давайте также нарисуем что-то для представления frustum камеры.

Поскольку frustum представляет преобразование в clip space, мы можем сделать куб, представляющий clip space,
и использовать обратную матрицу проекции для размещения его в сцене.

Сначала нужен куб линий clip space:

```js
function createClipspaceCubeBufferInfo(gl) {
  // сначала добавим куб. Он идёт от 1 до 3,
  // потому что камеры смотрят вниз по -Z, поэтому мы хотим,
  // чтобы камера начиналась с Z = 0. Поместим
  // конус перед этим кубом, открытый
  // в сторону -Z
  const positions = [
    -1, -1, -1,  // вершины куба
     1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
    -1, -1,  1,
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // индексы куба
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Затем можем создать один и нарисовать его:

```js
const cameraScale = 20;
const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);
const cameraVAO = twgl.createVAOFromBufferInfo(
    gl, solidColorProgramInfo, cameraBufferInfo);

const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl);
const clipspaceCubeVAO = twgl.createVAOFromBufferInfo(
    gl, solidColorProgramInfo, clipspaceCubeBufferInfo);

  // рисуем объект для представления первой камеры
  {
    // Создаём view matrix из матрицы камеры.
    const viewMatrix = m4.inverse(cameraMatrix2);

    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
    // используем матрицу первой камеры как матрицу для позиционирования
    // представителя камеры в сцене
    mat = m4.multiply(mat, cameraMatrix);

    gl.useProgram(solidColorProgramInfo.program);

    // ------ Рисуем представление камеры --------

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(cameraVAO);

    // Устанавливаем uniforms
    twgl.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    // вызывает gl.drawArrays или gl.drawElements
    twgl.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);

    // ----- Рисуем frustum -------

    mat = m4.multiply(mat, m4.inverse(perspectiveProjectionMatrix));

    // Настраиваем все нужные атрибуты.
    gl.bindVertexArray(clipspaceCubeVAO);

    // Устанавливаем uniforms
    twgl.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    // вызывает gl.drawArrays или gl.drawElements
    twgl.drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES);
  }
}
```

Давайте также сделаем так, чтобы можно было настраивать near и far параметры первой камеры:

```js
const settings = {
  rotation: 150,  // в градусах
  cam1FieldOfView: 60,  // в градусах
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
  cam1Near: 30,
  cam1Far: 500,
};

...

  // Вычисляем матрицу перспективной проекции
  const perspectiveProjectionMatrix =
      m4.perspective(degToRad(settings.cam1FieldOfView),
      aspect,
      settings.cam1Near,
      settings.cam1Far);
```

и теперь мы можем видеть frustum тоже:

{{{example url="../webgl-visualize-camera-with-frustum.html"}}}

Если вы настроите near или far плоскости или поле зрения так, чтобы они обрезали F, вы увидите,
что представление frustum совпадает.

Будем ли мы использовать перспективную или ортографическую проекцию для камеры слева — это будет работать в любом случае,
потому что матрица проекции всегда преобразует в clip space, поэтому её обратная всегда возьмёт наш куб от +1 до -1
и исказит его соответствующим образом.

```js
const settings = {
  rotation: 150,  // в градусах
  cam1FieldOfView: 60,  // в градусах
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
  cam1Near: 30,
  cam1Far: 500,
  cam1Ortho: true,
  cam1OrthoUnits: 120,
};

...

// Вычисляем матрицу проекции
const perspectiveProjectionMatrix = settings.cam1Ortho
    ? m4.orthographic(
        -settings.cam1OrthoUnits * aspect,  // left
         settings.cam1OrthoUnits * aspect,  // right
        -settings.cam1OrthoUnits,           // bottom
         settings.cam1OrthoUnits,           // top
         settings.cam1Near,
         settings.cam1Far)
    : m4.perspective(degToRad(settings.cam1FieldOfView),
        aspect,
        settings.cam1Near,
        settings.cam1Far);
```

{{{example url="../webgl-visualize-camera-with-orthographic.html"}}} 