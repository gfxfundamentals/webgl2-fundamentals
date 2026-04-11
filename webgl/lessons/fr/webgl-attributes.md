Title: WebGL2 Attributs
Description: Que sont les attributs dans WebGL ?
TOC: Attributs


Cet article a pour but de vous donner une représentation mentale
de la façon dont l'état des attributs est configuré dans WebGL. Il existe [un article similaire sur les unités de texture](webgl-texture-units.html) et sur les [framebuffers](webgl-framebuffers.html).

En prérequis, vous voudrez probablement lire [Comment WebGL fonctionne](webgl-how-it-works.html)
et [WebGL Shaders et GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html).

## Attributs

Dans WebGL, les attributs sont des entrées d'un vertex shader qui obtiennent leurs données depuis des buffers.
WebGL exécutera le vertex shader fourni par l'utilisateur N fois lorsque `gl.drawArrays` ou `gl.drawElements` est appelé.
Pour chaque itération, les attributs définissent comment extraire les données des buffers qui leur sont liés
et les fournir aux attributs à l'intérieur du vertex shader.

S'ils étaient implémentés en JavaScript, ils ressembleraient à quelque chose comme ceci

```js
// pseudo code
const gl = {
  arrayBuffer: null,
  vertexArray: {
    attributes: [
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
    ],
    elementArrayBuffer: null,
  },
}
```

Comme vous pouvez le voir ci-dessus, il y a 16 attributs.

Quand vous appelez `gl.enableVertexAttribArray(location)` ou `gl.disableVertexAttribArray`, vous pouvez l'imaginer ainsi

```js
// pseudo code
gl.enableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = true;
};

gl.disableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = false;
};
```

En d'autres termes, location fait directement référence à l'index d'un attribut.

De même, `gl.vertexAttribPointer` est utilisé pour définir presque tous les autres
paramètres d'un attribut. Il serait implémenté de cette façon

```js
// pseudo code
gl.vertexAttribPointer = function(location, size, type, normalize, stride, offset) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.size = size;
  attrib.type = type;
  attrib.normalize = normalize;
  attrib.stride = stride ? stride : sizeof(type) * size;
  attrib.offset = offset;
  attrib.buffer = gl.arrayBuffer;  // !!!! <-----
};
```

Notez que lorsque nous appelons `gl.vertexAttribPointer`, `attrib.buffer`
est défini avec la valeur courante de `gl.arrayBuffer`.
`gl.arrayBuffer` dans le pseudo code ci-dessus serait défini en
appelant `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)`.

```js
// pseudo code
gl.bindBuffer = function(target, buffer) {
  switch (target) {
    case ARRAY_BUFFER:
      gl.arrayBuffer = buffer;
      break;
    case ELEMENT_ARRAY_BUFFER;
      gl.vertexArray.elementArrayBuffer = buffer;
      break;
  ...
};
```

Ensuite, nous avons les vertex shaders. Dans un vertex shader, vous déclarez des attributs. Exemple :

```glsl
#version 300 es
in vec4 position;
in vec2 texcoord;
in vec3 normal;

...

void main() {
  ...
}
```

Quand vous liez un vertex shader avec un fragment shader en appelant
`gl.linkProgram(someProgram)`, WebGL (le pilote/GPU/navigateur) décide de lui-même
quel index/emplacement utiliser pour chaque attribut. À moins de les assigner manuellement
(voir ci-dessous), vous ne savez pas lesquels ils vont choisir. C'est au
navigateur/pilote/GPU d'en décider. Vous devez donc lui demander quel attribut il a utilisé
pour position, texcoord et normal. Vous faites cela en appelant
`gl.getAttribLocation`

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

Disons que `positionLoc` = `5`. Cela signifie que quand le vertex shader s'exécute (quand
vous appelez `gl.drawArrays` ou `gl.drawElements`), le vertex shader s'attend à ce que vous ayez
configuré l'attribut 5 avec le bon type, la bonne taille, le bon offset, stride, buffer, etc.

Notez qu'AVANT de lier le programme, vous pouvez choisir les emplacements en appelant
`gl.bindAttribLocation(program, location, nameOfAttribute)`. Exemple :

```js
// Indiquer à `gl.linkProgram` d'assigner `position` à l'attribut #7
gl.bindAttribLocation(program, 7, 'position');
```

Vous pouvez également indiquer quel emplacement utiliser directement dans votre shader si vous
utilisez des shaders GLSL ES 3.00 avec

