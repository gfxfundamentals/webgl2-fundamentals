Title: Как получить эффект пикселизации в WebGL?
Description: Как получить эффект пикселизации в WebGL?
TOC: Как получить эффект пикселизации в WebGL?

## Вопрос:

Я хочу симулировать эффект старого ПК с низким разрешением, как Atari или Commodore, в WebGL. Есть ли способ нарисовать изображение, а затем как-то сделать пиксели больше?

Я новичок в WebGL, так как мне начать делать этот эффект?

Я нашёл [это](https://threejs.org/examples/#webgl_postprocessing_nodes), там есть эффект мозаики, но он использует three.js, а я хочу сделать это без фреймворков.

## Ответ:

Есть много способов сделать это. Самый простой — просто рендерить в низкоразрешающую текстуру, прикрепив её к framebuffer, а затем рендерить эту текстуру на canvas с фильтрацией текстуры, установленной на `NEAREST`.

Вот пример. Он использует [TWGL](http://twgljs.org), который не является фреймворком, просто помощник, чтобы сделать WebGL менее многословным. Смотрите комментарии (и [документацию](http://twgljs.org/docs/)), если хотите перевести это в многословный сырой WebGL.

Если вы новичок в WebGL, [я бы предложил начать отсюда](http://webglfundamentals.org):

{{{example url="../webgl-qna-how-to-get-pixelize-effect-in-webgl--example-1.html"}}}

Также распространено рендерить в текстуру (как выше), но текстуру более высокого разрешения, а затем фильтровать её вниз, используя шейдеры, мипы и/или линейную фильтрацию. Преимущество в том, что вы получите больше сглаживания:

{{{example url="../webgl-qna-how-to-get-pixelize-effect-in-webgl--example-2.html"}}}

---

# обновление

В 2020 году, возможно, самое простое, что вы можете сделать — просто сделать canvas с разрешением, которое вы хотите, например 32x32, и установить его CSS размер больше, а затем использовать настройку CSS `image-rendering: pixelated`, чтобы сказать браузеру не сглаживать его при масштабировании изображения:

```
<canvas 
    width="32"
    height="32"
    style="
        width: 128px;
        height: 128px;
        image-rendering: crisp-edges; /* для firefox */
        image-rendering: pixelated;   /* для всего остального */
    "></canvas>
```

{{{example url="../webgl-qna-how-to-get-pixelize-effect-in-webgl--example-3.html"}}}



<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 3.0 у
    <a data-href="https://stackoverflow.com/users/5080787">Maciej Kozieja</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/43878959">stackoverflow</a>
  </div>
</div> 