Title: WebGL 어떻게 작동하나요
Description: WebGL이 무엇인지 What WebGL is really doing under the hood
TOC: WebGL2 작동 원리


이글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다. 계속하기 전에 WebGL과 GPU가 기본적인 수준에서 실제로 무엇을 하는지 알아봐야 한다고 생각합니다. GPU에 기본적으로 2가지가 있습니다. 첫 번쨰 부분은 클립 공간에서 버텍스(또는 데이터 스트림) 처리하는 것입니다. 두번쨰 부분은 첫번쨰 부분을 기반으로 픽셀을 그리는 것입니다.

다음과 같이 호출할 수 있습니다.

    gl.drawArrays(gl.TRIANGLE, 0, 9);

여기서 9의미는 "9개 버텍스 처리"을 의미하므로 9개의 버텍스들이 처리됩니다.

<img src="resources/vertex-shader-anim.gif" class="webgl_center" />

왼쪽에는 제공되는 데이터가 있습니다. 버텍스 쉐이더는 [GLSL](webgl-shaders-and-glsl.html)에서 작성한 함수 입니다. 각 버텍스마다 한번 호출됩니다. 수학적 계산을 하고 현재 버텍스에 대한 클립 공간 값을 가지는 특수 변수 `gl_Position`를 설정합니다. GPU는 이 값을 가져가고 내부적으로 저장합니다.

`TRIANGLES`을 그리는 것으로 가정 할떄, 이 첫 번째 부분에서 3개의 버텍스를 생성 떄마다 GPU는 이를 사용하여 삼각형을 만듭니다. 어느 픽셀이 삼각형의 3개의 점에 해당하는지 확인하고, 삼각형을 다른 말로 "픽셀에 그려라"인 레스트라이저(rasterizes)화 합니다. 각 픽셀마다 프레그먼트 쉐이더를 호출하여 픽셀을 무슨 색상으로 할 것입지 물어 봅니다. 프레그먼트 쉐이더는 해당 픽셀에 대해 원하는 색상을 vec4로 출력합니다.

모든 것들이 흥미롭지만 예제에서 볼 수 있듯이 프레그먼트 쉐이더는 픽셀당 아주 작은 정보를 가지고 있습니다. 운이 좋게도 이보다 더 많은 정보를 전달할 수 있습니다. 버텍스 쉐이더에서 프레그먼트 쉐이더로 전달하고자 하는 각 값에 "varyings"를 정의합니다.

간단한 예로 버텍스 쉐이더에서 직접 계산한 클립 공간 좌표를 프레그먼트 쉐이더로 전달합니다.

이제 간단한 삼각형을 그릴 것입니다. [이젠 예제](webgl-2d-matrices.html)에서 사각형을 삼각형을 바꿔서 계속 해봅시다.

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

