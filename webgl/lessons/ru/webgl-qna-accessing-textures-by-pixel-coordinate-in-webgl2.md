Title: Доступ к текстурам по координатам пикселей в WebGL2
Description: Доступ к текстурам по координатам пикселей в WebGL2
TOC: Доступ к текстурам по координатам пикселей в WebGL2

## Вопрос:

Из https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html

> WebGL2 добавляет возможность читать текстуру, используя координаты пикселей. Какой способ лучше - решать вам. Я считаю, что более распространено использование координат текстуры, чем координат пикселей.

Нигде больше это не упоминается, кроме как передачи uniform с размерами текстуры в пикселях и вычисления оттуда, есть ли способ получить доступ к этим координатам пикселей без вычислений, как предполагается здесь?



## Ответ:

Вы можете читать отдельные пиксели/тексели из текстуры в WebGL2 с помощью `texelFetch`:

    vec4 color = texelFetch(someUniformSampler, ivec2(pixelX, pixelY), intMipLevel);

Например, вычислить средний цвет текстуры, читая каждый пиксель:

{{{example url="../webgl-qna-accessing-textures-by-pixel-coordinate-in-webgl2-example-1.html"}}}

примечания: поскольку холст RGBA8 может получить только целочисленный результат. Можно изменить на какой-то формат с плавающей точкой, но это усложнит пример, который не о рендеринге, а о `texelFetch`.

Конечно, просто изменив данные с R8 на RGBA8, мы можем делать 4 массива одновременно, если мы чередуем значения:

{{{example url="../webgl-qna-accessing-textures-by-pixel-coordinate-in-webgl2-example-2.html"}}}

Чтобы сделать больше, нужно придумать какой-то способ организовать данные и использовать вход в фрагментный шейдер, чтобы понять, где находятся данные. Например, мы снова чередуем данные, 5 массивов, так что данные идут 0,1,2,3,4,0,1,2,3,4,0,1,2,3,4.

Давайте вернемся к R8 и сделаем 5 отдельных массивов. Нам нужно нарисовать 5 пикселей. Мы можем сказать, какой пиксель рисуется, посмотрев на `gl_FragCoord`. Мы можем использовать это для смещения, какие пиксели мы смотрим, и передать, сколько пропустить.

{{{example url="../webgl-qna-accessing-textures-by-pixel-coordinate-in-webgl2-example-3.html"}}}



<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/3793191">bogersja</a>
    из
    <a data-href="https://stackoverflow.com/questions/54100955">здесь</a>
  </div>
</div> 