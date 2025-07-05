Title: WebGL2 Рисование без данных
Description: Креативное программирование - Рисование без данных
TOC: Рисование без данных

Эта статья предполагает, что вы прочитали многие другие статьи,
начиная с [основ](webgl-fundamentals.html).
Если вы их не читали, пожалуйста, начните сначала с них.

В [статье о самых маленьких WebGL программах](webgl-smallest-programs.html)
мы рассмотрели некоторые примеры рисования с очень небольшим количеством кода.
В этой статье мы рассмотрим рисование без данных.

Традиционно WebGL приложения помещают геометрические данные в буферы.
Затем они используют атрибуты для извлечения данных вершин из этих буферов
в шейдеры и преобразования их в clip space.

Слово **традиционно** важно. Это только **традиция**
делать это таким образом. Это никоим образом не требование. WebGL не
заботится о том, как мы это делаем, он заботится только о том, что наши вершинные шейдеры
присваивают координаты clip space `gl_Position`.

В GLSL ES 3.0 есть специальная переменная `gl_VertexID`,
доступная в вершинных шейдерах. Эффективно она считает вершины.
Давайте используем её для рисования вычисления позиций вершин без данных.
Мы вычислим точки круга на основе этой переменной.

```glsl
#version 300 es
uniform int numVerts;

#define PI radians(180.0)

void main() {
  float u = float(gl_VertexID) / float(numVerts);  // идет от 0 до 1
  float angle = u * PI * 2.0;                      // идет от 0 до 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;
  
  gl_Position = vec4(pos, 0, 1);
  gl_PointSize = 5.0;
}
```

Код выше должен быть довольно простым.
`gl_VertexID` будет считать от 0 до того количества
вершин, которое мы просим нарисовать. Мы передадим то же число
как `numVerts`.
На основе этого мы генерируем позиции для круга.

Если бы мы остановились там, круг был бы эллипсом,
потому что clip space нормализован (идет от -1 до 1)
поперек и вниз по canvas. Если мы передадим разрешение,
мы можем учесть, что -1 до 1 поперек может не
представлять то же пространство, что и -1 до 1 вниз по canvas.

```glsl
#version 300 es
uniform int numVerts;
uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  float u = float(gl_VertexID) / float(numVerts);  // идет от 0 до 1
  float angle = u * PI * 2.0;                      // идет от 0 до 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;
  
  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
  gl_Position = vec4(pos * scale, 0, 1);
  gl_PointSize = 5.0;
}
```

И наш фрагментный шейдер может просто рисовать сплошной цвет

```glsl
#version 300 es
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(1, 0, 0, 1);
}
```

В нашем JavaScript во время инициализации мы скомпилируем шейдер и найдем uniforms,

```js
// настройка GLSL программы
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
const resolutionLoc = gl.getUniformLocation(program, 'resolution');
```

И для рендеринга мы будем использовать программу,
установим uniforms `resolution` и `numVerts`, и нарисуем точки.

```js
gl.useProgram(program);

const numVerts = 20;

// сказать шейдеру количество вершин
gl.uniform1i(numVertsLoc, numVerts);
// сказать шейдеру разрешение
gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

const offset = 0;
gl.drawArrays(gl.POINTS, offset, numVerts);
```

И мы получаем круг из точек.

{{{example url="../webgl-no-data-point-circle.html"}}}

Полезна ли эта техника? Ну, с некоторым креативным кодом
мы могли бы сделать звездное поле или простой эффект дождя с
почти без данных и одним вызовом рисования.

Давайте сделаем дождь, просто чтобы увидеть, как это работает. Сначала мы
изменим вершинный шейдер на

```glsl
#version 300 es
uniform int numVerts;
uniform float time;

void main() {
  float u = float(gl_VertexID) / float(numVerts);  // идет от 0 до 1
  float x = u * 2.0 - 1.0;                         // -1 до 1
  float y = fract(time + u) * -2.0 + 1.0;          // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 5.0;
}
```

Для этой ситуации нам не нужно разрешение.

Мы добавили uniform `time`, который будет временем
в секундах с момента загрузки страницы.

Для 'x' мы просто пойдем от -1 до 1

Для 'y' мы используем `time + u`, но `fract` возвращает
только дробную часть, так что значение от 0.0 до 1.0.
Расширяя это до 1.0 до -1.0, мы получаем y, который повторяется
со временем, но тот, который смещен по-разному для каждой
точки.

Давайте изменим цвет на синий в фрагментном шейдере.

```glsl
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(0, 0, 1, 1);
}
```

