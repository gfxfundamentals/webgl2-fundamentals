Title: WebGL2 Shaders et GLSL
Description: Ce qu'est un shader et ce qu'est GLSL
TOC: Shaders et GLSL


Ceci est la suite de [WebGL2 - Les bases](webgl-fundamentals.html).
Si vous n'avez pas lu comment WebGL fonctionne, vous voudrez peut-être [lire ceci d'abord](webgl-how-it-works.html).

Nous avons parlé des shaders et de GLSL, mais sans entrer dans les détails spécifiques.
Je pensais que ce serait clair par l'exemple, mais essayons de rendre les choses plus claires au cas où.

Comme mentionné dans [comment ça marche](webgl-how-it-works.html), WebGL nécessite 2 shaders à chaque fois que vous
dessinez quelque chose. Un *vertex shader* et un *fragment shader*. Chaque shader est une *fonction*. Un vertex
shader et un fragment shader sont liés ensemble dans un programme shader (ou simplement programme). Une
application WebGL typique aura de nombreux programmes shader.

## Vertex Shader

Le rôle d'un vertex shader est de générer des coordonnées en clip space. Il prend toujours la forme

    #version 300 es
    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

Votre shader est appelé une fois par sommet. À chaque appel, vous devez définir la variable globale spéciale `gl_Position` avec des coordonnées de clip space.

Les vertex shaders ont besoin de données. Ils peuvent obtenir ces données de 3 façons.

