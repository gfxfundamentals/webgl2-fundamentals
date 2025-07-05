Title: WebGL2 Вытягивание вершин
Description: Использование независимых индексов
TOC: Вытягивание вершин

В этой статье предполагается, что вы уже прочитали многие другие статьи,
начиная с [основ](webgl-fundamentals.html).
Если вы их не читали, начните с них.

Традиционно WebGL-приложения помещают геометрические данные в буферы.
Затем с помощью атрибутов эти данные автоматически подаются из буферов
в вершинный шейдер, где программист пишет код для преобразования их в clip space.

Слово **традиционно** здесь важно. Это всего лишь **традиция**
делать так. Это вовсе не требование. WebGL не
заботится о том, как мы это делаем, ему важно только, чтобы наш вершинный шейдер
присваивал координаты clip space переменной `gl_Position`.

Давайте нарисуем куб с текстурой, используя код, похожий на примеры из [статьи о текстурах](webgl-3d-textures.html).
Говорят, что нам нужно как минимум 24 уникальные вершины. Это потому, что, хотя у куба всего 8 угловых
позиций, один и тот же угол используется на 3 разных гранях,
и для каждой грани нужны свои текстурные координаты.

<div class="webgl_center"><img src="resources/cube-vertices-uv.svg" style="width: 400px;"></div>

На диаграмме выше видно, что для левой грани угол 3 требует
текстурных координат 1,1, а для правой грани тот же угол 3 требует
координат 0,1. Для верхней грани понадобятся ещё другие координаты.

Обычно это реализуется так: из 8 угловых позиций
делают 24 вершины

```js
  // front
  { pos: [-1, -1,  1], uv: [0, 1], }, // 0
  { pos: [ 1, -1,  1], uv: [1, 1], }, // 1
  { pos: [-1,  1,  1], uv: [0, 0], }, // 2
  { pos: [ 1,  1,  1], uv: [1, 0], }, // 3
  // right
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 4
  { pos: [ 1, -1, -1], uv: [1, 1], }, // 5
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 6
  { pos: [ 1,  1, -1], uv: [1, 0], }, // 7
  // back
  { pos: [ 1, -1, -1], uv: [0, 1], }, // 8
  { pos: [-1, -1, -1], uv: [1, 1], }, // 9
  { pos: [ 1,  1, -1], uv: [0, 0], }, // 10
  { pos: [-1,  1, -1], uv: [1, 0], }, // 11
  // left
  { pos: [-1, -1, -1], uv: [0, 1], }, // 12
  { pos: [-1, -1,  1], uv: [1, 1], }, // 13
  { pos: [-1,  1, -1], uv: [0, 0], }, // 14
  { pos: [-1,  1,  1], uv: [1, 0], }, // 15
  // top
  { pos: [ 1,  1, -1], uv: [0, 1], }, // 16
  { pos: [-1,  1, -1], uv: [1, 1], }, // 17
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 18
  { pos: [-1,  1,  1], uv: [1, 0], }, // 19
  // bottom
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 20
  { pos: [-1, -1,  1], uv: [1, 1], }, // 21
  { pos: [ 1, -1, -1], uv: [0, 0], }, // 22
  { pos: [-1, -1, -1], uv: [1, 0], }, // 23
```

Эти позиции и текстурные координаты
кладутся в буферы и подаются в вершинный шейдер
через атрибуты.

Но обязательно ли делать именно так? А что если
мы хотим оставить только 8 углов
и 4 текстурные координаты? Например:

```js
positions = [
  -1, -1,  1,  // 0
   1, -1,  1,  // 1
  -1,  1,  1,  // 2
   1,  1,  1,  // 3
  -1, -1, -1,  // 4
   1, -1, -1,  // 5
  -1,  1, -1,  // 6
   1,  1, -1,  // 7
];
uvs = [
  0, 0,  // 0
  1, 0,  // 1
  0, 1,  // 2
  1, 1,  // 3
];
```

А для каждой из 24 вершин мы бы указывали, какие из них использовать.

```js
positionIndexUVIndex = [
  // front
  0, 1, // 0
  1, 3, // 1
  2, 0, // 2
  3, 2, // 3
  // right
  1, 1, // 4
  5, 3, // 5
  3, 0, // 6
  7, 2, // 7
  // back
  5, 1, // 8
  4, 3, // 9
  7, 0, // 10
  6, 2, // 11
  // left
  4, 1, // 12
  0, 3, // 13
  6, 0, // 14
  2, 2, // 15
  // top
  7, 1, // 16
  6, 3, // 17
  3, 0, // 18
  2, 2, // 19
  // bottom
  1, 1, // 20
  0, 3, // 21
  5, 0, // 22
  4, 2, // 23
];
```

Можно ли использовать это на GPU? Почему бы и нет!?

Мы загрузим позиции и текстурные координаты
каждую в свою текстуру, как
рассматривалось в [статье о data-текстурах](webgl-data-textures.html).

