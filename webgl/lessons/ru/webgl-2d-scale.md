Title: WebGL2 2D Масштабирование
Description: Как выполнять масштабирование в 2D
TOC: 2D Масштабирование

Этот пост является продолжением серии постов о WebGL.
Первый [начался с основ](webgl-fundamentals.html), а
предыдущий был [о вращении геометрии](webgl-2d-rotation.html).

Масштабирование так же [просто, как трансляция](webgl-2d-translation.html).

Мы умножаем позицию на наш желаемый масштаб. Вот изменения
из [нашего предыдущего примера](webgl-2d-rotation.html).

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

void main() {
  // Масштабируем позицию
  vec2 scaledPosition = a_position * u_scale;

  // Вращаем позицию
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Добавляем трансляцию.
  vec2 position = rotatedPosition + u_translation;

  // конвертируем позицию из пикселей в 0.0 до 1.0
  vec2 zeroToOne = position / u_resolution;

  // конвертируем из 0->1 в 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // конвертируем из 0->2 в -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
```

и мы добавляем JavaScript, необходимый для установки масштаба, когда мы рисуем.

```
  ...

  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

  var scale = [1, 1];


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

     // Устанавливаем цвет.
     gl.uniform4fv(colorLocation, color);

     // Устанавливаем трансляцию.
     gl.uniform2fv(translationLocation, translation);

     // Устанавливаем вращение.
     gl.uniform2fv(rotationLocation, rotation);

     // Устанавливаем масштаб.
     gl.uniform2fv(scaleLocation, scale);

     // Рисуем прямоугольник.
     var primitiveType = gl.TRIANGLES;
     var offset = 0;
     var count = 18;
     gl.drawArrays(primitiveType, offset, count);
   }
```

И теперь у нас есть масштабирование. Перетащите слайдеры.

{{{example url="../webgl-2d-geometry-scale.html" }}}

Одна вещь, которую стоит заметить, это то, что масштабирование отрицательным значением переворачивает нашу геометрию.

Другая вещь, которую стоит заметить, это то, что она масштабируется от 0, 0, что для нашей F является
верхним левым углом. Это имеет смысл, поскольку мы умножаем позиции
на масштаб, они будут двигаться от 0, 0. Вы, вероятно,
можете представить способы исправить это. Например, вы могли бы добавить другую трансляцию
перед масштабированием, *предварительную* трансляцию масштабирования. Другое решение было бы
изменить фактические данные позиции F. Мы скоро рассмотрим другой способ.

Я надеюсь, что эти последние 3 поста были полезны для понимания
[трансляции](webgl-2d-translation.html), [вращения](webgl-2d-rotation.html)
и масштабирования. Далее мы рассмотрим [магию матриц](webgl-2d-matrices.html),
которая объединяет все 3 из них в гораздо более простую и часто более полезную форму.

<div class="webgl_bottombar">
<h3>Почему 'F'?</h3>
<p>
В первый раз я увидел, как кто-то использует 'F', было на текстуре.
Сама 'F' не важна. Важно то, что
вы можете определить ее ориентацию с любого направления. Если бы мы
использовали сердце ❤ или треугольник △, например, мы не могли бы
сказать, перевернут ли он горизонтально. Круг ○ был бы
еще хуже. Цветной прямоугольник, возможно, работал бы с
разными цветами на каждом углу, но тогда вам пришлось бы помнить,
какой угол был каким. Ориентация F мгновенно узнаваема.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
Любая форма, ориентацию которой вы можете определить, подойдет,
я просто использовал 'F' с тех пор, как впервые познакомился с этой идеей.
</p>
</div> 