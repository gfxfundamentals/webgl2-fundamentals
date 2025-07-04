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