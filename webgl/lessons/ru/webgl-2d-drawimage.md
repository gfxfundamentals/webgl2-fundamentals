Title: WebGL2 Реализация DrawImage
Description: Как реализовать функцию drawImage canvas 2d в WebGL
TOC: 2D - DrawImage


Эта статья является продолжением [WebGL ортографической 3D](webgl-3d-orthographic.html).
Если вы не читали её, я рекомендую [начать оттуда](webgl-3d-orthographic.html).
Вы также должны знать, как работают текстуры и координаты текстур, пожалуйста, прочитайте
[WebGL 3D текстуры](webgl-3d-textures.html).

Для реализации большинства игр в 2D требуется всего одна функция для рисования изображения. Конечно, некоторые 2D игры
делают причудливые вещи с линиями и т.д., но если у вас есть только способ нарисовать 2D изображение на экране,
вы можете сделать большинство 2D игр.

Canvas 2D API имеет очень гибкую функцию для рисования изображений, называемую `drawImage`. У неё есть 3 версии:

    ctx.drawImage(image, dstX, dstY);
    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

Учитывая всё, что вы изучили до сих пор, как бы вы реализовали это в WebGL? Ваше первое
решение может быть генерировать вершины, как это делали некоторые из первых статей на этом сайте.
Отправка вершин в GPU обычно является медленной операцией (хотя есть случаи, когда это будет быстрее).

Здесь вступает в игру вся суть WebGL. Всё дело в творческом написании
шейдера и затем творческом использовании этого шейдера для решения вашей проблемы.

Давайте начнем с первой версии:

    ctx.drawImage(image, x, y);

Она рисует изображение в позиции `x, y` того же размера, что и изображение.
Чтобы сделать аналогичную WebGL функцию, мы могли бы загрузить вершины для `x, y`, `x + width, y`, `x, y + height`,
и `x + width, y + height`, затем по мере рисования разных изображений в разных местах
мы бы генерировали разные наборы вершин. На самом деле [это именно то, что мы делали в нашей первой
статье](webgl-fundamentals.html).

Гораздо более распространенный способ - это просто использовать единичный квадрат. Мы загружаем один квадрат размером 1 единица. Затем мы
используем [матричную математику](webgl-2d-matrices.html) для масштабирования и перемещения этого единичного квадрата так, чтобы
он оказался в нужном месте.

Вот код.

Сначала нам нужен простой вершинный шейдер:

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;
    uniform mat4 u_textureMatrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

И простой фрагментный шейдер:

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       outColor = texture(texture, v_texcoord);
    }

И теперь функция:

    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
      gl.useProgram(program);

      // Настраиваем атрибуты для квадрата
      gl.bindVertexArray(vao);

      var textureUnit = 0;
      // шейдер, на который мы помещаем текстуру на блок текстуры 0
      gl.uniform1i(textureLocation, textureUnit);

      // Привязываем текстуру к блоку текстуры 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // эта матрица будет конвертировать из пикселей в пространство отсечения
      var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

      // перемещаем наш квадрат в dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // масштабируем наш единичный квадрат
      // с 1 единицы до texWidth, texHeight единиц
      matrix = m4.scale(matrix, texWidth, texHeight, 1);

      // Устанавливаем матрицу.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // рисуем квадрат (2 треугольника, 6 вершин)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

Давайте загрузим некоторые изображения в текстуры:

    // создает информацию о текстуре { width: w, height: h, texture: tex }
    // Текстура начнет с 1x1 пикселей и будет обновлена
    // когда изображение загрузится
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var textureInfo = {
        width: 1,   // мы не знаем размер, пока он не загрузится
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      });

      return textureInfo;
    }

    var textureInfos = [
      loadImageAndCreateTextureInfo('resources/star.jpg'),
      loadImageAndCreateTextureInfo('resources/leaves.jpg'),
      loadImageAndCreateTextureInfo('resources/keyboard.jpg'),
    ];

