Title: WebGL2 - Redimensionner le Canvas
Description: Comment redimensionner un canvas WebGL et les problèmes associés
TOC: Redimensionner le Canvas

Voici ce que vous devez savoir pour modifier la taille du canvas.

Chaque canvas possède 2 tailles. La taille de son drawingbuffer, c'est-à-dire le nombre de pixels dans le canvas.
La seconde est la taille à laquelle le canvas est affiché. Le CSS détermine la taille d'affichage du canvas.

Vous pouvez définir la taille du drawingbuffer du canvas de 2 façons. La première en HTML

```html
<canvas id="c" width="400" height="300"></canvas>
```

La seconde en JavaScript

```html
<canvas id="c"></canvas>
```

JavaScript

```js
const canvas = document.querySelector("#c");
canvas.width = 400;
canvas.height = 300;
```

En ce qui concerne la taille d'affichage du canvas, si vous n'avez pas de CSS qui affecte la taille d'affichage du canvas,
la taille d'affichage sera la même que son drawingbuffer. Ainsi, dans les 2 exemples ci-dessus, le drawingbuffer du canvas est de 400x300
et sa taille d'affichage est également de 400x300.

Voici un exemple d'un canvas dont le drawingbuffer est de 10x15 pixels mais qui est affiché en 400x300 pixels sur la page

```html
<canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>
```

ou par exemple comme ceci

```html
<style>
#c {
  width: 400px;
  height: 300px;
}
</style>
<canvas id="c" width="10" height="15"></canvas>
```

Si nous dessinons une ligne rotative d'un pixel de large dans ce canvas, nous verrons quelque chose comme ceci

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

Pourquoi est-ce si flou ? Parce que le navigateur prend notre canvas de 10x15 pixels et l'étire à 400x300 pixels, et
généralement il l'applique un filtrage lors de l'étirement.

Alors, que faire si, par exemple, nous voulons que le canvas remplisse la fenêtre ? Eh bien, d'abord nous pouvons demander
au navigateur d'étirer le canvas pour remplir la fenêtre avec du CSS. Exemple

    <html>
      <head>
        <style>
          /*  */
          html, body {
            height: 100%;
            margin: 0;
          }
          /* faire en sorte que le canvas remplisse son conteneur */
          #c {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

Nous devons maintenant faire correspondre le drawingbuffer à la taille que le navigateur a choisie pour le canvas.
C'est malheureusement un sujet complexe. Passons en revue différentes méthodes.

## Utiliser `clientWidth` et `clientHeight`

C'est la façon la plus simple.
`clientWidth` et `clientHeight` sont des propriétés que tout élément HTML possède et qui nous indiquent
la taille de l'élément en pixels CSS.

> Note : Le rect client inclut tout padding CSS, donc si vous utilisez `clientWidth`
et/ou `clientHeight`, il est préférable de ne pas mettre de padding sur votre élément canvas.

En JavaScript, nous pouvons vérifier la taille à laquelle cet élément est affiché, puis ajuster
sa taille de drawingbuffer pour correspondre.