Затем в JavaScript нам нужно найти uniform времени

```js
// настройка GLSL программы
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
const timeLoc = gl.getUniformLocation(program, 'time');
```

И нам нужно преобразовать код в [анимацию](webgl-animation.html),
создав цикл рендеринга и установив uniform `time`.

```js
function render(time) {
  time *= 0.001;  // преобразовать в секунды

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  const numVerts = 20;

  // сказать шейдеру количество вершин
  gl.uniform1i(numVertsLoc, numVerts);
  // сказать шейдеру время
  gl.uniform1f(timeLoc, time);

  const offset = 0;
  gl.drawArrays(gl.POINTS, offset, numVerts);
} 
```

{{{example url="../webgl-no-data-point-rain-linear.html"}}}

Это дает нам POINTS, идущие вниз по экрану, но они все
в порядке. Нам нужно добавить некоторую случайность. В GLSL нет
генератора случайных чисел. Вместо этого мы можем использовать
функцию, которая генерирует что-то, что кажется достаточно случайным.

Вот одна

```glsl
// hash функция из https://www.shadertoy.com/view/4djSRW
// дано значение между 0 и 1
// возвращает значение между 0 и 1, которое *выглядит* довольно случайным
float hash(float p) {
  vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
  p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
  return fract(p2.x * p2.y * 95.4337);
}
```

и мы можем использовать это так

```glsl
void main() {
  float u = float(gl_VertexID) / float(numVerts);  // идет от 0 до 1
  float x = hash(u) * 2.0 - 1.0;                   // случайная позиция
  float y = fract(time + u) * -2.0 + 1.0;          // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 2.0;
}
```

Мы передаем `hash` наше предыдущее значение от 0 до 1, и оно дает нам
обратно псевдослучайное значение от 0 до 1.

Давайте также сделаем точки меньше

```glsl
  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 2.0;
```

И увеличим количество точек, которые мы рисуем

```js
const numVerts = 400;
```

И с этим мы получаем

{{{example url="../webgl-no-data-point-rain.html"}}}

Если вы посмотрите очень внимательно, вы можете увидеть, что дождь повторяется.
Ищите какую-то группу точек и смотрите, как они падают с
низа и появляются обратно сверху.
Если бы на заднем плане происходило больше, как если бы
этот дешевый эффект дождя происходил поверх 3D игры,
возможно, никто никогда не заметил бы, что он повторяется.

Мы можем исправить повторение, добавив немного больше случайности.

```glsl
void main() {
  float u = float(gl_VertexID) / float(numVerts);  // идет от 0 до 1
  float off = floor(time + u) / 1000.0;           // изменяется раз в секунду на вершину
  float x = hash(u + off) * 2.0 - 1.0;            // случайная позиция
  float y = fract(time + u) * -2.0 + 1.0;         // 1.0 ->  -1.0

  gl_Position = vec4(x, y, 0, 1);
  gl_PointSize = 2.0;
}
```

В коде выше мы добавили `off`. Поскольку мы вызываем `floor`,
значение `floor(time + u)` будет эффективно давать нам
секундный таймер, который изменяется только раз в секунду для каждой вершины.
Это смещение синхронизировано с кодом, перемещающим точку вниз по экрану,
так что в тот же момент, когда точка прыгает обратно наверх
экрана, добавляется небольшое количество к значению,
которое передается в `hash`, что означает, что эта конкретная точка
получит новое случайное число и, следовательно, новую случайную горизонтальную позицию.

Результат - эффект дождя, который не кажется повторяющимся

{{{example url="../webgl-no-data-point-rain-less-repeat.html"}}}

Можем ли мы делать больше, чем `gl.POINTS`? Конечно!

Давайте сделаем круги. Для этого нам нужны треугольники вокруг
центра, как ломтики пирога. Мы можем думать о каждом треугольнике
как о 2 точках вокруг края пирога, за которыми следует 1 точка в центре.
Затем мы повторяем для каждого ломтика пирога.

<div class="webgl_center"><img src="resources/circle-points.svg" style="width: 400px;"></div>

Итак, сначала мы хотим какой-то счетчик, который изменяется раз на ломтик пирога

```glsl
int sliceId = gl_VertexID / 3;
```

Затем нам нужен счет вокруг края круга, который идет

    0, 1, ?, 1, 2, ?, 2, 3, ?, ...

Значение ? не имеет значения, потому что, глядя на
диаграмму выше, 3-е значение всегда в центре (0,0),
так что мы можем просто умножить на 0 независимо от значения.

Чтобы получить паттерн выше, это сработает