И давайте нарисуем их в случайных местах:

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var ii = 0; ii < numToDraw; ++ii) {
      var drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      };
      drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
      drawInfos.forEach(function(drawInfo) {
        drawInfo.x += drawInfo.dx * speed * deltaTime;
        drawInfo.y += drawInfo.dy * speed * deltaTime;
        if (drawInfo.x < 0) {
          drawInfo.dx = 1;
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1;
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1;
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1;
        }
      });
    }

    function draw() {
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);

      // Говорим WebGL, как конвертировать из пространства отсечения в пиксели
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Очищаем холст
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      drawInfos.forEach(function(drawInfo) {
        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          drawInfo.x,
          drawInfo.y);
      });
    }

    var then = 0;
    function render(time) {
      var now = time * 0.001;
      var deltaTime = Math.min(0.1, now - then);
      then = now;

      update(deltaTime);
      draw();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

Вы можете увидеть это в действии здесь:

{{{example url="../webgl-2d-drawimage-01.html" }}}

Обработка версии 2 оригинальной canvas функции `drawImage`:

    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);

Действительно ничем не отличается. Мы просто используем `dstWidth` и `dstHeight` вместо
`texWidth` и `texHeight`.

    *function drawImage(tex, texWidth, texHeight, dstX, dstY, dstWidth, dstHeight) {
    +  if (dstWidth === undefined) {
    +    dstWidth = texWidth;
    +  }
    +
    +  if (dstHeight === undefined) {
    +    dstHeight = texHeight;
    +  }

      gl.useProgram(program);

      // Настраиваем атрибуты для квадрата
      gl.bindVertexArray(vao);

      var textureUnit = 0;
      // шейдер, на который мы помещаем текстуру на блок текстуры 0
      gl.uniform1i(textureLocation, textureUnit);

      // Привязываем текстуру к блоку текстуры 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // эта матрица будет конвертировать из пикселей в пространство отсечения
      var matrix = m4.orthographic(0, canvas.width, canvas.height, 0, -1, 1);

      // перемещаем наш квадрат в dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // масштабируем наш единичный квадрат
    *  // с 1 единицы до dstWidth, dstHeight единиц
    *  matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // Устанавливаем матрицу.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // рисуем квадрат (2 треугольника, 6 вершин)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

Я обновил код для использования разных размеров:

{{{example url="../webgl-2d-drawimage-02.html" }}}

Так что это было легко. Но что насчет 3-й версии canvas `drawImage`?

    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

Для выбора части текстуры нам нужно манипулировать координатами текстуры. Как
работают координаты текстуры, было [покрыто в статье о текстурах](webgl-3d-textures.html).
В той статье мы вручную создавали координаты текстуры, что является очень распространенным способом сделать это,
но мы также можем создавать их на лету, и точно так же, как мы манипулируем нашими позициями, используя
матрицу, мы можем аналогично манипулировать координатами текстуры, используя другую матрицу.

Давайте добавим матрицу текстуры в вершинный шейдер и умножим координаты текстуры
на эту матрицу текстуры.

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;
    uniform mat4 u_textureMatrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

Теперь нам нужно найти местоположение матрицы текстуры:

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");

И внутри `drawImage` нам нужно установить её так, чтобы она выбирала часть текстуры, которую мы хотим.
Мы знаем, что координаты текстуры также эффективно являются единичным квадратом, поэтому это очень похоже на
то, что мы уже сделали для позиций.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    srcX, srcY, srcWidth, srcHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstX === undefined) {
    +    dstX = srcX;
    +    srcX = 0;
    +  }
    +  if (dstY === undefined) {
    +    dstY = srcY;
    +    srcY = 0;
    +  }
    +  if (srcWidth === undefined) {
    +    srcWidth = texWidth;
    +  }
    +  if (srcHeight === undefined) {
    +    srcHeight = texHeight;
    +  }
      if (dstWidth === undefined) {
    *    dstWidth = srcWidth;
    +    srcWidth = texWidth;
      }
      if (dstHeight === undefined) {
    *    dstHeight = srcHeight;
    +    srcHeight = texHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      // эта матрица будет конвертировать из пикселей в пространство отсечения
      var matrix = m4.orthographic(
          0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

      // перемещаем наш квадрат в dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // масштабируем наш единичный квадрат
      // с 1 единицы до dstWidth, dstHeight единиц
      matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // Устанавливаем матрицу.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

    +  // Поскольку координаты текстуры идут от 0 до 1
    +  // и поскольку наши координаты текстуры уже являются единичным квадратом
    +  // мы можем выбрать область текстуры, масштабируя единичный квадрат
    +  // вниз
    +  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    +  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
    +
    +  // Устанавливаем матрицу текстуры.
    +  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

      // рисуем квадрат (2 треугольника, 6 вершин)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

Я также обновил код для выбора частей текстур. Вот результат:

{{{example url="../webgl-2d-drawimage-03.html" }}}

В отличие от canvas 2D API, наша WebGL версия обрабатывает случаи, которые canvas 2D `drawImage` не обрабатывает.

Во-первых, мы можем передать отрицательную ширину или высоту для источника или назначения. Отрицательная `srcWidth`
будет выбирать пиксели слева от `srcX`. Отрицательная `dstWidth` будет рисовать слева от `dstX`.
В canvas 2D API это ошибки в лучшем случае или неопределенное поведение в худшем.

{{{example url="../webgl-2d-drawimage-04.html" }}}

Другое - поскольку мы используем матрицу, мы можем делать [любую матричную математику, которую хотим](webgl-2d-matrices.html).

Например, мы могли бы повернуть координаты текстуры вокруг центра текстуры.

Изменяя код матрицы текстуры на это:

    *  // точно как 2d матрица проекции, кроме как в пространстве текстуры (0 до 1)
    *  // вместо пространства отсечения. Эта матрица помещает нас в пространство пикселей.
    *  var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);
    *
    *  // Нам нужно выбрать место для поворота вокруг
    *  // Мы переместимся в середину, повернем, затем вернемся обратно
    *  var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
    *  var texMatrix = m4.zRotate(texMatrix, srcRotation);
    *  var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);
    *
    *  // потому что мы в пространстве пикселей
    *  // масштаб и перемещение теперь в пикселях
    *  var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    *  var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

      // Устанавливаем матрицу текстуры.
      gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

