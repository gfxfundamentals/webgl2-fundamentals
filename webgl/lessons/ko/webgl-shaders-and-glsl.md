Title: WebGL2 셰이더와 GLSL
Description: 셰이더란 무엇이며 GLSL는 무엇입니까?
TOC: WebGL2 셰이더와 GLSL


이 글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다. 만약 WebGL의 작동 방식에 대하여 읽지 않았다면 [먼저 읽어 보십시오](webgl-how-it-works.html).

전에 셰이더와 GLSL에 대하여 이야기 했지만 구체적인 세부 사항은 언급하지 않았습니다. 예제를 보면 명확해질거라 생각했지만, 혹시 모르니 좀 더 명확히 해 봅시다.

[작동 방식](webgl-how-it-works.html)에서 언급된 것처럼 WebGL에서는 무언가를 그릴때 마다 두개의 셰이더가 필요합니다. *정점 셰이더*와 *프래그먼트 셰이더*입니다. 각 셰이더는 *함수* 입니다. 정점 셰이더와 프래그먼트 셰이더는 같이 셰이더 프로그램(또는 그냥 프로그램)으로 링크됩니다. 일반적인 WebGL 앱에는 많은 셰이더 프로그램이 있습니다.

## 정점 셰이더

정점 셰이더의 일은 클립 공간 좌표를 생성하는 것입니다. 항상 다음과 같은 형태를 가집니다.

    #version 300 es
    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

셰이더는 정점당 한번 호출됩니다. 호출 될 때마다 특수한 전역 변수인 `gl_Position`에 클립 공간 좌표를 할당해야 합니다.

정점 셰이더는 데이터가 필요합니다. 3가지 방법으로 데이터를 받을 수 있습니다.

