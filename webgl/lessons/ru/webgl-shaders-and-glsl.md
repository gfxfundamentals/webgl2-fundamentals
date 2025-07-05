Title: WebGL2 Шейдеры и GLSL
Description: Что такое шейдер и что такое GLSL
TOC: Шейдеры и GLSL


Это продолжение [Основ WebGL](webgl-fundamentals.html).
Если вы не читали о том, как работает WebGL, возможно, вы захотите [сначала прочитать это](webgl-how-it-works.html).

Мы говорили о шейдерах и GLSL, но не давали им никаких конкретных деталей.
Я думал, что это будет понятно на примерах, но давайте попробуем сделать это яснее на всякий случай.

Как упоминалось в [как это работает](webgl-how-it-works.html), WebGL требует 2 шейдера каждый раз, когда вы
что-то рисуете. *Вершинный шейдер* и *фрагментный шейдер*. Каждый шейдер - это *функция*. Вершинный
шейдер и фрагментный шейдер связаны вместе в шейдерную программу (или просто программу). Типичное
WebGL приложение будет иметь много шейдерных программ.

## Вершинный шейдер

Задача вершинного шейдера - генерировать координаты clip space. Он всегда имеет форму

    #version 300 es
    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

Ваш шейдер вызывается один раз для каждой вершины. Каждый раз, когда он вызывается, вы обязаны установить специальную глобальную переменную `gl_Position` в некоторые координаты clip space.

Вершинным шейдерам нужны данные. Они могут получить эти данные 3 способами.

