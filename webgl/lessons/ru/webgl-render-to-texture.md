Title: WebGL2 Рендеринг в текстуру
Description: Как рендерить в текстуру.
TOC: Рендеринг в текстуру

Этот пост является продолжением серии постов о WebGL2.
Первый [начинался с основ](webgl-fundamentals.html) и
предыдущий был о [предоставлении данных текстурам](webgl-data-textures.html).
Если вы не читали их, пожалуйста, просмотрите их сначала.

В последнем посте мы рассмотрели, как предоставлять данные из JavaScript в текстуры.
В этой статье мы будем рендерить в текстуры, используя WebGL2. Обратите внимание, что эта тема
была кратко рассмотрена в [обработке изображений](webgl-image-processing-continued.html), но
давайте рассмотрим ее более подробно.

Рендеринг в текстуру довольно прост. Мы создаем текстуру определенного размера

    // создаем для рендеринга
    const targetTextureWidth = 256;
    const targetTextureHeight = 256;
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    {
      // определяем размер и формат уровня 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);

      // устанавливаем фильтрацию, чтобы нам не нужны были мипмапы
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

Обратите внимание, как `data` равен `null`. Нам не нужно предоставлять никаких данных. Нам просто нужно, чтобы WebGL
выделил текстуру.

Далее мы создаем framebuffer. [Framebuffer - это просто коллекция вложений](webgl-framebuffers.html). Вложения
- это либо текстуры, либо renderbuffer. Мы уже рассматривали текстуры. Renderbuffer очень похож
на текстуры, но они поддерживают форматы и опции, которые текстуры не поддерживают. Также, в отличие от текстуры,
вы не можете напрямую использовать renderbuffer как вход для шейдера.

Давайте создадим framebuffer и прикрепим нашу текстуру

    // Создаем и привязываем framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // прикрепляем текстуру как первое цветовое вложение
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

Так же, как текстуры и буферы, после создания framebuffer нам нужно
привязать его к точке привязки `FRAMEBUFFER`. После этого все функции, связанные с
framebuffer, ссылаются на любой framebuffer, который привязан там.

С нашим привязанным framebuffer, каждый раз, когда мы вызываем `gl.clear`, `gl.drawArrays` или `gl.drawElements`, WebGL
будет рендерить в нашу текстуру вместо холста.

Давайте возьмем наш предыдущий код рендеринга и сделаем его функцией, чтобы мы могли вызывать его дважды.
Один раз для рендеринга в текстуру и снова для рендеринга в холст.

```
function drawCube(aspect) {
  // Говорим использовать нашу программу (пару шейдеров)
  gl.useProgram(program);

  // Привязываем набор атрибутов/буферов, который мы хотим.
  gl.bindVertexArray(vao);

  // Вычисляем матрицу проекции
  -  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 0, 2];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // Вычисляем матрицу камеры, используя look at.
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // Создаем матрицу вида из матрицы камеры.
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
  matrix = m4.yRotate(matrix, modelYRotationRadians);

  // Устанавливаем матрицу.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // Говорим шейдеру использовать текстуру unit 0 для u_texture
  gl.uniform1i(textureLocation, 0);

  // Рисуем геометрию.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6 * 6;
  gl.drawArrays(primitiveType, offset, count);
}
```

Обратите внимание, что нам нужно передать `aspect` для вычисления нашей матрицы проекции,
потому что наша целевая текстура имеет другой аспект, чем камера.

Вот как мы вызываем это

```
// Рисуем сцену.
function drawScene(time) {

  ...

  {
    // рендерим в наш targetTexture, привязывая framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // рендерим куб с нашей текстурой 3x2
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Говорим WebGL, как конвертировать из пространства отсечения в пиксели
    gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

    // Очищаем холст И буфер глубины.
    gl.clearColor(0, 0, 1, 1);   // очищаем до синего
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = targetTextureWidth / targetTextureHeight;
    drawCube(aspect)
  }

  {
    // рендерим в холст
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // рендерим куб с текстурой, в которую мы только что рендерили
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    // Говорим WebGL, как конвертировать из пространства отсечения в пиксели
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Очищаем холст И буфер глубины.
    gl.clearColor(1, 1, 1, 1);   // очищаем до белого
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    drawCube(aspect)
  }

  requestAnimationFrame(drawScene);
}
```

И вот результат

{{{example url="../webgl-render-to-texture.html" }}}

**КРАЙНЕ ВАЖНО** помнить о вызове `gl.viewport` и установке его в
размер того, во что вы рендерите. В этом случае первый раз мы
рендерим в текстуру, поэтому мы устанавливаем viewport, чтобы покрыть текстуру. Второй
раз мы рендерим в холст, поэтому мы устанавливаем viewport, чтобы покрыть холст.

Аналогично, когда мы вычисляем матрицу проекции,
нам нужно использовать правильный аспект для того, во что мы рендерим. Я потерял бесчисленные
часы отладки, задаваясь вопросом, почему что-то рендерится забавно или не рендерится
совсем, только чтобы в конечном итоге обнаружить, что я забыл один или оба вызова `gl.viewport`
и вычисление правильного аспекта. Это так легко забыть, что теперь я стараюсь никогда не вызывать
`gl.bindFramebuffer` в своем коде напрямую. Вместо этого я делаю функцию, которая делает и то, и другое,
что-то вроде

    function bindFramebufferAndSetViewport(fb, width, height) {
       gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
       gl.viewport(0, 0, width, height);
    }

И тогда я использую только эту функцию для изменения того, во что я рендерю. Таким образом я не забуду.

Одна вещь, которую нужно заметить, это то, что у нас нет буфера глубины на нашем framebuffer. У нас есть только текстура.
Это означает, что нет тестирования глубины и 3D не будет работать. Если мы нарисуем 3 куба, мы можем увидеть это.

{{{example url="../webgl-render-to-texture-3-cubes-no-depth-buffer.html" }}}

Если вы посмотрите на центральный куб, вы увидите, что 3 вертикальных куба рисуются на нем, один сзади, один в середине
и еще один спереди, но мы рисуем все 3 на одной глубине. Глядя на 3 горизонтальных куба,
нарисованных на холсте, вы заметите, что они правильно пересекают друг друга. Это потому, что наш framebuffer
не имеет буфера глубины, но наш холст имеет.

<img class="webgl_center" src="resources/cubes-without-depth-buffer.jpg" width="100%" height="100%" />

Чтобы добавить буфер глубины, мы создаем текстуру глубины и прикрепляем ее к нашему framebuffer.

```
// создаем текстуру глубины
const depthTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, depthTexture);

// делаем буфер глубины того же размера, что и targetTexture
{
  // определяем размер и формат уровня 0
  const level = 0;
  const internalFormat = gl.DEPTH_COMPONENT24;
  const border = 0;
  const format = gl.DEPTH_COMPONENT;
  const type = gl.UNSIGNED_INT;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);

  // устанавливаем фильтрацию, чтобы нам не нужны были мипмапы
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // прикрепляем текстуру глубины к framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);
}
```

И с этим вот результат.

{{{example url="../webgl-render-to-texture-3-cubes-with-depth-buffer.html" }}}

Теперь, когда у нас есть буфер глубины, прикрепленный к нашему framebuffer, внутренние кубы правильно пересекаются.

<img class="webgl_center" src="resources/cubes-with-depth-buffer.jpg" width="100%" height="100%" />

Важно отметить, что WebGL гарантирует работу только определенных комбинаций вложений.
[Согласно спецификации](https://www.khronos.org/registry/webgl/specs/latest/1.0/#FBO_ATTACHMENTS)
единственные гарантированные комбинации вложений:

* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` текстура
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` текстура + `DEPTH_ATTACHMENT` = `DEPTH_COMPONENT16` renderbuffer
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` текстура + `DEPTH_STENCIL_ATTACHMENT` = `DEPTH_STENCIL` renderbuffer

Для любых других комбинаций вы должны проверить, поддерживает ли система/GPU/драйвер/браузер пользователя эту комбинацию.
Чтобы проверить, вы создаете свой framebuffer, создаете и прикрепляете вложения, затем вызываете

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

Если статус `FRAMEBUFFER_COMPLETE`, то эта комбинация вложений работает для этого пользователя.
В противном случае она не работает, и вам придется сделать что-то еще, например, сказать пользователю, что ему не повезло,
или переключиться на какой-то другой метод.

Если вы еще не проверили [упрощение WebGL с меньшим количеством кода больше веселья](webgl-less-code-more-fun.html).

<div class="webgl_bottombar">
<h3>Сам Canvas на самом деле является текстурой</h3>
<p>
Это просто мелочь, но браузеры используют техники выше для реализации самого canvas.
За кулисами они создают цветную текстуру, буфер глубины, framebuffer, а затем они
привязывают его как текущий framebuffer. Вы делаете свой рендеринг, который рисует в эту текстуру.
Они затем используют эту текстуру для рендеринга вашего canvas в веб-страницу.
</p>
</div>

```
// создаем текстуру глубины
const depthTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, depthTexture);

// делаем буфер глубины того же размера, что и targetTexture
{
  // определяем размер и формат уровня 0
  const level = 0;
  const internalFormat = gl.DEPTH_COMPONENT24;
  const border = 0;
  const format = gl.DEPTH_COMPONENT;
  const type = gl.UNSIGNED_INT;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);

  // устанавливаем фильтрацию, чтобы нам не нужны были мипмапы
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // прикрепляем текстуру глубины к framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);
}
```

И с этим вот результат.

{{{example url="../webgl-render-to-texture-3-cubes-with-depth-buffer.html" }}}

Теперь, когда у нас есть буфер глубины, прикрепленный к нашему framebuffer, внутренние кубы правильно пересекаются.

<img class="webgl_center" src="resources/cubes-with-depth-buffer.jpg" width="100%" height="100%" />

Важно отметить, что WebGL гарантирует работу только определенных комбинаций вложений.
[Согласно спецификации](https://www.khronos.org/registry/webgl/specs/latest/1.0/#FBO_ATTACHMENTS)
единственные гарантированные комбинации вложений:

* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` текстура
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` текстура + `DEPTH_ATTACHMENT` = `DEPTH_COMPONENT16` renderbuffer
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` текстура + `DEPTH_STENCIL_ATTACHMENT` = `DEPTH_STENCIL` renderbuffer

Для любых других комбинаций вы должны проверить, поддерживает ли система/GPU/драйвер/браузер пользователя эту комбинацию.
Для проверки вы создаете свой framebuffer, создаете и прикрепляете вложения, затем вызываете

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

Если статус `FRAMEBUFFER_COMPLETE`, то эта комбинация вложений работает для этого пользователя.
В противном случае она не работает, и вам придется сделать что-то еще, например, сказать пользователю, что ему не повезло,
или переключиться на какой-то другой метод.

Если вы еще не ознакомились с [упрощением WebGL с меньше кода больше веселья](webgl-less-code-more-fun.html).

<div class="webgl_bottombar">
<h3>Canvas сам по себе на самом деле текстура</h3>
<p>
Это просто мелочь, но браузеры используют техники выше для реализации самого canvas.
За кулисами они создают цветную текстуру, буфер глубины, framebuffer, а затем они
привязывают его как текущий framebuffer. Вы делаете свой рендеринг, который рисует в эту текстуру.
Они затем используют эту текстуру для рендеринга вашего canvas в веб-страницу.
</p>
</div> 