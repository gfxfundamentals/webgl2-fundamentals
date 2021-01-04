Title: WebGL2 2D 회전
Description: 2D에서 회전 하는 방법
TOC: WebGL2 2D 회전


이 글은 WebGL 게시글 시리즈에서 이어지는 글입니다. 첫 번쨰는 [기초로 시작](webgl-fundamentals.html)이였으며 바로 전은 [기하학에 대한 이동](webgl-2d-translation.html)이였습니다.


I'm going to admit right up front I have no idea if how I explain this
 will make sense but what the heck, might as well try.

먼저 "단위 원(unit circle)"라고 불리는 것을 소개 하고자 합니다. 만약 중학교 수학을 기억한다면(잠자면 안됩니다!) 원은 반지름(radius)을 가지고 있습니다. 원의 반지름(radius)은 원의 중심으로 부터 원의 가장자리 까지의 거리입니다. 단위 원은 반지름(radius)이 1인 원 입니다.

여기에 단위 원이 있습니다.

{{{diagram url="../unit-circle.html" width="300" height="300" className="invertdark" }}}

파란색 핸들을 원 주위로 드래그하면 X 와 Y의 위치가 변경됩니다. 이는 보여 원위의 그 지점의 위치를 나타냅니다. 상단에서 Y는 1이고 X는 0입니다. 오른쪽에서 X는 1이고 Y는 0입니다.

초등학교 3학년 수학에서 무언가에 1을 곱하면 같은 값을 유지한다는 것을 기억할 것입니다. 그러므로 123 * 1 = 123. 아주 기본이죠? 단위원에서 반지름이 1.0인 것도 1입니다. 회전할떄도 1입니다. 그러므로 이 단위원으로 무언가를 곱할수 있고 마술이 일어나서 회전하는것 뺴고는 1을 곱하는것과 같습니다.

단위 원에 임의의 점 X와 Y를 정할것이고 [전에 했던 예제](webgl-2d-translation.html)에 지오메트리(geometry)에 곱할것입니다.

