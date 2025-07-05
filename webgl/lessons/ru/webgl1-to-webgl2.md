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
> был выпущен и `OES_texture_float` был добавлен, и просто предполагалось, что правильный
> способ использования его для рендеринга заключался в создании текстуры, прикреплении её к framebuffer
> и проверке её статуса. Позже кто-то указал, что согласно спецификации этого было
> недостаточно, потому что спецификация говорит, что цвета, записанные во фрагментном шейдере, всегда
> ограничиваются от 0 до 1. `EXT_color_buffer_float` убирает это ограничение зажима,
> но поскольку WebGL уже был выпущен около года, это сломало бы многие веб-сайты, если бы
> ограничение было применено. Для WebGL2 они смогли исправить это, и теперь вы должны включить
> `EXT_color_buffer_float`, чтобы использовать текстуры с плавающей точкой как прикрепления framebuffer.
>
> ПРИМЕЧАНИЕ: Насколько мне известно, по состоянию на март 2017 года очень немногие мобильные устройства
> поддерживают рендеринг в текстуры с плавающей точкой.

## Объекты вершинных массивов

Из всех функций выше та функция, которую я лично считаю, что вы должны
всегда ВСЕГДА использовать - это объекты вершинных массивов. Все остальное действительно
зависит от того, что вы пытаетесь сделать, но объекты вершинных массивов в частности
кажутся базовой функцией, которую всегда следует использовать.

В WebGL1 без объектов вершинных массивов все данные об атрибутах
были глобальным состоянием WebGL. Вы можете представить это так

    var glState = {
      attributeState: {
        ELEMENT_ARRAY_BUFFER: null,
        attributes: [
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
        ],
      },
    }

Вызов функций типа `gl.vertexAttribPointer`, `gl.enableVertexAttribArray` и
`gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ??)` влиял на это глобальное состояние.
Перед каждой вещью, которую вы хотели нарисовать, вам нужно было настроить все атрибуты, и если вы
рисовали индексированные данные, вам нужно было установить `ELEMENT_ARRAY_BUFFER`.

С объектами вершинных массивов все это `attributeState` выше становится *Вершинным массивом*.

Другими словами

    var someVAO = gl.createVertexArray();

Создает новый экземпляр вещи выше, называемой `attributeState`.

    gl.bindVertexArray(someVAO);

Это эквивалентно

    glState.attributeState = someVAO;

Что это означает, так это то, что вы должны настроить все ваши атрибуты во время инициализации сейчас.

    // во время инициализации
    for each model / geometry / ...
      var vao = gl.createVertexArray()
      gl.bindVertexArray(vao);
      for each attribute
        gl.enableVertexAttribArray(...);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferForAttribute);
        gl.vertexAttribPointer(...);
      if indexed geometry
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);

Затем во время рендеринга для использования конкретной геометрии все, что вам нужно сделать,
это

    gl.bindVertexArray(vaoForGeometry);

В WebGL1 цикл инициализации выше появился бы во время рендеринга.
Это ОГРОМНОЕ ускорение!

Есть несколько предостережений:

1.  расположения атрибутов зависят от программы.

    Если вы собираетесь использовать одну и ту же геометрию с несколькими
    программами, рассмотрите ручное назначение расположений атрибутов.
    В GLSL 300 es вы можете сделать это в шейдере.

    Например:

        layout(location = 0) in vec4 a_position;
        layout(location = 1) in vec2 a_texcoord;
        layout(location = 2) in vec3 a_normal;
        layout(location = 3) in vec4 a_color;

    Устанавливает расположения 4 атрибутов.

    Вы также можете все еще делать это способом WebGL1, вызывая
    `gl.bindAttribLocation` перед вызовом `gl.linkProgram`.

    Например:

        gl.bindAttribLocation(someProgram, 0, "a_position");
        gl.bindAttribLocation(someProgram, 1, "a_texcoord");
        gl.bindAttribLocation(someProgram, 2, "a_normal");
        gl.bindAttribLocation(someProgram, 3, "a_color");

    Это означает, что вы можете заставить их быть совместимыми между несколькими шейдерными
    программами. Если одной программе не нужны все атрибуты,
    атрибуты, которые им нужны, все еще будут назначены на
    те же расположения.

    Если вы не сделаете этого, вам понадобятся разные VAO для
    разных шейдерных программ при использовании одной и той же геометрии ИЛИ
    вам нужно будет просто делать вещь WebGL1 и не использовать
    VAO и всегда настраивать атрибуты во время рендеринга, что медленно.

    ПРИМЕЧАНИЕ: из 2 методов выше я склоняюсь к использованию
    `gl.bindAttribLocation`, потому что легко иметь это в одном
    месте в моем коде, тогда как метод использования `layout(location = ?)` должен
    быть во всех шейдерах, поэтому в интересах D.R.Y., `gl.bindAttribLocation`
    кажется лучше. Может быть, если бы я использовал генератор шейдеров, то разницы бы не было.

2.  Всегда отвязывайте VAO, когда закончили

        gl.bindVertexArray(null);

    Это просто из моего собственного опыта. Если вы посмотрите выше,
    состояние `ELEMENT_ARRAY_BUFFER` является частью вершинного массива.

    Итак, я столкнулся с этой проблемой. Я создал некоторую геометрию, затем
    я создал VAO для этой геометрии и настроил атрибуты
    и `ELEMENT_ARRAY_BUFFER`. Затем я создал еще немного
    геометрии. Когда эта геометрия настраивала свои индексы, потому что
    у меня все еще был привязан предыдущий VAO, индексы
    повлияли на привязку `ELEMENT_ARRAY_BUFFER` для предыдущего
    VAO. Мне потребовалось несколько часов для отладки.

    Итак, мое предложение - никогда не оставлять VAO привязанным, если вы закончили
    с ним. Либо немедленно привяжите следующий VAO, который собираетесь
    использовать, либо привяжите `null`, если закончили.

