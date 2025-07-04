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

---

Теперь нам нужно реализовать инстансинг через атрибуты и буферы:

```js
// настраиваем матрицы, по одной на экземпляр
const numInstances = 5;
// создаём типизированный массив с одним view на матрицу
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

const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);

const bytesPerMatrix = 4 * 16;
for (let i = 0; i < 4; ++i) {
  const loc = matrixLoc + i;
  gl.enableVertexAttribArray(loc);
  // stride и offset
  const offset = i * 16;
  gl.vertexAttribPointer(
      loc,
      4,
      gl.FLOAT,
      false,
      bytesPerMatrix,
      offset,
  );
  gl.vertexAttribDivisor(loc, 1);
}

// настраиваем цвета, по одному на экземпляр
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
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(colorLoc, 1);

// В рендере:
function render(time) {
  time *= 0.001;
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.useProgram(program);
  gl.bindVertexArray(vao);

  // обновляем все матрицы
  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);
  });
  // загружаем все матрицы в буфер
  gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

  // рисуем все экземпляры одной командой
  gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,           // offset
      numVertices, // количество вершин на экземпляр
      numInstances // количество экземпляров
  );

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

Теперь мы вызываем только одну команду отрисовки, и WebGL сам перебирает экземпляры, используя данные из буферов для каждого экземпляра.

{{{example url="../webgl-instanced-drawing.html"}}}

Инстансинг — мощный способ ускорить отрисовку множества одинаковых объектов с разными параметрами. 