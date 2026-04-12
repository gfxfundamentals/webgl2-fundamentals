Title: WebGL2 - Graphe de scène
Description: Ce qu'est un graphe de scène et à quoi il sert
TOC: Graphes de scène


Cet article est la suite des [articles WebGL précédents](webgl-fundamentals.html).
L'article précédent portait sur [dessiner plusieurs choses](webgl-drawing-multiple-things.html).
Si vous ne les avez pas lus, je vous suggère de commencer là.

Je suis sûr qu'un gourou de l'informatique ou un gourou des graphismes va me disputer mais ...
Un graphe de scène est généralement une structure arborescente où chaque nœud dans l'arbre génère
une matrice... hmm, ce n'est pas une définition très utile. Peut-être que quelques exemples seraient
utiles.

La plupart des moteurs 3D utilisent un graphe de scène. Vous y mettez les choses que vous voulez faire apparaître dans le graphe
de scène. Le moteur parcourt ensuite le graphe de scène et détermine une liste de choses à dessiner.
Les graphes de scène sont hiérarchiques, donc par exemple si vous vouliez créer une simulation d'univers,
vous pourriez avoir un graphe qui ressemble à ceci

{{{diagram url="resources/planet-diagram.html" height="500" }}}

À quoi sert un graphe de scène ? La fonctionnalité n°1 d'un graphe de scène est qu'il fournit une relation parent-enfant
pour les matrices comme [nous en avons discuté dans les maths matricielles 2D](webgl-2d-matrices.html).
Donc par exemple dans une simulation d'univers simple (mais irréaliste), les étoiles (enfants) se déplacent avec leur
galaxie (parent). De même, une lune (enfant) se déplace avec sa planète (parent).
Si vous déplacez la Terre, la Lune se déplacera avec elle. Si vous déplacez une galaxie,
toutes les étoiles à l'intérieur se déplaceront avec elle. Faites glisser les noms dans le diagramme ci-dessus
et vous devriez pouvoir voir leurs relations.

Si vous revenez aux [maths matricielles 2D](webgl-2d-matrices.html), vous vous souviendrez peut-être que nous
multiplions beaucoup de matrices pour translater, faire pivoter et mettre à l'échelle des objets. Un
graphe de scène fournit une structure pour aider à décider quelle mathématique matricielle appliquer à un objet.

Typiquement, chaque `Node` dans un graphe de scène représente un *espace local*. Avec les bonnes
maths matricielles, tout ce qui se trouve dans cet *espace local* peut ignorer tout ce qui se trouve au-dessus de lui. Une autre
façon d'énoncer la même chose est que la lune n'a à se préoccuper que d'orbiter autour de la Terre.
Elle n'a pas à se préoccuper d'orbiter autour du Soleil. Sans cette structure de graphe de scène,
vous devriez faire des maths beaucoup plus complexes pour calculer comment faire orbiter la Lune autour du Soleil
car son orbite autour du Soleil ressemble à quelque chose comme ça

{{{diagram url="resources/moon-orbit.html" }}}

Avec un graphe de scène, vous faites simplement de la Lune un enfant de la Terre, puis faites orbiter
la Terre, ce qui est simple. Le graphe de scène prend en charge le fait que la Terre
orbite autour du Soleil. Il le fait en parcourant les nœuds et en multipliant les
matrices au fur et à mesure

    worldMatrix = greatGrandParent * grandParent * parent * self(localMatrix)

En termes concrets, notre simulation d'univers serait

    worldMatrixForMoon = galaxyMatrix * starMatrix * planetMatrix * moonMatrix;

Nous pouvons faire cela très simplement avec une fonction récursive qui fait effectivement

    function computeWorldMatrix(currentNode, parentWorldMatrix) {
        // calculer notre matrice world en multipliant notre matrice locale avec
        // la matrice world de notre parent.
        var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localMatrix);

        // maintenant faire de même pour tous nos enfants
        currentNode.children.forEach(function(child) {
            computeWorldMatrix(child, worldMatrix);
        });
    }

Cela soulève une terminologie assez commune dans les graphes de scène 3D.

*   `localMatrix` : La matrice locale pour le nœud actuel. Elle transforme le nœud et ses enfants dans l'espace local avec
    lui-même à l'origine.

*   `worldMatrix` : Pour un nœud donné, elle prend les choses dans l'espace local de ce nœud
    et les transforme vers l'espace du nœud racine du graphe de scène. En d'autres termes, elle les place
    dans le monde. Si nous calculons la worldMatrix pour la Lune, nous obtiendrons cette orbite bizarre que vous voyez ci-dessus.

