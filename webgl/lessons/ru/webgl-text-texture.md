Title: WebGL2 Текст - Текстуры
Description: Отображение текста в WebGL с использованием текстур
TOC: Текст - Использование текстуры


Эта статья является продолжением многих статей о WebGL. Последняя была о
[использовании Canvas 2D для рендеринга текста поверх WebGL canvas](webgl-text-canvas2d.html).
Если вы ее не читали, возможно, стоит сначала ознакомиться с ней.

В последней статье мы рассмотрели [как использовать 2D canvas для рисования текста поверх вашей WebGL
сцены](webgl-text-canvas2d.html). Эта техника работает и проста в реализации, но у нее есть
ограничение - текст не может быть скрыт другими 3D объектами. Для этого нам
действительно нужно рисовать текст в WebGL.

Самый простой способ сделать это - создать текстуры с текстом в них. Вы могли бы, например,
зайти в Photoshop или другую программу для рисования и нарисовать изображение с каким-то текстом.

<img class="webgl_center" src="resources/my-awesme-text.png" />

Затем создать какую-то плоскую геометрию и отобразить ее. Это на самом деле то, как некоторые игры, над которыми я
работал, делали весь свой текст. Например, Locoroco имела только около 270 строк. Она была
локализована на 17 языков. У нас был Excel лист со всеми языками и скрипт,
который запускал Photoshop и генерировал текстуру, одну для каждого сообщения на каждом языке.

Конечно, вы также можете генерировать текстуры во время выполнения. Поскольку WebGL находится в браузере,
мы снова можем полагаться на Canvas 2D API для помощи в генерации наших текстур.

Начиная с примеров из [предыдущей статьи](webgl-text-canvas2d.html),
давайте добавим функцию для заполнения 2D canvas каким-то текстом

    var textCtx = document.createElement("canvas").getContext("2d");

    // Помещает текст в центр canvas.
    function makeTextCanvas(text, width, height) {
      textCtx.canvas.width  = width;
      textCtx.canvas.height = height;
      textCtx.font = "20px monospace";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillStyle = "black";
      textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
      textCtx.fillText(text, width / 2, height / 2);
      return textCtx.canvas;
    }

Теперь, когда нам нужно рисовать 2 разные вещи в WebGL, 'F' и наш текст, я переключусь на
[использование некоторых вспомогательных функций, как описано в предыдущей статье](webgl-drawing-multiple-things.html).
Если неясно, что такое `programInfo`, `bufferInfo` и т.д., см. ту статью.

Итак, давайте создадим 'F' и единичный квадрат.

```
// Создаем данные для 'F'
var fBufferInfo = primitives.create3DFBufferInfo(gl);
var fVAO = webglUtils.createVAOFromBufferInfo(
    gl, fProgramInfo, fBufferInfo);

// Создаем единичный квадрат для 'текста'
var textBufferInfo = primitives.createXYQuadBufferInfo(gl, 1);
var textVAO = webglUtils.createVAOFromBufferInfo(
    gl, textProgramInfo, textBufferInfo);
```

XY квадрат - это квадрат размером в 1 единицу. Этот центрирован в начале координат. Будучи размером в 1 единицу,
его границы -0.5, -0.5 и 0.5, 0.5

Затем создаем 2 шейдера

    // настраиваем GLSL программы
    var fProgramInfo = webglUtils.createProgramInfo(
        gl, [fVertexShaderSource, fFragmentShaderSource]);
    var textProgramInfo = webglUtils.createProgramInfo(
        gl, [textVertexShaderSource, textFragmentShaderSource]);

И создаем нашу текстовую текстуру. Мы генерируем мипмапы, поскольку текст будет становиться маленьким

    // создаем текстовую текстуру.
    var textCanvas = makeTextCanvas("Привет!", 100, 26);
    var textWidth  = textCanvas.width;
    var textHeight = textCanvas.height;
    var textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