Как упоминалось в начале, многие расширения из WebGL1 являются стандартными функциями
WebGL2, поэтому если вы использовали расширения в WebGL1, вам нужно будет
изменить ваш код, чтобы не использовать их как расширения в WebGL2. См. ниже.

Два, которые требуют особого внимания:

1. `OES_texture_float` и текстуры с плавающей точкой.

    Текстуры с плавающей точкой являются стандартной функцией WebGL2, но:

    * Возможность фильтрации текстур с плавающей точкой все еще является расширением: `OES_texture_float_linear`.

    * Возможность рендеринга в текстуру с плавающей точкой является расширением: `EXT_color_buffer_float`.

    * Создание текстуры с плавающей точкой отличается. Вы должны использовать один из новых внутренних форматов WebGL2
      как `RGBA32F`, `R32F` и т.д. Это отличается от расширения WebGL1 `OES_texture_float`,
      в котором внутренний формат выводился из `type`, переданного в `texImage2D`.

2. `WEBGL_depth_texture` и текстуры глубины.

    Аналогично предыдущему различию, для создания текстуры глубины в WebGL2 вы должны использовать один из
    внутренних форматов WebGL2: `DEPTH_COMPONENT16`, `DEPTH_COMPONENT24`,
    `DEPTH_COMPONENT32F`, `DEPTH24_STENCIL8` или `DEPTH32F_STENCIL8`, тогда как расширение WebGL1
    `WEBGL_depth_texture` использовало `DEPTH_COMPONENT` и `DEPTH_STENCIL_COMPONENT`.

Это мой личный короткий список вещей, о которых нужно знать при переходе
с WebGL1 на WebGL2. [Есть еще больше вещей, которые вы можете делать в WebGL2](webgl2-whats-new.html).

<div class="webgl_bottombar">
<h3>Заставляем расширения WebGL1 выглядеть как WebGL2</h3>
<p>Функции, которые были в расширениях в WebGL1, теперь находятся в основном
контексте в WebGL2. Например, в WebGL1</p>
<pre class="prettyprint">
var ext = gl.getExtension("OES_vertex_array_object");
if (!ext) {
  // сказать пользователю, что у него нет требуемого расширения или обойти это
} else {
  var someVAO = ext.createVertexArrayOES();
}
</pre>
<p>
против в webgl2
</p>
<pre class="prettyprint">
var someVAO = gl.createVertexArray();
</pre>
<p>Как вы можете видеть, если вы хотите, чтобы ваш код работал как в WebGL1, так и в WebGL2, то
это может представлять некоторые проблемы.</p>
<p>Одним из обходных путей было бы копирование расширений WebGL1 в контекст WebGL во время инициализации.
Таким образом, остальная часть вашего кода может остаться той же. Пример:</p>
<pre class="prettyprint">{{#escapehtml}}
const gl = someCanvas.getContext("webgl");
const haveVAOs = getAndApplyExtension(gl, "OES_vertex_array_object");

function getAndApplyExtension(gl, name) {
  const ext = gl.getExtension(name);
  if (!ext) {
    return null;
  }
  const fnSuffix = name.split("_")[0];
  const enumSuffix = '_' + fnSuffix;
  for (const key in ext) {
    const value = ext[key];
    const isFunc = typeof (value) === 'function';
    const suffix = isFunc ? fnSuffix : enumSuffix;
    let name = key;
    // примеры, где это не так, это WEBGL_compressed_texture_s3tc
    // и WEBGL_compressed_texture_pvrtc
    if (key.endsWith(suffix)) {
      name = key.substring(0, key.length - suffix.length);
    }
    if (gl[name] !== undefined) {
      if (!isFunc && gl[name] !== value) {
        console.warn("conflict:", name, gl[name], value, key);
      }
    } else {
      if (isFunc) {
        gl[name] = function(origFn) {
          return function() {
            return origFn.apply(ext, arguments);
          };
        }(value);
      } else {
        gl[name] = value;
      }
    }
  }
  return ext;
}
{{/escapehtml}}</pre>
<p>Теперь ваш код может в основном просто работать одинаково на обоих. Пример:</p>
<pre class="prettyprint">{{#escapehtml}}
if (haveVAOs) {
  var someVAO = gl.createVertexArray();
  ...
} else {
  ... делать что-то для отсутствия VAO.
}
{{/escapehtml}}</pre>
<p>Альтернативой было бы делать что-то вроде этого</p>
<pre class="prettyprint">{{#escapehtml}}
if (haveVAOs) {
  if (isWebGL2)
     someVAO = gl.createVertexArray();
  } else {
     someVAO = vaoExt.createVertexArrayOES();
  }
  ...
} else {
  ... делать что-то для отсутствия VAO.
}
{{/escapehtml}}</pre>
<p>Примечание: В случае объектов вершинных массивов в частности я предлагаю вам <a href="https://github.com/greggman/oes-vertex-array-object-polyfill">использовать полифилл</a>
чтобы они были везде. VAO доступны на большинстве систем. На тех немногих системах
где они недоступны, полифилл обработает это за вас, и ваш код
может остаться простым.</p>
</div> 