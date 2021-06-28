Title: WebGL2 텍스처 유닛
Description: WebGL에서 텍스처 유닛이란 무엇인가요?
TOC: 텍스처 유닛


이 글은 WebGL에서 텍스처 유닛이 어떻게 동작하는지에 대한 개념을 설명하기 위해 쓰여졌습니다.
[attribute와 관련해서도 유사한 글이 있습니다](webgl-attributes.html).

이 글을 이해하기 위해 우선 [WebGL 동작 원리](webgl-how-it-works.html)와 [WebGL 셰이더와 GLSL] (webgl-shaders-and-glsl.html) 및 [WebGL 텍스처](webgl-3d-textures.html)를 읽으시는 것이 좋습니다.

## 텍스처 유닛

WebGL에는 텍스처라는 것이 있습니다. 텍스처란 셰이더에 넘길 수 있는 2D 배열 데이터입니다.
셰이더에서는 아래와 같이 *유니폼 샘플러*를 선언합니다.

```glsl
uniform sampler2D someTexture;
```

`someTexture`에 대해 어떤 텍스처를 사용할지는 셰이더가 어떻게 알 수 있을까요?

이 대목에서 텍스처 유닛이 등장합니다. 텍스처 유닛은 텍스처에 대한 참조를 가진 **전역 배열**입니다.
WebGL이 자바스크립트로 쓰여졌다면 아래와 같은 전역 상태(state)를 가지고 있을겁니다.

```js
const gl = {
  activeTextureUnit: 0,
  textureUnits: [
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY, null, },
  ];
}
```

`textureUnits`가 배열인 것을 보실 수 있을겁니다. 
여러분은 텍스처 유닛 배열 중 하나의 *바인드 포인트*에 텍스처를 할당하게 됩니다.
`ourTexture`를 텍스처 유닛 5에 할당해 봅시다.

```js
// 초기화 시점에
const ourTexture = gl.createTexture();
// 텍스처를 초기화하는 코드를 이 곳에 작성합니다.

...

// 렌더링 시점에
const indexOfTextureUnit = 5;
gl.activeTexture(gl.TEXTURE0 + indexOfTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, ourTexture);
```

그리고 셰이더에 여러분이 텍스처를 바인딩한 텍스처 유닛을 알려줍니다.

```js
gl.uniform1i(someTextureUniformLocation, indexOfTextureUnit);
```

WebGL 함수인 `activeTexture`와 `bindTexture`가 자바스크립트로 구현되었다면 아래와 같을겁니다.

```js
// PSEUDO CODE!!!
gl.activeTexture = function(unit) {
  gl.activeTextureUnit = unit - gl.TEXTURE0;  // 0부터 시작하는 인덱스로 변환
};

gl.bindTexture = function(target, texture) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  textureUnit[target] = texture;
}:
```

다른 텍스처 함수들이 동작하는 방식도 상상하실 수 있을겁니다.
모두 `gl.texImage2D(target, ...)`나 `gl.texParameteri(target)`처럼 `target`을 인자로 받습니다.
이는 아래와 같이 구현될 수 있을겁니다.

```js
// PSEUDO CODE!!!
gl.texImage2D = function(target, level, internalFormat, width, height, border, format, type, data) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture.mips[level] = convertDataToInternalFormat(internalFormat, width, height, format, type, data);
}

gl.texParameteri = function(target, pname, value) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture[pname] = value; 
}
```

위 예제 의사 코드(pseudo code)에서 볼 수 있는것처럼 `gl.activeTexture`는 텍스처 유닛의 배열의 인덱스르 WebGL의 내부 전역 변수에 설정합니다.
이후 모든 다른 텍스처 관련 함수들은 첫 번째 인자로 `target`을 인자로 받는데, 이는 현재 텍스처 유닛 바인드 포인트의 참조입니다.

## 텍스처 유닛의 최대값

WebGL은 최소 32개의 텍스처 유닛을 지원하게 구현하도록 되어 있습니다.
몇 개를 지원하는지 아래 코드를 사용해 알 수 있습니다.

```js
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

참고로 정점 셰이더와 프래그먼트 셰이더에서 지원하는 유닛의 개수는 다를 수 있습니다.
이는 아래 코드를 통해 알 수 있습니다.

```js
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
```

각각은 최소 16개를 지원하도록 되어 있습니다.

말하자면 아래와 같습니다.

```js
maxTextureUnits = 32
maxVertexShaderTextureUnits = 16
maxFragmentShaderTextureUnits = 32
```

즉, 여러분이 정점 셰이더에서 두 개의 텍스처 유닛을 사용하고 있다면 프래그먼트 셰이더에서 사용할 수 있는 최대 개수는 30개가 됩니다. 왜냐하면 총 최대값이 32이기 때문이죠.