1.  [Атрибуты](#attributes) (данные, извлеченные из буферов)
2.  [Uniforms](#uniforms) (значения, которые остаются одинаковыми для всех вершин одного вызова рисования)
3.  [Текстуры](#textures-in-vertex-shaders) (данные из пикселей/текселей)

### Атрибуты

Самый распространенный способ для вершинного шейдера получить данные - через буферы и *атрибуты*.
[Как это работает](webgl-how-it-works.html) покрывает буферы и
атрибуты. Вы создаете буферы,

    var buf = gl.createBuffer();

помещаете данные в эти буферы

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

Затем, учитывая шейдерную программу, которую вы создали, вы ищете местоположение ее атрибутов,

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

затем говорите WebGL, как извлекать данные из этих буферов и в атрибут

    // включаем получение данных из буфера для этого атрибута
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;
    var normalize = false;  // оставляем значения как есть
    var offset = 0;         // начинаем с начала буфера
    var stride = 0;         // сколько байт переместиться к следующей вершине
                            // 0 = использовать правильный stride для type и numComponents

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

В [Основах WebGL](webgl-fundamentals.html) мы показали, что мы можем не делать математику
в шейдере и просто передавать данные напрямую.

    #version 300 es

    in vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

Если мы поместим вершины clip space в наши буферы, это будет работать.

Атрибуты могут использовать `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, `mat4`,
`int`, `ivec2`, `ivec3`, `ivec4`, `uint`, `uvec2`, `uvec3`, `uvec4` как типы.

### Uniforms

Для вершинного шейдера uniforms - это значения, передаваемые в вершинный шейдер, которые остаются одинаковыми
для всех вершин в вызове рисования. Как очень простой пример, мы могли бы добавить смещение к
вершинному шейдеру выше

    #version 300 es

    in vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

И теперь мы могли бы сместить каждую вершину на определенное количество. Сначала мы бы нашли
местоположение uniform

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

И затем перед рисованием мы бы установили uniform

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // смещаем вправо на половину экрана

Uniforms могут быть многих типов. Для каждого типа вы должны вызвать соответствующую функцию для его установки.

    gl.uniform1f (floatUniformLoc, v);                 // для float
    gl.uniform1fv(floatUniformLoc, [v]);               // для float или массива float
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // для vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // для vec2 или массива vec2
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // для vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // для vec3 или массива vec3
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // для vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // для vec4 или массива vec4

    gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // для mat2 или массива mat2
    gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // для mat3 или массива mat3
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // для mat4 или массива mat4

    gl.uniform1i (intUniformLoc,   v);                 // для int
    gl.uniform1iv(intUniformLoc, [v]);                 // для int или массива int
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // для ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // для ivec2 или массива ivec2
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // для ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // для ivec3 или массива ivec3
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // для ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // для ivec4 или массива ivec4

    gl.uniform1u (intUniformLoc,   v);                 // для uint
    gl.uniform1uv(intUniformLoc, [v]);                 // для uint или массива uint
    gl.uniform2u (ivec2UniformLoc, v0, v1);            // для uvec2
    gl.uniform2uv(ivec2UniformLoc, [v0, v1]);          // для uvec2 или массива uvec2
    gl.uniform3u (ivec3UniformLoc, v0, v1, v2);        // для uvec3
    gl.uniform3uv(ivec3UniformLoc, [v0, v1, v2]);      // для uvec3 или массива uvec3
    gl.uniform4u (ivec4UniformLoc, v0, v1, v2, v4);    // для uvec4
    gl.uniform4uv(ivec4UniformLoc, [v0, v1, v2, v4]);  // для uvec4 или массива uvec4

    // для sampler2D, sampler3D, samplerCube, samplerCubeShadow, sampler2DShadow,
    // sampler2DArray, sampler2DArrayShadow
    gl.uniform1i (samplerUniformLoc,   v);
    gl.uniform1iv(samplerUniformLoc, [v]);

Есть также типы `bool`, `bvec2`, `bvec3`, и `bvec4`. Они используют либо функции `gl.uniform?f?`, `gl.uniform?i?`,
или `gl.uniform?u?`.

Обратите внимание, что для массива вы можете установить все uniforms массива сразу. Например

    // в шейдере
    uniform vec2 u_someVec2[3];

    // в JavaScript во время инициализации
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // во время рендеринга
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // установить весь массив u_someVec2

Но если вы хотите установить отдельные элементы массива, вы должны найти местоположение
каждого элемента отдельно.

    // в JavaScript во время инициализации
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // во время рендеринга
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // установить элемент 0
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // установить элемент 1
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // установить элемент 2

Аналогично, если вы создаете структуру

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

вы должны найти каждое поле отдельно

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### Текстуры в вершинных шейдерах

См. [Текстуры в фрагментных шейдерах](#textures-in-fragment-shaders).

## Фрагментный шейдер

Задача фрагментного шейдера - предоставить цвет для текущего пикселя, который растеризуется.
Он всегда имеет форму

    #version 300 es
    precision highp float;

    out vec4 outColor;  // вы можете выбрать любое имя

    void main() {
       outColor = doMathToMakeAColor;
    } 

Ваш фрагментный шейдер вызывается один раз для каждого пикселя. Каждый раз, когда он вызывается, вы обязаны
установить вашу out переменную в какой-то цвет.

Фрагментным шейдерам нужны данные. Они могут получить данные 3 способами

1.  [Uniforms](#uniforms) (значения, которые остаются одинаковыми для каждого пикселя одного вызова рисования)
2.  [Текстуры](#textures-in-fragment-shaders) (данные из пикселей/текселей)
3.  [Varyings](#varyings) (данные, передаваемые из вершинного шейдера и интерполированные)

### Uniforms в фрагментных шейдерах

См. [Uniforms в вершинных шейдерах](#uniforms).

### Текстуры в фрагментных шейдерах

Чтобы получить значение из текстуры в шейдере, мы создаем uniform `sampler2D` и используем GLSL
функцию `texture` для извлечения значения из неё.

    precision highp float;

    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5);  // получить значение из середины текстуры
       outColor = texture(u_texture, texcoord);
    }

Какие данные выходят из текстуры, [зависит от многих настроек](webgl-3d-textures.html).
Как минимум нам нужно создать и поместить данные в текстуру, например

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var internalFormat = gl.RGBA,
    var width = 2;
    var height = 1;
    var border = 0; // ВСЕГДА ДОЛЖЕН БЫТЬ НУЛЕМ
    var format = gl.RGBA;
    var type = gl.UNSIGNED_BYTE;
    var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D,
                  level,
                  internalFormat,
                  width,
                  height,
                  border,
                  format,
                  type,
                  data);

Установить фильтрацию

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

Затем найти местоположение uniform в шейдерной программе

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

WebGL затем требует, чтобы вы привязали его к текстуре unit

    var unit = 5;  // Выберите какой-то текстуре unit
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

И сказать шейдеру, к какому unit вы привязали текстуру

    gl.uniform1i(someSamplerLoc, unit);

### Varyings

Varying - это способ передать значение из вершинного шейдера в фрагментный шейдер, что мы
покрыли в [как это работает](webgl-how-it-works.html).

Чтобы использовать varying, нам нужно объявить соответствующие varyings в вершинном и фрагментном шейдере.
Мы устанавливаем *out* varying в вершинном шейдере с некоторым значением для каждой вершины. Когда WebGL рисует пиксели,
он будет опционально интерполировать между этими значениями и передавать их соответствующему *in* varying в
фрагментном шейдере

Вершинный шейдер

    #version 300 es

    in vec4 a_position;

    uniform vec4 u_offset;

    +out vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

Фрагментный шейдер

    #version 300 es
    precision highp float;

    +in vec4 v_positionWithOffset;

    out vec4 outColor;

    void main() {
    +  // конвертируем из clip space (-1 <-> +1) в цветовое пространство (0 -> 1).
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5;
    +  outColor = color;
    }

Пример выше - это в основном бессмысленный пример. Обычно не имеет смысла
напрямую копировать значения clip space в фрагментный шейдер и использовать их как цвета. Тем не менее
это будет работать и производить цвета.

## GLSL

GLSL означает [Graphics Library Shader Language](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf).
Это язык, на котором написаны шейдеры. У него есть некоторые специальные полууникальные особенности, которые, конечно, не распространены в JavaScript.
Он разработан для выполнения математики, которая обычно нужна для вычисления вещей для растеризации
графики. Так, например, у него есть встроенные типы, такие как `vec2`, `vec3` и `vec4`, которые
представляют 2 значения, 3 значения и 4 значения соответственно. Аналогично у него есть `mat2`, `mat3`
и `mat4`, которые представляют матрицы 2x2, 3x3 и 4x4. Вы можете делать такие вещи, как умножать
`vec` на скаляр.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b теперь vec4(2, 4, 6, 8);

Аналогично он может делать умножение матриц и умножение вектора на матрицу

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

У него также есть различные селекторы для частей vec. Для vec4

    vec4 v;

*   `v.x` то же самое, что `v.s` и `v.r` и `v[0]`.
*   `v.y` то же самое, что `v.t` и `v.g` и `v[1]`.
*   `v.z` то же самое, что `v.p` и `v.b` и `v[2]`.
*   `v.w` то же самое, что `v.q` и `v.a` и `v[3]`.

Он способен *swizzle* компоненты vec, что означает, что вы можете поменять или повторить компоненты.

    v.yyyy

то же самое, что

    vec4(v.y, v.y, v.y, v.y)

Аналогично

    v.bgra

то же самое, что

    vec4(v.b, v.g, v.r, v.a)

При конструировании vec или mat вы можете предоставить несколько частей сразу. Так, например

    vec4(v.rgb, 1)

То же самое, что

    vec4(v.r, v.g, v.b, 1)

Одна вещь, на которой вы, вероятно, застрянете, это то, что GLSL очень строго типизирован.

    float f = 1;  // ОШИБКА 1 это int. Вы не можете присвоить int к float

Правильный способ - один из этих

    float f = 1.0;      // использовать float
    float f = float(1)  // привести целое число к float

Пример выше `vec4(v.rgb, 1)` не жалуется на `1`, потому что `vec4` приводит
вещи внутри, как `float(1)`.

GLSL имеет кучу встроенных функций. Многие из них работают с несколькими компонентами сразу.
Так, например

    T sin(T angle)

Означает, что T может быть `float`, `vec2`, `vec3` или `vec4`. Если вы передаете `vec4`, вы получаете `vec4` обратно,
который является синусом каждого из компонентов. Другими словами, если `v` это `vec4`, то

    vec4 s = sin(v);

то же самое, что

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

Иногда один аргумент - это float, а остальные - `T`. Это означает, что этот float будет применен
ко всем компонентам. Например, если `v1` и `v2` это `vec4`, а `f` это float, то

    vec4 m = mix(v1, v2, f);

то же самое, что

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

Вы можете увидеть список всех GLSL функций на последних 3 страницах [OpenGL ES 3.0
Reference Card](https://www.khronos.org/files/opengles3-quick-reference-card.pdf)
Если вам нравится действительно сухой и многословный материал, вы можете попробовать
[GLSL ES 3.00 spec](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf).

## Собираем все вместе

В этом суть всей этой серии постов. WebGL - это все о создании различных шейдеров, предоставлении
данных этим шейдерам и затем вызове `gl.drawArrays`, `gl.drawElements` и т.д., чтобы WebGL обработал
вершины, вызывая текущий вершинный шейдер для каждой вершины, а затем рендерил пиксели, вызывая текущий фрагментный шейдер для каждого пикселя.

Фактически создание шейдеров требует нескольких строк кода. Поскольку эти строки одинаковы в
большинстве WebGL программ и поскольку однажды написанные, вы можете в значительной степени игнорировать их, [как компилировать GLSL шейдеры
и связывать их в шейдерную программу, покрыто здесь](webgl-boilerplate.html).

Если вы только начинаете отсюда, вы можете пойти в 2 направлениях. Если вас интересует обработка изображений,
я покажу вам [как делать некоторую 2D обработку изображений](webgl-image-processing.html).
Если вас интересует изучение перемещения,
поворота и масштабирования, то [начните здесь](webgl-2d-translation.html). 