Title: WebGL2 Тени
Description: Как вычислять тени
TOC: Тени

Давайте нарисуем некоторые тени!

## Предварительные требования

Вычисление базовых теней не *так* сложно, но требует
много фоновых знаний. Чтобы понять эту статью,
вам нужно уже понимать следующие темы.

* [Ортографическая проекция](webgl-3d-orthographic.html)
* [Перспективная проекция](webgl-3d-perspective.html)
* [Прожекторное освещение](webgl-3d-lighting-spot.html)
* [Текстуры](webgl-3d-textures.html)
* [Рендеринг в текстуру](webgl-render-to-texture.html)
* [Проекция текстур](webgl-planar-projection-mapping.html)
* [Визуализация камеры](webgl-visualizing-the-camera.html)

Поэтому, если вы их не читали, пожалуйста, сначала прочитайте их.

Помимо этого, эта статья предполагает, что вы прочитали статью о
[меньше кода больше веселья](webgl-less-code-more-fun.html),
поскольку она использует библиотеку, упомянутую там, чтобы
не загромождать пример. Если вы не понимаете,
что такое буферы, массивы вершин и атрибуты, или когда
функция называется `twgl.setUniforms`, что означает
установка uniforms и т.д., то вам, вероятно, стоит пойти дальше назад и
[прочитать основы](webgl-fundamentals.html).

Итак, во-первых, есть более одного способа рисовать тени.
Каждый способ имеет свои компромиссы. Самый распространенный способ рисовать
тени - использовать карты теней.

Карты теней работают, комбинируя техники из всех предварительных
статей выше.

В [статье о проекционном маппинге](webgl-planar-projection-mapping.html)
мы видели, как проецировать изображение на объекты

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

Напомним, что мы не рисовали это изображение поверх объектов в сцене,
скорее, когда объекты рендерились, для каждого пикселя мы проверяли, находится ли
проецируемая текстура в диапазоне, если да, то мы брали соответствующий цвет из
проецируемой текстуры, если нет, то мы брали цвет из другой текстуры,
цвет которой искался с использованием координат текстуры, которые маппили текстуру
на объект.

Что, если проецируемая текстура вместо этого содержала данные глубины с точки
зрения источника света. Другими словами, предположим, что был источник света на кончике
усеченной пирамиды, показанной в том примере выше, и проецируемая текстура имела информацию о глубине
с точки зрения источника света. Сфера имела бы значения глубины ближе
к источнику света, плоскость имела бы значения глубины дальше
от источника света.

<div class="webgl_center"><img class="noinvertdark" src="resources/depth-map-generation.svg" style="width: 600px;"></div>

Если бы у нас были эти данные, то при выборе цвета для рендеринга
мы могли бы получить значение глубины из проецируемой текстуры и проверить, является ли
глубина пикселя, который мы собираемся нарисовать, ближе или дальше от источника света.
Если она дальше от источника света, это означает, что что-то еще было ближе к источнику света. Другими словами,
что-то блокирует свет, поэтому этот пиксель в тени.

<div class="webgl_center"><img class="noinvertdark" src="resources/projected-depth-texture.svg" style="width: 600px;"></div>

Здесь текстура глубины проецируется через пространство света внутри усеченной пирамиды с точки зрения источника света.
Когда мы рисуем пиксели пола, мы вычисляем глубину этого пикселя с точки зрения
источника света (0.3 на диаграмме выше). Затем мы смотрим на соответствующую глубину в
проецируемой карте глубины. С точки зрения источника света значение глубины
в текстуре будет 0.1, потому что она попала в сферу. Видя, что 0.1 &lt; 0.3, мы
знаем, что пол в этой позиции должен быть в тени.

Сначала давайте нарисуем карту теней. Мы возьмем последний пример из
[статьи о проекционном маппинге](webgl-planar-projection-mapping.html),
но вместо загрузки текстуры мы будем [рендерить в текстуру](webgl-render-to-texture.html),
поэтому мы создаем текстуру глубины и прикрепляем ее к framebuffer как `DEPTH_ATTACHMENT`.

