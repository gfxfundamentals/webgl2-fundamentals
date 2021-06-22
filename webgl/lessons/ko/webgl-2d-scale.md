Title: WebGL2 2D 크기 변환
Description: 2D에서 크기 변환하는 방법
TOC: WebGL2 2D 크기 변환


이 글은 WebGL 게시글 시리즈에서 이어지는 글입니다. 첫 번째는 [기초로 시작](webgl-fundamentals.html) 하기고 바로 전에는 [지오메트리 회전](webgl-2d-rotation.html)에 대한 글이었습니다.

크기 변환은 [이동만큼 쉽습니다](webgl-2d-translation.html).

위치에 원하는 크기 만큼 곱합니다. 다음은 [이전 예제](webgl-2d-rotation.html)에서 변경한 것 입니다.

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // 위치 크기 변환
+  vec2 scaledPosition = a_position * u_scale;

  // 위치 회전
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // 이동 추가
  vec2 position = rotatedPosition + u_translation;
```

그 다음으로 그릴 때 크기를 설정하는데 필요한 자바스크립트를 추가합니다

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];


   // scene 그리기
   function drawScene() {
     webglUtils.resizeCanvasToDisplaySize(gl.canvas);

     // WebGL에 클립공간에서 픽셀로 변환 하는 방법을 전달합니다
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

     // 회전 설정
     gl.uniform2fv(rotationLocation, rotation);

+     // 크기 설정
+     gl.uniform2fv(scaleLocation, scale);

     // 직사각형 그리기.
     var primitiveType = gl.TRIANGLES;
     var offset = 0;
     var count = 18;
     gl.drawArrays(primitiveType, offset, count);
   }
```

이제 크기 변환을 가졋습니다. 슬라이더를 드래그 해보세요.

{{{example url="../webgl-2d-geometry-scale.html" }}}

한 가지 주의해야 할 점은 음의 값으로 크기 변환을 하게 된다면 지오메트리가 뒤집힌다는 것입니다.

또 하나 주의해야 할 점은 0에서 크기 변환입니다. 우리가 그린 F에서 0은 왼쪽 위 코너입니다. 이는 위치에 크기를 곱하기 떄문에 0을 항상 0으로 이동하게 만듭니다.
아마 고칠수 있는 방법을 생각해 볼수 있을 것입니다. 예를들어 크기 변환을 하기전에 다른 이동을 하는 *크기 변환전* 이동을 추가할 수 있습니다.
다른 방법은 실제 F의 위치 데이터를 변경하는 것입니다. 우리는 다른 방법으로 할 것입니다.

마지막 3개의 글을 통해 [이동](webgl-2d-translation.html), [회전](webgl-2d-rotation.html) 그리고 크기 변환 를 이해하는데 도움이 되었기를 바랍니다. 다음은 이 세가지를 간단하고 더 유용한 형태로 결합하는 [행렬들](webgl-2d-matrices.html)을 살펴볼 것 입니다.

<div class="webgl_bottombar">
<h3>왜 'F' 입니까?</h3>
<p>
처음에는 다른 사람이 'F'를 사용하는 것을 보았습니다. 'F' 자체는 중요하지 않습니다. 중요한 것은 어떤 방향에서든 그 방향을 알 수 있다는 것입니다. 예를 들어 하트 ❤ 또는 삼각형 △을 사용했다면 수평으로 뒤집혔는지 알 수 없습니다. ○ 원은 더욱 알기 어렵습니다. 색깔이있는 직사각형은 틀림없이 각 모서리에서 다른 색상으로 작동하지만 어느 모서리가 어떤 색깔인지 기억해야합니다. F의 방향은 바로 인식 할 수 있습니다.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
방향을 알수 있는 어떤 모양도 작동할 것입니다. 단지 아이디어가 'F'irst로 소개 되었기 떄문에 'F'를 사용 했습니다.
</p>
</div>
