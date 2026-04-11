Title: WebGL2 Texte - Canvas 2D
Description: Comment afficher du texte en utilisant un canvas 2D synchronisé avec WebGL
TOC: Texte - Canvas 2D


Cet article est la suite des [articles WebGL précédents sur le dessin de texte](webgl-text-html.html).
Si vous ne les avez pas lus, je vous suggère de commencer par là et de revenir ici ensuite.

Au lieu d'utiliser des éléments HTML pour le texte, on peut aussi utiliser un autre canvas mais avec
un contexte 2D. Sans profilage, c'est juste une supposition que ce serait plus rapide
que d'utiliser le DOM. Bien sûr, c'est aussi moins flexible. Vous n'obtenez pas tous les
styles CSS sophistiqués. Mais il n'y a pas d'éléments HTML à créer et à suivre.

Comme pour les autres exemples, nous créons un conteneur mais cette fois nous mettons
2 canvases dedans.

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <canvas id="text" width="400" height="300"></canvas>
    </div>

Ensuite configurez le CSS pour que le canvas et le HTML se superposent

    .container {
        position: relative;
    }

    #text {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10;
    }

Maintenant recherchez le canvas de texte à l'initialisation et créez un contexte 2D pour lui.

    // rechercher le canvas de texte.
    var textCanvas = document.querySelector("#text");

    // créer un contexte 2D pour lui
    var ctx = textCanvas.getContext("2d");

Lors du dessin, comme pour WebGL, nous devons effacer le canvas 2D à chaque frame.

    function drawScene() {
        ...

        // Effacer le canvas 2D
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

Et ensuite nous appelons juste `fillText` pour dessiner du texte

        ctx.fillText(someMsg, pixelX, pixelY);

Et voici cet exemple

{{{example url="../webgl-text-html-canvas2d.html" }}}

Pourquoi le texte est-il plus petit ? Parce que c'est la taille par défaut pour Canvas 2D.
Si vous voulez d'autres tailles [consultez l'API Canvas 2D](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text).

Une autre raison d'utiliser Canvas 2D est qu'il est facile de dessiner d'autres choses. Par exemple,
ajoutons une flèche

    // dessiner une flèche et du texte.

    // sauvegarder tous les paramètres du canvas
    ctx.save();

    // translater l'origine du canvas pour que 0, 0 soit à
    // l'angle avant supérieur droit de notre F
    ctx.translate(pixelX, pixelY);

    // dessiner une flèche
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.stroke();

    // dessiner le texte.
    ctx.fillText(someMessage, 20, 20);

    // restaurer le canvas à ses anciens paramètres.
    ctx.restore();

Ici nous profitons de la fonction de translation de Canvas 2D pour ne pas avoir à faire de calculs supplémentaires
lors du dessin de notre flèche. On fait semblant de dessiner à l'origine et translate s'occupe
de déplacer cette origine vers le coin de notre F.

{{{example url="../webgl-text-html-canvas2d-arrows.html" }}}

Je pense que cela couvre l'utilisation de Canvas 2D. [Consultez l'API Canvas 2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
pour plus d'idées. [Ensuite, nous rendrons réellement du texte dans WebGL](webgl-text-texture.html).
