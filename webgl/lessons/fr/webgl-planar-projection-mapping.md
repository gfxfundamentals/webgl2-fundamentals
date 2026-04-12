Title: WebGL2 Projection planaire et en perspective
Description: Projeter une texture comme un plan
TOC: Projection planaire et en perspective

Cet article suppose que vous avez lu l'article sur
[moins de code, plus de fun](webgl-less-code-more-fun.html)
car il utilise la bibliothèque mentionnée là-bas pour alléger les exemples.
Si vous ne comprenez pas ce que sont les tampons, les vertex arrays et les attributs,
ou ce que fait une fonction nommée `twgl.setUniforms`, etc., vous devriez
probablement revenir en arrière et [lire les fondamentaux](webgl-fundamentals.html).

Il suppose également que vous avez lu [les articles sur la perspective](webgl-3d-perspective.html),
[l'article sur les caméras](webgl-3d-camera.html), [l'article sur les textures](webgl-3d-textures.html),
et [l'article sur la visualisation de la caméra](webgl-visualizing-the-camera.html). Si
vous ne les avez pas lus, commencez probablement par là.

La projection mapping est le processus de "projection" d'une image au sens
d'un projecteur de cinéma pointé sur un écran et projetant un film dessus.
Un projecteur de cinéma projette un plan en perspective. Plus l'écran est éloigné
du projecteur, plus l'image est grande. Si vous inclinez l'écran de façon à
ce qu'il ne soit pas perpendiculaire au projecteur, le résultat est
un trapèze ou un quadrilatère quelconque.

<div class="webgl_center"><img src="resources/perspective-projection.svg" style="width: 400px"></div>

Bien sûr, la projection mapping n'a pas à être plane. Il existe par exemple
la projection cylindrique, la projection sphérique, etc.

Commençons par la projection planaire. Dans ce cas,
imaginez que le projecteur a la même taille que l'écran,
de sorte qu'au lieu que l'image grandisse à mesure que l'écran s'éloigne
du projecteur, elle reste de la même taille.

<div class="webgl_center"><img src="resources/orthographic-projection.svg" style="width: 400px"></div>

Créons d'abord une scène simple qui dessine un plan et une sphère.
Nous les texturerons tous les deux avec une simple texture de damier 8x8.

Les shaders sont similaires à ceux de [l'article sur les textures](webgl-3d-textures.html),
sauf que les différentes matrices sont séparées pour ne pas avoir à les multiplier
en JavaScript.

```js
const vs = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec2 v_texcoord;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;

  // Passe la coordonnée de texture au fragment shader.
  v_texcoord = a_texcoord;
}
`;
```

J'ai aussi ajouté un uniform `u_colorMult` pour multiplier la couleur de la texture.
En utilisant une texture monochrome, on peut changer sa couleur de cette façon.

```js
const fs = `#version 300 es
precision highp float;

// Reçu du vertex shader.
in vec2 v_texcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_texcoord) * u_colorMult;
}
`;
```

Voici le code pour configurer le programme, les tampons de la sphère et du plan :

```js
// configure le programme GLSL
// compile les shaders, lie le programme, récupère les emplacements
const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // rayon
    12, // subdivisions autour
    6,  // subdivisions en bas
);
const sphereVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, sphereBufferInfo);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // largeur
    20,  // hauteur
    1,   // subdivisions horizontales
    1,   // subdivisions verticales
);
const planeVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, planeBufferInfo);
```

et le code pour créer une texture de damier 8x8 en utilisant les techniques
couvertes dans [l'article sur les textures de données](webgl-data-textures.html).

```js
// crée une texture de damier 8x8
const checkerboardTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // niveau mip
    gl.LUMINANCE,     // format interne
    8,                // largeur
    8,                // hauteur
    0,                // bordure
    gl.LUMINANCE,     // format
    gl.UNSIGNED_BYTE, // type
    new Uint8Array([  // données
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
    ]));
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Pour dessiner, nous allons créer une fonction qui prend une matrice de projection
et une matrice de caméra, calcule la matrice de vue à partir de la matrice de caméra
puis dessine la sphère et le plan :

