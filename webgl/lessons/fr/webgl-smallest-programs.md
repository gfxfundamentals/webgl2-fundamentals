Title: WebGL2 Plus petits programmes
Description: Le code le plus petit pour tester
TOC: Plus petits programmes

Cet article suppose que vous avez lu beaucoup d'autres articles
en commençant par [les bases](webgl-fundamentals.html).
Si vous ne les avez pas lus, veuillez commencer par là.

Je ne sais pas vraiment sous quelle catégorie classer cet article car il a deux
objectifs.

1. Vous montrer les plus petits programmes WebGL.

   Ces techniques sont très utiles pour tester quelque chose ou
   lors de la création d'un [MCVE pour Stack Overflow](https://meta.stackoverflow.com/a/349790/128511) ou lors d'une tentative de
   cerner un bug.

2. Apprendre à penser en dehors des sentiers battus

   J'espère écrire plusieurs autres articles à ce sujet
   pour vous aider à voir la vue d'ensemble plutôt que juste les motifs courants.
   [En voici un](webgl-drawing-without-data.html).

## Juste effacer

Voici le plus petit programme WebGL qui fait réellement quelque chose

```js
const gl = document.querySelector('canvas').getContext('webgl2');
gl.clearColor(1, 0, 0, 1);  // rouge
gl.clear(gl.COLOR_BUFFER_BIT);
```

Tout ce que ce programme fait est d'effacer le canvas en rouge, mais il a réellement fait quelque chose.

Réfléchissez-y. Avec juste ça, vous pouvez en fait tester certaines choses. Disons que vous
faites un [rendu vers une texture](webgl-render-to-texture.html) mais les choses ne fonctionnent pas.
Disons que c'est comme l'exemple de [cet article](webgl-render-to-texture.html).
Vous rendez 1 ou plusieurs choses 3D dans une texture, puis rendez ce résultat sur un cube.

Vous ne voyez rien. Eh bien, comme test simple, arrêtez de rendre vers la texture avec des shaders
et effacez simplement la texture à une couleur connue.

```js
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferWithTexture)
gl.clearColor(1, 0, 1, 1);  // magenta
gl.clear(gl.COLOR_BUFFER_BIT);
```

Maintenant rendez avec la texture du framebuffer. Votre cube devient-il magenta ? Si non,
alors votre problème n'est pas la partie rendu vers la texture, c'est autre chose.

## Utiliser le `SCISSOR_TEST` et `gl.clear`

Le `SCISSOR_TEST` coupe à la fois le dessin et l'effacement à un sous-rectangle du canvas (ou du framebuffer actuel).

Vous activez le scissor test avec

```js
gl.enable(gl.SCISSOR_TEST);
```

puis vous définissez le rectangle scissor en pixels par rapport au coin inférieur gauche. Il utilise les mêmes paramètres
que `gl.viewport`.

```js
gl.scissor(x, y, width, height);
```

En utilisant ça, on peut dessiner des rectangles en utilisant le `SCISSOR_TEST` et `gl.clear`.

Exemple

```js
const gl = document.querySelector('#c').getContext('webgl2');

gl.enable(gl.SCISSOR_TEST);

function drawRect(x, y, width, height, color) {
  gl.scissor(x, y, width, height);
  gl.clearColor(...color);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

for (let i = 0; i < 100; ++i) {
  const x = rand(0, 300);
  const y = rand(0, 150);
  const width = rand(0, 300 - x);
  const height = rand(0, 150 - y);
  drawRect(x, y, width, height, [rand(1), rand(1), rand(1), 1]);
}


function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}
```

{{{example url="../webgl-simple-scissor.html"}}}

Je ne dis pas que celui-là en particulier est si utile, mais quand même
c'est bon à savoir.

## Utiliser un grand `gl.POINTS`

Comme la plupart des exemples le montrent, la chose la plus courante à faire dans WebGL
est de créer des buffers. Mettre des données de sommets dans ces buffers. Créer
des shaders avec des attributs. Configurer les attributs pour tirer des données depuis
ces buffers. Puis dessiner, éventuellement avec des uniforms et des textures également
utilisés par vos shaders.

Mais parfois, vous voulez juste tester. Disons que vous voulez juste voir
quelque chose se dessiner.

Que diriez-vous de cet ensemble de shaders

```glsl
#version 300 es
// vertex shader
void main() {
  gl_Position = vec4(0, 0, 0, 1);  // centre
  gl_PointSize = 120.0;
}
```

```glsl
#version 300 es
// fragment shader
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(1, 0, 0, 1);  // rouge
}
```

Et voici le code pour l'utiliser

```js
// configurer le programme GLSL
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

gl.useProgram(program);

const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);
```

Pas de buffers à créer, pas d'uniforms à configurer, et on obtient un seul
point au centre du canvas.

{{{example url="../webgl-simple-point.html"}}}

À propos de `gl.POINTS` : Quand vous passez `gl.POINTS` à `gl.drawArrays`, vous devez aussi
définir `gl_PointSize` dans votre vertex shader à une taille en pixels. Il est
important de noter que différents GPU/Drivers ont une taille maximale de point différente
que vous pouvez utiliser. Vous pouvez interroger cette taille maximale avec

```
const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
```

