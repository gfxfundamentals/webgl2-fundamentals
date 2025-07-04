Title: Как сделать инструмент размазывающей кисти
Description: Как сделать инструмент размазывающей кисти
TOC: Как сделать инструмент размазывающей кисти

## Вопрос:

Мне нужна идея, как я могу сделать кисть, которая может размазывать цвет.

Пример на картинке: правая сторона - рисование базовой кистью с двумя разными цветами, слева также рисование, но дополнительно используется инструмент размазывания, **результат должен быть чем-то вроде левой стороны**

![enter image description here][1]

Мне нужен совет, как я могу попробовать это сделать

  [1]: http://i.stack.imgur.com/oyaBs.png

## Ответ:

Вот одна попытка

1. При mousedown захватить копию области под мышью в отдельный canvas

2. При mousemove рисовать эту копию по одному пикселю за раз от предыдущей позиции мыши к текущей позиции мыши с 50% прозрачностью, захватывая новую копию после каждого движения.

В псевдокоде

```
on mouse down
   grab copy of canvas at mouse position
   prevMousePos = currentMousePos

on mouse move
  for (pos = prevMousePos to currentMousePos step 1 pixel) 
    draw copy at pos with 50% alpha
    grab new copy of canvas at pos
  prevMousePos = currentMousePos
```

Кисть размывается путем рисования радиального градиента от rgba(0,0,0,0) до rgba(0,0,0,1) над ней, используя `globalCompositeOperation = 'destination-out'`.  


{{{example url="../webgl-qna-how-to-make-a-smudge-brush-tool-example-1.html"}}}




<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 3.0 от
    <a data-href="https://stackoverflow.com/users/4270436">Your choice</a>
    из
    <a data-href="https://stackoverflow.com/questions/28197378">здесь</a>
  </div>
</div> 