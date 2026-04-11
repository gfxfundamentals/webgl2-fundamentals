Title: WebGL2 - Extraction de sommets
Description: Utiliser des indices indépendants
TOC: Extraction de sommets

Cet article suppose que vous avez lu beaucoup des autres articles
en commençant par [les bases](webgl-fundamentals.html).
Si vous ne les avez pas lus, veuillez commencer par là d'abord.

Traditionnellement, les applications WebGL mettent des données de géométrie dans des buffers.
Elles utilisent ensuite des attributs pour fournir automatiquement les données de sommets de ces buffers
au vertex shader où le programmeur fournit du code pour les convertir en clip space.

Le mot **traditionnellement** est important. C'est seulement une **tradition**
de le faire ainsi. Ce n'est en aucun cas une obligation. WebGL se fiche
de comment nous le faisons, il se soucie seulement que nos vertex shaders
assignent des coordonnées en clip space à `gl_Position`.

Dessinons un cube avec texture en utilisant du code similaire aux exemples de [l'article sur les textures](webgl-3d-textures.html).
On nous dit que nous avons besoin d'au moins 24 sommets uniques. C'est parce que même s'il n'y a que 8 positions
de coins, le même coin est utilisé sur 3 faces différentes du
cube et chaque face a besoin de coordonnées de texture différentes.

<div class="webgl_center"><img src="resources/cube-vertices-uv.svg" style="width: 400px;"></div>

Dans le diagramme ci-dessus, nous pouvons voir que l'utilisation du coin 3 par la face gauche nécessite
des coordonnées de texture 1,1 mais l'utilisation du coin 3 par la face droite nécessite des coordonnées de texture
0,1. La face du dessus aurait également besoin de coordonnées de texture différentes.

Cela est généralement accompli en passant de 8 positions de coins
à 24 sommets

```js
  // avant
  { pos: [-1, -1,  1], uv: [0, 1], }, // 0
  { pos: [ 1, -1,  1], uv: [1, 1], }, // 1
  { pos: [-1,  1,  1], uv: [0, 0], }, // 2
  { pos: [ 1,  1,  1], uv: [1, 0], }, // 3
  // droite
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 4
  { pos: [ 1, -1, -1], uv: [1, 1], }, // 5
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 6
  { pos: [ 1,  1, -1], uv: [1, 0], }, // 7
  // arrière
  { pos: [ 1, -1, -1], uv: [0, 1], }, // 8
  { pos: [-1, -1, -1], uv: [1, 1], }, // 9
  { pos: [ 1,  1, -1], uv: [0, 0], }, // 10
  { pos: [-1,  1, -1], uv: [1, 0], }, // 11
  // gauche
  { pos: [-1, -1, -1], uv: [0, 1], }, // 12
  { pos: [-1, -1,  1], uv: [1, 1], }, // 13
  { pos: [-1,  1, -1], uv: [0, 0], }, // 14
  { pos: [-1,  1,  1], uv: [1, 0], }, // 15
  // dessus
  { pos: [ 1,  1, -1], uv: [0, 1], }, // 16
  { pos: [-1,  1, -1], uv: [1, 1], }, // 17
  { pos: [ 1,  1,  1], uv: [0, 0], }, // 18
  { pos: [-1,  1,  1], uv: [1, 0], }, // 19
  // dessous
  { pos: [ 1, -1,  1], uv: [0, 1], }, // 20
  { pos: [-1, -1,  1], uv: [1, 1], }, // 21
  { pos: [ 1, -1, -1], uv: [0, 0], }, // 22
  { pos: [-1, -1, -1], uv: [1, 0], }, // 23
```

Ces positions et coordonnées de texture sont
mises dans des buffers et fournies au vertex shader
via des attributs.

Mais avons-nous vraiment besoin de le faire ainsi ? Et si
nous voulions avoir seulement les 8 coins
et 4 coordonnées de texture. Quelque chose comme

```js
positions = [
  -1, -1,  1,  // 0
   1, -1,  1,  // 1
  -1,  1,  1,  // 2
   1,  1,  1,  // 3
  -1, -1, -1,  // 4
   1, -1, -1,  // 5
  -1,  1, -1,  // 6
   1,  1, -1,  // 7
];
uvs = [
  0, 0,  // 0
  1, 0,  // 1
  0, 1,  // 2
  1, 1,  // 3
];
```

Et ensuite pour chacun des 24 sommets nous spécifierions lesquels
utiliser.

```js
positionIndexUVIndex = [
  // avant
  0, 1, // 0
  1, 3, // 1
  2, 0, // 2
  3, 2, // 3
  // droite
  1, 1, // 4
  5, 3, // 5
  3, 0, // 6
  7, 2, // 7
  // arrière
  5, 1, // 8
  4, 3, // 9
  7, 0, // 10
  6, 2, // 11
  // gauche
  4, 1, // 12
  0, 3, // 13
  6, 0, // 14
  2, 2, // 15
  // dessus
  7, 1, // 16
  6, 3, // 17
  3, 0, // 18
  2, 2, // 19
  // dessous
  1, 1, // 20
  0, 3, // 21
  5, 0, // 22
  4, 2, // 23
];
```

Pourrions-nous l'utiliser sur le GPU ? Pourquoi pas !?

Nous allons téléverser les positions et les coordonnées de texture
chacune dans leur propre texture comme
nous l'avons vu dans [l'article sur les textures de données](webgl-data-textures.html).

