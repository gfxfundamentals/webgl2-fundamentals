Title: WebGL2 - 장면(Scene) 그래프
Description: 장면 그래프란 무엇이고 어디에 사용되는지
TOC: 장면(Scene) 그래프


이 글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 내용입니다.
이전 글은 [여러 물체를 그리는 법](webgl-drawing-multiple-things.html) 이었습니다.
아직 위 글을 읽지 않았다면 먼저 읽어 보시기 바랍니다.

CS 전문가나 그래픽스 전문가가 이 말을 듣는다면 여러가지로 반박하시겠지만...
장면 그래프는 트리의 각 노드가 행렬을 생성하는 장면 그래프를 의미합니다...
흠, 꽤나 쓸모있는 정보죠? 아마 예제를 보는것이 더 나을수도 있겠습니다.

대부분의 3D 엔진은 장면 그래프를 사용합니다.
여러분은 화면에 나타내고자 하는 것들을 장면 그래프에 넣습니다.
그러면 엔진은 장면 그래프를 순회하면서 화면에 그릴 것들을 확인하게 됩니다.
장면 그래프는 계층적으로 구성되므로 예를들어 여러분이 우주 시뮬레이션을 만들고자 한다면 아래와 같은 그래프를 구성하게 될겁니다.

{{{diagram url="resources/planet-diagram.html" height="500" }}}

장면 그래프는 왜 있는걸까요? 장면 그래프의 가장 중요한 기능은 [2D 행렬](webgl-2d-matrices.html)에 필요한 부모-자식 관계를 제공한다는 것입니다.
예를들어 간단한(현실과는 다른) 우주 시뮬레이션에서 별(자식)은 은하(부모)와 함께 움직이게 됩니다. 
비슷하게 달(자식)은 행성(부모)과 한께 움직입니다.
여러분이 지구를 움직이면 달이 함께 움직여야 합니다. 은하를 움직이면 그에 속하는 별들은 함께 움직여야 합니다. 
위 다이어그램을 드래그해서 그들간의 관계를 파악해 보시기 바랍니다.

[2D 행렬](webgl-2d-matrices.html) 글을 다시 보시면 물체를 이동, 회전 및 크기 변환하기 위해 많은 행렬들을 곱한 것을 기억하실 겁니다.
장면 그래프는 물체에 적용할 행렬을 결정하는 데 사용할 구조(structure)를 정의합니다.

보통 장면 그래프의 각 `노드(Node)`는 *지역 공간*을 정의합니다.
행렬 계산을 제대로 수행하면 해당 *지역 공간*의 물체들은 그 상위 공간을 무시합니다.
다른 방식으로 이를 설명해보자면 달은 자신이 지구 주위를 돈다는 것만을 알고 있으면 됩니다. 달은 자신이 태양 주위를 돌고 있다는 사실은 알 필요 없습니다.
장면 그래프가 없다면 달이 태양 주위를 돌게하기 위해서 훨씬 복잡한 계산이 필요합니다. 
왜냐하면 달은 아래와 같이 태양 주위를 돌기 때문입니다.

{{{diagram url="resources/moon-orbit.html" }}}

장면 그래프를 사용하면 달을 지구의 자식으로 만들고 단순히 지구 주위만 돌게 하면 됩니다.
지구가 태양 주위를 돈다는 사실은 장면 그래프가 담당해 줄 겁니다. 이는 노드를 순회하면서 해당하는 노드의 행렬을 곱해줌으로써 이루어집니다.

    worldMatrix = greatGrandParent * grandParent * parent * self(localMatrix)

구체적인 용어로 적어보자면 우리의 우주 시뮬레이션은 아래와 같이 될겁니다.

    worldMatrixForMoon = galaxyMatrix * starMatrix * planetMatrix * moonMatrix;

이는 재귀(resursive) 함수로 아주 쉽게 수행할 수 있습니다.

    function computeWorldMatrix(currentNode, parentWorldMatrix) {
        // 자신의 지역 행렬과 부모의 월드 행렬을 곱해 
        // 자신의 월드 행렬을 계산합니다.
        var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localMatrix);

        // 모든 자식 노드들에 대해 동일한 작업을 반복합니다.
        currentNode.children.forEach(function(child) {
            computeWorldMatrix(child, worldMatrix);
        });
    }

