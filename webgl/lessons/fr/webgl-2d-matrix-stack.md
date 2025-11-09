Title: Implémentation d'une pile de matrices en WebGL2
Description: Comment implémenter les fonctions translate/rotate/scale de canvas 2d dans WebGL
TOC: 2D - Pile de matrices


Cet article est la suite de [WebGL 2D DrawImage](webgl-2d-drawimage.html).
Si vous ne l'avez pas lu, je vous suggère de [commencer par là](webgl-2d-drawimage.html).

Dans cet article précédent, nous avons implémenté l'équivalent WebGL de la fonction `drawImage` de Canvas 2D
y compris sa capacité à spécifier à la fois le rectangle source et le rectangle de destination.

Ce que nous n'avons pas encore fait, c'est permettre de pivoter et/ou de mettre à l'échelle depuis n'importe quel point arbitraire. Nous pourrions le faire
en ajoutant plus d'arguments, au minimum nous aurions besoin de spécifier un point central, une rotation et une échelle x et y.
Heureusement, il existe une façon plus générique et utile. La façon dont l'API Canvas 2D fait cela est avec une pile de matrices.
Les fonctions de pile de matrices de l'API Canvas 2D sont `save`, `restore`, `translate`, `rotate` et `scale`.

Une pile de matrices est assez simple à implémenter. Nous créons une pile de matrices. Nous créons des fonctions pour
multiplier la matrice en haut de la pile en utilisant soit une matrice de translation, de rotation ou d'échelle
[en utilisant les fonctions que nous avons créées précédemment](webgl-2d-matrices.html).

Voici l'implémentation

D'abord le constructeur et les fonctions `save` et `restore`

```
function MatrixStack() {
  this.stack = [];

  // comme la pile est vide, cela y mettra une matrice initiale
  this.restore();
}

// Dépile le sommet de la pile en restaurant la matrice précédemment sauvegardée
MatrixStack.prototype.restore = function() {
  this.stack.pop();
  // Ne jamais laisser la pile complètement vide
  if (this.stack.length < 1) {
    this.stack[0] = m4.identity();
  }
};

// Empile une copie de la matrice actuelle sur la pile
MatrixStack.prototype.save = function() {
  this.stack.push(this.getCurrentMatrix());
};
```

Nous avons également besoin de fonctions pour obtenir et définir la matrice du sommet

```
// Obtient une copie de la matrice actuelle (sommet de la pile)
MatrixStack.prototype.getCurrentMatrix = function() {
  return this.stack[this.stack.length - 1].slice();  // fait une copie
};

// Nous permet de définir la matrice actuelle
MatrixStack.prototype.setCurrentMatrix = function(m) {
  return this.stack[this.stack.length - 1] = m;
};

```

Enfin, nous devons implémenter `translate`, `rotate` et `scale` en utilisant nos
fonctions de matrices précédentes.

