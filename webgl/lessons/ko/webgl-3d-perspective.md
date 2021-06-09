Title: WebGL 3D 원근 투영
Description: WebGL에서 3D 원근 투영을 그리는 방법
TOC: 3D 원근 투영


이 글은 WebGL 시리즈에서 이어지는 글입니다. 첫 글은 [WebGL2 기초](webgl-fundamentals.html)이며 이 전 글은 [3D 직교 투영](webgl-3d-orthographic.html)입니다. 아직 위 글들을 읽지 않았다면 먼저 읽어 보시기 바랍니다.

지난 번 글에서 3D를 그리는 방법을 알아 보았으나, 원근이 없는 3D였습니다.
원근이 없는 3D는 "직교 투영"을 활용해서 그린 것이었는데 직교 투영이 활용되는 경우도 있으나 일반적으로 우리가 원하는 "3D"는 아닙니다.

이를 위해서는 원근감을 추가해야 합니다. 원근감이란 무엇일까요?
원근감은 간단하게 말하자면 멀리 있는 것이 작게 보인다는 특징입니다.

<div class="webgl_center noinvertdark"><img style="width: 500px;" src="resources/perspective-example.svg" /></div>

위 예제를 보면 멀리 있는 것이 작게 그려진 것을 볼 수 있습니다. 
현재 예제를 가지고 멀리 있는 물체를 작게 보이게 하는 가장 간단한 방법은 클립 공간의 X와 Y좌표를 Z값으로 나누는 것이 될 것입니다.

이렇게 생각해 보십시오. (10, 15)과 (20, 15)를 잇는 직선이 있다고 하면 길이는 10입니다.
현재 예제에서 이 직선은 10픽셀 길이로 그려질 것입니다.
하지만 우리가 Z값으로 이것을 나눈다고 가정해 봅시다. Z가 1이라면,

<pre class="webgl_center">
10 / 1 = 10
20 / 1 = 20
abs(10-20) = 10
</pre>

10픽셀 길이일 것입니다. 만일 Z값이 2라면,

<pre class="webgl_center">
10 / 2 = 5
20 / 2 = 10
abs(5 - 10) = 5
</pre>

5픽셀 길이일 것입니다. Z=3 이라면, 

<pre class="webgl_center">
10 / 3 = 3.333
20 / 3 = 6.666
abs(3.333 - 6.666) = 3.333
</pre>

보시다시피 Z값이 커질수록, 즉 멀리 떨어져 있을수록 더 작게 그려지는 것입니다.
Z값의 크기가 작기 때문에(-1에서 1 사이) 클립 공간에서 Z값을 나눈다면 더 좋은 결과가 나타날 것입니다.
fudgeFactor를 두어 나누기 전에 Z값에 곱한다면 주어진 거리의 물체가 얼마나 작게 그려질지를 조절할 수 있을겁니다.

한 번 해 봅시다. 먼저 버텍스 쉐이더를 수정하는데, Z값에 "fudgeFactor"를 그 값으로 나누도록 수정합시다.


```
...
+uniform float u_fudgeFactor;
...
void main() {
  // position과 행렬을 곱함.
*  vec4 position = u_matrix * a_position;

  // 나누어질 z 값을 조정
+  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

  // x와 y를 z로 나눔
*  gl_Position = vec4(position.xy / zToDivideBy, position.zw);
}
```

클립 공간의 Z값이 -1과 1사이 값이기 때문에 `zToDivideBy`값이 0과 +2 * fudgeFactor의 값을 가질 수 있도록 1을 더한 것에 주의하십시오.

또한 fudgeFactor값을 설정할 수 있도록 코드를 수정해야 합니다.


```
  ...
+  var fudgeLocation = gl.getUniformLocation(program, "u_fudgeFactor");

  ...
+  var fudgeFactor = 1;
  ...
  function drawScene() {
    ...
+    // fudgeFactor를 설정
+    gl.uniform1f(fudgeLocation, fudgeFactor);

    // geometry 그리기
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
```

아래는 그 결과입니다.

{{{example url="../webgl-3d-perspective.html" }}}

잘 모르겠다면 "fudgeFactor" 슬라이더를 1.0에서 0.0으로 드래그해서 우리가 Z값으로 나누도록 코드를 수정하기 전과 동일하게 보이도록 바꿔 보십시오.

<div class="webgl_center"><img src="resources/orthographic-vs-perspective.png" /></div>
<div class="webgl_center">orthographic vs perspective</div>

사실 WebGL은 우리가 `gl_Position`에 입력한 x,y,z,w값을 받아서 w로 나누어주는 작업을 자동으로 수행하고 있습니다.

우리가 직접 나누기를 수행하지 않고, `zToDivideBy`값을 `gl_Position.w`에 넣도록 수정하여 위 사실을 손쉽게 증명할 수 있습니다.


