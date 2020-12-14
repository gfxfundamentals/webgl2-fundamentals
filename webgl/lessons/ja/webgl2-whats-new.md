Title: WebGL2の新機能
Description: WebGL2の新機能
TOC: WebGL2の新機能

WebGL2はWebGL1からかなり大幅にアップグレードされています。
WebGL1からWebGL2へ変更する方法を知りたい場合は、[この記事](webgl1-to-webgl2.html)を参照して下さい。

以下は、WebGL2新機能の順不同のリストです。

## 頂点配列オブジェクトが常に利用可能

WebGL1ではオプション指定ですが、WebGL2では常に利用可能になりました。
これはかなり重要で[常に使った方がいいと思います](webgl1-to-webgl2.html#Vertex-Array-Objects)。

## テクスチャのサイズはシェーダーで利用可能

WebGL1ではシェーダーでテクスチャサイズがほしい場合、ユニフォームでサイズを渡す必要がありました。
WebGL2では以下のようになります。

    vec2 size = textureSize(sampler, lod)

lodはテクスチャのレベルを指定します。

## ダイレクトテクセルルックアップ

大きな配列のデータをテクスチャに保存しておくと便利な事が多いです。
WebGL1でもそれができましたが、テクスチャのアドレスはテクスチャ座標（0.0～1.0）でしか指定できませんでした。
WebGL2では、ピクセル/テクセル座標で直接テクスチャの値を調べられるので、配列へのアクセスが少し簡単になります。

    vec4 values = texelFetch(sampler, ivec2Position, lod);

## テクスチャフォーマットが豊富

WebGL1にはテクスチャフォーマットが数種類しかありませんでした。
WebGL2ではたくさんの種類があります！

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

## 3Dテクスチャ

3Dテクスチャは、名前の通り3Dのテクスチャです。

## テクスチャ配列

テクスチャ配列は各スライスが別のテクスチャとみなされる点を除き、3Dテクスチャに非常によく似ています。
全てのスライスは同じサイズでなければなりません。
しかし、これはシェーダーがテクスチャユニットの数が比較的少ないにも関わらず、何百ものテクスチャにアクセスできます。
シェーダーでスライスを選択する事ができます。

    vec4 color = texture(someSampler2DArray, vec3(u, v, slice));

## 2のべき乗の以外のテクスチャサポート

WebGL1では、2のべき乗でないテクスチャはミップマップを持てませんでした。
WebGL2ではこの制限は削除されています。
2のべき乗でないテクスチャは、2のべき乗のテクスチャと同じように動作します。

## シェーダーのループ制限を解除

WebGL1では、シェーダ内のループは定数整数式を使用しなければなりませんでした。
WebGL2 はその制限を取り除きます (GLSL 300 es)

## GLSLの行列関数

WebGL1では逆行列を取得する場合、ユニフォームに渡さなければなりませんでした。
WebGL2 GLSL 300 esでは、`transpose` と同様に `inverse` 関数が組み込まれています。

## 一般的な圧縮テクスチャ

WebGL1では、ハードウェアに依存する様々な圧縮テクスチャフォーマットがありました。
S3TCはデスクトップのみ、PVTCはiOSのみなどなど。

WebGL2では、これらのフォーマットはどこでもサポートされています。

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

## ユニフォームバッファオブジェクト

ユニフォームバッファオブジェクトは、たくさんのユニフォームを指定できます。
メリットは以下の通りです。

1. WebGLの外でバッファ内の全てのユニフォームを操作できます

   WebGL1で16個のユニフォームがあった場合、`gl.uniformXXX` を16回呼び出す必要がありました。
   それは比較的遅いです。
   WebGL2では、ユニフォームバッファオブジェクトを使用すると、
   型付き配列を全てJavaScript内で使用する事ができ、これははるかに高速である事を意味します。
   全ての値が設定されたら、`gl.bufferData` または `gl.bufferSubData` を 1 回呼び出して全ての値をアップロードします。
   `gl.bindBufferRange` でそのバッファを使用するようにプログラムで指示し、2回の呼び出しを行います。

2. 異なるユニフォームバッファオブジェクトのセットを持てます

   最初にいくつかの用語を説明します。
   ユニフォームブロックは、シェーダーで定義されたユニフォームの集合体です。
   ユニフォームバッファオブジェクトは、ユニフォームブロックが使用する値を含むバッファです。
   ユニフォームバッファオブジェクトを好きなだけ作成し、描画時に特定のユニフォームブロックにバインドできます。

   例えば、シェーダーで4つのユニフォームをブロックする事ができます。

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
   light uniform buffer object per light and one uniform buffer
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
or clamped. Filtered or not filtered.

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
multi-sample system but there was no support for user controlled multi-sampling. In WebGL2
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


