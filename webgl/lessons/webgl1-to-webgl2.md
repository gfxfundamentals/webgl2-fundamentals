Title: WebGL2 from WebGL1
Description: How to move from WebGL1 to WebGL2

WebGL2 is nearly 100% backward compatible with WebGL1.
If you only use WebGL1 features then then there are
only 2 differences.

1.  You use `"webgl2"` instead of `"webgl"` when calling `getContext`

        var gl = someCanvas.getContext("webgl2");

    Note: there is no "experimental-webgl2". The browser vendors got
    together and decided no more prefixing things because websites
    get dependent on the prefix.

2.  Many extensions are a standard part of WebGL2 and so not available
    as extensions

    For example Vertex Array Objects `OES_vertex_array_object` is a
    standard feature of WebGL2. So for example in WebGL1 you'd do this

        var ext = gl.getExtension("OES_vertex_array_object");
        if (!ext) {
          // tell user they don't have the required extension or work around it
        } else {
          var someVAO = ext.createVertexArrayOES();
        }

    In WebGL2 you'd do this

        var someVAO = gl.createVertexArray();

    Because it just exists.

Otherwise all your WebGL1 stuff should just work.

That being said to take advantage of most WebGL2 features you'll need to make
some changes.

## Switch to GLSL 300 es

The biggest change is you should upgrade your shaders to GLSL 3.00 ES. To do
that the first line of your shaders needs to be

    #version 300 es

**NOTE: THIS HAS TO BE THE FIRST LINE! No comments, no blank lines before it allowed.**

In other words this is bad

    // BAD!!!!                +---There's a new line here!
    // BAD!!!!                V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

This is bad too

    <!-- BAD!!                   V<- there's a new line here
    <script id="vs" type="notjs">
    #version 300 es
    ...
    </script>

This is good

    var vertexShaderSource = `#version 300 es
    ...
    `;

This is good too

    <script id="vs" type="notjs">#version 300 es
    ...
    </script>

Or you could make your shader compiling functions strip
the first blank lines.

### Changes in GLSL 300 es from GLSL 100

There are several changes you'll need to make to your shaders
on top of adding the version string above

#### `attribute` -> `in`

In GLSL 100 you might have

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec3 a_normal;

In GLSL 300 es that becomes

    in vec4 a_position;
    in vec2 a_texcoord;
    in vec3 a_normal;

#### `varying` to `in` / `out`

In GLSL 100 you might declare a varying in both the vertex
and fragment shaders like this

    varying vec2 v_texcoord;
    varying vec3 v_normal;

In GLSL 300 es in the vertex shader the varyings become

    out vec2 v_texcoord;
    out vec3 v_normal;

And in the fragment shader they become

    in vec2 v_texcoord;
    in vec3 v_normal;

#### No more `gl_FragColor`

In GLSL 100 your fragment shader would set the special
variable `gl_FragColor` to set the output of the shader.

    gl_FragColor = vec4(1, 0, 0, 1);  // red

In GLSL 300 es you declare your own output variable and
then set it.

    out vec4 myOutputColor;

    void main() {
       myOutputColor = vec4(1, 0, 0, 1);  // red
    }

Note: You can pick any name you want but names can **not** start with
`gl_` so you can't just make `out vec4 gl_FragColor`

#### `texture2D` -> `texture` etc.

In GLSL 100 you'd get a color from a texture like this

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture2D(u_some2DTexture, ...);
    vec4 color2 = textureCube(u_someCubeTexture, ...);

In GLSL 300es the texture functions automatically know
what to do based on the sampler type so now it's just
`texture`

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture(u_some2DTexture, ...);
    vec4 color2 = texture(u_someCubeTexture, ...);

## Features you can take for granted

In WebGL1 many features were optional extensions. In WebGL2
all of the following are standard features

