Title: WebGL2 평면 및 원근 투영 매핑
Description: 텍스처를 평면으로 투영
TOC: 평면 및 원근 투영 매핑

이 글에서는 예제를 간결하게 하기 위해 [더 적은 코드로 즐겁게](webgl-less-code-more-fun.html)에서 언급된 라이브러리를 사용하므로 여러분들이 해당 글을 읽었다고 가정합니다.
버퍼, 정점 배열, attribute가 무엇인지, `twgl.setUniforms`이라는 함수가 뭐고 uniform을 설정한다는 것이 어떤 의미인지 등을 모르시겠다면 뒤로 돌아가서 [WebGL2 기초를 먼저 읽어 보셔야 할겁니다]](webgl-fundamentals.html).

또한 [원근 투영](webgl-3d-perspective.html), [카메라](webgl-3d-camera.html), [텍스처](webgl-3d-textures.html), [카메라 시각화](webgl-visualizing-the-camera.html)에 대한 글을 읽었다고 가정하기 때문에 해당 글들을 먼저 읽어 보십시오.

투영 매핑은 프로젝터가 스크린을 향하게 하고 영화를 투사하는 것과 같이 이미지를 "투영하는(projecting)" 방법입니다.
프로젝터는 투시면을 투사합니다.
스크린이 프로젝터에서 멀어질수록 이미지는 더 커집니다.
스크린의 각도가 바뀌어서 프로젝터가 스크린에 수직이 아니게 된다면  사다리꼴이나 임의의 사변형으로 나타날겁니다.

<div class="webgl_center"><img src="resources/perspective-projection.svg" style="width: 400px"></div>

물론 투영 매핑이 꼭 평면에 이루어져야 할 필요는 없습니다.
원통형 투영 매핑, 구형 투영 매핑 등등도 있습니다.

먼저 평면 투영 매핑을 살펴봅시다.
이 경우 프로젝터가 스크린의 크기만큼 커서,
스크린이 프로젝터에서 멀어진다고 영상이 커지지 않고 동일한 크기를 유지한다고 생각해봅시다.

<div class="webgl_center"><img src="resources/orthographic-projection.svg" style="width: 400px"></div>

먼저 평면과 구체를 그리는 간단한 장면을 만들어 보겠습니다.
두 물체 모두 간단한 8x8 체커 보드 텍스처를 사용할 겁니다.

셰이더는 다양한 행렬이 분리되어 있어서 자바스크립트 쪽에서 미리 곱할 필요가 없다는 걸 제외하면 [텍스처에 관한 글](webgl-3d-textures.html)의 셰이더와 유사합니다.

```js
const vs = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec2 v_texcoord;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;

  // 프래그먼트 셰이더로 텍스처 좌표 전달
  v_texcoord = a_texcoord;
}
`;
```

또한 텍스처 색상에 곱할 `u_colorMult` uniform을 추가하였습니다.
단색 텍스처를 만들면 이 값으로 색상을 변경할 수 있습니다.

```js
const fs = `#version 300 es
precision highp float;

// 정점 셰이더에서 전달된 값
in vec2 v_texcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_texcoord) * u_colorMult;
}
`;
```

다음은 프로그램, 구에 대한 버퍼, 평면에 대한 버퍼를 설정하는 코드입니다.

```js
// GLSL 프로그램 설정
// 셰이더 컴파일, 링킹, location 탐색
const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // 반지름
    12, // 좌우방향 분할
    6,  // 상하방향 분할
);
const sphereVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, sphereBufferInfo);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // 너비
    20,  // 높이
    1,   // 가로지르는 방향 분할
    1,   // 상하방향 분할
);
const planeVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, planeBufferInfo);
```

그리고 아래는 [데이터 텍스처에 관한 글](webgl-data-textures.html)에서 다룬 기술을 사용하여 8x8 픽셀 크기의 체커 보드 텍스처를 만드는 코드입니다.

```js
// 8x8 체커 보드 텍스처 만들기
const checkerboardTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // 밉맵 수준
    gl.LUMINANCE,     // 내부 포맷
    8,                // 너비
    8,                // 높이
    0,                // 테두리
    gl.LUMINANCE,     // 포맷
    gl.UNSIGNED_BYTE, // 타입
    new Uint8Array([  // 데이터
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
    ]));
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