```
// Translate la matrice actuelle
MatrixStack.prototype.translate = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

// Effectue une rotation de la matrice actuelle autour de Z
MatrixStack.prototype.rotateZ = function(angleInRadians) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.zRotate(m, angleInRadians));
};

// Met à l'échelle la matrice actuelle
MatrixStack.prototype.scale = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

Notez que nous utilisons les fonctions mathématiques de matrices 3D. Nous pourrions simplement utiliser `0` pour `z` sur la translation et `1`
pour `z` sur l'échelle, mais je trouve que je suis tellement habitué à utiliser les fonctions 2D de Canvas 2D
que j'oublie souvent de spécifier `z` et alors le code casse, donc rendons `z` optionnel

```
// Translate la matrice actuelle
MatrixStack.prototype.translate = function(x, y, z) {
+  if (z === undefined) {
+    z = 0;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

...

// Met à l'échelle la matrice actuelle
MatrixStack.prototype.scale = function(x, y, z) {
+  if (z === undefined) {
+    z = 1;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

En utilisant notre [`drawImage` de la leçon précédente](webgl-2d-drawimage.html), nous avions ces lignes

```
// cette matrice convertira des pixels vers l'espace de découpage
var matrix = m4.orthographic(
    0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

// translate notre quad vers dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// met à l'échelle notre quad de 1 unité
// de 1 unité vers dstWidth, dstHeight unités
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

Nous devons simplement créer une pile de matrices

```
var matrixStack = new MatrixStack();
```

et multiplier par la matrice du sommet de notre pile

```
// cette matrice convertira des pixels vers l'espace de découpage
var matrix = m4.orthographic(
    0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

+// La pile de matrices est en pixels donc elle vient après la projection
+// ci-dessus qui a converti notre espace de l'espace de découpage vers l'espace en pixels
+matrix = m4.multiply(matrix, matrixStack.getCurrentMatrix());

// translate notre quad vers dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// met à l'échelle notre quad de 1 unité
// de 1 unité vers dstWidth, dstHeight unités
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

Et maintenant nous pouvons l'utiliser de la même façon que nous l'utiliserions avec l'API Canvas 2D.

Si vous ne savez pas comment utiliser la pile de matrices, vous pouvez la considérer comme
déplaçant et orientant l'origine du canvas. Donc par exemple, par défaut dans un canvas 2D, l'origine (0,0)
est dans le coin supérieur gauche.

Par exemple, si nous déplaçons l'origine au centre du canvas, alors dessiner une image en 0,0
la dessinera à partir du centre du canvas

Prenons [notre exemple précédent](webgl-2d-drawimage.html) et dessinons simplement une seule image

```
var textureInfo = loadImageAndCreateTextureInfo('resources/star.jpg');

function draw(time) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  matrixStack.save();
  matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
  matrixStack.rotateZ(time);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

  matrixStack.restore();
}
```

Et voici le résultat.

{{{example url="../webgl-2d-matrixstack-01.html" }}}

vous pouvez voir que même si nous passons `0, 0` à `drawImage`, puisque nous utilisons
`matrixStack.translate` pour déplacer l'origine au centre du canvas,
l'image est dessinée et tourne autour de ce centre.

Déplaçons le centre de rotation au centre de l'image

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);
+matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
```

Et maintenant elle tourne autour du centre de l'image au centre du canvas

{{{example url="../webgl-2d-matrixstack-02.html" }}}

Dessinons la même image à chaque coin en tournant sur différents coins

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);

+matrixStack.save();
+{
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // Nous sommes au centre de l'image centrale donc allons au coin supérieur/gauche
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.2));
+  matrixStack.scale(0.2, 0.2);
+  // Maintenant nous voulons le coin inférieur/droit de l'image que nous allons dessiner
+  matrixStack.translate(-textureInfo.width, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // Nous sommes au centre de l'image centrale donc allons au coin supérieur/droit
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.3));
+  matrixStack.scale(0.2, 0.2);
+  // Maintenant nous voulons le coin inférieur/gauche de l'image que nous allons dessiner
+  matrixStack.translate(0, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // Nous sommes au centre de l'image centrale donc allons au coin inférieur/gauche
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.4));
+  matrixStack.scale(0.2, 0.2);
+  // Maintenant nous voulons le coin supérieur/droit de l'image que nous allons dessiner
+  matrixStack.translate(-textureInfo.width, 0);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // Nous sommes au centre de l'image centrale donc allons au coin inférieur/droit
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.5));
+  matrixStack.scale(0.2, 0.2);
+  // Maintenant nous voulons le coin supérieur/gauche de l'image que nous allons dessiner
+  matrixStack.translate(0, 0);  // 0,0 signifie que cette ligne ne fait rien en réalité
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
```

Et voici le résultat

{{{example url="../webgl-2d-matrixstack-03.html" }}}

Si vous pensez aux différentes fonctions de pile de matrices, `translate`, `rotateZ` et `scale`
comme déplaçant l'origine, alors ma façon de penser à la définition du centre de rotation est
*où devrais-je déplacer l'origine pour que lorsque j'appelle drawImage, une certaine partie
de l'image soit **à** l'origine précédente ?*

En d'autres termes, disons que sur un canvas 400x300, j'appelle `matrixStack.translate(210, 150)`.
À ce moment-là, l'origine est à 210, 150 et tout le dessin sera relatif à ce point.
Si nous appelons `drawImage` avec `0, 0`, c'est là que l'image sera dessinée.

<img class="webgl_center" width="400" src="resources/matrixstack-before.svg" />

Disons que nous voulons que le centre de rotation soit en bas à droite. Dans ce cas,
où devrions-nous déplacer l'origine pour que lorsque nous appelons `drawImage`,
le point que nous voulons comme centre de rotation soit à l'origine actuelle ?
Pour le coin inférieur droit de la texture, ce serait `-textureWidth, -textureHeight`.
Donc maintenant, quand nous appelons `drawImage` avec `0, 0`, la texture serait dessinée ici
et son coin inférieur droit serait à l'origine précédente.

<img class="webgl_center" width="400" src="resources/matrixstack-after.svg" />

À n'importe quel moment, quoi que nous ayons fait avant sur la pile de matrices, cela n'a pas d'importance. Nous avons fait un tas
de choses pour déplacer ou mettre à l'échelle ou faire pivoter l'origine, mais juste avant d'appeler
`drawImage`, où que l'origine se trouve à ce moment est sans importance.
C'est la nouvelle origine, donc nous devons juste décider où déplacer cette origine
par rapport à l'endroit où la texture serait dessinée si nous n'avions rien avant elle sur la pile.

Vous pourriez remarquer qu'une pile de matrices est très similaire à un [graphe de scène que nous
avons couvert précédemment](webgl-scene-graph.html). Un graphe de scène avait un arbre de nœuds
et en parcourant l'arbre, nous multipliions chaque nœud par le nœud de son parent.
Une pile de matrices est effectivement une autre version de ce même processus.