```js
// Uniforms pour chaque objet.
const planeUniforms = {
  u_colorMult: [0.5, 0.5, 1, 1],  // bleu clair
  u_texture: checkerboardTexture,
  u_world: m4.translation(0, 0, 0),
};
const sphereUniforms = {
  u_colorMult: [1, 0.5, 0.5, 1],  // rose
  u_texture: checkerboardTexture,
  u_world: m4.translation(2, 3, 4),
};

function drawScene(projectionMatrix, cameraMatrix) {
  // Crée une matrice de vue à partir de la matrice de caméra.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(textureProgramInfo.program);

  // Définit l'uniform partagé par la sphère et le plan
  twgl.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
  });

  // ------ Dessine la sphère --------

  // Configure tous les attributs nécessaires.
  gl.bindVertexArray(sphereVAO);

  // Définit les uniforms propres à la sphère
  twgl.setUniforms(textureProgramInfo, sphereUniforms);

  // appelle gl.drawArrays ou gl.drawElements
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ Dessine le plan --------

  // Configure tous les attributs nécessaires.
  gl.bindVertexArray(planeVAO);

  // Définit les uniforms propres au plan
  twgl.setUniforms(textureProgramInfo, planeUniforms);

  // appelle gl.drawArrays ou gl.drawElements
  twgl.drawBufferInfo(gl, planeBufferInfo);
}
```

Nous pouvons utiliser ce code depuis une fonction `render` comme ceci :

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
};
const fieldOfViewRadians = degToRad(60);

function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // Indique à WebGL comment convertir du clip space en pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Efface le canvas ET le tampon de profondeur.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Calcule la matrice de projection
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // Calcule la matrice de la caméra avec lookAt.
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  drawScene(projectionMatrix, cameraMatrix);
}
render();
```

Nous avons donc une scène simple avec un plan et une sphère.
J'ai ajouté quelques curseurs pour permettre de changer la position de la caméra
afin de mieux comprendre la scène.

{{{example url="../webgl-planar-projection-setup.html"}}}

Maintenant, projetons une texture sur la sphère et le plan.

La première chose à faire est de [charger une texture](webgl-3d-textures.html).

```js
function loadImageTexture(url) {
  // Crée une texture.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Remplit la texture avec un pixel bleu 1x1.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // Charge une image de façon asynchrone
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // Maintenant que l'image est chargée, on la copie dans la texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // suppose que cette texture est une puissance de 2
    gl.generateMipmap(gl.TEXTURE_2D);
    render();
  });
  return texture;
}

const imageTexture = loadImageTexture('resources/f-texture.png');
```

Rappelons-nous de [l'article sur la visualisation de la caméra](webgl-visualizing-the-camera.html) :
nous avons créé un cube allant de -1 à +1 et l'avons dessiné pour représenter le frustum de la caméra.
Nos matrices faisaient en sorte que l'espace à l'intérieur de ce frustum représente une zone en forme
de frustum dans l'espace monde, convertie vers le clip space -1 à +1. Nous pouvons faire quelque chose
de similaire ici.

Essayons. D'abord, dans notre fragment shader, nous allons dessiner la texture projetée
partout où ses coordonnées de texture sont entre 0.0 et 1.0.
En dehors de cette plage, nous utiliserons la texture de damier :

```js
const fs = `#version 300 es
precision highp float;

// Reçu du vertex shader.
in vec2 v_texcoord;
+in vec4 v_projectedTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
+uniform sampler2D u_projectedTexture;

out vec4 outColor;

void main() {
-  outColor = texture(u_texture, v_texcoord) * u_colorMult;
+  // divise par w pour obtenir la valeur correcte. Voir l'article sur la perspective
+  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+
+  bool inRange = 
+      projectedTexcoord.x >= 0.0 &&
+      projectedTexcoord.x <= 1.0 &&
+      projectedTexcoord.y >= 0.0 &&
+      projectedTexcoord.y <= 1.0;
+
+  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
+  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
+
+  float projectedAmount = inRange ? 1.0 : 0.0;
+  outColor = mix(texColor, projectedTexColor, projectedAmount);
}
`;
```

Pour calculer les coordonnées de texture projetées, nous allons créer une
matrice qui représente un espace 3D orienté et positionné dans une certaine
direction, tout comme la caméra dans [l'article sur la visualisation de la caméra](webgl-visualizing-the-camera.html).
Nous projetterons ensuite les positions mondiales des sommets de la sphère et
du plan à travers cet espace. Là où ils se trouvent entre 0 et 1, le code que
nous venons d'écrire affichera la texture.

Ajoutons du code au vertex shader pour projeter les positions mondiales de la
sphère et du plan à travers cet *espace* :

```js
const vs = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
+uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
+out vec4 v_projectedTexcoord;