```js
const depthTexture = gl.createTexture();
const depthTextureSize = 512;
gl.bindTexture(gl.TEXTURE_2D, depthTexture);
gl.texImage2D(
    gl.TEXTURE_2D,      // target
    0,                  // mip level
    gl.DEPTH_COMPONENT32F, // internal format
    depthTextureSize,   // width
    depthTextureSize,   // height
    0,                  // border
    gl.DEPTH_COMPONENT, // format
    gl.FLOAT,           // type
    null);              // data
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const depthFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,       // target
    gl.DEPTH_ATTACHMENT,  // attachment point
    gl.TEXTURE_2D,        // texture target
    depthTexture,         // texture
    0);                   // mip level
```

Чтобы использовать это, нам нужно уметь рендерить сцену более одного раза с разными
шейдерами. Один раз с простым шейдером только для рендеринга в текстуру глубины, а
затем снова с нашим текущим шейдером, который проецирует текстуру.

Итак, сначала давайте изменим `drawScene`, чтобы мы могли передать ей программу, с которой хотим
рендерить

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix) {
+function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
  // Создаем матрицу вида из матрицы камеры.
  const viewMatrix = m4.inverse(cameraMatrix);

-  gl.useProgram(textureProgramInfo.program);
+  gl.useProgram(programInfo.program);

  // устанавливаем uniforms, которые одинаковы для сферы и плоскости
  // примечание: любые значения без соответствующего uniform в шейдере
  // игнорируются.
-  twgl.setUniforms(textureProgramInfo, {
+  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
*    u_textureMatrix: textureMatrix,
-    u_projectedTexture: imageTexture,
+    u_projectedTexture: depthTexture,
  });

  // ------ Рисуем сферу --------

  // Настраиваем все необходимые атрибуты.
  gl.bindVertexArray(sphereVAO);

  // Устанавливаем uniforms, уникальные для сферы
-  twgl.setUniforms(textureProgramInfo, sphereUniforms);
+  twgl.setUniforms(programInfo, sphereUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ Рисуем плоскость --------

  // Настраиваем все необходимые атрибуты.
  gl.bindVertexArray(planeVAO);

  // Устанавливаем uniforms, которые мы только что вычислили
-  twgl.setUniforms(textureProgramInfo, planeUniforms);
+  twgl.setUniforms(programInfo, planeUniforms);

  // вызывает gl.drawArrays или gl.drawElements
  twgl.drawBufferInfo(gl, planeBufferInfo);
}
```

Теперь, когда мы собираемся использовать одни и те же массивы вершин с несколькими
программами шейдеров, нам нужно убедиться, что эти программы используют одни и те же атрибуты.
Это было упомянуто ранее при разговоре о массивах вершин (VAO в коде выше),
но я думаю, что это первый пример на этом сайте, который действительно сталкивается с этой
проблемой. Другими словами, мы собираемся рисовать сферу и плоскость как с
программой шейдера проецируемой текстуры, так и с программой шейдера сплошного цвета.
Программа шейдера проецируемой текстуры имеет 2 атрибута, `a_position` и
`a_texcoord`. Программа шейдера сплошного цвета имеет только один, `a_position`.
Если мы не скажем WebGL, какие местоположения атрибутов использовать, возможно,
он установит `a_position` местоположение = 0 для одного шейдера и местоположение = 1 для другого
(или действительно WebGL может выбрать любое произвольное местоположение). Если это произойдет,
то атрибуты, которые мы настроили в `sphereVAO` и `planeVAO`, не будут соответствовать
обеим программам.

Мы можем решить это 2 способами.

1. В GLSL добавить `layout(location = 0)` перед каждым атрибутом

  ```glsl
  layout(location = 0) in vec4 a_position;
  layout(location = 1) in vec4 a_texcoord;
  ```

  Если бы у нас было 150 шейдеров, нам пришлось бы повторять эти местоположения во всех из них
  и отслеживать, какие шейдеры используют какие местоположения

2. вызвать `gl.bindAttribLocation` перед связыванием шейдеров

   В данном случае перед тем, как мы вызовем `gl.linkProgram`, мы вызовем `gl.bindAttribLocation`.
   (см. [первую статью](webgl-fundamentals.html))

  ```js
  gl.bindAttribLocation(program, 0, "a_position");
  gl.bindAttribLocation(program, 1, "a_texcoord");
  gl.linkProgram(program);
  ...
  ```

Мы будем использовать этот второй способ, поскольку он более [D.R.Y](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

Библиотека, которую мы используем для компиляции и связывания наших шейдеров, имеет опцию сделать это
для нас. Мы просто передаем ей имена атрибутов и их местоположения, и она
вызовет `gl.bindAttribLocation` для нас

```js
// настраиваем GLSL программы
+// примечание: Поскольку мы собираемся использовать один и тот же VAO с несколькими
+// программами шейдеров, нам нужно убедиться, что все программы используют
+// одинаковые местоположения атрибутов. Есть 2 способа сделать это.
+// (1) назначить их в GLSL. (2) назначить их, вызвав `gl.bindAttribLocation`
+// перед связыванием. Мы используем метод 2, поскольку он более D.R.Y.
+const programOptions = {
+  attribLocations: {
+    'a_position': 0,
+    'a_normal':   1,
+    'a_texcoord': 2,
+    'a_color':    3,
+  },
+};
-const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
-const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS],);
+const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs], programOptions);
+const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS], programOptions);
```

Теперь давайте используем `drawScene`, чтобы нарисовать сцену с точки зрения источника света,
а затем снова с текстурой глубины

```js
function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // сначала рисуем с точки зрения источника света
-  const textureWorldMatrix = m4.lookAt(
+  const lightWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // позиция
      [settings.targetX, settings.targetY, settings.targetZ], // цель
      [0, 1, 0],                                              // вверх
  );
