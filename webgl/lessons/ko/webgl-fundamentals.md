Title: WebGL2 기초들
Description: 기본으로 시작하는 첫 번째 WebGL2 강의
TOC: WebGL2 기초


제일 중요한 걸 먼저 말하자면, 이 글은 WebGL2에 관한 글입니다. 만약 WebGL1.0에 관심이 있다면 [여기를 방문하십시오](http://webglfundamentals.org). 알아야 할 것은 WebGL2는 [WebGL1과 거의 100% 역호환이 됩니다](webgl1-to-webgl2.html). 즉, 일단 WebGL2를 사용하면 원래 사용 의도처럼 사용할 수 있습니다. 이 튜토리얼은 이 방향을 따름니다.

WebGL은 종종 3D API로 간주됩니다. 사람들은 "WebGL과 *마법*을 사용해서 멋진 3D를 만들어야지" 라고 합니다. 실제로 WebGL은 단순히 레스트화 엔진일 뿐입니다. WebGL은 제공한 코드에 기반하여 점, 선 및 삼각형들을 그립니다. 원하는 것을 하기 위해 WebGL이 다른 일을 하도록 하는 것은 점, 선 및 삼각형들을 사용하는 코드를 제공하는 것에 달려있습니다.

WebGL은 컴퓨터의 GPU에서 실행됩니다. 따라서 GPU에서 실행되는 코드를 제공해야합니다. 두개 함수 쌍 형태로 코드를 제공해야합니다. 이 두 개의 함수는 버텍스 쉐이더(vertex shader)와 프래그먼트 쉐이더(fragment shader)라고 불리며 각각은 C/C++같이 매우 엄격한 타입을 가지고 있는 [GLSL](webgl-shaders-and-glsl.html)(GL Shader Language)으로 작성돼 있습니다. 이 두 쌍을 합쳐서 *프로그램(program)* 이라고 부릅니다.

vertex shader들의 역활은 vertex위치를 계산 하는 것입니다. 함수가 출력하는 위치를 기준으로 WebGL은 점 선 및 삼각형을 비롯한 다양한 종류의 기본요소(primitives)들을 rasterize화 할수 있습니다. 이 기본 요소들은 레스터와 할 때 사용자가 두 번째로 제공한 프레그먼트 셰이더(fragment shader)를 호출합니다. 프레그먼트 셰이더(fragment shader)의 역할은 현재 그려져 있는 기본 요소(primitive)의 각 픽셀에 색상을 계산하는 것입니다.

거의 모든 WebGL API는 이러한 함수 쌍를 실행 하기 위한 상태를 설정 하는것에 관련이 있습니다. 그리기 원하는 것을 하나 하나 구성하려면 여러 상태를 설정 한 다음 GPU에서 쉐이더를 실행하는`gl.drawArrays` 또는 `gl.drawElements`를 호출하여 *프로그램(program)* 를 실행해야 합니다.

함수들이 접근하는 모든 데이터는 GPU에 제공되어야합니다. 쉐이더가 데이터를 받을 수 있는 방법은 4가지가 있습니다.

1. Attributes, Buffers 그리고 Vertex Arrays

   버퍼(Buffers)는 GPU에 올라가는 바이너리 데이터 배열입니다. 물론 버퍼에 원하는 값을 자유롭게 넣을 수 있지만 일반적으로 위치, 법선, 텍스처 좌표, 점 색상 등과 같은 항목을 포함하고 있습니다.

   Attributes는 버퍼에서 데이터를 가져오고 버텍스 쉐이더에 전달하는 방법을 지정하는데 사용됩니다. 예를들어 위치를 3개의 32비트 부동 소수점으로 버퍼에 넣을 수 있습니다. 특정한 attribute에게 어느 버퍼에서 위치 뺴낼지, 어떤 데이터 형식이 이여야 되는지(3개의 컴포넌트 32비트 부동소수점), 버퍼에서 어떤 위치에서 오프셋이 시작되는지 그리고 한 위치에서 다음 위치로 이동할떄 얼마큼 바이트를 이동할 것인지 알려줘야 합니다.

   Buffers는 무작위로 접근할수 없습니다. 대신 버텍스 쉐이더가 지정한 횟수 만큼 실행합니다. 실행될 떄마다 각 지정된 버퍼에서 다음 값이 attribute에 할당됩니다.

   사용될 각각 버퍼로부터 데이터를 추출하는 방법에 대한 attributes 상태는 VAO (Vertex Array Object)로 수집됩니다.

2. Uniforms

   Uniforms은 쉐이더 프로그램을 실행하기 전에 선언하는 효율적인 전역 변수입니다.

3. Textures

   Textures는 쉐이더 프로그램에서 무작위로 접근할수 있는 데이터 배열입니다. texture에 넣는 가장 일반적인 것은 이미지 데이터이지만 texture는 단순히 데이터이며 색상 이외에 다른것도 쉽게 포함 할수입습니다.

4. Varyings

   Varyings는 버텍스 쉐이더가 프레그먼트 쉐이더에 데이터를 전달하는 방법입니다. 렌더링 되는것, 점, 선, 또는 삼각형에 따라 버텍스 쉐이더의 varying값은 프레그먼트 쉐이더를 실행하는 동안 보간됩니다.

## WebGL Hello World

WebGL은 오직 2가지에만 관여 합니다. 클립 공간 좌표와 색상.
WebGL을 사용하는 프로그래머로서 할일는 이 2가지를 WebGL에 제공하는 것입니다.
이를 하기위해 2개의 "쉐이더"를 제공합니다. 버텍스 쉐이더(Vertex shader)는 클립 공간 좌표를 프래그먼트 쉐이더는(Fragment shader)는 색상을 제공합니다.

클립 공간 좌표는 캔버스 크기에 상관없이 항상 -1에서 +1까지를 사용합니다. 여기에 간단한 WebGL을 보여주는 간단한 WebGL 예제가 있습니다.

버텍스 쉐이더(vertex shader)부터 시작해 보겠습니다.

    #version 300 es

    // attribute는 버텍스 쉐이더에 대한 입력(in)입니다.
    // 버퍼로 부터 받은 데이터입니다.
    in vec4 a_position;

    // 모든 쉐이더는 main 함수를 가지고 있습니다.
    void main() {

      // gl_Position는 버텍스 쉐이더가 설정을 담당하는 내장 변수입니다.
      gl_Position = a_position;
    }

실행 될떄 모든 코드를 GLSL대신 JavaScript로 작성을 한다면 다음과 같이 쓰일 것이라고 생각할수 있습니다.

    // *** 수도 코드!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
         // positionBuffer부터 다음 4개 값들을 a_position attribute에 복사합니다.
         attributes.a_position = positionBuffer.slice((offset + i) * stride, size);
         runVertexShader();
         ...
         doSomethingWith_gl_Position();
    }

