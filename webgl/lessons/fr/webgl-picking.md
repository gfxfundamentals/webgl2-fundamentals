Title: WebGL2 Picking
Description: Comment sélectionner des objets en WebGL
TOC: Picking (cliquer sur des objets)

Cet article explique comment utiliser WebGL pour permettre à l'utilisateur de sélectionner
des objets.

Si vous avez lu les autres articles de ce site, vous avez probablement réalisé
que WebGL lui-même n'est qu'une bibliothèque de rastérisation. Elle dessine des triangles,
des lignes et des points sur le canvas, donc elle n'a pas de notion "d'objets à sélectionner".
Elle ne fait que sortir des pixels via les shaders que vous fournissez. Cela signifie
que tout concept de "picking" doit venir de votre code. Vous devez
définir ce que sont les choses que vous laissez l'utilisateur sélectionner.
Cela signifie que bien que cet article puisse couvrir les concepts généraux, vous devrez
décider par vous-même comment traduire ce que vous voyez ici en concepts utilisables
dans votre propre application.

## Cliquer sur un objet

L'une des façons les plus simples de déterminer sur quel objet un utilisateur a cliqué est
d'attribuer un identifiant numérique à chaque objet, puis de dessiner
tous les objets en utilisant leur identifiant comme couleur sans éclairage
ni textures. Cela nous donnera une image des silhouettes de
chaque objet. Le depth buffer gérera le tri pour nous.
Nous pouvons alors lire la couleur du pixel sous la
souris, ce qui nous donnera l'identifiant de l'objet qui a été rendu là.

Pour implémenter cette technique, nous devrons combiner plusieurs articles précédents.
Le premier est l'article sur [dessiner plusieurs objets](webgl-drawing-multiple-things.html)
que nous utiliserons car il dessine plusieurs choses que nous pouvons essayer de
sélectionner.

De plus, nous voulons généralement rendre ces identifiants hors écran
en [rendant vers une texture](webgl-render-to-texture.html) donc nous allons
ajouter ce code aussi.

