Title: WebGL2 Загрузка Obj с Mtl
Description: Как парсить .MTL файл
TOC: Загрузка .obj с .mtl файлами

В [предыдущей статье](webgl-load-obj.html) мы разбирали парсинг .OBJ файлов.
В этой статье разберём их дополнительные .MTL (material) файлы.

**Дисклеймер:** Этот парсер .MTL не претендует на полноту или
идеальность и не обрабатывает каждый возможный .MTL-файл. Его цель —
показать подход к обработке того, что встречается на практике.
Если вы столкнётесь с серьёзными проблемами и решениями — оставьте комментарий,
это может помочь другим.

Мы загрузили этот [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) [стул](https://sketchfab.com/3d-models/chair-aa2acddb218646a59ece132bf95aa558) от [haytonm](https://sketchfab.com/haytonm) с [Sketchfab](https://sketchfab.com/)

<div class="webgl_center"><img src="../resources/models/chair/chair.jpg" style="width: 452px;"></div>

У него есть соответствующий .MTL файл, который выглядит так:

```
# Blender MTL File: 'None'
# Material Count: 11

newmtl D1blinn1SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 0.500000 0.500000 0.500000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2

newmtl D1lambert2SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 0.020000 0.020000 0.020000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2

newmtl D1lambert3SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 1.000000 1.000000 1.000000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2

... аналогично для ещё 8 материалов
```

Если посмотреть [описание формата .MTL](http://paulbourke.net/dataformats/mtl/),
то видно, что ключевое слово `newmtl` начинает новый материал с заданным именем, а ниже
идут все параметры этого материала. Каждая строка начинается с ключевого слова, как и в .OBJ,
поэтому можно начать с похожего каркаса:

```js
function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
  };

  const keywordRE = /(cw*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return materials;
}
```

Далее нужно добавить обработчики для каждого ключевого слова. Документация говорит:

* `Ns` — specular shininess (см. [статью про точечный свет](webgl-3d-lighting-point.html))
* `Ka` — ambient-цвет материала
* `Kd` — diffuse-цвет (наш основной цвет в [статье про точечный свет](webgl-3d-lighting-point.html))
* `Ks` — specular-цвет
* `Ke` — emissive-цвет
* `Ni` — оптическая плотность (не используем)
* `d` — "dissolve", прозрачность
* `illum` — тип освещения (всего 11 видов, пока игнорируем)

Я думал, оставить ли эти имена как есть. Математикам нравятся короткие имена, но
в большинстве стайлгайдов предпочитают описательные. Я выбрал второй вариант:

```js
function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
    Ns(parts)     { material.shininess      = parseFloat(parts[0]); },
    Ka(parts)     { material.ambient        = parts.map(parseFloat); },
    Kd(parts)     { material.diffuse        = parts.map(parseFloat); },
    Ks(parts)     { material.specular       = parts.map(parseFloat); },
    Ke(parts)     { material.emissive       = parts.map(parseFloat); },
    Ni(parts)     { material.opticalDensity = parseFloat(parts[0]); },
    d(parts)      { material.opacity        = parseFloat(parts[0]); },
    illum(parts)  { material.illum          = parseInt(parts[0]); },
  };

  ...

  return materials;
}
``` 

Два материала могут ссылаться на одну и ту же текстуру, поэтому будем хранить все текстуры в объекте по имени файла, чтобы не загружать одну и ту же текстуру несколько раз.

```js
const textures = {
  defaultWhite: twgl.createTexture(gl, {src: [255, 255, 255, 255]}),
};

// загружаем текстуры для материалов
for (const material of Object.values(materials)) {
  Object.entries(material)
    .filter(([key]) => key.endsWith('Map'))
    .forEach(([key, filename]) => {
      let texture = textures[filename];
      if (!texture) {
        const textureHref = new URL(filename, baseHref).href;
        texture = twgl.createTexture(gl, {src: textureHref, flipY: true});
        textures[filename] = texture;
      }
      material[key] = texture;
    });
}
```

Этот код проходит по каждому свойству каждого материала. Если имя свойства заканчивается на "Map", создаётся относительный URL, создаётся текстура и присваивается обратно в материал. Хелпер асинхронно загрузит изображение в текстуру.

Также добавим текстуру-«заглушку» — белый пиксель, которую можно использовать для любого материала без текстуры. Так мы сможем использовать один и тот же шейдер для всех материалов. Иначе пришлось бы делать разные шейдеры для материалов с текстурой и без.

```js
const defaultMaterial = {
  diffuse: [1, 1, 1],
  diffuseMap: textures.defaultWhite,
  ambient: [0, 0, 0],
  specular: [1, 1, 1],
  shininess: 400,
  opacity: 1,
};

const parts = obj.geometries.map(({material, data}) => {

  ...

  // создаём буфер для каждого массива
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
  return {
    material: {
      ...defaultMaterial,
      ...materials[material],
    },
    bufferInfo,
    vao,
  };
});
```

Чтобы использовать текстуры, нужно изменить шейдер. Начнём с diffuse map.

```js
const vs = `#version 300 es
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
in vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform vec3 u_viewWorldPosition;

out vec3 v_normal;
out vec3 v_surfaceToView;
out vec2 v_texcoord;
out vec4 v_color;

void main() {
  vec4 worldPosition = u_world * a_position;
  gl_Position = u_projection * u_view * worldPosition;
  v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
  v_normal = mat3(u_world) * a_normal;
  v_texcoord = a_texcoord;
  v_color = a_color;
}
`;

const fs = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToView;
in vec2 v_texcoord;
in vec4 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

out vec4 outColor;

void main () {
  vec3 normal = normalize(v_normal);

  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
  vec4 specularMapColor = texture(specularMap, v_texcoord);
  vec3 effectiveSpecular = specular * specularMapColor.rgb;

  vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
  float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

  outColor = vec4(
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse * fakeLight +
      effectiveSpecular * pow(specularLight, shininess),
      effectiveOpacity);
}
`;
```

И теперь мы получаем normal maps. Примечание: я приблизил камеру, чтобы их было легче увидеть.

{{{example url="../webgl-load-obj-w-mtl-w-normal-maps.html"}}}

Уверен, что в .MTL-файле есть гораздо больше возможностей, которые мы могли бы поддержать.
Например, ключевое слово `refl` указывает карты отражения, что является другим словом
для [environment map](webgl-environment-maps.html). Также показано, что различные
ключевые слова `map_` принимают множество опциональных аргументов. Несколько из них:

* `-clamp on | off` указывает, повторяется ли текстура
* `-mm base gain` указывает смещение и множитель для значений текстуры
* `-o u v w` указывает смещение для координат текстуры. Вы бы применили их, используя матрицу текстуры, аналогично тому, что мы делали в [статье про drawImage](webgl-2d-drawimage.html)
* `-s u v w` указывает масштаб для координат текстуры. Как и выше, вы бы поместили их в матрицу текстуры

Я не знаю, сколько .MTL-файлов используют эти настройки.

Более важный момент заключается в том, что добавление поддержки каждой функции делает
шейдеры больше и сложнее. Выше у нас есть форма *uber shader*,
шейдер, который пытается обработать все случаи. Чтобы заставить его работать, мы передали различные
значения по умолчанию. Например, мы установили `diffuseMap` как белую текстуру, чтобы если мы
загружаем что-то без текстур, это всё равно отображалось. Diffuse цвет будет
умножен на белый, что равно 1.0, поэтому мы просто получим diffuse цвет.
Аналогично мы передали белый цвет вершины по умолчанию на случай, если нет
цветов вершин.

Это распространённый способ заставить вещи работать, и если это работает достаточно быстро для ваших
потребностей, то нет причин это менять. Но более распространено генерировать
шейдеры, которые включают/выключают эти функции. Если нет цветов вершин, то
генерируйте шейдер, как в манипуляции со строками шейдеров, чтобы у них не было атрибута
`a_color` и всего связанного кода. Аналогично, если у материала нет diffuse map, то
генерируйте шейдер, у которого нет `uniform sampler2D diffuseMap` и удалите весь связанный код.
Если у него нет никаких карт, то нам не нужны координаты текстуры, поэтому мы их тоже оставим.

Когда вы сложите все комбинации, может быть тысячи вариаций шейдеров.
Только с тем, что у нас есть выше, есть:

* diffuseMap да/нет
* specularMap да/нет
* normalMap да/нет
* цвета вершин да/нет
* ambientMap да/нет (мы не поддерживали это, но .MTL файл поддерживает)
* reflectionMap да/нет (мы не поддерживали это, но .MTL файл поддерживает)

Только эти представляют 64 комбинации. Если мы добавим, скажем, от 1 до 4 источников света, и эти
источники света могут быть spot, или point, или directional, мы получим 8192 возможных
комбинации функций шейдера.

Управление всем этим — это много работы. Это одна из причин, почему многие люди
выбирают 3D движок, такой как [three.js](https://threejs.org), вместо того, чтобы делать это
всё самим. Но, по крайней мере, надеюсь, эта статья даёт некоторое представление о
типах вещей, связанных с отображением произвольного 3D контента.

<div class="webgl_bottombar">
<h3>Избегайте условных операторов в шейдерах где возможно</h3>
<p>Традиционный совет — избегать условных операторов в шейдерах. В качестве примера
мы могли бы сделать что-то вроде этого</p>
<pre class="prettyprint"><code>{{#escapehtml}}
uniform bool hasDiffuseMap;
uniform vec4 diffuse;
uniform sampler2D diffuseMap

...
  vec4 effectiveDiffuse = diffuse;
  if (hasDiffuseMap) {
    effectiveDiffuse *= texture2D(diffuseMap, texcoord);
  }
...
{{/escapehtml}}</code></pre>
<p>Условные операторы, такие как этот, обычно не рекомендуются, потому что в зависимости от
GPU/драйвера они часто не очень производительны.</p>
<p>Либо делайте, как мы сделали выше, и попытайтесь сделать код без условных операторов. Мы использовали
один 1x1 белый пиксель текстуры, когда нет текстуры, чтобы наша математика работала
без условного оператора.</p>
<p>Или используйте разные шейдеры. Один, у которого нет функции, и один, у которого есть,
и выбирайте правильный для каждой ситуации.</p>
</div> 