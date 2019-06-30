Title: 迁移WebGL1到WebGL2
Description: 怎样迁移WebGL1到WebGL2
TOC: 迁移WebGL1到WebGL2


WebGL2几乎100%向后兼容WebGL1.
如果你只使用WebGL1的特性，只有两点不同。

1.  调用`getContext`时，你使用`"webgl2"`代替`"webgl"` 

        var gl = someCanvas.getContext("webgl2");

    注意：没有"experimental-webgl2"。浏览器厂商达成共识，不再有前缀。

2.  许多扩展成为WebGL2的标准部分，所以不再用扩展的方式获得 

    例如，顶点数组对象`OES_vertex_array_object`是WebGL2标准特性。例如使用WebGL1你是这样做的 

        var ext = gl.getExtension("OES_vertex_array_object");
        if (!ext) {
          // 告诉用户没有此扩展或者使用其他方式
        } else {
          var someVAO = ext.createVertexArrayOES();
        }

    使用WebGL2你应该这样写

        var someVAO = gl.createVertexArray();

    因为它已经存在。

除此之外，所有WebGL1的东西应该都能工作。

要利用一些WebGL2特性的优势，你还是需要做一些改变。

## 切换到GLSL 300 es

最大的变化是你应该将着色器升级到GLSL 3.00 ES。着色器第一行需要是

    #version 300 es

**注意：必须严格在第一行。不能有注释，不能有空行。**

这是错误的

    // 错误!!!!                +---这有空行
    // 错误!!!!                V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

这也是错误的

    <!-- 错误!!                   V<- 这有空行-->
    <script id="vs" type="notjs">
    #version 300 es
    ...
    </script>

这是正确的

    var vertexShaderSource = `#version 300 es
    ...
    `;

这也是正确的

    <script id="vs" type="notjs">#version 300 es
    ...
    </script>

或者你可以让你的着色器编译函数去掉开始的空行。

### GLSL 300 es和GLSL 100的不同

有一些在着色器中要改动的差异，上面已经提到需要在最前面添加版本字符串。

#### `attribute` -> `in`

GLSL 100中这样定义

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec3 a_normal;

在GLSL 300 es中变成了

    in vec4 a_position;
    in vec2 a_texcoord;
    in vec3 a_normal;

#### `varying`变为`in` / `out`

在GLSL 100中，你在顶点着色器和片断着色器中都用varying声明 

    varying vec2 v_texcoord;
    varying vec3 v_normal;

在GLSL 300 es中，顶点着色器的varying变为

    out vec2 v_texcoord;
    out vec3 v_normal;

在片断着色器中变为

    in vec2 v_texcoord;
    in vec3 v_normal;

#### 不再有`gl_FragColor`

在GLSL 100中，通过赋值给内置变量`gl_FragColor`来设置片断着色器的输出。

    gl_FragColor = vec4(1, 0, 0, 1);  // 红色

在GLSL 300 es中你声明自己的输出变量并给它赋值。

    out vec4 myOutputColor;

    void main() {
       myOutputColor = vec4(1, 0, 0, 1);  // red
    }

注意：你可以随便定义变量名但是**不能**用`gl_`开头，所以你不能这样定义`out vec4 gl_FragColor`

#### `texture2D` -> `texture` etc.

在GLSL 100中，你像这样从纹理中获取颜色

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture2D(u_some2DTexture, ...);
    vec4 color2 = textureCube(u_someCubeTexture, ...);

在GLSL 300es中， 纹理函数会自动根据类型判断，所以只使用`texture`即可

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture(u_some2DTexture, ...);
    vec4 color2 = texture(u_someCubeTexture, ...);

## 纳入标准的特性

WebGL1中许多特性是可选扩展。在WebGL2中，以下所有的都是标准特性