이를 통해 3D 장면 그래프에서 자주 사용되는 용어들을 파악할 수 있습니다.

*   `localMatrix`: 현재 노드의 지역 행렬(local matrix)입니다. 자기 자신을 원점으로 하는 지역 공간에서 자신과 자신의 자식들에 대한 변환을 수행합니다.

*    `worldMatrix`: 주어진 노드에 대해 지역 공간에서의 값을 장면 그래프의 루트 노드의 공간으로 변환합니다. 다시말해 월드 공간에 배치합니다. 달에 대한 worldMatrix를 계산하면 위에서 본 것처럼 복잡한 궤적을 얻게 됩니다.

장면 그래프를 만드는 것은 꽤나 간단합니다. 먼저 간단한 `Node` 객체를 정의해 봅시다.
장면 그래프를 구성하는 수많은 방법들이 있는데 어떤 방법이 가장 좋은지는 모르겠습니다.
가장 흔한 방법은 그릴 물체에 대한 필드를 가질 수 있도록 구성하는 것입니다.

    var node = {
       localMatrix: ...,  // 이 노드에 대한 "지역" 행렬
       worldMatrix: ...,  // 이 노드에 대한 "월드" 행렬
       children: [],      // 자식에 대한 배열
       thingToDraw: ??,   // 이 노드에서 그릴 물체
    };

태양계에 대한 장면 그래프를 만들어 봅시다. 예제가 복잡해 질 것 같으니 멋진 텍스처와 같은 것들을 사용하지는 않을겁니다.
먼저 노드를 관리하기 위한 몇 가지 함수를 만들어 봅시다.
먼저 노드 클래스를 정의합니다.

    var Node = function() {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    };

노드의 부모를 설정할 수 있도록 하겠습니다.

    Node.prototype.setParent = function(parent) {
      // 기존 부모로부터 자식 관계를 제거
      if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }

      // 새로운 부모 노드의 자식으로 추가
      if (parent) {
        parent.children.append(this);
      }
      this.parent = parent;
    };

그리고 아래는 부모-자식 관계를 활용하여 지역 행렬로부터 월드 행렬을 계산하는 코드립니다. 
부모부터 시작하여 자식 노드들을 재귀적으로 방문하면서 해당 노드의 월드 행렬을 계산합니다.
행렬 계산 부분이 이해가 안되신다면 [관련된 글을 읽어 보세요.](webgl-2d-matrices.html)

    Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
      if (parentWorldMatrix) {
        // 입력된 행렬이 있다면 이를 기반으로 계산을 수행하고
        // 그 결과를 `this.worldMatrix`에 저장합니다.
        m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
      } else {
        // 입력된 행렬이 없다면 단순히 복사해 넣습니다.
        m4.copy(this.localMatrix, this.worldMatrix);
      }

      // 이제 모든 자식 노드에 대한 처리를 수행합니다.
      var worldMatrix = this.worldMatrix;
      this.children.forEach(function(child) {
        child.updateWorldMatrix(worldMatrix);
      });
    };

