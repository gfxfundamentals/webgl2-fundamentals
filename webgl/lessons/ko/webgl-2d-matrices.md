Title: WebGL 2D 행렬
Description: 행렬의 수학적 작동 원리는 간단하고 쉽게 다음 지도서에 설명되어 있습니다.

이 게시글은 WebGL에 대한 글 시리즈에서 이어집니다. 첫번째로 [기초로 시작](webgl-fundamentals.html)과 이전에는 [2D 지오메트리 크기 변환에 대하여](webgl-2d-scale.html) 입니다.

지난 3개의 글에서 우리는 [이동 기하학](webgl-2d-translation.html), [회전 기하학](webgl-2d-rotation.html), [크기 기하학](webgl-2d-scale.html)를 알아 보았습니다. 이동, 회전, 크기 각각 '변형(transformation)'으로 간주됩니다. 이 변환들은 쉐이더의 변환을 필요로 하고 3가지 변환 각각은 순서에 따라 다릅니다. [이전 예제](webgl-2d-scale.html)에서 크기를 조정한 다음 회전을 그 다음 이동을 하였습니다. 순서를 바꿔서 적용하면 다른 결과가 나타납니다.

예를 들어 여기서 (2, 1) 크기, 30도 회전, (100, 0) 이동이 있습니다.

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

예를 들어 여기서 (100, 0) 이동, 30도, 회전 (2, 1) 크기가 있습니다.

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

결과는 완전히 다릅니다. 더 나쁜 것은 두 번째 예제가 필요하다면 새로 원하는 순서로 이동,
 회전, 크기를 적용하는 다른 쉐이더를 작성해야합니다.

저보다 똑똑한 사람들이 행렬 수학으로 모든 것을 똑같이 할 수 있다는 것을 알아냈습니다. 2D의 경우 3x3 행렬을 사용합니다. 3x3 행렬은 9개의 상자가 있는 격자와 같습니다.

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; } .glocal-mat td, .glocal-b { border: 1px solid black; text-align: left;} .glocal-mat td { text-align: center; } .glocal-border { border: 1px solid black; } .glocal-sp { text-align: right !important;  width: 8em;} .glocal-blk { color: black; background-color: black; } .glocal-left { text-align: left; } .glocal-right { text-align: right; }</style>
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

계산을 하기 위해 행렬의 열 아래로 위치를 곱하고 결과를 더합니다. 위치는 오직 2개의 값 x, y을 가지고 있습니다. 그러나 수학에서는 3개의 값이 필요하므로 1을 3번쨰 값으로 사용할 것입니다.

이 경우 결과는 다음과 같습니다.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/>
<tr><td class="glocal-right">newX&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">2.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">3.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">4.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">5.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">6.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1&nbsp;*&nbsp;</td><td>7.0</td><td>&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>8.0</td><td>&nbsp;&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>9.0</td><td>&nbsp;</td></tr></table></div>

이것을 보고 "무엇을 하는거지" 라고 생각된다면 이동을 한다고 생각 해 봅시다. 원하는 만큼의 이동 거리를 tx와 ty라고 부를 것입니다. 행렬을 다음과 같이 만들어 봅시다.

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

이제 다음을 봐 봅시다.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

만약에 대수학을 기억한다면 0을 곱하면 무엇이든지 지울 수 있다는 것을 알 것입니다. 1을 곱하면 아무일도 일어나지 않으므로 다음으로 어떤일이 일어나는지 간단하게 봅시다.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td></td><td>y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

또는 더 간결하게

<pre class="webgl_center">
newX = x + tx;
newY = y + ty;
</pre>

추가적으로 더 다룰 필요는 없습니다. 놀랍게도 [이동(translation)예제의 이동(translation)코드](webgl-2d-translation.html)와 비슷합니다.

비슷하게 회전도 해봅시다. 회전 글에서 언급한것 처럼 회전하고자 하는 각도의 사인과 코사인만 필요합니다.

<pre class="webgl_center">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre>

그리고 다음와 같은 행렬을 만듭니다.

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