Partons donc du dernier exemple de
[l'article sur dessiner plusieurs choses](webgl-drawing-multiple-things.html)
qui dessine 200 objets.

Ajoutons-y un framebuffer avec une texture attachée et un depth buffer du
dernier exemple dans [l'article sur le rendu vers une texture](webgl-render-to-texture.html).

```js
// Créer une texture pour rendre
const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// créer un depth renderbuffer
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

function setFramebufferAttachmentSizes(width, height) {
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  // définir la taille et le format du niveau 0
  const level = 0;
  const internalFormat = gl.RGBA;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border,
                format, type, data);

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
}

// Créer et lier le framebuffer
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// attacher la texture comme premier attachement couleur
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const level = 0;
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

// créer un depth buffer de la même taille que targetTexture
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

Nous mettons le code pour définir les tailles de la texture et
du depth renderbuffer dans une fonction afin de pouvoir
l'appeler pour les redimensionner selon la taille du
canvas.

Dans notre code de rendu, si le canvas change de taille,
nous ajusterons la texture et le renderbuffer pour correspondre.

```js
function drawScene(time) {
  time *= 0.0005;

-  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
+    // le canvas a été redimensionné, faire correspondre les attachements du framebuffer
+    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
+  }

...
```

Ensuite, nous avons besoin d'un second shader. Le shader de l'exemple
rend en utilisant les couleurs de sommets, mais nous avons besoin
d'un shader que nous pouvons régler sur une couleur unie pour rendre avec des identifiants.
Voici donc notre second shader

```js
const pickingVS = `#version 300 es
  in vec4 a_position;
  
  uniform mat4 u_matrix;
  
  void main() {
    // Multiplier la position par la matrice.
    gl_Position = u_matrix * a_position;
  }
`;

const pickingFS = `#version 300 es
  precision highp float;
  
  uniform vec4 u_id;

  out vec4 outColor;
  
  void main() {
     outColor = u_id;
  }
`;
```

Et nous devons compiler, lier et rechercher les emplacements
en utilisant nos [helpers](webgl-less-code-more-fun.html).

```js
// configurer le programme GLSL
// note : les positions des attributs doivent correspondre entre les programmes
// pour que nous n'ayons besoin que d'un seul tableau de sommets par forme
const options = {
  attribLocations: {
    a_position: 0,
    a_color: 1,
  },
};
const programInfo = twgl.createProgramInfo(gl, [vs, fs], options);
const pickingProgramInfo = twgl.createProgramInfo(gl, [pickingVS, pickingFS], options);
```

Une différence par rapport à la plupart des exemples de ce site, c'est l'une
des rares fois où nous avons besoin de dessiner les mêmes données avec 2 shaders différents.
Pour cette raison, nous avons besoin que les emplacements des attributs correspondent
entre les shaders. Nous pouvons faire cela de 2 façons. L'une est de les définir
manuellement dans le GLSL

```glsl
layout (location = 0) in vec4 a_position;
layout (location = 1) in vec4 a_color;
```

L'autre est d'appeler `gl.bindAttribLocation` **avant** de lier
un programme shader

```js
gl.bindAttribLocation(someProgram, 0, 'a_position');
gl.bindAttribLocation(someProgram, 1, 'a_color');
gl.linkProgram(someProgram);
```

Ce dernier style est moins courant mais c'est plus
[D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
Notre bibliothèque helper appellera `gl.bindAttribLocation` pour nous
si nous passons les noms des attributs et l'emplacement que nous voulons,
ce qui est ce qui se passe ci-dessus.

Cela signifie que nous pouvons garantir que l'attribut `a_position` utilise
l'emplacement 0 dans les deux programmes, nous pouvons donc utiliser le même tableau de sommets
avec les deux programmes.

Ensuite, nous devons être capables de rendre tous les objets
deux fois. Une fois avec le shader que nous leur avons assigné
et à nouveau avec le shader que nous venons d'écrire.
Extrayons donc le code qui rend actuellement
tous les objets dans une fonction.

```js
function drawObjects(objectsToDraw, overrideProgramInfo) {
  objectsToDraw.forEach(function(object) {
    const programInfo = overrideProgramInfo || object.programInfo;
    const bufferInfo = object.bufferInfo;
    const vertexArray = object.vertexArray;

    gl.useProgram(programInfo.program);

    // Configurer tous les attributs nécessaires.
    gl.bindVertexArray(vertexArray);

    // Définir les uniforms.
    twgl.setUniforms(programInfo, object.uniforms);

    // Dessiner (appelle gl.drawArrays ou gl.drawElements)
    twgl.drawBufferInfo(gl, object.bufferInfo);
  });
}
```

`drawObjects` prend un `overrideProgramInfo` optionnel
que nous pouvons passer pour utiliser notre shader de picking à la place
du shader assigné à l'objet.

Appelons-le, une fois pour dessiner dans la texture avec
les identifiants et à nouveau pour dessiner la scène sur le canvas.

```js
// Dessiner la scène.
function drawScene(time) {
  time *= 0.0005;

  ...

  // Calculer les matrices pour chaque objet.
  objects.forEach(function(object) {
    object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time);
  });

+  // ------ Dessiner les objets dans la texture --------
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  gl.enable(gl.CULL_FACE);
+  gl.enable(gl.DEPTH_TEST);
+
+  // Effacer le canvas ET le depth buffer.
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+
+  drawObjects(objectsToDraw, pickingProgramInfo);
+
+  // ------ Dessiner les objets sur le canvas
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  drawObjects(objectsToDraw);

  requestAnimationFrame(drawScene);
}
```

Notre shader de picking a besoin que `u_id` soit défini sur un identifiant, donc
ajoutons cela à nos données d'uniforms là où nous configurons nos objets.

```js
// Créer des infos pour chaque objet.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
+  const id = ii + 1;

  // choisir une forme
  const shape = shapes[rand(shapes.length) | 0];

  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
+      u_id: [
+        ((id >>  0) & 0xFF) / 0xFF,
+        ((id >>  8) & 0xFF) / 0xFF,
+        ((id >> 16) & 0xFF) / 0xFF,
+        ((id >> 24) & 0xFF) / 0xFF,
+      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
  objects.push(object);

  // L'ajouter à la liste des choses à dessiner.
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shape.bufferInfo,
    vertexArray: shape.vertexArray,
    uniforms: object.uniforms,
  });
}
```

Cela fonctionnera car notre [bibliothèque helper](webgl-less-code-more-fun.html)
gère l'application des uniforms pour nous.

Nous avons dû répartir les identifiants sur R, G, B et A. Parce que le
format/type de notre texture est `gl.RGBA`, `gl.UNSIGNED_BYTE`,
nous obtenons 8 bits par canal. 8 bits ne représentent que 256 valeurs,
mais en répartissant l'identifiant sur 4 canaux, nous obtenons 32 bits au total,
ce qui représente plus de 4 milliards de valeurs.

Nous ajoutons 1 à l'identifiant car nous utiliserons 0 pour signifier
"rien sous la souris".

Maintenant, mettons en surbrillance l'objet sous la souris.

D'abord, nous avons besoin de code pour obtenir la position de la souris
relative au canvas.

```js
// mouseX et mouseY sont en pixels CSS dans l'espace d'affichage relatif au canvas
let mouseX = -1;
let mouseY = -1;

