Title: WebGL2 - Dessiner plusieurs choses
Description: Comment dessiner plusieurs types d'objets différents dans WebGL
TOC: Dessiner plusieurs choses


Cet article est la suite des [articles précédents sur WebGL](webgl-fundamentals.html).
Si vous ne les avez pas lus, je vous suggère de commencer par là.

L'une des questions les plus courantes après avoir affiché quelque chose dans WebGL est
comment dessiner plusieurs choses.

La première chose à réaliser est qu'avec quelques exceptions, WebGL ressemble à une fonction
écrite par quelqu'un où au lieu de passer beaucoup de paramètres à la fonction, vous avez
plutôt une seule fonction qui dessine des choses et 70+ fonctions qui configurent l'état pour
cette unique fonction. Ainsi, imaginez par exemple que vous ayez une fonction qui dessine un cercle. Vous
pourriez la programmer comme ceci

    function drawCircle(centerX, centerY, radius, color) { ... }

Ou vous pourriez la coder comme ceci

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL fonctionne selon cette deuxième façon. Les fonctions comme `gl.createBuffer`, `gl.bufferData`, `gl.createTexture`,
et `gl.texImage2D` vous permettent de téléverser des données vers des buffers (données de sommets) et des données vers des textures (couleur, etc.).
`gl.createProgram`, `gl.createShader`, `gl.compileShader` et `gl.linkProgram` vous permettent de créer
vos shaders GLSL. Presque toutes les autres fonctions de WebGL configurent ces variables globales
ou *état* qui est utilisé quand `gl.drawArrays` ou `gl.drawElements` est finalement appelé.

En sachant cela, un programme WebGL typique suit essentiellement cette structure

Au moment de l'initialisation

*   créer tous les shaders et programmes et rechercher les emplacements
*   créer des buffers et téléverser des données de sommets
*   créer un vertex array pour chaque chose que vous voulez dessiner
    *   pour chaque attribut appeler `gl.bindBuffer`, `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`
    *   lier les indices à `gl.ELEMENT_ARRAY_BUFFER`
*   créer des textures et téléverser des données de texture

Au moment du rendu

*   effacer et régler le viewport et autres états globaux (activer le test de profondeur, activer le culling, etc.)
*   Pour chaque chose que vous voulez dessiner
    *   appeler `gl.useProgram` pour le programme nécessaire pour dessiner.
    *   lier le vertex array pour cette chose.
        *   appeler `gl.bindVertexArray`
    *   configurer les uniforms pour la chose que vous voulez dessiner
        *   appeler `gl.uniformXXX` pour chaque uniform
        *   appeler `gl.activeTexture` et `gl.bindTexture` pour assigner des textures aux unités de texture.
    *   appeler `gl.drawArrays` ou `gl.drawElements`

C'est essentiellement tout. C'est à vous d'organiser votre code pour accomplir cette tâche.

Certaines choses comme le téléversement de données de texture (et peut-être même de données de sommets) peuvent se produire de manière asynchrone car
vous devez attendre qu'elles soient téléchargées depuis le réseau.

Créons une application simple pour dessiner 3 choses : un cube, une sphère et un cône.

Je ne vais pas entrer dans les détails sur la façon de calculer les données du cube, de la sphère et du cône. Supposons juste
que nous avons des fonctions pour les créer et qu'elles retournent [des objets bufferInfo comme décrit dans
l'article précédent](webgl-less-code-more-fun.html).

Voici donc le code. Notre shader est le même shader simple de notre [exemple de perspective](webgl-3d-perspective.html)
sauf que nous avons ajouté un `u_colorMult` pour multiplier les couleurs des sommets.

    #version 300 es
    precision highp float;

    // Passé depuis le vertex shader.
    in vec4 v_color;

    +uniform vec4 u_colorMult;

    out vec4 outColor;

    void main() {
    *   outColor = v_color * u_colorMult;
    }


Au moment de l'initialisation

    // Nos uniforms pour chaque chose que nous voulons dessiner
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // La translation pour chaque objet.
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

Au moment du dessin

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ Dessiner la sphère --------

    gl.useProgram(programInfo.program);

    // Configurer tous les attributs nécessaires.
    gl.bindVertexArray(sphereVAO);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // Définir les uniforms que nous venons de calculer
    twgl.setUniforms(programInfo, sphereUniforms);

    twgl.drawBufferInfo(gl, sphereBufferInfo);

    // ------ Dessiner le cube --------

    // Configurer tous les attributs nécessaires.
    gl.bindVertexArray(cubeVAO);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // Définir les uniforms que nous venons de calculer
    twgl.setUniforms(programInfo, cubeUniforms);

    twgl.drawBufferInfo(gl, cubeBufferInfo);

    // ------ Dessiner le cône --------

    // Configurer tous les attributs nécessaires.
    gl.bindVertexArray(coneVAO);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // Définir les uniforms que nous venons de calculer
    twgl.setUniforms(programInfo, coneUniforms);

    twgl.drawBufferInfo(gl, coneBufferInfo);

