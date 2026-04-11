Title: WebGL2 3D - Éclairage directionnel
Description: Comment implémenter l'éclairage directionnel dans WebGL
TOC: Éclairage directionnel


Cet article est la suite de [WebGL 3D Caméras](webgl-3d-camera.html).
Si vous ne l'avez pas lu, je vous suggère de [commencer par là](webgl-3d-camera.html).

Il existe de nombreuses façons d'implémenter l'éclairage. La plus simple est probablement *l'éclairage directionnel*.

L'éclairage directionnel suppose que la lumière vient uniformément d'une direction. Le soleil
par une journée dégagée est souvent considéré comme une lumière directionnelle. Il est si loin que ses rayons
peuvent être considérés comme frappant la surface d'un objet tous en parallèle.

Le calcul de l'éclairage directionnel est en fait assez simple. Si nous savons quelle direction
la lumière voyage et si nous savons dans quelle direction pointe la surface de l'objet,
nous pouvons prendre le *produit scalaire* des 2 directions et cela nous donnera le cosinus de
l'angle entre les 2 directions.

Voici un exemple

{{{diagram url="resources/dot-product.html" caption="faites glisser les points"}}}

Faites glisser les points. Si vous les mettez exactement opposés l'un à l'autre, vous verrez que le produit scalaire
est -1. S'ils sont exactement au même endroit, le produit scalaire est 1.

En quoi est-ce utile ? Eh bien, si nous savons dans quelle direction pointe la surface de notre objet 3D
et que nous connaissons la direction de la lumière, nous pouvons simplement prendre le produit scalaire
de ces deux directions et il nous donnera un nombre 1 si la lumière pointe directement sur la
surface et -1 s'ils pointent directement dans des directions opposées.

{{{diagram url="resources/directional-lighting.html" caption="faire pivoter la direction" width="500" height="400"}}}

Nous pouvons multiplier notre couleur par cette valeur de produit scalaire et voilà ! De l'éclairage !

Un problème : comment savons-nous dans quelle direction les surfaces de notre objet 3D sont orientées ?

## Introduction aux Normales

Je ne sais pas pourquoi on les appelle *normales* mais du moins en 3D graphique, une normale
est le mot pour un vecteur unitaire qui décrit la direction vers laquelle une surface est orientée.

Voici quelques normales pour un cube et une sphère.

{{{diagram url="resources/normals.html"}}}

Les lignes sortant des objets représentent les normales pour chaque sommet.

Remarquez que le cube a 3 normales à chaque coin. C'est parce que vous avez besoin de
3 normales différentes pour représenter la façon dont chaque face du cube est, hm, orientée.

Ici les normales sont également colorées selon leur direction avec
le x positif étant <span style="color: red;">rouge</span>, le haut étant
<span style="color: green;">vert</span> et le z positif étant
<span style="color: blue;">bleu</span>.

Alors, ajoutons des normales à notre `F` de [nos exemples précédents](webgl-3d-camera.html)
pour pouvoir l'éclairer. Comme le `F` est très anguleux et que ses faces sont alignées
sur l'axe x, y ou z, ce sera assez simple. Les choses qui sont orientées vers l'avant
ont la normale `0, 0, 1`. Celles qui sont orientées vers l'arrière ont `0, 0, -1`. Vers
la gauche c'est `-1, 0, 0`, vers la droite `1, 0, 0`. Vers le haut c'est `0, 1, 0` et vers le bas `0, -1, 0`.

```
function setNormals(gl) {
  var normals = new Float32Array([
          // colonne de gauche avant
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // traverse du haut avant
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // traverse du milieu avant
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // colonne de gauche arrière
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // traverse du haut arrière
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // traverse du milieu arrière
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // dessus
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // droite de la traverse du haut
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // dessous de la traverse du haut
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // entre la traverse du haut et du milieu
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // dessus de la traverse du milieu
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // droite de la traverse du milieu
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // dessous de la traverse du milieu
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // droite du bas
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bas
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // côté gauche
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```

et les configurer. Pendant qu'on y est, supprimons les couleurs des sommets
pour voir plus facilement l'éclairage.

    // rechercher où les données de sommets doivent aller.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// Créer un buffer pour les couleurs.
    -var buffer = gl.createBuffer();
    -gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    -gl.enableVertexAttribArray(colorLocation);
    -
    -// Nous fournirons RGB en bytes.
    -gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    -
    -// Définir les couleurs.
    -setColors(gl);

    // Créer un buffer pour les normales.
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    // Définir les normales.
    setNormals(gl);

Maintenant, nous devons faire en sorte que nos shaders les utilisent

D'abord, le vertex shader où nous passons simplement les normales au
fragment shader

