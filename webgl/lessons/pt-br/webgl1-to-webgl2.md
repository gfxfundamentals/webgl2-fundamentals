Title: WebGL2 da WebGL1
Description: Como passar da WebGL1 para a WebGL2

WebGL2 é quase 100% compatível com o WebGL1.
Se você usar apenas os recursos da WebGL1, então há
apenas 2 diferenças.

1.  Você usa `" webgl2 "` em vez de `" webgl "` ao chamar `getContext`

        var gl = someCanvas.getContext("webgl2");

    Nota: não há "experimental-webgl2". Os fornecedores do navegador se
    reuniram e decidiram não mais prefixar coisas porque os sites
    dependem do prefixo.

2.  Muitas extensões são uma parte padrão da WebGL2 e, portanto, não estão disponíveis
    como extensões

    Por exemplo, objeto Vertex Array `OES_vertex_array_object` é uma
    característica padrão da WebGL2. Então, por exemplo, na WebGL1 você faria isso

        var ext = gl.getExtension("OES_vertex_array_object");
        if (!ext) {
          // tell user they don't have the required extension or work around it
        } else {
          var someVAO = ext.createVertexArrayOES();
        }

    Na WebGL2 você faria isso

        var someVAO = gl.createVertexArray();

    Porque ele só existe.

Caso contrário, todas as suas coisas WebGL1 devem funcionar.

Dito isso, para tirar proveito da maioria dos recursos da WebGL2 você precisará fazer
algumas mudanças.

## Mude para GLSL 300 es

A maior mudança é que você deve atualizar seus shaders para GLSL 3,00 ES. Para
fazer isso, a primeira linha de seus shaders precisa ser

    #version 300 es

**NOTA: ESTA TEM QUE SER A PRIMEIRA LINHA! Sem comentários, sem linhas em branco antes de permitir.**

Em outras palavras, isso é ruim

    // BAD!!!!                +---There's a new line here!
    // BAD!!!!                V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

Isso também é ruim

    <!-- BAD!!                   V<- there's a new line here
    <script id="vs" type="notjs">
    #version 300 es
    ...
    </script>

Isso é bom

    var vertexShaderSource = `#version 300 es
    ...
    `;

Isso também é bom

    <script id="vs" type="notjs">#version 300 es
    ...
    </script>

Ou você poderia fazer com que suas funções de compilação de shader tirem
as primeiras linhas em branco.

### Mudanças em GLSL 300 es de GLSL 100

Há várias mudanças que você precisa para fazer o seus shaders
de cima para adicionar a cadeia de versão anterior

#### `attribute` -> `in`

No GLSL 100 você pode ter

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec3 a_normal;

Em GLSL 300 es se torna

    in vec4 a_position;
    in vec2 a_texcoord;
    in vec3 a_normal;

#### `varying` to `in` / `out`

No GLSL 100, você pode declarar uma variação tanto no vertex
como nos fragmentos shaders como esse

    varying vec2 v_texcoord;
    varying vec3 v_normal;

Em GLSL 300 es no vertex shader as variações se tornam

    out vec2 v_texcoord;
    out vec3 v_normal;

E no fragmento shader eles se tornam

    in vec2 v_texcoord;
    in vec3 v_normal;

#### Não mais `gl_FragColor`

No GLSL 100, seu fragmento shader configuraria a variável
especial `gl_FragColor` para definir a saída do shader.

    gl_FragColor = vec4(1, 0, 0, 1);  // red

Em GLSL 300 es, você declara sua própria variável de saída e
depois configura-a.

    out vec4 myOutputColor;

    void main() {
       myOutputColor = vec4(1, 0, 0, 1);  // red
    }

Nota: Você pode escolher qualquer nome que desejar, mas os nomes **não** podem começar
com `gl_`, então você não pode simplesmente fazer `out vec4 gl_FragColor`

#### `texture2D` -> `texture` etc.

No GLSL 100 você obtém uma cor de uma textura como essa

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture2D(u_some2DTexture, ...);
    vec4 color2 = textureCube(u_someCubeTexture, ...);

