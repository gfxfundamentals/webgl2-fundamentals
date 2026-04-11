Title: WebGL2 - Animation
Description: Comment faire de l'animation avec WebGL
TOC: Animation


Cet article est la suite d'une série d'articles sur WebGL.
Le premier [a commencé par les bases](webgl-fundamentals.html)
et le précédent portait sur les [caméras 3D](webgl-3d-camera.html).
Si vous ne les avez pas lus, veuillez les consulter d'abord.

Comment animer quelque chose dans WebGL ?

En réalité, ce n'est pas spécifique à WebGL, mais en général si vous voulez
animer quelque chose en JavaScript, vous devez modifier quelque chose
au fil du temps et redessiner.

Nous pouvons prendre l'un de nos exemples précédents et l'animer comme suit.

    *var fieldOfViewRadians = degToRad(60);
    *var rotationSpeed = 1.2;

    *requestAnimationFrame(drawScene);

    // Dessiner la scène.
    function drawScene() {
    *  // À chaque frame, augmenter la rotation un peu.
    *  rotation[1] += rotationSpeed / 60.0;

      ...
    *  // Appeler drawScene à la prochaine frame
    *  requestAnimationFrame(drawScene);
    }

Et voilà le résultat

{{{example url="../webgl-animation-not-frame-rate-independent.html" }}}

Il y a cependant un problème subtil. Le code ci-dessus a
`rotationSpeed / 60.0`. Nous avons divisé par 60.0 car nous supposions que le navigateur
répondra à requestAnimationFrame 60 fois par seconde, ce qui est assez courant.

Cependant, ce n'est pas réellement une hypothèse valide. Peut-être que l'utilisateur est sur un appareil peu puissant
comme un vieux smartphone. Ou peut-être que l'utilisateur exécute un programme lourd en
arrière-plan. Il y a toutes sortes de raisons pour lesquelles le navigateur pourrait ne pas afficher
des images à 60 images par seconde. Peut-être que nous sommes en 2020 et que toutes les machines tournent à 240
images par seconde maintenant. Peut-être que l'utilisateur est un joueur et a un moniteur CRT fonctionnant à 90
images par seconde.

Vous pouvez voir le problème dans cet exemple

{{{diagram url="../webgl-animation-frame-rate-issues.html" }}}

Dans l'exemple ci-dessus, nous voulons faire pivoter tous les 'F' à la même vitesse.
Le 'F' au milieu tourne à vitesse maximale et est indépendant du framerate. Celui
de gauche et celui de droite simulent si le navigateur ne fonctionnait qu'à 1/8ème de
la vitesse maximale de la machine courante. Celui de gauche **N'EST PAS** indépendant du framerate.
Celui de droite **EST** indépendant du framerate.

Remarquez que celui de gauche, ne tenant pas compte du fait que le framerate
pourrait être lent, ne parvient pas à suivre. Celui de droite, bien qu'il tourne à 1/8 du framerate,
parvient à suivre celui du milieu qui tourne à vitesse maximale.

La façon de rendre l'animation indépendante du framerate est de calculer combien de temps s'est écoulé
entre les frames et d'utiliser cela pour calculer de combien animer cette frame.

Premièrement, nous devons obtenir le temps. Heureusement, `requestAnimationFrame` nous passe
le temps écoulé depuis le chargement de la page quand il nous appelle.

Je trouve plus facile de travailler avec le temps en secondes, mais comme `requestAnimationFrame`
nous passe le temps en millisecondes (millièmes de seconde), nous devons multiplier par 0,001
pour obtenir des secondes.

Nous pouvons donc calculer le delta de temps ainsi

    *var then = 0;

    requestAnimationFrame(drawScene);

    // Dessiner la scène.
    *function drawScene(now) {
    *  // Convertir le temps en secondes
    *  now *= 0.001;
    *  // Soustraire le temps précédent du temps actuel
    *  var deltaTime = now - then;
    *  // Mémoriser le temps actuel pour la prochaine frame.
    *  then = now;

       ...

Une fois que nous avons le `deltaTime` en secondes, tous nos calculs peuvent être en
unités par seconde que nous voulons. Dans ce cas,
`rotationSpeed` est 1,2 ce qui signifie que nous voulons tourner de 1,2 radian par seconde.
C'est environ 1/5 d'un tour, soit dit autrement, il faudra environ 5 secondes pour
faire un tour complet quel que soit le framerate.

    *    rotation[1] += rotationSpeed * deltaTime;

Voilà celui qui fonctionne.

{{{example url="../webgl-animation.html" }}}

Vous ne verrez probablement pas de différence avec celui du haut de cette page, à moins d'être sur une machine lente, mais si vous ne rendez pas vos animations indépendantes du framerate, vous aurez probablement des utilisateurs
qui obtiennent une expérience très différente de ce que vous avez prévu.

La suite : [comment appliquer des textures](webgl-3d-textures.html).

<div class="webgl_bottombar">
<h3>N'utilisez pas setInterval ou setTimeout !</h3>
<p>Si vous avez déjà programmé des animations en JavaScript,
vous avez peut-être utilisé <code>setInterval</code> ou <code>setTimeout</code> pour que votre
fonction de dessin soit appelée.
</p><p>
Les problèmes liés à l'utilisation de <code>setInterval</code> ou <code>setTimeout</code> pour faire de l'animation
sont doubles. D'abord, <code>setInterval</code> et <code>setTimeout</code> n'ont aucun lien
avec ce que le navigateur affiche. Ils ne sont pas synchronisés avec le moment où le navigateur
va dessiner une nouvelle frame, et peuvent donc être désynchronisés avec la machine de l'utilisateur.
Si vous utilisez <code>setInterval</code> ou <code>setTimeout</code> en supposant 60 frames
par seconde et que la machine de l'utilisateur tourne en réalité à un autre framerate, vous serez
désynchronisé avec sa machine.
</p><p>
L'autre problème est que le navigateur n'a aucune idée de la raison pour laquelle vous utilisez <code>setInterval</code> ou
<code>setTimeout</code>. Ainsi, par exemple, même quand votre page n'est pas visible,
comme quand elle n'est pas l'onglet actif, le navigateur doit quand même exécuter votre code.
Peut-être utilisez-vous <code>setTimeout</code> ou <code>setInterval</code> pour vérifier
les nouveaux e-mails ou tweets. Le navigateur n'a aucun moyen de le savoir. C'est bien si
vous vérifiez simplement toutes les quelques secondes de nouveaux messages, mais ce n'est pas bien si
vous essayez de dessiner 1000 objets dans WebGL. Vous serez effectivement en train de DOSer
la machine de l'utilisateur avec votre onglet invisible dessinant des choses qu'il ne peut même pas voir.
</p><p>
<code>requestAnimationFrame</code> résout ces deux problèmes. Il vous appelle exactement au bon moment
pour synchroniser votre animation avec l'écran, et il ne vous appelle que si
votre onglet est visible.
</p>
</div>


