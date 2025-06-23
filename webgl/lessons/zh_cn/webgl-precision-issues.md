Title: WebGL2 精度问题
Description: WebGL2里的各种精度问题
TOC: 精度问题

本文讨论 WebGL2 中的各种精度问题。

## `lowp`, `mediump`, `highp`

在[本站的第一篇文章](webgl-fundamentals.html)中，我们创建了顶点着色器和片段着色器。
在创建片段着色器时，顺带提到片段着色器没有默认的精度，所以我们需要通过添加这行代码来设置。

```glsl
precision highp float;
```

这到底是怎么回事？

`lowp`、 `mediump` 和 `highp`是精度设置。
这里的精度实际上指的是用多少位(bit)来存储一个值。
JavaScript 中的数字使用 64 位，大多数 WebGL 中的数字只有 32 位。
位数越少意味着速度越快，位数越多意味着精度越高和/或范围越大。

我不确定自己是否能解释清楚。
你可以搜索[double vs float](https://www.google.com/search?q=double+vs+float)
了解更多精度问题的示例，但一种简单的理解方法是将其比作字节和短整型，或者在 JavaScript 中的 Uint8Array 和 Uint16Array 的区别。

* Uint8Array 是一个无符号 8 位整数数组。8 位能表示 2<sup>8</sup>（256）个数，范围是 0 到 255。
* Uint16Array 是一个无符号 16 位整数数组。16 位能表示 2<sup>16</sup>（65536）个数，范围是 0 到 65535。
* Uint32Array 是一个无符号 32 位整数数组。32 位能表示 2<sup>32</sup>（约42亿）个数，范围是 0 到 4294967295。

`lowp`、`mediump` 和 `highp` 也是类似的概念。

* `lowp` 至少是 9 位。对于浮点数，其值范围大致是 -2 到 +2，整数则类似于 `Uint8Array` 或 `Int8Array`。
* `mediump` 至少是 16 位。对于浮点数，其值范围大致是 -2<sup>14</sup> 到 +2<sup>14</sup>，整数类似于 `Uint16Array` 或 `Int16Array`。
* `highp` 至少是 32 位。对于浮点数，其值范围大致是 -2<sup>62</sup> 到 +2<sup>62</sup>，整数类似于 `Uint32Array` 或 `Int32Array`。

需要注意的是，并非范围内的所有数值都能被表示。
最容易理解的是 `lowp`，它只有 9 位，因此只能表示 512 个唯一值。
虽然它的范围是 -2 到 +2，但在这之间有无限多个值，比如 1.9999999 和 1.999998，这两个数值都不能被 `lowp` 精确表示。
例如，如果你用 `lowp` 做颜色计算，可能会出现色带现象。颜色范围是 0 到 1，而 lowp 在 0 到 1 之间大约只有 128 个可表示值。
这意味着如果你想加一个非常小的值（比如 1/512），它可能根本不会改变数值，因为无法被表示，实际上就像加了 0。

理论上，我们可以在任何地方使用 `highp` 完全避免这些问题，但在实际设备上，使用 `lowp` 和 `mediump` 通常会比 `highp` 快很多，有时甚至显著更快。

还有一点，和 `Uint8Array`、`Uint16Array` 不同的是，`lowp`、`mediump`、`highp` 允许在内部使用更高的精度（更多位）。
例如，在桌面 GPU 上，如果你在着色器中写了 `mediump`，它很可能仍然使用 32 位精度。
这导致在开发时很难测试 `lowp` 或 `mediump` 的真正表现。
要确认你的着色器在低精度设备上能正常工作，必须在实际使用较低精度的设备上测试。

如果你想用 `mediump` 以提高速度，常见问题包括比如点光源的高光计算，它在世界空间或视图空间传递的值可能超出 `mediump` 的范围。
可能在某些设备上你只能舍弃高光计算。下面是将[点光源](webgl-3d-lighting-point.html)示例的片段着色器改为 `mediump` 的代码示例：

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

注意：即便如此还不够。在顶点着色器中我们有以下代码：

```glsl
  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
```

假设光源距离表面有 1000 个单位。
然后我们进入片段着色器，执行这一行代码：

```glsl
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
```

看起来似乎没问题。除了归一化向量的常规方法是除以其长度，而计算长度的标准方式是：


```
  float length = sqrt(v.x * v.x + v.y * v.y * v.z * v.z);
```

如果 x、y 或 z 中的某一个值是 1000，那么 1000×1000 就是 1000000。
而 1000000 超出了 `mediump` 的表示范围。

这里的一个解决方案是在顶点着色器中进行归一化（normalize）。

```
  // compute the vector of the surface to the light
  // and pass it to the fragment shader
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+  v_surfaceToLight = normalize(u_lightWorldPosition - surfaceWorldPosition);
```

现在赋值给 `v_surfaceToLight` 的数值范围在 -1 到 +1 之间，这正好落在 `mediump` 的有效范围内。

请注意，在顶点着色器中进行归一化实际上不会得到完全相同的结果，但结果可能足够接近，以至于除非并排对比，否则没人会注意到差异。

像 `normalize`、`length`、`distance`、`dot` 这样的函数都会面临一个问题：如果参与计算的值过大，那么在 `mediump` 精度下就可能超出其表示范围。

不过，你实际上需要在一个 `mediump` 为 16 位的设备上进行测试。在桌面设备上，`mediump` 实际上使用的是与 `highp` 相同的 32 位精度，因此任何相关的问题在桌面上都不会显现出来。

## 检测对16位 `mediump` 的支持

你调用 `gl.getShaderPrecisionFormat`，传入着色器类型（`VERTEX_SHADER` 或 `FRAGMENT_SHADER`），以及以下精度类型之一：

- `LOW_FLOAT`
- `MEDIUM_FLOAT`
- `HIGH_FLOAT`
- `LOW_INT`
- `MEDIUM_INT`
- `HIGH_INT`

它会[返回精度信息]。

{{{example url="../webgl-precision-lowp-mediump-highp.html"}}}

`gl.getShaderPrecisionFormat` 会返回一个对象，包含三个属性：`precision`、`rangeMin` 和 `rangeMax`。

对于 `LOW_FLOAT` 和 `MEDIUM_FLOAT`，如果它们实际上就是 `highp`，那么 `precision` 将是 23。否则，它们通常分别是 8 和 15，或者至少会小于 23。对于 `LOW_INT` 和 `MEDIUM_INT`，如果它们等同于 `highp`，那么 `rangeMin` 会是 31。如果小于 31，则说明例如 `mediump int` 比 `highp int` 更高效。

我的 Pixel 2 XL 对于 `mediump` 和 `lowp` 都使用 16 位。我不确定自己是否用过使用 9 位表示 `lowp` 的设备，因此也不清楚在这种情况下通常会遇到哪些问题。

在本文系列中，我们在片段着色器中通常会指定默认精度。我们也可以为每个变量单独指定精度，例如：


```glsl
uniform mediump vec4 color;  // a uniform
in lowp vec4 normal;         // an attribute or varying input
out lowp vec4 texcoord;      // a fragment shader output or varying output
lowp float foo;              // a variable
```

## 纹理格式

纹理是规范中另一个指出“实际使用的精度可能高于请求精度”的地方。

例如，你可以请求一个每通道 4 位、总共 16 位的纹理，像这样：

```
gl.texImage2D(
  gl.TEXTURE_2D,               // target
  0,                           // mip level
  gl.RGBA4,                    // internal format
  width,                       // width
  height,                      // height
  0,                           // border
  gl.RGBA,                     // format
  gl.UNSIGNED_SHORT_4_4_4_4,   // type
  null,
);
```

但实现上实际上可能在内部使用更高分辨率的格式。  
我认为大多数桌面端会这样做，而大多数移动端 GPU 不会。

我们可以做个测试。首先我们会像上面那样请求一个每通道 4 位的纹理。  
然后我们会通过渲染一个 0 到 1 的渐变来[渲染到它](webgl-render-to-texture.html)。

接着我们会将该纹理渲染到画布上。如果纹理内部确实是每通道 4 位，  
那么从我们绘制的渐变中只会有 16 个颜色级别。  
如果纹理实际上是每通道 8 位，我们将看到 256 个颜色级别。

{{{example url="../webgl-precision-textures.html"}}}

在我的智能手机上运行时，我看到纹理使用的是每通道4位  
（至少红色通道是4位，因为我没有测试其他通道）。

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

而在我的桌面上，我看到纹理实际上使用的是每通道8位，  
尽管我只请求了4位。

<div class="webgl_center"><img src="resources/desktop-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

需要注意的一点是，WebGL 默认会对结果进行抖动处理，  
使这种渐变看起来更平滑。你可以通过以下方式关闭抖动：


```js
gl.disable(gl.DITHER);
```

如果我不关闭抖动处理，那么我的智能手机会产生这样的效果。

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

就我目前所知，这种情况通常只会在以下特定场景出现：当开发者将某种低比特精度的纹理格式用作渲染目标，却未在实际采用该低分辨率的设备上进行测试时。
若仅通过桌面端设备进行测试，由此引发的问题很可能无法被发现。
