Title: WebGL2 2D Матрицы
Description: Как работает матричная математика, объяснено простыми и понятными инструкциями.
TOC: 2D Матрицы


Этот пост является продолжением серии постов о WebGL. Первый
[начался с основ](webgl-fundamentals.html), а предыдущий
был [о масштабировании 2D геометрии](webgl-2d-scale.html).

<div class="webgl_bottombar">
<h3>Математика vs Программирование vs WebGL</h3>
<p>
Прежде чем мы начнем, если вы ранее изучали линейную алгебру или в целом
имеете опыт работы с матрицами, то
<a href="webgl-matrix-vs-math.html"><b>пожалуйста, прочитайте эту статью перед
продолжением ниже.</b></a>.
</p>
<p>
Если у вас мало или нет опыта с матрицами, то смело
пропустите ссылку выше пока и продолжайте чтение.
</p>
</div>

В последних 3 постах мы прошли, как [перемещать геометрию](webgl-2d-translation.html),
[поворачивать геометрию](webgl-2d-rotation.html) и [масштабировать геометрию](webgl-2d-scale.html).
Перемещение, поворот и масштабирование каждый считается типом 'преобразования'.
Каждое из этих преобразований требовало изменений в шейдере, и каждое
из 3 преобразований зависело от порядка.
В [нашем предыдущем примере](webgl-2d-scale.html) мы масштабировали, затем поворачивали,
затем перемещали. Если бы мы применили их в другом порядке, мы получили бы
другой результат.

Например, вот масштабирование 2, 1, поворот на 30 градусов
и перемещение на 100, 0.

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

А вот перемещение на 100,0, поворот на 30 градусов и масштабирование 2, 1

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

Результаты совершенно разные. Еще хуже, если бы нам нужен был
второй пример, нам пришлось бы написать другой шейдер, который применял
перемещение, поворот и масштабирование в нашем новом желаемом порядке.

Ну, некоторые люди намного умнее меня поняли, что вы можете делать
всё то же самое с матричной математикой. Для 2D мы используем матрицу 3x3.
Матрица 3x3 похожа на сетку с 9 ячейками:

<link href="resources/webgl-2d-matrices.css" rel="stylesheet">
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

Для выполнения математики мы умножаем позицию вниз по столбцам матрицы
и складываем результаты. Наши позиции имеют только 2 значения, x и y, но
для выполнения этой математики нам нужно 3 значения, поэтому мы будем использовать 1 для третьего значения.

В этом случае наш результат будет

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/>
<tr><td class="glocal-right">newX&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">2.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">3.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">4.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">5.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">6.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1&nbsp;*&nbsp;</td><td>7.0</td><td>&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>8.0</td><td>&nbsp;&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>9.0</td><td>&nbsp;</td></tr></table></div>

Вы, вероятно, смотрите на это и думаете "В ЧЕМ СМЫСЛ?" Ну,
давайте предположим, что у нас есть перемещение. Мы назовем количество, на которое мы хотим
переместить, tx и ty. Давайте сделаем матрицу так:

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

И теперь посмотрите

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

Если вы помните свою алгебру, мы можем удалить любое место, которое умножается
на ноль. Умножение на 1 эффективно ничего не делает, поэтому давайте упростим,
чтобы увидеть, что происходит

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td></td><td>y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

или более кратко

<div class="webgl_center"><pre class="webgl_math">
newX = x + tx;
newY = y + ty;
</pre></div>

И extra нас не очень волнует. Это выглядит удивительно похоже на
[код перемещения из нашего примера перемещения](webgl-2d-translation.html).

Аналогично давайте сделаем поворот. Как мы указали в посте о повороте,
нам просто нужны синус и косинус угла, на который мы хотим повернуть, поэтому

<div class="webgl_center"><pre class="webgl_math">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre></div>

И мы строим матрицу так

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

Применяя матрицу, мы получаем это

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

Зачеркивая все умножения на 0 и 1, мы получаем

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

И упрощая, мы получаем

