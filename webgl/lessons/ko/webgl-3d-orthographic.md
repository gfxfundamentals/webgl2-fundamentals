Title: WebGL2 - 3D 직교 투영
Description: 직교 투영을 하는 WebGL에서 3D를 그리는 방법.
TOC: 3D 직교 투영


이 글은 WebGL 시리즈에서 이어지는 글입니다.
첫번째는 [기초로 시작하기](webgl-fundamentals.html)이며 이 전 글은 [2D 행렬에 대하여](webgl-2d-matrices.html)입니다. 
만약 아직 이 글들을 읽지 않았다면 먼저 읽는 것을 권장합니다.

지난번 글에서 2D 행렬이 어떻게 작동하는지 살펴 보았습니다. 
우리는 한개의 행렬과 마법같은 행렬 수학으로 이동, 회전, 크기 그리고 픽셀에서 클립공간으로 투영하는 방법에 대하여 알아보았습니다. 
3D를 하기 위해서는 여기서 조금만 더 나아가면 됩니다.

이전 2D 예제에서 우리는 3x3 매트릭스로 곱한 2D 포인트 (x, y)를 다루었습니다.
3D에서는 점 (x, y, z)과 4x4 행렬이 필요합니다.

마지막 예제를 3D로 변경해 봅시다. F를 다시 사용하지만 이번에는 3D 'F'를 사용합니다.

첫 번쨰 할일은 버텍스 쉐이더가 3D를 처리하도록 변경하는 것입니다.
여기에 예전 버텍스 쉐이더가 있습니다.

```js
#version 300 es

// 버텍스 쉐이더로 입력되는 attribute입니다.
// 버퍼로부터 데이터를 받습니다.
in vec2 a_position;

// 위치를 변환하는 행렬
uniform mat3 u_matrix;

// 모든 쉐이더는 main함수를 가지고 있습니다.
void main() {
  // 행렬에 위치를 곱합니다.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
```

여기에 새로운 쉐이더가 있습니다.

```glsl
// 버텍스 쉐이더로 입력되는 attribute입니다.
// 버퍼로부터 데이터를 받습니다.
in vec2 a_position;

// 위치를 변환하는 행렬
uniform mat3 u_matrix;

// 모든 쉐이더는 main함수를 가지고 있습니다.
void main() {
  // 행렬에 위치를 곱합니다.
*  gl_Position = u_matrix * a_position;
}
```

더 간단 해졌습니다! `x`와`y`를 제공하고`z`를 1로 설정했던 2 차원과 마찬가지로, 
3d에서는 `x`,`y`와`z`를 제공하고`w`가 1이 되어야합니다. 
`w` 속성의 기본값은 1이라는 사실을 이용할 수 있습니다.

그 다음 3D 데이터를 제공해야합니다.

```js
  ...

  // attribute에게 positionBuffer (ARRAY_BUFFER)로부터 데이터를 가져오는 법을 알려줍니다. 
*  var size = 3;          // iteration마다 3 개의 component
  var type = gl.FLOAT;   // 데이터는 32bit floats
  var normalize = false; // 데이터를 정규화하지 않음
  var stride = 0;        // 각 iteration마다 다음 위치값을 얻기 위해 size * sizeof(type) 만큼 앞으로 이동
  var offset = 0;        // 버퍼의 맨 앞부분부터 시작
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  ...

  // 문자 'F'를 정의하는 값들로 현재 ARRAY_BUFFER 버퍼를 채움
  function setGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // 왼쪽 기둥
              0,   0,  0,
             30,   0,  0,
              0, 150,  0,
              0, 150,  0,
             30,   0,  0,
             30, 150,  0,

            // 위쪽 가로선
             30,   0,  0,
            100,   0,  0,
             30,  30,  0,
             30,  30,  0,
            100,   0,  0,
            100,  30,  0,

            // 가운데 가로선
             30,  60,  0,
             67,  60,  0,
             30,  90,  0,
             30,  90,  0,
             67,  60,  0,
             67,  90,  0]),
        gl.STATIC_DRAW);
  }
```

다음으로, 모든 행렬 관련 함수들을 2D에서 3D로 변경해야 합니다.

아래는 (이전에 사용했던) 2D 버전의 m3.translation, m3.rotation, and m3.scaling 입니다.

```js
var m3 = {
  translation: function translation(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ];
  },

  rotation: function rotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1
    ];
  },

  scaling: function scaling(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1
    ];
  },
};
```

