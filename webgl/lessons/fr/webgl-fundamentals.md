Title: WebGL2 - Les bases
Description: Votre première leçon WebGL2 en commençant par les fondamentaux
TOC: Les bases


Avant tout, ces articles parlent de WebGL2. Si vous êtes intéressé par WebGL 1.0,
[rendez-vous ici](https://webglfundamentals.org). Notez que WebGL2 est [presque 100% rétrocompatible
avec WebGL 1](webgl1-to-webgl2.html). Cela dit, une fois que vous activez
WebGL2, autant l'utiliser comme il a été conçu pour être utilisé. Ces tutoriels suivent
cette voie.

WebGL est souvent considéré comme une API 3D. Les gens pensent « Je vais utiliser WebGL et *comme par magie* j'aurai de la 3D sympa ».
En réalité, WebGL est simplement un moteur de rastérisation. Il dessine des [points, des lignes et des triangles](webgl-points-lines-triangles.html)
à partir du code que vous fournissez. Tout ce que vous voulez faire d'autre avec WebGL dépend de vous :
vous devez écrire du code utilisant des points, des lignes et des triangles pour accomplir votre tâche.

WebGL s'exécute sur le GPU de votre ordinateur. Vous devez donc fournir le code qui s'exécute sur ce GPU.
Vous fournissez ce code sous la forme de paires de fonctions. Ces 2 fonctions sont appelées un vertex shader
et un fragment shader, et chacune est écrite dans un langage fortement typé de style C/C++ appelé
[GLSL](webgl-shaders-and-glsl.html). (GL Shader Language). Associées ensemble, elles forment un *programme*.

Le rôle d'un vertex shader est de calculer les positions des sommets. À partir des positions que la fonction retourne,
WebGL peut ensuite rastériser divers types de primitives, notamment des [points, des lignes ou des triangles](webgl-points-lines-triangles.html).
Lors de la rastérisation de ces primitives, il appelle une deuxième fonction fournie par l'utilisateur appelée fragment shader.
Le rôle du fragment shader est de calculer une couleur pour chaque pixel de la primitive en cours de dessin.

La quasi-totalité de l'API WebGL consiste à [configurer un état](resources/webgl-state-diagram.html) pour que ces paires de fonctions puissent s'exécuter.
Pour chaque chose que vous voulez dessiner, vous configurez un ensemble d'états, puis exécutez une paire de fonctions en appelant
`gl.drawArrays` ou `gl.drawElements` qui exécute vos shaders sur le GPU.

Toutes les données auxquelles ces fonctions doivent accéder doivent être fournies au GPU. Il y a 4 façons
pour un shader de recevoir des données.

1. Attributs, Buffers et Vertex Arrays

   Les buffers sont des tableaux de données binaires que vous envoyez au GPU. En général, ils contiennent
   des positions, des normales, des coordonnées de texture, des couleurs de sommet, etc., mais
   vous êtes libre d'y mettre ce que vous voulez.

   Les attributs servent à spécifier comment
   extraire des données de vos buffers et les fournir à votre vertex shader.
   Par exemple, vous pourriez stocker des positions dans un buffer sous la forme de trois nombres flottants 32 bits
   par position. Vous indiqueriez à un attribut particulier dans quel buffer aller chercher les positions, quel type
   de données extraire (3 nombres flottants 32 bits), quel décalage
   dans le buffer marque le début des positions, et combien d'octets sépare une position de la suivante.

   Les buffers ne sont pas à accès aléatoire. À la place, le vertex shader est exécuté un nombre
   spécifié de fois. À chaque exécution, la valeur suivante de chaque buffer spécifié est extraite
   et assignée à un attribut.

   L'état des attributs — quels buffers utiliser pour chacun et comment en extraire les données —
   est regroupé dans un objet vertex array (VAO).

2. Uniforms

   Les uniforms sont en pratique des variables globales que vous définissez avant d'exécuter votre programme shader.

3. Textures

   Les textures sont des tableaux de données auxquels vous pouvez accéder de façon aléatoire dans votre programme shader.
   Le plus souvent, on y place des données d'image, mais les textures ne sont que des données et peuvent tout aussi
   bien contenir autre chose que des couleurs.