-  const textureProjectionMatrix = settings.perspective
+  const lightProjectionMatrix = settings.perspective
      ? m4.perspective(
          degToRad(settings.fieldOfView),
          settings.projWidth / settings.projHeight,
          0.5,  // near
          10)   // far
      : m4.orthographic(
          -settings.projWidth / 2,   // left
           settings.projWidth / 2,   // right
          -settings.projHeight / 2,  // bottom
           settings.projHeight / 2,  // top
           0.5,                      // near
           10);                      // far

+  // рисуем в текстуру глубины
+  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
+  gl.viewport(0, 0, depthTextureSize, depthTextureSize);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

-  drawScene(textureProjectionMatrix, textureWorldMatrix, m4.identity());
+  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);

+  // теперь рисуем сцену на canvas, проецируя текстуру глубины в сцену
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let textureMatrix = m4.identity();
  textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
  textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
-  textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+  textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
  // используем обратную этой мировой матрицы, чтобы сделать
  // матрицу, которая будет преобразовывать другие позиции
  // чтобы быть относительными к этому мировому пространству.
  textureMatrix = m4.multiply(
      textureMatrix,
-      m4.inverse(textureWorldMatrix));
+      m4.inverse(lightWorldMatrix));

  // Вычисляем матрицу проекции
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // Вычисляем матрицу камеры, используя look at.
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix); 
+  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo); 
}
```

Обратите внимание, что я переименовал `textureWorldMatrix` в `lightWorldMatrix` и
`textureProjectionMatrix` в `lightProjectionMatrix`. Они действительно
одно и то же, но раньше мы проецировали текстуру через произвольное пространство.
Теперь мы пытаемся проецировать карту теней от источника света. Математика та же,
но казалось уместным переименовать переменные.

Выше мы сначала рендерим сферу и плоскость в текстуру глубины,
используя цветной шейдер, который мы сделали для рисования линий усеченной пирамиды. Этот шейдер
просто рисует сплошной цвет и ничего больше особенного не делает, что все,
что нам нужно при рендеринге в текстуру глубины.

После этого мы рендерим сцену снова на canvas, как мы делали раньше,
проецируя текстуру в сцену.
Когда мы ссылаемся на текстуру глубины в шейдере, только красное
значение действительно, поэтому мы просто повторим его для красного, зеленого и синего.

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
+  // канал 'r' имеет значения глубины
+  vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
```

