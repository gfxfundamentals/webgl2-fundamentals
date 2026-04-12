Title: WebGL2 Charger des fichiers Obj
Description: Comment analyser et afficher un fichier .OBJ
TOC: Charger des fichiers .obj

Les fichiers Wavefront .obj sont l'un des formats de fichiers 3D les plus courants
qu'on trouve en ligne. Les formes les plus communes ne sont pas trop difficiles à
analyser, alors analysons-en un. Cela fournira, espérons-le, un exemple utile pour
l'analyse des formats 3D en général.

**Avertissement :** Ce parser .OBJ n'est pas conçu pour être exhaustif ou
parfait, ni pour gérer tous les fichiers .OBJ. Il s'agit plutôt d'un exercice
pour parcourir la gestion de ce qu'on rencontre en chemin. Cela dit, si vous
rencontrez des problèmes importants et leurs solutions, un commentaire en bas de
page pourrait être utile aux autres s'ils choisissent d'utiliser ce code.

La meilleure documentation que j'ai trouvée pour le format .OBJ est
[ici](http://paulbourke.net/dataformats/obj/). Bien que
[cette page](https://www.loc.gov/preservation/digital/formats/fdd/fdd000507.shtml)
renvoie à de nombreux autres documents, notamment ce qui semble être
[les docs originaux](https://web.archive.org/web/20200324065233/http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf).

Regardons un exemple simple. Voici un fichier cube.obj exporté depuis la scène par
défaut de Blender.

```txt
# Blender v2.80 (sub 75) OBJ File: ''
# www.blender.org
mtllib cube.mtl
o Cube
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vt 0.375000 0.000000
vt 0.625000 0.000000
vt 0.625000 0.250000
vt 0.375000 0.250000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.625000 0.500000
vt 0.375000 0.500000
vt 0.625000 0.750000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.625000 1.000000
vt 0.375000 1.000000
vt 0.125000 0.500000
vt 0.375000 0.500000
vt 0.375000 0.750000
vt 0.125000 0.750000
vt 0.625000 0.500000
vt 0.875000 0.500000
vt 0.875000 0.750000
vn 0.0000 1.0000 0.0000
vn 0.0000 0.0000 1.0000
vn -1.0000 0.0000 0.0000
vn 0.0000 -1.0000 0.0000
vn 1.0000 0.0000 0.0000
vn 0.0000 0.0000 -1.0000
usemtl Material
s off
f 1/1/1 5/2/1 7/3/1 3/4/1
f 4/5/2 3/6/2 7/7/2 8/8/2
f 8/8/3 7/7/3 5/9/3 6/10/3
f 6/10/4 2/11/4 4/12/4 8/13/4
f 2/14/5 1/15/5 3/16/5 4/17/5
f 6/18/6 5/19/6 1/20/6 2/11/6
```

Sans même consulter la documentation, on peut probablement deviner que les lignes
commençant par `v` sont des positions, celles commençant par `vt` sont des coordonnées
de texture, et celles commençant par `vn` sont des normales. Il reste à comprendre le reste.

Il semble que les fichiers .OBJ soient des fichiers texte, donc la première chose à faire
est de charger un fichier texte. Heureusement, en 2020, c'est très simple avec
[async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await).

```js
async function main() {
  ...

  const response = await fetch('resources/models/cube/cube.obj');
  const text = await response.text();
```

Ensuite, on peut analyser le fichier ligne par ligne et chaque ligne est de la forme :

```
mot-clé donnée donnée donnée ...
```

où la première chose sur la ligne est un mot-clé et les données sont séparées par des espaces.
Les lignes commençant par `#` sont des commentaires.

Configurons du code pour analyser chaque ligne, ignorer les lignes vides et les commentaires,
puis appeler une fonction selon le mot-clé :

```js
+function parseOBJ(text) {
+
+  const keywords = {
+  };
+
+  const keywordRE = /(\w*)(?: )*(.*)/;
+  const lines = text.split('\n');
+  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
+    const line = lines[lineNo].trim();
+    if (line === '' || line.startsWith('#')) {
+      continue;
+    }
+    const parts = line.split(/\s+/);
+    const m = keywordRE.exec(line);
+    if (!m) {
+      continue;
+    }
+    const [, keyword, unparsedArgs] = m;
+    const parts = line.split(/\s+/).slice(1);
+    const handler = keywords[keyword];
+    if (!handler) {
+      console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
+      continue;
+    }
+    handler(parts, unparsedArgs);
+  }
}
```

Quelques remarques : nous supprimons les espaces en début et fin de chaque ligne.
Je ne sais pas si c'est nécessaire mais je pense que ça ne peut pas faire de mal.
Nous découpons la ligne par des espaces blancs avec `/\s+/`. Là encore, je ne sais
pas si c'est nécessaire. Peut-il y avoir plus d'un espace entre les données ? Des
tabulations ? Je ne sais pas, mais il semblait plus sûr de supposer qu'il peut y avoir
des variations dans un format texte.

Sinon, nous extrayons la première partie comme mot-clé, puis cherchons une fonction
pour ce mot-clé et l'appelons en lui passant les données après le mot-clé. Il faut
maintenant remplir ces fonctions.

Nous avons deviné les données `v`, `vt` et `vn` ci-dessus. La documentation dit que `f`
signifie "face" ou polygone où chaque donnée est un indice dans les positions, les
coordonnées de texture et les normales.

Les indices sont basés sur 1 si positifs, ou relatifs au nombre de sommets analysés
jusqu'ici s'ils sont négatifs. L'ordre des indices est position/texcoord/normale et
tout sauf la position est optionnel :

```txt
f 1 2 3              # indices pour les positions seulement
f 1/1 2/2 3/3        # indices pour les positions et les texcoords
f 1/1/1 2/2/2 3/3/3  # indices pour les positions, texcoords et normales
f 1//1 2//2 3//3     # indices pour les positions et les normales
```

`f` peut avoir plus de 3 sommets, par exemple 4 pour un quadrilatère.
WebGL ne peut dessiner que des triangles, donc nous devons convertir les données en triangles.
Les docs ne précisent pas si une face peut avoir plus de 4 sommets, ni si la face doit être
convexe ou si elle peut être concave. Pour l'instant, supposons qu'elles soient concaves.

Aussi, en général dans WebGL, nous n'utilisons pas d'indices différents pour les positions,
les texcoords et les normales. Au lieu de ça, un "vertex webgl" est la combinaison de toutes
les données pour ce sommet. Ainsi, pour dessiner un cube, WebGL nécessite 36 sommets, chaque
face est 2 triangles, chaque triangle est 3 sommets. 6 faces * 2 triangles * 3 sommets par
triangle = 36. Même s'il n'y a que 8 positions uniques, 6 normales uniques, et on ne sait
pas combien de coordonnées de texture. Nous devons donc lire les indices de sommets des faces
et générer un "vertex webgl" qui est la combinaison des données des 3 choses. [*](webgl-pulling-vertices.html)

Donc, étant donné tout ça, on peut analyser ces parties comme suit :

```js
function parseOBJ(text) {
+  // comme les indices sont en base 1, remplissons simplement la 0ème donnée
+  const objPositions = [[0, 0, 0]];
+  const objTexcoords = [[0, 0]];
+  const objNormals = [[0, 0, 0]];
+
+  // même ordre que les indices `f`
+  const objVertexData = [
+    objPositions,
+    objTexcoords,
+    objNormals,
+  ];
+
+  // même ordre que les indices `f`
+  let webglVertexData = [
+    [],   // positions
+    [],   // texcoords
+    [],   // normales
+  ];
+
+  function addVertex(vert) {
+    const ptn = vert.split('/');
+    ptn.forEach((objIndexStr, i) => {
+      if (!objIndexStr) {
+        return;
+      }
+      const objIndex = parseInt(objIndexStr);
+      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
+      webglVertexData[i].push(...objVertexData[i][index]);
+    });
+  }
+
  const keywords = {
+    v(parts) {
+      objPositions.push(parts.map(parseFloat));
+    },
+    vn(parts) {
+      objNormals.push(parts.map(parseFloat));
+    },
+    vt(parts) {
+      objTexcoords.push(parts.map(parseFloat));
+    },
+    f(parts) {
+      const numTriangles = parts.length - 2;
+      for (let tri = 0; tri < numTriangles; ++tri) {
+        addVertex(parts[0]);
+        addVertex(parts[tri + 1]);
+        addVertex(parts[tri + 2]);
+      }
+    },
  };
```

Le code ci-dessus crée 3 tableaux pour stocker les positions, texcoords et normales
analysées du fichier objet. Il crée aussi 3 tableaux pour stocker les mêmes données
pour WebGL. Ils sont mis dans des tableaux dans le même ordre que les indices `f` pour
faciliter les références lors de l'analyse de `f`.

En d'autres termes, une ligne `f` comme :

```txt
f 1/2/3 4/5/6 7/8/9
```

Une de ces parties `4/5/6` dit "utiliser la position 4" pour ce sommet de face,
"utiliser la texcoord 5" et "utiliser la normale 6". En mettant les tableaux eux-mêmes
dans un tableau, `objVertexData`, on peut simplifier en "utiliser l'élément n de objData i
pour webglData i", ce qui simplifie le code.

À la fin de notre fonction, nous retournons les données construites :

```js
  ...

  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
}
```

Il ne reste plus qu'à dessiner les données. D'abord, nous utiliserons une variante des shaders
de [l'article sur l'éclairage directionnel](webgl-3d-lighting-directional.html).

```js
const vs = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  out vec3 v_normal;

  void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_normal = mat3(u_world) * a_normal;
  }
`;

const fs = `#version 300 es
  precision highp float;

  in vec3 v_normal;

  uniform vec4 u_diffuse;
  uniform vec3 u_lightDirection;

  out vec4 outColor;

  void main () {
    vec3 normal = normalize(v_normal);
    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    outColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
  }
`;
```

Puis, en utilisant le code de l'article sur
[moins de code, plus de fun](webgl-less-code-more-fun.html),
nous chargeons d'abord nos données :

```js
async function main() {
  // Obtenir un contexte WebGL
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Dit à twgl de faire correspondre position avec a_position etc...
  twgl.setAttributePrefix("a_");

  ... shaders ...

  // compile et lie les shaders, cherche les emplacements d'attribut et d'uniform
  const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

  const response = await fetch('resources/models/cube/cube.obj');
  const text = await response.text();
  const data = parseOBJ(text);

  // Parce que data est juste des tableaux nommés comme ceci
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // et parce que ces noms correspondent aux attributs dans notre vertex
  // shader nous pouvons le passer directement à `createBufferInfoFromArrays`
  // de l'article "moins de code, plus de fun".

  // crée un tampon pour chaque tableau en appelant
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  // remplit un vertex array en appelant gl.createVertexArray, gl.bindVertexArray
  // puis gl.bindBuffer, gl.enableVertexAttribArray, et gl.vertexAttribPointer pour chaque attribut
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
```

puis nous le dessinons :

```js
  const cameraTarget = [0, 0, 0];
  const cameraPosition = [0, 0, 4];
  const zNear = 0.1;
  const zFar = 50;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function render(time) {
    time *= 0.001;  // convertit en secondes

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    // Calcule la matrice de la caméra avec lookAt.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // Crée une matrice de vue depuis la matrice de caméra.
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    // appelle gl.uniform
    twgl.setUniforms(meshProgramInfo, sharedUniforms);

    // configure les attributs pour cette partie.
    gl.bindVertexArray(vao);

    // appelle gl.uniform
    twgl.setUniforms(meshProgramInfo, {
      u_world: m4.yRotation(time),
      u_diffuse: [1, 0.7, 0.5, 1],
    });

    // appelle gl.drawArrays ou gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
```

Et avec ça, on peut voir notre cube chargé et dessiné :

{{{example url="../webgl-load-obj-cube.html"}}}

On voit aussi des messages sur des mots-clés non gérés. À quoi servent-ils ?

`usemtl` est le plus important d'entre eux. Il spécifie que toute la géométrie qui
suit utilise un matériau spécifique. Par exemple, si vous avez un modèle de voiture,
vous voudrez probablement des vitres transparentes et des pare-chocs chromés. Les vitres
sont [transparentes](webgl-text-texture.html) et les pare-chocs sont
[réfléchissants](webgl-environment-maps.html), ils doivent donc être dessinés différemment
de la carrosserie. Le tag `usemtl` marque cette séparation des parties.

Puisque nous devrons dessiner chacune de ces parties séparément, corrigeons le code
pour qu'à chaque fois que nous voyons un `usemtl`, nous démarrions un nouvel ensemble
de données webgl.

D'abord, créons du code qui démarre de nouvelles données webgl si nous n'en avons pas déjà :

```js
function parseOBJ(text) {
  // comme les indices sont en base 1, remplissons simplement la 0ème donnée
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // même ordre que les indices `f`
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // même ordre que les indices `f`
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normales
  ];

+  const geometries = [];
+  let geometry;
+  let material = 'default';
+
+  function newGeometry() {
+    // S'il y a une géométrie existante et qu'elle n'est
+    // pas vide, en démarrer une nouvelle.
+    if (geometry && geometry.data.position.length) {
+      geometry = undefined;
+    }
+  }
+
+  function setGeometry() {
+    if (!geometry) {
+      const position = [];
+      const texcoord = [];
+      const normal = [];
+      webglVertexData = [
+        position,
+        texcoord,
+        normal,
+      ];
+      geometry = {
+        material,
+        data: {
+          position,
+          texcoord,
+          normal,
+        },
+      };
+      geometries.push(geometry);
+    }
+  }

...
```

puis appelons-les aux bons endroits lors du traitement de nos mots-clés, en incluant
l'ajout de la fonction pour le mot-clé `o` :

```js
  ...

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
+      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
+    usemtl(parts, unparsedArgs) {
+      material = unparsedArgs;
+      newGeometry();
+    },
  };

  ...

```

Le mot-clé `usemtl` n'est pas obligatoire, donc s'il n'y en a pas dans le fichier,
on veut quand même de la géométrie. Donc dans le gestionnaire `f`, on appelle `setGeometry`
qui en démarrera si aucun mot-clé `usemtl` n'est apparu avant ce point dans le fichier.

Sinon, à la fin, nous retournerons `geometries` qui est un tableau d'objets, contenant
chacun `name` et `data` :

```js
  ...

-  return {
-    position: webglVertexData[0],
-    texcoord: webglVertexData[1],
-    normal: webglVertexData[2],
-  };
+  return geometries;
}
```

Tant que nous y sommes, nous devrions aussi gérer le cas où les texcoords ou normales
sont absentes et simplement ne pas les inclure.

```js
+  // supprime tout tableau qui n'a pas d'entrées.
+  for (const geometry of geometries) {
+    geometry.data = Object.fromEntries(
+        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
+  }

  return {
    materialLibs,
    geometries,
  };
}
```

En continuant avec les mots-clés, selon la [*spécification officielle*](https://web.archive.org/web/20200324065233/http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf),
`matlib` spécifie des fichiers séparés qui contiennent des informations sur les matériaux.
Malheureusement, ça ne semble pas correspondre à la réalité car les noms de fichiers
peuvent contenir des espaces et le format .OBJ ne fournit aucun moyen d'échapper les espaces
ou de citer les arguments. Idéalement, ils auraient dû utiliser un format bien défini comme
JSON, XML ou YAML, ou quelque chose qui résout ce problème. Mais à leur décharge, .OBJ est
plus ancien que tous ces formats.

Nous gérons le chargement du fichier plus tard. Pour l'instant, ajoutons-le juste à notre
chargeur pour pouvoir y faire référence plus tard.

```js
function parseOBJ(text) {
  ...
+  const materialLibs = [];

  ...

  const keywords = {
    ...
+    mtllib(parts, unparsedArgs) {
+      materialLibs.push(unparsedArgs);
+    },
    ...
  };

-  return geometries;
+  return {
+    materialLibs,
+    geometries,
+  };
}
```

`o` spécifie que les éléments suivants appartiennent à l'"objet" nommé. Ce n'est pas
vraiment clair comment l'utiliser. Peut-on avoir un fichier avec juste `o` mais sans
`usemtl` ? Supposons que oui.

```js
function parseOBJ(text) {
  ...
  let material = 'default';
+  let object = 'default';

  ...

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
+        object,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  const keywords = {
    ...
+    o(parts, unparsedArgs) {
+      object = unparsedArgs;
+      newGeometry();
+    },
    ...
  };
```

`s` spécifie un groupe de lissage. Je pense que les groupes de lissage sont quelque chose
qu'on peut ignorer. Ils sont généralement utilisés dans un logiciel de modélisation pour
auto-générer des normales de sommets. Une normale de sommet est calculée en calculant d'abord
la normale de chaque face, ce qui est facile en utilisant le *produit vectoriel* que nous avons
couvert dans [l'article sur les caméras](webgl-3d-camera.html). Ensuite, pour n'importe quel
sommet, on peut faire la moyenne de toutes les faces qu'il partage. Mais si on veut un bord
dur, on doit parfois pouvoir dire au système d'ignorer une face. Les groupes de lissage
permettent de désigner quelles faces seront incluses lors du calcul des normales de sommets.
Pour le calcul des normales de sommets pour la géométrie en général, vous pouvez regarder
[l'article sur le tour de potier](webgl-3d-geometry-lathe.html) pour un exemple.

Dans notre cas, ignorons-les simplement. Je soupçonne que la plupart des fichiers .obj ont
des normales en interne et n'ont donc probablement pas besoin de groupes de lissage. Ils les
gardent pour les logiciels de modélisation au cas où vous voudriez éditer et régénérer des normales.

```js
+  const noop = () => {};

  const keywords = {
    ...
+    s: noop,
    ...
  };
```

Un autre mot-clé que nous n'avons pas encore vu est `g` pour groupe. C'est essentiellement
juste des métadonnées. Les objets peuvent appartenir à plusieurs groupes.
Puisque ça apparaîtra dans le prochain fichier qu'on essaie, ajoutons le support ici même
si on n'utilisera pas vraiment les données.

```js
function parseOBJ(text) {
  ...
+  let groups = ['default'];
  ...
  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
+        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  ...

  const keywords = {
    ...
+    g(parts) {
+      groups = parts;
+      newGeometry()
+    },
    ...
  };
```

Maintenant que nous créons plusieurs ensembles de géométrie, nous devons changer notre
code de configuration pour créer des `WebGLBuffers` pour chacun. Nous créerons aussi une
couleur aléatoire pour pouvoir facilement voir les différentes parties.

```js
-  const response = await fetch('resources/models/cube/cube.obj');
+  const response = await fetch('resources/models/cube/chair.obj');
  const text = await response.text();
-  const data = parseOBJ(text);
+  const obj = parseOBJ(text);

+  const parts = obj.geometries.map(({data}) => {
    // Parce que data est juste des tableaux nommés comme ceci
    //
    // {
    //   position: [...],
    //   texcoord: [...],
    //   normal: [...],
    // }
    //
    // et parce que ces noms correspondent aux attributs dans notre vertex
    // shader nous pouvons le passer directement à `createBufferInfoFromArrays`
    // de l'article "moins de code, plus de fun".

    // crée un tampon pour chaque tableau en appelant
    // gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
    // remplit un vertex array en appelant gl.createVertexArray, gl.bindVertexArray
    // puis gl.bindBuffer, gl.enableVertexAttribArray, et gl.vertexAttribPointer pour chaque attribut
    const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
+    return {
+      material: {
+        u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
+      },
+      bufferInfo,
+      vao,
+    };
+  });
```

J'ai changé du chargement d'un cube au chargement de cette [chaise](https://sketchfab.com/3d-models/chair-aa2acddb218646a59ece132bf95aa558) sous licence [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) par [haytonm](https://sketchfab.com/haytonm) trouvée sur [Sketchfab](https://sketchfab.com/).

<div class="webgl_center"><img src="../resources/models/chair/chair.jpg" style="width: 452px;"></div>

Pour le rendu, il suffit de boucler sur les parties :

```js
function render(time) {
  ...

  gl.useProgram(meshProgramInfo.program);

  // appelle gl.uniform
  twgl.setUniforms(meshProgramInfo, sharedUniforms);

+  // calcule la matrice monde une seule fois puisque toutes les parties
+  // sont dans le même espace.
+  const u_world = m4.yRotation(time);
+
+  for (const {bufferInfo, vao material} of parts) {
    // configure les attributs pour cette partie.
    gl.bindVertexArray(vao);
    // appelle gl.uniform
    twgl.setUniforms(meshProgramInfo, {
-      u_world: m4.yRotation(time),
-      u_diffuse: [1, 0.7, 0.5, 1],
+      u_world,
+      u_diffuse: material.u_diffuse,
    });
    // appelle gl.drawArrays ou gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);
+  }

  ...
```

et ça fonctionne à peu près :

{{{example url="../webgl-load-obj.html"}}}

Ne serait-il pas agréable de pouvoir essayer de centrer l'objet ?

Pour ce faire, nous devons calculer les étendues, soit les positions minimale et maximale
des sommets. D'abord, nous pouvons créer une fonction qui, étant donné des positions,
calculera les positions min et max :

```js
function getExtents(positions) {
  const min = positions.slice(0, 3);
  const max = positions.slice(0, 3);
  for (let i = 3; i < positions.length; i += 3) {
    for (let j = 0; j < 3; ++j) {
      const v = positions[i + j];
      min[j] = Math.min(v, min[j]);
      max[j] = Math.max(v, max[j]);
    }
  }
  return {min, max};
}
```

puis nous pouvons boucler sur toutes les parties de notre géométrie et obtenir
les étendues pour toutes les parties :

```js
function getGeometriesExtents(geometries) {
  return geometries.reduce(({min, max}, {data}) => {
    const minMax = getExtents(data.position);
    return {
      min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
      max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
    };
  }, {
    min: Array(3).fill(Number.POSITIVE_INFINITY),
    max: Array(3).fill(Number.NEGATIVE_INFINITY),
  });
}
```

Ensuite, nous pouvons utiliser ça pour calculer de combien déplacer l'objet
afin que son centre soit à l'origine, et une distance depuis l'origine pour
placer la caméra de façon à voir idéalement tout l'objet.

```js
-  const cameraTarget = [0, 0, 0];
-  const cameraPosition = [0, 0, 4];
-  const zNear = 0.1;
-  const zFar = 50;
+  const extents = getGeometriesExtents(obj.geometries);
+  const range = m4.subtractVectors(extents.max, extents.min);
+  // quantité de déplacement de l'objet pour que son centre soit à l'origine
+  const objOffset = m4.scaleVector(
+      m4.addVectors(
+        extents.min,
+        m4.scaleVector(range, 0.5)),
+      -1);
+  const cameraTarget = [0, 0, 0];
+  // calcule à quelle distance déplacer la caméra pour voir probablement l'objet.
+  const radius = m4.length(range) * 1.2;
+  const cameraPosition = m4.addVectors(cameraTarget, [
+    0,
+    0,
+    radius,
+  ]);
+  // Définit zNear et zFar à quelque chose d'approprié
+  // pour la taille de cet objet.
+  const zNear = radius / 100;
+  const zFar = radius * 3;
```

Ci-dessus, nous avons aussi défini `zNear` et `zFar` à quelque chose qui espérons-le
montre bien l'objet.

Il suffit d'utiliser `objOffset` pour déplacer l'objet vers l'origine :

```js
// calcule la matrice monde une seule fois puisque toutes les parties
// sont dans le même espace.
-const u_world = m4.yRotation(time);
+let u_world = m4.yRotation(time);
+u_world = m4.translate(u_world, ...objOffset);
```

et avec ça, l'objet est centré.

{{{example url="../webgl-load-obj-w-extents.html"}}}

En cherchant sur le net, il s'avère qu'il existe des versions non standard de fichiers .OBJ
qui incluent des couleurs de sommets. Pour ce faire, ils ajoutent des valeurs supplémentaires
à chaque position de sommet, donc au lieu de :

```
v <x> <y> <z>
```

c'est :

```
v <x> <y> <z> <rouge> <vert> <bleu>
```

Il n'est pas clair s'il y a aussi un alpha optionnel à la fin.

J'ai cherché et trouvé ce [livre - Étude Vertex Caméléon](https://sketchfab.com/3d-models/book-vertex-chameleon-study-51b0b3bdcd844a9e951a9ede6f192da8) par [Oleaf](https://sketchfab.com/homkahom0) sous licence [CC-BY-NC](http://creativecommons.org/licenses/by-nc/4.0/) qui utilise des couleurs de sommets.

<div class="webgl_center"><img src="../resources/models/book-vertex-chameleon-study/book.png" style="width: 446px;"></div>

Voyons si nous pouvons ajouter le support dans notre parseur pour gérer les couleurs de sommets.

Nous devons ajouter des éléments pour les couleurs partout où nous avions des positions, normales et texcoords :

```js
function parseOBJ(text) {
  // comme les indices sont en base 1, remplissons simplement la 0ème donnée
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
+  const objColors = [[0, 0, 0]];

  // même ordre que les indices `f`
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
+    objColors,
  ];

  // même ordre que les indices `f`
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normales
+    [],   // couleurs
  ];

  ...

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
+      const color = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
+        color,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
+          color,
        },
      };
      geometries.push(geometry);
    }
  }
```

Ensuite, malheureusement l'analyse réelle rend le code un peu moins générique :

```js
  const keywords = {
    v(parts) {
-      objPositions.push(parts.map(parseFloat));
+      // si il y a plus de 3 valeurs ici, ce sont des couleurs de sommets
+      if (parts.length > 3) {
+        objPositions.push(parts.slice(0, 3).map(parseFloat));
+        objColors.push(parts.slice(3).map(parseFloat));
+      } else {
+        objPositions.push(parts.map(parseFloat));
+      }
    },
    ...
  };
```

Puis quand nous lisons une ligne de face `f`, nous appelons `addVertex`. Nous devrons récupérer
les couleurs de sommets ici :

```js
  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
+      // si c'est l'indice de position (index 0) et qu'on a analysé
+      // des couleurs de sommets, on copie les couleurs dans les données de couleur webgl
+      if (i === 0 && objColors.length > 1) {
+        geometry.data.color.push(...objColors[index]);
+      }
    });
  }
