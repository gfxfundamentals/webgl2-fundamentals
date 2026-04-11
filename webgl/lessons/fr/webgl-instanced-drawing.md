Title: WebGL2 Optimisation - Dessin instancié
Description: Dessiner plusieurs instances du même objet
TOC: Dessin instancié

WebGL dispose d'une fonctionnalité appelée *dessin instancié*.
C'est essentiellement une façon de dessiner plus d'une instance de
la même chose plus rapidement que de dessiner chaque chose individuellement.

Créons d'abord un exemple qui dessine plusieurs instances de
la même chose.

En partant d'un code *similaire* à celui avec lequel nous avons terminé à
la fin de [l'article sur la projection orthographique](webgl-3d-orthographic.html),
nous commençons avec ces 2 shaders

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
uniform mat4 matrix;

void main() {
  // Multiplier la position par la matrice.
  gl_Position = matrix * a_position;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 color;

out vec4 outColor;

void main() {
  outColor = color;
}
`;
```

Le vertex shader multiplie chaque sommet par une seule matrice que nous
avons vue dans [cet article](webgl-3d-orthographic.html) car c'est
un arrangement assez flexible. Le fragment shader utilise simplement
une couleur que nous passons via un uniform.

Pour dessiner, nous devons compiler les shaders, les lier ensemble
et rechercher les emplacements des attributs et uniforms.

```js
const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getUniformLocation(program, 'color');
const matrixLoc = gl.getUniformLocation(program, 'matrix');
```

et créer un vertex array object pour contenir l'état des attributs

```js
// Créer un vertex array object (état des attributs)
const vao = gl.createVertexArray();

// et en faire celui sur lequel on travaille actuellement
gl.bindVertexArray(vao);
```

Ensuite, nous devons fournir des données pour les positions via un buffer.

```js
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.1,  0.4,
    -0.1, -0.4,
     0.1, -0.4,
    -0.1,  0.4,
     0.1, -0.4,
     0.1,  0.4,
    -0.4, -0.1,
     0.4, -0.1,
    -0.4,  0.1,
    -0.4,  0.1,
     0.4, -0.1,
     0.4,  0.1,
  ]), gl.STATIC_DRAW);
const numVertices = 12;

// configurer l'attribut de position
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
    positionLoc,  // emplacement
    2,            // taille (nombre de valeurs à extraire du buffer par itération)
    gl.FLOAT,     // type de données dans le buffer
    false,        // normaliser
    0,            // stride (0 = calculer à partir de la taille et du type ci-dessus)
    0,            // décalage dans le buffer
);
```

Dessinons 5 instances. Nous allons créer 5 matrices et 5 couleurs pour
chaque instance.

```js
const numInstances = 5;
const matrices = [
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
];

const colors = [
  [ 1, 0, 0, 1, ],  // rouge
  [ 0, 1, 0, 1, ],  // vert
  [ 0, 0, 1, 1, ],  // bleu
  [ 1, 0, 1, 1, ],  // magenta
  [ 0, 1, 1, 1, ],  // cyan
];
```

Pour dessiner, nous utilisons d'abord le programme shader, puis configurons l'attribut,
et ensuite nous bouclons sur les 5 instances, calculant une nouvelle matrice
pour chacune, définissant l'uniform de matrice et de couleur
puis dessinant.

```js
function render(time) {
  time *= 0.001; // secondes

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Indiquer à WebGL comment convertir du clip space en pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  // configurer tous les attributs
  gl.bindVertexArray(vao);

  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

    const color = colors[ndx];

    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(matrixLoc, false, mat);

    gl.drawArrays(
        gl.TRIANGLES,
        0,             // décalage
        numVertices,   // nombre de sommets par instance
    );
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

Notez que la bibliothèque de calcul matriciel prend une matrice de destination optionnelle
à la fin de chaque fonction mathématique matricielle. Dans la plupart des articles,
nous n'avons pas utilisé cette fonctionnalité et laissé la bibliothèque allouer une nouvelle
matrice pour nous, mais cette fois nous voulons que le résultat soit stocké
dans les matrices que nous avons déjà créées.

Cela fonctionne et nous obtenons 5 symboles plus de couleurs différentes qui tournent.

{{{example url="../webgl-instanced-drawing-not-instanced.html"}}}

Cela a nécessité 5 appels chacun à `gl.uniform4v`, `gl.uniformMatrix4fv`,
et `gl.drawArrays` pour un total de 15 appels WebGL. Si nos
shaders étaient plus complexes, comme les shaders dans
[l'article sur l'éclairage spot](webgl-3d-lighting-spot.html),
nous aurions au moins 7 appels par objet, 6 appels à `gl.uniformXXX`
et un appel à `gl.drawArrays`. Si nous dessinions 400 objets,
ce serait 2800 appels WebGL.

Le dessin instancié est une façon de réduire ces appels. Il fonctionne en
vous permettant d'indiquer à WebGL combien de fois vous voulez que la même
chose soit dessinée (le nombre d'instances). Pour chaque attribut,
vous désignez si cet attribut va avancer vers la *valeur suivante*
de son buffer assigné à chaque fois que le vertex shader est
appelé (par défaut), ou seulement tous les N instances où N est généralement
1.

Ainsi, par exemple, au lieu de fournir `matrix` et `color`
depuis un uniform, nous les fournirions via des `attribute`s.
Nous mettrions la matrice et la couleur pour chaque instance dans un buffer,
configurerions les attributs pour extraire les données de ces buffers, et
indiquerions à WebGL de n'avancer vers la valeur suivante qu'une fois par instance.

Faisons-le !

D'abord, nous allons modifier les shaders pour utiliser des attributs pour `matrix`
et `color` au lieu d'uniforms.

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
-uniform mat4 matrix;
+in vec4 color;
+in mat4 matrix;
+
+out vec4 v_color;

void main() {
  // Multiplier la position par la matrice.
  gl_Position = matrix * a_position;

+  // Passer la couleur du sommet au fragment shader.
+  v_color = color;
}
`;
```

et

```js
const fragmentShaderSource = `#version 300 es
precision highp float;

-uniform vec4 color;
+// Passé depuis le vertex shader.
+in vec4 v_color;

out vec4 outColor;

void main() {
-  outColor = color;
+  outColor = v_color;
}
`;  
```

les attributs ne fonctionnent que dans le vertex shader donc nous devons
obtenir la couleur depuis un attribut dans le vertex shader
et la passer au fragment shader via un varying.

Ensuite, nous devons rechercher les emplacements de ces attributs.

```js
const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

const positionLoc = gl.getAttribLocation(program, 'a_position');
-const colorLoc = gl.getUniformLocation(program, 'color');
-const matrixLoc = gl.getUniformLocation(program, 'matrix');
+const colorLoc = gl.getAttribLocation(program, 'color');
+const matrixLoc = gl.getAttribLocation(program, 'matrix');
```

Maintenant, nous avons besoin d'un buffer pour contenir les matrices qui seront appliquées
à l'attribut. Puisqu'un buffer est mieux mis à jour en un seul
*bloc*, nous allons mettre toutes nos matrices dans le même `Float32Array`

```js
// configurer les matrices, une par instance
const numInstances = 5;
+// créer un tableau typé avec une vue par matrice
+const matrixData = new Float32Array(numInstances * 16);
```

Nous allons ensuite créer des vues `Float32Array`, une pour chaque matrice.

```js
-const matrices = [
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-];
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  const byteOffsetToMatrix = i * 16 * 4;
  const numFloatsForView = 16;
  matrices.push(new Float32Array(
      matrixData.buffer,
      byteOffsetToMatrix,
      numFloatsForView));
}
```

Ainsi, quand nous voulons référencer les données pour toutes les matrices,
nous pouvons utiliser `matrixData`, mais quand nous voulons une matrice individuelle,
nous pouvons utiliser `matrices[ndx]`.

Nous devons également créer un buffer sur le GPU pour ces données.
Nous avons seulement besoin d'allouer le buffer à ce stade, nous n'avons pas
besoin de fournir des données, donc le 2ème paramètre de `gl.bufferData`
est une taille qui alloue juste le buffer.

```js
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
// juste allouer le buffer
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);
```

Notez que nous avons passé `gl.DYNAMIC_DRAW` comme dernier paramètre. C'est un *indice*
à WebGL que nous allons changer ces données souvent.

Maintenant, nous devons configurer les attributs pour les matrices.
L'attribut matrix est un `mat4`. Un `mat4` utilise en fait
4 emplacements d'attributs consécutifs.

```js
const bytesPerMatrix = 4 * 16;
for (let i = 0; i < 4; ++i) {
  const loc = matrixLoc + i;
  gl.enableVertexAttribArray(loc);
  // noter le stride et le décalage
  const offset = i * 16;  // 4 flottants par ligne, 4 octets par flottant
  gl.vertexAttribPointer(
      loc,              // emplacement
      4,                // taille (nombre de valeurs à extraire du buffer par itération)
      gl.FLOAT,         // type de données dans le buffer
      false,            // normaliser
      bytesPerMatrix,   // stride, nombre d'octets à avancer pour atteindre le prochain ensemble de valeurs
      offset,           // décalage dans le buffer
  );
  // cette ligne indique que cet attribut ne change qu'une fois par instance
  gl.vertexAttribDivisor(loc, 1);
}
```

Le point le plus important concernant le dessin instancié est
l'appel à `gl.vertexAttribDivisor`. Il configure cet
attribut pour n'avancer vers la valeur suivante qu'une fois par instance.
Cela signifie que les attributs `matrix` utiliseront la première matrice pour
chaque sommet de la première instance, la deuxième matrice pour la
deuxième instance, et ainsi de suite.

Ensuite, nous avons besoin de nos couleurs aussi dans un buffer. Ces données ne vont pas
changer, du moins dans cet exemple, donc nous allons juste téléverser
les données.

```js
-const colors = [
-  [ 1, 0, 0, 1, ],  // rouge
-  [ 0, 1, 0, 1, ],  // vert
-  [ 0, 0, 1, 1, ],  // bleu
-  [ 1, 0, 1, 1, ],  // magenta
-  [ 0, 1, 1, 1, ],  // cyan
-];
+// configurer les couleurs, une par instance
+const colorBuffer = gl.createBuffer();
+gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
+gl.bufferData(gl.ARRAY_BUFFER,
+    new Float32Array([
+        1, 0, 0, 1,  // rouge
+        0, 1, 0, 1,  // vert
+        0, 0, 1, 1,  // bleu
+        1, 0, 1, 1,  // magenta
+        0, 1, 1, 1,  // cyan
+      ]),
+    gl.STATIC_DRAW);
```

Nous devons également configurer l'attribut de couleur

```js
// configurer l'attribut pour la couleur
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
// cette ligne indique que cet attribut ne change qu'une fois par instance
gl.vertexAttribDivisor(colorLoc, 1);
```

Au moment du dessin, au lieu de boucler sur chaque instance,
de définir les uniforms de matrice et de couleur, puis d'appeler draw,
nous allons d'abord calculer la matrice pour chaque instance.

```js
// mettre à jour toutes les matrices
matrices.forEach((mat, ndx) => {
  m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
  m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

-  const color = colors[ndx];
-
-  gl.uniform4fv(colorLoc, color);
-  gl.uniformMatrix4fv(matrixLoc, false, mat);
-
-  gl.drawArrays(
-      gl.TRIANGLES,
-      0,             // décalage
-      numVertices,   // nombre de sommets par instance
-  );
});
```

Comme notre bibliothèque de calcul matriciel prend une matrice de destination optionnelle
et comme nos matrices sont juste des vues `Float32Array` sur
le même `Float32Array` plus grand, quand nous avons fini, toutes les données matricielles
sont prêtes à être téléversées directement sur le GPU.

```js
// téléverser les nouvelles données matricielles
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
```

Enfin, nous pouvons dessiner toutes les instances en un seul appel de dessin.

```js
gl.drawArraysInstanced(
  gl.TRIANGLES,
  0,             // décalage
  numVertices,   // nombre de sommets par instance
  numInstances,  // nombre d'instances
);
```

{{{example url="../webgl-instanced-drawing.html"}}}

Dans l'exemple ci-dessus, nous avions 3 appels WebGL par forme * 5 formes
soit 15 appels au total. Maintenant nous n'avons plus que 2 appels pour les 5 formes,
un pour téléverser les matrices, un autre pour dessiner.

Je pense que cela va sans dire, mais peut-être que c'est seulement évident pour moi
car j'ai fait cela trop de fois. Le code ci-dessus ne tient pas compte
du rapport d'aspect du canvas.
Il n'utilise pas de [matrice de projection](webgl-3d-orthographic.html)
ni de [matrice de vue](webgl-3d-camera.html). Il était destiné uniquement
à démontrer le dessin instancié. Si vous vouliez une projection et/ou
une matrice de vue, nous pourrions ajouter le calcul en JavaScript. Cela signifierait
plus de travail pour JavaScript. La façon la plus évidente serait d'ajouter
un ou deux uniforms supplémentaires au vertex shader.

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 color;
in mat4 matrix;
+uniform mat4 projection;
+uniform mat4 view;

out vec4 v_color;

void main() {
  // Multiplier la position par la matrice.
-  gl_Position = matrix * a_position;
+  gl_Position = projection * view * matrix * a_position;

  // Passer la couleur du sommet au fragment shader.
  v_color = color;
}
`;
```

puis rechercher leurs emplacements au moment de l'initialisation

```js
const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
+const projectionLoc = gl.getUniformLocation(program, 'projection');
+const viewLoc = gl.getUniformLocation(program, 'view');
```

et les définir de manière appropriée au moment du rendu.

```js
gl.useProgram(program);

+// définir les matrices de vue et de projection car
+// elles sont partagées par toutes les instances
+const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+gl.uniformMatrix4fv(projectionLoc, false,
+    m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
+gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
```

{{{example url="../webgl-instanced-drawing-projection-view.html"}}}
