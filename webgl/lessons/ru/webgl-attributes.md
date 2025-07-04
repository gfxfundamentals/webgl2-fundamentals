Title: WebGL2 Атрибуты
Description: Что такое атрибуты в WebGL?
TOC: Атрибуты


Эта статья предназначена для того, чтобы дать вам мысленное представление
о том, как настраивается состояние атрибутов в WebGL. Есть [похожая статья о единицах текстур](webgl-texture-units.html) и о [framebuffer'ах](webgl-framebuffers.html).

Как предварительное условие вам, вероятно, стоит прочитать [Как работает WebGL](webgl-how-it-works.html)
и [WebGL Шейдеры и GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html). 

## Атрибуты

В WebGL атрибуты - это входы для vertex шейдера, которые получают свои данные из буферов.
WebGL будет выполнять пользовательский vertex шейдер N раз, когда вызывается либо `gl.drawArrays`, либо `gl.drawElements`. 
Для каждой итерации атрибуты определяют, как извлекать данные из буферов, привязанных к ним,
и поставлять их к атрибутам внутри vertex шейдера.

Если бы они были реализованы в JavaScript, они выглядели бы примерно так:

```js
// псевдокод
const gl = {
  arrayBuffer: null,
  vertexArray: {
    attributes: [
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
    ],
    elementArrayBuffer: null,
  },
}
```

Как вы можете видеть выше, есть 16 атрибутов.

Когда вы вызываете `gl.enableVertexAttribArray(location)` или `gl.disableVertexAttribArray`, вы можете думать об этом так:

```js
// псевдокод
gl.enableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = true;
};

gl.disableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = false;
};
```

Другими словами, location напрямую ссылается на индекс атрибута.

Аналогично `gl.vertexAttribPointer` используется для установки почти всех остальных
настроек атрибута. Это было бы реализовано примерно так:

```js
// псевдокод
gl.vertexAttribPointer = function(location, size, type, normalize, stride, offset) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.size = size;
  attrib.type = type;
  attrib.normalize = normalize;
  attrib.stride = stride ? stride : sizeof(type) * size;
  attrib.offset = offset;
  attrib.buffer = gl.arrayBuffer;  // !!!! <-----
};
```

Обратите внимание, что когда мы вызываем `gl.vertexAttribPointer`, `attrib.buffer` 
устанавливается в то, что в данный момент установлено в `gl.arrayBuffer`. 
`gl.arrayBuffer` в псевдокоде выше был бы установлен вызовом 
`gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)`.

```js
// псевдокод
gl.bindBuffer = function(target, buffer) {
  switch (target) {
    case ARRAY_BUFFER:
      gl.arrayBuffer = buffer;
      break;
    case ELEMENT_ARRAY_BUFFER;
      gl.vertexArray.elementArrayBuffer = buffer;
      break;
  ...
};
```

Итак, дальше у нас есть vertex шейдеры. В vertex шейдере вы объявляете атрибуты. Пример:

```glsl
#version 300 es
in vec4 position;
in vec2 texcoord;
in vec3 normal;

...

void main() {
  ...
}
```

Когда вы связываете vertex шейдер с fragment шейдером, вызывая
`gl.linkProgram(someProgram)`, WebGL (драйвер/GPU/браузер) решают сами,
какой индекс/location использовать для каждого атрибута. Если вы не назначите
locations вручную (см. ниже), вы не знаете, какие они выберут. Это зависит от
браузера/драйвера/GPU. Итак, вам нужно спросить его, какой атрибут он использовал
для position, texcoord и normal? Вы делаете это, вызывая
`gl.getAttribLocation`

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

Допустим, `positionLoc` = `5`. Это означает, что когда vertex шейдер выполняется (когда
вы вызываете `gl.drawArrays` или `gl.drawElements`), vertex шейдер ожидает, что вы
настроили атрибут 5 с правильным типом, размером, смещением, шагом, буфером и т.д.

Обратите внимание, что ДО связывания программы вы можете выбрать locations, вызывая
`gl.bindAttribLocation(program, location, nameOfAttribute)`. Пример:

```js
// Скажите `gl.linkProgram` назначить `position` для использования атрибута #7
gl.bindAttribLocation(program, 7, 'position');
```

Вы также можете указать, какой location использовать в вашем шейдере напрямую, если вы
используете GLSL ES 3.00 шейдеры с:

```glsl
layout(location = 0) in vec4 position;
layout(location = 1) in vec2 texcoord;
layout(location = 2) in vec3 normal;

...
```

Кажется, что использование `bindAttribLocation` намного более [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself),
но используйте что вам нравится.

## Полное состояние атрибута

Отсутствует в описании выше то, что каждый атрибут также имеет значение по умолчанию.
Это опущено выше, потому что это необычно использовать.

```js
attributeValues: [
  [0, 0, 0, 1],
  [0, 0, 0, 1],
  ...
],
vertexArray: {
  attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, },
   ...
```
Вы можете установить значение каждого атрибута с помощью различных функций `gl.vertexAttribXXX`.
Значение используется, когда `enable` равно false. Когда enable равно true, данные для
атрибута извлекаются из назначенного буфера.

<a id="vaos"></a>
## Vertex Array Objects (VAO)

```js
const vao = gl.createVertexArray();
```

создает объект, который вы видите прикрепленным к `gl.vertexArray` в *псевдокоде*
выше. Вызов `gl.bindVertexArray(vao)` назначает ваш созданный vertex array
объект как текущий vertex array.

```js
// псевдокод
gl.bindVertexArray = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

Это позволяет вам установить все атрибуты и `ELEMENT_ARRAY_BUFFER` в
текущем VAO, так что когда вы хотите нарисовать определенную форму, это один вызов к
`gl.bindVertexArray` для эффективной настройки
всех атрибутов, тогда как в противном случае это было бы до одного вызова к обоим
`gl.bindBuffer`, `gl.vertexAttribPointer` (и возможно
`gl.enableVertexAttribArray`) **на атрибут**.

Вы можете видеть, что это, возможно, хорошая вещь - использовать vertex array objects. 
Чтобы использовать их, хотя часто требуется больше организации. Например, скажем, вы хотите 
нарисовать куб с `gl.TRIANGLES` с одним шейдером, а затем снова с `gl.LINES`
с другим шейдером. Скажем, когда вы рисуете с треугольниками, вы используете
нормали для освещения, поэтому вы объявляете атрибуты в вашем шейдере так:

```glsl
#version 300 es
// lighting-shader
// шейдер для куба, нарисованного с треугольниками

in vec4 a_position;
in vec3 a_normal;
```

Затем вы используете эти позиции и нормали, как мы рассмотрели в 
[первой статье об освещении](webgl-3d-lighting-directional.html)

Для линий вы не хотите освещения, вы хотите сплошной цвет, поэтому вы
делаете что-то похожее на первые шейдеры на [первой странице](webgl-fundamentals.html) этих
уроков. Вы объявляете uniform для цвета. Это означает, что в вашем
vertex шейдере вам нужна только позиция

```glsl
#version 300 es
// solid-shader
// шейдер для куба с линиями

in vec4 a_position;
```

У нас нет представления о том, какие locations атрибутов будут решены для каждого шейдера.
Допустим, для lighting-shader выше locations:

```
a_position location = 1
a_normal location = 0
```

и для solid-shader, который имеет только один атрибут:

```
a_position location = 0
```

Ясно, что при переключении шейдеров нам нужно будет настроить атрибуты по-разному.
Один шейдер ожидает, что данные `a_position` появятся на атрибуте 0. Другой шейдер
ожидает, что они появятся на атрибуте 1.

Перенастройка атрибутов - это дополнительная работа. Хуже того, вся суть использования
vertex array object - это сэкономить нам от необходимости делать эту работу. Чтобы исправить эту проблему,
мы бы привязали locations до связывания программ шейдеров. 

Мы бы сказали WebGL:

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

**ДО вызова gl.linkProgram**. Это говорит WebGL, какие locations назначить при связывании шейдера.
Теперь мы можем использовать тот же VAO для обоих шейдеров. 

## Максимум атрибутов

WebGL2 требует, чтобы поддерживалось как минимум 16 атрибутов, но конкретный
компьютер/браузер/реализация/драйвер может поддерживать больше. Вы можете узнать,
сколько поддерживается, вызвав:

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

Если вы решите использовать больше 16, вам, вероятно, стоит проверить, сколько
фактически поддерживается, и сообщить пользователю, если их
машина не имеет достаточно, или иначе откатиться к более простым шейдерам. 