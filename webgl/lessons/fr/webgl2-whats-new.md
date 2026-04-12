Title: Quoi de neuf dans WebGL2
Description: Quoi de neuf dans WebGL2
TOC: Quoi de neuf dans WebGL2


WebGL2 est une mise à niveau assez significative par rapport à WebGL1.
Si vous venez de WebGL1 et que vous voulez savoir
comment adapter votre code pour tirer parti
de WebGL2, [voir cet article](webgl1-to-webgl2.html).

Voici la liste courte dans un ordre quelconque.

## Les Vertex Array Objects sont toujours disponibles

Je pense que c'est assez important même si c'était
optionnellement disponible dans WebGL1. Maintenant qu'ils sont
toujours disponibles dans WebGL2, [je pense que vous devriez probablement
toujours les utiliser](webgl1-to-webgl2.html#Vertex-Array-Objects).

## La taille d'une texture est disponible pour les shaders

Dans WebGL1, si votre shader devait connaître la taille d'une
texture, vous deviez passer la taille manuellement dans un uniform.
Dans WebGL2, vous pouvez appeler

    vec2 size = textureSize(sampler, lod)

pour obtenir la taille de n'importe quel lod d'une texture.

## Recherche directe de texels

Il est souvent pratique de stocker de grands tableaux de données dans une texture.
Dans WebGL 1, vous pouviez faire cela, mais vous ne pouviez adresser les textures
qu'avec des coordonnées de texture (0.0 à 1.0). Dans WebGL2, vous pouvez rechercher
des valeurs d'une texture par coordonnées pixel/texel directement,
rendant l'accès aux tableaux légèrement plus facile :

    vec4 values = texelFetch(sampler, ivec2Position, lod);

## Beaucoup de formats de texture

WebGL1 n'avait que quelques formats de texture. WebGL2 en a ÉNORMÉMENT !

*   `RGBA32I`
*   `RGBA32UI`
*   `RGBA16I`
*   `RGBA16UI`
*   `RGBA8`
*   `RGBA8I`
*   `RGBA8UI`
*   `SRGB8_ALPHA8`
*   `RGB10_A2`
*   `RGB10_A2UI`
*   `RGBA4`
*   `RGB5_A1`
*   `RGB8`
*   `RGB565`
*   `RG32I`
*   `RG32UI`
*   `RG16I`
*   `RG16UI`
*   `RG8`
*   `RG8I`
*   `RG8UI`
*   `R32I`
*   `R32UI`
*   `R16I`
*   `R16UI`
*   `R8`
*   `R8I`
*   `R8UI`
*   `RGBA32F`
*   `RGBA16F`
*   `RGBA8_SNORM`
*   `RGB32F`
*   `RGB32I`
*   `RGB32UI`
*   `RGB16F`
*   `RGB16I`
*   `RGB16UI`
*   `RGB8_SNORM`
*   `RGB8I`
*   `RGB8UI`
*   `SRGB8`
*   `R11F_G11F_B10F`
*   `RGB9_E5`
*   `RG32F`
*   `RG16F`
*   `RG8_SNORM`
*   `R32F`
*   `R16F`
*   `R8_SNORM`
*   `DEPTH_COMPONENT32F`
*   `DEPTH_COMPONENT24`
*   `DEPTH_COMPONENT16`

## Textures 3D

Les textures 3D sont simplement des textures qui ont 3 dimensions.

## Tableaux de textures

Un tableau de textures est très similaire à une texture 3D sauf que
chaque tranche est considérée comme une texture séparée. Toutes les tranches
doivent avoir la même taille, mais c'est une excellente façon de donner
à un shader accès à des centaines de textures même s'il
n'a qu'un nombre relativement petit d'unités de texture. Vous pouvez
sélectionner la tranche dans votre shader :

    vec4 color = texture(someSampler2DArray, vec3(u, v, slice));

## Support des textures Non-Puissance de 2

Dans WebGL1, les textures qui n'étaient pas une puissance de 2 ne pouvaient pas avoir de mips.
Dans WebGL2, cette limite est supprimée. Les textures non-puissance de 2 fonctionnent exactement
de la même façon que les textures puissance de 2.

## Les restrictions de boucle dans les shaders sont supprimées

Dans WebGL1, une boucle dans un shader devait utiliser une expression entière constante.
WebGL2 supprime cette limite (dans GLSL 300 es).

## Fonctions matricielles en GLSL

Dans WebGL1, si vous aviez besoin d'obtenir l'inverse d'une matrice, vous deviez
la passer en tant qu'uniform. Dans WebGL2 GLSL 300 es, il y a la fonction intégrée
`inverse` ainsi que `transpose`.

## Textures compressées communes

Dans WebGL1, il existe divers formats de textures compressées
qui dépendent du matériel. S3TC était essentiellement uniquement pour les ordinateurs de bureau.
PVRTC était uniquement pour iOS, etc.

Dans WebGL2, au moins une suite de formats de textures compressées est supportée.

* WEBGL_compressed_texture_etc ET/OU
* (
  * WEBGL_compressed_texture_s3tc ET
  * WEBGL_compressed_texture_s3tc_srgb ET
  * EXT_texture_compression_rgtc
  
  )

## Uniform Buffer Objects

Les Uniform Buffer Objects vous permettent de spécifier un ensemble d'uniforms
depuis un buffer. Les avantages sont :

1. Vous pouvez manipuler tous les uniforms dans le buffer
   en dehors de WebGL.

   Dans WebGL1, si vous aviez 16 uniforms, cela nécessiterait
   16 appels à `gl.uniformXXX`, ce qui est relativement lent.
   Dans WebGL2, si vous utilisez
   un Uniform Buffer Object, vous pouvez définir les valeurs dans
   un tableau typé entièrement en JavaScript, ce qui est donc
   beaucoup plus rapide. Quand toutes les valeurs sont définies,
   vous les uploadez toutes avec 1 appel à `gl.bufferData`
   ou `gl.bufferSubData`, puis vous dites au programme
   d'utiliser ce buffer avec `gl.bindBufferRange`, donc seulement
   2 appels.

2. Vous pouvez avoir différents ensembles d'Uniform Buffer Objects.

   D'abord quelques termes. Un Uniform Block est une collection
   d'uniforms définis dans un shader. Un Uniform Buffer Object
   est un buffer qui contient les valeurs qu'un Uniform Block
   utilisera. Vous pouvez créer autant d'Uniform Buffer Objects
   que vous voulez et en lier un à un Uniform Block particulier
   lors du dessin.

   Par exemple, vous pourriez avoir 4 blocs uniformes définis
   dans un shader :

   * Un bloc uniform de matrices globales qui contient
     des matrices qui sont les mêmes pour tous les appels de dessin comme la
     matrice de projection, la matrice de vue, etc.

   * Un bloc uniform par modèle qui contient des matrices qui sont
     différentes par modèle. Par exemple, la matrice world et
     la matrice normale.

   * Un bloc uniform de matériau qui contient les paramètres de matériau
     comme diffus, ambiant, spéculaire, etc.

   * Un bloc uniform d'éclairage qui contient les données d'éclairage
     comme la couleur de la lumière, la position de la lumière, etc.

   Ensuite, à l'exécution, vous pourriez créer un Uniform Buffer Object global,
   un Uniform Buffer Object de modèle par modèle, un
   Uniform Buffer Object de lumière par lumière et un Uniform Buffer
   Object par matériau.

   Pour dessiner un élément particulier, en supposant que toutes les valeurs sont
   déjà à jour, tout ce que vous avez à faire est de lier vos 4
   Uniform Buffer Objects désirés :

       gl.bindBufferRange(..., globalBlockIndx, globalMatrixUBO, ...);
       gl.bindBufferRange(..., modelBlockIndx, someModelMatrixUBO, ...);
       gl.bindBufferRange(..., materialBlockIndx, someMaterialSettingsUBO, ...);
       gl.bindBufferRange(..., lightBlockIndx, someLightSettingsUBO, ...);

## Textures entières, attributs et arithmétique

Dans WebGL2, vous pouvez avoir des textures basées sur des entiers alors que
dans WebGL1, toutes les textures représentaient des valeurs à virgule flottante
même si elles n'étaient pas représentées par des valeurs à virgule flottante.

Vous pouvez également avoir des attributs entiers.

De plus, GLSL 300 es vous permet de faire des manipulations de bits
des entiers dans les shaders.

## Transform feedback

WebGL2 permet à votre vertex shader d'écrire ses résultats en retour
dans un buffer.

## Samplers

Dans WebGL1, tous les paramètres de texture étaient par texture.
Dans WebGL2, vous pouvez optionnellement utiliser des objets sampler. Avec
les samplers, tous les paramètres de filtrage et de répétition/clamping
qui faisaient partie d'une texture passent dans le sampler. Cela signifie
qu'une seule texture peut être échantillonnée de différentes façons. En répétant
ou en clampant. Filtrée ou non filtrée.

## Textures de profondeur

Les textures de profondeur étaient optionnelles dans WebGL1 et pénibles à contourner. Maintenant elles sont standard.
Elles sont couramment utilisées pour calculer des shadow maps.

## Dérivées standard

Celles-ci sont maintenant standard. Les utilisations courantes incluent le calcul des normales dans les shaders au lieu de les passer.

## Dessin instancié

C'est maintenant standard. Les utilisations courantes incluent le dessin rapide de nombreux arbres, buissons ou herbes.

## Indices UNSIGNED_INT

Pouvoir utiliser des entiers 32 bits pour les indices supprime la limite de taille de la géométrie indexée.

## Définir `gl_FragDepth`

Vous pouvez écrire vos propres valeurs personnalisées dans le depth buffer / z-buffer.

## Équation de fusion MIN / MAX

Vous êtes maintenant capable de prendre le minimum ou le maximum de 2 couleurs lors du blending.

## Plusieurs Draw Buffers

Vous êtes maintenant capable de dessiner sur plusieurs buffers à la fois depuis un shader. C'est couramment utilisé
pour diverses techniques de rendu différé.

## Accès aux textures dans les vertex shaders

Dans WebGL1, c'était une fonctionnalité optionnelle. Il y avait un compte de combien de textures
vous pouviez accéder dans un vertex shader, et ce compte était autorisé à être 0. La plupart des
appareils les supportaient. Dans WebGL2, ce compte doit être au moins 16.

## Renderbuffers multi-échantillons

Dans WebGL1, le canvas lui-même pouvait être anti-aliasé avec le système multi-échantillon intégré
du GPU, mais il n'y avait pas de support pour le multi-échantillonnage contrôlé par l'utilisateur. Dans WebGL2,
vous pouvez maintenant créer des renderbuffers multi-échantillons.

## Requêtes d'occlusion

Les requêtes d'occlusion vous permettent de demander au GPU de vérifier si des pixels seraient réellement dessinés s'il devait rendre quelque chose.

## Les textures à virgule flottante sont toujours disponibles

Les textures à virgule flottante sont utilisées pour de nombreux effets spéciaux
et calculs. Dans WebGL1, elles étaient optionnelles. Dans WebGL2,
elles existent simplement.

Remarque : Malheureusement, elles sont toujours restreintes en ce que le filtrage
et le rendu vers des textures à virgule flottante sont toujours optionnels. Voir
[`OES_texture_float_linear`](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/)
 et [`EXT_color_buffer_float`](https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/).
