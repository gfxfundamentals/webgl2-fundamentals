Title: WebGL2 기초
Description: 기초부터 시작하는 첫 번째 WebGL2 강의
TOC: 기초


우선적으로 말씀드리고 싶은 것은, 이 곳의 글들은 WebGL2에 대한 글입니다. 만약 WebGL1.0에 관심이 있다면 [여기를 방문하십시오](https://webglfundamentals.org). 
참고로 WebGL2는 [WebGL1과 거의 100% 역호환이 됩니다](webgl1-to-webgl2.html). 
즉, WebGL2를 사용해도 WebGL1을 그대로 사용할 수 있습니다. 이 튜토리얼은 이 방향을 따릅니다.

WebGL은 3D API로 간주됩니다. 사람들은 "WebGL과 *마법*을 사용해서 멋진 3D를 만들어야지" 라고 생각하는데요, 사실 WebGL은 단순한 래스터화(rasterization) 엔진일 뿐입니다. 
WebGL은 여러분이 작성한 코드로 점, 선 및 삼각형들을 그릴 뿐입니다. 
WebGL로 그 외에 다른 일들을 하고 싶다면 원하는 대로 동작하도록 점, 선, 삼각형들을 그리는 코드를 여러분이 직접 작성하시면 됩니다.

WebGL은 여러분 컴퓨터의 GPU에서 실행됩니다. 따라서 여러분은 GPU에서 실행되는 코드를 제공해만 합니다. 
그 코드는 두 개 함수 쌍 형태로 제공되어야 하고, 각각의 함수는 정점 셰이더(vertex shader)와 프래그먼트 셰이더(fragment shader)라고 불립니다.
각각은 매우 엄격한 타입(strictly-types)을 가지는 C/C++과 유사한 [GLSL](webgl-shaders-and-glsl.html)(GL Shader Language)로 작성되어야 합니다.
이 한 쌍을 합쳐서 *프로그램(program)* 이라고 부릅니다.

정점 셰이더의 역할은 정점의 위치(position)를 계산 하는 것입니다. 
함수를 통해 출력 위치가 계산되고 WebGL은 그 위치를 기준으로 [점, 선 또는 삼각형](webgl-points-lines-triangles.html)을 비롯한 다양한 종류의 기본요소(primitives)들을 래스터화 할수 있습니다. 
이 기본요소들을 래스터화 할 때 두 번째로 제공한 프레그먼트 셰이더를 호출합니다. 
프래그먼트 셰이더의 역할은 현재 그려지고 있는 기본요소의 각 픽셀 색상을 계산하는 것입니다

거의 모든 WebGL API는 이러한 함수 쌍을 실행 하기 위한 [상태를 설정](resources/webgl-state-diagram.html)하기위해 존재합니다. 
여러분이 그리려는 요소마다 다양한 상태를 설정해 준 다음, GPU에서 셰이더를 실행하는 `gl.drawArrays` 또는 `gl.drawElements`를 호출해서 함수 쌍을 실행합니다.

함수 안에서 접근이 필요한 모든 데이터는 GPU에 전달되어야 합니다. 
셰이더가 데이터를 받을 수 있는 방법에는 네가지가 있습니다.

1. Attribute, Buffer 그리고 Vertex Array

   버퍼(Buffers)는 GPU에 올라가는 바이너리 데이터 배열입니다. 
   물론 어떤 데이터든 원하는대로 넣을 수 있지만, 일반적으로는 위치, 법선, 텍스처 좌표, 정점 색상 등과 같은 항목이 포함됩니다.

   Attribute는 어떻게 버퍼에서 데이터를 가져올지, 그리고 정점 셰이더에 어떻게 전달할지를 명시하기 위해 사용됩니다. 
   예를들어 각 위치를 세개의 32비트 부동 소수점 값으로 버퍼에 넣을 수 있습니다. 
   그러고 나서 특정 attribute가 어떤 버퍼에서 위치값들을 가져올지, 어떤 타입으로 가져올지(세개의 32비트 부동소수점), 버퍼의 어떤 위치에서부터 데이터를 가져올지(offset), 
   그리고 첫 번째 위치값에서 다음번 위치값을 얻어올 때 바이트를 얼만큼 이동할지를 알려줘야 합니다.

   버퍼는 무작위로 접근할수 없습니다. 대신 정점 셰이더가 특정 횟수 만큼 실행됩니다. 
   실행될 때마다 해당 버퍼에서 다음 값이 추출되어 attribute에 할당됩니다.

   각각의 attribute가 사용할 버퍼가 무엇인지, 버퍼로부터 데이터를 어떻게 추출하는지와 같은 attributes 상태는 VAO(Vertex Array Object)에 저장됩니다.

2. Uniform

   Uniform은 셰이더 프로그램을 실행하기 전에 설정하는 전역 변수입니다.

3. Texture

   텍스처는 셰이더 프로그램에서 무작위 접근이 가능한 데이터 배열입니다. 
   텍스처에 넣는 가장 일반적인 데이터는 이미지 데이터지만 텍스처는 단순히 데이터일 뿐이므로 색상 이외에 다른 데이터도 쉽게 저장할 수 있습니다.

4. Varying

   Varying은 정점 셰이더에서 프래그먼트 셰이더로 데이터를 전달하기 위한 방안입니다. 
   렌더링되는것이 점인지 선인지 또는 삼각형인지에 따라 정점 셰이더에서 varying에 설정한 값은 프래그먼트 셰이더를 실행하는 중에 보간됩니다.

## WebGL Hello World

WebGL에서 중요한 것은 두가지 뿐입니다. 그 두가지는 클립공간 좌표와 색상입니다.
WebGL을 사용하는 프로그래머로서 여러분들이 할일은 이 두가지를 WebGL에 제공하는 것입니다.
여러분은 두가지 정보를 제공하기 위한 두 개의 "셰이더"를 제공해 주어야 합니다. 
정점 셰이더는 클립공간 좌표를, 프래그먼트 셰이더는 색상을 계산합니다.

클립 공간 좌표는 캔버스 크기에 상관없이 항상 -1에서 +1의 범위를 갖습니다. 이제 WebGL을의 가장 단순한 형태로 보여주는 간단한 WebGL예제를 살펴봅시다.

정점 셰이더부터 시작해 보겠습니다.

    #version 300 es

    // attribute는 정점 셰이더에 대한 입력(in)입니다.
    // 버퍼로부터 데이터를 받습니다.
    in vec4 a_position;

    // 모든 셰이더는 main 함수를 가지고 있습니다.
    void main() {

      // gl_Position은 정점 셰이더가 설정해 주어야 하는 내장 변수입니다.
      gl_Position = a_position;
    }

만일 GLSL대신 자바스크립트로 코드가 작성되었다고 가정해 보면, 코드가 실행될 때 아래와 같이 동작한다고 생각하시면 됩니다.

    // *** 의사(pseudo) 코드!! ***

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
         // positionBuffer부터 다음 네개의 값을 a_position attribute에 복사합니다.
         const start = offset + i * stride;
         attributes.a_position = positionBuffer.slice(start, start + size);
         runVertexShader();
         ...
         doSomethingWith_gl_Position();
    }

