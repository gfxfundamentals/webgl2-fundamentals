Title: Как получить аудио данные в шейдер
Description: Как получить аудио данные в шейдер
TOC: Как получить аудио данные в шейдер

## Вопрос:

Как я могу добавить поддержку аудио визуализации к этому классу, я хотел бы добавить объект Audio() как вход в GLSL фрагментный шейдер. Пример этого https://www.shadertoy.com/view/Mlj3WV. Я знаю, что такие вещи можно делать в Canvas 2d с анализом формы волны, но этот метод opengl намного более плавный.


```
/* Код из https://raw.githubusercontent.com/webciter/GLSLFragmentShader/1.0.0/GLSLFragmentShader.js */

/* функция рендеринга */

/* установить uniform переменные для шейдера */
 gl.uniform1f( currentProgram.uniformsCache[ 'time' ], parameters.time / 1000 );
gl.uniform2f( currentProgram.uniformsCache[ 'mouse' ], parameters.mouseX, parameters.mouseY );

/* я хотел бы что-то вроде этого */
gl.uniform2f( currentProgram.uniformsCache[ 'fft' ], waveformData );


```

Шейдер в примере ShaderToy принимает float как fft, но это просто обновляет всю строку полосок, а не отдельные значения полосок. Я хотел бы манипуляции в реальном времени всех полосок.

Я искал в MDN, но не понимаю, как это включить, я также смотрел исходный код shadertoy.com, но не могу понять, как они достигли этого.

## Ответ:

ShaderToy не предоставляет FFT как float. Он предоставляет данные FFT как текстуру


{{{example url="../webgl-qna-how-to-get-audio-data-into-a-shader-example-1.html"}}}



<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/11527891">David Clews</a>
    из
    <a data-href="https://stackoverflow.com/questions/57125984">здесь</a>
  </div>
</div> 