화면에 그리기 위해 투영 행렬과 카메라 행렬을 가져오고, 카메라 행렬로 뷰 행렬을 계산한 다음, 구체와 육면체를 그리는 함수를 만들겁니다.

```js
// 각 물체에 대한 uniform
const planeUniforms = {
  u_colorMult: [0.5, 0.5, 1, 1],  // 하늘색
  u_texture: checkerboardTexture,
  u_world: m4.translation(0, 0, 0),
};
const sphereUniforms = {
  u_colorMult: [1, 0.5, 0.5, 1],  // 분홍색
  u_texture: checkerboardTexture,
  u_world: m4.translation(2, 3, 4),
};

function drawScene(projectionMatrix, cameraMatrix) {
  // 카메라 행렬로 뷰 행렬 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(textureProgramInfo.program);

  // 구체와 평면이 공유하는 uniform 설정
  twgl.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
  });

  // ------ 구체 그리기 --------

  // 필요한 모든 attribute 설정
  gl.bindVertexArray(sphereVAO);

  // 구체에 고유한 uniform 설정
  twgl.setUniforms(textureProgramInfo, sphereUniforms);

  // gl.drawArrays 혹은 gl.drawElements 호출
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ 평면 그리기 --------

  // 필요한 모든 attribute 설정
  gl.bindVertexArray(planeVAO);

  // 평면에 고유한 uniform 설정
  twgl.setUniforms(textureProgramInfo, planeUniforms);

  // gl.drawArrays 혹은 gl.drawElements 호출
  twgl.drawBufferInfo(gl, planeBufferInfo);
}
```

우리는 위 코드를 `render` 함수에서 아래와 같이 사용할 수 있습니다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
};
const fieldOfViewRadians = degToRad(60);

function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // 클립 공간에서 픽셀로 변환하는 방법을 WebGL에 알려줌
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // 캔버스와 깊이 버퍼 지우기
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 투영 행렬 계산
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // lookAt을 사용하여 카메라 행렬 계산
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  drawScene(projectionMatrix, cameraMatrix);
}
render();
```

이제 평면과 구체가 있는 간단한 장면이 생겼습니다.
이해를 돕기 위해 카메라 위치를 변경하는 슬라이더를 추가했습니다.

{{{example url="../webgl-planar-projection-setup.html"}}}

이제 구체와 평면에 텍스처를 평면 투영해봅시다.

먼저 [텍스처를 로드](webgl-3d-textures.html)합니다.

```js
function loadImageTexture(url) {
  // 텍스처 생성
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 1x1 파란 픽셀로 텍스처 채우기
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // 비동기적으로 이미지 로드
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // 이미지 로드가 완료되었기 때문에 텍스처로 복사
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // 텍스처가 2의 거듭 제곱이라 가정
    gl.generateMipmap(gl.TEXTURE_2D);
    render();
  });
  return texture;
}

