Title: WebGL2 Скайбокс
Description: Показываем небо с помощью скайбокса!
TOC: Скайбоксы

Эта статья является частью серии статей о WebGL.
[Первая статья начинается с основ](webgl-fundamentals.html).
Эта статья продолжается от [статьи о картах окружения](webgl-environment-maps.html).

*Скайбокс* - это коробка с текстурами на ней, чтобы выглядеть как небо во всех направлениях
или скорее выглядеть как то, что очень далеко, включая горизонт. Представьте,
что вы стоите в комнате, и на каждой стене есть полноразмерный постер какого-то вида,
добавьте постер, чтобы покрыть потолок, показывающий небо, и один для пола,
показывающий землю, и это скайбокс.

Многие 3D игры делают это, просто создавая куб, делая его действительно большим, помещая
на него текстуру неба.

Это работает, но имеет проблемы. Одна проблема в том, что у вас есть куб, который нужно
рассматривать в нескольких направлениях, в каком бы направлении ни была обращена камера. Вы хотите,
чтобы все рисовалось далеко, но вы не хотите, чтобы углы куба выходили
за пределы плоскости отсечения. Усложняя эту проблему, по соображениям производительности вы хотите
рисовать близкие вещи перед далекими, потому что GPU, используя [тест буфера глубины](webgl-3d-orthographic.html),
может пропустить рисование пикселей, которые, как он знает, не пройдут
тест. Так что идеально вы должны рисовать скайбокс последним с включенным тестом глубины, но
если вы действительно используете коробку, когда камера смотрит в разных направлениях,
углы коробки будут дальше, чем стороны, вызывая проблемы.

<div class="webgl_center"><img src="resources/skybox-issues.svg" style="width: 500px"></div>

Вы можете видеть выше, что нам нужно убедиться, что самая дальняя точка куба находится внутри
усеченной пирамиды, но из-за этого некоторые края куба могут в конечном итоге покрывать
объекты, которые мы не хотим покрывать.

Типичное решение - отключить тест глубины и рисовать скайбокс первым, но
тогда мы не получаем выгоды от теста буфера глубины, не рисуя пиксели, которые мы
позже покроем вещами в нашей сцене.

Вместо использования куба давайте просто нарисуем четырехугольник, который покрывает весь холст, и
используем [кубическую карту](webgl-cube-maps.html). Обычно мы используем матрицу проекции вида
для проекции четырехугольника в 3D пространстве. В этом случае мы сделаем наоборот. Мы будем использовать
обратную матрицу проекции вида, чтобы работать в обратном направлении и получить направление, в котором
камера смотрит для каждого пикселя на четырехугольнике. Это даст нам направления для
просмотра в кубическую карту.

Начиная с [примера карты окружения](webgl-environment-maps.html), я
удалил весь код, связанный с нормалями, поскольку мы не используем их здесь. Затем нам
нужен четырехугольник.

```js
// Заполняем буфер значениями, которые определяют четырехугольник.
function setGeometry(gl) {
  var positions = new Float32Array(
    [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}
```

Этот четырехугольник заполнит холст, поскольку он уже в пространстве отсечения. Поскольку есть
только 2 значения на вершину, нам нужно изменить код, который устанавливает атрибут.

```js
// Говорим атрибуту позиции, как получать данные из positionBuffer (ARRAY_BUFFER)
var size = 2;          // 2 компонента на итерацию
var type = gl.FLOAT;   // данные являются 32-битными числами с плавающей точкой
var normalize = false; // не нормализуем данные
var stride = 0;        // 0 = двигаемся вперед на size * sizeof(type) на каждой итерации, чтобы получить следующую позицию
var offset = 0;        // начинаем с начала буфера
gl.vertexAttribPointer(
    positionLocation, size, type, normalize, stride, offset)
```

Далее для вершинного шейдера мы просто устанавливаем `gl_Position` к вершинам четырехугольника напрямую.
Нет необходимости в какой-либо матричной математике, поскольку позиции уже в пространстве отсечения, настроены
для покрытия всего холста. Мы устанавливаем `gl_Position.z` в 1, чтобы гарантировать, что пиксели
имеют самую дальнюю глубину. И мы передаем позицию в фрагментный шейдер.

