Title: WebGL2 Изменение размера Canvas.
Description: Как изменить размер WebGL canvas и связанные с этим проблемы
TOC: Изменение размера Canvas

Вот что вам нужно знать, чтобы изменить размер canvas.

У каждого canvas есть 2 размера. Размер его drawingbuffer. Это сколько пикселей в canvas.
Второй размер - это размер, в котором отображается canvas. CSS определяет размер, в котором canvas
отображается.

Вы можете установить размер drawingbuffer canvas двумя способами. Один используя HTML

```html
<canvas id="c" width="400" height="300"></canvas>
```

Другой используя JavaScript

```html
<canvas id="c"></canvas>
```

JavaScript

```js
const canvas = document.querySelector("#c");
canvas.width = 400;
canvas.height = 300;
```

Что касается установки размера отображения canvas, если у вас нет CSS, который влияет на размер отображения canvas,
размер отображения будет таким же, как размер его drawingbuffer. Поэтому в 2 примерах выше drawingbuffer canvas составляет 400x300,
и его размер отображения также 400x300.

Вот пример canvas, чей drawingbuffer составляет 10x15 пикселей, который отображается 400x300 пикселей на странице

```html
<canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>
```

или, например, так

```html
<style>
#c {
  width: 400px;
  height: 300px;
}
</style>
<canvas id="c" width="10" height="15"></canvas>
```

Если мы нарисуем одну пиксельную вращающуюся линию в этот canvas, мы увидим что-то вроде этого

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

Почему это так размыто? Потому что браузер берет наш 10x15 пиксельный canvas и растягивает его до 400x300 пикселей, и
обычно фильтрует его при растягивании.

Итак, что мы делаем, если, например, хотим, чтобы canvas заполнил окно? Ну, сначала мы можем заставить
браузер растянуть canvas, чтобы заполнить окно с помощью CSS. Пример

    <html>
      <head>
        <style>
          /*  */
          html, body {
            height: 100%;
            margin: 0;
          }
          /* делаем canvas заполняющим его контейнер */
          #c {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

Теперь нам просто нужно сделать drawingbuffer соответствующим любому размеру, до которого браузер растянул canvas.
Это, к сожалению, сложная тема. Давайте рассмотрим некоторые различные методы

## Использование `clientWidth` и `clientHeight`

Это самый простой способ.
`clientWidth` и `clientHeight` - это свойства, которые есть у каждого элемента в HTML, которые говорят нам
размер элемента в CSS пикселях.

> Примечание: Client rect включает любой CSS padding, поэтому если вы используете `clientWidth`
и/или `clientHeight`, лучше не ставить никакой padding на ваш canvas элемент.

Используя JavaScript, мы можем проверить, какого размера этот элемент отображается, а затем настроить
размер его drawingbuffer, чтобы соответствовать.

```js
function resizeCanvasToDisplaySize(canvas) {
  // Ищем размер, в котором браузер отображает canvas в CSS пикселях.
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Проверяем, не является ли canvas того же размера.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    // Делаем canvas того же размера
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

Давайте вызовем эту функцию прямо перед рендерингом,
чтобы она всегда настраивала canvas до нашего желаемого размера прямо перед рисованием.

```js
function drawScene() {
   resizeCanvasToDisplaySize(gl.canvas);

   ...
```

И вот это

{{{example url="../webgl-resize-canvas.html" }}}

Эй, что-то не так? Почему линия не покрывает всю область?

Причина в том, что когда мы изменяем размер canvas, нам также нужно вызвать `gl.viewport`, чтобы установить viewport.
`gl.viewport` говорит WebGL, как конвертировать из пространства отсечения (-1 до +1) обратно в пиксели и где это делать
внутри canvas. Когда вы впервые создаете WebGL контекст, WebGL установит viewport, чтобы соответствовать размеру
canvas, но после этого вам нужно установить его. Если вы изменяете размер canvas,
вам нужно сказать WebGL новую настройку viewport.

Давайте изменим код, чтобы обработать это. Помимо этого, поскольку WebGL контекст имеет
ссылку на canvas, давайте передадим это в resize.

    function drawScene() {
       resizeCanvasToDisplaySize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

Теперь это работает.

{{{example url="../webgl-resize-canvas-viewport.html" }}}

Откройте это в отдельном окне, измените размер окна, обратите внимание, что оно всегда заполняет окно.

Я слышу, как вы спрашиваете, *почему WebGL не устанавливает viewport автоматически для нас,
когда мы изменяем размер canvas?* Причина в том, что он не знает, как или почему
вы используете viewport. Вы могли бы [рендерить в framebuffer](webgl-render-to-texture.html)
или делать что-то еще, что требует другого размера viewport. WebGL не имеет
способа узнать ваше намерение, поэтому он не может автоматически установить viewport для вас.

---

## Обработка `devicePixelRatio` и масштабирования

Почему это не конец? Ну, здесь становится сложно.

Первое, что нужно понять, это то, что большинство размеров в браузере в CSS пиксельных
единицах. Это попытка сделать размеры независимыми от устройства. Так, например,
в начале этой статьи мы установили размер отображения canvas в 400x300 CSS
пикселей. В зависимости от того, есть ли у пользователя HD-DPI дисплей, или он увеличен или
уменьшен, или имеет установленный уровень масштабирования ОС, сколько фактических пикселей это станет на
мониторе, будет разным.

`window.devicePixelRatio` скажет нам в общем соотношение фактических пикселей
к CSS пикселям на вашем мониторе. Например, вот текущая настройка вашего браузера

> <div>devicePixelRatio = <span data-diagram="dpr"></span></div>

Если вы на настольном компьютере или ноутбуке, попробуйте нажать <kbd>ctrl</kbd>+<kbd>+</kbd> и <kbd>ctrl</kbd>+<kbd>-</kbd>, чтобы увеличить и уменьшить (<kbd>⌘</kbd>+<kbd>+</kbd> и <kbd>⌘</kbd>+<kbd>-</kbd> на Mac). Вы должны увидеть, как число изменяется.

Итак, если мы хотим, чтобы количество пикселей в canvas соответствовало количеству пикселей, фактически используемых для его отображения,
казалось бы очевидным решением было бы умножить `clientWidth` и `clientHeight` на `devicePixelRatio`, как это:

```js
function resizeCanvasToDisplaySize(canvas) {
  // Ищем размер, в котором браузер отображает canvas в CSS пикселях.
  const dpr = window.devicePixelRatio;
  const displayWidth  = Math.round(canvas.clientWidth * dpr);
  const displayHeight = Math.round(canvas.clientHeight * dpr);

  // Проверяем, не является ли canvas того же размера.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // Делаем canvas того же размера
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
``` 