const imageTexture = loadImageTexture('resources/f-texture.png');
```

[카메라 시각화에 대한 글](webgl-visualizing-the-camera.html)을 떠올려보면, -1에서 +1사이의 육면체를 만들고 카메라의 절두체를 나타내도록 그렸습니다.
절두체 내부의 공간이 월드 공간에서 -1에서 +1사이의 클립 공간으로 변환되는 월드 공간 내부에 있는 절두체 모양의 영역을 나타내도록 행렬을 만들었는데요.
여기서도 비슷하게 할 수 있습니다.

한 번 해봅시다.
먼저 프래그먼트 셰이더에서 텍스처 좌표가 0.0에서 1.0사이인 곳에 투영된 텍스처를 그립니다.
해당 범위 밖에서는 체커 보드 텍스처를 사용할 겁니다. 

```js
const fs = `#version 300 es
precision highp float;

// 정점 셰이더에서 전달된 값
in vec2 v_texcoord;
+in vec4 v_projectedTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
+uniform sampler2D u_projectedTexture;

out vec4 outColor;

void main() {
-  outColor = texture(u_texture, v_texcoord) * u_colorMult;
+  // 올바른 값을 얻기 위해 w로 나누기 (원근 투영에 대한 글 참고)
+  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+
+  bool inRange = 
+      projectedTexcoord.x >= 0.0 &&
+      projectedTexcoord.x <= 1.0 &&
+      projectedTexcoord.y >= 0.0 &&
+      projectedTexcoord.y <= 1.0;
+
+  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
+  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
+
+  float projectedAmount = inRange ? 1.0 : 0.0;
+  outColor = mix(texColor, projectedTexColor, projectedAmount);
}
`;
```

투영된 텍스처 좌표를 계산하기 위해 [카메라 시각화](webgl-visualizing-the-camera.html)에 관한 글에서의 카메라처럼, 특정 방향을 향하도록 위치와 자세가 설정된 3D 공간을 나타내는 행렬을 만듭니다.
그런 다음 구체와 평면의 정점들의 월드 공간 좌표를 해당 공간으로 투영합니다.
그 값이 0과 1사이에 있다면 위에 작성한 코드를 통해 텍스처가 나타날겁니다.

정점 셰이더에 코드를 추가해서 구체와 평면이 이 *공간*에 투영되도록 합시다. 

```js
const vs = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
+uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
+out vec4 v_projectedTexcoord;

void main() {
+  vec4 worldPosition = u_world * a_position;

-  gl_Position = u_projection * u_view * u_world * a_position;
+  gl_Position = u_projection * u_view * worldPosition;

  // 프래그먼트 셰이더로 텍스처 좌표 전달
  v_texcoord = a_texcoord;

+  v_projectedTexcoord = u_textureMatrix * worldPosition;
}
```

이제 남은 것은 이 공간을 정의하는 행렬을 실제로 계산하는 겁니다.
다른 물체들과 마찬가지로 월드 행렬을 계산한 다음 역행렬을 취하면 됩니다.
이 행렬을 사용하면 월드 공간 좌표가 이 공간에 대한 상대 좌표로 변환됩니다.
이건 [카메라에 대한 글](webgl-3d-camera.html)에서 사용한 뷰 행렬과 동일합니다.

마찬가지로 [같은 글](webgl-3d-camera.html)에서 만들었던 `lookAt` 함수를 사용할 겁니다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
+  posX: 3.5,
+  posY: 4.4,
+  posZ: 4.7,
+  targetX: 0.8,
+  targetY: 0,
+  targetZ: 4.7,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // 카메라 행렬로부터 뷰 행렬 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );

  // 이 월드 행렬의 역행렬을
  // 어떠한 position을 이 월드 공간에 대한
  // 상대 위치로 변환하는데 사용할 수 있습니다.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  // 구체와 평면 모두에 동일한 uniform 설정
  twgl.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_textureMatrix: textureMatrix,
+    u_projectedTexture: imageTexture,
  });

  ...
}
```

물론 꼭 `lookAt`을 사용하지 않아도 됩니다.
예를 들어 [장면 그래프](webgl-scene-graph.html)나 [행렬 스택](webgl-2d-matrix-stack.html)을 사용하여 월드 행렬을 만들 수도 있습니다.

실행 전에 scale을 추가해봅시다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 3.5,
  posY: 4.4,
  posZ: 4.7,
  targetX: 0.8,
  targetY: 0,
  targetZ: 4.7,
