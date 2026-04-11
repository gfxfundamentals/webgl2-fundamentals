Title: WebGL2 - Moins de code, plus de plaisir
Description: Des façons de rendre la programmation WebGL moins verbeuse
TOC: Moins de code, plus de plaisir


Cet article est la suite d'une série d'articles sur WebGL.
Le premier [commence par les bases](webgl-fundamentals.html).
Si vous ne les avez pas lus, veuillez les consulter d'abord.

Les programmes WebGL nécessitent que vous écriviez des programmes shader que vous devez compiler et lier, puis
vous devez rechercher les emplacements des entrées de ces programmes shader. Ces entrées sont appelées
uniforms et attributs, et le code nécessaire pour rechercher leurs emplacements peut être laborieux et fastidieux.

Supposons que nous ayons le <a href="webgl-boilerplate.html">code WebGL classique pour
compiler et lier les programmes shader</a>. Étant donné un ensemble de shaders comme celui-ci.

Vertex shader :

```
#version 300 es

uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

out vec4 v_position;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
}
```

Fragment shader :

```
#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

out vec4 outColor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  outColor = vec4((
    u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
    diffuseColor.a);
}
```

Vous vous retrouveriez à devoir écrire du code comme celui-ci pour rechercher et définir toutes les différentes valeurs pour dessiner.

```
// Au moment de l'initialisation
var u_worldViewProjectionLoc   = gl.getUniformLocation(program, "u_worldViewProjection");
var u_lightWorldPosLoc         = gl.getUniformLocation(program, "u_lightWorldPos");
var u_worldLoc                 = gl.getUniformLocation(program, "u_world");
var u_viewInverseLoc           = gl.getUniformLocation(program, "u_viewInverse");
var u_worldInverseTransposeLoc = gl.getUniformLocation(program, "u_worldInverseTranspose");
var u_lightColorLoc            = gl.getUniformLocation(program, "u_lightColor");
var u_ambientLoc               = gl.getUniformLocation(program, "u_ambient");
var u_diffuseLoc               = gl.getUniformLocation(program, "u_diffuse");
var u_specularLoc              = gl.getUniformLocation(program, "u_specular");
var u_shininessLoc             = gl.getUniformLocation(program, "u_shininess");
var u_specularFactorLoc        = gl.getUniformLocation(program, "u_specularFactor");

var a_positionLoc              = gl.getAttribLocation(program, "a_position");
var a_normalLoc                = gl.getAttribLocation(program, "a_normal");
var a_texCoordLoc              = gl.getAttribLocation(program, "a_texcoord");

// Configurer tous les buffers et attributs (en supposant que vous avez déjà créé les buffers)
var vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(a_positionLoc);
gl.vertexAttribPointer(a_positionLoc, positionNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.enableVertexAttribArray(a_normalLoc);
gl.vertexAttribPointer(a_normalLoc, normalNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.enableVertexAttribArray(a_texcoordLoc);
gl.vertexAttribPointer(a_texcoordLoc, texcoordNumComponents, gl.FLOAT, false, 0, 0);

// Au moment de l'initialisation ou du rendu selon l'utilisation.
var someWorldViewProjectionMat = computeWorldViewProjectionMatrix();
var lightWorldPos              = [100, 200, 300];
var worldMat                   = computeWorldMatrix();
var viewInverseMat             = computeInverseViewMatrix();
var worldInverseTransposeMat   = computeWorldInverseTransposeMatrix();
var lightColor                 = [1, 1, 1, 1];
var ambientColor               = [0.1, 0.1, 0.1, 1];
var diffuseTextureUnit         = 0;
var specularColor              = [1, 1, 1, 1];
var shininess                  = 60;
var specularFactor             = 1;

// Au moment du rendu
gl.useProgram(program);
gl.bindVertexArray(vao);

// Configurer les textures utilisées
gl.activeTexture(gl.TEXTURE0 + diffuseTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);

// Définir tous les uniforms.
gl.uniformMatrix4fv(u_worldViewProjectionLoc, false, someWorldViewProjectionMat);
gl.uniform3fv(u_lightWorldPosLoc, lightWorldPos);
gl.uniformMatrix4fv(u_worldLoc, worldMat);
gl.uniformMatrix4fv(u_viewInverseLoc, viewInverseMat);
gl.uniformMatrix4fv(u_worldInverseTransposeLoc, worldInverseTransposeMat);
gl.uniform4fv(u_lightColorLoc, lightColor);
gl.uniform4fv(u_ambientLoc, ambientColor);
gl.uniform1i(u_diffuseLoc, diffuseTextureUnit);
gl.uniform4fv(u_specularLoc, specularColor);
gl.uniform1f(u_shininessLoc, shininess);
gl.uniform1f(u_specularFactorLoc, specularFactor);

gl.drawArrays(...);
```

