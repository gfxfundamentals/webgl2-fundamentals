Title: Как поддерживать и WebGL, и WebGL2
Description: Как поддерживать и WebGL, и WebGL2
TOC: Как поддерживать и WebGL, и WebGL2

## Вопрос:

У меня есть библиотека, которая использует WebGL1 для рендеринга.
Она активно использует float-текстуры и instanced rendering.

Сейчас поддержка WebGL1 довольно странная: некоторые устройства поддерживают, например, WebGL2 (где эти расширения встроены), но не поддерживают WebGL1, или поддерживают, но без нужных расширений.

В то же время поддержка WebGL2 не идеальна. Возможно, когда-нибудь будет, но пока нет.

Я начал думать, что потребуется для поддержки обеих версий.

Для шейдеров, думаю, можно обойтись `#define`-ами. Например, `#define texture2D texture` и подобные вещи.

С расширениями сложнее, так как объекты расширений больше не существуют.
В качестве эксперимента я пробовал копировать методы расширения в сам контекст, например: `gl.drawArraysInstanced = (...args) => ext.drawArraysInstancedANGLE(...args)`.

С текстурами менять почти ничего не нужно, разве что добавить что-то вроде `gl.RGBA8 = gl.RGBA` при запуске в WebGL1, чтобы код "просто работал" и в WebGL2.

Вопрос: кто-нибудь пробовал так делать?
Я опасаюсь, что это повредит производительности, особенно из-за лишней обёртки для вызова функций.
Это также усложнит чтение кода, если предполагать, что он может работать в WebGL1. Ведь в WebGL1 нет `drawArraysInstanced` или `RGBA8`. Это также мешает типизации в Typescript и другим мелочам.

Второй вариант — делать ветвления по всему коду. Две версии шейдеров (или `#ifdef`-трюки), много ветвлений для каждого места, где нужны форматы текстур, и для каждого места, где используется instancing.
Вот так по всему коду — не очень красиво:

    if (version === 1) {
      instancedArrays.vertexAttribDivisorANGLE(m0, 1);
      instancedArrays.vertexAttribDivisorANGLE(m1, 1);
      instancedArrays.vertexAttribDivisorANGLE(m2, 1);
      instancedArrays.vertexAttribDivisorANGLE(m3, 1);
    } else {
      gl.vertexAttribDivisor(m0, 1);
      gl.vertexAttribDivisor(m1, 1);
      gl.vertexAttribDivisor(m2, 1);
      gl.vertexAttribDivisor(m3, 1);
    }

Может, есть и третий способ, о котором я не подумал.

Есть рекомендации?

## Ответ:

К сожалению, большинство ответов тут будут субъективными.

Первый вопрос — зачем поддерживать оба? Если ваша идея работает в WebGL1 — просто используйте WebGL1. Если вам обязательно нужны фичи WebGL2 — используйте WebGL2 и смиритесь, что на старых устройствах не будет поддержки.

Если вы всё же хотите поддерживать оба, [twgl](https://twgljs.org) пытается упростить это, [предлагая функцию, которая копирует все расширения WebGL1 в их WebGL2 API-позиции](http://twgljs.org/docs/module-twgl.html#.addExtensionsToContext). Как вы и упомянули, вместо

    ext = gl.getExtension('ANGLE_instanced_arrays');
    ext.drawArraysInstancedANGLE(...)

Вы делаете

    twgl.addExtensionsToContext(gl);
    gl.drawArraysInstanced(...);

Я не думаю, что будет заметная разница в производительности. Эти функции вызываются всего несколько сотен раз за кадр, и обёртка не станет узким местом.

Но суть не в том, чтобы поддерживать WebGL1 и WebGL2 одновременно. Скорее, чтобы писать код одинаково для обоих API.

Тем не менее, есть реальные различия между API. Например, чтобы использовать FLOAT RGBA текстуру в WebGL1:

    gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, ...)

В WebGL2:

    gl.texImage2D(target, level, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, ...)

WebGL2 выдаст ошибку, если вызвать его так же, как WebGL1. [Есть и другие отличия](https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html).

Впрочем, вот такой вызов будет работать и в WebGL1, и в WebGL2. Спецификация прямо говорит, что такая комбинация даёт RGBA8 в WebGL2.

Обратите внимание, что ваш пример с RGBA8 не совсем верен.

    gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, ...)

Главное отличие — нет смысла использовать WebGL2, если вам хватает WebGL1. Или наоборот: если вам нужен WebGL2, то откатиться на WebGL1 будет сложно.

Вы упомянули define-ы для шейдеров, но что делать с фичами WebGL2, которых нет в WebGL1? Например, `textureFetch`, оператор `%`, integer attributes и т.д. Если они нужны — придётся писать отдельный шейдер только для WebGL2. Если не нужны — зачем тогда WebGL2?

Конечно, если хочется, можно сделать более продвинутый рендерер для WebGL2 и попроще для WebGL1.

TL;DR: На мой взгляд, выберите что-то одно.

<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/2503048">user2503048</a>
    из
    <a data-href="https://stackoverflow.com/questions/59490319">здесь</a>
  </div>
</div> 