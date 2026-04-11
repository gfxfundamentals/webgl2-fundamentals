Title: WebGL2 SkyBox
Description: Montrer le ciel avec une skybox !
TOC: Skyboxes


Cet article fait partie d'une série d'articles sur WebGL.
[Le premier article commence par les bases](webgl-fundamentals.html).
Cet article s'appuie sur [l'article sur les cartes d'environnement](webgl-environment-maps.html).

Une *skybox* est une boîte avec des textures dessus pour ressembler au ciel dans toutes les directions,
ou plutôt pour ressembler à ce qui est très loin, y compris l'horizon. Imaginez
que vous êtes dans une pièce et que sur chaque mur il y a une affiche pleine taille d'une vue,
ajoutez une affiche pour couvrir le plafond montrant le ciel et une pour le sol
montrant le sol, et vous avez une skybox.

Beaucoup de jeux 3D font cela en créant simplement un cube, en le rendant très grand, en mettant
une texture de ciel dessus.

Cela fonctionne mais ça a des problèmes. L'un d'eux est que vous avez un cube que vous devez
voir dans plusieurs directions, quelle que soit la direction vers laquelle la caméra est orientée. Vous voulez
que tout soit dessiné loin, mais vous ne voulez pas que les coins du cube dépassent
le plan de découpage. Compliquant ce problème, pour des raisons de performance, vous voulez
dessiner les choses proches avant les choses lointaines car le GPU, en utilisant [le test du depth buffer
](webgl-3d-orthographic.html), peut ignorer le dessin des pixels qu'il sait qu'ils échoueront
le test. Donc idéalement, vous devriez dessiner la skybox en dernier avec le test de profondeur activé, mais
si vous utilisez réellement une boîte, lorsque la caméra regarde dans différentes directions, les
coins de la boîte seront plus loin que les côtés, causant des problèmes.

<div class="webgl_center"><img src="resources/skybox-issues.svg" style="width: 500px"></div>

Vous pouvez voir ci-dessus que nous devons nous assurer que le point le plus éloigné du cube est dans
le frustum, mais à cause de cela, certains bords du cube pourraient finir par couvrir des
objets que nous ne voulons pas couvrir.

La solution typique est de désactiver le test de profondeur et de dessiner la skybox d'abord, mais
alors nous ne bénéficions pas du test du depth buffer qui n'affiche pas les pixels que nous allons
ensuite couvrir avec les éléments de notre scène.

Au lieu d'utiliser un cube, dessinons juste un quad qui couvre tout le canvas et
utilisons [un cubemap](webgl-cube-maps.html). Normalement, nous utilisons une matrice view projection
pour projeter un quad dans l'espace 3D. Dans ce cas, nous allons faire le contraire. Nous allons utiliser
l'inverse de la matrice view projection pour travailler à l'envers et obtenir la direction dans laquelle
la caméra regarde pour chaque pixel sur le quad. Cela nous donnera des directions pour
regarder dans le cubemap.

En partant de [l'exemple de carte d'environnement](webgl-environment-maps.html), j'ai
supprimé tout le code lié aux normales car nous ne les utilisons pas ici. Ensuite, nous
avons besoin d'un quad.

```js
// Remplir le buffer avec les valeurs qui définissent un quad.
function setGeometry(gl) {
  var positions = new Float32Array(
    [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}
```

Ce quad remplira le canvas car il est déjà en clip space. Puisqu'il n'y a
que 2 valeurs par sommet, nous devons changer le code qui configure l'attribut.

```js
// Indiquer à l'attribut de position comment obtenir les données depuis positionBuffer (ARRAY_BUFFER)
-var size = 3;          // 3 composantes par itération
+var size = 2;          // 2 composantes par itération
var type = gl.FLOAT;   // les données sont des flottants 32 bits
var normalize = false; // ne pas normaliser les données
var stride = 0;        // 0 = avancer de size * sizeof(type) à chaque itération pour la position suivante
var offset = 0;        // commencer au début du buffer
gl.vertexAttribPointer(
    positionLocation, size, type, normalize, stride, offset)
```

