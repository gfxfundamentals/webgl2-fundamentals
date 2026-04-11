Title: WebGL2 Unités de Texture
Description: Que sont les unités de texture dans WebGL ?
TOC: Unités de Texture


Cet article a pour but de vous donner une représentation mentale
de la façon dont les unités de texture sont configurées dans WebGL. Il existe [un article similaire sur les attributs](webgl-attributes.html).

En prérequis, vous voudrez probablement lire [Comment WebGL fonctionne](webgl-how-it-works.html)
et [WebGL Shaders et GLSL](webgl-shaders-and-glsl.html)
ainsi que [WebGL Textures](webgl-3d-textures.html).

## Unités de Texture

Dans WebGL, il existe des textures. Les textures sont des tableaux 2D de données que vous pouvez passer à un shader.
Dans le shader, vous déclarez un *sampler uniform* comme ceci

```glsl
uniform sampler2D someTexture;
```

Mais comment le shader sait-il quelle texture utiliser pour `someTexture` ?

C'est là que les unités de texture entrent en jeu. Les unités de texture sont un **tableau global**
de références vers des textures. Vous pouvez imaginer que si WebGL était écrit en JavaScript,
il aurait un état global qui ressemblerait à ceci

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

Vous pouvez voir ci-dessus que `textureUnits` est un tableau. Vous assignez une texture à l'un des *points de liaison* dans ce tableau
d'unités de texture. Assignons `ourTexture` à l'unité de texture 5.

```js
// au moment de l'initialisation
const ourTexture = gl.createTexture();
// insérer le code d'initialisation de la texture ici.

...

// au moment du rendu
const indexOfTextureUnit = 5;
gl.activeTexture(gl.TEXTURE0 + indexOfTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, ourTexture);
```

Vous indiquez ensuite au shader à quelle unité de texture vous avez lié la texture en appelant

```js
gl.uniform1i(someTextureUniformLocation, indexOfTextureUnit);
```

Si les fonctions WebGL `activeTexture` et `bindTexture` étaient implémentées en JavaScript, elles ressembleraient
à quelque chose comme :

```js
// PSEUDO CODE !!!
gl.activeTexture = function(unit) {
  gl.activeTextureUnit = unit - gl.TEXTURE0;  // convertir en index de base 0
};

gl.bindTexture = function(target, texture) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  textureUnit[target] = texture;
}:
```

Vous pouvez même imaginer comment fonctionnent les autres fonctions de texture. Elles prennent toutes un `target`
comme `gl.texImage2D(target, ...)` ou `gl.texParameteri(target)`. Ceux-ci seraient
implémentés quelque chose comme

```js
// PSEUDO CODE !!!
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

Il devrait être clair d'après le pseudo code exemple ci-dessus que `gl.activeTexture` définit une
variable globale interne dans WebGL sur un index du tableau d'unités de texture.
À partir de ce point, toutes les autres fonctions de texture prennent un `target`, le premier
argument dans chaque fonction de texture, qui référence le point de liaison de
l'unité de texture courante.

## Nombre maximum d'unités de texture

WebGL exige qu'une implémentation supporte au moins 32 unités de texture. Vous pouvez interroger le nombre
supporté avec

```js
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

Notez que les vertex shaders et les fragment shaders peuvent avoir des limites différentes
sur le nombre d'unités que chacun peut utiliser. Vous pouvez interroger les limites pour chacun avec

```js
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
```

Chacun est requis pour supporter au moins 16 unités de texture.

Disons que

```js
maxTextureUnits = 32
maxVertexShaderTextureUnits = 16
maxFragmentShaderTextureUnits = 32
```

Cela signifie que si vous utilisez par exemple 2 unités de texture dans votre vertex shader,
il n'en reste que 30 à utiliser dans votre fragment shader car le maximum combiné est 32.