1.  [Attributs](#attributes) (données extraites de buffers)
2.  [Uniforms](#uniforms) (valeurs qui restent les mêmes pour tous les sommets d'un seul appel de dessin)
3.  [Textures](#textures-in-vertex-shaders) (données issues des pixels/texels)

### Attributs

La façon la plus courante pour un vertex shader d'obtenir des données est via des buffers et des *attributs*.
[Comment ça marche](webgl-how-it-works.html) a couvert les buffers et
les attributs. Vous créez des buffers,

    var buf = gl.createBuffer();

vous y mettez des données

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

Ensuite, à partir d'un programme shader que vous avez créé, vous cherchez l'emplacement de ses attributs,

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

puis vous indiquez à WebGL comment extraire les données de ces buffers vers l'attribut

    // activer l'extraction de données depuis un buffer pour cet attribut
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;
    var normalize = false;  // laisser les valeurs telles quelles
    var offset = 0;         // commencer au début du buffer
    var stride = 0;         // combien d'octets pour passer au prochain sommet
                            // 0 = utiliser le stride correct pour le type et numComponents

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

Dans [WebGL - Les bases](webgl-fundamentals.html), nous avons montré que nous pouvons ne faire aucun calcul
dans le shader et juste passer les données directement.

    #version 300 es

    in vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

Si nous mettons des sommets en clip space dans nos buffers, cela fonctionnera.

Les attributs peuvent utiliser les types `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, `mat4`,
`int`, `ivec2`, `ivec3`, `ivec4`, `uint`, `uvec2`, `uvec3`, `uvec4`.

### Uniforms

Pour un vertex shader, les uniforms sont des valeurs passées au vertex shader qui restent les mêmes
pour tous les sommets d'un appel de dessin. Comme exemple très simple, nous pourrions ajouter un décalage au
vertex shader ci-dessus

    #version 300 es

    in vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

Et maintenant nous pourrions décaler chaque sommet d'une certaine quantité. D'abord, nous cherchons
l'emplacement de l'uniform

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

Et ensuite, avant de dessiner, nous définissons l'uniform

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // décaler vers la droite de la moitié de l'écran

Les uniforms peuvent être de nombreux types. Pour chaque type, vous devez appeler la fonction correspondante pour le définir.

    gl.uniform1f (floatUniformLoc, v);                 // pour float
    gl.uniform1fv(floatUniformLoc, [v]);               // pour float ou tableau de float
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // pour vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // pour vec2 ou tableau de vec2
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // pour vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // pour vec3 ou tableau de vec3
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // pour vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // pour vec4 ou tableau de vec4

    gl.uniformMatrix2fv(mat2UniformLoc, false, [  tableau de 4 éléments ])  // pour mat2 ou tableau de mat2
    gl.uniformMatrix3fv(mat3UniformLoc, false, [  tableau de 9 éléments ])  // pour mat3 ou tableau de mat3
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ tableau de 16 éléments ])  // pour mat4 ou tableau de mat4

    gl.uniform1i (intUniformLoc,   v);                 // pour int
    gl.uniform1iv(intUniformLoc, [v]);                 // pour int ou tableau de int
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // pour ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // pour ivec2 ou tableau de ivec2
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // pour ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // pour ivec3 ou tableau de ivec3
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // pour ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // pour ivec4 ou tableau de ivec4

    gl.uniform1u (intUniformLoc,   v);                 // pour uint
    gl.uniform1uv(intUniformLoc, [v]);                 // pour uint ou tableau de uint
    gl.uniform2u (ivec2UniformLoc, v0, v1);            // pour uvec2
    gl.uniform2uv(ivec2UniformLoc, [v0, v1]);          // pour uvec2 ou tableau de uvec2
    gl.uniform3u (ivec3UniformLoc, v0, v1, v2);        // pour uvec3
    gl.uniform3uv(ivec3UniformLoc, [v0, v1, v2]);      // pour uvec3 ou tableau de uvec3
    gl.uniform4u (ivec4UniformLoc, v0, v1, v2, v4);    // pour uvec4
    gl.uniform4uv(ivec4UniformLoc, [v0, v1, v2, v4]);  // pour uvec4 ou tableau de uvec4

    // pour sampler2D, sampler3D, samplerCube, samplerCubeShadow, sampler2DShadow,
    // sampler2DArray, sampler2DArrayShadow
    gl.uniform1i (samplerUniformLoc,   v);
    gl.uniform1iv(samplerUniformLoc, [v]);

Il existe aussi les types `bool`, `bvec2`, `bvec3`, et `bvec4`. Ils utilisent soit les fonctions `gl.uniform?f?`, `gl.uniform?i?`,
soit `gl.uniform?u?`.

Notez que pour un tableau, vous pouvez définir tous les uniforms du tableau en une seule fois. Par exemple

    // dans le shader
    uniform vec2 u_someVec2[3];

    // en JavaScript lors de l'initialisation
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // lors du rendu
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // définir tout le tableau u_someVec2

Mais si vous voulez définir des éléments individuels du tableau, vous devez chercher l'emplacement de
chaque élément individuellement.

    // en JavaScript lors de l'initialisation
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // lors du rendu
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // définir l'élément 0
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // définir l'élément 1
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // définir l'élément 2

De même si vous créez une struct

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

vous devez chercher chaque champ individuellement

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### Textures dans les Vertex Shaders

Voir [Textures dans les Fragment Shaders](#textures-in-fragment-shaders).

## Fragment Shader

Le rôle d'un fragment shader est de fournir une couleur pour le pixel en cours de rastérisation.
Il prend toujours la forme

    #version 300 es
    precision highp float;

    out vec4 outColor;  // vous pouvez choisir n'importe quel nom

    void main() {
       outColor = doMathToMakeAColor;
    }

Votre fragment shader est appelé une fois par pixel. À chaque appel, vous devez
définir votre variable de sortie avec une couleur.

Les fragment shaders ont besoin de données. Ils peuvent obtenir des données de 3 façons

1.  [Uniforms](#uniforms) (valeurs qui restent les mêmes pour chaque pixel d'un seul appel de dessin)
2.  [Textures](#textures-in-fragment-shaders) (données issues des pixels/texels)
3.  [Varyings](#varyings) (données passées depuis le vertex shader et interpolées)

### Uniforms dans les Fragment Shaders

Voir [Uniforms dans les Vertex Shaders](#uniforms).

### Textures dans les Fragment Shaders

Pour obtenir une valeur d'une texture dans un shader, nous créons un uniform `sampler2D` et utilisons la fonction GLSL
`texture` pour en extraire une valeur.

    precision highp float;

    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5);  // obtenir une valeur au centre de la texture
       outColor = texture(u_texture, texcoord);
    }

Les données issues de la texture [dépendent de nombreux réglages](webgl-3d-textures.html).
Au minimum, nous devons créer une texture et y mettre des données, par exemple

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var internalFormat = gl.RGBA,
    var width = 2;
    var height = 1;
    var border = 0; // DOIT TOUJOURS ÊTRE ZÉRO
    var format = gl.RGBA;
    var type = gl.UNSIGNED_BYTE;
    var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D,
                  level,
                  internalFormat,
                  width,
                  height,
                  border,
                  format,
                  type,
                  data);

Définir le filtrage

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

Puis chercher l'emplacement de l'uniform dans le programme shader

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

WebGL vous demande ensuite de la lier à une unité de texture

    var unit = 5;  // Choisir une unité de texture
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

Et indiquer au shader à quelle unité vous avez lié la texture

    gl.uniform1i(someSamplerLoc, unit);

### Varyings

Un varying est un moyen de passer une valeur d'un vertex shader à un fragment shader, ce que nous avons
couvert dans [comment ça marche](webgl-how-it-works.html).

Pour utiliser un varying, nous devons déclarer des varyings correspondants dans les deux shaders, vertex et fragment.
Nous définissons le varying *out* dans le vertex shader avec une valeur par sommet. Quand WebGL dessine les pixels,
il interpolera optionnellement entre ces valeurs et les passera au varying *in* correspondant dans le fragment shader.

Vertex shader

    #version 300 es

    in vec4 a_position;

    uniform vec4 u_offset;

    +out vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

Fragment shader

    #version 300 es
    precision highp float;

    +in vec4 v_positionWithOffset;

    out vec4 outColor;

    void main() {
    +  // convertir du clip space (-1 <-> +1) vers l'espace couleur (0 -> 1).
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5;
    +  outColor = color;
    }

L'exemple ci-dessus est en grande partie un exemple artificiel. Il n'a généralement pas de sens de
copier directement les valeurs de clip space vers le fragment shader et de les utiliser comme couleurs. Néanmoins
cela fonctionnera et produira des couleurs.

## GLSL

GLSL signifie [Graphics Library Shader Language](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf).
C'est le langage dans lequel les shaders sont écrits.
Il possède quelques fonctionnalités semi-uniques qui ne sont certainement pas communes en JavaScript.
Il est conçu pour effectuer les calculs mathématiques généralement nécessaires au rendu graphique par rastérisation.
Ainsi, il possède par exemple des types intégrés comme `vec2`, `vec3`, et `vec4` qui représentent
respectivement 2 valeurs, 3 valeurs et 4 valeurs. De même, il possède `mat2`, `mat3`
et `mat4` qui représentent des matrices 2x2, 3x3 et 4x4. Vous pouvez par exemple multiplier
un `vec` par un scalaire.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b vaut maintenant vec4(2, 4, 6, 8);

De même, il peut effectuer des multiplications de matrices et de vecteurs par des matrices

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

Il possède également divers sélecteurs pour les parties d'un vec. Pour un vec4

    vec4 v;

*   `v.x` est identique à `v.s`, `v.r` et `v[0]`.
*   `v.y` est identique à `v.t`, `v.g` et `v[1]`.
*   `v.z` est identique à `v.p`, `v.b` et `v[2]`.
*   `v.w` est identique à `v.q`, `v.a` et `v[3]`.

Il est capable de *swizzler* les composants d'un vec, ce qui signifie que vous pouvez échanger ou répéter des composants.

    v.yyyy

est identique à

    vec4(v.y, v.y, v.y, v.y)

De même

    v.bgra

est identique à

    vec4(v.b, v.g, v.r, v.a)

Lors de la construction d'un vec ou d'une mat, vous pouvez fournir plusieurs parties à la fois. Par exemple

    vec4(v.rgb, 1)

est identique à

    vec4(v.r, v.g, v.b, 1)

Une chose sur laquelle vous risquez de buter est que GLSL est très strict sur les types.

    float f = 1;  // ERREUR : 1 est un int. Vous ne pouvez pas assigner un int à un float

La façon correcte est l'une des suivantes

    float f = 1.0;      // utiliser un float
    float f = float(1)  // caster l'entier en float

L'exemple ci-dessus de `vec4(v.rgb, 1)` ne se plaint pas du `1` car `vec4` caste
les éléments en interne, tout comme `float(1)`.

GLSL possède un grand nombre de fonctions intégrées. Beaucoup d'entre elles opèrent sur plusieurs composants à la fois.
Par exemple

    T sin(T angle)

signifie que T peut être `float`, `vec2`, `vec3` ou `vec4`. Si vous passez un `vec4`, vous obtenez un `vec4` en retour
qui est le sinus de chacun des composants. En d'autres termes, si `v` est un `vec4`, alors

    vec4 s = sin(v);

est identique à

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

Parfois, un argument est un float et les autres sont de type `T`. Cela signifie que le float sera appliqué
à tous les composants. Par exemple, si `v1` et `v2` sont des `vec4` et `f` est un float, alors

    vec4 m = mix(v1, v2, f);

est identique à

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

Vous pouvez voir une liste de toutes les fonctions GLSL dans les 3 dernières pages de la [carte de référence OpenGL ES 3.0](https://www.khronos.org/files/opengles3-quick-reference-card.pdf).
Si vous appréciez les documents techniques très détaillés, vous pouvez consulter
[la spécification GLSL ES 3.00](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf).

## Tout assembler

C'est le but de toute cette série d'articles. WebGL consiste à créer divers shaders, à fournir
des données à ces shaders, puis à appeler `gl.drawArrays`, `gl.drawElements`, etc. pour que WebGL traite
les sommets en appelant le vertex shader courant pour chaque sommet, puis rende les pixels en appelant le fragment shader courant pour chaque pixel.

La création réelle des shaders nécessite plusieurs lignes de code. Comme ces lignes sont les mêmes dans
la plupart des programmes WebGL, et qu'une fois écrites vous pouvez pratiquement les ignorer, [comment compiler des shaders GLSL
et les lier dans un programme shader est expliqué ici](webgl-boilerplate.html).

Si vous commencez depuis ici, vous pouvez aller dans 2 directions. Si vous êtes intéressé par le traitement d'images,
je vous montrerai [comment faire du traitement d'images 2D](webgl-image-processing.html).
Si vous êtes intéressé par l'apprentissage de la translation,
de la rotation et de la mise à l'échelle, [commencez ici](webgl-2d-translation.html).
