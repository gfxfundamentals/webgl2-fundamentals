Title: Implémenter DrawImage en WebGL2
Description: Comment implémenter la fonction drawImage de canvas 2d en WebGL
TOC: 2D - DrawImage


Cet article fait suite à [3D orthographique en WebGL](webgl-3d-orthographic.html).
Si vous ne l'avez pas encore lu, je vous suggère de [commencer par là](webgl-3d-orthographic.html).
Vous devriez également savoir comment fonctionnent les textures et les coordonnées de texture, veuillez lire
[Textures 3D en WebGL](webgl-3d-textures.html).

Pour implémenter la plupart des jeux en 2D, il suffit d'une seule fonction pour dessiner une image. Certes, certains jeux 2D
font des choses sophistiquées avec des lignes, etc., mais si vous n'avez qu'un moyen de dessiner une image 2D sur l'écran,
vous pouvez pratiquement créer la plupart des jeux 2D.

L'API Canvas 2D a une fonction très flexible pour dessiner des images appelée `drawImage`. Elle existe en 3 versions

    ctx.drawImage(image, dstX, dstY);
    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

Compte tenu de tout ce que vous avez appris jusqu'à présent, comment implémenteriez-vous cela en WebGL ? Votre première
solution pourrait être de générer des vertices comme l'ont fait certains des premiers articles de ce site.
Envoyer des vertices au GPU est généralement une opération lente (bien qu'il existe des cas où ce sera plus rapide).

C'est là que tout l'intérêt de WebGL entre en jeu. Il s'agit d'écrire de manière créative
un shader, puis d'utiliser ce shader de manière créative pour résoudre votre problème.

Commençons par la première version

    ctx.drawImage(image, x, y);

Elle dessine une image à la position `x, y` avec la même taille que l'image.
Pour créer une fonction similaire basée sur WebGL, nous pourrions télécharger des vertices pour `x, y`, `x + width, y`, `x, y + height`,
et `x + width, y + height`, puis au fur et à mesure que nous dessinons différentes images à différents endroits,
nous générerions différents ensembles de vertices. En fait, [c'est exactement ce que nous avons fait dans notre premier
article](webgl-fundamentals.html).

Une façon beaucoup plus courante consiste simplement à utiliser un quad unitaire. Nous téléchargeons un seul carré de 1 unité de côté. Nous
utilisons ensuite [les mathématiques matricielles](webgl-2d-matrices.html) pour mettre à l'échelle et translater ce quad unitaire afin qu'il
finisse par être à l'endroit désiré.

Voici le code.

D'abord, nous avons besoin d'un vertex shader simple

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = a_texcoord;
    }

Et un fragment shader simple

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       outColor = texture(texture, v_texcoord);
    }

Et maintenant la fonction

    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
      gl.useProgram(program);

      // Configure les attributs pour le quad
      gl.bindVertexArray(vao);

      var textureUnit = 0;
      // le shader, on met la texture sur l'unité de texture 0
      gl.uniform1i(textureLocation, textureUnit);

      // Lie la texture à l'unité de texture 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // cette matrice convertira des pixels en espace de clip
      var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

      // translate notre quad vers dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // met à l'échelle notre quad de 1 unité
      // de 1 unité à texWidth, texHeight unités
      matrix = m4.scale(matrix, texWidth, texHeight, 1);

      // Définit la matrice.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // dessine le quad (2 triangles, 6 vertices)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

Chargeons quelques images dans des textures

    // crée une info de texture { width: w, height: h, texture: tex }
    // La texture commencera avec des pixels 1x1 et sera mise à jour
    // lorsque l'image sera chargée
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var textureInfo = {
        width: 1,   // on ne connaît pas la taille tant qu'elle n'est pas chargée
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      });

      return textureInfo;
    }

    var textureInfos = [
      loadImageAndCreateTextureInfo('resources/star.jpg'),
      loadImageAndCreateTextureInfo('resources/leaves.jpg'),
      loadImageAndCreateTextureInfo('resources/keyboard.jpg'),
    ];