```
#version 300 es

// un attribut est une entrée (in) dans un vertex shader.
// Il recevra des données depuis un buffer
in vec4 a_position;
-in vec4 a_color;
+in vec3 a_normal;

// Une matrice pour transformer les positions
uniform mat4 u_matrix;

-// un varying pour passer la couleur au fragment shader
-out vec4 v_color;

+// varying pour passer la normale au fragment shader
+out vec3 v_normal;

// tous les shaders ont une fonction main
void main() {
  // Multiplier la position par la matrice.
  gl_Position = u_matrix * a_position;

-  // Passer la couleur au fragment shader.
-  v_color = a_color;

+  // Passer la normale au fragment shader
+  v_normal = a_normal;
}
```

Et le fragment shader où nous ferons le calcul en utilisant le produit scalaire
de la direction de la lumière et de la normale

```
#version 300 es

precision highp float;

-// la couleur varying passée depuis le vertex shader
-in vec4 v_color;

+// Passé et interpolé depuis le vertex shader.
+in vec3 v_normal;
+
+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

// nous devons déclarer une sortie pour le fragment shader
out vec4 outColor;

void main() {
-  outColor = v_color;
+  // parce que v_normal est un varying il est interpolé
+  // donc ce ne sera pas un vecteur unitaire. La normalisation
+  // en fera à nouveau un vecteur unitaire
+  vec3 normal = normalize(v_normal);
+
+  // calculer la lumière en prenant le produit scalaire
+  // de la normale dans la direction inverse de la lumière
+  float light = dot(normal, u_reverseLightDirection);
+
+  outColor = u_color;
+
+  // Multiplions seulement la partie couleur (pas l'alpha)
+  // par la lumière
+  outColor.rgb *= light;
}
```

Ensuite, nous devons rechercher les emplacements de `u_color` et `u_reverseLightDirection`.

```
  // rechercher les uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```

et nous devons les définir

```
  // Définir la matrice.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

+  // Définir la couleur à utiliser
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // vert
+
+  // définir la direction de la lumière.
+  gl.uniform3fv(reverseLightDirectionLocation, normalize([0.5, 0.7, 1]));
```

`normalize`, que nous avons vu avant, transformera les valeurs que nous mettons en
un vecteur unitaire. Les valeurs spécifiques dans l'exemple sont
`x = 0.5` qui est positif en `x` ce qui signifie que la lumière est à droite pointant vers la gauche.
`y = 0.7` qui est positif en `y` ce qui signifie que la lumière est en haut pointant vers le bas.
`z = 1` qui est positif en `z` ce qui signifie que la lumière est devant pointant dans la scène.
les valeurs relatives signifient que la direction pointe principalement dans la scène
et pointe plus vers le bas que vers la droite.

Et voilà le résultat

{{{example url="../webgl-3d-lighting-directional.html" }}}

Si vous faites pivoter le F, vous pourriez remarquer quelque chose. Le F tourne
mais l'éclairage ne change pas. Quand le F tourne, nous voulons que la partie
qui fait face à la direction de la lumière soit la plus brillante.

Pour corriger cela, nous devons réorienter les normales quand l'objet est réorienté.
Comme nous l'avons fait pour les positions, nous pouvons multiplier les normales par une matrice. La matrice la plus évidente
serait la matrice `world`. En l'état actuel, nous ne passons qu'une seule
matrice appelée `u_matrix`. Changeons cela pour passer 2 matrices. Une appelée
`u_world` qui sera la matrice world. Une autre appelée `u_worldViewProjection`
qui sera ce que nous passons actuellement en tant que `u_matrix`

```
#version 300 es

// un attribut est une entrée (in) dans un vertex shader.
// Il recevra des données depuis un buffer
in vec4 a_position;
in vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

out vec3 v_normal;

void main() {
  // Multiplier la position par la matrice.
*  gl_Position = u_worldViewProjection * a_position;

*  // orienter les normales et les passer au fragment shader
*  v_normal = mat3(u_world) * a_normal;
}
```

Remarquez que nous multiplions `a_normal` par `mat3(u_world)`. C'est
parce que les normales sont une direction donc nous ne nous soucions pas de la translation.
La partie orientation de la matrice n'est que dans la zone 3x3 supérieure
de la matrice.

Maintenant, nous devons rechercher ces uniforms

```
  // rechercher les uniforms
-  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
*  var worldViewProjectionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

Et nous devons changer le code qui les met à jour

```
*var worldMatrix = m4.yRotation(fRotationRadians);
*var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix,
                                             worldMatrix);