```glsl
#version 300 es
in vec4 a_position;
out vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = a_position;
  gl_Position.z = 1.0;
}
```

В фрагментном шейдере мы умножаем позицию на обратную матрицу проекции вида
и делим на w, чтобы перейти из 4D пространства в 3D пространство.

```glsl
#version 300 es
precision highp float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

in vec4 v_position;

// нам нужно объявить выход для фрагментного шейдера
out vec4 outColor;

void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_position;
  outColor = texture(u_skybox, normalize(t.xyz / t.w));
}
```

Наконец нам нужно найти местоположения uniform

```js
var skyboxLocation = gl.getUniformLocation(program, "u_skybox");
var viewDirectionProjectionInverseLocation =
    gl.getUniformLocation(program, "u_viewDirectionProjectionInverse");
```

и установить их

```js
// Вычисляем матрицу проекции
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix =
    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// камера движется по кругу на расстоянии 2 единиц от начала координат, смотря на начало координат
var cameraPosition = [Math.cos(time * .1), 0, Math.sin(time * .1)];
var target = [0, 0, 0];
var up = [0, 1, 0];
// Вычисляем матрицу камеры, используя look at.
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Создаем матрицу вида из матрицы камеры.
var viewMatrix = m4.inverse(cameraMatrix);

// Нас интересует только направление, поэтому убираем трансляцию
viewMatrix[12] = 0;
viewMatrix[13] = 0;
viewMatrix[14] = 0;

var viewDirectionProjectionMatrix =
    m4.multiply(projectionMatrix, viewMatrix);
var viewDirectionProjectionInverseMatrix =
    m4.inverse(viewDirectionProjectionMatrix);

// Устанавливаем uniform
gl.uniformMatrix4fv(
    viewDirectionProjectionInverseLocation, false,
    viewDirectionProjectionInverseMatrix);

// Говорим шейдеру использовать текстуру unit 0 для u_skybox
gl.uniform1i(skyboxLocation, 0);
```

Обратите внимание выше, что мы вращаем камеру вокруг начала координат, где мы вычисляем
`cameraPosition`. Затем, после преобразования `cameraMatrix` в `viewMatrix`, мы
обнуляем трансляцию, поскольку нас интересует только то, в какую сторону смотрит камера, а не
где она находится.

Из этого мы умножаем на матрицу проекции, берем обратную, а затем устанавливаем
матрицу.

{{{example url="../webgl-skybox.html" }}}

Давайте объединим куб с картой окружения обратно в этот пример. Мы будем использовать
утилиты, упомянутые в [меньше кода больше веселья](webgl-less-code-more-fun.html).

Нам нужно поместить оба набора шейдеров

```js
var envmapVertexShaderSource = `...
var envmapFragmentShaderSource = `...
var skyboxVertexShaderSource = `...
var skyboxFragmentShaderSource = `...
```

Затем компилируем шейдеры и находим все местоположения атрибутов и uniform

```js
  // Используем twgl для компиляции шейдеров и связывания в программу
  const envmapProgramInfo = twgl.createProgramInfo(
      gl, [envmapVertexShaderSource, envmapFragmentShaderSource]);
  const skyboxProgramInfo = twgl.createProgramInfo(
      gl, [skyboxVertexShaderSource, skyboxFragmentShaderSource]);
```

Настраиваем наши буферы с данными вершин. twgl уже имеет функции для предоставления этих данных, поэтому мы можем использовать их.

```js
// создаем буферы и заполняем данными вершин
const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
```

и создаем объекты вершинных массивов для каждого

```js
const cubeVAO = twgl.createVAOFromBufferInfo(gl, envmapProgramInfo, cubeBufferInfo);
const quadVAO = twgl.createVAOFromBufferInfo(gl, skyboxProgramInfo, quadBufferInfo);
```

Во время рендеринга мы вычисляем все матрицы

