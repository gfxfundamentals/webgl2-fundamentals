Title: WebGL2 Карты окружения (отражения)
Description: Как реализовать карты окружения.
TOC: Карты окружения

Эта статья является частью серии статей о WebGL2.
[Первая статья начинается с основ](webgl-fundamentals.html).
Эта статья продолжается от [статьи о кубических картах](webgl-cube-maps.html).
Эта статья также использует концепции, рассмотренные в [статье об освещении](webgl-3d-lighting-directional.html).
Если вы еще не читали эти статьи, возможно, вы захотите прочитать их сначала.

*Карта окружения* представляет окружение объектов, которые вы рисуете.
Если вы рисуете уличную сцену, она будет представлять улицу. Если
вы рисуете людей на сцене, она будет представлять место проведения. Если вы рисуете
космическую сцену, это будут звезды. Мы можем реализовать карту окружения
с кубической картой, если у нас есть 6 изображений, которые показывают окружение с точки в
пространстве в 6 направлениях кубической карты.

Вот карта окружения из лобби Музея истории компьютеров в Маунтин-Вью, Калифорния.

<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/pos-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-y.jpg" style="width: 128px" class="border">
</div>
<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/neg-y.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-z.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-z.jpg" style="width: 128px" class="border">
</div>

Основываясь на [коде в предыдущей статье](webgl-cube-maps.html), давайте загрузим эти 6 изображений вместо изображений, которые мы сгенерировали

```js
// Создаем текстуру.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

const faceInfos = [
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    url: 'resources/images/computer-history-museum/pos-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    url: 'resources/images/computer-history-museum/neg-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    url: 'resources/images/computer-history-museum/pos-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    url: 'resources/images/computer-history-museum/neg-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    url: 'resources/images/computer-history-museum/pos-z.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    url: 'resources/images/computer-history-museum/neg-z.jpg',
  },
];
faceInfos.forEach((faceInfo) => {
  const {target, url} = faceInfo;

  // Загружаем холст в грань кубической карты.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 512;
  const height = 512;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;

  // настраиваем каждую грань так, чтобы она была сразу рендерируемой
  gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

  // Асинхронно загружаем изображение
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // Теперь, когда изображение загружено, загружаем его в текстуру.
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(target, level, internalFormat, format, type, image);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  });
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

Обратите внимание, что для каждой грани мы инициализируем ее 512x512 пустым изображением, передавая
`null` в `texImage2D`. Кубические карты должны иметь все 6 граней, все 6 граней должны быть
одинакового размера и быть квадратными. Если они не такие, текстура не будет рендериться. Но мы
загружаем 6 изображений. Мы хотели бы начать рендеринг сразу, поэтому мы выделяем все 6
граней, затем начинаем загружать изображения. Когда каждое изображение прибывает, мы загружаем его в
правильную грань, затем снова генерируем мипмап. Это означает, что мы можем начать рендеринг
сразу, и по мере загрузки изображений грани кубической карты будут
заполняться изображениями по одному и все еще будут рендерируемыми, даже если все 6
еще не прибыли.

Но просто загрузка изображений недостаточна. Как и в
[освещении](webgl-3d-lighting-point.html), нам нужна небольшая математика здесь.

В этом случае мы хотим знать для каждого фрагмента, который нужно нарисовать, учитывая вектор от
глаза/камеры к этой позиции на поверхности объекта, в каком направлении
он отразится от этой поверхности. Мы можем затем использовать это направление, чтобы получить
цвет из кубической карты.

Формула для отражения

    reflectionDir = eyeToSurfaceDir –
        2 ∗ dot(surfaceNormal, eyeToSurfaceDir) ∗ surfaceNormal

Думая о том, что мы можем видеть, это правда. Напомним из [статей об освещении](webgl-3d-lighting-directional.html),
что скалярное произведение 2 векторов возвращает косинус угла между 2
векторами. Сложение векторов дает нам новый вектор, так что давайте возьмем пример глаза,
смотрящего прямо перпендикулярно плоской поверхности.

<div class="webgl_center"><img src="resources/reflect-180-01.svg" style="width: 400px"></div>

Давайте визуализируем формулу выше. Сначала напомним, что скалярное произведение 2 векторов,
указывающих в точно противоположных направлениях, равно -1, так что визуально

<div class="webgl_center"><img src="resources/reflect-180-02.svg" style="width: 400px"></div>

Подставляя это скалярное произведение с <span style="color:black; font-weight:bold;">eyeToSurfaceDir</span>
и <span style="color:green;">normal</span> в формулу отражения, мы получаем это

<div class="webgl_center"><img src="resources/reflect-180-03.svg" style="width: 400px"></div>

Что умножение -2 на -1 делает его положительным 2.

<div class="webgl_center"><img src="resources/reflect-180-04.svg" style="width: 400px"></div>

Так что сложение векторов путем их соединения дает нам <span style="color: red">отраженный вектор</span>

<div class="webgl_center"><img src="resources/reflect-180-05.svg" style="width: 400px"></div>

Мы можем видеть выше, что учитывая 2 нормали, одна полностью компенсирует направление от
глаза, а вторая указывает отражение прямо обратно к глазу.
Что, если мы вернем в исходную диаграмму, точно то, что мы ожидали бы

<div class="webgl_center"><img src="resources/reflect-180-06.svg" style="width: 400px"></div>

Давайте повернем поверхность на 45 градусов вправо.

<div class="webgl_center"><img src="resources/reflect-45-01.svg" style="width: 400px"></div>

Скалярное произведение 2 векторов на расстоянии 135 градусов равно -0.707

<div class="webgl_center"><img src="resources/reflect-45-02.svg" style="width: 400px"></div>

Так что подставляя все в формулу

<div class="webgl_center"><img src="resources/reflect-45-03.svg" style="width: 400px"></div>

Снова умножение 2 отрицательных дает нам положительное, но <span style="color: green">вектор</span> теперь примерно на 30% короче.

<div class="webgl_center"><img src="resources/reflect-45-04.svg" style="width: 400px"></div>

Сложение векторов дает нам <span style="color: red">отраженный вектор</span>

<div class="webgl_center"><img src="resources/reflect-45-05.svg" style="width: 400px"></div>

Что, если мы вернем в исходную диаграмму, кажется правильным.

<div class="webgl_center"><img src="resources/reflect-45-06.svg" style="width: 400px"></div>

Мы используем это <span style="color: red">отраженное направление</span>, чтобы посмотреть на кубическую карту для окрашивания поверхности объекта.

Вот диаграмма, где вы можете установить вращение поверхности и увидеть
различные части уравнения. Вы также можете увидеть, как векторы отражения указывают на
различные грани кубической карты и влияют на цвет поверхности.

{{{diagram url="resources/environment-mapping.html" width="400" height="400" }}}

Теперь, когда мы знаем, как работает отражение, и что мы можем использовать его для поиска значений
из кубической карты, давайте изменим шейдеры, чтобы делать это.

Сначала в вершинном шейдере мы вычислим мировую позицию и мировую ориентированную
нормаль вершин и передадим их в фрагментный шейдер как varying. Это
похоже на то, что мы делали в [статье о прожекторах](webgl-3d-lighting-spot.html).

```glsl
#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec3 v_worldPosition;
out vec3 v_worldNormal;

