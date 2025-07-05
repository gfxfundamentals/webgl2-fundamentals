Title: WebGL2 Оптимизация — Инстансинг (Instanced Drawing)
Description: Рисование нескольких экземпляров одного объекта
TOC: Инстансинг (Instanced Drawing)

В WebGL есть возможность, называемая *инстансинг* (instanced drawing).
Это способ нарисовать несколько одинаковых объектов быстрее, чем рисовать каждый по отдельности.

Для начала сделаем пример, который рисует несколько экземпляров одного и того же объекта.

Начнём с кода, *похожего* на тот, что был в конце
[статьи про ортографическую проекцию](webgl-3d-orthographic.html):

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
uniform mat4 matrix;

void main() {
  // Умножаем позицию на матрицу
  gl_Position = matrix * a_position;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 color;

out vec4 outColor;

void main() {
  outColor = color;
}
`;
```

Вершинный шейдер умножает каждую вершину на одну матрицу (см.
[ту статью](webgl-3d-orthographic.html)), что довольно гибко. Фрагментный шейдер просто использует
цвет, который мы передаём через uniform.

Чтобы рисовать, нужно скомпилировать шейдеры, связать их вместе
и получить локации атрибутов и uniform'ов.

```js
const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getUniformLocation(program, 'color');
const matrixLoc = gl.getUniformLocation(program, 'matrix');
```

Создаём vertex array object для хранения состояния атрибутов:

```js
// Создаём vertex array object (состояние атрибутов)
const vao = gl.createVertexArray();

// и делаем его активным
gl.bindVertexArray(vao);
```

Далее нужно передать данные позиций через буфер.

```js
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.1,  0.4,
    -0.1, -0.4,
     0.1, -0.4,
    -0.1,  0.4,
     0.1, -0.4,
     0.1,  0.4,
    -0.4, -0.1,
     0.4, -0.1,
    -0.4,  0.1,
    -0.4,  0.1,
     0.4, -0.1,
     0.4,  0.1,
  ]), gl.STATIC_DRAW);
const numVertices = 12;

// настраиваем атрибут позиции
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
    positionLoc,  // location
    2,            // размер (сколько значений брать из буфера за итерацию)
    gl.FLOAT,     // тип данных в буфере
    false,        // нормализовать
    0,            // шаг (0 = вычислять из size и type выше)
    0,            // смещение в буфере
);
```

Нарисуем 5 экземпляров. Сделаем 5 матриц и 5 цветов для каждого экземпляра.

```js
const numInstances = 5;
const matrices = [
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
];

const colors = [
  [ 1, 0, 0, 1, ],  // красный
  [ 0, 1, 0, 1, ],  // зелёный
  [ 0, 0, 1, 1, ],  // синий
  [ 1, 0, 1, 1, ],  // маджента
  [ 0, 1, 1, 1, ],  // циан
];
```

Для отрисовки используем шейдерную программу, настраиваем атрибуты,
и затем в цикле по 5 экземплярам вычисляем новую матрицу для каждого,
устанавливаем uniform'ы матрицы и цвета, и рисуем.

```js
function render(time) {
  time *= 0.001; // секунды

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Говорим WebGL, как преобразовывать из clip space в пиксели
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  // настраиваем все атрибуты
  gl.bindVertexArray(vao);

  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

    const color = colors[ndx];

    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(matrixLoc, false, mat);

    gl.drawArrays(
        gl.TRIANGLES,
        0,             // offset
        numVertices,   // количество вершин на экземпляр
    );
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

Обратите внимание, что библиотека матриц принимает необязательную матрицу-назначение
в конце каждой функции. В большинстве статей мы не использовали эту возможность и просто
давали библиотеке создавать новую матрицу, но здесь мы хотим, чтобы результат
сохранялся в уже созданных матрицах.

Это работает, и мы получаем 5 вращающихся плюсов разного цвета.

{{{example url="../webgl-instanced-drawing-not-instanced.html"}}}

Это потребовало 5 вызовов `gl.uniform4v`, 5 вызовов `gl.uniformMatrix4fv`
и 5 вызовов `gl.drawArrays`, всего 15 вызовов WebGL. Если бы наши шейдеры были сложнее,
например, как в [статье про spot lighting](webgl-3d-lighting-spot.html),
было бы минимум 7 вызовов на объект: 6 к `gl.uniformXXX` и один к `gl.drawArrays`.
Если бы мы рисовали 400 объектов, это было бы 2800 вызовов WebGL.

Инстансинг позволяет уменьшить количество вызовов. Он работает так:
вы указываете WebGL, сколько раз нужно нарисовать один и тот же объект (количество экземпляров).
Для каждого атрибута вы указываете, будет ли он переходить к *следующему значению* из буфера
каждый раз при вызове вершинного шейдера (по умолчанию), или только раз в N экземпляров (обычно N=1).

Например, вместо передачи `matrix` и `color` через uniform, мы передадим их через атрибуты.
Положим матрицы и цвета для каждого экземпляра в буфер, настроим атрибуты для чтения из этих буферов
и скажем WebGL, чтобы он переходил к следующему значению только раз на экземпляр.

Давайте сделаем это!

Сначала изменим шейдеры, чтобы использовать атрибуты для `matrix` и `color` вместо uniform'ов.

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
uniform mat4 matrix;

void main() {
  // Умножаем позицию на матрицу
  gl_Position = matrix * a_position;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 color;

out vec4 outColor;

void main() {
  outColor = color;
}
`;
```

Теперь нам нужно изменить шейдеры, чтобы использовать атрибуты вместо uniform'ов:

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 color;
in mat4 matrix;

out vec4 v_color;

void main() {
  // Умножаем позицию на матрицу
  gl_Position = matrix * a_position;

  // Передаём цвет вершины во фрагментный шейдер
  v_color = color;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}
`;
```

Теперь нам нужно получить локации атрибутов вместо uniform'ов:

```js
const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
```

Теперь нам нужно создать буферы для матриц и цветов. Для матриц мы создадим один большой буфер:

```js
// Создаём буфер для всех матриц
const matrixData = new Float32Array(numInstances * 16);
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  const byteOffsetToMatrix = i * 16 * 4;
  const numFloatsForView = 16;
  matrices.push(new Float32Array(
      matrixData.buffer,
      byteOffsetToMatrix,
      numFloatsForView));
}
```

Таким образом, когда мы хотим ссылаться на данные всех матриц,
мы можем использовать `matrixData`, но когда мы хотим любую отдельную матрицу,
мы можем использовать `matrices[ndx]`.

Нам также нужно создать буфер на GPU для этих данных.
Нам нужно только выделить буфер в этот момент, нам не нужно
предоставлять данные, поэтому 2-й параметр для `gl.bufferData`
- это размер, который просто выделяет буфер.

```js
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
// просто выделяем буфер
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);
```

Обратите внимание, что мы передали `gl.DYNAMIC_DRAW` как последний параметр. Это *подсказка*
для WebGL, что мы будем часто изменять эти данные.

Теперь нам нужно настроить атрибуты для матриц.
Атрибут матрицы - это `mat4`. `mat4` фактически использует
4 последовательных слота атрибутов.

```js
const bytesPerMatrix = 4 * 16;
for (let i = 0; i < 4; ++i) {
  const loc = matrixLoc + i;
  gl.enableVertexAttribArray(loc);
  // обратите внимание на stride и offset
  const offset = i * 16;  // 4 float на строку, 4 байта на float
  gl.vertexAttribPointer(
      loc,              // location
      4,                // размер (сколько значений брать из буфера за итерацию)
      gl.FLOAT,         // тип данных в буфере
      false,            // нормализовать
      bytesPerMatrix,   // stride, количество байт для перехода к следующему набору значений
      offset,           // смещение в буфере
  );
  // эта строка говорит, что этот атрибут изменяется только раз в 1 экземпляр
  gl.vertexAttribDivisor(loc, 1);
}
```

Самая важная точка относительно инстансированного рисования - это
вызов `gl.vertexAttribDivisor`. Он устанавливает, что этот
атрибут переходит к следующему значению только раз в экземпляр.
Это означает, что атрибуты `matrix` будут использовать первую матрицу для
каждой вершины первого экземпляра, вторую матрицу для
второго экземпляра и так далее.

Далее нам нужны цвета также в буфере. Эти данные не будут
изменяться, по крайней мере в этом примере, поэтому мы просто загрузим
данные.

```js
// настраиваем цвета, один на экземпляр
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([
        1, 0, 0, 1,  // красный
        0, 1, 0, 1,  // зелёный
        0, 0, 1, 1,  // синий
        1, 0, 1, 1,  // маджента
        0, 1, 1, 1,  // циан
      ]),
    gl.STATIC_DRAW);