...

gl.canvas.addEventListener('mousemove', (e) => {
   const rect = canvas.getBoundingClientRect();
   mouseX = e.clientX - rect.left;
   mouseY = e.clientY - rect.top;
});
```

Notez qu'avec le code ci-dessus, `mouseX` et `mouseY`
sont en pixels CSS dans l'espace d'affichage. Cela signifie
qu'ils sont dans l'espace où le canvas est affiché,
et non dans l'espace du nombre de pixels dans le canvas.
En d'autres termes, si vous aviez un canvas comme ça

```html
<canvas width="11" height="22" style="width:33px; height:44px;"></canvas>
```

alors `mouseX` ira de 0 à 33 sur le canvas et
`mouseY` ira de 0 à 44 sur le canvas. Voir [ceci](webgl-resizing-the-canvas.html)
pour plus d'informations.

Maintenant que nous avons une position de souris, ajoutons du code
pour rechercher le pixel sous la souris

```js
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
    pixelX,            // x
    pixelY,            // y
    1,                 // largeur
    1,                 // hauteur
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // tableau typé pour stocker le résultat
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
```

Le code ci-dessus qui calcule `pixelX` et `pixelY` convertit
de `mouseX` et `mouseY` en espace d'affichage vers des pixels dans l'espace
du canvas. En d'autres termes, avec l'exemple ci-dessus où `mouseX` allait de
0 à 33 et `mouseY` allait de 0 à 44, `pixelX` ira de 0 à 11
et `pixelY` ira de 0 à 22.

Dans notre code réel, nous utilisons notre fonction utilitaire `resizeCanvasToDisplaySize`
et nous faisons en sorte que notre texture ait la même taille que le canvas, donc la taille d'affichage
et la taille du canvas correspondent, mais au moins nous sommes prêts pour le cas
où elles ne correspondent pas.

Maintenant que nous avons un identifiant, pour réellement mettre en surbrillance l'objet sélectionné,
changeons la couleur que nous utilisons pour le rendre sur le canvas.
Le shader que nous utilisions a un uniform `u_colorMult`
que nous pouvons utiliser, donc si un objet est sous la souris, nous le recherchons,
sauvegardons sa valeur `u_colorMult`, la remplaçons par une couleur de sélection,
et la restaurons.

```js
// mouseX et mouseY sont en pixels CSS dans l'espace d'affichage relatif au canvas
let mouseX = -1;
let mouseY = -1;
+let oldPickNdx = -1;
+let oldPickColor;
+let frameCount = 0;

