Title: WebGL2 3D 원근 교정 텍스처 매핑
Description: W의 특별한 점
TOC: 원근 교정 텍스처 매핑


이 포스트는 WebGL 관련 시리즈의 글입니다.
[WebGL2 기초](webgl-fundamentals.html)부터 시작했습니다.
이 글은 원근 교정 텍스처 매핑을 다룹니다.
이 내용을 이해하기 위해서는 [원근 투영](webgl-3d-perspective.html)과 [텍스처](webgl-3d-textures.html)에 대해 먼저 읽어보셔야 할겁니다.
또한 [varying과 그 기능](webgl-how-it-works.html)에 대해 알아야 하지만 이 글에서 간략하게 설명하겠습니다.

"[동작 원리](webgl-how-it-works.html)"에서 varying이 어떻게 작동하는지 말씀드렸습니다.
정점 셰이더에서는 varying을 선언하고 어떤 값을 설정할 수 있습니다.
정점 셰이더가 3번 호출되면 WebGL은 삼각형을 그립니다.
해당 삼각형을 그리는 동안 모든 픽셀에 대해 프래그먼트 셰이더를 호출해서 해당 픽셀을 어떤 색상으로 칠할 것인지를 결정합니다.
삼각형의 정점 세개 사이에서는 세개의 값이 보간된 varying이 전달됩니다.

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_color는 v0, v1, v2 사이에서 보간" }}}

[첫 번째 글](webgl-fundamentals.html)로 돌아가보면 우리는 클립 공간에서 삼각형을 그렸습니다.
다음과 같이 간단하게 작성한 정점 셰이더에, 클립 공간 좌표를 전달했습니다.

      #version 300 es

      // attribute (in)은 정점 셰이더의 입력입니다.
      // 버퍼로부터 데이터를 받습니다.
      in vec4 a_position;

      // 모든 셰이더는 main 함수를 가집니다.
      void main() {

        // gl_Position은 정점 셰이더가 값을 
        //설정해 주어야 하는 특별한 변수입니다.
        gl_Position = a_position;
      }

단색으로 그리는 간단한 프래그먼트 셰이더도 있었습니다.

      #version 300 es

      // 프래그먼트 셰이더는 기본 정밀도를 가지고 있지 않으므로 하나를 선택해야 합니다.
      // highp가 기본값으로 좋습니다.
      precision highp float;

      // 프래그먼트 셰이더에서는 출력을 선언해 주어야 합니다.
      out vec4 outColor;

      void main() {
        // 출력을 붉은 보라색 단색으로 설정합니다.
        outColor = vec4(1, 0, 0.5, 1);
      }

클립 공간에 두개의 사각형을 그리도록 만들어봅시다.
각 정점의 `X`, `Y`, `Z`, `W`인 데이터를 전달할 겁니다.

    var positions = [
      -.8, -.8, 0, 1,  // 첫번째 사각형의 첫번째 삼각형
       .8, -.8, 0, 1,
      -.8, -.2, 0, 1,
      -.8, -.2, 0, 1,  // 첫번째 사각형의 두번째 삼각형
       .8, -.8, 0, 1,
       .8, -.2, 0, 1,

      -.8,  .2, 0, 1,  // 두번째 사각형의 첫번째 삼각형
       .8,  .2, 0, 1,
      -.8,  .8, 0, 1,
      -.8,  .8, 0, 1,  // 두번째 사각형의 두번째 삼각형
       .8,  .2, 0, 1,
       .8,  .8, 0, 1,
    ];

아래는 그 결과입니다.

{{{example url="../webgl-clipspace-rectangles.html" }}}

Varying float 하나를 추가해봅시다.
해당 varying를 정점 셰이더에서 프래그먼트 셰이더로 바로 전달할 겁니다.

      #version 300 es

      in vec4 a_position;
    +  in float a_brightness;

    +  out float v_brightness;

      void main() {
        gl_Position = a_position;

    +    // 프래그먼트 셰이더로 밝기 전달
    +    v_brightness = a_brightness;
      }

프래그먼트 셰이더에서는 해당 varying을 색상을 설정하는 데 사용할 겁니다.

      #version 300 es

      precision highp float;

    +  // 정점 셰이더에서 전달되어 보간된 값.
    +  in float v_brightness;

       // 프래그먼트 셰이더에서는 출력을 선언해 주어야 합니다.
       out vec4 outColor;

      void main() {
    *    outColor = vec4(v_brightness, 0, 0, 1);  // 빨강
      }