```js
function makeDataTexture(gl, data, numComponents) {
  // расширяем данные до 4 значений на пиксель
  const numElements = data.length / numComponents;
  const expandedData = new Float32Array(numElements * 4);
  for (let i = 0; i < numElements; ++i) {
    const srcOff = i * numComponents;
    const dstOff = i * 4;
    for (let j = 0; j < numComponents; ++j) {
      expandedData[dstOff + j] = data[srcOff + j];
    }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,            // mip уровень
      gl.RGBA32F,   // формат
      numElements,  // ширина
      1,            // высота
      0,            // граница
      gl.RGBA,      // формат
      gl.FLOAT,     // тип
      expandedData,
  );
  // фильтрация не нужна
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

const positionTexture = makeDataTexture(gl, positions, 3);
const texcoordTexture = makeDataTexture(gl, uvs, 2);
```

Поскольку в текстуре может быть до 4 значений на пиксель, функция `makeDataTexture`
расширяет любые данные до 4 значений на пиксель.

Далее создаём vertex array для хранения состояния атрибутов

```js
// создаём vertex array object для хранения состояния атрибутов
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
```

Теперь нужно загрузить индексы позиций и texcoord в буфер.

```js
// Создаём буфер для индексов позиций и UV
const positionIndexUVIndexBuffer = gl.createBuffer();
// Биндим его к ARRAY_BUFFER (думаем об этом как ARRAY_BUFFER = positionBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
// Кладём индексы позиций и texcoord в буфер
gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(positionIndexUVIndex), gl.STATIC_DRAW);
```

и настраиваем атрибут

```js
// Включаем атрибут индекса позиции
gl.enableVertexAttribArray(posTexIndexLoc);

// Говорим атрибуту индекса позиции/texcoord, как забирать данные из буфера 
// positionIndexUVIndexBuffer (ARRAY_BUFFER)
{
  const size = 2;                // 2 компонента на итерацию
  const type = gl.INT;           // данные - 32-битные целые числа
  const stride = 0;              // 0 = двигаться вперёд на size * sizeof(type) каждый раз для получения следующей позиции
  const offset = 0;              // начинать с начала буфера
  gl.vertexAttribIPointer(
      posTexIndexLoc, size, type, stride, offset);
}
```

Обратите внимание, что мы вызываем `gl.vertexAttribIPointer`, а не `gl.vertexAttribPointer`.
`I` означает integer и используется для целочисленных и беззнаковых целочисленных атрибутов.
Также заметьте, что size равен 2, поскольку на вершину приходится 1 индекс позиции и 1 индекс texcoord.

Хотя нам нужно только 24 вершины, мы всё равно должны рисовать 6 граней, 12 треугольников
каждая, 3 вершины на треугольник = 36 вершин. Чтобы указать, какие 6 вершин
использовать для каждой грани, мы будем использовать [индексы вершин](webgl-indexed-vertices.html).

```js
const indices = [
   0,  1,  2,   2,  1,  3,  // front
   4,  5,  6,   6,  5,  7,  // right
   8,  9, 10,  10,  9, 11,  // back
  12, 13, 14,  14, 13, 15,  // left
  16, 17, 18,  18, 17, 19,  // top
  20, 21, 22,  22, 21, 23,  // bottom
];
// Создаём индексный буфер
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// Кладём индексы в буфер
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
```

Поскольку мы хотим нарисовать изображение на самом кубе, нам нужна 3-я текстура
с этим изображением. Давайте просто создадим ещё одну 4x4 data-текстуру с шахматной доской.
Мы будем использовать `gl.LUMINANCE` как формат, поскольку тогда нам нужен только один байт на пиксель.

```js
// Создаём текстуру-шахматку
const checkerTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Заполняем текстуру 4x4 серой шахматкой
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    4,
    4,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0xDD, 0x99, 0xDD, 0xAA,
      0x88, 0xCC, 0x88, 0xDD,
      0xCC, 0x88, 0xCC, 0xAA,
      0x88, 0xCC, 0x88, 0xCC,
    ]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Переходим к вершинному шейдеру... Мы можем получить пиксель из текстуры так:

```glsl
vec4 color = texelFetch(sampler2D tex, ivec2 pixelCoord, int mipLevel);
```

Итак, по целочисленным координатам пикселя код выше извлечёт значение пикселя.

Используя функцию `texelFetch`, мы можем взять 1D индекс массива
и найти значение в 2D текстуре так:

```glsl
vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
```

Итак, учитывая эту функцию, вот наш шейдер:

```glsl
#version 300 es
in ivec2 positionAndTexcoordIndices;

uniform sampler2D positionTexture;
uniform sampler2D texcoordTexture;

uniform mat4 u_matrix;

out vec2 v_texcoord;

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
  int positionIndex = positionAndTexcoordIndices.x;
  vec3 position = getValueByIndexFromTexture(
      positionTexture, positionIndex).xyz;
 
  // Умножаем позицию на матрицу
  gl_Position = u_matrix * vec4(position, 1);

  int texcoordIndex = positionAndTexcoordIndices.y;
  vec2 texcoord = getValueByIndexFromTexture(
      texcoordTexture, texcoordIndex).xy;

  // Передаём texcoord в фрагментный шейдер
  v_texcoord = texcoord;
}
```

Внизу это по сути тот же шейдер, который мы использовали
в [статье о текстурах](webgl-3d-textures.html).
Мы умножаем `position` на `u_matrix` и выводим
texcoord в `v_texcoord` для передачи в фрагментный шейдер.

Разница только в том, как мы получаем position и
texcoord. Мы используем переданные индексы и получаем
эти значения из соответствующих текстур.

Чтобы использовать шейдер, нужно найти все локации:

```js
// настраиваем GLSL программу
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

