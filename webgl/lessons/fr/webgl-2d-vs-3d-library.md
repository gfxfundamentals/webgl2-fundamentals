Title: WebGL2 - Rastérisation vs bibliothèques 3D
Description: Pourquoi WebGL n'est pas une bibliothèque 3D et pourquoi c'est important.
TOC: Bibliothèques 2D vs 3D


Cet article est une sorte de sujet annexe dans une série d'articles sur WebGL.
Le premier [commence par les bases](webgl-fundamentals.html)

J'écris ceci parce que mon affirmation selon laquelle WebGL est une API de rastérisation et non une API 3D
touche un point sensible chez certaines personnes. Je ne sais pas pourquoi elles se sentent menacées
ou quoi que ce soit d'autre qui les contrarie autant quand j'appelle WebGL une API de rastérisation.

On peut soutenir que tout est une question de perspective. Je pourrais dire qu'un couteau est un
ustensile de cuisine, quelqu'un d'autre pourrait dire qu'un couteau est un outil et une autre
personne pourrait dire qu'un couteau est une arme.

Dans le cas de WebGL cependant, il y a une raison pour laquelle je pense qu'il est important
d'appeler WebGL une API de rastérisation et c'est spécifiquement à cause de la quantité de
connaissances en mathématiques 3D dont vous avez besoin pour utiliser WebGL pour dessiner quoi que ce soit en 3D.

Je dirais que tout ce qui se dit être une bibliothèque 3D devrait faire les
parties 3D pour vous. Vous devriez être capable de donner à la bibliothèque des données 3D,
des paramètres de matériaux, des lumières et elle devrait dessiner en 3D pour vous.
WebGL (et OpenGL ES 2.0+) sont tous deux utilisés pour dessiner en 3D mais aucun ne correspond à cette
description.

Pour donner une analogie, C++ ne "traite pas les mots" par défaut. Nous
n'appelons pas C++ un "traitement de texte" même si des traitements de texte peuvent être
écrits en C++. De même, WebGL ne dessine pas de graphismes 3D par défaut.
Vous pouvez écrire une bibliothèque qui dessinera des graphismes 3D avec WebGL mais en soi
il ne fait pas de graphismes 3D.

Pour donner un autre exemple, supposons que nous voulons dessiner un cube en 3D
avec des lumières.

Voici le code en three.js pour afficher ceci

