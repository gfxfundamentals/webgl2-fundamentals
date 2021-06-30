Title: WebGL2 환경맵 (반사)
Description: 환경맵을 구현하는 방법.
TOC: 환경맵

이 글은 WebGL2 시리즈의 글입니다.
첫 글은 [WebGL2 기초](webgl-fundamentals.html)입니다.
이 글은 [큐브맵](webgl-cube-maps.html)에서 이어지는 글입니다.
이 글에서는 [조명 효과](webgl-3d-lighting-directional.html)에서 다루었던 개념이 사용됩니다.
위 글들을 아직 읽지 않으셨으면 먼저 읽으시는 것이 좋습니다.

*환경맵*이란 우리가 그리는 물체 주변의 환경을 표현합니다.
야외를 그리려고 한다면 야외 환경을 나타냅니다. 
무대 위의 사람을 그리려고 한다면 그 공연장을 나타냅니다.
우주를 그리려고 한다면 별들이 될 겁니다. 
환경을 표현하는 6장의 이미지가 있다면 큐브맵의 6방향을 사용해 환경맵을 구현할 수 있습니다.

아래는 캘리포니아 마운틴 뷰에 있는 컴퓨터 박물관의 로비 사진입니다.

<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/pos-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-y.jpg" style="width: 128px" class="border">
</div>
<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/neg-y.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-z.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-z.jpg" style="width: 128px" class="border">
</div>

[이전 글의 코드](webgl-cube-maps.html)를 기반으로 이미지를 생성하는 대신 6장의 이미지를 로드해 봅시다.