// Dessiner la scène.
function drawScene(time) {
  time *= 0.0005;
+  ++frameCount;

  // ------ Dessiner les objets dans la texture --------

  ...

  // ------ Déterminer quel pixel est sous la souris et le lire

  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
  const data = new Uint8Array(4);
  gl.readPixels(
      pixelX,            // x
      pixelY,            // y
      1,                 // largeur
      1,                 // hauteur
      gl.RGBA,           // format
      gl.UNSIGNED_BYTE,  // type
      data);             // tableau typé pour stocker le résultat
  const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

  // restaurer la couleur de l'objet
  if (oldPickNdx >= 0) {
    const object = objects[oldPickNdx];
    object.uniforms.u_colorMult = oldPickColor;
    oldPickNdx = -1;
  }

  // mettre en surbrillance l'objet sous la souris
  if (id > 0) {
    const pickNdx = id - 1;
    oldPickNdx = pickNdx;
    const object = objects[pickNdx];
    oldPickColor = object.uniforms.u_colorMult;
    object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
  }

  // ------ Dessiner les objets sur le canvas

```

Et avec ça, nous devrions pouvoir déplacer la souris sur
la scène et l'objet sous la souris clignotera

{{{example url="../webgl-picking-w-gpu.html" }}}

Une optimisation que nous pouvons faire : nous rendons
les identifiants vers une texture de la même taille
que le canvas. C'est conceptuellement la chose la plus simple
à faire.

Mais, nous pourrions à la place rendre seulement le pixel
sous la souris. Pour ce faire, nous utilisons un frustum
dont les maths couvriront juste l'espace pour ce
1 pixel.

Jusqu'à présent, pour la 3D, nous avons utilisé une fonction appelée
`perspective` qui prend en entrée un champ de vision, un aspect et des valeurs
near et far pour les plans z, et crée une
matrice de projection perspective qui convertit depuis le
frustum défini par ces valeurs vers le clip space.

La plupart des bibliothèques mathématiques 3D ont une autre fonction appelée
`frustum` qui prend 6 valeurs, les valeurs gauche, droite, haut,
et bas pour le plan near z, puis les valeurs near et far z pour les plans z, et génère
une matrice de perspective définie par ces valeurs.

En utilisant cela, nous pouvons générer une matrice de projection pour
le seul pixel sous la souris.

D'abord, nous calculons les bords et la taille de ce que serait notre plan near
si nous utilisions la fonction `perspective`

```js
// calculer le rectangle que couvre le plan near de notre frustum
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const top = Math.tan(fieldOfViewRadians * 0.5) * near;
const bottom = -top;
const left = aspect * bottom;
const right = aspect * top;
const width = Math.abs(right - left);
const height = Math.abs(top - bottom);
```

Donc `left`, `right`, `width` et `height` sont la
taille et la position du plan near. Maintenant sur ce
plan, nous pouvons calculer la taille et la position du
seul pixel sous la souris et les passer à la
fonction `frustum` pour générer une matrice de projection
qui couvre juste ce 1 pixel

```js
// calculer la portion du plan near qui couvre le 1 pixel
// sous la souris.
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

const subLeft = left + pixelX * width / gl.canvas.width;
const subBottom = bottom + pixelY * height / gl.canvas.height;
const subWidth = width / gl.canvas.width;
const subHeight = height / gl.canvas.height;

// créer un frustum pour ce 1 pixel
const projectionMatrix = m4.frustum(
    subLeft,
    subLeft + subWidth,
    subBottom,
    subBottom + subHeight,
    near,
    far);
```

Pour l'utiliser, nous devons apporter quelques modifications. Actuellement, notre shader
prend juste `u_matrix`, ce qui signifie que pour dessiner avec une matrice de
projection différente, nous devrions recalculer les matrices pour chaque objet
deux fois par frame, une fois avec notre matrice de projection normale pour dessiner
sur le canvas et à nouveau pour cette matrice de projection à 1 pixel.

Nous pouvons supprimer cette responsabilité de JavaScript en déplaçant cette
multiplication vers les vertex shaders.

```html
const vs = `#version 300 es

in vec4 a_position;
in vec4 a_color;

-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;

out vec4 v_color;

void main() {
  // Multiplier la position par la matrice.
-  gl_Position = u_matrix * a_position;
+  gl_Position = u_viewProjection * u_world * a_position;

  // Passer la couleur au fragment shader.
  v_color = a_color;
}
`;

...

const pickingVS = `#version 300 es
  in vec4 a_position;
  
-  uniform mat4 u_matrix;
+  uniform mat4 u_viewProjection;
+  uniform mat4 u_world;
  
  void main() {
    // Multiplier la position par la matrice.
-   gl_Position = u_matrix * a_position;
+    gl_Position = u_viewProjection * u_world * a_position;
  }
`;
```

Ensuite, nous pouvons rendre notre `viewProjectionMatrix` JavaScript
partagée entre tous les objets.

```js
const objectsToDraw = [];
const objects = [];
+const viewProjectionMatrix = m4.identity();

// Créer des infos pour chaque objet.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
  const id = ii + 1;

  // choisir une forme
  const shape = shapes[rand(shapes.length) | 0];

  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
-      u_matrix: m4.identity(),
+      u_world: m4.identity(),
+      u_viewProjection: viewProjectionMatrix,
      u_id: [
        ((id >>  0) & 0xFF) / 0xFF,
        ((id >>  8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF,
      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
```

Et là où nous calculons les matrices pour chaque objet, nous n'avons plus besoin
d'inclure la matrice view projection

```js
-function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
-  let matrix = m4.translate(viewProjectionMatrix,
+function computeMatrix(translation, xRotation, yRotation) {
+  let matrix = m4.translation(
      translation[0],
      translation[1],
      translation[2]);
  matrix = m4.xRotate(matrix, xRotation);
  return m4.yRotate(matrix, yRotation);
}
...

// Calculer les matrices pour chaque objet.
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
-      viewProjectionMatrix,
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});
```

Nous allons créer juste une texture 1x1 pixel et un depth buffer

```js
setFramebufferAttachmentSizes(1, 1);

...

// Dessiner la scène.
function drawScene(time) {
  time *= 0.0005;
  ++frameCount;

-  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
-    // le canvas a été redimensionné, faire correspondre les attachements du framebuffer
-    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
-  }
+  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
```

Avant de rendre les identifiants hors écran, nous définirons la view projection
en utilisant notre matrice de projection à 1 pixel, puis lors du dessin sur le canvas,
nous utiliserons la matrice de projection originale

```js
-// Calculer la matrice de projection
-const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
-const projectionMatrix =
-    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// Calculer la matrice de la caméra avec lookAt.
const cameraPosition = [0, 0, 100];
const target = [0, 0, 0];
const up = [0, 1, 0];
const cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Créer une matrice view depuis la matrice caméra.
const viewMatrix = m4.inverse(cameraMatrix);

-const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

// Calculer les matrices pour chaque objet.
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});

// ------ Dessiner les objets dans la texture --------

// Déterminer quel pixel est sous la souris et configurer
// un frustum pour ne rendre que ce pixel

{
  // calculer le rectangle que couvre le plan near de notre frustum
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const top = Math.tan(fieldOfViewRadians * 0.5) * near;
  const bottom = -top;
  const left = aspect * bottom;
  const right = aspect * top;
  const width = Math.abs(right - left);
  const height = Math.abs(top - bottom);

  // calculer la portion du plan near qui couvre le 1 pixel
  // sous la souris.
  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

  const subLeft = left + pixelX * width / gl.canvas.width;
  const subBottom = bottom + pixelY * height / gl.canvas.height;
  const subWidth = width / gl.canvas.width;
  const subHeight = height / gl.canvas.height;

  // créer un frustum pour ce 1 pixel
  const projectionMatrix = m4.frustum(
      subLeft,
      subLeft + subWidth,
      subBottom,
      subBottom + subHeight,
      near,
      far);
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
}

gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, 1, 1);

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

