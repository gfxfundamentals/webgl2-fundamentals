Title: WebGL2 작동 원리
Description: WebGL이 내부적으로 하는 일
TOC: WebGL2 작동 원리


이글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다. 계속하기 전에 실제로 WebGL과 GPU가 기본적인 수준에서 무엇을 하는지 아셔야 합니다.
기본적으로 GPU가 하는 일은 두가지 입니다. 첫 번째는 정점(vertex)(또는 데이터 스트림)을 처리하여 클립 공간의 정점으로 변환하는 것입니다. 두 번째는 첫 번째 결과를 가지고  픽셀을 그리는 것입니다.

아래와 같이 호출한다면,

    gl.drawArrays(gl.TRIANGLES, 0, 9);

여기서 9의미는 "9개 정점 처리"를 의미하므로 9개의 정점들이 처리됩니다.

<img src="resources/vertex-shader-anim.gif" class="webgl_center" />

왼쪽에는 여러분이 제공한 데이터가 있습니다. 정점 셰이더는 [GLSL](webgl-shaders-and-glsl.html)로 작성한 함수 입니다. 각 정점마다 한번씩 호출됩니다. 몇가지 수학적 계산을 한 뒤, 현재 정점의 대한 클립 공간 위치를 특수한 변수 `gl_Position`에 저장합니다. GPU는 이 값을 받아서 내부적으로 저장해 둡니다.

여러분이 `TRIANGLES`를 그린다고 가정한다면, 첫 번째 부분에서 3개의 정점를 생성할 때마다 GPU는 이를 사용하여 삼각형을 만듭니다. 어떤 픽셀들이 삼각형의 3개의 점에 해당하는지 확인하고, 삼각형을 래스터화(rasterize) 합니다. 래스터화는 "픽셀로 그리다"의 다른 표현일 뿐입니다. 각 픽셀마다 프래그먼트 셰이더를 호출하여 당신이 픽셀을 무슨 색상으로 그리기 원하는지를 알아냅니다. 프래그먼트 셰이더는 해당 픽셀에 대해 원하는 색상을 vec4로 출력합니다.

흥미로운 사실이네요. 그런데 예제에서 볼 수 있듯이 지금까지는 프래그먼트 셰이더가 각 픽셀에 대해 아주 적은 정보만을 가지고 있습니다. 다행히 우리는 더 많은 정보를 전달할 수 있습니다. 정점 셰이더에서 프래그먼트 셰이더로 전달하고자 하는 각 값을 "varying"으로 정의할 수 있습니다.

간단한 예로 정점 셰이더에서 계산한 클립 공간 좌표를 직접 프래그먼트 셰이더로 전달해 봅시다.

간단한 삼각형을 그릴 것입니다. [이전 예제](webgl-2d-matrices.html)에서 사각형을 삼각형으로 바꿔서 계속 해봅시다.

    // 버퍼를 삼각형을 정의 하는 값들로 채웁니다.
    function setGeometry(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
                 0, -100,
               150,  125,
              -175,  100]),
          gl.STATIC_DRAW);
    }