```js
// 텍스처를 생성합니다.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

const faceInfos = [
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    url: 'resources/images/computer-history-museum/pos-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    url: 'resources/images/computer-history-museum/neg-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    url: 'resources/images/computer-history-museum/pos-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    url: 'resources/images/computer-history-museum/neg-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    url: 'resources/images/computer-history-museum/pos-z.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    url: 'resources/images/computer-history-museum/neg-z.jpg',
  },
];
faceInfos.forEach((faceInfo) => {
  const {target, url} = faceInfo;

  // 캔버스를 큐브맵 면으로 업로드합니다.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 512;
  const height = 512;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;

  // 바로 렌더링이 가능하도록 우선 각 면을 설정합니다.
  gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

  // 이미지를 비동기 로드합니다.
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // 이제 이미지가 로드되었으니 텍스처로 업로드합니다.
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(target, level, internalFormat, format, type, image);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  });
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

참고로 모든 면에 대해 512x512 크기로, `texImage2D`에 `null`을 전달하여 빈 이미지인 상태로 초기화 했습니다.
큐브맵은 6개 면 모두 있어야 하고, 모든 면의 크기가 정사각형이면서 같아야 합니다.
그렇지 않으면 렌더링되지 않습니다.
그런데 우리는 6장의 이미지를 로딩하고 있죠. 바로 렌더링을 시작할 수 있도록 6개 면 모드를 우선 할당하고나서 이미지 로딩을 시작합니다.
각 이미지가 로드되면 해당 면에 이미지를 업로드하고 밉맵을 다시 생성합니다.
즉 렌더링은 바로 시작되면서 이미지들이 다운로드 완료되면 큐브맵의 각 면이 하나씩 이미지로 바뀌게 됩니다. 이는 6개 모든 이미지가 다운로드 되지 않은 상태에서도 가능합니다.

하지만 그냥 이미지를 로딩하는 걸로는 부족합니다.
[조명 효과](webgl-3d-lighting-point.html)에서처럼, 약간의 계산이 필요합니다.

이 예제에서는 각 프래그먼트에 대해 시점/카메라 위치로부터 물체 표면상의 한 position에 대한 벡터가 주어졌을 때, 반사되는 방향을 알아야 합니다.
그 방향을 기반으로 큐브맵으로부터 색상을 얻어와야 합니다.

반사에 대한 수식은 아래와 같습니다.

    reflectionDir = eyeToSurfaceDir –
        2 ∗ dot(surfaceNormal, eyeToSurfaceDir) ∗ surfaceNormal

위 수식이 맞다는 사실은 조금 생각해 보면 알 수 있습니다.
[조명 효과](webgl-3d-lighting-directional.html) 글에서 두 벡터의 내적은 사이각의 코사인값이라는 것을 배웠습니다.
두 벡터를 더한 것은 벡터이므로 아래와 같이 평면을 수직으로 내려다보는 상황을 생각해 봅시다.

<div class="webgl_center"><img src="resources/reflect-180-01.svg" style="width: 400px"></div>

위 수식을 가시화해 봅시다. 먼저 두 벡터의 방향이 반대일 때 내적값은 -1이므로 이를 그려보면 아래와 같습니다.

<div class="webgl_center"><img src="resources/reflect-180-02.svg" style="width: 400px"></div>

이 내적값을 반사 수식에서 <span style="color:black; font-weight:bold;">eyeToSurfaceDir</span>
와 <span style="color:green;">normal</span>에 대해 적용해 보면 아래와 같이 됩니다.

<div class="webgl_center"><img src="resources/reflect-180-03.svg" style="width: 400px"></div>

-2와 -1을 곱했으므로 2가 됩니다.

<div class="webgl_center"><img src="resources/reflect-180-04.svg" style="width: 400px"></div>

따라서 이를 적용해 벡터를 더해보면 아래와 같은 <span style="color: red">반사 벡터</span>가 얻어집니다.

<div class="webgl_center"><img src="resources/reflect-180-05.svg" style="width: 400px"></div>

위 그림을 보면 2개의 법선으로부터, 시야에서 평면을 향하는 벡터는 더해서 0이 되고, 나머지 하나는 시야로 향하는 반사 벡터가 되는 것을 볼 수 있습니다.
다시 원래 다이어그램에 그려보면 우리가 원하는 결과인 것을 알 수 있습니다.

<div class="webgl_center"><img src="resources/reflect-180-06.svg" style="width: 400px"></div>

이번엔 평면을 오른쪽으로 45도 기울여봅시다.

<div class="webgl_center"><img src="resources/reflect-45-01.svg" style="width: 400px"></div>

사이각이 135도인 벡터들의 내적은 -0.707입니다.

<div class="webgl_center"><img src="resources/reflect-45-02.svg" style="width: 400px"></div>

수식에 넣어보면 아래와 같이 됩니다.

<div class="webgl_center"><img src="resources/reflect-45-03.svg" style="width: 400px"></div>

음수 두 개를 더하면 양수가 되는데 이전과는 다르게 <span style="color: green">벡터</span>가 30% 정도 더 짧아졌습니다.

<div class="webgl_center"><img src="resources/reflect-45-04.svg" style="width: 400px"></div>

벡터들을 더하면 <span style="color: red">반사 벡터</span>가 됩니다.

<div class="webgl_center"><img src="resources/reflect-45-05.svg" style="width: 400px"></div>

다이어그램에 표시해 보면 올바른 결과라는 것을 볼 수 있습니다.

<div class="webgl_center"><img src="resources/reflect-45-06.svg" style="width: 400px"></div>

<span style="color: red">반사 방향</span>을 이용해 물체의 표면에 해당하는 큐브맵의 색상을 샘플링할 수 있습니다.

아래는 표면의 회전각을 바꾸어가면서 수식의 각 부분의 값을 볼 수 있는 다이어그램입니다.
또한 반사 벡터가 큐브맵의 어떤 면을 가리키는지와 그에 따른 색상 변화 효과를 볼 수 있습니다.

{{{diagram url="resources/environment-mapping.html" width="400" height="400" }}}

이제 반사가 어떻게 계산되는지 알았으니 이를 활용해 큐브맵으로부터 값을 샘플링하도록 셰이더를 수정할 수 있습니다.

먼저 정점 셰이더에서는 정점의 월드 좌표와 월드 공간에서의 법선 방향을 계산하여 varying으로 프래그먼트 셰이더에 넘겨줄 겁니다.
이는 [스팟 조명 효과의 글](webgl-3d-lighting-spot.html)에서와 유사합니다.

```glsl
#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec3 v_worldPosition;
out vec3 v_worldNormal;

