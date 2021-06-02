Title: WebGL2 2D 이동
Description: 2D 에서 이동하는 방법
TOC: WebGL2 2D 이동


3D를 하기전에 잠시 2D를 해봅시다. 이 글은 몇몇 분들에게는 매우 당연하겠지만 몇 가지 글들을 더 접해 보면서 어느 정도 더 이해보려 합니다.

이 글은 [WebGL 기초](webgl-fundamentals.html)로 시작한 시리즈에서 이어지는 글입니다. 만약 아직 읽지 않았다면 읽고 난 후 이 글을 읽는 것을 추천합니다.

이동(Translation)는 무언가를 "움직인다"라는 의미를 가진 멋진 수학적 이름입니다. 물론 여기서는 기하학을 말하는게 적합하지만 문장을 영어에서 일본어로 옮기는 것을 생각해 봅시다. [첫번째 게시글](webgl-fundamentals.html)에 있는 예제 코드의 `setRectangle`에 변경된 값을 전달하여 사각형을 쉽게 이동할 수 있습니다. 여기에 [이전 에제](webgl-fundamentals.html)를 기반으로 한 예제가 있습니다.

```
+  // 먼저 사각형의 높이, 너비, 이동(translation)을 가지고 있는 몇 가지 변수들을 만들어 봅시다.
+  var translation = [0, 0];
+  var width = 100;
+  var height = 30;
+  var color = [Math.random(), Math.random(), Math.random(), 1];
+
+  // 다음 모든 것을 다시 그리는 함수를 만들어 봅시다.
+  // 이 함수를 이동(translation)을 업데이트하고 호출 할 것입니다..

  // scene 그리기.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // WebGL에 클립 공간에서 픽셀로 변환하는 방법을 알려줍니다.
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

    // 직사각형 위치로 버퍼(buffer) 위치 업데이트
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
*    setRectangle(gl, translation[0], translation[1], width, height);

    // 색상 설정
    gl.uniform4fv(colorLocation, color);

    // 사각형 그리기.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

아래 예제에서 `translation[0]`와 `translation[1]`를 업데이트하고 변경 될떄 `drawScene`를 호출할 몇 가지 슬라이더들을 첨부 했습니다.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

지금까지는 그런대로 좋습니다. 그러나 이제 더 복잡한 모양으로 똑같은 일을 하고 싶다고 상상해 보십시오.

6개의 삼각형으로 구성된 'F'를 그려야 한다고 가정 해 봅시다.

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

이제 다음 코드에 따라 `setRectangle`을 이와 비슷하게 변경해야 합니다.

```
// 현재 ARRAY_BUFFER 버퍼에 문자 'F'를 정의하는 값들로 채웁니다.
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // 왼쪽 열
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // 위 가로(rung)
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // 중간 가로(rung)
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3]),
      gl.STATIC_DRAW);
}
```

확장하기에는 좋지 않다는 것을 볼 수 있을 것입니다. 수백 또는 수천 줄의 복잡한 지오메트리(geometry)를 그리려면 꽤 복잡한 코드를 작성해야 합니다. 뿐만 아니라 Javascript를 그릴 때마다 모든 포인트들을 업데이트해야 합니다


이보다 더 간단한 방법이 있습니다. 지오메트리(geometry)를 업데이트하고 쉐이더(shader)에서 이동을 하면 됩니다.

여기에 새로운 쉐이더가 있습니다.

```
#version 300 es

// attribute는 쉐이더로 입력(in)되는 것 입니다. 버퍼로 부터 데이터를 받아 옵니다.
in vec4 a_position;

// 캔버스의 해상도를 전달하는 데 사용됩니다.
uniform vec2 u_resolution;

+// 위치에 추가될 이동(translation)
+uniform vec2 u_translation;

// 모든 쉐이더는 main 함수를 가져야 합니다.
void main() {
+  // 입력된 이동(translation) 추가
+  vec2 position = a_position + u_translation;

  // 픽셀 위치를 0.0에서 1.0으로 변환 합니다.
*  vec2 zeroToOne = position / u_resolution;

  // 0 -> 1에서 0 -> 2로 변환
  vec2 zeroToTwo = zeroToOne * 2.0;

  // 0 -> 2에서 -1 -> + 1 (클립 공간)로 변환
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
```

코드를 약간 재구성할 것입니다. 하나의 지오메트리를 한 번만 설정하면 됩니다.

```
// 현재 ARRAY_BUFFER 버퍼에 문자 'F'를 정의하는 값들로 채웁니다.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // 왼쪽 열
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // 위 가로(rung)
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // 중간 가로(rung)
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90]),
      gl.STATIC_DRAW);
}
```

그런 다음 원하는 이동(translation)을 그리기 전에 `u_translation` 업데이트를 해야 합니다.

```
  ...

+  var translationLocation = gl.getUniformLocation(
+             program, "u_translation");

  ...

+  // 지오메트리(Geometry) 설정.
+  setGeometry(gl);

  ...

  // scene 그리기.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // WebGL에 클립공간에서 픽셀로 변환 하는 방법을 전달합니다
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 사용할 프로그램(쉐이더 쌍)을 전달합니다
    gl.useProgram(program);

    // 원하는 속성(attribute)/버퍼(buffer)를 연결 합니다.
    gl.bindVertexArray(vao);

    // 캔버스로 해상도를 쉐이더의 픽셀에서 클립공간으로 변환 할수 있게 전달합니다.
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // 색상 설정
    gl.uniform4fv(colorLocation, color);

+    // 이동(translation) 설정.
+    gl.uniform2fv(translationLocation, translation);

    // 직사각형 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

`setGeometry`는 한번만 호출 됩니다. 더 이상 `drawScene`안에 있지 않습니다.

그리고 그 예가 여기 있습니다. 다시 말하지만 슬라이더를 드레그하여 이동(translation)를 업데이트 하십시오.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

이제 그릴떄 WebGL이 거의 모든 것을 하고 있습니다. 하고 있는 모든 작업은 이동(translation)을 설정하고 그리기를 요구하는 것 입니다. 지오메트리(geometry)가 수만개의 포인트를 가지게 되더라도 주요 코드는 유지 될 것입니다.

원하다면 <a target="_blank" href="../webgl-2d-geometry-translate.html">포인트들을 업데이트 하기위해 복잡한 자바스크립트를 사용하는 버전</a>과 비교 할수 있습니다.

이 예제가 너무 당연하지 않았기를 바랍니다. [다음 글에서 회전](webgl-2d-rotation.html)을 알아 볼 것입니다.
