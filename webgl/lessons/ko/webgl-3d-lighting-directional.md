Title: WebGL2 3D - 방향성 조명 효과(Directional Lighting)
Description: WebGL에서 방향성 조명 효과를 구현하는 방법
TOC: 방향성 조명 효과(Directional Lighting)

이 글은 [WebGL 3D 카메라](webgl-3d-camera.html)에서 이어지는 글입니다.
이전 글을 아직 읽지 않았다면 [먼저 읽어 보시길 권장합니다.](webgl-3d-camera.html)

조명 효과를 구현하는 방법은 매우 많습니다. 아마 가장 간단한 것은 *방향성 조명 효과(directional lighting)*일겁니다.

방향성 조명 효과에서는 빛이 한 방향으로부터 일정하게 들어온다고 가정합니다.
맑은 날의 태양광은 대개 방향성 조명으로 간주됩니다.
태양은 매우 멀리 있기 때문에 그 광선들이 물체의 표면에 모두 평행하게 도달한다고 생각할 수 있습니다.

방향성 조명 효과를 계산하는 방법은 사실 꽤 간단합니다.
빛이 진행하는 방향과 물체의 표면이 바라보는 방향을 안다면 두 방향 벡터의 *내적*을 취하면 두 방향간의 코사인 각도를 계산할 수 있습니다.

아래는 그 예시입니다.

{{{diagram url="resources/dot-product.html" caption="drag the points"}}}

점들을 드래그해서 두 점을 정반대 방향으로 가져다 놓으면 내적값이 -1이 되는 것을 보실 수 있을겁니다.
두 점이 동일한 위치에 있으면 내적값은 1이 됩니다.

그게 어쨋다는걸까요? 만일 우리가 3D 물체의 표면이 향하고 있는 방향을 알고 빛의 방향을 안다면 내적을 취해서
숫자 1이 나오게 되면 빛이 물체의 표면을 정면에서 비추고 있다는 것을 알 수 있고, -1이면 반대방향에서 비추고 있다는 것을 알 수 있습니다.

{{{diagram url="resources/directional-lighting.html" caption="rotate the direction" width="500" height="400"}}}

그리고 색상을 저 내적값에 곱하게 되면 짜잔! 조명 효과가 나타납니다.

문제는, 3D 물체의 표면이 어디를 바라보고 있는지를 어떻게 알 수 있는가입니다.

## 법선(Normal)에 대한 소개

왜 *법선(normal)*이라고 불리는지는 모르겠지만, 적어도 3D 그래픽스 분야에서 법선이란 표면이 바라보는 방향을 나타내는 단위 벡터(unit vector)입니다.

아래는 정육면체와 구의 법선입니다.

{{{diagram url="resources/normals.html"}}}

물체에서 튀어나와있는 선들이 각 정점의 법선을 표현하고 있습니다.

정육면체는 각 모서리에 3개의 법선들이 있다는 것에 주목하십시오.
이는 정육면체의 각 면이 바라보는 방향을 표현하기 위해서는 서로다른 3개의 법선이 필요하기 때문입니다.

위의 그림에서 법선은 방향에 따라 양의 x방향이면 <span style="color: red;">빨간색</span>으로,
위를 바라보고 있으면 <span style="color: green;">초록색</span> 으로, 양의 z방향이면 
<span style="color: blue;">파란색</span>으로 색상이 표현되어 있습니다. 

그럼, [이전 예제](webgl-3d-camera.html)에서 사용했던 우리의 `F`에 법선을 추가해서 조명 효과를 줄 수 있도록 해봅시다.
`F`가 각이 져있고, 각 면이 x,y,z 방향과 정렬되어 있으므로 어렵지 않습니다.
앞을 바라보고 있는 경우에는 법선이 `0, 0, 1`입니다. 반대 방향을 바라보고 있으면 `0, 0, -1`입니다.
왼쪽을 바라보고 있으면 법선이 `-1, 0, 0`이고, 오른쪽을 바라보면 `1, 0, 0`입니다.
위쪽은 `0, 1, 0`, 아래쪽은 `0, -1, 0`입니다.