C'est beaucoup de frappe.

Il existe de nombreuses façons de simplifier cela. Une suggestion est de demander à WebGL de nous dire tous
les uniforms, attributs et leurs emplacements, puis de configurer des fonctions pour les définir pour nous.
On peut alors passer des objets JavaScript pour définir nos paramètres beaucoup plus facilement.
Si ça n'est pas clair, voici à quoi ressemblerait notre code

```
// Au moment de l'initialisation
var uniformSetters = twgl.createUniformSetters(gl, program);
var attribSetters  = twgl.createAttributeSetters(gl, program);

// Configurer tous les buffers et attributs
var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};
var vao = twgl.createVAOAndSetAttributes(
    gl, attribSetters, attribs);

// Au moment de l'initialisation ou du rendu selon l'utilisation.
var uniforms = {
  u_worldViewProjection:   computeWorldViewProjectionMatrix(...),
  u_lightWorldPos:         [100, 200, 300],
  u_world:                 computeWorldMatrix(),
  u_viewInverse:           computeInverseViewMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
  u_lightColor:            [1, 1, 1, 1],
  u_ambient:               [0.1, 0.1, 0.1, 1],
  u_diffuse:               diffuseTexture,
  u_specular:              [1, 1, 1, 1],
  u_shininess:             60,
  u_specularFactor:        1,
};

// Au moment du rendu
gl.useProgram(program);

// Lier le VAO qui a tous nos buffers et paramètres d'attributs
gl.bindAttribArray(vao);

// Définir tous les uniforms et textures utilisés.
twgl.setUniforms(uniformSetters, uniforms);

gl.drawArrays(...);
```

Ça me semble nettement plus petit, plus facile et avec moins de code.

Vous pouvez même utiliser plusieurs objets JavaScript pour les uniforms si ça vous convient. Par exemple

```
// Au moment de l'initialisation
var uniformSetters = twgl.createUniformSetters(gl, program);
var attribSetters  = twgl.createAttributeSetters(gl, program);

// Configurer tous les buffers et attributs
var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};
var vao = twgl.createVAOAndSetAttributes(gl, attribSetters, attribs);

// Au moment de l'initialisation ou du rendu
var uniformsThatAreTheSameForAllObjects = {
  u_lightWorldPos:         [100, 200, 300],
  u_viewInverse:           computeInverseViewMatrix(),
  u_lightColor:            [1, 1, 1, 1],
};

var uniformsThatAreComputedForEachObject = {
  u_worldViewProjection:   perspective(...),
  u_world:                 computeWorldMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
};

var objects = [
  { translation: [10, 50, 100],
    materialUniforms: {
      u_ambient:               [0.1, 0.1, 0.1, 1],
      u_diffuse:               diffuseTexture,
      u_specular:              [1, 1, 1, 1],
      u_shininess:             60,
      u_specularFactor:        1,
    },
  },
  { translation: [-120, 20, 44],
    materialUniforms: {
      u_ambient:               [0.1, 0.2, 0.1, 1],
      u_diffuse:               someOtherDiffuseTexture,
      u_specular:              [1, 1, 0, 1],
      u_shininess:             30,
      u_specularFactor:        0.5,
    },
  },
  { translation: [200, -23, -78],
    materialUniforms: {
      u_ambient:               [0.2, 0.2, 0.1, 1],
      u_diffuse:               yetAnotherDiffuseTexture,
      u_specular:              [1, 0, 0, 1],
      u_shininess:             45,
      u_specularFactor:        0.7,
    },
  },
];

// Au moment du rendu
gl.useProgram(program);

// Configurer les parties communes à tous les objets

// Lier le VAO qui a tous nos buffers et paramètres d'attributs
gl.bindAttribArray(vao);
twgl.setUniforms(uniformSetters, uniformThatAreTheSameForAllObjects);

objects.forEach(function(object) {
  computeMatricesForObject(object, uniformsThatAreComputedForEachObject);
  twgl.setUniforms(uniformSetters, uniformThatAreComputedForEachObject);
  twgl.setUniforms(uniformSetters, objects.materialUniforms);
  gl.drawArrays(...);
});
```