Настраиваем uniforms для 'F' и текста

    var fUniforms = {
      u_matrix: m4.identity(),
    };

    var textUniforms = {
      u_matrix: m4.identity(),
      u_texture: textTex,
    };

Теперь, когда мы вычисляем матрицы для F, мы начинаем с viewMatrix вместо
viewProjectionMatrix, как в других примерах. Мы умножаем это на части,
которые составляют ориентацию нашей F

    var fViewMatrix = m4.translate(viewMatrix,
        translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
    fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
    fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
    fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
    fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
    fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);

Затем наконец мы умножаем на projectionMatrix при установке нашего uniform значения.

    fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

Важно отметить здесь, что `projectionMatrix` находится слева. Это позволяет нам
умножать на projectionMatrix, как будто это была первая матрица. Обычно
мы умножаем справа.

Рисование F выглядит так

    // настраиваем для рисования 'F'
    gl.useProgram(fProgramInfo.program);

    // настраиваем атрибуты и буферы для F
    gl.bindVertexArray(fVAO);

    fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

    webglUtils.setUniforms(fProgramInfo, fUniforms);

    webglUtils.drawBufferInfo(gl, fBufferInfo);

Для текста мы начинаем с projectionMatrix и затем получаем только позицию
из fViewMatrix, которую мы сохранили ранее. Это даст нам пространство перед видом.
Нам также нужно масштабировать наш единичный квадрат, чтобы соответствовать размерам текстуры.

    // используем только позицию вида 'F' для текста
    var textMatrix = m4.translate(projectionMatrix,
        fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]);
    // масштабируем F до нужного нам размера.
    textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

И затем рендерим текст

    // настраиваем для рисования текста.
    gl.useProgram(textProgramInfo.program);

    gl.bindVertexArray(textVAO);

    m4.copy(textMatrix, textUniforms.u_matrix);
    webglUtils.setUniforms(textProgramInfo, textUniforms);

    // Рисуем текст.
    webglUtils.drawBufferInfo(gl, textBufferInfo);

Итак, вот это

{{{example url="../webgl-text-texture.html" }}}

Вы заметите, что иногда части нашего текста покрывают части наших F. Это потому, что
мы рисуем квадрат. Цвет по умолчанию canvas - прозрачный черный (0,0,0,0), и
мы рисуем этот цвет в квадрате. Мы могли бы вместо этого смешивать наши пиксели.

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

Это заставляет брать исходный пиксель (цвет из нашего фрагментного шейдера) и комбинировать его
с целевым пикселем (цветом в canvas) согласно функции смешивания. Мы установили
функцию смешивания на `SRC_ALPHA` для источника и `ONE_MINUS_SRC_ALPHA` для цели.

    result = dest * (1 - src_alpha) + src * src_alpha

так, например, если цель зеленая `0,1,0,1`, а источник красный `1,0,0,1`, у нас будет

    src = [1, 0, 0, 1]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // это 1
    result = dst * (1 - src_alpha) + src * src_alpha

    // что то же самое, что
    result = dst * 0 + src * 1

    // что то же самое, что
    result = src

Для частей текстуры с прозрачным черным `0,0,0,0`

    src = [0, 0, 0, 0]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // это 0
    result = dst * (1 - src_alpha) + src * src_alpha

    // что то же самое, что
    result = dst * 1 + src * 0

    // что то же самое, что
    result = dst

Вот результат с включенным смешиванием.

{{{example url="../webgl-text-texture-enable-blend.html" }}}

Вы можете видеть, что это лучше, но все еще не идеально. Если вы посмотрите
близко, иногда увидите эту проблему

<img class="webgl_center" src="resources/text-zbuffer-issue.png" />

Что происходит? Мы сейчас рисуем F, затем его текст, затем следующий F,
затем его текст повторяем. У нас все еще есть [буфер глубины](webgl-3d-orthographic.html), поэтому когда мы рисуем
текст для F, даже хотя смешивание заставило некоторые пиксели остаться цветом фона,
буфер глубины все еще был обновлен. Когда мы рисуем следующий F, если части этого F находятся
за этими пикселями от какого-то ранее нарисованного текста, они не будут нарисованы.

