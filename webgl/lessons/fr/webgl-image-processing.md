Title: Traitement d'images en WebGL2
Description: Comment traiter des images en WebGL
TOC: Traitement d'images


Le traitement d'images est facile en WebGL. À quel point ? Lisez ce qui suit.

Cet article fait suite à [Les fondamentaux de WebGL2](webgl-fundamentals.html).
Si vous ne l'avez pas encore lu, je vous suggère de [commencer par là](webgl-fundamentals.html).

Pour dessiner des images en WebGL, nous devons utiliser des textures. De la même manière que
WebGL attend des coordonnées d'espace de clip lors du rendu au lieu de pixels,
WebGL attend généralement des coordonnées de texture lors de la lecture d'une texture.
Les coordonnées de texture vont de 0.0 à 1.0 quelles que soient les dimensions de la texture.

WebGL2 ajoute la possibilité de lire une texture en utilisant également des coordonnées de pixels.
Le choix de la meilleure méthode vous appartient. J'ai l'impression qu'il est plus courant d'utiliser
des coordonnées de texture que des coordonnées de pixels.

Comme nous ne dessinons qu'un seul rectangle (enfin, 2 triangles),
nous devons dire à WebGL à quel endroit de la texture chaque point du
rectangle correspond. Nous transmettrons cette information du vertex
shader au fragment shader en utilisant un type spécial de variable appelé
'varying'. On l'appelle varying (variable) parce qu'elle varie. [WebGL va
interpoler les valeurs](webgl-how-it-works.html) que nous fournissons dans le
vertex shader au fur et à mesure qu'il dessine chaque pixel en utilisant le fragment shader.

En utilisant [le vertex shader de la fin de l'article précédent](webgl-fundamentals.html),
nous devons ajouter un attribut pour transmettre les coordonnées de texture, puis
les passer au fragment shader.

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // passe les texCoord au fragment shader
    +   // Le GPU va interpoler cette valeur entre les points
    +   v_texCoord = a_texCoord;
    }

Ensuite, nous fournissons un fragment shader pour rechercher les couleurs de la texture.

    #version 300 es
    precision highp float;

    // notre texture
    uniform sampler2D u_image;

    // les texCoords passées depuis le vertex shader.
    in vec2 v_texCoord;

    // nous devons déclarer une sortie pour le fragment shader
    out vec4 outColor;

    void main() {
       // Recherche une couleur dans la texture.
       outColor = texture(u_image, v_texCoord);
    }

Enfin, nous devons charger une image, créer une texture et copier l'image
dans la texture. Comme nous sommes dans un navigateur, les images se chargent de manière asynchrone,
nous devons donc réorganiser un peu notre code pour attendre que la texture se charge.
Une fois chargée, nous la dessinerons.

    +function main() {
    +  var image = new Image();
    +  image.src = "https://someimage/on/our/server";  // DOIT ÊTRE DU MÊME DOMAINE !!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // recherche où les données de vertex doivent aller.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // recherche les uniforms
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // fournit les coordonnées de texture pour le rectangle.
    +  var texCoordBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    +      0.0,  0.0,
    +      1.0,  0.0,
    +      0.0,  1.0,
    +      0.0,  1.0,
    +      1.0,  0.0,
    +      1.0,  1.0]), gl.STATIC_DRAW);
    +  gl.enableVertexAttribArray(texCoordAttributeLocation);
    +  var size = 2;          // 2 composants par itération
    +  var type = gl.FLOAT;   // les données sont des floats 32bit
    +  var normalize = false; // ne pas normaliser les données
    +  var stride = 0;        // 0 = avancer de size * sizeof(type) à chaque itération pour obtenir la position suivante
    +  var offset = 0;        // commencer au début du buffer
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // Crée une texture.
    +  var texture = gl.createTexture();
    +
    +  // fait de l'unité 0 l'unité de texture active
    +  // (c'est-à-dire, l'unité que toutes les autres commandes de texture affecteront.)
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // Lie la texture au point de liaison 2D de 'l'unité de texture 0'
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // Définit les paramètres pour qu'on n'ait pas besoin de mips et qu'on ne filtre pas
    +  // et qu'on ne répète pas
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // Télécharge l'image dans la texture.
    +  var mipLevel = 0;               // le plus grand mip
    +  var internalFormat = gl.RGBA;   // format qu'on veut dans la texture
    +  var srcFormat = gl.RGBA;        // format des données qu'on fournit
    +  var srcType = gl.UNSIGNED_BYTE  // type des données qu'on fournit
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // Lui dit d'utiliser notre programme (paire de shaders)
      gl.useProgram(program);

      // Passe la résolution du canvas pour qu'on puisse convertir de
      // pixels en espace de clip dans le shader
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // Dit au shader d'obtenir la texture depuis l'unité de texture 0
    +  gl.uniform1i(imageLocation, 0);

    +  // Lie le buffer de position pour que gl.bufferData qui sera appelé
    +  // dans setRectangle mette les données dans le buffer de position
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // Définit un rectangle de la même taille que l'image.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

Et voici l'image rendue en WebGL.