void main() {
+  vec4 worldPosition = u_world * a_position;

-  gl_Position = u_projection * u_view * u_world * a_position;
+  gl_Position = u_projection * u_view * worldPosition;

  // Passe la coordonnée de texture au fragment shader.
  v_texcoord = a_texcoord;

+  v_projectedTexcoord = u_textureMatrix * worldPosition;
}
```

Il ne reste plus qu'à calculer la matrice qui définit cet espace orienté.
Tout ce qu'on a à faire, c'est calculer une matrice monde comme pour n'importe
quel autre objet, puis prendre son inverse. Cela nous donnera une matrice qui
nous permet d'orienter les positions mondiales d'autres objets relativement à
cet espace. C'est exactement ce que fait la matrice de vue dans
[l'article sur les caméras](webgl-3d-camera.html).

Nous utiliserons notre fonction `lookAt` créée dans [ce même article](webgl-3d-camera.html) :

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
+  posX: 3.5,
+  posY: 4.4,
+  posZ: 4.7,
+  targetX: 0.8,
+  targetY: 0,
+  targetZ: 4.7,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // Crée une matrice de vue à partir de la matrice de caméra.
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // cible
      [0, 1, 0],                                              // haut
  );

  // utilise l'inverse de cette matrice monde pour obtenir
  // une matrice qui transformera d'autres positions
  // relativement à cet espace monde.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  // définit les uniforms identiques pour la sphère et le plan
  twgl.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_textureMatrix: textureMatrix,
+    u_projectedTexture: imageTexture,
  });

  ...
}
```

Bien sûr, vous n'êtes pas obligé d'utiliser `lookAt`. Vous pouvez créer une
matrice monde de n'importe quelle façon, par exemple en utilisant un
[graphe de scène](webgl-scene-graph.html) ou une [pile de matrices](webgl-2d-matrix-stack.html).

Avant d'exécuter, ajoutons une échelle :

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 3.5,
  posY: 4.4,
  posZ: 4.7,
  targetX: 0.8,
  targetY: 0,
  targetZ: 4.7,
+  projWidth: 2,
+  projHeight: 2,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // Crée une matrice de vue à partir de la matrice de caméra.
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // cible
      [0, 1, 0],                                              // haut
  );
