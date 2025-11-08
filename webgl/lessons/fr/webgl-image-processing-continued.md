Title: Traitement d'images en WebGL2 - Suite
Description: Comment appliquer plusieurs techniques de traitement d'images en WebGL
TOC: Traitement d'images - Suite


Cet article fait suite à [Traitement d'images en WebGL](webgl-image-processing.html).
Si vous ne l'avez pas encore lu, je vous suggère de [commencer par là](webgl-image-processing.html).

La question la plus évidente pour le traitement d'images est : comment appliquer plusieurs effets ?

Eh bien, vous pourriez essayer de générer des shaders à la volée. Fournir une interface utilisateur qui permet à
l'utilisateur de sélectionner les effets qu'il souhaite utiliser, puis générer un shader qui applique
tous ces effets. Cela n'est pas toujours possible, bien que cette technique
soit souvent utilisée pour [créer des effets pour les graphiques en temps réel](https://www.youtube.com/watch?v=cQUn0Zeh-0Q).

Une manière plus flexible est d'utiliser 2 textures de *travail* supplémentaires et
de faire le rendu sur chaque texture à tour de rôle, en alternant d'avant en arrière
et en appliquant l'effet suivant à chaque fois.

<blockquote><pre>Image originale -&gt; [Flou]            -&gt; Texture 1
Texture 1       -&gt; [Accentuation]    -&gt; Texture 2
Texture 2       -&gt; [Détection bords] -&gt; Texture 1
Texture 1       -&gt; [Flou]            -&gt; Texture 2
Texture 2       -&gt; [Normal]          -&gt; Canvas</pre></blockquote>

Pour ce faire, nous devons créer des framebuffers. En WebGL et OpenGL, Framebuffer
est en réalité un nom mal choisi. Un Framebuffer WebGL/OpenGL est en fait juste une
liste d'attachements et non un buffer d'aucune sorte. Mais, en
attachant une texture à un framebuffer, nous pouvons faire le rendu dans cette texture.

Commençons par transformer [l'ancien code de création de texture](webgl-image-processing.html) en une fonction

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Configure la texture pour qu'on puisse faire le rendu de n'importe quelle taille d'image
    // et pour qu'on travaille avec des pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // Crée une texture et y place l'image.
  var originalImageTexture = createAndSetupTexture(gl);

  // Télécharge l'image dans la texture.
  var mipLevel = 0;               // le plus grand mip
  var internalFormat = gl.RGBA;   // format qu'on veut dans la texture
  var srcFormat = gl.RGBA;        // format des données qu'on fournit
  var srcType = gl.UNSIGNED_BYTE  // type des données qu'on fournit
  gl.texImage2D(gl.TEXTURE_2D,
                mipLevel,
                internalFormat,
                srcFormat,
                srcType,
                image);
```

Et maintenant utilisons cette fonction pour créer 2 textures supplémentaires et les attacher à 2 framebuffers.

```
  // crée 2 textures et les attache aux framebuffers.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // fait en sorte que la texture ait la même taille que l'image
    var mipLevel = 0;               // le plus grand mip
    var internalFormat = gl.RGBA;   // format qu'on veut dans la texture
    var border = 0;                 // doit être 0
    var srcFormat = gl.RGBA;        // format des données qu'on fournit
    var srcType = gl.UNSIGNED_BYTE  // type des données qu'on fournit
    var data = null;                // pas de données = crée une texture vide
    gl.texImage2D(
        gl.TEXTURE_2D, mipLevel, internalFormat, image.width, image.height, border,
        srcFormat, srcType, data);

    // Crée un framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Y attache une texture.
    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }
```

Maintenant créons un ensemble de noyaux et une liste de ceux à appliquer.

```
  // Définit plusieurs noyaux de convolution
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
  };

  // Liste des effets à appliquer.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

Et enfin appliquons chacun d'eux, en alternant la texture sur laquelle nous effectuons le rendu

```
  function drawEffects() {
    // Lui dit d'utiliser notre programme (paire de shaders)
    gl.useProgram(program);

    // Lie l'ensemble attribut/buffer que nous voulons.
    gl.bindVertexArray(vao);

    // commence avec l'image originale sur l'unité 0
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // Dit au shader d'obtenir la texture depuis l'unité de texture 0
    gl.uniform1i(imageLocation, 0);

    // ne fait pas de retournement Y des images lors du dessin vers les textures
    gl.uniform1f(flipYLocation, 1);

    // parcourt chaque effet qu'on veut appliquer.
    var count = 0;
    for (var ii = 0; ii < tbody.rows.length; ++ii) {
      var checkbox = tbody.rows[ii].firstChild.firstChild;
      if (checkbox.checked) {
        // Configure pour dessiner dans l'un des framebuffers.
        setFramebuffer(framebuffers[count % 2], image.width, image.height);

        drawWithKernel(checkbox.value);

        // pour le prochain dessin, utilise la texture sur laquelle on vient de faire le rendu.
        gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

        // incrémente count pour qu'on utilise l'autre texture la prochaine fois.
        ++count;
      }
    }

    // enfin dessine le résultat sur le canvas.
    gl.uniform1f(flipYLocation, -1);  // besoin de retourner Y pour le canvas

    setFramebuffer(null, gl.canvas.width, gl.canvas.height);

    drawWithKernel("normal");
  }

  function setFramebuffer(fbo, width, height) {
    // fait de celui-ci le framebuffer sur lequel on effectue le rendu.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Dit au shader la résolution du framebuffer.
    gl.uniform2f(resolutionLocation, width, height);

    // Dit à WebGL comment convertir de l'espace de clip en pixels
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // définit le noyau et son poids
    gl.uniform1fv(kernelLocation, kernels[name]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

    // Dessine le rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Voici une version fonctionnelle avec une interface utilisateur un peu plus flexible. Cochez les effets
pour les activer. Faites glisser les effets pour réorganiser l'ordre dans lequel ils sont appliqués.

{{{example url="../webgl-2d-image-processing.html" }}}

Quelques points que je devrais aborder.

Appeler `gl.bindFramebuffer` avec `null` dit à WebGL que vous voulez effectuer le rendu
sur le canvas au lieu de sur l'un de vos framebuffers.

De plus, les framebuffers peuvent fonctionner ou non selon les attachements que vous
leur ajoutez. Il existe une liste des types et combinaisons d'attachements
qui sont censés toujours fonctionner. Celui utilisé ici, une texture `RGBA`/`UNSIGNED_BYTE`
assignée au point d'attachement `COLOR_ATTACHMENT0`, est censé toujours fonctionner.
Des formats de texture plus exotiques et/ou des combinaisons d'attachements pourraient ne pas fonctionner.
Dans ce cas, vous êtes censé lier le framebuffer puis appeler
`gl.checkFramebufferStatus` et voir s'il renvoie `gl.FRAMEBUFFER_COMPLETE`.
Si c'est le cas, vous êtes prêt. Sinon, vous devrez dire à l'utilisateur de se rabattre
sur autre chose. Heureusement, WebGL2 prend en charge de nombreux formats et combinaisons.

WebGL doit convertir de l'[espace de clip](webgl-fundamentals.html) en pixels.
Il le fait en se basant sur les paramètres de `gl.viewport`. Comme les framebuffers
sur lesquels nous effectuons le rendu ont une taille différente de celle du canvas, nous devons définir le
viewport de manière appropriée selon que nous effectuons le rendu sur une texture ou sur le canvas.

Enfin, dans l'[exemple original](webgl-fundamentals.html), nous avons retourné la coordonnée Y
lors du rendu car WebGL affiche le canvas avec 0,0 étant le
coin inférieur gauche au lieu du coin supérieur gauche plus traditionnel pour la 2D. Ce n'est pas
nécessaire lors du rendu sur un framebuffer. Comme le framebuffer n'est jamais
affiché, la partie qui est en haut et en bas est sans importance. Tout ce qui compte, c'est
que le pixel 0,0 dans le framebuffer corresponde à 0,0 dans nos calculs.
Pour gérer cela, j'ai rendu possible la définition du retournement ou non en
ajoutant une entrée uniform supplémentaire dans le shader appelée `u_flipY`.

```
...
+uniform float u_flipY;
...

void main() {
  ...
+   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
  ...
}
```

Et ensuite nous pouvons le définir lors du rendu avec

```
  ...
+  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

+  // ne retourne pas
+  gl.uniform1f(flipYLocation, 1);

  ...

+  // retourne
+  gl.uniform1f(flipYLocation, -1);
```

J'ai gardé cet exemple simple en utilisant un seul programme GLSL qui peut réaliser
plusieurs effets. Si vous vouliez faire du traitement d'images complet, vous auriez probablement
besoin de nombreux programmes GLSL. Un programme pour l'ajustement de la teinte, de la saturation et de la luminance.
Un autre pour la luminosité et le contraste. Un pour inverser, un autre pour ajuster
les niveaux, etc. Vous devriez modifier le code pour changer de programmes GLSL et mettre à jour
les paramètres pour ce programme particulier. J'avais envisagé d'écrire cet exemple
mais c'est un exercice qu'il vaut mieux laisser au lecteur car plusieurs programmes GLSL chacun
avec ses propres besoins en paramètres signifie probablement une refonte majeure pour éviter que tout
ne devienne un grand plat de spaghettis.

J'espère que cet exemple et les précédents ont rendu WebGL un peu plus
accessible et j'espère que commencer par la 2D aide à rendre WebGL un peu plus facile à
comprendre. Si j'en trouve le temps, j'essaierai d'écrire [quelques articles supplémentaires](webgl-2d-translation.html)
sur comment faire de la 3D ainsi que plus de détails sur [ce que WebGL fait réellement sous le capot](webgl-how-it-works.html).
Pour la prochaine étape, envisagez d'apprendre [comment utiliser 2 textures ou plus](webgl-2-textures.html).


