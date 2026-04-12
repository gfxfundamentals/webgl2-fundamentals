Title: WebGL2 depuis WebGL1
Description: Comment passer de WebGL1 à WebGL2
TOC: Passer de WebGL1 à WebGL2


WebGL2 est **quasiment** 100% rétrocompatible avec WebGL1.
Si vous n'utilisez que des fonctionnalités WebGL1, il n'y a alors
que 2 différences **majeures**.

1.  Vous utilisez `"webgl2"` au lieu de `"webgl"` lors de l'appel à `getContext`.

        var gl = someCanvas.getContext("webgl2");

    Remarque : il n'y a pas d'"experimental-webgl2". Les vendeurs de navigateurs se sont
    réunis et ont décidé de ne pas continuer à préfixer les choses car les sites web
    deviennent dépendants du préfixe.

2.  De nombreuses extensions font désormais partie intégrante de WebGL2 et ne sont donc plus disponibles
    en tant qu'extensions.

    Par exemple, les Vertex Array Objects `OES_vertex_array_object` sont une
    fonctionnalité standard de WebGL2. Donc par exemple dans WebGL1, vous feriez ceci

        var ext = gl.getExtension("OES_vertex_array_object");
        if (!ext) {
          // dire à l'utilisateur qu'il n'a pas l'extension requise ou la contourner
        } else {
          var someVAO = ext.createVertexArrayOES();
        }

    Dans WebGL2, vous feriez ceci

        var someVAO = gl.createVertexArray();

    Parce que ça existe simplement.

Cela dit, pour tirer parti de la plupart des fonctionnalités de WebGL2, vous devrez apporter
quelques modifications.

## Passer à GLSL 300 es

Le plus grand changement est que vous devriez mettre à niveau vos shaders en GLSL 3.00 ES. Pour ce faire,
la première ligne de vos shaders doit être

    #version 300 es

**REMARQUE : CELA DOIT ÊTRE LA PREMIÈRE LIGNE ! Aucun commentaire et aucune ligne vide avant n'est autorisé.**

En d'autres termes, ceci est mauvais

    // MAUVAIS!!!!              +---Il y a une nouvelle ligne ici !
    // MAUVAIS!!!!              V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

Ceci est également mauvais

    <!-- MAUVAIS!!                 V<- il y a une nouvelle ligne ici
    <script id="vs" type="notjs">
    #version 300 es
    ...
    </script>

Ceci est bon

    var vertexShaderSource = `#version 300 es
    ...
    `;

Ceci est bon aussi

    <script id="vs" type="notjs">#version 300 es
    ...
    </script>

Ou vous pourriez faire en sorte que vos fonctions de compilation de shader suppriment
les premières lignes vides.

### Changements dans GLSL 300 es par rapport à GLSL 100

Il y a plusieurs changements que vous devrez apporter à vos shaders
en plus d'ajouter la chaîne de version ci-dessus.

#### `attribute` -> `in`

Dans GLSL 100, vous pourriez avoir

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec3 a_normal;

Dans GLSL 300 es, cela devient

    in vec4 a_position;
    in vec2 a_texcoord;
    in vec3 a_normal;

#### `varying` vers `in` / `out`

Dans GLSL 100, vous pourriez déclarer un varying à la fois dans le vertex
et le fragment shader comme ceci

    varying vec2 v_texcoord;
    varying vec3 v_normal;

Dans GLSL 300 es, dans le vertex shader, les varyings deviennent

    out vec2 v_texcoord;
    out vec3 v_normal;

Et dans le fragment shader, ils deviennent

    in vec2 v_texcoord;
    in vec3 v_normal;

#### Plus de `gl_FragColor`

Dans GLSL 100, votre fragment shader définirait la variable spéciale
`gl_FragColor` pour définir la sortie du shader.

    gl_FragColor = vec4(1, 0, 0, 1);  // rouge

Dans GLSL 300 es, vous déclarez votre propre variable de sortie et
vous la définissez.

    out vec4 myOutputColor;

    void main() {
       myOutputColor = vec4(1, 0, 0, 1);  // rouge
    }

Remarque : Vous pouvez choisir n'importe quel nom, mais les noms **ne peuvent pas** commencer par
`gl_`, donc vous ne pouvez pas simplement faire `out vec4 gl_FragColor`.

#### `texture2D` -> `texture` etc.

Dans GLSL 100, vous obteniez une couleur d'une texture comme ceci

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture2D(u_some2DTexture, ...);
    vec4 color2 = textureCube(u_someCubeTexture, ...);

Dans GLSL 300 es, les fonctions de texture savent automatiquement
quoi faire en fonction du type de sampler. Donc maintenant, c'est juste
`texture`

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture(u_some2DTexture, ...);
    vec4 color2 = texture(u_someCubeTexture, ...);

