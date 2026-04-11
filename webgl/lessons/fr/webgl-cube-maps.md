Title: WebGL2 Cubemaps
Description: Comment utiliser les cubemaps dans WebGL
TOC: Cubemaps


Cet article fait partie d'une série d'articles sur WebGL2.
[Le premier article commence par les bases](webgl-fundamentals.html).
Cet article s'appuie sur [l'article sur les textures](webgl-3d-textures.html).
Cet article utilise également des concepts couverts dans [l'article sur l'éclairage](webgl-3d-lighting-directional.html).
Si vous n'avez pas encore lu ces articles, vous voudrez peut-être les lire d'abord.

Dans un [article précédent](webgl-3d-textures.html), nous avons couvert l'utilisation des textures,
comment elles sont référencées par des coordonnées de texture qui vont de 0 à 1 horizontalement et verticalement
à travers la texture, et comment elles sont filtrées optionnellement avec des mips.

Un autre type de texture est un *cubemap*. Il consiste en 6 faces représentant
les 6 faces d'un cube. Au lieu des coordonnées de texture traditionnelles qui ont
2 dimensions, un cubemap utilise une normale, autrement dit une direction 3D.
Selon la direction vers laquelle la normale pointe, l'une des 6 faces du cube
est sélectionnée et ensuite les pixels de cette face sont échantillonnés pour produire une couleur.

Les 6 faces sont référencées par leur direction depuis le centre du cube.
Ce sont

```js
gl.TEXTURE_CUBE_MAP_POSITIVE_X
gl.TEXTURE_CUBE_MAP_NEGATIVE_X
gl.TEXTURE_CUBE_MAP_POSITIVE_Y
gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
gl.TEXTURE_CUBE_MAP_POSITIVE_Z
gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
```

Créons un exemple simple, nous utiliserons un canvas 2D pour créer les images utilisées dans
chacune des 6 faces.

Voici du code pour remplir un canvas avec une couleur et un message centré

```js
function generateFace(ctx, faceColor, textColor, text) {
  const {width, height} = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}
```

Et voici du code pour l'appeler afin de générer 6 images

```js
// Obtenir un contexte 2D
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // afficher le résultat
  ctx.canvas.toBlob((blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
});
```

{{{example url="../webgl-cubemap-faces.html" }}}

Appliquons maintenant cela à un cube. Nous allons commencer avec le code
de l'exemple d'atlas de textures [dans l'article précédent](webgl-3d-textures.html).

D'abord, modifions les shaders pour utiliser un cube map

```glsl
#version 300 es

in vec4 a_position;

uniform mat4 u_matrix;

out vec3 v_normal;

void main() {
  // Multiplier la position par la matrice.
  gl_Position = u_matrix * a_position;

  // Passer une normale. Puisque les positions sont
  // centrées autour de l'origine, nous pouvons simplement
  // passer la position
  v_normal = normalize(a_position.xyz);
}
```

Nous avons supprimé les coordonnées de texture du shader et
ajouté un varying pour passer une normale au fragment shader.
Puisque les positions de notre cube sont parfaitement centrées autour de l'origine,
nous pouvons simplement les utiliser comme nos normales.

Rappelons-nous de [l'article sur l'éclairage](webgl-3d-lighting-directional.html) que
les normales sont une direction et sont généralement utilisées pour spécifier la direction de
la surface d'un sommet. Parce que nous utilisons les positions normalisées
pour nos normales, si nous devions éclairer ceci, nous obtiendrions un éclairage lisse à travers
le cube. Pour un cube normal, nous aurions besoin de normales différentes pour chaque
sommet pour chaque face.

{{{diagram url="resources/cube-normals.html" caption="normales d'un cube standard vs normales de ce cube" }}}

Puisque nous n'utilisons pas de coordonnées de texture, nous pouvons supprimer tout le code lié à
la configuration des coordonnées de texture.

Dans le fragment shader, nous devons utiliser un `samplerCube` au lieu d'un `sampler2D`
et `texture` lorsqu'il est utilisé avec un `samplerCube` prend une direction vec3,
donc nous passons la normale normalisée. Puisque la normale est un varying et sera interpolée,
nous devons la normaliser.

```
#version 300 es

precision highp float;

// Passé depuis le vertex shader.
in vec3 v_normal;

// La texture.
uniform samplerCube u_texture;

// nous devons déclarer une sortie pour le fragment shader
out vec4 outColor;

void main() {
   outColor = texture(u_texture, normalize(v_normal));
}
```

Ensuite, en JavaScript, nous devons configurer la texture

```js
// Créer une texture.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

// Obtenir un contexte 2D
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {target, faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // Téléverser le canvas sur la face du cubemap.
  const level = 0;
  const internalFormat = gl.RGBA;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

Choses à noter ci-dessus :

* Nous utilisons `gl.TEXTURE_CUBE_MAP` au lieu de `gl.TEXTURE_2D`.

  Cela indique à WebGL de créer un cube map au lieu d'une texture 2D.

* Pour téléverser chaque face de la texture, nous utilisons des cibles spéciales.

  `gl.TEXTURE_CUBE_MAP_POSITIVE_X`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_X`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Z` et
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Z`.

* Chaque face est un carré. Ci-dessus, elles font 128x128.

  Les cubemaps nécessitent des textures carrées.
  Nous générons également des mips et activons le filtrage pour utiliser les mips.

Et voilà le résultat

{{{example url="../webgl-cubemap.html" }}}

Utiliser un cubemap pour texturer un cube n'est **pas** ce pour quoi les cubemaps sont normalement
utilisés. La façon *correcte* ou plutôt standard de texturer un cube est
d'utiliser un atlas de textures comme nous [l'avons mentionné avant](webgl-3d-textures.html).

Maintenant que nous avons appris ce qu'est un cubemap et comment en configurer un, à quoi sert un cubemap ?
Probablement la chose unique la plus courante pour laquelle un cubemap est utilisé est comme
[*carte d'environnement*](webgl-environment-maps.html).