+  textureWorldMatrix = m4.scale(
+      textureWorldMatrix,
+      settings.projWidth, settings.projHeight, 1,
+  );

  // utilise l'inverse de cette matrice monde pour obtenir
  // une matrice qui transformera d'autres positions
  // relativement à cet espace monde.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  ...
}
```

et avec ça, nous obtenons une texture projetée.

{{{example url="../webgl-planar-projection.html"}}}

Il est peut-être difficile de voir l'espace dans lequel se trouve la texture.
Ajoutons un cube en fil de fer pour aider à visualiser.

Il nous faut d'abord un ensemble séparé de shaders. Ces shaders
peuvent simplement dessiner une couleur unie, sans textures.

```js
const colorVS = `#version 300 es
in vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
  // Multiplie la position par les matrices.
  gl_Position = u_projection * u_view * u_world * a_position;
}
`;
```

```js
const colorFS = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
```

Ensuite, nous devons compiler et lier ces shaders :

```js
// configure les programmes GLSL
const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
+const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS]);
```

Et nous avons besoin de données pour dessiner un cube fait de lignes :

```js
const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // rayon
    12, // subdivisions autour
    6,  // subdivisions en bas
);
const sphereVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, sphereBufferInfo);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // largeur
    20,  // hauteur
    1,   // subdivisions horizontales
    1,   // subdivisions verticales
);
const planeVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, planeBufferInfo);
+const cubeLinesBufferInfo = twgl.createBufferInfoFromArrays(gl, {
+  position: [
+     0,  0, -1,
+     1,  0, -1,
+     0,  1, -1,
+     1,  1, -1,
+     0,  0,  1,
+     1,  0,  1,
+     0,  1,  1,
+     1,  1,  1,
+  ],
+  indices: [
+    0, 1,
+    1, 3,
+    3, 2,
+    2, 0,
+
+    4, 5,
+    5, 7,
+    7, 6,
+    6, 4,
+
+    0, 4,
+    1, 5,
+    3, 7,
+    2, 6,
+  ],
+});
+const cubeLinesVAO = twgl.createVAOFromBufferInfo(
+    gl, colorProgramInfo, cubeLinesBufferInfo);
```

Remarquez que ce cube va de 0 à 1 en X et Y pour correspondre aux coordonnées
de texture. En Z, il va de -1 à 1. Cela nous permettra de le mettre à l'échelle
pour l'étirer dans les deux directions.

Pour l'utiliser, on peut simplement utiliser la `textureWorldMatrix`
d'avant puisque tout ce qu'on veut faire c'est dessiner le cube là où cet espace existe.

```js
function drawScene(projectionMatrix, cameraMatrix) {

  ...
+  // ------ Dessine le cube ------
+
+  gl.useProgram(colorProgramInfo.program);
+
+  // Configure tous les attributs nécessaires.
+  gl.bindVertexArray(cubeLinesVAO);
+
+  // met le cube à l'échelle en Z pour qu'il soit très long
+  // pour représenter que la texture est projetée à l'infini
+  const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);
+
+  // Définit les uniforms qu'on vient de calculer
+  twgl.setUniforms(colorProgramInfo, {
+    u_color: [0, 0, 0, 1],
+    u_view: viewMatrix,
+    u_projection: projectionMatrix,
+    u_world: mat,
+  });
+
+  // appelle gl.drawArrays ou gl.drawElements
+  twgl.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
}
```

Et maintenant on peut voir plus facilement où se fait la projection.

{{{example url="../webgl-planar-projection-with-lines.html"}}}

Il est important de noter que nous ne *projetons* pas vraiment la texture.
Nous faisons plutôt le contraire. Pour chaque pixel d'un objet rendu,
on cherche quelle partie de la texture y serait projetée, puis on lit la couleur
à cette partie de la texture.

Puisque nous avons mentionné les projecteurs de cinéma, comment simulerions-nous
un projecteur de cinéma ? Fondamentalement, on peut juste multiplier par une matrice de projection :

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
+  perspective: true,
+  fieldOfView: 45,
};

...

function drawScene(projectionMatrix, cameraMatrix) {
  // Crée une matrice de vue à partir de la matrice de caméra.
  const viewMatrix = m4.inverse(cameraMatrix);

  const textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // cible
      [0, 1, 0],                                              // haut
  );
-  textureWorldMatrix = m4.scale(
-      textureWorldMatrix,
-      settings.projWidth, settings.projHeight, 1,
-  );
  
+  const textureProjectionMatrix = settings.perspective
+      ? m4.perspective(
+          degToRad(settings.fieldOfView),
+          settings.projWidth / settings.projHeight,
+          0.1,  // near
+          200)  // far
+      : m4.orthographic(
+          -settings.projWidth / 2,   // gauche
+           settings.projWidth / 2,   // droite
+          -settings.projHeight / 2,  // bas
+           settings.projHeight / 2,  // haut
+           0.1,                      // near
+           200);                     // far

  // utilise l'inverse de cette matrice monde pour obtenir
  // une matrice qui transformera d'autres positions
  // relativement à cet espace monde.
-  const textureMatrix = m4.inverse(textureWorldMatrix);
+  const textureMatrix = m4.multiply(
+      textureProjectionMatrix,
+      m4.inverse(textureWorldMatrix));
```