```
...
uniform float u_fudgeFactor;
...
void main() {
  // position과 행렬을 곱함
  vec4 position = u_matrix * a_position;

  // 나누어질 z값을 조정
  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

  // x,y,z를 zToDivideBy로 나눔
  gl_Position = vec4(position.xyz,  zToDivideBy);
}
```

결과가 완전히 동일한 것을 볼 수 있습니다.

{{{example url="../webgl-3d-perspective-w.html" }}}

WebGL이 W로 자동으로 나누어 주는 것이 어째서 유용할까요?
왜냐하면 이제부터는 행렬 계산의 마법을 이용해서 z값을 w에 넣어주는 또 다른 행렬을 사용할 것이기 때문입니다.

아래와 같은 행렬은,

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 0,
</pre></div>

z값을 w 위치에 복사할 것입니다. 각 열(column)을 보면 아래와 같고,

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in * 1 +
        y_in * 0 +
        z_in * 0 +
        w_in * 0 ;

y_out = x_in * 0 +
        y_in * 1 +
        z_in * 0 +
        w_in * 0 ;

z_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;

w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;
</pre></div>

이를 간략화 하면,

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in;
y_out = y_in;
z_out = z_in;
w_out = z_in;
</pre></div>

전과 같이 1을 추가적으로 더하도록 할 것인데, `w_in`이 항상 1.0이라는 것을 알고 있기 때문입니다.

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 1,
</pre></div>

위 행렬에 의해 W 계산은 아래와 같이 바뀝니다.

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 1 ;
</pre></div>

`w_in` = 1.0 이기 때문에 결과적으로,

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in + 1;
</pre></div>

마지막으로 다시 fudgeFactor를 추가해 줍니다.

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, fudgeFactor,
0, 0, 0, 1,
</pre></div>

다시 말해서,

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * fudgeFactor +
        w_in * 1 ;
</pre></div>

이를 간략화 하면,

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in * fudgeFactor + 1;
</pre></div>

이제, 다시 행렬만을 사용하도록 프로그램을 수정해 봅시다.

먼저 다시 버텍스 쉐이더를 되돌립니다. 아래와 같이 간단한 형태입니다.


```
uniform mat4 u_matrix;

void main() {
  // position과 행렬을 곱함
  gl_Position = u_matrix * a_position;
  ...
}
```

다음으로, 우리의 Z &rarr; W 행렬을 만들기 위한 함수를 추가합니다.

```
function makeZToWMatrix(fudgeFactor) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, fudgeFactor,
    0, 0, 0, 1,
  ];
}
```

그리고 이를 사용하도록 코드를 수정합니다.

```
    ...

    // 행렬 계산
+    var matrix = makeZToWMatrix(fudgeFactor);
*    matrix = m4.multiply(matrix, m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400));
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    ...
```

또다시 결과는 정확히 동일하다는 것에 주목하십시오.

{{{example url="../webgl-3d-perspective-w-matrix.html" }}}

위의 과정은 모두 여러분들에게 Z로 나누는 것이 원근 효과를 가져다 준다는 것과
WebGL이 우리를 대신해 편리하게 Z값으로 나누어 준다는 것을 알려드리기 위한 것이었습니다.

하지만 여전히 몇 가지 문제가 있습니다. 예를 들어 Z를 -100 정도로 설정하면 아래 애니메이션과 같은 결과를 볼 수 있습니다.

<div class="webgl_center"><img src="resources/z-clipping.gif" style="border: 1px solid black;" /></div>

어떻게 된 걸까요? 왜 F가 사라져버리는 걸까요? X와 Y를 -1에서 1 사이로 자르는(clip) 것처럼, Z값도 자르기 때문입니다.
위에서 보이는 것은 Z < -1인 경우입니다.

