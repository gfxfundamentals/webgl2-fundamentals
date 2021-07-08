Title: WebGL2 정밀도 이슈
Description: WebGL2의 정밀도 이슈
TOC: 정밀도 이슈

이 글은 WebGL2의 몇가지 정밀도 이슈에 관한 글입니다.

## `lowp`, `mediump`, `highp`

이 사이트의 [첫 번째 글](webgl-fundamentals.html)에서 우린 정점 셰이더와 프래그먼트 셰이더를 만들었습니다.
프래그먼트 셰이더를 만들 때 지나가는 말로 프래그먼트 셰이더는 기본 정밀도를 가지지 않으므로 아래와 같은 코드를 추가해서 설정해야 한다고 언급했었습니다.

```glsl
precision highp float;
```

이건 도대체 무슨 의미일까요?

`lowp`, `mediump`, `highp`는 정밀도 설정입니다.
이 경우 정밀도는 값을 저장하는데 얼마나 많은 비트를 사용할지를 의미합니다.
자바스크립트에서 숫자의 경우 64비트를 사용합니다.
WebGL에서 대부분의 숫자는 32비트만을 사용합니다.
더 적은 bit = 더 빠름, 더 많은 bit = 더 정확하고 더 넓은 범위입니다.

이걸 잘 설명할 수 있을지 모르겠습니다.
정밀도 이슈의 다른 예시로 [double vs float](https://www.google.com/search?q=double+vs+float)를 검색해 보셔도 되지만 
이를 설명하는 한 가지 방법을 이야기해보자면 byte와 short 또는 자바스크립트의 `Uint8Array` 와 `Uint16Array`의 차이와 같다는 겁니다.

* `Uint8Array`는 unsigned 8bit integer 배열입니다. 8bit는 0에서 255까지 2<sup>8</sup>개의 값을 저장할 수 있습니다.
* `Uint16Array`는 unsigned 16bit integer 배열입니다. 16bit는 0에서 65535까지 2<sup>16</sup>개의 값을 저장할 수 있습니다.
* `Uint32Array`는 unsigned 32bit integer 배열입니다. 32bit는 0에서 4294967295까지 2<sup>32</sup>개의 값을 저장할 수 있습니다.

`lowp`, `mediump`, `highp`도 비슷합니다.

* `lowp`는 최소 9bit 값입니다. 부동 소수점 값의 범위로는 -2 ~ +2, 정수 값의 경우 `Uint8Array`나 `Int8Array`와 유사합니다.
* `mediump`는 최소 16bit 값입니다. 부동 소수점 값의 범위로는 -2<sup>14</sup> ~ +2<sup>14</sup>, 정수 값의 경우 `Uint16Array`나 `Int16Array`와 유사합니다.
* `highp`는 최소 16bit 값입니다. 부동 소수점 값의 범위로는 -2<sup>62</sup> ~ +2<sup>62</sup>, 정수 값의 경우 `Uint32Array`나 `Int32Array`와 유사합니다.

범위 내의 모든 값을 표현할 수 있는 것은 아니라는 점에 유의해야 합니다.
아마 가장 이해하기 쉬운 건 `lowp`일 겁니다.
9비트 밖에 없으므로 512개의 고유 값만을 표현할 수 있습니다.
위에서 범위가 -2에서 +2라고 말했는데 -2와 +2사이에는 무한한 값들이 있습니다.
예를 들어 1.9999999와 1.999998는 -2와 +2사이에 있는 2개의 값이죠.
9비트인 `lowp`는 이 두 값을 표현할 수 없습니다.
그래서 예를 들어, 색상에 대한 계산을 위해 `lowp`를 사용한다면 밴딩(banding) 현상이 나타날 수 있습니다.
실제로 어떤 값이 표현될 수 있는지 알아보지 않아도, 색상이 0에서 1사이인 걸 알고 있습니다.
`lowp`가 -2에서 +2고 512개의 고유값만 표현할 수 있다면 128개의 값만이 0에서 1사이에 들어있을 것 같습니다.
그 말은 여러분이 4/128값을 가지고 있는데 거기에 1/512를 더하려고 한다면, 1/512는 `lowp`로 표현될 수 없기 때문에 사실상 0이므로 아무일도 일어나지 않을 것이라는 겁니다.

모든 코드에 `highp`를 사용하고 이 문제를 그냥 무시할 수도 있겠지만 
실제 사용되는 장치에서는 `lowp`로 9비트만 사용하는 경우 또는 `mediump`로 16비트만 사용하는 경우가
`highp`를 사용하는 경우보다 빠릅니다. 대개 눈에 띄일 정도로 빠릅니다.

마지막으로 알아두셔야 할 것은 `Uint8Array`나 `Uint16Array`와는 다르게, `lowp` 또는 `mediump`, 심지어 `highp`도 더 높은 정밀도(더 많은 비트)를 사용하는 경우가 있습니다.
예를 들어 데스크탑 GPU에서 여러분이 셰이더에 `mediump`를 설정했다고 하더라도 내부적으로는 32비트를 사용할 가능성이 높습니다.
그래서 `lowp`나 `mediump`를 사용하는 셰이더를 테스트하는데 문제가 발생하기도 합니다.
여러분의 셰이더가 실제로 `lowp`나 `mediump`인 경우에도 올바르게 작동하는지 보기 위해서는 
실제로 `lowp`에 8비트를 사용하고 `highp`에 16비트를 사용하는 기기에서 테스트를 하셔야 합니다.

성능을 위해 `mediump`를 사용하고 싶으시다면 아래는 몇 가지 발생할 수 있는 이슈를 소개해 드립니다.

좋은 예시 중 하나는 아마 [점 조명](webgl-3d-lighting-point.html)일건데,
특히 반사 하이라트 계산에서 월드 공간 또는 뷰 공간 값을 프래그먼트 셰이더로 넘기는 과정에서
값이 `mediump`의 표현 범위 밖으로 벗어날 수 있습니다.
그래서 `mediump` 장치에서 는 반사 하이하리트를 그냥 계산하지 않는것이 좋을수도 있습니다.
예를들어 아래는 [점 조명에 관한 글](webgl-3d-lighting-point.html)의 셰이더를 `mediump`로 수정한 코드입니다.

```glsl
#version 300 es

-precision highp float;
+precision mediump float;

// 정점 셰이더에서 보간되어 넘어온 값.
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;

// 프래그먼트 셰이더에서는 출력을 선언해야 합니다.
out vec4 outColor;

void main() {
  // v_normal은 varying으로, 보간된 값이기 때문에
  // 단위 벡터가 아닐 수 있습니다.
  // 다시 정규화하면 단위 벡터가 됩니다.
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

  // 법선과 조명 벡터의 반대 방향 벡터를 내적하여
  // 조명 효과를 계산합니다.
  float light = dot(normal, surfaceToLightDirection);
-  float specular = 0.0;
-  if (light > 0.0) {
-    specular = pow(dot(normal, halfVector), u_shininess);
-  }

  outColor = u_color;

  // (알파값을 제외한) 색상값 부분을 조명 효과와 곱합니다.
  outColor.rgb *= light;

-  // 반사 효과를 더합니다.
-  outColor.rgb += specular;
}
```

주의: 위와 같은 수정으로는 충분하지 않습니다. 정점 셰이더에 아래와 같은 코드가 있습니다.

```glsl
  // 표면에서 조명을 향하는 벡터를 계산하고
  // 프래그먼트 셰이더로 그 값을 넘깁니다.
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
```

예를 들어 조명이 표면에서 1000만큼 떨어져 있다고 해 봅시다.
그리고 나서 프래그먼트 셰이더 코드를 보면 아래와 같습니다.

```glsl
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
```

괜찮아 보이네요. 그런데 벡터를 정규화하는 일반적인 방법은 벡터를 그 길이로 나누는 것이고 
일반적으로 길이를 계산하는 방법은 아래와 같습니다.

```
  float length = sqrt(v.x * v.x + v.y * v.y * v.z * v.z);
```

만일 x, y, z값중에 하나가 1000이라면 1000*1000은 1000000입니다.
1000000은 `mediump`의 범위를 벗어납니다.

해결 방법 중 하나는 정점 셰이더에서 정규화 하는 것입니다.

```
  // 표면에서 조명을 향하는 벡터를 계산하고
  // 프래그먼트 셰이더로 그 값을 넘깁니다.
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+  v_surfaceToLight = normalize(u_lightWorldPosition - surfaceWorldPosition);
```

이제 `v_surfaceToLight`에 대입된 값은 -1과 +1 사이이므로 `mediump` 범위 안에 들어옵니다.

참고로 정점 셰이더에서의 정규화를 하면 결과가 완전히 동일하지는 않습니다.
그래도 충분히 비슷하기 때문에 옆에 놓고 비교하지 않는다면 차이점을 알아볼 수 없을 정도입니다.

`normalize`, `length`, `distance`, `dot`과 같은 함수들은 모두 비슷한 이슈를 가지고 있어서 
값이 너무 크다면 `mediump`의 범위를 벗어나게 됩니다.

하지만 여러분은 실제로 `mediump`가 16비트로 설정된 기기에서 테스트를 하셔야 합니다.
데스크탑에서는 `mediump`가 32비트여서 `highp`와 같기 때문에 이러한 문제가 나타나지 않을겁니다.

## 16비트 `mediump` 지원 여부 확인

`gl.getShaderPrecisionFormat`를 호출하고, `VERTEX_SHADER` 또는 `FRAGMENT_SHADER`로 셰이더 타입을 넘겨주고,
`LOW_FLOAT`, `MEDIUM_FLOAT`, `HIGH_FLOAT`, `LOW_INT`, `MEDIUM_INT`, `HIGH_INT` 중 하나를 넘겨주면 
정밀도 정보를 반환해 줍니다.

{{{example url="../webgl-precision-lowp-mediump-highp.html"}}}

`gl.getShaderPrecisionFormat`은 세 개의 값으로 이루어진 객체를 반환합니다.
세 개의 값은 `precision`, `rangeMin`, `rangeMax`입니다.

`LOW_FLOAT`와 `MEDIUM_FLOAT`는 `highp`와 같은 경우 `precision`이 23입니다.
그렇지 않으면 8과 15이거나 최소한 23보다는 작을 겁니다.
`LOW_INT`과 `MEDIUM_INT`가 `highp`와 같으면 `rangeMin`이 31일겁니다.
31보다 작으면 예를들어 `mediump int`가 `highp int`보다 효율적입니다.

제 Pixel 2 XL장치에서는 `mediump`로 16비트를 사용하고 `lowp`에도 16비트를 사용합니다.
`lowp`에 9비트를 사용하는 기기를 사용해 본 적이 없어서 보통 어떤식으로 문제가 발생하는지는 잘 모르겠습니다.

모든 글에서 전체적으로 기본 정밀도는 프래그맨트 셰이더에서 선언해 주었습니다.
개별 변수에 대한 정밀도를 명시해 주는 것도 가능합니다. 예를 들어

```glsl
uniform mediump vec4 color;  // uniform
in lowp vec4 normal;         // attribute 또는 varying 입력
out lowp vec4 texcoord;      // 프래그먼트 셰이더 출력 또는 varying 출력
lowp float foo;              // 변수
```

## 텍스처 포맷

텍스처 또한 명세에 말하길 실제 사용되는 정밀도가 명시된 요구 정밀도보다 더 클 수 있는 또다른 예시입니다.

예를 들어 다음과 같이 채널당 4비트씩, 총 16비트 텍스처를 생성할 수 있습니다.

```
gl.texImage2D(
  gl.TEXTURE_2D,               // 대상
  0,                           // 밉맵 레벨
  gl.RGBA4,                    // 내부 포맷
  width,                       // 너비
  height,                      // 높이
  0,                           // 가장자리
  gl.RGBA,                     // 포맷
  gl.UNSIGNED_SHORT_4_4_4_4,   // 타입
  null,
);
```

하지만 실제 구현상에서는 내부적으로 더 높은 해상도를 사용할 수 있습니다.
제 생각에 대부분의 데스크탑에서는 이렇게 더 높은 해상도를 사용하고 대부분의 모바일 GPU에서는 그렇지 않을 겁니다.

테스트해 볼 수 있습니다.
먼저 위처럼 채널당 4비트인 텍스처를 요청할 겁니다.
그런 다음 0에서 1로 그라데이션되는 [렌더링](webgl-render-to-texture.html)할 겁니다.

다음으로 해당 텍스처를 캔버스에 렌더링합니다.
텍스처가 내부적으로 채널당 4비트를 사용한다면 우리가 그리는 그라데이션에는 16단계의 색상만 있을 겁니다.
텍스처가 채널당 8비트라면 256단계의 색상을 보게 될 겁니다.

{{{example url="../webgl-precision-textures.html"}}}

제 스마트폰에서 실행하면 텍스처가 채널당 4비트를 사용(또는 다른 채널은 테스트하지 않았으므로 최소한 Red 채널의 경우 4비트)하고 있음을 알 수 있습니다.

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

반면에 데스크탑에서는 4비트를 사용하려 했지만 실제로는 채널당 8비트를 사용하는 걸 볼 수 있습니다.

<div class="webgl_center"><img src="resources/desktop-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

한 가지 주목할 점은 기본적으로 WebGL은 결과를 디더링하여 이와 같은 그라데이션이 더 부드럽게 보이도록 처리한다는 것입니다.
아래 코드로 디더링을 끌 수 있습니다.

```js
gl.disable(gl.DITHER);
```

디더링을 끄지 않는다면 스마트폰에서는 아래와 같은 결과가 나타납니다.

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

이러한 것이 실제로 문제가 되는 경우는 렌더링 타겟으로 낮은 비트 해상도의 텍스처 포맷을 설정하고,
실제로 그렇게 낮은 비트를 사용하는 장치에서 테스트 해 보지 않는 경우입니다.
데스크탑에서만 테스트했다면 이러한 문제는 발견하기 어려울 겁니다.
