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
+  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
``` 