태양과 지구 달에 대해 간단히 수행해 봅시다.
당연히 거리는 가상의 값을 사용해서 화면 안에 모두 보이도록 하겠습니다.
구 하나를 사용해서 노란색으로 태양을, 푸른색으로 지구를, 회색으로 달을 표현하겠습니다.
`drawInfo`, `bufferInfo`, `programInfo`가 익숙하지 않으시면 [이전 글을 읽어 보세요.](webgl-drawing-multiple-things.html)

    // 노드를 생성합니다.
    var sunNode = new Node();
    sunNode.localMatrix = m4.translation(0, 0, 0);  // 태양이 중심입니다.
    sunNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0, 1], // yellow
        u_colorMult:   [0.4, 0.4, 0, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

    var earthNode = new Node();
    earthNode.localMatrix = m4.translation(100, 0, 0);  // 지구는 태양으로부터 100 만큼 떨어져 있습니다.
    earthNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.5, 0.8, 1],  // blue-green
        u_colorMult:   [0.8, 0.5, 0.2, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

    var moonNode = new Node();
    moonNode.localMatrix = m4.translation(20, 0, 0);  // 달은 지구로부터 20만큼 떨어져 있습니다.
    moonNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0.6, 1],  // gray
        u_colorMult:   [0.1, 0.1, 0.1, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

노드를 만들었으니 이제 연결해 줍니다.

    // 노드들을 연결합니다.
    moonNode.setParent(earthNode);
    earthNode.setParent(sunNode);

객체의 리스트와 그릴 물체들의 리스트를 만듭니다.

    var objects = [
      sunNode,
      earthNode,
      moonNode,
    ];

    var objectsToDraw = [
      sunNode.drawInfo,
      earthNode.drawInfo,
      moonNode.drawInfo,
    ];

렌더링을 수행할 때 각 물체를 약간씩 회전하도록 지역 행렬을 갱신해줄 겁니다.

    // 각 물체에 대한 지역 행렬 갱신
    m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);

지역 행렬이 갱신된 뒤 모든 월드 행렬을 갱신합니다.

    sunNode.updateWorldMatrix();

월드 행렬을 얻었으니 마지막으로 각 물체에 대한 [worldViewProjection
행렬](webgl-3d-perspective.html)을 월드 행렬을 곱해서 계산합니다.

    // 렌더링을 위한 모든 행렬 계산을 수행합니다.
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

렌더링은 [이전 글에서와 동일하게 수행됩니다.](webgl-drawing-multiple-things.html)

{{{example url="../webgl-scene-graph-solar-system.html" }}}

모든 행성이 동일한 크기인 것을 볼 수 있습니다. 지구를 조금 더 크게 만듭시다.

    // 지구는 태양으로부터 100 만큼 떨어져 있습니다.
    earthNode.localMatrix = m4.translation(100, 0, 0));

    // 지구의 크기를 두배로 만들어 줍니다.
    earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);

{{{example url="../webgl-scene-graph-solar-system-larger-earth.html" }}}

이런, 달도 커졌습니다. 이를 수정하기 위해서 달의 크기를 직접 줄여줄 수도 있습니다.
하지만 더 좋은 방법은 노드를 더 추가하는 것입니다. 단순히 아래와 같이 하는 대신,

      sun
       |
      earth
       |
      moon

아래와 같이 바꿀겁니다.

     solarSystem
       |    |
       |   sun
       |
     earthOrbit
       |    |
       |  earth
       |
      moonOrbit
          |
         moon

이렇게 하면 지구가 solarSystem 주위를 돌게 되지만 태양의 회전과 크기 변환을 별도로 할 수 있고 이러한 변환이 지구에 영향을 주지도 않습니다.
유사하게 지구도 달과 별도로 회전할 수 있습니다.
`solarSystem`, `earthOrbit`, `moonOrbit` 노드를 만들어 봅시다.

    var solarSystemNode = new Node();
    var earthOrbitNode = new Node();

    // 지구는 태양으로부터 100 만큼 떨어져 있습니다.
    earthOrbitNode.localMatrix = m4.translation(100, 0, 0);
    var moonOrbitNode = new Node();

    // 달은 지구로부터 20 만큼 떨어져 있습니다.
    moonOrbitNode.localMatrix = m4.translation(20, 0, 0);

예전 노드에서 거리는 제거해 줍니다.
Those orbit distances have been removed from the old nodes

    var earthNode = new Node();
    -// 지구는 태양으로부터 100 만큼 떨어져 있습니다.
    -earthNode.localMatrix = m4.translation(100, 0, 0));

    -// 지구의 크기를 두배로 만들어 줍니다.
    -earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);
    +earthNode.localMatrix = m4.scaling(2, 2, 2);

    var moonNode = new Node();
    -moonNode.localMatrix = m4.translation(20, 0, 0);  // 달은 지구로부터 20 만큼 떨어져 있습니다.

