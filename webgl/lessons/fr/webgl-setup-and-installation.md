Title: WebGL2 - Installation et configuration
Description: Comment développer avec WebGL
TOC: Installation et configuration


Techniquement, vous n'avez besoin que d'un navigateur web pour développer avec WebGL.
Rendez-vous sur [jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/) ou [jsbin.com](https://jsbin.com)
ou [codepen.io](https://codepen.io/greggman/pen/YGQjVV) et commencez simplement à appliquer les leçons ici.

Sur chacun d'eux, vous pouvez référencer des scripts externes en ajoutant une paire de balises `<script src="..."></script>`
si vous voulez utiliser des scripts externes.

Cependant, il y a des limites. WebGL a des restrictions plus strictes que Canvas2D pour le chargement d'images,
ce qui signifie que vous ne pouvez pas facilement accéder aux images du web pour votre travail WebGL.
De plus, c'est simplement plus rapide de travailler avec tout en local.

Supposons que vous vouliez exécuter et modifier les exemples de ce site. La première chose à faire
est de télécharger le site. [Vous pouvez le télécharger ici](https://github.com/gfxfundamentals/webgl2-fundamentals/tree/gh-pages).

{{{image url="resources/download-webglfundamentals.gif" }}}

Décompressez les fichiers dans un dossier.

## Utiliser un petit serveur web simple

Ensuite, vous devriez installer un petit serveur web. Je sais que « serveur web » semble intimidant, mais en réalité
[les serveurs web sont extrêmement simples](https://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

En voici un très simple avec une interface appelé [Servez](https://greggman.github.io/servez).

{{{image url="resources/servez.gif" }}}

Pointez-le vers le dossier où vous avez décompressé les fichiers, cliquez sur « Start », puis allez
dans votre navigateur sur [`http://localhost:8080/webgl/`]()`http://localhost:8080/webgl/) et choisissez
un exemple.

Si vous préférez la ligne de commande, une autre façon est d'utiliser [node.js](https://nodejs.org).
Téléchargez-le, installez-le, puis ouvrez une fenêtre d'invite de commandes / console / terminal. Si vous êtes sous Windows,
l'installateur ajoutera un « Node Command Prompt » spécial, utilisez-le.

Ensuite, installez [`servez`](https://github.com/greggman/servez-cli) en tapant

    npm -g install servez

Si vous êtes sous OSX, utilisez

    sudo npm -g install servez

Une fois fait, tapez

    servez path/to/folder/where/you/unzipped/files

Il devrait afficher quelque chose comme

{{{image url="resources/servez-response.png" }}}

Puis dans votre navigateur, allez sur [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/).

Si vous ne spécifiez pas de chemin, servez utilisera le dossier courant.

## Utiliser les outils de développement de votre navigateur

La plupart des navigateurs ont des outils de développement intégrés très complets.

{{{image url="resources/chrome-devtools.png" }}}

[La documentation pour Chrome est ici](https://developers.google.com/web/tools/chrome-devtools/),
[celle pour Firefox est ici](https://developer.mozilla.org/en-US/docs/Tools).

Apprenez à les utiliser. Vérifiez toujours la console JavaScript en premier. Si un problème survient, elle contiendra souvent
un message d'erreur. Lisez attentivement le message d'erreur et vous devriez obtenir un indice sur l'origine du problème.

{{{image url="resources/javascript-console.gif" }}}

## WebGL Lint

[Voici](https://greggman.github.io/webgl-lint/) un script pour vérifier plusieurs
erreurs WebGL. Ajoutez simplement ceci à votre page avant vos autres scripts

```
<script src="https://greggman.github.io/webgl-lint/webgl-lint.js"></script>
```

et votre programme lancera une exception s'il rencontre une erreur WebGL, et affichera si possible
plus d'informations.

[Vous pouvez également donner des noms à vos ressources WebGL](https://github.com/greggman/webgl-lint#naming-your-webgl-objects-buffers-textures-programs-etc)
(buffers, textures, shaders, programmes, ...) de sorte que lors d'un message d'erreur,
il inclura les noms des ressources liées à l'erreur.

## Extensions

Il existe divers inspecteurs WebGL.
[En voici un pour Chrome et Firefox](https://spector.babylonjs.com/).

{{{image url="https://camo.githubusercontent.com/5bbc9caf2fc0ecc2eebf615fa8348146b37b08fe/68747470733a2f2f73706563746f72646f632e626162796c6f6e6a732e636f6d2f70696374757265732f7469746c652e706e67" }}}

Note : [LISEZ LA DOCUMENTATION](https://github.com/BabylonJS/Spector.js/blob/master/readme.md) !

La version extension de spector.js capture des frames. Cela signifie qu'elle ne fonctionne que si
votre application WebGL s'initialise avec succès, puis fait le rendu dans une
boucle `requestAnimationFrame`. Vous cliquez sur le bouton « record » et il capture
tous les appels API WebGL pour une « frame ».

Cela signifie que sans adaptation, cela ne vous aidera pas à trouver des problèmes lors de l'initialisation.

Pour contourner cela, il y a 2 méthodes.

1. L'utiliser comme bibliothèque, pas comme extension.

   Voir [la documentation](https://github.com/BabylonJS/Spector.js/blob/master/readme.md). De cette façon, vous pouvez lui dire « Capture les commandes API WebGL maintenant ! »

2. Modifier votre application pour qu'elle ne démarre qu'au clic d'un bouton.

   Ainsi, vous pouvez aller dans l'extension, choisir « record », puis démarrer votre application.
   Si votre application n'anime pas, ajoutez simplement quelques fausses frames. Exemple :

```html
<button type="button">start</button>
<canvas id="canvas"></canvas>
```

```js
function main() {
  // Obtenir un contexte WebGL
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const startElem = document.querySelector('button');
  startElem.addEventListener('click', start, {once: true});

  function start() {
    // exécuter l'initialisation dans rAF car spector ne capture qu'à l'intérieur des événements rAF
    requestAnimationFrame(() => {
      // faire toute l'initialisation
      init(gl);
    });
    // ajouter quelques frames supplémentaires pour que spector ait quelque chose à observer.
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
  }
}

main();
```

Vous pouvez maintenant cliquer sur « record » dans l'extension spector.js, puis cliquer sur « start » dans votre page
et spector enregistrera votre initialisation.

Safari possède également une fonctionnalité similaire intégrée qui a [des problèmes similaires avec des solutions similaires](https://stackoverflow.com/questions/62446483/debugging-in-webgl).

Quand j'utilise un outil d'aide comme celui-ci, je clique souvent sur un appel de dessin et vérifie les uniforms. Si je vois un tas de `NaN` (NaN = Not a Number), je peux généralement remonter jusqu'au code qui a défini cet uniform et trouver le bug.

## Inspecter le code

Pensez aussi toujours que vous pouvez inspecter le code. Vous pouvez généralement simplement afficher le source

{{{image url="resources/view-source.gif" }}}

Même si vous ne pouvez pas faire un clic droit sur une page ou si le source est dans un fichier séparé,
vous pouvez toujours voir le source dans les outils de développement

{{{image url="resources/devtools-source.gif" }}}

## Commencer

J'espère que cela vous aidera à démarrer. [Retour aux leçons](index.html).
