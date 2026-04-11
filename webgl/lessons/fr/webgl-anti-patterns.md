Title: WebGL2 Anti-Patterns
Description: Ce qu'il ne faut pas faire en WebGL, pourquoi ne pas le faire, et quoi faire à la place
TOC: Anti-Patterns


Voici une liste d'anti-patterns pour WebGL. Les anti-patterns sont des choses que vous devriez éviter de faire.

1.  <a id="viewportwidth"></a>Mettre `viewportWidth` et `viewportHeight` sur le `WebGLRenderingContext`

    Certains codes ajoutent des propriétés pour leur largeur et hauteur de viewport
    et les collent sur le `WebGLRenderingContext` comme ceci

        gl = canvas.getContext("webgl2");
        gl.viewportWidth = canvas.width;    // MAUVAIS!!!
        gl.viewportHeight = canvas.height;  // MAUVAIS!!!

    Puis plus tard ils pourraient faire quelque chose comme ça

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    **Pourquoi c'est mauvais :**

    C'est objectivement mauvais parce que vous avez maintenant 2 propriétés qui doivent être mises à jour
    à chaque fois que vous changez la taille du canvas. Par exemple, si vous changez la taille
    du canvas quand l'utilisateur redimensionne la fenêtre, `gl.viewportWidth` et `gl.viewportHeight`
    seront incorrects sauf si vous les redéfinissez.

    C'est subjectivement mauvais car tout nouveau programmeur WebGL jettera un œil à votre code
    et pensera probablement que `gl.viewportWidth` et `gl.viewportHeight` font partie de la
    spécification WebGL, les confondant pendant des mois.

    **Que faire à la place :**

    Pourquoi se créer plus de travail ? Le contexte WebGL a son canvas disponible
    et celui-ci a une taille.

    <pre class="prettyprint">
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    </pre>

    Le contexte a aussi sa largeur et sa hauteur directement dessus.

        // Quand vous avez besoin de définir le viewport pour correspondre à la taille du
        // drawingBuffer du canvas, ceci sera toujours correct
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    C'est encore mieux car ça gérera les cas extrêmes alors qu'utiliser `gl.canvas.width`
    et `gl.canvas.height` ne le fera pas. [Pour savoir pourquoi, voir ici](#drawingbuffer).

2.  <a id="canvaswidth"></a>Utiliser `canvas.width` et `canvas.height` pour le ratio d'aspect

    Souvent, le code utilise `canvas.width` et `canvas.height` pour le ratio d'aspect comme ça

        var aspect = canvas.width / canvas.height;
        perspective(fieldOfView, aspect, zNear, zFar);

    **Pourquoi c'est mauvais :**

    La largeur et la hauteur du canvas n'ont rien à voir avec la taille à laquelle le canvas est
    affiché. CSS contrôle la taille à laquelle le canvas est affiché.

    **Que faire à la place :**

    Utilisez `canvas.clientWidth` et `canvas.clientHeight`. Ces valeurs vous indiquent quelle
    taille votre canvas est réellement affiché à l'écran. En utilisant ces valeurs,
    vous obtiendrez toujours le bon ratio d'aspect quelle que soit vos paramètres CSS.

        var aspect = canvas.clientWidth / canvas.clientHeight;
        perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    Voici des exemples d'un canvas dont les drawingbuffers ont la même taille (`width="400" height="300"`)
    mais en utilisant CSS, nous avons dit au navigateur d'afficher le canvas à une taille différente.
    Remarquez que les deux exemples affichent le 'F' avec le bon ratio d'aspect.

    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="400" height="150" }}}

    Si nous avions utilisé `canvas.width` et `canvas.height`, ce ne serait pas le cas.

    {{{diagram url="../webgl-canvas-width-height.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-width-height.html" width="400" height="150" }}}

