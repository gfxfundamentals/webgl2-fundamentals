Title: WebGL2 - 래스터라이징 vs 3D 라이브러리
Description: WebGL이 3D 라이브러리가 아닌 이유와 그 중요성
TOC: 2D vs 3D 라이브러리


이 글은 WebGL글의 곁가지 주제입니다.
첫 글은 [WebGL 기초](webgl-fundamentals.html) 입니다.

제가 이 글을 쓰는 이유는 제가 WebGL이 3D API가 아니고 래스터라이징 API라고 주장한 것이 몇몇 사람들의 신경을 건드렸기 때문입니다.
사람들이 왜 그것에 대해 과민반응하는지는 모르겠지만 어쨋든 제가 WebGL을 래스터라이징 API라고 부른 것에 화가 많이 나신 모양입니다.

당연히 모든 것은 관점에 따라 다릅니다.
칼을 식기류라고 할수도 있지만 어떤 사람은 공구라고 할수도 있고 어떤 사람은 무기라고 할 수도 있겠죠.

하지만 WebGL의 경우 이를 래스터라이징 API라고 칭하는 것이 중요하다고 생각하는데, 
이는 WebGL에서 무언가를 3D로 그리기 위해 여러분이 알아야 하는 3D 수학 관련 지식들 때문입니다.

제 주장은 무언가가 3D 라이브러리라고 불리려면 3D 관련 처리를 여러분들 대신 해 주어야 한다는 것입니다.
여러분이 라이브러리에 3D 데이터를 제공하고, 머티리얼 파라메터들을 제공하고, 빛을 정의하면 3D 장면을 그려줄 것입니다.
WebGL(그리고 OpenGL ES 2.0+)도 3D 장면을 그릴 때 사용하긴 하지만 위와 같은 내용에 부합하지는 않습니다.

비유해 보자면, C++은 "워드 프로세서"가 아닙니다.
워드 프로세서를 C++로 작성할 수는 있지만 그렇다고 C++을 "워드 프로세서"라고 부르지는 않습니다.
비슷하게 WebGL은 3D 그래픽을 생성해 주지 않습니다.
여러분은 3D 그래픽을 표현하는 라이브러리를 WebGL을 사용해 만들 수는 있지만 WebGL 자체가 3D 그래픽을 표현해 주는 것은 아닙니다.

예제를 좀 더 보자면 빛을 받는 육면체를 3D로 그리고 싶다고 해 봅시다.

three.js를 사용하는 경우 코드는 아래와 같습니다.

<pre class="prettyprint showlinemods">
  // 설정
  renderer = new THREE.WebGLRenderer({canvas: document.querySelector("#canvas")});
  c.appendChild(renderer.domElement);

  // 카메라를 생성하고 설정
  camera = new THREE.PerspectiveCamera(70, 1, 1, 1000);
  camera.position.z = 400;

  // 장면 생성
  scene = new THREE.Scene();

  // 육면체 생성
  var geometry = new THREE.BoxGeometry(200, 200, 200);

  // 머티리얼 생성
  var material = new THREE.MeshPhongMaterial({
    ambient: 0x555555,
    color: 0x555555,
    specular: 0xffffff,
    shininess: 50,
    shading: THREE.SmoothShading
  });

  // geometry와 머티리얼로 메쉬 생성
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 2개의 조명 생성
  light1 = new THREE.PointLight(0xff0040, 2, 0);
  light1.position.set(200, 100, 300);
  scene.add(light1);

  light2 = new THREE.PointLight(0x0040ff, 2, 0);
  light2.position.set(-200, 100, 300);
  scene.add(light2);
</pre>

그러면 아래와 같이 표시됩니다.

{{{example url="resources/three-js-cube-with-lights.html" }}}

OpenGL(ES가 아닌)을 사용해 2개의 조명과 육면체를 그리는 유사한 코드입니다.

<pre class="prettyprint showlinemods">
  // 설정
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

  // 조명 2개 정의
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

  // 육면체 그리기
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
  ... 육면체의 남은 5개 면에 대해 반복
  ...
  */

  glEnd();
</pre>

이 두 예제를 작성하는데 있어서 거의 3D 수학 지식이 필요하지 않다는 것에 주목하십시오. WebGL과 비교해서요. WebGL로 그리기 위한 코드는 작성하지 않을겁니다.
코드는 그렇게 길어지지는 않을겁니다. 코드 라인이 얼마나 필요한지가 중요한 것이 아닙니다.
중요한 것은 얼마나 많은 **지식**이 필요한지 입니다.
두 3D 라이브러리에서는 3D 관련한 작업을 대신 처리해 줬습니다.
카메라 위치와 시야각을 정의하고, 빛을 정의하고 육면체를 정의했습니다.
나머지는 알아서 처리해줬습니다. 다시말해, 위 두 예제는 3D 라이브러리 입니다.

하지만 WebGL에서는 행렬 계산, 정규화된 좌표계, 절두체, 외적, 내적, varying의 보간, 반사 조명 계산 등등의 몇달 혹은 몇년을 걸쳐 이해해야 하는 지식이 필요합니다.

