Title: WebGL2 Fog
Description: Как реализовать туман
TOC: Fog


Эта статья является частью серии статей о WebGL.
[Первая статья начинается с основ](webgl-fundamentals.html).

Туман в WebGL интересен мне тем, насколько *фальшивым* он кажется, когда я думаю о том, как он работает. В основном то, что вы делаете, это используете какой-то вид глубины или расстояния от камеры в ваших шейдерах, чтобы сделать цвет более или менее цветом тумана.

Другими словами, вы начинаете с базового уравнения вроде этого

```glsl
outColor = mix(originalColor, fogColor, fogAmount);
```

Где `fogAmount` - это значение от 0 до 1. Функция `mix` смешивает первые 2 значения. Когда `fogAmount` равен 0, `mix` возвращает `originalColor`. Когда `fogAmount` равен 1, `mix` возвращает `fogColor`. Между 0 и 1 вы получаете процент обоих цветов. Вы могли бы реализовать `mix` сами так

```glsl
outColor = originalColor + (fogColor - originalColor) * fogAmount;
```

Давайте сделаем шейдер, который делает это. Мы будем использовать текстурированный куб из [статьи о текстурах](webgl-3d-textures.html).

Давайте добавим смешивание в фрагментный шейдер

```glsl
#version 300 es
precision highp float;

// Передается из вершинного шейдера.
in vec2 v_texcoord;

// Текстура.
uniform sampler2D u_texture;

uniform vec4 u_fogColor;
uniform float u_fogAmount;

out vec4 outColor;

void main() {
  vec4 color = texture(u_texture, v_texcoord);
  outColor = mix(color, u_fogColor, u_fogAmount);  
}
```

Затем во время инициализации нам нужно найти новые локации uniform

```js
var fogColorLocation = gl.getUniformLocation(program, "u_fogColor");
var fogAmountLocation = gl.getUniformLocation(program, "u_fogAmount");
```

и во время рендеринга установить их

```js
var fogColor = [0.8, 0.9, 1, 1];
var settings = {
  fogAmount: .5,
};

...

function drawScene(time) {
  ...

  // Очищаем canvas И буфер глубины.
  // Очищаем до цвета тумана
  gl.clearColor(...fogColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // устанавливаем цвет тумана и количество
  gl.uniform4fv(fogColorLocation, fogColor);
  gl.uniform1f(fogAmountLocation, settings.fogAmount);

  ...
}
```

И вот вы увидите, если вы перетащите слайдер, вы можете изменить между текстурой и цветом тумана

{{{example url="../webgl-3d-fog-just-mix.html" }}}

Так что теперь все, что нам действительно нужно сделать, это вместо передачи количества тумана, мы вычисляем его на основе чего-то вроде глубины от камеры.

Вспомните из статьи о [камерах](webgl-3d-camera.html), что после применения матрицы вида все позиции относительны к камере. Камера смотрит вниз по оси -z, поэтому если мы просто посмотрим на z позицию после умножения на мировую и видовую матрицы, мы получим значение, которое представляет, как далеко что-то находится от z плоскости камеры.

Давайте изменим вершинный шейдер, чтобы передать эти данные в фрагментный шейдер, чтобы мы могли использовать их для вычисления количества тумана. Для этого давайте разделим `u_matrix` на 2 части. Матрицу проекции и мировую видовую матрицу.

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_worldView;
uniform mat4 u_projection;

out vec2 v_texcoord;
out float v_fogDepth;

void main() {
  // Умножаем позицию на матрицу.
  gl_Position = u_projection * u_worldView * a_position;

  // Передаем texcoord в фрагментный шейдер.
  v_texcoord = a_texcoord;

  // Передаем только отрицательную z позицию относительно камеры.
  // камера смотрит в направлении -z, поэтому обычно вещи
  // перед камерой имеют отрицательную Z позицию
  // но отрицая это, мы получаем положительную глубину.
  v_fogDepth = -(u_worldView * a_position).z;
}
```

Теперь во фрагментном шейдере мы хотим, чтобы он работал так: если глубина меньше некоторого значения, не смешивать никакой туман (fogAmount = 0). Если глубина больше некоторого значения, то 100% туман (fogAmount = 1). Между этими 2 значениями смешиваем цвета.

Мы могли бы написать код для этого, но GLSL имеет функцию `smoothstep`, которая делает именно это. Вы даете ей минимальное значение, максимальное значение и значение для тестирования. Если тестовое значение меньше или равно минимальному значению, она возвращает 0. Если тестовое значение больше или равно максимальному значению, она возвращает 1. Если тест между этими 2 значениями, она возвращает что-то между 0 и 1 пропорционально тому, где тестовое значение находится между min и max.

Итак, должно быть довольно легко использовать это в нашем фрагментном шейдере для вычисления количества тумана

```glsl
#version 300 es
precision highp float;