이제 노드간 연결은 아래와 같습니다.

    // 노드들을 연결해 줍니다.
    sunNode.setParent(solarSystemNode);
    earthOrbitNode.setParent(solarSystemNode);
    earthNode.setParent(earthOrbitNode);
    moonOrbitNode.setParent(earthOrbitNode);
    moonNode.setParent(moonOrbitNode);

이제는 orbit 관련 노드만 업데이트 해주면 됩니다.

    // 각 물체의 지역 행렬을 갱신합니다.
    -m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);

    // 장면 그래프의 모든 월드 행렬을 갱신합니다.
    -sunNode.updateWorldMatrix();
    +solarSystemNode.updateWorldMatrix();

이제 지구는 두 배 크기가 되었지만 달은 그대로인 것을 볼 수 있습니다.

{{{example url="../webgl-scene-graph-solar-system-larger-earth-fixed.html" }}}

지구와 태양이 자전하지 않는 것을 눈치 채셨는지 모르겠네요. 
이제 자전은 따로 처리해 주어야 합니다.

몇 가지 더 수정해 봅시다.

    -sunNode.localMatrix = m4.translation(0, 0, 0);  // 태양이 중심에 있습니다.
    +sunNode.localMatrix = m4.scaling(5, 5, 5);

    ...

    *moonOrbitNode.localMatrix = m4.translation(30, 0, 0);

    ...

    +moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);

    ...
    // 각 물체의 지역 행렬을 갱신합니다.
    m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);
    +// 태양을 회전합니다.
    +m4.multiply(m4.yRotation(0.005), sunNode.localMatrix, sunNode.localMatrix);
    +// 지구를 회전합니다.
    +m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    +// 달을 회전합니다.
    +m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

{{{example url="../webgl-scene-graph-solar-system-adjusted.html" }}}

`localMatrix`는 매 프레임 값이 바뀝니다. 문제가 있는데 매 프레임마다 약간의 오차가 생긴다는겁니다.
이를 *행렬의 직교 정규화(ortho normalizing)*라 불리는 방법을 통해 수정할 수 있지만 항상 제대로 동작하지는 않습니다.
예를들어 크기를 0으로 바꿨다가 다시 원래대로 돌린다고 해 봅시다.
`x`라는 값에 대해 이를 수행한다면,

    x = 246;       // frame #0, x = 246

    scale = 1;
    x = x * scale  // frame #1, x = 246

    scale = 0.5;
    x = x * scale  // frame #2, x = 123

    scale = 0;
    x = x * scale  // frame #3, x = 0

    scale = 0.5;
    x = x * scale  // frame #4, x = 0  OOPS!

    scale = 1;
    x = x * scale  // frame #5, x = 0  OOPS!

값을 잃어버리게 됩니다. 다른 클래스를 만들어 행렬을 다른 값으로부터 갱신하도록 수정할 수 있습니다.
`Node`의 정의를 수정해 `source`를 갖고록 바꿔 봅시다.
`source`가 있다면 `source`에게 지역 행렬을 요청할겁니다.

    *var Node = function(source) {
      this.children = [];
      this.localMatrix = makeIdentity();
      this.worldMatrix = makeIdentity();
    +  this.source = source;
    };

    Node.prototype.updateWorldMatrix = function(matrix) {

    +  var source = this.source;
    +  if (source) {
    +    source.getMatrix(this.localMatrix);
    +  }

      ...

이제 source를 만듭니다. 대개 source는 아래와 같이 이동, 회전, 크기 변환을 제공합니다.

    var TRS = function() {
      this.translation = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.scale = [1, 1, 1];
    };

    TRS.prototype.getMatrix = function(dst) {
      dst = dst || new Float32Array(16);
      var t = this.translation;
      var r = this.rotation;
      var s = this.scale;

      // compute a matrix from translation, rotation, and scale
      m4.translation(t[0], t[1], t[2], dst);
      m4.xRotate(dst, r[0], dst);
      m4.yRotate(dst, r[1], dst);
      m4.zRotate(dst, r[2], dst);
      m4.scale(dst, s[0], s[1], s[2]), dst);
      return dst;
    };

