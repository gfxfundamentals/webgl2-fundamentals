Title: WebGL2 - 여러 물체를 그리는 법
Description: WebGL에서 다른 종류의 여러가지 물체를 그리는 법
TOC: 여러 물체를 그리는 법


이 문서는 [이전 WebGL 글](webgl-fundamentals.html)의 연속입니다.
아직 읽지 않았다면 그 글부터 읽으시길 권장합니다.

WebGL을 사용해 처음으로 무언가를 그려 보고 나서 드는 가장 흔한 의문은, 어떻게 여러 물체를 그리는가 입니다.

여러분들이 알아야 할 것은, 몇 가지 예외를 제외하면 WebGL은 함수에 수많은 인자를 넘기는 대신, 물체를 그리는 함수 하나와 상태를
설정하는 70개 이상의 다른 함수로 이루어진 코드라는 점입니다. 예를 들어, 원을 그리는 함수가 하나 있다고 가정해봅시다.
그러면 아래와 같이 프로그램을 작성할 수 있을겁니다.

    function drawCircle(centerX, centerY, radius, color) { ... }

아니면 아래와 같이 작성할 수도 있습니다.

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL은 두 번째 방식으로 작동합니다. `gl.createBuffer`, `gl.bufferData`, `gl.createTexture`,
`gl.texImage2D`와 같은 함수들은 여러분의 데이터를 버퍼에(정점 데이터의 경우), 그리고 텍스처에(색상 등등) 업로드하게 해줍니다.
`gl.createProgram`, `gl.createShader`, `gl.compileShader`, `gl.linkProgram`은 GLSL 쉐이더를 생성하게 해줍니다.
WebGL의 나머지 거의 모든 함수들은 마지막에 호출되는 `gl.drawArrays` 또는 `gl.drawElements`에 사용되는 전역 변수 또는 *상태*를 설정하는 데 사용됩니다.

따라서 전형적인 WebGL 프로그램은 보통 아래와 같은 구조를 따릅니다.

초기화 시점에,

*   모든 쉐이더 프로그램과 위치(쉐이더 내 데이터 전달 위치) 생성
*	버퍼를 생성하고 정점 데이터 업로드
*	그리고자 하는 각 물체마다 정점 배열(vertex array)을 생성
	*	각 attribute마다 `gl.bindBuffer`, `gl.vertexAttribPointer`, `gl.enableVertexAttribArray` 호출되는
	*	인덱스 관련 데이터는 `gl.ELEMENT_ARRAY_BUFFER`에 바인딩
*	텍스처를 생성하고 텍스처 데이터 업로드

렌더링 시점에,

*	뷰 포트(viewport)를 clear 및 설정, 나머지 전역 상태 설정(깊이 테스트 여부, 컬링(culling) 수행 여부 등등) 
*	그리고자 하는 물체마다,
	*	물체를 그리기 위해 사용 프로그램을 `gl.useProgram`을 사용해 호출
	*	해당 물체의 정점 배열을 바인딩
		*	`gl.bindVertexArray` 호출
	*	그리고자 하는 물체의 uniform 설정
		*	각 uniform마다 `gl.uniformXXX` 호출
		*	텍스처를 텍스처 유닛(texture unit)에 할당하기 위해 `gl.activeTexture`와 `gl.bindTexture` 호출
	*	`gl.drawArrays` 또는 `gl.drawElements` 호출

기본적으로 위와 같습니다. 이러한 작업을 수행하기 위해 코드를 어떻게 구성할 것인지는 여러분에게 달려있습니다.

텍스처 데이터(심지어 어떤 경우엔 정점 데이터도)를 업로딩하는 것과 같은 작업들은, 네트워크를 통해 다운로드가 될때까지 기다려야 하기 때문에 비동기적으로 수행하기도 합니다.

세 가지 물체를 그리는 간단한 어플리케이션을 만들어 봅시다. 육면체와 구와 원뿔을 그릴 것입니다.

육면체와 구, 원뿔 데이터를 계산하기 위한 세부 사항은 자세히 설명하지 않을 것입니다.
그냥 그러한 물체를 그리는 함수가 있다고 가정하고 그 함수가 [이전 글에서 설명한 bufferInfo 객체를 반환한하고 합시다.](webgl-less-code-more-fun.html)

