Title: WebGL2 Conseils
Description: Petits problèmes qui pourraient vous faire trébucher avec WebGL
TOC: #

Cet article est une collection de petits problèmes que vous pourriez rencontrer
en utilisant WebGL et qui semblaient trop petits pour avoir leur propre article.

---

<a id="screenshot" data-toc="Prendre une capture d'écran"></a>

# Prendre une capture d'écran du canvas

Dans le navigateur, il y a effectivement 2 fonctions qui prendront une capture d'écran.
L'ancienne
[`canvas.toDataURL`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)
et la nouvelle meilleure
[`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

Donc vous penseriez qu'il serait facile de prendre une capture d'écran juste en ajoutant du code comme

```html
<canvas id="c"></canvas>
+<button id="screenshot" type="button">Sauvegarder...</button>
```

```js
const elem = document.querySelector('#screenshot');
elem.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});

const saveBlob = (function() {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  return function saveData(blob, fileName) {
     const url = window.URL.createObjectURL(blob);
     a.href = url;
     a.download = fileName;
     a.click();
  };
}());
```

Voici l'exemple de [l'article sur l'animation](webgl-animation.html)
avec le code ci-dessus ajouté et un peu de CSS pour placer le bouton

{{{example url="../webgl-tips-screenshot-bad.html"}}}

Quand j'ai essayé, j'ai obtenu cette capture d'écran

<div class="webgl_center"><img src="resources/screencapture-398x298.png"></div>

Oui, c'est juste une image vide.

Il est possible que cela ait fonctionné pour vous selon votre navigateur/OS, mais en général
c'est peu probable de fonctionner.

Le problème est que pour des raisons de performance et de compatibilité, par défaut le navigateur
va effacer le drawing buffer d'un canvas WebGL après que vous y avez dessiné.

Il y a 3 solutions.

1.  appeler votre code de rendu juste avant la capture

    Le code que nous avons utilisé comme fonction `drawScene`. Il serait préférable de faire en sorte que ce
    code ne change aucun état, puis nous pourrions l'appeler pour rendre avant la capture.

    ```js
    elem.addEventListener('click', () => {
    +  drawScene();
      canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
      });
    });
    ```

2.  appeler le code de capture dans notre boucle de rendu

    Dans ce cas, nous définirions juste un indicateur que nous voulons capturer, puis
    dans la boucle de rendu faire réellement la capture

    ```js
    let needCapture = false;
    elem.addEventListener('click', () => {
       needCapture = true;
    });
    ```

    et ensuite dans notre boucle de rendu, qui est actuellement implémentée dans `drawScene`,
    quelque part après que tout a été dessiné

    ```js
    function drawScene(time) {
      ...

    +  if (needCapture) {
    +    needCapture = false;
    +    canvas.toBlob((blob) => {
    +      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    +    });
    +  }

      ...
    }
    ```

3. Définir `preserveDrawingBuffer: true` lors de la création du contexte WebGL

    ```js
    const gl = someCanvas.getContext('webgl2', {preserveDrawingBuffer: true});
    ```

    Cela fait que WebGL n'efface pas le canvas après avoir composité le canvas avec le
    reste de la page, mais empêche certaines optimisations *possibles*.

Je choisirais le #1 ci-dessus. Pour cet exemple particulier, je séparerais d'abord les parties du
code qui mettent à jour l'état des parties qui dessinent.

```js
  var then = 0;

-  requestAnimationFrame(drawScene);
+  requestAnimationFrame(renderLoop);

+  function renderLoop(now) {
+    // Convertir en secondes
+    now *= 0.001;
+    // Soustraire le temps précédent du temps actuel
+    var deltaTime = now - then;
+    // Mémoriser le temps actuel pour la prochaine frame.
+    then = now;
+
+    // À chaque frame, augmenter un peu la rotation.
+    rotation[1] += rotationSpeed * deltaTime;
+
+    drawScene();
+
+    // Appeler renderLoop à nouveau la prochaine frame
+    requestAnimationFrame(renderLoop);
+  }

  // Dessiner la scène.
