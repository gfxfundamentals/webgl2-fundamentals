Title: WebGL2 새로운 기능
Description: WebGL2의 새로운 기능
TOC: WebGL2 새로운 기능


WebGL2는 WebGL1에서 꽤 많은 업그레이드가 이루어졌습니다.
만약 이미 WebGL1을 사용하고 있고 WebGL2의 이점을 누리도록 코드를 수정하는 법을 알고 싶다면 [여기를 방문하십시오](webgl1-to-webgl2.html).

아래는 순서에 상관없이 나열한 목록입니다.

## Vertex Array Objects이 항상 사용 가능합니다.

WebGL1에서도 선택적으로 사용할 수 있었지만 이 기능은 매우 중요한 변경점이라고 생각합니다. WebGL2에서는 이 기능을 항상 사용 가능하기 때문에, [여러분들도 언제나 이를 사용하시는 것이 좋습니다](webgl1-to-webgl2.html#Vertex-Array-Objects).

## 텍스처의 크기를 셰이더에서 사용할 수 있습니다.

WebGL1에서는 셰이더 내에서 텍스처의 크기를 알아야 한다면 직접 uniform을 사용해서 크기를 전달해야 만 했습니다. WebGL2에서는 다음과 같이 호출하여

    vec2 size = textureSize(sampler, lod)

텍스처의 크기를 얻을 수 있습니다.

## 직접적인 텍셀 조회

큰 배열 데이터는 대개 텍스처에 저장하는 것이 편리합니다.
WebGL1에서도 이렇게 할 수 있었지만 오직 텍스처 좌표(0.0에서 1.0)를 통해서만 텍스처 데이터에 접근할 수 있었습니다. WebGL2에서는 픽셀/텍셀 좌표로 텍스처의 값을 찾아 볼 수 있으므로 배열 접근이 약간 더 쉬워졌습니다.

    vec4 values = texelFetch(sampler, ivec2Position, lod);

## 다양한 텍스처 포맷

WebGL1에서는 단지 몇 가지 텍스처 포맷만 있엇습니다. WebGL2에는 아주 많아 졌습니다!

*   `RGBA32I`
*   `RGBA32UI`
*   `RGBA16I`
*   `RGBA16UI`
*   `RGBA8`
*   `RGBA8I`
*   `RGBA8UI`
*   `SRGB8_ALPHA8`
*   `RGB10_A2`
*   `RGB10_A2UI`
*   `RGBA4`
*   `RGB5_A1`
*   `RGB8`
*   `RGB565`
*   `RG32I`
*   `RG32UI`
*   `RG16I`
*   `RG16UI`
*   `RG8`
*   `RG8I`
*   `RG8UI`
*   `R32I`
*   `R32UI`
*   `R16I`
*   `R16UI`
*   `R8`
*   `R8I`
*   `R8UI`
*   `RGBA32F`
*   `RGBA16F`
*   `RGBA8_SNORM`
*   `RGB32F`
*   `RGB32I`
*   `RGB32UI`
*   `RGB16F`
*   `RGB16I`
*   `RGB16UI`
*   `RGB8_SNORM`
*   `RGB8I`
*   `RGB8UI`
*   `SRGB8`
*   `R11F_G11F_B10F`
*   `RGB9_E5`
*   `RG32F`
*   `RG16F`
*   `RG8_SNORM`
*   `R32F`
*   `R16F`
*   `R8_SNORM`
*   `DEPTH_COMPONENT32F`
*   `DEPTH_COMPONENT24`
*   `DEPTH_COMPONENT16`

## 3D 텍스처

말 그대로 3번째 차원을 가진 텍스처입니다.

## 텍스처 배열

텍스처 배열은 각 낱장(slice)이 별도의 텍스처로 간주된다는 점을 제외하면 3D 텍스처와 매우 유사합니다. 모든 낱장들은 같은 크기여야한다는 제약이 있긴 하지만 셰이더가 상대적으로 더 적은 텍스처 유닛을 통해 수백장의 텍스처에 접근할 수 있습니다. 셰이더에서 낱장을 선택할 수 있습니다.

    vec4 color = texture(someSampler2DArray, vec3(u, v, slice));

## 2의 거듭제곱이 아닌 텍스처 지원

WebGL1에서, 2의 거듭제곱이 아닌 텍스처는 밉맵을 가질수 없었습니다. 
WebGL2부터는 이런 제한이 사라졌습니다.
2의 거듭제곱이 아닌 텍스처도 2의 거듭제곱 텍스처와 정확히 동일하게 작동합니다.

## 셰이더의 반복문 제한 사라짐

WebGL1에서 셰이더의 반복문은 상수인 정수형 표현식을 사용해야만 했습니다.
WebGL2 (GLSL 300 es) 에서는 이러한 제한이 사라졌습니다.

## GLSL의 행렬 함수

WebGL1에서는 행렬의 역행렬을 사용하려면 행렬을 uniform 으로 전달해야 했습니다.
WebGL2 GLSL 300 es 에는 `inverse`와 `transpose` 함수가 내장되어 있습니다.

## 공통 압축 텍스처

WebGL1에는 하드웨어에 종속적인 다양한 텍스처 압축 포맷이 존재합니다.
데스크톱 전용의 S3TC, iOS 전용의 PVTC 등등 ...

WebGL2에서 아래 포맷들은 모든 하드웨어에서 지원하도록 되어 있습니다.

*   `COMPRESSED_R11_EAC RED`
*   `COMPRESSED_SIGNED_R11_EAC RED`
*   `COMPRESSED_RG11_EAC RG`
*   `COMPRESSED_SIGNED_RG11_EAC RG`
*   `COMPRESSED_RGB8_ETC2 RGB`
*   `COMPRESSED_SRGB8_ETC2 RGB`
*   `COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 RGBA`
*   `COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 RGBA`
*   `COMPRESSED_RGBA8_ETC2_EAC RGBA`
*   `COMPRESSED_SRGB8_ALPHA8_ETC2_EAC`

## Uniform Buffer Objects

Uniform Buffer Object를 사용하면 버퍼로부터 여러 uniform을 지정할 수 있습니다. 이에 따르는 장점들은 아래와 같습니다.

1. WebGL 외부에서 버퍼에 저장된 모든 uniform들을 조작할 수 있습니다.

    만약 WebGL1에서 16개의 uniform을 가지고 있다면 `gl.uniformXXX`을 16번 호출해야 하는데, 이는 상대적으로 느립니다.
    WebGL2에서는 Uniform Buffer Object를 사용한다면 자바스크립트에서 형식화 배열(typed array)을 사용해 모두 값을 설정할 수 있으므로 훨씬 빠릅니다. 
	값을 모두 설정하고 나서 `gl.bufferData` 또는 `gl.bufferSubData`를 한 번 호출하고, 셰이더 프로그램에 `gl.bindBufferRange`로 해당 버퍼를 사용하도록 지정해주면 되므로 두 번의 호출로 충분합니다.
    
2. 여러 uniform buffer object 셋을 사용할 수 있습니다.

   먼저 용어부터 정리해봅시다. Uniform Block이란 셰이더 안에 정의된 uniform의 집합입니다.
   Uniform Buffer Object는 Uniform Block이 사용할 값들이 들어있는 버퍼를 뜻합니다.
   원하는만큼 Uniform Buffer Object를 만들수 있으며 화면에 그리기 전에 그 중 하나를 특정한 Uniform Block에 바인딩하여 사용할 수 있습니다. 

   예를 들면, 하나의 셰이더에 네개의 Uniform Block들이 정의되어 있다고 합시다.

   * 투영 행렬, 뷰 행렬 등과 같은 모든 드로우콜(draw call)에 대해 동일하게 사용하는 행렬들을 포함하는 전역 행렬 Uniform Block

   * 월드 행렬이나 법선 행렬과 같이 모델마다 다른 행렬을 포함하는 모델 별 Uniform Block

   * diffuse, ambient, specular 등 material 설정을 포함하는 material Uniform Block

   * 조명 색상, 조명 위치 등과 같은 조명 효과 데이터가 포함된 조명 Uniform Block

   그런 다음 런타임에 전역 Uniform Buffer Object 하나, 각 모델별로 모델 Uniform Buffer Object 하나씩, 조명 별로 조명 Uniform Buffer Object 하나씩, 재질 별로 재질  Uniform Buffer Object를 하나씩을 만들 수 있습니다.

   모든 값이 최신 값으로 설정된 후라면, 어떤 특정 항목을 그릴 때는 필요한 네 개의 Uniform Buffer Object를 바인딩만 하면 됩니다.

       gl.bindBufferRange(..., globalBlockIndx, globalMatrixUBO, ...);
       gl.bindBufferRange(..., modelBlockIndx, someModelMatrixUBO, ...);
       gl.bindBufferRange(..., materialBlockIndx, someMaterialSettingsUBO, ...);
       gl.bindBufferRange(..., lightBlockIndx, someLightSettingsUBO, ...);

##  정수형 텍스처, attribute와 수식 계산

WebGL1에는 실제로 부동 소수점 값을 표현하지 않더라도 모든 텍스처는 부동 소수점 값을 기반으로 표현되었지만 WebGL2는 정수 기반의 텍스처를 사용할 수 있습니다.

또한 정수형의 attribute도 사용할 수 있습니다.

무엇보다도, GLSL 300 es에서는 셰이더 내 정수의 비트 저작을 수행할 수 있습니다. 

##  Transform feedback

WebGL2에서는 정점 셰이더의 연산 결과를 다시 버퍼에 쓸 수 있습니다.

##  샘플러

WebGL1에서 모든 텍스처 매개변수는 텍스처마다 존재했습니다. WebGL2에서는 필요에따라 샘플러 객체를 사용할 수 있습니다. 샘플러를 사용하면 텍스처의 일부였던 모든 필터링, 반복, 클램핑 매개변수들이 샘플러로 이동하게 됩니다. 즉, 하나의 텍스처를 다른 방식으로 샘플링 할 수 있다는 것입니다. 하나는 반복하고 하나는 클램핑한다던지, 하나는 필터링을 수행하고 다른 하나는 필터링을 하지 않는다던지 말입니다.

## 깊이 텍스처(Depth Textures)

깊이 텍스처는 WebGL1에서는 선택적으로 사용되었으며 사용하려면 고생이 좀 필요했습니다. 이제는 표준이며 쉐도우 맵을 계산하는데 흔히 사용됩니다.

## Standard Derivatives

이제 표준이 되었습니다. 일반적인 용도는 법선을 전달하는대신 셰이더 내부에서 계산하기 위해 흔히 쓰입니다.

## (인스턴스 드로잉)Instanced Drawing

이제 표준이 되었습니다. 일반적인 용도는 많은양의 나무, 관목, 잔디 등을 빠르게 그리는 것입니다.

## UNSIGNED_INT 인덱스

32bit 정수를 인덱스에 사용할 수 있게 됨으로써 인덱싱 된 geometry의 크기 제한이 사라졌습니다.

## Setting `gl_FragDepth`

깊이 버퍼 / z 버퍼에 사용자 정의 값을 쓸 수 있습니다.

## Blend Equation MIN / MAX

블렌드 할때 두 색상의 최소 또는 최대를 취할 수 있습니다.

## Multiple Draw Buffers

셰이더에서 여러 버퍼에 한 번에 그릴 수 있습니다. 일반적으로 다양한 deferred 렌더링 기술에 사용됩니다.

## 정점 셰이더에서 텍스처 접근

WebGL1에서는 선택적 기능이었습니다. 정점 셰이더 에서 접근 할 수 있는 텍스처의 갯수값이 있었는데, 0이어도 상관 없었습니다. 대부분의 기기가 이것을 지원했었습니다. WebGL2에서는 그 값이 최소 16개 이상이어야 합니다.

## 멀티샘플링된 렌더버퍼

WebGL1에서 캔버스 자체는 GPU에 내장된 멀티샘플 시스템으로 안티 에일리어싱을 적용 할 수 있었지만 사용자 정의 멀티 샘플링은 지원하지 않았습니다. WebGL2에서는 멀티샘플링된 렌더버퍼를 만들 수 있습니다.

## 오클루전 쿼리

오클루전 쿼리를 사용하면 무언가를 렌더링할 때 픽셀이 실제로 그려질지 여부를 GPU에 확인을 요청할 수 있습니다.

## 부동 소수점 텍스처 항상 사용 가능

부동 소수점 텍스처는 여러 특수 효과 및 계산에 사용됩니다. WebGL1에서는 선택 사항이었지만 WebGL2에서는 기본적으로 지원합니다. 

주의: 안타깝게도 부동 소수점 텍스처는 여전히 필터링에만 제한되어 있으며 및 부동 소수점 텍스처로의 렌더링은 여전히 선택 사항입니다. [`OES_texture_float_linear`](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/)와 [`EXT_color_buffer_float`](https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/)를 읽어 보십시오.
