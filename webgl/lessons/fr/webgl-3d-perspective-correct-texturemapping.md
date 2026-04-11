Title: WebGL2 Mappage de Texture 3D avec Correction de Perspective
Description: Ce qui est spécial à propos de W
TOC: Mappage de Texture avec Correction de Perspective


Cet article fait partie d'une série d'articles sur WebGL. Le premier
[a commencé par les fondamentaux](webgl-fundamentals.html). Cet article
couvre le mappage de texture avec correction de perspective. Pour le comprendre, vous
devez probablement lire sur [la projection en perspective](webgl-3d-perspective.html) et peut-être sur [le texturage](webgl-3d-textures.html)
également. Vous devez aussi savoir ce que sont [les varyings et ce qu'ils font](webgl-how-it-works.html), mais je vais les couvrir brièvement ici.

Donc dans l'article "[comment ça marche](webgl-how-it-works.html)",
nous avons vu comment fonctionnent les varyings. Un shader de sommet peut déclarer un
varying et le définir à une certaine valeur. Une fois que le shader de sommet a été appelé
3 fois, WebGL va dessiner un triangle. Pendant qu'il dessine ce triangle,
pour chaque pixel, il va appeler notre shader de fragment et lui demander quelle
couleur donner à ce pixel. Entre les 3 sommets du triangle,
il nous passera nos varyings interpolés entre les 3 valeurs.

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_color est interpolé entre v0, v1 et v2" }}}

Revenons à notre [premier article](webgl-fundamentals.html), nous avons dessiné un triangle dans
l'espace de découpage, sans calculs mathématiques. Nous avons simplement passé des coordonnées d'espace de découpage
à un shader de sommet simple qui ressemblait à ceci

      #version 300 es

      // un attribut est une entrée (in) pour un shader de sommet.
      // Il recevra des données depuis un tampon
      in vec4 a_position;

      // tous les shaders ont une fonction main
      void main() {

        // gl_Position est une variable spéciale dont un shader de sommet
        // est responsable de définir
        gl_Position = a_position;
      }

Nous avions un shader de fragment simple qui dessine une couleur constante

      #version 300 es

      // les shaders de fragment n'ont pas de précision par défaut donc nous devons
      // en choisir une. highp est un bon choix par défaut
      precision highp float;

      // nous devons déclarer une sortie pour le shader de fragment
      out vec4 outColor;

      void main() {
        // Définit simplement la sortie à une couleur violet-rougeâtre constante
        outColor = vec4(1, 0, 0.5, 1);
      }

Donc, faisons en sorte que cela dessine 2 rectangles dans l'espace de découpage. Nous lui passerons ces
données avec `X`, `Y`, `Z`, et `W` pour chaque sommet.

    var positions = [
      -.8, -.8, 0, 1,  // 1er rect 1er triangle
       .8, -.8, 0, 1,
      -.8, -.2, 0, 1,
      -.8, -.2, 0, 1,  // 1er rect 2ème triangle
       .8, -.8, 0, 1,
       .8, -.2, 0, 1,

      -.8,  .2, 0, 1,  // 2ème rect 1er triangle
       .8,  .2, 0, 1,
      -.8,  .8, 0, 1,
      -.8,  .8, 0, 1,  // 2ème rect 2ème triangle
       .8,  .2, 0, 1,
       .8,  .8, 0, 1,
    ];

Voici cela

{{{example url="../webgl-clipspace-rectangles.html" }}}

Ajoutons un seul varying float. Nous le passerons directement
du shader de sommet au shader de fragment.

      #version 300 es

      in vec4 a_position;
    +  in float a_brightness;

    +  out float v_brightness;

      void main() {
        gl_Position = a_position;

    +    // passe simplement la luminosité au shader de fragment
    +    v_brightness = a_brightness;
      }

Dans le shader de fragment, nous utiliserons ce varying pour définir la couleur

      #version 300 es

      precision highp float;

    +  // passé depuis le shader de sommet et interpolé
    +  in float v_brightness;

       // nous devons déclarer une sortie pour le shader de fragment
       out vec4 outColor;

      void main() {
    *    outColor = vec4(v_brightness, 0, 0, 1);  // rouges
      }

Nous devons fournir des données pour ce varying, alors créons un tampon et
mettons-y des données. Une valeur par sommet. Nous définirons toutes les valeurs de luminosité
pour les sommets à gauche à 0 et ceux à droite à 1.

```
  // Crée un tampon et y met 12 valeurs de luminosité
  var brightnessBuffer = gl.createBuffer();

  // Le lie à ARRAY_BUFFER (pensez-y comme ARRAY_BUFFER = brightnessBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  var brightness = [
    0,  // 1er rect 1er triangle
    1,
    0,
    0,  // 1er rect 2ème triangle
    1,
    1,

    0,  // 2ème rect 1er triangle
    1,
    0,
    0,  // 2ème rect 2ème triangle
    1,
    1,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brightness), gl.STATIC_DRAW);
```

Nous devons également rechercher l'emplacement de l'attribut `a_brightness`
au moment de l'initialisation

```
  // recherche où les données de sommet doivent aller.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
+  var brightnessAttributeLocation = gl.getAttribLocation(program, "a_brightness");
```

et configurer cet attribut au moment du rendu

```
  // Active l'attribut
  gl.enableVertexAttribArray(brightnessAttributeLocation);

  // Lie le tampon de position.
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  // Indique à l'attribut comment extraire les données de brightnessBuffer (ARRAY_BUFFER)
  var size = 1;          // 1 composante par itération
  var type = gl.FLOAT;   // les données sont des floats 32 bits
  var normalize = false; // ne pas normaliser les données
  var stride = 0;        // 0 = avancer de size * sizeof(type) à chaque itération pour obtenir la position suivante
  var offset = 0;        // commencer au début du tampon
  gl.vertexAttribPointer(
      brightnessAttributeLocation, size, type, normalize, stride, offset);
```

Et maintenant, lorsque nous effectuons le rendu, nous obtenons deux rectangles qui sont noirs à gauche
lorsque `brightness` vaut 0 et rouges à droite lorsque `brightness` vaut 1 et
pour la zone entre les deux, `brightness` est interpolé ou (varié) au fur et à mesure que cela
traverse les triangles.

{{{example url="../webgl-clipspace-rectangles-with-varying.html" }}}

Donc, d'après l'[article sur la perspective](webgl-3d-perspective.html), nous savons que WebGL prend toute valeur que nous mettons dans `gl_Position` et la divise par
`gl_Position.w`.

Dans les sommets ci-dessus, nous avons fourni `1` pour `W`, mais puisque nous savons que WebGL
va diviser par `W`, alors nous devrions pouvoir faire quelque chose comme ceci
et obtenir le même résultat.

```
  var mult = 20;
  var positions = [
      -.8,  .8, 0, 1,  // 1er rect 1er triangle
       .8,  .8, 0, 1,
      -.8,  .2, 0, 1,
      -.8,  .2, 0, 1,  // 1er rect 2ème triangle
       .8,  .8, 0, 1,
       .8,  .2, 0, 1,

      -.8       , -.2       , 0,    1,  // 2ème rect 1er triangle
       .8 * mult, -.2 * mult, 0, mult,
      -.8       , -.8       , 0,    1,
      -.8       , -.8       , 0,    1,  // 2ème rect 2ème triangle
       .8 * mult, -.2 * mult, 0, mult,
       .8 * mult, -.8 * mult, 0, mult,
  ];
```

Ci-dessus, vous pouvez voir que pour chaque point à droite dans le second
rectangle, nous multiplions `X` et `Y` par `mult` mais, nous définissons aussi
`W` à `mult`. Puisque WebGL va diviser par `W`, nous devrions obtenir
exactement le même résultat, n'est-ce pas ?

Eh bien voici cela

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w.html" }}}

Notez que les 2 rectangles sont dessinés au même endroit où ils étaient avant. Cela
prouve que `X * MULT / MULT(W)` est toujours juste `X` et pareil pour `Y`. Mais, les
couleurs sont différentes. Que se passe-t-il ?

Il s'avère que WebGL utilise `W` pour implémenter le mappage de texture
avec correction de perspective, ou plutôt pour faire une interpolation des varyings
avec correction de perspective.

En fait, pour faciliter la visualisation, modifions le shader de fragment pour ceci

    outColor = vec4(fract(v_brightness * 10.), 0, 0, 1);  // rouges

multiplier `v_brightness` par 10 fera passer la valeur de 0 à 10. `fract` ne
gardera que la partie fractionnaire, donc elle ira de 0 à 1, 0 à 1, 0 à 1, 10 fois.

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w-repeat.html" }}}

Une interpolation linéaire d'une valeur à une autre serait cette
formule

     result = (1 - t) * a + t * b

Où `t` est une valeur de 0 à 1 représentant une position entre `a` et `b`. 0 à `a` et 1 à `b`.

Pour les varyings cependant, WebGL utilise cette formule

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

Où `aW` est le `W` qui a été défini sur `gl_Position.w` lorsque le varying était
défini à `a` et `bW` est le `W` qui a été défini sur `gl_Position.w` lorsque le
varying était défini à `b`.

Pourquoi est-ce important ? Eh bien voici un simple cube texturé comme nous avons fini avec dans l'[article sur les textures](webgl-3d-textures.html). J'ai ajusté
les coordonnées UV pour aller de 0 à 1 sur chaque côté et il utilise une texture 4x4 pixels.

{{{example url="../webgl-perspective-correct-cube.html" }}}

Maintenant prenons cet exemple et changeons le shader de sommet pour que
nous divisions par `W` nous-mêmes. Nous devons juste ajouter 1 ligne.

```
#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix;

out vec2 v_texcoord;

void main() {
  // Multiplie la position par la matrice.
  gl_Position = u_matrix * a_position;

+  // Divise manuellement par W.
+  gl_Position /= gl_Position.w;

  // Passe les coordonnées de texture au shader de fragment.
  v_texcoord = a_texcoord;
}
```

Diviser par `W` signifie que `gl_Position.w` finira par valoir 1.
`X`, `Y`, et `Z` sortiront exactement comme ils le feraient si nous laissions
WebGL faire la division pour nous. Eh bien voici les résultats.

{{{example url="../webgl-non-perspective-correct-cube.html" }}}

Nous obtenons toujours un cube 3D, mais les textures sont déformées. C'est
parce qu'en ne passant pas `W` comme il était auparavant, WebGL n'est pas capable de faire
le mappage de texture avec correction de perspective. Ou plus correctement, WebGL n'est pas
capable de faire une interpolation des varyings avec correction de perspective.

Si vous vous souvenez, `W` était notre
`Z` de notre [matrice de perspective](webgl-3d-perspective.html).
Avec `W` valant juste `1`, WebGL finit par faire une interpolation linéaire.
En fait, si vous prenez l'équation ci-dessus

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

Et changez tous les `W` en 1, nous obtenons

     result = (1 - t) * a / 1 + t * b / 1
              ---------------------------
                 (1 - t) / 1 + t / 1

Diviser par 1 ne fait rien, donc nous pouvons simplifier à ceci

     result = (1 - t) * a + t * b
              -------------------
                 (1 - t) + t

`(1 - t) + t` lorsque `t` va de 0 à 1 est identique à `1`. Par exemple
si `t` était `.7`, nous obtiendrions `(1 - .7) + .7` qui est `.3 + .7` qui est `1`. En d'autres termes, nous pouvons supprimer le bas et nous restons avec

     result = (1 - t) * a + t * b

Ce qui est identique à l'équation d'interpolation linéaire ci-dessus.

Espérons qu'il soit maintenant clair pourquoi WebGL utilise une matrice 4x4 et
des vecteurs à 4 valeurs avec `X`, `Y`, `Z`, et `W`. `X` et `Y` divisés par `W` donnent une coordonnée d'espace de découpage. `Z` divisé par `W` donne également une coordonnée d'espace de découpage en Z et `W` est toujours utilisé lors de l'interpolation des varyings et
fournit la capacité de faire du mappage de texture avec correction de perspective.

<div class="webgl_bottombar">
<h3>Consoles de jeux du milieu des années 1990</h3>
<p>
En tant que petit élément d'information, la PlayStation 1 et certaines autres
consoles de jeux de la même époque ne faisaient pas de mappage de texture avec correction de perspective. En regardant les résultats ci-dessus, vous pouvez maintenant voir pourquoi
elles avaient l'apparence qu'elles avaient.
</p>
<div class="webgl_center"><img src="resources/ridge-racer-01.png" style="max-width: 500px;" /></div>
<p></p>
<div class="webgl_center"><img src="resources/ridge-racer-02.png" style="max-width: 500px;" /></div>
</div>