Мы только что столкнулись с одной из самых сложных проблем рендеринга 3D на GPU.
**Прозрачность имеет проблемы**.

Самое распространенное решение для практически всего прозрачного
рендеринга - это рисовать все непрозрачные вещи сначала, затем после этого рисовать все прозрачные
вещи, отсортированные по z расстоянию с тестированием буфера глубины включенным, но обновлением буфера глубины выключенным.

Давайте сначала отделим рисование непрозрачных вещей (F) от прозрачных вещей (текст).
Сначала мы объявим что-то для запоминания позиций текста.

    var textPositions = [];

И в цикле для рендеринга F мы запомним эти позиции

    // запоминаем позицию для текста
    textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);

Перед тем как рисовать 'F', мы отключим смешивание и включим запись в буфер глубины

    gl.disable(gl.BLEND);
    gl.depthMask(true);

Для рисования текста мы включим смешивание и отключим запись в буфер глубины.

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

И затем рисуем текст во всех позициях, которые мы сохранили

    textPositions.forEach(function(pos) {
      // используем только позицию вида 'F' для текста
      var textMatrix = m4.translate(projectionMatrix,
          pos[0], pos[1], pos[2]);
      // масштабируем F до нужного нам размера.
      textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

      // настраиваем для рисования текста.
      gl.useProgram(textProgramInfo.program);

      gl.bindVertexArray(textVAO);

      m4.copy(textMatrix, textUniforms.u_matrix);
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // Рисуем текст.
      webglUtils.drawBufferInfo(gl, textBufferInfo);
    });

И теперь это в основном работает

{{{example url="../webgl-text-texture-separate-opaque-from-transparent.html" }}}

Обратите внимание, мы не сортировали, как я упомянул выше. В данном случае, поскольку мы рисуем в основном непрозрачный текст,
вероятно, не будет заметной разницы, если мы отсортируем, поэтому я сохраню это для какой-то
другой статьи.

Другая проблема в том, что текст пересекается со своей собственной 'F'. Для этого действительно
нет конкретного решения. Если бы вы делали MMO и хотели, чтобы текст каждого игрока всегда появлялся,
вы могли бы попытаться заставить текст появляться над головой. Просто переместите его
по +Y на некоторое количество единиц, достаточно, чтобы убедиться, что он всегда был выше игрока.

Вы также можете переместить его вперед к камере. Давайте сделаем это здесь просто для удовольствия.
Поскольку 'pos' в пространстве вида, это означает, что он относительно глаза (который находится в 0,0,0 в пространстве вида).
Поэтому если мы нормализуем его, мы получим единичный вектор, указывающий от глаза к этой точке, который мы можем затем
умножить на некоторое количество, чтобы переместить текст на определенное количество единиц к глазу или от него.

    // потому что pos в пространстве вида, это означает, что это вектор от глаза к
    // некоторой позиции. Итак, перемещаемся вдоль этого вектора обратно к глазу на некоторое расстояние
    var fromEye = m4.normalize(pos);
    var amountToMoveTowardEye = 150;  // потому что F 150 единиц длиной
    var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
    var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
    var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;

    var textMatrix = m4.translate(projectionMatrix,
        viewX, viewY, viewZ);
    // масштабируем F до нужного нам размера.
    textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

Вот это.

{{{example url="../webgl-text-texture-moved-toward-view.html" }}}

Вы все еще можете заметить проблему с краями букв.

<img class="webgl_center" src="resources/text-gray-outline.png" />

Проблема здесь в том, что Canvas 2D API производит только предумноженные альфа значения.
Когда мы загружаем содержимое canvas в текстуру, WebGL пытается отменить предумножение
значений, но он не может сделать это идеально, потому что предумноженная альфа имеет потери.