```js
// камера движется по кругу на расстоянии 2 единиц от начала координат, смотря на начало координат
var cameraPosition = [Math.cos(time * .1) * 2, 0, Math.sin(time * .1) * 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// Вычисляем матрицу камеры, используя look at.
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Создаем матрицу вида из матрицы камеры.
var viewMatrix = m4.inverse(cameraMatrix);

// Вращаем куб вокруг оси x
var worldMatrix = m4.xRotation(time * 0.11);

// Нас интересует только направление, поэтому убираем трансляцию
var viewDirectionMatrix = m4.copy(viewMatrix);
viewDirectionMatrix[12] = 0;
viewDirectionMatrix[13] = 0;
viewDirectionMatrix[14] = 0;

var viewDirectionProjectionMatrix = m4.multiply(
    projectionMatrix, viewDirectionMatrix);
var viewDirectionProjectionInverseMatrix =
    m4.inverse(viewDirectionProjectionMatrix);
```

Затем сначала рисуем куб

```js
// рисуем куб
gl.depthFunc(gl.LESS);  // используем тест глубины по умолчанию
gl.useProgram(envmapProgramInfo.program);
gl.bindVertexArray(cubeVAO);
twgl.setUniforms(envmapProgramInfo, {
  u_world: worldMatrix,
  u_view: viewMatrix,
  u_projection: projectionMatrix,
  u_texture: texture,
  u_worldCameraPosition: cameraPosition,
});
twgl.drawBufferInfo(gl, cubeBufferInfo);
```

затем скайбокс

```js
// рисуем скайбокс

// позволяем нашему четырехугольнику пройти тест глубины на 1.0
gl.depthFunc(gl.LEQUAL);

gl.useProgram(skyboxProgramInfo.program);
gl.bindVertexArray(quadVAO);
twgl.setUniforms(skyboxProgramInfo, {
  u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
  u_skybox: texture,
});
twgl.drawBufferInfo(gl, quadBufferInfo);
```

Обратите внимание, что наш код загрузки текстур также может быть заменен использованием наших вспомогательных
функций

```js
// Создаем текстуру.
-const texture = gl.createTexture();
-gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
-
-const faceInfos = [
-  {
-    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
-    url: 'resources/images/computer-history-museum/pos-x.jpg',
-  },
-  {
-    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
-    url: 'resources/images/computer-history-museum/neg-x.jpg',
-  },
-  {
-    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
-    url: 'resources/images/computer-history-museum/pos-y.jpg',
-  },
-  {
-    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
-    url: 'resources/images/computer-history-museum/neg-y.jpg',
-  },
-  {
-    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
-    url: 'resources/images/computer-history-museum/pos-z.jpg',
-  },
-  {
-    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
-    url: 'resources/images/computer-history-museum/neg-z.jpg',
-  },
-];
-faceInfos.forEach((faceInfo) => {
-  const {target, url} = faceInfo;
-
-  // Загружаем canvas в грань cubemap.
-  const level = 0;
-  const internalFormat = gl.RGBA;
-  const width = 512;
-  const height = 512;
-  const format = gl.RGBA;
-  const type = gl.UNSIGNED_BYTE;
-
-  // настраиваем каждую грань так, чтобы она была сразу рендерируемой
-  gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
-
-  // Асинхронно загружаем изображение
-  const image = new Image();
-  image.src = url;
-  image.addEventListener('load', function() {
-    // Теперь, когда изображение загружено, копируем его в текстуру.
-    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
-    gl.texImage2D(target, level, internalFormat, format, type, image);
-    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
-  });
-});
-gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
-gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
+const texture = twgl.createTexture(gl, {
+  target: gl.TEXTURE_CUBE_MAP,
+  src: [
+    'resources/images/computer-history-museum/pos-x.jpg',
+    'resources/images/computer-history-museum/neg-x.jpg',
+    'resources/images/computer-history-museum/pos-y.jpg',
+    'resources/images/computer-history-museum/neg-y.jpg',
+    'resources/images/computer-history-museum/pos-z.jpg',
+    'resources/images/computer-history-museum/neg-z.jpg',
+  ],
+  min: gl.LINEAR_MIPMAP_LINEAR,
+});
```

и

{{{example url="../webgl-skybox-plus-environment-map.html" }}}