```glsl
int triVertexId = gl_VertexID % 3;
int edge = triVertexId + sliceId;
```

Для точек на краю против точек в центре нам нужен
этот паттерн. 2 на краю, затем 1 в центре, повторять.

    1, 1, 0, 1, 1, 0, 1, 1, 0, ...

Мы можем получить этот паттерн с

```glsl
float radius = step(1.5, float(triVertexId));
```

`step(a, b)` это 0, если a < b, и 1 в противном случае. Вы можете думать об этом как

```js
function step(a, b) {
  return a < b ? 0 : 1;
}
```

`step(1.5, float(triVertexId))` будет 1, когда 1.5 меньше `triVertexId`.
Это верно для первых 2 вершин каждого треугольника и ложно
для последней.

Мы можем получить вершины треугольника для круга так

```glsl
int numSlices = 8;
int sliceId = gl_VertexID / 3;
int triVertexId = gl_VertexID % 3;
int edge = triVertexId + sliceId;
float angleU = float(edge) / float(numSlices);  // 0.0 до 1.0
float angle = angleU * PI * 2.0;
float radius = step(float(triVertexId), 1.5);
vec2 pos = vec2(cos(angle), sin(angle)) * radius;
```

Собрав все это вместе, давайте просто попробуем нарисовать 1 круг.

```glsl
#version 300 es
uniform int numVerts;
uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  int numSlices = 8;
  int sliceId = gl_VertexID / 3;
  int triVertexId = gl_VertexID % 3;
  int edge = triVertexId + sliceId;
  float angleU = float(edge) / float(numSlices);  // 0.0 до 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(float(triVertexId), 1.5);
  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
  gl_Position = vec4(pos * scale, 0, 1);
}
```

Обратите внимание, мы вернули `resolution`, чтобы не получить эллипс.

Для 8-срезового круга нам нужно 8 * 3 вершин

```js
const numVerts = 8 * 3;
```

и нам нужно рисовать `TRIANGLES`, а не `POINTS`

```js
const offset = 0;
gl.drawArrays(gl.TRIANGLES, offset, numVerts);
```

{{{example url="../webgl-no-data-triangles-circle.html"}}}

А что, если бы мы хотели нарисовать несколько кругов?

Все, что нам нужно сделать, это придумать `circleId`, который мы
можем использовать для выбора некоторой позиции для каждого круга, которая
одинакова для всех вершин в круге.

```glsl
int numVertsPerCircle = numSlices * 3;
int circleId = gl_VertexID / numVertsPerCircle;
```

Например, давайте нарисуем круг из кругов.

Сначала давайте превратим код выше в функцию,

```glsl
vec2 computeCircleTriangleVertex(int vertexId) {
  int numSlices = 8;
  int sliceId = vertexId / 3;
  int triVertexId = vertexId % 3;
  int edge = triVertexId + sliceId;
  float angleU = float(edge) / float(numSlices);  // 0.0 до 1.0
  float angle = angleU * PI * 2.0;
  float radius = step(float(triVertexId), 1.5);
  return vec2(cos(angle), sin(angle)) * radius;
}
```

Теперь вот оригинальный код, который мы использовали для рисования
круга из точек в начале этой статьи.

```glsl
float u = float(gl_VertexID) / float(numVerts);  // идет от 0 до 1
float angle = u * PI * 2.0;                      // идет от 0 до 2PI
float radius = 0.8;

vec2 pos = vec2(cos(angle), sin(angle)) * radius;

float aspect = resolution.y / resolution.x;
vec2 scale = vec2(aspect, 1);

gl_Position = vec4(pos * scale, 0, 1);
```

Нам просто нужно изменить его, чтобы использовать `circleId` вместо
`vertexId` и делить на количество кругов
вместо количества вершин.

```glsl
void main() {
  int circleId = gl_VertexID / numVertsPerCircle;
  int numCircles = numVerts / numVertsPerCircle;

  float u = float(circleId) / float(numCircles);  // идет от 0 до 1
  float angle = u * PI * 2.0;                     // идет от 0 до 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;

  vec2 triPos = computeCircleTriangleVertex(gl_VertexID) * 0.1;
  
  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
  gl_Position = vec4((pos + triPos) * scale, 0, 1);
}
```

Затем нам просто нужно увеличить количество вершин

```js
const numVerts = 8 * 3 * 20;
```

И теперь у нас есть круг из 20 кругов.

{{{example url="../webgl-no-data-triangles-circles.html"}}}

