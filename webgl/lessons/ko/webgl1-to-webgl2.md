Title: WebGL1에서 WebGL2로
Description: WebGL1에서 WebGL2로 옮기는 방법
TOC: WebGL1에서 WebGL2로 옮기기


WebGL2는 WebGL1과 **거의** 100% 하위 호환이 됩니다.
WebGL1 기능들만 사용하고 있다면, 2가지 **주요** 변경 사항이 있습니다.

1.  `getContext`를 호출할 때, `"webgl"` 대신 `"webgl2"` 를 사용해야 합니다.

        var gl = someCanvas.getContext("webgl2");

    주의: "experimental-webgl2"는 없습니다. 웹 사이트들이 접두사에 의존하게
    되면서, 더 이상 브라우저에서 지원하지 않기로 하였습니다.

2.  많은 extension들이 WebGL2의 표준 기능이 되었습니다. 그래서 이제 extensions로
    사용할 수 없습니다.

    예시로, Vertex Array Objects `OES_vertex_array_object`는 WebGL2의 표준 기능
    중 하나입니다. 그래서 WebGL1 에서는 아래처럼 사용했지만,

        var ext = gl.getExtension("OES_vertex_array_object");
        if (!ext) {
          // tell user they don't have the required extension or work around it
        } else {
          var someVAO = ext.createVertexArrayOES();
        }

    WebGL2에서는 이렇습니다.

        var someVAO = gl.createVertexArray();

    그냥 사용하면 됩니다.

언급한대로, 대부분의 WebGL2 기능들의 장점을 얻기 위해서는 몇 가지 변경이 필요합니다.

## GLSL 300 es로 변경

가장 큰 변경 내용은, 쉐이더 버전을 GLSL 3.00 ES로 업그레이드 해야한다는 것입니다.
그러기 위해서, 쉐이더의 가장 첫 번째 줄이 다음과 같아야 합니다.

    #version 300 es

**주의: 반드시 첫 번째 줄이어야 합니다! 주석이나 빈 줄이 있으면 안됩니다.**

즉, 다음과 같으면 안 됩니다.

    // BAD!!!!                +---여기 아래에 개행 문자(새로운 줄)이 있습니다.
    // BAD!!!!                V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

이것도 안 됩니다.

    <!-- BAD!!                   V<- 여기 아래에 개행 문자(새로운 줄)이 있습니다.
    <script id="vs" type="notjs">
    #version 300 es
    ...
    </script>

아래는 좋은 예시입니다.

    var vertexShaderSource = `#version 300 es
    ...
    `;

이것도 좋은 예시입니다.

    <script id="vs" type="notjs">#version 300 es
    ...
    </script>

아니면, 쉐이더를 컴파일하는 함수에서 첫 번째로 나오는 빈 줄을
모두 없애는 방법도 있습니다.

### GLSL 100 에서 GLSL 300 es로의 변경 사항

위의 쉐이더의 버전 변경 말고도, 몇 가지 변경 사항들이 있습니다.

#### `attribute` -> `in`

GLSL 100에서는 이렇게 적었지만

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec3 a_normal;

GLSL 300 es에서는 아래처럼 되어야합니다.

    in vec4 a_position;
    in vec2 a_texcoord;
    in vec3 a_normal;

#### `varying`을 `in` / `out`로

GLSL 100에서는 `varying`을 vertex 쉐이더와 fragment 쉐이더
두 곳에 모두 선언할 수 있었습니다.

    varying vec2 v_texcoord;
    varying vec3 v_normal;

GLSL 300 es의 vertex 쉐이더에서, `varyings`은 아래처럼 되어야합니다.

    out vec2 v_texcoord;
    out vec3 v_normal;

그리고 fragment 쉐이더에서는 이렇게요.

    in vec2 v_texcoord;
    in vec3 v_normal;

#### 이제 `gl_FragColor`는 없습니다.

GLSL 100에서는, fragment 쉐이더에서 output을 설정하기 위해 특별한 변수인
`gl_FragColor`를 사용할 수 있었습니다.

    gl_FragColor = vec4(1, 0, 0, 1);  // red

