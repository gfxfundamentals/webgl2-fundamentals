Title: WebGL 쉐이더와 GLSL
Description: 쉐이더란 무엇이며 GLSL는 무엇입니까>

이 글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다. 만약 WebGL의 작동 방식에 대하여 읽지 않았다면 [먼저 읽어 보십시오](webgl-how-it-works.html).

전에 쉐이더와 GLSL에 대하여 이야기 했지만 구체적인 세부 사항은 언급하지 않았습니다. 예시에 의해 명확해질거라 생각하지만, 이번 경우에 한해서는 더 명확히 될수 있도록 노력해봅시다.

[작동 방식](webgl-how-it-works.html)에서 언급된 것처럼 WebGL는 무언가를 그릴때 마다 2개의 쉐이더를 필요합니다. *vertex shader*와 *fragment shader*입니다. 각 쉐이더는 *함수*입니다. 버텍스 쉐이더와 프래그먼트 쉐이더는 같이 쉐이더 프로그램(또는 그냥 프로그램)으로 연결되어 집니다. 일반적인 WebGL 앱에는 많은 쉐이더 프로그램이 있습니다.

## 버텍스 쉐이더

버텍스 쉐이더의 일은 클립 공간 좌표를 생성하는 것입니다. 항상 다음과 같은 형식을 가집니다.

    #version 300 es
    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

쉐이더는 버텍스당 한번 호출됩니다. 호출 될 떄마다 특수 전역 변수 `gl_Position`를 클립 공간 좌표로 설정해야 합니다.

버텍스 쉐이더는 데이터가 필요합니다. 3가지 방법으로 데이터를 받을 수 있습니다.