+  projWidth: 2,
+  projHeight: 2,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // 카메라 행렬로부터 뷰 행렬 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
+  textureWorldMatrix = m4.scale(
+      textureWorldMatrix,
+      settings.projWidth, settings.projHeight, 1,
+  );

  // 이 월드 행렬의 역행렬을
  // 어떠한 position을 이 월드 공간에 대한
  // 상대 위치로 변환하는데 사용할 수 있습니다.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  ...
}
```

이를 통해 투영된 텍스처가 나타납니다.

{{{example url="../webgl-planar-projection.html"}}}

텍스처가 들어있는 공간을 보기 힘들 수도 있을 것 같습니다.
시각화를 돕기 위해 와이어프레임으로 표시되는 육면체를 추가해봅시다.

먼저 별도의 셰이더들이 필요합니다.
이 셰이더는 텍스처 없이, 단색만 그립니다.

```js
const colorVS = `#version 300 es
in vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
  // position과 행렬을 곱하기
  gl_Position = u_projection * u_view * u_world * a_position;
}
`;
```

```js
const colorFS = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
```

그런 다음 이 셰이더들도 컴파일하고 링크해야 합니다.

```js
// GLSL program 설정
const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
+const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS]);
```

그리고 선으로 이루어진 육면체를 그리기 위한 데이터가 필요합니다.

```js
const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // 반지름
    12, // 좌우방향 분할
    6,  // 상하방향 분할
);
const sphereVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, sphereBufferInfo);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // 너비
    20,  // 높이
    1,   // 가로지르는 방향 분할
    1,   // 상하방향 분할
);
const planeVAO = twgl.createVAOFromBufferInfo(
    gl, textureProgramInfo, planeBufferInfo);
+const cubeLinesBufferInfo = twgl.createBufferInfoFromArrays(gl, {
+  position: [
+     0,  0, -1,
+     1,  0, -1,
+     0,  1, -1,
+     1,  1, -1,
+     0,  0,  1,
+     1,  0,  1,
+     0,  1,  1,
+     1,  1,  1,
+  ],
+  indices: [
+    0, 1,
+    1, 3,
+    3, 2,
+    2, 0,
+
+    4, 5,
+    5, 7,
+    7, 6,
+    6, 4,
+
+    0, 4,
+    1, 5,
+    3, 7,
+    2, 6,
+  ],
+});
+const cubeLinesVAO = twgl.createVAOFromBufferInfo(
+    gl, colorProgramInfo, cubeLinesBufferInfo);
```

이 큐브는 텍스처 좌표에 맞추기 위해 X와 Y에 대해 0에서 1사이가 됩니다.
Z의 경우 -1에서 1사이입니다.
이건 양쪽 방향으로 늘려 크기를 조정하기 위한 겁니다.

이 코드의 목적은 공간의 표현을 위해 육면체를 그리는 것이기 때문에 이전의 `textureWorldMatrix`를 사용하면 됩니다.

```js
function drawScene(projectionMatrix, cameraMatrix) {

  ...
+  // ------ 육면체 그리기 ------
+
+  gl.useProgram(colorProgramInfo.program);
+
+  // 필요한 모든 attribute 설정
+  gl.bindVertexArray(cubeLinesVAO);
+
+  // 텍스처가 무한히 먼 곳에서 투영되는 것을 표현하기 위해
+  // 육면체의 Z를 스케일링해서 아주 길게 만듭니다.
+  const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);
+
+  // 계산된 값으로 uniform을 설정
+  twgl.setUniforms(colorProgramInfo, {
+    u_color: [0, 0, 0, 1],
+    u_view: viewMatrix,
+    u_projection: projectionMatrix,
+    u_world: mat,
+  });
+
+  // gl.drawArrays 혹은 gl.drawElements 호출
+  twgl.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
}
```

이제 투영이 어떻게 이루어지는지 더 쉽게 알 수 있습니다.

{{{example url="../webgl-planar-projection-with-lines.html"}}}

실제로는 텍스처를 *투영*하는 것이 아니라는 점을 이해하는 것이 중요합니다. 오히려 정 반대죠.
렌더링되는 물체의 각 픽셀에 대해 텍스처의 어느 부분이 거기에 투영되는지 확인한 다음 텍스처의 해당 부분에서 색상을 찾는 겁니다.

위에서 프로젝터를 언급했는데 어떻게 프로젝터를 시뮬레이션할 수 있을까요?
기본적으로는 그냥 투영 행렬을 곱하면 됩니다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
+  perspective: true,
+  fieldOfView: 45,
};

...

function drawScene(projectionMatrix, cameraMatrix) {
  // 카메라 행렬로 뷰 행렬 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  const textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
-  textureWorldMatrix = m4.scale(
-      textureWorldMatrix,
-      settings.projWidth, settings.projHeight, 1,
-  );
  
+  const textureProjectionMatrix = settings.perspective
+      ? m4.perspective(
+          degToRad(settings.fieldOfView),
+          settings.projWidth / settings.projHeight,
+          0.1,  // near
+          200)  // far
+      : m4.orthographic(
+          -settings.projWidth / 2,   // left
+           settings.projWidth / 2,   // right
+          -settings.projHeight / 2,  // bottom
+           settings.projHeight / 2,  // top
+           0.1,                      // near
+           200);                     // far

  // 이 월드 행렬의 역행렬을
  // 어떠한 position을 이 월드 공간에 대한
  // 상대 위치로 변환하는데 사용할 수 있습니다.
-  const textureMatrix = m4.inverse(textureWorldMatrix);
+  const textureMatrix = m4.multiply(
+      textureProjectionMatrix,
+      m4.inverse(textureWorldMatrix));
```