그 다음 3개의 버텍스만 그려야 합니다.

    // scene 그리기.
    function drawScene() {
      ...
      // geometry 그리기.
    *  gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

그런 다음 버텍스 쉐이더에서 프레그먼트 쉐이더에 데이터를 전달하기 위해 *varying*을 `out`으로 선언 합니다.

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

그런 다음 똑같은 *varying*을 프레그먼트 쉐이더에서 `in`으로 선언합니다.

    #version 300 es

    precision mediump float;

    in vec4 v_color;

    out vec4 outColor;

    void main() {
    *  outColor = v_color;
    }

WebGL은 버텍스 쉐이더와 프레그먼트 쉐이더에서 똑같은 이름과 타입인 varying 연결합니다.

여기에 실제 버전이 있습니다.

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

사각형은 이동, 크기 조절 및 회전합니다. 색상은 클립공간에서 계산 되기 때문에 사각형과 함께 움직이지 않습니다. 사각형은 배경에 상대적입니다.

이제 이것에 대해 생각해 봅시다. 우리는 오직 3개의 버텍스만 계산 했습니다. 버텍스 쉐이더는 3번만 호출 되기 때문에 3개의색을 계산하지만 삼각형은 이보다 더 다양한 색상을 사용합니다. 이것이 *varying*이라 불리는 이유입니다.

WebGL은 각 버텍스에 대해 3개의 값을 계산하고 삼각형을 이 버텍스에 대해 계산한 값들 사이에 보간을 하는 레스터라이즈화(rasterizes)합니다. 각 픽셀 마다 프레그머트 쉐이더를 해당 픽셀에 보간된 값과 함께 호출합니다.

위 예제에서 3개의 버텍스로 시작을 했습니다.

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
<tr><th colspan="2">버텍스</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

버텍스 쉐이더는 행렬을 이동, 회전, 크기 조절에 적용하고 클립공간을 변환하는데 사용 합니다. 이동, 회전, 크기변환의 기본값은 이동 = 200, 150, 회전 = 0, 크기 = 1 이므로 실제로는 이동만 합니다. 주어진 백 버퍼(backbuffer)는 400x300이고 버텍스 쉐이더는 행렬을 적용한 후 다음과 같은 3개의 클립 공간 버텍스를 계산합니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">gl_Position에서 작성된 값</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

또한 이것들을 색상공간으로 변환하고 우리가 선언한 v_color으로 *varying*을 작성합니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">v_color에서 작성된 값</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

그런 다음 v_color에 작성된 3개의 값이 보간되고 각 픽셀의 프래그먼트 쉐이더에 전달 됩니다.

{{{diagram url="resources/fragment-shader-anim.html" caption="v_color는 v0, v1 그리고 v2 사이에서 보간됩니다." }}}

또한 더 많은 데이터를 버텍스 쉐이더에서 전달할 수 있고 그런 다음 프레그먼트 쉐이더에 전달할 수 있습니다. 예를 들어 2개의 삼각형과 2개의 색상으로 구성된 직사각형을 그려 본다고 합시다. 그리기 위해 다른 속성을 버텍스 쉐이더에 전달할 수 있게 하여 더 많은 데이터를 전달 하고 해당 데이터를 프래그먼트 쉐이더에 직접 전달하게 합니다.

    in vec2 a_position;
    +in vec4 a_color;
    ...
    out vec4 v_color;

    void main() {
       ...
      // Copy the color from the attribute to the varying.
    *  v_color = a_color;
    }

이제 WebGL이 사용할수 있게 색상들을 제공 해야합니다.

      // 버텍스 데이터가 필요 한 곳을 찾습니다.
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
    +  // 현재 ARRAY_BUFFER에서 데이터를 가저 오는 방법을 색상 속성(attribute)에 알려줍니다.
    +  gl.enableVertexAttribArray(colorLocation);
    +  var size = 4;
    +  var type = gl.FLOAT;
    +  var normalize = false;
    +  var stride = 0;
    +  var offset = 0;
    +  gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);

      ...

    +// 사각형으로 만들 2개의 삼각형의 색상을 버퍼를 채웁니다.
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

그리고 여기에 이 결과가 있습니다.

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