// Передается из вершинного шейдера.
in vec2 v_texcoord;
in float v_fogDepth;

// Текстура.
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;

out vec4 outColor;

void main() {
  vec4 color = texture(u_texture, v_texcoord);

  float fogAmount = smoothstep(u_fogNear, u_fogFar, v_fogDepth);

  outColor = mix(color, u_fogColor, fogAmount);  
}
```

и конечно нам нужно найти все эти uniforms во время инициализации

```js
// ищем uniforms
var projectionLocation = gl.getUniformLocation(program, "u_projection");
var worldViewLocation = gl.getUniformLocation(program, "u_worldView");
var textureLocation = gl.getUniformLocation(program, "u_texture");
var fogColorLocation = gl.getUniformLocation(program, "u_fogColor");
var fogNearLocation = gl.getUniformLocation(program, "u_fogNear");
var fogFarLocation = gl.getUniformLocation(program, "u_fogFar");
```

и установить их во время рендеринга

```js
var fogColor = [0.8, 0.9, 1, 1];
var settings = {
  fogNear: 1.1,
  fogFar: 2.0,
};

// Рисуем сцену.
function drawScene(time) {
  ...

  // Вычисляем матрицу проекции
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 0, 2];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // Вычисляем матрицу камеры используя look at.
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // Делаем видовую матрицу из матрицы камеры.
  var viewMatrix = m4.inverse(cameraMatrix);

  var worldViewMatrix = m4.xRotate(viewMatrix, modelXRotationRadians);
  worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians);

  // Устанавливаем матрицы.
  gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
  gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

  // Говорим шейдеру использовать texture unit 0 для u_texture
  gl.uniform1i(textureLocation, 0);

  // устанавливаем цвет тумана и настройки near, far
  gl.uniform4fv(fogColorLocation, fogColor);
  gl.uniform1f(fogNearLocation, settings.fogNear);
  gl.uniform1f(fogFarLocation, settings.fogFar);
}
```

Пока мы этим занимаемся, давайте нарисуем 40 кубов вдаль, чтобы легче было увидеть туман.

```js
var settings = {
  fogNear: 1.1,
  fogFar: 2.0,
  xOff: 1.1,
  zOff: 1.4,
};

...

const numCubes = 40;
for (let i = 0; i <= numCubes; ++i) {
  var worldViewMatrix = m4.translate(viewMatrix, -2 + i * settings.xOff, 0, -i * settings.zOff);
  worldViewMatrix = m4.xRotate(worldViewMatrix, modelXRotationRadians + i * 0.1);
  worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians + i * 0.1);

  gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

  // Рисуем геометрию.
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
}
```

И теперь мы получаем туман на основе глубины

{{{example url="../webgl-3d-fog-depth-based.html" }}}

Примечание: Мы не добавили никакого кода, чтобы убедиться, что `fogNear` меньше или равен `fogFar`, что, возможно, недопустимые настройки, поэтому обязательно установите оба соответствующим образом.

Как я упомянул выше, это кажется мне трюком. Это работает, потому что цвет тумана, к которому мы переходим, соответствует цвету фона. Измените цвет фона, и иллюзия исчезает.

```js
gl.clearColor(1, 0, 0, 1);  // красный
```

дает нам

<div class="webgl_center"><img src="resources/fog-background-color-mismatch.png"></div>

так что просто помните, что вам нужно установить цвет фона, чтобы он соответствовал цвету тумана.

Использование глубины работает и это дешево, но есть проблема. Допустим, у вас есть круг объектов вокруг камеры. Мы вычисляем количество тумана на основе расстояния от z плоскости камеры. Это означает, что когда вы поворачиваете камеру, объекты будут появляться и исчезать из тумана слегка, когда их z значение в пространстве вида становится ближе к 0

<div class="webgl_center"><img src="resources/fog-depth.svg" style="width: 600px;"></div>

Вы можете увидеть проблему в этом примере

{{{example url="../webgl-3d-fog-depth-based-issue.html" }}}

Выше есть кольцо из 8 кубов прямо вокруг камеры. Камера вращается на месте. Это означает, что кубы всегда на одинаковом расстоянии от камеры, но на разном расстоянии от z плоскости, и поэтому наш расчет количества тумана приводит к тому, что кубы у края выходят из тумана.
 
Исправление заключается в том, чтобы вместо этого вычислять расстояние от камеры, которое будет одинаковым для всех кубов

<div class="webgl_center"><img src="resources/fog-distance.svg" style="width: 600px;"></div>

Для этого нам просто нужно передать позицию вершины в пространстве вида из вершинного шейдера в фрагментный шейдер

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_worldView;
uniform mat4 u_projection;

out vec2 v_texcoord;
out vec3 v_position;

void main() {
  // Умножаем позицию на матрицу.
  gl_Position = u_projection * u_worldView * a_position;

  // Передаем texcoord в фрагментный шейдер.
  v_texcoord = a_texcoord;

  // Передаем позицию вида в фрагментный шейдер
  v_position = (u_worldView * a_position).xyz;
}
```