<pre class="prettyprint showlinemods">{{#escapehtml}}
  // Configuration.
  renderer = new THREE.WebGLRenderer({canvas: document.querySelector("#canvas")});
  c.appendChild(renderer.domElement);

  // Crée et configure une caméra.
  camera = new THREE.PerspectiveCamera(70, 1, 1, 1000);
  camera.position.z = 400;

  // Crée une scène
  scene = new THREE.Scene();

  // Crée un cube.
  var geometry = new THREE.BoxGeometry(200, 200, 200);

  // Crée un matériau
  var material = new THREE.MeshPhongMaterial({
    ambient: 0x555555,
    color: 0x555555,
    specular: 0xffffff,
    shininess: 50,
    shading: THREE.SmoothShading
  });

  // Crée un maillage basé sur la géométrie et le matériau
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Ajoute 2 lumières.
  light1 = new THREE.PointLight(0xff0040, 2, 0);
  light1.position.set(200, 100, 300);
  scene.add(light1);

  light2 = new THREE.PointLight(0x0040ff, 2, 0);
  light2.position.set(-200, 100, 300);
  scene.add(light2);
{{/escapehtml}}</pre>

et voici comment cela s'affiche.

{{{example url="resources/three-js-cube-with-lights.html" }}}

Voici un code similaire en OpenGL (pas ES) pour afficher un cube avec 2 lumières.

<pre class="prettyprint showlinemods">{{#escapehtml}}
  // Configuration
  glViewport(0, 0, width, height);
  glMatrixMode(GL_PROJECTION);
  glLoadIdentity();
  gluPerspective(70.0, width / height, 1, 1000);
  glMatrixMode(GL_MODELVIEW);
  glLoadIdentity();

  glClearColor(0.0, 0.0, 0.0, 0.0);
  glEnable(GL_DEPTH_TEST);
  glShadeModel(GL_SMOOTH);
  glEnable(GL_LIGHTING);

  // Configure 2 lumières
  glEnable(GL_LIGHT0);
  glEnable(GL_LIGHT1);
  float light0_position[] = {  200, 100, 300, };
  float light1_position[] = { -200, 100, 300, };
  float light0_color[] = { 1, 0, 0.25, 1, };
  float light1_color[] = { 0, 0.25, 1, 1, };
  glLightfv(GL_LIGHT0, GL_DIFFUSE, light0_color);
  glLightfv(GL_LIGHT1, GL_DIFFUSE, light1_color);
  glLightfv(GL_LIGHT0, GL_POSITION, light0_position);
  glLightfv(GL_LIGHT1, GL_POSITION, light1_position);
...

  // Dessine un cube.
  static int count = 0;
  ++count;

  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  glLoadIdentity();
  double angle = count * 0.1;
  glTranslatef(0, 0, -400);
  glRotatef(angle, 0, 1, 0);

  glBegin(GL_TRIANGLES);
  glNormal3f(0, 0, 1);
  glVertex3f(-100, -100, 100);
  glVertex3f( 100, -100, 100);
  glVertex3f(-100,  100, 100);
  glVertex3f(-100,  100, 100);
  glVertex3f( 100, -100, 100);
  glVertex3f( 100,  100, 100);

  /*
  ...
  ... répéter pour les 5 autres faces du cube
  ...
  */

  glEnd();
{{/escapehtml}}</pre>

Remarquez comment nous avons besoin de presque aucune connaissance en mathématiques 3D pour l'un ou l'autre de ces
exemples. Comparez cela à WebGL. Je ne vais pas écrire le code
requis pour WebGL. Le code n'est pas beaucoup plus volumineux. Ce n'est pas
une question de nombre de lignes requises. C'est une question de quantité de **connaissances**
requises. Dans les deux bibliothèques 3D, elles s'occupent de la 3D. Vous leur donnez
une position de caméra et un champ de vision, quelques lumières, et un cube. Elles
gèrent tout le reste. En d'autres termes : Ce sont des bibliothèques 3D.

Dans WebGL en revanche, vous devez connaître les mathématiques matricielles, les coordonnées
normalisées, les frustums, les produits vectoriels, les produits scalaires, l'interpolation des varying, les
calculs d'éclairage spéculaire et toutes sortes d'autres choses qui prennent souvent des mois
ou des années à comprendre complètement.

Le but même d'une bibliothèque 3D est d'avoir ces connaissances intégrées pour que vous
n'ayez pas besoin de ces connaissances vous-même, vous pouvez simplement compter sur la bibliothèque pour
les gérer pour vous. C'était vrai pour l'OpenGL original comme montré ci-dessus.
C'est vrai pour d'autres bibliothèques 3D comme three.js. Ce n'est PAS vrai pour OpenGL
ES 2.0+ ou WebGL.

Il semble trompeur d'appeler WebGL une bibliothèque 3D. Un utilisateur venant à WebGL
pensera "oh, une bibliothèque 3D. Cool. Cela va faire de la 3D pour moi" et découvrira
ensuite de la manière difficile que non, ce n'est pas du tout le cas.

Nous pouvons même aller plus loin. Voici le dessin d'un cube en fil de fer 3D
dans Canvas.

{{{example url="resources/3d-in-canvas.html" }}}

Et voici le dessin d'un cube en fil de fer dans WebGL.

{{{example url="resources/3d-in-webgl.html" }}}

Si vous inspectez le code, vous verrez qu'il n'y a pas énormément de différence en termes
de quantité de connaissances ou d'ailleurs même de code. En fin de compte,
la version Canvas boucle sur les sommets, fait les mathématiques QUE NOUS AVONS FOURNIES et
dessine quelques lignes en 2D. La version WebGL fait la même chose sauf que les mathématiques
QUE NOUS AVONS FOURNIES sont en GLSL et exécutées par le GPU.

Le but de cette dernière démonstration est de montrer qu'effectivement WebGL est
simplement un moteur de rastérisation, similaire à Canvas 2D. Certes,
WebGL a des fonctionnalités qui vous aident à implémenter la 3D. WebGL a un tampon
de profondeur qui rend le tri en profondeur beaucoup plus facile qu'un système sans. WebGL
a également diverses fonctions mathématiques intégrées qui sont très utiles pour faire des
mathématiques 3D bien qu'il n'y ait sans doute rien qui les rende 3D. C'est une bibliothèque
mathématique. Vous les utilisez pour les mathématiques, que ces mathématiques soient en 1D, 2D, 3D,
peu importe. Mais en fin de compte, WebGL ne fait que rastériser. Vous devez lui fournir
des coordonnées dans l'espace de découpage qui représentent ce que vous voulez dessiner. Certes,
vous fournissez un x,y,z,w et il divise par W avant le rendu mais c'est
difficilement suffisant pour qualifier WebGL de bibliothèque 3D. Dans les bibliothèques 3D, vous
fournissez des données 3D, les bibliothèques s'occupent de calculer les points de l'espace de découpage à partir de la 3D.

Pour donner quelques points de référence supplémentaires, [emscripten](https://emscripten.org/)
fournit une émulation de l'ancien OpenGL au-dessus de WebGL. Ce code se trouve
[ici](https://github.com/emscripten-core/emscripten/blob/main/src/lib/libglemu.js).
Si vous parcourez le code, vous verrez qu'une grande partie génère des shaders pour
émuler les anciennes parties 3D d'OpenGL qui ont été supprimées dans OpenGL ES 2.0. Vous pouvez
voir la même chose dans
[Regal](https://chromium.googlesource.com/external/p3/regal/+/refs/heads/master/src/regal/RegalIff.cpp),
un projet que NVidia a lancé pour émuler l'ancien OpenGL avec la 3D incluse dans l'OpenGL moderne
sans la 3D incluse. Encore un autre exemple, [voici les shaders que three.js
utilise](https://gist.github.com/greggman/41d93c00649cba78abdbfc1231c9158c) pour
fournir la 3D. Vous pouvez voir qu'il se passe beaucoup de choses dans tous ces exemples.
Tout cela ainsi que le code pour le supporter est fourni par ces bibliothèques,
pas par WebGL.

J'espère que vous comprenez au moins d'où je viens quand je dis que WebGL n'est
pas une bibliothèque 3D. J'espère que vous réaliserez également qu'une bibliothèque 3D devrait
gérer la 3D pour vous. OpenGL le faisait. Three.js le fait. OpenGL ES 2.0 et WebGL
ne le font pas. Par conséquent, ils n'appartiennent sans doute pas à la même grande catégorie de
"bibliothèques 3D".

Le but de tout ceci est de donner à un développeur qui débute avec WebGL
une compréhension de WebGL dans son essence. Savoir que WebGL n'est pas une
bibliothèque 3D et qu'ils doivent fournir toutes les connaissances eux-mêmes
leur permet de savoir ce qui les attend et s'ils veulent poursuivre
cette connaissance des mathématiques 3D ou plutôt choisir une bibliothèque 3D pour la gérer
pour eux. Cela enlève aussi beaucoup de mystère quant à son fonctionnement.