## Fonctionnalités que vous pouvez tenir pour acquises

Dans WebGL1, de nombreuses fonctionnalités étaient des extensions optionnelles. Dans WebGL2,
toutes les fonctionnalités suivantes sont des fonctionnalités standard :

* Textures de profondeur ([WEBGL_depth_texture](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/))
* Textures à virgule flottante ([OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/)/[OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/))
* Textures à demi-virgule flottante ([OES_texture_half_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/)/[OES_texture_half_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float_linear/))
* Vertex Array Objects ([OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/))
* Dérivées standard ([OES_standard_derivatives](https://www.khronos.org/registry/webgl/extensions/OES_standard_derivatives/))
* Dessin instancié ([ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/))
* Indices UNSIGNED_INT ([OES_element_index_uint](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/))
* Définir `gl_FragDepth` ([EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/))
* Équation de fusion MIN/MAX ([EXT_blend_minmax](https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/))
* Accès direct au LOD de texture ([EXT_shader_texture_lod](https://www.khronos.org/registry/webgl/extensions/EXT_shader_texture_lod/))
* Multiple Draw Buffers ([WEBGL_draw_buffers](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/))
* Support sRGB pour les textures et framebuffer objects ([EXT_sRGB](https://www.khronos.org/registry/webgl/extensions/EXT_sRGB/))
* N'importe quel niveau d'une texture peut être attaché à un framebuffer object ([OES_fbo_render_mipmap](https://www.khronos.org/registry/webgl/extensions/OES_fbo_render_mipmap/))
* Accès aux textures dans les vertex shaders

## Support des textures Non-Puissance de 2

Dans WebGL1, les textures qui n'étaient pas une puissance de 2 ne pouvaient pas avoir de mips.
Dans WebGL2, cette limite est supprimée. Les textures non-puissance de 2 fonctionnent exactement
de la même façon que les textures puissance de 2.

## Attachements de Framebuffer à virgule flottante

Dans WebGL1, pour vérifier le support du rendu vers une texture à virgule flottante,
vous deviez d'abord vérifier et activer l'extension `OES_texture_float`, puis
créer une texture à virgule flottante, l'attacher à un framebuffer, et appeler
`gl.checkFramebufferStatus` pour voir si elle retournait `gl.FRAMEBUFFER_COMPLETE`.

Dans WebGL2, vous devez vérifier et activer `EXT_color_buffer_float` sinon
`gl.checkFramebufferStatus` ne retournera jamais `gl.FRAMEBUFFER_COMPLETE` pour
une texture à virgule flottante.

Notez que c'est également vrai pour les attachements de framebuffer `HALF_FLOAT`.

> Si vous êtes curieux, c'était un *bug* dans la spécification WebGL1. Ce qui s'est passé, c'est que WebGL1
> a été livré et `OES_texture_float` a été ajouté, et on a simplement supposé que la façon correcte
> de l'utiliser pour le rendu était de créer une texture, de l'attacher à un framebuffer,
> et de vérifier son statut. Plus tard, quelqu'un a signalé que selon la spécification, ce n'était
> pas suffisant car la spécification dit que les couleurs écrites dans un fragment shader sont
> toujours clampées entre 0 et 1. `EXT_color_buffer_float` supprime cette restriction de clampage,
> mais comme WebGL avait déjà été livré depuis environ un an ou plus,
> cela aurait cassé de nombreux sites web d'imposer la restriction. Pour WebGL2,
> ils ont pu le corriger et donc maintenant vous devez activer `EXT_color_buffer_float`
> pour utiliser des textures à virgule flottante comme attachements de framebuffer.
>
> REMARQUE : À ma connaissance, en mars 2017, très peu d'appareils mobiles supportaient le rendu vers
> des textures à virgule flottante.

## Vertex Array Objects

De toutes les fonctionnalités ci-dessus, la seule fonctionnalité que je pense personnellement que vous devriez
toujours TOUJOURS utiliser est les Vertex Array Objects. Tout le reste dépend vraiment
de ce que vous essayez de faire, mais les Vertex Array Objects en particulier
semblent être une fonctionnalité de base qui devrait toujours être utilisée.

Dans WebGL1 sans Vertex Array Objects, toutes les données sur les attributs
étaient des états WebGL globaux. Vous pouvez l'imaginer comme ceci

    var glState = {
      attributeState: {
        ELEMENT_ARRAY_BUFFER: null,
        attributes: [
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
        ],
      },
    }

L'appel de fonctions comme `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`, et
`gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ??)` affecterait cet état global.
Avant chaque chose que vous vouliez dessiner, vous deviez configurer tous les attributs, et si vous
dessiniez des données indexées, vous deviez définir l'`ELEMENT_ARRAY_BUFFER`.

Avec les Vertex Array Objects, tout l'`attributeState` ci-dessus devient un *Vertex Array*.

En d'autres termes

    var someVAO = gl.createVertexArray();

Crée une nouvelle instance de la chose ci-dessus appelée `attributeState`.

    gl.bindVertexArray(someVAO);

C'est équivalent à

    glState.attributeState = someVAO;

Ce que cela signifie, c'est que vous devriez configurer tous vos attributs au moment de l'initialisation maintenant.

    // à l'initialisation
    for each model / geometry / ...
      var vao = gl.createVertexArray()
      gl.bindVertexArray(vao);
      for each attribute
        gl.enableVertexAttribArray(...);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferForAttribute);
        gl.vertexAttribPointer(...);
      if indexed geometry
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);

Puis au moment du rendu, pour utiliser une géométrie particulière, tout ce que vous avez à faire
est

    gl.bindVertexArray(vaoForGeometry);

Dans WebGL1, la boucle d'initialisation ci-dessus serait apparue au moment du rendu.
C'est une ÉNORME accélération !

Il y a cependant quelques mises en garde :

1.  Les emplacements d'attributs dépendent du programme.

    Si vous allez utiliser la même géométrie avec plusieurs
    programmes, pensez à assigner manuellement les emplacements d'attributs.
    Dans GLSL 300 es, vous pouvez le faire dans le shader.

    Par exemple :

        layout(location = 0) in vec4 a_position;
        layout(location = 1) in vec2 a_texcoord;
        layout(location = 2) in vec3 a_normal;
        layout(location = 3) in vec4 a_color;

    Définit les emplacements des 4 attributs.

    Vous pouvez également toujours le faire à la manière WebGL1 en appelant
    `gl.bindAttribLocation` avant d'appeler `gl.linkProgram`.

    Par exemple :

        gl.bindAttribLocation(someProgram, 0, "a_position");
        gl.bindAttribLocation(someProgram, 1, "a_texcoord");
        gl.bindAttribLocation(someProgram, 2, "a_normal");
        gl.bindAttribLocation(someProgram, 3, "a_color");

    Cela signifie que vous pouvez les forcer à être compatibles entre plusieurs programmes shader.
    Si un programme n'a pas besoin de tous les attributs,
    les attributs dont il a besoin seront toujours assignés aux
    mêmes emplacements.

    Si vous ne faites pas cela, vous aurez besoin de VAOs différents pour
    différents programmes shader lors de l'utilisation de la même géométrie OU
    vous devrez juste faire la chose WebGL1 et ne pas utiliser
    de VAOs et toujours configurer les attributs au moment du rendu, ce qui est lent.

    REMARQUE : des 2 méthodes ci-dessus, je penche vers l'utilisation de
    `gl.bindAttribLocation` car il est facile de l'avoir en un seul
    endroit dans mon code alors que la méthode utilisant `layout(location = ?)` doit
    être dans tous les shaders, donc dans l'intérêt de D.R.Y., `gl.bindAttribLocation`
    semble meilleur. Peut-être si j'utilisais un générateur de shader il n'y aurait aucune différence.

2.  Toujours délier le VAO quand vous avez terminé

        gl.bindVertexArray(null);

    Cela vient simplement de ma propre expérience. Si vous regardez ci-dessus,
    l'état `ELEMENT_ARRAY_BUFFER` fait partie d'un Vertex Array.

    Donc, j'ai rencontré ce problème. J'ai créé de la géométrie, puis
    j'ai créé un VAO pour cette géométrie et configuré les attributs
    et l'`ELEMENT_ARRAY_BUFFER`. J'ai ensuite créé de la
    géométrie supplémentaire. Quand cette géométrie configurait ses indices, parce que
    j'avais toujours le VAO précédent lié lors de la configuration, les indices
    affectaient le binding `ELEMENT_ARRAY_BUFFER` pour le VAO précédent.
    Il m'a fallu plusieurs heures pour déboguer.

    Donc ma suggestion est de ne jamais laisser un VAO lié quand vous avez fini
    avec lui. Soit liez immédiatement le prochain VAO que vous allez
    utiliser, soit liez `null` si vous avez terminé.

Comme mentionné au début, de nombreuses extensions de WebGL1 sont des fonctionnalités standard
de WebGL2, donc si vous utilisiez des extensions dans WebGL1, vous devrez
changer votre code pour ne pas les utiliser en tant qu'extensions dans WebGL2. Voir ci-dessous.

Deux nécessitent une attention particulière :

1. `OES_texture_float` et les textures à virgule flottante.

    Les textures à virgule flottante sont une fonctionnalité standard de WebGL2 mais :

    * Être capable de filtrer les textures à virgule flottante est toujours une extension : `OES_texture_float_linear`.

    * Être capable de rendre vers une texture à virgule flottante est une extension : `EXT_color_buffer_float`.

    * Créer une texture à virgule flottante est différent. Vous devez utiliser l'un des nouveaux formats internes WebGL2
      comme `RGBA32F`, `R32F`, etc. C'est différent de l'extension WebGL1 `OES_texture_float`
      où le format interne était déduit du `type` passé à `texImage2D`.

2. `WEBGL_depth_texture` et les textures de profondeur.

    Similaire à la différence précédente, pour créer une texture de profondeur dans WebGL2, vous devez utiliser l'un
    des formats internes de WebGL2 : `DEPTH_COMPONENT16`, `DEPTH_COMPONENT24`,
    `DEPTH_COMPONENT32F`, `DEPTH24_STENCIL8`, ou `DEPTH32F_STENCIL8`, alors que l'extension WebGL1
    `WEBGL_depth_texture` utilisait `DEPTH_COMPONENT` et `DEPTH_STENCIL_COMPONENT`.

C'est ma courte liste personnelle des choses à surveiller lors du passage
de WebGL1 à WebGL2. [Il y a encore plus de choses que vous pouvez faire dans WebGL2, cependant](webgl2-whats-new.html).

<div class="webgl_bottombar">
<h3>Rendre les extensions WebGL1 compatibles avec WebGL2</h3>
<p>Les fonctions qui étaient sur des extensions dans WebGL1 sont maintenant sur le
contexte principal dans WebGL2. Par exemple dans WebGL</p>
<pre class="prettyprint">
var ext = gl.getExtension("OES_vertex_array_object");
if (!ext) {
  // dire à l'utilisateur qu'il n'a pas l'extension requise ou la contourner
} else {
  var someVAO = ext.createVertexArrayOES();
}
</pre>
<p>
vs dans webgl2
</p>
<pre class="prettyprint">
var someVAO = gl.createVertexArray();
</pre>
<p>Comme vous pouvez le voir, si vous voulez que votre code fonctionne à la fois dans WebGL1 et WebGL2, cela
peut présenter quelques défis.</p>
<p>Une solution de contournement serait de copier les extensions WebGL1 dans le contexte WebGL à l'initialisation.
De cette façon, le reste de votre code peut rester le même. Exemple :</p>
<pre class="prettyprint">{{#escapehtml}}
const gl = someCanvas.getContext("webgl");
const haveVAOs = getAndApplyExtension(gl, "OES_vertex_array_object");

function getAndApplyExtension(gl, name) {
  const ext = gl.getExtension(name);
  if (!ext) {
    return null;
  }
  const fnSuffix = name.split("_")[0];
  const enumSuffix = '_' + fnSuffix;
  for (const key in ext) {
    const value = ext[key];
    const isFunc = typeof (value) === 'function';
    const suffix = isFunc ? fnSuffix : enumSuffix;
    let name = key;
    // examples of where this is not true are WEBGL_compressed_texture_s3tc
    // and WEBGL_compressed_texture_pvrtc
    if (key.endsWith(suffix)) {
      name = key.substring(0, key.length - suffix.length);
    }
    if (gl[name] !== undefined) {
      if (!isFunc && gl[name] !== value) {
        console.warn("conflict:", name, gl[name], value, key);
      }
    } else {
      if (isFunc) {
        gl[name] = function(origFn) {
          return function() {
            return origFn.apply(ext, arguments);
          };
        }(value);
      } else {
        gl[name] = value;
      }
    }
  }
  return ext;
}
{{/escapehtml}}</pre>
<p>Maintenant votre code peut surtout fonctionner de la même façon sur les deux. Exemple :</p>
<pre class="prettyprint">{{#escapehtml}}
if (haveVAOs) {
  var someVAO = gl.createVertexArray();
  ...
} else {
  ... faire ce qu'il faut sans VAOs.
}
{{/escapehtml}}</pre>
<p>L'alternative serait de devoir faire quelque chose comme ceci</p>
<pre class="prettyprint">{{#escapehtml}}
if (haveVAOs) {
  if (isWebGL2)
     someVAO = gl.createVertexArray();
  } else {
     someVAO = vaoExt.createVertexArrayOES();
  }
  ...
} else {
  ... faire ce qu'il faut sans VAOs.
}
{{/escapehtml}}</pre>
<p>Remarque : Dans le cas des Vertex Array Objects en particulier, je suggère d'<a href="https://github.com/greggman/oes-vertex-array-object-polyfill">utiliser un polyfill</a>
pour les avoir partout. Les VAOs sont disponibles sur la plupart des systèmes. Sur ces quelques systèmes
où ils ne sont pas disponibles, le polyfill s'en occupera pour vous, et votre code
peut rester simple.</p>
</div>