실제로는 `positionBuffer`가 바이너리 데이터로 변환(아래 참조)되고 때문에 위 예제처럼 간단하지 않습니다. 이렇게 실제 버퍼에서 데이터를 가져오는 계산은 조금 다르겠지만 위 코드에서 버텍스 쉐이더가 대략 어떤식으로 실행되는지에 대해서 알수 있습니다.

다음으로 프래그먼트 쉐이더(fragment shader)가 필요합니다.

    #version 300 es

    // 프래그먼트 쉐이더는 기본 정밀도를 가지고 있지 않으므로 선언을 해야합니다.
    // mediump은 기본값으로 적당합니다. "중간 정도 정밀도"를 의미합니다.
    precision mediump float;

    // 프래그먼트 쉐이더(fragment shader)에서 출력을 선언 해야합니다.
    out vec4 outColor;

    void main() {
      // 붉은-보라색으로 출력하게 설정합니다.
      outColor = vec4(1, 0, 0.5, 1);
    }

위에서 fragment shader의 출력으로 `outColor`를 선언했습니다. `outColor`를 `1, 0, 0.5, 1`으로 설정했고 1은 빨간색, 0은 초록색, 0.5는 파랑색 마지막 1은 알파입니다. WebGL에서 색상은 0에서 1를 사용합니다.

