Title: WebGL2 et Alpha
Description: Comment l'alpha dans WebGL diffère de l'alpha dans OpenGL
TOC: WebGL2 et Alpha


J'ai remarqué que certains développeurs OpenGL ont des problèmes avec la façon dont WebGL
traite l'alpha dans le backbuffer (c'est-à-dire le canvas), donc j'ai pensé qu'il
serait bon de passer en revue certaines des différences entre WebGL
et OpenGL liées à l'alpha.

La plus grande différence entre OpenGL et WebGL est qu'OpenGL
rend dans un backbuffer qui n'est pas composité avec quoi que ce soit,
ou effectivement pas composité avec quoi que ce soit par le gestionnaire de fenêtres du système d'exploitation,
donc peu importe votre alpha.

WebGL est composité par le navigateur avec la page web et
la valeur par défaut est d'utiliser l'alpha prémultiplié, comme pour les balises `<img>` .png
avec transparence et les balises canvas 2D.

WebGL a plusieurs façons de rendre ça plus semblable à OpenGL.

### #1) Dire à WebGL que vous voulez qu'il soit composité avec un alpha non prémultiplié

    gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false  // Demander un alpha non prémultiplié
    });

La valeur par défaut est true.

Bien sûr, le résultat sera quand même composité sur la page avec quelle que soit la
couleur de fond qui se retrouve sous le canvas (la couleur de fond du canvas,
la couleur de fond du conteneur du canvas, la couleur de fond de la page,
les éléments derrière le canvas si le canvas a un z-index > 0, etc....)
en d'autres termes, la couleur que CSS définit pour cette zone de la page web.

Une très bonne façon de trouver si vous avez des problèmes d'alpha est de définir l'arrière-plan
du canvas à une couleur vive comme le rouge. Vous verrez immédiatement ce qui se passe.

    <canvas style="background: red;"><canvas>

Vous pourriez aussi le définir à noir ce qui cachera tout problème d'alpha que vous avez.

### #2) Dire à WebGL que vous ne voulez pas d'alpha dans le backbuffer

    gl = canvas.getContext("webgl", { alpha: false }};

Cela le fera agir plus comme OpenGL puisque le backbuffer n'aura que
RGB. C'est probablement la meilleure option car un bon navigateur pourrait voir que
vous n'avez pas d'alpha et optimiser réellement la façon dont WebGL est composité. Bien sûr,
cela signifie aussi qu'il n'y aura pas d'alpha dans le backbuffer, donc si vous utilisez
l'alpha dans le backbuffer à des fins, cela pourrait ne pas fonctionner pour vous.
Peu d'applications que je connaisse utilisent l'alpha dans le backbuffer. Je pense que cela devrait
avoir été la valeur par défaut.

### #3) Effacer l'alpha à la fin de votre rendu

    ..
    renderScene();
    ..
    // Définir l'alpha du backbuffer à 1.0 en
    // définissant la couleur d'effacement à 1
    gl.clearColor(1, 1, 1, 1);

    // Indiquer à WebGL d'affecter uniquement le canal alpha
    gl.colorMask(false, false, false, true);

    // effacer
    gl.clear(gl.COLOR_BUFFER_BIT);

Effacer est généralement très rapide car il y a un cas spécial pour cela dans la plupart des
matériels. J'ai fait ça dans beaucoup de mes premières démos WebGL. Si j'étais intelligent, je passerais à
la méthode #2 ci-dessus. Peut-être que je le ferai juste après avoir publié ceci. Il semble que
la plupart des bibliothèques WebGL devraient utiliser cette méthode par défaut. Les quelques développeurs
qui utilisent vraiment l'alpha pour des effets de composition peuvent le demander. Les
autres obtiendront simplement les meilleures performances et le moins de surprises.

### #4) Effacer l'alpha une fois puis ne plus y rendre

    // Au moment de l'initialisation. Effacer le backbuffer.
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Désactiver le rendu vers l'alpha
    gl.colorMask(true, true, true, false);

Bien sûr, si vous rendez vers vos propres framebuffers, vous pourriez avoir besoin de réactiver
le rendu vers l'alpha, puis de le désactiver à nouveau quand vous repassez à
rendre vers le canvas.

### #5) Gestion des images

Par défaut, si vous chargez des images avec alpha dans WebGL, WebGL
fournira les valeurs telles qu'elles sont dans le fichier avec des valeurs de couleur non
prémultipliées. C'est généralement ce à quoi je suis habitué pour les programmes OpenGL
car c'est sans perte alors que le prémultiplié est avec perte.

    1, 0.5, 0.5, 0  // RGBA

Est une valeur possible non prémultipliée alors qu'en prémultiplié, c'est une
valeur impossible car `a = 0` signifie que `r`, `g`, et `b` doivent
être à zéro.

Lors du chargement d'une image, vous pouvez demander à WebGL de prémultiplier l'alpha si vous le souhaitez.
Vous faites ça en définissant `UNPACK_PREMULTIPLY_ALPHA_WEBGL` à true comme ceci

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

La valeur par défaut est non prémultiplié.

Sachez que la plupart sinon toutes les implémentations Canvas 2D fonctionnent avec
l'alpha prémultiplié. Cela signifie que quand vous les transférez vers WebGL et
que `UNPACK_PREMULTIPLY_ALPHA_WEBGL` est false, WebGL les convertira
de nouveau en non prémultiplié.

### #6) Utiliser une équation de mélange qui fonctionne avec l'alpha prémultiplié.

Presque toutes les applications OpenGL que j'ai écrites ou sur lesquelles j'ai travaillé utilisent

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

Cela fonctionne pour les textures avec alpha non prémultiplié.

Si vous voulez vraiment travailler avec des textures avec alpha prémultiplié, vous
voudrez probablement

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

Ce sont les méthodes dont je suis au courant. Si vous en connaissez d'autres, veuillez les publier ci-dessous.