실제로는 `positionBuffer`가 바이너리 데이터로 변환(아래 참조)되기 때문에, 위 예제처럼 간단하지는 않습니다. 
실제로 버퍼에서 데이터를 가져오는 작업은 조금 다르긴 하지만 위 코드를 통해 정점 셰이더가 대략 어떤식으로 실행되는지에 대해서 개념을 이해하셨기를 바랍니다.

다음으로 프래그먼트 셰이더가 필요합니다.

    #version 300 es

    // 프래그먼트 셰이더는 기본 정밀도를 가지고 있지 않으므로 선언을 해야합니다.
    // highp가 기본값으로 적당합니다. "높은 정밀도(high precision)"를 의미합니다.
    precision highp float;

    // 프래그먼트 셰이더는 출력값을 선언해야 합니다.
    out vec4 outColor;

    void main() {
      // 붉은-보라색 상수로 출력값을 설정합니다.
      outColor = vec4(1, 0, 0.5, 1);
    }

위에서 프래그먼트 셰이더의 출력으로 `outColor`를 선언했습니다. 
`outColor`를 `1, 0, 0.5, 1`으로 설정했는데 1은 red값, 0은 green값, 0.5는 blue값 마지막 1은 알파값입니다. 
WebGL에서 색상은 0에서 1 사이의 값을 사용합니다.

이제 두개의 셰이더 함수를 작성했으니 WebGL 부분을 시작해 봅시다.