이제 2개의 쉐이더 함수를 작성 해서 WebGL을 시작할 수 있습니다.

첫번째로 HTML canvas 요소가 필요합니다.

     <canvas id="c"></canvas>

그다음 자바스크립트에서 찾아볼수 있습니다.

     var canvas = document.getElementById("c");

이제 WebGL2RenderingContext 생성할수 있습니다.

     var gl = canvas.getContext("webgl2");
     if (!gl) {
        // webgl2를 사용할수 없습니다!
        ...

이제 쉐이더 프로그램을 컴파일하여 GPU에 넣어야 하기 떄문에 먼저 쉐이더를 문자열로 가져와야 합니다.
JavaScript로 문자열을 만드는 일반적인 방법으로 GLSL 문자열을 만들 수 있습니다. 예를 들어, AJAX를 사용하여 연결하거나, 자바 스크립트가 아닌 스크립트 태그에 삽입하거나, 아래 처럼 여러 줄 템플릿 문자열에 삽입하여 연결할 수 있습니다.

    var vertexShaderSource = `#version 300 es

    // attribute는 버텍스 쉐이더에 대한 입력(in)입니다.
    // 버퍼로 부터 받은 데이터입니다.
    in vec4 a_position;

    // 모든 쉐이더는 main 함수를 가지고 있습니다.
    void main() {

      // gl_Position는 버텍스 쉐이더가 설정을 담당하는 내장 변수입니다.
      gl_Position = a_position;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    // 프래그먼트 쉐이더는 기본 정밀도를 가지고 있지 않으므로 선언을 해야합니다.
    // mediump은 기본값으로 적당합니다. "중간 정도 정밀도"를 의미합니다.
    precision mediump float;

    // 프래그먼트 쉐이더(fragment shader)에서 출력을 선언 해야합니다.
    out vec4 outColor;

    void main() {
      // 붉은-보라색으로 출력하게 설정합니다.
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

실제 대부분 3D 엔진은 다양한 유형의 템플릿, concatenation등을 사용하여 GLSL 쉐이더들을 즉석으로 생성합니다.
이 사이트의 예제는 런타임에 GLSL을 생성 할만큼 복잡하지는 않습니다.

> 노트: `#version 300 es`는 **반드시 첫번째 라인에 작성해야합니다**. 그전에 주석이나 빈줄을 사용할 수 없습니다!
> `#version 300 es`는 WebGL2에 WebGL2를 사용하라고 알려줍니다.
> 쉐이더 언어는 GLSL ES 3.0이라고 부릅니다. 만약 첫번쨰 라인에 작성을 하지 않았다면
> 쉐이더 언어는 WebGL ES 1.0으로 설정이 되는데 이는 많은 차이점이 있고 기능이 훨씬 적습니다.

다음으로 쉐이더를 만들고, GLSL 소스를 전달하고, 쉐이더를 컴파일하는 함수가 필요합니다.
참고로 함수의 이름에서 무엇이 일어나는지 분명하기 떄문에 아무런 주석도 작성하지 않았습니다.


    function createShader(gl, type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }

이제 이 함수를 호출하여 2개의 쉐이더를 생성할수 있습니다.

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

그런 다음 이 두개의 쉐이더를 *프로그램*으로 *링크* 해야합니다.

    function createProgram(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

그런 다음 호출합니다.

    var program = createProgram(gl, vertexShader, fragmentShader);

이제 GPU에 GLSL 프로그램을 만들었고 이제 데이터를 제공해야합니다.
대부분의 WebGL API는 GLSL 프로그램에 데이터를 제공하도록 상태를 설정하는 것입니다.
여기 GLSL 프로그램에서는 오직 attribute `a_position`만 입력하면 됩니다.
가장 먼저 해야 할일은 방금 작성한 프로그램을 위해서 attribute의 위치를 찾는것 입니다.

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

attribute의 위치(또는 uniform 위치)를 찾는 것은 초기화 과정에서 해야하는 하는 일이며 랜더 루프(render loop)에서는 하지 말아야 합니다.

Attributes는 버퍼에서 데이터를 가져오기 때문에 버퍼를 생성해야 합니다.

    var positionBuffer = gl.createBuffer();

WebGL은 많은 WebGL 리소스들을 전역 바인드 포인트(bind points)로 처리합니다.
바인드 포인트(bind point)를 WebGL의 내부 전역 변수로 생각할수 있습니다.
먼저 리소스를 바인드 포인트(bind pont)에 바인드합니다. 그런 다음 다른 모든 함수들이 바인드 포인트를 통해 리소르를 참조합니다. 그러므로 포인트 버퍼를 바인드 해봅시다.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

이제 바인트 포인트를 통해 버퍼를 참조함으로써 버퍼에 데이터를 넣을 수 있습니다.

    // three 2d points
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

여기에 많은 것들이 있습니다. 먼저 자바스크립트 배열인 `positions`이 있습니다. 반면 WebGL은 강력한 형식의 데이터를 필요하므로 `new Float32Array(positions)` 부분은 `positions`으로 부터 값을 복사해 새로운 32비트 부동소수점형 배열을 생성합니다. `gl.bufferData`는 데이터를 GPU에 있는 `positionBuffer`에 복사합니다. 위에서 `ARRAY_BUFFER` 바인드 포인트로 바인드 했기 떄문에 position buffer를 사용합니다.

마지막 매개변수 `gl.STATIC_DRAW`는 WebGL에 데이터를 어떻게 사용할 것인지에 대한 힌트입니다. WebGL은 확실한 것(certain things?)들을 최적화하기 위해 이 힌트를 사용 할 수 있습니다. `gl.STATIC_DRAW`는 이 데이터를 많이 변경하지는 않을 것이라고 알려줍니다.

이제 데이터를 버퍼에 넣었고 attribute에게 데이터를 가져오는 방법을 알려줘야 합니다. 먼저 Vertex Array Object라고 불리는 attribute 상태 콜렉션을 생성해야합니다.

    var vao = gl.createVertexArray();

모든 attribute 설정이 attribute 상태 모음(콜렉션?)에 적용하기 위해서 현재의 버텍스 배열을 만들어야합니다.

    gl.bindVertexArray(vao);

이제 마침내 버텍스 배열에 attributes를 설정했습니다. 먼저 attribute를 작동 시켜야합니다. 이는 WebGL에 버퍼에서 데이터를 가져오고 싶다고 알려주는 것입니다. attributes을 작동 시키지 않으면 attributes는 상수 값을 가지고 올 것입니다.

    gl.enableVertexAttribArray(positionAttributeLocation);

그런 다음 데이터를 가져오는 방법을 지정해야 합니다.

    var size = 2;          // 한번 실행할 때마다 2개 구성 요소 사용
    var type = gl.FLOAT;   // 데이터는 32비트 소수점
    var normalize = false; // 정규화 되지 않은 데이터
    var stride = 0;        // 0 은 실행할 떄마다 `size * sizeof(type)`만큼 다음 위치로 이동합니다.
    var offset = 0;        // 버퍼 처음 부터 시작한다.
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

`gl.vertexAttribPointer`의 숨겨진 부분은 현재 `ARRAY_BUFFER`를 attribute에 바인하는것 입니다. 다시 말해서 이 attribute는 `positionBuffer`에 바인드 됬습니다. 이는 자유롭게 다른 `ARRAY_BUFFER` 바인트 포인트(bind point)를 바인드 할 수 있음을 의미합니다.
attribute은 `positionBuffer`를 계속 사용합니다.

GLSL 버텍스 쉐이더의 관점에서 `a_position` attribute는 `vec4`입니다.

    in vec4 a_position;

`vec4`는 4 개의 소수점 값입니다. 자바스크립트 에서는 `a_position = {x: 0, y: 0, z: 0, w: 0}`와 같은 것이라고 생각할 수 있습니다. 위에서 `size = 2`라고 설정했습니다. Attributes에서 기본값은 이므로 버퍼에서 처음 2개 값(x와 y)을 가져옵니다. z와 w는 각각 기본값 0과 1이 될 것입니다.

그리기 전에 캔버스 크기를 디스플레이 크기와 일치하도록 조정 해야합니다. 캔버스에는 이미지와 마찬가지로 2 가지 크기가 있습니다.
실제로 안에있는 픽셀의 수와 표시되는 크기가 따로 있습니다. CSS는 캔버스가 표시되는 크기를 결정합니다. 다른 방법보다 훨씬 유연하기 때문에 원하는 **항상 캔버스 크기를 CSS로 설정해야 합니다**.

검사버튼 삭제버튼 캔버스에서 보이는 크기와 픽셀 수를 일치 시키기 위해서 [여기에서 볼 수 있는 헬퍼 함수를 사용하고 있습니다.](webgl-resizing-the-canvas.html)

거의 모든 예제에서 캔버스 크기는 예제가 자체 창에서 실행되는 경우 400x300픽셀 이지만 이 페이지 처럼 iframe를 사용한다면 공간을 채우기 위해 늘어날수 있습니다. CSS가 크기를 결정하도록 하고 이에 맞춰서 일치하게 조정하면 두 가지 경우를 모두 쉽게 처리 할 수 있습니다.

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

WebGL에게 어떻게 클립 공간 값을 화면 공간이라고 불리는 픽셀로 변환을 할것인지 알려줘야합니다.
이를 위해서 `gl.viewport`를 호출하고 현재의 캔버스 크기를 넘겨줍니다.

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

이렇게 하면 WebGL에 -1 ~ +1 클립 공간이 0 &lt;-&gt; `gl.canvas.width`는 x에 0 &lt;-&gt; `gl.canvas.height`는 y로 맵핑됩니다.

캔버스를 지웁니다. `0, 0, 0, 0`는 r, g, b, alpha 이므로 여기에서는 캔버스를 투명하게 만듭니다.

    // 캔버스 지우기
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

다음으로 WebGL에 실행할 쉐이더 프로그램을 알려야 합니다.

    // 사용할 프로그램을 알립니다.(쉐이더 쌍)
    gl.useProgram(program);

사용하는 버퍼 집합과 attributes에 제공하기 위해 이 버퍼들 중에서 어떻게 데이터를 가져 올 것인지 알려 주워야 합니다.

    // 원하는 attribute/buffer를 바인드 해야합니다.
    gl.bindVertexArray(vao);

이제 WebGL에 GLSL 프로그램을 실행하라고 요청할 수 있습니다.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

count가 3개이기 때문에 버텍스 쉐이더는 3번 실행됩니다. 처음에는 버텍스 쉐이더 attribute에서 `a_position.x`와 `a_position.y`가 positionBuffer의 처음 2개의 값으로 설정됩니다. 2번쨰에는 `a_position.xy` 2번쨰 2개의 값으로 설정 됩니다. 마지막으로 마지막 2개의 값으로 설정됩니다.

`primitiveType`이 `gl.TRIANGLES`으로 설정 되었기 떄문에, 버텍스 쉐이더가 3번 실행 될때 마다 WebGL은 `gl_Position`을 설정한 3개의 값에 따라 삼각형을 그립니다. 캔버스 크기에 상관없이 이값들은 클립 공간 좌표에 있으며 각 방향에서 -1 에서 1로 바뀝니다.

버텍스 쉐이더는 단순히 positionBuffer 값을 `gl_Position`로 복사하기 떄문에 삼각형은 클립 공간 좌표에 그려집니다.

      0, 0,
      0, 0.5,
      0.7, 0,

클립 공간에서 변환된 스크린 공간에 WebgGL은 삼각형을 그릴 것입니다. 만약 캔버스 크기가 400x300 인 경우 다음과 같이 표시됩니다.

      클립 공간          화면 공간
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL은 이제 삼각형을 렌더링할 것입니다. WebGL이 그릴 모든 픽셀은 프레그먼트 쉐이더(fragment shader)를 호출합니다. 프레그먼트 쉐이더(fragment shader)는 단순히 `outColor`를 `1, 0, 0.5, 1`으로 설정합니다. 캔버스는 채널당 8비트 캔버스이기 때문에 WebGL은 `[255, 0, 127, 255]`값을 캔버스에 씁니다.

여기에 라이브 버전이 있습니다.

{{{example url="../webgl-fundamentals.html" }}}

위의 경우 버텍스 쉐이더(vertex shader)가 아무것도 하지 않고 위치 직접 데이터를 전달 하는 것을 볼 수 있습니다. 위치 데이터가 이미 클립 공간에 있으므로 다른 작업을 할 필요가 없습니다. *만약 3D를 원하다면 WebGL은 래스터화(rasterization) API이기 떄문에 3D를 클립 공간으로 변환하는 제공하는 쉐이더를 제공해야 합니다.*.

왜 삼각형이 가운데에서 시작하여 오른쪽 상단으로 이동하는지 궁금해 할 것입니다.
`x`의 클립 공간은 -1에서 +1 사이입니다. 이는 0이 가운데 있고 양수 값이 오른쪽에 있다는 것을 의미합니다.

상단에 있는 이유는 클립 공간에서 -1는 하단에 +1은 상단에 있기 떄문입니다. 즉 0은 가운데 이고 양수값은 가운데보다 위에 있기 떄문입니다.

2D의 경우 클립 공간보다 픽셀 단위로 더 작업을 해야 하므로 픽셀 단위로 위치를 제공하고 클립 공간으로 변환할 수 있게 쉐이더를 변경해야 합니다. 여기에 새로운 버텍스 쉐이더가 있습니다.

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // 픽셀 위치를 0.0에서 1.0로 변환합니다.
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // 0 -> 1에서 0 -> 2로 변환
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // 0 -> 2 에서 -1 -> +1 변환(클립 공간)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

변경 사항에 대해 알아야 할 것들이 있습니다.  `x`와 `y`만 사용하기 떄문에 `a_position`를 `vec2`로 변경했습니다. `vec2`는 `vec4`와 비슷하지만 오직 `x`와 `y`만 가지고 있습니다.

다음으로 `u_resolution`이라 불리는 `uniform`를 추가했습니다. 설정 하기 위해서 위치를 찾아야합니다.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

나머지는 주석에서 명확해야 합니다. `u_resolution`을 캔버스의 해상도로 설정함으로써 이제 쉐이더는 픽셀 좌표로 제공되는`positionBuffer`에 넣은 위치를 클립 공간으로 변환 합니다.

이제 위치 값을 클립 공간에서 픽셀로 변경할 수 있습니다. 이번에는 각각 3개의 포인트를 가진 2개의 삼각형으로 만든 직사각형을 그립니다.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

사용할 프로그램을 설정한 후에 생성한 uniform 값을 설정할 수 있습니다. 프로그램을 사용한다는 것은 현재 프로그램을 설정한다는 점에서 위의`gl.bindBuffer`와 같습니다. 이후 모든 `gl.uniformXXX`함수는 현재 프로그램에서 uniforms을 설정합니다.

    gl.useProgram(program);

    // 쉐이더 픽섹에서 클립 공간으로 변환 할 수 있도록 캔버스 해상도를 전달합니다.
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

그리고 물론 2개의 삼각형을 그리기 위해서 버텍스 쉐이더를 6번 호출해야 하므로 `count`를 `6`으로 변경 해야합니다.

    // 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

여기에 예제가 있습니다.

참고: 이 예제와 다음 나오는 모든 예제들은 컴파일하고 쉐이더를 연결하는 함수를 포함하는 [`webgl-utils.js`](/webgl/resources/webgl-utils.js)를 사용합니다. 예제를 복잡하게 만들 필요 없이 [boilerplate](webgl-boilerplate.html) 코드를 사용합니다.

{{{example url="../webgl-2d-rectangle.html" }}}

다시 말하자면 사각형이 해당 영역의 거의 아래쪽에 있음을 알 수 있습니다. WebGL은 왼쪽 하단 구석을 0,0으로 간주합니다. 전통적인 왼쪽 상단 모서리를 2D 그래픽 API에서 사용하려면 클립 공간 y좌표를 뒤집어서 사용 할 수 있습니다.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

이제 직사각형이 예상한곳에 있습니다.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

다른 크기의 직사각형들을 호출 할수 있도록 함수에서 직사각형을 정의하는 코드를 작성 합시다. 이를 하기전에(While we're at it?) 색상을 설정 가능하게 만들것입니다.

먼저 프레그먼트 쉐이더(fragment shader)가 색상 uniform을 입력할 수 있게 해야 합니다.

    #version 300 es

    precision mediump float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

여기에 랜덤 위치와 랜덤 색상으로 50개의 직사각형을 그리는 새로운 코드가 있습니다.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // 랜덤 색상으로 50개의 랜덤 직사각형을 그립니다.
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // 랜덤 색상 설정
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // 직사각형 그리기.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // 0과 -1사이의 정수를 반환합니다.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // 버퍼에 직사각형을 정의하는 값을 채웁니다.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
      // whatever buffer is bound to the `ARRAY_BUFFER` bind point
      // but so far we only have one buffer. If we had more than one
      // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

여기에 직사각형들이 있습니다.

{{{example url="../webgl-2d-rectangles.html" }}}

여러분들이 실제로는 WebGL이 매우 간단한 API라는 것을 알았길 바랍니다.
좋습니다. 간단하다는 말은 아마 잘못된 단어 일수도 있지만 하는일은 간단합니다. 사용자가 제공한 2개의 함수 버텍스 쉐이더와 프래그먼트 쉐이더를 실행하고 삼각형, 선 또는 점을 그립니다.
프로그래머인 여러분들이 더 복잡한 쉐이더의 형태로 3D를 더 추가 하면서 더 복잡해 질수 있지만.
WebGL API 자체는 단순히 레스터라이저(rasterizer)이며 개념적으로 매우 간단합니다.

우리는 어떻게 데이터가 attribute와 2개의 uniforms에 제공되는지를 보여주는 작은 예제를 다루었습니다.
여러개의 attributes과 많은 uniform을 갖는 것이 일반적입니다. 이 글의 맨위에서 *varyings* 과 *textures*에 대해서 언급을 했습니다. 이것들은 이후의 수업에서 소개가 될 것입니다.

계속하기 전에 *대부분*의 어플리케이션은 `setRectangle`에서 했던것 처럼 버퍼의 데이터를 업데이트하는 것이 일반적이지 않다는 것을 언급하고자 합니다. 이를 사용했던 것은 이 예제에서는 입력을 픽셀 좌표를 표시하고 GLSL에서 간단한 수학을 사용하는 것을 보여주기 때문에 이를 설명하는데 쉬운 방법이라고 생각 했기 때문입니다. 이것이 틀린 것은 아니고, 올바르게 하는 많은 경우가 있지만 [WebGL에서 물체의 위치, 방향, 크기를 지정하는 일반적인 방법을 찾으려면 여기를 방문하십시오](webgl-2d-translation.html).

WebGL을 완전히 새로 배우고 GLSL 또는 쉐이더나 GPU가 무엇을 하는지 전혀 모르는 경우 [WebGL 실제 작동 원리 기초](webgl-how-it-works.html)를 확인하십시오.

또한 대부분의 예제에서 사용된 [여기서 사용한 boilerplate 코드](webgl-boilerplate.html)를 최소한 간단하게 읽어야합니다. 거의 모든 예제들은 오직 한가지 것만 그리고 구조가 어떻게 되있는지 볼수 없기 때문에 일반적인 WebGL앱이 구조화 되어 있는지에 대한 어떻게 몇가지 아이디어를 얻기 위해 최소한 [여러가지를 그리는 법](webgl-drawing-multiple-things.html)을 봐야 합니다.

아니면 여기 2가지 방향으로 갈 수 있습니다. 이미지 처리에 관심이 있다면 [몇가지 2D 이미지 처리 방법](webgl-image-processing.html)를 보시면 됩니다. 위치, 회전, 크기에 대하여 관심이 있다면 [여기서 시작하시면 됩니다](webgl-2d-translation.html).