Et dessinons-les à des endroits aléatoires

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var ii = 0; ii < numToDraw; ++ii) {
      var drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      };
      drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
      drawInfos.forEach(function(drawInfo) {
        drawInfo.x += drawInfo.dx * speed * deltaTime;
        drawInfo.y += drawInfo.dy * speed * deltaTime;
        if (drawInfo.x < 0) {
          drawInfo.dx = 1;
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1;
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1;
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1;
        }
      });
    }

    function draw() {
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);

      // Dit à WebGL comment convertir de l'espace de clip en pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Efface le canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      drawInfos.forEach(function(drawInfo) {
        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          drawInfo.x,
          drawInfo.y);
      });
    }

    var then = 0;
    function render(time) {
      var now = time * 0.001;
      var deltaTime = Math.min(0.1, now - then);
      then = now;

      update(deltaTime);
      draw();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

Vous pouvez voir cela en action ici

{{{example url="../webgl-2d-drawimage-01.html" }}}

Gérer la version 2 de la fonction `drawImage` originale du canvas

    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);

N'est vraiment pas différent. Nous utilisons simplement `dstWidth` et `dstHeight` au lieu de
`texWidth` et `texHeight`.

    *function drawImage(tex, texWidth, texHeight, dstX, dstY, dstWidth, dstHeight) {
    +  if (dstWidth === undefined) {
    +    dstWidth = texWidth;
    +  }
    +
    +  if (dstHeight === undefined) {
    +    dstHeight = texHeight;
    +  }

      gl.useProgram(program);

      // Configure les attributs pour le quad
      gl.bindVertexArray(vao);

      var textureUnit = 0;
      // le shader, on met la texture sur l'unité de texture 0
      gl.uniform1i(textureLocation, textureUnit);

      // Lie la texture à l'unité de texture 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // cette matrice convertira des pixels en espace de clip
      var matrix = m4.orthographic(0, canvas.width, canvas.height, 0, -1, 1);

      // translate notre quad vers dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // met à l'échelle notre quad de 1 unité
    *  // de 1 unité à dstWidth, dstHeight unités
    *  matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // Définit la matrice.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // dessine le quad (2 triangles, 6 vertices)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

J'ai mis à jour le code pour utiliser différentes tailles

{{{example url="../webgl-2d-drawimage-02.html" }}}

C'était donc facile. Mais qu'en est-il de la 3ème version de `drawImage` du canvas ?

    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);t
Pour sélectionner une partie de la texture, nous devons manipuler les coordonnées de texture. Le fonctionnement
des coordonnées de texture a été [abordé dans l'article sur les textures](webgl-3d-textures.html).
Dans cet article, nous avons créé manuellement des coordonnées de texture, ce qui est une façon très courante de procéder,
mais nous pouvons également les créer à la volée et tout comme nous manipulons nos positions en utilisant
une matrice, nous pouvons de la même manière manipuler les coordonnées de texture en utilisant une autre matrice.

Ajoutons une matrice de texture au vertex shader et multiplions les coordonnées de texture
par cette matrice de texture.

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;
    +uniform mat4 u_textureMatrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
    *   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

Maintenant, nous devons rechercher l'emplacement de la matrice de texture

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    +var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");

Et à l'intérieur de `drawImage`, nous devons la définir pour qu'elle sélectionne la partie de la texture que nous voulons.
Nous savons que les coordonnées de texture sont aussi effectivement un quad unitaire, donc c'est très similaire à
ce que nous avons déjà fait pour les positions.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    srcX, srcY, srcWidth, srcHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstX === undefined) {
    +    dstX = srcX;
    +    srcX = 0;
    +  }
    +  if (dstY === undefined) {
    +    dstY = srcY;
    +    srcY = 0;
    +  }
    +  if (srcWidth === undefined) {
    +    srcWidth = texWidth;
    +  }
    +  if (srcHeight === undefined) {
    +    srcHeight = texHeight;
    +  }
      if (dstWidth === undefined) {
    *    dstWidth = srcWidth;
    +    srcWidth = texWidth;
      }
      if (dstHeight === undefined) {
    *    dstHeight = srcHeight;
    +    srcHeight = texHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      // cette matrice convertira des pixels en espace de clip
      var matrix = m4.orthographic(
          0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

      // translate notre quad vers dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // met à l'échelle notre quad de 1 unité
      // de 1 unité à dstWidth, dstHeight unités
      matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // Définit la matrice.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

    +  // Parce que les coordonnées de texture vont de 0 à 1
    +  // et parce que nos coordonnées de texture sont déjà un quad unitaire
    +  // nous pouvons sélectionner une zone de la texture en réduisant le quad unitaire
    +  // vers le bas
    +  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    +  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
    +
    +  // Définit la matrice de texture.
    +  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

      // dessine le quad (2 triangles, 6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

J'ai également mis à jour le code pour sélectionner des parties des textures. Voici le résultat

{{{example url="../webgl-2d-drawimage-03.html" }}}

Contrairement à l'API canvas 2D, notre version WebGL gère des cas que le `drawImage` du canvas 2D ne gère pas.

D'une part, nous pouvons passer une largeur ou une hauteur négative pour la source ou la destination. Un `srcWidth` négatif
sélectionnera les pixels à gauche de `srcX`. Un `dstWidth` négatif dessinera à gauche de `dstX`.
Dans l'API canvas 2D, ce sont des erreurs au mieux ou un comportement indéfini au pire.

{{{example url="../webgl-2d-drawimage-04.html" }}}

De plus, puisque nous utilisons une matrice, nous pouvons faire [toutes les opérations matricielles que nous voulons](webgl-2d-matrices.html).

Par exemple, nous pourrions faire pivoter les coordonnées de texture autour du centre de la texture.

En changeant le code de la matrice de texture en ceci

    *  // tout comme une matrice de projection 2D sauf dans l'espace de texture (0 à 1)
    *  // au lieu de l'espace de clip. Cette matrice nous place dans l'espace pixel.
    *  var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);
    *
    *  // Nous devons choisir un point autour duquel pivoter
    *  // Nous allons nous déplacer au milieu, pivoter, puis revenir en arrière
    *  var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
    *  var texMatrix = m4.zRotate(texMatrix, srcRotation);
    *  var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);
    *
    *  // parce que nous sommes dans l'espace pixel
    *  // l'échelle et la translation sont maintenant en pixels
    *  var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    *  var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

      // Définit la matrice de texture.
      gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

