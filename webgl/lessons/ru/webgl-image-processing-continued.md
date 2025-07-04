Title: WebGL2 Продвинутая обработка изображений
Description: Как применять несколько техник обработки изображений в WebGL
TOC: Продвинутая обработка изображений


Эта статья является продолжением [WebGL Обработка изображений](webgl-image-processing.html).
Если вы не читали её, советую [начать с неё](webgl-image-processing.html).

Следующий очевидный вопрос для обработки изображений — как применить несколько эффектов?

Можно попробовать генерировать шейдеры на лету. Сделать UI, который позволит
пользователю выбрать нужные эффекты, а затем сгенерировать шейдер, который выполнит
все эти эффекты. Это не всегда возможно, хотя такой подход часто используется для
[создания эффектов в реальном времени](https://www.youtube.com/watch?v=cQUn0Zeh-0Q).

Более гибкий способ — использовать ещё 2 *рабочие* текстуры и
рендерить поочередно в каждую из них, чередуя (ping-pong),
и каждый раз применять следующий эффект.

<blockquote><pre>Оригинальное изображение -&gt; [Blur]        -&gt; Текстура 1
Текстура 1              -&gt; [Sharpen]     -&gt; Текстура 2
Текстура 2              -&gt; [Edge Detect] -&gt; Текстура 1
Текстура 1              -&gt; [Blur]        -&gt; Текстура 2
Текстура 2              -&gt; [Normal]      -&gt; Canvas</pre></blockquote>

Для этого нам нужно создать framebuffer'ы. В WebGL и OpenGL framebuffer — не совсем удачное название. На самом деле framebuffer — это просто
список привязок (attachments), а не какой-то буфер. Но, привязывая текстуру к framebuffer'у, мы можем рендерить в эту текстуру.

Сначала превратим [старый код создания текстуры](webgl-image-processing.html) в функцию:

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Настраиваем текстуру так, чтобы можно было рендерить изображение любого размера и работать с пикселями.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // Создаём текстуру и кладём в неё изображение.
  var originalImageTexture = createAndSetupTexture(gl);

  // Загружаем изображение в текстуру.
  var mipLevel = 0;               // самый крупный mip
  var internalFormat = gl.RGBA;   // формат, который хотим в текстуре
  var srcFormat = gl.RGBA;        // формат исходных данных
  var srcType = gl.UNSIGNED_BYTE  // тип исходных данных
  gl.texImage2D(gl.TEXTURE_2D,
                mipLevel,
                internalFormat,
                srcFormat,
                srcType,
                image);
```

Теперь используем эту функцию, чтобы создать ещё 2 текстуры и привязать их к 2 framebuffer'ам.

```
  // создаём 2 текстуры и привязываем их к framebuffer'ам.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // делаем текстуру такого же размера, как изображение
    var mipLevel = 0;               // самый крупный mip
    var internalFormat = gl.RGBA;   // формат, который хотим в текстуре
    var border = 0;                 // должен быть 0
    var srcFormat = gl.RGBA;        // формат исходных данных
    var srcType = gl.UNSIGNED_BYTE  // тип исходных данных
    var data = null;                // нет данных = создаём пустую текстуру
    gl.texImage2D(
        gl.TEXTURE_2D, mipLevel, internalFormat, image.width, image.height, border,
        srcFormat, srcType, data);

    // Создаём framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Привязываем к нему текстуру.
    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }
```

Теперь создадим набор ядер (kernels), а затем список, какие из них применять.

```
  // Определяем несколько свёрточных ядер
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
  };

  // Список эффектов, которые нужно применить.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

И наконец применим каждый из них, чередуя, в какую текстуру рендерим

```
  function drawEffects() {
    // Говорим использовать нашу программу (пару шейдеров)
    gl.useProgram(program);

    // Привязываем нужный набор атрибутов/буферов.
    gl.bindVertexArray(vao);

    // начинаем с оригинального изображения на unit 0
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // Говорим шейдеру брать текстуру из texture unit 0
    gl.uniform1i(imageLocation, 0);

    // не переворачиваем изображение по Y при рендере в текстуры
    gl.uniform1f(flipYLocation, 1);

    // проходим по каждому эффекту, который хотим применить.
    var count = 0;
    for (var ii = 0; ii < tbody.rows.length; ++ii) {
      var checkbox = tbody.rows[ii].firstChild.firstChild;
      if (checkbox.checked) {
        // Настраиваем рендер в один из framebuffer'ов.
        setFramebuffer(framebuffers[count % 2], image.width, image.height);

        drawWithKernel(checkbox.value);

        // для следующего эффекта используем текстуру, в которую только что отрендерили.
        gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

        // увеличиваем count, чтобы в следующий раз использовать другую текстуру.
        ++count;
      }
    }

    // наконец рендерим результат на canvas.
    gl.uniform1f(flipYLocation, -1);  // нужно перевернуть по Y для canvas

    setFramebuffer(null, gl.canvas.width, gl.canvas.height);

    drawWithKernel("normal");
  }

  function setFramebuffer(fbo, width, height) {
    // делаем этот framebuffer текущим для рендера.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Говорим шейдеру разрешение framebuffer'а.
    gl.uniform2f(resolutionLocation, width, height);

    // Говорим WebGL, как преобразовывать из clip space в пиксели
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // задаём ядро и его вес
    gl.uniform1fv(kernelLocation, kernels[name]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

    // Рисуем прямоугольник.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
``` 