Пока мы этим занимаемся, давайте добавим куб в сцену

```js
+const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(
+    gl,
+    2,  // размер
+);

...

+const cubeUniforms = {
+  u_colorMult: [0.5, 1, 0.5, 1],  // светло-зеленый
+  u_color: [0, 0, 1, 1],
+  u_texture: checkerboardTexture,
+  u_world: m4.translation(3, 1, 0),
+};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {

    ...

+    // ------ Рисуем куб --------
+
+    // Настраиваем все необходимые атрибуты.
+    gl.bindVertexArray(cubeVAO);
+
+    // Устанавливаем uniforms, которые мы только что вычислили
+    twgl.setUniforms(programInfo, cubeUniforms);
+
+    // вызывает gl.drawArrays или gl.drawElements
+    twgl.drawBufferInfo(gl, cubeBufferInfo);

...
```

и давайте настроим настройки. Мы переместим камеру
и расширим поле зрения для проекции текстуры, чтобы покрыть больше сцены

```js
const settings = {
-  cameraX: 2.5,
+  cameraX: 6,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
-  fieldOfView: 45,
+  fieldOfView: 120,
};
```

примечание: Я переместил код, который рисует куб линий, показывающий
усеченную пирамиду, за пределы функции `drawScene`.

{{{example url="../webgl-shadows-depth-texture.html"}}}

Это точно то же самое, что и верхний пример, за исключением того, что вместо
загрузки изображения мы генерируем текстуру глубины,
рендеря сцену в нее. Если вы хотите проверить, настройте `cameraX`
обратно на 2.5 и `fieldOfView` на 45, и это должно выглядеть так же,
как выше, за исключением того, что наша новая текстура глубины проецируется
вместо загруженного изображения.

Значения глубины идут от 0.0 до 1.0, представляя их позицию
через усеченную пирамиду, поэтому 0.0 (темный) близко к кончику
усеченной пирамиды, а 1.0 (светлый) на дальнем открытом конце.