void main() {
  // Умножаем позицию на матрицу.
  gl_Position = u_projection * u_view * u_world * a_position;

  // передаем позицию вида в фрагментный шейдер
  v_worldPosition = (u_world * a_position).xyz;

  // ориентируем нормали и передаем в фрагментный шейдер
  v_worldNormal = mat3(u_world) * a_normal;
}
```

Затем в фрагментном шейдере мы нормализуем `worldNormal`, поскольку он
интерполируется по поверхности между вершинами. Мы передаем мировую позицию
камеры и, вычитая ее из мировой позиции поверхности, мы
получаем `eyeToSurfaceDir`.

И наконец мы используем `reflect`, которая является встроенной функцией GLSL, реализующей
формулу, которую мы рассмотрели выше. Мы используем результат, чтобы получить цвет из
кубической карты.

```glsl
#version 300 es

precision highp float;

// Передается из вершинного шейдера.
in vec3 v_worldPosition;
in vec3 v_worldNormal;

// Текстура.
uniform samplerCube u_texture;

// Позиция камеры
uniform vec3 u_worldCameraPosition;

// нам нужно объявить выход для фрагментного шейдера
out vec4 outColor;

void main() {
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

  outColor = texture(u_texture, direction);
}
```

Нам также нужны реальные нормали для этого примера. Нам нужны реальные нормали, чтобы грани
куба выглядели плоскими. В предыдущем примере просто чтобы увидеть работу кубической карты мы
перепрофилировали позиции куба, но в этом случае нам нужны фактические нормали для
куба, как мы рассмотрели в [статье об освещении](webgl-3d-lighting-directional.html)

Во время инициализации

```js
// Создаем буфер для размещения нормалей
var normalBuffer = gl.createBuffer();
// Привязываем его к ARRAY_BUFFER (думайте об этом как ARRAY_BUFFER = normalBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
// Помещаем данные нормалей в буфер
setNormals(gl);

// Говорим атрибуту, как получать данные из normalBuffer (ARRAY_BUFFER)
var size = 3;          // 3 компонента на итерацию
var type = gl.FLOAT;   // данные являются 32-битными значениями с плавающей точкой
var normalize = false; // нормализуем данные (конвертируем из 0-255 в 0-1)
var stride = 0;        // 0 = двигаемся вперед на size * sizeof(type) на каждой итерации, чтобы получить следующую позицию
var offset = 0;        // начинаем с начала буфера
gl.vertexAttribPointer(
    normalLocation, size, type, normalize, stride, offset)
```

И конечно нам нужно найти местоположения uniform во время инициализации

```js
var projectionLocation = gl.getUniformLocation(program, "u_projection");
var viewLocation = gl.getUniformLocation(program, "u_view");
var worldLocation = gl.getUniformLocation(program, "u_world");
var textureLocation = gl.getUniformLocation(program, "u_texture");
var worldCameraPositionLocation = gl.getUniformLocation(program, "u_worldCameraPosition");
```

и установить их во время рендеринга

```js
// Вычисляем матрицу проекции
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix =
    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);

var cameraPosition = [0, 0, 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// Вычисляем матрицу камеры, используя look at.
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Создаем матрицу вида из матрицы камеры.
var viewMatrix = m4.inverse(cameraMatrix);

var worldMatrix = m4.xRotation(modelXRotationRadians);
worldMatrix = m4.yRotate(worldMatrix, modelYRotationRadians);

// Устанавливаем uniform
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
gl.uniform3fv(worldCameraPositionLocation, cameraPosition);

// Говорим шейдеру использовать текстуру unit 0 для u_texture
gl.uniform1i(textureLocation, 0);
```

Базовые отражения

{{{example url="../webgl-environment-map.html" }}}

Далее давайте покажем [как использовать кубическую карту для скайбокса](webgl-skybox.html). 