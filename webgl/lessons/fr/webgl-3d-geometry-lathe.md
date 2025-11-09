Title: WebGL2 3D Géométrie - Tour
Description: Comment tourner une courbe de Bézier.
TOC: 3D Géométrie - Tour


C'est probablement un sujet un peu obscur mais je l'ai trouvé intéressant, donc je l'écris.
Ce n'est pas quelque chose que je vous recommande de faire réellement. Plutôt, je pense que travailler sur
ce sujet aidera à illustrer certaines choses sur la création de modèles 3D pour WebGL.

Quelqu'un a demandé comment faire une forme de quille de bowling en WebGL. La réponse *intelligente* est
"Utilisez un logiciel de modélisation 3D comme [Blender](https://blender.org),
[Maya](https://www.autodesk.com/products/maya/overview),
[3D Studio Max](https://www.autodesk.com/products/3ds-max/overview),
[Cinema 4D](https://www.maxon.net/en/products/cinema-4d/overview/), etc.
Utilisez-le pour modéliser une quille de bowling, exportez, lisez les données.
([Le format OBJ est relativement simple](https://en.wikipedia.org/wiki/Wavefront_.obj_file)).

Mais, cela m'a fait réfléchir, que faire s'ils voulaient créer un logiciel de modélisation ?

Il y a quelques idées. L'une est de créer un cylindre et d'essayer de le pincer aux
bons endroits en utilisant des ondes sinusoïdales appliquées à certains endroits. Le problème
avec cette idée est que vous n'obtiendriez pas un sommet lisse. Un cylindre standard
est généré comme une série d'anneaux régulièrement espacés mais vous auriez besoin de plus
d'anneaux là où les choses sont plus courbées.

Dans un logiciel de modélisation, vous feriez une quille de bowling en créant une silhouette 2D ou plutôt
une ligne courbe qui correspond au bord d'une silhouette 2D. Vous feriez ensuite
tourner cela en une forme 3D. Par *tourner* je veux dire que vous la feriez pivoter autour
d'un axe et générer des points au fur et à mesure. Cela vous permet de créer facilement
n'importe quel objet rond comme un bol, un verre, une batte de baseball, des bouteilles,
des ampoules, etc.

Alors, comment faire cela ? Eh bien, d'abord nous avons besoin d'un moyen de créer une courbe.
Ensuite, nous aurions besoin de calculer des points sur cette courbe. Nous ferions ensuite pivoter
ces points autour d'un axe en utilisant [les mathématiques de matrices](webgl-2d-matrices.html)
et construire des triangles à partir de ces points.

Le type de courbe le plus courant en infographie semble être
une courbe de Bézier. Si vous avez déjà édité une courbe dans
[Adobe Illustrator](https://www.adobe.com/products/illustrator.html) ou
[Inkscape](https://inkscape.org/en/) ou
[Affinity Designer](https://affinity.serif.com/en-us/designer/)
ou des programmes similaires, c'est une courbe de Bézier.

Une courbe de Bézier ou plutôt une courbe de Bézier cubique est formée par 4 points.
2 points sont les extrémités. 2 points sont les "points de contrôle".

Voici 4 points

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=0" }}}

Nous choisissons un nombre entre 0 et 1 (appelé `t`) où 0 = le début
et 1 = la fin. Nous calculons ensuite le point `t` correspondant
entre chaque paire de points. `P1 P2`, `P2 P3`, `P3 P4`.

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=1" }}}

En d'autres termes, si `t = .25` alors nous calculons un point à 25% du chemin
allant de `P1` à `P2`, un autre à 25% du chemin allant de `P2` à `P3`
et un de plus à 25% du chemin allant de `P3` à `P4`.

Vous pouvez faire glisser le curseur pour ajuster `t` et vous pouvez également déplacer les points
`P1`, `P2`, `P3`, et `P4`.

Nous faisons de même pour les points résultants. Calculer les points `t` entre `Q1 Q2`
et `Q2 Q3`.

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=2" }}}

Finalement nous faisons de même pour ces 2 points et calculons le point `t` entre
`R1 R2`.

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=3" }}}

Les positions de ce <span style="color: red;">point rouge</span> forment une courbe.

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=4" }}}

Donc ceci est une courbe de Bézier cubique.

Notez que bien que l'interpolation entre les points ci-dessus et
le processus de création de 3 points à partir de 4, puis 2 à partir de 3, et finalement 1
point à partir de 2 fonctionne, ce n'est pas la façon normale. Au lieu de cela, quelqu'un a branché
toutes les mathématiques et les a simplifiées en une formule comme celle-ci

<div class="webgl_center">
<pre class="webgl_math">
invT = (1 - t)
P = P1 * invT^3 +
    P2 * 3 * t * invT^2 +
    P3 * 3 * invT * t^2 +
    P4 * t^3
</pre>
</div>

Où `P1`, `P2`, `P3`, `P4` sont les points comme dans les exemples ci-dessus et `P`
est le <span style="color: red;">point rouge</span>.

Dans un programme d'art vectoriel 2D comme Adobe Illustrator
lorsque vous créez une courbe plus longue, elle est en fait composée de nombreuses petites courbes à 4 points
comme celle-ci. Par défaut, la plupart des applications verrouillent les points de contrôle
autour d'un point de début/fin partagé et s'assurent qu'ils sont toujours
opposés par rapport au point partagé.

Voyez cet exemple, déplacez `P3` ou `P5` et le code déplacera l'autre.

{{{diagram url="resources/bezier-curve-edit.html" }}}

Remarquez que la courbe créée par `P1,P2,P3,P4` est une courbe séparée de
celle créée par `P4,P5,P6,P7`. C'est juste que lorsque `P3` et `P5` sont sur des côtés exactement
opposés de `P4`, ensemble ils ressemblent à une courbe continue.
La plupart des applications vous donneront ensuite généralement l'option d'arrêter de les verrouiller
ensemble pour que vous puissiez obtenir un coin vif. Décochez la case de verrouillage
puis faites glisser `P3` ou `P5` et il deviendra encore plus clair qu'elles sont
des courbes séparées.

Ensuite, nous avons besoin d'un moyen de générer des points sur une courbe.
En utilisant la formule ci-dessus, nous pouvons générer un point pour
une valeur `t` donnée comme ceci.

    function getPointOnBezierCurve(points, offset, t) {
      const invT = (1 - t);
      return v2.add(v2.mult(points[offset + 0], invT * invT * invT),
                    v2.mult(points[offset + 1], 3 * t * invT * invT),
                    v2.mult(points[offset + 2], 3 * invT * t * t),
                    v2.mult(points[offset + 3], t * t  *t));
    }

Et nous pouvons générer un ensemble de points pour la courbe comme ceci

    function getPointsOnBezierCurve(points, offset, numPoints) {
      const cpoints = [];
      for (let i = 0; i < numPoints; ++i) {
        const t = i / (numPoints - 1);
        cpoints.push(getPointOnBezierCurve(points, offset, t));
      }
      return cpoints;
    }

Note : `v2.mult` et `v2.add` sont de petites fonctions JavaScript que j'ai incluses
pour aider à faire des mathématiques avec des points.

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=0&showCurve=true&showPoints=true" }}}

Dans le diagramme ci-dessus, vous pouvez choisir un nombre de points. Si la courbe est vive
vous voudriez plus de points. Si la courbe est presque une ligne droite cependant vous voudriez
probablement moins de points. Une solution
est de vérifier à quel point une courbe est courbée. Si elle est trop courbée alors la diviser en
2 courbes.

La partie division s'avère facile. Si nous regardons les différents
niveaux d'interpolation à nouveau, les points `P1`, `Q1`, `R1`, ROUGE forment une
courbe et les points ROUGE, `R2`, `Q3`, `P4` forment l'autre pour n'importe quelle valeur de t.
En d'autres termes, nous pouvons diviser la courbe n'importe où et obtenir 2 courbes
qui correspondent à l'originale.

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=4&show2Curves=true" }}}

La deuxième partie consiste à décider si une courbe doit être divisée ou non. En regardant
autour du net, j'ai trouvé [cette fonction](https://seant23.wordpress.com/2010/11/12/offset-bezier-curves/)
qui pour une courbe donnée décide à quel point elle est plate.

    function flatness(points, offset) {
      const p1 = points[offset + 0];
      const p2 = points[offset + 1];
      const p3 = points[offset + 2];
      const p4 = points[offset + 3];

      let ux = 3 * p2[0] - 2 * p1[0] - p4[0]; ux *= ux;
      let uy = 3 * p2[1] - 2 * p1[1] - p4[1]; uy *= uy;
      let vx = 3 * p3[0] - 2 * p4[0] - p1[0]; vx *= vx;
      let vy = 3 * p3[1] - 2 * p4[1] - p1[1]; vy *= vy;

      if(ux < vx) {
        ux = vx;
      }

      if(uy < vy) {
        uy = vy;
      }

      return ux + uy;
    }

Nous pouvons utiliser cela dans notre fonction qui obtient des points pour une courbe.
D'abord nous vérifierons si la courbe est trop courbée. Si oui nous subdiviserons,
sinon nous ajouterons les points.

    function getPointsOnBezierCurveWithSplitting(points, offset, tolerance, newPoints) {
      const outPoints = newPoints || [];
      if (flatness(points, offset) < tolerance) {

        // ajoute simplement les extrémités de cette courbe
        outPoints.push(points[offset + 0]);
        outPoints.push(points[offset + 3]);

      } else {

        // subdivise
        const t = .5;
        const p1 = points[offset + 0];
        const p2 = points[offset + 1];
        const p3 = points[offset + 2];
        const p4 = points[offset + 3];

        const q1 = v2.lerp(p1, p2, t);
        const q2 = v2.lerp(p2, p3, t);
        const q3 = v2.lerp(p3, p4, t);

        const r1 = v2.lerp(q1, q2, t);
        const r2 = v2.lerp(q2, q3, t);

        const red = v2.lerp(r1, r2, t);

        // fait la 1ère moitié
        getPointsOnBezierCurveWithSplitting([p1, q1, r1, red], 0, tolerance, outPoints);
        // fait la 2ème moitié
        getPointsOnBezierCurveWithSplitting([red, r2, q3, p4], 0, tolerance, outPoints);

      }
      return outPoints;
    }

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=0&showCurve=true&showTolerance=true" }}}

Cet algorithme fait un bon travail pour s'assurer que nous avons suffisamment de points mais
il ne fait pas un si bon travail pour se débarrasser des points inutiles.

Pour cela nous nous tournons vers l'[algorithme de Ramer Douglas Peucker](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)
que j'ai trouvé sur le net.

Dans cet algorithme nous prenons une liste de points.
Nous trouvons le point le plus éloigné de la ligne formée par les 2 extrémités.
Ensuite nous vérifions si ce point est plus éloigné de la ligne qu'une certaine distance.
S'il est inférieur à cette distance nous gardons simplement les 2 extrémités et jetons le reste
Sinon nous exécutons l'algorithme à nouveau, une fois avec les points du début jusqu'au point le plus éloigné
et à nouveau du point le plus éloigné à l'extrémité.

    function simplifyPoints(points, start, end, epsilon, newPoints) {
      const outPoints = newPoints || [];

      // trouve le point le plus distant des extrémités
      const s = points[start];
      const e = points[end - 1];
      let maxDistSq = 0;
      let maxNdx = 1;
      for (let i = start + 1; i < end - 1; ++i) {
        const distSq = v2.distanceToSegmentSq(points[i], s, e);
        if (distSq > maxDistSq) {
          maxDistSq = distSq;
          maxNdx = i;
        }
      }

      // si ce point est trop loin
      if (Math.sqrt(maxDistSq) > epsilon) {

        // divise
        simplifyPoints(points, start, maxNdx + 1, epsilon, outPoints);
        simplifyPoints(points, maxNdx, end, epsilon, outPoints);

      } else {

        // ajoute les 2 extrémités
        outPoints.push(s, e);
      }

      return outPoints;
    }

`v2.distanceToSegmentSq` est une fonction qui calcule le carré de la distance d'un point
à un segment de ligne. Nous utilisons le carré de la distance parce que c'est plus rapide à calculer que
la distance réelle. Puisque nous nous soucions seulement de quel point est le plus éloigné, le carré de la distance
fonctionnera tout aussi bien que la distance réelle.

Voici cela en action. Ajustez la distance pour voir plus de points ajoutés ou supprimés.

{{{diagram url="resources/bezier-curve-diagram.html?maxDepth=0&showCurve=true&showDistance=true" }}}

Revenons à notre quille de bowling. Nous pourrions essayer d'étendre le code ci-dessus en un éditeur complet.
Il devrait pouvoir ajouter et supprimer des points, verrouiller et déverrouiller les points de contrôle.
Il aurait besoin d'annulation, etc... Mais il y a un moyen plus facile. Nous pouvons simplement utiliser n'importe lequel des
principaux éditeurs mentionnés ci-dessus. [J'ai utilisé cet éditeur en ligne](https://svg-edit.github.io/svgedit/).

Voici la silhouette svg d'une quille de bowling que j'ai créée.

<img class="webgl_center" src="resources/bowling-pin-silhouette.svg" width="400" />

Elle est composée de 4 courbes de Bézier. Les données pour ce chemin ressemblent à ceci

    <path fill="none" stroke-width="5" d="
       m44,434
       c18,-33 19,-66 15,-111
       c-4,-45 -37,-104 -39,-132
       c-2,-28 11,-51 16,-81
       c5,-30 3,-63 -36,-63
    "/>

[En interprétant ces données](https://developer.mozilla.org/en/docs/Web/SVG/Tutorial/Paths) nous obtenons ces points.

            ___
    44, 371,   |
    62, 338,   | 1ère courbe
    63, 305,___|__
    59, 260,___|  |
    55, 215,      | 2ème courbe
    22, 156,______|__
    20, 128,______|  |
    18, 100,         | 3ème courbe
    31,  77,_________|__
    36,  47,_________|  |
    41,  17,            | 4ème courbe
    39, -16,            |
     0, -16,____________|

Maintenant que nous avons les données pour les courbes, nous devons calculer certains points
sur elles.

    // obtient des points à travers tous les segments
    function getPointsOnBezierCurves(points, tolerance) {
      const newPoints = [];
      const numSegments = (points.length - 1) / 3;
      for (let i = 0; i < numSegments; ++i) {
        const offset = i * 3;
        getPointsOnBezierCurveWithSplitting(points, offset, tolerance, newPoints);
      }
      return newPoints;
    }

Nous appellerions `simplifyPoints` sur le résultat.

Maintenant nous devons les faire pivoter autour. Nous décidons combien de divisions faire, pour chaque division
vous utilisez les [mathématiques de matrices](webgl-2d-matrices.html) pour faire pivoter les points autour de l'axe Y.
Une fois que nous avons créé tous les points, nous les connectons avec des triangles en utilisant des indices.

    // fait pivoter autour de l'axe Y.
    function lathePoints(points,
                         startAngle,   // angle de départ (c'est-à-dire 0)
                         endAngle,     // angle de fin (c'est-à-dire Math.PI * 2)
                         numDivisions, // combien de quads faire autour
                         capStart,     // true pour fermer le début
                         capEnd) {     // true pour fermer la fin
      const positions = [];
      const texcoords = [];
      const indices = [];

      const vOffset = capStart ? 1 : 0;
      const pointsPerColumn = points.length + vOffset + (capEnd ? 1 : 0);
      const quadsDown = pointsPerColumn - 1;

      // génère les points
      for (let division = 0; division <= numDivisions; ++division) {
        const u = division / numDivisions;
        const angle = lerp(startAngle, endAngle, u) % (Math.PI * 2);
        const mat = m4.yRotation(angle);
        if (capStart) {
          // ajoute un point sur l'axe Y au début
          positions.push(0, points[0][1], 0);
          texcoords.push(u, 0);
        }
        points.forEach((p, ndx) => {
          const tp = m4.transformPoint(mat, [...p, 0]);
          positions.push(tp[0], tp[1], tp[2]);
          const v = (ndx + vOffset) / quadsDown;
          texcoords.push(u, v);
        });
        if (capEnd) {
          // ajoute un point sur l'axe Y à la fin
          positions.push(0, points[points.length - 1][1], 0);
          texcoords.push(u, 1);
        }
      }

      // génère les indices
      for (let division = 0; division < numDivisions; ++division) {
        const column1Offset = division * pointsPerColumn;
        const column2Offset = column1Offset + pointsPerColumn;
        for (let quad = 0; quad < quadsDown; ++quad) {
          indices.push(column1Offset + quad, column2Offset + quad, column1Offset + quad + 1);
          indices.push(column1Offset + quad + 1, column2Offset + quad, column2Offset + quad + 1);
        }
      }

      return {
        position: positions,
        texcoord: texcoords,
        indices: indices,
      };
    }

Le code ci-dessus génère des positions et des coordonnées de texture, il génère ensuite des indices pour créer des triangles
à partir de ceux-ci. `capStart` et `capEnd` spécifient s'il faut générer ou non des points de fermeture. Imaginez
que nous créons une canette. Ces options spécifieraient s'il faut fermer ou non les extrémités.

En utilisant notre [code simplifié](webgl-less-code-more-fun.html) nous pouvons générer des tampons WebGL avec
ces données comme ceci

    const tolerance = 0.15;
    const distance = .4;
    const divisions = 16;
    const startAngle = 0;
    const endAngle = Math.PI * 2;
    const capStart = true;
    const capEnd = true;

    const tempPoints = getPointsOnBezierCurves(curvePoints, tolerance);
    const points = simplifyPoints(tempPoints, 0, tempPoints.length, distance);
    const arrays = lathePoints(points, startAngle, endAngle, divisions, capStart, capEnd);
    const extents = getExtents(arrays.position);
    if (!bufferInfo) {
      bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

Voici un exemple

{{{example url="../webgl-3d-lathe-step-01.html" }}}

Jouez avec les curseurs pour voir comment ils affectent le résultat.

Il y a un problème cependant. Activez les triangles et vous verrez que la texture n'est pas appliquée
uniformément. C'est parce que nous avons basé la coordonnée de texture `v` sur l'indice des
points sur la ligne. S'ils étaient régulièrement espacés, cela pourrait fonctionner. Ils ne le sont pas cependant
donc nous devons faire autre chose.

Nous pouvons parcourir les points et calculer la longueur totale de la courbe et la distance de chaque point
sur cette courbe. Nous pouvons ensuite diviser par la longueur et obtenir une meilleure valeur
pour `v`.

    // fait pivoter autour de l'axe Y.
    function lathePoints(points,
                         startAngle,   // angle de départ (c'est-à-dire 0)
                         endAngle,     // angle de fin (c'est-à-dire Math.PI * 2)
                         numDivisions, // combien de quads faire autour
                         capStart,     // true pour fermer le haut
                         capEnd) {     // true pour fermer le bas
      const positions = [];
      const texcoords = [];
      const indices = [];

      const vOffset = capStart ? 1 : 0;
      const pointsPerColumn = points.length + vOffset + (capEnd ? 1 : 0);
      const quadsDown = pointsPerColumn - 1;

    +  // génère les coordonnées v
    +  let vcoords = [];
    +
    +  // calcule d'abord la longueur des points
    +  let length = 0;
    +  for (let i = 0; i < points.length - 1; ++i) {
    +    vcoords.push(length);
    +    length += v2.distance(points[i], points[i + 1]);
    +  }
    +  vcoords.push(length);  // le dernier point
    +
    +  // divise maintenant chacun par la longueur totale;
    +  vcoords = vcoords.map(v => v / length);

      // génère les points
      for (let division = 0; division <= numDivisions; ++division) {
        const u = division / numDivisions;
        const angle = lerp(startAngle, endAngle, u) % (Math.PI * 2);
        const mat = m4.yRotation(angle);
        if (capStart) {
          // ajoute un point sur l'axe Y au début
          positions.push(0, points[0][1], 0);
          texcoords.push(u, 0);
        }
        points.forEach((p, ndx) => {
          const tp = m4.transformPoint(mat, [...p, 0]);
          positions.push(tp[0], tp[1], tp[2]);
    *      texcoords.push(u, vcoords[ndx]);
        });
        if (capEnd) {
          // ajoute un point sur l'axe Y à la fin
          positions.push(0, points[points.length - 1][1], 0);
          texcoords.push(u, 1);
        }
      }

      // génère les indices
      for (let division = 0; division < numDivisions; ++division) {
        const column1Offset = division * pointsPerColumn;
        const column2Offset = column1Offset + pointsPerColumn;
        for (let quad = 0; quad < quadsDown; ++quad) {
          indices.push(column1Offset + quad, column1Offset + quad + 1, column2Offset + quad);
          indices.push(column1Offset + quad + 1, column2Offset + quad + 1, column2Offset + quad);
        }
      }

      return {
        position: positions,
        texcoord: texcoords,
        indices: indices,
      };
    }

Et voici le résultat

{{{example url="../webgl-3d-lathe-step-02.html" }}}

Ces coordonnées de texture ne sont toujours pas parfaites. Nous n'avons pas décidé quoi faire pour les extrémités.
C'est encore une autre raison pour laquelle vous devriez simplement utiliser un programme de modélisation. Nous pourrions proposer
différentes idées sur comment calculer les coordonnées uv pour les extrémités mais elles ne seraient probablement pas
très utiles. Si vous [cherchez sur Google comment mapper UV un tonneau](https://www.google.com/search?q=uv+map+a+barrel)
vous verrez qu'obtenir des coordonnées UV parfaites n'est pas tant un problème de mathématiques qu'un problème de saisie de données
et vous avez besoin de bons outils pour saisir ces données.

Il y a encore une autre chose que nous devrions faire et c'est d'ajouter des normales.

Nous pourrions calculer une normale pour chaque point sur la courbe. En fait, si vous revenez aux exemples
sur cette page, vous pouvez voir que la ligne formée par `R1` et `R2` est une ligne tangente à la courbe.

<img class="webgl_center" src="resources/tangent-to-curve.png" width="400" />

Une normale est perpendiculaire à la tangente donc il serait facile d'utiliser les tangentes
pour générer des normales.

Mais, imaginons que nous voulions faire un bougeoir avec une silhouette comme celle-ci

<img class="webgl_center" src="resources/candle-holder.svg" width="400" />

Il y a beaucoup de zones lisses mais aussi beaucoup de coins vifs. Comment décider quelles normales
utiliser ? Pire, lorsque nous voulons une arête vive nous avons besoin de sommets supplémentaires. Parce que les sommets
ont à la fois une position et une normale, si nous avons besoin d'une normale différente pour quelque chose à la
même position alors nous avons besoin d'un sommet différent. C'est pourquoi si nous créons un cube
nous avons en fait besoin d'au moins 24 sommets. Même si un cube n'a que 8 coins, chaque
face du cube a besoin de normales différentes à ces coins.

Lors de la génération d'un cube, il est facile de simplement générer les bonnes normales mais pour une
forme plus complexe il n'y a pas de moyen facile de décider.

Tous les programmes de modélisation ont diverses options pour générer des normales. Une façon courante est pour chaque
sommet unique, ils calculent la moyenne des normales de tous les polygones qui partagent ce sommet. Sauf, ils
laissent l'utilisateur choisir un angle maximum. Si l'angle entre un polygone partagé par
un sommet est supérieur à cet angle maximum alors ils génèrent un nouveau sommet.

Faisons cela.

    function generateNormals(arrays, maxAngle) {
      const positions = arrays.position;
      const texcoords = arrays.texcoord;

      // calcule d'abord la normale de chaque face
      let getNextIndex = makeIndiceIterator(arrays);
      const numFaceVerts = getNextIndex.numElements;
      const numVerts = arrays.position.length;
      const numFaces = numFaceVerts / 3;
      const faceNormals = [];

      // Calcule la normale pour chaque face.
      // En faisant cela, crée un nouveau sommet pour chaque sommet de face
      for (let i = 0; i < numFaces; ++i) {
        const n1 = getNextIndex() * 3;
        const n2 = getNextIndex() * 3;
        const n3 = getNextIndex() * 3;

        const v1 = positions.slice(n1, n1 + 3);
        const v2 = positions.slice(n2, n2 + 3);
        const v3 = positions.slice(n3, n3 + 3);

        faceNormals.push(m4.normalize(m4.cross(m4.subtractVectors(v1, v2), m4.subtractVectors(v3, v2))));
      }

      let tempVerts = {};
      let tempVertNdx = 0;

      // cela suppose que les positions de sommets correspondent exactement

      function getVertIndex(x, y, z) {

        const vertId = x + "," + y + "," + z;
        const ndx = tempVerts[vertId];
        if (ndx !== undefined) {
          return ndx;
        }
        const newNdx = tempVertNdx++;
        tempVerts[vertId] = newNdx;
        return newNdx;
      }

      // Nous devons trouver les sommets partagés.
      // Ce n'est pas aussi simple que de regarder les faces (triangles)
      // parce que par exemple si nous avons un cylindre standard
      //
      //
      //      3-4
      //     /   \
      //    2     5   En regardant vers le bas un cylindre commençant à S
      //    |     |   et en allant autour jusqu'à E, E et S ne sont pas
      //    1     6   le même sommet dans les données que nous avons
      //     \   /    car ils ne partagent pas les coordonnées UV.
      //      S/E
      //
      // les sommets au début et à la fin ne partagent pas de sommets
      // car ils ont des UV différentes mais si vous ne les considérez pas
      // comme partageant des sommets ils obtiendront de mauvaises normales

      const vertIndices = [];
      for (let i = 0; i < numVerts; ++i) {
        const offset = i * 3;
        const vert = positions.slice(offset, offset + 3);
        vertIndices.push(getVertIndex(vert));
      }

      // parcourt chaque sommet et enregistre quelles faces il utilise
      const vertFaces = [];
      getNextIndex.reset();
      for (let i = 0; i < numFaces; ++i) {
        for (let j = 0; j < 3; ++j) {
          const ndx = getNextIndex();
          const sharedNdx = vertIndices[ndx];
          let faces = vertFaces[sharedNdx];
          if (!faces) {
            faces = [];
            vertFaces[sharedNdx] = faces;
          }
          faces.push(i);
        }
      }

      // maintenant parcourt chaque face et calcule les normales pour chaque
      // sommet de la face. Inclut seulement les faces qui ne sont pas plus que
      // maxAngle différentes. Ajoute le résultat aux tableaux de newPositions,
      // newTexcoords et newNormals, en écartant tous les sommets qui
      // sont les mêmes.
      tempVerts = {};
      tempVertNdx = 0;
      const newPositions = [];
      const newTexcoords = [];
      const newNormals = [];

      function getNewVertIndex(x, y, z, nx, ny, nz, u, v) {
        const vertId =
            x + "," + y + "," + z + "," +
            nx + "," + ny + "," + nz + "," +
            u + "," + v;

        const ndx = tempVerts[vertId];
        if (ndx !== undefined) {
          return ndx;
        }
        const newNdx = tempVertNdx++;
        tempVerts[vertId] = newNdx;
        newPositions.push(x, y, z);
        newNormals.push(nx, ny, nz);
        newTexcoords.push(u, v);
        return newNdx;
      }

      const newVertIndices = [];
      getNextIndex.reset();
      const maxAngleCos = Math.cos(maxAngle);
      // pour chaque face
      for (let i = 0; i < numFaces; ++i) {
        // obtient la normale pour cette face
        const thisFaceNormal = faceNormals[i];
        // pour chaque sommet de la face
        for (let j = 0; j < 3; ++j) {
          const ndx = getNextIndex();
          const sharedNdx = vertIndices[ndx];
          const faces = vertFaces[sharedNdx];
          const norm = [0, 0, 0];
          faces.forEach(faceNdx => {
            // cette face est-elle orientée de la même manière
            const otherFaceNormal = faceNormals[faceNdx];
            const dot = m4.dot(thisFaceNormal, otherFaceNormal);
            if (dot > maxAngleCos) {
              m4.addVectors(norm, otherFaceNormal, norm);
            }
          });
          m4.normalize(norm, norm);
          const poffset = ndx * 3;
          const toffset = ndx * 2;
          newVertIndices.push(getNewVertIndex(
              positions[poffset + 0], positions[poffset + 1], positions[poffset + 2],
              norm[0], norm[1], norm[2],
              texcoords[toffset + 0], texcoords[toffset + 1]));
        }
      }

      return {
        position: newPositions,
        texcoord: newTexcoords,
        normal: newNormals,
        indices: newVertIndices,
      };

    }

    function makeIndexedIndicesFn(arrays) {
      const indices = arrays.indices;
      let ndx = 0;
      const fn = function() {
        return indices[ndx++];
      };
      fn.reset = function() {
        ndx = 0;
      };
      fn.numElements = indices.length;
      return fn;
    }

    function makeUnindexedIndicesFn(arrays) {
      let ndx = 0;
      const fn = function() {
        return ndx++;
      };
      fn.reset = function() {
        ndx = 0;
      }
      fn.numElements = arrays.positions.length / 3;
      return fn;
    }

    function makeIndiceIterator(arrays) {
      return arrays.indices
          ? makeIndexedIndicesFn(arrays)
          : makeUnindexedIndicesFn(arrays);
    }

Dans le code ci-dessus, nous générons d'abord des normales pour chaque face (chaque triangle) à partir des points originaux.
Nous générons ensuite un ensemble d'indices de sommets pour trouver les points qui sont les mêmes. C'est parce que lorsque nous avons fait pivoter
les points, le premier point et le dernier point devraient correspondre mais ils ont des coordonnées UV différentes
donc ils ne sont pas le même point. Pour calculer les normales de sommets, nous avons besoin qu'ils soient considérés comme le même
point.

Une fois cela fait, pour chaque sommet, nous faisons une liste de toutes les faces qu'il utilise.

Finalement nous faisons la moyenne des normales de toutes les faces que chaque sommet utilise en excluant celles qui sont
plus que `maxAngle` différentes et générons un nouvel ensemble de sommets.

Voici le résultat

{{{example url="../webgl-3d-lathe-step-03.html"}}}

Remarquez que nous obtenons des arêtes vives là où nous les voulons. Augmentez le `maxAngle` et vous verrez ces arêtes
devenir lissées lorsque les faces voisines commencent à être incluses dans les calculs de normales.
Essayez également d'ajuster les `divisions` à quelque chose comme 5 ou 6 puis ajustez le `maxAngle` jusqu'à ce que les
arêtes autour soient dures mais les parties que vous voulez lisses sont encore lisses. Vous pouvez également définir le `mode`
à `lit` pour voir à quoi ressemblerait l'objet avec de l'éclairage, la raison pour laquelle nous avions besoin de normales.

## Alors, qu'avons-nous appris ?

Nous avons appris que si vous voulez créer des données 3D **UTILISEZ UN LOGICIEL DE MODÉLISATION 3D !!!** 😝

Pour faire quoi que ce soit de vraiment utile, vous auriez probablement besoin d'un vrai [éditeur UV](https://www.google.com/search?q=uv+editor).
Gérer les extrémités également est quelque chose qu'un éditeur 3D aiderait. Au lieu d'utiliser
un ensemble limité d'options lors du tournage, vous utiliseriez d'autres fonctionnalités de l'éditeur
pour ajouter des extrémités et générer des UV plus faciles pour les extrémités. Les éditeurs 3D supportent également [l'extrusion de faces](https://www.google.com/search?q=extruding+model)
et [l'extrusion le long d'un chemin](https://www.google.com/search?q=extruding+along+a+path) qui si vous regardez
il devrait être assez évident comment ils fonctionnent en se basant sur l'exemple de tour ci-dessus.

## Références

Je voulais mentionner que je n'aurais pas pu faire cela sans [cette page géniale sur les courbes de bézier](https://pomax.github.io/bezierinfo/).

<div class="webgl_bottombar">
<h3>Que fait cet opérateur modulo ici ?</h3>
<p>Si vous regardez attentivement la fonction <code>lathePoints</code> vous verrez ce modulo
lors du calcul de l'angle.</p>
<pre class="prettyprint showlinemods">
for (let division = 0; division <= numDivisions; ++division) {
  const u = division / numDivisions;
*  const angle = lerp(startAngle, endAngle, u) % (Math.PI * 2);
</pre>
<p>Pourquoi est-il là ?</p>
<p>Lorsque nous faisons pivoter les points tout autour d'un cercle, nous voulons vraiment que le premier
et le dernier points correspondent. <code>Math.sin(0)</code> et <code>Math.sin(Math.PI * 2)</code>
devraient correspondre mais les mathématiques en virgule flottante sur un ordinateur ne sont pas parfaites et bien qu'ils soient assez proches
en général ils ne sont pas réellement égaux à 100%.</p>
<p>Cela importe lorsque nous essayons de calculer les normales. Nous voulons connaître toutes les faces qu'un sommet
utilise. Nous calculons cela en comparant les sommets. Si 2 sommets sont égaux nous supposons qu'ils sont le
même sommet. Malheureusement, parce que <code>Math.sin(0)</code> et <code>Math.sin(Math.PI * 2)</code>
ne sont pas égaux ils ne seront pas considérés comme le même sommet. Cela signifie que lors du calcul des normales
ils ne prendront pas en considération toutes les faces et leurs normales seront incorrectes.</p>
<p>Voici le résultat quand cela arrive</p>
<img class="webgl_center" src="resources/lathe-normal-seam.png" width="400" />
<p>Comme vous pouvez le voir il y a une couture où les sommets ne sont pas considérés comme partagés
parce qu'ils ne correspondent pas à 100%</p>
<p>Ma première pensée a été que je devrais changer ma solution pour que lorsque je vérifie les sommets correspondants
je vérifie s'ils sont à une certaine distance. S'ils le sont alors ils sont le même sommet.
Quelque chose comme ceci.
<pre class="prettyprint">
const epsilon = 0.0001;
const tempVerts = [];
function getVertIndex(position) {
  if (tempVerts.length) {
    // trouve le sommet existant le plus proche
    let closestNdx = 0;
    let closestDistSq = v2.distanceSq(position, tempVerts[0]);
    for (let i = 1; i < tempVerts.length; ++i) {
      let distSq = v2.distanceSq(position, tempVerts[i]);
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestNdx = i;
      }
    }
    // le sommet le plus proche était-il assez proche ?
    if (closestDistSq < epsilon) {
      // oui, donc retourne simplement l'indice de ce sommet.
      return closestNdx;
    }
  }
  // pas de correspondance, ajoute le sommet comme un nouveau sommet et retourne son indice.
  tempVerts.push(position);
  return tempVerts.length - 1;
}
</pre>
<p>Ça a marché ! Ça s'est débarrassé de la couture. Malheureusement ça a pris plusieurs secondes à s'exécuter et
a rendu l'interface inutilisable. C'est parce que c'est une solution en O^2. Si vous faites glisser les curseurs
pour le plus de sommets (distance/divisions) dans l'exemple ci-dessus vous pouvez générer ~114000 sommets.
Pour un O^2 c'est jusqu'à 12 milliards d'itérations qui doivent se produire.
</p>
<p>J'ai cherché sur le net une solution facile. Je n'en ai pas trouvé. J'ai pensé à mettre tous les points
dans un <a href="https://en.wikipedia.org/wiki/Octree">octree</a> pour rendre la recherche de points correspondants
plus rapide mais cela semble être beaucoup trop pour cet article.
</p>
<p>C'est alors que j'ai réalisé que si le seul problème est les points de fin peut-être que je pourrais ajouter un modulo
aux mathématiques pour que les points soient réellement les mêmes. Le code original était comme ceci
</p>
<pre class="prettyprint">
  const angle = lerp(startAngle, endAngle, u);
</pre>
Et le nouveau code comme ceci
<pre class="prettyprint">
  const angle = lerp(startAngle, endAngle, u) % (Math.PI * 2);
</pre>
<p>À cause du modulo l'<code>angle</code> quand <code>endAngle</code> est <code>Math.PI * 2</code> devient 0
et donc il est le même que le début. La couture a disparu. Problème résolu !</p>
<p>Pourtant, même avec le changement si vous définissez <code>distance</code> à 0.001
et <code>divisions</code> à 60 ça prend presque une seconde sur ma machine pour recalculer le maillage. Bien qu'il
puisse y avoir des moyens d'optimiser cela je pense que le point est de réaliser que générer des
maillages complexes est une opération généralement lente. C'est juste un exemple de pourquoi un jeu 3d peut tourner à 60fps
mais un logiciel de modélisation 3D tourne souvent à des fréquences d'images très lentes.
</p>
</div>

<div class="webgl_bottombar">
<h3>Les mathématiques de matrices sont-elles exagérées ici ?</h3>
<p>Lorsque nous tournons les points il y a ce code pour faire pivoter.</p>
<pre class="prettyprint">
const mat = m4.yRotation(angle);
...
points.forEach((p, ndx) => {
  const tp = m4.transformPoint(mat, [...p, 0]);
  ...
</pre>
<p>Transformer un point 3D arbitraire par une matrice 4x4 nécessite 16 multiplications, 12 additions et 3 divisions.
Nous pourrions simplifier en utilisant simplement <a href="webgl-2d-rotation.html">les mathématiques de rotation du cercle unité</a>.
</p>
<pre class="prettyprint">
const s = Math.sin(angle);
const c = Math.cos(angle);
...
points.forEach((p, ndx) => {
  const x = p[0];
  const y = p[1];
  const z = p[2];
  const tp = [
    x * c - z * s,
    y,
    x * s + z * c,
  ];
  ...
</pre>
<p>
C'est seulement 4 multiplications et 2 additions et aucun appel de fonction ce qui est probablement au moins 6x plus rapide.
</p>
<p>
Est-ce que cette optimisation en vaut la peine ? Eh bien, pour cet exemple particulier je ne pense pas que nous en fassions assez
pour que cela importe. Ma pensée était que vous pourriez vouloir laisser l'utilisateur décider autour de quel axe
pivoter. Utiliser une matrice rendrait facile de laisser l'utilisateur passer un axe
et utiliser quelque chose comme
</p>
<pre class="prettyprint">
   const mat = m4.axisRotation(userSuppliedAxis, angle);
</pre>
<p>Quelle méthode est la meilleure dépend vraiment de vous et de vos besoins. Je pense que je choisirais flexible d'abord
et seulement optimiser plus tard si quelque chose était trop lent pour ce que je faisais.</p>
</div>