* Depth Textures ([WEBGL_depth_texture](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/))
* Floating Point Textures ([OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/)/[OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/))
* Vertex Array Objects ([OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/))
* Standard Derivatives ([OES_standard_derivatives](https://www.khronos.org/registry/webgl/extensions/OES_standard_derivatives/))
* Instanced Drawing ([ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/))
* UNSIGNED_INT indices ([OES_element_index_uint](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/))
* Setting `gl_FragDepth` ([EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/))
* Blend Equation MIN/MAX ([EXT_blend_minmax](https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/))
* Direct texture LOD access ([EXT_shader_texture_lod](https://www.khronos.org/registry/webgl/extensions/EXT_shader_texture_lod/))
* Multiple Draw Buffers ([WEBGL_draw_buffers](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/))
* Texture access in vertex shaders

## Non-Power of 2 Texture Support

in WebGL1 textures that were not a power of 2 could not have mips.
In WebGL2 that limit is removed. Non-power of 2 texture work exactly
the same as power of 2 textures.

## Floating Point Framebuffer Attachments

In WebGL1 to check for support for rendering to a floating point texture
you would first check for and enable the `OES_texture_float` extension, then
you'd create a floating point texture, attach it to a framebuffer, and call
`gl.checkFramebufferStatus` to see if it returned `gl.FRAMEBUFFER_COMPLETE`.

In WebGL2 you need to check for and enable `EXT_color_buffer_float` or else
`gl.checkFramebufferStatus` will never return `gl.FRAMEBUFFER_COMPLETE` for
a floating point texture.

Note that this is also true for `HALF_FLOAT` framebuffer attachments as well.

> If you're curious this was a *bug* in the WebLG1 spec. What happened is WebGL1
> shipped and `OES_texture_float` was added and it was just assumed the correct
> way to use it for rendering was to create a texture, attach it a framebuffer,
> and check its status. Later someone pointed out according the spec that was
> not enough because the spec says colors written in a fragment shader are
> always clamped to 0 to 1. `EXT_color_buffer_float` removes that clampping
> restriction but since WebGL had already been shipping for a year or so
> it would have broken many web sites to enforce the restriction. For WebGL2
> they were able to fix it and so now you must enable `EXT_color_buffer_float`
> to use floating point textures as framebuffer attachments.
>
> NOTE that AFAIK, as of March 2017 very few mobile devices support rendering to
> floating point textures.

## Vertex Array Objects

Of all the features above the one feature I personally think you should
always ALWAYS use is vertex array objects. Everything else it really
depends on what you're trying to do but vertex array objects in particular
seem like a basic feature that should always be used.

In WebGL1 without vertex array objects all the data about attributes
was global WebGL state. You can imagine it like this

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

Calling functions like `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`, and
`gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ??)` would effect that global state.
Before each thing you wanted to draw you needed to setup all the attributes and if you
were drawing indexed data you needed to set the `ELEMENT_ARRAY_BUFFER`.

With Vertex Array Objects that entire `attributeState` above becomes a *Vertex Array*.

In other words

    var someVAO = gl.createVertexArray();

Makes a new instance of the thing above called `attributeState`.

    gl.bindVertexArray(someVAO);

Is equivilent to

    glState.attributeState = someVAO;

What that means is you should setup all of your attributes at init time now.

    // at init time
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

Then at render time to use a particular geometry all you need to do
is

    gl.bindVertexArray(vaoForGeometry);

In WebGL1 the init loop object would have appeared at render time.
This is a HUGE speed up!

There are a few caveats though:

1.  attribute locations are program dependent.

    If you're going to use the same geometry with multiple
    programs consider manually assinging attribute locations.
    In GLSL 300 es you can do this in the shader

    For example:

        layout(location = 0) in vec4 a_position;
        layout(location = 1) in vec2 a_texcoord;
        layout(location = 2) in vec3 a_normal;
        layout(location = 3) in vec4 a_color;

    Sets the locations of the 4 attributes.

    You can also still do it the WebGL1 way by calling
    `gl.bindAttribLocation` before calling `gl.linkProgram`.

    For example:

        gl.bindAttribLocation(someProgram, 0, "a_position");
        gl.bindAttribLocation(someProgram, 1, "a_texcoord");
        gl.bindAttribLocation(someProgram, 2, "a_normal");
        gl.bindAttribLocation(someProgram, 3, "a_color");

    This means you can force them to be comptible across multiple shader
    programs. If one program doesn't need all attributes
    the attributes they do need will still be assigned to
    the same locations

    If you don't do this you'll need different VAOs for
    different shader programs when using same geometry OR
    you'll need to just do the WebGL1 thing and not use
    VAOs and always setup attributes at render time which is slow.

    NOTE: of the 2 methods above I'm leaning toward using
    `gl.bindAttribLocation` because it's easy to have it in one
    place in my code where as the method of using `layout(location = ?)` has
    to be in all shaders so in the interest of D.R.Y. `gl.bindAttribLocation`
    seems better. Maybe if I was using a shader generator then there'd be no difference.

2.  Always unbind the VAO when you're done

        gl.bindVertexArray(null);

    This just comes from my own experience. If you look above
    the `ELEMENT_ARRAY_BUFFER` state is part of a Vertex Array.

    So, I ran into this issue. I created some geometry, then
    I created a VAO for that geometry and set up the attributes
    and `ELEMENT_ARRAY_BUFFER`. I then created some more
    geometry. When that geometry setup its indices, because
    I still had the previous VAO bound setting up the indices
    effected the `ELEMENT_ARRAY_BUFFER` binding for the previous
    VAO. It took me several hours to debug.

    So, my suggestion is never leave a VAO bound if you're done
    with it. Either immediately bind the next VAO you're going
    to use or if you're done bind `null`

That's my personal short list of things to be aware of when switching
from WebGL1 to WebGL2. [There's even more stuff you can do in WebGL2 though](webgl2-whats-new.html).

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
<p>As you can see if you want your code to run in both WebGL1 and WebGL2
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
so you'll have them everywhere. VAOs are available on most systems. Those few system
where they aren't available the polyfill will handle for you and your code
can stay simple.</p>
</div>