그 다음 3개의 정점만 그리면 됩니다.

    // 장면 그리기.
    function drawScene() {
      ...
      // geometry 그리기.
    *  gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

정점 셰이더에서는 프래그먼트 셰이더에 데이터를 전달하기 위한 *varying*을 `out`을 사용해 선언 합니다.

    out vec4 v_color;
    ...
    void main() {
      // 위치에 행렬을 곱합니다.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // 클립 공간에서 색상 공간으로 변환합니다.
      // 클립 공간은 -1.0에서 +1.0까지 입니다.
      // 색상 공간은 0.0에서 1.0까지 입니다.
    *  v_color = gl_Position * 0.5 + 0.5;
    }

그런 다음 똑같은 *varying*을 프레그먼트 셰이더에서 `in`을 사용해 선언합니다.

    #version 300 es

    precision highp float;

    in vec4 v_color;

    out vec4 outColor;

    void main() {
    *  outColor = v_color;
    }

WebGL이 정점 셰이더에서 정의된 varying과 동일한 이름과 타입을 갖는 프레그먼트 셰이더의 varying을 연결해 줍니다.

아래는 동작하는 예제입니다.

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

사각형을 이동, 크기 조절 및 회전해 보십시오. 색상은 클립공간에서 계산 되기 때문에 삼각형과 함께 움직이지 않습니다. 색상은 배경에 상대적입니다.

생각해 보세요. 우리는 오직 세개의 정점만 계산 했습니다. 정점 셰이더는 3번만 호출 되기 때문에 세개의 색상만을 계산했지만 방금 그려진 삼각형은 이보다 더 다양한 색상을 갖고 있습니다. *varying*이라 불리는 이유가 바로 그것입니다.

WebGL은 각 정점에 대해 계산한 세개의 값을 받아서, 래스터화 과정에서 그 값들을  보간합니다. 각 픽셀마다 우리가 작성한 프래그먼트 셰이더를 각 픽셀에 해당하는 보간된 값과 함께 호출합니다.

위 예제에서 보면 우선 세개의 정점으로 시작을 했습니다.

<style>
table.vertex_table {
  border: 1px solid black;
  border-collapse: collapse;
  font-family: monospace;
  font-size: small;
}

table.vertex_table th {
  background-color: #88ccff;
  padding-right: 1em;
  padding-left: 1em;
}

table.vertex_table td {
  border: 1px solid black;
  text-align: right;
  padding-right: 1em;
  padding-left: 1em;
}
</style>
<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">정점</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

정점 셰이더는 이동, 회전, 크기 변환 행렬을 적용하여 클립 공간으로 변환합니다. 이동, 회전, 크기 변환의 기본값은 이동 = 200, 150, 회전 = 0, 크기 = 1,1 이므로 실제로는 이동만 합니다. 주어진 백 버퍼(backbuffer)의 크기가 400x300일때, 정점 셰이더가 행렬을 적용하면 다음과 같은 세개의 클립 공간 정점이 계산됩니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">gl_Position에 쓰여진 값</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

또한 이것들을 색상 공간으로 변환하고 우리가 선언한 v_color *varying*에 출력합니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">v_color에 쓰여진 값</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

그런 다음 v_color에 작성된 3개의 값이 각 픽셀마다 보간되고 프래그먼트 셰이더에 전달 됩니다.

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_color는 v0, v1 그리고 v2 사이에서 보간됩니다." }}}

또한 더 많은 데이터를 정점 셰이더로 전달하여 이를 프레그먼트 셰이더에 전달할 수 있습니다. 예를 들어 두개의 삼각형과 두개의 색상으로 구성된 직사각형을 그려 본다고 합시다. 이를 위해 또다른 attribute를 정점 셰이더에 추가하여 더 많은 데이터를 전달 하고 그 데이터를 프래그먼트 셰이더에 직접 전달할 수 있습니다.

    in vec2 a_position;
    +in vec4 a_color;
    ...
    out vec4 v_color;

    void main() {
       ...
      // attribute로부터 varying으로 색상을 복사함.
    *  v_color = a_color;
    }

이제 WebGL이 사용할수 있게 색상값들을 제공 해야합니다.

      // 정점 데이터가 필요한 위치를 찾습니다.
      var positionLocation = gl.getAttribLocation(program, "a_position");
    +  var colorLocation = gl.getAttribLocation(program, "a_color");
      ...
    +  // 색상을 위한 버퍼를 생성합니다.
    +  var buffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    +
    +  // 색상을 설정 합니다.
    +  setColors(gl);

      // attributes 설정
      ...
    +  // 현재 ARRAY_BUFFER에서 데이터를 가저 오는 방법을 색상 attribute에게 알려줍니다.
    +  gl.enableVertexAttribArray(colorLocation);
    +  var size = 4;
    +  var type = gl.FLOAT;
    +  var normalize = false;
    +  var stride = 0;
    +  var offset = 0;
    +  gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);

      ...

    +// 사각형을 구성하는 2개 삼각형의 색상으로 버퍼를 채웁니다.
    +function setColors(gl) {
    +  // Pick 2 random colors.
    +  var r1 = Math.random();
    +  var b1 = Math.random();
    +  var g1 = Math.random();
    +
    +  var r2 = Math.random();
    +  var b2 = Math.random();
    +  var g2 = Math.random();
    +
    +  gl.bufferData(
    +      gl.ARRAY_BUFFER,
    +      new Float32Array(
    +        [ r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1]),
    +      gl.STATIC_DRAW);
    +}

