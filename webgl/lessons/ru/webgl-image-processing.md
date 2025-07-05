Title: WebGL2 Обработка изображений
Description: Как обрабатывать изображения в WebGL
TOC: Обработка изображений


Обработка изображений в WebGL — это просто. Насколько просто? Читайте ниже.

Это продолжение [WebGL2 Основы](webgl-fundamentals.html).
Если вы не читали её, советую [начать с неё](webgl-fundamentals.html).

Чтобы рисовать изображения в WebGL, нам нужно использовать текстуры. Аналогично тому,
как WebGL ожидает координаты clip space при рендеринге вместо пикселей,
WebGL обычно ожидает координаты текстуры при чтении текстуры.
Координаты текстуры идут от 0.0 до 1.0 независимо от размеров текстуры.

WebGL2 добавляет возможность читать текстуру с помощью пиксельных координат.
Какой способ лучше — решать вам. Мне кажется, чаще используют
координаты текстуры, чем пиксельные координаты.

Поскольку мы рисуем всего один прямоугольник (точнее, 2 треугольника),
нам нужно сообщить WebGL, какое место в текстуре соответствует каждой точке
прямоугольника. Мы передадим эту информацию из вершинного шейдера во фрагментный
с помощью специальной переменной, называемой 'varying'. Она так называется,
потому что её значение меняется. [WebGL будет интерполировать значения](webgl-how-it-works.html),
которые мы задаём в вершинном шейдере, когда будет рисовать каждый пиксель во фрагментном шейдере.

Используя [вершинный шейдер из конца предыдущей статьи](webgl-fundamentals.html),
нам нужно добавить атрибут для передачи координат текстуры и затем передать их во фрагментный шейдер.

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // передаём texCoord во фрагментный шейдер
    +   // GPU будет интерполировать это значение между точками
    +   v_texCoord = a_texCoord;
    }

Теперь напишем фрагментный шейдер, который берёт цвет из текстуры.

    #version 300 es
    precision highp float;

    // наша текстура
    uniform sampler2D u_image;

    // координаты текстуры, переданные из вершинного шейдера
    in vec2 v_texCoord;

    // объявляем выход для фрагментного шейдера
    out vec4 outColor;

    void main() {
       // Берём цвет из текстуры
       outColor = texture(u_image, v_texCoord);
    }

Далее нам нужно загрузить изображение, создать текстуру и скопировать изображение
в текстуру. Поскольку мы в браузере, изображения загружаются асинхронно,
поэтому нужно немного изменить код, чтобы дождаться загрузки текстуры.
Когда она загрузится, мы нарисуем её.

    +function main() {
    +  var image = new Image();
    +  image.src = "https://someimage/on/our/server";  // ДОЛЖНО БЫТЬ НА ТОМ ЖЕ ДОМЕНЕ!!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // получаем, куда нужно положить данные вершин
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // получаем uniform'ы
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // задаём координаты текстуры для прямоугольника
    +  var texCoordBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    +      0.0,  0.0,
    +      1.0,  0.0,
    +      0.0,  1.0,
    +      0.0,  1.0,
    +      1.0,  0.0,
    +      1.0,  1.0]), gl.STATIC_DRAW);
    +  gl.enableVertexAttribArray(texCoordAttributeLocation);
    +  var size = 2;          // 2 компонента на итерацию
    +  var type = gl.FLOAT;   // данные — 32-битные float'ы
    +  var normalize = false; // не нормализуем данные
    +  var stride = 0;        // 0 = переходить на size * sizeof(type) байт для следующей позиции
    +  var offset = 0;        // начинать с начала буфера
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // Создаём текстуру.
    +  var texture = gl.createTexture();
    +
    +  // делаем unit 0 активным текстурным юнитом
    +  // (т.е. все команды текстур будут влиять на него)
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // Привязываем текстуру к 2D bind point текстурного юнита 0
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // Задаём параметры, чтобы не было mip-уровней, не было фильтрации
    +  // и не было повторения
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // Загружаем изображение в текстуру.
    +  var mipLevel = 0;               // самый крупный mip
    +  var internalFormat = gl.RGBA;   // формат, который хотим в текстуре
    +  var srcFormat = gl.RGBA;        // формат исходных данных
    +  var srcType = gl.UNSIGNED_BYTE  // тип исходных данных
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // Говорим использовать нашу программу (пару шейдеров)
      gl.useProgram(program);

      // Передаём разрешение canvas, чтобы можно было преобразовать
      // пиксели в clip space в шейдере
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // Говорим шейдеру брать текстуру из texture unit 0
    +  gl.uniform1i(imageLocation, 0);

    +  // Привязываем буфер позиций, чтобы gl.bufferData, который будет вызван
    +  // в setRectangle, положил данные в буфер позиций
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // Задаём прямоугольник такого же размера, как изображение.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

Вот изображение, отрендеренное в WebGL.

