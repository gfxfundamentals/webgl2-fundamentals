Title: WebGL2 из WebGL1
Description: Как перейти с WebGL1 на WebGL2
TOC: Переход с WebGL1 на WebGL2


WebGL2 **почти** на 100% обратно совместим с WebGL1.
Если вы используете только функции WebGL1, то есть только
2 **основных** различия.

1.  Вы используете `"webgl2"` вместо `"webgl"` при вызове `getContext`.

        var gl = someCanvas.getContext("webgl2");

    Примечание: нет "experimental-webgl2". Производители браузеров собрались
    вместе и решили не продолжать префиксовать вещи, потому что веб-сайты
    становятся зависимыми от префикса.

2.  Многие расширения являются стандартной частью WebGL2 и поэтому недоступны
    как расширения.

    Например, объекты вершинных массивов `OES_vertex_array_object` являются
    стандартной функцией WebGL2. Так, например, в WebGL1 вы бы делали это

        var ext = gl.getExtension("OES_vertex_array_object");
        if (!ext) {
          // сказать пользователю, что у него нет требуемого расширения или обойти это
        } else {
          var someVAO = ext.createVertexArrayOES();
        }

    В WebGL2 вы бы делали это

        var someVAO = gl.createVertexArray();

    Потому что это просто существует.

Тем не менее, чтобы воспользоваться большинством функций WebGL2, вам нужно будет внести
некоторые изменения.

## Переход на GLSL 300 es

Самое большое изменение - вы должны обновить ваши шейдеры до GLSL 3.00 ES. Для этого
первая строка ваших шейдеров должна быть

    #version 300 es

**ПРИМЕЧАНИЕ: ЭТО ДОЛЖНО БЫТЬ ПЕРВОЙ СТРОКОЙ! Никаких комментариев и пустых строк перед ней не допускается.**

Другими словами, это плохо

    // ПЛОХО!!!!                +---Здесь есть новая строка!
    // ПЛОХО!!!!                V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

Это тоже плохо

    <!-- ПЛОХО!!                   V<- здесь есть новая строка
    <script id="vs" type="notjs">
    #version 300 es
    ...
    </script>

Это хорошо

    var vertexShaderSource = `#version 300 es
    ...
    `;

Это тоже хорошо

    <script id="vs" type="notjs">#version 300 es
    ...
    </script>

Или вы могли бы сделать ваши функции компиляции шейдеров удалять
первые пустые строки.

### Изменения в GLSL 300 es по сравнению с GLSL 100

Есть несколько изменений, которые вам нужно будет внести в ваши шейдеры
помимо добавления строки версии выше.

#### `attribute` -> `in`

В GLSL 100 у вас могло быть

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec3 a_normal;

В GLSL 300 es это становится

    in vec4 a_position;
    in vec2 a_texcoord;
    in vec3 a_normal;

#### `varying` в `in` / `out`

В GLSL 100 вы могли объявлять varying в обоих вершинном
и фрагментном шейдерах так

    varying vec2 v_texcoord;
    varying vec3 v_normal;

В GLSL 300 es в вершинном шейдере varying становятся

    out vec2 v_texcoord;
    out vec3 v_normal;

А в фрагментном шейдере они становятся

    in vec2 v_texcoord;
    in vec3 v_normal;

#### Больше нет `gl_FragColor`

В GLSL 100 ваш фрагментный шейдер устанавливал специальную
переменную `gl_FragColor` для установки выхода шейдера.

    gl_FragColor = vec4(1, 0, 0, 1);  // красный

В GLSL 300 es вы объявляете свою собственную выходную переменную и
затем устанавливаете её.

    out vec4 myOutputColor;

    void main() {
       myOutputColor = vec4(1, 0, 0, 1);  // красный
    }

Примечание: Вы можете выбрать любое имя, которое хотите, но имена **не могут** начинаться с
`gl_`, поэтому вы не можете просто сделать `out vec4 gl_FragColor`.

#### `texture2D` -> `texture` и т.д.

В GLSL 100 вы получали цвет из текстуры так

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture2D(u_some2DTexture, ...);
    vec4 color2 = textureCube(u_someCubeTexture, ...);

В GLSL 300 es функции текстур автоматически знают
что делать на основе типа сэмплера. Так что теперь это просто
`texture`

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture(u_some2DTexture, ...);
    vec4 color2 = texture(u_someCubeTexture, ...);

## Функции, которые вы можете принимать как должное

В WebGL1 многие функции были опциональными расширениями. В WebGL2
все следующее являются стандартными функциями:

* Текстуры глубины ([WEBGL_depth_texture](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/))
* Текстуры с плавающей точкой ([OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/)/[OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/))
* Текстуры с половинной плавающей точкой ([OES_texture_half_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/)/[OES_texture_half_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float_linear/))
* Объекты вершинных массивов ([OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/))
* Стандартные производные ([OES_standard_derivatives](https://www.khronos.org/registry/webgl/extensions/OES_standard_derivatives/))
* Инстансированное рисование ([ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/))
* UNSIGNED_INT индексы ([OES_element_index_uint](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/))
* Установка `gl_FragDepth` ([EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/))
* Уравнение смешивания MIN/MAX ([EXT_blend_minmax](https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/))
* Прямой доступ к LOD текстуры ([EXT_shader_texture_lod](https://www.khronos.org/registry/webgl/extensions/EXT_shader_texture_lod/))
* Множественные буферы рисования ([WEBGL_draw_buffers](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/))
* Поддержка sRGB для текстур и объектов framebuffer ([EXT_sRGB](https://www.khronos.org/registry/webgl/extensions/EXT_sRGB/))
* Любой уровень текстуры может быть прикреплен к объекту framebuffer ([OES_fbo_render_mipmap](https://www.khronos.org/registry/webgl/extensions/OES_fbo_render_mipmap/))
* Доступ к текстурам в вершинных шейдерах

## Поддержка текстур не кратных степени 2

В WebGL1 текстуры, которые не были кратны степени 2, не могли иметь мипмапы.
В WebGL2 это ограничение снято. Текстуры не кратные степени 2 работают точно
так же, как текстуры кратные степени 2.

## Прикрепления framebuffer с плавающей точкой

В WebGL1 для проверки поддержки рендеринга в текстуру с плавающей точкой
вы бы сначала проверили и включили расширение `OES_texture_float`, затем
создали текстуру с плавающей точкой, прикрепили её к framebuffer и вызвали
`gl.checkFramebufferStatus`, чтобы увидеть, возвращает ли он `gl.FRAMEBUFFER_COMPLETE`.

В WebGL2 вам нужно проверить и включить `EXT_color_buffer_float`, иначе
`gl.checkFramebufferStatus` никогда не вернет `gl.FRAMEBUFFER_COMPLETE` для
текстуры с плавающей точкой.

Обратите внимание, что это также верно для прикреплений framebuffer `HALF_FLOAT`.

> Если вам любопытно, это была *ошибка* в спецификации WebGL1. Что произошло, так это то, что WebGL1 