Title: WebGL2 Texte - HTML
Description: Comment utiliser HTML pour afficher du texte positionné par rapport à WebGL
TOC: Texte - HTML


Cet article est la suite des articles précédents sur WebGL.
Si vous ne les avez pas lus, je vous suggère [de commencer par là](webgl-3d-perspective.html)
et de revenir ici ensuite.

Une question courante est "comment dessiner du texte dans WebGL". La première chose à se demander
est quel est votre objectif en dessinant le texte. Vous êtes dans un navigateur, le navigateur
affiche du texte. Donc votre première réponse devrait être d'utiliser HTML pour afficher le texte.

Commençons par l'exemple le plus simple : vous voulez juste dessiner du texte par-dessus
votre WebGL. On pourrait appeler ça une superposition de texte. C'est essentiellement du texte qui reste
à la même position.

La façon simple est de créer un ou des éléments HTML et d'utiliser CSS pour les faire se superposer.

Par exemple : d'abord créez un conteneur et mettez à la fois un canvas et du HTML à
superposer à l'intérieur du conteneur.

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <div id="overlay">
        <div>Time: <span id="time"></span></div>
        <div>Angle: <span id="angle"></span></div>
      </div>
    </div>

Ensuite configurez le CSS pour que le canvas et le HTML se superposent

    .container {
        position: relative;
    }
    #overlay {
        position: absolute;
        left: 10px;
        top: 10px;
    }

Maintenant recherchez ces éléments à l'initialisation et créez ou recherchez les zones que vous voulez
modifier.

    // rechercher les éléments à affecter
    var timeElement = document.querySelector("#time");
    var angleElement = document.querySelector("#angle");

    // Créer des nœuds de texte pour économiser du temps au navigateur
    // et éviter les allocations.
    var timeNode = document.createTextNode("");
    var angleNode = document.createTextNode("");

    // Ajouter ces nœuds de texte là où ils doivent aller
    timeElement.appendChild(timeNode);
    angleElement.appendChild(angleNode);

Enfin mettez à jour les nœuds lors du rendu

    function drawScene(time) {
        var now = time * 0.001;  // convertir en secondes

        ...

        // convertir la rotation des radians en degrés
        var angle = radToDeg(rotation[1]);

        // ne rapporter que 0 - 360
        angle = angle % 360;

        // définir les nœuds
        angleNode.nodeValue = angle.toFixed(0);  // pas de décimale
        timeNode.nodeValue = now.toFixed(2);   // 2 décimales

Et voici cet exemple

{{{example url="../webgl-text-html-overlay.html" }}}

Remarquez comment j'ai mis des spans à l'intérieur des divs spécifiquement pour les parties que je voulais modifier. Je fais
l'hypothèse ici que c'est plus rapide que d'utiliser juste les divs sans spans et de dire quelque chose comme

    timeNode.nodeValue = "Time " + now.toFixed(2);

J'utilise aussi des nœuds de texte en appelant `node = document.createTextNode()` et ensuite `node.nodeValue = someMsg`.
Je pourrais aussi utiliser `someElement.innerHTML = someHTML`. Ce serait plus flexible car vous pourriez
insérer des chaînes HTML arbitraires, mais ce serait peut-être légèrement plus lent car le navigateur doit créer
et détruire des nœuds chaque fois que vous le définissez. Lequel est meilleur dépend de vous.

Le point important à retenir de la technique de superposition est que WebGL s'exécute dans un navigateur. Rappelons-nous
d'utiliser les fonctionnalités du navigateur quand c'est approprié. De nombreux programmeurs OpenGL sont habitués à devoir rendre
chaque partie de leur application 100% eux-mêmes depuis zéro, mais parce que WebGL s'exécute dans un navigateur, il possède déjà
des tonnes de fonctionnalités. Utilisez-les. Cela a beaucoup d'avantages. Par exemple, vous pouvez utiliser le style CSS pour
donner facilement à cette superposition un style intéressant.

Par exemple, voici le même exemple mais avec du style ajouté. L'arrière-plan est arrondi, les lettres ont
un halo autour d'elles. Il y a une bordure rouge. Vous obtenez tout ça essentiellement gratuitement en utilisant HTML.

{{{example url="../webgl-text-html-overlay-styled.html" }}}

La prochaine chose la plus courante à vouloir faire est de positionner du texte par rapport à quelque chose que vous rendez.
On peut faire ça en HTML également.

Dans ce cas, nous créerons à nouveau un conteneur avec le canvas et un autre conteneur pour notre HTML mobile

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <div id="divcontainer"></div>
    </div>

Et nous configurerons le CSS

    .container {
        position: relative;
        overflow: none;
    }

    #divcontainer {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 400px;
        height: 300px;
        z-index: 10;
        overflow: hidden;

    }

    .floating-div {
        position: absolute;
    }