Varying에 데이터를 제공해야 하므로 버퍼를 만들어 데이터를 넣을 겁니다.
정점 당 하나의 값입니다.
왼쪽의 정점은 0으로 오른쪽의 정점은 1로 밝기 값을 설정합니다.

```
  // 버퍼를 생성하고 12개의 밝기 값 넣기
  var brightnessBuffer = gl.createBuffer();

  // ARRAY_BUFFER에 바인딩 (ARRAY_BUFFER = brightnessBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  var brightness = [
    0,  // 첫번째 사각형의 첫번째 삼각형
    1, 
    0, 
    0,  // 첫번째 사각형의 두번째 삼각형
    1, 
    1, 

    0,  // 두번째 사각형의 첫번째 삼각형
    1, 
    0, 
    0,  // 두번째 사각형의 두번째 삼각형
    1, 
    1, 
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brightness), gl.STATIC_DRAW);
```

또한 초기화할 때 `a_brightness` attribute의 location을 찾아야 합니다.

```
  // 정점 데이터가 어디로 가야하는지 탐색
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
+  var brightnessAttributeLocation = gl.getAttribLocation(program, "a_brightness");  
```

그리고 렌더링할 때 해당 attribute를 설정합니다.

```
  // Attribute 활성화
  gl.enableVertexAttribArray(brightnessAttributeLocation);

  // 위치 버퍼 바인딩
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  // brightnessBuffer의 데이터를 가져오는 방법을 attribute에 알려줌 (ARRAY_BUFFER)
  var size = 1;          // iteration마다 1개의 컴포넌트
  var type = gl.FLOAT;   // 데이터는 32비트 부동소수점
  var normalize = false; // 데이터 정규화 안 함
  var stride = 0;        // 0 = 다음 위치를 가져오기 위해 iteration마다 size * sizeof(type) 만큼 앞으로 이동
  var offset = 0;        // 버퍼의 맨 앞부터 시작
  gl.vertexAttribPointer(
      brightnessAttributeLocation, size, type, normalize, stride, offset);
```

그리고 이제 렌더링하면 `brightness`가 0인 왼쪽은 검은색이고 `brightness`가 1인 오른쪽은 빨간색이며, 그 사이의 삼각형은 `brightness`가 보간된(varying된) 두 개의 직사각형을 볼 수 있습니다.

{{{example url="../webgl-clipspace-rectangles-with-varying.html" }}}

[원근에 관한 글](webgl-3d-perspective.html)에서 WebGL이 우리가 입력한 `gl_Position`을 가져와 `gl_Position.w`로 나눈다는 것을 알게 되었습니다.

위의 정점들에는 `W`에 `1`을 설정했지만 WebGL이 `W`로 나누는 걸 알고 있기 때문에 아래와 같이 해도 동일한 결과를 얻을 겁니다.

```
  var mult = 20;
  var positions = [
      -.8,  .8, 0, 1,  // 첫번째 사각형의 첫번째 삼각형
       .8,  .8, 0, 1,
      -.8,  .2, 0, 1,
      -.8,  .2, 0, 1,  // 첫번째 사각형의 두번째 삼각형
       .8,  .8, 0, 1,
       .8,  .2, 0, 1,

      -.8       , -.2       , 0,    1,  // 두번째 사각형의 첫번째 삼각형
       .8 * mult, -.2 * mult, 0, mult,
      -.8       , -.8       , 0,    1,
      -.8       , -.8       , 0,    1,  // 두번째 사각형의 두번째 삼각형
       .8 * mult, -.2 * mult, 0, mult,
       .8 * mult, -.8 * mult, 0, mult,
  ];
```

위 코드에서 두 번째 사각형의 오른쪽에 있는 모든 점에 대해 `X`와 `Y`에 `mult`를 곱한 것을 알 수 있지만, `W`를 `mult`로 설정하는 것도 볼 수 있습니다.
WebGL이 `W`로 나누기 때문에 똑같은 결과를 얻을 수 있겠죠?

음 여기 결과입니다.

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w.html" }}}

두 사각형은 이전과 동일한 위치에 그려졌다는 것에 주목하십시오.
이건 `X * MULT / MULT(W)`가 여전히 `X`이고 `Y`도 마찬가지라는 걸 증명합니다.
하지만 색상이 다릅니다.
무슨 일이 일어난 걸까요?

WebGL은 `W`를 사용하여 원근 교정 텍스처 매핑을 구현하거나 varying의 원근 교정 보간을 수행합니다.

더 쉽게 볼 수 있도록 프래그먼트 셰이더를 건드려봅시다.

    outColor = vec4(fract(v_brightness * 10.), 0, 0, 1);  // 빨강

