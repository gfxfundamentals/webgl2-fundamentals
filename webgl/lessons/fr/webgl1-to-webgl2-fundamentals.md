Title: Différences depuis WebGLFundamentals.org
Description: Les différences entre WebGLFundamentals.org et WebGL2Fundamentals.org
TOC: Différences de WebGLFundamentals.org à WebGL2Fundamentals.org


Si vous avez précédemment lu [webglfundamentals.org](https://webglfundamentals.org),
il y a quelques différences dont vous devriez être conscient.

## Littéraux de gabarits multilignes

Sur webglfundamentals.org, presque tous les scripts sont stockés
dans des balises `<script>` non-javascript.

    <script id="vertexshader" type="not-js">;
    shader
    goes
    here
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

Sur webgl2fundamentals.org, je suis passé à l'utilisation de
littéraux de gabarits multilignes.

    var vertexShaderSource = `
    shader
    goes
    here
    `;

Les littéraux de gabarits multilignes sont supportés sur tous les navigateurs
capables de WebGL sauf IE11. Si vous avez besoin de cibler IE11, pensez à utiliser un
transpileur comme [babel](https://babeljs.io).

## Tous les shaders utilisent la version GLSL 300 es

J'ai changé tous les shaders en GLSL 300 es. Je me suis dit à quoi ça sert
d'utiliser WebGL2 si vous n'allez pas utiliser les shaders WebGL2.

## Tous les exemples utilisent des Vertex Array Objects

Les Vertex Array Objects sont une fonctionnalité optionnelle dans WebGL1, mais
ils sont une fonctionnalité standard de WebGL2. [Je pense qu'ils devraient
être utilisés partout](webgl1-to-webgl2.html#Vertex-Array-Objects).
En fait, je me demande presque si je ne devrais pas revenir sur
webglfundamentals.org et les utiliser partout [en utilisant
un polyfill](https://github.com/greggman/oes-vertex-array-object-polyfill)
pour les quelques endroits où ils ne sont pas disponibles. Il y a sans doute zéro
inconvénient et votre code devient plus facile et plus efficace dans presque
tous les cas.

## Autres changements mineurs

*  J'ai essayé de restructurer légèrement de nombreux exemples pour montrer les motifs les plus courants.

   Par exemple, la plupart des applications définissent généralement l'état WebGL global comme le blending, le culling et le test de profondeur
   dans leur boucle de rendu car ces paramètres changent souvent plusieurs fois alors que sur
   webglfundamentals.org je les définissais au moment de l'initialisation car ils n'avaient besoin d'être
   définis qu'une seule fois, mais ce n'est pas un motif courant.

*  J'ai défini le viewport dans tous les exemples

   Je l'avais omis dans webglfundamentals.org car les exemples
   n'en ont pas réellement besoin, mais c'est nécessaire dans presque tout le code réel.

*  J'ai supprimé jquery.

   Quand j'ai commencé, `<input type="range">` n'était peut-être pas encore couramment
   supporté, mais maintenant il est supporté partout.

*  J'ai fait en sorte que toutes les fonctions utilitaires aient un préfixe

   Du code comme

       var program = createProgramFromScripts(...)

   est maintenant

       webglUtils.createProgramFromSources(...);

   J'espère que cela rend plus clair ce que sont ces fonctions
   et où les trouver.