void main() {
  // position에 행렬을 곱합니다.
  gl_Position = u_projection * u_view * u_world * a_position;

  // 시점 위치를 프래그먼트 셰이더로 넘겨줍니다.
  v_worldPosition = (u_world * a_position).xyz;

  // 법선 방향을 조정하여 프래그먼트 셰이더로 넘겨줍니다.
  v_worldNormal = mat3(u_world) * a_normal;
}
```

프래그먼트 셰이더에서는 `worldNormal`이 보간되었으므로 정규화해줍니다.
카메라의 월드 좌표를 넘겨주었으므로 이를 표면의 월드 좌표에서 빼 주면 `eyeToSurfaceDir`를 얻을 수 있습니다.

마지막으로 위에 설명한 수식이 구현되어있는 GLSL 내장 함수인 `reflect`를 사용합니다.
반환값을 사용하여 큐브맵으로부터 색상값을 얻어옵니다.

```glsl
#version 300 es

precision highp float;

// 정점 셰이더에서 넘어온 값.
in vec3 v_worldPosition;
in vec3 v_worldNormal;

// 텍스처.
uniform samplerCube u_texture;

// 카메라의 위치
uniform vec3 u_worldCameraPosition;

// 프래그먼트 셰이더에서는 출력을 선언해야 합니다.
out vec4 outColor;

void main() {
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

  outColor = texture(u_texture, direction);
}
```

이 예제에서는 실제 법선도 필요합니다. 실제 법선을 활용해 육면체의 각 면이 평평하게 보이도록 할겁니다.
이전 예제에서는 큐브맵이 동작하는 것을 보기 위해 간단히 정점의 위치로 법선을 계산했지만 이번에는 
[조명 효과 관련 글](webgl-3d-lighting-directional.html)에서처럼 육면체의 실제 법선값이 필요합니다.

초기화 시점에,

```js
// 법선을 입력하기 위한 버퍼를 생성합니다.
var normalBuffer = gl.createBuffer();
// ARRAY_BUFFER에 바인딩합니다. (ARRAY_BUFFER = normalBuffer인 상태로 생각하면 됩니다.)
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
// 버퍼에 법선 데이터를 넣습니다.
setNormals(gl);

// normalBuffer (ARRAY_BUFFER)로부터 데이터를 읽어오는 방법을 attribute에 알려줍니다.
var size = 3;          // 각 iteration마다 3개의 값
var type = gl.FLOAT;   // 데이터는 32비트 부동소수점 값
var normalize = false; // 데이터를 정규화 하는지 여부 (0-255를 0-1로 변환하는지)
var stride = 0;        // 0인 경우 각 iteration마다 다음 값을 얻어오기 위해 size * sizeof(type)만큼 이동
var offset = 0;        // 버퍼의 맨 앞부터 시작
gl.vertexAttribPointer(
    normalLocation, size, type, normalize, stride, offset)
```

그리고 당연히 초기화 시점에 uniform의 location을 찾아야 합니다.

```js
var projectionLocation = gl.getUniformLocation(program, "u_projection");
var viewLocation = gl.getUniformLocation(program, "u_view");
var worldLocation = gl.getUniformLocation(program, "u_world");
var textureLocation = gl.getUniformLocation(program, "u_texture");
var worldCameraPositionLocation = gl.getUniformLocation(program, "u_worldCameraPosition");
```

그리고 렌더링 시점에 값을 설정해 줍니다.

```js
// 투영 행렬 계산
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix =
    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);

var cameraPosition = [0, 0, 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// look at을 사용하여 카메라 행렬을 계산합니다.
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// 카메라 행렬로 뷰 행렬을 계산합니다.
var viewMatrix = m4.inverse(cameraMatrix);

var worldMatrix = m4.xRotation(modelXRotationRadians);
worldMatrix = m4.yRotate(worldMatrix, modelYRotationRadians);

// uniform들을 설정합니다.
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
gl.uniform3fv(worldCameraPositionLocation, cameraPosition);

// u_texture가 텍스처 유닛 0을 사용하도록 셰이더에게 알려줍니다.
gl.uniform1i(textureLocation, 0);
```

기본적인 반사 효과 결과는 아래와 같습니다.

{{{example url="../webgl-environment-map.html" }}}

다음으로 [큐브맵을 스카이박스로 사용하는 방법](webgl-skybox.html)에 대해 보여드리겠습니다.


