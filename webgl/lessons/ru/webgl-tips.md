Title: Советы по WebGL2
Description: Мелкие нюансы, которые могут вызвать затруднения в WebGL
TOC: #

Эта статья — сборник мелких проблем, с которыми вы можете столкнуться при работе с WebGL, но которые слишком малы для отдельной статьи.

---

<a id="screenshot" data-toc="Скриншот канваса"></a>

# Как сделать скриншот канваса

В браузере есть по сути две функции для создания скриншота:
Старая — [`canvas.toDataURL`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)
и новая, более удобная — [`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

Кажется, что сделать скриншот просто — достаточно добавить такой код:

```html
<canvas id="c"></canvas>
+<button id="screenshot" type="button">Сохранить...</button>
```

```js
const elem = document.querySelector('#screenshot');
elem.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});

const saveBlob = (function() {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  return function saveData(blob, fileName) {
     const url = window.URL.createObjectURL(blob);
     a.href = url;
     a.download = fileName;
     a.click();
  };
}());
```

Вот пример из [статьи про анимацию](webgl-animation.html) с этим кодом и немного CSS для кнопки:

{{{example url="../webgl-tips-screenshot-bad.html"}}}

Когда я попробовал — получил вот такой скриншот:

<div class="webgl_center"><img src="resources/screencapture-398x298.png"></div>

Да, это просто пустое изображение.

Возможно, у вас сработает (зависит от браузера/ОС), но обычно не работает.

Проблема в том, что для производительности и совместимости браузер по умолчанию очищает буфер рисования WebGL-канваса после отрисовки.

Есть три решения:

1.  вызвать функцию рендера прямо перед захватом

    Код, который мы использовали, был функцией `drawScene`. Лучше сделать так, чтобы эта функция не меняла состояние, и тогда можно вызывать её для захвата.

    ```js
    elem.addEventListener('click', () => {
    +  drawScene();
      canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
      });
    });
    ```

2.  вызвать код захвата внутри рендер-цикла

    В этом случае мы просто ставим флаг, что хотим сделать захват, а в рендер-цикле реально делаем захват:

    ```js
    let needCapture = false;
    elem.addEventListener('click', () => {
       needCapture = true;
    });
    ```

    а в рендер-цикле (например, в `drawScene`), после отрисовки:

    ```js
    function drawScene(time) {
      ...

    +  if (needCapture) {
    +    needCapture = false;
    +    canvas.toBlob((blob) => {
    +      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    +    });
    +  }

      ...
    }
    ```

3. Установить `preserveDrawingBuffer: true` при создании WebGL-контекста

    ```js
    const gl = someCanvas.getContext('webgl2', {preserveDrawingBuffer: true});
    ```

    Это заставит WebGL не очищать канвас после композитинга с остальной страницей, но может помешать некоторым оптимизациям.

Я бы выбрал вариант №1. Для этого лучше разделить код, который обновляет состояние, и код, который рисует.

```js
  var then = 0;

-  requestAnimationFrame(drawScene);
+  requestAnimationFrame(renderLoop);

+  function renderLoop(now) {
+    // Переводим в секунды
+    now *= 0.001;
+    // Разница со временем предыдущего кадра
+    var deltaTime = now - then;
+    // Запоминаем время
+    then = now;
+
+    // Каждый кадр увеличиваем вращение
+    rotation[1] += rotationSpeed * deltaTime;
+
+    drawScene();
+
+    // Следующий кадр
+    requestAnimationFrame(renderLoop);
+  }

  // Рисуем сцену
