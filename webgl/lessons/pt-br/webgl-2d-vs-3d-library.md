Title: WebGL - Rasterização vs Bibliotecas 3D
Description: Por que WebGL não é uma biblioteca 3D e por que isso importa.

Esta publicação é um tipo de tópico secundário em uma série de postagens sobre o WebGL.
O primeiro [começou com o fundamentos](webgl-fundamentals.html)

Estou escrevendo isso porque a minha afirmação de que o WebGL é uma API de rasterização e não uma API 3D
mexe com o nervo de algumas pessoas. Não tenho certeza por que eles se sentem ameaçados
ou o que quer que os deixe tão chateados por eu ter chamado a WebGL de uma API de rasterização.

Provavelmente tudo é uma questão de perspectiva. Posso dizer que uma faca é uma
utensílio para comer, outra pessoa pode dizer que uma faca é uma ferramenta e ainda outra
pessoa pode dizer que uma faca é uma arma.

No caso da WebGL, porém, há uma razão pela qual acho importante
chamar a WebGL de uma API de rasterização e isso é especificamente devido à quantidade de conhecimento
matemática com relação ao 3D que você precisa saber para usar a WebGL para desenhar qualquer coisa em 3D.

Eu diria que qualquer coisa que se chame biblioteca 3D, deve ser capaz de fazer os
objetos em 3D para você. Você deve poder dar à biblioteca alguns dados em 3D,
alguns parâmetros materiais, algumas luzes e ela deve desenhar o objeto 3D para você.
A WebGL (e OpenGL ES 2.0+) são usados para desenhar 3D, mas nãom se encaixa na
descrição.

Para dar uma anologia, C++ não "processa palavras" fora da caixa. Nós
não dizemos que o C++ é um "processador de texto", mesmo que os processadores de texto possam ser
escritos em C++. Da mesma forma, a WebGL não tira gráficos 3D da caixa.
Você pode escrever uma biblioteca que irá desenhar gráficos 3D com a WebGL, mas por si só,
ela não faz gráficos 3D.

Para dar um exemplo adicional, suponha que queremos desenhar um cubo em 3D
com luzes.

Aqui está o código em three.js para fazer isso

<pre class="prettyprint showlinemods">
  // Setup.
  renderer = new THREE.WebGLRenderer({canvas: document.querySelector("#canvas")});
  c.appendChild(renderer.domElement);

  // Make and setup a camera.
  camera = new THREE.PerspectiveCamera(70, 1, 1, 1000);
  camera.position.z = 400;

  // Make a scene
  scene = new THREE.Scene();

  // Make a cube.
  var geometry = new THREE.BoxGeometry(200, 200, 200);

  // Make a material
  var material = new THREE.MeshPhongMaterial({
    ambient: 0x555555,
    color: 0x555555,
    specular: 0xffffff,
    shininess: 50,
    shading: THREE.SmoothShading
  });

  // Create a mesh based on the geometry and material
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Add 2 lights.
  light1 = new THREE.PointLight(0xff0040, 2, 0);
  light1.position.set(200, 100, 300);
  scene.add(light1);

  light2 = new THREE.PointLight(0x0040ff, 2, 0);
  light2.position.set(-200, 100, 300);
  scene.add(light2);
</pre>

e aqui é exibido.

{{{example url="resources/three-js-cube-with-lights.html" }}}

Aqui está o código similar em OpenGL (não ES) para exibir um cubo com 2 luzes.

<pre class="prettyprint showlinemods">
  // Setup
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

  // Setup 2 lights
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

  // Draw a cube.
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
  ... repeat for 5 more faces of cube
  ...
  */

  glEnd();
</pre>


Observe como precisamos quase nenhum conhecimento de matemática para 3D para qualquer um desses
exemplos. Compare isso com a WebGL. Não vou escrever o código
necessário para a WebGL. O código não é muito maior. Não é
sobre a quantidade de linhas necessárias. É sobre a quantidade de **conhecimento**
necessário. Nas duas bibliotecas 3D, elas cuidam do 3D. Você dá-lhes
uma posição de câmera e um campo de visão, algumas luzes e um cubo. Eles
lidam com o resto. Em outras palavras: são bibliotecas em 3D.