3.  <a id="innerwidth"></a>Utiliser `window.innerWidth` et `window.innerHeight` pour calculer quoi que ce soit

    De nombreux programmes WebGL utilisent `window.innerWidth` et `window.innerHeight` dans de nombreux endroits.
    Par exemple :

        canvas.width = window.innerWidth;                    // MAUVAIS!!
        canvas.height = window.innerHeight;                  // MAUVAIS!!

    **Pourquoi c'est mauvais :**

    Ce n'est pas portable. Oui, ça peut fonctionner pour les pages WebGL où vous voulez que le canvas
    remplisse l'écran. Le problème vient quand ce n'est pas le cas. Peut-être décidez-vous de faire un article
    comme ces tutoriels où votre canvas est juste un petit diagramme dans une page plus grande.
    Ou peut-être avez-vous besoin d'un éditeur de propriétés sur le côté ou d'un score pour un jeu. Bien sûr, vous pouvez corriger votre code
    pour gérer ces cas, mais pourquoi ne pas simplement l'écrire pour qu'il fonctionne dans ces cas dès le départ ?
    Alors vous n'aurez pas à modifier le code quand vous le copiez dans un nouveau projet ou utilisez un ancien
    projet d'une nouvelle façon.

    **Que faire à la place :**

    Au lieu de combattre la plateforme Web, utilisez la plateforme Web comme elle a été conçue pour être utilisée.
    Utilisez CSS et `clientWidth` et `clientHeight`.

        var width = gl.canvas.clientWidth;
        var height = gl.canvas.clientHeight;

        gl.canvas.width = width;
        gl.canvas.height = height;

    Voici 9 cas. Ils utilisent tous exactement le même code. Remarquez qu'aucun d'eux
    ne fait référence à `window.innerWidth` ni à `window.innerHeight`.

    <a href="../webgl-same-code-canvas-fullscreen.html" target="_blank">Une page avec rien qu'un canvas utilisant CSS pour le mettre en plein écran</a>

    <a href="../webgl-same-code-canvas-partscreen.html" target="_blank">Une page avec un canvas défini à 70% de largeur pour qu'il y ait de la place pour les contrôles éditeur</a>

    <a href="../webgl-same-code-canvas-embedded.html" target="_blank">Une page avec un canvas intégré dans un paragraphe</a>

    <a href="../webgl-same-code-canvas-embedded-border-box.html" target="_blank">Une page avec un canvas intégré dans un paragraphe en utilisant <code>box-sizing: border-box;</code></a>

    <code>box-sizing: border-box;</code> fait que les bordures et le rembourrage prennent de l'espace à l'élément sur lequel ils sont définis plutôt qu'à l'extérieur. En d'autres termes, dans
    le mode normal box-sizing, un élément de 400x300 pixels avec une bordure de 15 pixels a un espace de contenu de 400x300 pixels entouré d'une bordure de 15 pixels, faisant que sa taille totale est
    430x330 pixels. En mode box-sizing: border-box, la bordure va à l'intérieur de sorte que le même élément resterait à 400x300 pixels, le contenu se retrouverait
    à 370x270. C'est encore une autre raison pour laquelle l'utilisation de `clientWidth` et `clientHeight` est si importante. Si vous définissez la bordure à `1em`, vous n'auriez
    aucun moyen de savoir quelle taille aura votre canvas. Ce serait différent avec différentes polices sur différentes machines ou différents navigateurs.

    <a href="../webgl-same-code-container-fullscreen.html" target="_blank">Une page avec rien qu'un conteneur utilisant CSS pour le mettre en plein écran dans lequel le code insérera un canvas</a>

    <a href="../webgl-same-code-container-partscreen.html" target="_blank">Une page avec un conteneur défini à 70% de largeur pour qu'il y ait de la place pour les contrôles éditeur dans lequel le code insérera un canvas</a>

    <a href="../webgl-same-code-container-embedded.html" target="_blank">Une page avec un conteneur intégré dans un paragraphe dans lequel le code insérera un canvas</a>

    <a href="../webgl-same-code-container-embedded-border-box.html" target="_blank">Une page avec un conteneur intégré dans un paragraphe en utilisant <code>box-sizing: border-box;</code> dans lequel le code insérera un canvas</a>

    <a href="../webgl-same-code-body-only-fullscreen.html" target="_blank">Une page sans éléments avec CSS configuré pour la mettre en plein écran dans lequel le code insérera un canvas</a>

    Encore une fois, l'essentiel est que si vous adoptez le web et écrivez votre code en utilisant les techniques ci-dessus, vous n'aurez pas à changer de code quand vous rencontrerez différents cas d'utilisation.