Voici un exemple utilisant ces fonctions helpers

{{{example url="../webgl-less-code-more-fun.html" }}}

Allons un tout petit peu plus loin. Dans le code ci-dessus, nous avons configuré une variable `attribs` avec les buffers que nous avons créés.
Le code pour configurer ces buffers n'est pas montré. Par exemple, si vous voulez créer des positions, normales et coordonnées de
texture, vous pourriez avoir besoin de code comme celui-ci

    // un seul triangle
    var positions = [0, -10, 0, 10, 10, 0, -10, 10, 0];
    var texcoords = [0.5, 0, 1, 1, 0, 1];
    var normals   = [0, 0, 1, 0, 0, 1, 0, 0, 1];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

Ça ressemble à un motif qu'on peut simplifier également.

    // un seul triangle
    var arrays = {
       position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
       texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1],               },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
    };

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    var vao = twgl.createVAOFromBufferInfo(gl, setters, bufferInfo);

Beaucoup plus court !

Voilà

{{{example url="../webgl-less-code-more-fun-triangle.html" }}}

Cela fonctionnera même si nous avons des indices. `createVAOFromBufferInfo`
configurera tous les attributs et configurera l'`ELEMENT_ARRAY_BUFFER`
avec vos `indices` de sorte que quand vous liez ce VAO, vous pouvez appeler
`gl.drawElements`.

    // un quad indexé
    var arrays = {
       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
    };

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    var vao = twgl.createVAOFromBufferInfo(gl, setters, bufferInfo);

et au moment du rendu nous pouvons appeler `gl.drawElements` au lieu de `gl.drawArrays`.

    ...

    // Dessiner la géométrie.
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

Voilà

{{{example url="../webgl-less-code-more-fun-quad.html" }}}

Enfin, nous pouvons aller ce que je considère peut-être trop loin. Étant donné que `position` a presque toujours 3 composantes (x, y, z)
et `texcoords` presque toujours 2, les indices 3, et les normales 3, on peut laisser le système deviner le nombre
de composantes.

    // un quad indexé
    var arrays = {
       position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
       texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
       normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
       indices:  [0, 1, 2, 1, 2, 3],
    };

Et cette version

{{{example url="../webgl-less-code-more-fun-quad-guess.html" }}}

Je ne suis pas sûr d'aimer personnellement ce style. Deviner me dérange car ça peut se tromper. Par exemple,
je pourrais choisir d'ajouter un ensemble supplémentaire de coordonnées de texture dans mon attribut texcoord et il va
deviner 2 et avoir tort. Bien sûr, si ça se trompe, vous pouvez juste le spécifier comme dans l'exemple ci-dessus.
Je suppose que je m'inquiète que si le code de devinette change, les choses des gens pourraient se casser. C'est à vous de décider. Certaines personnes
aiment que les choses soient aussi simples que possible.

Pourquoi ne pas regarder les attributs sur le programme shader pour déterminer le nombre de composantes ?
C'est parce qu'il est courant de fournir 3 composantes (x, y, z) depuis un buffer mais d'utiliser un `vec4` dans
le shader. Pour les attributs, WebGL mettra `w = 1` automatiquement. Mais cela signifie que nous ne pouvons pas facilement
connaître l'intention de l'utilisateur puisque ce qu'il a déclaré dans son shader pourrait ne pas correspondre au nombre de
composantes qu'il fournit.

En cherchant d'autres motifs, voilà

    var program = twgl.createProgramFromSources(gl, [vs, fs]);
    var uniformSetters = twgl.createUniformSetters(gl, program);
    var attribSetters  = twgl.createAttributeSetters(gl, program);

Simplifions ça aussi en juste

    var programInfo = twgl.createProgramInfo(gl, ["vertexshader", "fragmentshader"]);

Ce qui retourne quelque chose comme

    programInfo = {
       program: WebGLProgram,  // programme qu'on vient de compiler
       uniformSetters: ...,    // setters tels que retournés par createUniformSetters,
       attribSetters: ...,     // setters tels que retournés par createAttribSetters,
    }