아래는 그 결과입니다.

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

두개의 단색 삼각형이 그려지는 것을 알수 있습니다. 값들을 *varying*에 전달하고 있으므로 삼각형 내부에 걸쳐 변형 되거나 보간됩니다. 하지만 삼각형의 각 세개 정점에 모두 같은 색상을 사용했기 때문에 동일한 색상으로 보입니다. 만약 각 색상을 다르게 하면 보간이 되는 것을 확인할 수 있습니다.

    // 사각형을 구성하는 2개 삼각형의 색상으로 버퍼를 채웁니다.
    function setColors(gl) {
      // 모든 정점의 색상을 다르게 설정합니다.
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(
    *        [ Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1]),
          gl.STATIC_DRAW);
    }

이제 보간된 *varying*을 볼수 있습니다.

{{{example url="../webgl-2d-rectangle-with-random-colors.html" }}}

그리 흥미롭지는 않았을지 몰라도 하나 이상의 attribute를 사용하는 방법과 정점 셰이더에서 프래그먼트 셰이더로 데이터를 전달하는 방법을 배웠습니다. [이미지 처리 예제](webgl-image-processing.html)를 보시면 텍스처 좌표를 전달하기 위해 추가적인 attribute를 사용 하는 예제도 확인하실 수 있습니다.

##버퍼와 attribute 관련한 명령문은 무엇을 하는겁니까?

버퍼는 정점 및 추가적인 정점별 데이터(per-vertex data)를 GPU로 전달하는 방법입니다. `gl.createBuffer`는 버퍼를 생성합니다. `gl.bindBuffer`는 버퍼를 작업 할 버퍼로 설정합니다. `gl.bufferData`는 데이터를 현재 버퍼로 복사합니다.

데이터가 버퍼에 들어간 후엔, WebGL에게 데이터를 가져오는 방법과 정점 셰이더의 attribute로 제공하는 방법을 알려 주어야 합니다.

이를 위해 먼저 WebGL에 어떤 위치에 attribute가 할당되어 있는지 물어봅니다. 예를 들어 위의 코드에서는 다음과 같습니다.

    // 정점 데이터가 어디로 전달되어야 하는지 찾습니다.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

attribute의 위치를 알게 되면 두개의 명령문을 실행합니다.

    gl.enableVertexAttribArray(location);

이 명령문은 WebGL에게 우리가 버퍼로부터 데이터를 제공 할 것이라는 것을 알려숩니다.

    gl.vertexAttribPointer(
        location,
        numComponents,
        typeOfData,
        normalizeFlag,
        strideToNextPieceOfData,
        offsetIntoBuffer);

그리고 이 명령문은 WebGL에게 gl.bindBuffer로 마지막으로 바인딩된 버퍼에서 데이터를 가져오도록 하는데, 정점당 몇 개의 컴포넌트가 존재하는지(1 - 4), 데이터 타입은 무엇인지 (`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT`, 등등...), 한 데이터에서 다음 데이터로 넘어가는데 몇 바이트를 건너 뛰어야 하는지를 의미하는 stride, 버퍼의 시작 부분에서 데이터가 얼마나 떨어져 있는지를 의미하는 offset을 알려줍니다.