Notez qu'il y a une option pour utiliser une matrice de projection en perspective
ou orthographique.

Nous devons aussi utiliser cette matrice de projection lors du dessin des lignes :

```js
// ------ Dessine le cube ------

...

-// met le cube à l'échelle en Z pour qu'il soit très long
-// pour représenter que la texture est projetée à l'infini
-const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);

+// oriente le cube pour correspondre à la projection.
+const mat = m4.multiply(
+    textureWorldMatrix, m4.inverse(textureProjectionMatrix));
```

et avec ça on obtient :

{{{example url="../webgl-planar-projection-with-projection-matrix-0-to-1.html"}}}

Ça fonctionne en partie, mais notre projection et les lignes du cube
utilisent l'espace 0 à 1, donc ça n'utilise qu'un quart du frustum de projection.

Pour corriger ça, faisons d'abord en sorte que notre cube soit un cube -1 à +1
dans toutes les directions :

```js
const cubeLinesBufferInfo = twgl.createBufferInfoFromArrays(gl, {
  position: [
-     0,  0, -1,
-     1,  0, -1,
-     0,  1, -1,
-     1,  1, -1,
-     0,  0,  1,
-     1,  0,  1,
-     0,  1,  1,
-     1,  1,  1,
+    -1, -1, -1,
+     1, -1, -1,
+    -1,  1, -1,
+     1,  1, -1,
+    -1, -1,  1,
+     1, -1,  1,
+    -1,  1,  1,
+     1,  1,  1,
  ],
  indices: [
    0, 1,
    1, 3,
    3, 2,
    2, 0,

    4, 5,
    5, 7,
    7, 6,
    6, 4,

    0, 4,
    1, 5,
    3, 7,
    2, 6,
  ],
});
```

Ensuite, nous devons faire en sorte que l'espace à l'intérieur du frustum aille
de 0 à 1 pour notre matrice de texture, ce qu'on peut faire en décalant l'espace
de 0.5 et en le mettant à l'échelle de 0.5 :

```js
const textureWorldMatrix = m4.lookAt(
    [settings.posX, settings.posY, settings.posZ],          // position
    [settings.targetX, settings.targetY, settings.targetZ], // cible
    [0, 1, 0],                                              // haut
);
const textureProjectionMatrix = settings.perspective
    ? m4.perspective(
        degToRad(settings.fieldOfView),
        settings.projWidth / settings.projHeight,
        0.1,  // near
        200)  // far
    : m4.orthographic(
        -settings.projWidth / 2,   // gauche
         settings.projWidth / 2,   // droite
        -settings.projHeight / 2,  // bas
         settings.projHeight / 2,  // haut
         0.1,                      // near
         200);                     // far

-// utilise l'inverse de cette matrice monde pour obtenir
-// une matrice qui transformera d'autres positions
-// relativement à cet espace monde.
-const textureMatrix = m4.multiply(
-    textureProjectionMatrix,
-    m4.inverse(textureWorldMatrix));

+let textureMatrix = m4.identity();
+textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+// utilise l'inverse de cette matrice monde pour obtenir
+// une matrice qui transformera d'autres positions
+// relativement à cet espace monde.
+textureMatrix = m4.multiply(
+    textureMatrix,
+    m4.inverse(textureWorldMatrix));
```

Et maintenant ça fonctionne :

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

À quoi sert la projection planaire d'une texture ?

L'une des raisons est simplement parce qu'on le veut. La plupart des logiciels
de modélisation 3D offrent un moyen de faire de la projection planaire avec une texture.