이를 해결하기 위한 수식을 자세히 설명할 수도 있지만, 2D 투영에서와 동일한 방법으로 [유도할 수 있습니다.](https://stackoverflow.com/a/28301213/128511)
Z값을 가지고 얼마만큼 더하고, 얼마만큼 조정해서 우리가 원하는 어떤 범위를 -1과 +1 사이에 오도록 재조정 할 수 있습니다.

멋진 점은 이러한 모든 과정을 단 하나의 행렬로 수행할 수 있다는 것입니다.
더 좋은 점은 `fudgeFactor` 대신에 `fieldOfView`를 기반으로 이러한 과정을 적절하게 수행할 수 있는 값을 결정할 수 있다는 것입니다.

아래는 행렬 생성을 위한 함수입니다.


```
var m4 = {
  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  ...
```

이 행렬이 우리가 원하는 모든 변환 과정을 수행해 줍니다. 단위를 조정해서 클립 공간 내에 값이 오도록 하고,
시야각이 각도 단위로 주어졌을 때 필요한 계산을 수행하며, Z-clipping 공간을 지정할 수 있도록 합니다.
이 행렬은 *eye* 또는 *camera*가 원점인 (0, 0, 0)에 있다고 가정합니다. `zNear`와 `fieldOfView`가 주어지면 `zNear`에 있는것이 `Z = -1`에 오도록 하고, `fieldOfView`의 절반 만큼 위쪽이나 아래쪽에 있는 것이 `Y = -1`과 `Y = 1`에 오도록 변환합니다.
X에 대해서는 입력 인자인 `aspect`(종횡비)를 활용하여 계산합니다. 일반적으로 그 값은 디스플레이 영역의 `width / height`를 사용합니다.
마지막으로, zFar에 있는 것이 `Z = 1`에 오도록 합니다.

아래는 행렬의 효과를 보여주는 그림입니다.

{{{diagram url="../frustum-diagram.html" width="400" height="600" }}}

그 모양은 4개의 면을 가진 뿔처럼 보이며 육면체가 회전하고 있는 그 내부 공간을 "절두체(Frustum)"라 부릅니다.
행렬은 절두체 내부 공간을 클립 공간으로 변환합니다. `zNear`은 앞쪽 절단 공간을, `zFar`은 뒤쪽 절단 공간을 정의합니다. 
`zNear`를 23으로 설정하면 회전하고 있는 육면체의 앞쪽이 잘리는 것을 볼 수 있습니다.
`zFar`을 24로 설정하면 육면체의 뒤쪽이 잘리는 것을 볼 수 있습니다.

이제 하나의 문제만 남았습니다. 이 행렬은 관찰자가 0,0,0 위치에 있고, 그 관찰자가 음의 Z 방향을 바라보고 있으며 양의 Y방향이 위쪽이라고 가정합니다.
지금까지 사용한 행렬은 이런 방식이 아니었습니다.

물체를 보기 위해서는 물체를 절두체 안으로 옮겨야 합니다. F를 옮겨봅시다.
지금까지는 (45, 150, 0) 위치에 그리고 있었습니다. (-150, 0, -360) 위치로 옮기고 올바른 방향으로 보이도록 회전을 시키겠습니다.

<div class="webgl_center"><img src="resources/f-right-side.svg" style="width: 500px;" caption="not to scale"></div>

이제, 이전의 코드를 m4.projection에서 m4.perspective로 바꾸어 호출합니다.


```
   var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
   var zNear = 1;
   var zFar = 2000;
   var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
   matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
   matrix = m4.xRotate(matrix, rotation[0]);
   matrix = m4.yRotate(matrix, rotation[1]);
   matrix = m4.zRotate(matrix, rotation[2]);
   matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
```

결과는 아래와 같습니다.

{{{example url="../webgl-3d-perspective-matrix.html" }}}

다시 행렬의 곱만을 사용한 형태로 돌아왔으며, 시야각과 Z 공간을 정의할 수 있게 되었습니다.
아직 끝난 것은 아니지만 글이 너무 길어지고 있습니다. 다음으로 [카메라](webgl-3d-camera.html)를 보도록 합시다.

<div class="webgl_bottombar">
<h3>왜 우리는 F를 Z(-360)으로 옮겼을까?</h3>
<p>

다른 예제에서는 F를 (45, 150, 0)에 위치했지만 마지막 예제에서 (-150, 0, -360)로 옮겼습니다.
왜 그렇게 옮겨야 할 필요가 있었을까요?

</p>
<p>

마지막 예제 전까지는 우리의 <code>m4.projection</code> 함수가 픽셀을 클립 공간으로 투영하였습니다.
우리가 표시하는 영역은 400x300 픽셀이었습니다. 3D에서 '픽셀'위치를 사용하는 것은 사실 말이 되지 않습니다.

</p>
<p>

다시 말해, F를 0,0,0에 위치시키고 회전하지 않는다면 아래와 같이 보였을겁니다.

</p>

<div class="webgl_center"><img src="resources/f-big-and-wrong-side.svg" style="width: 500px;"></div>

<p>
F의 왼쪽 위 앞 끝부분이 원점에 위치합니다. 투영은 -Z방향을 보는 것을 가정하지만 F는 +Z방향으로 정의되어 있습니다.
투영은 +Y를 위쪽으로 가정하지만 우리의 F는 +Z를 아래쪽으로 하여 생성되었습니다.
</p>

<p>
우리의 새로운 투영은 파란색 절두체 내의 공간만을 볼 수 있습니다.
-zNear = 1과 60도의 시야각이면 Z = -1에서의 시야각은 높이가 1.154에 불과하며 너비는 1.154 * 종횡비(aspect)에 불과합니다.
Z = -2000 (-zFar)에서는 높이가 2309입니다.
우리의 F는 크기가 150인데 물체가 <code>-zNear</code>에 있을때는 1.154 크기만을 볼 수 있으므로 전체 모습을 보기 위해서는 원점에서 꽤나 멀리 떨어트려 놓아야만 합니다.
</p>

<p>
Z 방향으로 -360만큼 떨어트리면 절두체 내에 들어옵니다. 또한 오른쪽이 위로 오도록 회전하였습니다.
</p>

<div class="webgl_center"><img src="resources/f-right-side.svg" style="width: 500px;"><div>not to scale</div></div>

</div>


