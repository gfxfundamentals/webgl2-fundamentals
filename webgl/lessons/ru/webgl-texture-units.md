Title: Текстурные юниты в WebGL2
Description: Что такое текстурные юниты в WebGL?
TOC: Текстурные юниты

Эта статья поможет вам представить, как устроены текстурные юниты в WebGL. Есть [похожая статья про атрибуты](webgl-attributes.html).

В качестве подготовки рекомендуется прочитать [Как работает WebGL](webgl-how-it-works.html),
[WebGL: шейдеры и GLSL](webgl-shaders-and-glsl.html),
а также [WebGL: текстуры](webgl-3d-textures.html).

## Текстурные юниты

В WebGL есть текстуры. Текстуры — это двумерные массивы данных, которые можно передавать в шейдер. В шейдере объявляется *uniform sampler* примерно так:

```glsl
uniform sampler2D someTexture;
```

Но как шейдер узнаёт, какую текстуру использовать для `someTexture`?

Здесь и появляются текстурные юниты. Текстурные юниты — это **глобальный массив** ссылок на текстуры. Можно представить, что если бы WebGL был написан на JavaScript, глобальное состояние выглядело бы так:

```js
const gl = {
  activeTextureUnit: 0,
  textureUnits: [
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
  ];
}
```

Как видно, `textureUnits` — это массив. Вы присваиваете текстуру одной из *точек привязки* (bind points) в этом массиве текстурных юнитов. Например, назначим `ourTexture` в текстурный юнит 5:

```js
// при инициализации
const ourTexture = gl.createTexture();
// здесь код инициализации текстуры

...

// при рендере
const indexOfTextureUnit = 5;
gl.activeTexture(gl.TEXTURE0 + indexOfTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, ourTexture);
```

Затем вы сообщаете шейдеру, к какому юниту привязана текстура, вызвав:

```js
gl.uniform1i(someTextureUniformLocation, indexOfTextureUnit);
```

Если бы функции `activeTexture` и `bindTexture` WebGL были реализованы на JavaScript, они выглядели бы примерно так:

```js
// ПСЕВДОКОД!!!
gl.activeTexture = function(unit) {
  gl.activeTextureUnit = unit - gl.TEXTURE0;  // переводим в индекс с нуля
};

gl.bindTexture = function(target, texture) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  textureUnit[target] = texture;
};
```

Можно представить, как работают и другие функции для текстур. Все они принимают `target`, например `gl.texImage2D(target, ...)` или `gl.texParameteri(target)`. Их реализация могла бы быть такой:

```js
// ПСЕВДОКОД!!!
gl.texImage2D = function(target, level, internalFormat, width, height, border, format, type, data) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture.mips[level] = convertDataToInternalFormat(internalFormat, width, height, format, type, data);
}

gl.texParameteri = function(target, pname, value) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture[pname] = value; 
}
```

Из приведённого выше псевдокода видно, что `gl.activeTexture` устанавливает внутреннюю глобальную переменную WebGL — индекс массива текстурных юнитов. После этого все остальные функции для текстур используют `target` (первый аргумент), который указывает на bind point текущего текстурного юнита.

## Максимальное количество текстурных юнитов

WebGL требует, чтобы реализация поддерживала минимум 32 текстурных юнита. Узнать, сколько поддерживается, можно так:

```js
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

Обратите внимание, что для вершинных и фрагментных шейдеров могут быть разные лимиты на количество юнитов. Узнать их можно так:

```js
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
```

Каждый из них должен поддерживать минимум 16 текстурных юнитов.

Допустим:

```js
maxTextureUnits = 32
maxVertexShaderTextureUnits = 16
maxFragmentShaderTextureUnits = 32
```

Это значит, что если вы используете, например, 2 текстурных юнита в вершинном шейдере, то для фрагментного останется только 30, так как общий максимум — 32. 