아래는 변경된 3D 버전입니다.

```
var m4 = {
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
};
```

이제 3개의 rotation 함수가 있다는 점에 주목하세요. 2D에서는 Z축을 기준으로만 회전하기 때문에 함수가 하나만 필요했습니다.
3D에서는 Z축뿐만 아니라 X축, Y축에 대해서도 회전을 할 수 있어야 합니다. 보시면 세 개의 함수가 모두 비슷해 보이는 것을 알 수 있습니다.
조금 살펴보면 이전과 비슷하게 간단하다는 것을 알 수 있습니다.

Z rotation

<div class="webgl_center">
<div>newX = x *  c + y * s;</div>
<div>newY = x * -s + y * c;</div>
</div>

Y rotation

<div class="webgl_center">
<div>newX = x *  c + z * s;</div>
<div>newZ = x * -s + z * c;</div>
</div>

X rotation

<div class="webgl_center">
<div>newY = y *  c + z * s;</div>
<div>newZ = y * -s + z * c;</div>
</div>

위와 같은 수식이 회전을 수행합니다.

<iframe class="external_diagram" src="resources/axis-diagram.html" style="width: 540px; height: 240px;"></iframe>

비슷하게, 단순한 버전의 회전 함수들을 만들 수 있습니다.

```js
  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },
```

그리고 4x4 행렬 곱 함수가 필요합니다.

```js
  multiply: multiply(a, b) {
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];

    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },
```

투영 함수도 변경해야 합니다. 아래는 예전 버전이고,

```js
  projection: function (width, height) {
    // 주의: 이 행렬은 Y축을 뒤집어 0이 위쪽이 되도록 합니다.
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },
}
```

픽셀을 클립 공간으로 변환하는 역할을 합니다. 
이걸 3D로 변경하기 위해 먼저 아래와 같이 해 봅시다.

```js
  projection: function(width, height, depth) {
    // 주의: 이 행렬은 Y축을 뒤집어 0이 위쪽이 되도록 합니다.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },
```

픽셀을 클립 공간으로 변환하기 위해 X와 Y값을 바꿔야 했던 것처럼, Z에 대해서도 동일한 작업을 해야 합니다.
`width`와 유사하게 `depth`값을 입력했는데, 공간이 0에서 `width`만큼의 너비, 0에서 `height`만큼의 높이를 갖고
`depth` 쪽으로는 `-depth / 2`에서 `+depth / 2`만큼의 깊이를 갖게 됩니다. 

마지막으로, 행렬을 계산하는 코드를 수정해야 합니다.

```js
  // Compute the matrix
*  var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
*  matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
*  matrix = m4.xRotate(matrix, rotation[0]);
*  matrix = m4.yRotate(matrix, rotation[1]);
*  matrix = m4.zRotate(matrix, rotation[2]);
*  matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

  // Set the matrix.
*  gl.uniformMatrix4fv(matrixLocation, false, matrix);
```

아래는 그 예시 입니다.

{{{example url="../webgl-3d-step1.html" }}}

첫 번째 문제는 geometry가 납작한 F라서 3D로 보기 어렵다는 것입니다.
이를 수정하기 위해 geometry를 3D로 확장해 봅시다.
현재의 F는 각각 2개의 삼각형으로 이루어진 3개의 직사각형입니다.
이를 3D로 만들기 위해서는 총 16개의 직사각형이 필요합니다. 
앞쪽에 3개, 뒤쪽에 3개, 왼쪽에 하나, 오른쪽에 4개, 위쪽에 2개, 아래쪽에 3개의 직사각형이 필요합니다.

<img class="webgl_center noinvertdark" width="300" src="resources/3df.svg" />

여기에 다 나열하기에는 좀 많네요.
2개의 삼각형으로 이루어진 직사각형이 16개이고 삼각형마다 3개의 정점들이 있으므로 총 96개의 정점이 있습니다.
전체 정점이 궁금하다면 샘플의 소스 코드를 살펴 보십시오.

더 많은 정점을 그려야 하므로

```js
    // 형상을 그림
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
```

아래는 수정된 버전입니다.

{{{example url="../webgl-3d-step2.html" }}}

슬라이더를 움직여도 3D로 보기에는 조금 어렵습니다.
각 직사각형을 다른 색상으로 칠해 보도록 합시다.
그러기 위해서는 정점 쉐이더에 또 다른 attribute를 추가해야 합니다.
그리고 varying 추가해서 정점 쉐이더로부터 프래그먼트 쉐이더로 값을 전달할 수 있도록 합니다.

