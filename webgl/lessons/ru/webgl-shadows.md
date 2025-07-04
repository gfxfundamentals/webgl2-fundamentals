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