<pre class="webgl_center">
newX = x *  c + y * s;
newY = x * -s + y * c;
</pre>

Что точно то же, что у нас было в [примере поворота](webgl-2d-rotation.html).

И наконец масштабирование. Мы назовем наши 2 фактора масштабирования sx и sy

И мы строим матрицу так

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

Применяя матрицу, мы получаем это

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

что на самом деле

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

что упрощенно

<pre class="webgl_center">
newX = x * sx;
newY = y * sy;
</pre>

Что то же самое, что наш [пример масштабирования](webgl-2d-scale.html).

Теперь я уверен, что вы все еще можете думать "И что? В чем смысл?"
Это кажется большой работой только для того, чтобы делать то же самое, что мы уже делали.

Здесь вступает в игру магия. Оказывается, мы можем умножать матрицы
вместе и применять все преобразования сразу. Давайте предположим, что у нас есть
функция `m3.multiply`, которая берет две матрицы, умножает их и
возвращает результат.

```js
var m3 = {
  multiply: function(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];

    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  }
}
```

Чтобы сделать вещи более ясными, давайте создадим функции для построения матриц для
перемещения, поворота и масштабирования.

    var m3 = {
      translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },

      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },

      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },
    };

Теперь давайте изменим наш шейдер. Старый шейдер выглядел так

```glsl
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

void main() {
  // Масштабируем позицию
  vec2 scaledPosition = a_position * u_scale;

  // Поворачиваем позицию
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Добавляем перемещение.
  vec2 position = rotatedPosition + u_translation;
```

Наш новый шейдер будет намного проще.

```glsl
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

void main() {
  // Умножаем позицию на матрицу.
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;
  ...
```

И вот как мы его используем