이를 아래처럼 사용할 수 있습니다.

    // 초기화 시점에 source를 통해 노드를 만듭니다.
    var someTRS  = new TRS();
    var someNode = new Node(someTRS);

    // 렌더링 시점에
    someTRS.rotation[2] += elapsedTime;

이제 매번 행렬을 새로 만들기 때문에 문제가 없습니다.

내가 태양계를 만들고 싶은게 아닌데 이게 왜 쓸모가 있는지 하고 생각하실 수 있습니다.
만약 사람 애니메이션을 만들고 싶으시다면 아래와 같은 장면 그래프를 구성하게 될겁니다.

{{{diagram url="resources/person-diagram.html" height="400" }}}

손가락과 발가락에 얼마나 많은 관절(joint)를 더할지는 여러분 마음대로입니다.
관절이 많을수록 애니메이션을 계산하는데 더 많은 연산이 필요하고, 애니메이션에 필요한 더 많은 데이터를 제공해야만 합니다.
버추얼 파이터와 같은 오래된 게임은 대략 15개의 관절을 사용합니다.
2000년대 초반의 게임들은 30개에서 70개 정도의 관절을 사용합니다. 
만일 여러분이 손에 대한 모든 관절을 사용한다면 각 손에 최소 20개의 관절이 필요하고, 
손은 2개니까 40개의 관절이 필요합니다. 많은 게임들에서 손을 애니메이션하는 경우 
시간(CPU/GPU 연산 및 아티스트의 작업 시간) 및 메모리를 아끼기 위해 엄지손가락에 하나, 나머지 네 손가락에 하나의 관절을 사용합니다.

어쨋든 아래는 제가 작업해본 사람 블럭입니다. 각 노드에는 위에 설명했던 `TRS` source를 사용하고 있습니다.
프로그래머가 만든 멋진 애니메이션 작품입니다! 😂

{{{example url="../webgl-scene-graph-block-guy.html" }}}

여러분이 마주치게된 모든 3D 라이브러리에서 이와 유사한 장면 그래프를 찾아보실 수 있을겁니다.
이러한 계층구조는 대개 모델링 툴이나 레벨 레이아웃 툴에서 만들어집니다.

<div class="webgl_bottombar">
<h3>SetParent vs AddChild / RemoveChild</h3>
<p>많은 장면 그래프에는 <code>node.addChild</code> 함수와 <code>node.removeChild</code>함수가 있는데 위에 제가 만든 것은 <code>node.setParent</code> 함수가 있습니다. 어떤 방식이 좋은가는 취향에 달렸지만 <code>setParent</code>가 <code>addChild</code>보다 객관적으로 좋은 이유 중 하나는 아래와 같은 코드를 사용 불가능하게 하기 때문입니다.
</p>
<pre class="prettyprint">
    someParent.addChild(someNode);
    ...
    someOtherParent.addChild(someNode);
</pre>
<p>이게 무슨 의미일까요? <code>someNode</code>가 <code>someParent</code>와 <code>someOtherParent</code>에 동시에 추가된다는 말인가요?
대부분의 장면 그래프에서 이는 불가능합니다.
두 번째 호출이 <code>ERROR: Already have parent</code>와 같은 오류를 생성해 줄까요?
<code>someOtherParent</code>를 추가하기 전에 <code>someNode</code>를  <code>someParent</code>에서부터 자동적으로 제거해 줄까요?
<code>addChild</code>란 이름만 보고는 아무것도 확신할 수 없습니다.
</p>
<p>반면 <code>setParent</code>는 이와 같은 문제가 없습니다.</p>
<pre class="prettyprint">
    someNode.setParent(someParent);
    ...
    someNode.setParent(someOtherParent);
</pre>
<p>
이 경우 어떻게 될지는 100% 확실합니다. 의심의 여지가 없습니다.
</p>
</div>


