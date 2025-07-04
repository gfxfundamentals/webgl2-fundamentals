Title: Как использовать текстуры как данные
Description: Как использовать текстуры как данные
TOC: Как использовать текстуры как данные

## Вопрос:

Я изучал уроки по WebGL, такие как [webglfundamentals](https://webglfundamentals.org/), и столкнулся с проблемой — мне кажется, что мне нужно использовать текстуру, которую я создам, чтобы передавать информацию напрямую во фрагментный шейдер, но у меня не получается правильно индексировать текстуру.

Цель — передать информацию об источниках света (местоположение и цвет), которая будет учитываться при расчёте цвета фрагмента. В идеале эта информация должна быть динамической как по значению, так и по длине.

## Воспроизведение
Я создал упрощённую версию проблемы в этом fiddle: [WebGL - Data Texture Testing](https://jsfiddle.net/oclyke/muf0deoL/86/)

Вот часть кода.

В **одноразовой инициализации** мы создаём текстуру, заполняем её данными и применяем, как кажется, самые надёжные настройки (без mips, без проблем с упаковкой байтов[?])
```
  // lookup uniforms
  var textureLocation = gl.getUniformLocation(program, "u_texture");

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // fill texture with 1x3 pixels
  const level = 0;
  const internalFormat = gl.RGBA; // Я также пробовал gl.LUMINANCE
  //   но это сложнее отлаживать
  const width = 1;
  const height = 3;
  const border = 0;
  const type = gl.UNSIGNED_BYTE;
  const data = new Uint8Array([
    // R,   G,   B, A (не используется)    // : индекс 'texel' (?)
    64, 0, 0, 0, // : 0
    0, 128, 0, 0, // : 1
    0, 0, 255, 0, // : 2
  ]);
  const alignment = 1; // для этой текстуры не обязательно, но
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment); //   думаю, это не мешает
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
    internalFormat, type, data);

  // set the filtering so we don't need mips and it's not filtered
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

В **отрисовке** (которая происходит только один раз, но теоретически может повторяться) мы явно указываем программе использовать нашу текстуру
```
    // Сказать шейдеру использовать текстурный юнит 0 для u_texture
    gl.activeTexture(gl.TEXTURE0);     // добавил эту и следующую строку для уверенности...
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLocation, 0);
```

Наконец, во фрагментном шейдере мы просто пытаемся надёжно использовать один 'texel' для передачи информации. У меня не получается понять, как надёжно получить значения, которые я сохранил в текстуре.
```
precision mediump float;

// Текстура.
uniform sampler2D u_texture;

void main() {
    
    vec4 sample_00 = texture2D(u_texture, vec2(0, 0)); 
    // Этот сэмпл обычно правильный. 
    // Изменение данных для B-канала texel
    //   индекса 0, как ожидается, добавляет синий
    
    vec4 sample_01 = texture2D(u_texture, vec2(0, 1));
    vec4 sample_02 = texture2D(u_texture, vec2(0, 2));
    // Эти сэмплы, как я ожидал, должны работать, так как
    //   ширина текстуры установлена в 1
    // Почему-то 01 и 02 показывают один и тот же цвет
    
    vec4 sample_10 = texture2D(u_texture, vec2(1, 0));
    vec4 sample_20 = texture2D(u_texture, vec2(2, 0));
    // Эти сэмплы просто для теста — не думаю,
    //   что они должны работать
    
    // выбираем, какой сэмпл показать
    vec4 sample = sample_00;
    gl_FragColor = vec4(sample.x, sample.y, sample.z, 1);
}
```

## Вопрос(ы)

Является ли использование текстуры лучшим способом для этого? Я слышал, что можно передавать массивы векторов, но текстуры, кажется, более распространены.

Как правильно создавать текстуру? (особенно когда я указываю 'width' и 'height', я должен иметь в виду размеры texel или количество элементов gl.UNSIGNED_BYTE, которые я буду использовать для создания текстуры?? [документация texImage2D](https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glTexImage2D.xml))

Как правильно индексировать текстуру во фрагментном шейдере, если не использовать 'varying' типы? (т.е. я просто хочу получить значение одного или нескольких конкретных texel — без интерполяции [почти не связано с вершинами])

### Другие ресурсы
Я прочитал всё, что мог на эту тему. Вот не полный список:

* JMI Madison утверждает, что разобрался, но [решение](https://stackoverflow.com/questions/34873832/webgl-fragment-shader-pass-array) утопает в проектном коде
* [webglfundamentals](https://webglfundamentals.org/) почти подходит — [пример с 3x2 data texture](https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html) — но там используется интерполяция и это не совсем мой случай
* Вот кто-то обсуждает [попытку использовать массивы vec3](https://community.khronos.org/t/passing-array-of-vec3-to-fragment-shader/74450)
* И конечно я сравнивал с документацией OpenGL ([texImage2D](https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glTexImage2D.xml) и [texture2d](https://thebookofshaders.com/glossary/?search=texture2D))

**Edit** Вот ещё ресурс: [Hassles with array access in WebGL, and a couple of workarounds](https://www.john-smith.me/hassles-with-array-access-in-webgl-and-a-couple-of-workarounds.html). Обнадёживает.

Это меня очень беспокоит.

Спасибо заранее!

## Ответ:

Обращение к отдельным пикселям текстуры в WebGL1 использует такую формулу

```
vec2 pixelCoord = vec2(x, y);
vec2 textureDimension = vec2(textureWidth, textureHeight)
vec2 texcoord = (pixelCoord + 0.5) / textureDimensions;
vec4 pixelValue = texture2D(someSamplerUniform, texcoord);
```

Потому что текстурные координаты считаются по краям. Если у вас текстура 2x1

```
1.0+-------+-------+
   |       |       |
   |   A   |   B   |
   |       |       |
0.0+-------+-------+
  0.0     0.5     1.0
```

Текстурная координата в центре пикселя A = 0.25, 0.5. В центре пикселя B = 0.75, 0.5

Если не использовать формулу выше, а просто pixelCoord / textureDimensions, то вы попадёте между пикселями, и из-за ошибок округления получите не тот пиксель.

Конечно, если вы используете текстуры для данных, вам также нужно установить фильтрацию `gl.NEAREST`.

В WebGL2 можно просто использовать `texelFetch`

```
ivec2 pixelCoord = ivec2(x, y);
int mipLevel = 0;
vec4 pixelValue = texelFetch(someSamplerUniform, texcoord, mipLevel);
```

Рабочий пример использования текстур для данных: [здесь](https://webglfundamentals.org/webgl/lessons/webgl-pulling-vertices.html)

> Является ли использование текстуры лучшим способом для этого? Я слышал, что можно передавать массивы векторов, но текстуры, кажется, более распространены.

Для чего? Не совсем понятно, что вы хотите сделать. Каждый пиксель будет иметь свой источник света?

> Как правильно создавать текстуру? (особенно когда я указываю 'width' и 'height', я должен иметь в виду размеры texel или количество элементов gl.UNSIGNED_BYTE, которые я буду использовать для создания текстуры?? документация texImage2D)

Делайте так, как проще или как требуется. Например, если у вас 5 данных на объект, я бы поместил каждое значение на отдельную строку текстуры. Тогда можно сделать

```
vec4 datum1 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY0));
vec4 datum2 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY1));
vec4 datum3 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY2));
vec4 datum4 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY3));
```

Где indexTexCoordX и rowTexCoordY0-3 вычисляются по формуле выше. rowTexCoordY0-3 могут быть даже константами.

У текстур есть ограничения по размеру, так что если данных больше, чем помещается в одном измерении, придётся упаковывать плотнее и делать больше вычислений для извлечения.

Имейте в виду, что у текстур есть кэш, поэтому желательно, чтобы данные, которые вы извлекаете, были рядом с теми, что вы извлекали до этого. Если вы каждый раз прыгаете по текстуре за следующим значением, производительность упадёт (хотя всё равно может быть быстрее других решений, в зависимости от задачи).

> Как правильно индексировать текстуру во фрагментном шейдере, если не использовать 'varying' типы? (т.е. я просто хочу получить значение одного или нескольких конкретных texel — без интерполяции [почти не связано с вершинами])

Единственные изменяемые входы во фрагментный шейдер — varyings, `gl_FragCoord` (координата пикселя, в который пишется) и `gl_PointCoord`, доступен только при рисовании `POINTS`. Так что нужно использовать один из них, иначе все остальные значения будут одинаковы для всех пикселей.


<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/8662931">oclyke</a>
    из
    <a data-href="https://stackoverflow.com/questions/60614318">здесь</a>
  </div>
</div> 