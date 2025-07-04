Title: Как получить автодополнение кода для WebGL в Visual Studio Code
Description: Как получить автодополнение кода для WebGL в Visual Studio Code
TOC: Как получить автодополнение кода для WebGL в Visual Studio Code

## Вопрос:

У меня есть школьный проект, и мне нужно использовать WEBGL. Но довольно сложно писать весь код без автодополнения. Я не нашел подходящего расширения. У вас есть идеи?

## Ответ:

Для того чтобы Visual Studio Code давал вам автодополнение, ему нужно знать типы переменных.

Так, например, если у вас есть это

```
const gl = init();
```

VSCode не имеет представления о том, какой тип у переменной `gl`, поэтому он не может автодополнять. Но вы можете сказать ему тип, добавив JSDOC стиль комментария выше, как это

```
/** @type {WebGLRenderingContext} */
const gl = init();
```

Теперь он будет автодополнять

[![enter image description here][1]][1]


То же самое верно для HTML элементов. Если вы делаете это

```
const canvas = document.querySelector('#mycanvas');
```

VSCode не имеет представления о том, какой это тип элемента, но вы можете сказать ему

```
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#mycanvas');
```

Теперь он будет знать, что это `HTMLCanvasElement`

[![enter image description here][2]][2]

И, поскольку он знает, что это `HTMLCanvasElement`, он знает, что `.getContext('webgl')` возвращает `WebGLRenderingContext`, поэтому он автоматически предложит автодополнение для контекста тоже

[![enter image description here][3]][3]

Обратите внимание, что если вы передаете canvas в какую-то функцию, то снова VSCode не имеет представления о том, что возвращает эта функция. Другими словами

```
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#mycanvas');
const gl = someLibraryInitWebGL(canvas);
```

Вы больше не получите автодополнение, поскольку VSCode не имеет представления о том, что возвращает `someLibraryInitWebGL`, поэтому следуйте правилу сверху и скажите ему.

```
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#mycanvas');

/** @type {WebGLRenderingContext} */
const gl = someLibraryInitWebGL(canvas);
```

Вы можете увидеть другие JSDOC аннотации [здесь](https://jsdoc.app/), если хотите документировать свои собственные функции, например, их аргументы и типы возврата.

  [1]: https://i.stack.imgur.com/8mvFM.png
  [2]: https://i.stack.imgur.com/oArWf.png
  [3]: https://i.stack.imgur.com/7zR4q.png

<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/11662503">Nikola Kovač</a>
    из
    <a data-href="https://stackoverflow.com/questions/61387725">здесь</a>
  </div>
</div> 