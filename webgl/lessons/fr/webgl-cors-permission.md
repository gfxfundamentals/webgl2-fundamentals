Title: WebGL2 - Images Cross Origin
Description: Utiliser des images de domaines différents
TOC: Images Cross Origin


Cet article fait partie d'une série d'articles sur WebGL. Si vous ne les avez pas lus,
je vous suggère de [commencer par une leçon précédente](webgl-fundamentals.html).

Dans WebGL, il est courant de télécharger des images puis de les téléverser vers le GPU pour les
utiliser comme textures. Il y a plusieurs exemples ici qui font ça. Par
exemple, l'article sur [le traitement d'images](webgl-image-processing.html), l'
article sur [les textures](webgl-3d-textures.html) et l'article sur
[l'implémentation de drawImage 2D](webgl-2d-drawimage.html).

Généralement, nous téléchargeons une image comme ça

    // crée une info de texture { width: w, height: h, texture: tex }
    // La texture commencera avec des pixels 1x1 et sera mise à jour
    // quand l'image sera chargée
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // Remplir la texture avec un pixel bleu 1x1.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 255, 255]));

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var textureInfo = {
        width: 1,   // on ne connaît pas la taille jusqu'à ce qu'elle soit chargée
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      });
      img.src = url;

      return textureInfo;
    }

Le problème est que les images peuvent contenir des données privées (par exemple, un captcha, une signature, une photo intime, ...).
Une page web contient souvent des publicités et d'autres choses pas directement sous le contrôle de la page, donc le navigateur doit empêcher
ces choses de regarder le contenu de ces images privées.

Utiliser simplement `<img src="private.jpg">` n'est pas un problème car bien que l'image soit affichée par
le navigateur, un script ne peut pas voir les données à l'intérieur de l'image. [L'API Canvas2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
a un moyen de voir à l'intérieur de l'image. D'abord, vous dessinez l'image dans le canvas

    ctx.drawImage(someImg, 0, 0);

Puis vous obtenez les données

    var data = ctx.getImageData(0, 0, width, height);

Mais, si l'image que vous avez dessinée vient d'un domaine différent, le navigateur marquera le canvas comme *souillé* et
vous obtiendrez une erreur de sécurité quand vous appelez `ctx.getImageData`

WebGL doit aller encore plus loin. Dans WebGL, `gl.readPixels` est l'appel équivalent à `ctx.getImageData`
donc on pourrait penser que bloquer ça suffirait, mais il s'avère que même si vous ne pouvez pas lire les pixels
directement, vous pouvez créer des shaders qui prennent plus de temps à s'exécuter en fonction des couleurs de l'image. En utilisant cette information,
vous pouvez utiliser la mesure du temps pour effectivement regarder à l'intérieur de l'image indirectement et découvrir son contenu.

Donc, WebGL interdit simplement toutes les images qui ne viennent pas du même domaine. Par exemple, voici un court exemple
qui dessine un rectangle rotatif avec une texture d'un autre domaine.
Remarquez que la texture ne se charge jamais et nous obtenons une erreur

{{{example url="../webgl-cors-permission-bad.html" }}}

Comment contourner ce problème ?

## Entrez CORS

CORS = Cross Origin Resource Sharing (Partage de ressources d'origines différentes). C'est un moyen pour la page web de demander au serveur d'images la permission
d'utiliser l'image.

Pour ce faire, nous définissons l'attribut `crossOrigin` à quelque chose, et ensuite quand le navigateur essaie d'obtenir
l'image du serveur, si ce n'est pas le même domaine, le navigateur demandera la permission CORS.


    ...
    +    img.crossOrigin = "";   // demander la permission CORS
        img.src = url;

La chaîne que vous définissez à `crossOrigin` est envoyée au serveur. Le serveur peut regarder cette chaîne et décider
si oui ou non vous accorder la permission. La plupart des serveurs qui supportent CORS ne regardent pas la chaîne, ils
accordent simplement la permission à tout le monde. C'est pourquoi la définir à la chaîne vide fonctionne. Tout ce que ça signifie dans ce cas
est "demander la permission" par opposition à `img.crossOrigin = "bob"` qui signifierait "demander la permission pour 'bob'".

Pourquoi ne demandons-nous pas toujours cette permission ? Parce que demander la permission prend 2 requêtes HTTP, donc c'est
plus lent que de ne pas demander. Si nous savons que nous sommes sur le même domaine ou si nous savons que nous n'utiliserons l'image que pour
des balises img et/ou canvas2d, alors nous ne voulons pas définir `crossOrigin` car cela
rendra les choses plus lentes.

Nous pouvons créer une fonction qui vérifie si l'image que nous essayons de charger est sur la même origine, et si ce n'est pas le cas,
définit l'attribut `crossOrigin`.

    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

Et on peut l'utiliser comme ça

    ...
    +requestCORSIfNotSameOrigin(img, url);
    img.src = url;


{{{example url="../webgl-cors-permission-good.html" }}}

Il est important de noter que demander la permission ne signifie PAS que vous obtiendrez la permission.
Cela dépend du serveur. Les pages GitHub accordent la permission, flickr.com accorde la permission,
imgur.com accorde la permission, mais la plupart des sites web n'accordent pas la permission.

<div class="webgl_bottombar">
<h3>Faire accorder la permission CORS à Apache</h3>
<p>Si vous gérez un site web avec Apache et que vous avez le plugin mod_rewrite installé,
vous pouvez accorder le support CORS général en mettant</p>
<pre class="prettyprint">
    Header set Access-Control-Allow-Origin "*"
</pre>
<p>
Dans le fichier <code>.htaccess</code> approprié.
</p>
</div>
