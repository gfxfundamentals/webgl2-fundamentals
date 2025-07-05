Title: WebGL2 Текст - Использование текстуры глифов
Description: Как отображать текст, используя текстуру, полную глифов
TOC: Текст - Использование текстуры глифов


Этот пост является продолжением многих статей о WebGL. Последняя была о
[использовании текстур для рендеринга текста в WebGL](webgl-text-texture.html).
Если вы её не читали, возможно, стоит проверить это перед продолжением.

В последней статье мы прошли [как использовать текстуру для рисования текста в вашей WebGL
сцене](webgl-text-texture.html). Эта техника очень распространена и отлично подходит
для таких вещей, как в многопользовательских играх, где вы хотите поставить имя над аватаром.
Поскольку это имя редко изменяется, это идеально.

Допустим, вы хотите рендерить много текста, который часто изменяется, как UI. Учитывая
последний пример в [предыдущей статье](webgl-text-texture.html), очевидное
решение - сделать текстуру для каждой буквы. Давайте изменим последний пример, чтобы сделать
это.

    +var names = [
    +  "anna",   // 0
    +  "colin",  // 1
    +  "james",  // 2
    +  "danny",  // 3
    +  "kalin",  // 4
    +  "hiro",   // 5
    +  "eddie",  // 6
    +  "shu",    // 7
    +  "brian",  // 8
    +  "tami",   // 9
    +  "rick",   // 10
    +  "gene",   // 11
    +  "natalie",// 12,
    +  "evan",   // 13,
    +  "sakura", // 14,
    +  "kai",    // 15,
    +];

    // создаем текстовые текстуры, одну для каждой буквы
    var textTextures = [
    +  "a",    // 0
    +  "b",    // 1
    +  "c",    // 2
    +  "d",    // 3
    +  "e",    // 4
    +  "f",    // 5
    +  "g",    // 6
    +  "h",    // 7
    +  "i",    // 8
    +  "j",    // 9
    +  "k",    // 10
    +  "l",    // 11
    +  "m",    // 12,
    +  "n",    // 13,
    +  "o",    // 14,
    +  "p",    // 14,
    +  "q",    // 14,
    +  "r",    // 14,
    +  "s",    // 14,
    +  "t",    // 14,
    +  "u",    // 14,
    +  "v",    // 14,
    +  "w",    // 14,
    +  "x",    // 14,
    +  "y",    // 14,
    +  "z",    // 14,
    ].map(function(name) {
    *  var textCanvas = makeTextCanvas(name, 10, 26);

Затем вместо рендеринга одного квада для каждого имени мы будем рендерить один квад для каждой
буквы в каждом имени.

    // настройка для рисования текста.
    +// Поскольку каждая буква использует одинаковые атрибуты и одинаковую программу
    +// нам нужно сделать это только один раз.
    +gl.useProgram(textProgramInfo.program);
    +setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

    textPositions.forEach(function(pos, ndx) {
    +  var name = names[ndx];
    +
    +  // для каждой буквы
    +  for (var ii = 0; ii < name.length; ++ii) {
    +    var letter = name.charCodeAt(ii);
    +    var letterNdx = letter - "a".charCodeAt(0);
    +
    +    // выбираем текстуру буквы
    +    var tex = textTextures[letterNdx];

        // используем только позицию 'F' для текста

        // потому что pos в пространстве вида, это означает, что это вектор от глаза к
        // некоторой позиции. Итак, перемещаемся вдоль этого вектора обратно к глазу на некоторое расстояние
        var fromEye = m4.normalize(pos);
        var amountToMoveTowardEye = 150;  // потому что F 150 единиц длиной
        var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
        var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
        var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
        var desiredTextScale = -1 / gl.canvas.height;  // 1x1 пиксели
        var scale = viewZ * desiredTextScale;

        var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
        textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);
        +textMatrix = m4.translate(textMatrix, ii, 0, 0);

        // устанавливаем uniform текстуры
        textUniforms.u_texture = tex.texture;
        copyMatrix(textMatrix, textUniforms.u_matrix);
        setUniforms(textProgramInfo.uniformSetters, textUniforms);

        // Рисуем текст.
        gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      }
    });

И вы можете видеть, что это работает

{{{example url="../webgl-text-glyphs.html" }}}

К сожалению, это МЕДЛЕННО. Пример ниже не показывает это, но мы индивидуально
рисуем 73 квада. Мы вычисляем 73 матрицы и 219 умножений матриц. Типичный
UI может легко иметь 1000 букв. Это слишком много работы, чтобы получить
разумную частоту кадров.

Итак, чтобы исправить это, способ, которым это обычно делается, - создать текстуру-атлас, которая содержит все
буквы. Мы прошли, что такое текстура-атлас, когда говорили о [текстурировании 6
граней куба](webgl-3d-textures.html#texture-atlas).

Ища в интернете, я нашел [этот простой открытый исходный код текстуры шрифта-атласа](https://opengameart.org/content/8x8-font-chomps-wacky-worlds-beta)
<img class="webgl_center" width="256" height="160" style="image-rendering: pixelated;" src="../resources/8x8-font.png" />

Давайте создадим некоторые данные, которые мы можем использовать для помощи в генерации позиций и координат текстуры

```
var fontInfo = {
  letterHeight: 8,
  spaceWidth: 8,
  spacing: -1,
  textureWidth: 64,
  textureHeight: 40,
  glyphInfos: {
    'a': { x:  0, y:  0, width: 8, },
    'b': { x:  8, y:  0, width: 8, },
    'c': { x: 16, y:  0, width: 8, },
    'd': { x: 24, y:  0, width: 8, },
    'e': { x: 32, y:  0, width: 8, },
    'f': { x: 40, y:  0, width: 8, },
    'g': { x: 48, y:  0, width: 8, },
    'h': { x: 56, y:  0, width: 8, },
    'i': { x:  0, y:  8, width: 8, },
    'j': { x:  8, y:  8, width: 8, },
    'k': { x: 16, y:  8, width: 8, },
    'l': { x: 24, y:  8, width: 8, },
    'm': { x: 32, y:  8, width: 8, },
    'n': { x: 40, y:  8, width: 8, },
    'o': { x: 48, y:  8, width: 8, },
    'p': { x: 56, y:  8, width: 8, },
    'q': { x:  0, y: 16, width: 8, },
    'r': { x:  8, y: 16, width: 8, },
    's': { x: 16, y: 16, width: 8, },
    't': { x: 24, y: 16, width: 8, },
    'u': { x: 32, y: 16, width: 8, },
    'v': { x: 40, y: 16, width: 8, },
    'w': { x: 48, y: 16, width: 8, },
    'x': { x: 56, y: 16, width: 8, },
    'y': { x:  0, y: 24, width: 8, },
    'z': { x:  8, y: 24, width: 8, },
    '0': { x: 16, y: 24, width: 8, },
    '1': { x: 24, y: 24, width: 8, },
    '2': { x: 32, y: 24, width: 8, },
    '3': { x: 40, y: 24, width: 8, },
    '4': { x: 48, y: 24, width: 8, },
    '5': { x: 56, y: 24, width: 8, },
    '6': { x:  0, y: 32, width: 8, },
    '7': { x:  8, y: 32, width: 8, },
    '8': { x: 16, y: 32, width: 8, },
    '9': { x: 24, y: 32, width: 8, },
    '-': { x: 32, y: 32, width: 8, },
    '*': { x: 40, y: 32, width: 8, },
    '!': { x: 48, y: 32, width: 8, },
    '?': { x: 56, y: 32, width: 8, },
  },
};
```

И мы [загрузим изображение точно так же, как мы загружали текстуры раньше](webgl-3d-textures.html)

```
// Создаем текстуру.
var glyphTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, glyphTex);
// Заполняем текстуру 1x1 синим пикселем.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
// Асинхронно загружаем изображение
var image = new Image();
image.src = "resources/8x8-font.png";
image.addEventListener('load', function() {
  // Теперь, когда изображение загружено, копируем его в текстуру.
  gl.bindTexture(gl.TEXTURE_2D, glyphTex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
});
```

Теперь, когда у нас есть текстура с глифами в ней, нам нужно её использовать. Для этого мы будем
строить вершины квадов на лету для каждого глифа. Эти вершины будут использовать координаты текстуры
для выбора конкретного глифа

Учитывая строку, давайте построим вершины

```
function makeVerticesForString(fontInfo, s) {
  var len = s.length;
  var numVertices = len * 6;
  var positions = new Float32Array(numVertices * 2);
  var texcoords = new Float32Array(numVertices * 2);
  var offset = 0;
  var x = 0;
  var maxX = fontInfo.textureWidth;
  var maxY = fontInfo.textureHeight;
  for (var ii = 0; ii < len; ++ii) {
    var letter = s[ii];
    var glyphInfo = fontInfo.glyphInfos[letter];
    if (glyphInfo) {
      var x2 = x + glyphInfo.width;
      var u1 = glyphInfo.x / maxX;
      var v1 = (glyphInfo.y + fontInfo.letterHeight - 1) / maxY;
      var u2 = (glyphInfo.x + glyphInfo.width - 1) / maxX;
      var v2 = glyphInfo.y / maxY;

      // 6 вершин на букву
      positions[offset + 0] = x;
      positions[offset + 1] = 0;
      texcoords[offset + 0] = u1;
      texcoords[offset + 1] = v1;

      positions[offset + 2] = x2;
      positions[offset + 3] = 0;
      texcoords[offset + 2] = u2;
      texcoords[offset + 3] = v1;

      positions[offset + 4] = x;
      positions[offset + 5] = fontInfo.letterHeight;
      texcoords[offset + 4] = u1;
      texcoords[offset + 5] = v2;

      positions[offset + 6] = x;
      positions[offset + 7] = fontInfo.letterHeight;
      texcoords[offset + 6] = u1;
      texcoords[offset + 7] = v2;

      positions[offset + 8] = x2;
      positions[offset + 9] = 0;
      texcoords[offset + 8] = u2;
      texcoords[offset + 9] = v1;

      positions[offset + 10] = x2;
      positions[offset + 11] = fontInfo.letterHeight;
      texcoords[offset + 10] = u2;
      texcoords[offset + 11] = v2;

      x += glyphInfo.width + fontInfo.spacing;
      offset += 12;
    } else {
      // у нас нет этого символа, поэтому просто продвигаемся
      x += fontInfo.spaceWidth;
    }
  }

  // возвращаем ArrayBufferViews для части TypedArrays
  // которые фактически использовались.
  return {
    arrays: {
      position: new Float32Array(positions.buffer, 0, offset),
      texcoord: new Float32Array(texcoords.buffer, 0, offset),
    },
    numVertices: offset / 2,
  };
}
```

Чтобы использовать это, мы вручную создадим bufferInfo. ([См. предыдущую статью, если вы не помните, что такое bufferInfo](webgl-drawing-multiple-things.html)).

    // Вручную создаем bufferInfo
    var textBufferInfo = {
      attribs: {
        a_position: { buffer: gl.createBuffer(), numComponents: 2, },
        a_texcoord: { buffer: gl.createBuffer(), numComponents: 2, },
      },
      numElements: 0,
    };

И затем для рендеринга текста мы обновим буферы. Мы также сделаем текст динамическим

    textPositions.forEach(function(pos, ndx) {

      var name = names[ndx];
    +  var s = name + ":" + pos[0].toFixed(0) + "," + pos[1].toFixed(0) + "," + pos[2].toFixed(0);
    +  var vertices = makeVerticesForString(fontInfo, s);
    +
    +  // обновляем буферы
    +  textBufferInfo.attribs.a_position.numComponents = 2;
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_position.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.position, gl.DYNAMIC_DRAW);
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_texcoord.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.texcoord, gl.DYNAMIC_DRAW);

      // используем только позицию вида 'F' для текста

      // потому что pos в пространстве вида, это означает, что это вектор от глаза к
      // некоторой позиции. Итак, перемещаемся вдоль этого вектора обратно к глазу на некоторое расстояние
      var fromEye = m4.normalize(pos);
      var amountToMoveTowardEye = 150;  // потому что F 150 единиц длиной
      var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
      var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
      var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
      var desiredTextScale = -1 / gl.canvas.height * 2;  // 1x1 пиксели
      var scale = viewZ * desiredTextScale;

      var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
      textMatrix = m4.scale(textMatrix, scale, scale, 1);

      // настройка для рисования текста.
      gl.useProgram(textProgramInfo.program);

      gl.bindVertexArray(textVAO);

      m4.copy(textMatrix, textUniforms.u_matrix);
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // Рисуем текст.
      gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices);
    });