Я надеюсь, что эти последние 3 статьи дали вам некоторое представление о том, как использовать кубическую карту.
Обычно, например, берут код [из вычисления освещения](webgl-3d-lighting-spot.html)
и объединяют этот результат с результатами
карты окружения, чтобы создавать материалы, такие как капот автомобиля или полированный пол.
Также есть техника вычисления освещения с использованием кубических карт. Это то же самое, что и
карта окружения, за исключением того, что вместо использования значения, которое вы получаете из карты окружения
как цвета, вы используете его как вход для ваших уравнений освещения.

и создаем объекты массива вершин для каждого

```js
const cubeVAO = twgl.createVAOFromBufferInfo(gl, envmapProgramInfo, cubeBufferInfo);
const quadVAO = twgl.createVAOFromBufferInfo(gl, skyboxProgramInfo, quadBufferInfo);
```

Во время рендеринга мы вычисляем все матрицы

```js
// камера движется по кругу на расстоянии 2 единиц от начала координат, смотря на начало координат
var cameraPosition = [Math.cos(time * .1) * 2, 0, Math.sin(time * .1) * 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// Вычисляем матрицу камеры, используя look at.
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Создаем матрицу вида из матрицы камеры.
var viewMatrix = m4.inverse(cameraMatrix);

// Вращаем куб вокруг оси x
var worldMatrix = m4.xRotation(time * 0.11);

// Нас интересует только направление, поэтому убираем перемещение
var viewDirectionMatrix = m4.copy(viewMatrix);
viewDirectionMatrix[12] = 0;
viewDirectionMatrix[13] = 0;
viewDirectionMatrix[14] = 0;

var viewDirectionProjectionMatrix = m4.multiply(
    projectionMatrix, viewDirectionMatrix);
var viewDirectionProjectionInverseMatrix =
    m4.inverse(viewDirectionProjectionMatrix);
```

Затем сначала рисуем куб

```js
// рисуем куб
gl.depthFunc(gl.LESS);  // используем тест глубины по умолчанию
gl.useProgram(envmapProgramInfo.program);
gl.bindVertexArray(cubeVAO);
twgl.setUniforms(envmapProgramInfo, {
  u_world: worldMatrix,
  u_view: viewMatrix,
  u_projection: projectionMatrix,
  u_texture: texture,
  u_worldCameraPosition: cameraPosition,
});
twgl.drawBufferInfo(gl, cubeBufferInfo);
```

затем skybox

```js
// рисуем skybox

// позволяем нашему четырехугольнику пройти тест глубины на 1.0
gl.depthFunc(gl.LEQUAL);

gl.useProgram(skyboxProgramInfo.program);
gl.bindVertexArray(quadVAO);
twgl.setUniforms(skyboxProgramInfo, {
  u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
  u_skybox: texture,
});
twgl.drawBufferInfo(gl, quadBufferInfo);
```

Обратите внимание, что наш код загрузки текстур также может быть заменен использованием наших вспомогательных
функций

```js
// Создаем текстуру.
const texture = twgl.createTexture(gl, {
  target: gl.TEXTURE_CUBE_MAP,
  src: [
    'resources/images/computer-history-museum/pos-x.jpg',
    'resources/images/computer-history-museum/neg-x.jpg',
    'resources/images/computer-history-museum/pos-y.jpg',
    'resources/images/computer-history-museum/neg-y.jpg',
    'resources/images/computer-history-museum/pos-z.jpg',
    'resources/images/computer-history-museum/neg-z.jpg',
  ],
  min: gl.LINEAR_MIPMAP_LINEAR,
});
```

и

{{{example url="../webgl-skybox-plus-environment-map.html" }}}

Я надеюсь, что эти последние 3 статьи дали вам некоторое представление о том, как использовать cubemap.
Это распространено, например, взять код [из вычисления освещения](webgl-3d-lighting-spot.html)
и объединить этот результат с результатами из
карты окружения, чтобы сделать материалы, такие как капот автомобиля или полированный пол.
Есть также техника для вычисления освещения с использованием cubemap. Это то же самое, что и
карта окружения, за исключением того, что вместо использования значения, которое вы получаете из карты окружения
как цвет, вы используете его как вход для ваших уравнений освещения. 