컴포넌트의 수는 항상 1에서 4 사이입니다.

각 데이터마다 1개의 버퍼를 사용하는 경우 stride와 offset 모두 항상 0이됩니다. stride가 0이라는 것은 의미는 "타입과 크기가 일치하는 stride 사용"을 의미합니다. offset이 0이라는 것은 버퍼의 시작 부분에서부터 데이터를 가져온다는 것을 의미합니다. 이 값들을 0이 아닌 다른 값으로 설정하는 것은 복잡하고, 성능면에서 이점이 있긴 하지만 WebGL의 한계치까지 성능을 높이려는 것이 아니라면 그럴만한 가치가 없습니다.

이제 버퍼와 attribute에 대해서 정리가 되었기를 바랍니다.

다음으로 [셰이더와 GLSL](webgl-shaders-and-glsl.html)을 살펴 보겠습니다.

<div class="webgl_bottombar"><h3>vertexAttribPointer의 normalizeFlag는 무엇입니까?</h3>
<p>
정규화 플래그(flag)는 부동 소수점이 아닌 타입을 위한 플래그입니다. false면 값은  타입 그대로 해석됩니다. BYTE는 -128에서 127까지, UNSIGNED_BYTE는 0에서 255까지 SHORT는 -32768에서 32767까지 등등...
</p>
<p>
정규화 플래그를 true로 설정하면 BYTE(-128 에서 127)의 값은 -1.0에서 +1.0 값들로 바뀌고 UNSIGNED_BYTE(0에서 255)는  0.0에서 +1.0으로 바뀌며 정규화된 SHORT 또한 -1.0에서 +1.0으로 바뀌는데, BYTE보다는 더 높은 해상도를 가집니다.
</p>
<p>
정규화된 데이터의 가장 일반적인 용도는 색상입니다. 대부분의 경우 색상은 0.0에서 1.0 사이의 값으로 정의됩니다. 빨강, 초록, 파랑 그리고 알파에 대해 완전한 부동소수점을 사용하면 각 정점의 각 색상을 위해 16바이트를 사용하게 됩니다. 복잡한 geometry가 있는 경우 더 많은 바이트가 추가될 수 있습니다. 그 대신 색상들을 0이 0.0으로, 255가 1.0을 표현하는 UNSIGNED_BYTE로 변환 할 수 있습니다. 이제 정점당 색상에 4 바이트만 필요하므로 75%의 메모리 절감 효과가 있습니다.
</p>
<p>이를 위해 코드를 변경해 보겠습니다. WebGL에게 우리가 사용할 색상을 가져오는 방법을 알려줄 때, </p>
<pre class="prettyprint showlinemods">
  var size = 4;
*  var type = gl.UNSIGNED_BYTE;
*  var normalize = true;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);
</pre>
<p>그 다음 버퍼를 사용할 색상으로 채울때 입니다.</p>
<pre class="prettyprint showlinemods">
// 사각형을 구성하는 두 개의 삼각형의 색상으로 버퍼를 채움
function setColors(gl) {
  // 2 개의 랜덤 색상 선택
  var r1 = Math.random() * 256; // 0 에서 255.99999 사이의 값.
  var b1 = Math.random() * 256; // 이 값들은
  var g1 = Math.random() * 256; // Uint8Array에 저장될 때
  var r2 = Math.random() * 256; // 절단이 발생함
  var b2 = Math.random() * 256; 
  var g2 = Math.random() * 256;

  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(   // Uint8Array
        [ r1, b1, g1, 255,
          r1, b1, g1, 255,
          r1, b1, g1, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255]),
      gl.STATIC_DRAW);
}
</pre>
<p>
아래는 결과 예제입니다.
</p>

{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}
</div>
