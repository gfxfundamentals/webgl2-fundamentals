Title: WebGL2 새로운 기능
Description: WebGL2의 새로운 기능
TOC: WebGL2 새로운 기능


WebGL2는 WebGL1에서 꽤 중요한 업그레이드입니다.
만약 이미 WebGL1을 사용하고 있고 WebGL2를 활용할 수 있도록 코드를 적용하는 법을 알고 싶다면 [여기를 방문하십시오](webgl1-to-webgl2.html).

여기에 특별한 순서가 없는 간단한 목록이 있습니다.

## Vertex Array Objects는 항상 사용 가능합니다.

이제는 WebGL2에서 항상 사용할 수 있고 WebGL1에서는 선택적으로 사용할 수 있었음에도 이것이 매우 중요하다고 생각합니다. [아마도 항상 이것을 사용해야 될 것입니다](webgl1-to-webgl2.html#Vertex-Array-Objects).

## 텍스처의 크기를 쉐이더에서 사용할 수 있습니다.

WebGl1에서 쉐이더에서 텍스처의 크기를 알아야 된다면 직접 uniform을 사용하여 크기를 전달해야 했습니다. WebGl2에서는 다음과 같이 호출하여

    vec2 size = textureSize(sampler, lod)

텍스처의 크기를 얻을 수 있습니다.

## 직접 텍셀 조회

종종 많은 양의 배열 데이터를 텍스처에 저장하는 것이 편리합니다.
WebGL1에서 이를 할 수 있었지만 오직 텍스처 좌표(0.0에서 1.0)만 텍스처를 처리 할 수 있었습니다. WebGL2에서는 픽셀/텍셀 좌표로 텍스처의 값을 찾아 볼 수 있으므로 배열 접근이 더 쉬워집니다.

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

3D 텍스처 입니다. 3차원을 가진 텍스처입니다.

## 텍스처 배열

텍스처 배열은 각 부분이 별도의 텍스처로 간주된다는 점을 제외하면 3D 텍스처와 매우 비슷합니다. 모든 부분들이 같은 크기여야 하지만 쉐이더에 비교적 적은 수의 텍스처 단위를 가지고있는 수많은 텍스처에 접근하는 좋은 방법입니다. 쉐이더에서 부분(slice)를 선택할 수 있습니다.

    vec4 color = texture(someSampler2DArray, vec3(u, v, slice));

## 2의 거듭제곱이 아닌 텍스처 지원

WebGL1에서, 2의 거듭제곱이 아닌 텍스처는 밉을 가질수 없었습니다. 
WebGL2부터는 이런 제한이 사라졌습니다.
2의 거듭제곱이 아닌 텍스처도 2의 거듭제곱 텍스처와 정확히 동일하게 작동합니다.

## 쉐이더 루프 제한 제거

WebGL1에서 쉐이더의 루프는 상수인 정수형 표현식을 사용해야만 했습니다.
WebGL2 (GLSL 300 es) 에서는 제한이 사라졌습니다.

## GLSL의 행렬 함수

WebGL1에서는 행렬의 역행렬을 얻으려면 행렬을 uniform 으로 전달해야 했습니다.
WebGL2 GLSL 300 es 에는 이전의 '전치행렬 함수'처럼 '역행렬 함수'가 내장되어 있습니다.

## 공통 압축 텍스처

WebGL1에서는 하드웨어에 따라 다양한 압축 텍스 형식이 존재합니다.
데스크톱 전용의 S3TC, IOS 전용의 PVTC 등등 ...

WebGL2에서 아래와같은 형식은 모든 하드웨어 환경에서 지원됩니다.

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

Uniform Buffer Object를 사용하면 buffer에서 uniform 묶음을 특정할 수 있습니다. 다음과 같은 장점들이 있습니다.

1. WebGL 외부의 buffer 안에 있는 모든 uniform들을 조작할 수 있습니다.

    만약 WebGL1에서 16개의 uniform을 가지고 있다면 gl.uniformXXX에 16번의 호출이 필요한데, 이는 상대적으로 느립니다.
    WebGL2에서는 Uniform Buffer Object를 사용한다면 JavaScript 내부의 typed array 안에서 값을 설정할 수 있으므로
    훨씬 빠릅니다. 한번의 gl.bufferData 나 gl.bufferSubData 호출로 모든 값이 설정되고나면
    gl.bindBufferRange 로 프로그램에게 해당 buffer를 사용하도록 지시합니다. 
    즉 총 2번의 호출로 해결할 수 있습니다.
    
2. 서로 다른 uniform buffer object 의 세트를 가질 수 있습니다.

   먼저 Uniform Block이란 쉐이더 정의된 uniform의 집합을 말하며,
   Uniform Buffer Object는 Uniform Block이 사용할 값이 들어있는 버퍼를 뜻합니다.
   원하는만큼 UniformBufferObject를 만들수 있으며 그 중 하나를 특정한 Uniform Block에 bind하여 그릴 수 있습니다. 

   예를 들면, 하나의 쉐이더에 4개의 Uniform Block들이 정의되어 있다고 합시다.

   * 투영 행렬, 뷰 행렬 등 과 같은 모든 draw 호출에 대해 동일한 행렬을 포함하는 전역 행렬 Uniform Block

   * 모델마다 다른 행렬 ex)월드 행렬, 법선 행렬 을 포함하는 모델 별 Uniform Block

   * 확산, 주변, 반사 등의 material 설정을 포함하는 material Uniform Block

   * 밝은 색상, 밝은 위치 등과 같은 조명 데이터가 포함된 조명 Uniform Block

   그런 다음 런타임에 전역 Uniform Buffer Object, 모델 별 Uniform Buffer Object, 조명 별 Uniform Buffer Object, 재질 별 Uniform Buffer         Object를 각각 하나씩 만듭니다.

   모든 값이 이미 최신의 값이라고 가정하고 어떤 특정 항목을 그리려면 필요한 4개의 Uniform Buffer Object를 바인딩만 하면 됩니다.

       gl.bindBufferRange(..., globalBlockIndx, globalMatrixUBO, ...);
       gl.bindBufferRange(..., modelBlockIndx, someModelMatrixUBO, ...);
       gl.bindBufferRange(..., materialBlockIndx, someMaterialSettingsUBO, ...);
       gl.bindBufferRange(..., lightBlockIndx, someLightSettingsUBO, ...);

