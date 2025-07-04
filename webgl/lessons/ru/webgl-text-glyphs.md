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
} 