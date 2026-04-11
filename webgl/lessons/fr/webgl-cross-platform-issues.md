Title: WebGL2 Problèmes multi-plateformes
Description: Ce dont il faut être conscient quand on essaie de faire fonctionner son application WebGL partout.
TOC: Problèmes multi-plateformes

Ce n'est probablement pas une surprise que tous les programmes WebGL ne fonctionnent pas sur tous les appareils ou
navigateurs.

Voici une liste de la plupart des problèmes que vous pourriez rencontrer d'emblée

## Performances

Un GPU haut de gamme fonctionne probablement 100x plus vite qu'un GPU bas de gamme. La seule façon de
contourner ça que je connaisse est soit de viser bas, soit de donner à l'utilisateur des options comme
le font la plupart des applications PC de bureau où il peut choisir entre performance ou fidélité.

## Mémoire

De même, un GPU haut de gamme pourrait avoir 12 à 24 gig de RAM alors qu'un GPU bas de gamme
a probablement moins de 1 gig. (Je suis vieux donc il est étonnant pour moi que bas de gamme = 1 gig puisque
j'ai commencé à programmer sur des machines avec 16k à 64k de mémoire 😜)

## Limites des appareils

WebGL a diverses fonctionnalités minimum supportées, mais votre appareil local pourrait supporter
plus que ce minimum, ce qui signifie que ça échouera sur d'autres appareils qui en supportent moins.

Les exemples incluent :

* La taille maximale de texture autorisée

  2048 ou 4096 semble être des limites raisonnables. Au moins en 2020, il semble que
  [99% des appareils supportent 4096 mais seulement 50% supportent > 4096](https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE).

  Note : la taille maximale de texture est la dimension maximale que le GPU peut traiter. Ça
  ne signifie pas que ce GPU a assez de mémoire pour cette dimension au carré (pour une texture
  2D) ou au cube (pour une texture 3D). Par exemple, certains GPU ont une taille max de
  16384. Mais une texture 3D de 16384 de chaque côté nécessiterait 16 téraoctets de
  mémoire !!!

* Le nombre maximum d'attributs de sommets dans un seul programme

  Dans WebGL1, le minimum supporté est 8. Dans WebGL2, c'est 16. Si vous en utilisez plus,
  votre code échouera sur une machine avec seulement le minimum.

* Le nombre maximum de vecteurs d'uniforms

  Ceux-ci sont spécifiés séparément pour les vertex shaders et les fragment shaders.

  Dans WebGL1, c'est 128 pour les vertex shaders et 16 pour les fragment shaders.
  Dans WebGL2, c'est 256 pour les vertex shaders et 224 pour les fragment shaders.

  Notez que les uniforms peuvent être "empaquetés" donc le nombre ci-dessus est combien de `vec4`s
  peuvent être utilisés. En théorie, vous pourriez avoir 4x le nombre d'uniforms `float`.
  Mais il y a un algorithme qui les fait rentrer. Vous pouvez imaginer l'espace comme
  un tableau avec 4 colonnes, une ligne pour chacun des vecteurs d'uniforms maximum ci-dessus.

     ```
     +-+-+-+-+
     | | | | |   <- un vec4
     | | | | |   |
     | | | | |   |
     | | | | |   V
     | | | | |   lignes max de vecteurs d'uniforms
     | | | | |
     | | | | |  
     | | | | |
     ...

     ```
  
  D'abord les `vec4`s sont alloués avec un `mat4` étant 4 `vec4`s. Ensuite les `vec3`s sont
  placés dans l'espace restant. Puis les `vec2`s suivis des `float`s. Donc imaginez qu'on ait 1
  `mat4`, 2 `vec3`s, 2 `vec2`s et 3 `float`s

     ```
     +-+-+-+-+
     |m|m|m|m|   <- le mat4 prend 4 lignes
     |m|m|m|m|
     |m|m|m|m|
     |m|m|m|m|
     |3|3|3| |   <- les 2 vec3s prennent 2 lignes
     |3|3|3| |
     |2|2|2|2|   <- les 2 vec2s tiennent dans 1 ligne 
     |f|f|f| |   <- les 3 floats tiennent dans une ligne
     ...

     ```

  De plus, un tableau d'uniforms est toujours vertical, donc par exemple si le maximum
  de vecteurs d'uniforms autorisés est 16, vous ne pouvez pas avoir un tableau `float` de 17 éléments,
  et en fait si vous aviez un seul `vec4` cela prendrait une ligne entière donc il ne reste
  que 15 lignes, ce qui signifie que le plus grand tableau que vous pouvez avoir serait de 15
  éléments.

  Mon conseil cependant est de ne pas compter sur un empaquetage parfait. Bien que la spécification dise que
  l'algorithme ci-dessus est requis pour passer, il y a trop de combinaisons à tester
  pour que tous les drivers passent. Soyez juste conscient si vous approchez de la limite.

  Note : les varyings et attributs ne peuvent pas être empaquetés.

* Les vecteurs de varyings maximum.

  WebGL1 le minimum est 8. WebGL2 c'est 16.

  Si vous en utilisez plus, votre code ne fonctionnera pas sur une machine avec seulement le minimum.

* Les unités de texture maximum

  Il y a 3 valeurs ici.

  1. Combien d'unités de texture il y a
  2. Combien d'unités de texture un vertex shader peut référencer
  3. Combien d'unités de texture un fragment shader peut référencer

  <table class="tabular-data">
    <thead>
      <tr><th></th><th>WebGL1</th><th>WebGL2</th></tr>
    </thead>
    <tbody>
      <tr><td>min unités de texture qui existent</td><td>8</td><td>32</td></tr>
      <tr><td>min unités de texture qu'un vertex shader peut référencer</td><th style="color: red;">0!</td><td>16</td></tr>
      <tr><td>min unités de texture qu'un fragment shader peut référencer</td><td>8</td><td>16</td></tr>
    </tbody>
  </table>

  Il est important de noter le **0** pour un vertex shader dans WebGL1. Notez que ce n'est probablement pas la fin du monde.
  Apparemment, [~97% de tous les appareils supportent au moins 4](https://web3dsurvey.com/webgl/parameters/MAX_VERTEX_TEXTURE_IMAGE_UNITS).
  Mais vous pourriez vouloir vérifier afin de soit informer l'utilisateur que votre application ne va pas fonctionner pour lui, soit
  vous pouvez vous rabattre sur d'autres shaders.

Il existe d'autres limites également. Pour les rechercher, vous appelez `gl.getParameter` avec
les valeurs suivantes.

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_TEXTURE_SIZE                </td><td>taille max d'une texture</td></tr>
    <tr><td>MAX_VERTEX_ATTRIBS              </td><td>nombre d'attributs que vous pouvez avoir</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_VECTORS      </td><td>nombre d'uniforms vec4 qu'un vertex shader peut avoir</td></tr>
    <tr><td>MAX_VARYING_VECTORS             </td><td>nombre de varyings que vous avez</td></tr>
    <tr><td>MAX_COMBINED_TEXTURE_IMAGE_UNITS</td><td>nombre d'unités de texture qui existent</td></tr>
    <tr><td>MAX_VERTEX_TEXTURE_IMAGE_UNITS  </td><td>nombre d'unités de texture qu'un vertex shader peut référencer</td></tr>
    <tr><td>MAX_TEXTURE_IMAGE_UNITS         </td><td>nombre d'unités de texture qu'un fragment shader peut référencer</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_VECTORS    </td><td>nombre d'uniforms vec4 qu'un fragment shader peut avoir</td></tr>
    <tr><td>MAX_CUBE_MAP_TEXTURE_SIZE       </td><td>taille max d'un cubemap</td></tr>
    <tr><td>MAX_RENDERBUFFER_SIZE           </td><td>taille max d'un renderbuffer</td></tr>
    <tr><td>MAX_VIEWPORT_DIMS               </td><td>taille max du viewport</td></tr>
  </tbody>
</table>
</div>

Ce n'est pas la liste complète. Par exemple, la taille maximale des points et l'épaisseur maximale des lignes,
mais vous devriez fondamentalement supposer que l'épaisseur maximale des lignes est 1.0 et que les POINTS
ne sont utiles que pour de simples démos où vous ne vous souciez pas des
[problèmes de découpage](#points-lines-viewport-scissor-behavior).

WebGL2 en ajoute plusieurs autres. Quelques-uns courants sont

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_3D_TEXTURE_SIZE                </td><td>taille max d'une texture 3D</td></tr>
    <tr><td>MAX_DRAW_BUFFERS              </td><td>nombre d'attachements de couleur que vous pouvez avoir</td></tr>
    <tr><td>MAX_ARRAY_TEXTURE_LAYERS      </td><td>nombre max de couches dans un tableau de textures 2D</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS             </td><td>nombre de varyings que vous pouvez émettre vers des buffers séparés lors de l'utilisation du transform feedback</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS</td><td>nombre de varyings que vous pouvez émettre quand on les envoie tous vers un seul buffer</td></tr>
    <tr><td>MAX_COMBINED_UNIFORM_BLOCKS  </td><td>nombre de blocs d'uniforms que vous pouvez utiliser au total</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_BLOCKS         </td><td>nombre de blocs d'uniforms qu'un vertex shader peut utiliser</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_BLOCKS    </td><td>nombre de blocs d'uniforms qu'un fragment shader peut utiliser</td></tr>
  </tbody>
</table>
</div>

## Résolution du depth buffer

Quelques très anciens appareils mobiles utilisent des depth buffers de 16 bits. Sinon, autant que je sache, 99%
des appareils utilisent un depth buffer de 24 bits donc vous n'avez probablement pas à vous inquiéter de
ça.

## Combos format/type de readPixels

Seuls certains combos format/type sont garantis de fonctionner. D'autres combos sont
optionnels. Ceci est couvert dans [cet article](webgl-readpixels.html).

## Combos d'attachements de framebuffer

Les framebuffers peuvent avoir 1 ou plusieurs attachements de textures et renderbuffers.

Dans WebGL1, seules 3 combinaisons d'attachements sont garanties de fonctionner.

1. une seule texture avec format = `RGBA`, type = `UNSIGNED_BYTE` comme `COLOR_ATTACHMENT0`
2. une texture avec format = `RGBA`, type = `UNSIGNED_BYTE` comme `COLOR_ATTACHMENT0` et un
   renderbuffer avec format = `DEPTH_COMPONENT` attaché comme `DEPTH_ATTACHMENT`
3. une texture avec format = `RGBA`, type = `UNSIGNED_BYTE` comme `COLOR_ATTACHMENT0` et un
   renderbuffer avec format = `DEPTH_STENCIL` attaché comme `DEPTH_STENCIL_ATTACHMENT`

Toutes les autres combinaisons dépendent de l'implémentation que vous vérifiez en appelant
`gl.checkFramebufferStatus` et en voyant s'il retourne `FRAMEBUFFER_COMPLETE`.

WebGL2 garantit de pouvoir écrire dans beaucoup plus de formats mais a quand même la
limite que **n'importe quelle combinaison peut échouer !** Votre meilleure chance est peut-être que si tous les
attachements de couleur sont du même format si vous en attachez plus d'un.

## Extensions

De nombreuses fonctionnalités de WebGL1 et WebGL2 sont optionnelles. Tout l'intérêt d'avoir une
API appelée `getExtension` est qu'elle peut échouer si l'extension n'existe pas
et vous devriez donc vérifier cet échec et ne pas supposer aveuglément qu'elle réussira.

Probablement l'extension manquante la plus courante sur WebGL1 et WebGL2 est
`OES_texture_float_linear` qui est la capacité de filtrer une texture à virgule flottante,
c'est-à-dire la capacité de supporter la définition de `TEXTURE_MIN_FILTER` et
`TEXTURE_MAX_FILTER` à autre chose que `NEAREST`. De nombreux appareils mobiles ne
supportent pas ça.

Dans WebGL1, une autre extension souvent manquante est `WEBGL_draw_buffers` qui est la
capacité d'attacher plus d'un attachement de couleur à un framebuffer, qui est encore à
environ 70% pour le bureau et presque aucun pour les smartphones (cela semble faux).
Fondamentalement, tout appareil qui peut exécuter WebGL2 devrait également supporter
`WEBGL_draw_buffers` dans WebGL1, mais quand même, c'est apparemment encore un problème. Si vous
avez besoin de rendre vers plusieurs textures à la fois, votre page nécessite probablement un
GPU haut de gamme de toute façon. Quand même, vous devriez vérifier si l'appareil de l'utilisateur le supporte et
si non, fournir une explication conviviale.

Pour WebGL1, les 3 extensions suivantes semblent presque universellement supportées, donc bien que
vous puissiez vouloir avertir l'utilisateur que votre page ne va pas fonctionner si elles sont
manquantes, il est probable que cet utilisateur a un appareil extrêmement ancien qui n'allait
pas faire fonctionner votre page de toute façon.

Ce sont `ANGLE_instance_arrays` (la capacité d'utiliser le [dessin instancié](webgl-instanced-drawing.html)),
`OES_vertex_array_object` (la capacité de stocker tout l'état des attributs dans un objet pour pouvoir échanger tout
cet état avec un seul appel de fonction. Voir [ceci](webgl-attributes.html)), et `OES_element_index_uint`
(la capacité d'utiliser des indices 32 bits `UNSIGNED_INT` avec [`drawElements`](webgl-indexed-vertices.html)).

## Emplacements des attributs

Un bug semi-courant est de ne pas rechercher les emplacements des attributs. Par exemple, vous avez un vertex shader comme

```glsl
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = matrix * position;
   v_texcoord = texcoord;
}
```

Votre code suppose que `position` sera l'attribut 0 et `texcoord` sera
l'attribut 1, mais ce n'est pas garanti. Donc ça fonctionne pour vous mais échoue pour quelqu'un
d'autre. Souvent, cela peut être un bug en ce sens que vous n'avez pas fait ça intentionnellement mais
à cause d'une erreur dans le code, les choses fonctionnent quand les emplacements sont d'une façon mais pas
d'une autre.

Il y a 3 solutions.

1. Toujours rechercher les emplacements.
2. Assigner des emplacements en appelant `gl.bindAttribLocation` avant d'appeler `gl.linkProgram`
3. WebGL2 seulement, définir les emplacements dans le shader comme dans

   ```glsl
   #version 300 es
   layout(location = 0) vec4 position;
   latout(location = 1) vec2 texcoord;
   ...
   ```

   La solution 2 semble la plus [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) alors que la solution 3
   semble la plus [W.E.T.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself#DRY_vs_WET_solutions) sauf si
   vous générez vos textures à l'exécution.

## Comportements indéfinis de GLSL

Plusieurs fonctions GLSL ont un comportement indéfini. Par exemple `pow(x, y)` est
indéfini si `x < 0`. Il y a une liste plus longue [en bas de l'article sur
l'éclairage spot](webgl-3d-lighting-spot.html).

## Problèmes de précision des shaders

En 2020, le plus grand problème ici est que si vous utilisez `mediump` ou `lowp` dans vos shaders,
alors sur le bureau le GPU utilisera vraiment `highp`, mais sur mobile ils seront vraiment
`mediump` et/ou `lowp` et vous ne remarquerez donc aucun problème lors du développement sur le bureau.

Voir [cet article pour plus de détails](webgl-precision-issues.html).

## Comportement des points, lignes, viewport, ciseaux

Les `POINTS` et `LINES` dans WebGL peuvent avoir une taille max de 1 et en fait pour les `LINES`,
c'est maintenant la limite la plus courante. De plus, si les points sont découpés quand leur
centre est en dehors du viewport est défini par l'implémentation. Voir le bas de
[cet article](webgl-drawing-without-data.html#pointissues).

De même, si le viewport découpe seulement les sommets ou aussi les pixels est
indéfini. Les ciseaux découpent toujours les pixels donc activez le test des ciseaux et définissez
la taille des ciseaux si vous définissez le viewport plus petit que ce vers quoi vous dessinez
et que vous dessinez des LINES ou POINTS.