여기에 업데이트된 쉐이더가 있습니다.

    #version 300 es

    in vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    +uniform vec2 u_rotation;

    void main() {
    + // 위치 회전
    +  vec2 rotatedPosition = vec2(
    +     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
    +     a_position.y * u_rotation.y - a_position.x * u_rotation.x);

      // 이동 추가
    * vec2 position = rotatedPosition + u_translation;

    ...

그리고 자바스크립트를 업데이트하여 이 두 값을 전달할 수 있게 합니다.

```
  ...

+  var rotationLocation = gl.getUniformLocation(program, "u_rotation");

  ...

+  var rotation = [0, 1];

  ...

  // scene 그리기.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // WebGL에 클립 공간에서 픽셀로 변환하는 방법을 전달합니다.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 캔버스 지우기
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 사용할 프로그램(쉐이더 쌍)을 전달합니다
    gl.useProgram(program);

    // 원하는 속성(attribute)/버퍼(buffer)를 연결 합니다.
    gl.bindVertexArray(vao);

    // 캔버스로 해상도를 쉐이더의 픽셀에서 클립공간으로 변환 할수 있게 전달합니다.
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // 색상 설정
    gl.uniform4fv(colorLocation, color);

    // 이동 설정
    gl.uniform2fv(translationLocation, translation);

+    // 회전 설정
+    gl.uniform2fv(rotationLocation, rotation);

    // 사각형 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

여기에 결과가 있습니다. 회전하기 위해 원의 핸들을 드래그하거나 이동하기 위해 슬라이더를 드래그하십시오.

{{{example url="../webgl-2d-geometry-rotation.html" }}}

왜 작동할까요? 음, 수학을 봐 봅시다.

<pre class="webgl_center">
    rotatedX = a_position.x * u_rotation.y + a_position.y * u_rotation.x;
    rotatedY = a_position.y * u_rotation.y - a_position.x * u_rotation.x;
</pre>

직사각형이 있고 회전하려고 한다고 가정해 보겠습니다. 회전하기 전에 오른쪽 위 구석이 3.0, 9.0에 있습니다. 12 방향에서 시계 방향으로 30도 단위 점을 찍어 봅시다.

<img src="../resources/rotate-30.png" class="webgl_center invertdark" />

원에서 위치는 0.5와 0.87입니다.

<pre class="webgl_center">
   3.0 * 0.87 + 9.0 * 0.50 = 7.1
   9.0 * 0.87 - 3.0 * 0.50 = 6.3
</pre>

이것이 바로 우리가 필요한 것 입니다.

<img src="../resources/rotation-drawing.svg" width="500" class="webgl_center"/>

시계 방향으로 60도 회전도 똑같습니다.

<img src="../resources/rotate-60.png" class="webgl_center invertdark" />

원에서 위치는 0.87과 0.5입니다.

<pre class="webgl_center">
   3.0 * 0.50 + 9.0 * 0.87 = 9.3
   9.0 * 0.50 - 3.0 * 0.87 = 1.9
</pre>

점을 시계 방향으로 오른쪽으로 돌릴 때 X 값이 커지고 Y 값이 작아지는 것을 볼 수 있습니다. 90도를 지나 가면 X는 다시 작아지고 Y는 점점 커질 것입니다. 이 패턴이 회전으로 제공됩니다.

단위원의 점에 대한 또 다른 이름이 있습니다. 사인과 코사인이라고 불리는 것입니다. 주어진 각도에 대하여 다음과 같이 사인과 코사인을 찾을 수 있습니다.

    function printSineAndCosineForAnAngle(angleInDegrees) {
      var angleInRadians = angleInDegrees * Math.PI / 180;
      var s = Math.sin(angleInRadians);
      var c = Math.cos(angleInRadians);
      console.log("s = " + s + " c = " + c);
    }

자바스크립트 콘솔에 코드를 복사하고 붙혀 넣고 `printSineAndCosignForAngle(30)`을 치면 `s = 0.49 c = 0.87`(주의: 숫자를 반올립 했습니다.)을 볼 수 있습니다.

이 모든 것들을 함께 사용하면 원하는 각도로 지오메트리(geometry)를 회전 할 수 있습니다. 회전하려는 각도의 사인 및 코사인으로 회전을 설정하면됩니다.

      ...
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);

여기에 각도 설정이 있는 버전이 있습니다. 이동 또는 회전할 슬라이더를 드래그 하십시오.

{{{example url="../webgl-2d-geometry-rotation-angle.html" }}}

이해가 됐기를 바랍니다. [다음도 간단한 것입니다. 크기](webgl-2d-scale.html).

<div class="webgl_bottombar"><h3>라디안(radians)이란 무엇 입니까?</h3>
<p>
라디안(Radians)은 원, 회전 및 각도와 함꼐 사용되는 측정 단위 입니다. 마치 우리가 인치, 야드, 미터 등 거리를 측정 할 수 있는 것처럼 라디안으로 각도를 측정 할 수 있습니다.
</p>
<p>
수학에서 미터법 측정이 야드파운드법 측정 보다 쉽다는 것을 알고 있을 것입니다. 인치에서 피트로 이동하려면 12로 나눠야 합니다. 인치에서 야드로 이동하려면 36을 나눠야 합니다.
 여러분들을 어떨지 모르겠지만 저는 36을 나누는 것은 머릿속에서 잘 계산이 안됩니다. 미터법을 사용하면 훨씬 쉽습니다. 밀리미터에서 센터미터로 이동하려면 10으로 나누면 됩니다. 밀리 미터에서 미터로 갈려면 1000으로 나누면 됩니다. 머리속에서 1000을 계산하는 것은 할 수 있습니다.
</p>
<p>
라디안(Radians)과 각도(degrees)도 비슷합니다. 각도(Degrees)는 수학을 어렵게 만들고 라디안(Radians)은 수학을 쉽게 만듭니다. 원에는 360도(degrees)가 있지만 라디안(radians)에는 2π만 있습니다. 따라서 전체 회전은 2π 라디안입니다. 절반은 1π 라디안 입니다. 1/4 회전, 즉 90도 회전은 1/2π 라디안 입니다. 그래서 무언가를 90도 회전 시키고 싶다면 <code>Math.PI * 0.5</code>를 사용하면 됩니다. 45도를 회전 시키고 싶다면 <code>Math.PI * 0.25</code>를 사용하면 됩니다.
</p>
<p>
각도, 원 또는 회전을 포함하는 거의 모든 수학은 라디안으로 생각하면 시작하면 매우 간단하게 작동합니다. 그러니 한번 시도해 보세요. UI 디스플레이를 제외하고 각도(degrees)가 아닌 라디안(radians)을 사용하십시오.
</p>
</div>