4.  <a id="resize"></a>Utiliser l'événement `'resize'` pour changer la taille de votre canvas.

    Certaines applications vérifient l'événement `'resize'` de la fenêtre comme ça pour redimensionner leur canvas.

        window.addEventListener('resize', resizeTheCanvas);

    ou cela

        window.onresize = resizeTheCanvas;

    **Pourquoi c'est mauvais :**

    Ce n'est pas mauvais en soi, plutôt, pour *la plupart* des programmes WebGL, ça couvre moins de cas d'utilisation.
    Spécifiquement, `'resize'` ne fonctionne que lorsque la fenêtre est redimensionnée. Il ne fonctionne pas
    si le canvas est redimensionné pour une autre raison. Par exemple, imaginons que vous faites
    un éditeur 3D. Vous avez votre canvas à gauche et vos paramètres à droite. Vous avez
    fait en sorte qu'il y a une barre déplaçable séparant les 2 parties et vous pouvez faire glisser cette barre
    pour agrandir ou réduire la zone des paramètres. Dans ce cas, vous ne recevrez aucun événement `'resize'`.
    De même, si vous avez une page où d'autres contenus sont ajoutés ou supprimés et
    que le canvas change de taille pendant que le navigateur refait la mise en page, vous ne recevrez pas d'événement de redimensionnement.

    **Que faire à la place :**

    Comme pour beaucoup des solutions aux anti-patterns ci-dessus, il y a une façon d'écrire votre code
    pour qu'il fonctionne simplement dans la plupart des cas. Pour les applications WebGL qui dessinent continuellement chaque frame,
    la solution est de vérifier si vous devez redimensionner à chaque fois que vous dessinez comme ça

        function resizeCanvasToDisplaySize() {
          var width = gl.canvas.clientWidth;
          var height = gl.canvas.clientHeight;
          if (gl.canvas.width != width ||
              gl.canvas.height != height) {
             gl.canvas.width = width;
             gl.canvas.height = height;
          }
        }

        function render() {
           resizeCanvasToDisplaySize();
           drawStuff();
           requestAnimationFrame(render);
        }
        render();

    Maintenant dans n'importe lequel de ces cas, votre canvas s'adaptera à la bonne taille. Pas besoin de
    changer de code pour différents cas. Par exemple, en utilisant le même code du #3 ci-dessus,
    voici un éditeur avec une zone d'édition de taille variable.

    {{{example url="../webgl-same-code-resize.html" }}}

    Il n'y aurait pas d'événements de redimensionnement pour ce cas ni pour tout autre où le canvas est redimensionné
    en fonction de la taille d'autres éléments dynamiques sur la page.

    Pour les applications WebGL qui ne redessinent pas chaque frame, le code ci-dessus est toujours correct, vous aurez juste besoin
    de déclencher un redessin dans chaque cas où le canvas peut potentiellement être redimensionné. Une façon facile est d'utiliser un `ResizeObserver`

    <pre class="prettyprint">
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(gl.canvas, {box: 'content-box'});
    </pre>

5.  <a id="properties"></a>Ajouter des propriétés aux `WebGLObject`s

    Les `WebGLObject`s sont les différents types de ressources dans WebGL comme un `WebGLBuffer`
    ou `WebGLTexture`. Certaines applications ajoutent des propriétés à ces objets. Par exemple du code comme ça :

        var buffer = gl.createBuffer();
        buffer.itemSize = 3;        // MAUVAIS!!
        buffer.numComponents = 75;  // MAUVAIS!!

        var program = gl.createProgram();
        ...
        program.u_matrixLoc = gl.getUniformLocation(program, "u_matrix");  // MAUVAIS!!

    **Pourquoi c'est mauvais :**

    La raison pour laquelle c'est mauvais est que WebGL peut "perdre le contexte". Cela peut arriver pour n'importe quelle
    raison, mais la raison la plus courante est que si le navigateur décide que trop de ressources GPU sont utilisées,
    il pourrait intentionnellement perdre le contexte sur certains `WebGLRenderingContext` pour libérer de l'espace.
    Les programmes WebGL qui veulent toujours fonctionner doivent gérer ça. Google Maps le gère par exemple.

    Le problème avec le code ci-dessus est que quand le contexte est perdu, les fonctions de création WebGL comme
    `gl.createBuffer()` ci-dessus retourneront `null`. Cela fait effectivement du code ça

        var buffer = null;
        buffer.itemSize = 3;        // ERREUR!
        buffer.numComponents = 75;  // ERREUR!

    Cela tuera probablement votre application avec une erreur comme

        TypeError: Cannot set property 'itemSize' of null

    Bien que de nombreuses applications ne se soucient pas de mourir quand le contexte est perdu, il semble que ce soit une mauvaise idée
    d'écrire du code qui devra être corrigé plus tard si les développeurs décident un jour de mettre à jour leur
    application pour gérer les événements de perte de contexte.

    **Que faire à la place :**

    Si vous voulez garder les `WebGLObject`s et certaines infos à leur sujet ensemble, une façon serait
    d'utiliser des objets JavaScript. Par exemple :

        var bufferInfo = {
          id: gl.createBuffer(),
          itemSize: 3,
          numComponents: 75,
        };

        var programInfo = {
          id: program,
          u_matrixLoc: gl.getUniformLocation(program, "u_matrix"),
        };

    Personnellement, je suggère [d'utiliser quelques helpers simples qui rendent l'écriture WebGL
    beaucoup plus simple](webgl-less-code-more-fun.html).

