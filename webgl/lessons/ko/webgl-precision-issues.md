Title: WebGL2 정밀도 문제
Description: WebGL2의 정밀도 문제
TOC: 정밀도 문제

이 글은 WebGL2의 다양한 정밀도 이슈에 관한 겁니다.

## `lowp`, `mediump`, `highp`

이 사이트의 [첫 번째 글](webgl-fundamentals.html)에서 우린 vertex shader와 fragment shader를 만들었습니다.
Fragment shader를 만들 때 지나가는 말로 fragment shader는 기본 정밀도를 가지지 않으므로 한 줄을 추가해서 설정해야 한다고 언급했었는데

```glsl
precision highp float;
```

도대체 무슨 소리일까요?

`lowp`, `mediump`, `highp`는 정밀도 설정입니다.
이 경우 정밀도는 값을 저장하는데 얼마나 많은 bit가 사용되는지를 의미하는데요.
javascript에서 숫자의 경우 64bit를 사용합니다.
WebGL에서 대부분의 숫자는 32bit에 불과한데요.
더 적은 bit = 더 빠름, 더 많은 bit = 더 정확하고 더 넓은 범위입니다.

이걸 잘 설명할 수 있을지 모르겠습니다.
정밀도 이슈의 다른 예시로 [double vs float](https://www.google.com/search?q=double+vs+float)를 찾아볼 수도 있지만 이를 설명하는 한 가지 방법은 byte와 short 또는 javascript의 `Uint8Array` vs `Uint16Array`의 차이와 같다는 겁니다.

* `Uint8Array`는 unsigned 8bit integer 배열입니다. 8bit는 0에서 255까지 2<sup>8</sup>개의 값을 포함할 수 있습니다.
* `Uint16Array`는 unsigned 16bit integer 배열입니다. 16bit는 0에서 65535까지 2<sup>16</sup>개의 값을 포함할 수 있습니다.
* `Uint32Array`는 unsigned 32bit integer 배열입니다. 32bit는 0에서 4294967295까지 2<sup>32</sup>개의 값을 포함할 수 있습니다.

`lowp`, `mediump`, `highp`도 비슷합니다.

* `lowp`는 최소 9bit 값입니다. 부동 소수점 값의 범위: -2 ~ +2, 정수 값의 경우 `Uint8Array`나 `Int8Array`와 유사
* `mediump`는 최소 16bit 값입니다. 부동 소수점 값의 범위: -2<sup>14</sup> ~ +2<sup>14</sup>, 정수 값의 경우 `Uint16Array`나 `Int16Array`와 유사
* `highp`는 최소 16bit 값입니다. 부동 소수점 값의 범위: -2<sup>62</sup> ~ +2<sup>62</sup>, 정수 값의 경우 `Uint32Array`나 `Int32Array`와 유사

범위 내의 모든 값을 표현할 수 있는 것은 아니라는 점에 유의해야 합니다.
아마 가장 이해하기 쉬운 건 `lowp`일 겁니다.
9bit 밖에 없으므로 512개의 고유 값만을 표현할 수 있습니다.
위에서 범위가 -2에서 +2라고 말했는데 -2와 +2사이에는 무한한 숫자 값들이 있는데요.
예를 들어 1.9999999와 1.999998는 -2와 +2사이에 있는 2개의 값이죠.
9bit만으로 `lowp`는 이 두 값을 표현할 수 없습니다.
그래서 예를 들어, 색상에 대한 계산을 위해 `lowp`를 사용한다면 밴딩이 나타날 수 있는데요.
실제로 어떤 값이 표현될 수 있는지 알아보지 않아도, 색상이 0에서 1사이인 걸 알고 있습니다.
`lowp`가 -2에서 +2고 512개의 고유값만 표현할 수 있다면 128개의 값만이 0에서 1사이에 맞는 것 같습니다.
또한 4/128을 가지고 있고 1/512를 더하려고 한다면, 1/512는 `lowp`로 표현될 수 없기 때문에 사실상 0이므로 아무일도 일어나지 않을 겁니다.

We could just use `highp` everywhere and ignore this issue completely
but on devices that do actually use 9 bits for `lowp` and/or 16bits for
`mediump` they are usually faster than `highp`. Often significantly faster.

마지막으로, `Uint8Array`나 `Uint16Array`와 같은 값과 달리, `lowp` 또는 `mediump` 값이나 심지어 `highp` 값도 더 높은 정밀도(더 많은 bit)를 사용할 수 있습니다.
예를 들어 데스크탑 GPU에서 shader에 `mediump`를 넣었다면 아직 내부적으로 32bit를 사용할 가능성이 높은데요.
This has the problem of making it hard to test your shaders if you use `lowp` or `mediump`.
실제로 shader가 `lowp`나 `mediump`와 함께 올바르게 작동하는지 보기 위해서는 실제로 `lowp`에 8bit를 쓰고 `highp`에 16bit를 쓰는 기기에서 테스트해야 합니다.

If you do want to try to use `mediump` for speed here are some of the issues
that come up.

A good example is probably the example of [point lights](webgl-3d-lighting-point.html),
in particular the specular highlight calculation, passes values in world or view space to the fragment shader,
those values can easily get out of range for a `mediump` value. So, maybe on
a `mediump` device you could just leave out the specular highlights. For example here
is the point light shader from [the article on point lights](webgl-3d-lighting-point.html)
modified to for `mediump`.

```glsl
#version 300 es

-precision highp float;
+precision mediump float;

// Passed in and varied from the vertex shader.
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a uint vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

  // compute the light by taking the dot product
  // of the normal to the light's reverse direction
  float light = dot(normal, surfaceToLightDirection);
-  float specular = 0.0;
-  if (light > 0.0) {
-    specular = pow(dot(normal, halfVector), u_shininess);
-  }

  outColor = u_color;

  // Lets multiply just the color portion (not the alpha)
  // by the light
  outColor.rgb *= light;

-  // Just add in the specular
-  outColor.rgb += specular;
}
```

Note: Even that is not really enough. In the vertex shader we have

```glsl
  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
```

So let's say the light is 1000 units away from the surface.
We then get to the fragment shader and this line

```glsl
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
```

seems innocent enough. Except that the normal way to normalize vector
is to divide by its length and the normal way to compute a length is

```
  float length = sqrt(v.x * v.x + v.y * v.y * v.z * v.z);
```

If one of those x, y, or z is 1000 then 1000*1000 is 1000000. 1000000
is out of range for `mediump`.

One solution here is to normalize in the vertex shader.

```
  // compute the vector of the surface to the light
  // and pass it to the fragment shader
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+  v_surfaceToLight = normalize(u_lightWorldPosition - surfaceWorldPosition);
```

Now the values assigned to `v_surfaceToLight` are between -1 and +1 which
is in range for `mediump`.

Note that normalizing in the vertex shader will not actually give the
same results but they might be close enough that no one will notice
unless compared side by side.

Functions like `normalize`, `length`, `distance`, `dot` all have this
issue that if the values are too large they're going to go out of range
for `mediump`.

But, you actually be to test on a device for which `mediump` is 16 bits.
On desktop `mediump` is 32bits, the same as `highp` and so any issues
will not be visible.

## Detecting support for 16bit `mediump`

You call `gl.getShaderPrecisionFormat`,
you pass in the shader type, `VERTEX_SHADER` or `FRAGMENT_SHADER` and you
pass in one of `LOW_FLOAT`, `MEDIUM_FLOAT`, `HIGH_FLOAT`,
`LOW_INT`, `MEDIUM_INT`, `HIGH_INT`, and it
[returns the precision info].

{{{example url="../webgl-precision-lowp-mediump-highp.html"}}}

`gl.getShaderPrecisionFormat` returns a object with three values, `precision`, `rangeMin`, and `rangeMax`.

For `LOW_FLOAT` and `MEDIUM_FLOAT` `precision` will 23 if they are really
just `highp`. Otherwise they'll likely be 8 and 15 respectively or
at least they will be less than 23. For `LOW_INT` and `MEDIUM_INT`
if they're the same as `highp` then `rangeMin` will be 31. If they're
less than 31 then a `mediump int` is actually more efficient than a
`highp int` for example.

My Pixel 2 XL uses 16 bits for `mediump` it also uses 16 bits for `lowp`. I'm not sure I've ever used a device that uses 9 bits for `lowp` so I'm not sure what issues commonly come up if any.

Throughout these articles we've specified a default precision
in the fragment shader. We can also specify the precision of any individual
variable. For example

```glsl
uniform mediump vec4 color;  // a uniform
in lowp vec4 normal;         // an attribute or varying input
out lowp vec4 texcoord;      // a fragment shader output or varying output
lowp float foo;              // a variable
```

## Texture Formats

텍스처는 명세서에서 실제 사용된 정밀도는 요청된 정밀도보다 더 클 수 있다고 말하는 또 다른 것입니다.

예를 들어 다음과 같이 채널당 4bit씩, 16bit 텍스처를 요청할 수 있는데

```
gl.texImage2D(
  gl.TEXTURE_2D,               // 대상
  0,                           // mip 레벨
  gl.RGBA4,                    // 내부 format
  width,                       // 너비
  height,                      // 높이
  0,                           // border
  gl.RGBA,                     // format
  gl.UNSIGNED_SHORT_4_4_4_4,   // type
  null,
);
```

하지만 구현은 실제로 더 높은 해상도를 내부적으로 사용할 수 있습니다.
대부분의 데스크탑이 이걸 수행하고 대부분의 모바일 GPU는 하지 않는다고 알고 있습니다.

테스트할 수 있는데요.
먼저 위처럼 채널당 4bit인 텍스처를 요청할 겁니다.
그런 다음 0대 1의 gradient로 [렌더링](webgl-render-to-texture.html)할 겁니다.

다음으로 해당 텍스처를 캔버스에 렌더링할 건데요.
텍스처가 내부적으로 채널당 4bit라면 그려진 그래디언트에 16단계의 색상만 있을 겁니다.
텍스처가 실제로 채널당 8bit라면 256단계의 색상을 보게 될 겁니다.

{{{example url="../webgl-precision-textures.html"}}}

제 스마트폰에서 실행하면 텍스처가 채널당 4bit를 사용(또는 다른 채널은 테스트하지 않았으므로 빨간색 한정 4bit)하고 있음을 알 수 있습니다.

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

반면에 데스크탑에서는 4개만 요청했지만 실제로는 채널당 8bit를 사용하는 걸 볼 수 있습니다.

<div class="webgl_center"><img src="resources/desktop-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

한 가지 주목할 점은 기본적으로 WebGL은 결과를 디더링하여 이와 같은 그라데이션을 더 부드럽게 만들 수 있다는 겁니다.
다음과 같이 디더링을 끌 수 있으며

```js
gl.disable(gl.DITHER);
```

디더링을 끄지 않는다면 스마트폰에서는 이런 게 나타납니다.

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

당장 생각나는 이게 실제로 일어나는 유일한 방법은 렌더링 대상으로 더 낮은 bit 해상도 format texture를 사용하고 실제로 텍스처가 그렇게 낮은 해상도의 장치에서 테스트하지 않았을 경우입니다.
데스크탑에서만 테스트했다면 이를 야기하는 이슈가 발생하지 않을 수 있습니다.