원근 투영 행렬이나 직교 투영 행렬을 선택적으로 사용할 수 있다는 점에 주목하십시오.

또한 선을 그릴 때 이 투영 행렬을 사용해야 합니다.

```js
// ------ 큐브 그리기 ------

...

-// 텍스처가 무한히 먼 곳에서 투영되는 것을 표현하기 위해
-// 육면체의 Z를 스케일링해서 아주 길게 만듭니다.
-const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);

+// 평면 투영과 일치하도록 육면체 변환
+const mat = m4.multiply(
+    textureWorldMatrix, m4.inverse(textureProjectionMatrix));
```

이러면 다음과 같은 결과를 얻습니다.

{{{example url="../webgl-planar-projection-with-projection-matrix-0-to-1.html"}}}

작동은 하지만 평면 투영과 육면체를 나타내는 선이 모두 0에서 1사이의 공간만을 사용하므로 투영 절두체의 1/4만 사용하고 있습니다.

이를 해결하기 위해 먼저 육면체를 모든 방향으로 -1에서 +1사이인 육면체로 만들어봅시다.

```js
const cubeLinesBufferInfo = twgl.createBufferInfoFromArrays(gl, {
  position: [
-     0,  0, -1,
-     1,  0, -1,
-     0,  1, -1,
-     1,  1, -1,
-     0,  0,  1,
-     1,  0,  1,
-     0,  1,  1,
-     1,  1,  1,
+    -1, -1, -1,
+     1, -1, -1,
+    -1,  1, -1,
+     1,  1, -1,
+    -1, -1,  1,
+     1, -1,  1,
+    -1,  1,  1,
+     1,  1,  1,
  ],
  indices: [
    0, 1,
    1, 3,
    3, 2,
    2, 0,

    4, 5,
    5, 7,
    7, 6,
    6, 4,

    0, 4,
    1, 5,
    3, 7,
    2, 6,
  ],
});
```

그런 다음 텍스처 행렬로 사용할 때는 절두체 내부 공간을 0에서 1사이로 만들어야 하는데, 공간을 0.5만큼 오프셋을 주고하고 0.5로만큼 스케일링하면 됩니다.

```js
const textureWorldMatrix = m4.lookAt(
    [settings.posX, settings.posY, settings.posZ],          // position
    [settings.targetX, settings.targetY, settings.targetZ], // target
    [0, 1, 0],                                              // up
);
const textureProjectionMatrix = settings.perspective
    ? m4.perspective(
        degToRad(settings.fieldOfView),
        settings.projWidth / settings.projHeight,
        0.1,  // near
        200)  // far
    : m4.orthographic(
        -settings.projWidth / 2,   // left
         settings.projWidth / 2,   // right
        -settings.projHeight / 2,  // bottom
         settings.projHeight / 2,  // top
         0.1,                      // near
         200);                     // far

-// 이 월드 행렬의 역행렬을
-// 어떠한 position을 이 월드 공간에 대한
-// 상대 위치로 변환하는데 사용할 수 있습니다.
-const textureMatrix = m4.multiply(
-    textureProjectionMatrix,
-    m4.inverse(textureWorldMatrix));

+let textureMatrix = m4.identity();
+textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+// 이 월드 행렬의 역행렬을
+// 어떠한 position을 이 월드 공간에 대한
+// 상대 위치로 변환하는데 사용할 수 있습니다.
+textureMatrix = m4.multiply(
+    textureMatrix,
+    m4.inverse(textureWorldMatrix));
```