##  Integer textures, attributes and math

WebGL2에서는 WebGL1에서 처럼 부동 소수점 값으로 표현하지 않더라도 모든 텍스처가 부동 소수점 값을 나타내는 정수 기반 텍스를 가질 수 있습니다.
정수 속성을 가질 수도 있습니다.
또한 GLSL 300에서는 쉐이더에서 정수를 bit manipulation 할 수 있습니다.

##  Transform feedback

WebGL2는 버텍스 쉐이더가 그 결과를 다시 버퍼에 쓸 수 있게 합니다.

##  Samplers

WebGL1에서 모든 텍스처 매개변수는 텍스처마다 존재했습니다. WebGL2에서는 필요에따라 샘플러 객체를 사용할 수 있습니다. 샘플러를 사용하면 텍스처 일부였던 모든 필터링,반복,클램핑 매개변수들은 샘플러로 이동하게 됩니다. 즉, 하나의 텍스처를 여러가지 다른 방식으로 샘플링 할 수 있습니다.

필자의 말 : 나는 여섯개의 게임 엔진을 제작해봤지만 개인적으로 여러가지 방법으로 텍스처를 필터링 해야 하는 아티스트를 본 적이 없습니다. 혹시 다른 게임 엔진 개발자들도 다른 경험이 있는지 궁금합니다.

## Depth Textures

Depth 텍스처는 WebGL1 + PITA 로 해결할 수 있는 선택 사항이었습니다. 이제는 표준이며 일반적으로 쉐도우 맵을 계산하는데 사용됩니다.

## Standard Derivatives

Derivatives는 이제 표준입니다. 일반적으로 셰이더에 법선을 전달하는대신 셰이더 내부에서 계산하는 데에 쓰입니다.

## Instanced Drawing

이제 표준입니다. 일반적인 용도는 많은양의 나무,관목 또는 잔디 등을 빠르게 그리는 것입니다.

## UNSIGNED_INT indices

32bit int 인덱스는 인덱싱 된 geometry의 크기 제한을 풀어줍니다.

## Setting `gl_FragDepth`

깊이 버퍼 / z 버퍼에 사용자 정의 값을 쓸 수 있습니다.

## Blend Equation MIN / MAX

블렌드 할때 두 색상의 최소 또는 최대 를 가질 수 있습니다.

## Multiple Draw Buffers

쉐이더에서 여러 버퍼를 한 번에 그릴 수 있습니다. 일반적으로 다양한 지연 렌더링 기술에 사용됩니다.

## Texture access in vertex shaders

WebGL1에서는 선택적 기능이었습니다. 버텍스 쉐이더 에서 접근 할 수 있는 텍스처는 0개 이어야 했습니다.
대부분의 기기가 이것을 지원했습니다. WebGL2에서는 최소 16개 이상이어야 합니다.

## Multi-Sampled renderbuffers

WebGL1에서 캔버스 자체는 멀티 샘플 시스템에 내장 된 GPU로 안티 앨리어싱을 적용 할 수 있었지만 사용자 정의 멀티 샘플링은 지원하지 않았습니다. WebGL2에서는 멀티 샘플 렌더 버퍼를 직접 만들 수 있습니다.

## Occlusion Queries

Occlusion 쿼리를 사용하면 GPU에 어떤 픽셀을 실제로 렌더링할지 여부를 확인하도록 요청할 수 있습니다.

## Floating point textures always available

부동 소수점 텍스처는 많은 특수 효과 및 계산에 사용됩니다. WebGL1에서는 선택 사항이었지만 WebGL2에서는 기본적으로 지원합니다. 

노트: 안타깝게도 부동 소수점 텍스에 대한 필터링 및 렌더링은 여전히 선택 사항이므로 제한적입니다.

참고
[`OES_texture_float_linear`](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/)
[`EXT_color_buffer_float`](https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/).