코드는 아래와 같습니다. 쉐이더는 [투영 예제](webgl-3d-perspective.html)에서 사용한 간단한 쉐이더와 같지만, 정점 색상에 곱할 `u_colorMult`를 추가한 점만 다릅니다.

    #version 300 es
    precision highp float;

    // 버텍스 쉐이더로 전달되는 데이터
    in vec4 v_color;

    +uniform vec4 u_colorMult;

    out vec4 outColor;

    void main() {
    *   outColor = v_color * u_colorMult;
    }


초기화 시점에,

    // 그리고자 하는 각 물체에 사용할 uniform
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // 각 물체의 이동
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

그리는 시점에,

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ 구 그리기 --------

    gl.useProgram(programInfo.program);

    // 필요한 attribute 설정.
    gl.bindVertexArray(sphereVAO);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // 방금 계산한 uniform 설정
    twgl.setUniforms(programInfo, sphereUniforms);

    twgl.drawBufferInfo(gl, sphereBufferInfo);

    // ------ 육면체 그리기 --------

    // 필요한 attribute 설정.
    gl.bindVertexArray(cubeVAO);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // 방금 계산한 uniform 설정
    twgl.setUniforms(programInfo, cubeUniforms);

    twgl.drawBufferInfo(gl, cubeBufferInfo);

    // ------ 원뿔 그리기 --------

    // 필요한 attribute 설정.
    gl.bindVertexArray(coneVAO);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // 방금 계산한 uniform 설정
    twgl.setUniforms(programInfo, coneUniforms);

    twgl.drawBufferInfo(gl, coneBufferInfo);

결과는 아래와 같습니다.

{{{example url="../webgl-multiple-objects-manual.html" }}}

하나 알아두어야 할 점은 우리가 사용하는 쉐이더 프로그램이 하나이기 때문에 `gl.useProgram`을 한 번만 호출했다는 것입니다. 만일 다른 쉐이더 프로그램이 더 있었다면 `gl.useProgram`을... 각 프로그램을 사용하기 전에 호출해야 합니다.

이것 또한 간략화 하기 위한 좋은 지점 중 하나입니다. 효율적으로 병합할 수 있는 4개의 주요 요소가 있습니다.

1.  쉐이더 프로그램 (과 그것들의 uniform, attribute 정보)
2.  정점 배열 (attribute 설정 방법을 포함하는)
3.  주어진 쉐이더를 사용해 물체를 그리기 위해 필요한 uniform들
4.  gl.drawXXX에 전달할 갯수들과 gl.drawArrays 또는 gl.drawElements를 호출할지 말지의 여부

따라서, 손쉽게 간략화 하는 방법은 그려야 하는 물체들의 배열을 만들고 그 배열에 4가지 요소들을 함께 집어넣어 놓는 것입니다.

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        vertexArray: sphereVAO,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: cubeVAO,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        vertexArray: coneVAO,
        uniforms: coneUniforms,
      },
    ];

그리는 시점에서 행렬들은 여전히 갱신되어야 합니다.

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // 각 물체에 대한 행렬 계산
    sphereUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

하지만 그리는 코드는 이제 간단한 반복문이 됩니다.

    // ------ 물체들을 그리기 --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;

      gl.useProgram(programInfo.program);

      // 필요한 attribute들 설정.
      gl.bindVertexArray(object.vertexArray);

      // uniforms 설정.
      twgl.setUniforms(programInfo, object.uniforms);

      // 그리기
      twgl.drawBufferInfo(gl, bufferInfo);
    });


이것이 현존하는 대부분 3D 엔진의 메인 렌더링 루프입니다. `objectsToDraw` 리스트 어디에 어떤 코드가 위치하는지와 사용할 수 있는 옵션들이 더 많을 수는 있지만 리스트에서 무엇을 계산할지와 실제 `gl.draw___`를 호출하는 것과는 분리되어 있을겁니다.
	
{{{example url="../webgl-multiple-objects-list.html" }}}

## 투명한(Transparent) 물체 그리기와 여러 리스트