No GLSL 300es, as funções de textura sabem automaticamente o
que fazer com base no tipo de amostrador, então agora é apenas
`texture`

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture(u_some2DTexture, ...);
    vec4 color2 = texture(u_someCubeTexture, ...);

## Características que você pode dar como certo

No WebGL1, muitos recursos eram extensões opcionais. No WebGL2,
todos os itens seguintes são características padrão

* Texturas de profundidade ([WEBGL_depth_texture](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/))
* Texturas de ponto flutuante ([OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/)/[OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/))
* Objetos Vertex Array ([OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/))
* Derivados Padrão ([OES_standard_derivatives](https://www.khronos.org/registry/webgl/extensions/OES_standard_derivatives/))
* Desenho Instanciado ([ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/))
* Índices UNSIGNED_INT ([OES_element_index_uint](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/))
* Configurando `gl_FragDepth` ([EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/))
* Misturar Equação MIN / MAX ([EXT_blend_minmax](https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/))
* Acesso direto a textura LOD ([EXT_shader_texture_lod](https://www.khronos.org/registry/webgl/extensions/EXT_shader_texture_lod/))
* Múltiplos Draw Buffers ([WEBGL_draw_buffers](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/))
* Acesso de textura no vertex shaders

## Non-Power de 2 Suporte de Textura

nas texturas WebGL1 que não tinham um poder de 2 não podiam ter mips.
No WebGL2, esse limite é removido. Non-power de 2 texturas funciona exatamente
como a potência de 2 texturas.

## Anexos do Framebuffer do ponto flutuante

No WebGL1 para verificar se há suporte para a renderização para uma textura
de ponto flutuante, primeiro você verificaria e ativaria a extensão `OES_texture_float`, 
então você criaria uma textura de ponto flutuante, ligaria-a a um framebuffer e chamaria
`gl.checkFramebufferStatus` veja se ele retornou  `gl.FRAMEBUFFER_COMPLETE`.

No WebGL2 você precisa verificar e ativar `EXT_color_buffer_float` ou então
`gl.checkFramebufferStatus` nunca retornará `gl.FRAMEBUFFER_COMPLETE` para
uma textura de ponto flutuante.

Observe que isso também é verdadeiro para os anexos framebuffer `HALF_FLOAT`.

> Se você tem curiosidade, esse foi um erro na especificação WebLG1. O que aconteceu foi o envio 
> da WebGL1 e o `OES_texture_float` foi adicionado e apenas assumiu que a maneira correta
> de usá-lo para renderizar era criar uma textura, anexá-la um framebuffer
> e verificar seu status. Mais tarde, alguém apontou de acordo com a especificação que
> não era suficiente porque a especificação diz que as cores escritas em um fragmento shader são
> sempre restritos de 0 a 1. `EXT_color_buffer_float` remove essa restrição
> de clampping, mas como o WebGL já havia sido enviado há um ano ou teria quebrado
> muitos sites para reforçar a restrição. Para o WebGL2 eles conseguiram corrigi-lo
> e agora você deve habilitar o `EXT_color_buffer_float`
> para usar as texturas de ponto flutuante como anexos framebuffer.
>
> Observe que o AFAIK, a partir de março de 2017, poucos dispositivos móveis suportam renderização
> para texturas de ponto flutuante.

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
var gl = someCanvas.getContext("webgl");
var haveVAOs = getAndApplyExtension(gl, "OES_vertex_array_object"));

function getAndApplyExtension(gl, name) {
  var ext = gl.getExtension(name);
  if (!ext) {
    return false;
  }
  var suffix = name.split("_")[0];
  var prefix = suffix = '_';
  var suffixRE = new RegExp(suffix + '$');
  var prefixRE = new RegExp('^' + prefix);
  for (var key in ext) {
    var val = ext[key];
    if (typeof(val) === 'function') {
      // remove suffix (eg: bindVertexArrayOES -> bindVertexArray)
      var unsuffixedKey = key.replace(suffixRE, '');
      if (key.substing)
      gl[unprefixedKey] = ext[key].bind(ext);
    } else {
      var unprefixedKey = key.replace(prefixRE, '');
      gl[unprefixedKey] = ext[key];
    }
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