+  function drawScene() {
- function drawScene(now) {
-    // Convertir en secondes
-    now *= 0.001;
-    // Soustraire le temps précédent du temps actuel
-    var deltaTime = now - then;
-    // Mémoriser le temps actuel pour la prochaine frame.
-    then = now;
-
-    // À chaque frame, augmenter un peu la rotation.
-    rotation[1] += rotationSpeed * deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    ...

-    // Appeler drawScene à nouveau la prochaine frame
-    requestAnimationFrame(drawScene);
  }
```

et maintenant nous pouvons juste appeler `drawScene` avant la capture

```js
elem.addEventListener('click', () => {
+  drawScene();
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});
```

Et maintenant ça devrait fonctionner.

{{{example url="../webgl-tips-screenshot-good.html" }}}

Si vous vérifiez l'image capturée, vous verrez que le fond est transparent.
Voir [cet article](webgl-and-alpha.html) pour quelques détails.

---

<a id="preservedrawingbuffer" data-toc="Empêcher l'effacement du canvas"></a>

# Empêcher l'effacement du canvas

Disons que vous vouliez laisser l'utilisateur peindre avec un objet animé.
Vous devez passer `preserveDrawingBuffer: true` quand
vous créez le contexte WebGL. Cela empêche le navigateur
d'effacer le canvas.

En prenant le dernier exemple de [l'article sur l'animation](webgl-animation.html)

```js
var canvas = document.querySelector("#canvas");
-var gl = canvas.getContext("webgl2");
+var gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
```

et changer l'appel à `gl.clear` pour qu'il n'efface que le depth buffer

```
-// Effacer le canvas.
-gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+// Effacer le depth buffer.
+gl.clear(gl.DEPTH_BUFFER_BIT);
```

{{{example url="../webgl-tips-preservedrawingbuffer.html" }}}

Notez que si vous étiez sérieux dans la création d'un programme de dessin, ce ne serait pas une
solution car le navigateur effacera quand même le canvas chaque fois que nous changeons sa
résolution. Nous changeons sa résolution en fonction de sa taille d'affichage. Sa taille d'affichage
change quand la taille de la fenêtre change. Cela peut inclure quand l'utilisateur télécharge
un fichier, même dans un autre onglet, et que le navigateur ajoute une barre d'état. Cela inclut aussi quand
l'utilisateur retourne son téléphone et que le navigateur passe du portrait au paysage.

Si vous vouliez vraiment créer un programme de dessin, vous rendriez
[vers une texture](webgl-render-to-texture.html).

---

<a id="tabindex" data-toc="Obtenir des entrées clavier depuis un canvas"></a>

# Obtenir des entrées clavier

Si vous faites une application WebGL pleine page / plein écran, vous pouvez faire
ce que vous voulez, mais souvent vous voudriez qu'un canvas ne soit qu'une partie d'une page plus grande et
vous voudriez que si l'utilisateur clique sur le canvas, le canvas reçoive des entrées clavier.
Un canvas ne peut normalement pas recevoir d'entrées clavier. Pour corriger ça, définissez le
[`tabindex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex)
du canvas à 0 ou plus. Par exemple :

```html
<canvas tabindex="0"></canvas>
```

Cela finit par causer un nouveau problème. Tout ce qui a un `tabindex` défini
sera mis en surbrillance quand il a le focus. Pour corriger ça, définissez son contour CSS de focus
à none

```css
canvas:focus {
  outline:none;
}
```

Pour illustrer, voici 3 canvases

```html
<canvas id="c1"></canvas>
<canvas id="c2" tabindex="0"></canvas>
<canvas id="c3" tabindex="1"></canvas>
```

et un peu de CSS juste pour le dernier canvas

```css
#c3:focus {
    outline: none;
}
```

Attachons les mêmes écouteurs d'événements à tous

```js
document.querySelectorAll('canvas').forEach((canvas) => {
  const ctx = canvas.getContext('2d');

  function draw(str) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, canvas.width / 2, canvas.height / 2);
  }
  draw(canvas.id);

  canvas.addEventListener('focus', () => {
    draw('a le focus, appuyez sur une touche');
  });

  canvas.addEventListener('blur', () => {
    draw('perdu le focus');
  });

  canvas.addEventListener('keydown', (e) => {
    draw(`keyCode: ${e.keyCode}`);
  });
});
```

Remarquez que vous ne pouvez pas faire accepter des entrées clavier au premier canvas.
Le deuxième canvas vous le pouvez mais il est mis en surbrillance. Le 3ème
canvas a les deux solutions appliquées.

{{{example url="../webgl-tips-tabindex.html"}}}

---

<a id="html-background" data-toc="Utiliser WebGL2 comme arrière-plan en HTML"></a>

# Faire de votre arrière-plan une animation WebGL

Une question courante est comment faire d'une animation WebGL l'arrière-plan d'une
page web.

Il y a 2 façons évidentes.

* Définir la `position` CSS du canvas à `fixed` comme dans

```css
#canvas {
 position: fixed;
 left: 0;
 top: 0;
 z-index: -1;
 ...
}
```

et définir `z-index` à -1.

Un petit inconvénient de cette solution est que votre JavaScript doit s'intégrer avec la page
et si vous avez une page complexe, vous devez vous assurer qu'aucun JavaScript de votre
code WebGL n'entre en conflit avec le JavaScript faisant d'autres choses dans la page.

* Utiliser un `iframe`

C'est la solution utilisée sur [la page d'accueil de ce site](/).

Dans votre page web, insérez simplement un iframe, par exemple

```html
<iframe id="background" src="background.html"></iframe>
<div>
  Votre contenu va ici.
</div>
```

Ensuite, stylez l'iframe pour remplir la fenêtre et être en arrière-plan,
ce qui est fondamentalement le même code que nous avons utilisé ci-dessus pour le canvas
sauf que nous devons aussi définir `border` à `none` car les iframes ont
une bordure par défaut.

```css
#background {
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: -1;
    border: none;
    pointer-events: none;
}
```

{{{example url="../webgl-tips-html-background.html"}}}