Un graphe de scène est assez facile à créer. Définissons un objet `Node` simple.
Il y a une multitude de façons d'organiser un graphe de scène et je ne suis pas sûr de quelle
façon est la meilleure. La plus courante est d'avoir un champ optionnel pour la chose à dessiner

    var node = {
       localMatrix: ...,  // la matrice "locale" pour ce nœud
       worldMatrix: ...,  // la matrice "world" pour ce nœud
       children: [],      // tableau d'enfants
       thingToDraw: ??,   // chose à dessiner à ce nœud
    };

Créons un graphe de scène de système solaire. Je ne vais pas utiliser de textures sophistiquées ou
quoi que ce soit de tel car cela encombrerait l'exemple. D'abord, créons quelques fonctions
pour aider à gérer les nœuds. D'abord, créons une classe de nœud

    var Node = function() {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    };

Donnons-lui un moyen de définir le parent d'un nœud.

    Node.prototype.setParent = function(parent) {
      // nous retirer de notre parent
      if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }

      // Nous ajouter à notre nouveau parent
      if (parent) {
        parent.children.push(this);
      }
      this.parent = parent;
    };

Et voici le code pour calculer les matrices world à partir des matrices locales basées sur leurs relations
parent-enfant. Si nous commençons au parent et visitons récursivement les enfants, nous pouvons calculer
leurs matrices world. Si vous ne comprenez pas les maths matricielles,
[consultez cet article à leur sujet](webgl-2d-matrices.html).

    Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
      if (parentWorldMatrix) {
        // une matrice a été passée, donc faites les maths et
        // stockez le résultat dans `this.worldMatrix`.
        m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
      } else {
        // aucune matrice n'a été passée donc copiez simplement.
        m4.copy(this.localMatrix, this.worldMatrix);
      }

      // maintenant traitez tous les enfants
      var worldMatrix = this.worldMatrix;
      this.children.forEach(function(child) {
        child.updateWorldMatrix(worldMatrix);
      });
    };

Faisons juste le Soleil, la Terre et la Lune pour rester simple. Nous utiliserons bien sûr des
distances fictives pour que les choses tiennent sur l'écran. Nous utiliserons juste un seul modèle de sphère
et la colorierons en jaunâtre pour le Soleil, bleu-verdâtre pour la Terre et grisâtre pour la Lune.
Si `drawInfo`, `bufferInfo`, et `programInfo` ne vous sont pas familiers, [voir l'article précédent](webgl-drawing-multiple-things.html).

    // Créons tous les nœuds
    var sunNode = new Node();
    sunNode.localMatrix = m4.translation(0, 0, 0);  // soleil au centre
    sunNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0, 1], // jaune
        u_colorMult:   [0.4, 0.4, 0, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

    var earthNode = new Node();
    earthNode.localMatrix = m4.translation(100, 0, 0);  // terre à 100 unités du soleil
    earthNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.5, 0.8, 1],  // bleu-vert
        u_colorMult:   [0.8, 0.5, 0.2, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

    var moonNode = new Node();
    moonNode.localMatrix = m4.translation(20, 0, 0);  // lune à 20 unités de la terre
    moonNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0.6, 1],  // gris
        u_colorMult:   [0.1, 0.1, 0.1, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

Maintenant que nous avons créé les nœuds, connectons-les.

    // connecter les objets célestes
    moonNode.setParent(earthNode);
    earthNode.setParent(sunNode);

Nous allons à nouveau créer une liste d'objets et une liste d'objets à dessiner.

    var objects = [
      sunNode,
      earthNode,
      moonNode,
    ];

    var objectsToDraw = [
      sunNode.drawInfo,
      earthNode.drawInfo,
      moonNode.drawInfo,
    ];

Au moment du rendu, nous mettrons à jour la matrice locale de chaque objet en la faisant pivoter légèrement.

    // mettre à jour les matrices locales pour chaque objet.
    m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);

Maintenant que les matrices locales sont mises à jour, nous mettrons à jour toutes les matrices world

    sunNode.updateWorldMatrix();

Finalement, maintenant que nous avons les matrices world, nous devons les multiplier pour obtenir une [matrice
worldViewProjection](webgl-3d-perspective.html) pour chaque objet.

    // Calculer toutes les matrices pour le rendu
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

Le rendu est [la même boucle que nous avons vue dans notre dernier article](webgl-drawing-multiple-things.html).

{{{example url="../webgl-scene-graph-solar-system.html" }}}

Vous remarquerez que toutes les planètes ont la même taille. Essayons de rendre la Terre plus grande

    // terre à 100 unités du soleil
    earthNode.localMatrix = m4.translation(100, 0, 0));

    // rendre la terre deux fois plus grande
    earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);

