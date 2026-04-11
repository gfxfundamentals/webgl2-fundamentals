Title: WebGL2 readPixels
Description: Détails sur readPixels
TOC: readPixels

Dans WebGL, vous passez une paire format/type à `readPixels`. Pour un format interne de texture donné
(attaché à un framebuffer), seulement 2 combinaisons de format/type sont valides.

D'après la spécification :

> Pour les surfaces de rendu à virgule fixe normalisée, la combinaison format `RGBA` et type
`UNSIGNED_BYTE` est acceptée. Pour les surfaces de rendu d'entiers signés, la combinaison
format `RGBA_INTEGER` et type `INT` est acceptée. Pour les surfaces de rendu d'entiers non signés,
la combinaison format `RGBA_INTEGER` et type `UNSIGNED_INT` est acceptée.

La deuxième combinaison est définie par l'implémentation
<span style="color:red;">ce qui signifie probablement que vous ne devriez pas l'utiliser dans WebGL si vous voulez que votre code soit portable</span>.
Vous pouvez demander quelle est la combinaison format/type en interrogeant

```js
// en supposant qu'un framebuffer est lié avec la texture à lire attachée
const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

Notez également que les formats de texture qui sont rendables, c'est-à-dire que vous pouvez les attacher à un framebuffer et y rendre,
sont également quelque peu définis par l'implémentation.
WebGL2 liste [de nombreux formats](webgl-data-textures.html) mais certains sont optionnels (`LUMINANCE` par exemple) et certains
ne sont pas rendables par défaut mais peuvent éventuellement être rendus rendables par une extension. (`RGBA32F` par exemple).

**Le tableau ci-dessous est en temps réel**. Vous remarquerez peut-être qu'il donne des résultats différents selon la machine, le système d'exploitation, le GPU, ou même
le navigateur. Je sais que sur ma machine, Chrome et Firefox donnent des résultats différents pour certaines des valeurs définies par l'implémentation.

<div class="webgl_center" data-diagram="formats"></div>

<script src="../resources/twgl-full.min.js"></script>
<script src="resources/webgl-readpixels.js"></script>
