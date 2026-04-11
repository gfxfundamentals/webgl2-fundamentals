Title: WebGL2 Visualisation de la caméra
Description: Comment dessiner un frustum de caméra
TOC: Visualisation de la caméra

Cet article suppose que vous avez lu [l'article sur les vues multiples](webgl-multiple-views.html).
Si vous n'avez pas lu cet article, veuillez [aller le lire d'abord](webgl-multiple-views.html).

Cet article suppose également que vous avez lu l'article sur
[moins de code, plus de plaisir](webgl-less-code-more-fun.html)
car il utilise la bibliothèque mentionnée là-bas pour
désencombrer l'exemple. Si vous ne comprenez pas
ce que sont les buffers, les tableaux de sommets et les attributs, ou ce que
signifie une fonction nommée `twgl.setUniforms` pour définir des uniforms,
etc... alors vous devriez probablement revenir en arrière et
[lire les bases](webgl-fundamentals.html).

Il est souvent utile de pouvoir visualiser ce que voit une caméra,
son "frustum". C'est étonnamment facile.
Comme indiqué dans les articles sur les projections [orthographique](webgl-3d-orthographic.html)
et [en perspective](webgl-3d-perspective.html), ces matrices de projection
prennent un certain espace et le convertissent en la boîte de -1 à +1 du clip space.
De plus, une matrice caméra est juste une matrice qui représente
un endroit et une orientation dans l'espace world de la caméra.

Donc, la première chose qui devrait être assez évidente. Si nous utilisons simplement
la matrice caméra pour dessiner quelque chose, nous aurons un objet
représentant la caméra. La complication est qu'une caméra
ne peut pas se voir elle-même, mais, en utilisant les techniques de
[l'article sur les vues multiples](webgl-multiple-views.html)
nous pouvons avoir 2 vues. Nous utiliserons une caméra différente dans chaque
vue. La 2ème vue regardera la première et pourra donc voir
cet objet que nous dessinons pour représenter la caméra utilisée dans l'autre vue.

D'abord, créons des données pour représenter la caméra.
Créons un cube puis ajoutons un cône à l'extrémité.
Nous allons dessiner cela avec des lignes. Nous utiliserons des [indices](webgl-indexed-vertices.html)
pour connecter les sommets.

Les [caméras](webgl-3d-camera.html) regardent dans la direction -Z
donc mettons le cube et le cône du côté positif avec le
cône s'ouvrant vers -Z

D'abord les lignes du cube

```js
// créer la géométrie pour une caméra
function createCameraBufferInfo(gl) {
  // ajoutons d'abord un cube. Il va de 1 à 3
  // parce que les caméras regardent vers -Z donc on veut
  // que la caméra commence à Z = 0.
  const positions = [
    -1, -1,  1,  // sommets du cube
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // indices du cube
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Puis ajoutons les lignes du cône

```js
// créer la géométrie pour une caméra
function createCameraBufferInfo(gl) {
  // ajoutons d'abord un cube. Il va de 1 à 3
  // parce que les caméras regardent vers -Z donc on veut
  // que la caméra commence à Z = 0.
+  // On va mettre un cône devant ce cube s'ouvrant
+  // vers -Z
  const positions = [
    -1, -1,  1,  // sommets du cube
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
+     0,  0,  1,  // pointe du cône
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // indices du cube
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
+  // ajouter les segments du cône
+  const numSegments = 6;
+  const coneBaseIndex = positions.length / 3; 
+  const coneTipIndex =  coneBaseIndex - 1;
+  for (let i = 0; i < numSegments; ++i) {
+    const u = i / numSegments;
+    const angle = u * Math.PI * 2;
+    const x = Math.cos(angle);
+    const y = Math.sin(angle);
+    positions.push(x, y, 0);
+    // ligne de la pointe vers le bord
+    indices.push(coneTipIndex, coneBaseIndex + i);
+    // ligne d'un point du bord au suivant
+    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
+  }
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Et enfin ajoutons une échelle parce que notre F fait
150 unités de haut et cette caméra fait 2 à 3 unités, elle sera
minuscule à côté de notre F. On pourrait la mettre à l'échelle en multipliant par une
matrice de mise à l'échelle quand on la dessine ou on peut mettre à l'échelle les données
elles-mêmes ici.

```js
-function createCameraBufferInfo(gl) {
+function createCameraBufferInfo(gl, scale = 1) {
  // ajoutons d'abord un cube. Il va de 1 à 3
  // parce que les caméras regardent vers -Z donc on veut
  // que la caméra commence à Z = 0.
  // On va mettre un cône devant ce cube s'ouvrant
  // vers -Z
  const positions = [
    -1, -1,  1,  // sommets du cube
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // pointe du cône
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // indices du cube
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // ajouter les segments du cône
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3; 
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // ligne de la pointe vers le bord
    indices.push(coneTipIndex, coneBaseIndex + i);
    // ligne d'un point du bord au suivant
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }
+  positions.forEach((v, ndx) => {
+    positions[ndx] *= scale;
+  });
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Notre programme shader actuel dessine avec des couleurs de sommets.
Créons-en un autre qui dessine avec une couleur unie.

```js
const colorVS = `#version 300 es
in vec4 a_position;

uniform mat4 u_matrix;

void main() {
  // Multiplier la position par la matrice.
  gl_Position = u_matrix * a_position;
}
`;

const colorFS = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
</script>  
```

Maintenant utilisons cela pour dessiner une scène avec une caméra visualisant
l'autre scène

```js
// configurer les programmes GLSL
// compile les shaders, lie le programme, recherche les emplacements
-const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
+const vertexColorProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
+const solidColorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS]);

// créer des buffers et les remplir avec des données pour un 'F' 3D
const fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
const fVAO = twgl.createVAOFromBufferInfo(gl, vertexColorProgramInfo, fBufferInfo);

...

+const cameraScale = 20;
+const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);
+const cameraVAO = twgl.createVAOFromBufferInfo(
+    gl, solidColorProgramInfo, cameraBufferInfo);

