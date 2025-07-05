Title: WebGL2 — Меньше кода, больше удовольствия
Description: Как сделать программирование на WebGL менее многословным
TOC: Меньше кода, больше удовольствия


Этот пост — продолжение серии статей о WebGL.
Первая [начиналась с основ](webgl-fundamentals.html).
Если вы их не читали, начните с них.

В WebGL-программах нужно писать шейдеры, компилировать и линковать их, а затем
искать локации входов этих шейдеров. Эти входы называются
uniform'ами и атрибутами, и код для поиска их локаций может быть многословным и утомительным.

Допустим, у нас есть <a href="webgl-boilerplate.html">типовой boilerplate-код для компиляции и линковки шейдеров</a>.
Пусть у нас такие шейдеры:

Вершинный шейдер:

```
#version 300 es

uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

out vec4 v_position;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
}
```

Фрагментный шейдер:

```
#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

out vec4 outColor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  outColor = vec4((
    u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
    diffuseColor.a);
}
```

Вам пришлось бы писать такой код для поиска и установки всех значений для отрисовки:

```
// При инициализации
var u_worldViewProjectionLoc   = gl.getUniformLocation(program, "u_worldViewProjection");
var u_lightWorldPosLoc         = gl.getUniformLocation(program, "u_lightWorldPos");
var u_worldLoc                 = gl.getUniformLocation(program, "u_world");
var u_viewInverseLoc           = gl.getUniformLocation(program, "u_viewInverse");
var u_worldInverseTransposeLoc = gl.getUniformLocation(program, "u_worldInverseTranspose");
var u_lightColorLoc            = gl.getUniformLocation(program, "u_lightColor");
var u_ambientLoc               = gl.getUniformLocation(program, "u_ambient");
var u_diffuseLoc               = gl.getUniformLocation(program, "u_diffuse");
var u_specularLoc              = gl.getUniformLocation(program, "u_specular");
var u_shininessLoc             = gl.getUniformLocation(program, "u_shininess");
var u_specularFactorLoc        = gl.getUniformLocation(program, "u_specularFactor");

var a_positionLoc              = gl.getAttribLocation(program, "a_position");
var a_normalLoc                = gl.getAttribLocation(program, "a_normal");
var a_texCoordLoc              = gl.getAttribLocation(program, "a_texcoord");

// Настраиваем все буферы и атрибуты (предполагаем, что буферы уже созданы)
var vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(a_positionLoc);
gl.vertexAttribPointer(a_positionLoc, positionNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.enableVertexAttribArray(a_normalLoc);
gl.vertexAttribPointer(a_normalLoc, normalNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.enableVertexAttribArray(a_texcoordLoc);
gl.vertexAttribPointer(a_texcoordLoc, texcoordNumComponents, gl.FLOAT, false, 0, 0);

// При инициализации или отрисовке, в зависимости от задачи
var someWorldViewProjectionMat = computeWorldViewProjectionMatrix();
var lightWorldPos              = [100, 200, 300];
var worldMat                   = computeWorldMatrix();
var viewInverseMat             = computeInverseViewMatrix();
var worldInverseTransposeMat   = computeWorldInverseTransposeMatrix();
var lightColor                 = [1, 1, 1, 1];
var ambientColor               = [0.1, 0.1, 0.1, 1];
var diffuseTextureUnit         = 0;
var specularColor              = [1, 1, 1, 1];
var shininess                  = 60;
var specularFactor             = 1;

// При отрисовке
gl.useProgram(program);
gl.bindVertexArray(vao);

gl.activeTexture(gl.TEXTURE0 + diffuseTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);

gl.uniformMatrix4fv(u_worldViewProjectionLoc, false, someWorldViewProjectionMat);
gl.uniform3fv(u_lightWorldPosLoc, lightWorldPos);
gl.uniformMatrix4fv(u_worldLoc, worldMat);
gl.uniformMatrix4fv(u_viewInverseLoc, viewInverseMat);
gl.uniformMatrix4fv(u_worldInverseTransposeLoc, worldInverseTransposeMat);
gl.uniform4fv(u_lightColorLoc, lightColor);
gl.uniform4fv(u_ambientLoc, ambientColor);
gl.uniform1i(u_diffuseLoc, diffuseTextureUnit);
gl.uniform4fv(u_specularLoc, specularColor);
gl.uniform1f(u_shininessLoc, shininess);
gl.uniform1f(u_specularFactorLoc, specularFactor);

gl.drawArrays(...);
```

Это очень много кода.

Есть много способов упростить это. Один из вариантов — попросить WebGL выдать все
uniform'ы, атрибуты и их локации, а затем создать функции для их установки.
Тогда можно будет передавать обычные JavaScript-объекты для настройки параметров.
Если это звучит непонятно, вот как выглядел бы код:

```
// При инициализации
var uniformSetters = twgl.createUniformSetters(gl, program);
var attribSetters  = twgl.createAttributeSetters(gl, program);

// Настраиваем все буферы и атрибуты
var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};
var vao = twgl.createVAOAndSetAttributes(
    gl, attribSetters, attribs);

// При инициализации или отрисовке
var uniforms = {
  u_worldViewProjection:   computeWorldViewProjectionMatrix(...),
  u_lightWorldPos:         [100, 200, 300],
  u_world:                 computeWorldMatrix(),
  u_viewInverse:           computeInverseViewMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
  u_lightColor:            [1, 1, 1, 1],
  u_ambient:               [0.1, 0.1, 0.1, 1],
  u_diffuse:               diffuseTexture,
  u_specular:              [1, 1, 1, 1],
  u_shininess:             60,
  u_specularFactor:        1,
};

// При отрисовке
gl.useProgram(program);

// Привязываем VAO, в котором уже все буферы и атрибуты
gl.bindVertexArray(vao);

// Устанавливаем все uniform'ы и текстуры
twgl.setUniforms(uniformSetters, uniforms);

gl.drawArrays(...);
```

Это кажется намного меньше, проще и с меньшим количеством кода.

Вы даже можете использовать несколько JavaScript-объектов для uniform'ов, если это подходит. Например:

```
// При инициализации
var uniformSetters = twgl.createUniformSetters(gl, program);
var attribSetters  = twgl.createAttributeSetters(gl, program);

// Настраиваем все буферы и атрибуты
var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};
var vao = twgl.createVAOAndSetAttributes(gl, attribSetters, attribs);

// При инициализации или отрисовке
var uniformsThatAreTheSameForAllObjects = {
  u_lightWorldPos:         [100, 200, 300],
  u_viewInverse:           computeInverseViewMatrix(),
  u_lightColor:            [1, 1, 1, 1],
};

var uniformsThatAreComputedForEachObject = {
  u_worldViewProjection:   perspective(...),
  u_world:                 computeWorldMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
};

var objects = [
  { translation: [10, 50, 100],
    materialUniforms: {
      u_ambient:               [0.1, 0.1, 0.1, 1],
      u_diffuse:               diffuseTexture,
      u_specular:              [1, 1, 1, 1],
      u_shininess:             60,
      u_specularFactor:        1,
    },
  },
  { translation: [-120, 20, 44],
    materialUniforms: {
      u_ambient:               [0.1, 0.2, 0.1, 1],
      u_diffuse:               someOtherDiffuseTexture,
      u_specular:              [1, 1, 0, 1],
      u_shininess:             30,
      u_specularFactor:        0.5,
    },
  },
  { translation: [200, -23, -78],
    materialUniforms: {
      u_ambient:               [0.2, 0.2, 0.1, 1],
      u_diffuse:               yetAnotherDiffuseTexture,
      u_specular:              [1, 0, 0, 1],
      u_shininess:             45,
      u_specularFactor:        0.7,
    },
  },
];

// При отрисовке
gl.useProgram(program);

// Настраиваем части, общие для всех объектов
gl.bindVertexArray(vao);
twgl.setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);

objects.forEach(function(object) {
  computeMatricesForObject(object, uniformsThatAreComputedForEachObject);
  twgl.setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);
  twgl.setUniforms(uniformSetters, object.materialUniforms);
  gl.drawArrays(...);
});
```

Вот пример использования этих вспомогательных функций:

{{{example url="../webgl-less-code-more-fun.html" }}}

Давайте сделаем ещё один маленький шаг дальше. В коде выше мы настроили переменную `attribs` с буферами, которые создали.
Не показан код для настройки этих буферов. Например, если вы хотите создать позиции, нормали и координаты текстуры,
вам может понадобиться такой код:

    // один треугольник
    var positions = [0, -10, 0, 10, 10, 0, -10, 10, 0];
    var texcoords = [0.5, 0, 1, 1, 0, 1];
    var normals   = [0, 0, 1, 0, 0, 1, 0, 0, 1];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

Похоже на паттерн, который мы тоже можем упростить:

    // один треугольник
    var arrays = {
       position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
       texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1],               },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
    };

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    var vao = twgl.createVAOFromBufferInfo(gl, setters, bufferInfo);

Намного короче!

Вот это:

{{{example url="../webgl-less-code-more-fun-triangle.html" }}}

Это будет работать даже если у нас есть индексы. `createVAOFromBufferInfo`
настроит все атрибуты и установит `ELEMENT_ARRAY_BUFFER`
с вашими `indices`, так что когда вы привяжете этот VAO, вы сможете вызвать
`gl.drawElements`.

    // индексированный квадрат
    var arrays = {
       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
    };

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    var vao = twgl.createVAOFromBufferInfo(gl, setters, bufferInfo);

и во время рендеринга мы можем вызвать `gl.drawElements` вместо `gl.drawArrays`.

    ...

    // Рисуем геометрию
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

Вот это:

{{{example url="../webgl-less-code-more-fun-quad.html" }}}

