Title: Как рендерить изображения большого масштаба как 32000x32000
Description: Как рендерить изображения большого масштаба как 32000x32000
TOC: Как рендерить изображения большого масштаба как 32000x32000

## Вопрос:

Я хочу получить снимок моего WebGL canvas, и я хочу высокое разрешение, поэтому я увеличил размер моего canvas. Это автоматически изменяет `gl.drawingBufferWidth` и `gl.drawingBufferHeight`. Затем я устанавливаю viewport и рендерю сцену.

Мой код работает правильно в низком разрешении (под 4000*4000), но в более высоких разрешениях есть много проблем.

Если разрешение немного выше, снимок не показывает полностью. См. прикреплённый файл. Если разрешение увеличивается больше, ничего не показывается. И наконец, при некоторых разрешениях мой экземпляр WebGL уничтожается, и мне приходится перезапускать браузер, чтобы снова запустить WebGL.

Есть ли способ получить снимок с WebGL canvas с высоким разрешением? Могу ли я использовать другое решение?

## Ответ:

4000x4000 пикселей - это 4000x4000x4 или 64 мегабайта памяти. 8000x8000 - это 256 мегабайт памяти. Браузеры не любят выделять такие большие куски памяти и часто устанавливают лимиты на страницу. Так, например, у вас есть WebGL canvas 8000x8000, который требует 2 буфера. Drawingbuffer И текстура, отображаемая на странице. Drawingbuffer может быть сглажен. Если это 4x MSAA, то потребуется гигабайт памяти только для этого буфера. Затем вы делаете скриншот, так что ещё 256 мегабайт памяти. Так что да, браузер по той или иной причине, скорее всего, убьёт вашу страницу.

