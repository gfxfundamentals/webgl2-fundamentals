Title: Как использовать прозрачность 2D-спрайта как маску
Description: Как использовать прозрачность 2D-спрайта как маску
TOC: Как использовать прозрачность 2D-спрайта как маску

## Вопрос:

 ```javascript
if (statuseffect) {
            // Очистка stencil buffer
            gl.clearStencil(0);
            gl.clear(gl.STENCIL_BUFFER_BIT);
        

            gl.stencilFunc(gl.ALWAYS, 1, 1);
            gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
        

             gl.colorMask(false, false, false, false); 
             
            gl.enable(gl.STENCIL_TEST);

            // Рисуем маску через gl.drawArrays L111
            drawImage(statuseffectmask.texture, lerp(-725, 675, this.Transtion_Value), 280, 128 * 4, 32 * 4)
        
            // Говорим stencil теперь рисовать/оставлять только пиксели, равные 1 — что мы установили ранее
            gl.stencilFunc(gl.EQUAL, 1, 1);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
            
            // возвращаем обратно цветовой буфер
            gl.colorMask(true, true, true, true);
       
        
            drawImage(statuseffect.texture, lerp(-725, 675, this.Transtion_Value), 280, 128 * 4, 32 * 4)

   
            gl.disable(gl.STENCIL_TEST);
         }


```
Я пытаюсь добиться такого эффекта [![enter image description here][1]][1]
Где берётся прозрачность спрайта, и затем другой спрайт рисуется только в областях, где нет прозрачности. Спасибо.

[1]: https://i.stack.imgur.com/ESdGp.png

## Ответ:

Не совсем понятно, зачем вам использовать stencil для этого. Обычно вы бы просто [настроили смешивание (blending) и использовали прозрачность для смешивания](https://webglfundamentals.org/webgl/lessons/webgl-text-texture.html).

Если вы действительно хотите использовать stencil, вам нужно сделать шейдер, который вызывает `discard`, если прозрачность (alpha) меньше определённого значения, чтобы stencil устанавливался только там, где спрайт не прозрачный:

```
precision highp float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform float u_alphaTest;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);
  if (color.a < u_alphaTest) {
    discard;  // не рисовать этот пиксель
  }
  gl_FragColor = color;
}
```

Но дело в том, что это уже нарисует текстуру с прозрачностью и без использования stencil.

{{{example url="../webgl-qna-how-to-use-a-2d-sprite-s-transparency-as-a-mask-example-1.html"}}}

Если же вы действительно хотите использовать stencil, теперь, когда код отбрасывает некоторые пиксели, всё должно работать, и ваш код был верным. Обратите внимание, что код ниже не очищает stencil, потому что он по умолчанию очищается каждый кадр

{{{example url="../webgl-qna-how-to-use-a-2d-sprite-s-transparency-as-a-mask-example-2.html"}}}

Также отмечу, что это, вероятно, лучше делать с помощью альфа-смешивания, передавая обе текстуры в один шейдер и передавая ещё одну матрицу или другие uniforms, чтобы применить альфу одной текстуры к другой. Это будет более гибко, так как можно смешивать по всем значениям от 0 до 1, тогда как с помощью stencil можно только маскировать 0 или 1.

Я не говорю "не используйте stencil", а лишь отмечаю, что бывают ситуации, когда это лучший вариант, и когда — нет. Только вы можете решить, какой способ лучше для вашей задачи.

<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/10191806">Evan Wrynn</a>
    из
    <a data-href="https://stackoverflow.com/questions/60622267">здесь</a>
  </div>
</div> 