```

Maintenant, nous devons changer nos shaders pour utiliser les couleurs de sommets :

```js
const vs = `#version 300 es
in vec4 a_position;
in vec3 a_normal;
+in vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec3 v_normal;
+out vec4 v_color;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  v_normal = mat3(u_world) * a_normal;
+  v_color = a_color;
}
`;

const fs = `#version 300 es
precision mediump float;

in vec3 v_normal;
+in vec4 v_color;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

out vec4 outColor;

void main () {
  vec3 normal = normalize(v_normal);
  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
-  outColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
+  vec4 diffuse = u_diffuse * v_color;
+  outColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
}
`;
```

Comme mentionné ci-dessus, je ne sais pas si cette version non standard de .OBJ peut inclure
des valeurs alpha pour chaque couleur de sommet. Notre [bibliothèque d'assistance](webgl-less-code-more-fun.html) prend automatiquement les données qu'on lui passe et crée des tampons pour nous. Elle devine
le nombre de composants par élément dans les données. Pour les données dont le nom contient
la chaîne `position` ou `normal`, elle suppose 3 composants par élément. Pour un nom qui
contient `texcoord`, elle suppose 2 composants par élément. Pour tout le reste, elle suppose
4 composants par élément. Cela signifie que si nos couleurs sont seulement r, g, b (3 composants
par élément), nous devons le lui dire pour qu'elle ne devine pas 4.

```js
const parts = obj.geometries.map(({data}) => {
  // Parce que data est juste des tableaux nommés comme ceci
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // et parce que ces noms correspondent aux attributs dans notre vertex
  // shader nous pouvons le passer directement à `createBufferInfoFromArrays`
  // de l'article "moins de code, plus de fun".

+   if (data.position.length === data.color.length) {
+     // c'est 3. Notre bibliothèque d'assistance suppose 4 donc nous devons
+     // lui dire qu'il n'y en a que 3.
+     data.color = { numComponents: 3, data: data.color };
+   }

  // crée un tampon pour chaque tableau en appelant
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
  return {
    material: {
      u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
    },
    bufferInfo,
    vao,
  };
});
```

Nous voulons aussi probablement encore gérer le cas plus courant où il n'y a pas de couleurs
de sommets. Dans [le premier article](webgl-fundamentals.html) ainsi que dans
[d'autres articles](webgl-attributes.html), nous avons couvert le fait qu'un attribut obtient
généralement sa valeur depuis un tampon. Mais, nous pouvons aussi faire des attributs qui ont
juste une valeur constante. Un attribut désactivé utilise une valeur constante. Par exemple :

```js
gl.disableVertexAttribArray(someAttributeLocation);  // utilise une valeur constante
const value = [1, 2, 3, 4];
gl.vertexAttrib4fv(someAttributeLocation, value);    // la valeur constante à utiliser
```

Notre [bibliothèque d'assistance](webgl-less-code-more-fun.html) gère ceci pour nous si nous
définissons les données de cet attribut à `{value: [1, 2, 3, 4]}`. Donc, on peut vérifier
s'il n'y a pas de couleurs de sommets et si c'est le cas, définir l'attribut de couleur de
sommet à blanc constant.

```js
const parts = obj.geometries.map(({data}) => {
  // Parce que data est juste des tableaux nommés comme ceci
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // et parce que ces noms correspondent aux attributs dans notre vertex
  // shader nous pouvons le passer directement à `createBufferInfoFromArrays`
  // de l'article "moins de code, plus de fun".

+  if (data.color) {
      if (data.position.length === data.color.length) {
        // c'est 3. Notre bibliothèque d'assistance suppose 4 donc nous devons
        // lui dire qu'il n'y en a que 3.
        data.color = { numComponents: 3, data: data.color };
      }
+  } else {
+    // il n'y a pas de couleurs de sommets, on utilise juste blanc constant
+    data.color = { value: [1, 1, 1, 1] };
+  }

  ...
});
```

Nous ne pouvons également plus utiliser une couleur aléatoire par partie :

```js
const parts = obj.geometries.map(({data}) => {
  ...

  // crée un tampon pour chaque tableau en appelant
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
  return {
    material: {
-      u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
+      u_diffuse: [1, 1, 1, 1],
    },
    bufferInfo,
    vao,
  };
});
```

Et avec ça, nous pouvons charger un fichier .OBJ avec des couleurs de sommets.

{{{example url="../webgl-load-obj-w-vertex-colors.html"}}}

Pour analyser et utiliser les matériaux, [voir l'article suivant](webgl-load-obj-w-mtl.html).

## Quelques notes

### Le chargeur ci-dessus est incomplet

Vous pouvez [lire plus sur le format .obj](http://paulbourke.net/dataformats/obj/).
Il y a des tonnes de fonctionnalités que le code ci-dessus ne supporte pas. De plus, le code
n'a pas été testé sur de très nombreux fichiers .obj, donc il y a peut-être des bugs cachés.
Cela dit, je soupçonne que la majorité des fichiers .obj en ligne n'utilise que les
fonctionnalités montrées ci-dessus, donc je pense que c'est probablement un exemple utile.

### Le chargeur ne vérifie pas les erreurs

Par exemple, le mot-clé `vt` peut avoir 3 valeurs par entrée au lieu de seulement 2. 3 valeurs
seraient pour des textures 3D, ce qui n'est pas courant, donc je ne me suis pas embêté avec ça.
Si vous lui passiez un fichier avec des coordonnées de texture 3D, vous devriez changer les
shaders pour gérer les textures 3D et le code qui génère des `WebGLBuffers` (appels de
`createBufferInfoFromArrays`) pour lui dire qu'il s'agit de 3 composants par coordonnée UV.

### Il suppose que les données sont homogènes

Je ne sais pas si certains mots-clés `f` peuvent avoir 3 entrées et d'autres seulement 2 dans
le même fichier. Si c'est possible, le code ci-dessus ne le gère pas.

Le code suppose aussi que si les positions de sommets ont x, y, z, elles ont toutes x, y, z.
S'il existe des fichiers où certaines positions de sommets ont x, y, z, d'autres seulement x, y,
et d'autres encore x, y, z, r, g, b, alors il faudrait refactoriser.

### On pourrait mettre toutes les données dans un seul tampon

Le code ci-dessus met les données de position, texcoord, normale dans des tampons séparés.
On pourrait les mettre dans un seul tampon en les entrelacant
pos,uv,nrm,pos,uv,nrm,... mais il faudrait alors changer comment les attributs sont configurés
pour passer des strides et des offsets.

En étendant ça, on pourrait même mettre les données de toutes les parties dans les mêmes tampons,
alors qu'actuellement c'est un tampon par type de données par partie.

J'ai laissé ça de côté parce que je ne pense pas que ce soit si important et parce que ça
alourdirait l'exemple.

### On pourrait ré-indexer les sommets

Le code ci-dessus développe les sommets en listes plates de triangles. Nous aurions pu
ré-indexer les sommets. Surtout si on mettait toutes les données de sommets dans un seul
tampon ou au moins un seul tampon par type partagé entre les parties. Pour chaque mot-clé `f`,
on convertit les indices en nombres positifs (on traduit les nombres négatifs en index positifs
corrects), et l'ensemble de ces nombres est un *identifiant* pour ce sommet. On peut stocker
une *map id-vers-index* pour aider à chercher les indices.

```js
const idToIndexMap = {}
const webglIndices = [];