3D 라이브러리의 존재 이유는 이러한 지식들이 이미 내장되어 있어서 여러분이 그 지식을 갖고있지 못해도 라이브러리에 의지해 그것들을 처리할 수 있다는 것입니다.
위에서 본 것처럼 예전 OpenGL도 이와 마찬가지였습니다. three.js와 같은 다른 3D 라이브러리들도 마찬가지고요. 하지만 OpenGL ES 2.0+나 WebGL에서는 "아닙니다".

WebGL을 3D 라이브러리라고 부르는 것은 오해의 소지가 있습니다.
WebGL을 배우러 온 사람이 "아, 3D 라이브러리구나. 잘됐다. 3D 부분은 알아서 처리해 주겠지" 라고 생각했다가 험난한 가시밭길을 마주칠 수 있습니다. 아니죠. 전혀 그렇지 않죠.

더 나아가 보겠습니다. 아래는 와이어프레임으로 표현된 3D 육면체를 캔버스에 그린 것입니다.

{{{example url="resources/3d-in-canvas.html" }}}

아래는 WebGL을 사용해 와이어프레임으로 그린 것입니다.

{{{example url="resources/3d-in-webgl.html" }}}

코드를 살펴 보시면 알아야 하는 지식 면에서는 두 예제가 크게 다르지 않다는 것을 아실 수 있을겁니다.
결국 캔버스 버전은 정점을 순회하면서 "우리가 작성한" 계산을 수행하고 2D로 직선들을 그리고 있습니다.
WebGL버전이 하는일도 "우리가 작성한" GLSL 코드에 있는 계산이 GPU에서 수행된다는 사실만 제외하고는 동일합니다.

마지막 예제의 핵심은 WebGL이 결국 2D 캔버스처럼 래스터라이징 엔진이라는 것입니다.
당연히 WebGL은 3D를 구현하는데 도움을 주는 기능들이 포함되어 있습니다.
깊이 버퍼가 있어서 깊이 정렬(sorting)을 도와줍니다.
다양한 수학 관련 함수들도 내장되어 있어서 3D 구현에 매우 유용하지만 당연히 그 기능만 있다고 3D를 구현할 수 있는것은 아닙니다. 단지 수학 라이브러리일 뿐입니다.
1D, 2D, 3D 어디에서나 사용할 수 있는 수학 기능일 뿐입니다.
무엇보다도 WebGL은 래스터라이징을 할 뿐입니다.
여러분은 그리고자 하는 것의 클립 공간 좌표를 제공해야 합니다.
물론 x,y,z,w를 제공하면 렌더링을 수행하기 이전에 W로 나누어 주긴 하지만 그 정도를 가지고 3D 라이브러리라고 하기에는 부족합니다.
3D 라이브러리에서는 3D 데이터를 제공하면 클립 공간 좌표를 계산하는 것까지 해줍니다.

몇 가지 참고자료를 더하자면 [emscripten](https://emscripten.org/)에서는 WebGL을 가지고 예전 버전의 OpenGL을 에뮬레이션을 제공합니다. 코드는 [여기](https://github.com/emscripten-core/emscripten/blob/master/src/library_glemu.js) 있습니다.
살펴보다 보면 상당량의 코드가 예전 OpenGL의 3D 기능을 에뮬레이팅하기 위해 OpenGL ES 2.0에서는 사라진 셰이더 생성 기능을 위한 것을 알 수 있습니다. [Regal](https://github.com/p3/regal/blob/184c62b7d7761481609ef1c1484ada659ae181b9/src/regal/RegalIff.cpp)에서도 동일한 것을 볼 수 있는데, 이 프로젝트는 3D가 포함되지 않은 모던 OpenGL을 가지고 3D가 포함된 예전 OpenGL을 에뮬레이팅하는 NVidia의 프로젝트입니다.
마지막으로 [여기에 three.js에서 3D를 위해 사용하는 셰이더가 있습니다](https://gist.github.com/greggman/41d93c00649cba78abdbfc1231c9158c).
예시들을 보다보면 많은 일들이 벌어지고 있는것을 볼 수 있습니다. 예시와 코드들에서 제공하는 기능들은 라이브러리에서 제공하는 것이지 WebGL이 제공하는 것이 아님을 알 수 있습니다.

제가 WebGL이 3D 라이브러리가 아니라고 할 때 그렇게 생각하는 근거를 어느정도 이해하셨기를 바랍니다.
또한 3D 라이브러리라는 것은 3D 처리를 여러분 대신 해 주어야 한다는 사실도 이해하셨기를 바랍니다.
OpenGL이 그랬고, three.js가 그렇습니다. OpenGL ES 2.0과 WebGL은 그렇지 않습니다.
따라서 이들이 다 같이 "3D 라이브러리"라는 카테고리로 묶일 수는 없습니다.

이 모든 이야기의 요지는 WebGL에 입문하는 개발자가 WebGL이 무엇이고 무엇이 핵심인지를 알도록 하는 것입니다.
WebGL이 3D 라이브러리가 아니기 때문에 필요한 모든 지식을 스스로 제공해야만 하니, 
스스로 무엇을 더 배워야 하는지를 알아야 하고 또한 그러한 3D 수학 지식이 필요한지 또는 3D 라이브러리를 활용할 것인지를 선택해야 한다는 것입니다.
또한 이 글을 통해 WebGL 동작 원리에 대한 이해가 깊어질 것입니다.