아래는 새로운 정점 쉐이더입니다.

```glsl
#version 300 es

// attribute는 정점 쉐이더의 입력 입니다.
// 버퍼로부터 데이터를 받습니다.
in vec4 a_position;
+in vec4 a_color;

// position 변환 행렬
uniform mat4 u_matrix;

+// 프래그먼트 쉐이더로 전달할 색상 varying
+out vec4 v_color;

// 모든 쉐이더는 main 함수를 가집니다.
void main() {
  // position과 행렬을 곱합니다.
  gl_Position = u_matrix * a_position;

+  // 프래그먼트 쉐이더로 색상을 전달합니다.
+  v_color = a_color;
}
```

그리고 프래그먼트 쉐이더에서는 전달된 색상을 사용해야 합니다.

```glsl
#version 300 es

precision highp float;

+// 정점 쉐이더에서 전달된 색상 varying
+in vec4 v_color;

// 프래그먼트 쉐이더의 출력을 선언해야 합니다.
out vec4 outColor;

void main() {
*  outColor = v_color;
}
```

색상을 전달하기 위해서는 attribute location을 먼저 찾고,
버퍼와 attribute를 설정해서 색상값을 전달해야 합니다.

```js
  ...
  var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  ...

  // 색상 buffer를 생성하고, 현재 ARRAY_BUFFER로 설정한 뒤,
  // 색상값들을 복사해 넣습니다.
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);

  // attribute를 활성화합니다.
  gl.enableVertexAttribArray(colorAttributeLocation);

  // attribute에게 colorBuffer (ARRAY_BUFFER)로부터 데이터를 가져오는 법을 알려줍니다. 
  var size = 3;          // iteration마다 3개의 component
  var type = gl.UNSIGNED_BYTE;   // 데이터는 8bit unsigned bytes
  var normalize = true;  // 0-255 범위에서 0.0-1.0 범위로 변환
  var stride = 0;        // 0 = 각 iteration마다 다음 색상값을 얻기 위해 size * sizeof(type) 만큼 앞으로 이동
  var offset = 0;        // 버퍼의 맨 앞부분부터 시작
  gl.vertexAttribPointer(
      colorAttributeLocation, size, type, normalize, stride, offset);

  ...

// 'F'에 입힐 색상으로 버퍼를 채웁니다.

function setColors(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
          // 왼쪽 기둥 앞면
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // 위쪽 가로선 앞면
        200,  70, 120,
        200,  70, 120,
        ...
        ...
      gl.STATIC_DRAW);
}
```

이제 결과는 아래와 같습니다.

{{{example url="../webgl-3d-step3.html" }}}

어, 뭔가 이상하죠? 3차원 'F'의 앞면, 뒷면, 옆면 등등이 우리가 geometry 데이터를 선언한 순서로 그려지고 있습니다.
뒷면이 앞면이 그려지고 나서 그려지기 때문에 우리가 기대한 결과와는 다르게 보입니다. 

<img class="webgl_center" style="background-color: transparent;" width="163" height="190" src="resources/polygon-drawing-order.gif" />

<span style="background: rgb(200, 70, 120); color: white; padding: 0.25em">빨간색 부분</span>은 'F'의 **앞면** 이지만,
우리가 데이터 선언을 앞부분에 했기 때문에 먼저 그려지고, 나머지 면(옆면 및 뒷면)이 나중에 그려지기 때문에 앞면이 덮여져 버립니다.
예를 들어 <span style="background: rgb(80, 70, 200); color: white; padding: 0.25em">보라색 부분</span>은 사실 'F'의 뒷면입니다.
이 부분이 두 번째로 그려지게 되는데 그 이유는 우리가 이 데이터를 두 번째로 선언했기 때문입니다.

WebGL에서 삼각형은 정면(front facing)과 뒷면(back facing)이 있습니다.
기본 설정에서 삼각형의 정면은 정점들이 반시계 방향으로 선언된 방향입니다.
삼각형의 뒷면은 정점들이 시계 방향으로 선언된 방향입니다.

<img src="resources/triangle-winding.svg" class="webgl_center" width="400" />

WebGL에서는 정면 삼각형들만, 또는 뒷면 삼각형들만 그리도록 할 수 있습니다.
이 기능은 아래 코드를 통해 설정됩니다. 

