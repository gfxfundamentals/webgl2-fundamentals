Title: Nomenclaturas das Matrizes WebGL
Description: Nomenclaturas comuns das matrizes

Esta publicação é a continuação de uma série de postagens sobre o WebGL. O primeiro artigo
[apresentou os fundamentos do WebGL](webgl-fundamentals.html) e o anterior
foi [sobre câmeras 3D](webgl-3d-cameras.html).

Como todo o site falou que, praticamente tudo no WebGL é
100% feito por você. Com excessão de alguns nomes pré-definidos como `gl_Position`,
quase tudo no WebGL é definido por você, programador.

Dito isto, existem algumas convenções de nomenclatura comuns ou semi-comuns. Especialmente
quando se trata de matrizes. Eu não sei quem apresentou primeiro essas nomenclaturas. Eu
acho que as aprendi dos [Padrões de Anotações e Semânticas da NVIDIA](http://www.nvidia.com/object/using_sas.html).
Isso é um pouco mais formal, pois era uma maneira de tentar fazer shaders funcionarem
em mais situações ao decidir nomes específicos. Está meio que, desatualizado,
mas os fundamentos básicos ainda duram até hoje.

Aqui vai uma lista da minha cabeça

*   world matrix (em alguns casos, model matrix)

    uma matriz que pega os vértices de um modelo e os move para o world space

*   camera matrix

    uma matriz que posiciona a câmera no mundo. É uma outra maneira de dizer
    que essa é a *world matrix* da câmera.

*   view matrix

    uma matriz que move tudo que está dentro do mundo para a frente da câmera.
    Está matriz é o inverso da *camera matrix*.

*   projection matrix

    uma matriz que converte um frustum space (ou tronco de espaço, na tradução literal) em um clip space (ou espaço de clipe, na tradução literal) ou algum
    espaço ortográfico num clip space. Outra forma de pensar a respeito disso é como a matriz
	retornada pela função `ortographic` ou `ortho` e/ou `perspective` da biblioteca matemática.

*   local matrix

    ao usar [um gráfico de cena (scene graph)](webgl-scene-graph.html), a matriz local é a
	matriz em qualquer nó, em específico, no gráfico antes de se multiplicar com qualquer um
    dos outros nós.


Se um shadder precisar de uma destas combinações, eles geralmente são listados da direita para a esquerda
mesmo que no shader eles fossem multiplicados *à direita*. Por exemplo:

    worldViewProjection = projection * view * world

As outras duas coisas mais comuns a se fazer com uma matriz seria obter o inverso

    viewMatrix = inverse(cameraMatrix)

E para transpor

    worldInverseTranpose = transpose(inverse(world))

Espero que conhecendo esses termos, você possa olhar para o shader de outra pessoa
e se você tiver sorte, eles usaram nomes que são parecidos ou muito semelhantes
a esses. E então, você poderá aproveitar o que esses Shaders estão
fazendo.

Agora vamos [aprender sobre animação, a seguir](webgl-animation.html).