Et voilà le résultat

{{{example url="../webgl-multiple-objects-manual.html" }}}

Une chose à noter est que puisque nous n'avons qu'un seul programme shader, nous n'avons appelé `gl.useProgram`
qu'une seule fois. Si nous avions différents programmes shaders, nous devrions appeler `gl.useProgram` avant, hm...
d'utiliser chaque programme.

C'est un autre endroit où il est judicieux de simplifier. Il y a effectivement 4 choses principales à combiner.

1.  Un programme shader (et ses informations sur les uniforms et attributs)
2.  Un vertex array (qui contient les paramètres des attributs)
3.  Les uniforms nécessaires pour dessiner cette chose avec le shader donné.
4.  Le count à passer à gl.drawXXX et si oui ou non appeler gl.drawArrays ou gl.drawElements

Ainsi, une simplification simple serait de créer un tableau de choses à dessiner et dans ce tableau
regrouper les 4 choses ensemble

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        vertexArray: sphereVAO,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: cubeVAO,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        vertexArray: coneVAO,
        uniforms: coneUniforms,
      },
    ];

Au moment du dessin, nous devons toujours mettre à jour les matrices

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // Calculer les matrices pour chaque objet.
    sphereUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

Mais le code de dessin est maintenant juste une simple boucle

    // ------ Dessiner les objets --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;

      gl.useProgram(programInfo.program);

      // Configurer tous les attributs nécessaires.
      gl.bindVertexArray(object.vertexArray);

      // Définir les uniforms.
      twgl.setUniforms(programInfo, object.uniforms);

      // Dessiner
      twgl.drawBufferInfo(gl, bufferInfo);
    });


Et c'est en fait la boucle de rendu principale de la plupart des moteurs 3D qui existent. Quelque part,
du code ou des codes décident de ce qui entre dans la liste `objectsToDraw` et le nombre
d'options qu'ils nécessitent peut être plus grand, mais la plupart d'entre eux séparent le calcul de ce qui
entre dans cette liste de l'appel effectif aux fonctions `gl.draw___`.

{{{example url="../webgl-multiple-objects-list.html" }}}

En général, il est considéré comme une *bonne pratique* de ne pas appeler WebGL de manière redondante.
En d'autres termes, si un état de WebGL est déjà réglé sur ce dont vous avez besoin,
ne le réglez pas à nouveau. Dans cet esprit, nous pourrions vérifier si le
programme shader dont nous avons besoin pour dessiner l'objet courant est le même programme shader
que l'objet précédent, auquel cas il n'est pas nécessaire d'appeler `gl.useProgram`. De même,
si nous dessinons avec la même forme/géométrie/sommets, il n'est pas nécessaire d'appeler
`gl.bindVertexArray`

Une optimisation très simple pourrait ressembler à ceci

```js
+var lastUsedProgramInfo = null;
+var lastUsedVertexArray = null;

objectsToDraw.forEach(function(object) {
  var programInfo = object.programInfo;
  var vertexArray = object.vertexArray;

+  if (programInfo !== lastUsedProgramInfo) {
+    lastUsedProgramInfo = programInfo;
    gl.useProgram(programInfo.program);
+  }

  // Configurer tous les attributs nécessaires.
+  if (lastUsedVertexArray !== vertexArray) {
+    lastUsedVertexArray = vertexArray;
    gl.bindVertexArray(vertexArray);
+  }

  // Définir les uniforms.
  twgl.setUniforms(programInfo, object.uniforms);

  // Dessiner
  twgl.drawBufferInfo(gl, object.bufferInfo);
});
```

Cette fois, dessinons beaucoup plus d'objets. Au lieu de juste 3 comme avant, agrandissons
la liste de choses à dessiner