// Effacer le canvas ET le depth buffer.
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

drawObjects(objectsToDraw, pickingProgramInfo);

// lire le 1 pixel
-const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
-const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
-    pixelX,            // x
-    pixelY,            // y
+    0,                 // x
+    0,                 // y
    1,                 // largeur
    1,                 // hauteur
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    data);             // tableau typé pour stocker le résultat
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

// restaurer la couleur de l'objet
if (oldPickNdx >= 0) {
  const object = objects[oldPickNdx];
  object.uniforms.u_colorMult = oldPickColor;
  oldPickNdx = -1;
}

// mettre en surbrillance l'objet sous la souris
if (id > 0) {
  const pickNdx = id - 1;
  oldPickNdx = pickNdx;
  const object = objects[pickNdx];
  oldPickColor = object.uniforms.u_colorMult;
  object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
}

// ------ Dessiner les objets sur le canvas

+{
+  // Calculer la matrice de projection
+  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+  const projectionMatrix =
+      m4.perspective(fieldOfViewRadians, aspect, near, far);
+
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
+}

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

drawObjects(objectsToDraw);
```

Et vous pouvez voir que les maths fonctionnent, nous ne dessinons qu'un seul pixel
et nous déterminons toujours ce qui est sous la souris

{{{example url="../webgl-picking-w-gpu-1pixel.html"}}}