{{{example url="../webgl-scene-graph-solar-system-larger-earth.html" }}}

Oups. La Lune est devenue plus grande aussi. Pour corriger cela, nous pourrions réduire manuellement la Lune. Une meilleure solution cependant
est d'ajouter plus de nœuds à notre graphe de scène. Au lieu de juste

      soleil
       |
      terre
       |
      lune

Nous allons changer en

     systèmeSolaire
       |    |
       |   soleil
       |
     orbiteTerre
       |    |
       |  terre
       |
      orbiteLune
          |
         lune

Cela permettra à la Terre de tourner autour du systèmeSolaire, mais nous pouvons faire tourner et mettre à l'échelle le Soleil séparément et cela ne
affectera pas la Terre. De même, la Terre peut tourner séparément de la Lune. Créons plus de nœuds pour
`solarSystemNode`, `earthOrbitNode` et `moonOrbitNode`.

    var solarSystemNode = new Node();
    var earthOrbitNode = new Node();

    // orbite terrestre à 100 unités du soleil
    earthOrbitNode.localMatrix = m4.translation(100, 0, 0);
    var moonOrbitNode = new Node();

     // lune à 20 unités de la terre
    moonOrbitNode.localMatrix = m4.translation(20, 0, 0);

Ces distances d'orbite ont été retirées des anciens nœuds

    var earthNode = new Node();
    -// terre à 100 unités du soleil
    -earthNode.localMatrix = m4.translation(100, 0, 0));

    -// rendre la terre deux fois plus grande
    -earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);
    +earthNode.localMatrix = m4.scaling(2, 2, 2);

    var moonNode = new Node();
    -moonNode.localMatrix = m4.translation(20, 0, 0);  // lune à 20 unités de la terre

Les connecter ressemble maintenant à ceci

    // connecter les objets célestes
    sunNode.setParent(solarSystemNode);
    earthOrbitNode.setParent(solarSystemNode);
    earthNode.setParent(earthOrbitNode);
    moonOrbitNode.setParent(earthOrbitNode);
    moonNode.setParent(moonOrbitNode);

Et nous n'avons besoin de mettre à jour que les orbites

    // mettre à jour les matrices locales pour chaque objet.
    -m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);

    // Mettre à jour toutes les matrices world dans le graphe de scène
    -sunNode.updateWorldMatrix();
    +solarSystemNode.updateWorldMatrix();

Et maintenant vous pouvez voir que la Terre est deux fois plus grande, la Lune ne l'est pas.

{{{example url="../webgl-scene-graph-solar-system-larger-earth-fixed.html" }}}

Vous pourriez également remarquer que le Soleil et la Terre ne tournent plus sur place. C'est maintenant indépendant.

Ajustons quelques autres choses.

    -sunNode.localMatrix = m4.translation(0, 0, 0);  // soleil au centre
    +sunNode.localMatrix = m4.scaling(5, 5, 5);

    ...

    *moonOrbitNode.localMatrix = m4.translation(30, 0, 0);

    ...

    +moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);

    ...
    // mettre à jour les matrices locales pour chaque objet.
    m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);
    +// faire tourner le soleil sur lui-même
    +m4.multiply(m4.yRotation(0.005), sunNode.localMatrix, sunNode.localMatrix);
    +// faire tourner la terre sur elle-même
    +m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    +// faire tourner la lune sur elle-même
    +m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

{{{example url="../webgl-scene-graph-solar-system-adjusted.html" }}}

Actuellement, nous avons une `localMatrix` et nous la modifions à chaque frame. Il y a cependant un problème
en ce que chaque frame, nos maths accumuleront une petite erreur. Il existe un moyen de corriger les maths
appelé *ortho normaliser une matrice*, mais même cela ne fonctionnera pas toujours. Par exemple, imaginons
que nous avons mis à l'échelle à zéro et inversé. Faisons cela juste pour une valeur `x`

    x = 246;       // frame #0, x = 246

    scale = 1;
    x = x * scale  // frame #1, x = 246

    scale = 0.5;
    x = x * scale  // frame #2, x = 123

    scale = 0;
    x = x * scale  // frame #3, x = 0

    scale = 0.5;
    x = x * scale  // frame #4, x = 0  OUPS !

    scale = 1;
    x = x * scale  // frame #5, x = 0  OUPS !