```js
function makeDataTexture(gl, data, numComponents) {
  // étendre les données à 4 valeurs par pixel.
  const numElements = data.length / numComponents;
  const expandedData = new Float32Array(numElements * 4);
  for (let i = 0; i < numElements; ++i) {
    const srcOff = i * numComponents;
    const dstOff = i * 4;
    for (let j = 0; j < numComponents; ++j) {
      expandedData[dstOff + j] = data[srcOff + j];
    }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,            // niveau mip
      gl.RGBA32F,   // format
      numElements,  // largeur
      1,            // hauteur
      0,            // bordure
      gl.RGBA,      // format
      gl.FLOAT,     // type
      expandedData,
  );
  // nous n'avons pas besoin de filtrage
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

const positionTexture = makeDataTexture(gl, positions, 3);
const texcoordTexture = makeDataTexture(gl, uvs, 2);
```

Puisque les textures ont jusqu'à 4 valeurs par pixel, `makeDataTexture`
étend toutes les données qu'on lui donne à 4 valeurs par pixel.

Ensuite, nous allons créer un vertex array pour contenir notre état d'attribut

```js
// créer un vertex array object pour contenir l'état des attributs
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
```


Ensuite, nous devons téléverser les indices de position et texcoord dans un buffer.

```js
// Créer un buffer pour les indices de position et UV
const positionIndexUVIndexBuffer = gl.createBuffer();
// Le lier à ARRAY_BUFFER (pensez-y comme ARRAY_BUFFER = positionBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
// Mettre les indices de position et texcoord dans le buffer
gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(positionIndexUVIndex), gl.STATIC_DRAW);
```

et configurer l'attribut

```js
// Activer l'attribut d'index de position
gl.enableVertexAttribArray(posTexIndexLoc);

// Indiquer à l'attribut position/texcoord comment extraire les données
// de positionIndexUVIndexBuffer (ARRAY_BUFFER)
{
  const size = 2;                // 2 composantes par itération
  const type = gl.INT;           // les données sont des entiers 32 bits
  const stride = 0;              // 0 = avancer de size * sizeof(type) à chaque itération pour obtenir la position suivante
  const offset = 0;              // commencer au début du buffer
  gl.vertexAttribIPointer(
      posTexIndexLoc, size, type, stride, offset);
}
```

Notez que nous appelons `gl.vertexAttribIPointer` et non `gl.vertexAttribPointer`.
Le `I` est pour entier et est utilisé pour les attributs entiers et entiers non signés.
Notez également que la taille est 2, car il y a 1 index de position et 1 index texcoord
par sommet.