행렬을 적용하면 다음과 같이 나옵니다.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

0과 1로 곱하는 것을 검게 하면 다음과 같이 됩니다.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

또는 더 간결하게

<pre class="webgl_center">
newX = x *  c + y * s;
newY = x * -s + y * c;
</pre>

이것은 [회전(rotation)예제](webgl-2d-rotation.html)에서 본 것과 정확히 같습니다.).

마지막으로 크기변환(scale) 입니다. 크기 인자를 sx와 sy라고 부를 것입니다.

그리고 다음과 같이 행렬을 만들 것입니다.

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

행렬을 적용하면 다음과 같습니다.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

이는 실제로 다음과 같습니다.

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

또는 더 간결하게

<pre class="webgl_center">
newX = x * sx;
newY = y * sy;
</pre>

이는 [크기 변환 예제](webgl-2d-scale.html)와 같습니다.

아마 아직도 "그래서 요점이 무엇입니까?"라고 생각이 들수 있고 이미 했던 것을 더 많은 일을 해서 하는 것 처럼 보일수 있습니다.

이제 마법을 할 차례 입니다. 행렬을 모두 곱하고 모든 변환을 한번에 적용 할 수 있다는 것이 밝혀졌습니다. 2개의 행렬을 가지고 곱한다음 결과를 반환하는 `m3.multiply`함수를 가지고 있다고 가정 해 봅시다.

명확하게 하기 위해 이동, 회전, 크기 행렬을 만드는 함수를 만들어 보겠습니다.

    var m3 = {
      translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },

      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },

      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },
    };

이제 쉐이더를 변경해 보겠습니다. 오래된 쉐이더는 다음과 같습니다.

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