1.  [Attributes](#attributes) (버퍼에서 가져온 데이터)
2.  [Uniforms](#uniforms) (draw를 호출할떄 마다 모든 정점에서 동일하게 유지되는 값)
3.  [Textures](#textures-in-vertex-shaders) (픽셀 / 텍셀 데이터)

### Attributes

버텍스 쉐이더에서 데이터를 얻는 가장 일반적인 방법은 버퍼와 *attributes*를 이용하는 것입니다.
[작동 방식](webgl-how-it-works.html)에서 버퍼와 속성(attributes)에 대해서 다룹니다.
버퍼를 만듭니다.

    var buf = gl.createBuffer();

이 버퍼에 데이터를 넣습니다.

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

그런 다음 생성한 쉐이더 프로그램로 속성(attributes)의 위치를 찾아봅니다.

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

그다음 WebGL에 버퍼에서 데이터를 가져와서 속성(attribute)으로 전달하는 방법을 알려줍니다.

    // 속성(attribute)에 전달할 데이터를 버퍼에서 가져오는 기능을 켭니다.
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;
    var normalize = false;  // 값을 그대로 둡니다.
    var offset = 0;         // 버퍼의 시작 부분
    var stride = 0;         // 다음 버텍스로 이동할 바이트 수
                            // 0 = 타입과 numComponents에 따른 적절한 폭을 사용합니다.

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

[WebGL 기초](webgl-fundamentals.html)에서 쉐이더에서 수식을 쓰지 않고 직접 데이터를 전달할 수 있음을 보았습니다.

    #version 300 es

    in vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

클립 공간 버텍스를 버퍼에 넣는다면 작동 할 것입니다.

속성(Attributes)은 `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, `mat4`,
`int`, `ivec2`, `ivec3`, `ivec4`, `uint`, `uvec2`, `uvec3`, `uvec4`를 타입으로 사용할 수 있습니다.

### Uniforms

버텍스 쉐이더의 경우, uniforms은 draw를 호출할떄 모든 버텍스에서 동일하게 유지되는 버텍스 쉐이더에 전달되는 값입니다. 간단한 예로 오프셋을 위 버텍스 쉐이더에 추가 할수 있습니다.

    #version 300 es

    in vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

이제 모든 버텍스마다 특정한 수만큼 offset를 처리할 수 있습니다. 먼저 uniform의 위치부터 찾아야 합니다.

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

그런 다음 그리기 전에 uniform을 설정 했습니다.

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // 오프셋은 화면의 오른쪽 반입니다.

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

    // 쉐이더에서
    uniform vec2 u_someVec2[3];

    // 자바스립트에서 초기화될떄
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // 랜더링 될떄
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // u_someVec3의 전체 배열을 설정 합니다.

만약에 배열의 각 요소별로 설정 하기를 원한다면 각자 요소의 위치를 찾아야 합니다.

    // 자바스립트에서 초기화될떄
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // 랜더링 될떄
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

### 버텍스 쉐이더에서 텍스처

[버텍스 쉐이더에서 텍스처]를 참조 하세요.(#textures-in-fragment-shaders).

## 프레그먼트 쉐이더

프래그먼트 쉐이더(Fragment Shader)의 역활은 현재 레스터화 되는 픽셀에 색상을 제공하는 것입니다.
항상 다음과 같은 형식을 가집니다.

    #version 300 es
    precision mediump float;

    out vec4 outColor;  // 아무 이름을 사용 할수 있습니다.

    void main() {
       outColor = doMathToMakeAColor;
    }

프래그먼트 쉐이더는 픽셀당 한번씩 호출 됩니다. 호출 될 때마다 out 변수를 색으로 설정해야합니다.

프래그먼트 쉐이더는 데이터가 필요합니다. 3가지 방법으로 데이터를 가져올 수 있습니다.

1.  [Uniforms](#uniforms) (한번 호출 할때 모든 픽셀에서 동일하게 유지되는 데이터)
2.  [Textures](#textures-in-fragment-shaders) (픽셀/텍셀에서 가져온 데이터)
3.  [Varyings](#varyings) (버텍스 쉐이더에서 데이터가 전달되고 보간된 데이터)

### 유니폼에서 프래그먼트 쉐이더

[유니폼에서 버텍스 쉐이더](#uniforms)를 참조 해 주세요.

### Textures in Fragment Shaders

쉐이더에서 텍스처에서 값들을 얻으려면 `sampler2D` 유니폼을 생성하고 GLSL함수 `texture`를 사용하여 값을 추출합니다.

    precision mediump float;

    uniform sampler2D u_texture;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5)  // 텍스처 중간에 있는 값을 얻습니다.
       gl_FragColor = texture(u_texture, texcoord);
    }

[설정에 따라서](webgl-3d-textures.html) 텍스처에서 나오는 데이터는 달라집니다. 최소한 텍스처에 데이터를 넣어야 합니다. 예를 들어

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var internalFormat = gl.RGBA,
    var width = 2;
    var height = 1;
    var border = 0; // MUST ALWAYS BE ZERO
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

그런 다음 쉐이더 프로그램에서 유니폼 위치를 찾습니다.

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

WebGL은 텍스처 유닛에 연결을 해야합니다.

    var unit = 5;  // Pick some texture unit
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

텍스처 바인딩 한 유닛을 쉐이더에게 알려줍니다.

    gl.uniform1i(someSamplerLoc, unit);

### Varyings

A varying is a way to pass a value from a vertex shader to a fragment shader which we
covered in [how it works](webgl-how-it-works.html).

To use a varying we need to declare matching varyings in both a vertex and fragment shader.
We set the *out* varying in the vertex shader with some value per vertex. When WebGL draws pixels
it will optionallinterpolate between those values and pass them to the corresponding *in* varying in
the fragment shader

Vertex shader

    #version 300 es

    in vec4 a_position;

    uniform vec4 u_offset;

    +out vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

Fragment shader

    #version 300 es
    precision mediump float;

    +in vec4 v_positionWithOffset;

    out vec4 outColor;

    void main() {
    +  // convert from clipsapce (-1 <-> +1) to color space (0 -> 1).
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5;
    +  outColor = color;
    }

The example above is a mostly nonsense example. It doesn't generally make sense to
directly copy the clipspace values to the fragment shader and use them as colors. Nevertheless
it will work and produce colors.

## GLSL

GLSL stands for [Graphics Library Shader Language](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf).
It's the language shaders are written
in. It has some special semi unique features that are certainly not common in JavaScript.
It's designed to do the math that is commonly needed to compute things for rasterizing
graphics. So for example it has built in types like `vec2`, `vec3`, and `vec4` which
represent 2 values, 3 values, and 4 values respectively. Similarly it has `mat2`, `mat3`
and `mat4` which represent 2x2, 3x3, and 4x4 matrices. You can do things like multiply
a `vec` by a scalar.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b is now vec4(2, 4, 6, 8);

Similarly it can do matrix multiplication and vector to matrix multiplication

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

It also has various selectors for the parts of a vec. For a vec4

    vec4 v;

*   `v.x` is the same as `v.s` and `v.r` and `v[0]`.
*   `v.y` is the same as `v.t` and `v.g` and `v[1]`.
*   `v.z` is the same as `v.p` and `v.b` and `v[2]`.
*   `v.w` is the same as `v.q` and `v.a` and `v[3]`.

It it able to *swizzle* vec components which means you can swap or repeat components.

    v.yyyy

is the same as

    vec4(v.y, v.y, v.y, v.y)

Similarly

    v.bgra

is the same as

    vec4(v.b, v.g, v.r, v.a)

When constructing a vec or a mat you can supply multiple parts at once. So for example

    vec4(v.rgb, 1)

Is the same as

    vec4(v.r, v.g, v.b, 1)

One thing you'll likely get caught up on is that GLSL is very type strict.

    float f = 1;  // ERROR 1 is an int. You can't assign an int to a float

The correct way is one of these

    float f = 1.0;      // use float
    float f = float(1)  // cast the integer to a float

The example above of `vec4(v.rgb, 1)` doesn't complain about the `1` because `vec4` is
casting the things inside just like `float(1)`.

GLSL has a bunch of built in functions. Many of them operate on multiple components at once.
So for example

    T sin(T angle)

Means T can be `float`, `vec2`, `vec3` or `vec4`. If you pass in `vec4` you get `vec4` back
which the sine of each of the components. In other words if `v` is a `vec4` then

    vec4 s = sin(v);

is the same as

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

Sometimes one argument is a float and the rest is `T`. That means that float will be applied
to all the components. For example if `v1` and `v2` are `vec4` and `f` is a float then

    vec4 m = mix(v1, v2, f);

is the same as

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

You can see a list of all the GLSL functions on the last 3 pages of [the OpenGL ES 3.0
Reference Card](https://www.khronos.org/files/opengles3-quick-reference-card.pdf)
If you like really dry and verbose stuff you can try
[the GLSL ES 3.00 spec](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf).

## Putting it all togehter

That's the point of this entire series of posts. WebGL is all about creating various shaders, supplying
the data to those shaders and then calling `gl.drawArrays`, `gl.drawElements`, etc to have WebGL process
the vertices by calling the current vertex shader for each vertex and then render pixels by calling the
the current fragment shader for each pixel.

Actually creating the shaders requires several lines of code. Since those lines are the same in
most WebGL programs and since once written you can pretty much ignore them [how to compile GLSL shaders
and link them into a shader program is covered here](webgl-boilerplate.html).

If you're just starting from here you can go in 2 directions. If you are interested in image procesing
I'll show you [how to do some 2D image processing](webgl-image-processing.html).
If you are interesting in learning about translation,
rotation and scale then [start here](webgl-2d-translation.html).