Na WebGL, por outro lado, você precisa saber matemática matricial, normalizada
coordenadas, produtos cruzados, produtos ponto, interpolação variável, cálculos
especulares de iluminação e todos os tipos de outras coisas que muitas vezes levam meses
ou anos para entender completamente.

O principal ponto de uma biblioteca 3D é ter esse conhecimento construído para que você
não precise desse conhecimento, você só pode confiar na biblioteca para
lidar com isso por você. Isso foi verdade para a OpenGL original, como mostrado acima.
É verdade para outras bibliotecas em 3D, como three.js. Mas não é verdade para a OpenGL
ES 2.0+ ou a WebGL.

Parece desleal chamar a WebGL de uma biblioteca 3D. Um usuário que vem para a WebGL
pensará "oh, biblioteca 3D. Legal. Isso fará todo o 3D para mim" e depois encontre,
da maneira mais difícil, não, esse não é o caso.

Podemos dar um passo adiante. Aqui está um desenho de um wireframe 3D de um
cubo em Canvas.

{{{example url="resources/3d-in-canvas.html" }}}

E aqui está o desenho de um wireframe de um cubo na WebGL.

{{{example url="resources/3d-in-webgl.html" }}}

Se você inspecionar o código, verá que não há muita diferença em termos
da quantidade de conhecimento ou até mesmo o código. Em última análise
a versão do Canvas faz um loop sobre os vértices, faz os cálculos que FORNECEMOS e
desenha algumas linhas em 2D. A versão da WebGL faz a mesma coisa, exceto, os cálculos que
FORNECEMOS no GLSL e executados pela GPU.

O ponto desta última demostração é mostrar que efetivamente a WebGL é
apenas um mecanismo de rasterização, semelhante ao Canvas 2D. Certo,
a WebGL possui recursos que o ajudam a implementar o 3D. A WebGL tem uma profundidade de
buffer que faz a classificação de profundidade muito mais fácil do que um sistema sem. A WebGL
também tem várias funções de matemática incorporadas, que são muito úteis para fazer cálculos
3D, embora não haja nenhum argumento que os torne 3D. Eles são uma biblioteca de
cálculos. Você os usa para matemática, seja ou não que matemática voltada para 1D, 2D, 3D,
tanto faz. Mas, em última análise, a WebGL apenas rasteriza. Você deve fornecer
coordenadas de clipespace que represente o que você deseja desenhar. Certo,
você fornece um x, y, z, w e ele divide por W antes de renderizar, mas isso,
dificilmente, é suficiente para qualificar a WebGL como uma biblioteca 3D. Nas bibliotecas 3D você
fornece dados em 3D, e as bibliotecas cuidam de calcular os pontos do clipspace de 3D.g

Espero que você, pelo menos, entenda o que eu quero dizer quando digo que a WebGL
não é uma biblioteca 3D. Espero que você também perceba que uma biblioteca 3D deve
lidar com o 3D para você. A OpenGL fez isso. Three.js faz isso. Mas a OpenGL ES 2.0 e a WebGL,
não. Portanto, eles argumentam que não pertencem à mesma categoria ampla de
"Bibliotecas 3D".

The point of all of this is to give a developer that is new to WebGL
an understanding of WebGL at its core. Knowing that WebGL is not a
3D library and that they have to provide all the knowledge themselves
lets them know what's next for them and whether they want to pursue
that 3D math knowledge or instead choose a 3D library to handle it
for them. It also removes much of the mystery of how it works.

O objetivo de tudo isso é dar a um desenvolvedor que é novo na WebGL,
uma compreensão da WebGL e de seu núcleo. Sabendo que a WebGL não é uma
biblioteca 3D e que eles têm que fornecer todo o conhecimento em si,
permite que eles saibam o que está por vir e se querem seguir com
o conhecimento matemático necessário para 3D ou, em vez disso, escolher uma biblioteca 3D para lidar com isso
para eles. Isso também deve remover uma boa parte do mistério de como ela funciona.