// ищем, куда должны идти вершинные данные
const posTexIndexLoc = gl.getAttribLocation(
    program, "positionAndTexcoordIndices");

// ищем uniform'ы
const matrixLoc = gl.getUniformLocation(program, "u_matrix");
const positionTexLoc = gl.getUniformLocation(program, "positionTexture");
const texcoordTexLoc = gl.getUniformLocation(program, "texcoordTexture");
const u_textureLoc = gl.getUniformLocation(program, "u_texture");
```

Во время рендеринга настраиваем атрибуты:

```js
// Говорим использовать нашу программу (пару шейдеров)
gl.useProgram(program);

// Устанавливаем буфер и состояние атрибутов
gl.bindVertexArray(vao);
```

Затем нужно привязать все 3 текстуры и настроить все
uniform'ы:

```js
// Устанавливаем матрицу
gl.uniformMatrix4fv(matrixLoc, false, matrix);

// кладём текстуру позиций на texture unit 0
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, positionTexture);
// Говорим шейдеру использовать texture unit 0 для positionTexture
gl.uniform1i(positionTexLoc, 0);

// кладём текстуру texcoord на texture unit 1
gl.activeTexture(gl.TEXTURE0 + 1);
gl.bindTexture(gl.TEXTURE_2D, texcoordTexture);
// Говорим шейдеру использовать texture unit 1 для texcoordTexture
gl.uniform1i(texcoordTexLoc, 1);

// кладём текстуру-шахматку на texture unit 2
gl.activeTexture(gl.TEXTURE0 + 2);
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Говорим шейдеру использовать texture unit 2 для u_texture
gl.uniform1i(u_textureLoc, 2);
```

И наконец рисуем:

```js
// Рисуем геометрию
gl.drawElements(gl.TRIANGLES, 6 * 6, gl.UNSIGNED_SHORT, 0);
```

И получаем куб с текстурой, используя только 8 позиций и
4 текстурные координаты:

{{{example url="../webgl-pulling-vertices.html"}}}

Несколько вещей для заметки. Код ленивый и использует 1D
текстуры для позиций и текстурных координат.
Текстуры могут быть только такой ширины. [Насколько широкими - зависит от машины](https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE), что можно запросить с помощью:

```js
const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
```

Если бы мы хотели обработать больше данных, чем это, нам нужно было бы
выбрать какой-то размер текстуры, который подходит нашим данным, и распределить
данные по нескольким строкам, возможно
дополняя последнюю строку, чтобы получился прямоугольник.

Ещё одна вещь, которую мы делаем здесь - используем 2 текстуры,
одну для позиций, одну для текстурных координат.
Нет причин, по которым мы не могли бы положить оба данных в
ту же текстуру либо чередуя:

    pos,uv,pos,uv,pos,uv...

либо в разных местах в текстуре:

    pos,pos,pos,...
    uv, uv, uv,...

Нам просто пришлось бы изменить математику в вершинном шейдере,
которая вычисляет, как их извлекать из текстуры.

Возникает вопрос: стоит ли делать такие вещи?
Ответ: "зависит от обстоятельств". В зависимости от GPU это
может быть медленнее, чем более традиционный способ.

Цель этой статьи была в том, чтобы ещё раз указать,
что WebGL не заботится о том, как вы устанавливаете `gl_Position` с
координатами clip space, и не заботится о том, как вы
выводите цвет. Ему важно только, чтобы вы их установили.
Текстуры - это действительно просто 2D массивы данных с произвольным доступом.

Когда у вас есть проблема, которую вы хотите решить в WebGL,
помните, что WebGL просто запускает шейдеры, и эти шейдеры
имеют доступ к данным через uniform'ы (глобальные переменные),
атрибуты (данные, которые приходят за итерацию вершинного шейдера),
и текстуры (2D массивы с произвольным доступом). Не позволяйте
традиционным способам использования WebGL помешать вам
увидеть настоящую гибкость, которая там есть.

<div class="webgl_bottombar">
<h3>Почему это называется Vertex Pulling?</h3>
<p>Я на самом деле слышал этот термин только недавно (июль 2019),
хотя использовал технику раньше. Он происходит из
<a href='https://www.google.com/search?q=OpenGL+Insights+"Programmable+Vertex+Pulling"+article+by+Daniel+Rakos'>статьи OpenGL Insights "Programmable Vertex Pulling" от Daniel Rakos</a>.
</p>
<p>Это называется vertex *pulling* (вытягивание вершин), поскольку это вершинный шейдер
решает, какие вершинные данные читать, в отличие от традиционного способа, где
вершинные данные поставляются автоматически через атрибуты. По сути
вершинный шейдер *вытягивает* данные из памяти.</p>
</div> 