```js
  // Рисуем сцену.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Говорим WebGL, как конвертировать из clip space в пиксели
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Очищаем холст
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Говорим использовать нашу программу (пару шейдеров)
    gl.useProgram(program);

    // Привязываем набор атрибутов/буферов, который мы хотим.
    gl.bindVertexArray(vao);

    // Вычисляем матрицы
    var projectionMatrix = m3.projection(
        gl.canvas.clientWidth, gl.canvas.clientHeight);
    var translationMatrix = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(rotationInRadians);
    var scaleMatrix = m3.scaling(scale[0], scale[1]);

    // Умножаем матрицы.
    var matrix = m3.multiply(projectionMatrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);

    // Устанавливаем матрицу.
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // Устанавливаем цвет.
    gl.uniform4fv(colorLocation, color);

    // Рисуем прямоугольник.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Вот пример использования нашего нового кода. Слайдеры те же, перемещение,
поворот и масштабирование. Но способ их использования в шейдере намного проще.

{{{example url="../webgl-2d-geometry-matrix-transform.html" }}}

Все еще, вы можете спрашивать, и что? Это не кажется большой выгодой.
Но теперь, если мы хотим изменить порядок, нам не нужно писать новый шейдер.
Мы можем просто изменить математику.

        ...
        // Умножаем матрицы.
        var matrix = m3.multiply(scaleMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, translationMatrix);
        ...

Вот эта версия.

{{{example url="../webgl-2d-geometry-matrix-transform-trs.html" }}}

Возможность применять матрицы таким образом особенно важна для
иерархической анимации, как руки на теле, луны на планете вокруг
солнца, или ветви на дереве. Для простого примера иерархической
анимации давайте нарисуем нашу 'F' 5 раз, но каждый раз давайте начнем с
матрицы от предыдущей 'F'.

```js
    // Рисуем сцену.
    function drawScene() {

      ...

      // Вычисляем матрицы
      var translationMatrix = m3.translation(translation[0], translation[1]);
      var rotationMatrix = m3.rotation(rotationInRadians);
      var scaleMatrix = m3.scaling(scale[0], scale[1]);

      // Начальная матрица.
      var matrix = m3.identity();

      for (var i = 0; i < 5; ++i) {
        // Умножаем матрицы.
        matrix = m3.multiply(matrix, translationMatrix);
        matrix = m3.multiply(matrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        // Устанавливаем матрицу.
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // Рисуем геометрию.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;
        gl.drawArrays(primitiveType, offset, count);
      }
    }
```

Для этого мы ввели функцию `m3.identity`, которая создает
единичную матрицу. Единичная матрица - это матрица, которая эффективно представляет
1.0, так что если вы умножаете на единичную матрицу, ничего не происходит. Так же как

<div class="webgl_center">X * 1 = X</div>

так и

<div class="webgl_center">matrixX * identity = matrixX</div>

Вот код для создания единичной матрицы.

    var m3 = {
      identity: function () {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },
    };

Вот 5 F.

{{{example url="../webgl-2d-geometry-matrix-transform-hierarchical.html" }}}

Давайте посмотрим еще один пример. Во всех примерах до сих пор наша 'F' вращается вокруг своего
верхнего левого угла. Это потому, что математика, которую мы используем, всегда вращается вокруг
начала координат, а верхний левый угол нашей 'F' находится в начале координат, (0, 0).

Но теперь, поскольку мы можем делать матричную математику и можем выбирать порядок, в котором
применяются преобразования, мы можем эффективно переместить начало координат перед тем, как остальные
преобразования будут применены.

```js
    // создаем матрицу, которая переместит начало координат 'F' в его центр.
    var moveOriginMatrix = m3.translation(-50, -75);
    ...

    // Умножаем матрицы.
    var matrix = m3.multiply(translationMatrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
    matrix = m3.multiply(matrix, moveOriginMatrix);
```

Вот этот пример. Обратите внимание, что F вращается и масштабируется вокруг центра.

{{{example url="../webgl-2d-geometry-matrix-transform-center-f.html" }}}

Используя эту технику, вы можете вращать или масштабировать из любой точки. Теперь вы знаете,
как Photoshop или Flash позволяют вам перемещать точку вращения какого-то изображения.

Давайте пойдем еще дальше. Если вы вернетесь к первой статье о
[основах WebGL](webgl-fundamentals.html), вы можете вспомнить, что у нас есть код
в шейдере для конвертации из пикселей в clip space, который выглядит так.

      ...
      // конвертируем прямоугольник из пикселей в 0.0 до 1.0
      vec2 zeroToOne = position / u_resolution;

      // конвертируем из 0->1 в 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;

      // конвертируем из 0->2 в -1->+1 (clip space)
      vec2 clipSpace = zeroToTwo - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

Если вы посмотрите на каждый из этих шагов по очереди, первый шаг,
"конвертируем из пикселей в 0.0 до 1.0", на самом деле является операцией масштабирования.
Второй также является операцией масштабирования. Следующий - это перемещение,
и самый последний масштабирует Y на -1. Мы можем на самом деле сделать все это в
матрице, которую мы передаем в шейдер. Мы могли бы создать 2 матрицы масштабирования,
одну для масштабирования на 1.0/resolution, другую для масштабирования на 2.0, третью для
перемещения на -1.0,-1.0 и четвертую для масштабирования Y на -1, затем умножить
их все вместе, но вместо этого, поскольку математика простая,
мы просто создадим функцию, которая создает матрицу 'проекции' для
заданного разрешения напрямую.

    var m3 = {
      projection: function (width, height) {
        // Примечание: Эта матрица переворачивает ось Y так, что 0 находится сверху.
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1,
        ];
      },
      ...

Теперь мы можем упростить шейдер еще больше. Вот весь новый вершинный шейдер.

    #version 300 es

    in vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // Умножаем позицию на матрицу.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    }

И в JavaScript нам нужно умножить на матрицу проекции

```js
  // Рисуем сцену.
  function drawScene() {
    ...
-    // Передаем разрешение холста, чтобы мы могли конвертировать из
-    // пикселей в clip space в шейдере
-    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    ...

    // Вычисляем матрицы
    var projectionMatrix = m3.projection(
        gl.canvas.clientWidth, gl.canvas.clientHeight);
    var translationMatrix = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(rotationInRadians);
    var scaleMatrix = m3.scaling(scale[0], scale[1]);

    // Умножаем матрицы.
*    var matrix = m3.multiply(projectionMatrix, translationMatrix);
*    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
    ...
  }
```

Мы также удалили код, который устанавливал разрешение. С этим последним шагом мы перешли
от довольно сложного шейдера с 6-7 шагами к очень простому шейдеру только с
1 шагом, все благодаря магии матричной математики.

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html" }}}

Прежде чем мы продолжим, давайте немного упростим. Хотя обычно генерировать
различные матрицы и отдельно умножать их вместе, также обычно просто
умножать их по ходу дела. Эффективно мы могли бы функции как эти

```js
var m3 = {

  ...

  translate: function(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function(m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function(m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },

  ...

};
```

Это позволило бы нам изменить 7 строк матричного кода выше на всего 4 строки, как эти

```js
// Вычисляем матрицу
var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
matrix = m3.translate(matrix, translation[0], translation[1]);
matrix = m3.rotate(matrix, rotationInRadians);
matrix = m3.scale(matrix, scale[0], scale[1]);
```

И вот это

{{{example url="../webgl-2d-geometry-matrix-transform-simpler-functions.html" }}}

Последняя вещь, мы видели выше, что порядок имеет значение. В первом примере у нас было

    translation * rotation * scale

а во втором у нас было

    scale * rotation * translation

И мы видели, как они разные.

Есть 2 способа смотреть на матрицы. Учитывая выражение

    projectionMat * translationMat * rotationMat * scaleMat * position

Первый способ, который многие люди находят естественным, - начать справа и работать
влево

Сначала мы умножаем позицию на матрицу масштабирования, чтобы получить масштабированную позицию

    scaledPosition = scaleMat * position

Затем мы умножаем scaledPosition на матрицу поворота, чтобы получить rotatedScaledPosition

    rotatedScaledPosition = rotationMat * scaledPosition

Затем мы умножаем rotatedScaledPosition на матрицу перемещения, чтобы получить
translatedRotatedScaledPosition

    translatedRotatedScaledPosition = translationMat * rotatedScaledPosition

И наконец мы умножаем это на матрицу проекции, чтобы получить позиции в clip space

    clipspacePosition = projectionMatrix * translatedRotatedScaledPosition

Второй способ смотреть на матрицы - читать слева направо. В этом случае
каждая матрица изменяет "пространство", представленное холстом. Холст начинается
с представления clip space (-1 до +1) в каждом направлении. Каждая примененная матрица
слева направо изменяет пространство, представленное холстом.

Шаг 1: нет матрицы (или единичная матрица)

> {{{diagram url="resources/matrix-space-change.html?stage=0" caption="clip space" }}}
>
> Белая область - это холст. Синий - вне холста. Мы в clip space.
> Передаваемые позиции должны быть в clip space

Шаг 2: `matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight)`;

> {{{diagram url="resources/matrix-space-change.html?stage=1" caption="из clip space в pixel space" }}}
>
> Теперь мы в pixel space. X = 0 до 400, Y = 0 до 300 с 0,0 в верхнем левом углу.
> Позиции, передаваемые с использованием этой матрицы, должны быть в pixel space. Вспышка, которую вы видите,
> это когда пространство переворачивается с положительного Y = вверх на положительный Y = вниз.

Шаг 3: `matrix = m3.translate(matrix, tx, ty);`

> {{{diagram url="resources/matrix-space-change.html?stage=2" caption="переместить начало координат в tx, ty" }}}
>
> Начало координат теперь перемещено в tx, ty (150, 100). Пространство переместилось.

Шаг 4: `matrix = m3.rotate(matrix, rotationInRadians);`

> {{{diagram url="resources/matrix-space-change.html?stage=3" caption="повернуть на 33 градуса" }}}
>
> Пространство повернуто вокруг tx, ty

Шаг 5: `matrix = m3.scale(matrix, sx, sy);`

> {{{diagram url="resources/matrix-space-change.html?stage=4" capture="масштабировать пространство" }}}
>
> Предварительно повернутое пространство с центром в tx, ty масштабировано на 2 по x, 1.5 по y

В шейдере мы затем делаем `gl_Position = matrix * position;`. Значения `position` эффективно находятся в этом финальном пространстве.

Используйте тот способ, который вам легче понять.

Я надеюсь, что эти посты помогли развеять тайну матричной математики. Если вы хотите
остаться с 2D, я бы предложил проверить [воссоздание функции drawImage canvas 2d](webgl-2d-drawimage.html) и следовать за этим
в [воссоздание матричного стека canvas 2d](webgl-2d-matrix-stack.html).

Иначе дальше [мы перейдем к 3D](webgl-3d-orthographic.html).
В 3D матричная математика следует тем же принципам и использованию.
Я начал с 2D, чтобы надеюсь сохранить это простым для понимания.

Также, если вы действительно хотите стать экспертом
в матричной математике [проверьте эти удивительные видео](https://www.youtube.com/watch?v=kjBOesZCoqc&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab).

<div class="webgl_bottombar">
<h3>Что такое <code>clientWidth</code> и <code>clientHeight</code>?</h3>
<p>До этого момента, когда я ссылался на размеры холста,
я использовал <code>canvas.width</code> и <code>canvas.height</code>,
но выше, когда я вызывал <code>m3.projection</code>, я вместо этого использовал
<code>canvas.clientWidth</code> и <code>canvas.clientHeight</code>.
Почему?</p>
<p>Матрицы проекции касаются того, как взять clip space
(-1 до +1 в каждом измерении) и конвертировать его обратно
в пиксели. Но в браузере есть 2 типа пикселей, с которыми мы
имеем дело. Один - это количество пикселей в
самом холсте. Так, например, холст, определенный так.</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>или один, определенный так</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>оба содержат изображение 400 пикселей в ширину на 300 пикселей в высоту.
Но этот размер отделен от того размера,
который браузер фактически отображает этот 400x300 пиксельный холст.
CSS определяет, какого размера отображается холст.
Например, если мы сделали холст так.</p>
<pre class="prettyprint"><!>
  &lt;style&gt;
  canvas {
    width: 100%;
    height: 100%;
  }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>Холст будет отображаться любого размера, каким является его контейнер.
Это, вероятно, не 400x300.</p>
<p>Вот два примера, которые устанавливают CSS размер отображения холста на
100%, так что холст растягивается,
чтобы заполнить страницу. Первый использует <code>canvas.width</code>
и <code>canvas.height</code>. Откройте его в новом
окне и измените размер окна. Обратите внимание, как 'F'
не имеет правильного соотношения сторон. Она искажается.</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>В этом втором примере мы используем <code>canvas.clientWidth</code>
и <code>canvas.clientHeight</code>. <code>canvas.clientWidth</code>
и <code>canvas.clientHeight</code> сообщают
размер, который холст фактически отображается браузером, так что
в этом случае, даже хотя холст все еще имеет только 400x300 пикселей,
поскольку мы определяем наше соотношение сторон на основе размера, который холст
отображается, <code>F</code> всегда выглядит правильно.</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>Большинство приложений, которые позволяют изменять размер их холстов, пытаются сделать
<code>canvas.width</code> и <code>canvas.height</code> соответствующими
<code>canvas.clientWidth</code> и <code>canvas.clientHeight</code>,
потому что они хотят, чтобы был
один пиксель в холсте для каждого пикселя, отображаемого браузером.
Но, как мы видели выше, это не
единственный вариант. Это означает, что почти во всех случаях более
технически правильно вычислять
соотношение сторон матрицы проекции, используя <code>canvas.clientHeight</code>
и <code>canvas.clientWidth</code>. Тогда вы получите правильное соотношение сторон
независимо от того, соответствуют ли ширина и высота холста
размеру, который браузер рисует холст. 