Même si nous n'avons besoin que de 24 sommets, nous devons quand même dessiner 6 faces, 12 triangles
chacune, 3 sommets par triangle pour 36 sommets. Pour lui indiquer quels 6 sommets
utiliser pour chaque face, nous allons utiliser des [indices de sommets](webgl-indexed-vertices.html).

```js
const indices = [
   0,  1,  2,   2,  1,  3,  // avant
   4,  5,  6,   6,  5,  7,  // droite
   8,  9, 10,  10,  9, 11,  // arrière
  12, 13, 14,  14, 13, 15,  // gauche
  16, 17, 18,  18, 17, 19,  // dessus
  20, 21, 22,  22, 21, 23,  // dessous
];
// Créer un buffer d'indices
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
// Mettre les indices dans le buffer
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
```

Comme nous voulons dessiner une image sur le cube lui-même, nous avons besoin d'une 3ème texture
avec cette image. Créons juste une autre texture de données 4x4 en damier.
Nous allons utiliser `gl.LUMINANCE` comme format car nous n'avons alors besoin que d'un octet par pixel.

```js
// Créer une texture en damier.
const checkerTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Remplir la texture avec un damier gris 4x4.
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    4,
    4,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0xDD, 0x99, 0xDD, 0xAA,
      0x88, 0xCC, 0x88, 0xDD,
      0xCC, 0x88, 0xCC, 0xAA,
      0x88, 0xCC, 0x88, 0xCC,
    ]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Pour le vertex shader... Nous pouvons récupérer un pixel depuis la texture comme
ceci

```glsl
vec4 color = texelFetch(sampler2D tex, ivec2 pixelCoord, int mipLevel);
```

Donc, étant donné une coordonnée de pixel entière, le code ci-dessus va extraire une valeur de pixel.

En utilisant la fonction `texelFetch`, nous pouvons prendre un index de tableau 1D
et récupérer une valeur dans une texture 2D comme ceci

```glsl
vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
```

Avec cette fonction, voici notre shader

```glsl
#version 300 es
in ivec2 positionAndTexcoordIndices;

uniform sampler2D positionTexture;
uniform sampler2D texcoordTexture;

uniform mat4 u_matrix;

out vec2 v_texcoord;

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
  int positionIndex = positionAndTexcoordIndices.x;
  vec3 position = getValueByIndexFromTexture(
      positionTexture, positionIndex).xyz;
 
  // Multiplier la position par la matrice.
  gl_Position = u_matrix * vec4(position, 1);

  int texcoordIndex = positionAndTexcoordIndices.y;
  vec2 texcoord = getValueByIndexFromTexture(
      texcoordTexture, texcoordIndex).xy;

  // Passer la texcoord au fragment shader.
  v_texcoord = texcoord;
}
```

En bas, c'est effectivement le même shader que nous avons utilisé
dans [l'article sur les textures](webgl-3d-textures.html).
Nous multiplions une `position` par `u_matrix` et nous sortons
une texcoord vers `v_texcoord` pour la passer au fragment shader.

La différence est seulement dans la façon dont nous obtenons la position et la
texcoord. Nous utilisons les indices passés en entrée et obtenons
ces valeurs depuis leurs textures respectives.

Pour utiliser le shader, nous devons rechercher tous les emplacements

```js
// configurer le programme GLSL
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

+// rechercher où les données de sommets doivent aller.
+const posTexIndexLoc = gl.getAttribLocation(
+    program, "positionAndTexcoordIndices");
+
+// rechercher les uniforms
+const matrixLoc = gl.getUniformLocation(program, "u_matrix");
+const positionTexLoc = gl.getUniformLocation(program, "positionTexture");
+const texcoordTexLoc = gl.getUniformLocation(program, "texcoordTexture");
+const u_textureLoc = gl.getUniformLocation(program, "u_texture");
```

Au moment du rendu, nous configurons les attributs

```js
// Indiquer d'utiliser notre programme (paire de shaders)
gl.useProgram(program);

// Définir l'état du buffer et des attributs
gl.bindVertexArray(vao);
```

Ensuite, nous devons lier les 3 textures et configurer tous les
uniforms

```js
// Définir la matrice.
gl.uniformMatrix4fv(matrixLoc, false, matrix);

