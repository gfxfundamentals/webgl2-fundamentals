Title: Ошибка invalid type при вызове readPixels
Description: Ошибка invalid type при вызове readPixels
TOC: Ошибка invalid type при вызове readPixels

## Вопрос:

    context.readPixels(0, 0, context.drawingBufferWidth, context.drawingBufferHeight, context.RGBA, context.FLOAT, pixels);

Вот этот код. В консоли появляется ошибка:
**WebGL: INVALID_ENUM: readPixels: invalid type**

Но вот так всё работает нормально:

    context.readPixels(0, 0, context.drawingBufferWidth, context.drawingBufferHeight, context.RGBA, context.UNSIGNED_BYTE, pixels);

Float или int вроде как должны поддерживаться, но работает только unsigned_byte.
В интернете нет ресурсов, как правильно применить тип, который, кажется, должен работать.
Везде разные примеры.

## Ответ:

FLOAT не гарантирован к поддержке. Единственная комбинация формат/тип, которая гарантированно поддерживается — RGBA/UNSIGNED_BYTE. [См. спецификацию, раздел 4.3.1](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf)

Кроме этого, одна другая **зависящая от реализации** комбинация формат/тип может поддерживаться в зависимости от того, что вы читаете. Её можно узнать так:

```
const altFormat = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const altType = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

{{{example url="../webgl-qna-i-get-invalid-type-error-when-calling-readpixels-example-1.html"}}}

Код выше создаёт текстуру RGBA/FLOAT, прикрепляет её к framebuffer, а затем проверяет альтернативную комбинацию формат/тип для чтения. В Chrome это RGBA/UNSIGNED_BYTE, в Firefox — RGBA/FLOAT. Оба варианта валидны, так как альтернативная комбинация **зависит от реализации**.



<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 4.0 у
    <a data-href="https://stackoverflow.com/users/6704900">Tony Arntsen</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/61984296">stackoverflow</a>
  </div>
</div> 