и затем во фрагментном шейдере мы можем использовать позицию для вычисления расстояния

```
#version 300 es
precision highp float;

// Передается из вершинного шейдера.
in vec2 v_texcoord;
in vec3 v_position;

// Текстура.
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;

out vec4 outColor;

void main() {
  vec4 color = texture(u_texture, v_texcoord);

  float fogDistance = length(v_position);
  float fogAmount = smoothstep(u_fogNear, u_fogFar, fogDistance);

  outColor = mix(color, u_fogColor, fogAmount);  
}
```

И теперь кубы больше не выходят из тумана, когда камера поворачивается

{{{example url="../webgl-3d-fog-distance-based.html" }}}

Пока что весь наш туман использовал линейный расчет. Другими словами, цвет тумана применяется линейно между near и far. Как и многие вещи в реальном мире, туман, по-видимому, работает экспоненциально. Он становится гуще с квадратом расстояния от зрителя. Общее уравнение для экспоненциального тумана

```glsl
#define LOG2 1.442695

fogAmount = 1. - exp2(-fogDensity * fogDensity * fogDistance * fogDistance * LOG2));
fogAmount = clamp(fogAmount, 0., 1.);
```

Чтобы использовать это, мы изменили бы фрагментный шейдер на что-то вроде

```glsl
#version 300 es
precision highp float;

// Передается из вершинного шейдера.
in vec2 v_texcoord;
in vec3 v_position;

// Текстура.
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
uniform float u_fogDensity;

out vec4 outColor;

void main() {
  vec4 color = texture(u_texture, v_texcoord);

  #define LOG2 1.442695

  float fogDistance = length(v_position);
  float fogAmount = 1. - exp2(-u_fogDensity * u_fogDensity * fogDistance * fogDistance * LOG2);
  fogAmount = clamp(fogAmount, 0., 1.);

  outColor = mix(color, u_fogColor, fogAmount);  
}
```

И мы получаем туман на основе расстояния *exp2* плотности

{{{example url="../webgl-3d-fog-distance-exp2.html" }}}

Одна вещь, которую стоит заметить о тумане на основе плотности, это то, что нет настроек near и far. Это может быть более реалистично, но также может не соответствовать вашим эстетическим потребностям. Какой из них вы предпочитаете - это художественное решение.

Есть много других способов вычисления тумана. На маломощном GPU вы можете просто использовать `gl_FragCoord.z`. `gl_FragCoord` - это глобальная переменная, которую устанавливает WebGL. Компоненты `x` и `y` - это координаты пикселя, который рисуется. Компонент `z` - это глубина этого пикселя от 0 до 1. Хотя не напрямую переводится в расстояние, вы все еще можете получить что-то, что выглядит как туман, выбрав некоторые значения между 0 и 1 для near и far. Ничего не нужно передавать из вершинного шейдера в фрагментный шейдер, и никакие вычисления расстояния не нужны, так что это один способ сделать дешевый эффект тумана на маломощном GPU.

{{{example url="../webgl-3d-fog-depth-based-gl_FragCoord.html" }}} 