```

Нам также нужно настроить атрибут цвета:

```js
// устанавливаем атрибут для цвета
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
// эта строка говорит, что этот атрибут изменяется только раз в 1 экземпляр
gl.vertexAttribDivisor(colorLoc, 1);
```

Во время отрисовки вместо цикла по каждому экземпляру,
установки uniform'ов матрицы и цвета, а затем вызова draw,
мы сначала вычислим матрицу для каждого экземпляра.

```js
// обновляем все матрицы
matrices.forEach((mat, ndx) => {
  m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
  m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);
});
```

Поскольку наша библиотека матриц принимает необязательную матрицу назначения
и поскольку наши матрицы - это просто представления `Float32Array` в
большем `Float32Array`, когда мы закончили, все данные матриц
готовы для прямой загрузки на GPU.

```js
// загружаем новые данные матриц
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
```

Наконец мы можем нарисовать все экземпляры одним вызовом draw.

```js
gl.drawArraysInstanced(
  gl.TRIANGLES,
  0,             // offset
  numVertices,   // количество вершин на экземпляр
  numInstances,  // количество экземпляров
);
```

{{{example url="../webgl-instanced-drawing.html"}}}

В примере выше у нас было 3 вызова WebGL на фигуру * 5 фигур,
что составляло 15 вызовов всего. Теперь у нас всего 2 вызова для всех 5 фигур,
один для загрузки матриц, другой для рисования.

Я думаю, это должно быть очевидно, но, возможно,
это очевидно только мне, потому что я делал это слишком много. Код
выше не учитывает соотношение сторон canvas.
Он не использует [матрицу проекции](webgl-3d-orthographic.html)
или [матрицу вида](webgl-3d-camera.html). Он был предназначен только
для демонстрации инстансированного рисования. Если бы вы хотели проекцию и/или
матрицу вида, мы могли бы добавить вычисление в JavaScript. Это означало бы
больше работы для JavaScript. Более очевидный способ - добавить
один или два uniform'а в вершинный шейдер.

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 color;
in mat4 matrix;
uniform mat4 projection;
uniform mat4 view;

out vec4 v_color;

void main() {
  // Умножаем позицию на матрицу
  gl_Position = projection * view * matrix * a_position;

  // Передаём цвет вершины во фрагментный шейдер
  v_color = color;
}
`;
```

и затем найти их локации во время инициализации:

```js
const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
const projectionLoc = gl.getUniformLocation(program, 'projection');
const viewLoc = gl.getUniformLocation(program, 'view');
```

и установить их соответствующим образом во время рендеринга.

```js
gl.useProgram(program);

// устанавливаем матрицы вида и проекции, поскольку
// они используются всеми экземплярами
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
gl.uniformMatrix4fv(projectionLoc, false,
    m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
```

{{{example url="../webgl-instanced-drawing-projection-view.html"}}} 