```js
  gl.enable(gl.CULL_FACE);
```

위 코드를 `drawScene`안에 집어넣어 보세요. 
이 기능이 설정되면, WebGL은 기본적으로 뒷면 삼각형들을 "culling"합니다.
"Culling"은 "그리지 않는다"를 멋있게 표현한 단어 입니다.

WebGL은 클립 공간에서 삼각형의 정점들이 시계방향 또는 반시계 방향으로 정의되었는지만 신경씁니다.
다시말해, WebGL은 삼각형이 정면인지 뒷면인지를 정점 쉐이더에서 정점을 변환한 **후에** 판별한다는 것입니다.
그 말은, 시계방향으로 정의된 삼각형의 X방향 스케일이 -1이 되면 반시계 방향이 된다는 뜻이고,
시계방향으로 정의된 삼각형이 180도 회전하면 반시계방향이 된다는 뜻입니다. 
우리가 위 기능을 켰기 때문에, 정면 삼각형이 어떤 이유에서건 스케일링이나 회전을 통해 뒤집히게 된다면, WebGL은 그 삼각형을 그리지 않을겁니다.
일반적으로 3차원 상에서 어떤 삼각형이 당신쪽을 바라보고 있는 경우에만 정면으로 간주하는 것이 좋기 때문에 이러한 기능은 유용합니다. 

CULL_FACE 기능을 켜면 결과는 이렇게 됩니다.

{{{example url="../webgl-3d-step4.html" }}}

아니! 삼각형들이 다 어디갔죠? 
알고보니, 대부분의 삼각형들이 잘못된 방향을 바라보고 있었습니다.
돌려보면 삼각형들의 뒷면을 바라보고 있었다는 것을 아실겁니다.
다행히 이를 수정하는 것은 쉽습니다. 뒷면인 삼각형들의 2개 정점을 바꿔주기만 하면 됩니다.
예를 들어 아래와 같은 뒷면 삼각형을

```
           1,   2,   3,
          40,  50,  60,
         700, 800, 900,
```

아래와 같이 뒤쪽 2개의 정점 선언 순서를 변경하여 정면으로 바꿀 수 있습니다.

```
           1,   2,   3,
*         700, 800, 900,
*          40,  50,  60,
```

뒷면인 삼각형들을 모두 수정하면 아래와 같은 결과가 나옵니다.

{{{example url="../webgl-3d-step5.html" }}}

거의 해결되었지만 문제가 하나 남았습니다.
뒷면인 삼각형들을 모두 cull하고 올바른 방향을 바라보는 삼각형들만 그렸다고 해도,
뒤쪽에 있어야 하는 삼각형이 앞에 있어야 하는 삼각형보다 위쪽에 그려지는 경우가 있습니다.

**depth 버퍼** 이야기를 해 보죠.

depth 버퍼는 Z-버퍼라고도 불리는데, *depth(깊이)* 픽셀로 이루어진 직사각형으로,
이미지를 구성하는 하나의 각 색상 픽셀마다 하나의 깊이 픽셀을 갖습니다.
WebGL에서는 색상 픽셀을 그릴 때 깊이 픽셀도 같이 그립니다.
깊이 픽셀은 우리가 정점 쉐이더에서 반환하는 Z값을 기반으로 계산됩니다.
X와 Y값에 대해 클립 공간으로 변환해야 하는 것처럼, Z값도 클립 공간(또는 -1에서 +1 사이)으로 변환해야 합니다.
색상 픽셀값을 그리기 전에 WenGL은 대응하는 깊이 픽셀값을 확인합니다.
그리려는 색상의 깊이가 이미 그러져있는 깊이값보다 크다면, WebGL은 새로운 색상을 그리지 않습니다.
그렇지 않다면(작다면) 프래그먼트 쉐이더에서 반환한 색상값을 그리고 **또한** 해당하는 깊이 픽셀을 새로운 깊이값으로 대체합니다.
그 말은, 어떤 픽셀의 뒤쪽에 있는 픽셀은 그려지지 않는다는 의미입니다.      

culling을 켰던것과 유사하게 이 기능을 켤 수 있습니다.


```js
  gl.enable(gl.DEPTH_TEST);
```

또한 그리기를 시작하기 전에 깊이 버퍼를 1.0으로 초기화해야 합니다.

```js
  // scene 그리기
  function drawScene() {

    ...

    // canvas와 깊이 버퍼를 clear
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    ...
```