// mettre la texture de position sur l'unité de texture 0
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, positionTexture);
// Indiquer au shader d'utiliser l'unité de texture 0 pour positionTexture
gl.uniform1i(positionTexLoc, 0);

// mettre la texture texcoord sur l'unité de texture 1
gl.activeTexture(gl.TEXTURE0 + 1);
gl.bindTexture(gl.TEXTURE_2D, texcoordTexture);
// Indiquer au shader d'utiliser l'unité de texture 1 pour texcoordTexture
gl.uniform1i(texcoordTexLoc, 1);

// mettre la texture en damier sur l'unité de texture 2
gl.activeTexture(gl.TEXTURE0 + 2);
gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
// Indiquer au shader d'utiliser l'unité de texture 2 pour u_texture
gl.uniform1i(u_textureLoc, 2);
```

Et finalement dessiner

```js
// Dessiner la géométrie.
gl.drawElements(gl.TRIANGLES, 6 * 6, gl.UNSIGNED_SHORT, 0);
```

Et nous obtenons un cube avec texture en utilisant seulement 8 positions et
4 coordonnées de texture

{{{example url="../webgl-pulling-vertices.html"}}}

Quelques choses à noter. Le code est paresseux et utilise des
textures 1D pour les positions et les coordonnées de texture.
Les textures ne peuvent être que d'une certaine largeur. [Cette largeur dépend de la machine](https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE), ce que vous pouvez interroger avec

```js
const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
```

Si nous voulions gérer plus de données que cela, nous devrions
choisir une taille de texture qui convient à nos données et répartir
les données sur plusieurs lignes en ajoutant éventuellement
du rembourrage à la dernière ligne pour créer un rectangle.

Une autre chose que nous faisons ici est d'utiliser 2 textures,
une pour les positions, une pour les coordonnées de texture.
Il n'y a aucune raison pour laquelle nous ne pourrions pas mettre les deux données dans la
même texture, soit entrelacées

    pos,uv,pos,uv,pos,uv...

soit à différents endroits dans la texture

    pos,pos,pos,...
    uv, uv, uv,...

Il suffirait de modifier les calculs dans le vertex shader
qui calcule comment les extraire de la texture.

La question se pose, devriez-vous faire ce genre de choses ?
La réponse est "ça dépend". Selon le GPU,
cela pourrait être plus lent que la façon plus traditionnelle.

Le but de cet article était de souligner une fois de plus,
WebGL se fiche de la façon dont vous définissez `gl_Position` avec
des coordonnées en clip space, ni de la façon dont vous
sortez une couleur. Tout ce qui compte est que vous les définissiez.
Les textures sont vraiment juste des tableaux 2D de données à accès aléatoire.

Quand vous avez un problème à résoudre dans WebGL,
rappelez-vous que WebGL exécute simplement des shaders et que ces shaders
ont accès aux données via des uniforms (variables globales),
des attributs (données qui arrivent par itération du vertex shader),
et des textures (tableaux 2D à accès aléatoire). Ne laissez pas les
façons traditionnelles d'utiliser WebGL vous empêcher de
voir la vraie flexibilité qui s'y trouve.

<div class="webgl_bottombar">
<h3>Pourquoi s'appelle-t-il "Vertex Pulling" ?</h3>
<p>Je n'avais en fait entendu le terme que récemment (juillet 2019)
même si j'avais utilisé la technique auparavant. Il vient
de <a href='https://www.google.com/search?q=OpenGL+Insights+"Programmable+Vertex+Pulling"+article+by+Daniel+Rakos'>OpenGL Insights "Programmable Vertex Pulling" article de Daniel Rakos</a>.
</p>
<p>On l'appelle vertex *pulling* car c'est le vertex shader
qui décide quelles données de sommet lire, contrairement à la façon traditionnelle où
les données de sommet sont fournies automatiquement via des attributs. Effectivement,
le vertex shader *extrait* les données de la mémoire.</p>
</div>