Et c'est encore une simplification mineure de plus. Cela sera utile une fois que nous commencerons à utiliser
plusieurs programmes car il garde automatiquement les setters associés au programme auquel ils appartiennent.

{{{example url="../webgl-less-code-more-fun-quad-programinfo.html" }}}

Encore une chose, parfois nous avons des données sans indices et nous devons appeler
`gl.drawArrays`. D'autres fois, nous avons des indices et nous devons appeler `gl.drawElements`.
Étant donné les données que nous avons, nous pouvons facilement vérifier lequel en regardant `bufferInfo.indices`.
S'il existe, nous devons appeler `gl.drawElements`. Sinon, nous devons appeler `gl.drawArrays`.
Il existe donc une fonction, `twgl.drawBufferInfo`, qui fait ça. Elle s'utilise comme ça

    twgl.drawBufferInfo(gl, bufferInfo);

Si vous ne passez pas un 3ème paramètre pour le type de primitive à dessiner, elle suppose
`gl.TRIANGLES`.

Voici un exemple où nous avons un triangle non-indexé et un quad indexé. Parce que
nous utilisons `twgl.drawBufferInfo`, le code n'a pas à changer quand nous
changeons de données.

{{{example url="../webgl-less-code-more-fun-drawbufferinfo.html" }}}

Quoi qu'il en soit, c'est le style dans lequel j'essaie d'écrire mes propres programmes WebGL.
Pour les leçons de ces tutoriels, j'ai cependant senti que je devais utiliser les façons **verbeuses** standard
pour que les gens ne soient pas confus sur ce qui est WebGL et ce qui est mon propre style. À un moment donné,
cependant, montrer toutes les étapes empêche d'aller à l'essentiel, donc certaines leçons à venir
utiliseront ce style.

N'hésitez pas à utiliser ce style dans votre propre code. Les fonctions `twgl.createProgramInfo`,
`twgl.createVAOAndSetAttributes`, `twgl.createBufferInfoFromArrays`, et `twgl.setUniforms`
etc... font partie d'une bibliothèque que j'ai écrite basée sur ces idées. [Elle s'appelle `TWGL`](https://twgljs.org).
Ça rime avec wiggle et ça signifie `Tiny WebGL`.

Ensuite, [dessiner plusieurs choses](webgl-drawing-multiple-things.html).

<div class="webgl_bottombar">
<h3>Peut-on utiliser les setters directement ?</h3>
<p>
Pour ceux d'entre vous qui connaissent JavaScript, vous vous demandez peut-être si vous pouvez utiliser les setters
directement comme ça.
</p>
<pre class="prettyprint">{{#escapehtml}}
// Au moment de l'initialisation
var uniformSetters = twgl.createUniformSetters(program);

// Au moment du rendu
uniformSetters.u_ambient([1, 0, 0, 1]); // définir la couleur ambiante en rouge.
{{/escapehtml}}</pre>
<p>La raison pour laquelle ce n'est pas une bonne idée est que quand vous travaillez avec GLSL, vous pourriez
modifier les shaders de temps en temps, souvent pour déboguer. Disons que nous ne voyions
rien à l'écran dans notre programme. L'une des premières choses que je fais quand rien
n'apparaît est de simplifier mes shaders. Par exemple, je pourrais changer le fragment shader
en la chose la plus simple possible</p>
<pre class="prettyprint showlinemods">{{#escapehtml}}
#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

out vec4 outColor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((
    u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
      diffuseColor.a);
*  outColor = vec4(0,1,0,1);  // &lt;!--- juste du vert
}
{{/escapehtml}}</pre>
<p>Remarquez que j'ai juste ajouté une ligne qui définit <code>outColor</code> à une couleur constante.
La plupart des drivers verront qu'aucune des lignes précédentes dans le fichier ne contribue vraiment
au résultat. En tant que tel, ils optimiseront tous nos uniforms. La prochaine fois que nous exécutons le programme
quand nous appelons <code>twgl.createUniformSetters</code>, il ne créera pas de setter pour <code>u_ambient</code> donc le
code ci-dessus qui appelle <code>uniformSetters.u_ambient()</code> directement échouera avec</p>
<pre class="prettyprint">
TypeError: undefined is not a function
</pre>
<p><code>twgl.setUniforms</code> résout ce problème. Il ne définit que les uniforms qui existent réellement</p>
</div>