Une autre est les décalcomanies (decals). Les décalcomanies permettent de mettre
des éclaboussures de peinture ou des marques d'explosion sur une surface. Elles ne
fonctionnent généralement pas via des shaders comme ci-dessus. Au lieu de ça, on
écrit une fonction qui parcourt la géométrie des modèles sur lesquels on veut
appliquer la décalcomanie. Pour chaque triangle, on vérifie s'il est dans la zone où
la décalcomanie s'appliquerait, comme la vérification `inRange` dans le shader. Pour
chaque triangle qui est dans la plage, on l'ajoute à une nouvelle géométrie avec les
coordonnées de texture projetées. On ajoute ensuite cette décalcomanie à la liste des
choses à dessiner.

Générer de la géométrie est la bonne approche, sinon il faudrait des shaders
différents pour 2 décalcomanies, 3 décalcomanies, 4 décalcomanies, etc., et les
shaders deviendraient rapidement trop complexes et atteindraient la limite de textures
du shader GPU.

Une autre utilisation est la simulation du
[vidéo mapping](https://fr.wikipedia.org/wiki/Projection_mapping) réel.
On construit un modèle 3D de la chose sur laquelle on va projeter de la vidéo, puis
on fait la projection avec le code ci-dessus mais avec de la vidéo comme texture.
On peut ensuite perfectionner et éditer la vidéo pour correspondre au modèle sans
avoir à être sur place avec un vrai projecteur.

Ce type de projection est aussi utile pour
[calculer les ombres avec les shadow maps](webgl-shadows.html).

<div class="webgl_bottombar">
<h3>Références de textures conditionnelles</h3>
<p>Dans le fragment shader ci-dessus, nous lisons les deux textures dans tous les cas.</p>
<pre class="prettyprint"><code>{{#escapehtml}}
  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
{{/escapehtml}}</code></pre>
<p>Pourquoi ne pas faire quelque chose comme ça ?</p>
<pre class="prettyprint"><code>{{#escapehtml}}
  if (inRange) {
    gl_FragColor = texture(u_projectedTexture, projectedTexcoord.xy);
  } else {
    gl_FragColor = texture(u_texture, v_texcoord) * u_colorMult;
  }
{{/escapehtml}}</code></pre>
<p>D'après la <a href="https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf">spécification GLSL ES 3.0 Section 8.8</a></p>
<blockquote>
<h4>Fonctions de recherche de texture</h4>
<p>
Certaines fonctions de texture (les versions non-"Lod" et non-"Grad") peuvent nécessiter des dérivées implicites. Les
dérivées implicites sont indéfinies dans un flux de contrôle non uniforme et pour les accès de texture dans le vertex shader.
</p>
</blockquote>
<p>En d'autres termes, si nous allons utiliser des textures, nous devons toujours y accéder. Nous pouvons utiliser les
résultats conditionnellement. Par exemple, nous aurions pu écrire ceci :</p>
<pre class="prettyprint"><code>{{#escapehtml}}
  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  if (inRange) {
    gl_FragColor = projectedTexColor;
  } else {
    gl_FragColor = texColor;
  }
{{/escapehtml}}</code></pre>
<p>ou ceci</p>
<pre class="prettyprint"><code>{{#escapehtml}}
  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  gl_FragColor = inRange ? projectedTexColor : texColor;
{{/escapehtml}}</code></pre>
<p>Mais nous ne pouvons pas accéder aux textures elles-mêmes de façon conditionnelle. Ça peut fonctionner sur votre GPU
mais ne fonctionnera pas sur tous les GPUs.</p>
<p>Dans tous les cas, c'est important à savoir.</p>
<p>Quant à la raison pour laquelle j'ai utilisé <code>mix</code> plutôt que
de simplement brancher sur <code>inRange</code>, c'est une préférence personnelle. <code>mix</code>
est plus flexible donc je l'écris généralement ainsi.</p>
</div>