2개의 단색 삼각형이 그려지는 것을 알수 있습니다. 그러나 값들이 *varying*에 전달되므로 삼각형을 가로질러 변형 되거나 보간이 됩니다. 이것은 각 삼각형의 3개 버텍스 각각에 같은 색상을 사용했다는 것입니다. 만약에 각 색상을 다르게 하면 보간이 되는 것을 볼 수 있습니다.

    // 사각형으로 만들 2개의 삼각형의 색상을 버퍼를 채웁니다.
    function setColors(gl) {
      // 모든 버텍스가 다른 색상입니다.
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

그리 흥미롭지는 않았지만 둘 이상의 속성을 사용하고 버텍스 쉐이더에서 프래그먼트 쉐이더로 데이터를 전달하는 방법을 배웠습니다. 만약에 [이미지 처리 예제](webgl-image-processing.html)를 보게 된다면 텍스처 좌표를 전달하기 위해 추가적인 속성(attribute)을 전달 하는 것을 볼수 있을 것입니다.

##버퍼와 속성(attribute) 명령은 무엇을 합니까?

버퍼는 버텍스 및 다른 버텍스 데이터를 GPU에 가져오는 방법입니다. `gl.createBuffer`는 버퍼를 생성합니다. `gl.bindBuffer`는 버퍼를 작업 할 버퍼로 설정합니다. `gl.bufferData`는 데이터를 현재 버퍼로 복사합니다.

데이터가 버퍼에 있으면 WebGL에 데이터를 가져오고 버텍스 쉐이더 속성(attribute)에 제공하는 방법을 알려 주어야 합니다.

이를 위해 먼저 WebGL에 어떤 위치에 속성(attribute)를 할당 했는지 물어봅니다. 예를 들어 위의 코드에서는 다음과 같습니다.

    // 버텍스 데이터가 어디로 가야 하는지 찾습니다.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

속성(attribute)의 위치를 알게 되면 2개의 명령을 실행합니다.

    gl.enableVertexAttribArray(location);

이 명령어는 WebGL에 버퍼로 부터 데이터를 제공 할 것을 지시합니다.

    gl.vertexAttribPointer(
        location,
        numComponents,
        typeOfData,
        normalizeFlag,
        strideToNextPieceOfData,
        offsetIntoBuffer);

그리고 이 명령어는 WebGL에게 gl.bindBuffer로 마지막으로 바인드된 버퍼에서 데이터를 가져오고, 버텍스당 컴포넌트 구성 수(1 - 4), 데이터 타입은 무엇인지 (`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT`, 등등...), stride는 한개의 데이터 조각에서 다음 데이터로 넘어가는데 몇 바이트를 건너 뛰어야 하는지 의미하며 offset은 버퍼에서 데이터가 얼마나 떨어져 있는지를 의미합니다.

컴포넌트의 수는 항상 1에서 4입니다.

한 타입의 데이터 당 1개의 버퍼를 사용하는 경우 stride와 offset 모두 항상 0이됩니다. 0인 stride의 의미는 "타입과 크기가 일치하는 stride 사용"입니다. 0인 offset의 버퍼의 시작 부분에서 시작을 의미합니다.값들 0이 아닌 다른 값으로 설정하는 것은 성능면에서 이점이 있을지라도 더 복잡하고 WebGL을 절대적인 한계에 밀어 넣지 않을려면 구지 복잡할 가치는 없습니다.

이제 버퍼와 속성(attribute)에 대해서 정리가 되었기를 바랍니다.

다음으로 [쉐이더와 GLSL](webgl-shaders-and-glsl.html)을 살펴 보겠습니다.

<div class="webgl_bottombar"><h3>vertexAttribPointer의 normalizeFlag는 무엇입니까?</h3>
<p>
정규화 플래그(flag)는 모든 비 부동 소수점 타입에 대한 플래그입니다. false를 전달하면 값은 각자 가지고 타입으로 해석됩니다. BYTE는 -128에서 127까지, UNSIGNED_BYTE는 0에서 255까지 SHORT는 -32768에서 32767까지 등등...
</p>
<p>
정규화 플래그를 true로 설정하면 BYTE(-128 에서 127)의 값은 -1.0에서 +1.0 값들로 되고 UNSIGNED_BYTE(0에서 255)는  0.0에서 1.0으로 바뀌며 정규화된 SHORT 또한 -1.0에서 +1.0으로 되고 이는 BYTE보다 더 많은 해상도를 가집니다.
</p>
<p>
정규화된 데이터의 가장 일반적인 용도는 색상입니다. 대부분의 경우 색상은 0.0에서 1.0까지만 가능합니다. 빨강, 초록, 파랑 그리고 알파에 대해 각각 모든 소수점을 사용하면 버텍스당 색상느 16바이트를 사용하게 됩니다. 복잡한 geometry가 있는 경우 더 많은 바이트를 추가 할 수 있습니다. 이 대신 색상들을 0은 0.0으로 되고 255는 1.0으로 되는 UNSIGNED_BYTE으로 변환 할 수 있습니다. 이제 버텍스당 컬러는 4 바이트만 필요하므로 75%의 비용 절감 효과가 있습니다.
</p>
<p>이를 위해 코드를 변경해 보겠습니다. WevG에게 사용할 색상을 가져오는 방법을 말할떄 입니다. </p>
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
// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
function setColors(gl) {
  // Pick 2 random colors.
  var r1 = Math.random() * 256; // 0 to 255.99999
  var b1 = Math.random() * 256; // these values
  var g1 = Math.random() * 256; // will be truncated
  var r2 = Math.random() * 256; // when stored in the
  var b2 = Math.random() * 256; // Uint8Array
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
여기에 예제가 있습니다.
</p>

{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}
</div>
