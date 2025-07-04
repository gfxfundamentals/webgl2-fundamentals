Title: Как предотвратить просачивание текстур с атласом текстур
Description: Как предотвратить просачивание текстур с атласом текстур
TOC: Как предотвратить просачивание текстур с атласом текстур

## Вопрос:

Я применил два необходимых шага, указанных в этом ответе https://gamedev.stackexchange.com/questions/46963/how-to-avoid-texture-bleeding-in-a-texture-atlas, но я всё ещё получаю просачивание текстур.

У меня есть атлас, который заполнен сплошными цветами на границах: `x y w h: 0 0 32 32, 0 32 32 32, 0 64 32 32, 0 32 * 3 32 32`

Я хочу отображать каждый из этих кадров, используя WebGL без просачивания текстур, только сплошные цвета как есть.

Я отключил мипмаппинг:

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

Я применил коррекцию полпикселя:

      const uvs = (src, frame) => {
        const tw = src.width,
              th = src.height;
    
        const getTexelCoords = (x, y) => {
          return [(x + 0.5) / tw, (y + 0.5) / th];
        };
    
        let frameLeft = frame[0],
            frameRight = frame[0] + frame[2],
            frameTop = frame[1],
            frameBottom = frame[1] + frame[3];
    
        let p0 = getTexelCoords(frameLeft, frameTop),
            p1 = getTexelCoords(frameRight, frameTop),
            p2 = getTexelCoords(frameRight, frameBottom),
            p3 = getTexelCoords(frameLeft, frameBottom);
    
        return [
          p0[0], p0[1],
          p1[0], p1[1],
          p3[0], p3[1],
          p2[0], p2[1]
        ];
      };

Но я всё ещё получаю просачивание текстур. Сначала я попробовал использовать pixi.js, и я тоже получил просачивание текстур, затем я попробовал использовать vanilla js.

Я исправил это, изменив эти строки:

        let frameLeft = frame[0],
            frameRight = frame[0] + frame[2] - 1,
            frameTop = frame[1],
            frameBottom = frame[1] + frame[3] - 1;

Как вы можете видеть, я вычитаю 1 из правого и нижнего краёв. Ранее эти индексы были 32, что означает начало другого кадра, это должно быть 31 вместо этого. Я не знаю, является ли это правильным решением.

## Ответ:

Ваше решение правильно.

Представьте, что у нас есть текстура 4x2 с двумя спрайтами 2x2 пикселя

```
+-------+-------+-------+-------+
|       |       |       |       |
|   E   |   F   |   G   |   H   |
|       |       |       |       |
+-------+-------+-------+-------+
|       |       |       |       |
|   A   |   B   |   C   |   D   |
|       |       |       |       |
+-------+-------+-------+-------+
```

Буквы представляют центры пикселей в текстурах.

```
(pixelCoord + 0.5) / textureDimensions
```

Возьмите спрайт 2x2 в A, B, E, F. Если ваши текстурные координаты идут где-либо между B и C, то вы получите некоторую смесь C, если у вас включена фильтрация текстур.

Изначально вы вычисляли координаты A, A + width, где width = 2. Это привело вас от A до C. Добавив -1, вы получаете только от A до B.

К сожалению, у вас есть новая проблема, которая заключается в том, что вы отображаете только половину A и B. Вы можете решить это, добавив отступы к спрайтам. Например, сделайте его 6x2 с пикселем между ними, который повторяет края спрайта

```
+-------+-------+-------+-------+-------+-------+
|       |       |       |       |       |       |
|   E   |   F   |   Fr  |   Gr  |   G   |   H   |
|       |       |       |       |       |       |
+-------+-------+-------+-------+-------+-------+
|       |       |       |       |       |       |
|   A   |   B   |   Br  |   Cr  |   C   |   D   |
|       |       |       |       |       |       |
+-------+-------+-------+-------+-------+-------+
```

Выше Br - это B повторённый, Cr - это C повторённый. Установка repeat как `gl.CLAMP_TO_EDGE` повторит A и D для вас. Теперь вы можете использовать края.

Координаты спрайта CDGH:

    p0 = 4 / texWidth
    p1 = 0 / texHeigth
    p2 = (4 + spriteWidth) / texWidth
    p3 = (0 + spriteHeigth) / texHeight

Лучший способ увидеть разницу - нарисовать 2 спрайта крупно, используя обе техники, без отступов и с отступами.

{{{example url="../webgl-qna-how-to-prevent-texture-bleeding-with-a-texture-atlas-example-1.html"}}}



<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/3994249">eguneys</a>
    из
    <a data-href="https://stackoverflow.com/questions/60702397">здесь</a>
  </div>
</div> 