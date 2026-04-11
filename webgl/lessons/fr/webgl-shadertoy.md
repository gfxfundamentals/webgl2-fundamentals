Title: WebGL2 Shadertoy
Description: Les shaders Shadertoy
TOC: Shadertoy

Cet article suppose que vous avez lu beaucoup d'autres articles
en commençant par [les bases](webgl-fundamentals.html).
Si vous ne les avez pas lus, veuillez commencer par là.

Dans [l'article sur le dessin sans données](webgl-drawing-without-data.html),
nous avons montré quelques exemples de dessin de choses sans données en utilisant un
vertex shader. Cet article porte sur le dessin de choses sans
données en utilisant des fragment shaders.

Nous allons commencer avec un shader de couleur unie simple
sans calcul en utilisant le code [du tout premier article](webgl-fundamentals.html).

Un vertex shader simple

```js
const vs = `#version 300 es
  // un attribut est une entrée (in) du vertex shader.
  // Il recevra des données d'un buffer
  in vec4 a_position;

  // tous les shaders ont une fonction main
  void main() {

    // gl_Position est une variable spéciale que le vertex shader
    // est responsable de définir
    gl_Position = a_position;
  }
`;
```

et un fragment shader simple

```js
const fs = `#version 300 es
  precision highp float;

  // nous devons déclarer une sortie pour le fragment shader
  out vec4 outColor;

  void main() {
    outColor = vec4(1, 0, 0.5, 1); // retourner rouge-violet
  }
`;
```

Ensuite, nous devons compiler et lier les shaders et rechercher l'emplacement de l'attribut de position.

```js
function main() {
  // Obtenir un contexte WebGL
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // configurer le programme GLSL
  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // rechercher où les données de sommets doivent aller.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
```

puis créer un vertex array,
remplir un buffer avec 2 triangles qui forment un rectangle en clip space allant
de -1 à +1 en x et y pour couvrir le canvas, et configurer les attributs.

```js
  // Créer un vertex array object (état des attributs)
  const vao = gl.createVertexArray();

  // et en faire celui sur lequel on travaille actuellement
  gl.bindVertexArray(vao);

  // Créer un buffer pour y mettre trois points 2D en clip space
  const positionBuffer = gl.createBuffer();

  // Le lier à ARRAY_BUFFER (pensez-y comme ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // le remplir avec 2 triangles qui couvrent le clip space
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // premier triangle
     1, -1,
    -1,  1,
    -1,  1,  // deuxième triangle
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  // Activer l'attribut
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Indiquer à l'attribut comment obtenir les données depuis positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
      positionAttributeLocation,
      2,          // 2 composantes par itération
      gl.FLOAT,   // les données sont des flottants 32 bits
      false,      // ne pas normaliser les données
      0,          // 0 = avancer de size * sizeof(type) à chaque itération pour la position suivante
      0,          // commencer au début du buffer
  );
```

Et ensuite nous dessinons

```js
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Indiquer à WebGL comment convertir du clip space en pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Lui dire d'utiliser notre programme (paire de shaders)
  gl.useProgram(program);

  // Lier l'ensemble attribut/buffer que nous voulons.
  gl.bindVertexArray(vao);

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // décalage
      6,     // nombre de sommets à traiter
  );
```

Et bien sûr nous obtenons une couleur unie qui couvre le canvas.

{{{example url="../webgl-shadertoy-solid.html"}}}

Dans [l'article sur le fonctionnement de WebGL](webgl-how-it-works.html), nous avons ajouté plus de
couleur en fournissant une couleur pour chaque sommet. Dans [l'article sur les textures](webgl-3d-textures.html),
nous avons ajouté plus de couleur en fournissant des textures et des coordonnées de texture.
Alors comment obtenir quelque chose de plus qu'une couleur unie sans données supplémentaires ?
WebGL fournit une variable appelée `gl_FragCoord` qui est égale à la coordonnée **pixel**
du pixel actuellement dessiné.

Donc modifions notre fragment shader pour l'utiliser afin de calculer une couleur

```js
const fs = `#version 300 es
  precision highp float;

  // nous devons déclarer une sortie pour le fragment shader
  out vec4 outColor;

  void main() {
-    outColor = vec4(1, 0, 0.5, 1); // retourner rouge-violet
+    outColor = vec4(fract(gl_FragCoord.xy / 50.0), 0, 1);
  }
`;
```

Comme nous l'avons mentionné ci-dessus, `gl_FragCoord` est une coordonnée **pixel** donc elle
va compter en travers et vers le haut du canvas. En divisant par 50, on obtiendra une valeur qui va
de 0 à 1 au fur et à mesure que `gl_FragCoord` va de 0 à 50. En utilisant `fract`, on
gardera juste la partie *fract*ionnelle, donc par exemple quand `gl_FragCoord` est 75,
75 / 50 = 1.5, fract(1.5) = 0.5 donc on obtiendra une valeur qui va de 0 à 1
tous les 50 pixels.

{{{example url="../webgl-shadertoy-gl-fragcoord.html"}}}

Comme vous pouvez le voir ci-dessus, tous les 50 pixels horizontalement le rouge va de 0 à 1
et tous les 50 pixels vers le haut le vert va de 0 à 1.

Avec notre configuration actuelle, on pourrait faire des calculs plus complexes pour une image plus sophistiquée.
Mais nous avons un problème : nous ne savons pas quelle est la taille du canvas,
donc nous devrons coder en dur pour une taille spécifique. On peut résoudre ce problème
en passant la taille du canvas, puis en divisant `gl_FragCoord` par
la taille pour obtenir une valeur qui va de 0 à 1 en travers et vers le haut du canvas
quelle que soit la taille.

```js
const fs = `#version 300 es
  precision highp float;

+  uniform vec2 u_resolution;

  // nous devons déclarer une sortie pour le fragment shader
  out vec4 outColor;

  void main() {
-    outColor = vec4(fract(gl_FragCoord.xy / 50.0), 0, 1);
+    outColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
  }
`;
```

et rechercher et définir l'uniform

```js
// rechercher où les données de sommets doivent aller.
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

+// rechercher les emplacements des uniforms
+const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

...

+gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

gl.drawArrays(
    gl.TRIANGLES,
    0,     // décalage
    6,     // nombre de sommets à traiter
);

...

```

ce qui nous permet de faire en sorte que notre dégradé de rouge et vert remplisse toujours le canvas quelle que
soit la résolution

{{{example url="../webgl-shadertoy-w-resolution.html"}}}

Passons aussi la position de la souris en coordonnées de pixels.

```js
const fs = `#version 300 es
  precision highp float;

  uniform vec2 u_resolution;
+  uniform vec2 u_mouse;

  // nous devons déclarer une sortie pour le fragment shader
  out vec4 outColor;

  void main() {
-    outColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
+    outColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
  }
`;
```

Ensuite, nous devons rechercher l'emplacement de l'uniform,

```js
// rechercher les emplacements des uniforms
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
+const mouseLocation = gl.getUniformLocation(program, "u_mouse");
```

suivre la souris,

```js
let mouseX = 0;
let mouseY = 0;

function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // le bas est 0 en WebGL
  render();
}

canvas.addEventListener('mousemove', setMousePosition);
```

et définir l'uniform.

```js
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
+gl.uniform2f(mouseLocation, mouseX, mouseY);
```

Nous devons également changer le code pour que nous rendions quand la position de la souris change

```js
function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // le bas est 0 en WebGL
+  render();
}

+function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // décalage
      6,     // nombre de sommets à traiter
  );
+}
+render();
```

et pendant qu'on y est, gérons aussi le tactile

```js
canvas.addEventListener('mousemove', setMousePosition);
+canvas.addEventListener('touchstart', (e) => {
+  e.preventDefault();
+}, {passive: false});
+canvas.addEventListener('touchmove', (e) => {
+  e.preventDefault();
+  setMousePosition(e.touches[0]);
+}, {passive: false});
```

et maintenant vous pouvez voir que si vous déplacez la souris sur l'exemple, ça affecte notre image.

{{{example url="../webgl-shadertoy-w-mouse.html"}}}

La dernière pièce majeure est que nous voulons pouvoir animer quelque chose, donc nous passons une
chose de plus, une valeur de temps que nous pouvons utiliser pour l'ajouter à nos calculs.

Par exemple si nous faisions ça

```js
const fs = `#version 300 es
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
+  uniform float u_time;

  // nous devons déclarer une sortie pour le fragment shader
  out vec4 outColor;

  void main() {
-    outColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
+    outColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), fract(u_time), 1);
  }
`;
```

Et maintenant le canal bleu pulsera selon le temps. Nous devons juste
rechercher l'uniform, et le définir dans une [boucle requestAnimationFrame](webgl-animation.html).

```js
// rechercher les emplacements des uniforms
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const mouseLocation = gl.getUniformLocation(program, "u_mouse");
+const timeLocation = gl.getUniformLocation(program, "u_time");

...

-function render() {
+function render(time) {
+  time *= 0.001;  // convertir en secondes

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(mouseLocation, mouseX, mouseY);
+  gl.uniform1f(timeLocation, time);

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // décalage
      6,     // nombre de sommets à traiter
  );

+  requestAnimationFrame(render);
+}
+requestAnimationFrame(render);
-render();
```

De plus, nous n'avons plus besoin de rendre au mouvement de la souris puisque nous rendons en continu.

```js
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // le bas est 0 en WebGL
-  render();
});
```

Et nous obtenons une animation simple mais ennuyeuse.

{{{example url="../webgl-shadertoy-w-time.html"}}}

Donc maintenant avec tout ça, nous pouvons prendre un shader de [Shadertoy.com](https://shadertoy.com). Les shaders Shadertoy vous fournissent une fonction appelée `mainImage` sous cette forme

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{	
}
```

Où votre travail est de définir `fragColor` comme vous définiriez normalement `gl_FragColor` et
`fragCoord` est identique à `gl_FragCoord`. Ajouter cette fonction supplémentaire permet à Shadertoy
d'imposer un peu plus de structure ainsi que de faire quelques travaux supplémentaires avant ou après l'appel à
`mainImage`. Pour l'utiliser, nous devons juste l'appeler comme ça

```glsl
#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

out vec4 outColor;

//---insérer le code shadertoy ici--

void main() {
  mainImage(outColor, gl_FragCoord.xy);
}
```

Sauf que Shadertoy utilise les noms d'uniforms `iResolution`, `iMouse` et `iTime`, donc renommons-les.

```glsl
#version 300 es
precision highp float;

-uniform vec2 u_resolution;
-uniform vec2 u_mouse;
-uniform float u_time;
+uniform vec2 iResolution;
+uniform vec2 iMouse;
+uniform float iTime;

//---insérer le code shadertoy ici--

out vec4 outColor;

void main() {
  mainImage(outColor, gl_FragCoord.xy);
}
```

et les rechercher avec les nouveaux noms

```js
// rechercher les emplacements des uniforms
-const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
-const mouseLocation = gl.getUniformLocation(program, "u_mouse");
-const timeLocation = gl.getUniformLocation(program, "u_time");
+const resolutionLocation = gl.getUniformLocation(program, "iResolution");
+const mouseLocation = gl.getUniformLocation(program, "iMouse");
+const timeLocation = gl.getUniformLocation(program, "iTime");
```

En prenant [ce shader shadertoy](https://www.shadertoy.com/view/3l23Rh) et en le collant
dans notre shader ci-dessus là où il est indiqué `//---insérer le code shadertoy ici--`, on obtient...

{{{example url="../webgl-shadertoy.html"}}}

C'est une image extraordinairement belle pour ne pas avoir de données !

J'ai fait en sorte que l'exemple ci-dessus ne rende que lorsque la souris est au-dessus du canvas ou lors d'un toucher.
C'est parce que les calculs nécessaires
pour dessiner l'image ci-dessus sont complexes et lents, et les laisser tourner en continu
rendrait très difficile l'interaction avec cette page. Si vous avez
un GPU très rapide, l'image ci-dessus pourrait tourner en douceur. Sur mon portable,
cependant, ça tourne lentement et en saccades.

Cela soulève un point extrêmement important. **Les shaders sur
shadertoy ne sont pas des bonnes pratiques**. Shadertoy est un puzzle et
un défi de *"Si je n'ai pas de données et seulement une fonction qui
prend très peu d'entrées, puis-je créer une image intéressante ou belle ?"*.
Ce n'est pas la façon de créer du WebGL performant.

Prenons par exemple [ce shader shadertoy incroyable](https://www.shadertoy.com/view/4sS3zG) qui ressemble à ça

<div class="webgl_center"><img src="resources/shadertoy-dolphin.png" style="width: 639px;"></div>

C'est magnifique mais ça tourne à environ 19 images par seconde dans une petite
fenêtre de 640x360 sur mon portable puissant. Agrandissez la fenêtre en plein écran et ça tourne à environ
2 ou 3 images par seconde. En testant sur mon bureau plus puissant, ça n'atteint toujours que 45 images par
seconde à 640x360 et peut-être 10 en plein écran.

Comparez ça à ce jeu qui est également assez beau et pourtant tourne à 30 à 60 images par seconde
même sur des GPU moins puissants

<iframe class="webgl_center" style="width:560px; height: 360px;" src="https://www.youtube-nocookie.com/embed/7v9gZK9HqqI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

C'est parce que le jeu utilise les meilleures pratiques en dessinant des choses avec des
triangles texturés au lieu de calculs complexes.

Donc, veuillez garder ça à l'esprit. Les exemples sur Shadertoy sont
tout simplement incroyables en partie parce que maintenant vous savez qu'ils sont réalisés
sous la contrainte extrême de presque aucune donnée et ce sont des fonctions complexes
qui dessinent de jolies images. En tant que tels, ils sont une merveille.

Ils sont aussi un excellent moyen d'apprendre beaucoup de mathématiques.
Mais, ils ne sont absolument pas la façon dont on obtient une
application WebGL performante. Gardez donc ça à l'esprit.

Sinon, si vous voulez exécuter plus de shaders Shadertoy, vous aurez
besoin de fournir quelques uniforms supplémentaires. Voici une liste des
uniforms que Shadertoy fournit

<div class="webgl_center"><table  class="tabular-data tabular-data1">
<thead><tr><td>type</td><td>nom</td><td>où</td><td>description</td></tr></thead>
<tbody>
<tr><td><b>vec3</b></td><td><b>iResolution</b></td><td>image / buffer</td><td>La résolution du viewport (z est le ratio d'aspect des pixels, généralement 1.0)</td></tr>
<tr><td><b>float</b></td><td><b>iTime</b></td><td>image / son / buffer</td><td>Temps actuel en secondes</td></tr>
<tr><td><b>float</b></td><td><b>iTimeDelta</b></td><td>image / buffer</td><td>Temps pour rendre une frame, en secondes</td></tr>
<tr><td><b>int</b></td><td><b>iFrame</b></td><td>image / buffer</td><td>Frame actuelle</td></tr>
<tr><td><b>float</b></td><td><b>iFrameRate</b></td><td>image / buffer</td><td>Nombre de frames rendues par seconde</td></tr>
<tr><td><b>float</b></td><td><b>iChannelTime[4]</b></td><td>image / buffer</td><td>Temps pour le canal (si vidéo ou son), en secondes</td></tr>
<tr><td><b>vec3</b></td><td><b>iChannelResolution[4]</b></td><td>image / buffer / son</td><td>Résolution de la texture d'entrée pour chaque canal</td></tr>
<tr><td><b>vec4</b></td><td><b>iMouse</b></td><td>image / buffer</td><td>xy = coordonnées du pixel actuel (si LMB enfoncé). zw = pixel du clic</td></tr>
<tr><td><b>sampler2D</b></td><td><b>iChannel{i}</b></td><td>image / buffer / son</td><td>Sampler pour les textures d'entrée i</td></tr>
<tr><td><b>vec4</b></td><td><b>iDate</b></td><td>image / buffer / son</td><td>Année, mois, jour, heure en secondes dans .xyzw</td></tr>
<tr><td><b>float</b></td><td><b>iSampleRate</b></td><td>image / buffer / son</td><td>Le taux d'échantillonnage du son (généralement 44100)</td></tr>
</tbody></table></div>

Notez que `iMouse` et `iResolution` sont censés être
respectivement un `vec4` et un `vec3`, donc vous pourriez avoir besoin d'ajuster
ceux-ci pour correspondre.

`iChannel` sont des textures, donc si le shader en a besoin, vous aurez besoin
de fournir des [textures](webgl-3d-textures.html).

Shadertoy vous permet également d'utiliser plusieurs shaders pour rendre vers
des textures hors écran, donc si un shader en a besoin, vous aurez besoin de configurer
des [textures vers lesquelles rendre](webgl-render-to-texture.html).

La colonne "où" indique quels uniforms sont
disponibles dans quels shaders. "image" est un shader
qui rend vers le canvas. "buffer" est un shader
qui rend vers une texture hors écran. "son" est
un shader où [votre shader est censé générer
des données sonores dans une texture](https://stackoverflow.com/questions/34859701/how-do-shadertoys-audio-shaders-work).

J'espère que cela a aidé à expliquer Shadertoy. C'est un excellent site avec des œuvres incroyables
mais il est bon de savoir ce qui se passe vraiment. Si vous voulez en savoir plus sur
les techniques utilisées dans ce type de shaders, 2 bonnes ressources sont
[le blog de la personne qui a créé le site shadertoy](https://www.iquilezles.org/www/index.htm) et [The Book of Shaders](https://thebookofshaders.com/) (qui est un peu trompeur car il ne couvre vraiment que le genre de shaders utilisés sur shadertoy, pas le genre utilisé dans des applications et jeux performants. C'est quand même une excellente ressource !)

<div class="webgl_bottombar" id="pixel-coords">
<h3>Coordonnées de pixels</h3>
<p>Les coordonnées de pixels dans WebGL
sont référencées par leurs bords. Donc par exemple si nous avions un canvas de 3x2 pixels alors
la valeur de <code>gl_FragCoord</code> au pixel 2
depuis la gauche et 1 depuis le bas
serait 2.5, 1.5
</p>
<div class="webgl_center"><img src="resources/webgl-pixels.svg" style="width: 500px;"></div>
</div>