그러면 아래와 같이 됩니다.

{{{example url="../webgl-3d-step6.html" }}}

3D죠!

사소한 것 하나가 남았습니다. 대부분의 3d 수학 라이브러리에는 클립 공간에서 픽셀 공간으로 변환하는 `projection` 함수가 없습니다. 
대신 보통 `ortho` 또는 `orthographic`이라고 정의된 함수가 있는데, 아래와 같이 생겼습니다.

    var m4 = {
      orthographic: function(left, right, bottom, top, near, far) {
        return [
          2 / (right - left), 0, 0, 0,
          0, 2 / (top - bottom), 0, 0,
          0, 0, 2 / (near - far), 0,

          (left + right) / (left - right),
          (bottom + top) / (bottom - top),
          (near + far) / (near - far),
          1,
        ];
      }

우리가 정의한 간단한 `projection`함수는 width, height, depth만을 매개변수로 받지만,
위 함수는 좀더 일반적인 직교 투영 함수로써 left, right, bottom, top, near, far를 매개변수로 받아 좀더 유연합니다.
위 함수를 사용하여 원래 우리의 투영 함수와 동일한 결과를 얻기 위해서 아래와 같이 호출합니다.

    var left = 0;
    var right = gl.canvas.clientWidth;
    var bottom = gl.canvas.clientHeight;
    var top = 0;
    var near = 400;
    var far = -400;
    m4.orthographic(left, right, bottom, top, near, far);

다음 글에서는 [원근감을 갖도록 하는 방법](webgl-3d-perspective.html)에 대해 이야기하겠습니다.

<div class="webgl_bottombar">
<h3>attribute는 vec4인데 왜 gl.vertexAttribPointer의 size는 3인가요?</h3>
<p>
디테일에 신경쓰는 분들은 우리가 2개의 attribute를 아래와 같이 정의한 것을 알아차리셨을 겁니다.
</p>
<pre class="prettyprint showlinemods">
in vec4 a_position;
in vec4 a_color;
</pre>
<p>둘 다 'vec4'지만, 우리가 버퍼에서 데이터를 가져오는 방법을 WebGL에 알려줄 때에는 아래와 같이 정의하였습니다.</p>
<pre class="prettyprint showlinemods">
// attribute에게 positionBuffer (ARRAY_BUFFER)로부터 데이터를 가져오는 법을 알려줍니다. 
var size = 3;          // iteration마다 3 개의 component
var type = gl.FLOAT;   // 데이터는 32bit floats
var normalize = false; // 데이터를 정규화하지 않음
var stride = 0;        // 0 = 각 iteration마다 다음 위치값을 얻기 위해 size * sizeof(type) 만큼 앞으로 이동
var offset = 0;        // 버퍼의 맨 앞부분부터 시작
gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);

...
// attribute에게 colorBuffer (ARRAY_BUFFER)로부터 데이터를 가져오는 법을 알려줍니다. 
var size = 3;          // iteration마다 3개의 component
var type = gl.UNSIGNED_BYTE;   // 데이터는 8bit unsigned bytes
var normalize = true;  // 0-255 범위에서 0.0-1.0 범위로 변환
var stride = 0;        // 0 = 각 iteration마다 다음 색상값을 얻기 위해 size * sizeof(type) 만큼 앞으로 이동
var offset = 0;        // 버퍼의 맨 앞부분부터 시작
gl.vertexAttribPointer(
    colorAttributeLocation, size, type, normalize, stride, offset);
</pre>
<p>
위에 써있는 '3'들은 버퍼에서 iteration마다, attribute마다 3개의 값을 가져오라는 뜻입니다. 
이래도 되는 이유는 WebGL의 정점 쉐이더는 입력하지 않는 값에 대해 기본값을 사용하기 때문입니다.
기본값은 0, 0, 0, 1로 x = 0, y = 0, z = 0, w = 1입니다.
그래서 우리의 예전 2D 정점 쉐이더에서는 1을 명시적으로 입력해야 했습니다.
x와 y값은 전달하고, z에 대해 1을 직접 전달해야 했는데 이는 아무것도 전달하지 않는다면 z의 기본값은 1이기 때문입니다.
반면 3D에서는 'w'에 대해 아무것도 전달하지 않아도 기본값이 1이기 때문에 우리가 원하는대로 행렬 계산이 이루어집니다.
</p>
</div>