+  function drawScene() {
- function drawScene(now) {
-    // Переводим в секунды
-    now *= 0.001;
-    // Разница со временем предыдущего кадра
-    var deltaTime = now - then;
-    // Запоминаем время
-    then = now;
-
-    // Каждый кадр увеличиваем вращение
-    rotation[1] += rotationSpeed * deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    ...

-    // Следующий кадр
-    requestAnimationFrame(drawScene);
  }
```

Теперь можно просто вызвать `drawScene` перед захватом:

```js
elem.addEventListener('click', () => {
+  drawScene();
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});
```

Теперь всё должно работать.

{{{example url="../webgl-tips-screenshot-good.html" }}}

Если посмотреть на полученное изображение, фон будет прозрачным. Подробнее — [в этой статье](webgl-and-alpha.html).

---

<a id="preservedrawingbuffer" data-toc="Как не очищать канвас"></a>

# Как не очищать канвас

Допустим, вы хотите дать пользователю рисовать анимированным объектом. Нужно передать `preserveDrawingBuffer: true` при создании WebGL-контекста. Это не даст браузеру очищать канвас.

Возьмём последний пример из [статьи про анимацию](webgl-animation.html):

```js
var canvas = document.querySelector("#canvas");
-var gl = canvas.getContext("webgl2");
+var gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
```

и изменим вызов `gl.clear`, чтобы очищался только depth-буфер:

```
-// Очищаем канвас.
-gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+// Очищаем только depth-буфер.
+gl.clear(gl.DEPTH_BUFFER_BIT);
```

{{{example url="../webgl-tips-preservedrawingbuffer.html" }}}

Обратите внимание: если делать полноценную программу для рисования, это не решение, так как браузер всё равно очистит канвас при изменении его размера. Мы меняем размер в зависимости от размера отображения, а он меняется при изменении окна, загрузке файла (например, в другой вкладке), появлении статус-бара, повороте телефона и т.д.

Если делать настоящее приложение для рисования — [рендерьте в текстуру](webgl-render-to-texture.html).

---

<a id="tabindex" data-toc="Получение ввода с клавиатуры"></a>

# Получение ввода с клавиатуры

Если вы делаете полноэкранное WebGL-приложение, то всё просто. Но часто хочется, чтобы канвас был частью страницы, и чтобы при клике по нему он принимал ввод с клавиатуры. По умолчанию канвас не получает ввод с клавиатуры. Чтобы это исправить, задайте ему [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex) 0 или больше. Например:

```html
<canvas tabindex="0"></canvas>
```

Появляется новая проблема: любой элемент с `tabindex` получает обводку при фокусе. Чтобы убрать её, добавьте CSS:

```css
canvas:focus {
  outline:none;
}
```

Для примера — три канваса:

```html
<canvas id="c1"></canvas>
<canvas id="c2" tabindex="0"></canvas>
<canvas id="c3" tabindex="1"></canvas>
```

и CSS только для последнего:

```css
#c3:focus {
    outline: none;
}
```

Навесим одинаковые обработчики на все:

```js
document.querySelectorAll('canvas').forEach((canvas) => {
  const ctx = canvas.getContext('2d');

  function draw(str) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, canvas.width / 2, canvas.height / 2);
  }
  draw(canvas.id);

  canvas.addEventListener('focus', () => {
    draw('есть фокус, нажмите клавишу');
  });

  canvas.addEventListener('blur', () => {
    draw('фокус потерян');
  });

  canvas.addEventListener('keydown', (e) => {
    draw(`keyCode: ${e.keyCode}`);
  });
});
```

Обратите внимание: первый канвас не принимает ввод с клавиатуры.
Второй — принимает, но с обводкой. Третий — и принимает, и без обводки.

{{{example url="../webgl-tips-tabindex.html"}}}

---

<a id="html-background" data-toc="WebGL2 как фон HTML"></a>

# WebGL-анимация как фон страницы

Частый вопрос — как сделать WebGL-анимацию фоном страницы?

Есть два очевидных способа:

* Задать канвасу CSS `position: fixed`, например:

```css
#canvas {
 position: fixed;
 left: 0;
 top: 0;
 z-index: -1;
 ...
}
```

и `z-index: -1`.

Минус: ваш JS должен интегрироваться со страницей, и если страница сложная, нужно следить, чтобы код WebGL не конфликтовал с остальным JS.

* Использовать `iframe`

Так сделано [на главной странице этого сайта](/).

Вставьте в страницу iframe, например:

```html
<iframe id="background" src="background.html"></iframe>
<div>
  Ваш контент.
</div>
```

Затем стилизуйте iframe, чтобы он занимал всё окно и был на заднем плане (почти как выше для канваса), плюс уберите рамку:

```css
#background {
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: -1;
    border: none;
    pointer-events: none;
}
```

{{{example url="../webgl-tips-html-background.html"}}} 