И вот это:

{{{example url="../webgl-2d-drawimage-05.html" }}}

вы можете увидеть одну проблему, которая заключается в том, что из-за поворота иногда мы видим за
краем текстуры. Поскольку она установлена на `CLAMP_TO_EDGE`, край просто повторяется.

Мы могли бы исправить это, отбрасывая любые пиксели вне диапазона от 0 до 1 внутри шейдера.
`discard` немедленно выходит из шейдера без записи пикселя.

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
    +   if (v_texcoord.x < 0.0 ||
    +       v_texcoord.y < 0.0 ||
    +       v_texcoord.x > 1.0 ||
    +       v_texcoord.y > 1.0) {
    +     discard;
    +   }
       outColor = texture(texture, v_texcoord);
    }

И теперь углы исчезли:

{{{example url="../webgl-2d-drawimage-06.html" }}}

или, может быть, вы хотели бы использовать сплошной цвет, когда координаты текстуры находятся вне текстуры:

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       if (v_texcoord.x < 0.0 ||
           v_texcoord.y < 0.0 ||
           v_texcoord.x > 1.0 ||
           v_texcoord.y > 1.0) {
    *     outColor = vec4(0, 0, 1, 1); // синий
    +     return;
       }
       outColor = texture(texture, v_texcoord);
    }

{{{example url="../webgl-2d-drawimage-07.html" }}}

Небо действительно является пределом. Всё зависит от вашего творческого использования шейдеров.

Далее [мы реализуем стек матриц canvas 2d](webgl-2d-matrix-stack.html).

<div class="webgl_bottombar">
<h3>Небольшая оптимизация</h3>
<p>Я не рекомендую эту оптимизацию. Скорее я хочу указать
на более творческое мышление, поскольку WebGL - это всё о творческом использовании функций,
которые он предоставляет.</p>
<p>Вы могли заметить, что мы используем единичный квадрат для наших позиций, и эти позиции
единичного квадрата точно соответствуют нашим координатам текстуры. Как таковые, мы можем использовать позиции
как координаты текстуры.</p>
<pre class="prettyprint showlinemods">{{#escapehtml}}
#version 300 es
in vec4 a_position;
-in vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
*   v_texcoord = (u_textureMatrix * a_position).xy;
}
{{/escapehtml}}</pre>
<p>Теперь мы можем удалить код, который настраивал координаты текстуры, и он будет
работать точно так же, как раньше.</p>
{{{example url="../webgl-2d-drawimage-08.html" }}}
</div> 