La spécification WebGL ne requiert qu'une taille max de 1.0. Heureusement,
[la plupart sinon tous les GPU et drivers supportent une taille plus grande](https://web3dsurvey.com/webgl/parameters/ALIASED_POINT_SIZE_RANGE).

Après avoir défini `gl_PointSize`, quand le vertex shader se termine, quelle que soit la valeur que vous avez définie sur `gl_Position` est convertie
en espace écran/canvas en pixels, puis un carré est généré autour de cette position qui est +/- gl_PointSize / 2 dans les 4 directions.

D'accord, je vous entends penser et alors, qui veut dessiner un seul point.

Eh bien, les points obtiennent automatiquement des [coordonnées de texture](webgl-3d-textures.html) gratuites. Elles sont disponibles dans le fragment
shader avec la variable spéciale `gl_PointCoord`. Donc, dessinons une texture sur ce point.

D'abord, changeons le fragment shader.

```glsl
#version 300 es
// fragment shader
precision highp float;

+uniform sampler tex;

out vec4 outColor;

void main() {
-  outColor = vec4(1, 0, 0, 1);  // rouge
+  outColor = texture(tex, gl_PointCoord.xy);
}
```

Maintenant, pour rester simple, créons une texture avec des données brutes comme nous l'avons couvert dans
[l'article sur les textures de données](webgl-data-textures.html).

```js
// données de pixels 2x2
const pixels = new Uint8Array([
  0xFF, 0x00, 0x00, 0xFF,  // rouge
  0x00, 0xFF, 0x00, 0xFF,  // vert
  0x00, 0x00, 0xFF, 0xFF,  // bleu
  0xFF, 0x00, 0xFF, 0xFF,  // magenta
]);
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                 // niveau
    gl.RGBA,           // format interne
    2,                 // largeur
    2,                 // hauteur
    0,                 // bordure
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    pixels,            // données
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Parce que WebGL utilise par défaut l'unité de texture 0 et parce que les uniforms
sont initialisés à 0, il n'y a rien d'autre à configurer

{{{example url="../webgl-simple-point-w-texture.html"}}}

Cela peut être une excellente façon de tester des problèmes liés aux textures.
Nous n'utilisons toujours aucun buffer, aucun attribut, et nous n'avons pas eu
à rechercher et définir des uniforms. Par exemple, si nous chargeons une image
qui ne s'affiche pas. Que se passe-t-il si nous essayons le shader ci-dessus, affiche-t-il
l'image sur le point ? Nous rendons vers une texture et ensuite
nous voulons voir la texture. Normalement, nous configurerons de la géométrie
via des buffers et des attributs, mais nous pouvons rendre la texture juste
en l'affichant sur ce seul point.

## Utiliser plusieurs `POINTS` simples

Une autre modification simple de l'exemple ci-dessus. On peut changer le vertex
shader en ceci

```glsl
#version 300 es
// vertex shader

+in vec4 position;

void main() {
-  gl_Position = vec4(0, 0, 0, 1);
+  gl_Position = position;
  gl_PointSize = 120.0;
}
```

Les attributs ont une valeur par défaut de `0, 0, 0, 1` donc avec juste ce
changement, les exemples ci-dessus continueraient à fonctionner. Mais, maintenant
nous gagnons la possibilité de définir la position si nous le voulons.

```js
+const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');

...

+const numPoints = 5;
+for (let i = 0; i < numPoints; ++i) {
+  const u = i / (numPoints - 1);    // 0 à 1
+  const clipspace = u * 1.6 - 0.8;  // -0.8 à +0.8
+  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

*  const offset = 0;
*  const count = 1;
*  gl.drawArrays(gl.POINTS, offset, count);
+}
```

Avant de l'exécuter, rendons le point plus petit

```glsl
// vertex shader

in vec4 position;

void main() {
  gl_Position = position;
-  gl_PointSize = 120.0;
+  gl_PointSize = 20.0;
}
```

Et faisons en sorte qu'on puisse définir la couleur du point.
(note : je suis revenu au code sans texture).

```glsl
precision highp float;

+uniform vec4 color;

out vec4 outColor;

void main() {
-  outColor = vec4(1, 0, 0, 1);   // rouge
+  outColor = color;
}
```

et nous devons rechercher l'emplacement de la couleur

```js
// configurer le programme GLSL
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
+const colorLoc = gl.getUniformLocation(program, 'color');
```

Et les utiliser

```
gl.useProgram(program);

const numPoints = 5;
for (let i = 0; i < numPoints; ++i) {
  const u = i / (numPoints - 1);    // 0 à 1
  const clipspace = u * 1.6 - 0.8;  // -0.8 à +0.8
  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

+  gl.uniform4f(colorLoc, u, 0, 1 - u, 1);

  const offset = 0;
  const count = 1;
  gl.drawArrays(gl.POINTS, offset, count);
}
```

Et maintenant nous obtenons 5 points avec 5 couleurs
et nous n'avions toujours pas à configurer de buffers ou
d'attributs.

{{{example url="../webgl-simple-points.html"}}}

Bien sûr, ce n'est **PAS** la façon dont vous devriez
dessiner beaucoup de points dans WebGL. Si vous voulez dessiner beaucoup
de points, vous devriez faire quelque chose comme configurer un attribut avec une position
pour chaque point, et une couleur pour chaque point, et dessiner tous les points
dans un seul appel de dessin.

MAIS!, pour tester, pour déboguer, pour créer un [MCVE](https://meta.stackoverflow.com/a/349790/128511), c'est une excellente façon de **minimiser**
le code. Comme autre exemple, disons que nous rendons vers des textures pour un effet de post-traitement
et nous voulons les visualiser. On pourrait juste dessiner un grand
point pour chacune en utilisant la combinaison de cet exemple et
du précédent avec une texture. Pas d'étape compliquée de buffers
et d'attributs nécessaire, idéal pour déboguer.