И вот это

{{{example url="../webgl-text-glyphs-texture-atlas.html" }}}

Это основная техника использования текстуры-атласа глифов. Есть несколько
очевидных вещей для добавления или способов улучшить это.

*   Переиспользовать те же массивы.

    В настоящее время `makeVerticesForString` выделяет новые Float32Arrays каждый раз, когда вызывается.
    Это, вероятно, в конечном итоге вызовет икоту сборки мусора. Переиспользование
    тех же массивов, вероятно, будет лучше. Вы бы увеличили массив, если он недостаточно большой,
    и сохранили бы этот размер вокруг

*   Добавить поддержку возврата каретки

    Проверять на `\n` и переходить на новую строку при генерации вершин. Это сделало бы
    легко создавать абзацы текста.

*   Добавить поддержку всех видов другого форматирования.

    Если вы хотите центрировать текст или выровнять его, вы могли бы добавить все это.

*   Добавить поддержку цветов вершин.

    Тогда вы могли бы окрашивать текст в разные цвета на букву. Конечно, вам пришлось бы
    решить, как указать, когда менять цвета.

*   Рассмотреть генерацию текстуры-атласа глифов во время выполнения, используя 2D canvas

Другая большая проблема, которую я не буду покрывать, заключается в том, что текстуры имеют ограниченный
размер, но шрифты эффективно неограниченны. Если вы хотите поддерживать весь Unicode
так, чтобы вы могли обрабатывать китайский и японский и арабский и все другие языки,
ну, по состоянию на 2015 год в Unicode более 110 000 глифов! Вы не можете поместить все
эти в текстуры. Просто недостаточно места.

Способ, которым ОС и браузеры обрабатывают это, когда они ускорены GPU, заключается в использовании кэша текстуры глифов. Как
выше, они могут помещать текстуры в текстуру-атлас, но они, вероятно, делают область
для каждого глифа фиксированного размера. Они держат наиболее недавно использованные глифы в текстуре.
Если им нужно нарисовать глиф, которого нет в текстуре, они заменяют наименее
недавно использованный новым, который им нужен. Конечно, если этот глиф, который они
собираются заменить, все еще ссылается на квад, который еще не нарисован, то им нужно
рисовать с тем, что у них есть, прежде чем заменять глиф.

Другая вещь, которую вы можете сделать, хотя я не рекомендую это, это объединить эту
технику с [предыдущей техникой](webgl-text-texture.html). Вы можете
рендерить глифы прямо в другую текстуру.

Еще один способ рисовать текст в WebGL - это фактически использовать 3D текст. 'F' во
всех примерах выше - это 3D буква. Вы бы сделали одну для каждой буквы. 3D буквы
распространены для заголовков и логотипов фильмов, но не для многого другого.

Я надеюсь, что это покрыло текст в WebGL. 