Title: Как оптимизировать рендеринг UI
Description: Как оптимизировать рендеринг UI
TOC: Как оптимизировать рендеринг UI

## Вопрос:

Я только начинаю с WebGL. Я следовал простому руководству для начинающих на YouTube. Теперь я пытаюсь создать простую 2D игру.

В этой игре я хочу рендерить простой инвентарь с изображениями. Когда я это делаю, мой FPS падает до 2 после 10 секунд. Если я убираю код для рендеринга инвентаря, он остаётся на 60.

Я знаю, что моя проблема в строке 82 в `game/js/engine/inventory/inventory.js`. Там я рендерю 35 изображений с классом sprite, который я сделал, смотря руководство. Я думаю, что поскольку я смотрел простое руководство, код, который рендерит изображение, не оптимизирован и, вероятно, не лучший способ это делать. Класс sprite находится в `game/js/engine/material.js:127`. В классе sprite я настраиваю простые переменные, которые можно передать в мой вершинный и фрагментный шейдер.

## Настройка Sprite ##
В методе setup я настраиваю все параметры для моего изображения.
```
gl.useProgram(this.material.program);

this.gl_tex = gl.createTexture();

gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
gl.bindTexture(gl.TEXTURE_2D, null);

this.uv_x = this.size.x / this.image.width;
this.uv_y = this.size.y / this.image.height;

this.tex_buff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buff);
gl.bufferData(gl.ARRAY_BUFFER, Sprite.createRenderRectArray(0, 0, this.uv_x, this.uv_y), gl.STATIC_DRAW);

this.geo_buff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, this.geo_buff);
gl.bufferData(gl.ARRAY_BUFFER, Sprite.createRectArray(0, 0, this.size.x, this.size.y), gl.STATIC_DRAW);

gl.useProgram(null);
```

## Рендеринг Sprite ##
В методе render я сначала привязываю текстуру. Затем привязываю буфер текстурных координат, геометрический буфер и некоторые смещения для моего мира. Наконец, рисую массивы.
```
let frame_x = Math.floor(frames.x) * this.uv_x;
let frame_y = Math.floor(frames.y) * this.uv_y;

let oMat = new M3x3().transition(position.x, position.y);
gl.useProgram(this.material.program);

this.material.set("u_color", 1, 1, 1, 1);

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
this.material.set("u_image", 0);

gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buff);
this.material.set("a_texCoord");

gl.bindBuffer(gl.ARRAY_BUFFER, this.geo_buff);
this.material.set("a_position");

this.material.set("u_texeloffset", 0.5 / (this.image.width * scale.x), 0.5 / (this.image.height * scale.y));
this.material.set("u_frame", frame_x, frame_y);
this.material.set("u_world", worldSpaceMatrix.getFloatArray());
this.material.set("u_object", oMat.getFloatArray());

gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
gl.useProgram(null);
```
Github: [https://github.com/DJ1TJOO/2DGame/][1]

У кого-нибудь есть идея, как я могу исправить/оптимизировать это?
Или может быть есть лучший способ рендерить инвентарь?

Если вы найдёте любой другой способ улучшить мой WebGL или JavaScript, пожалуйста, скажите.

[1]: https://github.com/DJ1TJOO/2DGame/

## Ответ:

> есть лучший способ рендерить инвентарь?

Есть несколько способов оптимизации, которые приходят в голову.

1. Может быть быстрее просто использовать HTML для вашего инвентаря

   Серьёзно: Вы также получаете простое международное рендеринг шрифтов, стили,
   отзывчивость с CSS и т.д... Много игр делают это.

2. Обычно быстрее использовать texture atlas (одну текстуру с множеством разных изображений), затем генерировать вершины в vertex buffer для всех частей вашего инвентаря. Затем рисовать всё одним вызовом draw. Так работает, например, [Dear ImGUI](https://github.com/ocornut/imgui), чтобы делать [все эти удивительные GUI](https://github.com/ocornut/imgui/issues/3075). Он сам ничего не рисует, он просто генерирует vertex buffer с позициями и текстурными координатами для texture atlas.

3. Делайте #2, но вместо генерации всего vertex buffer каждый кадр просто обновляйте части, которые изменяются.

   Так, например, допустим ваш инвентарь показывает

        [gold  ] 123
        [silver] 54
        [copper] 2394

   Допустим, вы всегда рисуете `[gold  ]`, `[silver]` и `[copper]`, но только числа изменяются. Вы могли бы генерировать vertex buffers, которые содержат все позиции для каждой буквы как sprite, и затем сказать 6 placeholder'ов символов для каждого значения. Вам нужно обновлять только числа, когда они изменяются, помня, где они находятся в vertex buffers. Для любой цифры, которую вы не хотите рисовать, вы можете просто переместить её вершины за экран.

4. Рисуйте инвентарь в текстуру (или части его). Затем рисуйте текстуру на экране. Обновляйте только части текстуры, которые изменяются.

   Это в основном [то, что делает сам браузер](https://www.html5rocks.com/en/tutorials/speed/layers/). На основе различных настроек CSS части страницы разделяются на текстуры. Когда какой-то HTML или CSS изменяется, только те текстуры, в которых что-то изменилось, перерисовываются, а затем все текстуры рисуются для рекомпозиции страницы.


<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/12973068">DJ1TJOO</a>
    из
    <a data-href="https://stackoverflow.com/questions/62330231">здесь</a>
  </div>
</div> 