Ensuite, pour le vertex shader, nous définissons simplement `gl_Position` directement sur les sommets du quad.
Pas besoin de calcul matriciel car les positions sont déjà en clip space, configurées
pour couvrir tout le canvas. Nous définissons `gl_Position.z` à 1 pour garantir que les pixels
ont la profondeur la plus grande. Et nous passons la position au fragment shader.

```glsl
#version 300 es
in vec4 a_position;
out vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = a_position;
  gl_Position.z = 1.0;
}
```

Dans le fragment shader, nous multiplions la position par la matrice inverse view projection
et divisons par w pour passer de l'espace 4D à l'espace 3D.

```glsl
#version 300 es
precision highp float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

in vec4 v_position;

// nous devons déclarer une sortie pour le fragment shader
out vec4 outColor;

void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_position;
  outColor = texture(u_skybox, normalize(t.xyz / t.w));
}
```

Enfin, nous devons rechercher les emplacements des uniforms

```js
var skyboxLocation = gl.getUniformLocation(program, "u_skybox");
var viewDirectionProjectionInverseLocation =
    gl.getUniformLocation(program, "u_viewDirectionProjectionInverse");
```

et les définir

```js
// Calculer la matrice de projection
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix =
    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// la caméra tourne en cercle à 2 unités de l'origine en regardant vers l'origine
var cameraPosition = [Math.cos(time * .1), 0, Math.sin(time * .1)];
var target = [0, 0, 0];
var up = [0, 1, 0];
// Calculer la matrice de la caméra avec lookAt.
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Créer une matrice de vue depuis la matrice de caméra.
var viewMatrix = m4.inverse(cameraMatrix);

// Nous ne nous soucions que de la direction, donc supprimer la translation
viewMatrix[12] = 0;
viewMatrix[13] = 0;
viewMatrix[14] = 0;

var viewDirectionProjectionMatrix =
    m4.multiply(projectionMatrix, viewMatrix);
var viewDirectionProjectionInverseMatrix =
    m4.inverse(viewDirectionProjectionMatrix);

// Définir les uniforms
gl.uniformMatrix4fv(
    viewDirectionProjectionInverseLocation, false,
    viewDirectionProjectionInverseMatrix);

// Indiquer au shader d'utiliser l'unité de texture 0 pour u_skybox
gl.uniform1i(skyboxLocation, 0);
```

Remarquez ci-dessus que nous faisons tourner la caméra autour de l'origine où nous calculons
`cameraPosition`. Ensuite, après avoir converti la `cameraMatrix` en `viewMatrix`, nous
mettons à zéro la translation car nous ne nous soucions que de la direction de la caméra, pas
de son emplacement.

De là, nous multiplions avec la matrice de projection, prenons l'inverse, puis définissons
la matrice.

{{{example url="../webgl-skybox.html" }}}

Combinons le cube avec carte d'environnement dans cet exemple. Nous utiliserons les
utilitaires mentionnés dans [moins de code, plus de plaisir](webgl-less-code-more-fun.html).

Nous devons mettre les deux ensembles de shaders

```js
var envmapVertexShaderSource = `...
var envmapFragmentShaderSource = `...
var skyboxVertexShaderSource = `...
var skyboxFragmentShaderSource = `...
```

Puis compiler les shaders et rechercher tous les emplacements des attributs et uniforms

```js
  // Utiliser twgl pour compiler les shaders et lier en un programme
  const envmapProgramInfo = twgl.createProgramInfo(
      gl, [envmapVertexShaderSource, envmapFragmentShaderSource]);
  const skyboxProgramInfo = twgl.createProgramInfo(
      gl, [skyboxVertexShaderSource, skyboxFragmentShaderSource]);
```

Configurer nos buffers avec les données de sommets. twgl dispose déjà de fonctions pour fournir ces données donc nous pouvons les utiliser.

```js
// créer des buffers et les remplir avec des données de sommets
const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
```

et créer des vertex array objects pour chacun

