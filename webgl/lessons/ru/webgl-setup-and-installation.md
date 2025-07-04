Title: WebGL2 Настройка и установка
Description: Как заниматься разработкой WebGL
TOC: Настройка и установка


Технически вам не нужно ничего, кроме веб-браузера, чтобы заниматься WebGL
разработкой. Перейдите на [jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/) или [jsbin.com](https://jsbin.com)
или [codepen.io](https://codepen.io/greggman/pen/YGQjVV) и просто начните применять уроки здесь.

На всех из них вы можете ссылаться на внешние скрипты, добавляя пару тегов `<script src="..."></script>`,
если хотите использовать внешние скрипты.

Тем не менее, есть ограничения. WebGL имеет более строгие ограничения, чем Canvas2D для загрузки изображений,
что означает, что вы не можете легко получить доступ к изображениям со всего интернета для вашей WebGL работы.
Кроме того, просто быстрее работать со всем локально.

Давайте предположим, что вы хотите запускать и редактировать примеры на этом сайте. Первое, что вы должны
сделать - это скачать сайт. [Вы можете скачать его здесь](https://github.com/gfxfundamentals/webgl2-fundamentals/tree/gh-pages).

{{{image url="resources/download-webglfundamentals.gif" }}}

Распакуйте файлы в какую-то папку.

## Использование маленького простого веб-сервера

Далее вы должны установить маленький веб-сервер. Я знаю, что "веб-сервер" звучит страшно, но правда в том, что [веб-
серверы на самом деле чрезвычайно просты](https://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

Вот очень простой с интерфейсом, называемый [Servez](https://greggman.github.io/servez).

{{{image url="resources/servez.gif" }}}

Просто укажите на папку, где вы распаковали файлы, нажмите "Start", затем перейдите
в вашем браузере на [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/) и выберите
пример.

Если вы предпочитаете командную строку, другой способ - использовать [node.js](https://nodejs.org).
Скачайте его, установите, затем откройте командную строку / консоль / терминальное окно. Если вы на Windows, установщик
добавит специальную "Node Command Prompt", поэтому используйте её.

Затем установите [`servez`](https://github.com/greggman/servez-cli), набрав

    npm -g install servez

Если вы на OSX, используйте

    sudo npm -g install servez

Как только вы это сделали, наберите

    servez path/to/folder/where/you/unzipped/files

Он должен напечатать что-то вроде

{{{image url="resources/servez-response.png" }}}

Затем в вашем браузере перейдите на [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/).

Если вы не укажете путь, то servez будет обслуживать текущую папку.

## Использование инструментов разработчика вашего браузера

Большинство браузеров имеют встроенные обширные инструменты разработчика.

{{{image url="resources/chrome-devtools.png" }}}

[Документация для Chrome здесь](https://developers.google.com/web/tools/chrome-devtools/),
[Firefox здесь](https://developer.mozilla.org/en-US/docs/Tools).

Научитесь их использовать. Если ничего другого, всегда проверяйте JavaScript консоль. Если есть проблема, там часто будет
сообщение об ошибке. Внимательно прочитайте сообщение об ошибке, и вы должны получить подсказку, где проблема.

{{{image url="resources/javascript-console.gif" }}}

## WebGL Lint

[Здесь](https://greggman.github.io/webgl-lint/) есть скрипт для проверки нескольких
ошибок webgl. Просто добавьте это на вашу страницу перед другими скриптами

```
<script src="https://greggman.github.io/webgl-lint/webgl-lint.js"></script>
```

и ваша программа выбросит исключение, если получит ошибку WebGL, и если вам повезет,
напечатает больше информации.

[Вы также можете добавить имена к вашим webgl ресурсам](https://github.com/greggman/webgl-lint#naming-your-webgl-objects-buffers-textures-programs-etc)
(буферы, текстуры, шейдеры, программы, ...), так что когда вы получите сообщение об ошибке, оно
будет включать имена ресурсов, относящихся к ошибке.

## Расширения

Есть различные WebGL инспекторы.
[Вот один для Chrome и Firefox](https://spector.babylonjs.com/).

{{{image url="https://camo.githubusercontent.com/5bbc9caf2fc0ecc2eebf615fa8348146b37b08fe/68747470733a2f2f73706563746f72646f632e626162796c6f6e6a732e636f6d2f70696374757265732f7469746c652e706e67" }}}

Примечание: [ПРОЧИТАЙТЕ ДОКУМЕНТАЦИЮ](https://github.com/BabylonJS/Spector.js/blob/master/readme.md)!

Версия расширения spector.js захватывает кадры. Что это означает - она работает только
если ваше WebGL приложение успешно инициализирует себя и затем рендерит в
цикле `requestAnimationFrame`. Вы нажимаете кнопку "record", и она захватывает
все вызовы WebGL API для одного "кадра".

Это означает, что без некоторой работы это не поможет вам найти проблемы во время инициализации.

Для обхода этого есть 2 метода.

1. Используйте его как библиотеку, а не как расширение.

   См. [документацию](https://github.com/BabylonJS/Spector.js/blob/master/readme.md). Таким образом вы можете сказать ему "Захвати команды WebGL API сейчас!"

2. Измените ваше приложение так, чтобы оно не запускалось, пока вы не нажмете кнопку.

   Таким образом вы можете перейти к расширению и выбрать "record", а затем запустить ваше
   приложение. Если ваше приложение не анимирует, просто добавьте несколько фальшивых кадров. Пример:

```html
<button type="button">start</button>
<canvas id="canvas"></canvas>
```

```js
function main() {
  // Получить WebGL контекст
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const startElem = document.querySelector('button');
  startElem.addEventListener('click', start, {once: true});

  function start() {
    // запустить инициализацию в rAF, поскольку spector захватывает только внутри событий rAF
    requestAnimationFrame(() => {
      // сделать всю инициализацию
      init(gl);
    });
    // сделать больше кадров, чтобы spector было что смотреть.
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
  }
}

main();
```

Теперь вы можете нажать "record" в расширении spector.js, затем нажать "start" на вашей странице,
и spector запишет вашу инициализацию.

Safari также имеет аналогичную встроенную функцию, которая имеет [аналогичные проблемы с аналогичными обходами](https://stackoverflow.com/questions/62446483/debugging-in-webgl).

Когда я использую такой помощник, я часто нажимаю на вызов рисования и проверяю uniforms. Если я вижу кучу `NaN` (NaN = Not a Number), то я обычно могу отследить код, который установил этот uniform, и найти ошибку.

## Изучите код

Также всегда помните, что вы можете изучить код. Вы обычно можете просто выбрать просмотр исходного кода

{{{image url="resources/view-source.gif" }}}

Даже если вы не можете щелкнуть правой кнопкой мыши на странице или если исходный код в отдельном файле,
вы всегда можете просмотреть исходный код в devtools

{{{image url="resources/devtools-source.gif" }}}

## Начать

Надеюсь, это поможет вам начать. [Теперь обратно к урокам](index.html). 