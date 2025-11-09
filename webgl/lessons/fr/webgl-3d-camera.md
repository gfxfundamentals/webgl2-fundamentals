Title: WebGL2 3D - Caméras
Description: Comment fonctionnent les caméras en WebGL
TOC: 3D - Caméras


Cet article est la suite d'une série d'articles sur WebGL.
Le premier [a commencé par les fondamentaux](webgl-fundamentals.html) et
le précédent portait sur [la projection en perspective 3D](webgl-3d-perspective.html).
Si vous ne les avez pas lus, veuillez d'abord les consulter.

Dans l'article précédent, nous avons dû déplacer le F devant le frustum car la fonction `m4.perspective`
s'attend à ce qu'il soit à l'origine (0, 0, 0) et que les objets dans le frustum soient entre `-zNear`
et `-zFar` devant lui.

Déplacer les objets devant la vue ne semble pas être la bonne approche, n'est-ce pas ? Dans le monde réel,
vous déplacez généralement votre caméra pour prendre une photo d'un bâtiment.

{{{diagram url="resources/camera-move-camera.html?mode=0" caption="déplacer la caméra vers les objets" }}}

Vous ne déplacez généralement pas les bâtiments devant la caméra.

{{{diagram url="resources/camera-move-camera.html?mode=1" caption="déplacer les objets vers la caméra" }}}

Mais dans notre dernier article, nous avons créé une projection qui nécessite que les objets soient
devant l'origine sur l'axe -Z. Pour y parvenir, ce que nous voulons faire
est de déplacer la caméra à l'origine et de déplacer tout le reste de la bonne quantité
pour qu'il soit toujours au même endroit *par rapport à la caméra*.

{{{diagram url="resources/camera-move-camera.html?mode=2" caption="déplacer les objets vers la vue" }}}

Nous devons effectivement déplacer le monde devant la caméra. La façon la plus simple
de faire cela est d'utiliser une matrice "inverse". Les calculs pour calculer une
matrice inverse dans le cas général sont complexes mais conceptuellement c'est facile.
L'inverse est la valeur que vous utiliseriez pour annuler une autre valeur. Par
exemple, l'inverse d'une matrice qui translate en X de 123 est une matrice qui
translate en X de -123. L'inverse d'une matrice qui
met à l'échelle par 5 est une matrice qui met à l'échelle par 1/5 ou 0.2. L'inverse d'une matrice qui tourne
de 30&deg; autour de l'axe X serait une qui tourne de -30&deg; autour de l'axe X.


Jusqu'à présent, nous avons utilisé la translation, la rotation et la mise à l'échelle pour affecter
la position et l'orientation de notre 'F'. Après avoir multiplié toutes les
matrices ensemble, nous avons une seule matrice qui représente comment déplacer le
'F' de l'origine vers l'endroit, la taille et l'orientation que nous voulons. Nous pouvons
faire la même chose pour une caméra. Une fois que nous avons la matrice qui nous indique comment
déplacer et faire pivoter la caméra de l'origine vers où nous la voulons, nous pouvons
calculer son inverse qui nous donnera une matrice qui nous dit comment déplacer
et faire pivoter tout le reste de la quantité opposée, ce qui aura effectivement pour effet
que la caméra soit à (0, 0, 0) et que nous ayons déplacé tout le reste devant
elle.

Créons une scène 3D avec un cercle de 'F' comme dans les diagrammes ci-dessus.

Voici le code.

```
function drawScene() {
  var numFs = 5;
  var radius = 200;

  ...

  // Calcule la matrice
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zNear = 1;
  var zFar = 2000;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

  // Crée une matrice de vue à partir de la matrice de caméra.
  var viewMatrix = m4.inverse(cameraMatrix);

  // déplace l'espace de projection vers l'espace de vue (l'espace devant
  // la caméra)
  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  // Dessine des 'F' en cercle
  for (var ii = 0; ii < numFs; ++ii) {
    var angle = ii * Math.PI * 2 / numFs;

    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    // ajoute la translation pour ce F
    var matrix = m4.translate(viewProjectionMatrix, x, 0, z);

    // Définit la matrice.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Dessine la géométrie.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}
```

Juste après avoir calculé notre matrice de projection, vous pouvez voir que nous calculons une caméra qui
tourne autour des 'F' comme dans le diagramme ci-dessus.

```
  // Calcule la matrice de la caméra
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
```

Nous calculons ensuite une "matrice de vue" à partir de la matrice de caméra. Une "matrice de vue"
est la matrice qui déplace tout le reste à l'opposé de la caméra, rendant effectivement
tout relatif à la caméra comme si la caméra était à l'
origine (0,0,0)

```
  // Crée une matrice de vue à partir de la matrice de caméra.
  var viewMatrix = m4.inverse(cameraMatrix);
```

