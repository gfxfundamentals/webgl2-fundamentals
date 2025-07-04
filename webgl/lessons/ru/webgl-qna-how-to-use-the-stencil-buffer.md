Title: Как использовать stencil buffer
Description: Как использовать stencil buffer
TOC: Как использовать stencil buffer

## Вопрос:

Как я могу использовать stencil buffer для самой простой программы?
Я прочитал много разных тем об этом, но не нашел подробного руководства.
Я хочу вырезать отверстие на каждой стороне созданного тетраэдра.

[![enter image description here][1]][1]

Пожалуйста, объясните мне пошагово, как использовать stencil buffer?

[Ссылка на мою программу][2]


  [1]: https://i.stack.imgur.com/yV9oD.png
  [2]: https://dropfiles.ru/filesgroup/62503e88028a16b1055f78a7e2b70456.html

## Ответ:

Чтобы использовать stencil buffer, вы должны сначала запросить его при создании контекста webgl

    const gl = someCanvasElement.getContext('webgl', {stencil: true});


Затем включите тест трафарета (stencil test)

```  
  gl.enable(gl.STENCIL_TEST);
```

Настройте тест так, чтобы он всегда проходил, и установите опорное значение в 1

```
  gl.stencilFunc(
     gl.ALWAYS,    // тест
     1,            // опорное значение
     0xFF,         // маска
  );
```

И задайте операцию так, чтобы мы устанавливали stencil в опорное значение, когда оба теста (stencil и depth) проходят

```
  gl.stencilOp(
     gl.KEEP,     // что делать, если stencil тест не прошёл
     gl.KEEP,     // что делать, если depth тест не прошёл
     gl.REPLACE,  // что делать, если оба теста прошли
  );
```

Теперь рисуем первый внутренний треугольник

```
... много настроек для одного треугольника ...

gl.drawArrays(...) или gl.drawElements(...)
```

Затем меняем тест так, чтобы он проходил только если stencil равен нулю

```
  gl.stencilFunc(
     gl.EQUAL,     // тест
     0,            // опорное значение
     0xFF,         // маска
  );
  gl.stencilOp(
     gl.KEEP,     // что делать, если stencil тест не прошёл
     gl.KEEP,     // что делать, если depth тест не прошёл
     gl.KEEP,     // что делать, если оба теста прошли
  );

```

и теперь мы можем нарисовать что-то ещё (больший треугольник), и оно будет рисоваться только там, где в stencil buffer стоит 0, то есть везде, кроме области, где был нарисован первый треугольник.

Пример:

{{{example url="../webgl-qna-how-to-use-the-stencil-buffer-example-1.html"}}}



<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/9698958">AnatoliyC</a>
    из
    <a data-href="https://stackoverflow.com/questions/59539788">здесь</a>
  </div>
</div> 