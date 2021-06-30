Title: WebGL2 큐브맵(Cubemap)
Description: WebGL에서 큐브맵을 사용하는 방법
TOC: 큐브맵


이 글은 WebGL2 시리즈의 글입니다.
[첫 번째 글은 WebGL 기초 입니다](webgl-fundamentals.html).
이 글은 [텍스처에서 이어지는 글입니다](webgl-3d-textures.html).
이 글에서는 또한 [조명 효과](webgl-3d-lighting-directional.html)에서 설명한 개념이 사용됩니다.
위 글들을 아직 읽지 않았다면 먼저 읽고 오시는 것이 좋습니다.

[이전 글](webgl-3d-textures.html)에서 텍스처를 사용하는 방법과,
텍스처가 어떻게 0과 1 사이의 값인 텍스처 좌표를 통해 참조되는지, 
그리고 밉맵을 사용해 텍스처가 어떻게 필터링되는지를 알아 보았습니다.

*큐브맵*이라는 텍스처 종류도 있습니다. 
이 텍스처는 육면체의 6개 면을 표현하는 면들로 구성되어 있습니다.
일반적인 2개의 차원을 갖는 텍스처 좌표 대신, 큐브맵은 법선, 즉 3차원 방향을 사용합니다.
그 방향에 따라 법선은 육면체의 6개 면 중 하나가 선택되고 그 면의 픽셀이 색상으로 샘플링됩니다.

6개의 면은 육면체의 중심으로부터의 방향을 통해 참조됩니다.
6개의 면은 아래와 같습니다.

```js
gl.TEXTURE_CUBE_MAP_POSITIVE_X
gl.TEXTURE_CUBE_MAP_NEGATIVE_X
gl.TEXTURE_CUBE_MAP_POSITIVE_Y
gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
gl.TEXTURE_CUBE_MAP_POSITIVE_Z
gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
```

간단한 예제를 만들어 볼건데, 6개의 면에 사용될 이미지를 2D 캔버스를 사용해 만들겁니다.

아래는 배경색상과 가운데 표시되는 메시지로 캔버스를 채우는 코드입니다.

```js
function generateFace(ctx, faceColor, textColor, text) {
  const {width, height} = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}
```

아래는 6개의 이미지 생성을 위해 위 함수를 호출하는 코드입니다.

```js
// Get A 2D context
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // 결과를 표시
  ctx.canvas.toBlob((blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
});
```

{{{example url="../webgl-cubemap-faces.html" }}}

이제 이것들을 육면체에 적용해 봅시다.
[이전 글](webgl-3d-textures.html)의 텍스처 아틀라스 예제의 코드를 가져다 사용할 겁니다.

먼저 셰이더를 큐브맵을 사용하도록 수정합니다.

```glsl
#version 300 es

in vec4 a_position;

uniform mat4 u_matrix;

out vec3 v_normal;

void main() {
  // position에 행렬을 곱합니다.
  gl_Position = u_matrix * a_position;

  // 법선을 전달합니다.
  // position이 원점 근처에 있으므로 그냥 position을
  // 전달해 주면 됩니다.
  v_normal = normalize(a_position.xyz);
}
```

셰이더에서 텍스처 좌표는 제거했고 프래그먼트 셰이더로 법선을 전달하는 코드를 추가했습니다.
육면체의 위치가 정확히 원점이기 때문에 position을 그냥 법선으로 사용할 수 있습니다.

[조명 효과 관련 글](webgl-3d-lighting-directional.html)을 떠올려 보면 
법선은 방향 정보인데 주로 어떤 정점이 속한 표면의 방향이었습니다.
정규화(normalization)된 position을 법선으로 활용하고 있기 때문에 
이 물체에 조명 효과를 주게 되면 육면체 전반에 걸쳐 부드러운 조명 효과가 나타나게 됩니다.
일반적인 육면체에서는 각 면에 속한 정점에 대해 다른 법선을 할당해야 합니다.

{{{diagram url="resources/cube-normals.html" caption="standard cube normal vs this cube's normals" }}}

텍스처 좌표를 사용하지 않으므로 텍스처 좌표 관련한 코드는 모두 제거해도 됩니다.

프래그먼트 셰이더에서는 `sampler2D` 대신 `samplerCube`를 사용해야 하고,
`texture`함수에서 `samplerCube`를 사용할 때는 인자로 vec3 방향을 전달해야 하므로 
정규화된 법선을 전달해 줍니다.
법선이 varying이므로 보간될 것이고, 따라서 다시 정규화 해주어야 합니다.

```
#version 300 es

precision highp float;

// 정점 셰이더에서 넘어온 값.
in vec3 v_normal;

// 텍스처.
uniform samplerCube u_texture;

// 프래그먼트 셰이더는 출력을 선언해 주어야 합니다.
out vec4 outColor;

void main() {
   outColor = texture(u_texture, normalize(v_normal));
}
```

그리고 자바스크립트에서 텍스처를 설정해 주어야 합니다.

```js
// 텍스처를 설정해야 합니다.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

// 2D 컨텍스트를 얻어옵니다.
/** @type {Canvas2DRenderingContext} */
const ctx = document.createElement("canvas").getContext("2d");

ctx.canvas.width = 128;
ctx.canvas.height = 128;

const faceInfos = [
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, faceColor: '#F00', textColor: '#0FF', text: '+X' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, faceColor: '#FF0', textColor: '#00F', text: '-X' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, faceColor: '#0FF', textColor: '#F00', text: '-Y' },
  { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, faceColor: '#00F', textColor: '#FF0', text: '+Z' },
  { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
];
faceInfos.forEach((faceInfo) => {
  const {target, faceColor, textColor, text} = faceInfo;
  generateFace(ctx, faceColor, textColor, text);

  // 캔버스를 큐브맵의 면으로 업로드합니다.
  const level = 0;
  const internalFormat = gl.RGBA;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

위에서 주의하셔야 할 사항들은:

* `gl.TEXTURE_2D` 대신 `gl.TEXTURE_CUBE_MAP`를 사용하고 있습니다.

  이를 통해 WebGL은 2D 텍스처 대신 큐브맵을 만듭니다.

* 각 면을 업로드하기 위해 특수한 타겟 열거형을 사용합니다.

  `gl.TEXTURE_CUBE_MAP_POSITIVE_X`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_X`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Y`,
  `gl.TEXTURE_CUBE_MAP_POSITIVE_Z`, 
  `gl.TEXTURE_CUBE_MAP_NEGATIVE_Z`.

* 각 면은 정사각형입니다. 위 예제에서는 128x128 입니다.

  큐브맵은 정사각형 텍스처를 사용해야 합니다.
  또한 여기서는 밉맵을 생성하고 이 밉맵을 사용하도록 필터링을 설정했습니다.
  
결과적으로 보면,

{{{example url="../webgl-cubemap.html" }}}

큐브맵을 육면체를 위해 사용하는 것은 일반적인 큐브맵의 사용 목적이 **아닙니다**.
*올바른* 또는 일반적인 육면체의 텍스처링 방법은 [이전 글](webgl-3d-textures.html)과 같이 텍스처 아틀라스를 사용하는 것입니다.

이제 큐브맵이 무엇이고 어떻게 설정하는지 배웠는데 그러면 큐브맵은 어디에 사용해야 할까요?
아마 가장 흔한 사용 예제는 [*환경 맵*](webgl-environment-maps.html) 일겁니다.

