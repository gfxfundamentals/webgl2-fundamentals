Title: WebGL2 Points, Lignes et Triangles
Description: Détails sur le dessin de points, lignes et triangles
TOC: Points, Lignes et Triangles

La grande majorité de ce site dessine tout
avec des triangles. C'est sans conteste ce que
font 99% des programmes WebGL. Mais, pour être complet,
passons en revue quelques autres cas.

Comme mentionné dans [le premier article](webgl-fundamentals.html),
WebGL dessine des points, des lignes et des triangles. Il le fait
quand nous appelons `gl.drawArrays` ou `gl.drawElements`.
Nous fournissons un vertex shader qui retourne des coordonnées en clip space
et ensuite, selon le premier argument
passé à `gl.drawArrays` ou `gl.drawElements`, WebGL va
dessiner des points, des lignes ou des triangles.

Les valeurs valides pour le premier argument de `gl.drawArrays`
et `gl.drawElements` sont

* `POINTS`

   Pour chaque sommet en clip space retourné par le vertex shader, dessine un carré
   centré sur ce point. La taille du carré est
   spécifiée en définissant une variable spéciale `gl_PointSize`
   dans le vertex shader avec la taille souhaitée pour ce carré en pixels.

   Note : La taille maximale (et minimale) que ce carré peut avoir
   dépend de l'implémentation, ce que vous pouvez interroger avec

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

   Voir aussi un autre problème [ici](webgl-drawing-without-data.html#pointsissues).

* `LINES`

   Pour chaque paire de 2 sommets en clip space retournés par le vertex shader,
   dessine une ligne reliant les 2 points. Si nous avions les points A,B,C,D,E,F alors
   nous obtiendrions 3 lignes.

   <div class="webgl_center"><img src="resources/gl-lines.svg" style="width: 400px;"></div>
   
   La spécification indique que nous pouvons régler l'épaisseur de cette ligne
   en appelant `gl.lineWidth` et en spécifiant une épaisseur en pixels.
   En réalité, l'épaisseur maximale
   dépend de l'implémentation et pour la grande majorité
   des implémentations, l'épaisseur maximale est 1.

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

   > Cela est principalement dû au fait que les valeurs > 1 ont été dépréciées
   dans le Desktop OpenGL de base.

* `LINE_STRIP`

   Pour chaque sommet en clip space retourné par le vertex shader,
   dessine une ligne depuis le point précédent retourné par le vertex shader.

   Donc, si vous retournez les sommets A,B,C,D,E,F en clip space, vous obtiendrez 5 lignes.

   <div class="webgl_center"><img src="resources/gl-line-strip.svg" style="width: 400px;"></div>

* `LINE_LOOP`

   C'est la même chose que `LINE_STRIP`, sauf qu'une ligne supplémentaire
   est tracée du dernier point vers le premier point.

   <div class="webgl_center"><img src="resources/gl-line-loop.svg" style="width: 400px;"></div>

* `TRIANGLES`

   Pour chaque groupe de 3 sommets en clip space retournés par le vertex shader,
   dessine un triangle à partir des 3 points. C'est le mode le plus utilisé.

   <div class="webgl_center"><img src="resources/gl-triangles.svg" style="width: 400px;"></div>

* `TRIANGLE_STRIP`

   Pour chaque sommet en clip space retourné par le vertex shader,
   dessine un triangle à partir des 3 derniers sommets. En d'autres termes,
   si vous retournez 6 points A,B,C,D,E,F, alors 4 triangles seront
   dessinés. A,B,C puis B,C,D puis C,D,E puis D,E,F

   <div class="webgl_center"><img src="resources/gl-triangle-strip.svg" style="width: 400px;"></div>

* `TRIANGLE_FAN`

   Pour chaque sommet en clip space retourné par le vertex shader,
   dessine un triangle à partir du premier sommet et des 2 derniers
   sommets. En d'autres termes, si vous retournez 6 points A,B,C,D,E,F,
   alors 4 triangles seront dessinés. A,B,C puis A,C,D puis
   A,D,E et enfin A,E,F

   <div class="webgl_center"><img src="resources/gl-triangle-fan.svg" style="width: 400px;" align="center"></div>

Je suis sûr que d'autres ne seront pas d'accord, mais dans mon expérience,
`TRIANGLE_FAN` et `TRIANGLE_STRIP` sont à éviter.
Ils ne conviennent qu'à quelques cas exceptionnels et le code supplémentaire
nécessaire pour gérer ces cas ne vaut pas la peine par rapport à tout faire
directement avec des triangles. En particulier, vous avez peut-être
des outils pour calculer des normales ou générer des coordonnées de texture
ou faire d'autres choses avec les données de sommets. En vous limitant
à `TRIANGLES`, vos fonctions fonctionneront simplement.
Dès que vous commencez à ajouter `TRIANGLE_FAN` et `TRIANGLE_STRIP`,
vous avez besoin de plus de fonctions pour gérer plus de cas.
Vous êtes libre de ne pas être d'accord et de faire ce que vous voulez.
Je dis simplement que c'est mon expérience et celle de
quelques développeurs de jeux AAA que j'ai interrogés.

De même, `LINE_LOOP` et `LINE_STRIP` ne sont pas très utiles
et ont des problèmes similaires.
Comme `TRIANGLE_FAN` et `TRIANGLE_STRIP`, les situations
pour les utiliser sont rares. Par exemple, vous pourriez penser vouloir
dessiner 4 lignes connectées, chacune composée de 4 points.

<div class="webgl_center"><img src="resources/4-lines-4-points.svg" style="width: 400px;" align="center"></div>

Si vous utilisez `LINE_STRIP`, vous devrez faire 4 appels à `gl.drawArrays`
et plus d'appels pour configurer les attributs de chaque ligne, alors que si vous
utilisez simplement `LINES`, vous pouvez insérer tous les points nécessaires pour dessiner
les 4 ensembles de lignes avec un seul appel à `gl.drawArrays`. Ce sera
beaucoup, beaucoup plus rapide.

De plus, `LINES` peut être très utile pour le débogage ou des effets simples,
mais étant donné leur limite de 1 pixel de largeur sur la plupart des plateformes,
c'est souvent la mauvaise solution. Si vous voulez dessiner une grille pour un graphique ou
afficher les contours de polygones dans un programme de modélisation 3D, utiliser `LINES`
peut être très bien, mais si vous voulez dessiner des graphiques structurés comme
SVG ou Adobe Illustrator, cela ne fonctionnera pas et vous devez
[rendre vos lignes d'une autre façon, généralement à partir de triangles](https://mattdesl.svbtle.com/drawing-lines-is-hard).