첫 번째로 HTML 캔버스(canvas) 요소가 필요합니다.

     <canvas id="c"></canvas>

그 다음 자바스크립트에서 위 캔버스를 찾습니다.

     var canvas = document.querySelector("#c");

이제 WebGL2RenderingContext를 생성할수 있습니다.

     var gl = canvas.getContext("webgl2");
     if (!gl) {
        // webgl2를 사용할수 없습니다!
        ...

이제 셰이더 프로그램을 GPU에 넣기 위해 컴파일해야 하므로 먼저 셰이더를 문자열로 가져와야 합니다.
자바스크립트에서 문자열을 만드는 일반적인 방법을 활용해 GLSL 문자열을 만들 수 있습니다. 
예를 들어, AJAX를 사용하여 다운로드하거나, 자바 스크립트가 아닌 스크립트 태그에 삽입하거나, 
아래에서처럼 멀티라인 템플릿 문자열에 삽입하거나 하는 방식으로 만들 수 있습니다.

    var vertexShaderSource = `#version 300 es

    // attribute는 정점 셰이더에 대한 입력(in)입니다.
    // 버퍼로부터 데이터를 받습니다.
    in vec4 a_position;

    // 모든 셰이더는 main 함수를 가지고 있습니다.
    void main() {

      // gl_Position은 정점 셰이더가 설정해 주어야 하는 내장 변수입니다.
      gl_Position = a_position;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    // 프래그먼트 셰이더는 기본 정밀도를 가지고 있지 않으므로 선언을 해야합니다.
    // highp는 기본값으로 적당합니다. "높은 정밀도(high precision)"를 의미합니다.
    precision highp float;

    // 프래그먼트 셰이더는 출력값을 선언 해야합니다.
    out vec4 outColor;

    void main() {
      // 붉은-보라색 상수로 출력값을 설정합니다.
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

사실 대부분 3D 엔진에서는 다양한 유형의 템플릿, 코드 연결(concatenation) 등의 기법을 사용하여 GLSL 셰이더들을 그때그때 생성합니다.
하지만 이 사이트의 예제들은 런타임에 GLSL을 생성해야 할만큼 복잡하지는 않습니다.

> 주의: `#version 300 es`는 **반드시 첫 번째 라인에 작성해야 합니다**. 그 앞에 주석이나 빈 줄이 있으면 안됩니다!
> `#version 300 es`는 WebGL2에게 GLSL ES 3.00이라 부르는 셰이더 언어를 사용하라고 알려줍니다.
> 만약 이를 첫 번째 라인에 작성하지 않았다면 셰이더 언어는 기본값인 WebGL 1.0의 GLSL ES 1.00으로 설정이 되는데, 이 버전은 많은 차이점이 있고 기능도 훨씬 적습니다.

다음으로 셰이더를 만들고, GLSL 소스를 업로드하고, 셰이더를 컴파일하는 함수가 필요합니다.
참고로 함수의 이름을 보면 어떤 일이 일어나는지 분명하기 때문에 아무런 주석도 작성하지 않았습니다.


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

이제 이 함수를 호출하여 두개의 셰이더를 생성할수 있습니다.

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

그런 다음 이 두개의 셰이더를 *프로그램*으로 *링크* 해야합니다.

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

그런 다음 위 함수를 호출합니다.

    var program = createProgram(gl, vertexShader, fragmentShader);

이제 GPU에 GLSL 프로그램을 만들었으니, 다음으로 데이터를 제공해야합니다.
대부분의 WebGL API는 우리가 만든 GLSL 프로그램에 데이터를 제공하기 위한 상태를 설정하기 위해 존재합니다.
이 예제의 GLSL 프로그램에는 오직 하나의 입력값인 `a_position` attribute만 존재합니다.
가장 먼저 해야 할일은 방금 작성한 프로그램의 attribute location을 찾는것 입니다.

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

attribute의 location(또한 uniform의 location)을 찾는 것은 초기화 과정에서 해야하지, 렌더 루프(render loop)에서 하면 안됩니다.

Attribute는 버퍼에서 데이터를 가져오기 때문에 우선 버퍼를 생성해야 합니다.

    var positionBuffer = gl.createBuffer();

WebGL은 많은 WebGL 리소스들을 전역 바인드 포인트(bind point)를 통해 조작하도록 되어 있습니다.
바인드 포인트는 WebGL의 내부 전역 변수라고 생각하시면 됩니다.
먼저 리소스를 바인드 포인트에 바인드합니다. 그런 다음 다른 모든 함수들은 그 바인드 포인트를 통해 리소스를 참조합니다. positionBuffer를 바인드 해봅시다.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

이제 바인트 포인트를 통해 버퍼를 참조함으로써 버퍼에 데이터를 넣을 수 있습니다.

    // 세 개의 2d 점
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

여기에서 많은 일들이 일어납니다. 먼저 자바스크립트 배열인 `positions`가 있습니다. 
그러나 WebGL은 엄격한 형식의 데이터를 필요하므로 `new Float32Array(positions)`를 통해 `positions`로부터 값을 복사해 새로운 32비트 부동소수점형 배열을 생성합니다. 
`gl.bufferData`는 그 배열을 GPU에 있는 `positionBuffer`에 복사합니다. 
위에서 `ARRAY_BUFFER` 바인드 포인트 `positionBuffer`를 바인드해둔 상태이기 때문에 했기 때문에 `positionBuffer`에 복사되는 것입니다.

마지막 매개변수 `gl.STATIC_DRAW`는 WebGL에 우리가 데이터를 어떻게 사용할 것인지에 대한 힌트를 알려줍니다. 
WebGL은 몇몇 사항들을 최적화하기 위해 이 힌트를 사용합니다. `gl.STATIC_DRAW`는 데이터를 많이 변경하지는 않을 것이라는 의미입니다.

이제 데이터를 버퍼에 넣었으니 attribute에게 데이터를 가져오는 방법을 알려줘야 합니다. 먼저 Vertex Array Object라고 불리는 attribute 상태 집합을 생성해야합니다.

    var vao = gl.createVertexArray();

이후에 수행할 모든 attribute 설정이 위 attribute 상태 집합에 적용되도록 하기 위해서는 이를 현재 사용중인 vertex array로 만들어야합니다.

    gl.bindVertexArray(vao);

이제 마지막으로 vertex array에 attribute를 설정합니다. 먼저 attribute를 켜야 합니다. 
이는 WebGL에게 우리가 버퍼에서 데이터를 가져오려고 한다는 것을 알려주는 것입니다. 
attribute을 켜지 않으면 attribute는 상수 값을 가지게 됩니다.

    gl.enableVertexAttribArray(positionAttributeLocation);

그런 다음 데이터를 가져오는 방법을 명시해야 합니다.

    var size = 2;          // iteration마다 두개 구성 요소 사용
    var type = gl.FLOAT;   // 데이터는 32비트 부동 소수점
    var normalize = false; // 데이터를 정규화하지 않음
    var stride = 0;        // 0인 경우 실행할 때마다 `size * sizeof(type)`만큼 다음 위치로 이동합니다.
    var offset = 0;        // 버퍼의 시작부터 데이터를 읽어옴
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

`gl.vertexAttribPointer`의 숨겨진 부분은 현재 `ARRAY_BUFFER`를 attribute에 바인딩한다는 것 입니다. 
즉, 현재 이 attribute는 `positionBuffer`에 바인드된 상태입니다. 
다른 무언가를 `ARRAY_BUFFER` 바인트 포인트에 바인딩해도 된다는 뜻입니다.
현재는 attribute가 `positionBuffer`를 계속 사용합니다.

GLSL 정점 셰이더의 관점에서 `a_position` attribute는 `vec4`입니다.

    in vec4 a_position;

`vec4`는 4 개의 부동소수점 값입니다. 자바스크립트 에서 `a_position = {x: 0, y: 0, z: 0, w: 0}`와 같은 것이라고 생각할 수 있습니다. 
위에서 `size = 2`라고 설정했습니다. Attribute의 기본값은 `0, 0, 0, 1`이므로 버퍼에서 처음 2개 값(x와 y)을 가져옵니다. 
z와 w는 각각 기본값인 0과 1이 될 것입니다.

그리기 전에 캔버스 크기를 디스플레이 크기와 일치하도록 조정 해야합니다. 캔버스에는 이미지와 마찬가지로 두가지 크기가 있습니다.
실제로 포함되어있는 픽셀의 수와 표시되는 크기가 따로 있습니다. CSS가 캔버스가 표시되는 크기를 결정합니다. 
다른 방법보다 훨씬 유연하기 때문에 **항상 CSS를 사용해 원하는 캔버스 크기를 설정해야 합니다**.

캔버스가 표시되는 실제 크기와 픽셀 수를 일치 시키기 위해서 [여기에서 볼 수 있는 헬퍼 함수를 사용하고 있습니다](webgl-resizing-the-canvas.html).

거의 모든 예제에서 캔버스 크기는 예제가 자체 창에서 실행되는 경우 400x300픽셀 이지만 이 페이지 처럼 iframe를 사용한다면 공간을 채우기 위해 늘어날수 있습니다. 
CSS가 크기를 결정하도록 하고 이에 맞춰서 일치하게 조정하면 두 가지 경우를 모두 쉽게 처리 할 수 있습니다.

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

WebGL에게 `gl_Position`에 설정한 클립공간 좌표값을 화면 공간(screen space)이라고 불리는 픽셀 좌표로 변환하는 방법을 알려줘야 합니다.
이를 위해서 `gl.viewport`를 호출하고 현재의 캔버스 크기를 넘겨줍니다.

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

이렇게 하면 WebGL이 -1 ~ +1 클립 공간을 x 방향으로는 0 &lt;-&gt; `gl.canvas.width`, y 방향으로는 0 &lt;-&gt; `gl.canvas.height` 범위로 맵핑합니다.

캔버스를 지웁니다. `0, 0, 0, 0`는 r, g, b, 알파 이므로 여기에서는 캔버스를 투명하게 만들고 있습니다.

    // 캔버스 지우기
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

다음으로 WebGL에 어떤 셰이더 프로그램을 실행할지 알려주어야 합니다.

    // 우리가 만든 프로그램(셰이더 쌍)을 사용할 것이라고 알려줍니다.
    gl.useProgram(program);

attributes에 데이터를 제공하기 위해, 어떤 버퍼 집합을 사용하고, 거기에서 어떻게 데이터를 가져 올 것인지를 알려줍니다.

    // 원하는 attribute/버퍼 집합을 바인딩합니다.
    gl.bindVertexArray(vao);

최종적으로 WebGL에 우리의 GLSL 프로그램을 실행하라고 요청할 수 있습니다.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

count가 3이기 때문에 정점 셰이더는 3번 실행됩니다. 
첫 번째 실행에서는 정점 셰이더 attribute의 `a_position.x`와 `a_position.y`가 positionBuffer의 첫 두개의 값으로 설정됩니다. 
두 번째 실행에서는 `a_position.xy`가 두 번째 두개의 값으로 설정 됩니다. 마지막으로 마지막 두개의 값으로 설정됩니다.

`primitiveType`이 `gl.TRIANGLES`로 설정 되었기 때문에, 정점 셰이더가 세번 실행 될때 마다 WebGL은 우리가 `gl_Position`에 설정한 세개의 값으로 삼각형을 그립니다. 
캔버스 크기에 상관없이 이 값들은 클립 공간 좌표 값이며 각 축을 따라 -1 에서 1 사이의 값입니다.

우리의 정점 셰이더는 단순히 positionBuffer 값을 `gl_Position`로 복사하기 때문에 삼각형은 아래와 같은 클립 공간 좌표에 그려집니다.

      0, 0,
      0, 0.5,
      0.7, 0,

클립 공간에서 화면 공간으로의 변환은 캔버스 크기가 400x300인 경우 다음과 같이 변환됩니다.

      클립 공간          화면 공간
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL은 이제 삼각형을 렌더링할 것입니다. 그려질 각 픽셀마다 WebGL은 우리의 프래그먼트 셰이더를 호출합니다. 
우리가 작성한 프래그먼트 셰이더는 단순히 `outColor`를 `1, 0, 0.5, 1`으로 설정하고 있습니다. 
캔버스는 채널당 8비트 캔버스이기 때문에 WebGL은 `[255, 0, 127, 255]`값을 캔버스에 씁니다.

아래는 실행되는 결과입니다.

{{{example url="../webgl-fundamentals.html" }}}

위의 경우 정점 셰이더가 아무것도 하지 않고 위치데이터를 바로 전달만 하는 것을 볼 수 있습니다. 
위치 데이터가 이미 클립 공간에 있으므로 다른 작업을 할 필요가 없습니다. 
*만약 3D로 그리기를 원하다면 3D 좌표를 클립 공간으로 변환하는 셰이더는 여러분이 직접 제공해 주어야만 합니다. WebGL은 단지 래스터화(rasterization) API이기 때문입니다.*

왜 삼각형이 화면 가운데에서 시작하여 오른쪽 상단으로 그려지는지 궁금할 것입니다.
`x`의 클립 공간은 -1에서 +1 사이입니다. 이는 0이 가운고 양수 값은 오른쪽이라는 것을 의미합니다.

상단에 있는 이유는 클립 공간에서 -1는 하단에 +1은 상단에 있기 떄문입니다. 즉 0은 가운데이고 양수값은 가운데보다 위이기 때문입니다.

2D의 경우 클립 공간보다 픽셀 단위로 작업하는것이 편리하므로 우리가 픽셀 단위로 위치를 입력하면 클립 공간으로 변환해 주도록 셰이더를 변경해 봅시다. 
아래는 새로운 정점 셰이더입니다.

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // 픽셀 위치를 0.0에서 1.0 사이 값으로 변환합니다.
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // 0 -> 1에서 0 -> 2로 변환
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // 0 -> 2 에서 -1 -> +1(클립 공간)로 변환
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

변경 사항에 대해 참고하셔야 할 것들이 있습니다. `x`와 `y`값만 사용하기 떄문에 `a_position`을 `vec2`로 변경했습니다. 
`vec2`는 `vec4`와 비슷하지만 `x`와 `y`값만 가지고 있습니다.

다음으로 `u_resolution`이라 불리는 `uniform`를 추가했습니다. 값을 설정 하기 위해서 먼저 location을 찾아야합니다.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

나머지는 주석을 통해 명확히 설명되었습니다. `u_resolution`을 캔버스의 해상도로 설정함으로써 이제 셰이더는 픽셀 좌표를 입력한 `positionBuffer`의 위치값들을 클립 공간으로 변환 합니다.

이제 위치값을 클립 공간에서 픽셀(역주: 화면 공간 좌표)로 변경할 수 있습니다. 이번에는 각각 세개의 점을 가진 두개의 삼각형으로 이루어진 직사각형을 그릴 겁니다.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

사용할 프로그램을 설정한 후에 우리가 추가한 uniform에 값을 설정할 수 있습니다. 
`gl.useProgram`은 현재 사용할 프로그램을 설정한다는 점에서 위의 `gl.bindBuffer`와 유사합니다. 
이후 모든 `gl.uniformXXX`함수는 현재 사용할 프로그램의 uniform값을 설정합니다.

    gl.useProgram(program);

    // 셰이더 내에서 픽셀 위치를 클립 공간으로 변환 할 수 있도록 캔버스 해상도를 전달합니다.
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

그리고 물론 두개의 삼각형을 그리기 위해서 정점 셰이더를 6번 호출해야 하므로 `count`를 `6`으로 변경 해야합니다.

    // 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

아래는 그 결과입니다.

참고: 이 예제와 다음 나오는 모든 예제들은 셰이더를 컴파일하고 링크하는 함수를 포함하는 [`webgl-utils.js`](/webgl/resources/webgl-utils.js)를 사용합니다. 
[보일러플레이트](webgl-boilerplate.html) 코드 때문에 예제가 복잡해질 필요는 없을 것 같습니다.

{{{example url="../webgl-2d-rectangle.html" }}}

사각형이 아래쪽에 있음을 알 수 있습니다. WebGL은 양의 Y값을 위쪽, 음의 Y값을 아래쪽으로 간주합니다.
클립 공간에서는 왼쪽 아래 구석이 -1,-1입니다. 
우리는 부호를 변경하지 않았으므로 현재 관점에서 0,0은 왼쪽 아래 구석이 됩니다.
전통적인 2D 그래픽 API 방식으로 왼쪽 상단 모서리를 기준으로 하려면 클립 공간 y좌표를 뒤집으면 됩니다.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

이제 직사각형이 예상한곳에 있습니다.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

이제 직사각형을 정의하는 함수를 만들어서 다른 크기의 직사각형들을 만들어봅시다. 색상도 설정 가능하도록 할 것입니다.

먼저 프래그먼트 셰이더가 색상 uniform을 입력받도록 합니다.

    #version 300 es

    precision highp float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

아래는 무작위 위치에 무작위 색상으로 50개의 직사각형을 그리는 새로운 코드입니다.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // 무작위 색상으로 50개의 무작위 직사각형을 그립니다.
      for (var ii = 0; ii < 50; ++ii) {
        // 무작위 직사각형을 설정합니다.
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // 무작위 색상을 설정합니다.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // 직사각형을 그립니다.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // 0과 (range - 1)사이의 정수를 반환합니다.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // 버퍼에 직사각형을 정의하는 값을 채웁니다.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // 참고: gl.bufferData(gl.ARRAY_BUFFER, ...)는 `ARRAY_BUFFER` 바인드 포인트에 어떤 버퍼가 
	    // 바인딩되었는지에 따라 영향을 받지만, 지금은 버퍼가 하나만 존재합니다.
      // 만일 버퍼가 여러개 있었다면 먼저 해당 버퍼를 `ARRAY_BUFFER`에 바인딩 해야만 합니다.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

직사각형들을 볼 수 있습니다.

{{{example url="../webgl-2d-rectangles.html" }}}

여러분들이 WebGL이 실제로는 매우 간단한 API라는 것을 이해하셨길 바랍니다.
뭐, 간단하다는 말은 사실 잘못된 말일수도 있습니다. 하지만 실제로 하는일은 정말 간단합니다. 
사용자가 제공한 두개의 함수인 정점 셰이더와 프래그먼트 셰이더를 실행하여 삼각형, 선 또는 점을 그립니다.
프로그래머인 여러분들이 3D 구현을 위해 더 복잡한 셰이더를 추가하면서 더 복잡해 질수 있지만,
WebGL API 자체는 단순한 래스터라이저이며 개념적으로도 꽤 간단합니다.

우리는 어떻게 attribute와 두개의 uniform에 데이터를 제공하는지를 보여주는 작은 예제를 다루었습니다.
여러 개의 attribute와 더 많은 uniform들을 갖는 것이 일반적입니다. 
이 글의 맨위에서 *varying* 과 *텍스처*에 대해서도 언급을 했었습니다. 이것들은 이후의 강의에서 소개될 것입니다.

다음으로 넘어가기 전에, *대부분*의 어플리케이션에서는 우리가 `setRectangle`에서 했던것 처럼 버퍼 안의 데이터를 업데이트하는 것이 일반적이지 않다는 것을 언급하고자 합니다. 
예제를 이렇게 만든것은 입력을 픽셀 좌표로 표현하고 GLSL에서 간단한 계산을 하는 것이 설명하기 쉬운 예제라고 생각했기 때문입니다. 
이것이 틀린 것은 아니고, 이렇게 하는 것이 올바른 경우도 많지만 [WebGL에서 물체의 위치, 방향, 크기를 지정하는 보다 일반적인 방법은 여기에서 찾아볼 수 있습니다.](webgl-2d-translation.html).

여러분이 WebGL을 완전히 새로 배우는 입장이고, GLSL 또는 셰이더가 뭐고 GPU가 뭔지 전혀 모르는 경우 [WebGL 작동 원리](webgl-how-it-works.html)를 확인하십시오. 
WebGL이 어떻게 동작하는지에 대한 다른 설명 방법을 보고 싶으시면 [인터랙티브 상태 다이어그램](/webgl/lessons/resources/webgl-state-diagram.html)을 보는 것도 또다른 이해 방법이 될 것입니다.

또한 대부분의 예제에서 사용된 [보일러플레이트 코드](webgl-boilerplate.html)를 최소한 대략적으로라도 읽어보십시오. 
안타깝게도 거의 모든 예제들은 오직 한가지 것만을 그리는 것만 설명되어있기 때문에, 최소한 [여러 물체를 그리는 법](webgl-drawing-multiple-things.html)을 봐야 일반적인 WebGL 앱이 어떻게 구조화 되어있는지 일정 부분 이해가 될 것입니다.

이제, 여러분들은 여기에서부터 두 가지 방향으로 나아갈 수 있습니다. 이미지 처리에 관심이 있다면 [몇가지 2D 이미지 처리 방법](webgl-image-processing.html)을 보시면 됩니다. 
이동, 회전, 크기 변환에 대하여 배우고 싶으시다면 [여기서 시작하시면 됩니다](webgl-2d-translation.html).
