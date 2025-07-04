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