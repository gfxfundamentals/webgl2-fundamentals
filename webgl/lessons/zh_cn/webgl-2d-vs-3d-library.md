Title: WebGL2 - 光栅化 vs 3D 库
Description: 为什么 WebGL 不是 3D 库以及这点为什么重要。
TOC: 2D vs 3D 库

这篇文章是关于 WebGL 系列文章的一个旁支话题。  
第一篇是 [基础知识介绍](webgl-fundamentals.html)

我写这篇文章是因为我说 WebGL 是一个光栅化 API，而不是一个 3D API，这句话触到了某些人的神经。
我不太清楚为什么他们会觉得被威胁，或者是什么让他们对我称 WebGL 为光栅化 API 这件事如此反感。

可以说，一切都是视角问题。我可能会说刀是一种餐具，别人可能会说刀是工具，还有人可能会说刀是武器。

但在 WebGL 的情况下，我认为将 WebGL 称为光栅化 API 是重要的，这是有原因的——那就是你需要掌握大量的 3D 数学知识，才能用 WebGL 绘制出任何 3D 内容。

我认为，任何自称为 3D 库的东西，都应该替你处理好 3D 的部分。你只需提供一些 3D 数据、材质参数、灯光信息，它就应该能够帮你完成 3D 渲染。
WebGL（以及 OpenGL ES 2.0+）虽然都可以用来绘制 3D 图形，但它们都不符合这个定义。

个比方，C++ 并不能“原生处理文字”。尽管可以用 C++ 编写文字处理器，但我们不会把 C++ 称作“文字处理器”。
同样，WebGL 并不能直接绘制 3D 图形。你可以基于 WebGL 编写一个绘制 3D 图形的库，但 WebGL 本身并不具备 3D 绘图功能。

进一步举个例子，假设我们想要绘制一个带有灯光效果的 3D 立方体。

以下是使用 three.js 来显示这个代码。

