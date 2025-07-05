Title: WebGL2 Загрузка Obj
Description: Как парсить и отображать .OBJ файл
TOC: Загрузка .obj файлов

Файлы Wavefront .obj являются одним из самых распространенных форматов
3D файлов, которые вы можете найти в интернете. Они не так сложны для
парсинга в самых распространенных формах, поэтому давайте разберем один. Это
надеюсь, предоставит полезный пример для парсинга 3D форматов
в общем.

**Отказ от ответственности:** Этот парсер .OBJ не предназначен для того, чтобы быть исчерпывающим или
безупречным или обрабатывать каждый .OBJ файл. Скорее он предназначен как
упражнение для прохождения через обработку того, с чем мы сталкиваемся по пути.
Тем не менее, если вы столкнетесь с большими проблемами и решениями, комментарий
внизу может быть полезен для других, если они решат
использовать этот код.

Лучшая документация, которую я нашел для формата .OBJ, находится
[здесь](http://paulbourke.net/dataformats/obj/). Хотя
[эта страница](https://www.loc.gov/preservation/digital/formats/fdd/fdd000507.shtml)
ссылается на многие другие документы, включая то, что кажется
[оригинальной документацией](https://web.archive.org/web/20200324065233/http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf).

Давайте посмотрим на простой пример. Вот файл cube.obj, экспортированный из стандартной сцены blender.

```txt
# Blender v2.80 (sub 75) OBJ File: ''
# www.blender.org
mtllib cube.mtl
o Cube
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vt 0.375000 0.000000
vt 0.625000 0.000000
vt 0.625000 0.250000
vt 0.375000 0.250000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.625000 0.500000
vt 0.375000 0.500000
vt 0.625000 0.750000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.625000 1.000000
vt 0.375000 1.000000
vt 0.125000 0.500000
vt 0.375000 0.500000
vt 0.375000 0.750000
vt 0.125000 0.750000
vt 0.625000 0.500000
vt 0.875000 0.500000
vt 0.875000 0.750000
vn 0.0000 1.0000 0.0000
vn 0.0000 0.0000 1.0000
vn -1.0000 0.0000 0.0000
vn 0.0000 -1.0000 0.0000
vn 1.0000 0.0000 0.0000
vn 0.0000 0.0000 -1.0000
usemtl Material
s off
f 1/1/1 5/2/1 7/3/1 3/4/1
f 4/5/2 3/6/2 7/7/2 8/8/2
f 8/8/3 7/7/3 5/9/3 6/10/3
f 6/10/4 2/11/4 4/12/4 8/13/4
f 2/14/5 1/15/5 3/16/5 4/17/5
f 6/18/6 5/19/6 1/20/6 2/11/6
```

Даже не глядя на документацию, мы, вероятно, можем понять,
что строки, начинающиеся с `v`, являются позициями, строки, начинающиеся
с `vt`, являются координатами текстуры, и строки, начинающиеся
с `vn`, являются нормалями. Осталось разобраться с остальным.

Похоже, что .OBJ файлы являются текстовыми файлами, поэтому первое, что нам нужно
сделать, это загрузить текстовый файл. К счастью, в 2020 году это очень просто,
если мы используем [async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await).

```js
async function main() {
  ...

  const response = await fetch('resources/models/cube/cube.obj');
  const text = await response.text();
```

Далее выглядит так, что мы можем парсить его построчно, и что
каждая строка имеет форму

```
ключевое_слово данные данные данные данные ...
```

где первая вещь в строке - это ключевое слово, а данные
разделены пробелами. Строки, начинающиеся с `#`, являются комментариями.

Итак, давайте настроим код для парсинга каждой строки, пропуска пустых строк
и комментариев, а затем вызова некоторой функции на основе ключевого слова

```js
+function parseOBJ(text) {
+
+  const keywords = {
+  };
+
+  const keywordRE = /(\w*)(?: )*(.*)/;
+  const lines = text.split('\n');
+  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
+    const line = lines[lineNo].trim();
+    if (line === '' || line.startsWith('#')) {
+      continue;
+    }
+    const parts = line.split(/\s+/);
+    const m = keywordRE.exec(line);
+    if (!m) {
+      continue;
+    }
+    const [, keyword, unparsedArgs] = m;
+    const parts = line.split(/\s+/).slice(1);
+    const handler = keywords[keyword];
+    if (!handler) {
+      console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
+      continue;
+    }
+    handler(parts, unparsedArgs);
+  }
}
```

Некоторые вещи для заметки: Мы обрезаем каждую строку, чтобы удалить ведущие и завершающие
пробелы. Я не знаю, нужно ли это, но думаю, что это не может навредить.
Мы разделяем строку по пробелам, используя `/\s+/`. Снова я не знаю, нужно ли это.
Может ли быть больше одного пробела между данными? Могут ли
быть табуляции? Не знаю, но казалось безопаснее предположить, что есть вариации
там, учитывая, что это текстовый формат.

В противном случае мы извлекаем первую часть как ключевое слово, а затем ищем функцию
для этого ключевого слова и вызываем ее, передавая данные после ключевого слова. Итак, теперь нам
просто нужно заполнить эти функции.

Мы угадали данные `v`, `vt` и `vn` выше. Документация говорит, что `f`
означает "face" или полигон, где каждый кусок данных является
индексами в позиции, координаты текстуры и нормали.

Индексы основаны на 1, если положительные, или относительны к количеству
вершин, разобранных до сих пор, если отрицательные.
Порядок индексов: позиция/текстурная_координата/нормаль, и
что все, кроме позиции, являются необязательными, поэтому

```txt
f 1 2 3              # индексы только для позиций
f 1/1 2/2 3/3        # индексы для позиций и текстурных координат
f 1/1/1 2/2/2 3/3/3  # индексы для позиций, текстурных координат и нормалей
f 1//1 2//2 3//3     # индексы для позиций и нормалей
```

`f` может иметь больше 3 вершин, например 4 для четырехугольника
Мы знаем, что WebGL может рисовать только треугольники, поэтому нам нужно конвертировать
данные в треугольники. Не сказано, может ли грань иметь больше
4 вершин, ни не сказано, должна ли грань быть выпуклой или
может ли она быть вогнутой. Пока давайте предположим, что они вогнутые.

Также, в общем, в WebGL мы не используем разные индексы для
позиций, текстурных координат и нормалей. Вместо этого "webgl вершина"
является комбинацией всех данных для этой вершины. Так, например,
чтобы нарисовать куб, WebGL требует 36 вершин, каждая грань - это 2 треугольника,
каждый треугольник - это 3 вершины. 6 граней * 2 треугольника * 3 вершины
на треугольник = 36. Хотя есть только 8 уникальных позиций,
6 уникальных нормалей и кто знает для текстурных координат. Итак, нам
нужно будет прочитать индексы вершин грани и сгенерировать "webgl вершину",
которая является комбинацией данных всех 3 вещей. [*](webgl-pulling-vertices.html)

Итак, учитывая все это, выглядит так, что мы можем парсить эти части следующим образом

```js
function parseOBJ(text) {
  // потому что индексы основаны на 1, давайте просто заполним 0-е данные
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // тот же порядок, что и индексы `f`
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // тот же порядок, что и индексы `f`
  let webglVertexData = [
    [],   // позиции
    [],   // текстурные координаты
    [],   // нормали
  ];

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
}

Код выше создает 3 массива для хранения позиций, текстурных координат и
нормалей, разобранных из файла объекта. Он также создает 3 массива для хранения
того же для WebGL. Они также помещены в массивы в том же порядке,
что и индексы `f`, чтобы было легко ссылаться при парсинге `f`.

Другими словами, строка `f` типа

```txt
f 1/2/3 4/5/6 7/8/9
```

Одна из этих частей `4/5/6` говорит "используй позицию 4" для этой вершины грани, "используй
текстурную координату 5" и "используй нормаль 6", но помещая массивы позиций, текстурных координат и нормалей
самих в массив, массив `objVertexData`, мы можем упростить это до
"используй элемент n из objData i для webglData i", что позволяет нам сделать код проще.

В конце нашей функции мы возвращаем данные, которые мы построили

```js
  ...

  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
}
```

Все, что осталось сделать, это нарисовать данные. Сначала мы будем использовать вариацию
шейдеров из [статьи о направленном освещении](webgl-3d-lighting-directional.html).

```js
const vs = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  out vec3 v_normal;

  void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_normal = mat3(u_world) * a_normal;
  }
`;

const fs = `#version 300 es
  precision highp float;

  in vec3 v_normal;

  uniform vec4 u_diffuse;
  uniform vec3 u_lightDirection;

  out vec4 outColor;

  void main () {
    vec3 normal = normalize(v_normal);
    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    outColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
  }
`;
```

Затем, используя код из статьи о
[меньше кода больше веселья](webgl-less-code-more-fun.html)
сначала мы загрузим наши данные

```js
async function main() {
  // Получаем WebGL контекст
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Говорим twgl сопоставить position с a_position и т.д..
  twgl.setAttributePrefix("a_");

  ... шейдеры ...

  // компилирует и связывает шейдеры, ищет расположения атрибутов и uniform'ов
  const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

  const response = await fetch('resources/models/cube/cube.obj');
  const text = await response.text();
  const data = parseOBJ(text);

  // Потому что data - это просто именованные массивы, как этот
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // и потому что эти имена соответствуют атрибутам в нашем вершинном
  // шейдере, мы можем передать это напрямую в `createBufferInfoFromArrays`
  // из статьи "меньше кода больше веселья".

  // создаем буфер для каждого массива, вызывая
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  // заполняет вершинный массив, вызывая gl.createVertexArray, gl.bindVertexArray
  // затем gl.bindBuffer, gl.enableVertexAttribArray, и gl.vertexAttribPointer для каждого атрибута
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
```

и затем мы нарисуем это

```js
  const cameraTarget = [0, 0, 0];
  const cameraPosition = [0, 0, 4];
  const zNear = 0.1;
  const zFar = 50;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function render(time) {
    time *= 0.001;  // конвертируем в секунды

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    // Вычисляем матрицу камеры, используя look at.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // Делаем view матрицу из матрицы камеры.
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    // вызывает gl.uniform
    twgl.setUniforms(meshProgramInfo, sharedUniforms);

    // устанавливаем атрибуты для этой части.
    gl.bindVertexArray(vao);

    // вызывает gl.uniform
    twgl.setUniforms(meshProgramInfo, {
      u_world: m4.yRotation(time),
      u_diffuse: [1, 0.7, 0.5, 1],
    });

    // вызывает gl.drawArrays или gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
```

{{{example url="../webgl-load-obj.html"}}}

## Множество заметок

### Загрузчик выше неполный

Вы можете [прочитать больше о формате .obj](http://paulbourke.net/dataformats/obj/).
Есть тонны функций, которые код выше не поддерживает. Также код не был
протестирован на очень многих .obj файлах, поэтому, возможно, есть скрытые ошибки. Тем не менее, я
подозреваю, что большинство .obj файлов в интернете используют только функции, показанные выше, поэтому я подозреваю,
что это, вероятно, полезный пример.

### Загрузчик не проверяет ошибки

Пример: ключевое слово `vt` может иметь 3 значения на запись вместо только 2. 3 значения
были бы для 3D текстур, что не распространено, поэтому я не беспокоился. Если бы вы передали ему
файл с 3D текстурными координатами, вам пришлось бы изменить шейдеры для обработки 3D
текстур и код, который генерирует `WebGLBuffers` (вызывает `createBufferInfoFromArrays`),
чтобы сказать ему, что это 3 компонента на UV координату.

### Он предполагает, что данные однородны

Я не знаю, могут ли некоторые ключевые слова `f` иметь 3 записи,
а другие только 2 в том же файле. Если это возможно, код выше не
обрабатывает это.

Код также предполагает, что если позиции вершин имеют x, y, z, они все
имеют x, y, z. Если есть файлы, где некоторые позиции вершин
имеют x, y, z, другие имеют только x, y, а третьи имеют x, y, z, r, g, b,
тогда нам пришлось бы рефакторить.

### Вы могли бы поместить все данные в один буфер

Код выше помещает данные для позиции, текстурной координаты, нормали в отдельные буферы.
Вы могли бы поместить их в один буфер, либо перемешивая их
pos,uv,nrm,pos,uv,nrm,... но тогда вам нужно было бы изменить
то, как настроены атрибуты, чтобы передать strides и offsets.

Расширяя это, вы могли бы даже поместить данные для всех частей в те же
буферы, где как в настоящее время это один буфер на тип данных на часть.

Я оставил это, потому что не думаю, что это так важно, и потому что это загромоздило бы пример.

### Вы могли бы переиндексировать вершины

Код выше расширяет вершины в плоские списки треугольников. Мы могли бы переиндексировать
вершины. Особенно если мы поместим все данные вершин в один буфер или по крайней мере один
буфер на тип, но разделенный между частями, тогда в основном для каждого ключевого слова `f` вы конвертируете
индексы в положительные числа (переводите отрицательные числа в правильный положительный индекс),
и затем набор чисел является *id* для этой вершины. Так что вы можете хранить *карту id к индексу*
для помощи в поиске индексов.

```js
const idToIndexMap = {}
const webglIndices = [];

function addVertex(vert) {
  const ptn = vert.split('/');
  // сначала конвертируем все индексы в положительные индексы
  const indices = ptn.forEach((objIndexStr, i) => {
    if (!objIndexStr) {
      return;
    }
    const objIndex = parseInt(objIndexStr);
    return objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
  });
  // теперь посмотрим, что эта конкретная комбинация позиции,текстурной координаты,нормали
  // уже существует
  const id = indices.join(',');
  let vertIndex = idToIndexMap[id];
  if (!vertIndex) {
    // Нет. Добавляем это.
    vertIndex = webglVertexData[0].length / 3;
    idToIndexMap[id] = vertexIndex;
    indices.forEach((index, i) => {
      if (index !== undefined) {
        webglVertexData[i].push(...objVertexData[i][index]);
      }
    }
  }
  webglIndices.push(vertexIndex);
}
```

Или вы могли бы просто вручную переиндексировать, если думаете, что это важно.

### Код не обрабатывает только позиции или только позиции + текстурные координаты.

Код, как написано, предполагает, что нормали существуют. Как мы делали для
[примера с токарным станком](webgl-3d-geometry-lathe.html), мы могли бы генерировать нормали,
если они не существуют, принимая во внимание группы сглаживания, если мы хотим. Или мы
могли бы также использовать разные шейдеры, которые либо не используют нормали, либо вычисляют нормали.

### Вы не должны использовать .OBJ файлы

Честно говоря, вы не должны использовать .OBJ файлы, по моему мнению. Я в основном написал это как пример.
Если вы можете извлечь данные вершин из файла, вы можете написать импортеры для любого формата.

Проблемы с .OBJ файлами включают

* нет поддержки для света или камер

  Это может быть нормально, потому что, возможно, вы загружаете кучу частей
  (как деревья, кусты, камни для ландшафта), и вам не нужны камеры
  или свет. Тем не менее, приятно иметь опцию, если вы хотите загрузить целые сцены
  как их создал какой-то художник.

* Нет иерархии, Нет графа сцены

  Если вы хотите загрузить машину, идеально вы хотели бы иметь возможность поворачивать колеса
  и иметь их вращение вокруг их центров. Это невозможно с .OBJ,
  потому что .OBJ не содержит [граф сцены](webgl-scene-graph.html). Лучшие форматы
  включают эти данные, что намного более полезно, если вы хотите иметь возможность ориентировать
  части, сдвинуть окно, открыть дверь, двигать ноги персонажа и т.д...

* нет поддержки для анимации или скиннинга

  Мы прошли [скиннинг](webgl-skinning.html) в другом месте, но .OBJ не предоставляет
  данных для скиннинга и нет данных для анимации. Снова это может быть нормально
  для ваших потребностей, но я бы предпочел один формат, который обрабатывает больше.

* .OBJ не поддерживает более современные материалы.

  Материалы обычно довольно специфичны для движка, но в последнее время есть по крайней мере
  некоторое соглашение о физически основанных рендеринговых материалах. .OBJ не поддерживает
  это, насколько я знаю.

* .OBJ требует парсинга

  Если вы не делаете универсальный просмотрщик для пользователей, чтобы загружать .OBJ файлы в него,
  лучшая практика - использовать формат, который требует как можно меньше парсинга.
  .GLTF - это формат, разработанный для WebGL. Он использует JSON, поэтому вы можете просто загрузить его.
  Для бинарных данных он использует форматы, которые готовы загружаться в GPU напрямую,
  нет необходимости парсить числа в массивы большую часть времени.

  Вы можете увидеть пример загрузки .GLTF файла в [статье о скиннинге](webgl-skinning.html).

  Если у вас есть .OBJ файлы, которые вы хотите использовать, лучшая практика - конвертировать их
  в какой-то другой формат сначала, офлайн, а затем использовать лучший формат на вашей странице.

## Загрузка .OBJ с цветами вершин

Некоторые .OBJ файлы содержат цвета вершин. Это данные, которые хранятся в каждой вершине,
а не в материале. Давайте добавим поддержку для этого.

Сначала нужно обновить парсер, чтобы он обрабатывал ключевое слово `vc` (vertex color):

```js
function parseOBJ(text) {
  const objPositions = [];
  const objTexcoords = [];
  const objNormals = [];
  const objColors = [];
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
    objColors,
  ];

  // индексы для webgl используют 0 как базу
  const webglIndices = [];
  let geometry;
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  const keywords = {
    v(parts) {
      // если есть 4 значения, то это позиция + цвет
      if (parts.length === 6) {
        objPositions.push(parts[0], parts[1], parts[2]);
        objColors.push(parts[3], parts[4], parts[5]);
      } else {
        objPositions.push(parts[0], parts[1], parts[2]);
      }
    },
    vn(parts) {
      objNormals.push(parts[0], parts[1], parts[2]);
    },
    vt(parts) {
      objTexcoords.push(parts[0], parts[1]);
    },
    f(parts) {
      setGeometry();
      addFace(parts);
    },
    s: noop, // smoothing group
    mtllib(parts, unparsedArgs) {
      // материал библиотека
      materialLib = unparsedArgs;
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      setGeometry();
    },
    g(parts, unparsedArgs) {
      object = unparsedArgs;
      setGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      setGeometry();
    },
  };

  function setGeometry() {
    if (geometry) {
      geometry = undefined;
    }
  }

  function addFace(parts) {
    const numTriangles = parts.length - 2;
    for (let tri = 0; tri < numTriangles; ++tri) {
      addVertex(parts[0]);
      addVertex(parts[tri + 1]);
      addVertex(parts[tri + 2]);
    }
  }

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  for (const geometry of Object.values(geometries)) {
    geometry.data = {};
    if (geometry.objVertexData[0].length > 0) {
      geometry.data.position = geometry.objVertexData[0];
    }
    if (geometry.objVertexData[1].length > 0) {
      geometry.data.texcoord = geometry.objVertexData[1];
    }
    if (geometry.objVertexData[2].length > 0) {
      geometry.data.normal = geometry.objVertexData[2];
    }
    if (geometry.objVertexData[3].length > 0) {
      geometry.data.color = geometry.objVertexData[3];
    }
  }

  return {
    geometries: Object.values(geometries),
  };
}
```

Затем нужно обновить шейдеры, чтобы они использовали цвета вершин:

```js
const vs = `#version 300 es
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
in vec3 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform vec3 u_viewWorldPosition;

out vec3 v_normal;
out vec3 v_surfaceToView;
out vec2 v_texcoord;
out vec3 v_color;

void main() {
  vec4 worldPosition = u_world * a_position;
  gl_Position = u_projection * u_view * worldPosition;
  v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;

  v_normal = mat3(u_world) * a_normal;
  v_texcoord = a_texcoord;
  v_color = a_color;
}
`;

const fs = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToView;
in vec2 v_texcoord;
in vec3 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform sampler2D specularMap;
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

out vec4 outColor;

void main () {
  vec3 normal = normalize(v_normal);

  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
  vec4 specularMapColor = texture(specularMap, v_texcoord);
  vec3 effectiveSpecular = specular * specularMapColor.rgb;

  vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color;
  float effectiveOpacity = opacity * diffuseMapColor.a;

  outColor = vec4(
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse * fakeLight +
      effectiveSpecular * pow(specularLight, shininess),
      effectiveOpacity);
}
`;
```

Также нужно обновить код, который создаёт буферы, чтобы он обрабатывал цвета вершин.
Наша [вспомогательная библиотека](webgl-less-code-more-fun.html) обрабатывает это для нас, если
мы установим данные для этого атрибута как `{value: [1, 2, 3, 4]}`. Итак, мы можем
проверить, если нет цветов вершин, то если так, установить атрибут цвета вершины
как константный белый.

```js
const parts = obj.geometries.map(({data}) => {
  // Потому что data - это просто именованные массивы, как это
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // и потому что эти имена соответствуют атрибутам в нашем вершинном
  // шейдере, мы можем передать это напрямую в `createBufferInfoFromArrays`
  // из статьи "less code more fun".

  if (data.color) {
      if (data.position.length === data.color.length) {
        // это 3. Наша вспомогательная библиотека предполагает 4, поэтому нам нужно
        // сказать ей, что их только 3.
        data.color = { numComponents: 3, data: data.color };
      }
  } else {
    // нет цветов вершин, поэтому просто используем константный белый
    data.color = { value: [1, 1, 1, 1] };
  }

  // создаём буфер для каждого массива, вызывая
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
  return {
    material: {
      u_diffuse: [1, 1, 1, 1],
    },
    bufferInfo,
    vao,
  };
});
```

И с этим мы можем загрузить .OBJ файл с цветами вершин.

{{{example url="../webgl-load-obj-w-vertex-colors.html"}}}

Что касается парсинга и использования материалов, [см. следующую статью](webgl-load-obj-w-mtl.html) 