```js
const cubeVAO = twgl.createVAOFromBufferInfo(gl, envmapProgramInfo, cubeBufferInfo);
const quadVAO = twgl.createVAOFromBufferInfo(gl, skyboxProgramInfo, quadBufferInfo);
```

Au moment du rendu, nous calculons toutes les matrices

```js
// la caméra tourne en cercle à 2 unités de l'origine en regardant vers l'origine
var cameraPosition = [Math.cos(time * .1) * 2, 0, Math.sin(time * .1) * 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// Calculer la matrice de la caméra avec lookAt.
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// Créer une matrice de vue depuis la matrice de caméra.
var viewMatrix = m4.inverse(cameraMatrix);

// Faire pivoter le cube autour de l'axe x
var worldMatrix = m4.xRotation(time * 0.11);

// Nous ne nous soucions que de la direction, donc supprimer la translation
var viewDirectionMatrix = m4.copy(viewMatrix);
viewDirectionMatrix[12] = 0;
viewDirectionMatrix[13] = 0;
viewDirectionMatrix[14] = 0;

var viewDirectionProjectionMatrix = m4.multiply(
    projectionMatrix, viewDirectionMatrix);
var viewDirectionProjectionInverseMatrix =
    m4.inverse(viewDirectionProjectionMatrix);
```

Puis d'abord dessiner le cube

```js
// dessiner le cube
gl.depthFunc(gl.LESS);  // utiliser le test de profondeur par défaut
gl.useProgram(envmapProgramInfo.program);
gl.bindVertexArray(cubeVAO);
twgl.setUniforms(envmapProgramInfo, {
  u_world: worldMatrix,
  u_view: viewMatrix,
  u_projection: projectionMatrix,
  u_texture: texture,
  u_worldCameraPosition: cameraPosition,
});
twgl.drawBufferInfo(gl, cubeBufferInfo);
```

suivi par la skybox

```js
// dessiner la skybox

// laisser notre quad passer le test de profondeur à 1.0
gl.depthFunc(gl.LEQUAL);

gl.useProgram(skyboxProgramInfo.program);
gl.bindVertexArray(quadVAO);
twgl.setUniforms(skyboxProgramInfo, {
  u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
  u_skybox: texture,
});
twgl.drawBufferInfo(gl, quadBufferInfo);
```

Notez que notre code de chargement de texture peut également être remplacé par l'utilisation de nos fonctions helpers

```js
// Créer une texture.
-const texture = gl.createTexture();
-gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
-
-const faceInfos = [
-  {
-    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
-    url: 'resources/images/computer-history-museum/pos-x.jpg',
-  },
-  ...
-];
-faceInfos.forEach((faceInfo) => {
-  ...
-});
-gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
-gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
+const texture = twgl.createTexture(gl, {
+  target: gl.TEXTURE_CUBE_MAP,
+  src: [
+    'resources/images/computer-history-museum/pos-x.jpg',
+    'resources/images/computer-history-museum/neg-x.jpg',
+    'resources/images/computer-history-museum/pos-y.jpg',
+    'resources/images/computer-history-museum/neg-y.jpg',
+    'resources/images/computer-history-museum/pos-z.jpg',
+    'resources/images/computer-history-museum/neg-z.jpg',
+  ],
+  min: gl.LINEAR_MIPMAP_LINEAR,
+});
```

et

{{{example url="../webgl-skybox-plus-environment-map.html" }}}

J'espère que ces 3 derniers articles vous ont donné une idée de la façon d'utiliser un cubemap.
Il est courant par exemple de prendre le code [du calcul de l'éclairage](webgl-3d-lighting-spot.html)
et de combiner ce résultat avec des résultats d'une
carte d'environnement pour créer des matériaux comme le capot d'une voiture ou un sol poli.
Il existe également une technique pour calculer l'éclairage en utilisant des cubemaps. C'est la même chose que la
carte d'environnement sauf qu'au lieu d'utiliser la valeur que vous obtenez de la carte d'environnement
comme couleur, vous l'utilisez comme entrée de vos équations d'éclairage.