{{{example url="../webgl-2d-image.html" }}}

Pas très excitant, alors manipulons cette image. Que diriez-vous d'échanger
simplement le rouge et le bleu ?

    ...
    outColor = texture(u_image, v_texCoord).bgra;
    ...

Et maintenant le rouge et le bleu sont échangés.

{{{example url="../webgl-2d-image-red2blue.html" }}}

Et si nous voulons faire un traitement d'image qui examine réellement d'autres
pixels ? Puisque WebGL référence les textures en coordonnées de texture qui
vont de 0.0 à 1.0, nous pouvons calculer la valeur normalisée correspondant à un déplacement de 1 pixel
avec le calcul simple <code>onePixel = 1.0 / textureSize</code>.

Voici un fragment shader qui fait la moyenne des pixels gauche et droit de
chaque pixel dans la texture.

```
#version 300 es

// les fragment shaders n'ont pas de précision par défaut donc nous devons
// en choisir une. highp est un bon choix par défaut. Cela signifie "haute précision"
precision highp float;

// notre texture
uniform sampler2D u_image;

// les texCoords passées depuis le vertex shader.
in vec2 v_texCoord;

// nous devons déclarer une sortie pour le fragment shader
out vec4 outColor;

void main() {
+  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
+
+  // fait la moyenne des pixels gauche, milieu et droit.
+  outColor = (
+      texture(u_image, v_texCoord) +
+      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
+      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
```

Comparez avec l'image non floutée ci-dessus.

{{{example url="../webgl-2d-image-blend.html" }}}

Maintenant que nous savons comment référencer d'autres pixels, utilisons un noyau de convolution
pour effectuer un ensemble de traitements d'images courants. Dans ce cas, nous utiliserons un noyau 3x3.
Un noyau de convolution est simplement une matrice 3x3 où chaque entrée dans la matrice représente
par combien multiplier les 8 pixels autour du pixel que nous rendons. Nous divisons ensuite
le résultat par le poids du noyau (la somme de toutes les valeurs dans le noyau)
ou 1.0, selon la valeur la plus grande. [Voici un très bon article à ce sujet](https://docs.gimp.org/2.6/en/plug-in-convmatrix.html).
Et [voici un autre article montrant du code réel si
vous écriviez ceci à la main en C++](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

Dans notre cas, nous allons faire ce travail dans le shader, voici donc le nouveau fragment shader.

```
#version 300 es

// les fragment shaders n'ont pas de précision par défaut donc nous devons
// en choisir une. highp est un bon choix par défaut. Cela signifie "haute précision"
precision highp float;

// notre texture
uniform sampler2D u_image;

// les données du noyau de convolution
uniform float u_kernel[9];
uniform float u_kernelWeight;

// les texCoords passées depuis le vertex shader.
in vec2 v_texCoord;

// nous devons déclarer une sortie pour le fragment shader
out vec4 outColor;

void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

  vec4 colorSum =
      texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
      texture(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
      texture(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
  outColor = vec4((colorSum / u_kernelWeight).rgb, 1);
}
```

En JavaScript, nous devons fournir un noyau de convolution et son poids

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];

     // définit le noyau et son poids
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

Et voilà... Utilisez la liste déroulante pour sélectionner différents noyaux.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

J'espère que cet article vous a convaincu que le traitement d'images en WebGL est assez simple. Ensuite, nous allons voir [comment appliquer plus d'un effet à l'image](webgl-image-processing-continued.html).

<div class="webgl_bottombar">
<h3>Que sont les unités de texture ?</h3>
Lorsque vous appelez <code>gl.draw???</code>, votre shader peut référencer des textures. Les textures sont liées
aux unités de texture. Bien que la machine de l'utilisateur puisse en supporter plus, toutes les implémentations WebGL2 sont
tenues de supporter au moins 16 unités de texture. L'unité de texture que chaque uniform sampler
référence est définie en recherchant l'emplacement de cet uniform sampler, puis en définissant l'
index de l'unité de texture que vous voulez qu'il référence.

Par exemple :
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // utilise l'unité de texture 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

Pour définir des textures sur différentes unités, vous appelez gl.activeTexture puis liez la texture que vous voulez sur cette unité. Exemple

<pre class="prettyprint showlinemods">
// Lie someTexture à l'unité de texture 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

Cela fonctionne aussi

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // utilise l'unité de texture 6.
// Lie someTexture à l'unité de texture 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>Pourquoi les préfixes a_, u_ et v_ devant les variables en GLSL ?</h3>
<p>
C'est juste une convention de nommage. Ils ne sont pas obligatoires mais pour moi, cela facilite la visualisation
d'où viennent les valeurs. a_ pour les attributes qui sont les données fournies par les buffers. u_ pour les uniforms
qui sont les entrées des shaders, v_ pour les varyings qui sont les valeurs passées d'un vertex shader à un
fragment shader et interpolées (ou variées) entre les vertices pour chaque pixel dessiné.
Voir <a href="webgl-how-it-works.html">Comment ça fonctionne</a> pour plus de détails.
</p>
</div>