Чтобы исправить это, давайте скажем WebGL не отменять предумножение

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

Это говорит WebGL поставлять предумноженные альфа значения в `gl.texImage2D` и `gl.texSubImage2D`.
Если данные, переданные в `gl.texImage2D`, уже предумножены, как это для данных Canvas 2D, то
WebGL может просто пропустить их.

Нам также нужно изменить функцию смешивания

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

Старая умножала исходный цвет на его альфа. Это то, что означает `SRC_ALPHA`. Но
теперь данные нашей текстуры уже были умножены на их альфа. Это то, что означает предумноженная.
Поэтому нам не нужно, чтобы GPU делал умножение. Установка на `ONE` означает умножить на 1.

{{{example url="../webgl-text-texture-premultiplied-alpha.html" }}}

Края исчезли сейчас.

Что если вы хотите сохранить текст фиксированного размера, но все еще правильно сортировать? Ну, если вы помните
из [статьи о перспективе](webgl-3d-perspective.html), наша матрица перспективы будет
масштабировать наш объект на `-Z`, чтобы он становился меньше вдалеке. Итак, мы можем просто масштабировать
на `-Z` умножить на некоторый желаемый масштаб для компенсации.

    ...
    // потому что pos в пространстве вида, это означает, что это вектор от глаза к
    // некоторой позиции. Итак, перемещаемся вдоль этого вектора обратно к глазу на некоторое расстояние
    var fromEye = normalize(pos);
    var amountToMoveTowardEye = 150;  // потому что F 150 единиц длиной
    var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
    var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
    var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
    var desiredTextScale = -1 / gl.canvas.height;  // 1x1 пиксели
    var scale = viewZ * desiredTextScale;

    var textMatrix = m4.translate(projectionMatrix,
        viewX, viewY, viewZ);
    // масштабируем F до нужного нам размера.
    textMatrix = m4.scale(textMatrix, textWidth * scale, textHeight * scale, 1);
    ...

{{{example url="../webgl-text-texture-consistent-scale.html" }}}

Если вы хотите рисовать разный текст у каждой F, вы должны создать новую текстуру для каждой
F и просто обновлять текстовые uniforms для этой F.

    // создаем текстовые текстуры, одну для каждой F
    var textTextures = [
      "anna",   // 0
      "colin",  // 1
      "james",  // 2
      "danny",  // 3
      "kalin",  // 4
      "hiro",   // 5
      "eddie",  // 6
      "shu",    // 7
      "brian",  // 8
      "tami",   // 9
      "rick",   // 10
      "gene",   // 11
      "natalie",// 12,
      "evan",   // 13,
      "sakura", // 14,
      "kai",    // 15,
    ].map(function(name) {
      var textCanvas = makeTextCanvas(name, 100, 26);
      var textWidth  = textCanvas.width;
      var textHeight = textCanvas.height;
      var textTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return {
        texture: textTex,
        width: textWidth,
        height: textHeight,
      };
    });

