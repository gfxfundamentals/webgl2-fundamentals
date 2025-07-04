Title: WebGL2 Кубические карты
Description: Как использовать кубические карты в WebGL
TOC: Кубические карты


Эта статья является частью серии статей о WebGL2.
[Первая статья начинается с основ](webgl-fundamentals.html).
Эта статья продолжается от [статьи о текстурах](webgl-3d-textures.html).
Эта статья также использует концепции, рассмотренные в [статье об освещении](webgl-3d-lighting-directional.html).
Если вы еще не читали эти статьи, возможно, вы захотите прочитать их сначала.

В [предыдущей статье](webgl-3d-textures.html) мы рассмотрели, как использовать текстуры,
как они ссылаются координатами текстуры, которые идут от 0 до 1 поперек и вверх
текстуры, и как они фильтруются опционально с использованием мипмапов.

Другой вид текстуры - это *кубическая карта*. Она состоит из 6 граней, представляющих
6 граней куба. Вместо традиционных координат текстуры, которые
имеют 2 измерения, кубическая карта использует нормаль, другими словами, 3D направление.
В зависимости от направления, в которое указывает нормаль, одна из 6 граней куба
выбирается, а затем в пределах этой грани пиксели сэмплируются для получения цвета.

6 граней ссылаются по их направлению от центра куба.
Они

```js
gl.TEXTURE_CUBE_MAP_POSITIVE_X
gl.TEXTURE_CUBE_MAP_NEGATIVE_X
gl.TEXTURE_CUBE_MAP_POSITIVE_Y
gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
gl.TEXTURE_CUBE_MAP_POSITIVE_Z
gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
```

Давайте сделаем простой пример, мы будем использовать 2D холст для создания изображений, используемых в
каждой из 6 граней.

Вот некоторый код для заполнения холста цветом и центрированным сообщением

```js
function generateFace(ctx, faceColor, textColor, text) {
  const {width, height} = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}
```

И вот некоторый код для вызова его для генерации 6 изображений

```js
// Получаем 2D контекст
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // показываем результат
  ctx.canvas.toBlob((blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
});
```

{{{example url="../webgl-cubemap-faces.html" }}}

Теперь давайте применим это к кубу. Мы начнем с кода
из примера атласа текстур [в предыдущей статье](webgl-3d-textures.html).

Сначала давайте изменим шейдеры, чтобы использовать кубическую карту

```glsl
#version 300 es

in vec4 a_position;

uniform mat4 u_matrix;

out vec3 v_normal;

void main() {
  // Умножаем позицию на матрицу.
  gl_Position = u_matrix * a_position;

  // Передаем нормаль. Поскольку позиции
  // центрированы вокруг начала координат, мы можем просто
  // передать позицию
  v_normal = normalize(a_position.xyz);
}
```

Мы убрали координаты текстуры из шейдера и
добавили varying для передачи нормали в фрагментный шейдер.
Поскольку позиции нашего куба идеально центрированы вокруг начала координат,
мы можем просто использовать их как наши нормали.

Напомним из [статьи об освещении](webgl-3d-lighting-directional.html), что
нормали - это направление и обычно используются для указания направления
поверхности некоторой вершины. Поскольку мы используем нормализованные позиции
для наших нормалей, если бы мы освещали это, мы получили бы плавное освещение по
кубу. Для нормального куба нам пришлось бы иметь разные нормали для каждой
вершины для каждой грани.

{{{diagram url="resources/cube-normals.html" caption="стандартная нормаль куба vs нормали этого куба" }}}

Поскольку мы не используем координаты текстуры, мы можем убрать весь код, связанный с
настройкой координат текстуры.

В фрагментном шейдере нам нужно использовать `samplerCube` вместо `sampler2D`,
и `texture`, когда используется с `samplerCube`, принимает vec3 направление,
поэтому мы передаем нормализованную нормаль. Поскольку нормаль - это varying и будет интерполирована,
нам нужно нормализовать ее.

```
#version 300 es

precision highp float;

// Переданный из вершинного шейдера.
in vec3 v_normal;

// Текстура.
uniform samplerCube u_texture;

// нам нужно объявить выход для фрагментного шейдера
out vec4 outColor;

void main() {
   outColor = texture(u_texture, normalize(v_normal));
}
```

Затем в JavaScript нам нужно настроить текстуру

```js
// Создаем текстуру.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

// Получаем 2D контекст
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {target, faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // Загружаем холст в грань кубической карты.
  const level = 0;
  const internalFormat = gl.RGBA;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

Вещи для заметки выше:

* Мы используем `gl.TEXTURE_CUBE_MAP` вместо `gl.TEXTURE_2D`.

  Это говорит WebGL сделать кубическую карту вместо 2D текстуры.

* Для загрузки каждой грани текстуры мы используем специальные цели.

  `gl.TEXTURE_CUBE_MAP_POSITIVE_X`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_X`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Z`, и
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Z`.

* Каждая грань - это квадрат. Выше они 128x128.

  Кубические карты должны иметь квадратные текстуры.
  Мы также
  генерируем мипмапы и включаем фильтрацию для использования мипмапов.

И вуаля

{{{example url="../webgl-cubemap.html" }}}

Использование кубической карты для текстурирования куба - это **не** то, для чего кубические карты обычно
используются. *Правильный* или скорее стандартный способ текстурирования куба - это
использовать атлас текстур, как мы [упоминали раньше](webgl-3d-textures.html).

Теперь, когда мы изучили, что такое кубическая карта и как ее настроить, для чего используется кубическая карта?
Вероятно, самая распространенная вещь, для которой используется кубическая карта, это как
[*карта окружения*](webgl-environment-maps.html).