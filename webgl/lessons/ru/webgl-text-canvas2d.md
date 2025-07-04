Title: WebGL2 Текст - Canvas 2D
Description: Как отображать текст, используя 2D canvas, который синхронизирован с WebGL
TOC: Текст - Canvas 2D


Эта статья является продолжением [предыдущих статей WebGL о рисовании текста](webgl-text-html.html).
Если вы их не читали, я предлагаю начать там и работать в обратном направлении.

Вместо использования HTML элементов для текста мы также можем использовать другой canvas, но с
2D контекстом. Без профилирования это просто предположение, что это будет быстрее,
чем использование DOM. Конечно, это также менее гибко. Вы не получаете все
причудливые CSS стили. Но нет HTML элементов для создания и отслеживания.

Аналогично другим примерам мы создаем контейнер, но на этот раз помещаем
2 canvas в него.

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <canvas id="text" width="400" height="300"></canvas>
    </div>

Затем настраиваем CSS так, чтобы canvas и HTML перекрывались

    .container {
        position: relative;
    }

    #text {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10;
    }

Теперь ищем text canvas во время инициализации и создаем 2D контекст для него.

    // ищем text canvas.
    var textCanvas = document.querySelector("#text");

    // создаем 2D контекст для него
    var ctx = textCanvas.getContext("2d");

При рисовании, точно так же, как WebGL, нам нужно очищать 2D canvas каждый кадр.

    function drawScene() {
        ...

        // Очищаем 2D canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

И затем мы просто вызываем `fillText` для рисования текста

        ctx.fillText(someMsg, pixelX, pixelY);

И вот этот пример

{{{example url="../webgl-text-html-canvas2d.html" }}}

Почему текст меньше? Потому что это размер по умолчанию для Canvas 2D.
Если вы хотите другие размеры, [проверьте Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text).

Другая причина использовать Canvas 2D - это легко рисовать другие вещи. Например,
давайте добавим стрелку

    // рисуем стрелку и текст.

    // сохраняем все настройки canvas
    ctx.save();

    // перемещаем начало координат canvas так, чтобы 0, 0 было в
    // верхнем переднем правом углу нашей F
    ctx.translate(pixelX, pixelY);

    // рисуем стрелку
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.stroke();

    // рисуем текст.
    ctx.fillText(someMessage, 20, 20);

    // восстанавливаем canvas к его старым настройкам.
    ctx.restore();

Здесь мы используем преимущество функции translate Canvas 2D, поэтому нам не нужно делать никаких дополнительных
математических вычислений при рисовании нашей стрелки. Мы просто притворяемся, что рисуем в начале координат, и translate заботится
о перемещении этого начала координат к углу нашей F.

{{{example url="../webgl-text-html-canvas2d-arrows.html" }}}

Я думаю, что это покрывает использование Canvas 2D. [Проверьте Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
для большего количества идей. [Далее мы фактически будем рендерить текст в WebGL](webgl-text-texture.html). 