...

const settings = {
  rotation: 150,  // en degrés
+  cam1FieldOfView: 60,  // en degrés
+  cam1PosX: 0,
+  cam1PosY: 0,
+  cam1PosZ: -200,
};


function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // on va diviser la vue en 2
  const effectiveWidth = gl.canvas.clientWidth / 2;
  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // Calculer une matrice de projection en perspective
  const perspectiveProjectionMatrix =
-      m4.perspective(fieldOfViewRadians), aspect, near, far);
+      m4.perspective(degToRad(settings.cam1FieldOfView), aspect, near, far);

  // Calculer la matrice de la caméra avec lookAt.
-  const cameraPosition = [0, 0, -75];
+  const cameraPosition = [
+      settings.cam1PosX, 
+      settings.cam1PosY,
+      settings.cam1PosZ,
+  ];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // centrer le 'F' autour de son origine
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // dessiner à gauche avec la caméra orthographique
  gl.viewport(0, 0, leftWidth, height);
  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0.8, 0.8, 1);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

  // dessiner à droite avec la caméra en perspective
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0.8, 0.8, 1, 1);

  // calculer une deuxième matrice de projection et une deuxième caméra
+  const perspectiveProjectionMatrix2 =
+      m4.perspective(degToRad(60), aspect, near, far);
+
+  // Calculer la matrice de la caméra avec lookAt.
+  const cameraPosition2 = [-600, 400, -400];
+  const target2 = [0, 0, 0];
+  const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

-  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
+  drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