Nous combinons ensuite (multiplions) celles-ci pour créer une matrice viewProjection.

```
  // crée une matrice viewProjection. Cela appliquera à la fois la perspective
  // ET déplacera le monde pour que la caméra soit effectivement l'origine
  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
```

Enfin, nous utilisons cet espace comme espace de départ pour placer chaque `F`

```
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var matrix = m4.translate(viewProjectionMatrix, x, 0, z);
```

En d'autres termes, la viewProjection est la même pour chaque `F`. Même perspective,
même caméra.

Et voilà ! Une caméra qui tourne autour du cercle de 'F'. Faites glisser le curseur `cameraAngle`
pour déplacer la caméra.

{{{example url="../webgl-3d-camera.html" }}}

C'est très bien, mais utiliser la rotation et la translation pour déplacer une caméra où vous le souhaitez et la pointer vers
ce que vous voulez voir n'est pas toujours facile. Par exemple, si nous voulions que la caméra pointe toujours
vers un 'F' spécifique, il faudrait des calculs assez compliqués pour calculer comment faire pivoter la
caméra pour qu'elle pointe vers ce 'F' pendant qu'elle tourne autour du cercle de 'F'.

Heureusement, il existe une façon plus simple. Nous pouvons simplement décider où nous voulons la caméra et vers quoi nous voulons qu'elle pointe,
puis calculer une matrice qui placera la caméra là. En fonction du fonctionnement des matrices, cela est étonnamment facile.

D'abord, nous devons savoir où nous voulons la caméra. Nous appellerons cela la
`cameraPosition`. Ensuite, nous devons connaître la position de la chose que nous voulons
regarder ou viser. Nous l'appellerons la `target`. Si nous soustrayons la
`cameraPosition` de la `target`, nous aurons un vecteur qui pointe dans la
direction dans laquelle nous devrions aller depuis la caméra pour arriver à la cible. Appelons-le
`zAxis`. Puisque nous savons que la caméra pointe dans la direction -Z, nous
pouvons soustraire dans l'autre sens `cameraPosition - target`. Nous normalisons les
résultats et les copions directement dans la partie `z` d'une matrice.

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
| Zx | Zy | Zz |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
</pre></div>

