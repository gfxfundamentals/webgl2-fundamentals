Title: WebGL2 기초들
Description: 기본으로 시작하는 첫 번째 WebGL2 강의

제일 중요한 걸 먼저 말하자면, 이 글은 WebGL2에 관한 글입니다. 만약 WebGL1.0에 관심이 있다면 [여기를 방문하십시오](http://webglfundamentals.org). 알아야 할 것은 WebGL2는 [WebGL1과 거의 100% 역호환이 됩니다](webgl1-backward-compatibility.html). 즉, 일단 WebGL2를 사용하면 원래 사용 의도처럼 사용할 수 있습니다. 이 튜토리얼은 이 방향을 따름니다.

WebGL은 종종 3D API로 간주됩니다. 사람들은 "WebGL과 *마법* 을 사용해서 멋진 3D를 만들어야지" 라고 합니다. 실제로 WebGL은 단순히 레스트화 엔진일 뿐입니다. WebGL은 제공한 코드에 기반하여 점, 선 및 삼각형들을 그립니다. 원하는 것을 하기 위해 WebGL이 다른 일을 하도록 하는 것은 점, 선 및 삼각형들을 사용하는 코드를 제공하는 것에 달려있습니다.

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

    // *** PSUEDO CODE!! ***

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
         attributes.a_position = positionBuffer.slice((offset + i) * stide, size);
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

    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    // fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default. It means "medium precision"
    precision mediump float;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      // Just set the output to a constant redish-purple
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

실제 대부분 3D 엔진은 다양한 유형의 템플릿, concatenation등을 사용하여 GLSL 쉐이더들을 즉석으로 생성합니다.
이 사이트의 예제는 런타임에 GLSL을 생성 할만큼 복잡하지는 않습니다.

> NOTE: `#version 300 es`는 **반드시 첫번째 라인에 작성해야합니다**. 그전에 주석이나 빈줄을 사용할 수 없습니다!
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

WebGL에게 어떻게 클립 공간 값을 화면 공간이라고 하는 픽셀로 변환을 할것인지 알려줘야합니다.
이를 위해서 `gl.viewport`를 호출하고 현재의 캔버스 크기를 넘겨줍니다.

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

이렇게 하면 WebGL에 -1 ~ +1 클립 공간이 0 -> `gl.canvas.width`는 x에 0 -> `gl.canvas.height`는 y로 맵핑됩니다.

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

     clip space      screen space
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL will now render that triangle. For every pixel it is about to draw WebGL will call our fragment shader.
Our fragment shader just sets `outColor` to `1, 0, 0.5, 1`. Since the Canvas is an 8bit
per channel canvas that means WebGL is going to write the values `[255, 0, 127, 255]` into the canvas.

Here's a live version

{{{example url="../webgl-fundamentals.html" }}}

In the case above you can see our vertex shader is doing nothing
but passing on our position data directly. Since the position data is
already in clipspace there is no work to do. *If you want 3D it's up to you
to supply shaders that convert from 3D to clipspace because WebGL is only
a rasterization API*.

You might be wondering why does the triangle start in the middle and go to toward the top right.
Clip space in `x` goes from -1 to +1. That means 0 is in the center and positive values will
be to the right of that.

As for why it's on the top, in clip space -1 is at the bottom and +1 is at the top. That means
0 is in the center and so positive numbers will be above the center.

For 2D stuff you would probably rather work in pixels than clipspace so
let's change the shader so we can supply the position in pixels and have
it convert to clipspace for us. Here's the new vertex shader

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // convert the position from pixels to 0.0 to 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // convert from 0->1 to 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // convert from 0->2 to -1->+1 (clipspace)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

Some things to notice about the changes. We changed `a_position` to a `vec2` since we're
only using `x` and `y` anyway. A `vec2` is similar to a `vec4` but only has `x` and `y`.

Next we added a `uniform` called `u_resolution`. To set that we need to look up its location.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

The rest should be clear from the comments. By setting `u_resolution` to the resolution
of our canvas the shader will now take the positions we put in `positionBuffer` supplied
in pixels coordinates and convert them to clip space.

Now we can change our position values from clip space to pixels. This time we're going to draw a rectangle
made from 2 triangles, 3 points each.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

And after we set which program to use we can set the value for the uniform we created.
Use program is like `gl.bindBuffer` above in that it sets the current program. After
that all the `gl.uniformXXX` functions set uniforms on the current program.

    gl.useProgram(program);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

And of course to draw 2 triangles we need to have WebGL call our vertex shader 6 times
so we need to change the `count` to `6`.

    // draw
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

And here it is

Note: This example and all following examples use [`webgl-utils.js`](/webgl/resources/webgl-utils.js)
which contains functions to compile and link the shaders. No reason to clutter the examples
with that [boilerplate](webgl-boilerplate.html) code.

{{{example url="../webgl-2d-rectangle.html" }}}

Again you might notice the rectangle is near the bottom of that area. WebGL considers the bottom left
corner to be 0,0. To get it to be the more traditional top left corner used for 2d graphics APIs
we can just flip the clip space y coordinate.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

And now our rectangle is where we expect it.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Let's make the code that defines a rectangle into a function so
we can call it for different sized rectangles. While we're at it
we'll make the color settable.

First we make the fragment shader take a color uniform input.

    #version 300 es

    precision mediump float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

And here's the new code that draws 50 rectangles in random places and random colors.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fills the buffer with the values that define a rectangle.

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

And here's the rectangles.

{{{example url="../webgl-2d-rectangles.html" }}}

I hope you can see that WebGL is actually a pretty simple API.
Okay, simple might be the wrong word. What it does is simple. It just
executes 2 user supplied functions, a vertex shader and fragment shader and
draws triangles, lines, or points.
While it can get more complicated to do 3D that complication is
added by you, the programmer, in the form of more complex shaders.
The WebGL API itself is just a rasterizer and conceptually fairly simple.

We covered a small example that showed how to supply data in an attribute and 2 uniforms.
It's common to have multiple attributes and many uniforms. Near the top of this article
we also mentioned *varyings* and *textures*. Those will show up in subsequent lessons.

Before we move on I want to mention that for *most* applications updating
the data in a buffer like we did in `setRectangle` is not common. I used that
example because I thought it was easiest to explain since it shows pixel coordinates
as input and demonstrates doing a small amount of math in GLSL. It's not wrong, there
are plenty of cases where it's the right thing to do, but you should [keep reading to find out
the more common way to position, orient and scale things in WebGL](webgl-2d-translation.html).

If you're 100% new to WebGL and have no idea what GLSL is or shaders or what the GPU does
then checkout [the basics of how WebGL really works](webgl-how-it-works.html).

You should also, at least briefly read about [the boilerplate code used here](webgl-boilerplate.html)
that is used in most of the examples. You should also at least skim
[how to draw mulitple things](webgl-drawing-multiple-things.html) to give you some idea
of how more typical WebGL apps are structured because unfortunately nearly all the examples
only draw one thing and so do not show that structure.

Otherwise from here you can go in 2 directions. If you are interested in image procesing
I'll show you [how to do some 2D image processing](webgl-image-processing.html).
If you are interesting in learning about translation,
rotation and scale then [start here](webgl-2d-translation.html).