Затем во время рендеринга выбираем текстуру

    textPositions.forEach(function(pos, ndx) {

      // выбираем текстуру
      var tex = textTextures[ndx];

Используем размер этой текстуры в наших вычислениях матрицы

      var textMatrix = m4.translate(projectionMatrix,
          pos[0], pos[1], pos[2]);
      // масштабируем F до нужного нам размера.
      textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);

и устанавливаем uniform для текстуры перед рисованием

      textUniforms.u_texture = tex.texture;

{{{example url="../webgl-text-texture-different-text.html" }}}

Мы использовали черный для рисования текста в canvas.
Было бы более полезно, если бы мы рендерили текст белым. Тогда мы могли бы умножить
текст на цвет и сделать его любым цветом, который мы хотим.

Сначала мы изменим текстовый шейдер, чтобы умножить на цвет

    ...
    in vec2 v_texcoord;

    uniform sampler2D u_texture;
    uniform vec4 u_color;

    out vec4 outColor;

    void main() {
      outColor = texture2D(u_texture, v_texcoord) * u_color;
    }


И когда мы рисуем текст в canvas, используем белый

    textCtx.fillStyle = "white";

Затем мы создадим некоторые цвета

    // цвета, 1 для каждой F
    var colors = [
      [0.0, 0.0, 0.0, 1], // 0
      [1.0, 0.0, 0.0, 1], // 1
      [0.0, 1.0, 0.0, 1], // 2
      [1.0, 1.0, 0.0, 1], // 3
      [0.0, 0.0, 1.0, 1], // 4
      [1.0, 0.0, 1.0, 1], // 5
      [0.0, 1.0, 1.0, 1], // 6
      [0.5, 0.5, 0.5, 1], // 7
      [0.5, 0.0, 0.0, 1], // 8
      [0.0, 0.0, 0.0, 1], // 9
      [0.5, 5.0, 0.0, 1], // 10
      [0.0, 5.0, 0.0, 1], // 11
      [0.5, 0.0, 5.0, 1], // 12,
      [0.0, 0.0, 5.0, 1], // 13,
      [0.5, 5.0, 5.0, 1], // 14,
      [0.0, 5.0, 5.0, 1], // 15,
    ];

Во время рисования мы выбираем цвет

    // устанавливаем uniform цвета
    textUniforms.u_color = colors[ndx];

Цвета

{{{example url="../webgl-text-texture-different-colors.html" }}}

Эта техника на самом деле является техникой, которую используют большинство браузеров, когда они ускорены GPU.
Они генерируют текстуры с вашим HTML содержимым и всеми различными стилями, которые вы применили,
и пока это содержимое не изменяется, они могут просто рендерить текстуру
снова при прокрутке и т.д. Конечно, если вы обновляете вещи все время, то
эта техника может стать немного медленной, потому что перегенерация текстур и повторная загрузка
их в GPU - это относительно медленная операция.

В [следующей статье мы рассмотрим технику, которая, вероятно, лучше для случаев, когда
вещи обновляются часто](webgl-text-glyphs.html).

<div class="webgl_bottombar">
<h3>Масштабирование текста без пикселизации</h3>
<p>
Вы можете заметить в примерах до того, как мы начали использовать постоянный размер,
текст становится очень пикселизованным, когда он приближается к камере. Как мы это исправляем?
</p>
<p>
Ну, честно говоря, не очень распространено масштабировать 2D текст в 3D. Посмотрите на большинство игр
или 3D редакторов, и вы увидите, что текст почти всегда одного постоянного размера
независимо от того, насколько далеко или близко к камере он находится. На самом деле часто этот текст
может быть нарисован в 2D вместо 3D, так что даже если кто-то или что-то находится
за чем-то другим, как товарищ по команде за стеной, вы все еще можете читать текст.
</p>
<p>Если вы действительно хотите масштабировать 2D текст в 3D, я не знаю никаких легких вариантов.
Несколько сходу:</p>
<ul>
<li>Создайте разные размеры текстур с шрифтами в разных разрешениях. Вы затем
используете текстуры более высокого разрешения, когда текст становится больше. Это называется
LODing (использование разных уровней детализации).</li>
<li>Другой был бы рендеринг текстур с точным правильным размером
текста каждый кадр. Это, вероятно, было бы действительно медленно.</li>
<li>Еще один был бы сделать 2D текст из геометрии. Другими словами, вместо
рисования текста в текстуру сделать текст из множества и множества треугольников. Это
работает, но у этого есть другие проблемы в том, что маленький текст не будет рендериться хорошо, а большой
текст вы начнете видеть треугольники.</li>
<li>Еще один - это <a href="https://www.google.com/search?q=loop+blinn+curve+rendering">использовать очень специальные шейдеры, которые рендерят кривые</a>. Это очень круто,
но далеко за пределами того, что я могу объяснить здесь.</li>
</ul>
</div> 