위 예제에서는 그릴 물체들의 리스트가 하나였습니다. 이렇게 해도 되는 이유는 모든 물체가 불투명(Opaque)했기 때문입니다. 투명한 물체를 그리고 싶다면 가장 멀리있는 물체가 먼저 그려지고 뒤에서부터 앞의 순서로 그려져야 합니다. 반면, 불투명한 물체를 앞에서 뒤의 순서로 그리는 것이 빠릅니다. 왜냐하면 DEPTH_TEST가 GPU에서 다른 물체의 뒤에 있는 픽셀을 그리기 위해 프래그먼트 쉐이더를 실행하지 않는다는 의미이기 때문입니다. 따라서 앞의 물체를 먼저 그리는 것이 좋습니다.

대부분의 3D 엔진에서는 이 문제를 그려야하는 물체들을 위한 2개 이상의 리스트를 만들어 해결합니다. 하나는 불투명한 물체를 위한 리스트. 다른 하나는 투명한 물체를 위한 리스트입니다. 불투명한 물체는 앞에서부터 뒤의 순서로 정렬되고, 투명한 물체는 깊이 순으로 정렬됩니다. 오버레이(overlay) 또는 후처리 효과(post processing effect)를 위한 별도의 리스트가 더 있을 수 있습니다.


## 라이브러리 사용의 고려

아무 geometry를 아무 쉐이더를 사용해 그릴 수는 없다는 점을 알아야 합니다.
예를 들어, 법선(normal) 정보를 필요로 하는 쉐이더는 법선 정보가 없는 geometry에는 사용할 수 없습니다. 유사한 예로, 텍스처를 필요로 하는 쉐이더는 텍스처 없이는 제대로 동작하지 않을 것입니다.

이것이 [Three.js](https://threejs.org)같은 3D 라이브러리를 사용하는 것이 좋은 이유 중 하나입니다. 왜냐하면 라이브러리는 위와 같은 문제들을 처리해 주기 때문입니다. geometry를 만들고, three.js에게 어떻게 렌더링 되길 원하는지를 입력하면 런타임에 쉐이더를 생성해 줍니다. Unity3D, Unreal, Source, Crytek과 같은 거의 대부분의 3D 엔진이 이러한 일들을 해 줍니다. 어떤 경우에는 오프라인으로 생성하는 경우도 있지만 어쨌든 중요한 것은 쉐이더를 *생성해* 준다는 사실힙니다.

당연히 여러분들은 로우 레벨까지 알고 싶으시기 때문에 이 글을 읽고 계실겁니다. 그건 아주 좋은 생각이고, 모든 것을 스스로 작성해 보는 것은 아주 재미있는 일입니다. 하지만 [WebGL이 아주 로우 레벨이기 때문에](webgl-2d-vs-3d-library.html), 스스로 작성해야 하는 것들이 너무나 많고, 이는 쉐이더의 생성이 필요한 경우 그 기능도 여러분이 스스로 작성해야 한다는 것을 의미합니다.

제가 `computeMatrix`를 반복문 안에 넣지 않은 것을 알아 채셨나요. 왜냐하면 렌더링과 행렬 계산은 당연히 분리되어야 하기 때문입니다. 행렬 계산은 주로 [장면 그래프(scene graph)를 통해 이루어지며, 다른 글에서 이에 대해 다룰 것입니다.](webgl-scene-graph.html)

이제 여러 물체를 그리는 프레임워크를 만들어보았으니 [텍스트를 그려 봅시다.](webgl-text-html.html).

<div class="webgl_bottombar">
<h3>WebGL1 최적화 삭제</h3>
<p>
WebGL 1 에서는 vertex array object가 없기 때문에
<a href="https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html">최적화를 추천드렸었습니다</a>.
vertex array object가 없어서, geometry를 바꿀 때마다 모델의 attribute마다 3번의 WebGL 호출이 필요했었습니다.
이전 예제에서 모델마다 도합 12번의 WebGL 호출이 있었고, 모델을 정렬해서 이러한 호출을 회피하는 것이 당연합니다. WebGL2에서는 이러한 12번의 호출이 한 번의 
<code>gl.bindVertexArray(someVertexArray)</code> 호출로 대체되었고, 최소한 제가 테스트 해 본 바, 제가 제안한 최적화 방법이 유의미한 차이를 가져오지 않았기 때문에 이 섹션을 제거하였습니다.
</p>
</div>