Ce sont quelques-uns de ce que je considère comme des Anti-Patterns WebGL dans du code que j'ai vu sur le net.
J'espère avoir montré pourquoi les éviter et avoir donné des solutions faciles et utiles.

<div class="webgl_bottombar"><a id="drawingbuffer"></a><h3>Que sont drawingBufferWidth et drawingBufferHeight ?</h3>
<p>
Les GPU ont une limite sur la taille du rectangle de pixels (texture, renderbuffer) qu'ils peuvent prendre en charge. Souvent cette
taille est la prochaine puissance de 2 supérieure à la résolution d'un moniteur courant au moment où le GPU a été
fabriqué. Par exemple, si le GPU a été conçu pour prendre en charge des écrans 1280x1024, il pourrait avoir une limite de taille de 2048.
S'il a été conçu pour des écrans 2560x1600, il pourrait avoir une limite de 4096.
</p><p>
Ça semble raisonnable mais que se passe-t-il si vous avez plusieurs moniteurs ? Disons que j'ai un GPU avec une limite
de 2048 mais j'ai deux moniteurs 1920x1080. L'utilisateur ouvre une fenêtre de navigateur avec une page WebGL, puis il
étire cette fenêtre sur les deux moniteurs. Votre code essaie de définir le <code>canvas.width</code> à
<code>canvas.clientWidth</code> qui dans ce cas est 3840. Que devrait-il se passer ?
</p>
<p>D'emblée, il n'y a que 3 options</p>
<ol>
<li>
 <p>Lever une exception.</p>
 <p>Ça semble mauvais. La plupart des applications web ne le vérifieront pas et l'application plantera.
 Si l'application contenait des données utilisateur, l'utilisateur vient de perdre ses données</p>
</li>
<li>
 <p>Limiter la taille du canvas à la limite du GPU</p>
 <p>Le problème avec cette solution est qu'elle
 mènera probablement aussi à un plantage ou éventuellement à une page web dérangée car le code s'attend à ce que le canvas soit à la taille
 qu'il a demandée et s'attend à ce que d'autres parties de l'interface et les éléments sur la page soient aux bons endroits.</p>
</li>
<li>
 <p>Laisser le canvas être à la taille demandée par l'utilisateur mais rendre son drawingbuffer à la limite</p>
 <p>C'est la
 solution que WebGL utilise. Si votre code est écrit correctement, la seule chose que l'utilisateur pourrait remarquer est que l'image dans
 le canvas est légèrement mise à l'échelle. Sinon, ça fonctionne simplement. Dans le pire des cas, la plupart des programmes WebGL
 qui ne font pas la bonne chose auront juste un affichage légèrement décalé, mais si l'utilisateur réduit la fenêtre,
 les choses reviendront à la normale.</p>
</li>
</ol>
<p>La plupart des gens n'ont pas plusieurs moniteurs donc ce problème se pose rarement. Ou du moins c'était le cas.
Chrome et Safari, au moins en janvier 2015, avaient une limite codée en dur sur la taille du canvas de 4096. L'iMac 5k d'Apple dépasse cette limite. Beaucoup d'applications WebGL avaient des affichages étranges à cause de ça.
De même, de nombreuses personnes ont commencé à utiliser WebGL avec plusieurs moniteurs pour des travaux d'installation et ont
atteint cette limite.</p>
<p>
Donc, si vous voulez gérer ces cas, utilisez <code>gl.drawingBufferWidth</code> et <code>gl.drawingBufferHeight</code> comme
indiqué dans le #1 ci-dessus. Pour la plupart des applications, si vous suivez les meilleures pratiques ci-dessus, les choses fonctionneront simplement. Sachez
cependant que si vous faites des calculs qui nécessitent de connaître la taille réelle du drawingbuffer, vous devez
en tenir compte. Des exemples qui me viennent à l'esprit : [le picking](webgl-picking.html), c'est-à-dire la conversion des coordonnées
de souris en coordonnées de pixels du canvas. Un autre serait tout type d'effets de post-traitement
qui veulent connaître la taille réelle du drawingbuffer.
</p>
</div>
