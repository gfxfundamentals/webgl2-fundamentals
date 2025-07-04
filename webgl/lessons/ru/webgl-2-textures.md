Title: WebGL2 Использование 2 или более текстур
Description: Как использовать 2 или более текстур в WebGL
TOC: Использование 2 или более текстур


Эта статья является продолжением [Обработки изображений в WebGL](webgl-image-processing.html).
Если вы не читали её, я рекомендую [начать оттуда](webgl-image-processing.html).

Теперь самое время ответить на вопрос: "Как использовать 2 или более текстур?"

Это довольно просто. Давайте [вернемся на несколько уроков назад к нашему
первому шейдеру, который рисует одно изображение](webgl-image-processing.html) и обновим его для 2 изображений.

Первое, что нам нужно сделать - это изменить наш код, чтобы мы могли загрузить 2 изображения. Это не
действительно WebGL вещь, это HTML5 JavaScript вещь, но мы можем с этим справиться.
Изображения загружаются асинхронно, что может потребовать некоторого привыкания, если вы не
начинали с веб-программирования.

Есть в основном 2 способа, которыми мы могли бы это обработать. Мы могли бы попытаться структурировать наш код
так, чтобы он работал без текстур, и по мере загрузки текстур программа обновлялась.
Мы сохраним этот метод для более поздней статьи.

В данном случае мы будем ждать загрузки всех изображений перед тем, как что-либо рисовать.

Сначала давайте изменим код, который загружает изображение, в функцию. Это довольно просто.
Он создает новый объект `Image`, устанавливает URL для загрузки и устанавливает обратный вызов,
который будет вызван, когда изображение закончит загружаться.

```js
function loadImage (url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
```

Теперь давайте создадим функцию, которая загружает массив URL и генерирует массив изображений.
Сначала мы устанавливаем `imagesToLoad` равным количеству изображений, которые мы собираемся загрузить. Затем мы делаем
обратный вызов, который мы передаем в `loadImage`, уменьшаем `imagesToLoad`. Когда `imagesToLoad` становится
равным 0, все изображения загружены, и мы передаем массив изображений в обратный вызов.

```js
function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // Вызывается каждый раз, когда изображение заканчивает загружаться.
  var onImageLoad = function() {
    --imagesToLoad;
    // Если все изображения загружены, вызываем обратный вызов.
    if (imagesToLoad === 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}
```

Теперь мы вызываем loadImages так:

```js
function main() {
  loadImages([
    "resources/leaves.jpg",
    "resources/star.jpg",
  ], render);
}
```

Далее мы изменяем шейдер для использования 2 текстур. В данном случае мы будем умножать одну текстуру на другую.

```
#version 300 es
precision highp float;

// наши текстуры
*uniform sampler2D u_image0;
*uniform sampler2D u_image1;

// координаты текстуры, переданные из вершинного шейдера.
in vec2 v_texCoord;

// нам нужно объявить выход для фрагментного шейдера
out vec2 outColor;

void main() {
*   vec4 color0 = texture2D(u_image0, v_texCoord);
*   vec4 color1 = texture2D(u_image1, v_texCoord);
*   outColor = color0 * color1;
}
```

Нам нужно создать 2 WebGL объекта текстур.

```js
  // создаем 2 текстуры
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Устанавливаем параметры, чтобы нам не нужны были мипы
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Загружаем изображение в текстуру.
    var mipLevel = 0;               // самый большой мип
    var internalFormat = gl.RGBA;   // формат, который мы хотим в текстуре
    var srcFormat = gl.RGBA;        // формат данных, которые мы поставляем
    var srcType = gl.UNSIGNED_BYTE; // тип данных, которые мы поставляем
    gl.texImage2D(gl.TEXTURE_2D,
                  mipLevel,
                  internalFormat,
                  srcFormat,
                  srcType,
                  images[ii]);

    // добавляем текстуру в массив текстур.
    textures.push(texture);
  }
```

WebGL имеет что-то, называемое "блоками текстур". Вы можете думать об этом как о массиве ссылок
на текстуры. Вы говорите шейдеру, какой блок текстуры использовать для каждого сэмплера.

```js
  // ищем местоположения сэмплеров.
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  ...

  // устанавливаем, какие блоки текстур использовать для рендеринга.
  gl.uniform1i(u_image0Location, 0);  // блок текстуры 0
  gl.uniform1i(u_image1Location, 1);  // блок текстуры 1
```

Затем мы должны привязать текстуру к каждому из этих блоков текстур.

```js
  // Устанавливаем каждый блок текстуры для использования определенной текстуры.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

2 изображения, которые мы загружаем, выглядят так:

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; }</style>
<div class="glocal-center"><table class="glocal-center-content"><tr><td><img src="../resources/leaves.jpg" /> <img src="../resources/star.jpg" /></td></tr></table></div>

И вот результат, если мы умножим их вместе, используя WebGL.

{{{example url="../webgl-2-textures.html" }}}

Некоторые вещи, которые я должен разобрать.

Простой способ думать о блоках текстур - это что-то вроде этого: Все функции текстур
работают с "активным блоком текстуры". "Активный блок текстуры" - это просто глобальная переменная,
которая является индексом блока текстуры, с которым вы хотите работать. Каждый блок текстуры в WebGL2 имеет 4 цели.
Цель TEXTURE_2D, цель TEXTURE_3D, цель TEXTURE_2D_ARRAY и цель TEXTURE_CUBE_MAP.
Каждая функция текстуры работает с указанной целью на текущем активном блоке текстуры.
Если бы вы реализовали WebGL в JavaScript, это выглядело бы примерно так:

```js
var getContext = function() {
  var textureUnits = [
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
  ];
  var activeTextureUnit = 0;

  var activeTexture = function(unit) {
    // конвертируем enum блока в индекс.
    var index = unit - gl.TEXTURE0;
    // Устанавливаем активный блок текстуры
    activeTextureUnit = index;
  };

  var bindTexture = function(target, texture) {
    // Устанавливаем текстуру для цели активного блока текстуры.
    textureUnits[activeTextureUnit][target] = texture;
  };

  var texImage2D = function(target, ...args) {
    // Вызываем texImage2D на текущей текстуре активного блока текстуры
    var texture = textureUnits[activeTextureUnit][target];
    texture.image2D(...args);
  };

  var texImage3D = function(target, ...args) {
    // Вызываем texImage3D на текущей текстуре активного блока текстуры
    var texture = textureUnits[activeTextureUnit][target];
    texture.image3D(...args);
  };

  // возвращаем WebGL API
  return {
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    texImage2D: texImage2D,
    texImage3D: texImage3D,
  };
};
```

Шейдеры принимают индексы в блоки текстур. Надеюсь, это делает эти 2 строки более ясными.

```js
  gl.uniform1i(u_image0Location, 0);  // блок текстуры 0
  gl.uniform1i(u_image1Location, 1);  // блок текстуры 1
```

Одна вещь, о которой нужно знать: при установке uniform'ов вы используете индексы для блоков текстур,
но при вызове gl.activeTexture вы должны передать специальные константы gl.TEXTURE0, gl.TEXTURE1 и т.д.
К счастью, константы последовательные, поэтому вместо этого:

```js
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

Мы могли бы сделать это:

```js
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

или это:

```js
  for (var ii = 0; ii < 2; ++ii) {
    gl.activeTexture(gl.TEXTURE0 + ii);
    gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
  }
```

Надеюсь, этот небольшой шаг помогает объяснить, как использовать несколько текстур в одном вызове отрисовки в WebGL. 