```glsl
layout(location = 0) in vec4 position;
layout(location = 1) in vec2 texcoord;
layout(location = 2) in vec3 normal;

...
```

Utiliser `bindAttribLocation` semble bien plus conforme au principe [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
mais utilisez ce que vous préférez.

## État complet des attributs

Ce qui manque dans la description ci-dessus est que chaque attribut possède aussi une valeur par défaut.
Elle est omise ci-dessus car il est rare de l'utiliser.

```js
attributeValues: [
  [0, 0, 0, 1],
  [0, 0, 0, 1],
  ...
],
vertexArray: {
  attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, },
   ...
```
Vous pouvez définir la valeur de chaque attribut avec les différentes fonctions `gl.vertexAttribXXX`.
La valeur est utilisée quand `enable` est false. Quand enable est true, les données de
l'attribut sont extraites du buffer assigné.

<a id="vaos"></a>
## Vertex Array Objects (VAO)

```js
const vao = gl.createVertexArray();
```

crée l'objet que vous voyez attaché à `gl.vertexArray` dans le *pseudo code*
ci-dessus. Appeler `gl.bindVertexArray(vao)` assigne votre vertex array object créé
comme vertex array courant.

```js
// pseudo code
gl.bindVertexArray = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

Cela vous permet de configurer tous les attributs et l'`ELEMENT_ARRAY_BUFFER` dans le
VAO courant, de sorte que quand vous voulez dessiner une forme particulière, il suffit d'un seul appel à
`gl.bindVertexArray` pour configurer efficacement
tous les attributs, alors que sinon il faudrait jusqu'à un appel à `gl.bindBuffer`, `gl.vertexAttribPointer` (et peut-être
`gl.enableVertexAttribArray`) **par attribut**.

On peut dire que l'utilisation des vertex array objects est une bonne chose.
Pour les utiliser cependant, cela nécessite souvent plus d'organisation. Par exemple, supposons que vous vouliez
dessiner un cube avec `gl.TRIANGLES` avec un shader, puis à nouveau avec `gl.LINES`
avec un shader différent. Supposons que lors du dessin avec des triangles, vous utilisiez
des normales pour l'éclairage, vous déclarez donc des attributs dans votre shader comme ceci :

```glsl
#version 300 es
// lighting-shader
// shader pour un cube dessiné avec des triangles

in vec4 a_position;
in vec3 a_normal;
```

Vous utilisez ensuite ces positions et normales comme nous l'avons couvert dans
[le premier article sur l'éclairage](webgl-3d-lighting-directional.html).

Pour les lignes, vous ne voulez pas d'éclairage, vous voulez une couleur unie, donc vous
faites quelque chose de similaire aux premiers shaders sur [la première page](webgl-fundamentals.html) de ces
tutoriels. Vous déclarez un uniform pour la couleur. Cela signifie que dans votre
vertex shader, vous n'avez besoin que de la position

```glsl
#version 300 es
// solid-shader
// shader pour un cube avec des lignes

in vec4 a_position;
```

Nous n'avons aucune idée des emplacements d'attributs qui seront décidés pour chaque shader.
Supposons que pour le lighting-shader ci-dessus les emplacements soient

```
a_position location = 1
a_normal location = 0
```

et pour le solid-shader qui n'a qu'un seul attribut

```
a_position location = 0
```

Il est clair qu'en changeant de shader, nous devrons reconfigurer nos attributs différemment.
Un shader s'attend à ce que les données de `a_position` apparaissent sur l'attribut 0. L'autre shader
s'attend à ce qu'elles apparaissent sur l'attribut 1.

Reconfigurer les attributs représente du travail supplémentaire. Pire encore, le but principal d'utiliser un
vertex array object est justement de nous éviter ce travail. Pour résoudre ce problème,
nous lierions les emplacements avant de lier les programmes shader.

Nous indiquerions à WebGL

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

**AVANT d'appeler gl.linkProgram**. Cela indique à WebGL quels emplacements assigner lors de la liaison du shader.
Maintenant, nous pouvons utiliser le même VAO pour les deux shaders.

## Nombre maximum d'attributs

WebGL2 exige qu'au moins 16 attributs soient supportés, mais un ordinateur/navigateur/implémentation/pilote particulier
peut en supporter davantage. Vous pouvez connaître le nombre supporté en appelant

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

Si vous décidez d'en utiliser plus de 16, vous voudrez probablement vérifier combien
sont réellement supportés et en informer l'utilisateur si sa
machine n'en a pas assez, ou bien utiliser des shaders plus simples en repli.
