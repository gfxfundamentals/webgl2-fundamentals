Title: WebGL2有什么新内容
Description: WebGL2有什么新内容
TOC: WebGL2有什么新内容


WebGL2是WebGL1的一次非常重要的升级。如果你已经很熟悉WebGL1，并希望了解如何调整你的代码，以便利用 WebGL2的优势，看[迁移WebGL1到WebGL2](webgl1-to-webgl2.html)这篇文章。

以下是没有特别顺序的特性列表

## 顶点数组对象始终可用

我认为这是相当重要的，在WebGL1中是选择可用，现在在WebGL2中始终可用，[我认为你应该始终使用它们](webgl1-to-webgl2.html#Vertex-Array-Objects).

## 着色器中可以获取纹理大小

在WebGL1中，如果你的着色器需要知道纹理的大小，你需要手动用uniform传递纹理大小。在WebGL2中你可以调用 

    vec2 size = textureSize(sampler, lod)

来获取任何lod层的纹理 

## 直接选取纹素

在纹理中很方便存储大量数组数据。WebGL 1中你可以这么做，但是你得用纹理坐标(0.0 到 1.0)来寻址。在WebGL2中，你可以在纹理中直接用像素／纹素坐标来选取值，使得数据获取简单一些。 

    vec4 values = texelFetch(sampler, ivec2Position, lod);

## 更多纹理格式

WebGL1只有一部分纹理格式。 WebGL2有许多!

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

## 3D 纹理

3D 纹理就是纹理有3个纬度。

## 纹理数组

纹理数组和3D 纹理很相似，除了每个切片都是单独的纹理。所有切片都必须是相同的大小，但这给了着色器很好的方法来访问数百个纹理，即使它只有相对较少的纹理单元。你可以这样在着色器中选择切片。

    vec4 color = texture(someSampler2DArray, vec3(u, v, slice));

## 非2的幂纹理支持

WebGL1中不是2的幂的纹理不能有mip。WebGL2移除了限制，非2的幂大小的纹理和2的幂大小的纹理一样工作。 

## 移除着色器循环限制

WebGL1中，着色器中的循环必须使用常量整数表达式。
WebGL2移除了这个限制(GLSL 300 es)

## GLSL中的矩阵函数

WebGL1中，如果需要获得矩阵的逆，你需要将它作为uniform传给着色器。WebGL2 GLSL 300 es里有内置的`inverse` 函数，同样有转置函数`transpose`。

## 常见的压缩纹理

WebGL1中有许多压缩纹理格式是硬件依赖的。S3TC基本上只是桌面支持。PVTC只有iOS。其他..

WebGL2中这些格式应该在任何地方得到支持。 

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

## Uniform 缓冲对象

Uniform缓冲对象可以让你在缓冲中指定一组uniform。优点是

1. 你可以在WebGL之外在缓冲中操作所有的uniform 

   WebGL1中如果你有16个uniform，则要求16次对`gl.uniformXXX`的调用。这相对比较慢。
   WebGL2中如果你使用Uniform缓冲对象，你可以在JavaScript中设置一个类型化数组的值，这会快很多。当所有的值设定好，你用1次调用`gl.bufferData`或者`gl.bufferSubData`上传它们，之后`gl.bindBufferRange`告诉程序使用缓冲，所以只有2次调用。

2. 你可以有不同的uniform缓冲对象组 

   Uniform块是定义在着色器中的uniform集合。Uniform 缓冲对象包含一个Uniform块会使用的值。你可以创建你想要数量的Uniform缓冲对象，绘制时绑定其中一个给某一个Uniform块。

   例如，在着色器中你定义了4个uniform块。 

   * 一个全局矩阵uniform块包括所有绘制调用都相同的投影矩阵，视图矩阵，等。 

   * 每个模型uniform块包括每个模型都不同的矩阵，例如世界矩阵和法线矩阵。

   * 一个材质uniform块包含材质设置，例如包括漫反射，环境光，高光，等..

   * 一个光照uniform块包括光照数据像光颜色，光源位置，等..

   然后在运行时，你可以创建一个全局uniform缓冲对象，每个模型一个模型uniform缓冲对象，每个光源一个光照uniform缓冲对象和每个材质的uniform缓冲对象。

   绘制任何物体假设所有数据已经更新，所有你要做的就是绑定你需要的4个uniform缓冲对象

       gl.bindBufferRange(..., globalBlockIndx, globalMatrixUBO, ...);
       gl.bindBufferRange(..., modelBlockIndx, someModelMatrixUBO, ...);
       gl.bindBufferRange(..., materialBlockIndx, someMaterialSettingsUBO, ...);
       gl.bindBufferRange(..., lightBlockIndx, someLightSettingsUBO, ...);

##  整数纹理，整数attribute和数学运算

在WebGL2中，你可以用纹理获得整数，在WebGL1中，所有纹理都表示为浮点值即使它们没用浮点值表示。

你也能有整数attribute。

最重要的是，GLSL 300 es允许在着色器中对整数进行位操作。

##  数据回传

WebGL2允许顶点着色器将结果写回到到缓冲里。

##  采样

在WebGL1中，每个纹理设置纹理参数。 
在WebGL2中，你可以选择用采样对象。用采样器，筛选，重复／clamp参数所有纹理的部分都改变给采样器。这意味着一个纹理可以用多种方式采样。重复或者clamp。筛选或者不筛选。 

## 深度纹理

深度纹理在WebGL1中是可选的，使用起来很麻烦。现在它成为标准。常用于计算阴影贴图。

## 标准导数

导数现在是标准部分。普遍用法包括在着色器中计算法线代替传入

## 实例绘制

现在是标准部分，通常用于快速绘制许多树，灌木丛或者草。

## UNSIGNED_INT索引

可以用32位整数作为索引，移除了几何体索引的大小限制 

## 设置`gl_FragDepth`

使你能够在深度缓存/z-buffer中写入自定义的值。

## 混合公式MIN / MAX

可以使用min或max来混合2种颜色 

## 多绘制缓冲

在着色器中可以一次绘制到多缓冲。常用于各种延迟渲染技术。

## 顶点着色器中纹理访问

WebGL1中这是可选特性。在顶点着色器中有一个你可以访问的纹理数量，可以为0。大多数设备支持它。在WebGL2中，这个数量要求至少为16。

## 多采样渲染缓冲 

在WebGL1中画布本身可以用GPU的内置多采样系统来抗锯齿，但不支持用户控制的多采样。在WebGL2中你可以创建多采样渲染缓冲。

## 遮挡查询

遮挡查询让你能够使GPU检查是否是实际需要渲染的。

## 浮点纹理始终可用

浮点纹理用于许多特殊效果和计算。在WebGL1中他们是可选的。在WebGL2中，它存在。

注意：不幸的是，仍然对筛选方式有限制，渲染到浮点纹理依旧可选。参阅[`OES_texture_float_linear`](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/)和[`EXT_color_buffer_float`](https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/).


