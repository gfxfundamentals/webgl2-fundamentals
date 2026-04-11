Title: WebGL2 - Code standard (Boilerplate)
Description: Du code nécessaire dans tout programme WebGL
TOC: Code standard (Boilerplate)


Ceci est la suite de [WebGL2 - Les bases](webgl-fundamentals.html).
WebGL peut sembler compliqué à apprendre car la plupart des tutoriels
couvrent tout en même temps. J'essaierai d'éviter cela autant que possible
et de décomposer les choses en petites parties.

L'une des choses qui rend WebGL compliqué en apparence est que vous avez ces 2
petites fonctions, un vertex shader et un fragment shader. Ces deux
fonctions s'exécutent sur votre GPU, ce qui est la source de toute la vitesse.
C'est aussi pourquoi elles sont écrites dans un langage personnalisé, un langage qui
correspond à ce que le GPU peut faire. Ces 2 fonctions doivent être compilées et
liées. Ce processus est, dans 99% des cas, identique dans tout programme WebGL.

Voici le code standard pour compiler un shader.

    /**
     * Crée et compile un shader.
     *
     * @param {!WebGLRenderingContext} gl Le contexte WebGL.
     * @param {string} shaderSource Le code source GLSL pour le shader.
     * @param {number} shaderType Le type de shader, VERTEX_SHADER ou
     *     FRAGMENT_SHADER.
     * @return {!WebGLShader} Le shader.
     */
    function compileShader(gl, shaderSource, shaderType) {
      // Créer l'objet shader
      var shader = gl.createShader(shaderType);

      // Définir le code source du shader.
      gl.shaderSource(shader, shaderSource);

      // Compiler le shader
      gl.compileShader(shader);

      // Vérifier si la compilation a réussi
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // Quelque chose s'est mal passé lors de la compilation ; récupérer l'erreur
        throw ("impossible de compiler le shader:" + gl.getShaderInfoLog(shader));
      }

      return shader;
    }