void main() {
  // 위치 크기 변환
  vec2 scaledPosition = a_position * u_scale;

  // 위치 회전 변환
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // 이동에 추가
  vec2 position = rotatedPosition + u_translation;
```

다음 새로운 쉐이더는 더 간단합니다.

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

void main() {
  // 위치에 행렬을 곱하기.
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;
  ...
```

그다음 여기에 사용 방법이 있습니다.

```
  // scene 그리기.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // WebGL에 클립공간에서 픽셀로 변환하는 방법을 전달합니다.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

*    // Compute the matrices
*    var translationMatrix = m3.translation(translation[0], translation[1]);
*    var rotationMatrix = m3.rotation(rotationInRadians);
*    var scaleMatrix = m3.scaling(scale[0], scale[1]);
*
*    // Multiply the matrices.
*    var matrix = m3.multiply(translationMatrix, rotationMatrix);
*    matrix = m3.multiply(matrix, scaleMatrix);
*
*    // Set the matrix.
*    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // Set the color.
    gl.uniform4fv(colorLocation, color);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

다음은 새로운 코드를 사용하는 예제입니다. 슬라이더는 동일하고, 이동, 회전 및 크기 조절이 가능합니다. 그러나 셰이더에서 사용되는 방식은 훨씬 간단합니다.

{{{example url="../webgl-2d-geometry-matrix-transform.html" }}}

아직도 더 좋은 것처럼 보이지 않는다고 생각할 수도 있습니다. 그러나 이제 순서를 변경하기 위해 새로운 쉐이더를 작성할 필요가 없습니다. 단지 계산만 바꾸면 됩니다.

        ...
        // Multiply the matrices.
        var matrix = m3.multiply(scaleMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, translationMatrix);
        ...

여기에 이 버전이 있습니다.

{{{example url="../webgl-2d-geometry-matrix-transform-trs.html" }}}

이와 같은 행렬을 적용 할수 있다는 것은 신체의 팔, 태양 주위의 행성의 위성, 나무의 가지와 같은 계층적 애니메이션에 특히 중요합니다. 계층적 애니메이션의 간단한 예제로 'F'를 5번 그리는데 그릴떄 마다 전 'F'에서 행렬을 시작한다고 해봅시다.

```
    // scene 그리기.
    function drawScene() {

      ...

      // 행렬 계산
      var translationMatrix = m3.translation(translation[0], translation[1]);
      var rotationMatrix = m3.rotation(rotationInRadians);
      var scaleMatrix = m3.scaling(scale[0], scale[1]);

      // 행렬 시작
      var matrix = m3.identity();

      for (var i = 0; i < 5; ++i) {
        // 행렬 곱하기
        matrix = m3.multiply(matrix, translationMatrix);
        matrix = m3.multiply(matrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        // 행렬 설정
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // 지오메트리 그리기
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;
        gl.drawArrays(primitiveType, offset, count);
      }
    }
```

이를 하기 위해 단위 행렬을 만드는 함수인 `m3.identity`를 사용해 봅시다. 단위 행렬은 1.0을 나타내는 행렬이며 이를 곱한다면 아무 일도 일어나지 않습니다. 다음과 같습니다.

<div class="webgl_center">X * 1 = X</div>

다음도 같습니다.

<div class="webgl_center">matrixX * identity = matrixX</div>

여기에 단위 행렬을 만드는 코드 입니다.

    var m3 = {
      identity: function () {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },
    ...

여기에 5개 F가 있습니다.

{{{example url="../webgl-2d-geometry-matrix-transform-hierarchical.html" }}}

한 가지 더 에를 들어 봅시다. 지금까지 모든 예제에서 우리의 'F'는 왼쪽 상단 모서리로 회전을 합니다. 이것은 우리가 사용하는 수학이 항상 원점을 중심으로 회전하고 'F'의 왼쪽 위 모서리가 원점 (0, 0)에 있기 때문입니다.

이제 행렬로 할 수 있기 떄문에 적용할 변환 순서를 선택 할 수 있으므로 나머지 변환이 적용되기 전에 원점을 효과적으로 이동할 수 있습니다.

```
    // 'F'의 원점을 한가운데로 이동시키는 행렬을 만듭니다.
    var moveOriginMatrix = m3.translation(-50, -75);
    ...

    // 행렬 곱하기.
    var matrix = m3.multiply(translationMatrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
+    matrix = m3.multiply(matrix, moveOriginMatrix);
```

여기에 예제가 있습니다. F 중심으로 회전하고 크기가 조정됩니다.

{{{example url="../webgl-2d-geometry-matrix-transform-center-f.html" }}}

이 기술을 사용하면 어떤 지점에서든 회전하거나 크기를 조정할 수 있습니다. 이제 포토샵이나 플래쉬에서 이미지의 회점 지점을 이동하는 방법을 알게 되었습니다.

더 해봅시다. 만약 첫번째 글 [WebGL 기초](webgl-fundamentals.html)로 돌아간다면 쉐이더에서 픽셀에서 클립공간으로 변환하는 코드가 다음과 같이 있다는 것을 기억할 것입니다.

      ...
      // 직사각형을 픽셀에서 0.0 에서 1.0으로 변환합니다.
      vec2 zeroToOne = position / u_resolution;

      // 0->1 에서 0->2로 변환합니다.
      vec2 zeroToTwo = zeroToOne * 2.0;

      // 0->2 에서 -1->+1 변환합니다.(클립 공간)
      vec2 clipSpace = zeroToTwo - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

만약 이 단계를 차례대로 살펴보면 첫 단계인 "픽셀을 0.0에서 1.0으로 변환 "은 실제로 크기 변환입니다. 두 번째 단계 역시 크기 변환입니다. 다음은 이동을 하고 마지막으로 Y 축 -1만큼 크기 변환을 합니다. 우리는 실제로 이 모든 것을 하는 행렬을 쉐이더 전달할 수 있습니다. 2개의 크기 변환 행렬을 만들 수 있으며 하나는 1.0/해상도이며 하나는 2.0 크기 변환을 하며 3번째는 -1.0, -1.0만큼 이동하며 4번째로 Y 축 -1만큼 크기 변환하고 이 모든 것을 곱하는 대신에 수학은 간단하기 때문에 해상도에 대한 '투영'(projection) 함수를 만들 것입니다.

    var m3 = {
      projection: function (width, height) {
        // 참고: 0축이 맨위에 오도록 Y축을 뒤집습니다.
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1,
        ];
      },
      ...

이제 쉐이더를 더 단순화 할 수 있습니다. 여기에 새로운 버텍스 쉐이더가 있습니다.

    #version 300 es

    in vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // 위치에 행렬을 곱합니다.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    }

그리고 JavaScript에서는 투영 행렬을 곱해야합니다.

```
  // scene 그리기.
  function drawScene() {
    ...
-    // 쉐이더에서 픽셀에서 클립공간으로 변환 할 수 있게 캔버스 해상도를 전달합니다.
-    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    ...

    // 행렬 계산
+    var projectionMatrix = m3.projection(
+        gl.canvas.clientWidth, gl.canvas.clientHeight);
    var translationMatrix = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(rotationInRadians);
    var scaleMatrix = m3.scaling(scale[0], scale[1]);

    // 행렬 곱하기
*    var matrix = m3.multiply(projectionMatrix, translationMatrix);
*    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
    ...
  }
```

해상도를 설정하는 코드를 제거 했습니다. 마지막 단계에서는 6-7단계의 다소 복잡한 쉐이더에서 1단계의 매우 간단한 쉐이더가 되었으면 이 모든것이 행렬 계산의 마술입니다.

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html" }}}

더 나아 가기 전에 조금 더 간단하게 해봅시다. 다양한 매트릭스를 생성하고 개별적으로 곱하는 것이 일반적이지만, 또한 생성할 때마다 곱하는 것도 일반적입니다. 효과적으로 다음과 같은 함수를 만들 수 있습니다.

```
var m3 = {

  ...

  translate: function(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function(m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function(m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },

  ...

};
```

이렇게 하면 위의 행렬 7줄을 다음과 같이 5줄로 바꿀 수 있습니다.

```
// 행렬 계산
var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
matrix = m3.translate(matrix, translation[0], translation[1]);
matrix = m3.rotate(matrix, rotationInRadians);
matrix = m3.scale(matrix, scale[0], scale[1]);
```

여기에 결과가 있습니다.

{{{example url="../webgl-2d-geometry-matrix-transform-simpler-functions.html" }}}

마지막으로 위에서 순서 문제를 보았습니다. 첫 번쨰 예에서는

    translation * rotation * scale

두 번쨰 에제에서는

    scale * rotation * translation

그리고 이들이 어떻게 다른지를 보았습니다.

행렬을 보는 두 가지 방법이 있습니다. 표현식을 감안할 때

    projectionMat * translationMat * rotationMat * scaleMat * position

많은 사람들이 자연스럽게 발견하는 첫 번쨰 방법은 오른쪽에서 시작하여 왼쪽으로 작업하는 것 입니다.

First we mutiply the positon by the scale matrix to get a scaled postion

    scaledPosition = scaleMat * position

Then we multiply the scaledPostion by the rotation matrix to get a rotatedScaledPosition

    rotatedScaledPosition = rotationMat * scaledPosition

Then we multiply the rotatedScaledPositon by the translation matrix to get a
translatedRotatedScaledPosition

    translatedRotatedScaledPosition = translationMat * rotatedScaledPosition

And finally we multiple that by the projection matrix to get clipspace positions

    clipspacePosition = projectioMatrix * translatedRotatedScaledPosition

The 2nd way to look at matrices is reading from left to right. In that case
each matrix changes the *space" respesented by the canvas. The canvas starts
with representing clipspace (-1 to +1) in each direction. Each matrix applied
from left to right changes the space represented by the canvas.

Step 1:  no matrix (or the identiy matrix)

> {{{diagram url="resources/matrix-space-change.html?stage=0" caption="clip space" }}}
>
> The white area is the canvas. Blue is outside the canvas. We're in clip space.
> Positions passed in need to be in clip space

Step 2:  `matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight)`;

> {{{diagram url="resources/matrix-space-change.html?stage=1" caption="from clip space to pixel space" }}}
>
> We're now in pixel space. X = 0 to 400, Y = 0 to 300 with 0,0 at the top left.
> Positions passed using this matrix in need to be in pixel space. The flash you see
> is when the space flips from positive Y = up to positive Y = down.

Step 3:  `matrix = m3.translate(matrix, tx, ty);`

> {{{diagram url="resources/matrix-space-change.html?stage=2" caption="move origin to tx, ty" }}}
>
> The origin has now been moved to tx, ty (150, 100). The space has moved.

Step 4:  `matrix = m3.rotate(matrix, rotationInRadians);`

> {{{diagram url="resources/matrix-space-change.html?stage=3" caption="rotate 33 degrees" }}}
>
> The space has been rotated around tx, ty

Step 5:  `matrix = m3.scale(matrix, sx, sy);`

> {{{diagram url="resources/matrix-space-change.html?stage=4" capture="scale the space" }}}
>
> The previously rotated space with its center at tx, ty has been scaled 2 in x, 1.5 in y

In the shader we then do `gl_Position = matrix * position;`. The `position` values are effectively in this final space.

Use which ever way you feel is easier to understand.

I hope these posts have helped demystify matrix math. If you want
to stick with 2D I'd suggest checking out [recreating canvas 2d's
drawImage function](webgl-2d-drawimage.html) and following that
into [recreating canvas 2d's matrix stack](webgl-2d-matrix-stack.html).

Otherwise next [we'll move on to 3D](webgl-3d-orthographic.html).
In 3D the matrix math follows the same principles and usage.
I started with 2D to hopefully keep it simple to understand.

Also, if you really want to become an expert
in matrix math [check out this amazing videos](https://www.youtube.com/watch?v=kjBOesZCoqc&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab).

<div class="webgl_bottombar">
<h3>What are <code>clientWidth</code> and <code>clientHeight</code>?</h3>
<p>Up until this point whenever I referred to the canvas's dimensions
I used <code>canvas.width</code> and <code>canvas.height</code>
but above when I called <code>m3.projection</code> I instead used
<code>canvas.clientWidth</code> and <code>canvas.clientHeight</code>.
Why?</p>
<p>Projection matrixes are concerned with how to take clipspace
(-1 to +1 in each dimension) and convert it back
to pixels. But, in the browser, there are 2 types of pixels we are
dealing with. One is the number of pixels in
the canvas itself. So for example a canvas defined like this.</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>or one defined like this</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>both contain an image 400 pixels wide by 300 pixels tall.
But, that size is separate from what size
the browser actually displays that 400x300 pixel canvas.
CSS defines what size the canvas is displayed.
For example if we made a canvas like this.</p>
<pre class="prettyprint"><!>
  &lt;style&gt;
  canvas {
    width: 100%;
    height: 100%;
  }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>The canvas will be displayed whatever size its container is.
That's likely not 400x300.</p>
<p>Here are two examples that set the canvas's CSS display size to
100% so the canvas is stretched
out to fill the page. The first one uses <code>canvas.width</code>
and <code>canvas.height</code>. Open it in a new
window and resize the window. Notice how the 'F'
doesn't have the correct aspect. It gets
distorted.</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>In this second example we use <code>canvas.clientWidth</code>
and <code>canvas.clientHeight</code>. <code>canvas.clientWidth</code>
and <code>canvas.clientHeight</code> report
the size the canvas is actually being displayed by the browser so
in this case, even though the canvas still only has 400x300 pixels
since we're defining our aspect ratio based on the size the canvas
is being displayed the <code>F</code> always looks correct.</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>Most apps that allow their canvases to be resized try to make
the <code>canvas.width</code> and <code>canvas.height</code> match
the <code>canvas.clientWidth</code> and <code>canvas.clientHeight</code>
because they want there to be
one pixel in the canvas for each pixel displayed by the browser.
But, as we've seen above, that's not
the only option. That means, in almost all cases, it's more
technically correct to compute a
projection matrix's aspect ratio using <code>canvas.clientHeight</code>
and <code>canvas.clientWidth</code>. Then you'll get the correct aspect
regardless of whether or not the width and height of the canvas
match the size the browser draws the canvas.
</p>
</div>