```
function setNormals(gl) {
  var normals = new Float32Array([
          // 왼쪽 기둥의 앞면
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 위쪽 가로줄의 앞면
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 중간 가로줄의 앞면
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 왼쪽 기둥의 뒷면
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 위쪽 가로줄의 뒷면
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 중간 가로줄의 뒷면
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 윗면
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 위쪽 가로줄의 오른쪽면
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 위쪽 가로줄의 아랫면
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 위쪽과 중간 가로줄의 사이면
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 중간 가로줄의 윗면
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 중간 가로줄의 오른쪽면
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 중간 가로줄의 아랫면.
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 아래쪽의 오른쪽면
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 아래쪽면
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 왼쪽면
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```

그리고 설정을 해줍시다. 하는김에 정점 색생을 없애서 조명 효과를 좀 더 잘 보이도록 해줍시다.

    // 정점 데이터들이 전달되어야 할 위치 찾기
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// Create a buffer for colors.
    -var buffer = gl.createBuffer();
    -gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    -gl.enableVertexAttribArray(colorLocation);
    -
    -// We'll supply RGB as bytes.
    -gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    -
    -// Set Colors.
    -setColors(gl);

    // 법선을 위한 버퍼 생성
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    // 버퍼 설정
    setNormals(gl);

이제 셰이더에서 이 값들을 사용하도록 해야 합니다.

먼저 정점 셰이더에서는 법선을 프래그먼트 셰이더로 단지 전달만 해 줍니다.

```
#version 300 es

// attribute는 정점 셰이더의 입력 (in) 입니다.
// 버퍼로부터 데이터를 받습니다.
in vec4 a_position;
-in vec4 a_color;
+in vec3 a_normal;

// 위치를 변환할 행렬
uniform mat4 u_matrix;

-// a varying to pass the color to the fragment shader
-out vec4 v_color;

+// 프래그먼트 셰이더로 전달할 법선 varying
+out vec3 v_normal;

// 셰이더는 항상 main함수를 가집니다.
void main() {
  // position에 행렬을 곱해줍니다.
  gl_Position = u_matrix * a_position;

-  // Pass the color to the fragment shader.
-  v_color = a_color;

+  // 법선을 프래그먼트 셰이더로 넘겨줍니다.
+  v_normal = a_normal;
}
```

프래그먼트 셰이더에서는 빛의 방향과 법선을 내적하는 수학 계산을 할 겁니다.

```
#version 300 es

precision highp float;

-// the varied color passed from the vertex shader
-in vec4 v_color;

+// 정점 셰이더에서 전달된 varying.
+in vec3 v_normal;
+
+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

// 프래그먼트 셰이더의 출력을 선언해 주어야 합니다.
out vec4 outColor;

void main() {
-  outColor = v_color;
+  // v_normal은 varying이기 때문에 보간되고,
+  // 그로인해 단위 벡터가 아닐 수 있습니다.
+  // 정규화를 통해 다시 단위 벡터로 만들어 줍니다.
+  vec3 normal = normalize(v_normal);
+
+  // normal과 뒤집어진 빛의 방향을 내적해서 light값을 계산합니다.
+  float light = dot(normal, u_reverseLightDirection);
+
+  outColor = u_color;
+
+  // 알파를 제회한 색상값 부분을 light값과 곱해줍니다.
+  outColor.rgb *= light;
}
```

이제 `u_color`와 `u_reverseLightDirection`의 위치를 찾아야 합니다.

```
  // uniform 찾기
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```

그리고 값들을 설정해 주어야 합니다.

```
  // 행렬값 설정
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

+  // 사용할 색상값 설정
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // 초록색
+
+  // 조명 방향 설정
+  gl.uniform3fv(reverseLightDirectionLocation, normalize([0.5, 0.7, 1]));
```

`normalize`는 전에도 봤듯이 입력한 값을 단위 벡터로 변환합니다.
여기서 예제로 사용한 값은 `x = 0.5`인데 `x`가 양의 값이라는 것은 빛이 오른쪽에서 왼쪽을 향한다는 뜻입니다.
`y = 0.7`인데 `y`가 양의 값이라는 것은 빛이 위쪽에서 아래쪽을 향한다는 뜻입니다.
`z = 1`인데 `z`가 양의 값이라는 것은 빛이 정면에서 장면(scene)쪽을 향한다는 뜻입니다.
상대적인 값을 비교해 보면 빛이 장면쪽을 향하는 경향이 크고, 오른쪽보다는 아래쪽을 더 향한다는 것을 알 수 있습니다.