Наконец, мы можем пойти, как я считаю, возможно, слишком далеко. Учитывая, что `position` почти всегда имеет 3 компонента (x, y, z),
`texcoords` почти всегда 2, индексы 3, а нормали 3, мы можем просто позволить системе угадать количество
компонентов.

    // индексированный квадрат
    var arrays = {
       position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
       texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
       normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
       indices:  [0, 1, 2, 1, 2, 3],
    };

И эта версия:

{{{example url="../webgl-less-code-more-fun-quad-guess.html" }}}

Я не уверен, что лично мне нравится этот стиль. Угадывание меня беспокоит, потому что оно может угадать неправильно. Например,
я могу решить добавить дополнительный набор координат текстуры в мой атрибут texcoord, и он
угадает 2 и будет неправ. Конечно, если он угадает неправильно, вы можете просто указать это, как в примере выше.
Я думаю, я беспокоюсь, что если код угадывания изменится, вещи людей могут сломаться. Это решать вам. Некоторым людям
нравится, когда вещи максимально простые, как они считают.

Почему бы нам не посмотреть на атрибуты в шейдерной программе, чтобы выяснить количество компонентов?
Это потому, что часто предоставляют 3 компонента (x, y, z) из буфера, но используют `vec4` в
шейдере. Для атрибутов WebGL автоматически установит `w = 1`. Но это означает, что мы не можем легко
знать намерение пользователя, поскольку то, что они объявили в шейдере, может не соответствовать количеству
компонентов, которые они предоставляют.

Ища больше паттернов, есть это:

    var program = twgl.createProgramFromSources(gl, [vs, fs]);
    var uniformSetters = twgl.createUniformSetters(gl, program);
    var attribSetters  = twgl.createAttributeSetters(gl, program);

Давайте упростим и это до просто:

    var programInfo = twgl.createProgramInfo(gl, ["vertexshader", "fragmentshader"]);

Который возвращает что-то вроде:

    programInfo = {
       program: WebGLProgram,  // программа, которую мы только что скомпилировали
       uniformSetters: ...,    // setters, как возвращённые из createUniformSetters
       attribSetters: ...,     // setters, как возвращённые из createAttribSetters
    }

И это ещё одно небольшое упрощение. Это пригодится, когда мы начнём использовать
несколько программ, поскольку это автоматически держит setters с программой, с которой они связаны.

{{{example url="../webgl-less-code-more-fun-quad-programinfo.html" }}}

Ещё одно, иногда у нас есть данные без индексов, и мы должны вызывать
`gl.drawArrays`. В других случаях есть индексы, и мы должны вызывать `gl.drawElements`.
Учитывая данные, которые у нас есть, мы можем легко проверить что именно, посмотрев на `bufferInfo.indices`.
Если он существует, нам нужно вызвать `gl.drawElements`. Если нет, нам нужно вызвать `gl.drawArrays`.
Так что есть функция `twgl.drawBufferInfo`, которая делает это. Она используется так:

    twgl.drawBufferInfo(gl, bufferInfo);

Если вы не передаёте 3-й параметр для типа примитива для рисования, он предполагает
`gl.TRIANGLES`.

Вот пример, где у нас есть неиндексированный треугольник и индексированный квадрат. Поскольку
мы используем `twgl.drawBufferInfo`, код не должен изменяться, когда мы
переключаем данные.

{{{example url="../webgl-less-code-more-fun-drawbufferinfo.html" }}}

В любом случае, это стиль, в котором я пытаюсь писать свои собственные WebGL-программы.
Для уроков в этих туториалах, однако, я чувствовал, что должен использовать стандартные **многословные**
способы, чтобы люди не путались в том, что является WebGL, а что моим собственным стилем. В какой-то момент
показ всех шагов мешает сути, поэтому в будущем некоторые уроки будут
использовать этот стиль.

Не стесняйтесь использовать этот стиль в своём собственном коде. Функции `twgl.createProgramInfo`,
`twgl.createVAOAndSetAttributes`, `twgl.createBufferInfoFromArrays` и `twgl.setUniforms`
и т.д. являются частью библиотеки, которую я написал на основе этих идей. [Она называется `TWGL`](https://twgljs.org).
Она рифмуется с wiggle и означает `Tiny WebGL`.

Далее, [рисование множественных объектов](webgl-drawing-multiple-things.html).

<div class="webgl_bottombar">
<h3>Можем ли мы использовать setters напрямую?</h3>
<p>
Для тех из вас, кто знаком с JavaScript, вы можете задаться вопросом, можете ли вы использовать setters
напрямую, как это:
</p>
<pre class="prettyprint">{{#escapehtml}}
// При инициализации
var uniformSetters = twgl.createUniformSetters(program);

// При отрисовке
uniformSetters.u_ambient([1, 0, 0, 1]); // установить цвет окружения в красный
{{/escapehtml}}</pre> 