La partie `position: absolute;` fait que le `#divcontainer` est positionné en termes absolus par rapport
au premier parent ayant un style `position: relative` ou `position: absolute`. Dans ce cas
c'est le conteneur dans lequel se trouvent le canvas et le `#divcontainer`.

Le `left: 0px; top: 0px` fait que le `#divcontainer` s'aligne avec tout. Le `z-index: 10` le fait
flotter par-dessus le canvas. Et `overflow: hidden` fait que ses enfants sont découpés.

Enfin `.floating-div` sera utilisé pour le div positionnable que nous créons.

Donc maintenant nous devons rechercher le divcontainer, créer un div et l'y ajouter.

    // rechercher le divcontainer
    var divContainerElement = document.querySelector("#divcontainer");

    // créer le div
    var div = document.createElement("div");

    // lui assigner une classe CSS
    div.className = "floating-div";

    // créer un nœud de texte pour son contenu
    var textNode = document.createTextNode("");
    div.appendChild(textNode);

    // l'ajouter au divcontainer
    divContainerElement.appendChild(div);


Maintenant nous pouvons positionner le div en définissant son style.

    div.style.left = Math.floor(x) + "px";
    div.style.top  = Math.floor(y) + "px";
    textNode.nodeValue = now.toFixed(2);

Voici un exemple où nous faisons juste rebondir le div.

{{{example url="../webgl-text-html-bouncing-div.html" }}}

Donc l'étape suivante est de vouloir le placer par rapport à quelque chose dans la scène 3D.
Comment fait-on ça ? On le fait exactement comme on a demandé au GPU de le faire quand on a
[couvert la projection en perspective](webgl-3d-perspective.html).

À travers cet exemple, nous avons appris comment utiliser des matrices, comment les multiplier,
et comment appliquer une matrice de projection pour les convertir en clip space. Nous passons tout
ça à notre shader et il multiplie les sommets dans l'espace local et les convertit
en clip space. On peut faire toutes les maths nous-mêmes en JavaScript également.
Ensuite, on peut multiplier le clip space (-1 à +1) en pixels et utiliser
ça pour positionner le div.

    gl.drawArrays(...);

    // On vient de finir de calculer une matrice pour dessiner notre
    // F en 3D.

    // choisir un point dans l'espace local du 'F'.
    //             X  Y  Z  W
    var point = [100, 0, 0, 1];  // c'est le coin avant supérieur droit

    // calculer une position en clip space
    // en utilisant la matrice qu'on a calculée pour le F
    var clipspace = m4.transformVector(matrix, point);

    // diviser X et Y par W comme le fait le GPU.
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];

    // convertir du clip space en pixels
    var pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
    var pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

    // positionner le div
    div.style.left = Math.floor(pixelX) + "px";
    div.style.top  = Math.floor(pixelY) + "px";
    textNode.nodeValue = now.toFixed(2);

Et voilà, le coin supérieur gauche de notre div est parfaitement aligné
avec le coin avant supérieur droit du F.

{{{example url="../webgl-text-html-div.html" }}}

Bien sûr si vous voulez plus de texte, créez plus de divs.

{{{example url="../webgl-text-html-divs.html" }}}

Vous pouvez regarder le source de ce dernier exemple pour voir les
détails. Un point important est que je suppose simplement que
créer, ajouter et supprimer des éléments HTML du DOM
est lent, donc l'exemple ci-dessus les crée et les garde.
Il cache ceux qui ne sont pas utilisés plutôt que de les supprimer
du DOM. Vous devriez profiler pour savoir si c'est plus rapide.
C'était juste la méthode que j'ai choisie.

J'espère que c'est clair comment utiliser HTML pour le texte. [Ensuite nous
couvrirons l'utilisation de Canvas 2D pour le texte](webgl-text-canvas2d.html).


