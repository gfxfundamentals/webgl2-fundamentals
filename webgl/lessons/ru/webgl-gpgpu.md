Title: WebGL2 GPGPU
Description: Как выполнять общие вычисления с помощью WebGL
TOC: GPGPU

GPGPU означает "General Purpose" GPU и означает использование GPU для чего-то
другого, кроме рисования пикселей.

Основное понимание для осознания GPGPU в WebGL заключается в том, что текстура
- это не изображение, а 2D массив значений. В [статье о текстурах](webgl-3d-textures.html)
мы рассмотрели чтение из текстуры. В [статье о рендеринге в текстуру](webgl-render-to-texture.html)
мы рассмотрели запись в текстуру. Итак, если осознать, что текстура - это 2D массив значений,
мы можем сказать, что мы действительно описали способ чтения из и записи в 2D массивы.
Аналогично буфер - это не просто позиции, нормали, координаты текстуры и цвета.
Эти данные могут быть чем угодно. Скорости, массы, цены акций и т.д.
Творческое использование этих знаний для выполнения математики - это суть GPGPU в WebGL.

## Сначала сделаем это с текстурами

В JavaScript есть функция [`Array.prototype.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), которая для данного массива вызывает функцию для каждого элемента

```js
function multBy2(v) {
  return v * 2;
}

const src = [1, 2, 3, 4, 5, 6];
const dst = src.map(multBy2);

// dst теперь [2, 4, 6, 8, 10, 12];
```

Вы можете рассматривать `multBy2` как шейдер, а `map` как аналогичный вызову `gl.drawArrays` или `gl.drawElements`.
Некоторые различия.

## Шейдеры не генерируют новый массив, вы должны предоставить его

Мы можем симулировать это, создав собственную функцию map

```js
function multBy2(v) {
  return v * 2;
}

function mapSrcToDst(src, fn, dst) {
  for (let i = 0; i < src.length; ++i) {
    dst[i] = fn(src[i]);
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // чтобы симулировать, что в WebGL мы должны выделить текстуру
mapSrcToDst(src, multBy2, dst);

// dst теперь [2, 4, 6, 8, 10, 12];
```

## Шейдеры не возвращают значение, они устанавливают переменную `out`

Это довольно легко симулировать

```js
let outColor;

function multBy2(v) {
  outColor = v * 2;
}

function mapSrcToDst(src, fn, dst) {
  for (let i = 0; i < src.length; ++i) {
    fn(src[i]);
    dst[i] = outColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // чтобы симулировать, что в WebGL мы должны выделить текстуру
mapSrcToDst(src, multBy2, dst);

// dst теперь [2, 4, 6, 8, 10, 12];
```

## Шейдеры основаны на назначении, а не на источнике.

Другими словами, они перебирают назначение и спрашивают "какое значение я должен положить сюда"

```js
let outColor;

function multBy2(src) {
  return function(i) {
    outColor = src[i] * 2;
  }
}

function mapDst(dst, fn) {
  for (let i = 0; i < dst.length; ++i) {    
    fn(i);
    dst[i] = outColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // чтобы симулировать, что в WebGL мы должны выделить текстуру
mapDst(dst, multBy2(src));

// dst теперь [2, 4, 6, 8, 10, 12];
```

## В WebGL индекс или ID пикселя, значение которого вас просят предоставить, называется `gl_FragCoord`

```js
let outColor;
let gl_FragCoord;

function multBy2(src) {
  return function() {
    outColor = src[gl_FragCoord] * 2;
  }
}

function mapDst(dst, fn) {
  for (let i = 0; i < dst.length; ++i) {    
    gl_FragCoord = i;
    fn();
    dst[i] = outColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // чтобы симулировать, что в WebGL мы должны выделить текстуру
mapDst(dst, multBy2(src));

// dst теперь [2, 4, 6, 8, 10, 12];
```

## В WebGL текстуры - это 2D массивы.

Давайте предположим, что наш массив `dst` представляет текстуру 3x2

```js
let outColor;
let gl_FragCoord;

function multBy2(src, across) {
  return function() {
    outColor = src[gl_FragCoord.y * across + gl_FragCoord.x] * 2;
  }
}

function mapDst(dst, across, up, fn) {
  for (let y = 0; y < up; ++y) {
    for (let x = 0; x < across; ++x) {
      gl_FragCoord = {x, y};
      fn();
      dst[y * across + x] = outColor;
    }
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // чтобы симулировать, что в WebGL мы должны выделить текстуру
mapDst(dst, 3, 2, multBy2(src, 3));

// dst теперь [2, 4, 6, 8, 10, 12];
```

И мы могли бы продолжать. Я надеюсь, что примеры выше помогают вам увидеть, что GPGPU в WebGL
довольно прост концептуально. Давайте действительно сделаем вышесказанное в WebGL.

Для понимания следующего кода вам нужно будет, как минимум, прочитать
[статью об основах](webgl-fundamentals.html), вероятно, статью о 
[Как это работает](webgl-how-it-works.html), статью о [GLSL](webgl-shaders-and-glsl.html)
и [статью о текстурах](webgl-3d-textures.html).

```js
const vs = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}
`;

const fs = `#version 300 es
precision highp float;

uniform sampler2D srcTex;

out vec4 outColor;

void main() {
  ivec2 texelCoord = ivec2(gl_FragCoord.xy);
  vec4 value = texelFetch(srcTex, texelCoord, 0);  // 0 = mip level 0
  outColor = value * 2.0;
}
`;

const dstWidth = 3;
const dstHeight = 2;

// создаем canvas 3x2 для 6 результатов
const canvas = document.createElement('canvas');
canvas.width = dstWidth;
canvas.height = dstHeight;

const gl = canvas.getContext('webgl2');

const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');

// настраиваем полноэкранный quad в clip space
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
]), gl.STATIC_DRAW);

// Создаем объект вершинного массива (состояние атрибутов)
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// настраиваем наши атрибуты, чтобы сказать WebGL, как извлекать
// данные из буфера выше в атрибут position
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
    positionLoc,
    2,         // размер (количество компонентов)
    gl.FLOAT,  // тип данных в буфере
    false,     // нормализовать
    0,         // шаг (0 = авто)
    0,         // смещение
);

// создаем нашу исходную текстуру
const srcWidth = 3;
const srcHeight = 2;
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); // см. https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip уровень
    gl.R8,            // внутренний формат
    srcWidth,
    srcHeight,
    0,                // граница
    gl.RED,           // формат
    gl.UNSIGNED_BYTE, // тип
    new Uint8Array([
      1, 2, 3,
      4, 5, 6,
    ]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0);  // говорим шейдеру, что исходная текстура находится на texture unit 0

gl.drawArrays(gl.TRIANGLES, 0, 6);  // рисуем 2 треугольника (6 вершин)

// получаем результат
const results = new Uint8Array(dstWidth * dstHeight * 4);
gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);

// выводим результаты
for (let i = 0; i < dstWidth * dstHeight; ++i) {
  log(results[i * 4]);
}
```

и вот он работает

{{{example url="../webgl-gpgpu-mult-by-2.html"}}}

Некоторые замечания о коде выше.

* Мы рисуем quad в clip space от -1 до +1.

  Мы создаем вершины для quad от -1 до +1 из 2 треугольников. Это означает, что при правильной настройке viewport
  мы нарисуем все пиксели в назначении. Другими словами, мы попросим
  наш шейдер сгенерировать значение для каждого элемента в результирующем массиве. Этот массив в
  данном случае - это сам canvas.

* `texelFetch` - это функция текстуры, которая ищет один texel из текстуры.

  Она принимает 3 параметра. Сэмплер, координаты texel на основе целых чисел, и mip уровень.
  `gl_FragCoord` - это vec2, нам нужно превратить его в `ivec2`, чтобы использовать с
  `texelFetch`. Здесь нет дополнительной математики, пока исходная текстура и
  текстура назначения имеют одинаковый размер, что в данном случае так и есть.

* Наш шейдер записывает 4 значения на пиксель

  В данном конкретном случае это влияет на то, как мы читаем вывод. Мы просим `RGBA/UNSIGNED_BYTE`
  из `readPixels` [потому что другие комбинации формата/типа не поддерживаются](webgl-readpixels.html).
  Поэтому нам нужно смотреть на каждое 4-е значение для нашего ответа.

  Примечание: Было бы умно попытаться воспользоваться тем фактом, что WebGL делает 4 значения за раз
  для еще большей скорости.

* Мы используем `R8` как внутренний формат нашей текстуры.

  Это означает, что только красный канал из текстуры имеет значение из наших данных.

* И наши входные данные, и выходные данные (canvas) - это значения `UNSIGNED_BYTE`

  Это означает, что мы можем передавать и получать обратно только целые значения от 0 до 255.
  Мы могли бы использовать разные форматы для ввода, предоставляя текстуру другого формата.
  Мы также могли бы попытаться рендерить в текстуру другого формата для большего диапазона выходных значений.

В примере выше src и dst имеют одинаковый размер. Давайте изменим это так, чтобы мы добавляли каждые 2 значения
из src, чтобы сделать dst. Другими словами, учитывая `[1, 2, 3, 4, 5, 6]` как ввод, мы хотим
`[3, 7, 11]` как вывод. И далее, давайте сохраним источник как данные 3x2

Основная формула для получения значения из 2D массива, как если бы это был 1D массив

```js
y = floor(indexInto1DArray / widthOf2DArray);
x = indexInto1DArray % widthOf2Array;
```

Учитывая это, наш фрагментный шейдер должен измениться на это, чтобы добавить каждые 2 значения.

```glsl
#version 300 es
precision highp float;

uniform sampler2D srcTex;
uniform ivec2 dstDimensions;

out vec4 outColor;

vec4 getValueFrom2DTextureAs1DArray(sampler2D tex, ivec2 dimensions, int index) {
  int y = index / dimensions.x;
  int x = index % dimensions.x;
  return texelFetch(tex, ivec2(x, y), 0);
}

void main() {
  // вычисляем 1D индекс в dst
  ivec2 dstPixel = ivec2(gl_FragCoord.xy);
  int dstIndex = dstPixel.y * dstDimensions.x + dstPixel.x;

  ivec2 srcDimensions = textureSize(srcTex, 0);  // размер mip 0

  vec4 v1 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2);
  vec4 v2 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2 + 1);

  outColor = v1 + v2;
}
```

Функция `getValueFrom2DTextureAs1DArray` - это в основном наша функция доступа к массиву.
Это означает, что эти 2 строки

```glsl
  vec4 v1 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0);
  vec4 v2 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0 + 1.0);
```

Эффективно означают это

```glsl
  vec4 v1 = srcTexAs1DArray[dstIndex * 2.0];
  vec4 v2 = setTexAs1DArray[dstIndex * 2.0 + 1.0];
```

В нашем JavaScript нам нужно найти местоположение `dstDimensions`

```js
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');
+const dstDimensionsLoc = gl.getUniformLocation(program, 'dstDimensions');
```

и установить его

```js
gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0);  // говорим шейдеру, что исходная текстура находится на texture unit 0
+gl.uniform2f(dstDimensionsLoc, dstWidth, dstHeight);
```

и нам нужно изменить размер назначения (canvas)

```js
const dstWidth = 3;
-const dstHeight = 2;
+const dstHeight = 1;
```

и с этим у нас теперь есть результирующий массив, способный выполнять математику
со случайным доступом в исходный массив

{{{example url="../webgl-gpgpu-add-2-elements.html"}}}

Если вы хотели бы использовать больше массивов как ввод, просто добавьте больше текстур, чтобы поместить больше
данных в ту же текстуру.

## Теперь сделаем это с *transform feedback*

"Transform Feedback" - это модное название для способности записывать вывод
varyings в вершинном шейдере в один или несколько буферов.

Преимущество использования transform feedback в том, что вывод одномерный,
поэтому, вероятно, легче рассуждать об этом. Это даже ближе к `map` из JavaScript.

Давайте возьмем 2 массива значений и выведем их сумму, разность
и произведение. Вот вершинный шейдер

```glsl
#version 300 es

in float a;
in float b;

out float sum;
out float difference;
out float product;

void main() {
  sum = a + b;
  difference = a - b;
  product = a * b;
}
```

и фрагментный шейдер просто достаточно для компиляции

```glsl
#version 300 es
precision highp float;
void main() {
}
```

Чтобы использовать transform feedback, мы должны сказать WebGL, какие varyings мы хотим записать
и в каком порядке. Мы делаем это, вызывая `gl.transformFeedbackVaryings` перед
линковкой шейдерной программы. Из-за этого мы не будем использовать наш помощник
для компиляции шейдеров и линковки программы на этот раз, просто чтобы было ясно,
что мы должны сделать.

Итак, вот код для компиляции шейдера, аналогичный коду в самой
[первой статье](webgl-fundamentals.html).

```js
function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}
```

Мы будем использовать его для компиляции наших 2 шейдеров, а затем прикрепить их и вызвать
`gl.transformFeedbackVaryings` перед линковкой

```js
const vShader = createShader(gl, gl.VERTEX_SHADER, vs);
const fShader = createShader(gl, gl.FRAGMENT_SHADER, fs);

const program = gl.createProgram();
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.transformFeedbackVaryings(
    program,
    ['sum', 'difference', 'product'],
    gl.SEPARATE_ATTRIBS,
);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramParameter(program));
}
```

`gl.transformFeedbackVaryings` принимает 3 аргумента. Программу, массив имен
varyings, которые мы хотим записать в том порядке, в котором вы хотите их записать.
Если бы у вас был фрагментный шейдер, который действительно что-то делал,
то, возможно, некоторые из ваших varyings предназначены только для фрагментного шейдера и поэтому
не нуждаются в записи. В нашем случае мы запишем все наши varyings, поэтому передаем
имена всех 3. Последний параметр может быть одним из 2 значений. Либо `SEPARATE_ATTRIBS`,
либо `INTERLEAVED_ATTRIBS`.

`SEPARATE_ATTRIBS` означает, что каждый varying будет записан в другой буфер.
`INTERLEAVED_ATTRIBS` означает, что все varyings будут записаны в тот же буфер,
но перемежаться в том порядке, который мы указали. В нашем случае, поскольку мы указали
`['sum', 'difference', 'product']`, если бы мы использовали `INTERLEAVED_ATTRIBS`, вывод
был бы `sum0, difference0, product0, sum1, difference1, product1, sum2, difference2, product2, etc...`
в один буфер. Мы используем `SEPARATE_ATTRIBS`, поэтому вместо этого
каждый вывод будет записан в другой буфер.

Итак, как и в других примерах, нам нужно настроить буферы для наших входных атрибутов

```js
const aLoc = gl.getAttribLocation(program, 'a');
const bLoc = gl.getAttribLocation(program, 'b');

// Создаем объект вершинного массива (состояние атрибутов)
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

function makeBuffer(gl, sizeOrData) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, gl.STATIC_DRAW);
  return buf;
}

function makeBufferAndSetAttribute(gl, data, loc) {
  const buf = makeBuffer(gl, data);
  // настраиваем наши атрибуты, чтобы сказать WebGL, как извлекать
  // данные из буфера выше в атрибут
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(
      loc,
      1,         // размер (количество компонентов)
      gl.FLOAT,  // тип данных в буфере
      false,     // нормализовать
      0,         // шаг (0 = авто)
      0,         // смещение
  );
}

const a = [1, 2, 3, 4, 5, 6];
const b = [3, 6, 9, 12, 15, 18];

// помещаем данные в буферы
const aBuffer = makeBufferAndSetAttribute(gl, new Float32Array(a), aLoc);
const bBuffer = makeBufferAndSetAttribute(gl, new Float32Array(b), bLoc);
```

Затем нам нужно настроить "transform feedback". "Transform feedback" - это объект,
который содержит состояние буферов, в которые мы будем записывать. В то время как [вершинный массив](webgl-attributes.html)
указывает состояние всех входных атрибутов, "transform feedback" содержит
состояние всех выходных атрибутов.

Вот код для настройки нашего

```js
// Создаем и заполняем transform feedback
const tf = gl.createTransformFeedback();
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

// создаем буферы для вывода
const sumBuffer = makeBuffer(gl, a.length * 4);
const differenceBuffer = makeBuffer(gl, a.length * 4);
const productBuffer = makeBuffer(gl, a.length * 4);

// привязываем буферы к transform feedback
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sumBuffer);
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, differenceBuffer);
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, productBuffer);

gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

// буферы, в которые мы записываем, не могут быть привязаны где-то еще
gl.bindBuffer(gl.ARRAY_BUFFER, null);  // productBuffer все еще был привязан к ARRAY_BUFFER, поэтому отвязываем его
```

Мы вызываем `bindBufferBase`, чтобы установить, в какой буфер каждый из выходов, выход 0, выход 1 и выход 2
будет записывать. Выходы 0, 1, 2 соответствуют именам, которые мы передали в `gl.transformFeedbackVaryings`
когда мы линковали программу.

Когда мы закончили, "transform feedback", который мы создали, имеет состояние, как это

<img src="resources/transform-feedback-diagram.png" style="width: 625px;" class="webgl_center">

Есть также функция `bindBufferRange`, которая позволяет нам указать поддиапазон в буфере, где
мы будем записывать, но мы не будем использовать это здесь.

Итак, чтобы выполнить шейдер, мы делаем это

```js
gl.useProgram(program);

// привязываем наше состояние входных атрибутов для буферов a и b
gl.bindVertexArray(vao);

// нет необходимости вызывать фрагментный шейдер
gl.enable(gl.RASTERIZER_DISCARD);

gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
gl.beginTransformFeedback(gl.POINTS);
gl.drawArrays(gl.POINTS, 0, a.length);
gl.endTransformFeedback();
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

// включаем использование фрагментных шейдеров снова
gl.disable(gl.RASTERIZER_DISCARD);
```

Мы отключаем вызов фрагментного шейдера. Мы привязываем объект transform feedback,
который мы создали ранее, мы включаем transform feedback, затем мы вызываем draw.

Чтобы посмотреть на значения, мы можем вызвать `gl.getBufferSubData`

```js
log(`a: ${a}`);
log(`b: ${b}`);

printResults(gl, sumBuffer, 'sums');
printResults(gl, differenceBuffer, 'differences');
printResults(gl, productBuffer, 'products');

function printResults(gl, buffer, label) {
  const results = new Float32Array(a.length);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.getBufferSubData(
      gl.ARRAY_BUFFER,
      0,    // смещение в байтах в GPU буфере,
      results,
  );
  // выводим результаты
  log(`${label}: ${results}`);
}
```

{{{example url="../webgl-gpgpu-sum-difference-product-transformfeedback.html"}}}

Вы можете видеть, что это сработало. Мы заставили GPU вычислить сумму, разность и произведение
значений 'a' и 'b', которые мы передали.

Примечание: Вы можете найти [этот пример диаграммы состояния transform feedback](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html?exampleId=transform-feedback) полезным для визуализации того, что такое "transform feedback".
Это не тот же пример, что выше, хотя. Вершинный шейдер, который он использует с transform feedback, генерирует позиции и цвета для круга точек.

## Первый пример: частицы

Допустим, у вас есть очень простая система частиц.
Каждая частица просто имеет позицию и скорость, и
если она выходит за один край экрана, она оборачивается вокруг
другой стороны.

Учитывая большинство других статей на этом сайте, вы бы
обновляли позиции частиц в JavaScript

```js
for (const particle of particles) {
  particle.pos.x = (particle.pos.x + particle.velocity.x) % canvas.width;
  particle.pos.y = (particle.pos.y + particle.velocity.y) % canvas.height;
}
```

и затем рисовали бы частицы либо по одной за раз

```
useProgram (particleShader)
setup particle attributes
for each particle
  set uniforms
  draw particle
```

Или вы могли бы загрузить все новые позиции частиц

```
bindBuffer(..., particlePositionBuffer)
bufferData(..., latestParticlePositions, ...)
useProgram (particleShader)
setup particle attributes
set uniforms
draw particles
```

Используя пример transform feedback выше, мы могли бы создать
буфер со скоростью для каждой частицы. Затем мы могли бы
создать 2 буфера для позиций. Мы использовали бы transform feedback
для добавления скорости к одному буферу позиций и записи в
другой буфер позиций. Затем мы рисовали бы с новыми позициями.
На следующем кадре мы читали бы из буфера с новыми позициями
и записывали обратно в другой буфер для генерации еще более новых позиций.

Вот вершинный шейдер для обновления позиций частиц

```glsl
#version 300 es
in vec2 oldPosition;
in vec2 velocity;

uniform float deltaTime;
uniform vec2 canvasDimensions;

out vec2 newPosition;

vec2 euclideanModulo(vec2 n, vec2 m) {
	return mod(mod(n, m) + m, m);
}

void main() {
  newPosition = euclideanModulo(
      oldPosition + velocity * deltaTime,
      canvasDimensions);
}
```

Чтобы рисовать частицы, мы просто используем простой вершинный шейдер

```glsl
#version 300 es
in vec4 position;
uniform mat4 matrix;

void main() {
  // делаем общую матричную математику
  gl_Position = matrix * position;
  gl_PointSize = 10.0;
}
```

Давайте превратим код для создания и линковки программы в
функцию, которую мы можем использовать для обоих шейдеров

```js
function createProgram(gl, shaderSources, transformFeedbackVaryings) {
  const program = gl.createProgram();
  [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
    const shader = createShader(gl, type, shaderSources[ndx]);
    gl.attachShader(program, shader);
  });
  if (transformFeedbackVaryings) {
    gl.transformFeedbackVaryings(
        program,
        transformFeedbackVaryings,
        gl.SEPARATE_ATTRIBS,
    );
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramParameter(program));
  }
  return program;
}
```

и затем использовать его для компиляции шейдеров, один с transform feedback
varying.

```js
const updatePositionProgram = createProgram(
    gl, [updatePositionVS, updatePositionFS], ['newPosition']);
const drawParticlesProgram = createProgram(
    gl, [drawParticlesVS, drawParticlesFS]);
```

Как обычно, нам нужно найти местоположения

```js
const updatePositionPrgLocs = {
  oldPosition: gl.getAttribLocation(updatePositionProgram, 'oldPosition'),
  velocity: gl.getAttribLocation(updatePositionProgram, 'velocity'),
  canvasDimensions: gl.getUniformLocation(updatePositionProgram, 'canvasDimensions'),
  deltaTime: gl.getUniformLocation(updatePositionProgram, 'deltaTime'),
};

const drawParticlesProgLocs = {
  position: gl.getAttribLocation(drawParticlesProgram, 'position'),
  matrix: gl.getUniformLocation(drawParticlesProgram, 'matrix'),
};
```

Теперь давайте создадим некоторые случайные позиции и скорости

```js
// создаем случайные позиции и скорости.
const rand = (min, max) => {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
};
const numParticles = 200;
const createPoints = (num, ranges) =>
   new Array(num).fill(0).map(_ => ranges.map(range => rand(...range))).flat();
const positions = new Float32Array(createPoints(numParticles, [[canvas.width], [canvas.height]]));
const velocities = new Float32Array(createPoints(numParticles, [[-300, 300], [-300, 300]]));
```

Затем мы поместим их в буферы.

```js
function makeBuffer(gl, sizeOrData, usage) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
  return buf;
}

const position1Buffer = makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
const position2Buffer = makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
const velocityBuffer = makeBuffer(gl, velocities, gl.STATIC_DRAW);
```

Обратите внимание, что мы передали `gl.DYNAMIC_DRAW` в `gl.bufferData` для 2 буферов позиций,
поскольку мы будем обновлять их часто. Это просто подсказка для WebGL для оптимизации.
Имеет ли это какой-либо эффект на производительность, зависит от WebGL.

Нам нужно 4 вершинных массива.

* 1 для использования `position1Buffer` и `velocity` при обновлении позиций
* 1 для использования `position2Buffer` и `velocity` при обновлении позиций
* 1 для использования `position1Buffer` при рисовании
* 1 для использования `position2Buffer` при рисовании

```js
function makeVertexArray(gl, bufLocPairs) {
  const va = gl.createVertexArray();
  gl.bindVertexArray(va);
  for (const [buffer, loc] of bufLocPairs) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(
        loc,      // местоположение атрибута
        2,        // количество элементов
        gl.FLOAT, // тип данных
        false,    // нормализовать
        0,        // шаг (0 = авто)
        0,        // смещение
    );
  }
  return va;
}

const updatePositionVA1 = makeVertexArray(gl, [
  [position1Buffer, updatePositionPrgLocs.oldPosition],
  [velocityBuffer, updatePositionPrgLocs.velocity],
]);
const updatePositionVA2 = makeVertexArray(gl, [
  [position2Buffer, updatePositionPrgLocs.oldPosition],
  [velocityBuffer, updatePositionPrgLocs.velocity],
]);

const drawVA1 = makeVertexArray(
    gl, [[position1Buffer, drawParticlesProgLocs.position]]);
const drawVA2 = makeVertexArray(
    gl, [[position2Buffer, drawParticlesProgLocs.position]]);
```

Затем мы создаем 2 объекта transform feedback.

* 1 для записи в `position1Buffer`
* 1 для записи в `position2Buffer`

```js
function makeTransformFeedback(gl, buffer) {
  const tf = gl.createTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
  return tf;
}

const tf1 = makeTransformFeedback(gl, position1Buffer);
const tf2 = makeTransformFeedback(gl, position2Buffer);
```

При использовании transform feedback важно отвязать буферы
от других точек привязки. `ARRAY_BUFFER` все еще имеет последний буфер
привязанным, в который мы поместили данные. `TRANSFORM_FEEDBACK_BUFFER` устанавливается при
вызове `gl.bindBufferBase`. Это немного запутанно. Вызов
`gl.bindBufferBase` с `TRANSFORM_FEEDBACK_BUFFER` фактически
привязывает буфер к 2 местам. Одно - к индексированной точке привязки внутри
объекта transform feedback. Другое - к своего рода глобальной
точке привязки, называемой `TRANSFORM_FEEDBACK_BUFFER`.

```js
// отвязываем оставшиеся вещи
gl.bindBuffer(gl.ARRAY_BUFFER, null);
gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
```

Чтобы мы могли легко менять местами буферы обновления и рисования,
мы настроим эти 2 объекта

```js
let current = {
  updateVA: updatePositionVA1,  // читаем из position1
  tf: tf2,                      // записываем в position2
  drawVA: drawVA2,              // рисуем с position2
};
let next = {
  updateVA: updatePositionVA2,  // читаем из position2
  tf: tf1,                      // записываем в position1
  drawVA: drawVA1,              // рисуем с position1
};
```

Затем мы сделаем цикл рендеринга, сначала мы обновим позиции
используя transform feedback.

```js
let then = 0;
function render(time) {
  // конвертируем в секунды
  time *= 0.001;
  // Вычитаем предыдущее время из текущего времени
  const deltaTime = time - then;
  // Запоминаем текущее время для следующего кадра.
  then = time;

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.clear(gl.COLOR_BUFFER_BIT);

  // вычисляем новые позиции
  gl.useProgram(updatePositionProgram);
  gl.bindVertexArray(current.updateVA);
  gl.uniform2f(updatePositionPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);

  // отключаем использование фрагментного шейдера
  gl.enable(gl.RASTERIZER_DISCARD);

  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.tf);
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, numParticles);
  gl.endTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  // включаем использование фрагментных шейдеров снова
  gl.disable(gl.RASTERIZER_DISCARD);
```

и затем рисуем частицы

```js
  // теперь рисуем частицы.
  gl.useProgram(drawParticlesProgram);
  gl.bindVertexArray(current.drawVA);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.uniformMatrix4fv(
      drawParticlesProgLocs.matrix,
      false,
      m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1));
  gl.drawArrays(gl.POINTS, 0, numParticles);
```

и наконец меняем местами `current` и `next`, чтобы на следующем кадре мы
использовали последние позиции для генерации новых

```js
  // меняем местами, из какого буфера мы будем читать
  // и в какой мы будем записывать
  {
    const temp = current;
    current = next;
    next = temp;
  }

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

И с этим у нас есть простые частицы на основе GPU.

{{{example url="../webgl-gpgpu-particles-transformfeedback.html"}}}

## Следующий пример: Поиск ближайшего отрезка линии к точке

Я не уверен, что это хороший пример, но это тот, который я написал. Я говорю, что он может
быть нехорошим, потому что я подозреваю, что есть лучшие алгоритмы для поиска
ближайшей линии к точке, чем перебор проверки каждой линии с точкой. Например, различные алгоритмы пространственного разделения могут позволить вам легко отбросить 95%
точек и поэтому быть быстрее. Тем не менее, этот пример, вероятно, показывает
некоторые техники GPGPU по крайней мере.

Проблема: У нас есть 500 точек и 1000 отрезков линий. Для каждой точки
найти, какой отрезок линии к ней ближе всего. Метод перебора

```
for each point
  minDistanceSoFar = MAX_VALUE
  for each line segment
    compute distance from point to line segment
``` 