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

Теперь у нас есть текстуры!

{{{example url="../webgl-load-obj-w-mtl-w-textures.html"}}}

Если посмотреть на .MTL-файл, можно увидеть `map_Ks` — это чёрно-белая текстура, которая определяет, насколько поверхность блестящая, или, иначе говоря, сколько specular-отражения используется.

<div class="webgl_center"><img src="../resources/models/windmill/windmill_001_base_SPEC.jpg" style="width: 512px;"></div>

Чтобы использовать её, нужно обновить шейдер, ведь мы уже загружаем все текстуры.

```js
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
uniform sampler2D specularMap;
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
``` 

Также стоит добавить значение по умолчанию для материалов без карты specular:

```js
const defaultMaterial = {
  diffuse: [1, 1, 1],
  diffuseMap: textures.defaultWhite,
  ambient: [0, 0, 0],
  specular: [1, 1, 1],
  specularMap: textures.defaultWhite,
  shininess: 400,
  opacity: 1,
};
```

В .MTL-файле значения specular могут быть не очень наглядными, поэтому для наглядности можно «взломать» параметры specular:

```js
// хак: делаем specular заметнее
Object.values(materials).forEach(m => {
  m.shininess = 25;
  m.specular = [3, 2, 1];
});
```

Теперь видно, что только окна и лопасти отражают свет.

{{{example url="../webgl-load-obj-w-mtl-w-specular-map.html"}}}

Меня удивило, что лопасти отражают свет. Если посмотреть на .MTL-файл, там shininess `Ns` = 0.0, что означает очень сильные specular-блики. Но illum = 1 для обоих материалов. По документации illum 1 означает:

```
color = KaIa + Kd { SUM j=1..ls, (N * Lj)Ij }
```

То есть:

```
color = ambientColor * lightAmbient + diffuseColor * sumOfLightCalculations
```

Как видно, specular тут не участвует, но в файле всё равно есть specular map! ¯\_(ツ)_/¯ Для specular-бликов нужен illum 2 или выше. Это типичная ситуация с .OBJ/.MTL: часто приходится вручную дорабатывать материалы. Как исправлять — решать вам: можно править .MTL, можно добавить код. Мы выбрали второй путь.

Последняя карта в этом .MTL — `map_Bump` (bump map). На самом деле файл — это normal map.

<div class="webgl_center"><img src="../resources/models/windmill/windmill_001_base_NOR.jpg" style="width: 512px;"></div>

В .MTL нет опции явно указать normal map или что bump map — это normal map. Можно использовать эвристику: если в имени файла есть 'nor', или просто считать, что все `map_Bump` — это normal map (по крайней мере в 2020+). Так и поступим.

Для генерации тангенсов используем код из [статьи про normal mapping](webgl-3d-lighting-normal-mapping.html):

```js
const parts = obj.geometries.map(({material, data}) => {
  ...

  // генерируем тангенсы, если есть данные
  if (data.texcoord && data.normal) {
    data.tangent = generateTangents(data.position, data.texcoord);
  } else {
    // Нет тангенсов
    data.tangent = { value: [1, 0, 0] };
  }

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

Также добавим normal map по умолчанию для материалов, у которых его нет:

```js
const textures = {
  defaultWhite: twgl.createTexture(gl, {src: [255, 255, 255, 255]}),
  defaultNormal: twgl.createTexture(gl, {src: [127, 127, 255, 0]}),
};

...

const defaultMaterial = {
  diffuse: [1, 1, 1],
  diffuseMap: textures.defaultWhite,
  normalMap: textures.defaultNormal,
  ambient: [0, 0, 0],
  specular: [1, 1, 1],
  specularMap: textures.defaultWhite,
  shininess: 400,
  opacity: 1,
};
...
```

И, наконец, вносим изменения в шейдеры, как в [статье про normal mapping](webgl-3d-lighting-normal-mapping.html):

```js
const vs = `#version 300 es
in vec4 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_texcoord;
in vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform vec3 u_viewWorldPosition;

out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_surfaceToView;
out vec2 v_texcoord;
out vec4 v_color;

void main() {
  vec4 worldPosition = u_world * a_position;
  gl_Position = u_projection * u_view * worldPosition;
  v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;

  mat3 normalMat = mat3(u_world);
  v_normal = normalize(normalMat * a_normal);
  v_tangent = normalize(normalMat * a_tangent);

  v_texcoord = a_texcoord;
  v_color = a_color;
}
`;

const fs = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_tangent;
in vec3 v_surfaceToView;
in vec2 v_texcoord;
in vec4 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform sampler2D specularMap;
uniform float shininess;
uniform sampler2D normalMap;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

out vec4 outColor;

void main () {
  vec3 normal = normalize(v_normal);
  vec3 tangent = normalize(v_tangent);
  vec3 bitangent = normalize(cross(normal, tangent));

  mat3 tbn = mat3(tangent, bitangent, normal);
  normal = texture(normalMap, v_texcoord).rgb * 2. - 1.;
  normal = normalize(tbn * normal);

  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
  vec4 specularMapColor = texture(specularMap, v_texcoord);
  vec3 effectiveSpecular = specular * specularMapColor.rgb;

  vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
  float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;
``` 