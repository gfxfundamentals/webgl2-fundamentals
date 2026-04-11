Title: WebGL2 Sommets indexés
Description: Comment utiliser gl.drawElements
TOC: Sommets indexés (gl.drawElements)

Cet article suppose que vous avez au moins lu
[l'article sur les bases](webgl-fundamentals.html). Si
vous ne l'avez pas encore lu, vous devriez probablement commencer par là.

C'est un court article pour couvrir `gl.drawElements`. Il existe 2
fonctions de dessin de base dans WebGL : `gl.drawArrays` et `gl.drawElements`.
La plupart des articles sur ce site qui appellent explicitement l'une ou l'autre
appellent `gl.drawArrays` car c'est la plus directe.

`gl.drawElements` en revanche utilise un buffer rempli d'
indices de sommets et dessine en se basant sur eux.

Prenons l'exemple qui dessine des rectangles depuis
[le premier article](webgl-fundamentals.html) et faisons-le utiliser
`gl.drawElements`

Dans ce code, nous avons créé un rectangle à partir de 2 triangles, 3 sommets
chacun pour un total de 6 sommets.

Voici notre code qui fournissait 6 positions de sommets

```js
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,   // sommet 0
     x2, y1,   // sommet 1
     x1, y2,   // sommet 2
     x1, y2,   // sommet 3
     x2, y1,   // sommet 4
     x2, y2,   // sommet 5
  ]), gl.STATIC_DRAW);
```

Nous pouvons à la place utiliser des données pour 4 sommets

```js
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,  // sommet 0
     x2, y1,  // sommet 1
     x1, y2,  // sommet 2
     x2, y2,  // sommet 3
  ]), gl.STATIC_DRAW);
```

Mais ensuite, nous devons ajouter un autre buffer avec des indices car WebGL nécessite toujours
que pour dessiner 2 triangles, nous devions lui dire de dessiner 6 sommets au total.

Pour ce faire, nous créons un autre buffer mais nous utilisons un point de liaison différent.
Au lieu du point de liaison `ARRAY_BUFFER`, nous utilisons le point de liaison `ELEMENT_ARRAY_BUFFER`
qui est toujours utilisé pour les indices.

```js
// créer le buffer
const indexBuffer = gl.createBuffer();

// faire de ce buffer le 'ELEMENT_ARRAY_BUFFER' courant
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

// Remplir le element array buffer courant avec des données
const indices = [
  0, 1, 2,   // premier triangle
  2, 1, 3,   // deuxième triangle
];
gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
);
```

Comme toutes les données dans WebGL, nous avons besoin d'une représentation spécifique pour les
indices. Nous convertissons les indices en entiers non signés de 16 bits avec
`new Uint16Array(indices)` puis nous les téléversons dans le buffer.

Il est important de noter que contrairement au point de liaison `ARRAY_BUFFER`
qui est un état global, le point de liaison `ELEMENT_ARRAY_BUFFER`
fait partie du vertex array courant.

Dans le code, nous avons créé et lié un vertex array, puis configuré
le buffer d'indices. Cela signifie que, comme les attributs, chaque fois que nous
lions ce vertex array, le buffer d'indices sera également lié.
Voir [l'article sur les attributs](webgl-attributes.html) pour plus d'informations.

Au moment du dessin, nous appelons `drawElements`

```js
// Dessiner le rectangle.
var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 6;
-gl.drawArrays(primitiveType, offset, count);
+var indexType = gl.UNSIGNED_SHORT;
+gl.drawElements(primitiveType, count, indexType, offset);
```

Nous obtenons les mêmes résultats qu'avant mais nous n'avons fourni des données que pour 4
sommets au lieu de 6. Nous avons quand même demandé à WebGL de dessiner 6 sommets, mais cela nous a permis
de réutiliser des données pour 4 sommets grâce aux indices.

{{{example url="../webgl-2d-rectangles-indexed.html"}}}

Le choix d'utiliser des données indexées ou non indexées vous appartient.

Il est important de noter que les sommets indexés ne vous permettront généralement pas de créer un cube
avec 8 positions de sommets car en général vous voulez associer d'autres données à
chaque sommet, des données différentes selon quelle face utilise cette position de sommet.
Par exemple, si vous vouliez donner à chaque face du cube une couleur différente, vous devriez
fournir cette couleur avec la position. Donc, même si la même position est utilisée 3 fois,
une fois pour chaque face qu'un sommet touche, vous devriez quand même répéter la position,
une fois pour chaque face différente, chacune avec une couleur associée différente. Cela signifierait
que vous auriez besoin de 24 sommets pour un cube, 4 pour chaque côté, puis 36 indices pour dessiner
les 12 triangles nécessaires.

Les types valides pour `indexType` ci-dessus sont `gl.UNSIGNED_BYTE`
où vous ne pouvez avoir que des indices de 0 à 255, auquel cas vous utiliseriez `new Uint8Array(indices)`,
`gl.UNSIGNED_SHORT` où l'index maximum est 65535 que nous avons utilisé ci-dessus,
et `gl.UNSIGNED_INT` qui a un index maximum de 4294967296 et où vous utiliseriez
`new Uint32Array(indices)`.