아래는 그 결과입니다.

{{{example url="../webgl-3d-lighting-directional.html" }}}

F를 돌려 보시면 무언가 알아차리실 수 있을겁니다. F는 돌아가는데 조명 효과는 변하지 않습니다.
F가 돌아가면 빛을 향하는 방향이 밝아지는 것이 우리가 원하는 효과입니다.

이를 수정하기 위해서는 물체의 방향이 변하면 법선의 방향도 변하도록 해야 합니다.
위치값에 대해 그렇게 했던 것처럼 법선에도 어떤 행렬을 곱해줄 수 있습니다.
`월드` 행렬을 곱해주는 것이 가장 당연해 보입니다. 
우리는 현재 `u_matrix`라 이름지은 곳에 하나의 행렬만 전달하고 있습니다.
이제 2개의 행렬을 전달하도록 수정해 봅시다.
하나는 `u_world`라고 이름지은 월드 행렬이고 다른 하나는 `u_worldViewProjection`로, 
지금 우리가 `u_matrix`에 전달하고 있는 행렬입니다.


```
#version 300 es

// attribute는 정점 셰이더의 입력 (in) 입니다.
// 버퍼로부터 데이터를 받습니다.
in vec4 a_position;
in vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  // 위치값을 행렬과 곱해줍니다.
*  gl_Position = u_worldViewProjection * a_position;

*  // 법선의 방향을 바꾸어 프래그먼트 셰이더로 전달합니다.
*  v_normal = mat3(u_world) * a_normal;
}
```

`a_normal`에 `mat3(u_world)`를 곱하는 것에 주의하십시오.
법선은 방향 벡터이기 때문에 이동(translation)은 필요 없습니다.
자세와 관련된 부분은 행렬의 위쪽 3x3 부분 뿐입니다.

이제 해당 uniform들을 찾아야 합니다.

```
  // uniform 찾기
-  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
*  var worldViewProjectionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

그리고 해당 값들을 바꾸는 부분의 코드를 수정해야 합니다.

```
*var worldMatrix = m4.yRotation(fRotationRadians);
*var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix,
                                             worldMatrix);