Итак, все, что осталось сделать, это вместо выбора между нашим проецируемым
цветом текстуры и нашим маппированным цветом текстуры, мы можем использовать глубину из
текстуры глубины, чтобы проверить, является ли Z позиция из текстуры глубины
ближе или дальше от источника света, чем глубина пикселя, который мы
просим нарисовать. Если глубина из текстуры глубины ближе, то что-то
блокировало свет, и этот пиксель в тени.

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+  float currentDepth = projectedTexcoord.z;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = vec4(texture(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
+  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
+  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
-  outColor = mix(texColor, projectedTexColor, projectedAmount);
+  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

Выше, если `projectedDepth` меньше, чем `currentDepth`, то
с точки зрения источника света что-то было ближе к
источнику света, поэтому этот пиксель, который мы собираемся нарисовать, в тени.

Если мы запустим это, мы получим тень

{{{example url="../webgl-shadows-basic.html" }}}

Это как-то работает, мы можем видеть тень сферы на
земле, но что с этими странными узорами там, где
не должно быть тени? Эти узоры
называются *shadow acne*. Они происходят из того факта, что
данные глубины, сохраненные в текстуре глубины, были квантованы как в том,
что это текстура, сетка пикселей, она была спроецирована с
точки зрения источника света, но мы сравниваем ее со значениями с точки зрения камеры. Это означает, что сетка значений в
карте глубины не выровнена с нашей камерой, и
поэтому, когда мы вычисляем `currentDepth`, бывают времена, когда одно значение
будет немного больше или немного меньше, чем `projectedDepth`.

Давайте добавим смещение.

```glsl
...

+uniform float u_bias;

void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
-  float currentDepth = projectedTexcoord.z;
+  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

И нам нужно установить его

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
  fieldOfView: 120,
+  bias: -0.006,
};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo, /**/u_lightWorldPosition) {
  // Создаем матрицу вида из матрицы камеры.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // устанавливаем uniforms, которые одинаковы для сферы и плоскости
  // примечание: любые значения без соответствующего uniform в шейдере
  // игнорируются.
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
  });

  ...
```

{{{example url="../webgl-shadows-basic-w-bias.html"}}}

сдвиньте значение bias, и вы можете увидеть, как это влияет на то, когда и где
появляются узоры.

Чтобы приблизиться к завершению, давайте фактически добавим расчет прожекторного освещения
из [статьи о прожекторном освещении](webgl-3d-lighting-spot.html).

Сначала давайте вставим нужные части в вершинный шейдер напрямую
из [той статьи](webgl-3d-lighting-spot.html).

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
+in vec3 a_normal;

+uniform vec3 u_lightWorldPosition;
+uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
+out vec3 v_normal;

+out vec3 v_surfaceToLight;
+out vec3 v_surfaceToView;

void main() {
  // Умножаем позицию на матрицу.
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // Передаем координату текстуры в фрагментный шейдер.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

+  // ориентируем нормали и передаем в фрагментный шейдер
+  v_normal = mat3(u_world) * a_normal;
+
+  // вычисляем мировую позицию поверхности
+  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
+
+  // вычисляем вектор поверхности к источнику света
+  // и передаем его в фрагментный шейдер
+  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+
+  // вычисляем вектор поверхности к виду/камере
+  // и передаем его в фрагментный шейдер
+  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

Затем фрагментный шейдер

```glsl
#version 300 es
precision highp float;

// Передается из вершинного шейдера.
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;
+in vec3 v_normal;
+in vec3 v_surfaceToLight;
+in vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
+uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_innerLimit;          // в пространстве скалярного произведения
+uniform float u_outerLimit;          // в пространстве скалярного произведения

out vec4 outColor;

void main() {
+  // поскольку v_normal является varying, он интерполируется
+  // поэтому он не будет единичным вектором. Нормализация
+  // сделает его снова единичным вектором
+  vec3 normal = normalize(v_normal);
+
+  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
+  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
+  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
+
+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
+  float light = inLight * dot(normal, surfaceToLightDirection);
+  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // канал 'r' имеет значения глубины
  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
-  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
+  outColor = vec4(
+      texColor.rgb * light * shadowLight +
+      specular * shadowLight,
+      texColor.a);
}
```

Обратите внимание, что мы просто используем `shadowLight` для корректировки эффекта `light` и
`specular`. Если объект в тени, то света нет.

Нам просто нужно установить uniforms

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
+function drawScene(
+    projectionMatrix,
+    cameraMatrix,
+    textureMatrix,
+    lightWorldMatrix,
+    programInfo) {
  // Создаем матрицу вида из матрицы камеры.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // устанавливаем uniforms, которые одинаковы для сферы и плоскости
  // примечание: любые значения без соответствующего uniform в шейдере
  // игнорируются.
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
+    u_shininess: 150,
+    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
+    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
+    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
+    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
+    u_viewWorldPosition: cameraMatrix.slice(12, 15),
  });

...

function render() {
  ...

-  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);
+  drawScene(
+      lightProjectionMatrix,
+      lightWorldMatrix,
+      m4.identity(),
+      lightWorldMatrix,
+      colorProgramInfo);

  ...

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo);
+  drawScene(
+      projectionMatrix,
+      cameraMatrix,
+      textureMatrix,
+      lightWorldMatrix,
+      textureProgramInfo);

  ...
}
```

Чтобы пройтись по нескольким из этих настроек uniform. Напомним из [статьи о прожекторном освещении](webgl-3d-lighting-spot.html),
что настройки innerLimit и outerLimit находятся в пространстве скалярного произведения (пространство косинуса) и что
нам нужна только половина поля зрения, поскольку они простираются вокруг направления света.
Также напомним из [статьи о камере](webgl-3d-camera.html), что 3-я строка матрицы 4x4
является осью Z, поэтому извлечение первых 3 значений 3-й строки из `lightWorldMatrix`
дает нам направление -Z света. Мы хотим положительное направление, поэтому переворачиваем его.
Аналогично та же статья говорит нам, что 4-я строка - это мировая позиция, поэтому мы можем получить
lightWorldPosition и viewWorldPosition (также известную как мировая позиция камеры),
извлекая их из их соответствующих матриц. Конечно, мы могли бы также
получить их, раскрывая больше настроек или передавая больше переменных.

Давайте также очистим фон до черного и установим линии усеченной пирамиды в белый

```js
function render() {

  ...

  // теперь рисуем сцену на canvas, проецируя текстуру глубины в сцену
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // ------ Рисуем усеченную пирамиду ------
  {

    ...

          // Устанавливаем uniforms, которые мы только что вычислили
    twgl.setUniforms(colorProgramInfo, {
-      u_color: [0, 0, 0, 1],
+      u_color: [1, 1, 1, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,
    });
```

И теперь у нас есть прожекторное освещение с тенями.

{{{example url="../webgl-shadows-w-spot-light.html" }}}

Для направленного света мы скопируем код шейдера из
[статьи о направленном освещении](webgl-3d-lighting-directional.html)
и изменим нашу проекцию с перспективной на ортографическую.

Сначала вершинный шейдер

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
+in vec3 a_normal;

-uniform vec3 u_lightWorldPosition;
-uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
out vec3 v_normal;

-out vec3 v_surfaceToLight;
-out vec3 v_surfaceToView;

void main() {
  // Умножаем позицию на матрицу.
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // Передаем координату текстуры в фрагментный шейдер.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

  // ориентируем нормали и передаем в фрагментный шейдер
  v_normal = mat3(u_world) * a_normal;

-  // вычисляем мировую позицию поверхности
-  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
-
-  // вычисляем вектор поверхности к источнику света
-  // и передаем его в фрагментный шейдер
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
-
-  // вычисляем вектор поверхности к виду/камере
-  // и передаем его в фрагментный шейдер
-  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

Затем фрагментный шейдер

```glsl
#version 300 es
precision highp float;

// Передается из вершинного шейдера.
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;
in vec3 v_normal;
-in vec3 v_surfaceToLight;
-in vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
-uniform float u_shininess;
-uniform vec3 u_lightDirection;
-uniform float u_innerLimit;          // в пространстве скалярного произведения
-uniform float u_outerLimit;          // в пространстве скалярного произведения
+uniform vec3 u_reverseLightDirection;

out vec4 outColor;

void main() {
  // поскольку v_normal является varying, он интерполируется
  // поэтому он не будет единичным вектором. Нормализация
  // сделает его снова единичным вектором
  vec3 normal = normalize(v_normal);

+  float light = dot(normal, u_reverseLightDirection);

-  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
-
-  float dotFromDirection = dot(surfaceToLightDirection,
-                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
-  float light = inLight * dot(normal, surfaceToLightDirection);
-  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // канал 'r' имеет значения глубины
  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
  outColor = vec4(
-      texColor.rgb * light * shadowLight +
-      specular * shadowLight,
+      texColor.rgb * light * shadowLight,
      texColor.a);
}
```

и uniforms

```js
  // устанавливаем uniforms, которые одинаковы для сферы и плоскости
  // примечание: любые значения без соответствующего uniform в шейдере
  // игнорируются.
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
-    u_shininess: 150,
-    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
-    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
-    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
-    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
-    u_viewWorldPosition: cameraMatrix.slice(12, 15),
+    u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
  });
```

Я настроил камеру, чтобы видеть больше сцены.

{{{example url="../webgl-shadows-w-directional-light.html"}}}

Это указывает на что-то, что должно быть очевидно из кода выше, но наша
карта теней только такая большая, поэтому даже though вычисления направленного света
имеют только направление, нет позиции для самого света, мы все еще
должны выбрать позицию, чтобы решить область для вычисления и применения
карты теней.

Эта статья становится длинной, и есть еще много вещей для покрытия, связанных
с тенями, поэтому мы оставим остальное для [следующей статьи](webgl-shadows-continued.html). 