Et voici le résultat.

{{{example url="../webgl-2d-drawimage-05.html" }}}

Vous pouvez voir un problème qui est qu'à cause de la rotation, nous voyons parfois au-delà du
bord de la texture. Comme elle est définie sur `CLAMP_TO_EDGE`, le bord est simplement répété.

Nous pourrions corriger cela en rejetant tous les pixels en dehors de la plage de 0 à 1 à l'intérieur du shader.
`discard` quitte le shader immédiatement sans écrire de pixel.

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
    +   if (v_texcoord.x < 0.0 ||
    +       v_texcoord.y < 0.0 ||
    +       v_texcoord.x > 1.0 ||
    +       v_texcoord.y > 1.0) {
    +     discard;
    +   }
       outColor = texture(texture, v_texcoord);
    }

Et maintenant les coins ont disparu

{{{example url="../webgl-2d-drawimage-06.html" }}}

ou peut-être aimeriez-vous utiliser une couleur unie lorsque les coordonnées de texture sont en dehors de la texture

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       if (v_texcoord.x < 0.0 ||
           v_texcoord.y < 0.0 ||
           v_texcoord.x > 1.0 ||
           v_texcoord.y > 1.0) {
    *     outColor = vec4(0, 0, 1, 1); // bleu
    +     return;
       }
       outColor = texture(texture, v_texcoord);
    }

{{{example url="../webgl-2d-drawimage-07.html" }}}

Le ciel est vraiment la limite. Tout dépend de votre utilisation créative des shaders.

Ensuite, [nous implémenterons la pile de matrices du canvas 2d](webgl-2d-matrix-stack.html).

<div class="webgl_bottombar">
<h3>Une optimisation mineure</h3>
<p>Je ne recommande pas cette optimisation. Je veux plutôt souligner
une réflexion plus créative puisque WebGL est entièrement basé sur l'utilisation créative des fonctionnalités
qu'il fournit.</p>
<p>Vous avez peut-être remarqué que nous utilisons un quad unitaire pour nos positions et ces positions d'un
quad unitaire correspondent exactement à nos coordonnées de texture. En tant que tel, nous pouvons utiliser les positions
comme coordonnées de texture.</p>
<pre class="prettyprint showlinemods">{{#escapehtml}}
#version 300 es
in vec4 a_position;
-in vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
*   v_texcoord = (u_textureMatrix * a_position).xy;
}
{{/escapehtml}}</pre>
<p>Nous pouvons maintenant supprimer le code qui configurait les coordonnées de texture et cela fonctionnera
exactement de la même manière qu'avant.</p>
{{{example url="../webgl-2d-drawimage-08.html" }}}
</div>


