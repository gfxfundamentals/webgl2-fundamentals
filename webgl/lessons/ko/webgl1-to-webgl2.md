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

    이렇게 하지 않으면, 같은 geometry를 쓰는 다른 쉐이더 프로그램마다
    다른 VAO가 필요하게 되고, VAOs를 쓰지 않고 렌더링 시점에 항상
    attributes를 설정해야하는 WebGL1처럼 해야합니다. 느려지겠죠.

    참고: 위의 2가지 방법 중에 저는 `gl.bindAttribLocation`를 권장합니다.
    왜냐하면 이건 코드에 한번 적으면 되지만, `layout(location = ?)`를 쓰는 방법은
    모든 쉐이더에 적어야하기 때문이죠. 그러므로 DRY 원칙도 지키는
    `gl.bindAttribLocation` 쪽이 더 나아보입니다.
    쉐이더 생성기를 쓴다면 차이는 없겠지만요.

2.  작업을 마치면, 항상 VAO를 unbind 하기

        gl.bindVertexArray(null);

    이건 제 경험에서 나온 겁니다. 위를 읽으셨다면, `ELEMENT_ARRAY_BUFFER` 상태는
    Vertex Array의 일부라는 걸 아실겁니다.

    그런데 여기서 문제가 생겼습니다. 어떤 geometry를 하나 만들었고,
    연결할 VAO도 만들었고, attribute들과 `ELEMENT_ARRAY_BUFFER` 도 설정했습니다.
    그리고 geometry들을 몇 개 더 만들었죠. 그런데 geometry들의 인덱스를 설정할 때,
    이전의 VAO와 바인딩되어 있어서, 그 인덱스들이 이전의 VAO와 바인딩 된
    `ELEMENT_ARRAY_BUFFER`로 넘어간 겁니다. 이걸 디버깅하는 데 몇 시간은 썼습니다.

    아무튼, 작업을 마쳤다면 절대로 VAO 바인딩이 된 채로 두지 말라는 제 의견입니다.
    다음에 쓸 VAO를 바로 바인딩할 예정이건 아니건, 끝났으면 `null`로 바인딩하세요.

위에서 말했듯이, WebGL1의 많은 extension들이 WebGL2의 표준 기능이 되었습니다.
그래서 WebGL1의 extension을 사용하고 싶으신 경우에는, WebGL2에서는 코드를
extension을 사용하는 것처럼 작성하시면 안되고 조금은 수정해야합니다. 다음을 봐주세요.

특히, 주의가 필요한 2가지:

1. `OES_texture_float` 그리고 floating point textures.

    Floating point textures는 WebGL2의 표준 기능이지만,

    * filter floating point textures은 여전히 extension입니다:
      `OES_texture_float_linear`.

    * floating point texture을 렌더링하는 것도 extension입니다:
      `EXT_color_buffer_float`.

    * floating point texture를 생성하는 것이 다릅니다. WebGL2의 새로운 내부 포맷인
      `RGBA32F` 나 `R32F` 등을 사용해야 합니다.
      This is different than the WebGL1 `OES_texture_float`
      extension in which the internal format was inferred from the `type` passed to `texImage2D`.

2. `WEBGL_depth_texture` 그리고 depth textures.

    이것도 마찬가지로, WebGL1의 `WEBGL_depth_texture` extension은 `DEPTH_COMPONENT`과 `DEPTH_STENCIL_COMPONENT`를 사용했지만, WebGL2에서 depth texture를 만들려면 WebGL2의 내부 포맷인 `DEPTH_COMPONENT16`, `DEPTH_COMPONENT24`,
    `DEPTH_COMPONENT32F`, `DEPTH24_STENCIL8`, `DEPTH32F_STENCIL8` 중에 하나를 써야합니다.

이건, WebGL1를 WebGL2로 바꾸면서 유의해야할 부분을 제가 개인적으로 정리해본 것입니다. [WebGL2에서 할 수 있는 것들](webgl2-whats-new.html).

<div class="webgl_bottombar">
<h3>WebGL1 extension을 WebGL2처럼 만들기</h3>
<p>WebGL1의 extension에 있던 함수들은, WebGL2에서는 extension 없이 사용할 수 있습니다. 예를 들면, WebGL1에서는 아래와 같았지만</p>
<pre class="prettyprint">
var ext = gl.getExtension("OES_vertex_array_object");
if (!ext) {
  // tell user they don't have the required extension or work around it
} else {
  var someVAO = ext.createVertexArrayOES();
}
</pre>
<p>
WebGL2 에서는 이렇죠.
</p>
<pre class="prettyprint">
var someVAO = gl.createVertexArray();
</pre>
<p>이걸로 알 수 있듯이, 만약 WebGL1과 WebGL2 에서 모두 실행되는 코드를 적고 싶다면,
좀 어려울 수 있습니다.</p>
<p>한 가지 해결 방법은, 초기화할 때 WebGL1 extension을 WebGL context에 복사하는 것입니다.
그렇게 하면 나머지 코드는 그대로입니다. 예시:</p>
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
<p>이제 이 코드는 WebGL1과 WebGL2 에서 대부분 똑같게 동작할 겁니다. 예시:</p>
<pre class="prettyprint">
if (haveVAOs) {
  var someVAO = gl.createVertexArray();
  ...
} else {
  ... do whatever for no VAOs.
}
</pre>
<p>아니면 이런식으로 적어야겠죠.</p>
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
<p>참고: Vertex Array Objects를 사용하는 경우에는, <a href="https://github.com/greggman/oes-vertex-array-object-polyfill">polyfill</a>을 사용하는 것을 권장합니다. VAO는 대부분의 시스템에서 지원되지만, 지원하지 않는 몇 시스템에서는 polyfill로 해결할 수 있습니다.
코드의 변경 없이 말이죠.</p>
</div>
