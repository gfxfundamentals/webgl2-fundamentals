Title: WebGL2 GPGPU
Description: How to do general computing with WebGL
TOC: GPGPU

GPGPU는 "일반 목적" GPU이고 이것은 픽셀을 그리는 것 외에 다른 용도로 사용하는 것을 의미합니다.

WebGL에서 GPGPU의 기본적인 컨셉은 텍스처가 이미지가 아닌 2D 배열이라는 것입니다.
[이 텍스쳐에 관한 글](webgl-3d-textures.html)에서 텍스처를 읽는 방법을 다루고,
[이 텍스처 랜더링에 대한 글](webgl-render-to-texture.html)에서 쓰는방법을 다뤘습니다.
즉 텍스쳐를 2D 배열의 값이라고 하면 2D 배열에서 읽고 쓰는 방법을 배웠다고 할 수 있습니다.
버퍼는 위치, 법선, 텍스처 좌표만이 아니라 무엇이든 될 수 있습니다. 예를 들어 속도, 질량, 주가 등이
될 수 있고 창의적으로 수학적 지식을 사용하는 것이 WebGL에서 GPGPU의 본질입니다.

## 우선 텍스쳐로 해봅시다.

자바스크립트에 있는 [`Array.p rototype.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) 함수는 앞 배열의 각 요소에 대하여 함수를 호출합니다.

```js
function multBy2(v) {
    return v * 2;
}

const src = [1, 2, 3, 4, 5, 6];
const dst = src.map(multBy2);

// dst is now [2, 4, 6, 8, 10, 12];
```

`multBy2`를 `gl.drawArrays` 나 `gl.drawElements`으로 셰이더에서 `map` 함수를 실행하는 것과 비슷하다고 생각할 수 있습니다.
하지만 약간의 차이가 있습니다.

## 셰이더는 배열을 생성하지 않습니다. 배열을 제공해야 합니다.

커스텀 map 함수를 만들어 자바스크립트에서 가상의 셰이더를 시뮬레이션해 봅시다.

```js
function multBy2(v) {
  return v * 2;
}

+function mapSrcToDst(src, fn, dst) {
+  for (let i = 0; i < src.length; ++i) {
+    dst[i] = fn(src[i]);
+  }
+}

const src = [1, 2, 3, 4, 5, 6];
-const dst = src.map(multBy2);
+const dst = new Array(6);    // WebGL에서 텍스처를 할당해야 하는 것을 시뮬레이션하기 위해
+mapSrcToDst(src, multBy2, dst);

// dst is now [2, 4, 6, 8, 10, 12];
```

## 셰이더는 out으로 설정한 변수를 내보내지 않습니다.

이것은 간단히 시뮬레이션 할 수 있습니다.

```js
+let outColor;

function multBy2(v) {
-  return v * 2;
+  outColor = v * 2;
}

function mapSrcToDst(src, fn, dst) {
  for (let i = 0; i < src.length; ++i) {
-    dst[i] = fn(src[i]);
+    fn(src[i]);
+    dst[i] = outColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // WebGL에서 텍스처를 할당해야 하는 것을 시뮬레이션하기 위해
mapSrcToDst(src, multBy2, dst);

// dst is now [2, 4, 6, 8, 10, 12];
```

## 셰이더는 원본 기반이 아니라 목적지 기반입니다.

다시말해, 셰이더는 목적지(픽셀)를 바꿔가며 여기에 어떤 값을 넣어야 하는지 묻습니다.

```js
let outColor;

function multBy2(src) {
-  outColor = v * 2;
+  return function(i) {
+    outColor = src[i] * 2;
+  }
}

-function mapSrcToDst(src, fn, dst) {
-  for (let i = 0; i < src.length; ++i) {
-    fn(src[i]);
+function mapDst(dst, fn) {
+  for (let i = 0; i < dst.length; ++i) {
+    fn(i);
    dst[i] = outColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // WebGL에서 텍스처를 할당해야 하는 것을 시뮬레이션하기 위해
mapDst(dst, multBy2(src));

// dst is now [2, 4, 6, 8, 10, 12];
```

## WebGL에서 값을 얻기위한 픽셀의 index 나 ID는 `gl_FragCoord`입니다.

```js
let outColor;
+let gl_FragCoord;

function multBy2(src) {
-  return function(i) {
-    outColor = src[i] * 2;
+  return function() {
+    outColor = src[gl_FragCoord] * 2;
  }
}

function mapDst(dst, fn) {
  for (let i = 0; i < dst.length; ++i) {
-    fn(i);
+    gl_FragCoord = i;
+    fn();
    dst[i] = outColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // WebGL에서 텍스처를 할당해야 하는 것을 시뮬레이션하기 위해
mapDst(dst, multBy2(src));

// dst is now [2, 4, 6, 8, 10, 12];
```

## WebGL에서 텍스처는 2D 배열입니다.

`dst` 배열이 3x2 텍스처를 나타낸디고 가정해봅시다.

```js
let outColor;
let gl_FragCoord;

function multBy2(src, across) {
  return function() {
-    outColor = src[gl_FragCoord] * 2;
+    outColor = src[gl_FragCoord.y * across + gl_FragCoord.x] * 2;
  }
}

-function mapDst(dst, fn) {
-  for (let i = 0; i < dst.length; ++i) {
-    gl_FragCoord = i;
-    fn();
-    dst[i] = outColor;
-  }
-}
function mapDst(dst, across, up, fn) {
  for (let y = 0; y < up; ++y) {
    for (let x = 0; x < across; ++x) {
      gl_FragCoord = {x, y};
      fn();
      dst[y * across + x] = outColor;
    }
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);   // WebGL에서 텍스처를 할당해야 하는 것을 시뮬레이션하기 위해
mapDst(dst, 3, 2, multBy2(src, 3));

// dst is now [2, 4, 6, 8, 10, 12];
```

위의 예시를 통해 WegGL GPGPU의 간단한 구조를 파악했기를 바랍니다. 개념적으로 꽤 간단합니다. 이제 위의 내용을 WebGL에서
실제로 해보겠습니다.

다음 코드를 이해하기 위해서 [WebGL2 기초](webgl-fundamentals.html), [작동 원리](webgl-how-it-works.html), [GLSL](webgl-shaders-and-glsl.html), [텍스쳐](webgl-3d-textures.html) 를 알고 있어야 합니다.

```js
const vs = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}
`;

const fs = `#version 300 es
precision highp float;

uniform sampler2D srcTex;

out vec4 outColor;

void main() {
  ivec2 texelCoord = ivec2(gl_FragCoord.xy);
  vec4 value = texelFetch(srcTex, texelCoord, 0);  // 0 = mip level 0
  outColor = value * 2.0;
}
`;

const dstWidth = 3;
const dstHeight = 2;

// 3x2 canvas를 만듭니다.
const canvas = document.createElement('canvas');
canvas.width = dstWidth;
canvas.height = dstHeight;

const gl = canvas.getContext('webgl2');

const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');

// 전체 canvas를 커버하는 clip space의 quad를 만emqslek.
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

// vertex array object (attribute state)를 생성합니다.
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// attribute에 전달할 데이터를 버퍼에서 가져오는 기능을 켭니다.
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
    positionLoc,
    2, // position과 srcTex를 포함한 size
    gl.FLOAT, // 버퍼 데이터의 타입
    false, // normalize
    0, // stride (0 = auto)
    0, // offset
);

// 원본 텍스처를 만듭니다.
const srcWidth = 3;
const srcHeight = 2;
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); // 참고: https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html
gl.texImage2D(
    gl.TEXTURE_2D,
    0, // 밉맵 레벨
    gl.R8, // 내부 포맷
    srcWidth,
    srcHeight,
    0, // border
    gl.RED, // format
    gl.UNSIGNED_BYTE, // type
    new Uint8Array([1, 2, 3, 4, 5, 6]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0); // 쉐이더에게 원본텍스처를 유닛 0에 연결한다고 알려줍니다.

gl.drawArrays(gl.TRIANGLES, 0, 6); // 2개의 삼각형을 draw합니다(6 vertices)

// 백 버퍼의 픽셀을 배열에 저장하여 출력합니다.
const results = new Uint8Array(dstWidth * dstHeight * 4);
gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);

for (let i = 0; i < dstWidth * dstHeight; ++i) {
    log(results[i * 4]);
}
```

아래는 실행 결과 입니다.

{{{example url="../webgl-gpgpu-mult-by-2.html"}}}

위의 코드에 대한 몇 가지 참고 사항.

-   -1과 1사이의 clip space에서 사각형 그리기.

    We create vertices for a -1 to +1 quad from 2 triangles. This means, assuming the viewport
    우리는 2개의 삼각형으로 -1에서 1사이의 사각형을 만들었다. viewport가 정확히 설정됐다면
    목적지의 모든픽셀을 그릴 것입니다.
    다시말해 셰이더에게 배열의 모든 요소에 대해 값을 생성하라고 한다. 이 예제에서 배열은 canvas 다.

-   `texelFetch` 는 하나의 texel을 가져오는 텍스처 함수입니다.

    3개의 인자를 가지는데 sampler, 정수 기반의 texel 좌표, 밉맵 레벨을 받습니다.
    `gl_FragCoord` 는 vec2이고 `texelFetch`를 사용하기위해선 `ivec2`로 형변환 해야합니다.
    소스 텍스처와 대상 텍스처(화면)의 크기가 이 경우 동일한 경우 여기서 추가 연산할 필요가 없습니다.

-   셰이더는 픽셀당 4개의 값을 출력해야합니다.

    이번 예외적인 경우에는 이것이 출력을 읽는 방법에 영향을 줍니다. 우리는 `readPixels`로 `RGBA/UNSIGNED_BYTE`
    [because other format/type combinations are not supported](webgl-readpixels.html)를 요청했습니다.
    그래서 모든 출력의 4번째 값을 확인해야합니다.

    참고: WebGL이 한 번에 4가지 값을 출력한다는 사실을 활용하여 더 효율적으로 설계할수 있을 것입니다.

-   텍스쳐의 내부 포맷은 `R8`입니다.

    이것의 의미는 오직 텍스처의 Red 채널만 데이터에서 얻을수 있다는 것입니다.

-   입력 데이터와 출력 데이터(canvas)는 모두 `UNSIGNED_BYTE` 값입니다.

    이것의 의미는 0에서 255사이의 정수값만 주고받을 수 있다는 것입니다.
    다른 형식의 텍스처를 전달해서 사용 할 수도 있습니다.
    또한 출력 값의 범위를 넓히기 위해 다른 형식의 텍스처로 렌더링할 수 있습니다.

위의 예에서 src와 dst는 크기가 같습니다. src로 dst를 만들때 2개의 값을 사용하도록 바꿔봅시다.
다시 말해서, input으로 `[1, 2, 3, 4, 5, 6]`이 주어졌을때 `[3, 7, 11]`이 출력되어야 합니다.
또한 소스를 3x2 데이터로 유지합니다.

2D 배열에서 값을 1D 배열인 것처럼 가져오는 기본 공식은 다음과 같습니다.

```js
y = floor(indexInto1DArray / widthOf2DArray);
x = indexInto1DArray % widthOf2Array;
```

따라서, fragment 셰이더는 2개마다 값을 추가하기 위해 이것으로 바뀌어야 합니다.

```glsl
#version 300 es
precision highp float;

uniform sampler2D srcTex;
uniform ivec2 dstDimensions;

out vec4 outColor;

vec4 getValueFrom2DTextureAs1DArray(sampler2D tex, ivec2 dimensions, int index) {
  int y = index / dimensions.x;
  int x = index % dimensions.x;
  return texelFetch(tex, ivec2(x, y), 0);
}

void main() {
  // 1차원 index로 변환한다.
  ivec2 dstPixel = ivec2(gl_FragCoord.xy);
  int dstIndex = dstPixel.y * dstDimensions.x + dstPixel.x;

  ivec2 srcDimensions = textureSize(srcTex, 0);  // size of mip 0

  vec4 v1 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2);
  vec4 v2 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2 + 1);

  outColor = v1 + v2;
}
```

`getValueFrom2DTextureAs1DArray`함수는 배열접근함수로 사용됩니다.
그말은 아래 두 줄이

```glsl
  vec4 v1 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0);
  vec4 v2 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0 + 1.0);
```

이것을 의미하게 됩니다.

```glsl
  vec4 v1 = srcTexAs1DArray[dstIndex * 2.0];
  vec4 v2 = setTexAs1DArray[dstIndex * 2.0 + 1.0];
```

자바스크립트에서 uniform변수 `dstDimensions`을 전달해야합니다.

```js
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');
+const dstDimensionsLoc = gl.getUniformLocation(program, 'dstDimensions');
```

```js
gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0); // 셰이더에게 src 텍스처가 0번째에 있다고 알려줍니다.
+gl.uniform2f(dstDimensionsLoc, dstWidth, dstHeight);
```

그리고 destination(canvas) 의 크기를 변경해야합니다.

```js
const dstWidth = 3;
-const dstHeight = 2;
+const dstHeight = 1;
```

이제 소스 배열에 대한 임의 접근으로 계산한 결과를 담을 수 있는 배열을 만들 수 있습니다.

{{{example url="../webgl-gpgpu-add-2-elements.html"}}}

더 많은 배열을 입력으로 사용하려면 텍스처를 추가하기만 하면 됩니다.

## *transform feedback*을 사용해봅시다.

"Transform Feedback" 은 vertex shader에서 varrings 출력을 하나 이상의 버퍼에 쓸 수 있는 기능입니다.
transform feedback의 장점은 출력이 일차원 이기 때문에 예측하기가 더 쉽다는 것입니다.
앞에서 본 자바스크립트의 `map`함수와 더 비슷합니다.

```glsl
#version 300 es

in float a;
in float b;

out float sum;
out float difference;
out float product;

void main() {
  sum = a + b;
  difference = a - b;
  product = a * b;
}
```

다음 fragment shader로 충분합니다.

```glsl
#version 300 es
precision highp float;
void main() {
}
```

transform feedback을 사용하려면 WebGL에 작성하고자 하는 varring들과 순서를 알려주어야 합니다. 셰이더 프로그램을 연결하기 전에 'gl.transformFeedbackVariings'를 호출해야 합니다. 이번에는 이 과정을 확인하기위해서 셰이더 컴파일과 링크를 수동으로 해보겠습니다.

다음은 쉐이더를 컴파일하기 위한 코드입니다.
[첫번째 글](webgl-fundamentals.html).

```js
function createShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}
```

2개의 셰이더를 컴파일해서 병합한 뒤 링킹하기 이전에 `gl.transformFeedbackVaryings`를 호출합니다.

```js
const vShader = createShader(gl, gl.VERTEX_SHADER, vs);
const fShader = createShader(gl, gl.FRAGMENT_SHADER, fs);

const program = gl.createProgram();
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.transformFeedbackVaryings(program, ['sum', 'difference', 'product'], gl.SEPARATE_ATTRIBS);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}
```

`gl.transformFeedbackVaryings` 은 3개의 인자를 가집니다. 첫번째와 두번째는 프로그램과 varring할 변수의 이름으로 이뤄진 배열(shader에 작성한 순서대로)입니다.
fragment 셰이더에서 어떤 작업을 한 경우, varying들 중 일부만 fragment로 가게 될것입니다. 따라서 fragment 셰이더는 작성할 필요가 없습니다. 위 예제의 경우 3개의 varring을 모두 사용했으므로 변수이름을 전부 전달해줘야합니다.
마지막 인자는 1이나 2가 될수있습니다. 또는 매핑되는 `SEPARATE_ATTRIBS` 나 `INTERLEAVED_ATTRIBS`도 있습니다.
`SEPARATE_ATTRIBS`의 뜻은 각 varying이 다른 버퍼에 저장된다는 속성이고
`INTERLEAVED_ATTRIBS`는 모든 varrings가 같은 버퍼에 저장된다는 속성입니다. 순서는 위에서 지정한 순서로 저장됩니다.
위 예제에서 `['sum', 'difference', 'product']`로 정의 하고 `INTERLEAVED_ATTRIBS`를 사용한다면 출력은
`sum0, difference0, product0, sum1, difference1, product1, sum2, difference2, product2, etc...`로 하나의 버퍼에
저장됩니다. 위 예제에선 `SEPARATE_ATTRIBS`했고 각각 다른 버퍼에 저장될 것입니다.

따라서 다른 예와 마찬가지로 입력 attributes에 대한 버퍼를 설정해야 합니다

```js
const aLoc = gl.getAttribLocation(program, 'a');
const bLoc = gl.getAttribLocation(program, 'b');

// vertex array object를 생성합니다. (attribute state)
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

function makeBuffer(gl, sizeOrData) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, gl.STATIC_DRAW);
    return buf;
}

function makeBufferAndSetAttribute(gl, data, loc) {
    const buf = makeBuffer(gl, data);
    // attributes 를 설정해서 WebGL에게 위 버퍼에서 attribute에 대한 데이터를 주는 방법을 알려줍니다.
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(
        loc,
        1, // size (num components)
        gl.FLOAT, // type of data in buffer
        false, // normalize
        0, // stride (0 = auto)
        0, // offset
    );
}

const a = [1, 2, 3, 4, 5, 6];
const b = [3, 6, 9, 12, 15, 18];

// 버퍼에 데이터를 저장합니다.
const aBuffer = makeBufferAndSetAttribute(gl, new Float32Array(a), aLoc);
const bBuffer = makeBufferAndSetAttribute(gl, new Float32Array(b), bLoc);
```

이제 "transform feedback"을 설정합니다. "transform feedback"는 객체로 사용할 버퍼의 정보(states)를 포함합니다.
[vertex array](webgl-attributes.html)가 입력되는 attribute들의 정보를 명시하고있고 "transform feedback"는
출력 attributes(varrings)의 정보를 포함하고있습니다.

아래는 이를 설정하기위한 코드입니다.

```js
// transform feedback을 생성하고 bind합니다.
const tf = gl.createTransformFeedback();
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

// output에 대한 버퍼를 생성합니다.
const sumBuffer = makeBuffer(gl, a.length * 4);
const differenceBuffer = makeBuffer(gl, a.length * 4);
const productBuffer = makeBuffer(gl, a.length * 4);

// transform feedback에 버퍼들을 연결합니다.
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sumBuffer);
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, differenceBuffer);
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, productBuffer);

gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

// 이 버퍼들은 다른곳에 bind할수 없습니다.
gl.bindBuffer(gl.ARRAY_BUFFER, null); // 생성된 버퍼들이 bind되어있으므로 해제합니다.
```

`bindBufferBase`를 호출해서 output0, output1, output2이 사용할 버퍼를 각각 설정해줍니다. 0, 1, 2 출력들은 프로그램을 링킹할때 `gl.transformFeedbackVaryings`로 전달한 변수이름 배열에 대응됩니다.

생성된 "transform feedback"이 완료되면 다음과 같은 상태가 됩니다.

<img src="resources/transform-feedback-diagram.png" style="width: 625px;" class="webgl_center">

또한 버퍼 내에서 쓸 하위 범위를 지정할 수 있는 `bindBufferRange` 기능도 있지만 여기서는 사용하지 않습니다.

그리고 셰이더를 사용하기 위해 다음과 같이 설정합니다.

```js
gl.useProgram(program);

// bind our input attribute state for the a and b buffers
gl.bindVertexArray(vao);

// no need to call the fragment shader
gl.enable(gl.RASTERIZER_DISCARD);

gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
gl.beginTransformFeedback(gl.POINTS);
gl.drawArrays(gl.POINTS, 0, a.length);
gl.endTransformFeedback();
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

// turn on using fragment shaders again
gl.disable(gl.RASTERIZER_DISCARD);
```

fragmet shader을 off하고 전에 생성한 transform feedback 객체를 bind합니다.
그리고 transform feedback을 활성화 한 뒤, draw를 호출합니다.

계산된 값들을 보기위해 `gl.getBufferSubData`를 사용합니다.

```js
log(`a: ${a}`);
log(`b: ${b}`);

printResults(gl, sumBuffer, 'sums');
printResults(gl, differenceBuffer, 'differences');
printResults(gl, productBuffer, 'products');

function printResults(gl, buffer, label) {
    const results = new Float32Array(a.length);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.getBufferSubData(
        gl.ARRAY_BUFFER,
        0, // GPU 버퍼의 byte offset,
        results,
    );
    // 결과를 출력합니다.
    log(`${label}: ${results}`);
}
```

{{{example url="../webgl-gpgpu-sum-difference-product-transformfeedback.html"}}}

이것으로 GPU로 전달한 'a'와 'b'들의 값을 덧셈, 뺄셈, 곱셈 하는것을 볼 수 있습니다.

참고: [transform feedback에 대한 state diagram](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html?exampleId=transform-feedback)이 위의 예제와 똑같진 않지만 시각적으로 파악하기에 도움이 될 것입니다. transform feedback과 함께 사용하는 vertex 셰이더는 점의 원에 대한 위치와 색상을 생성합니다.

## 첫 번째 예제: particles

매우 간단한 파티클 시스템이 있다고 가정합니다. 모든 파티클은 위치와 속도를 가지고
화면을 벗어났을때 반대편으로 wraping합니다.

이 사이트의 다른 대부분의 글에서 파이틀의 위치를 자바스크립트에서 업데이트 합니다.

```js
for (const particle of particles) {
    particle.pos.x = (particle.pos.x + particle.velocity.x) % canvas.width;
    particle.pos.y = (particle.pos.y + particle.velocity.y) % canvas.height;
}
```

그리고 한번에 하나씩 파티클을 그립니다.

```
useProgram (particleShader)
setup particle attributes
for each particle
  set uniforms
  draw particle
```

또는 모든 파티클의 새로운 위치를 버퍼에 업로드 할 수 있습니다.

```
bindBuffer(..., particlePositionBuffer)
bufferData(..., latestParticlePositions, ...)
useProgram (particleShader)
setup particle attributes
set uniforms
draw particles
```

위의 transform feedback 예제을 사용하는것으로 각 파이틀에 대한 속도에 해당하는 버퍼를 만들 수 있습니다.
그리고 그 위치들을 위한 버퍼를 2개 만듭니다. transform feedback을 사용하여 한 위치 버퍼에 속도를 추가하고 다른
위치 버퍼에 씁니다. 그리고 새로운 위치로 파티클을 그립니다. 다음 프레임에서 방금 업데이트한 버퍼에서 위치를 읽고
속도를 더해 처음에 읽은 버퍼에 저장합니다.

아래는 파티클들의 위치를 업데이트하기 위한 vertex 셰이더입니다.

```glsl
#version 300 es
in vec2 oldPosition;
in vec2 velocity;

uniform float deltaTime;
uniform vec2 canvasDimensions;

out vec2 newPosition;

vec2 euclideanModulo(vec2 n, vec2 m) {
	return mod(mod(n, m) + m, m);
}

void main() {
  newPosition = euclideanModulo(
      oldPosition + velocity * deltaTime,
      canvasDimensions);
}
```

파티클을 그리기위해 간단한 vertex 셰이더를 사용합니다.

```glsl
#version 300 es
in vec4 position;
uniform mat4 matrix;

void main() {
  // 평범한 행렬 연산을 합니다.
  gl_Position = matrix * position;
  gl_PointSize = 10.0;
}
```

프로그램을 만들고 링킹하는 코드를 두 셰이더에서 쓸수있게 변경합니다.

```js
function createProgram(gl, shaderSources, transformFeedbackVaryings) {
    const program = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
        const shader = createShader(gl, type, shaderSources[ndx]);
        gl.attachShader(program, shader);
    });
    if (transformFeedbackVaryings) {
        gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }
    return program;
}
```

그리고 이것을 셰이더를 컴파일 할 때 transform feedback varyings 변수이름 배열을 포함해서 사용합니다.

```js
const updatePositionProgram = createProgram(gl, [updatePositionVS, updatePositionFS], ['newPosition']);
const drawParticlesProgram = createProgram(gl, [drawParticlesVS, drawParticlesFS]);
```

평소처럼 uniform 변수의 위치를 찾습니다.

```js
const updatePositionPrgLocs = {
    oldPosition: gl.getAttribLocation(updatePositionProgram, 'oldPosition'),
    velocity: gl.getAttribLocation(updatePositionProgram, 'velocity'),
    canvasDimensions: gl.getUniformLocation(updatePositionProgram, 'canvasDimensions'),
    deltaTime: gl.getUniformLocation(updatePositionProgram, 'deltaTime'),
};

const drawParticlesProgLocs = {
    position: gl.getAttribLocation(drawParticlesProgram, 'position'),
    matrix: gl.getUniformLocation(drawParticlesProgram, 'matrix'),
};
```

이제 랜덤 위치와 속도를 생성합니다.

```js
// 랜덤 위치와 속도를 생성합니다.
const rand = (min, max) => {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
};
const numParticles = 200;
const createPoints = (num, ranges) =>
    new Array(num)
        .fill(0)
        .map((_) => ranges.map((range) => rand(...range)))
        .flat();
const positions = new Float32Array(createPoints(numParticles, [[canvas.width], [canvas.height]]));
const velocities = new Float32Array(
    createPoints(numParticles, [
        [-300, 300],
        [-300, 300],
    ]),
);
```

그리고 버퍼에 저장합니다.

```js
function makeBuffer(gl, sizeOrData, usage) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    return buf;
}

const position1Buffer = makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
const position2Buffer = makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
const velocityBuffer = makeBuffer(gl, velocities, gl.STATIC_DRAW);
```

자주 업데이트되는 2개의 위치 버퍼에 대하여 `gl.bufferData`에 `gl.DYNAMIC_DRAW`전달하는 것을 주목합니다.
이것은 WebGL에게 최적화 힌트를 주는것입니다. 성능에 영향을 미칠지는 WebGL의 책임입니다.

우리는 4개의 vertex arrays가 필요합니다.

-   위치를 업데이트할때 사용할 `position1Buffer` 과 `velocity`에서 한개
-   위치를 업데이트할때 사용할 `position2Buffer` 과 `velocity`에서 한개
-   그릴때 사용할 `position1Buffer` 에서 한개
-   그릴때 사용할 `position2Buffer` 에서 한개

```js
function makeVertexArray(gl, bufLocPairs) {
    const va = gl.createVertexArray();
    gl.bindVertexArray(va);
    for (const [buffer, loc] of bufLocPairs) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(
            loc, // attribute 위치
            2, // element의 개수
            gl.FLOAT, // 자료형
            false, // normalized 여부
            0, // 건너뛰며 읽기 위한 stride (0 = auto)
            0, // offset
        );
    }
    return va;
}

const updatePositionVA1 = makeVertexArray(gl, [
    [position1Buffer, updatePositionPrgLocs.oldPosition],
    [velocityBuffer, updatePositionPrgLocs.velocity],
]);
const updatePositionVA2 = makeVertexArray(gl, [
    [position2Buffer, updatePositionPrgLocs.oldPosition],
    [velocityBuffer, updatePositionPrgLocs.velocity],
]);

const drawVA1 = makeVertexArray(gl, [[position1Buffer, drawParticlesProgLocs.position]]);
const drawVA2 = makeVertexArray(gl, [[position2Buffer, drawParticlesProgLocs.position]]);
```

2개의 transform feedback 객체를 만듭니다.

-   1 for writing to `position1Buffer`
-   1 for writing to `position2Buffer`

```js
function makeTransformFeedback(gl, buffer) {
    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
    return tf;
}

const tf1 = makeTransformFeedback(gl, position1Buffer);
const tf2 = makeTransformFeedback(gl, position2Buffer);
```

transform feedback을 사용할 때는 다른 bind point에서 버퍼의 bind를 해제하는 것이 중요합니다.
`ARRAY_BUFFER`는 이전에 설정한 버퍼를 계속해서 가지고 있습니다. `TRANSFORM_FEEDBACK_BUFFER`은
`gl.bindBufferBase`을 호출할때 설정됩니다.이것은 조금 헷갈리는데 `TRANSFORM_FEEDBACK_BUFFER`로 gl.bindBufferBase`을 호출하는 것은 사실 두개의 공간에 버퍼를 bind하는 것입니다. transform feedback 객체 내부에서 찾은 bind point고 두번째는 `TRANSFORM_FEEDBACK_BUFFER`라는 전역 bind point입니다.

```js
// 남아있는 것을 unbind 합니다.
gl.bindBuffer(gl.ARRAY_BUFFER, null);
gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
```

업데이트 버퍼와 draw버퍼를 쉽게 교체할 수 있도록 두 객체를 생성합니다.

```js
let current = {
    updateVA: updatePositionVA1, // position1에서 읽습니다.
    tf: tf2, // position2에 저장합니다.
    drawVA: drawVA2, // position2로 그립니다.
};
let next = {
    updateVA: updatePositionVA2, // position2에서 읽습니다.
    tf: tf1, // position1에 저장합니다.
    drawVA: drawVA1, // position1로 그립니다.
};
```

다음으로 렌더링 루프를 수행하는데 그전에 transform feedback으로 위치를 업데이트합니다.

```js
let then = 0;
function render(time) {
  // mili sec을 초단위로 변환합니다.
  time *= 0.001;
  // 현재시간에서 이전시간을 뺍니다.
  const deltaTime = time - then;
  // 현재시간을 다음프레임에서 기억합니다.
  then = time;

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.clear(gl.COLOR_BUFFER_BIT);

  // 새 위치를 계산합니다.
  gl.useProgram(updatePositionProgram);
  gl.bindVertexArray(current.updateVA);
  gl.uniform2f(updatePositionPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);

  // fragment 셰이더를 Off
  gl.enable(gl.RASTERIZER_DISCARD);

  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.tf);
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, numParticles);
  gl.endTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  // fragment 셰이더를 On
  gl.disable(gl.RASTERIZER_DISCARD);
```

그리고 파티클을 그립니다.

```js
gl.useProgram(drawParticlesProgram);
gl.bindVertexArray(current.drawVA);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.uniformMatrix4fv(
    drawParticlesProgLocs.matrix,
    false,
    m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1),
);
gl.drawArrays(gl.POINTS, 0, numParticles);
```

최종적으로 `current`와 `next`를 교체합니다. 그럼 다음 프레임에서 최신 위치로 다음 위치를 생성할 것입니다.

```js
  // 어떤 버퍼에서 읽을지 교체합니다.
  // 그리고 쓸 곳도 교체합니다.
  {
    const temp = current;
    current = next;
    next = temp;
  }

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

이제 간단한 GPU기반의 파티클을 볼 수 있습니다.

{{{example url="../webgl-gpgpu-particles-transformfeedback.html"}}}

## 다음 예제: 점으로부터 가장 가까운 선분 찾기.

좋은 예제인지는 모르겠습니다. 왜냐하면 모든 선과 점을 비교하는 것보다 더 나은 알고리즘이 있을 것입니다.
예를 들어 여러 공간 분할 알고리즘을 사용하면 쉽게 95%의 점을 제외 하는것이 가능하고 더 빨라질 것입니다.
그래도 이 예제를 통해 GPGPU의 몇 가지 기능을 알수있습니다.

문제 : 500개의 점과 1000개의 선분이 있고 각 점마다 어떤 선분이 가장 가까운지 찾습니다. 전체 탐색으로 문제를 풀면..

```
for each point
  minDistanceSoFar = MAX_VALUE
  for each line segment
    compute distance from point to line segment
    if distance is < minDistanceSoFar
       minDistanceSoFar = distance
       closestLine = line segment
```

500개의 점을 각각 1000개의 선분과 비교하면 500,000번의 비교가 이뤄진다.
일반적인 GPU는 100또는 1000개의 코어를 가지고 있기 때문에 GPU에서 이것을 할 수 있다면 잠재적으로 수백 또는 수천배 더
빨라질 수 있습니다.

이번에는 파티클에 대해 했던것 처럼 버퍼에 점을 넣을 수 있지만 선 세그먼트를 버퍼에 넣을 수는 없습니다.
버퍼는 attribute를 통해 데이터를 제공합니다. 즉, 내가 원하는 방식으로 임의의 값에 접근할수 없습니다. 대신에 외부
셰이더 컨트롤에 의하여 attribute에 할당됩니다.

즉, 모든 line의 position들을 텍스쳐에 저장해야합니다. 위에서 말했듯이 필요하다면 2D 배열을 1D 배열로 취급할 수 있습니다.

아래는 vertex 셰이더에서 한 점에 대해 가장 가장 가까운 선분을 찾는 코드입니다.
마찬가지로 전체 탐색을 수행합니다.

```js
const closestLineVS = `#version 300 es
  in vec3 point;

  uniform sampler2D linesTex;
  uniform int numLineSegments;

  flat out int closestNdx;

  vec4 getAs1D(sampler2D tex, ivec2 dimensions, int index) {
    int y = index / dimensions.x;
    int x = index % dimensions.x;
    return texelFetch(tex, ivec2(x, y), 0);
  }

  // 참고: https://stackoverflow.com/a/6853926/128511
  // a 는 점, b,c 는 선분입니다.
  float distanceFromPointToLine(in vec3 a, in vec3 b, in vec3 c) {
    vec3 ba = a - b;
    vec3 bc = c - b;
    float d = dot(ba, bc);
    float len = length(bc);
    float param = 0.0;
    if (len != 0.0) {
      param = clamp(d / (len * len), 0.0, 1.0);
    }
    vec3 r = b + bc * param;
    return distance(a, r);
  }

  void main() {
    ivec2 linesTexDimensions = textureSize(linesTex, 0);
    
    // find the closest line segment
    float minDist = 10000000.0; 
    int minIndex = -1;
    for (int i = 0; i < numLineSegments; ++i) {
      vec3 lineStart = getAs1D(linesTex, linesTexDimensions, i * 2).xyz;
      vec3 lineEnd = getAs1D(linesTex, linesTexDimensions, i * 2 + 1).xyz;
      float dist = distanceFromPointToLine(point, lineStart, lineEnd);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }
    
    closestNdx = minIndex;
  }
  `;
```

코드를 간결화하고 가독성을 높이기 위해 `getValueFrom2DTextureAs1DArray`을 `getAs1D`로 이름을 변경하였습니다.
위에 작성된 코드는 간단히 구현한 전체탐색 알고리즘입니다.

`point` 는 현재 점의 위치이고, `linesTex` 는 선분에 해당하는 한쌍의 점들을 포함합니다.

우선 2개의 점과 5개의 선분들로 테스트용 데이터를 만들어 보겠습니다. 각각 RGBA 텍스처에 저장되므로 0, 0으로 채워집니다.

```js
const points = [100, 100, 200, 100];
const lines = [25, 50, 25, 150, 90, 50, 90, 150, 125, 50, 125, 150, 185, 50, 185, 150, 225, 50, 225, 150];
const numPoints = points.length / 2;
const numLineSegments = lines.length / 2 / 2;
```

표로 확인하면 아래와 같습니다.

<img src="resources/line-segments-points.svg" style="width: 500px;" class="webgl_center">

선분들은 왼쪽에서 오른쪽으로 0에서 4까지 번호가 매겨진다. 따라서 코드를 실행한다면,
첫 번째 점(<span style="color: red;">빨간색</span>)은 가장 가까운 선으로서 1의 값을 가져야하고,
두번째 점(<span style="color: green;">초록색</span>)은 3의 값을 가져야 합니다.

점들을 버퍼에 넣고 각각 에 대해 계산된 가장 가까운 인덱스를 저장할 버퍼도 만들어 봅시다.

```js
const closestNdxBuffer = makeBuffer(gl, points.length * 4, gl.STATIC_DRAW);
const pointsBuffer = makeBuffer(gl, new Float32Array(points), gl.DYNAMIC_DRAW);
```

그리고 선분의 두 끝점을 갖는 텍스쳐를 만들어 봅시다.

```js
function createDataTexture(gl, data, numComponents, internalFormat, format, type) {
    const numElements = data.length / numComponents;

    // 모든 데이터를 저장할수있는 텍스처 크기(치수)를 계산합니다.
    const width = Math.ceil(Math.sqrt(numElements));
    const height = Math.ceil(numElements / width);

    const bin = new Float32Array(width * height * numComponents);
    bin.set(data);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0, // 밉맵 레벨
        internalFormat,
        width,
        height,
        0, // border
        format,
        type,
        bin,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { tex, dimensions: [width, height] };
}

const { tex: linesTex, dimensions: linesTexDimensions } = createDataTexture(gl, lines, 2, gl.RG32F, gl.RG, gl.FLOAT);
```

이 경우 코드에서 데이터의 크기를 포함하는 정사각형 텍스처의 크기(치수)를 계산하고 남는 크기는 패딩도록합니다.
예를 들면 크기가 7인 배열이 있을때 3x3 텍스처를 생성해야합니다. 이것으로 텍스처와 계산된 크기를 알수있습니다.
크기를 수동으로 설정해야하는 이유는 텍스처가 최대 크기를 가지기 때문입니다.

이상적으로는 데이터를 1차원 위치 배열과 1차원 선분 배열로 보는 것이 좋습니다. 그래서 텍스처를 Nx1로 선언 할 수도 있습니다.
하지만 GPU들은 최대크기를 가지고 행이 1024나 2048보다 작아야합니다. 최대크기가 1024이고 크기가 1025인 배열의 값을
저장하고 싶다면 텍스처에 데이터를 512x2와 같은 텍스처로 데이터를 넣어야합니다? 데이터를 정사각형에 넣는다면
정사각형으로 만든 최대크기까지 제한이 없습니다. 따라서 최대크기가 1024일때 100만개 이상의 값을 가지는 배열을 수용할 수 있습니다.

다음으로 셰이더를 컴파일하고 uniform 위치를 look up합니다.

```js
const closestLinePrg = createProgram(gl, [closestLineVS, closestLineFS], ['closestNdx']);

const closestLinePrgLocs = {
    point: gl.getAttribLocation(closestLinePrg, 'point'),
    linesTex: gl.getUniformLocation(closestLinePrg, 'linesTex'),
    numLineSegments: gl.getUniformLocation(closestLinePrg, 'numLineSegments'),
};
```

점들에 대한 vertex array를 만듭니다.

```js
function makeVertexArray(gl, bufLocPairs) {
    const va = gl.createVertexArray();
    gl.bindVertexArray(va);
    for (const [buffer, loc] of bufLocPairs) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(
            loc, // attribute 위치
            2, // elements의 개수
            gl.FLOAT, // 자료형
            false, // normalize 여부
            0, // stride (0 = auto)
            0, // offset
        );
    }
    return va;
}

const closestLinesVA = makeVertexArray(gl, [[pointsBuffer, closestLinePrgLocs.point]]);
```

transform feedback을 `cloestNdxBuffer`에 쓸 수 있도록 설정합니다.

```js
function makeTransformFeedback(gl, buffer) {
    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
    return tf;
}

const closestNdxTF = makeTransformFeedback(gl, closestNdxBuffer);
```

이 모든 설정을 통해 이제 렌더링 할 수 있습니다.

```js
// 가까운 선분들을 계산합니다.
gl.bindVertexArray(closestLinesVA);
gl.useProgram(closestLinePrg);
gl.uniform1i(closestLinePrgLocs.linesTex, 0);
gl.uniform1i(closestLinePrgLocs.numLineSegments, numLineSegments);

// fragment 셰이더를 off 합니다.
gl.enable(gl.RASTERIZER_DISCARD);

gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, closestNdxTF);
gl.beginTransformFeedback(gl.POINTS);
gl.drawArrays(gl.POINTS, 0, numPoints);
gl.endTransformFeedback();
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

// fragment 셰이더를 on 합니다.
gl.disable(gl.RASTERIZER_DISCARD);
```

이제 최종결과를 읽습니다.

```js
// 결과를 버퍼에서 가져옵니다.
{
    const results = new Int32Array(numPoints);
    gl.bindBuffer(gl.ARRAY_BUFFER, closestNdxBuffer);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
    log(results);
}
```

아래는 실행 결과입니다.

{{{example url="../webgl-gpgpu-closest-line-results-transformfeedback.html"}}}

결과는 `[1,3]`일 것입니다.

GPU에서 데이터를 다시 읽는 속도는 느립니다. 예를 들어, 결과를 시각화하고 싶을때,
자바스크립트에서 결과를 다시 읽고 그리는 것은 쉽습니다. 하지만 자바스크립트로 다시 읽지 않는 것은
어떨까요? 이제 데이터를 그대로 사용해서 결과를 그려봅시다.

우선, 점을 그리는 것은 비교적 쉽습니다. 이것은 파티클 예제와 동일합니다.
여기서는 매칭되는 가까운 선을 색으로 구별하기 위해 각 점을 다른 색으로 그려봅시다.

```js
const drawPointsVS = `#version 300 es
in vec4 point;

uniform float numPoints;
uniform mat4 matrix;

out vec4 v_color;

// 0과 1사이의 색상, 채도, 명도 (HSV)를 rgb로 변환합니다.
// c = color, c.x = hue, c.y = saturation, c.z = value
vec3 hsv2rgb(vec3 c) {
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  gl_Position = matrix * point;
  gl_PointSize = 10.0;

  float hue = float(gl_VertexID) / numPoints;
  v_color = vec4(hsv2rgb(vec3(hue, 1, 1)), 1);
}
`;

const drawClosestLinesPointsFS = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() {
  outColor = v_color;
}`;
```

기존 색상을 전달하는 대신 `hsv2rgb`를 사용하여 0부터 1까지의 색상으로 rgb를 color를 생성합니다.
점의 개수가 500개라면 구분하기 쉽진 않지만 10개 정도라면 점과 선을 구분 할 수 있습니다.

생성한 색을 fragment shader에 전달합니다.

```js
const drawClosestPointsLinesFS = `
precision highp float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}
`;
```

선분을 그릴 때, 어떤 점에서도 가깝지 않은 선은 색을 생성하지 않는 것을 제외하면 동일합니다.
이번 예제에서는 하드코딩된 색을 사용하게 했습니다.

```js
const drawLinesVS = `#version 300 es
uniform sampler2D linesTex;
uniform mat4 matrix;

out vec4 v_color;

vec4 getAs1D(sampler2D tex, ivec2 dimensions, int index) {
  int y = index / dimensions.x;
  int x = index % dimensions.x;
  return texelFetch(tex, ivec2(x, y), 0);
}

void main() {
  ivec2 linesTexDimensions = textureSize(linesTex, 0);

  // 텍스처에서 위치를 가져옵니다.
  vec4 position = getAs1D(linesTex, linesTexDimensions, gl_VertexID);

  // 일반적인 행렬연산입니다.
  gl_Position = matrix * vec4(position.xy, 0, 1);

  // 같은 fragment 셰이더를 사용할 수 있습니다.
  v_color = vec4(0.8, 0.8, 0.8, 1);
}
`;
```

여기에는 어떤 attributes도 없지만 [데이터 없이 그리는 방법에 관한 글](webgl-drawing-without-data.html)에서 다룬 것 처럼 `gl_VertexID`을 사용하고있다.

마지막으로 가장 가까운 선을 그리는것은 다음과 같습니다.

```js
const drawClosestLinesVS = `#version 300 es
in int closestNdx;
uniform float numPoints;
uniform sampler2D linesTex;
uniform mat4 matrix;

out vec4 v_color;

vec4 getAs1D(sampler2D tex, ivec2 dimensions, int index) {
  int y = index / dimensions.x;
  int x = index % dimensions.x;
  return texelFetch(tex, ivec2(x, y), 0);
}

// 0과 1사이의 색상, 채도, 명도 (HSV)를 rgb로 변환합니다.
// c = color, c.x = hue, c.y = saturation, c.z = value
vec3 hsv2rgb(vec3 c) {
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  ivec2 linesTexDimensions = textureSize(linesTex, 0);

  // 텍스처에서 위치를 가져옵니다.
  int linePointId = closestNdx * 2 + gl_VertexID % 2;
  vec4 position = getAs1D(linesTex, linesTexDimensions, linePointId);

  // 일반적인 행렬연산 입니다.
  gl_Position = matrix * vec4(position.xy, 0, 1);

  int pointId = gl_InstanceID;
  float hue = float(pointId) / numPoints;
  v_color = vec4(hsv2rgb(vec3(hue, 1, 1)), 1);
}
`;
```

attribute로 `closestNdx`를 전달합니다. 이것이 방금전 생성한 결과입니다.
이것을 이용해서 해당하는 선분을 찾을 수 있습니다. 선분마다 2개의 점을 그리기 위해
[instanced drawing](webgl-instanced-drawing.html)를 사용해서 `closestNdx`마다
2개의 점을 그립니다. 그러면 `gl_VertexID % 2`를 사용해서 시작점과 끝점을 찾을 수 있습니다.

마지막으로 점을 그릴 때 사용한 방법과 동일하게 색을 계산하여 점과 일치하도록 합니다.

이제 모든 새로운 셰이더를 컴파일하고 uniform 위치를 가져옵니다.

```js
const closestLinePrg = createProgram(
    gl, [closestLineVS, closestLineFS], ['closestNdx']);
+const drawLinesPrg = createProgram(
+    gl, [drawLinesVS, drawClosestLinesPointsFS]);
+const drawClosestLinesPrg = createProgram(
+    gl, [drawClosestLinesVS, drawClosestLinesPointsFS]);
+const drawPointsPrg = createProgram(
+    gl, [drawPointsVS, drawClosestLinesPointsFS]);

const closestLinePrgLocs = {
  point: gl.getAttribLocation(closestLinePrg, 'point'),
  linesTex: gl.getUniformLocation(closestLinePrg, 'linesTex'),
  numLineSegments: gl.getUniformLocation(closestLinePrg, 'numLineSegments'),
};
+const drawLinesPrgLocs = {
+  linesTex: gl.getUniformLocation(drawLinesPrg, 'linesTex'),
+  matrix: gl.getUniformLocation(drawLinesPrg, 'matrix'),
+};
+const drawClosestLinesPrgLocs = {
+  closestNdx: gl.getAttribLocation(drawClosestLinesPrg, 'closestNdx'),
+  linesTex: gl.getUniformLocation(drawClosestLinesPrg, 'linesTex'),
+  matrix: gl.getUniformLocation(drawClosestLinesPrg, 'matrix'),
+  numPoints: gl.getUniformLocation(drawClosestLinesPrg, 'numPoints'),
+};
+const drawPointsPrgLocs = {
+  point: gl.getAttribLocation(drawPointsPrg, 'point'),
+  matrix: gl.getUniformLocation(drawPointsPrg, 'matrix'),
+  numPoints: gl.getUniformLocation(drawPointsPrg, 'numPoints'),
+};
```

점들과 가까운 선분을 그리기위해 vertex arrays가 필요합니다.

```js
const closestLinesVA = makeVertexArray(gl, [
  [pointsBuffer, closestLinePrgLocs.point],
]);

+const drawClosestLinesVA = gl.createVertexArray();
+gl.bindVertexArray(drawClosestLinesVA);
+gl.bindBuffer(gl.ARRAY_BUFFER, closestNdxBuffer);
+gl.enableVertexAttribArray(drawClosestLinesPrgLocs.closestNdx);
+gl.vertexAttribIPointer(drawClosestLinesPrgLocs.closestNdx, 1, gl.INT, 0, 0);
+gl.vertexAttribDivisor(drawClosestLinesPrgLocs.closestNdx, 1);
+
+const drawPointsVA = makeVertexArray(gl, [
+  [pointsBuffer, drawPointsPrgLocs.point],
+]);
```

이제 렌더링 시 이전처럼 결과를 계산하지만 `getBufferSubData`로 결과를 조회하지 않습니다.
대신에 그리기 위한 적절한 셰이더로 전달하면 됩니다.

첫번째로 모든 선분을 회색으로 그립니다.

```js
// 모든 선분을 회색으로 그립니다.
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.bindVertexArray(null);
gl.useProgram(drawLinesPrg);

// unit 0 선분 텍스처를 연결합니다.
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, linesTex);

// 셰이더에게  unit 0에서 텍스쳐를 사용하라고 알려줍니다.
gl.uniform1i(drawLinesPrgLocs.linesTex, 0);
gl.uniformMatrix4fv(drawLinesPrgLocs.matrix, false, matrix);

gl.drawArrays(gl.LINES, 0, numLineSegments * 2);
```

이제 모든 가까운 선분들을 그립니다.

```js
gl.bindVertexArray(drawClosestLinesVA);
gl.useProgram(drawClosestLinesPrg);

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, linesTex);

gl.uniform1i(drawClosestLinesPrgLocs.linesTex, 0);
gl.uniform1f(drawClosestLinesPrgLocs.numPoints, numPoints);
gl.uniformMatrix4fv(drawClosestLinesPrgLocs.matrix, false, matrix);

gl.drawArraysInstanced(gl.LINES, 0, 2, numPoints);
```

그리고 최종적으로 각 점을 그립니다.

```js
gl.bindVertexArray(drawPointsVA);
gl.useProgram(drawPointsPrg);

gl.uniform1f(drawPointsPrgLocs.numPoints, numPoints);
gl.uniformMatrix4fv(drawPointsPrgLocs.matrix, false, matrix);

gl.drawArrays(gl.POINTS, 0, numPoints);
```

실행하기 전에 선분과 점들을 더 추가해봅니다.

```js
-const points = [
-  100, 100,
-  200, 100,
-];
-const lines = [
-   25,  50,
-   25, 150,
-   90,  50,
-   90, 150,
-  125,  50,
-  125, 150,
-  185,  50,
-  185, 150,
-  225,  50,
-  225, 150,
-];

+function createPoints(numPoints, ranges) {
+  const points = [];
+  for (let i = 0; i < numPoints; ++i) {
+    points.push(...ranges.map(range => r(...range)));
+  }
+  return points;
+}
+
+const r = (min, max) => min + Math.random() * (max - min);
+
+const points = createPoints(8, [[0, gl.canvas.width], [0, gl.canvas.height]]);
+const lines = createPoints(125 * 2, [[0, gl.canvas.width], [0, gl.canvas.height]]);
const numPoints = points.length / 2;
const numLineSegments = lines.length / 2 / 2;
```

그리고 실행하게 되면..

{{{example url="../webgl-gpgpu-closest-line-transformfeedback.html"}}}

점과 선분의 개수를 늘릴 수 있지만 어느 시점 부터 어떤 점과 선이 일치하는지 구분할 수 없게될 것입니다.
하지만 더 작게 할 경우 동작여부를 시각적으로 확인할 수 있습니다.

단순히 재미로 파티클 예제와 이 예제를 합쳐봅시다. 파티클의 위치를 업데이트할때 사용한 기술을 사용하여
점들을 업데이트하겠습니다. 그리고 선분의 끝점을 업데이트하기 위해 맨 위에서 한 작업을 수행하고
결과를 텍스처에 기록합니다.

그러기 위해서는 파이클 예제를 `updatePositionFS` vertex 셰이더에 복사해야합니다.
선분들에 대해서는 값이 텍스처에 저장되므로 fragment 셰이더에서 점을 이동해야 합니다.

```js
const updateLinesVS = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}
`;

const updateLinesFS = `#version 300 es
precision highp float;

uniform sampler2D linesTex;
uniform sampler2D velocityTex;
uniform vec2 canvasDimensions;
uniform float deltaTime;

out vec4 outColor;

vec2 euclideanModulo(vec2 n, vec2 m) {
	return mod(mod(n, m) + m, m);
}

void main() {
  // 텍스처 좌표를 gl_FragCoord로 계산합니다.
  ivec2 texelCoord = ivec2(gl_FragCoord.xy);
  
  vec2 position = texelFetch(linesTex, texelCoord, 0).xy;
  vec2 velocity = texelFetch(velocityTex, texelCoord, 0).xy;
  vec2 newPosition = euclideanModulo(position + velocity * deltaTime, canvasDimensions);

  outColor = vec4(newPosition, 0, 1);
}
`;
```

그런 다음 포인트와 선분을 업데이트 하기위한 2개의 새 셰이더를 컴파일하고 uniform의 위치를 찾아둡니다.

```js
+const updatePositionPrg = createProgram(
+    gl, [updatePositionVS, updatePositionFS], ['newPosition']);
+const updateLinesPrg = createProgram(
+    gl, [updateLinesVS, updateLinesFS]);
const closestLinePrg = createProgram(
    gl, [closestLineVS, closestLineFS], ['closestNdx']);
const drawLinesPrg = createProgram(
    gl, [drawLinesVS, drawClosestLinesPointsFS]);
const drawClosestLinesPrg = createProgram(
    gl, [drawClosestLinesVS, drawClosestLinesPointsFS]);
const drawPointsPrg = createProgram(
    gl, [drawPointsVS, drawClosestLinesPointsFS]);

+const updatePositionPrgLocs = {
+  oldPosition: gl.getAttribLocation(updatePositionPrg, 'oldPosition'),
+  velocity: gl.getAttribLocation(updatePositionPrg, 'velocity'),
+  canvasDimensions: gl.getUniformLocation(updatePositionPrg, 'canvasDimensions'),
+  deltaTime: gl.getUniformLocation(updatePositionPrg, 'deltaTime'),
+};
+const updateLinesPrgLocs = {
+  position: gl.getAttribLocation(updateLinesPrg, 'position'),
+  linesTex: gl.getUniformLocation(updateLinesPrg, 'linesTex'),
+  velocityTex: gl.getUniformLocation(updateLinesPrg, 'velocityTex'),
+  canvasDimensions: gl.getUniformLocation(updateLinesPrg, 'canvasDimensions'),
+  deltaTime: gl.getUniformLocation(updateLinesPrg, 'deltaTime'),
+};
const closestLinePrgLocs = {
  point: gl.getAttribLocation(closestLinePrg, 'point'),
  linesTex: gl.getUniformLocation(closestLinePrg, 'linesTex'),
  numLineSegments: gl.getUniformLocation(closestLinePrg, 'numLineSegments'),
};
const drawLinesPrgLocs = {
  linesTex: gl.getUniformLocation(drawLinesPrg, 'linesTex'),
  matrix: gl.getUniformLocation(drawLinesPrg, 'matrix'),
};
const drawClosestLinesPrgLocs = {
  closestNdx: gl.getAttribLocation(drawClosestLinesPrg, 'closestNdx'),
  linesTex: gl.getUniformLocation(drawClosestLinesPrg, 'linesTex'),
  matrix: gl.getUniformLocation(drawClosestLinesPrg, 'matrix'),
  numPoints: gl.getUniformLocation(drawClosestLinesPrg, 'numPoints'),
};
const drawPointsPrgLocs = {
  point: gl.getAttribLocation(drawPointsPrg, 'point'),
  matrix: gl.getUniformLocation(drawPointsPrg, 'matrix'),
  numPoints: gl.getUniformLocation(drawPointsPrg, 'numPoints'),
};
```

점과 선분에 대해 속도를 생성해야 합니다.

```js
const points = createPoints(8, [[0, gl.canvas.width], [0, gl.canvas.height]]);
const lines = createPoints(125 * 2, [[0, gl.canvas.width], [0, gl.canvas.height]]);
const numPoints = points.length / 2;
const numLineSegments = lines.length / 2 / 2;

+const pointVelocities = createPoints(numPoints, [[-20, 20], [-20, 20]]);
+const lineVelocities = createPoints(numLineSegments * 2, [[-20, 20], [-20, 20]]);
```

점들을 위해 2개의 버퍼를 생성해서 위에서 한것처럼 교체할수 있게 합니다.
또한 점에 대한 속도를 저장하기위해 버퍼를 생성합니다. 그리고 -1에서 1사이의 clip space
사각형을 선분의 위치를 업데이트하기 위해 생성합니다.

```js
const closestNdxBuffer = makeBuffer(gl, points.length * 4, gl.STATIC_DRAW);
-const pointsBuffer = makeBuffer(gl, new Float32Array(points), gl.STATIC_DRAW);
+const pointsBuffer1 = makeBuffer(gl, new Float32Array(points), gl.DYNAMIC_DRAW);
+const pointsBuffer2 = makeBuffer(gl, new Float32Array(points), gl.DYNAMIC_DRAW);
+const pointVelocitiesBuffer = makeBuffer(gl, new Float32Array(pointVelocities), gl.STATIC_DRAW);
+const quadBuffer = makeBuffer(gl, new Float32Array([
+  -1, -1,
+   1, -1,
+  -1,  1,
+  -1,  1,
+   1, -1,
+   1,  1,
+]), gl.STATIC_DRAW);
```

마찬가지로 이제 선분의 끝점을 고정하기 위해 2개의 텍스처가 필요하며, 다른 텍스처에서 하나를 업데이트하고
교환합니다. 그리고 라인 끝점의 속도를 고정하기위한 텍스처도 필요합니다.

```js
-const {tex: linesTex, dimensions: linesTexDimensions} =
-    createDataTexture(gl, lines, 2, gl.RG32F, gl.RG, gl.FLOAT);
+const {tex: linesTex1, dimensions: linesTexDimensions1} =
+    createDataTexture(gl, lines, 2, gl.RG32F, gl.RG, gl.FLOAT);
+const {tex: linesTex2, dimensions: linesTexDimensions2} =
+    createDataTexture(gl, lines, 2, gl.RG32F, gl.RG, gl.FLOAT);
+const {tex: lineVelocitiesTex, dimensions: lineVelocitiesTexDimensions} =
+    createDataTexture(gl, lineVelocities, 2, gl.RG32F, gl.RG, gl.FLOAT);
```

이제 꽤 많은 vertex array들이 필요합니다.

-   위치를 업데이트하기 위한 2개 (하나는 `pointsBuffer1`를 입력으로 사용하고,
    다른 하나는 `pointsBuffer2`를 입력으로 사용합니다.)
-   선분을 업데이트하기 위해 -1에서 1사이의 clip space 사각형을 가지는 한개.
-   가까운 선분을 계산하기위한 2개 (하나는 `pointsBuffer1`에서 점을 찾고
    다른하나는 `pointsBuffer2`에서 찾습니다.)
-   점들을 그리기위한 2개 (하나는 `pointsBuffer1`에서 점을 찾고
    다른하나는 `pointsBuffer2`에서 찾습니다.)

```js
+const updatePositionVA1 = makeVertexArray(gl, [
+  [pointsBuffer1, updatePositionPrgLocs.oldPosition],
+  [pointVelocitiesBuffer, updatePositionPrgLocs.velocity],
+]);
+const updatePositionVA2 = makeVertexArray(gl, [
+  [pointsBuffer2, updatePositionPrgLocs.oldPosition],
+  [pointVelocitiesBuffer, updatePositionPrgLocs.velocity],
+]);
+
+const updateLinesVA = makeVertexArray(gl, [
+  [quadBuffer, updateLinesPrgLocs.position],
+]);

-const closestLinesVA = makeVertexArray(gl, [
-  [pointsBuffer, closestLinePrgLocs.point],
-]);
+const closestLinesVA1 = makeVertexArray(gl, [
+  [pointsBuffer1, closestLinePrgLocs.point],
+]);
+const closestLinesVA2 = makeVertexArray(gl, [
+  [pointsBuffer2, closestLinePrgLocs.point],
+]);

const drawClosestLinesVA = gl.createVertexArray();
gl.bindVertexArray(drawClosestLinesVA);
gl.bindBuffer(gl.ARRAY_BUFFER, closestNdxBuffer);
gl.enableVertexAttribArray(drawClosestLinesPrgLocs.closestNdx);
gl.vertexAttribIPointer(drawClosestLinesPrgLocs.closestNdx, 1, gl.INT, 0, 0);
gl.vertexAttribDivisor(drawClosestLinesPrgLocs.closestNdx, 1);

-const drawPointsVA = makeVertexArray(gl, [
-  [pointsBuffer, drawPointsPrgLocs.point],
-]);
+const drawPointsVA1 = makeVertexArray(gl, [
+  [pointsBuffer1, drawPointsPrgLocs.point],
+]);
+const drawPointsVA2 = makeVertexArray(gl, [
+  [pointsBuffer2, drawPointsPrgLocs.point],
+]);
```

점들을 업데이트하위해 2개의 추가적인 transform feedbacks이 필요합니다.

```js
function makeTransformFeedback(gl, buffer) {
  const tf = gl.createTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
  return tf;
}

+const pointsTF1 = makeTransformFeedback(gl, pointsBuffer1);
+const pointsTF2 = makeTransformFeedback(gl, pointsBuffer2);

const closestNdxTF = makeTransformFeedback(gl, closestNdxBuffer);
```

선분의 점들을 업데이트하기 위해 framebuffers를 만듭니다. 하나는 `linesTex1`에 쓰고
다른 하나는 `linesTex2`에 씁니다.`

```js
function createFramebuffer(gl, tex) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return fb;
}

const linesFB1 = createFramebuffer(gl, linesTex1);
const linesFB2 = createFramebuffer(gl, linesTex2);
```

부동소수점(floating point)텍스처에 쓰기위해 사용 할 수 있는지 WebGL2의 옵션 기능인
`EXT_color_buffer_float`으로 확인합니다.

```js
// WebGL 컨텍스트를 가져옵니다.
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");
if (!gl) {
  return;
}
+const ext = gl.getExtension('EXT_color_buffer_float');
+if (!ext) {
+  alert('need EXT_color_buffer_float');
+  return;
+}
```

그리고 current와 next를 추적하기 위해 각 프레임에서 쉽게 교환할 수 있도록 몇 가지 객체를 설정합니다.

```js
let current = {
    // 점들을 업데이트하기 위해
    updatePositionVA: updatePositionVA1, // points1에서 읽고
    pointsTF: pointsTF2, // points2에 쓴다.
    // 선분의 점들을 업데이트하기 위해
    linesTex: linesTex1, // linesTex1에서 읽고
    linesFB: linesFB2, // linesTex2에 쓴다.
    // 가까운 선분을 계산하기 위해
    closestLinesVA: closestLinesVA2, // points2에서 읽고
    // 모든 선분을 그리기위해
    allLinesTex: linesTex2, // linesTex2에서 읽는다.
    // 모든 점을 그리기위해
    drawPointsVA: drawPointsVA2, // points2에서 읽는다.
};

let next = {
    // 점들을 업데이트하기 위해
    updatePositionVA: updatePositionVA2, // points2에서 읽고
    pointsTF: pointsTF1, // points1에 쓴다.
    // 선분의 점들을 업데이트하기 위해
    linesTex: linesTex2, // linesTex2에서 읽고
    linesFB: linesFB1, // linesTex1에 쓴다.
    // 가까운 선분을 계산하기 위해
    closestLinesVA: closestLinesVA1, // points1에서 읽고
    // 모든 선분을 그리기위해
    allLinesTex: linesTex1, // linesTex1에서 읽는다.
    // 모든 점을 그리기위해
    drawPointsVA: drawPointsVA1, // points1에서 읽는다.
};
```

이제 렌더링 loop를 기능별로 부분(part)를 나눠서 만들어 봅시다.

```js

let then = 0;
function render(time) {
  // 초단위로 변환한다.
  time *= 0.001;
  // 현재시간에서 이전시간을 뺍니다.
  const deltaTime = time - then;
  // 현재시간을 다음프레임에서 기억합니다.
  then = time;

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.clear(gl.COLOR_BUFFER_BIT);

  updatePointPositions(deltaTime);
  updateLineEndPoints(deltaTime);
  computeClosestLines();

  const matrix = m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1);

  drawAllLines(matrix);
  drawClosestLines(matrix);
  drawPoints(matrix);

  // 교체합니다.
  {
    const temp = current;
    current = next;
    next = temp;
  }

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
}
```

이제 각각의 부분(part)를 구현합니다. 모든 이전 part들은 `current`를 적절한 위치에서 참고한 예와 동일합니다.
다시 말해 `current` 와 `next`를 구분하지 않아도 됩니다.

```js
function computeClosestLines() {
    -gl.bindVertexArray(closestLinesVA);
    +gl.bindVertexArray(current.closestLinesVA);
    gl.useProgram(closestLinePrg);

    gl.activeTexture(gl.TEXTURE0);
    -gl.bindTexture(gl.TEXTURE_2D, linesTex);
    +gl.bindTexture(gl.TEXTURE_2D, current.linesTex);

    gl.uniform1i(closestLinePrgLocs.linesTex, 0);
    gl.uniform1i(closestLinePrgLocs.numLineSegments, numLineSegments);

    drawArraysWithTransformFeedback(gl, closestNdxTF, gl.POINTS, numPoints);
}

function drawAllLines(matrix) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.bindVertexArray(null);
    gl.useProgram(drawLinesPrg);

    // 선분 텍스처를 unit 0에 연결합니다.
    gl.activeTexture(gl.TEXTURE0);
    -gl.bindTexture(gl.TEXTURE_2D, linesTex);
    +gl.bindTexture(gl.TEXTURE_2D, current.allLinesTex);

    // 셰이더에게 unit 0에서 텍스처를 사용하라고 알려줍니다.
    gl.uniform1i(drawLinesPrgLocs.linesTex, 0);
    gl.uniformMatrix4fv(drawLinesPrgLocs.matrix, false, matrix);

    gl.drawArrays(gl.LINES, 0, numLineSegments * 2);
}

function drawClosestLines(matrix) {
    gl.bindVertexArray(drawClosestLinesVA);
    gl.useProgram(drawClosestLinesPrg);

    gl.activeTexture(gl.TEXTURE0);
    -gl.bindTexture(gl.TEXTURE_2D, linesTex);
    +gl.bindTexture(gl.TEXTURE_2D, current.allLinesTex);

    gl.uniform1i(drawClosestLinesPrgLocs.linesTex, 0);
    gl.uniform1f(drawClosestLinesPrgLocs.numPoints, numPoints);
    gl.uniformMatrix4fv(drawClosestLinesPrgLocs.matrix, false, matrix);

    gl.drawArraysInstanced(gl.LINES, 0, 2, numPoints);
}

function drawPoints(matrix) {
    -gl.bindVertexArray(drawPointsVA);
    +gl.bindVertexArray(current.drawPointsVA);
    gl.useProgram(drawPointsPrg);

    gl.uniform1f(drawPointsPrgLocs.numPoints, numPoints);
    gl.uniformMatrix4fv(drawPointsPrgLocs.matrix, false, matrix);

    gl.drawArrays(gl.POINTS, 0, numPoints);
}
```

그리고 선분과 점을 업데이트하기위해 2개의 새로운 함수가 필요합니다.

```js
function updatePointPositions(deltaTime) {
    gl.bindVertexArray(current.updatePositionVA);
    gl.useProgram(updatePositionPrg);
    gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);
    gl.uniform2f(updatePositionPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);
    drawArraysWithTransformFeedback(gl, current.pointsTF, gl.POINTS, numPoints);
}

function updateLineEndPoints(deltaTime) {
    // 선분의 끝점 위치를 업데이트합니다. ---------------------
    gl.bindVertexArray(updateLinesVA); // 단순 quad(사각형)입니다.
    gl.useProgram(updateLinesPrg);

    // units 0 과 1에 텍스처를 연결합니다.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, current.linesTex);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, lineVelocitiesTex);

    // 텍스터에서 units 0 과 1에서 텍스처를 읽으라고 알려줍니다.
    gl.uniform1i(updateLinesPrgLocs.linesTex, 0);
    gl.uniform1i(updateLinesPrgLocs.velocityTex, 1);
    gl.uniform1f(updateLinesPrgLocs.deltaTime, deltaTime);
    gl.uniform2f(updateLinesPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);

    // 다른 선분 텍스처에 기록합니다.
    gl.bindFramebuffer(gl.FRAMEBUFFER, current.linesFB);
    gl.viewport(0, 0, ...lineVelocitiesTexDimensions);

    // -1에서 1사이 clip space quad에 그립니다. = destination 배열에 맵핑됩니다.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
```

이제 동적인 선분과 점을 계산하는 것을 볼수 있습니다. 이것은 GPU에서 동작하고 있습니다.

{{{example url="../webgl-gpgpu-closest-line-dynamic-transformfeedback.html"}}}

## GPGPU에 대한 몇 가지 주의 사항

-   WebGL1의 GPGPU는 대부분 출력 텍스처로 2D 배열만 지원했습니다. WebGL2는 transfrom feedback을
    통해 임의의 크기의 1D 배열을 처리할 수 있는 기능이 추가됐습니다.

    궁금하다면 [webgl1을 사용한 동일한 글](https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html)을
    참조하여 텍스처로 출력하는 기능만 사용하여 이 것들이 어떻게 구현됐는지 확인할 수 있습니다. 하지만
    `texelFetch`를 사용하고 약간의 구현을 변경해서 더 많은 택스처 포맷을 활성화 해야합니다.
    조금만 생각해도 알 수 있을 것입니다.

    -   [파티클](../webgl-gpgpu-particles.html)
    -   [가까운 선분 찾기 결과](../webgl-gpgpu-closest-line-results.html)
    -   [가까운 선분 찾기 시각화](../webgl-gpgpu-closest-line.html)
    -   [동적인 버전](../webgl-gpgpu-closest-line-dynamic.html)

-   GPU는 CPU와 같은 정밀도를 가지고 있지 않습니다.

    결과를 보고 받아들일지 결정해야합니다.

-   GPGPU에대한 overhead.

    위의 처음 몇가지 예에서 WebGL을 사용하여 데이터를 계산한다음 결과를 읽었습니다.
    버퍼들과 텍스처를 설정하고 attributes 와 uniforms를 설정하는 것은 오래 걸립니다.
    특정 크기 이하의 겅우 자바스크립트로 수행하는 것이 더 빠를수도 있습니다.
    6개의 숫자를 곱하거나 세개의 숫자 쌍을 더하는 예제는 GPGPU를 사용하기에는 너무 작습니다.
    트레이드오프가 정의되지 않은 위치입니다. 최소 1000개 이상의 작업을 수행하지 않을 경우
    자바스크립트를 사용하는 것이 좋습니다.

-   `readPixels` 과 `getBufferSubData` 는 느립니다.

    WebGL에서 결과를 읽는 것은 느리기 때문에 가능한 피하는 것이 중요합니다. 예를 들어,
    위의 파티클 시스템이나 동적인 가까운 선분찾기 예제의 결과는 자바스크립트로 읽지 않습니다.
    가능한 오래 GPU에 결과를 보관하고 있습니다. 비효율적인 예시를 들면

    -   GPU로 연산하고
    -   결과를 읽고
    -   다음 단계를 위해 결과를 준비하고
    -   준비된 결과를 GPU에 업로드 합니다.
    -   다시 GPU로 연산하고
    -   결과를 읽고
    -   다음 단계를 위해 결과를 준비하고
    -   준비된 결과를 GPU에 업로드 합니다.
    -   다시 GPU로 연산하고
    -   결과를 읽고 ...

    아래와 같은 창의적 해결책을 찾는다면 훨씬 더 빠를 것입니다.

    -   GPU로 연산하고
    -   GPU를 사용할 다음 단계를 위해 결과를 준비합니다.
    -   다시 GPU로 연산하고
    -   GPU를 사용할 다음 단계를 위해 결과를 준비합니다.
    -   다시 GPU로 연산하고
    -   결과를 읽습니다.

    이 글의 동적인 가까운 선분찾기 예제에서 위와 같이 수행했습니다. 결과는 GPU를 안에만 머무릅니다.

    다른 예제로 histogram computing 셰이더를 작성한 적이 있었습니다. 처음에는 결과를
    자바스크립트에서 읽어오고 auto-level이미지를 위해서 최소값과 최대값을 파악한 다음 해당 최소값과 최대값을 균일하게
    사용하여 이미지를 캔버스에 다시 그렸습니다.
    참고: [Histogram equalization(HE)](https://en.wikipedia.org/wiki/Histogram_equalization)

    성능을 개선하기 위해, 히스토그램을 다시 자바스크립트로 읽는 대신 스스로 텍스처의 최소값과 최대값으로 2픽셀 텍스처를 생성하는 히스토그램 셰이더를 만들 수 있었습니다.

    그런 다음 2픽셀 텍스처를 세 번째 셰이더에 전달하여 최소값과 최대값을 알아냈고,
    유니폼 설정을 통해 GPU에서 그것들을 읽을 필요가 없어졌습니다.

    비슷하게 히스토그램을 출력하기 위해서 처음에는 히스토그램 데이터를 GPU에서 읽어 왔지만 나중에는
    히스토그램 데이터를 직접 시각화 하는 셰이더를 작성하여 자바스크립트로 다시 읽을 필요가 없게 되었습니다.

    그렇게 함으로써 전체 프로세스가 GPU에 머무르며 훨씬 더 빠를 수 있었습니다.

-   GPU는 많은 것들을 병렬로 처리 할 수 있지만, 대부분은 CPU가 멀티 테스킹하는 방식으로 할 수 없습니다.
    GPU는 일반적으로 "[preemptive multitasking](https://www.google.com/search?q=preemptive+multitasking)"를
    할 수 없습니다.
    이것의 의미는 실행시간이 5분인 매우 복잡한 셰이더를 사용하면 전체 시스템이 5분동안 멈출 수 있습니다.
    잘 만들어진 대부분의 OS는 CPU에서 GPU에게 마지막 명령을 내린후 얼마나 시간이 지났는지 확인하는 것으로
    이것을 해결할 수 있습니다. 너무 오래 지났는데도 GPU가 응답하지 않는다면 유일한 옵션은 GPU를 재설정하는 것입니다.

    이것이 WebGL이 _컨텍스트를 잃고_ "Aw, rats!"과 같은 메시지를 출력하는 이유입니다.

    GPU에 많은 작업을 주는 것은 쉽지만 그래픽스에서 5-6초 수준으로 계산하는것은 흔한 일이 아닙니다.
    보통 0.1초 수준에 가깝고 이것도 좋은편은 아니지만 사용자들이 빨리 실행되기를 원하기 때문에 프로그래머가
    빨리 반응하도록 최적화나 다른 방법을 찾을수 있기를 바랍니다.

    반면에 GPGPU는 자신의 GPU가 실행하기에 매우 무거운 작업을 처리해주길 원할 수 있습니다.
    여기에는 쉬운 해결책이 없다. 휴대폰은 PC보다 훨씬 안좋은 GPU를 가지고 있습니다. 이때
    GPU가 "느려지기 전"까지 얼마나 많은 작업을 처리할수있는지 확실히 알 방법이 없습니다.

    저는 해결책을 제시할 수 없고 하려는 일에 따라 이 문제에 부딪힐 수도 있다는 경고를 하는것 입니다.

-   모바일 장치는 일반적으로 부동 소수점 텍스처에 대한 렌더링을 지원하지 않습니다.

    이 문제를 해결하는 데는 다양한 방법이 있습니다. GLSL 함수들 `floatBitsToInt`, `floatBitsToUint`,
    `IntBitsToFloat`, `UintBitsToFloat`으로 변환하여 사용할 수 있습니다.

    예를 들어, [텍스처 기반의 파티클 예제](../webgl-gpgpu-particles.html)는 부동 소수점 텍스처에 써야합니다.
    이것은 텍스처를 `RG32I` (32 integer textures) 타입으로 선언 함으로써 해결할 수 있는데, 정수형 텍스쳐로 선언하여도
    여전히 floats를 업로드 할 수 있습니다.

    셰이더에서 텍스처를 정수로 읽고 부동 소수점으로 디코딩한 다음 계산 결과를 정수로 다시 인코딩해야 합니다. 예를들면

    ```glsl
    #version 300 es
    precision highp float;

    -uniform highp sampler2D positionTex;
    -uniform highp sampler2D velocityTex;
    +uniform highp isampler2D positionTex;
    +uniform highp isampler2D velocityTex;
    uniform vec2 canvasDimensions;
    uniform float deltaTime;

    out ivec4 outColor;

    vec2 euclideanModulo(vec2 n, vec2 m) {
    	return mod(mod(n, m) + m, m);
    }

    void main() {
      // 위치마다 속도가 있어야 할 것입니다.
      // 그래서 속도 텍스처와 위치 텍스처의 크기는 같습니다.

      // 더해서, 새로운 포지션을 만들어야 하는데
      // 원본과 destination도 같은 사이즈를 가져야합니다.

      // texcoord 를 gl_FragCoord로 계산합니다
      ivec2 texelCoord = ivec2(gl_FragCoord.xy);

    -  vec2 position = texelFetch(positionTex, texelCoord, 0).xy;
    -  vec2 velocity = texelFetch(velocityTex, texelCoord, 0).xy;
    +  vec2 position = intBitsToFloat(texelFetch(positionTex, texelCoord, 0).xy);
    +  vec2 velocity = intBitsToFloat(texelFetch(velocityTex, texelCoord, 0).xy);
      vec2 newPosition = euclideanModulo(position + velocity * deltaTime, canvasDimensions);

    -  outColor = vec4(newPosition, 0, 1);
    +  outColor = ivec4(floatBitsToInt(newPosition), 0, 1);
    }
    ```

    [동작하는 예제 입니다.](../webgl-gpgpu-particles-no-floating-point-textures.html)

이 예제들이 WebGL의 GPGPU의 핵심 아이디어인 픽셀이 아닌 배열의 **데이터**에서 읽고 쓰는 것을 이해하는 데
도움이 되었기를 바랍니다.

셰이더들은 각각의 요소들에 대해서 함수가 호출되고 어디에 저장할지 결정하지 못하는 점에서 `map`함수와 비슷하게 동작합니다.
오히려 어디에 저장할지는 외부에서 결정됩니다. 또한 WebGL의 경우 그리는 것을 설정하는 방법에 따라 결정됩니다.
`gl.drawXXX`를 호출했을때 셰이더가 호출되고 "이 값을 어떤값으로 설정해야 합니까?"라고 묻습니다.

그리고 이제 진짜 끝입니다.

---

GPGPU를 통해 파티클을 만든 이후 후반부에는 Compute 셰이더를 사용하여 "slime" 시뮬레이션을 하는
[멋진 비디오](https://www.youtube.com/watch?v=X-iSQQgOd1A)가 있습니다.

<a href="https://jsgist.org/?src=94e9058c7ef1a4f124eccab4e7fdcd1d">WebGL2로 위의 기술을 변환한 결과입니다.</a>.