이제 잘 동작합니다.

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

그래서 텍스처를 평면으로 투영해서 좋은 점은 뭘까요?

하나는 그냥 만들어 보고 싶기 때문입니다, 하하.
대부분의 3D 모델링 패키지는 텍스처를 평면으로 투영하는 기능을 제공합니다.

또 하나는 데칼(decal)입니다.
데칼은 표면에 페인트 얼룩이나 폭발 흔적을 붙이는 방법입니다.
일반적으로 데칼은 위 예제처럼 셰이더를 통해 작동하지 않습니다.
대신에 데칼을 적용하려는 모델의 geometry를 검토하는 함수를 작성합니다.
자바스크립트의 셰이더 예제에 있는 `inRange` 체크와 동일하게, 각 삼각형에 대해 그 삼각형이 데칼이 적용될 영역의 내부에 있는지 확인합니다.
영역의 내부에 있는 각 삼각형에 대해 투영된 텍스처 좌표를 사용해서 새로운 geometry로 추가합니다.
그런 다음 해당 데칼을 그려야 하는 목록에 추가합니다.

Geometry를 생성하는 것이 올바른 방법인데, 그렇지 않으면 2개, 3개, 4개의 데칼을 사용할 때마다 서로 다른 셰이더가 필요해져서 셰이더가 매우 복잡해지고 GPU의 텍스처 사용 한계에 도달하게 됩니다.

또 다른 사용 예시는 현실 세계의 [투영 매핑](https://en.wikipedia.org/wiki/Projection_mapping)을 모사하는 겁니다.
비디오가 투사될 3D 모델을 만든 뒤 위와 같은 코드를 사용하여 비디오를 텍스처로 사용해 투사합니다.
그러면 실제 프로젝터를 들고 현장에 가 보지 않고도 영상이 모델에 딱 맞추어 투사될 수 있도록 비디오를 편집할 수 있습니다.

이런 종류의 투영이 유용한 다른 예제는 [쉐도우 매핑을 이용한 그림자 계산](webgl-shadows.html)입니다.

<div class="webgl_bottombar">
<h3>조건부 텍스처 참조</h3>
<p>위의 프래그먼트 셰이더에서는 항상 두 개의 텍스처를 모두 읽게 됩니다.</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
</code></pre>
<p>왜 아래와 같이 하지 않았을까요?</p>
<pre class="prettyprint"><code>
  if (inRange) {
    gl_FragColor = texture(u_projectedTexture, projectedTexcoord.xy);
  } else {
    gl_FragColor = texture(u_texture, v_texcoord) * u_colorMult;
  }
</code></pre>
<p><a href="https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf">GLSL ES 3.0 명세의 Section 8.8</a>에 따르면</p>
<blockquote>
<h4>Texture Lookup Functions</h4>
<p>
Some texture functions (non-“Lod” and non-“Grad” versions) may require implicit derivatives. Implicit
derivatives are undefined within non-uniform control flow and for vertex texture fetches
</p>
</blockquote>
<p>
다시 말해 텍스처를 사용하는 경우 항상 텍스처에 접근할 수 있어야 한다는 것입니다. 
결과를 조건부로 사용할 수는 있습니다.
예를 들어 아래와 같이 작성하거나</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  if (inRange) {
    gl_FragColor = projectedTexColor;
  } else {
    gl_FragColor = texColor;
  }
</code></pre>
<p>아래와 같이 작성할 수 있습니다.</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

  gl_FragColor = inRange ? projectedTexColor : texColor;
</code></pre>
<p>
하지만 텍스처 접근 자체를 조건부로 만들 수는 없습니다.
어떤 GPU에서는 작동될 수 있지만 모든 GPU에서 작동이 보장되지는 않습니다.
</p>
<p>어쨌든 이러한 사실을 알고 있는 것은 중요합니다.</p>
<p>
<code>inRange</code>를 기반으로 분기문을 만드는 대신 <code>mix</code>를 사용하는 이유는 개인적인 취향 때문입니다.
<code>mix</code>가 더 유연하기 때문에 저는 보통 이런 식으로 작성합니다.
</p>
</div>