+  // dessiner un objet représentant la première caméra
+  {
+    // Créer une matrice view depuis la 2ème matrice caméra.
+    const viewMatrix = m4.inverse(cameraMatrix2);
+
+    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
+    // utiliser la matrice de la première caméra comme matrice pour positionner
+    // la représentation de la caméra dans la scène
+    mat = m4.multiply(mat, cameraMatrix);
+
+    gl.useProgram(solidColorProgramInfo.program);
+
+    // ------ Dessiner la représentation de la caméra --------
+
+    // Configurer tous les attributs nécessaires.
+    gl.bindVertexArray(cameraVAO);
+
+    // Définir les uniforms
+    twgl.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    // appelle gl.drawArrays ou gl.drawElements
+    twgl.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);
+  }
}
render();
```

Et maintenant on peut voir la caméra utilisée pour rendre la scène de gauche
dans la scène de droite.

{{{example url="../webgl-visualize-camera.html"}}}

Dessinons également quelque chose pour représenter le frustum de la caméra.

Puisque le frustum représente une conversion vers le clip space,
on peut créer un cube représentant le clip space
et utiliser l'inverse de la matrice de projection pour le placer
dans la scène.

D'abord, nous avons besoin d'un cube de lignes en clip space.

```js
function createClipspaceCubeBufferInfo(gl) {
  // ajoutons d'abord un cube. Il va de 1 à 3
  // parce que les caméras regardent vers -Z donc on veut
  // que la caméra commence à Z = 0. On va mettre
  // un cône devant ce cube s'ouvrant
  // vers -Z
  const positions = [
    -1, -1, -1,  // sommets du cube
     1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
    -1, -1,  1,
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // indices du cube
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

Ensuite on peut en créer un et le dessiner

```js
const cameraScale = 20;
const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);
const cameraVAO = twgl.createVAOFromBufferInfo(
    gl, solidColorProgramInfo, cameraBufferInfo);

+const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl);
+const clipspaceCubeVAO = twgl.createVAOFromBufferInfo(
+    gl, solidColorProgramInfo, clipspaceCubeBufferInfo);
...

  // dessiner un objet représentant la première caméra
  {
    // Créer une matrice view depuis la matrice caméra.
    const viewMatrix = m4.inverse(cameraMatrix2);

    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
    // utiliser la matrice de la première caméra comme matrice pour positionner
    // la représentation de la caméra dans la scène
    mat = m4.multiply(mat, cameraMatrix);

    gl.useProgram(solidColorProgramInfo.program);

    // ------ Dessiner la représentation de la caméra --------

    // Configurer tous les attributs nécessaires.
    gl.bindVertexArray(cameraVAO);

    // Définir les uniforms
    twgl.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    // appelle gl.drawArrays ou gl.drawElements
    twgl.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);

+    // ----- Dessiner le frustum -------
+
+    mat = m4.multiply(mat, m4.inverse(perspectiveProjectionMatrix));
+
+    // Configurer tous les attributs nécessaires.
+    gl.bindVertexArray(clipspaceCubeVAO);
+
+    // Définir les uniforms
+    twgl.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    // appelle gl.drawArrays ou gl.drawElements
+    twgl.drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES);
  }
}
```

Ajoutons également la possibilité d'ajuster les paramètres near et far
de la première caméra

```js
const settings = {
  rotation: 150,  // en degrés
  cam1FieldOfView: 60,  // en degrés
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
+  cam1Near: 30,
+  cam1Far: 500,
};

...

  // Calculer une matrice de projection en perspective
  const perspectiveProjectionMatrix =
      m4.perspective(degToRad(settings.cam1FieldOfView),
      aspect,
-      near,
-      far);
+      settings.cam1Near,
+      settings.cam1Far);
```

et maintenant on peut voir le frustum également

{{{example url="../webgl-visualize-camera-with-frustum.html"}}}

Si vous ajustez les plans near ou far ou le champ de vision pour qu'ils coupent le F,
vous verrez que la représentation du frustum correspond.

Que l'on utilise une projection en perspective ou orthographique
pour la caméra de gauche, cela fonctionnera dans les deux cas
car une matrice de projection convertit toujours vers le clip space
donc son inverse prendra toujours notre cube de +1 à -1 et le déformera
de manière appropriée.

```js
const settings = {
  rotation: 150,  // en degrés
  cam1FieldOfView: 60,  // en degrés
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
  cam1Near: 30,
  cam1Far: 500,
+  cam1Ortho: true,
+  cam1OrthoUnits: 120,
};

...

// Calculer une matrice de projection
const perspectiveProjectionMatrix = settings.cam1Ortho
    ? m4.orthographic(
        -settings.cam1OrthoUnits * aspect,  // gauche
         settings.cam1OrthoUnits * aspect,  // droite
        -settings.cam1OrthoUnits,           // bas
         settings.cam1OrthoUnits,           // haut
         settings.cam1Near,
         settings.cam1Far)
    : m4.perspective(degToRad(settings.cam1FieldOfView),
        aspect,
        settings.cam1Near,
        settings.cam1Far);
```

{{{example url="../webgl-visualize-camera-with-orthographic.html"}}}

Ce type de visualisation devrait être familier à quiconque a
utilisé un logiciel de modélisation 3D comme [Blender](https://blender.org) 
ou un moteur de jeu 3D avec des outils d'édition de scène comme [Unity](https://unity.com)
ou [Godot](https://godotengine.org/).

Cela peut aussi être très utile pour le débogage.