```js
// mettre les formes dans un tableau pour en choisir facilement au hasard
var shapes = [
  { bufferInfo: sphereBufferInfo, vertexArray: sphereVAO, },
  { bufferInfo: cubeBufferInfo,   vertexArray: cubeVAO, },
  { bufferInfo: coneBufferInfo,   vertexArray: coneVAO, },
];

var objectsToDraw = [];
var objects = [];

// Créer des infos pour chaque objet.
var baseHue = rand(360);
var numObjects = 200;
for (var ii = 0; ii < numObjects; ++ii) {
  // choisir une forme
  var shape = shapes[rand(shapes.length) | 0];

  // créer un objet.
  var object = {
    uniforms: {
      u_colorMult: chroma.hsv(emod(baseHue + rand(120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
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

Au moment du rendu

```js
// Calculer les matrices pour chaque objet.
objects.forEach(function(object) {
  object.uniforms.u_matrix = computeMatrix(
      viewProjectionMatrix,
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});
```

Puis dessiner les objets en utilisant la boucle ci-dessus.

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

> Note : j'avais initialement supprimé la section ci-dessus de cette version WebGL2 de l'article.
> [La version WebGL1 originale de cet article](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html) avait une section sur l'optimisation. La raison pour laquelle je l'ai supprimée
> est qu'avec les vertex array objects, je ne suis pas sûr que les optimisations importent autant.
> Dans WebGL1 sans vertex arrays, dessiner un seul objet nécessitait souvent
> 9 à 16 appels pour configurer les attributs pour dessiner l'objet. Dans WebGL2, tout cela
> se passe au moment de l'initialisation en configurant un vertex array par objet, puis au moment du rendu
> c'est un seul appel à `gl.bindVertexArray` par objet.
>
> De plus, en général, la plupart des applications WebGL ne poussent pas la limite de dessin. Elles
> doivent fonctionner sur un ensemble de machines, depuis un vieux GPU Intel intégré bas de gamme de 8 ans
> jusqu'à une machine haut de gamme. Les optimisations mentionnées
> dans la section ci-dessus sont peu susceptibles de faire la différence entre performant
> et non performant. Pour obtenir de la performance, il faut réduire le nombre d'appels de dessin,
> par exemple en utilisant le [dessin instancié](webgl-instanced-drawing.html) et
> d'autres techniques similaires.
>
> La raison pour laquelle j'ai rajouté la section est qu'il a été signalé
> dans un rapport de bug que le dernier exemple, dessinant 200 objets, est
> référencé dans [l'article sur le picking](webgl-picking.html). 😅

## Dessiner des choses transparentes et listes multiples

Dans l'exemple ci-dessus, il n'y a qu'une seule liste à dessiner. Cela fonctionne car tous les objets
sont opaques. Si nous voulons dessiner des objets transparents, ils doivent être dessinés de l'arrière vers l'avant,
les objets les plus éloignés étant dessinés en premier. D'un autre côté, pour la vitesse, pour les objets opaques,
nous voulons dessiner de l'avant vers l'arrière, car le DEPTH_TEST signifie que le GPU
n'exécutera pas notre fragment shader pour les pixels qui seraient derrière d'autres choses.
Nous voulons donc dessiner les choses en avant en premier.

La plupart des moteurs 3D gèrent cela en ayant 2 listes ou plus d'objets à dessiner. Une liste pour les choses opaques.
Une autre liste pour les choses transparentes. La liste des opaques est triée de l'avant vers l'arrière.
La liste des transparents est triée de l'arrière vers l'avant. Il peut également y avoir des listes séparées pour d'autres
choses comme les superpositions ou les effets de post-traitement.

## Envisager d'utiliser une bibliothèque

Il est important de noter que vous ne pouvez pas dessiner n'importe quelle géométrie avec n'importe quel shader.
Par exemple, un shader qui nécessite des normales ne fonctionnera pas avec une géométrie qui n'a pas de
normales. De même, un shader qui nécessite des textures ne fonctionnera pas sans textures.

C'est l'une des nombreuses raisons pour lesquelles il est très bien de choisir une bibliothèque 3D comme [Three.js](https://threejs.org)
car elle gère tout cela pour vous. Vous créez une géométrie, vous dites à three.js comment vous voulez qu'elle soit
rendue et il génère des shaders à l'exécution pour gérer les choses dont vous avez besoin. Pratiquement tous les moteurs 3D
font cela, de Unity3D à Unreal en passant par Source et Crytek. Certains les génèrent hors ligne, mais l'important
est de réaliser qu'ils *génèrent* des shaders.

Bien sûr, la raison pour laquelle vous lisez ces articles est que vous voulez savoir ce qui se passe en profondeur.
C'est très bien et c'est amusant d'écrire tout soi-même. Il est juste important d'être conscient que
[WebGL est de très bas niveau](webgl-2d-vs-3d-library.html)
donc il y a beaucoup de travail à faire si vous voulez le faire vous-même, et cela inclut souvent
l'écriture d'un générateur de shaders puisque différentes fonctionnalités nécessitent souvent différents shaders.

Vous remarquerez que je n'ai pas mis `computeMatrix` dans la boucle. C'est parce que le rendu devrait
être séparé du calcul des matrices. Il est courant de calculer les matrices depuis un
[graphe de scène et nous aborderons cela dans un autre article](webgl-scene-graph.html).

Maintenant que nous avons un cadre pour dessiner plusieurs objets, [dessinons du texte](webgl-text-html.html).