* 深度纹理([WEBGL_depth_texture](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/))
* 浮点型纹理([OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/)/[OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/))
* 顶点数组对象([OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/))
* 标准导数([OES_standard_derivatives](https://www.khronos.org/registry/webgl/extensions/OES_standard_derivatives/))
* 实例绘制([ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/))
* UNSIGNED_INT索引([OES_element_index_uint](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/))
* 设置`gl_FragDepth` ([EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/))
* 混合公式MIN/MAX ([EXT_blend_minmax](https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/))
* 直接纹理LOD获取([EXT_shader_texture_lod](https://www.khronos.org/registry/webgl/extensions/EXT_shader_texture_lod/))
* 多种绘制缓冲([WEBGL_draw_buffers](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/))
* 在顶点着色器中获得纹理

## 支持非2的幂纹理 

在WebGL1中，不是2的幂大小的纹理不能有mip。
在WebGL2中，限制被去掉了。不是2的幂大小的纹理同样工作 

## 浮点型帧缓冲附加物

在WebGL1中，检查是否支持渲染浮点型纹理，你需要首先检查是否支持`OES_texture_float`扩展，然后你创建一个浮点型纹理，将它添加到一个帧缓冲，调用
`gl.checkFramebufferStatus`看它是否返回`gl.FRAMEBUFFER_COMPLETE`。

在WebGL2中，你需要检查并启用`EXT_color_buffer_float`否则对于浮点纹理
`gl.checkFramebufferStatus`不会返回`gl.FRAMEBUFFER_COMPLETE`。

注意对于`HALF_FLOAT`帧缓冲也是这样。

> 如果你好奇，在WebLG1规范中这是一个*bug*。WebGL1发布，`OES_texture_float`被添加，
> 并且被设定的正确使用方式是创建一个纹理，附加给帧缓冲，并检查状态。
> 之后有人指出根据规范这是不够的因为规范说片断着色器中写入的颜色值总是clamp到0至1之间。
> `EXT_color_buffer_float`移除了这个clamp限制，但是因为WebGL已经发布一年，
> 强制限制会破坏许多网站。对于WebGL2，刚好可以解决，所以现在必须启用`EXT_color_buffer_float`
> 来使用浮点纹理作为帧缓冲的附加物。
>
> 注意据我所知，截止2017年3月，很少有移动设备支持渲染浮点纹理。

## 顶点数组对象

上面的所有特性，我个人认为顶点数组对象是你经常应该使用的。其他任何特性取决于你想做什么，只有顶点数组对象是一个你应该经常使用的特性。

在WebGL1中，没有顶点数组对象，所有和attribute相关的数据都是全局WebGL状态。你可以想象它为 

    var glState = {
      attributeState: {
        ELEMENT_ARRAY_BUFFER: null,
        attributes: [
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
        ],
      },
   }

调用像`gl.vertexAttribPointer`，`gl.enableVertexAttribArray`和
`gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ??)`会影响全局状态。在绘制你想要绘制的事情之前，你需要设置所有属性，如果你绘制索引数据，你需要设置`ELEMENT_ARRAY_BUFFER`。

使用顶点数组对对象，上边的整个`attributeState`会变为一个*顶点数组*.

换句话说

    var someVAO = gl.createVertexArray();

创建上面`attributeState`的一个新的实例。

    gl.bindVertexArray(someVAO);

等同于

    glState.attributeState = someVAO;

这意味着你应该在初始时设置所有attribute。

    // 初始阶段
    // 对于每个模型/ 几何体 / ...
      var vao = gl.createVertexArray()
      gl.bindVertexArray(vao);
      // 对于每个attribute
        gl.enableVertexAttribArray(...);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferForAttribute);
        gl.vertexAttribPointer(...);
      // 如果是索引几何体
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);

然后在渲染阶段，使用几何体你需要

    gl.bindVertexArray(vaoForGeometry);

WebGL1中在初始化阶段的循环对象会发生在渲染阶段。
这是巨大的速度提升！

但有几点需要注意：

1.  attribute位置是程序独立的。

    如果你在多个程序里要使用相同的几何体考虑手动分配attribute位置。
    GLSL 300 es你可以在着色器中这样写

    例如：

        layout(location = 0) in vec4 a_position;
        layout(location = 1) in vec2 a_texcoord;
        layout(location = 2) in vec3 a_normal;
        layout(location = 3) in vec4 a_color;

    设置4个attributes的位置。

    你仍然可以使用WebGL1的方式，通过在调用`gl.linkProgram`之前调用`gl.bindAttribLocation`。

    例如：

        gl.bindAttribLocation(someProgram, 0, "a_position");
        gl.bindAttribLocation(someProgram, 1, "a_texcoord");
        gl.bindAttribLocation(someProgram, 2, "a_normal");
        gl.bindAttribLocation(someProgram, 3, "a_color");

    这意味着你使它们在多个着色器程序中共用。如果一个程序不需要所有attribute，他们需要的attribute会分配到相同的位置。

    如果你不这样做，对于不同的着色器程序使用相同的几何体你会需要不同的VAO，或者像在WebGL1中一样不使用VAO，在渲染阶段设置attribute，这很慢。

    注意：上面的2种方法我倾向于使用`gl.bindAttribLocation`因为在我的代码中将它放在一个位置更简单。`layout(location = ?)`需要存在于所有着色器中，所以不重复做同样的事情，`gl.bindAttribLocation`似乎更好。或许如果我使用着色器生成器就没有区别了。

2.  完成后，始终解除对VAO的绑定

        gl.bindVertexArray(null);

    这只是来自我自己的经验，如果上面的`ELEMENT_ARRAY_BUFFER`状态是顶点数组的一部分。

    所以，我遇见了这个问题。我创建了一些几何体，然后我创建了一个VAO来存几何体，并设置attribute和`ELEMENT_ARRAY_BUFFER`。然后我创建了另一些几何体。当几何体设置索引时，因为我仍然有之前的 VAO绑定，设置索引影响了前一个绑定`ELEMENT_ARRAY_BUFFER`的前一个VAO。这让我花了几个小时来调试。

    所以，我的建议是，如果你完成了，永远不要留下一个绑定的VAO。要么立即绑定下一个你要使用的VAO或者完成绑定到`null`

这就是在从WebGL1迁移到WebGL2时我个人觉得需要注意的事项列表。在[WebGL2有什么新内容](webgl2-whats-new.html)文章中有更多你可以做的事情。

<div class="webgl_bottombar">
<h3>让WebGL1扩展看起来像WebGL2</h3>
<p>WebGL1中在扩展上的函数在WebGL2中现在在主上下文上。例如在WebGL1中</p>
<pre class="prettyprint">
var ext = gl.getExtension("OES_vertex_array_object");
if (!ext) {
  // tell user they don't have the required extension or work around it
} else {
  var someVAO = ext.createVertexArrayOES();
}
</pre>
<p>
vs 在WebGL2中
</p>
<pre class="prettyprint">
var someVAO = gl.createVertexArray();
</pre>
<p>如你所见，如果你希望代码在WebGL1和WebGL2中都能运行，这会带来一些挑战。</p>
<p>一种解决方法是在初始时将WebGL1扩展复制到WebGL上下文。这种方法余下的代码可以保持不变。示例：</p>
<pre class="prettyprint">
const gl = someCanvas.getContext("webgl");
const haveVAOs = getAndApplyExtension(gl, "OES_vertex_array_object");

function getAndApplyExtension(gl, name) {
  const ext = gl.getExtension(name);
  if (!ext) {
    return null;
  }
  const fnSuffix = name.split("_")[0];
  const enumSuffix = '_' + fnSuffix;
  for (const key in ext) {
    const value = ext[key];
    const isFunc = typeof (value) === 'function';
    const suffix = isFunc ? fnSuffix : enumSuffix;
    let name = key;
    // WEBGL_compressed_texture_s3tc
    // 和WEBGL_compressed_texture_pvrtc不是true
    if (key.endsWith(suffix)) {
      name = key.substring(0, key.length - suffix.length);
    }
    if (gl[name] !== undefined) {
      if (!isFunc && gl[name] !== value) {
        console.warn("conflict:", name, gl[name], value, key);
      }
    } else {
      if (isFunc) {
        gl[name] = function(origFn) {
          return function() {
            return origFn.apply(ext, arguments);
          };
        }(value);
      } else {
        gl[name] = value;
      }
    }
  }
  return ext;
}
</pre>
<p>现在你的代码大部分可以同样工作，像这样</p>
<pre class="prettyprint">
if (haveVAOs) {
  var someVAO = gl.createVertexArray();
  ...
} else {
  ... do whatever for no VAOs.
}
</pre>
<p>替代方法是像这样做</p>
<pre class="prettyprint">
if (haveVAOs) {
  if (isWebGL2)
     someVAO = gl.createVertexArray();
  } else {
     someVAO = vaoExt.createVertexArrayOES();
  }
  ...
} else {
  ... do whatever for no VAOs.
}
</pre>
<p>注意：特别对于顶点数组对象我建议你<a href="https://github.com/greggman/oes-vertex-array-object-polyfill">使用polyfill</a>，
所以任何时候你都能得到它们。VAO大多数设备都提供。少数设备不提供，polyfill会让你的代码保持简单。</p>
</div>
