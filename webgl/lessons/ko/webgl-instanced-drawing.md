Title: WebGL2 최적화 - 인스턴스 드로잉(Instanced Drawing)
Description: 동일한 물체의 여러 인스턴스를 그리는 방법
TOC: 인스턴스 드로잉(Instanced Drawing)

WebGL에는 *인스턴스 드로잉(instanced drawing)* 기능이 있습니다.
이는 동일한 물체를 여러 개 그릴 때, 각 물체를 개별적으로 그리는 것보다 더 빠르게 그리는 방법입니다.

먼저 동일한 물체의 여러 인스턴스를 그리는 예제를 만들어 봅시다.

[직교 투영에 관한 글](webgl-3d-orthographic.html)의 끝 부분에 작성한 예제와 *비슷한*코드에서 시작할 겁니다.
먼저 아래와 같은 두 개의 셰이더가 있습니다.

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
uniform mat4 matrix;

out vec4 v_color;

void main() {
  // position과 행렬을 곱합니다.
  gl_Position = matrix * a_position;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 color;

out vec4 outColor;

void main() {
  outColor = color;
}
`;
```

정점 셰이더에서는 [이 글](webgl-3d-orthographic.html)에서 언급한 것처럼 각 정점에 하나의 행렬을 곱하는 꽤 유연한 코드립니다.
프래그먼트 셰이더는 우리가 uniform을 통해 입력한 색상값을 그대로 사용합니다.

그리기 위해서 우리는 셰이더를 컴파일하고, 링크를 통해 프로그램을 만들고 attribute와 uniform의 location을 찾습니다.

```js
const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getUniformLocation(program, 'color');
const matrixLoc = gl.getUniformLocation(program, 'matrix');
```

그리고 attribute의 상태를 저장하는 vertex array object를 만듭니다.

```js
// vertex array object (attribute 상태)를 생성하고,
const vao = gl.createVertexArray();

// 현재 사용 상태로 설정합니다.
gl.bindVertexArray(vao);
```

그리고 position 데이터를 버퍼를 통해 전달합니다.

```js
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.1,  0.4,
    -0.1, -0.4,
     0.1, -0.4,
     0.1, -0.4,
    -0.1,  0.4,
     0.1,  0.4,
     0.4, -0.1,
    -0.4, -0.1,
    -0.4,  0.1,
    -0.4,  0.1,
     0.4, -0.1,
     0.4,  0.1,
  ]), gl.STATIC_DRAW);
const numVertices = 12;

// position attribute 설정
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
    positionLoc,  // location
    2,            // 크기 (iteration마다 버퍼에서 가져올 값들의 개수)
    gl.FLOAT,     // 버퍼 내 데이터의 타입
    false,        // 정규화 여부
    0,            // stride (0인경우 위에서 명시한 크기와 타입으로 계산)
    0,            // offset
);
```

5개의 인스턴스를 그려봅시다. 각 인스턴스를 그리기 위해 5개의 행렬과 5개의 색상을 정의합니다.

```js
const numInstances = 5;
const matrices = [
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
];

const colors = [
  [ 1, 0, 0, 1, ],  // red
  [ 0, 1, 0, 1, ],  // green
  [ 0, 0, 1, 1, ],  // blue
  [ 1, 0, 1, 1, ],  // magenta
  [ 0, 1, 1, 1, ],  // cyan
];
```

그리기 위해 먼저 셰이더 프로그램을 사용 상태로 설정하고 attribute를 설정합니다.
그리고 5개 인스턴스에 대해 반복문을 돌면서 각각에 대해 행렬을 계산하고
그 행렬과 색상 uniform을 설정한 뒤 그리기를 수행합니다.

```js
function render(time) {
  time *= 0.001; // seconds

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  // setup all attributes
  gl.bindVertexArray(vao);

  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

    const color = colors[ndx];

    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(matrixLoc, false, mat);

    gl.drawArrays(
        gl.TRIANGLES,
        0,             // offset
        numVertices,   // num vertices per instance
    );
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

행렬 수학 라이브러리에서 추가적인 대상(destination) 행렬을 함수의 마지막 인자로 받는 부분에 주의하십시오.
대부분의 글에서는 이 기능을 사용하지 않고 라이브러리가 새 행렬을 할당하도록 했었습니다.
하지만 이번에는 생성한 행렬에 계속 결과가 저장되도록 하고 있습니다.

위 코드는 잘 동작해서 서로 다른 색상을 갖는 다섯 개의 더하기 기호가 돌아가는 장면을 볼 수 있습니다.

{{{example url="../webgl-instanced-drawing-not-instanced.html"}}}

이렇게 그리기 위해 `gl.uniform4v`, `gl.uniformMatrix4fv`, `gl.drawArrays`가 각각 5번씩 호출되어야 했으니 총 15번의 WebGL 호출이 필요했습니다.
만일 [스팟 조명 효과 글](webgl-3d-lighting-spot.html)에서처럼 복잡한 셰이더였다면 각 물체에 대해 최소 7번의 호출이 필요했을 겁니다.
6번의 `gl.uniformXXX` 호출과 한 번의 `gl.drawArrays` 호출이 필요합니다.
만일 물체가 400개였다면 2800번의 WebGL 호출이 필요할겁니다.

인스턴싱은 이러한 호출을 줄이는 방법입니다.
이 기능은 WebGL에 같은 물체가 몇 번(인스턴스의 개수) 그려질 것인지 알려줌으로써 동작합니다.
정점 셰이더가 호출되어 대상으로 하는 attribute마다 지정된 버퍼로부터 *다음 값*을 얻어오는 것이 기본값이지만,
N개의 인스턴스마다(일반적으로 N=1) 값을 가져오도록 할 수 있습니다.

예를 들어 `matrix`와 `color`를 uniform을 통해 제공하는 대신 이들을 `attribute`를 사용해 제공합니다.
각 인스턴스의 행렬과 색상을 버퍼에 입력하고 해당 버퍼로부터 값을 가져오도록 attribute를 설정한 뒤에 
WebGL에게 각 인스턴스마다 한번씩만 다음 값을 얻어오도록 알려주는 방식입니다.

한번 해보죠!

먼저 `matrix`와 `color`를 uniform 대신 attribute를 사용하도록 셰이더를 수정합니다.

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
-uniform mat4 matrix;
+in vec4 color;
+in mat4 matrix;
+
+out vec4 v_color;

void main() {
  // position과 행렬을 곱합니다.
  gl_Position = matrix * a_position;

+  // 프래그먼트 셰이더로 정점 색상을 전달합니다.
+  v_color = color;
}
`;
```

그리고

```js
const fragmentShaderSource = `#version 300 es
precision highp float;

-uniform vec4 color;
+// 정점 셰이더에서 전달된 값.
+in vec4 v_color;

void main() {
-  gl_FragColor = color;
+  gl_FragColor = v_color;
}
`;  
```

attribute는 정점 셰이더에서만 사용이 가능하므로 attribute에서 얻어오는 색상은
정점 셰이더에서 프래그먼트 셰이더로 varying을 사용해 전달됩니다.

다음으로 attribute들의 location을 찾아야 합니다.

```js
const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

const positionLoc = gl.getAttribLocation(program, 'a_position');
-const colorLoc = gl.getUniformLocation(program, 'color');
-const matrixLoc = gl.getUniformLocation(program, 'matrix');
+const colorLoc = gl.getAttribLocation(program, 'color');
+const matrixLoc = gl.getAttribLocation(program, 'matrix');
```

이제 attribute에 전달될 행렬을 저장할 버퍼가 필요합니다.
버퍼는 한 *덩어리(chunk)*로 업로드하는 것이 좋으므로 모든 행렬을 하나의 `Float32Array`에 집어넣습니다.

```js
// 각 인스턴스마다 하나의 행렬을 설정
const numInstances = 5;
+// 각 행렬마다 하나의 뷰(view)를 갖는 타입이 명시된 배열 생성
+const matrixData = new Float32Array(numInstances * 16);
```

이제 각 행렬마다 하나의 뷰를 차지하는 `Float32Array`를 만듭니다.

```js
-const matrices = [
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-];
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  const byteOffsetToMatrix = i * 16 * 4;
  const numFloatsForView = 16;
  matrices.push(new Float32Array(
      matrixData.buffer,
      byteOffsetToMatrix,
      numFloatsForView));
}
```

이렇게 하면 전체 행렬에 대한 데이터를 참조할 때는 `matrixData`를 사용하고 
개별 행렬 데이터를 참조할 때는 `matrices[ndx]`를 사용합니다.

이 데이터에 대한 버퍼를 GPU에 만들어야 합니다.
지금은 버퍼를 할당만 할 것이기 때문에 데이터를 집어넣지는 않습니다.
따라서 `gl.bufferData`의 두 번째 매개변수는 버퍼의 할당에 필요한 크기만 입력해줍니다.

```js
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
// 버퍼의 할당만을 수행
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);
```

마지막 매개변수로 `gl.DYNAMIC_DRAW`를 사용한 것에 주의하십시오.
이는 WebGL에게 이 데이터를 자주 변경할 것임을 알려주는 *힌트*입니다.

이제 행렬을 위한 attribute를 설정해야 합니다.
행렬 attribute는 `mat4`입니다. `mat4`는 4개의 연속된 attribute 슬롯을 사용합니다.

```js
const bytesPerMatrix = 4 * 16;
for (let i = 0; i < 4; ++i) {
  const loc = matrixLoc + i;
  gl.enableVertexAttribArray(loc);
  // stride와 offset값에 주목하세요.
  const offset = i * 16;  // 각 열마다 네 개의 float, float마다 4바이트
  gl.vertexAttribPointer(
      loc,              // location
      4,                // 크기 (각 iteration마다 버퍼에서 가져올 값의 개수)
      gl.FLOAT,         // 버퍼의 데이터 타입
      false,            // 정규화 여부
      bytesPerMatrix,   // stride, 다음 값들을 얻어오기 위해 건너뛸 바이트 개수
      offset,           // offset
  );
  // 아래 라인은 각 인스턴스마다 attribute가 바뀐다는 것을 명시합니다.
  gl.vertexAttribDivisor(loc, 1);
}
```

인스턴스 드로잉과 관련해서 가장 중요한 포인트는 `gl.vertexAttribDivisor` 호출입니다.
이는 현재 attribute가 각 인스턴스마다(역주: 인스턴스가 바뀔 때 마다) 다음 값을 얻어오도록 설정합니다.
그 말은 `matrix` attribute가 첫 번째 인스턴스의 정점에 대해서는 첫 번째 행렬만을 사용한다는 뜻입니다.
두 번째 행렬은 두 번째 인스턴스에 대해서 사용되고 이후 마찬가지입니다.

다음으로 색상도 버퍼에 입력해야 합니다.
이 데이터는 적어도 이 에제에서는 변하지 않으므로 바로 데이터를 업로드합니다.

```js
-const colors = [
-  [ 1, 0, 0, 1, ],  // red
-  [ 0, 1, 0, 1, ],  // green
-  [ 0, 0, 1, 1, ],  // blue
-  [ 1, 0, 1, 1, ],  // magenta
-  [ 0, 1, 1, 1, ],  // cyan
-];
+// setup colors, one per instance
+const colorBuffer = gl.createBuffer();
+gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
+gl.bufferData(gl.ARRAY_BUFFER,
+    new Float32Array([
+        1, 0, 0, 1,  // red
+        0, 1, 0, 1,  // green
+        0, 0, 1, 1,  // blue
+        1, 0, 1, 1,  // magenta
+        0, 1, 1, 1,  // cyan
+      ]),
+    gl.STATIC_DRAW);
```

색상 attribute도 마찬가지로 설정해 줍니다.

```js
// 색상에 대한 attribute 설정
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
// 아래 라인은 각 인스턴스마다 attribute가 바뀐다는 것을 명시합니다.
gl.vertexAttribDivisor(colorLoc, 1);
```

그리는 시점에서는 각 인스턴스마다 반복문을 돌면서 행렬과 색상 uniform을 설정하고 드로우콜을 하는 대신,
먼저 각 인스턴스에 대한 행렬 계산을 수행합니다.

```js
// 모든 행렬을 업데이트
matrices.forEach((mat, ndx) => {
  m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
  m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

-  const color = colors[ndx];
-
-  gl.uniform4fv(colorLoc, color);
-  gl.uniformMatrix4fv(matrixLoc, false, mat);
-
-  gl.drawArrays(
-      gl.TRIANGLES,
-      0,             // offset
-      numVertices,   // num vertices per instance
-  );
});
```

우리의 행렬 라이브러리가 추가적으로 대상 행렬을 인자로 받고 
행렬들이 하나의 큰 `Float32Array`의 일부 뷰이므로 계산이 끝나면 모든 행렬 데이터는 바로 GPU로 업로드하면 됩니다.

```js
// 새로운 행렬 데이터를 업로드
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
```

이제 한 번의 드로우콜로 모든 인스턴스를 그릴 수 있습니다.

```js
gl.drawArraysInstanced(
  gl.TRIANGLES,
  0,             // offset
  numVertices,   // 각 인스턴스의 정점 개수
  numInstances,  // 인스턴스의 개수
);
```

{{{example url="../webgl-instanced-drawing.html"}}}

위 예제에서 각 형상마다 세 번의 WebGL 호출 * 5개의 형상이므로 총 15번의 호출이 필요했습니다.
지금은 5개 형상에 대해 행렬의 업로드를 위해 한번, 그리기를 위해 한번으로 두 번의 호출이면 충분합니다.

따로 언급할 필요가 없을지도 모르겠지만 저는 너무 많이 겪은 것이라 저에게만 당연한 것일수도 있겠네요.
위 코드는 캔버스의 종횡비를 고려하고 있지 않습니다.
위 코드는 [투영 행렬](webgl-3d-orthographic.html)이나 [뷰 행렬](webgl-3d-camera.html)이 없습니다.
단순히 인스턴스 드로잉을 보여드리기 위해 만든 에제입니다.
투영 행렬과 뷰 행렬이 필요하다면 자바스크립트에서 추가적인 계산을 하면 됩니다.
그 말은 자바스크립트쪽에서 작업이 더 필요하다는 것입니다.
좀더 명확하게 설명하기위해 정점 셰이더에 uniform을 추가해 보겠습니다.

```js
const vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 color;
in mat4 matrix;
+uniform mat4 projection;
+uniform mat4 view;

out vec4 v_color;

void main() {
  // position과 행렬을 곱합니다.
-  gl_Position = matrix * a_position;
+  gl_Position = projection * view * matrix * a_position;

  // 정점 색상을 프래그먼트 셰이더에 전달합니다.
  v_color = color;
}
`;
```

location을 초기화 시점에 찾습니다.

```js
const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
+const projectionLoc = gl.getUniformLocation(program, 'projection');
+const viewLoc = gl.getUniformLocation(program, 'view');
```

그리고 렌더링 시점에 적절하게 설정해 줍니다.

```js
gl.useProgram(program);

+// set the view and projection matrices since
+// they are shared by all instances
+const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+gl.uniformMatrix4fv(projectionLoc, false,
+    m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
+gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
```

{{{example url="../webgl-instanced-drawing-projection-view.html"}}}