```js
function resizeCanvasToDisplaySize(canvas) {
  // Récupérer la taille à laquelle le navigateur affiche le canvas en pixels CSS.
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Vérifier si le canvas n'est pas à la même taille.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    // Mettre le canvas à la même taille
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

Appelons cette fonction juste avant de faire le rendu
pour qu'elle ajuste toujours le canvas à la taille souhaitée juste avant de dessiner.

```js
function drawScene() {
   resizeCanvasToDisplaySize(gl.canvas);

   ...
```

Et voilà le résultat

{{{example url="../webgl-resize-canvas.html" }}}

Hé, quelque chose ne va pas ! Pourquoi la ligne ne couvre-t-elle pas toute la zone ?

La raison est que lorsque nous redimensionnons le canvas, nous devons aussi appeler `gl.viewport` pour définir le viewport.
`gl.viewport` indique à WebGL comment convertir le clip space (-1 à +1) vers les pixels et où le faire
dans le canvas. Quand vous créez le contexte WebGL pour la première fois, WebGL définit le viewport pour correspondre à la taille
du canvas, mais ensuite c'est à vous de le définir. Si vous changez la taille du canvas,
vous devez indiquer à WebGL un nouveau réglage de viewport.

Modifions le code pour gérer cela. De plus, comme le contexte WebGL possède une
référence au canvas, passons-la dans resize.

    function drawScene() {
       resizeCanvasToDisplaySize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

Maintenant ça fonctionne.

{{{example url="../webgl-resize-canvas-viewport.html" }}}

Ouvrez cela dans une fenêtre séparée, redimensionnez la fenêtre, remarquez qu'il remplit toujours la fenêtre.

Je vous entends vous demander, *pourquoi WebGL ne définit-il pas le viewport automatiquement
quand nous changeons la taille du canvas ?* La raison est qu'il ne sait pas comment ni pourquoi
vous utilisez le viewport. Vous pourriez [faire le rendu dans un framebuffer](webgl-render-to-texture.html)
ou faire quelque chose d'autre qui nécessite une taille de viewport différente. WebGL n'a
aucun moyen de connaître votre intention, donc il ne peut pas définir automatiquement le viewport pour vous.

---

## Gérer `devicePixelRatio` et le Zoom

Pourquoi ce n'est pas la fin de l'histoire ? Eh bien, c'est là que ça se complique.

La première chose à comprendre est que la plupart des tailles dans le navigateur sont en unités de pixels CSS.
C'est une tentative de rendre les tailles indépendantes de l'appareil. Par exemple,
en haut de cet article, nous avons défini la taille d'affichage du canvas à 400x300 pixels CSS.
Selon que l'utilisateur a un écran HD-DPI, est zoomé ou dézoomé,
ou a un niveau de zoom OS défini, le nombre réel de pixels sur le moniteur sera différent.

`window.devicePixelRatio` nous dira en général le rapport entre les pixels réels
et les pixels CSS sur votre moniteur. Par exemple, voici le réglage actuel de votre navigateur

> <div>devicePixelRatio = <span data-diagram="dpr"></span></div>

Si vous êtes sur un ordinateur de bureau ou un ordinateur portable, essayez d'appuyer sur <kbd>ctrl</kbd>+<kbd>+</kbd> et <kbd>ctrl</kbd>+<kbd>-</kbd> pour zoomer et dézoomer (<kbd>⌘</kbd>+<kbd>+</kbd> et <kbd>⌘</kbd>+<kbd>-</kbd> sur Mac). Vous devriez voir le nombre changer.

Donc si nous voulons que le nombre de pixels dans le canvas corresponde au nombre de pixels réellement utilisés pour l'afficher,
la solution apparemment évidente serait de multiplier `clientWidth` et `clientHeight` par `devicePixelRatio` comme ceci :

```js
function resizeCanvasToDisplaySize(canvas) {
  // Récupérer la taille à laquelle le navigateur affiche le canvas en pixels CSS.
-  const displayWidth  = canvas.clientWidth;
-  const displayHeight = canvas.clientHeight;
+  const dpr = window.devicePixelRatio;
+  const displayWidth  = Math.round(canvas.clientWidth * dpr);
+  const displayHeight = Math.round(canvas.clientHeight * dpr);

  // Vérifier si le canvas n'est pas à la même taille.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // Mettre le canvas à la même taille
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

Nous devons appeler `Math.round` (ou `Math.ceil`, ou `Math.floor` ou `| 0`) pour obtenir un entier
car `canvas.width` et `canvas.height` sont toujours des entiers, donc notre comparaison pourrait échouer
si `devicePixelRatio` n'est pas un entier, ce qui est courant, surtout si l'utilisateur zoome.

> Note : L'utilisation de `Math.floor` ou `Math.ceil` ou `Math.round` n'est pas définie par la spécification HTML.
C'est au navigateur d'en décider. 🙄

En tout cas, cela **ne fonctionnera pas** réellement. Le nouveau problème est que si le `devicePixelRatio` n'est pas 1.0,
la taille CSS que le canvas doit avoir pour remplir une zone donnée peut ne pas être une valeur entière
mais `clientWidth` et `clientHeight` sont définis comme des entiers. Disons que la fenêtre fait
999 pixels réels de large, votre devicePixelRatio = 2.0 et vous demandez un canvas de 100%.
Il n'y a pas de taille CSS entière * 2.0 qui = 999.

La solution suivante est d'utiliser
[`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
Elle retourne un [`DOMRect`](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect)
qui a un `width` et un `height`. C'est le même
rect client que représenté par `clientWidth` et `clientHeight` mais il n'est pas obligé
d'être un entier.

Ci-dessous, un `<canvas>` violet est réglé à `width: 100%` de son conteneur. Dézoomez quelques fois à 75% ou 60%
et vous verrez peut-être son `clientWidth` et son `getBoundingClientRect().width` diverger.

> <div data-diagram="getBoundingClientRect"></div>

Sur mes machines j'obtiens ces lectures

```
Windows 10, zoom level 75%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level 90%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level -1, Safari (safari does not show the zoom level)
clientWidth: 700
getBoundingClientRect().width = 699.9999389648438

Firefox, both Windows and MacOS all zoom levels
clientWidth: 700
getBoundingClientRect().width = 700
```

Note : Firefox affichait 700 dans ce cas particulier, mais avec suffisamment de tests variés,
je l'ai vu retourner un résultat non entier depuis `getBoundingClientRect`. Par exemple, rendez la fenêtre
étroite pour que le canvas 100% soit plus petit que 700 et vous pourriez obtenir un résultat non entier sur Firefox.

Donc, étant donné cela, nous pourrions essayer d'utiliser `getBoundingClientRect`.

```js
function resizeCanvasToDisplaySize(canvas) {
  // Récupérer la taille à laquelle le navigateur affiche le canvas en pixels CSS.
  const dpr = window.devicePixelRatio;
-  const displayWidth  = Math.round(canvas.clientWidth * dpr);
-  const displayHeight = Math.round(canvas.clientHeight * dpr);
+  const {width, height} = canvas.getBoundingClientRect();
+  const displayWidth  = Math.round(width * dpr);
+  const displayHeight = Math.round(height * dpr);

  // Vérifier si le canvas n'est pas à la même taille.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // Mettre le canvas à la même taille
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

Avons-nous terminé ? Malheureusement non. Il s'avère que `canvas.getBoundingClientRect()` ne peut pas
toujours retourner la taille exactement correcte. La raison est complexe mais cela a à voir avec
la façon dont le navigateur décide de dessiner les choses. Certaines parties sont décidées au niveau HTML
et certaines parties sont décidées plus tard au niveau du « compositeur » (la partie qui dessine réellement).
`getBoundingClientRect()` se produit au niveau HTML, mais certaines choses se produisent après cela
qui pourraient affecter la taille réelle à laquelle le canvas est dessiné.

Je pense qu'un exemple est que la partie HTML fonctionne dans l'abstrait et le compositeur
fonctionne dans le concret. Disons que vous avez une fenêtre de 999 pixels d'appareil
de large et un devicePixelRatio de 2.0. Vous faites deux éléments côte à côte qui font
`width: 50%`. Donc HTML calcule que chacun devrait faire 499,5 pixels d'appareil. Mais quand il
vient réellement le temps de dessiner, le compositeur ne peut pas dessiner 499,5 pixels, donc un
élément obtient 499 et l'autre 500. Lequel obtient ou perd un pixel n'est
défini par aucune spécification.

La solution que les fournisseurs de navigateurs ont trouvée est d'utiliser l'
[API `ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
et de fournir la taille réelle utilisée via la propriété `devicePixelContextBoxSize` des
entrées qu'elle fournit.
Elle retourne le nombre réel de pixels d'appareil utilisés. Notez qu'il s'appelle la
`ContentBox` et non la `ClientBox`, ce qui signifie que c'est la partie réelle de
l'élément canvas affichant le *contenu* du canvas, donc elle n'inclut pas le padding comme
`clientWidth`, `clientHeight` et `getBoundingClientRect`, ce qui est un avantage appréciable.

Elle est retournée de cette façon car le résultat est asynchrone. Le « compositeur » mentionné
ci-dessus s'exécute de façon asynchrone par rapport à la page. Il peut déterminer la taille qu'il va réellement utiliser et ensuite vous envoyer cette taille *en dehors du flux normal*.

Malheureusement, bien que le `ResizeObserver` soit disponible dans tous les navigateurs modernes,
le `devicePixelContentBoxSize` n'est disponible que dans Chrome/Edge pour l'instant. Voici comment
l'utiliser.

Nous créons un `ResizeObserver` et lui passons une fonction à appeler chaque fois que les éléments
que nous observons changent de taille. Dans notre cas, c'est notre canvas.

```js
const resizeObserver = new ResizeObserver(onResize);
resizeObserver.observe(canvas, {box: 'content-box'});
```

Le code ci-dessus crée un `ResizeObserver` qui appellera la fonction `onResize`
(ci-dessous) quand un élément que nous observons change de taille. Nous lui disons d'`observer` notre
canvas. Nous lui disons d'observer quand la `content-box` change de taille. C'est
important et un peu déroutant. Nous pourrions lui demander de nous dire quand la
`device-pixel-content-box` change de taille, mais imaginons que nous ayons un canvas qui
fait une certaine taille en pourcentage de la fenêtre comme le courant 100% de notre exemple de ligne
ci-dessus. Dans ce cas, notre canvas aura toujours le même nombre de pixels d'appareil
quel que soit le niveau de zoom. La fenêtre n'a pas changé de taille quand nous zoomons, donc il y a
toujours le même nombre de pixels d'appareil. D'autre part, la `content-box` changera
quand nous zoomons car elle est mesurée en pixels CSS, donc en zoomant, plus ou moins
de pixels CSS tiennent dans le nombre de pixels d'appareil.

Si nous ne nous soucions pas du niveau de zoom, nous pourrions simplement observer `device-pixel-content-box`.
Cela lancera une erreur si ce n'est pas supporté, donc nous ferions quelque chose comme ceci

```js
const resizeObserver = new ResizeObserver(onResize);
try {
  // ne nous appeler que si le nombre de pixels d'appareil change
  resizeObserver.observe(canvas, {box: 'device-pixel-content-box'});
} catch (ex) {
  // device-pixel-content-box n'est pas supporté, donc utiliser cette alternative
  resizeObserver.observe(canvas, {box: 'content-box'});
}
```

La fonction `onResize` sera appelée avec un tableau de [`ResizeObserverEntry`s](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry). Un pour chaque élément
qui a changé de taille. Nous enregistrerons la taille dans une map pour pouvoir gérer plus d'un élément.

```js
// initialiser avec la taille par défaut du canvas
const canvasToDisplaySizeMap = new Map([[canvas, [300, 150]]]);

function onResize(entries) {
  for (const entry of entries) {
    let width;
    let height;
    let dpr = window.devicePixelRatio;
    if (entry.devicePixelContentBoxSize) {
      // NOTE : Seul ce chemin donne la réponse correcte
      // Les autres chemins sont des alternatives imparfaites
      // pour les navigateurs qui ne fournissent pas de moyen de faire cela
      width = entry.devicePixelContentBoxSize[0].inlineSize;
      height = entry.devicePixelContentBoxSize[0].blockSize;
      dpr = 1; // c'est déjà dans width et height
    } else if (entry.contentBoxSize) {
      if (entry.contentBoxSize[0]) {
        width = entry.contentBoxSize[0].inlineSize;
        height = entry.contentBoxSize[0].blockSize;
      } else {
        width = entry.contentBoxSize.inlineSize;
        height = entry.contentBoxSize.blockSize;
      }
    } else {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
    canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight]);
  }
}
```

C'est un peu le bazar. Vous pouvez voir que l'API a évolué en au moins 3 versions différentes
avant de supporter `devicePixelContentBoxSize` 😂

Maintenant, nous allons changer notre fonction de redimensionnement pour utiliser ces données

```js
function resizeCanvasToDisplaySize(canvas) {
-  // Récupérer la taille à laquelle le navigateur affiche le canvas en pixels CSS.
-  const dpr = window.devicePixelRatio;
-  const {width, height} = canvas.getBoundingClientRect();
-  const displayWidth  = Math.round(width * dpr);
-  const displayHeight = Math.round(height * dpr);
+  // Obtenir la taille à laquelle le navigateur affiche le canvas en pixels d'appareil.
+ const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);

  // Vérifier si le canvas n'est pas à la même taille.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // Mettre le canvas à la même taille
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

Voici un exemple utilisant ce code

{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}

Il peut être difficile de voir une différence. Si vous avez un écran HD-DPI
comme votre smartphone, ou tous les Mac depuis 2019, ou peut-être un moniteur 4k, cette
ligne devrait être plus fine que la ligne de l'exemple précédent.

Sinon, si vous zoomez (je suggère d'ouvrir l'exemple dans une nouvelle fenêtre), en zoomant,
la ligne devrait garder la même résolution, alors que si vous zoomez dans l'exemple précédent,
la ligne deviendra plus épaisse et de résolution plus basse car elle ne s'adapte pas au `devicePixelRatio`.

Juste comme test, voici les 3 méthodes ci-dessus utilisant simplement un canvas 2D.
Pour simplifier, cela n'utilise pas WebGL. À la place, il utilise Canvas 2D et crée 2 motifs, un motif vertical noir et blanc de 2x2 pixels et un motif horizontal noir et blanc de 2x2 pixels.
Il dessine le motif horizontal ▤ à gauche et le motif vertical ▥ à droite.

{{{example url="../webgl-resize-the-canvas-comparison.html"}}}

Redimensionnez cette fenêtre, ou mieux, ouvrez-la dans une nouvelle fenêtre et zoomez avec
les touches mentionnées ci-dessus. À différents niveaux de zoom, redimensionnez la fenêtre, et remarquez
que seul le bas fonctionne dans tous les cas (dans Chrome/Edge). Notez que plus le `devicePixelRatio`
de votre appareil est élevé, plus il peut être difficile de voir les problèmes. Ce que vous
devriez voir est un motif uniforme à gauche et à droite. Si vous voyez des motifs durs
ou des dégradés de luminosité différents, cela ne fonctionne pas.
Puisque cela ne fonctionnera que dans Chrome/Edge, vous devrez l'essayer là pour le voir fonctionner.

Notez aussi que certains OS (MacOS) fournissent une option de mise à l'échelle au niveau OS qui est en grande partie
cachée des applications. Dans ce cas, vous verrez un léger motif dans l'exemple du bas
(en supposant que vous êtes dans Chrome/Edge) mais ce sera un motif régulier.

Cela soulève la question qu'il n'y a pas de bonne solution sur les autres navigateurs, mais en avez-vous besoin ?
La majorité des applications WebGL font quelque chose comme dessiner des objets en 3D
avec des textures et/ou de l'éclairage. En tant que tel, il est souvent imperceptible d'utiliser
la solution supérieure où nous ignorons `devicePixelRatio`, ou d'utiliser `clientWidth`, `clientHeight`
ou `getBoundingClientRect()` * `devicePixelRatio` sans s'en préoccuper davantage.

De plus, utiliser aveuglément `devicePixelRatio` peut vraiment ralentir vos performances.
Sur iPhone X ou iPhone 11, <code>window.devicePixelRatio</code> est <code>3</code>, ce qui signifie
que vous dessinerez 9 fois plus de pixels. Sur un Samsung Galaxy S8, cette valeur est <code>4</code>, ce qui signifie que vous dessinerez
16 fois plus de pixels. Cela peut vraiment ralentir votre programme. En fait, c'est une optimisation courante dans les jeux de rendre moins de pixels
que ceux affichés et de laisser le GPU les agrandir. Cela dépend vraiment de vos besoins. Si vous dessinez
un graphique pour l'impression, vous voudrez peut-être supporter le HD-DPI. Si vous faites un jeu, peut-être pas, ou vous voudrez peut-être donner à
l'utilisateur la possibilité d'activer ou de désactiver le support si son système n'est pas assez rapide pour dessiner autant de pixels.

Une autre mise en garde est qu'au moins en janvier 2021, `round(getBoundingClientRect * devicePixelRatio)` fonctionne sur tous les navigateurs modernes **SI et SEULEMENT SI** le canvas occupe toute la fenêtre comme l'exemple de ligne ci-dessus. Voici un exemple utilisant les motifs

{{{example url="../webgl-resize-the-canvas-comparison-fullwindow.html"}}}

Vous remarquerez que si vous zoomez et redimensionnez *cette page*, cela échouera avec `getBoundingClientRect`.
C'est parce que le canvas n'occupe pas toute la fenêtre, il est dans une iframe. Ouvrez l'exemple
dans une fenêtre séparée et cela fonctionnera.

La solution que vous utilisez dépend de vous. Pour moi, 99% du temps je n'utilise pas
`devicePixelRatio`. Cela ralentit mes pages et sauf pour quelques professionnels de la graphique, la plupart
des gens ne remarqueront pas de différence. Sur ce site, il y a quelques diagrammes où c'est
utilisé, mais la majorité des exemples ne le font pas.

Si vous regardez de nombreux programmes WebGL, ils gèrent le redimensionnement ou la définition de la taille du canvas de nombreuses façons différentes.
Je pense que la meilleure façon est de laisser le navigateur choisir la taille d'affichage du canvas avec CSS, puis de récupérer la taille choisie et d'ajuster
le nombre de pixels dans le canvas en réponse.
Si vous êtes curieux, <a href="webgl-anti-patterns.html">voici quelques raisons</a> pour lesquelles je pense que la méthode décrite ci-dessus est préférable.


<!-- just to shut up the build that this link used to exist
     and still exists in older translations -->
<a href="webgl-animation.html"></a>

<script type="module" src="resources/webgl-resizing-the-canvas.module.js"></script>