*// 행렬값을 전달
*gl.uniformMatrix4fv(
*    worldViewProjectionLocation, false,
*    worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

아래는 그 결과입니다.

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

F를 돌려보면 빛의 방향을 향하는 면이 밝아지는 것을 볼 수 있습니다.

문제가 하나 있는데, 여러분들에게 바로 보여주기는 어려워서 다이어그램을 통해 보여드리겠습니다.
현재 우리는 normal 방향을 바꾸기 위해 `normal`에 `u_world`를 곱하고 있습니다.
만일 월드 행렬에 크기(scale) 변환이 포함되어 있다면 어떻게 될까요?
결과 법선값이 잘못된 값이 도출됩니다.

{{{diagram url="resources/normals-scaled.html" caption="click to toggle normals" width="600" }}}

저는 원리는 이해하려고 노력하지 않았지만, 어쨋든 해결 방법은 월드 행렬의 역행렬을 구한 뒤 
전치(행과 열을 바꾸기)한 행렬을 대신 사용하는 것입니다.
그러면 올바른 결과가 도출됩니다.

위 다이어그램에서 <span style="color: #F0F;">보라색</span> 구는 크기가 변하지 않습니다.
왼쪽의 <span style="color: #F00;">빨간색</span> 구는 크기가 변하고, 법선에 월드 행렬이 곱해진 것입니다.
보시면 무언가 잘못된 결과를 보실 수 있습니다.
오른쪽의 <span style="color: #00F;">파란색</span> 구는 월드 행렬의 역행렬을 전치한 것을 사용하고 있습니다.

다이어그램을 클릭해서 다른 표현 모드의 결과를 살펴 보세요.
크기가 많이 변했을때 왼쪽(world)의 법선이 구의 표면과 직교하지 **않는**다는 것을 아실 수 있을겁니다.
반면 오른쪽(worldInverseTranspose)의 경우 구에 직교하는 값을 유지하고 있습니다.
마지막 표현 모드에서는 전체를 빨간색으로 그리고 있습니다.
두개의 양쪽 구의 조명 효과 결과가 어떤 행렬을 사용하냐에 따라 매우 다른 것을 보실 수 있습니다.
어떤 결과가 더 좋고 왜 더 좋냐 이야기하는 것은 까다롭지만, 다른 모드의 표현 결과를 보면 worldInverseTranspose를 사용하는 것이 맞다는 사실이 명확해 보입니다.

우리 예제 코드에서 이를 구현하기 위해 코드를 이렇게 수정해 봅시다.
먼저 셰이더를 수정하겠습니다. 그냥 `u_world`의 값만 바꿔도 되지만,
이름을 다시 지어서 지금 무엇을 하고 있는 것인지를 헷갈리지 않게 하는 것이 좋습니다.

```
#version 300 es

// attribute는 정점 셰이더의 입력 (in) 입니다.
// 버퍼로부터 데이터를 받습니다.
in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_worldViewProjection;
-uniform mat4 u_world
+uniform mat4 u_worldInverseTranspose;

// 프래그먼크에 전달한 법선과 색상 varying
out vec4 v_color;
out vec3 v_normal;

// 모든 셰이더는 main 함수를 가집니다.
void main() {
  // 위치에 행렬을 곱합니다.
  gl_Position = u_worldViewProjection * a_position;

  // 법선의 방향을 바꾸어 프래그먼트 셰이더로 전달합니다.
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```

그리고 위치를 찾아야 합니다.

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

또, 값을 계산하고 전달해야 합니다.

```
var worldMatrix = m4.yRotation(fRotationRadians);
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
+var worldInverseMatrix = m4.inverse(worldMatrix);
+var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// 행렬값을 설정
gl.uniformMatrix4fv(
    worldViewProjectionLocation, false,
    worldViewProjectionMatrix);
-gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+    worldInverseTransposeLocation, false,
+    worldInverseTransposeMatrix);
```

아래는 행렬의 전치를 위한 코드입니다.

```
var m4 = {
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },
  ...
```

우리는 크기를 변환하고 있지 않으므로 효과가 미미하여 변화를 알아차리기는 어렵지만,
어쨋든 이제 준비가 되었습니다.

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

조명 효과에 관한 첫 단계가 명확히 이해되셨긴 바랍니다. 다음은 [점 조명 효과(point lighting)](webgl-3d-lighting-point.html) 입니다.

<div class="webgl_bottombar">
<h3>mat3(u_worldInverseTranspose) * a_normal의 대안</h3>
<p>위 셰이더 코드에 보면 아래와 같은 라인이 있습니다.</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>아래와 같이 할 수도 있습니다.</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p>우리가 행렬곱을 하기 전에 <code>w</code>를 0으로 설정하였으므로 행렬의 이동 관련 텀과 0을 곱하여 제거한 것과 마찬가지입니다.
제 생각에는 이러한 방법이 더 일반적으로 사용되는 것 같습니다.
mat3를 사용한 방법이 더 명확해 보이기 때문에 저는 이렇게도 자주 합니다.</p>
<p>또 다른 방법은 <code>u_worldInverseTranspose</code>를 <code>mat3</code>로 만드는 것입니다.
하지만 이렇게 하지 않는데는 두 가지 이유가 있습니다. 첫째로는 <code>u_worldInverseTranspose</code> 전체 행렬을 다른 용도로도 사용할 수 있기 때문에
<code>u_worldInverseTranspose</code>를 <code>mat4</code>로 넘기게 되면 그러한 다른 용도로도 활용할 수 있습니다.
또다른 이유로는 우리의 자바스크립트 행렬 함수들이 모두 4x4 행렬을 만든다는 것입니다.
3x3행렬을 위한 기능들을 새로 만들거나 4x4행렬을 3x3행렬로 변환하는 기능을 구현하는 것은 특별한 이유가 있지 않다면 할 필요가 없습니다.</p>
</div>
