Title: WebGL2 2D Трансляция
Description: Как выполнять трансляцию в 2D
TOC: 2D Трансляция

Прежде чем мы перейдем к 3D, давайте еще немного останемся в 2D.
Пожалуйста, потерпите меня. Эта статья может показаться чрезвычайно очевидной
некоторым, но я подведу к определенной точке в нескольких статьях.

Эта статья является продолжением серии, начинающейся с
[Основ WebGL](webgl-fundamentals.html). Если вы их не читали,
я предлагаю прочитать хотя бы первую, а затем вернуться сюда.

Трансляция - это какое-то модное математическое название, которое в основном означает "перемещать"
что-то. Я полагаю, что перевод предложения с английского на японский тоже подходит,
но в данном случае мы говорим о перемещении геометрии. Используя
пример кода, с которым мы закончили в [первой статье](webgl-fundamentals.html),
вы могли бы легко трансформировать наш прямоугольник, просто изменив значения,
передаваемые в `setRectangle`, верно? Вот пример, основанный на нашем
[предыдущем примере](webgl-fundamentals.html).

```
  // Сначала давайте создадим некоторые переменные
  // для хранения трансляции, ширины и высоты прямоугольника
  var translation = [0, 0];
  var width = 100;
  var height = 30;
  var color = [Math.random(), Math.random(), Math.random(), 1];

  // Затем давайте создадим функцию для
  // перерисовки всего. Мы можем вызвать эту
  // функцию после того, как обновим трансляцию.

  // Рисуем сцену.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Говорим WebGL, как конвертировать из clip space в пиксели
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Очищаем canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Говорим использовать нашу программу (пару шейдеров)
    gl.useProgram(program);

    // Привязываем набор атрибутов/буферов, который мы хотим.
    gl.bindVertexArray(vao);

    // Передаем разрешение canvas, чтобы мы могли конвертировать из
    // пикселей в clip space в шейдере
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Обновляем буфер позиций с позициями прямоугольника
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, translation[0], translation[1], width, height);

    // Устанавливаем цвет.
    gl.uniform4fv(colorLocation, color);

    // Рисуем прямоугольник.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

В примере ниже я добавил пару слайдеров, которые будут обновлять
`translation[0]` и `translation[1]` и вызывать `drawScene` каждый раз, когда они изменяются.
Перетащите слайдеры, чтобы трансформировать прямоугольник.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

Пока все хорошо. Но теперь представьте, что мы хотели бы сделать то же самое с
более сложной формой.

Допустим, мы хотели бы нарисовать букву 'F', которая состоит из 6 треугольников, как эта.

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

Ну, следуя нашему текущему коду, нам пришлось бы изменить `setRectangle`
на что-то более похожее на это.

```
// Заполняем текущий буфер ARRAY_BUFFER значениями, которые определяют букву 'F'.
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // левая колонка
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // верхняя перекладина
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // средняя перекладина
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3]),
      gl.STATIC_DRAW);
}
```

Вы, надеюсь, видите, что это не будет хорошо масштабироваться. Если мы хотим
нарисовать какую-то очень сложную геометрию с сотнями или тысячами линий, нам
пришлось бы написать довольно сложный код. Кроме того, каждый раз, когда мы
рисуем, JavaScript должен обновлять все точки.

Есть более простой способ. Просто загрузите геометрию и выполните трансляцию
в шейдере.

Вот новый шейдер

```
#version 300 es

// атрибут - это вход (in) в вершинный шейдер.
// Он будет получать данные из буфера
in vec2 a_position;

// Используется для передачи разрешения canvas
uniform vec2 u_resolution;

// трансляция для добавления к позиции
uniform vec2 u_translation;

// все шейдеры имеют основную функцию
void main() {
  // Добавляем трансляцию
  vec2 position = a_position + u_translation;

  // конвертируем позицию из пикселей в 0.0 до 1.0
  vec2 zeroToOne = position / u_resolution;

  // конвертируем из 0->1 в 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // конвертируем из 0->2 в -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
```

и мы немного реструктурируем код. Во-первых, нам нужно установить
геометрию только один раз.

```
// Заполняем текущий буфер ARRAY_BUFFER
// значениями, которые определяют букву 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // левая колонка
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // верхняя перекладина
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // средняя перекладина
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90]),
      gl.STATIC_DRAW);
}
```

Затем нам просто нужно обновить `u_translation` перед тем, как мы рисуем, с
трансляцией, которую мы желаем.

```
  ...

  var translationLocation = gl.getUniformLocation(
             program, "u_translation");

  ...

  // Устанавливаем геометрию.
  setGeometry(gl);

  ...

  // Рисуем сцену.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Говорим WebGL, как конвертировать из clip space в пиксели
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Говорим использовать нашу программу (пару шейдеров)
    gl.useProgram(program);

    // Привязываем набор атрибутов/буферов, который мы хотим.
    gl.bindVertexArray(vao);

    // Передаем разрешение canvas, чтобы мы могли конвертировать из
    // пикселей в clip space в шейдере
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Устанавливаем цвет.
    gl.uniform4fv(colorLocation, color);

    // Устанавливаем трансляцию.
    gl.uniform2fv(translationLocation, translation);

    // Рисуем прямоугольник.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Обратите внимание, что `setGeometry` вызывается только один раз. Она больше не находится внутри `drawScene`.

И вот этот пример. Снова перетащите слайдеры, чтобы обновить трансляцию.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

Теперь, когда мы рисуем, WebGL делает практически все. Все, что мы делаем, это
устанавливаем трансляцию и просим его нарисовать. Даже если бы наша геометрия имела десятки
тысяч точек, основной код остался бы тем же.

Если хотите, вы можете сравнить <a target="_blank" href="../webgl-2d-geometry-translate.html">
версию, которая использует сложный JavaScript
выше для обновления всех точек</a>.

Я надеюсь, что этот пример был слишком очевиден. В [следующей статье мы перейдем
к вращению](webgl-2d-rotation.html). 