Nous avons perdu notre valeur. Nous pouvons corriger cela en ajoutant une autre classe qui met à jour la matrice à partir d'autres valeurs.
Modifions la définition `Node` pour avoir une `source`. Si elle existe, nous
demanderons à la `source` de nous donner une matrice locale.

    *var Node = function(source) {
      this.children = [];
      this.localMatrix = makeIdentity();
      this.worldMatrix = makeIdentity();
    +  this.source = source;
    };

    Node.prototype.updateWorldMatrix = function(matrix) {

    +  var source = this.source;
    +  if (source) {
    +    source.getMatrix(this.localMatrix);
    +  }

      ...

Maintenant, nous pouvons créer une source. Une source courante est celle qui fournit translation, rotation et échelle
quelque chose comme ça

    var TRS = function() {
      this.translation = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.scale = [1, 1, 1];
    };

    TRS.prototype.getMatrix = function(dst) {
      dst = dst || new Float32Array(16);
      var t = this.translation;
      var r = this.rotation;
      var s = this.scale;

      // calculer une matrice à partir de translation, rotation et échelle
      m4.translation(t[0], t[1], t[2], dst);
      m4.xRotate(dst, r[0], dst);
      m4.yRotate(dst, r[1], dst);
      m4.zRotate(dst, r[2], dst);
      m4.scale(dst, s[0], s[1], s[2]), dst);
      return dst;
    };

Et nous pouvons l'utiliser comme ça

    // à l'initialisation, créer un nœud avec une source
    var someTRS  = new TRS();
    var someNode = new Node(someTRS);

    // au moment du rendu
    someTRS.rotation[2] += elapsedTime;

Maintenant, il n'y a pas de problème car nous recréons la matrice à chaque fois.

Vous pensez peut-être, je ne crée pas un système solaire, donc quel est l'intérêt ? Eh bien, si vous vouliez
animer un humain, vous pourriez avoir un graphe de scène qui ressemble à ça

{{{diagram url="resources/person-diagram.html" height="400" }}}

Le nombre d'articulations que vous ajoutez pour les doigts et les orteils dépend de vous. Plus vous avez
d'articulations, plus il faut de puissance de calcul pour calculer les animations et plus il faut de données d'animation pour
fournir des informations pour toutes les articulations. Les vieux jeux comme Virtua Fighter avaient environ 15 articulations.
Les jeux du début à mi des années 2000 en avaient 30 à 70. Si vous faisiez chaque articulation de vos mains,
il y en a au moins 20 dans chaque main donc juste 2 mains représentent 40 articulations. De nombreux jeux qui veulent
animer les mains animent le pouce comme un seul et les 4 doigts comme un grand doigt unique pour économiser
du temps (à la fois CPU/GPU et temps d'artiste) et de la mémoire.

Dans tous les cas, voici un personnage bloc que j'ai bricolé. Il utilise la source `TRS` pour chaque
nœud mentionné ci-dessus. Art de programmeur et animation de programmeur FTW ! 😂

{{{example url="../webgl-scene-graph-block-guy.html" }}}

Si vous regardez presque n'importe quelle bibliothèque 3D, vous trouverez un graphe de scène similaire à celui-ci.
Quant à la construction de hiérarchies, elles sont généralement créées dans une sorte de logiciel de modélisation
ou de logiciel de mise en page de niveau.

<div class="webgl_bottombar">
<h3>SetParent vs AddChild / RemoveChild</h3>
<p>De nombreux graphes de scène ont une fonction <code>node.addChild</code> et une <code>node.removeChild</code>
alors que ci-dessus j'ai créé une fonction <code>node.setParent</code>. Laquelle est meilleure
est sans doute une question de style, mais je dirais qu'une raison objectivement meilleure
pour laquelle <code>setParent</code> est meilleur que <code>addChild</code> est parce qu'il rend ce code
impossible.</p>
<pre class="prettyprint">{{#escapehtml}}
    someParent.addChild(someNode);
    ...
    someOtherParent.addChild(someNode);
{{/escapehtml}}</pre>
<p>Qu'est-ce que cela signifie ? Est-ce que <code>someNode</code> est ajouté à la fois à <code>someParent</code> et à <code>someOtherParent</code> ?
Dans la plupart des graphes de scène, c'est impossible. Est-ce que le deuxième appel génère une erreur ?
<code>ERROR: Already have parent</code>. Est-ce qu'il retire magiquement <code>someNode</code> de <code>someParent</code> avant
de l'ajouter à <code>someOtherParent</code> ? Si c'est le cas, ce n'est certainement pas clair d'après le nom <code>addChild</code>.
</p>
<p><code>setParent</code> en revanche n'a pas ce problème</p>
<pre class="prettyprint">{{#escapehtml}}
    someNode.setParent(someParent);
    ...
    someNode.setParent(someOtherParent);
{{/escapehtml}}</pre>
<p>
C'est 100% évident ce qui se passe dans ce cas. Zéro ambiguïté.
</p>
</div>