{{{example url="../webgl-2d-image.html" }}}

Пока не очень интересно, давайте изменим изображение. Например, поменяем местами красный и синий:

    ...
    outColor = texture(u_image, v_texCoord).bgra;
    ...

Теперь красный и синий поменялись местами.

{{{example url="../webgl-2d-image-red2blue.html" }}}

А если мы хотим обработку, которая смотрит на соседние пиксели? Поскольку WebGL оперирует координатами текстуры от 0.0 до 1.0, мы можем вычислить смещение на 1 пиксель так: <code>onePixel = 1.0 / textureSize</code>.

Вот фрагментный шейдер, который усредняет левый и правый пиксели для каждого пикселя текстуры:

```
#version 300 es

// фрагментные шейдеры не имеют точности по умолчанию, поэтому нужно
// выбрать одну. highp — хороший выбор по умолчанию. Это "высокая точность"
precision highp float;

// наша текстура
uniform sampler2D u_image;

// координаты текстуры, переданные из вершинного шейдера
in vec2 v_texCoord;

// объявляем выход для фрагментного шейдера
out vec4 outColor;

void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

  // усредняем левый, средний и правый пиксели
  outColor = (
      texture(u_image, v_texCoord) +
      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
```

Сравните с неразмытым изображением выше.

{{{example url="../webgl-2d-image-blend.html" }}}

Теперь, когда мы знаем, как ссылаться на другие пиксели, давайте используем свёрточное ядро
для выполнения множества распространённых операций обработки изображений. В этом случае мы будем использовать ядро 3x3.
Свёрточное ядро — это просто матрица 3x3, где каждый элемент матрицы представляет
насколько умножить 8 пикселей вокруг пикселя, который мы рендерим. Затем мы
делим результат на вес ядра (сумма всех значений в ядре)
или 1.0, в зависимости от того, что больше. [Вот довольно хорошая статья об этом](https://docs.gimp.org/2.6/en/plug-in-convmatrix.html).
И [вот ещё одна статья, показывающая реальный код, если бы
вы писали это вручную на C++](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

В нашем случае мы будем делать эту работу в шейдере, так что вот новый фрагментный шейдер:

```
#version 300 es

// фрагментные шейдеры не имеют точности по умолчанию, поэтому нужно
// выбрать одну. highp — хороший выбор по умолчанию. Это "высокая точность"
precision highp float;

// наша текстура
uniform sampler2D u_image;

// данные свёрточного ядра
uniform float u_kernel[9];
uniform float u_kernelWeight;

// координаты текстуры, переданные из вершинного шейдера
in vec2 v_texCoord;

// объявляем выход для фрагментного шейдера
out vec4 outColor;

void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

  vec4 colorSum =
      texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
      texture(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
      texture(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
  outColor = vec4((colorSum / u_kernelWeight).rgb, 1);
}
```

В JavaScript нам нужно предоставить свёрточное ядро и его вес:

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];

     // задаём ядро и его вес
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

И вуаля... Используйте выпадающий список для выбора разных ядер.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

Я надеюсь, что эта статья убедила вас, что обработка изображений в WebGL довольно проста. Далее
я расскажу [как применить более одного эффекта к изображению](webgl-image-processing-continued.html).

<div class="webgl_bottombar">
<h3>Что такое текстурные юниты?</h3>
Когда вы вызываете <code>gl.draw???</code> ваш шейдер может ссылаться на текстуры. Текстуры привязаны
к текстурным юнитам. Хотя машина пользователя может поддерживать больше, все реализации WebGL2
обязаны поддерживать как минимум 16 текстурных юнитов. К какому текстурному юниту ссылается каждый sampler uniform,
устанавливается путём поиска местоположения этого sampler uniform и затем установки
индекса текстурного юнита, на который вы хотите, чтобы он ссылался.

Например:
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // используем текстурный юнит 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

Чтобы установить текстуры на разных юнитах, вы вызываете gl.activeTexture и затем привязываете текстуру, которую хотите на этом юните. Пример:

<pre class="prettyprint showlinemods">
// Привязываем someTexture к текстурному юниту 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

Это тоже работает:

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // используем текстурный юнит 6.
// Привязываем someTexture к текстурному юниту 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>Что означают префиксы a_, u_, и v_ перед переменными в GLSL?</h3>
<p>
Это просто соглашение об именовании. Они не обязательны, но для меня это делает легче увидеть с первого взгляда,
откуда приходят значения. a_ для атрибутов, которые являются данными, предоставленными буферами. u_ для uniform'ов,
которые являются входами в шейдеры, v_ для varying'ов, которые являются значениями, переданными из вершинного шейдера во
фрагментный шейдер и интерполированными (или изменёнными) между вершинами для каждого нарисованного пикселя.
Смотрите <a href="webgl-how-it-works.html">Как это работает</a> для более подробной информации.
</p>
</div> 