4. Varyings

   Les varyings sont un moyen pour un vertex shader de transmettre des données à un fragment shader. Selon
   ce qui est rendu — points, lignes ou triangles —, les valeurs affectées à un varying
   par le vertex shader seront interpolées lors de l'exécution du fragment shader.

## WebGL Hello World

WebGL ne se soucie que de 2 choses : les coordonnées en espace de découpe (clip space) et les couleurs.
Votre rôle en tant que programmeur WebGL est de fournir ces 2 éléments à WebGL.
Vous fournissez vos 2 « shaders » pour cela. Un vertex shader qui fournit les
coordonnées en clip space, et un fragment shader qui fournit la couleur.

Les coordonnées en clip space vont toujours de -1 à +1, quelle que soit la taille de votre
canvas. Voici un exemple WebGL simple qui montre WebGL dans sa forme la plus basique.

Commençons par un vertex shader

    #version 300 es

    // un attribut est une entrée (in) dans un vertex shader.
    // Il recevra des données d'un buffer
    in vec4 a_position;

    // tous les shaders ont une fonction main
    void main() {

      // gl_Position est une variable spéciale que le vertex shader
      // est chargé de définir
      gl_Position = a_position;
    }

Si la totalité du code était écrite en JavaScript plutôt qu'en GLSL lors de l'exécution,
on pourrait imaginer son utilisation ainsi

    // *** PSEUDO CODE!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
         // copie les 4 prochaines valeurs de positionBuffer vers l'attribut a_position
         const start = offset + i * stride;
         attributes.a_position = positionBuffer.slice(start, start + size);
         runVertexShader();
         ...
         doSomethingWith_gl_Position();
    }

En réalité ce n'est pas aussi simple car `positionBuffer` devrait être converti en données binaires
(voir ci-dessous), et le calcul réel pour extraire les données du buffer
serait un peu différent, mais cela donne une idée de comment un vertex
shader est exécuté.

Nous avons ensuite besoin d'un fragment shader

    #version 300 es

    // les fragment shaders n'ont pas de précision par défaut, nous devons donc
    // en choisir une. highp est un bon choix par défaut. Cela signifie "haute précision"
    precision highp float;

    // nous devons déclarer une sortie pour le fragment shader
    out vec4 outColor;

    void main() {
      // On définit simplement la sortie à une couleur rouge-violacé constante
      outColor = vec4(1, 0, 0.5, 1);
    }

Ci-dessus, nous avons déclaré `outColor` comme sortie de notre fragment shader. Nous lui assignons `1, 0, 0.5, 1`
ce qui correspond à 1 pour le rouge, 0 pour le vert, 0.5 pour le bleu, 1 pour l'alpha. Les couleurs dans WebGL vont de 0 à 1.

Maintenant que nous avons écrit les 2 fonctions shader, commençons avec WebGL

Nous avons d'abord besoin d'un élément HTML canvas

     <canvas id="c"></canvas>

Puis en JavaScript nous pouvons le récupérer

     var canvas = document.querySelector("#c");

