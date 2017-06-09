Title: WebGL2 새로운 기능
Description: WebGL2의 새로운 기능

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

## Lots of texture formats

WebGL1 had just a few texture formats. WebGL2 has TONS!

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

## 3D Textures

3D texture are just that. Textures that have 3 dimensions.

## Texture arrays

A texture array is very similar to a 3D texture except that
each slice is considered a separate texture. All the slices
have to be the same size but this is a great way to give
a shader access to hundreds of textures even though it
only has a relatively small number of texture units. You can
select the slice in your shader

    vec4 color = texture(someSampler2DArray, vec3(u, v, slice));

## Non-Power of 2 Texture Support

in WebGL1 textures that were not a power of 2 could not have mips.
In WebGL2 that limit is removed. Non-power of 2 texture work exactly
the same as power of 2 textures.

## Loop restrictions in shaders removed

In WebGL1 a loop in a shader had to use a constant integer expression.
WebGL2 removes that limit (in GLSL 300 es)

## Matrix functions in GLSL

In WebGL1 if needed to get the inverse of a matrix you had to
pass it in as a uniform. In WebGL2 GLSL 300 es there's the built in
`inverse` function as well as `transpose`.

## Common compressed textures

In WebGL1 there are various compressed texture formats
that are hardware dependent. S3TC was bascially desktop only.
PVTC was iOS only. Etc..

In WebGL2 these formats are supposed to be supported everywhere

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

Uniform Buffer Objects let you specify a bunch of uniforms
from a buffer. The advantages are

1. You can manipulate all the uniforms in the buffer
   outside of WebGL

   In WebGL1 if you had 16 uniforms that would require
   16 calls to `gl.uinformXXX`. That is relatively slow.
   In WebGL2 if you use
   a Uniform Buffer Object you can set the values in
   a typed array all inside JavaScript which means it's
   much much faster. When all the values are set
   you upload them all with 1 call to `gl.bufferData`
   or `gl.bufferSubData` and then tell the program
   to use that buffer with `gl.bindBufferRange` so only
   2 calls.

2. You can have different sets of uniforms buffer objects

   First some terms. A Uniform Block is a collection
   of uniforms defined in a shader. A Uniform Buffer Object
   is a buffer that contains the values a Uniform Block
   will use. You can create as many Uniform Buffer Objects
   as you want and bind one of them to a particular Uniform Block
   when you draw.

   For example, you could have 4 uniform blocks defined
   in a shader.

   * A global matrix uniform block that contains
     matrices that are the same for all draw calls like the
     projection matrix, view matrix, etc.

   * A per model uniform block that contains matrices that are
     different per model for example the world matrix and
     normal matrix.

   * A material uniform block that contains the material settings
     like diffuse, ambient, specular, etc..

   * A lighting uniform block that contains the lighting data
     like light color, light position, etc..

   Then at runtime you could create one global uniform buffer
   object, one model uniform buffer object per model, one
   light uinform buffer object per light and one uniform buffer
   object per material.

   To draw any particular item assuming all the values are
   already up to date all you have to do is bind your desired
   4 uniform buffer objects

       gl.bindBufferRange(..., globalBlockIndx, globalMatrixUBO, ...);
       gl.bindBufferRange(..., modelBlockIndx, someModelMatrixUBO, ...);
       gl.bindBufferRange(..., materialBlockIndx, someMaterialSettingsUBO, ...);
       gl.bindBufferRange(..., lightBlockIndx, someLightSettingsUBO, ...);

##  Integer textures, attributes and math

In WebGL2 you can have integer based textures where as
in WebGL1 all textures represented floating point values
even if they weren't represented by floating point values.

You can also have integer attributes.

On top of that, GLSL 300 es allows you to do bit manipulations
of integers in the shaders.

##  Transform feedback

WebGL2 allows your vertex shader to write its results back
to a buffer.

##  Samplers

In WebGL1 all the texture parameters were per texture.
In WebGL2 you can optionally use sampler objects. With
samplers, all the filtering and repeat/clamping parameters
that were part of a texture move to the sampler. This means
a single texture can be sampled in different ways. Repeating
or clampped. Filtered or not filtered.

A mini side rant: I've written 6 game engines. I've never
personally ever had a artist need to filter textures in
multiple ways. I'd be curious to know if any other game
engine devs have had a different experience.

## Depth Textures

Depth textures were optional in WebGL1 and a PITA to work around. Now they're standard.
Commonly used for computing shadow maps

## Standard Derivatives

These are now standard. Common uses include computing normals in the shaders instead of passing them in

## Instanced Drawing

Now Standard, common uses are drawing lots of trees, bushes or grass quickly.

## UNSIGNED_INT indices

Being able to use 32bit ints for indices removes the size limit of indexed geometry

## Setting `gl_FragDepth`

Letting you write your own custom values to the depth buffer / z-buffer.

## Blend Equation MIN / MAX

Being able to take the min or max of 2 colors when blending

## Multiple Draw Buffers

Being able to draw to multiple buffers at once from a shader. This is commonly used
for various deferred rendering techniques.

## Texture access in vertex shaders

In WebGL1 this was an optional feature. There was a count of how many textures
you could access in a vertex shader and that count was allowed to be 0. Most
devices supported them. In WebGL2 that count is required to be at least 16.

## Multi-Sampled renderbuffers

In WebGL1 the canvas itself could be anti-aliased with the GPU's built in
multi-sample system but there was no support for user controlled mutli-sampling. In WebGL2
you can now make multi-sampled renderbuffers.

## Occlusion Queries

Occlusion queries let you ask the GPU to check if it were to render something
would any pixels actually get drawn.

## Floating point textures always available

Floating point textures are used for many special effects
and calculations. In WebGL1 they were optional. In WebGL2
they just exist.

Note: Unfortunately they are still restricted in that filtering
and rendering to float point textures is still optional. See
[`OES_texture_float_linear`](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/)
 and [`EXT_color_buffer_float`](https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/).