*// Définir les matrices
*gl.uniformMatrix4fv(
*    worldViewProjectionLocation, false,
*    worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

et voilà le résultat

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

Faites pivoter le F et remarquez quelle face face à la direction de la lumière est éclairée.

Il y a un problème que je ne sais pas comment montrer directement donc je vais
le montrer dans un diagramme. Nous multiplions la `normal` par
la matrice `u_world` pour réorienter les normales.
Que se passe-t-il si nous redimensionnons la matrice world ?
Il s'avère que nous obtenons de mauvaises normales.

{{{diagram url="resources/normals-scaled.html" caption="cliquez pour basculer les normales" width="600" }}}

Je n'ai jamais pris la peine de comprendre
la solution, mais il s'avère que vous pouvez obtenir l'inverse de la matrice world,
la transposer, ce qui signifie échanger les colonnes pour les lignes, et l'utiliser à la place
et vous obtiendrez la bonne réponse.

Dans le diagramme ci-dessus, la sphère <span style="color: #F0F;">violette</span>
n'est pas redimensionnée. La sphère <span style="color: #F00;">rouge</span> à gauche
est redimensionnée et les normales sont multipliées par la matrice world. Vous
pouvez voir que quelque chose ne va pas. La sphère <span style="color: #00F;">bleue</span>
à droite utilise la matrice inverse transposée de la world.

Cliquez sur le diagramme pour parcourir différentes représentations. Vous devriez
remarquer que quand le redimensionnement est extrême, il est très facile de voir que les normales
à gauche (world) **ne** restent **pas** perpendiculaires à la surface de la sphère
alors que celles à droite (worldInverseTranspose) restent perpendiculaires
à la sphère. Le dernier mode les rend toutes en rouge. Vous devriez voir que l'éclairage
sur les 2 sphères extérieures est très différent selon la matrice utilisée.
Il est difficile de dire laquelle est correcte, c'est pourquoi c'est un problème subtil, mais
d'après les autres visualisations, il est clair que l'utilisation de la worldInverseTranspose
est correcte.

Pour implémenter cela dans notre exemple, modifions le code comme suit. D'abord, nous allons mettre à jour
le shader. Techniquement, nous pourrions juste mettre à jour la valeur de `u_world`
mais il vaut mieux renommer les choses selon ce qu'elles sont réellement
sinon cela deviendra confus.

```
#version 300 es

// un attribut est une entrée (in) dans un vertex shader.
// Il recevra des données depuis un buffer
in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_worldViewProjection;
-uniform mat4 u_world
+uniform mat4 u_worldInverseTranspose;

// varyings pour passer la normale et la couleur au fragment shader
out vec4 v_color;
out vec3 v_normal;

// tous les shaders ont une fonction main
void main() {
  // Multiplier la position par la matrice.
  gl_Position = u_worldViewProjection * a_position;

  // orienter les normales et les passer au fragment shader
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```

Ensuite, nous devons le rechercher

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

Et nous devons le calculer et le définir

```
var worldMatrix = m4.yRotation(fRotationRadians);
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
+var worldInverseMatrix = m4.inverse(worldMatrix);
+var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// Définir les matrices
gl.uniformMatrix4fv(
    worldViewProjectionLocation, false,
    worldViewProjectionMatrix);
-gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+    worldInverseTransposeLocation, false,
+    worldInverseTransposeMatrix);
```

et voici le code pour transposer une matrice

```
var m4 = {
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },
  ...
```

Parce que l'effet est subtil et que nous ne redimensionnons rien,
il n'y a pas de différence notable mais au moins maintenant nous sommes préparés.

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

J'espère que cette première étape dans l'éclairage était claire. La suite : [l'éclairage ponctuel](webgl-3d-lighting-point.html).

<div class="webgl_bottombar">
<h3>Alternatives à mat3(u_worldInverseTranspose) * a_normal</h3>
<p>Dans notre shader ci-dessus, il y a une ligne comme celle-ci</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>Nous aurions pu faire ceci</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p>Parce que nous définissons <code>w</code> à 0 avant de multiplier, cela revient à
multiplier la translation de la matrice par 0, ce qui l'élimine effectivement. Je pense que c'est
la façon la plus courante de le faire. La façon avec mat3 m'a semblé plus propre mais
je l'ai souvent fait aussi de cette façon.</p>
<p>Encore une autre solution serait de faire de <code>u_worldInverseTranspose</code> un <code>mat3</code>.
Il y a 2 raisons de ne pas le faire. L'une est que nous pourrions avoir d'autres
besoins pour le <code>u_worldInverseTranspose</code> complet donc passer le
<code>mat4</code> entier signifie que nous pouvons l'utiliser pour ces autres besoins.
L'autre est que toutes nos fonctions matricielles en JavaScript
créent des matrices 4x4. Créer tout un autre ensemble pour les matrices 3x3
ou même convertir de 4x4 à 3x3 est un travail que nous préférons
ne pas faire sauf s'il y avait une raison plus convaincante.</p>
</div>
