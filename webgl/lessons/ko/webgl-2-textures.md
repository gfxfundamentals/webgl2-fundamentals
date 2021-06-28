Title: WebGL2 두개 이상의 텍스처 사용하기
Description: WebGL에서 두개 이상의 텍스처를 사용하는 방법
TOC: 두개 이상의 텍스처 사용하기


이 글은 [WebGL 이미지 처리](webgl-image-processing.html)에서 이어지는 글입니다.
아직 읽지 않으셨다면 먼저 [이 글부터](webgl-image-processing.html) 읽으시길 추천 드립니다.

이제 이 질문에 대답할 때가 된 것 같습니다. "두개 이상의 텍스처를 사용하려면 어떻게 해야하죠?"

꽤 간단합니다. [이미지 하나를 그리는 첫 번째 셰이더](webgl-image-processing.html)로 돌아가서, 
두 개의 이미지를 사용하도록 수정해 보겠습니다.

우선 해야 할 것은 코드를 수정해서 이미지 두개를 로딩하도록 하는 것입니다.
WebGL코드는 아니고 HTML5 자바스크립트 코드지만 이 부분도 처리해 주어야 합니다.
이미지는 비동기적으로 로드되는데, 웹 프로그래밍의 초보자이시라면 익숙해 지셔야 할 겁니다.

처리하는 방법에는 두가지가 있습니다.
텍스처가 없는 상태로 실행되다가 텍스처가 로드되면 업데이트하도록 구성할 수 있습니다.
이 방법은 뒤쪽 글에서 다루어보도록 하겠습니다.

여기서는 무언가를 그리기 전에 모든 이미지 로딩이 완료되길 기다리도록 할 겁니다.

먼저 이미지를 로딩하는 코드를 함수로 만들겠습니다. 간단합니다.
이 함수는 새로운 `Image` 객체를 만들고, 로딩할 URL을 설정하고, 로딩이 완료되면 호출할 콜백을 설정합니다.

```js
function loadImage (url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
```

이제 URL 배열을 가지고 이미지들을 로딩하고 이미지 배열을 생성하는 코드를 만들어 봅시다.
`imagesToLoad`를 우리가 로딩할 이미지의 개수로 설정합니다.
그리고 `loadImage`에 전달하는 콜백마다 `imagesToLoad`를 감소하도록 합니다.
`imagesToLoad`가 0이 되면 모든 이미지가 로딩된 것이고 이미지 배열을 콜백에 전달하도록 합니다.

```js
function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // 이미지 로딩이 완료될 때마다 호출됩니다.
  var onImageLoad = function() {
    --imagesToLoad;
    // 모든 이미지 로딩이 완료되면 콜백을 호출합니다.
    if (imagesToLoad === 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}
```

이제 loadImages를 아래와 같이 호출합니다.

```js
function main() {
  loadImages([
    "resources/leaves.jpg",
    "resources/star.jpg",
  ], render);
}
```

다음으로 셰이더가 2개의 텍스처를 사용하도록 수정합니다.
예제에서는 하나의 텍스처를 다른 텍스처에 곱하도록 할 겁니다.

```
#version 300 es
precision highp float;

// 텍스처
*uniform sampler2D u_image0;
*uniform sampler2D u_image1;

// 정점 셰이더에서 넘어온 텍스처 좌표.
in vec2 v_texCoord;

// 프래그먼트 셰이더는 출력을 선언해 주어야 합니다.
out vec2 outColor;

void main() {
*   vec4 color0 = texture2D(u_image0, v_texCoord);
*   vec4 color1 = texture2D(u_image1, v_texCoord);
*   outColor = color0 * color1;
}
```

두 개의 WebGL 텍스처를 만들어야 합니다.

```js
  // 텍스처 두 개를 만듭니다.
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 밉맵을 사용하지 않는 파라메터를 설정합니다.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // 이미지를 텍스처로 업로드합니다.
    var mipLevel = 0;               // 가장 큰 밉맵
    var internalFormat = gl.RGBA;   // 텍스처 포맷
    var srcFormat = gl.RGBA;        // 데이터 포맷
    var srcType = gl.UNSIGNED_BYTE; // 데이터 타입
    gl.texImage2D(gl.TEXTURE_2D,
                  mipLevel,
                  internalFormat,
                  srcFormat,
                  srcType,
                  images[ii]);

    // 텍스처를 텍스처 배열에 추가합니다.
    textures.push(texture);
  }
```