Помимо этого, WebGL имеет свои собственные лимиты в размере. Вы можете посмотреть этот лимит, который эффективно [`MAX_TEXTURE_SIZE`](https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE) или [`MAX_VIEWPORT_DIMS`](https://web3dsurvey.com/webgl/parameters/MAX_VIEWPORT_DIMS). Вы можете увидеть из тех, что около 40% машин не могут рисовать больше 4096 (хотя если вы [отфильтруете только десктоп, это намного лучше](https://web3dsurvey.com/webgl/parameters/MAX_VIEWPORT_DIMS?platforms=0000ff03c02d20f201)). Это число означает только то, что может делать оборудование. Оно всё ещё ограничено памятью.

Один способ, который может решить эту проблему, - рисовать изображение по частям. Как вы это делаете, будет зависеть от вашего приложения. Если вы используете довольно стандартную матрицу перспективы для всего вашего рендеринга, вы можете использовать немного другую математику для рендеринга любой части вида. Большинство 3D математических библиотек имеют функцию `perspective`, и большинство из них также имеют соответствующую функцию `frustum`, которая немного более гибкая.

Вот довольно стандартный стиль WebGL простой пример, который рисует куб, используя типичную функцию `perspective`

{{{example url="../webgl-qna-how-to-render-large-scale-images-like-32000x32000-example-1.html"}}}

И вот тот же код, рендерящий в 400x200 в восьми частях 100x100, используя типичную функцию `frustum` вместо `perspective`

{{{example url="../webgl-qna-how-to-render-large-scale-images-like-32000x32000-example-2.html"}}}

Если вы запустите фрагмент выше, вы увидите, что он генерирует 8 изображений

Важные части - это

Сначала нам нужно решить общий размер, который мы хотим

    const totalWidth = 400;
    const totalHeight = 200;

Затем мы создадим функцию, которая будет рендерить любую меньшую часть этого размера

    function renderPortion(totalWidth, totalHeight, partX, partY, partWidth, partHeight) {
       ...

Мы установим canvas на размер части

      gl.canvas.width = partWidth;
      gl.canvas.height = partHeight;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

И затем вычислим, что нам нужно передать в функцию `frustum`. Сначала мы вычисляем прямоугольник на zNear, который матрица перспективы создала бы, учитывая наши значения field of view, aspect и zNear

      // углы на zNear для общего изображения
      const zNearTotalTop = Math.tan(fov) * 0.5 * zNear;
      const zNearTotalBottom = -zNearTotalTop;
      const zNearTotalLeft = zNearTotalBottom * aspect;
      const zNearTotalRight = zNearTotalTop * aspect;
      
      // ширина, высота на zNear для общего изображения
      const zNearTotalWidth = zNearTotalRight - zNearTotalLeft;
      const zNearTotalHeight = zNearTotalTop - zNearTotalBottom;

Затем мы вычисляем соответствующую область на zNear для части, которую мы хотим рендерить, и передаём их в `frustum` для генерации матрицы проекции.

      const zNearPartLeft = zNearTotalLeft + partX * zNearTotalWidth / totalWidth;   const zNearPartRight = zNearTotalLeft + (partX + partWidth) * zNearTotalWidth / totalWidth;
      const zNearPartBottom = zNearTotalBottom + partY * zNearTotalHeight / totalHeight;
      const zNearPartTop = zNearTotalBottom + (partY + partHeight) * zNearTotalHeight / totalHeight;

      const projection = m4.frustum(zNearPartLeft, zNearPartRight, zNearPartBottom, zNearPartTop, zNear, zFar);

Затем мы просто рендерим как обычно

Наконец, снаружи у нас есть цикл для использования функции, которую мы только что сгенерировали, чтобы рендерить столько частей, сколько мы хотим, с любым разрешением, которое мы хотим.

    const totalWidth = 400;
    const totalHeight = 200;
    const partWidth = 100;
    const partHeight = 100;

    for (let y = 0; y < totalHeight; y += partHeight) {
      for (let x = 0; x < totalWidth; x += partWidth) {
        renderPortion(totalWidth, totalHeight, x, y, partWidth, partHeight);
        const img = new Image();
        img.src = gl.canvas.toDataURL();
        // сделать что-то с изображением.
      }
    }

Это позволит вам рендерить в любой размер, который вы хотите, но вам понадобится другой способ собрать изображения в одно большее изображение. Вы можете или не можете сделать это в браузере. Вы можете попробовать создать гигантский 2D canvas и рисовать каждую часть в него (это предполагает, что 2D canvas не имеет тех же лимитов, что и WebGL). Для этого нет необходимости создавать изображения, просто рисуйте WebGL canvas в 2D canvas.

В противном случае вам, возможно, придётся отправить их на сервер, который вы создадите, чтобы собрать изображение, или в зависимости от вашего случая использования позволить пользователю сохранить их и загрузить их все в программу редактирования изображений.

Или если вы просто хотите отобразить их, браузер, вероятно, будет лучше работать с 16x16 изображениями 1024x1024, чем с одним изображением 16kx16k. В этом случае вы, вероятно, хотите вызвать `canvas.toBlob` вместо использования dataURL и затем вызвать `URL.createObjectURL` для каждого blob. Таким образом, у вас не будет этих гигантских строк dataURL.

Пример:

{{{example url="../webgl-qna-how-to-render-large-scale-images-like-32000x32000-example-3.html"}}}

Если вы хотите, чтобы пользователь мог скачать изображение 16386x16386 вместо 256 изображений 1024x1024, то ещё одно решение - использовать код рендеринга частей выше и для каждой строки (или строк) изображений записать их данные в blob для ручной генерации PNG. [Этот пост в блоге](https://medium.com/the-guardian-mobile-innovation-lab/generating-images-in-javascript-without-using-the-canvas-api-77f3f4355fad) охватывает ручную генерацию PNG из данных, и [этот ответ предлагает, как сделать это для очень больших данных](https://stackoverflow.com/a/51247740/128511).

## обновление: 

Просто для развлечения я написал эту [библиотеку, чтобы помочь генерировать гигантские PNG в браузере](https://github.com/greggman/dekapng).

<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/7784151">MHA15</a>
    из
    <a data-href="https://stackoverflow.com/questions/51232023">здесь</a>
  </div>
</div> 