`v_brightness`를 10으로 곱하면 값이 0에서 10사이가 됩니다.
`fract`는 소수 부분만 유지하므로 0에서 1사이, 0에서 1사이, 0에서 1사이값 10번이 됩니다.

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w-repeat.html" }}}

두 값의 선형 보간 공식은 아래와 같습니다.

     result = (1 - t) * a + t * b

여기서 `t`는 `a`와 `b`사이의 위치를 나타내는 0에서 1사이의 값입니다.
0일 때 `a`이고 1일때 `b`입니다.

그런데 Varying의 경우 WebGL은 아래 공식을 사용합니다.

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

여기서 `aW`는 varying이 `a`로 설정된 경우 `gl_Position.w`에 설정된 `W`이며, `bW` varying이 `b`로 설정된 경우 `gl_Position.w`에 설정된 `W`입니다.

그게 왜 중요할까요?
여기 [텍스처에 관한 글](webgl-3d-textures.html)에서 만들었던 간단한 텍스처 맵핑된 육면체가 있습니다.
모든 면에서 UV 좌표는 0에서 1 사이의 값이고 4x4 픽셀 텍스처를 사용하고 있습니다.

{{{example url="../webgl-perspective-correct-cube.html" }}}

이제 해당 예제를 가져와 정점 셰이더를 변경하여 우리가 직접 `W`로 나눠봅시다.
한 줄만 추가하면 됩니다.

```
#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix;

out vec2 v_texcoord;

void main() {
  // position에 행렬을 곱함
  gl_Position = u_matrix * a_position;

+  // 직접 W로 나누기
+  gl_Position /= gl_Position.w;

  // 프래그먼트 셰이더로 texcoord 전달
  v_texcoord = a_texcoord;
}
```

`W`로 나누면 `gl_Position.w`는 결국 1이 됩니다.
`X`, `Y`, `Z`는 WebGL이 나누기를 수행한 것과 동일한 값이 나올 겁니다.
아래는 그 결과입니다.

{{{example url="../webgl-non-perspective-correct-cube.html" }}}

여전히 3D 큐브를 얻게 되지만 텍스처가 뒤틀리고 있습니다.
이는 이전처럼 `W`를 전달하지 않으면 WebGL이 원근 교정 텍스처 매핑을 할 수 없기 때문입니다.
좀 더 정확하게는 WebGL이 varying의 원근 교정 보간을 수행할 수 없습니다.

[원근 투영 행렬](webgl-3d-perspective.html)에서 `Z`값이 `W`였던 걸 떠올려보면, `W`가 `1`인 경우 WebGL은 그냥 선형 보간을 수행하게 됩니다.
실제로 위의 수식을 가져와 봅시다.

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

그리고 모든 `W`를 1로 변경하면 아래와 같이 됩니다.

     result = (1 - t) * a / 1 + t * b / 1
              ---------------------------
                 (1 - t) / 1 + t / 1

1로 나누는 것은 아무 영향이 없으므로 이렇게 단순화할 수 있습니다.
                 
     result = (1 - t) * a + t * b
              -------------------
                 (1 - t) + t

`(1 - t) + t`는 `1`과 같습니다.
예를 들어 `t`가 `.7`이면, `(1 - .7) + .7`이 되고, 이건 `.3 + .7`이며, 이는 곧 `1`입니다.
즉 분모를 지울 수 있기 때문에 이렇게 남게 됩니다.

     result = (1 - t) * a + t * b

이는 위의 선형 보간 방정식과 동일합니다.

이제 왜 WebGL이 4x4 행렬과 `X`, `Y`, `Z`, `W` 4개의 값으로 구성된 벡터를 사용하는지 이해가 되셨으면 좋겠습니다.
`X`와 `Y`는 `W`로 나누어 클립공간 좌표를 얻습니다.
`W`로 나누는 `Z`도 클립공간의 `Z` 좌표가 됩니다. 하지만 `W`는 varying의 보간에도 사용되어 원근 교정 텍스처 매핑이 가능하도록 합니다.

<div class="webgl_bottombar">
<h3>1990년대 중반 게임 콘솔</h3>
<p>
PlayStation 1과 같은 시대의 일부 게임 콘솔들은 원근 교정 텍스처 매핑을 하지 않았습니다.
위 결과를 보면 왜 아래와 같이 보이는지 알 수 있습니다.
</p>
<div class="webgl_center"><img src="resources/ridge-racer-01.png" style="max-width: 500px;" /></div>
<p></p>
<div class="webgl_center"><img src="resources/ridge-racer-02.png" style="max-width: 500px;" /></div>
</div>