function addVertex(vert) {
  const ptn = vert.split('/');
  // d'abord convertit tous les indices en indices positifs
  const indices = ptn.forEach((objIndexStr, i) => {
    if (!objIndexStr) {
      return;
    }
    const objIndex = parseInt(objIndexStr);
    return objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
  });
  // vérifie si cette combinaison particulière de position,texcoord,normale
  // existe déjà
  const id = indices.join(',');
  let vertIndex = idToIndexMap[id];
  if (!vertIndex) {
    // Non. On l'ajoute.
    vertIndex = webglVertexData[0].length / 3;
    idToIndexMap[id] = vertexIndex;
    indices.forEach((index, i) => {
      if (index !== undefined) {
        webglVertexData[i].push(...objVertexData[i][index]);
      }
    }
  }
  webglIndices.push(vertexIndex);
}
```

Ou on pourrait simplement ré-indexer manuellement si on pense que c'est important.

### Le code ne gère pas position seule ou position + texcoord seulement.

Le code tel qu'il est suppose que les normales existent. Comme nous l'avons fait pour
[l'exemple du tour de potier](webgl-3d-geometry-lathe.html), nous pourrions générer des
normales si elles n'existent pas, en tenant compte des groupes de lissage si on le souhaite.
Ou nous pourrions utiliser des shaders différents qui n'utilisent pas les normales ou qui
calculent les normales.

### Vous ne devriez pas utiliser les fichiers .OBJ

Honnêtement, vous ne devriez pas utiliser les fichiers .OBJ à mon avis. J'ai principalement
écrit ça comme exemple. Si vous pouvez extraire les données de sommets d'un fichier, vous
pouvez écrire des importeurs pour n'importe quel format.

Les problèmes avec les fichiers .OBJ incluent :

* pas de support pour les lumières ni les caméras

  Ça pourrait être acceptable parce que peut-être que vous chargez un tas de parties
  (comme des arbres, des buissons, des rochers pour un paysage) et vous n'avez pas besoin
  de caméras ni de lumières. Mais il est quand même agréable d'avoir l'option si vous voulez
  charger des scènes entières telles qu'un artiste les a créées.

* Pas de hiérarchie, pas de graphe de scène

  Si vous voulez charger une voiture, vous aimeriez idéalement pouvoir tourner les roues et
  les faire pivoter autour de leurs centres. C'est impossible avec .OBJ parce que .OBJ ne
  contient pas de [graphe de scène](webgl-scene-graph.html). Les formats plus récents incluent
  ces données, ce qui est bien plus utile si vous voulez orienter des parties, faire glisser une
  fenêtre, ouvrir une porte, déplacer les jambes d'un personnage, etc.

* pas de support pour l'animation ou le skinning

  Nous avons couvert le [skinning](webgl-skinning.html) ailleurs, mais .OBJ ne fournit aucune
  donnée pour le skinning ni pour l'animation. Là encore, ça pourrait être acceptable pour vos
  besoins, mais je préférerais un format qui gère plus de choses.

* .OBJ ne supporte pas les matériaux plus modernes.

  Les matériaux sont généralement assez spécifiques au moteur, mais dernièrement il y a au
  moins un accord sur les matériaux à rendu physique. .OBJ ne le supporte pas à ma connaissance.

* .OBJ nécessite de l'analyse

  À moins que vous ne fassiez une visionneuse générique permettant aux utilisateurs de charger
  des fichiers .OBJ, la meilleure pratique est d'utiliser un format qui nécessite le moins
  d'analyse possible. .GLTF est un format conçu pour WebGL. Il utilise JSON, donc vous pouvez
  juste le charger. Pour les données binaires, il utilise des formats prêts à être chargés
  directement dans le GPU, pas besoin d'analyser des nombres en tableaux la plupart du temps.

  Vous pouvez voir un exemple de chargement d'un fichier .GLTF dans [l'article sur le skinning](webgl-skinning.html).

  Si vous avez des fichiers .OBJ à utiliser, la meilleure pratique serait de les convertir
  d'abord hors ligne dans un autre format, puis d'utiliser le meilleur format sur votre page.