Et le code standard pour lier 2 shaders en un programme

    /**
     * Crée un programme à partir de 2 shaders.
     *
     * @param {!WebGLRenderingContext) gl Le contexte WebGL.
     * @param {!WebGLShader} vertexShader Un vertex shader.
     * @param {!WebGLShader} fragmentShader Un fragment shader.
     * @return {!WebGLProgram} Un programme.
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // créer un programme.
      var program = gl.createProgram();

      // attacher les shaders.
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // lier le programme.
      gl.linkProgram(program);

      // Vérifier si la liaison a réussi.
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
          // quelque chose s'est mal passé avec la liaison ; récupérer l'erreur
          throw ("le programme n'a pas pu être lié:" + gl.getProgramInfoLog(program));
      }

      return program;
    };

Bien sûr, la façon dont vous choisissez de gérer les erreurs peut être différente. Lancer
des exceptions n'est peut-être pas la meilleure façon de faire les choses. Ces quelques
lignes de code sont cependant pratiquement identiques dans presque tout programme WebGL.

Maintenant que les template literals multilignes sont supportées par tous les navigateurs modernes,
c'est ma méthode préférée pour stocker les shaders. Je peux simplement faire quelque chose comme

    var vertexShaderSource = `#version 300 es

    in vec4 a_position;
    uniform mat4 u_matrix;

    void main() {
       gl_Position = u_matrix * a_position;
    }
    `;

Et avoir un shader facile à éditer. Certains anciens navigateurs comme IE n'apprécieront pas
cela, mais d'abord j'utilise WebGL donc je ne me soucie pas vraiment d'IE. Si je devais
m'en soucier et avoir une alternative non-WebGL, j'utiliserais une étape de build avec quelque chose comme
[Babel](https://babeljs.io/) pour convertir le code ci-dessus en quelque chose qu'IE comprend.

Par le passé, je préférais stocker mes shaders dans des balises &lt;script&gt; non-JavaScript.
Cela les rend également faciles à éditer, donc j'utilisais du code comme ceci.

    /**
     * Crée un shader à partir du contenu d'une balise script.
     *
     * @param {!WebGLRenderingContext} gl Le contexte WebGL.
     * @param {string} scriptId L'id de la balise script.
     * @param {string} opt_shaderType. Le type de shader à créer.
     *     Si non fourni, utilise l'attribut type de la
     *     balise script.
     * @return {!WebGLShader} Un shader.
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // chercher la balise script par id.
      var shaderScript = document.getElementById(scriptId);
      if (!shaderScript) {
        throw("*** Erreur : élément script inconnu" + scriptId);
      }

      // extraire le contenu de la balise script.
      var shaderSource = shaderScript.text;

      // Si nous n'avons pas passé de type, utiliser le 'type' de
      // la balise script.
      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          opt_shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          opt_shaderType = gl.FRAGMENT_SHADER;
        } else if (!opt_shaderType) {
          throw("*** Erreur : type de shader non défini");
        }
      }

      return compileShader(gl, shaderSource, opt_shaderType);
    };

Pour compiler un shader, je peux simplement faire

    var shader = compileShaderFromScript(gl, "someScriptTagId");

Je vais généralement un peu plus loin et crée une fonction pour compiler deux shaders
à partir de balises script, les attacher à un programme et les lier.

    /**
     * Crée un programme à partir de 2 balises script.
     *
     * @param {!WebGLRenderingContext} gl Le contexte WebGL.
     * @param {string} vertexShaderId L'id de la balise script du vertex shader.
     * @param {string} fragmentShaderId L'id de la balise script du fragment shader.
     * @return {!WebGLProgram} Un programme
     */
    function createProgramFromScripts(
        gl, vertexShaderId, fragmentShaderId) {
      var vertexShader = createShaderFromScriptTag(gl, vertexShaderId, gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScriptTag(gl, fragmentShaderId, gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

L'autre bout de code que j'utilise dans presque tout programme WebGL est quelque chose pour
redimensionner le canvas. Vous pouvez voir [comment cette fonction est implémentée ici](webgl-resizing-the-canvas.html).

Dans le cas de tous les exemples, ces 2 fonctions sont incluses avec

    <script src="resources/webgl-utils.js"></script>

et utilisées ainsi

    var program = webglUtils.createProgramFromScripts(
      gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

Il semble préférable de ne pas encombrer tous les exemples avec des nombreuses lignes du même code
car elles ne font que gêner la compréhension de ce dont traite l'exemple spécifique.

L'API de code standard réelle utilisée dans la plupart de ces exemples est

    /**
     * Crée un programme à partir de 2 sources.
     *
     * @param {WebGLRenderingContext} gl Le WebGLRenderingContext
     *        à utiliser.
     * @param {string[]} shaderSources Tableau de sources pour les
     *        shaders. La première est supposée être le vertex shader,
     *        la seconde le fragment shader.
     * @param {string[]} [opt_attribs] Un tableau de noms d'attributs.
     *        Les emplacements seront assignés par index si non fourni.
     * @param {number[]} [opt_locations] Les emplacements pour les attributs.
     *        Un tableau parallèle à opt_attribs permettant d'assigner des emplacements.
     * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback pour les erreurs.
     *        Par défaut, il affiche juste une erreur dans la console
     *        en cas d'erreur. Si vous voulez autre chose, passez un callback.
     *        Il reçoit un message d'erreur.
     * @return {WebGLProgram} Le programme créé.
     * @memberOf module:webgl-utils
     */
    function createProgramFromSources(gl,
                                      shaderSources,
                                      opt_attribs,
                                      opt_locations,
                                      opt_errorCallback)

où `shaderSources` est un tableau de chaînes contenant le code source GLSL.
La première chaîne du tableau est le code source du vertex shader. La seconde est
le code source du fragment shader.

C'est l'essentiel de mon code standard minimum pour WebGL.
[Vous pouvez trouver le code de `webgl-utils.js` ici](../resources/webgl-utils.js).
Si vous voulez quelque chose de légèrement mieux organisé, regardez [TWGL.js](https://twgljs.org).

Le reste de ce qui rend WebGL complexe est la configuration de toutes les entrées
pour vos shaders. Voir [comment ça marche](webgl-how-it-works.html).

Je vous suggère également de lire [moins de code, plus de fun](webgl-less-code-more-fun.html) et de regarder [TWGL](https://twgljs.org).

Notez que pendant que nous y sommes, il y a plusieurs autres scripts pour des raisons similaires

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    Ce code permet de configurer des curseurs avec une valeur visible qui se met à jour lors du glissement.
    Je ne voulais pas non plus encombrer tous les fichiers avec ce code, donc il est regroupé en un seul endroit.

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    Ce script n'est nécessaire que sur webgl2fundamentals.org. Il aide notamment à afficher les messages d'erreur
    à l'écran quand il est utilisé dans l'éditeur en ligne.

*   [`m3.js`](../resources/m3.js)

    C'est un ensemble de fonctions mathématiques 2D. Elles sont créées à partir du premier article sur
    les matrices et au fur et à mesure de leur création, elles sont incluses directement, mais finissent par
    trop encombrer le code, donc après quelques exemples elles sont utilisées via ce script.

*   [`m4.js`](../resources/m4.js)

    C'est un ensemble de fonctions mathématiques 3D. Elles sont créées à partir du premier article sur la 3D
    et au fur et à mesure de leur création, elles sont incluses directement, mais finissent par trop encombrer
    le code, donc après le 2ème article sur la 3D elles sont utilisées via ce script.