1.  [Attributes](#attributes) (버퍼에서 가져온 데이터)
2.  [Uniforms](#uniforms) (드로우 콜(draw call) 마다 모든 정점에서 동일하게 유지되는 값)
3.  [Textures](#textures-in-vertex-shaders) (픽셀 / 텍셀 데이터)

### Attributes

정점 셰이더에서 데이터를 얻는 가장 일반적인 방법은 버퍼와 *attribute*를 이용하는 것입니다.
[작동 방식](webgl-how-it-works.html)에서 버퍼와 attribute에 대해서 다뤘습니다.
우선 버퍼를 만듭니다.

    var buf = gl.createBuffer();

이 버퍼에 데이터를 넣습니다.

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

그런 다음 생성한 셰이더 프로그램의 attributes의 location을 찾아봅니다.

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

그다음 WebGL에 버퍼에서 데이터를 가져와서 attribute으로 전달하는 방법을 알려줍니다.

    // attribute에 전달할 데이터를 버퍼에서 가져오는 기능을 켭니다.
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;
    var normalize = false;  // 값을 그대로 둡니다.
    var offset = 0;         // 버퍼의 시작 부분
    var stride = 0;         // 다음 정점으로 이동할 바이트 수
                            // 0 = 타입과 numComponents에 의해 계산된 폭을 그대로 사용합니다.

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

[WebGL 기초](webgl-fundamentals.html)에서 셰이더에서 수식을 쓰지 않고 직접 데이터를 전달할 수 있음을 보았습니다.

    #version 300 es

    in vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

클립 공간 위치값을 가진 정점을 버퍼에 넣는다면 제대로 작동 할 것입니다.

Attribute는 `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, `mat4`,
`int`, `ivec2`, `ivec3`, `ivec4`, `uint`, `uvec2`, `uvec3`, `uvec4`를 타입으로 사용할 수 있습니다.

### Uniforms

정점 셰이더의 uniforms은 드로우 콜마다 모든 정점에서 동일하게 유지되는 값입니다. 간단한 예로 오프셋을 위 정점 셰이더에 추가 할수 있습니다.

    #version 300 es

    in vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

이제 모든 정점마다 특정 크기 만큼 오프셋을 적용할 수 있습니다. 먼저 uniform의 위치부터 찾아야 합니다.

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

그런 다음 그리기 전에 uniform을 설정합니다.

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // 오프셋은 화면의 오른쪽 절반입니다.

Uniforms은 여러 타입이 될 수 있습니다. 각 타입별로 해당 함수를 호출하여 설정 해야합니다.

    gl.uniform1f (floatUniformLoc, v);                 // float
    gl.uniform1fv(floatUniformLoc, [v]);               // float 또는 float array
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // vec2 또는 vec2 array
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // vec3 또는 vec3 array
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // vec4 또는 vec4 array

    gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // mat2 또는 mat2 array
    gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // mat3 또는 mat3 array
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // mat4 또는 mat4 array

    gl.uniform1i (intUniformLoc,   v);                 // int
    gl.uniform1iv(intUniformLoc, [v]);                 // int 또는 int array
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // ivec2 또는 ivec2 array
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // ivec3 또는 ivec3 array
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // ivec4 또는 ivec4 array

    gl.uniform1u (intUniformLoc,   v);                 // uint
    gl.uniform1uv(intUniformLoc, [v]);                 // uint 또는 uint array
    gl.uniform2u (ivec2UniformLoc, v0, v1);            // uvec2
    gl.uniform2uv(ivec2UniformLoc, [v0, v1]);          // uvec2 또는 uvec2 array
    gl.uniform3u (ivec3UniformLoc, v0, v1, v2);        // uvec3
    gl.uniform3uv(ivec3UniformLoc, [v0, v1, v2]);      // uvec3 또는 uvec3 array
    gl.uniform4u (ivec4UniformLoc, v0, v1, v2, v4);    // uvec4
    gl.uniform4uv(ivec4UniformLoc, [v0, v1, v2, v4]);  // uvec4 또는 uvec4 array

    // sampler2D, sampler3D, samplerCube, samplerCubeShader, sampler2DShadow,
    // sampler2DArray, sampler2DArrayShadow를 위해 사용
    gl.uniform1i (samplerUniformLoc,   v);
    gl.uniform1iv(samplerUniformLoc, [v]);

`bool`, `bvec2`, `bvec3` `bvec4`같은 타입도 있습니다. 이 타입들도  `gl.uniform?f?`, `gl.uniform?i?`, `gl.uniform?u?`같은 함수를 사용합니다.

배열의 경우 모든 배열의 유니폼들을 한꺼번에 설정 할수 있습니다. 예를들어

    // 셰이더에서 아래와 같이 선언
    uniform vec2 u_someVec2[3];

    // 초기화될 때 자바스립트에서 location을 가져올 때
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // 렌더링 될 때
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // u_someVec3의 전체 배열을 설정 합니다.

만약에 배열의 각 요소별로 설정 하기를 원한다면 각자 요소의 위치를 찾아야 합니다.

    // 초기화될 때 자바스립트에서 location을 가져올 때
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // 렌더링 될 때
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // 요소를 0로 설정
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // 요소를 1로 설정
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // 요소를 2로 설정

비슷하게 다음과 같은 구조체를 만든다면

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

각 필드 위치를 개별적으로 찾아야 합니다.

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### 정점 셰이더에서의 텍스처

[프래그먼트 셰이더에서의 텍스처](#textures-in-fragment-shaders)를 참조 하세요.

## 프래그먼트 셰이더

프래그먼트 셰이더의 역할은 현재 래스터화 되는 픽셀에 색상을 할당하는 것입니다.
항상 다음과 같은 형식을 가집니다.

    #version 300 es
    precision highp float;

    out vec4 outColor;  // 아무 이름이나 사용 할수 있습니다.

    void main() {
       outColor = doMathToMakeAColor;
    }

프래그먼트 셰이더는 픽셀당 한번씩 호출 됩니다. 호출 될 때마다 여러분이 지정한 out 변수를 어떤 색상으로 설정해야 합니다.

프래그먼트 셰이더는 데이터가 필요합니다. 3가지 방법으로 데이터를 가져올 수 있습니다.

1.  [Uniforms](#uniforms) (한번의 드로우 콜에서 모든 픽셀에 동일하게 유지되는 데이터)
2.  [Textures](#textures-in-fragment-shaders) (픽셀/텍셀에서 가져온 데이터)
3.  [Varyings](#varyings) (정점 셰이더에서 데이터가 전달되고 보간된 데이터)

### 프래그먼트 셰이더에서의 Uniform

[정점 셰이더에서의 uniform](#uniforms)을 참조 해 주세요.

### 프래그먼트 셰이더에서의 텍스처

셰이더에서 텍스처 값들을 얻으려면 `sampler2D` uniform을 생성하고 GLSL함수 `texture`를 사용하여 값을 추출합니다.

    precision highp float;

    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5)  // 텍스처 정가운데 값을 얻습니다.
       outColor = texture(u_texture, texcoord);
    }

[여러가지 설정에 따라서](webgl-3d-textures.html) 텍스처에서 나오는 데이터는 달라집니다. 우리가 해야하는 최소한의 작업은 텍스처를 생성하고 데이터를 넣는 것입니다. 예를 들어,

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var internalFormat = gl.RGBA,
    var width = 2;
    var height = 1;
    var border = 0; // 항상 0이어야 함
    var format = gl.RGBA;
    var type = gl.UNSIGNED_BYTE;
    var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D,
                  level,
                  internalFormat,
                  width,
                  height,
                  border,
                  format,
                  type,
                  data);

필터링 방법을 설정합니다.

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

그런 다음 셰이더 프로그램에서 uniform 위치를 찾습니다.

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

텍스처 유닛에 바인딩을 해야합니다.

    var unit = 5;  // 텍스처 유닛 선택
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

텍스처를 바인딩 한 유닛을 셰이더에게 알려줍니다.

    gl.uniform1i(someSamplerLoc, unit);

### Varyings

varying는 [작동 방법](webgl-how-it-works.html)에서 보았던 정점 셰이더에서 프래그먼트 셰이더로 값을 전달하는 방법입니다.

varying를 사용하기 위해서는 varying들을 정점와 프래그먼트 셰이더 두곳에서 일치하게 선언을 해야합니다.
정점 셰이더는 각 정점의 특정 값을 *out* varying에 설정합니다. WebGL은 픽셀을 그릴때 선택 사항으로 해당 값들을 보간하고 프래먼트 셰이더의 상응하는 *in* varying에 전달합니다.

정점 셰이더

    #version 300 es

    in vec4 a_position;

    uniform vec4 u_offset;

    +out vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

프래그먼트 셰이더

    #version 300 es
    precision highp float;

    +in vec4 v_positionWithOffset;

    out vec4 outColor;

    void main() {
    +  // 클립 공간 좌표 (-1 <-> +1)를 색상 공간 좌표 (0 -> 1)로 변환.
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5;
    +  outColor = color;
    }

위의 예제는 거의 무의미한 예제입니다. 일반적으로 클립 공간 값을 프래그먼트 셰이더로 직접 복사하여 색상으로는 사용하지 않습니다. 그럼에도 불구하고 잘 작동하고 색상을 만들어 냅니다.

## GLSL

GLSL은 [Graphics Library Shader Language](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf)의 약자입니다.
이는 셰이더에 쓰이는 언어입니다. 자바스크립트에서 흔히 볼 수 없는 어느정도 특별한 고유 기능이 있습니다. 래스터화 그래픽스를 위한 계산 작업에 일반적으로 필요한 수학적 계산을 수행할 수 있도록 설계되어 있습니다. 그래서 예를 들어 `vec2`, `vec3`, `vec4`와 같이 두개의 값, 세개의 값, 네개의 값을 각각 표현하는 타입이 있습니다. 비슷하게 `mat2`, `mat3`, `mat4`는 2x2, 3x3, 4x4 행렬을 표현합니다. 스칼라를 `vec`에 곱하는 것도 할 수 있습니다.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b는 이제 vec4(2, 4, 6, 8)입니다.;

마찬가지로 행렬 곱셉과 벡터와 행렬 곱셈을 수행 할 수 있습니다.

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

또한 vec의 부분을 선택하는 다양한 방법이 있습니다. vec4를 보자면

    vec4 v;

*   `v.x`는 `v.s`이나 `v.r`이나 `v[0]과 똑같은 값을 나타냅니다.`.
*   `v.y`는 `v.t`이나 `v.g`이나 `v[1]과 똑같은 값을 나타냅니다.`.
*   `v.z`는 `v.p`이나 `v.b`이나 `v[2]과 똑같은 값을 나타냅니다.`.
*   `v.w`는 `v.q`이나 `v.a`이나 `v[3]과 똑같은 값을 나타냅니다.`.

vec 요소를 교체하거나 반복하는 *swizzle*을 할 수 있습니다.

    v.yyyy

는 아래와 같습니다.

    vec4(v.y, v.y, v.y, v.y)

마찬가지로

    v.bgra

는 다음과 같습니다.

    vec4(v.b, v.g, v.r, v.a)

vec이나 mat를 구성할 때, 한번에 여러 부분을 제공 할 수 있습니다. 예를 들어

    vec4(v.rgb, 1)

는 다음과 같습니다.

    vec4(v.r, v.g, v.b, 1)

주의 해야 할 한가지는 GLSL은 타입에 대하여 매우 엄격합니다.

    float f = 1;  // ERROR 1은 int입니다. float에 int를 할당 할 수 없습니다.

올바른 방법은 다음 중 하나입니다.

    float f = 1.0;      // float 사용
    float f = float(1)  // float에 정수를 캐스팅

위 예제에서 `vec4(v.rgb, 1)`는 `vec4`가 내부적으로 `float(1)`와 같이 캐스팅하기 때문에 `1`에 대하여 불평하지 않습니다.

GLSL는 많은 내장 함수를 가지고 있습니다. 대부분이 다양한 구성 요소에 대해 똑같이 작동합니다. 예를 들어

    T sin(T angle)

T의 의미는  `float`, `vec2`, `vec3` 또는 `vec4` 일 수 있습니다. 만약에 `vec4`를 전달한다면 구성요소 각각이 sine된 `vec4`를 반환합니다. 다시말해 `v`가 `vec4`이라면

    vec4 s = sin(v);

는 다음과 같습니다.

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

어떤 경우 하나의 매개변수가 부동소수점이고 나머지는 `T`인 경우가 있습니다. 이는 부동소수점이 모든 구성 요소에 적용된다는 의미입니다. 예를들어 `v1`, `v2`가 `vec4`이고 `f`가 부동소수점이면

    vec4 m = mix(v1, v2, f);

는 다음과 같습니다.

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

[OpenGL ES 3.0 레퍼런스 카드](https://www.khronos.org/files/opengles3-quick-reference-card.pdf) 마지막 3 페이지에서 모든 GLSL 함수 목록을 볼 수 있으며 만약에 정말로 딱딱하고 완전한 글을 원한다면 [GLSL ES 3.00 스펙](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf)을 보십시오.

## 정리

지금까지가 이 전체 게시글 시리즈의 요점입니다. WebGL은 다양한 셰이더를 생성하고, 데이터를 이 셰이더들에 제공하고 `gl.drawArrays`, `gl.drawElements`등을 호출해서, WebGL이 각 정점마다 현재 정점 셰이더를 호출하여 처리하고, 각 픽셀마다 현재 프래그먼트 셰이더를 호출하여 픽셀을 렌더링 하는 것에 다름이 없습니다.

실제로 셰이더를 생성하는 것은 몇 줄의 코드로 족합니다. 그 코드들은 대부분의 WebGL 프로그램에서 동일하고 한 번 작성하고 나면 [GLSL 셰이더를 컴파일하고 셰이더 프로그램에 링크하는 방법](webgl-boilerplate.html)은 신경쓰지 않아도 됩니다.

여기서부터 읽기 시작했다면 두 가지 방향으로 갈 수 있습니다. 이미지 처리에 관심이 있다면 [2D 이미지 처리 방법](webgl-image-processing.html)을 보면 됩니다. 만약에 이동, 회전, 크기 변환에 관심이 있다면 [여기서 시작](webgl-2d-translation.html)하시면 됩니다.