Maintenant nous pouvons créer un WebGL2RenderingContext

     var gl = canvas.getContext("webgl2");
     if (!gl) {
        // pas de webgl2 pour vous !
        ...

Nous devons ensuite compiler ces shaders pour les envoyer sur le GPU, il faut donc d'abord les mettre dans des chaînes de caractères.
Vous pouvez créer vos chaînes GLSL de n'importe quelle façon habituelle en JavaScript : par concaténation,
en les téléchargeant via AJAX, en les plaçant dans des balises script non-JavaScript, ou dans ce cas avec
des template strings multilignes.

    var vertexShaderSource = `#version 300 es

    // un attribut est une entrée (in) dans un vertex shader.
    // Il recevra des données d'un buffer
    in vec4 a_position;

    // tous les shaders ont une fonction main
    void main() {

      // gl_Position est une variable spéciale que le vertex shader
      // est chargé de définir
      gl_Position = a_position;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    // les fragment shaders n'ont pas de précision par défaut, nous devons donc
    // en choisir une. highp est un bon choix par défaut. Cela signifie "haute précision"
    precision highp float;

    // nous devons déclarer une sortie pour le fragment shader
    out vec4 outColor;

    void main() {
      // On définit simplement la sortie à une couleur rouge-violacé constante
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

En fait, la plupart des moteurs 3D génèrent des shaders GLSL à la volée en utilisant divers types de templates, concaténations, etc.
Pour les exemples de ce site cependant, aucun n'est assez complexe pour nécessiter de générer du GLSL à l'exécution.

> NOTE : `#version 300 es` **DOIT ÊTRE LA TOUTE PREMIÈRE LIGNE DE VOTRE SHADER**. Aucun commentaire ni
> ligne vide n'est autorisé avant ! `#version 300 es` indique à WebGL2 que vous voulez utiliser le langage
> shader de WebGL2 appelé GLSL ES 3.00. Si vous ne le mettez pas en première ligne, le langage shader
> utilise par défaut le GLSL ES 1.00 de WebGL 1.0, qui présente de nombreuses différences et bien moins de fonctionnalités.

Ensuite, nous avons besoin d'une fonction qui va créer un shader, envoyer la source GLSL et compiler le shader.
Je n'ai pas écrit de commentaires car les noms de fonctions sont suffisamment explicites.

    function createShader(gl, type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }

Nous pouvons maintenant appeler cette fonction pour créer les 2 shaders

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

Nous devons ensuite *lier* ces 2 shaders en un *programme*

    function createProgram(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

Et l'appeler

    var program = createProgram(gl, vertexShader, fragmentShader);

Maintenant que nous avons créé un programme GLSL sur le GPU, nous devons lui fournir des données.
La majorité de l'API WebGL consiste à configurer un état pour fournir des données à nos programmes GLSL.
Dans ce cas, notre seule entrée dans notre programme GLSL est `a_position` qui est un attribut.
La première chose à faire est de récupérer l'emplacement de l'attribut pour le programme
que nous venons de créer

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

La recherche des emplacements d'attributs (et d'uniforms) est quelque chose que vous devriez
faire lors de l'initialisation, pas dans votre boucle de rendu.

Les attributs obtiennent leurs données depuis des buffers, nous devons donc créer un buffer

    var positionBuffer = gl.createBuffer();

WebGL nous permet de manipuler de nombreuses ressources WebGL via des points de liaison globaux.
Vous pouvez considérer les points de liaison comme des variables globales internes à WebGL.
D'abord, vous liez une ressource à un point de liaison. Ensuite, toutes les autres fonctions
font référence à la ressource via le point de liaison. Donc, lions le buffer de positions.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

Maintenant nous pouvons mettre des données dans ce buffer en y faisant référence via le point de liaison

    // trois points 2D
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

Il se passe beaucoup de choses ici. Nous avons d'abord `positions` qui est un
tableau JavaScript. WebGL en revanche a besoin de données fortement typées, donc la partie
`new Float32Array(positions)` crée un nouveau tableau de nombres flottants 32 bits
et copie les valeurs de `positions`. `gl.bufferData` copie ensuite ces données dans
`positionBuffer` sur le GPU. Il utilise le buffer de positions car nous l'avons lié
au point de liaison `ARRAY_BUFFER` ci-dessus.

Le dernier argument, `gl.STATIC_DRAW`, est une indication à WebGL sur la façon dont nous utiliserons les données.
WebGL peut essayer d'utiliser cette indication pour optimiser certaines choses. `gl.STATIC_DRAW` indique à WebGL
que nous n'allons probablement pas changer ces données souvent.

Maintenant que nous avons mis des données dans un buffer, nous devons indiquer à l'attribut comment
en extraire les données. D'abord, nous devons créer un ensemble d'états d'attributs appelé Vertex Array Object.

    var vao = gl.createVertexArray();

Et nous devons en faire le vertex array courant pour que tous nos réglages d'attributs
s'appliquent à cet ensemble d'états d'attributs

    gl.bindVertexArray(vao);

Nous pouvons maintenant configurer les attributs dans le vertex array. Tout d'abord, nous devons activer l'attribut.
Cela indique à WebGL que nous voulons extraire des données d'un buffer. Si nous n'activons pas l'attribut,
il aura une valeur constante.

    gl.enableVertexAttribArray(positionAttributeLocation);

Ensuite, nous devons spécifier comment extraire les données

    var size = 2;          // 2 composantes par itération
    var type = gl.FLOAT;   // les données sont des flottants 32 bits
    var normalize = false; // ne pas normaliser les données
    var stride = 0;        // 0 = avancer de size * sizeof(type) à chaque itération pour obtenir la position suivante
    var offset = 0;        // commencer au début du buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

Une partie cachée de `gl.vertexAttribPointer` est qu'elle lie le `ARRAY_BUFFER` courant
à l'attribut. En d'autres termes, cet attribut est maintenant lié à
`positionBuffer`. Cela signifie que nous sommes libres de lier autre chose au point de liaison `ARRAY_BUFFER`.
L'attribut continuera à utiliser `positionBuffer`.

Notez que du point de vue de notre vertex shader GLSL, l'attribut `a_position` est un `vec4`

    in vec4 a_position;

`vec4` est une valeur à 4 flottants. En JavaScript on pourrait penser à quelque chose comme
`a_position = {x: 0, y: 0, z: 0, w: 0}`. Ci-dessus nous avons mis `size = 2`. Les attributs
ont par défaut `0, 0, 0, 1`, donc cet attribut obtiendra ses 2 premières valeurs (x et y)
depuis notre buffer. z et w seront respectivement les valeurs par défaut 0 et 1.

Avant de dessiner, nous devrions redimensionner le canvas pour correspondre à sa taille d'affichage. Les canvas, comme les images, ont 2 tailles.
Le nombre de pixels qu'ils contiennent réellement et séparément la taille à laquelle ils sont affichés. Le CSS détermine la taille
à laquelle le canvas est affiché. **Vous devriez toujours définir la taille souhaitée d'un canvas avec CSS** car c'est de loin
plus flexible que n'importe quelle autre méthode.

Pour que le nombre de pixels dans le canvas corresponde à la taille à laquelle il est affiché,
[j'utilise une fonction utilitaire dont vous pouvez lire le détail ici](webgl-resizing-the-canvas.html).

Dans presque tous ces exemples, la taille du canvas est de 400x300 pixels si l'exemple est exécuté dans sa propre fenêtre,
mais s'étire pour remplir l'espace disponible s'il est dans une iframe comme sur cette page.
En laissant le CSS déterminer la taille et en ajustant ensuite pour correspondre, nous gérons facilement ces deux cas.

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

Nous devons indiquer à WebGL comment convertir les valeurs de clip space
que nous allons définir pour `gl_Position` en pixels, souvent appelé espace écran.
Pour cela, nous appelons `gl.viewport` en lui passant la taille actuelle du canvas.

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

Cela indique à WebGL que le clip space de -1 à +1 correspond à 0 &lt;-&gt; `gl.canvas.width` pour x et 0 &lt;-&gt; `gl.canvas.height`
pour y.

Nous effaçons le canvas. `0, 0, 0, 0` correspondent respectivement à rouge, vert, bleu, alpha, donc dans ce cas nous rendons le canvas transparent.

    // Effacer le canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

Ensuite, nous devons indiquer à WebGL quel programme shader exécuter.

    // Indiquer d'utiliser notre programme (paire de shaders)
    gl.useProgram(program);

Puis nous devons lui indiquer quel ensemble de buffers utiliser et comment extraire les données de ces buffers
pour les fournir aux attributs

    // Lier l'ensemble attribut/buffer que nous voulons utiliser.
    gl.bindVertexArray(vao);

Après tout ça, nous pouvons enfin demander à WebGL d'exécuter notre programme GLSL.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

Parce que le count est 3, le vertex shader sera exécuté 3 fois. La première fois, `a_position.x` et `a_position.y`
dans l'attribut de notre vertex shader seront définis avec les 2 premières valeurs du positionBuffer.
La 2ème fois, `a_position.xy` sera défini avec les 2 valeurs suivantes. La dernière fois, ce sera
les 2 dernières valeurs.

Parce que nous avons défini `primitiveType` à `gl.TRIANGLES`, chaque fois que notre vertex shader est exécuté 3 fois,
WebGL dessinera un triangle basé sur les 3 valeurs que nous avons assignées à `gl_Position`. Quelle que soit la taille
de notre canvas, ces valeurs sont en coordonnées de clip space qui vont de -1 à 1 dans chaque direction.

Parce que notre vertex shader copie simplement les valeurs de positionBuffer vers `gl_Position`, le
triangle sera dessiné aux coordonnées de clip space

      0, 0,
      0, 0.5,
      0.7, 0,

La conversion du clip space vers l'espace écran, si la taille du canvas
était de 400x300, donnerait quelque chose comme ceci

     clip space      espace écran
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL va maintenant rendre ce triangle. Pour chaque pixel qu'il est sur le point de dessiner, WebGL appellera notre fragment shader.
Notre fragment shader définit simplement `outColor` à `1, 0, 0.5, 1`. Puisque le canvas est un canvas de 8 bits
par canal, cela signifie que WebGL va écrire les valeurs `[255, 0, 127, 255]` dans le canvas.

Voici la version en direct

{{{example url="../webgl-fundamentals.html" }}}

Dans l'exemple ci-dessus, vous pouvez voir que notre vertex shader ne fait rien
d'autre que transmettre directement nos données de position. Puisque les données de position sont
déjà en clip space, il n'y a rien à faire. *Si vous voulez de la 3D, c'est à vous
de fournir des shaders qui convertissent la 3D en clip space car WebGL est uniquement
une API de rastérisation*.

Vous vous demandez peut-être pourquoi le triangle commence au milieu et va vers le coin supérieur droit.
Le clip space sur `x` va de -1 à +1. Cela signifie que 0 est au centre et que les valeurs positives seront
à droite de ce centre.

Quant à pourquoi il est en haut, en clip space -1 est en bas et +1 est en haut. Cela signifie que
0 est au centre et donc les nombres positifs seront au-dessus du centre.

Pour les graphiques 2D, il est probablement préférable de travailler en pixels plutôt qu'en clip space,
alors modifions le shader pour pouvoir fournir la position en pixels et la
convertir en clip space. Voici le nouveau vertex shader

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // convertir la position de pixels vers 0.0 à 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // convertir de 0->1 vers 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // convertir de 0->2 vers -1->+1 (clip space)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

Quelques points à noter sur les modifications. Nous avons changé `a_position` en `vec2` car nous
n'utilisons de toute façon que `x` et `y`. Un `vec2` est similaire à un `vec4` mais n'a que `x` et `y`.

Ensuite, nous avons ajouté un `uniform` appelé `u_resolution`. Pour le définir, nous devons récupérer son emplacement.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

Le reste devrait être clair d'après les commentaires. En définissant `u_resolution` à la résolution
de notre canvas, le shader va maintenant prendre les positions que nous mettons dans `positionBuffer`
en coordonnées de pixels et les convertir en clip space.

Maintenant nous pouvons changer nos valeurs de position du clip space vers des pixels. Cette fois, nous allons dessiner un rectangle
composé de 2 triangles, 3 points chacun.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

Et après avoir défini quel programme utiliser, nous pouvons définir la valeur de l'uniform que nous avons créé.
`gl.useProgram` est comme `gl.bindBuffer` ci-dessus en ce qu'il définit le programme courant. Après cela,
toutes les fonctions `gl.uniformXXX` définissent les uniforms sur le programme courant.

    gl.useProgram(program);

    // Passer la résolution du canvas pour pouvoir convertir
    // les pixels en clip space dans le shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

Et bien sûr pour dessiner 2 triangles, nous devons faire appeler notre vertex shader 6 fois par WebGL,
donc nous devons changer le `count` à `6`.

    // dessiner
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

Et voilà le résultat

Note : Cet exemple et tous les exemples suivants utilisent [`webgl-utils.js`](/webgl/resources/webgl-utils.js)
qui contient des fonctions pour compiler et lier les shaders. Aucune raison d'encombrer les exemples
avec ce code [standard](webgl-boilerplate.html).

{{{example url="../webgl-2d-rectangle.html" }}}

Vous remarquerez peut-être que le rectangle est près du bas de cette zone. WebGL considère le Y positif vers le haut
et le Y négatif vers le bas. En clip space, le coin inférieur gauche est -1,-1. Nous n'avons pas changé de signe,
donc avec nos mathématiques actuelles, 0, 0 devient le coin inférieur gauche.
Pour qu'il corresponde au coin supérieur gauche plus traditionnel utilisé par les API de graphiques 2D,
nous pouvons simplement inverser la coordonnée y du clip space.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

Et maintenant notre rectangle est où nous l'attendions.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Transformons le code qui définit un rectangle en une fonction pour
pouvoir l'appeler avec des rectangles de tailles différentes. Pendant que nous y sommes,
nous rendrons la couleur paramétrable.

D'abord, nous faisons accepter une couleur uniform en entrée au fragment shader.

    #version 300 es

    precision highp float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

Et voici le nouveau code qui dessine 50 rectangles à des positions aléatoires et des couleurs aléatoires.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // dessiner 50 rectangles aléatoires avec des couleurs aléatoires
      for (var ii = 0; ii < 50; ++ii) {
        // Définir un rectangle aléatoire
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Définir une couleur aléatoire.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Dessiner le rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // Retourne un entier aléatoire de 0 à range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Remplit le buffer avec les valeurs qui définissent un rectangle.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) affectera
      // le buffer lié au point de liaison `ARRAY_BUFFER`
      // mais jusqu'ici nous n'avons qu'un seul buffer. Si nous avions plusieurs
      // buffers, nous devrions d'abord lier ce buffer à `ARRAY_BUFFER`.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

Et voilà les rectangles.

{{{example url="../webgl-2d-rectangles.html" }}}

J'espère que vous pouvez voir que WebGL est en réalité une API assez simple.
Bon, « simple » n'est peut-être pas le bon mot. Ce qu'il fait est simple. Il exécute simplement
2 fonctions fournies par l'utilisateur, un vertex shader et un fragment shader, et
dessine des triangles, des lignes ou des points.
Même si faire de la 3D peut devenir plus complexe, cette complexité est
ajoutée par vous, le programmeur, sous la forme de shaders plus élaborés.
L'API WebGL elle-même est juste un rastériseur et est conceptuellement assez simple.

Nous avons couvert un petit exemple qui montre comment fournir des données dans un attribut et 2 uniforms.
Il est courant d'avoir plusieurs attributs et de nombreux uniforms. En haut de cet article,
nous avons également mentionné les *varyings* et les *textures*. Ceux-ci apparaîtront dans les leçons suivantes.

Avant de continuer, je veux mentionner que pour *la plupart* des applications, mettre à jour
les données dans un buffer comme nous l'avons fait dans `setRectangle` n'est pas courant. J'ai utilisé cet
exemple parce que je pensais qu'il était le plus facile à expliquer car il montre les coordonnées de pixels
comme entrée et démontre un peu de mathématiques en GLSL. Ce n'est pas mauvais, il y a
de nombreux cas où c'est la bonne approche, mais vous devriez [continuer à lire pour découvrir
la façon plus courante de positionner, orienter et mettre à l'échelle des choses dans WebGL](webgl-2d-translation.html).

Si vous êtes totalement nouveau dans WebGL et que vous n'avez aucune idée de ce qu'est GLSL, ou les shaders, ou ce que fait le GPU,
consultez [les bases du fonctionnement réel de WebGL](webgl-how-it-works.html).
Vous pourriez également vouloir jeter un œil à ce
[diagramme d'état interactif](/webgl/lessons/resources/webgl-state-diagram.html)
pour une autre façon de comprendre comment WebGL fonctionne.

Vous devriez également, au moins brièvement, lire [le code standard utilisé ici](webgl-boilerplate.html)
qui est utilisé dans la plupart des exemples. Vous devriez également au moins parcourir
[comment dessiner plusieurs choses](webgl-drawing-multiple-things.html) pour avoir une idée
de comment les applications WebGL typiques sont structurées, car malheureusement presque tous les exemples
ne dessinent qu'une seule chose et ne montrent donc pas cette structure.

Sinon, à partir d'ici vous pouvez aller dans 2 directions. Si vous êtes intéressé par le traitement d'images,
je vous montrerai [comment faire du traitement d'images 2D](webgl-image-processing.html).
Si vous êtes intéressé par l'apprentissage de la translation,
de la rotation et de la mise à l'échelle, [commencez ici](webgl-2d-translation.html).
