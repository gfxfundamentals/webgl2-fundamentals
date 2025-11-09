Title: Mise à l'échelle 2D en WebGL2
Description: Comment effectuer une mise à l'échelle en 2D
TOC: Mise à l'échelle 2D


Cet article fait partie d'une série d'articles sur WebGL.
Le premier [a commencé par les bases](webgl-fundamentals.html) et
le précédent portait sur [la rotation de la géométrie](webgl-2d-rotation.html).

La mise à l'échelle est tout aussi [facile que la translation](webgl-2d-translation.html).

Nous multiplions la position par l'échelle souhaitée. Voici les changements
par rapport à notre [exemple précédent](webgl-2d-rotation.html).

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // Met à l'échelle la position
+  vec2 scaledPosition = a_position * u_scale;

  // Effectue la rotation de la position
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Ajoute la translation.
  vec2 position = rotatedPosition + u_translation;
```

et nous ajoutons le JavaScript nécessaire pour définir l'échelle lors du dessin.

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];


   // Dessine la scène.
   function drawScene() {
     webglUtils.resizeCanvasToDisplaySize(gl.canvas);

     // Indique à WebGL comment convertir de l'espace de découpage en pixels
     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

     // Efface le canvas
     gl.clearColor(0, 0, 0, 0);
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     // Indique d'utiliser notre programme (paire de shaders)
     gl.useProgram(program);

     // Lie l'ensemble attribut/tampon que nous voulons.
     gl.bindVertexArray(vao);

     // Passe la résolution du canvas pour pouvoir convertir
     // des pixels vers l'espace de découpage dans le shader
     gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

     // Définit la couleur.
     gl.uniform4fv(colorLocation, color);

     // Définit la translation.
     gl.uniform2fv(translationLocation, translation);

     // Définit la rotation.
     gl.uniform2fv(rotationLocation, rotation);

+     // Définit l'échelle.
+     gl.uniform2fv(scaleLocation, scale);

     // Dessine le rectangle.
     var primitiveType = gl.TRIANGLES;
     var offset = 0;
     var count = 18;
     gl.drawArrays(primitiveType, offset, count);
   }
```

Et maintenant nous avons la mise à l'échelle. Faites glisser les curseurs.

{{{example url="../webgl-2d-geometry-scale.html" }}}

Une chose à remarquer est que mettre à l'échelle avec une valeur négative inverse notre géométrie.

Une autre chose à remarquer est qu'elle met à l'échelle depuis 0, 0 qui pour notre F est le
coin supérieur gauche. Cela a du sens puisque nous multiplions les positions
par l'échelle, elles vont s'éloigner de 0, 0. Vous pouvez probablement
imaginer des moyens de corriger cela. Par exemple, vous pourriez ajouter une autre translation
avant de mettre à l'échelle, une translation *pré-échelle*. Une autre solution serait
de changer les données de position réelles du F. Nous verrons une autre façon bientôt.

J'espère que ces 3 derniers articles ont été utiles pour comprendre
la [translation](webgl-2d-translation.html), la [rotation](webgl-2d-rotation.html)
et la mise à l'échelle. Ensuite, nous verrons [la magie des matrices](webgl-2d-matrices.html)
qui combine ces 3 éléments dans une forme beaucoup plus simple et souvent plus utile.

<div class="webgl_bottombar">
<h3>Pourquoi un 'F' ?</h3>
<p>
La première fois que j'ai vu quelqu'un utiliser un 'F', c'était sur une texture.
Le 'F' en lui-même n'est pas important. Ce qui est important, c'est que
vous pouvez déterminer son orientation depuis n'importe quelle direction. Si nous
utilisions un cœur ❤ ou un triangle △ par exemple, nous ne pourrions pas
dire s'il était retourné horizontalement. Un cercle ○ serait
encore pire. Un rectangle coloré fonctionnerait sans doute avec
des couleurs différentes sur chaque coin, mais vous devriez alors vous rappeler
quel coin était lequel. L'orientation d'un F est instantanément reconnaissable.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
N'importe quelle forme dont vous pouvez déterminer l'orientation fonctionnerait,
j'ai simplement utilisé 'F' depuis que j'ai été introduit pour la première 'F'ois à l'idée.
</p>
</div>