Cette partie d'une matrice représente l'axe Z. Dans ce cas, l'axe Z de
la caméra. Normaliser un vecteur signifie en faire un vecteur qui représente
1.0. Si vous revenez à [l'article sur la rotation 2D](webgl-2d-rotation.html) où nous avons parlé des cercles
unités et de comment ils aident avec la rotation 2D. En 3D, nous avons besoin de sphères unités
et un vecteur normalisé représente un point sur une sphère unité.

{{{diagram url="resources/cross-product-diagram.html?mode=0" caption="l'<span class='z-axis'>axe z</span>" }}}

Ce n'est cependant pas suffisant comme information. Un seul vecteur nous donne un point sur une
sphère unité, mais quelle orientation depuis ce point pour orienter les choses ? Nous
devons remplir les autres parties de la matrice. Spécifiquement les parties de l'axe X
et de l'axe Y. Nous savons qu'en général ces 3 parties sont perpendiculaires les unes aux
autres. Nous savons aussi qu'"en général" nous ne pointons pas la caméra
directement vers le haut. Étant donné cela, si nous savons quelle direction est vers le haut, dans ce cas (0,1,0),
nous pouvons utiliser cela et quelque chose appelé un "produit vectoriel" pour calculer l'axe X
et l'axe Y pour la matrice.

Je n'ai aucune idée de ce que signifie un produit vectoriel en termes mathématiques. Ce que je
sais, c'est que si vous avez 2 vecteurs unitaires et que vous calculez le produit vectoriel
de ceux-ci, vous obtiendrez un vecteur qui est perpendiculaire à ces 2 vecteurs. En
d'autres termes, si vous avez un vecteur pointant vers le sud-est et un vecteur
pointant vers le haut, et que vous calculez le produit vectoriel, vous obtiendrez un vecteur pointant
soit vers le sud-ouest soit vers le nord-est puisque ce sont les 2 vecteurs qui sont perpendiculaires
au sud-est et au haut. Selon l'ordre dans lequel vous calculez le produit vectoriel,
vous obtiendrez la réponse opposée.

Dans tous les cas, si nous calculons le produit vectoriel de notre <span class="z-axis">`zAxis`</span> et
<span style="color: gray;">`up`</span>, nous obtiendrons le <span class="x-axis">xAxis</span> pour la caméra.

{{{diagram url="resources/cross-product-diagram.html?mode=1" caption="<span style='color:gray;'>up</span> cross <span class='z-axis'>zAxis</span> = <span class='x-axis'>xAxis</span>" }}}

Et maintenant que nous avons le <span class="x-axis">`xAxis`</span>, nous pouvons faire le produit vectoriel du <span class="z-axis">`zAxis`</span> et du <span class="x-axis">`xAxis`</span>
ce qui nous donnera le <span class="y-axis">`yAxis`</span> de la caméra

{{{diagram url="resources/cross-product-diagram.html?mode=2" caption="<span class='z-axis'>zAxis</span> cross <span class='x-axis'>xAxis</span> = <span class='y-axis'>yAxis</span>"}}}

Maintenant, tout ce que nous avons à faire est de mettre les 3 axes dans une matrice. Cela nous donne une
matrice qui orientera quelque chose qui pointe vers la `target` depuis la
`cameraPosition`. Nous devons juste ajouter la `position`

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
| <span class="x-axis">Xx</span> | <span class="x-axis">Xy</span> | <span class="x-axis">Xz</span> |  0 |  <- <span class="x-axis">axe x</span>
+----+----+----+----+
| <span class="y-axis">Yx</span> | <span class="y-axis">Yy</span> | <span class="y-axis">Yz</span> |  0 |  <- <span class="y-axis">axe y</span>
+----+----+----+----+
| <span class="z-axis">Zx</span> | <span class="z-axis">Zy</span> | <span class="z-axis">Zz</span> |  0 |  <- <span class="z-axis">axe z</span>
+----+----+----+----+
| Tx | Ty | Tz |  1 |  <- position de la caméra
+----+----+----+----+
</pre></div>

Voici le code pour calculer le produit vectoriel de 2 vecteurs.

```
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
```

Voici le code pour soustraire deux vecteurs.

```
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
```

Voici le code pour normaliser un vecteur (en faire un vecteur unitaire).

```
function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // s'assurer de ne pas diviser par 0.
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}
```

Voici le code pour calculer une matrice "lookAt".

```
var m4 = {
  lookAt: function(cameraPosition, target, up) {
    var zAxis = normalize(
        subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));

    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  },
```

Et voici comment nous pourrions l'utiliser pour faire pointer la caméra vers un 'F' spécifique
pendant que nous la déplaçons.

```
  ...

  // Calcule la position du premier F
  var fPosition = [radius, 0, 0];

  // Utilise les mathématiques matricielles pour calculer une position sur le cercle.
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 50, radius * 1.5);

  // Obtient la position de la caméra depuis la matrice que nous avons calculée
  var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];

  var up = [0, 1, 0];

  // Calcule la matrice de la caméra en utilisant lookAt.
  var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

  // Crée une matrice de vue à partir de la matrice de caméra.
  var viewMatrix = m4.inverse(cameraMatrix);

  ...
```

Et voici le résultat.

{{{example url="../webgl-3d-camera-look-at.html" }}}

Faites glisser le curseur et remarquez comment la caméra suit un seul 'F'.

Notez que vous pouvez utiliser les mathématiques "lookAt" pour plus que les caméras. Les utilisations courantes sont de faire suivre
la tête d'un personnage à quelqu'un. Faire viser une tourelle vers une cible. Faire suivre un chemin à un objet. Vous calculez
où sur le chemin se trouve la cible. Ensuite, vous calculez où sur le chemin la cible serait quelques instants
dans le futur. Branchez ces 2 valeurs dans votre fonction `lookAt` et vous obtiendrez une matrice qui fait
suivre le chemin à votre objet et s'orienter vers le chemin également.

Avant de continuer, vous voudrez peut-être consulter [cette courte note sur la dénomination des matrices](webgl-matrix-naming.html).

Sinon, passons à [l'apprentissage de l'animation](webgl-animation.html).

<div class="webgl_bottombar">
<h3>Standards lookAt</h3>
<p>La plupart des bibliothèques mathématiques 3D ont une fonction <code>lookAt</code>. Elle est souvent conçue
spécifiquement pour créer une "matrice de vue" et non une "matrice de caméra". En d'autres termes,
elle crée une matrice qui déplace tout le reste devant la caméra plutôt
qu'une matrice qui déplace la caméra elle-même.</p>
<p>Je trouve cela moins utile. Comme souligné, une fonction lookAt a de nombreuses utilisations. Il est
facile d'appeler <code>inverse</code> lorsque vous avez besoin d'une matrice de vue mais si vous utilisez <code>lookAt</code>
pour faire suivre la tête d'un personnage à un autre personnage ou faire viser une tourelle
vers sa cible, il est beaucoup plus utile que <code>lookAt</code> renvoie une matrice qui oriente
et positionne un objet dans l'espace monde à mon avis.
</p>
{{{example url="../webgl-3d-camera-look-at-heads.html" }}}
</div>