GLSL 300 es에서는, output 변수를 직접 선언해서 값을 대입합니다.

    out vec4 myOutputColor;

    void main() {
       myOutputColor = vec4(1, 0, 0, 1);  // red
    }

주의: 아무 이름이나 사용할 수 있지만, `gl_`로 시작할 수 **없습니다.**
`out vec4 gl_FragColor`로 적을 수 없다는 뜻입니다.

#### `texture2D` -> `texture` etc.

GLSL 100에서는, texture에서 색상을 얻을 때 아래처럼 했지만,

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture2D(u_some2DTexture, ...);
    vec4 color2 = textureCube(u_someCubeTexture, ...);

GLSL 300 es에서는, texture function이 어떤 sampler type을 사용하는 지
알고 있으므로, 이제는 그냥 `texture`를 사용하면 됩니다.

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture(u_some2DTexture, ...);
    vec4 color2 = texture(u_someCubeTexture, ...);

## 당연하게 생각해도 되는 기능들

WebGL1의 많은 기능들은 optional extension이었습니다. WebGL2에서는 아래 모든 기능들이 제공됩니다:

* Depth Textures ([WEBGL_depth_texture](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/))
* Floating Point Textures ([OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/)/[OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/))
* Half Floating Point Textures ([OES_texture_half_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/)/[OES_texture_half_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float_linear/))
* Vertex Array Objects ([OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/))
* Standard Derivatives ([OES_standard_derivatives](https://www.khronos.org/registry/webgl/extensions/OES_standard_derivatives/))
* Instanced Drawing ([ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/))
* UNSIGNED_INT indices ([OES_element_index_uint](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/))
* Setting `gl_FragDepth` ([EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/))
* Blend Equation MIN/MAX ([EXT_blend_minmax](https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/))
* Direct texture LOD access ([EXT_shader_texture_lod](https://www.khronos.org/registry/webgl/extensions/EXT_shader_texture_lod/))
* Multiple Draw Buffers ([WEBGL_draw_buffers](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/))
* sRGB support to textures and framebuffer objects ([EXT_sRGB](https://www.khronos.org/registry/webgl/extensions/EXT_sRGB/))
* Any level of a texture can be attached to a framebuffer object ([OES_fbo_render_mipmap](https://www.khronos.org/registry/webgl/extensions/OES_fbo_render_mipmap/))
* Texture access in vertex shaders

## 2의 제곱수가 아닌 Texture 크기 지원

WebGL1의 textures는 2의 제곱 수가 아니면 mipmap을 사용할 수 없었습니다.
WebGL2에서는 이 제한이 삭제되었습니다. 2의 제곱수가 아닌 텍스처도 2의 제곱수인 텍스처와
완전히 동일하게 작동합니다.

## Floating Point Framebuffer Attachments

WebGL1에서는 부동 소수점 texture가 렌더링되는 지 확인하려면, `OES_texture_float`
extension을 활성화하고, floating point texture를 만든 다음에,
그걸 framebuffer와 attach하고, `gl.FRAMEBUFFER_COMPLETE`가 반환되었는 지 보려면
`gl.checkFramebufferStatus`를 확인해야 했습니다.

WebGL2에서는, `EXT_color_buffer_float`이 활성화 되어있지 않으면,
`gl.checkFramebufferStatus`은 floating point texture에 대해서
`gl.FRAMEBUFFER_COMPLETE`를 절대 반환하지 않습니다.

이건 `HALF_FLOAT` framebuffer attachments에도 마찬가지라는 것을 명심하세요.

> 궁금하신 분들은 위해 적자면, 이건 WebGL1 스펙 상의 *버그*였습니다. WebGL1이 배포되고
> `OES_texture_float`가 추가되면서, 이걸 렌더링 하기 위해서, texture를 만들고,
> 그걸 framebuffer에 attach하고, 그 상태를 확인하는 게 옳은 방법이라고 가정한 것입니다.
> 나중에 누군가가 스펙에 따르면 fragment shader에서 쓰여진 color는 항상 0과 1사이의 값으로
> 고정되어 있어서, 스펙이 충분하지 않다고 지적했습니다. `EXT_color_buffer_float`에 값 고정
> 제한은 사라졌지만, 이미 WebGL이 배포된 지 1년이 넘은 시점이었습니다. 그래서 많은 웹
> 사이트들은 이 제한을 강제하도록 고쳐야했습니다. WebGL2에서는 위 내용을 모두 반영했으므로,
> 이제 floating point texture를 framebuffer attachments로 사용하려면 반드시
> `EXT_color_buffer_float`를 활성화해야합니다.
>
> 그리고 제가 아는 바로는, 2017년 3월 현재, 극소수의 모바일 기기들이
> floating point textures의 렌더링을 지원하고 있습니다.

## Vertex Array Objects

모든 기능들 중에서도, 여러분이 항상 꼭 무조건 사용하는 기능을 개인적으로 꼽자면,
vertex array objects 일 겁니다. 나머지 기능들은 여러분이 무언가 할 때 필요한 거지만,
특히 vertex array objects는 항상 사용되는 기초적인 기능입니다.

vertex array objects가 없던 WebGL1에서는, attributes에 대한 모든 데이터는
전역 WebGL 상태였습니다. 아마 이런 식이었겠죠.

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

`gl.vertexAttribPointer`, `gl.enableVertexAttribArray`, `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ??)`처럼 함수 호출이 전역 상태에 영향을 주었습니다.
각각의 원하는 것을 그리기 전에, 모든 attribute들을 초기화해야 했었습니다. 
인덱스 데이터를 그리려면, `ELEMENT_ARRAY_BUFFER`를 지정해야 했죠.

Vertex Array Objects를 사용하면, 위의 모든 `attributeState`가 *Vertex Array*가 됩니다.

다시 말하자면,

    var someVAO = gl.createVertexArray();

위처럼 생성한 새로운 인스턴스를 `attributeState`라고 부릅니다.

    gl.bindVertexArray(someVAO);

이건 아래와 같습니다.

    glState.attributeState = someVAO;

즉, 초기화 시점에 모든 attribute들을 설정해야 한다는 의미입니다.

    // 초기화 시점
    for each model / geometry / ...
      var vao = gl.createVertexArray()
      gl.bindVertexArray(vao);
      for each attribute
        gl.enableVertexAttribArray(...);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferForAttribute);
        gl.vertexAttribPointer(...);
      if indexed geometry
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);

그리고 렌더링 시점에 특정 geometry을 사용하기 위해서 해야하는 건 이것뿐입니다.

    gl.bindVertexArray(vaoForGeometry);

WebGL1에서는 위의 초기화 루프가 렌더링 시점에 있었을 것입니다.
이건 엄청나게 빨라진 거죠!

몇 가지 주의 사항이 있습니다:

1.  attribute location은 프로그램에 종속됩니다.

    만약에 여러 프로그램에서 같은 geometry를 사용하려고 한다면,
    attribute location를 수동으로 할당하는 것을 고려해야합니다.
    GLSL 300 es에서는 이걸 쉐이더 내부에서 할 수 있습니다.
    
    예시:

        layout(location = 0) in vec4 a_position;
        layout(location = 1) in vec2 a_texcoord;
        layout(location = 2) in vec3 a_normal;
        layout(location = 3) in vec4 a_color;

    4개의 attributes의 locations를 지정합니다.

    WebGL1처럼 `gl.linkProgram`을 호출하기 전에 
    `gl.bindAttribLocation`를 호출하여 사용할 수 있습니다.

    예시:

        gl.bindAttribLocation(someProgram, 0, "a_position");
        gl.bindAttribLocation(someProgram, 1, "a_texcoord");
        gl.bindAttribLocation(someProgram, 2, "a_normal");
        gl.bindAttribLocation(someProgram, 3, "a_color");

    이건 여러 쉐이더 프로그램과 호환되도록 강제할 수 있다는 의미입니다.
    한 프로그램에서 모든 attribute가 필요하지 않다면, 필요한 attribute만
    같은 location에 할당하면 됩니다.

    If you don't do this you'll need different VAOs for
    different shader programs when using the same geometry OR
    you'll need to just do the WebGL1 thing and not use
    VAOs and always setup attributes at render time, which is slow.

    NOTE: of the 2 methods above I'm leaning toward using
    `gl.bindAttribLocation` because it's easy to have it in one
    place in my code whereas the method of using `layout(location = ?)` has
    to be in all shaders, so in the interest of D.R.Y., `gl.bindAttribLocation`
    seems better. Maybe if I was using a shader generator then there'd be no difference.

2.  Always unbind the VAO when you're done

        gl.bindVertexArray(null);

    This just comes from my own experience. If you look above,
    the `ELEMENT_ARRAY_BUFFER` state is part of a Vertex Array.

    So, I ran into this issue. I created some geometry, then
    I created a VAO for that geometry and set up the attributes
    and `ELEMENT_ARRAY_BUFFER`. I then created some more
    geometry. When that geometry setup its indices, because
    I still had the previous VAO bound setting up, the indices
    effected the `ELEMENT_ARRAY_BUFFER` binding for the previous
    VAO. It took me several hours to debug.

    So, my suggestion is to never leave a VAO bound if you're done
    with it. Either immediately bind the next VAO you're going
    to use, or bind `null` if you're done.

As mentioned at the top, many extensions from WebGL1 are standard features
of WebGL2, so if you were using extensions in WebGL1, you'll need to
change your code to not use them as extensions in WebGL2. See below.

Two that need special care though:

1. `OES_texture_float` and floating point textures.

    Floating point textures are a standard feature of WebGL2 but:

    * Being able to filter floating point textures is still an extension: `OES_texture_float_linear`.

    * Being able to render to a floating point texture is an extension: `EXT_color_buffer_float`.

    * Creating a floating point texture is different. You must use one of the new WebGL2 internal
      formats like `RGBA32F`, `R32F`, etc. This is different than the WebGL1 `OES_texture_float`
      extension in which the internal format was inferred from the `type` passed to `texImage2D`.

2. `WEBGL_depth_texture` and depth textures.

    Similar to the previous difference, to create a depth texture in WebGL2 you must use one of
    WebGL2's internal formats: `DEPTH_COMPONENT16`, `DEPTH_COMPONENT24`,
    `DEPTH_COMPONENT32F`, `DEPTH24_STENCIL8`, or `DEPTH32F_STENCIL8`, whereas the WebGL1
    `WEBGL_depth_texture` extension used `DEPTH_COMPONENT` and `DEPTH_STENCIL_COMPONENT`.

That's my personal short list of things to be aware of when switching
from WebGL1 to WebGL2. [There's even more stuff you can do in WebGL2, though](webgl2-whats-new.html).

<div class="webgl_bottombar">
<h3>Making WebGL1 extensions look like WebGL2</h3>
<p>Functions that were on extensions in WebGL1 are now on the main
context in WebGL2. For example in WebGL</p>
<pre class="prettyprint">
var ext = gl.getExtension("OES_vertex_array_object");
if (!ext) {
  // tell user they don't have the required extension or work around it
} else {
  var someVAO = ext.createVertexArrayOES();
}
</pre>
<p>
vs in webgl2
</p>
<pre class="prettyprint">
var someVAO = gl.createVertexArray();
</pre>
<p>As you can see, if you want your code to run in both WebGL1 and WebGL2, then
that can present some challenges.</p>
<p>One workaround would be to copy WebGL1 extensions to the WebGL context at init time.
That way the rest of your code can stay the same. Example:</p>
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
    // examples of where this is not true are WEBGL_compressed_texture_s3tc
    // and WEBGL_compressed_texture_pvrtc
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
<p>Now your code can mostly just work the same on both. Example:</p>
<pre class="prettyprint">
if (haveVAOs) {
  var someVAO = gl.createVertexArray();
  ...
} else {
  ... do whatever for no VAOs.
}
</pre>
<p>The alternative would be having to do something like this</p>
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
<p>Note: In the case of Vertex Array Objects in particular I suggest you <a href="https://github.com/greggman/oes-vertex-array-object-polyfill">use a polyfill</a>
so you'll have them everywhere. VAOs are available on most systems. On those few systems
where they aren't available, the polyfill will handle it for you, and your code
can stay simple.</p>
</div>
