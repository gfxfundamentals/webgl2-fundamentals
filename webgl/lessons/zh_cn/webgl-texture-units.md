Title: WebGL2 纹理单元（Texture Units）
Description: WebGL 中的纹理单元是什么？  
TOC: 纹理单元（Texture Units）

本文旨在帮助你直观理解 WebGL 中纹理单元是如何设置的。  
关于[属性(attributes)](webgl-attributes.html)的使用，另有一篇专门文章进行了详细讲解。

在阅读本文之前，你可能需要先阅读：
- [WebGL 是如何工作的](webgl-how-it-works.html)
- [WebGL 着色器与 GLSL](webgl-shaders-and-glsl.html)
- [WebGL 纹理](webgl-3d-textures.html)

## 纹理单元（Texture Units）

在 WebGL 中有纹理。纹理是可以传入着色器的 2D 数据数组。  
在着色器中你会这样声明一个 *uniform 采样器*：

```glsl
uniform sampler2D someTexture;
```

但着色器如何知道 `someTexture` 对应的是哪一张纹理呢？

这就是纹理单元（Texture Unit）登场的地方了。
纹理单元是一个**全局数组**，保存着对纹理的引用。
你可以想象，如果 WebGL 是用 JavaScript 编写的，它可能拥有如下的全局状态：

```js
const gl = {
  activeTextureUnit: 0,
  textureUnits: [
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, TEXTURE_3D: null, TEXTURE_2D_ARRAY: null, },
  ];
}
```

如上所示，`textureUnits` 是一个数组。你可以把纹理绑定到这个纹理单元数组中某个位置的 *绑定点（bind point）* 上。
例如，将 `ourTexture` 绑定到纹理单元 5 上：

```js
// at init time
const ourTexture = gl.createTexture();
// insert code it init texture here.

...

// at render time
const indexOfTextureUnit = 5;
gl.activeTexture(gl.TEXTURE0 + indexOfTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, ourTexture);
```

然后你需要告诉着色器这个纹理变量（uniform）使用的是哪一个纹理单元： 

```js
gl.uniform1i(someTextureUniformLocation, indexOfTextureUnit);
```

如果 `activeTexture` 和 `bindTexture` 函数是用 JavaScript 实现的，可能看起来像这样：

```js
// PSEUDO CODE!!!
gl.activeTexture = function(unit) {
  gl.activeTextureUnit = unit - gl.TEXTURE0;  // convert to 0 based index
};

gl.bindTexture = function(target, texture) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  textureUnit[target] = texture;
}:
```

你甚至可以想象其它纹理相关函数是如何运作的。这些函数都接受一个 `target` 参数，
比如 `gl.texImage2D(target, ...)` 或 `gl.texParameteri(target)`，它们的实现可能像这样：

```js
// PSEUDO CODE!!!
gl.texImage2D = function(target, level, internalFormat, width, height, border, format, type, data) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture.mips[level] = convertDataToInternalFormat(internalFormat, width, height, format, type, data);
}

gl.texParameteri = function(target, pname, value) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture[pname] = value; 
}
```

从以上示例可以清楚地看到，`gl.activeTexture` 会设置 WebGL 内部的一个全局变量，
表示当前使用哪个纹理单元（在纹理单元数组中的索引）。

从此之后，所有其它纹理函数中传入的 `target` 参数实际上就是当前激活的纹理单元中要操作的绑定点。

## 最大纹理单元数（Maximum Texture Units）

WebGL 要求实现至少支持 32 个纹理单元。你可以通过如下方式查询实际支持的数量：

```js
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

需要注意的是，顶点着色器 和 片段着色器 对可用纹理单元数可能有不同限制。
你可以分别用如下方式查询：


```js
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
```
它们都至少需要支持 16 个纹理单元。

例如：

```js
maxTextureUnits = 32
maxVertexShaderTextureUnits = 16
maxFragmentShaderTextureUnits = 32
```

这意味着，如果你在顶点着色器中使用了 2 个纹理单元，那么片段着色器最多只能再使用 30 个纹理单元，
因为两个着色器合起来总共不能超过 MAX_COMBINED_TEXTURE_IMAGE_UNITS 的限制（即 32）。