И, конечно, мы могли бы применить те же вещи, которые мы делали
выше, чтобы сделать дождь из кругов. Это, вероятно, не имеет
смысла, поэтому я не буду проходить через это, но это показывает
создание треугольников в вершинном шейдере без данных.

Вышеуказанная техника могла бы использоваться для создания прямоугольников
или квадратов вместо этого, затем генерации UV координат,
передачи их в фрагментный шейдер и текстурирования
нашей сгенерированной геометрии. Это могло бы быть хорошо для
падающих снежинок или листьев, которые фактически переворачиваются в 3D,
применяя 3D техники, которые мы использовали в статьях
о [3D перспективе](webgl-3d-perspective.html).

Я хочу подчеркнуть, что **эти техники** не являются обычными.
Создание простой системы частиц может быть полу-обычным или
эффект дождя выше, но создание чрезвычайно сложных вычислений
повредит производительности. В общем, если вы хотите производительности,
вы должны попросить ваш компьютер делать как можно меньше работы,
так что если есть куча вещей, которые вы можете предварительно вычислить во время инициализации
и передать в шейдер в той или иной форме, вы
должны сделать это.

Например, вот экстремальный вершинный шейдер,
который вычисляет кучу кубов (предупреждение, есть звук).

<iframe width="700" height="400" src="https://www.vertexshaderart.com/art/zd2E5vCZduc5JeoFz" frameborder="0" allowfullscreen></iframe>

Как интеллектуальное любопытство головоломки "Если бы у меня не было данных,
кроме vertex id, мог бы я нарисовать что-то интересное?" это
довольно аккуратно. Фактически [весь этот сайт](https://www.vertexshaderart.com) о
головоломке, если у вас есть только vertex id, можете ли вы сделать что-то
интересное. Но для производительности было бы намного намного быстрее использовать
более традиционные техники передачи данных вершин куба
в буферы и чтения этих данных с атрибутами или другими техниками,
которые мы рассмотрим в других статьях.

Есть некоторый баланс, который нужно найти. Для примера дождя выше, если вы хотите точно этот
эффект, то код выше довольно эффективен. Где-то между
двумя лежит граница, где одна техника более производительна,
чем другая. Обычно более традиционные техники намного более гибкие
также, но вам нужно решать на основе случая за случаем, когда использовать один
способ или другой.

Цель этой статьи в основном познакомить с этими идеями
и подчеркнуть другие способы мышления о том, что WebGL
фактически делает. Снова ему все равно, что вы устанавливаете `gl_Position`
и выводите цвет в ваших шейдерах. Ему все равно, как вы это делаете.

<div class="webgl_bottombar" id="pointsissues">
<h3>Проблема с <code>gl.POINTS</code></h3>
<p>
Одна вещь, для которой техника вроде этой может быть полезной, это симуляция рисования
с <code>gl.POINTS</code>.
</p>

Есть 2 проблемы с <code>gl.POINTS</code>

<ol>
<li>У них максимальный размер<br/><br/>Большинство людей, использующих <code>gl.POINTS</code>, используют маленькие размеры,
но если этот максимальный размер меньше, чем вам нужно, вам нужно будет выбрать другое решение.
</li>
<li>Как они обрезаются, когда за пределами экрана, непоследовательно<br/><br/>
Проблема здесь в том, что представьте, что вы устанавливаете центр точки в 1 пиксель от левого края
canvas, но вы устанавливаете <code>gl_PointSize</code> в 32.0.
<div class="webgl_center"><img src="resources/point-outside-canvas.svg" style="width: 400px"></div>
Согласно спецификации OpenGL ES 3.0
то, что должно произойти, это то, что поскольку 15 столбцов из этих 32x32 пикселей все еще на canvas,
они должны быть нарисованы. К сожалению, OpenGL (не ES) говорит прямо противоположное.
Если центр точки за пределами canvas, ничего не рисуется. Еще хуже, OpenGL до
недавнего времени был печально известен недостаточным тестированием, поэтому некоторые драйверы рисуют эти пиксели,
а некоторые нет 😭
</li>
</ol>
<p>
Итак, если любая из этих проблем является проблемой для ваших потребностей, то как решение вам нужно рисовать свои собственные квады
с <code>gl.TRIANGLES</code> вместо использования <code>gl.POINTS</code>.
 Если вы сделаете это, обе проблемы решены.
Проблема максимального размера исчезает, как и проблема непоследовательной обрезки. Есть различные
способы рисовать много квадов. <a href="https://jsgist.org/?src=6306857bfd65adbdcd54b0051d441935">Один из них использует техники вроде тех, что в этой статье</a>.</p>
</div> 