<pre class="prettyprint showlinemods">{{#escapehtml}}
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
{{/escapehtml}}</pre>

它显示如下。

{{{example url="resources/three-js-cube-with-lights.html" }}}

以下是在 OpenGL（非 ES 版本）中显示一个带有两个光源的立方体的类似代码。

<pre class="prettyprint showlinemods">{{#escapehtml}}
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
{{/escapehtml}}</pre>

请注意，在这两个示例中我们几乎不需要任何 3D 数学知识。对比来看，WebGL 就不是这样。我不会去写 WebGL 所需的完整代码——代码本身其实不会多很多。关键不在于代码行数的多少，而在于所需的知识量。

在这两个 3D 库中，它们帮你处理了所有 3D 相关的事情。你只需要提供一个摄像机的位置和视野、几个光源以及一个立方体，其余的它们都会帮你搞定。换句话说：它们是真正的 3D 库。

请注意，在这两个示例中我们几乎不需要任何 3D 数学知识。对比来看，WebGL 就不是这样。我不会去写 WebGL 所需的完整代码——代码本身其实不会多很多。关键不在于代码行数的多少，而在于所需的知识量。

在这两个 3D 库中，它们帮你处理了所有 3D 相关的事情。你只需要提供一个摄像机的位置和视野、几个光源以及一个立方体，其余的它们都会帮你搞定。换句话说：它们是真正的 3D 库。

请注意，在这两个示例中我们几乎不需要任何 3D 数学知识。对比来看，WebGL 就不是这样。我不会去写 WebGL 所需的完整代码——代码本身其实不会多很多。关键不在于代码行数的多少，而在于所需的知识量。

在这两个 3D 库中，它们帮你处理了所有 3D 相关的事情。 你只需要提供一个摄像机的位置和视野、几个光源以及一个立方体，其余的它们都会帮你搞定。
换句话说：它们是真正的 3D 库。

而在 WebGL 中，你则需要掌握矩阵运算、归一化坐标、视锥体、叉积、点积、varying 插值、光照、高光计算等等一系列内容，而这些通常需要几个月甚至几年的时间才能真正理解和掌握。

一个 3D 库的核心意义就在于它内部已经封装好了这些知识，因此你不需要自己去掌握它们，你只需要依赖这个库来帮你完成处理。正如上文所示，这一点在最初的 OpenGL 中就成立，对像 three.js 这样的其他 3D 库同样适用。但对于 OpenGL ES 2.0+ 或 WebGL 来说，这种封装是不存在的。

称 WebGL 为一个 3D 库似乎是具有误导性的。一个初学者接触 WebGL 时可能会想：“哦，这是个 3D 库，太棒了，它会帮我处理 3D。”然而他们最终会痛苦地发现，事实根本不是这样。

我们甚至可以更进一步。下面是使用 Canvas 绘制 3D 线框立方体的示例。

{{{example url="resources/3d-in-canvas.html" }}}

下面是使用 WebGL 绘制线框立方体的示例。

{{{example url="resources/3d-in-webgl.html" }}}

如果你检查这两段代码，就会发现它们在所需知识量或代码量方面并没有太大差异。归根结底，Canvas 版本是遍历顶点，使用我们提供的数学计算，然后在 2D 中绘制一些线条；而 WebGL 版本做的也是同样的事情，只不过这些数学计算是我们写在 GLSL 中，由 GPU 执行的。

这最后一个演示的重点是说明 WebGL 本质上只是一个光栅化引擎，就像 Canvas 2D 一样。确实，WebGL 提供了一些有助于实现 3D 的功能，比如深度缓冲区，它让深度排序变得比没有深度的系统简单得多。
WebGL 还内置了各种数学函数，非常适合用于 3D 数学计算，尽管严格来说，这些函数本身并不属于“3D”的范畴——它们只是数学库，无论你是用于一维、二维还是三维计算都可以使用。
但归根结底，WebGL 只负责光栅化。你必须自己提供裁剪空间（clip space）坐标来表示你想绘制的内容。确实，你可以提供 x, y, z, w，WebGL 会在渲染前将其除以 w，但这远远不足以让 WebGL 被称为一个“3D 库”。
在一个真正的 3D 库中，你只需提供 3D 数据，库会帮你完成从 3D 到裁剪空间坐标的全部计算。

为了提供更多参考信息， [emscripten](https://emscripten.org/) 在 WebGL 之上实现了旧版 OpenGL 的仿真。相关代码在  
[这里](https://github.com/emscripten-core/emscripten/blob/main/src/lib/libglemu.js)。

如果你查看这段代码，你会发现其中很大一部分是在生成着色器，用来模拟 OpenGL ES 2.0 中被移除的旧版 OpenGL 的 3D 部分。

你也可以在 [Regal](https://chromium.googlesource.com/external/p3/regal/+/refs/heads/master/src/regal/RegalIff.cpp) 中看到类似的做法。  
Regal 是 NVIDIA 发起的一个项目，旨在在现代 OpenGL 中仿真包含 3D 功能的旧版 OpenGL，而现代 OpenGL 已经不再内建这些 3D 功能。

再举一个例子，[three.js 所使用的着色器](https://gist.github.com/greggman/41d93c00649cba78abdbfc1231c9158c)  
就展示了如何在库内部提供 3D 功能。你可以看到这些例子中都做了大量工作。

所有这些 3D 功能以及背后的支持代码，都是由这些库提供的，而不是由 WebGL 自身提供的。

我希望你至少能理解我所说的“WebGL 不是一个 3D 库”是什么意思。我也希望你能意识到，一个真正的 3D 库应该为你处理好所有 3D 的相关部分。
OpenGL 做到了这一点。Three.js 也做到了。而 OpenGL ES 2.0 和 WebGL 则没有。
因此，可以说它们并不属于“3D 库”这个广义分类下。

这一切的重点，是为了让刚接触 WebGL 的开发者理解 WebGL 的本质。
了解 WebGL 并不是一个 3D 库，而是一个栅格化 API，意味着你需要自己掌握所有与 3D 相关的知识。这能帮助你明确接下来的学习方向——是深入学习 3D 数学知识，还是选择一个能为你处理好这些细节的 3D 库来简化开发。
同时，这也能帮助你揭开 WebGL 工作原理背后的许多神秘面纱。
