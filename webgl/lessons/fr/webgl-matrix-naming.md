Title: WebGL2 Nommage des matrices
Description: Noms communs pour les matrices
TOC: 3D - Nommage des matrices


Cet article est la suite d'une série d'articles sur WebGL. Le premier
[commence par les bases](webgl-fundamentals.html) et le précédent
traitait des [caméras 3D](webgl-3d-camera.html).

Comme tout le site l'a souligné, pratiquement tout dans WebGL est
100% à votre charge. Sauf pour quelques noms prédéfinis comme `gl_Position`,
presque tout dans WebGL est défini par vous, le programmeur.

Cela dit, il existe des conventions de nommage courantes ou semi-courantes. Surtout
en ce qui concerne les matrices. Je ne sais pas qui a inventé ces noms en premier. Je
pense les avoir appris [des Annotations et Sémantiques Standard de NVidia](https://www.nvidia.com/object/using_sas.html).
C'est un peu plus formel car c'était une façon d'essayer de faire fonctionner les shaders
dans plus de situations en décidant de noms spécifiques. C'est un peu obsolète
mais les bases sont toujours là.

Voici la liste de mémoire

*   matrice world (ou parfois matrice model)

    une matrice qui prend les sommets d'un modèle et les déplace dans l'espace world

*   matrice camera

    une matrice qui positionne la caméra dans le world. Une autre façon de dire
    cela est que c'est la *matrice world* pour la caméra.

*   matrice view

    une matrice qui déplace tout le reste du world devant la caméra.
    C'est l'inverse de la *matrice camera*.

*   matrice projection

    une matrice qui convertit un frustum d'espace en clip space ou un espace orthographique
    en clip space. Une autre façon d'y penser est que c'est la matrice
    retournée par la fonction `perspective` et/ou `ortho` ou
    `orthographic` de votre bibliothèque de calcul matriciel.

*   matrice local

    lors de l'utilisation d'un [graphe de scène](webgl-scene-graph.html), la matrice locale est la
    matrice à n'importe quel nœud particulier du graphe avant de multiplier avec tout autre
    nœud.


Si un shader a besoin d'une combinaison de ces matrices, elles sont généralement listées de droite à gauche
même si dans le shader elles seraient multipliées *sur la droite*. Par exemple :

    worldViewProjection = projection * view * world

Les deux autres choses courantes à faire avec une matrice sont de prendre l'inverse

    viewMatrix = inverse(cameraMatrix)

Et de transposer

    worldInverseTranspose = transpose(inverse(world))

J'espère que connaître ces termes vous permettra de regarder le shader de quelqu'un d'autre
et si vous avez de la chance, ils ont utilisé des noms proches ou similaires à
ceux-ci. Vous pourrez alors espérer en déduire ce que ces shaders
font réellement.

Ensuite, [apprenons l'animation](webgl-animation.html).