WebGL에는 "텍스처 유닛"이라는 것이 있습니다. 텍스처에 대한 참조의 배열이라고 생각하시면 됩니다.
각 샘플러에 대해 어떤 텍스처 유닛을 사용할지를 알려주어야 합니다.

```js
  // 샘플러 위치른 찾습니다.
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  ...

  // 렌더링에 어떤 텍스처 유닛을 사용할지른 설정합니다.
  gl.uniform1i(u_image0Location, 0);  // 텍스처 유닛 0
  gl.uniform1i(u_image1Location, 1);  // 텍스처 유닛 1
```

그리고 각각의 텍스처 유닛에 텍스처를 바인딩해 주어야 합니다.

```js
  // 텍스처 유닛에 사용할 텍스처를 설정합니다.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

우리가 로딩할 두개의 이미지는 아래와 같습니다.

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; }</style>
<div class="glocal-center"><table class="glocal-center-content"><tr><td><img src="../resources/leaves.jpg" /> <img src="../resources/star.jpg" /></td></tr></table></div>

아래는 WebGL에서 두 개의 이미지를 곱한 결과입니다.

{{{example url="../webgl-2-textures.html" }}}

몇 가지 설명드려야 할 것이 있습니다.

텍스처 유닛에 대해 쉽게 생각해 보자면 다음과 같습니다: 
모든 텍스처 관련 함수는 "활성화된(active) 텍스처 유닛"에 적용됩니다.
"활성화된 텍스처 유닛"이란 단순히 여러분이 작업하고자 하는 텍스처 유닛의 인덱스인 전역 변수입니다.
WebGL의 텍스처 유닛은 네 개의 타겟이 있습니다.
TEXTURE_2D, TEXTURE_3D, TEXTURE_2D_ARRAY, TEXTURE_CUBE_MAP 입니다.
각 텍스처 함수는 현재 활성화된 텍스처 유닛의 명시된 타겟에 대해 동작합니다.
만일 WebGL을 자바스크립트를 활용해 구현한다면 아래와 같을겁니다.

```js
var getContext = function() {
  var textureUnits = [
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, TEXTURE_CUBE_MAP: null, },
  ];
  var activeTextureUnit = 0;

  var activeTexture = function(unit) {
    // 유닛 열거자를 인덱스로 변환합니다.
    var index = unit - gl.TEXTURE0;
    // 활성화된 텍스처 유닛을 설정합니다.
    activeTextureUnit = index;
  };

  var bindTexture = function(target, texture) {
    // 활성화된 텍스처 유닛의 타겟에 텍스처를 설정합니다.
    textureUnits[activeTextureUnit][target] = texture;
  };

  var texImage2D = function(target, ...args) {
    // 현재 텍스처 유닛의 활성화된 텍스처에 texImage2D를 호출합니다.
    var texture = textureUnits[activeTextureUnit][target];
    texture.image2D(...args);
  };

  var texImage3D = function(target, ...args) {
    // 현재 텍스처 유닛의 활성화된 텍스처에 texImage3D를 호출합니다.
    var texture = textureUnits[activeTextureUnit][target];
    texture.image3D(...args);
  };

  // WebGL API를 반환합니다.
  return {
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    texImage2D: texImage2D,
    texImage3D: texImage3D,
  };
};
```

셰이더는 텍스처 유닛의 인덱스를 받습니다. 아래 두 줄의 코드의 의미가 명확해지셨길 바랍니다.

```js
  gl.uniform1i(u_image0Location, 0);  // 텍스처 유닛 0
  gl.uniform1i(u_image1Location, 1);  // 텍스처 유닛 1
```

하나 주의하셔야 할 것은, 유니폼을 설정할 때에는 텍스처 유닛의 인덱스를 사용하지만 
gl.activeTexture를 호출할 때에는 gl.TEXTURE0, gl.TEXTURE1과 같은 특수한 상수를 사용해야 한다는 것입니다.
다행히 상수들은 연속된 숫자이므로 아래와 같이 하는 대신,

```js
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

이렇게 할 수 있습니다.

```js
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

아니면 이렇게도 가능합니다.

```js
  for (var ii = 0; ii < 2; ++ii) {
    gl.activeTexture(gl.TEXTURE0 + ii);
    gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
  }
```

이 짧은 설명으로, 한 번의 WebGL 호출로 여러 텍스처를 그리는데에 도움이 되었기를 바랍니다. 


