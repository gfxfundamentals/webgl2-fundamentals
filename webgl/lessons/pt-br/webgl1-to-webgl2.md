Title: WebGL2 para a WebGL1
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
          // Diga ao usuário que ele não têm a extensão necessária ou trabalhar em torno dela
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

    // RUIM!!!!                +---Há uma nova linha aqui!
    // RUIM!!!!                V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

Isso também é ruim

    <!-- RUIM!!                   V<- há uma nova linha aqui!
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

## Objetos Vertex Array

De todos os recursos acima de um recurso, eu pessoalmente acho que você
sempre deve SEMPRE usar os objetos do vertex array. Tudo realmente
depende do que você está tentando fazer, mas os objetos do vertex array, em particular,
parecem um recurso básico que sempre deve ser usado.

Na WebGL1 sem objetos vertex array todos os dados sobre atributos
foram para o estado WebGL global. Você pode imaginar isso assim

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

Chamar funções como `gl.vertexAttribPointer`,` gl.enableVertexAttribArray` e
`gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, ??)` afetariam esse estado global.
Antes de cada coisa que você queria desenhar, você precisava configurar todos os atributos e, se você
estivesse desenhando dados indexados, você precisava configurar o `ELEMENT_ARRAY_BUFFER`.

Com objeto Vertex Array, todo o `attributeState` acima se torna um *Vertex Array*.

Em outras palavras

    var someVAO = gl.createVertexArray();

Faz uma nova instância da coisa acima chamada `attributeState`.

    gl.bindVertexArray(someVAO);

É equivalente a

    glState.attributeState = someVAO;

O que isto significa é que você deve configurar todos os seus atributos em tempo de inicialização agora.

    // no tempo inicial
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

Então no tempo de renderização para usar uma geometria particular, tudo o que você precisa fazer 
é

    gl.bindVertexArray(vaoForGeometry);

No WebGL1, o objeto de loop de inicialização teria aparecido no tempo de renderização.
Esta é uma grande velocidade!

Há algumas advertências:

1.  Os locais de atributo dependem do programa.

    Se você estiver usando a mesma geometria com vários programas,
    considere atribuir manualmente locais de atributo.
    No GLSL 300 es você pode fazer isso no shader

    Por example:

        layout(location = 0) in vec4 a_position;
        layout(location = 1) in vec2 a_texcoord;
        layout(location = 2) in vec3 a_normal;
        layout(location = 3) in vec4 a_color;

    Define os locais dos 4 atributos.

    Você ainda pode fazer o modo WebGL1 chamando
    `gl.bindAttribLocation` antes de chamar `gl.linkProgram`.

    Por example:

        gl.bindAttribLocation(someProgram, 0, "a_position");
        gl.bindAttribLocation(someProgram, 1, "a_texcoord");
        gl.bindAttribLocation(someProgram, 2, "a_normal");
        gl.bindAttribLocation(someProgram, 3, "a_color");

    Isso significa que você pode forçá-los a serem compatíveis em vários programas de
    shader. Se um programa não precisa de todos os atributos,
    os atributos que eles precisam ainda serão atribuídos
    aos mesmos locais

    Se você não fizer isso, você precisará de VAOs diferentes
    para diferentes programas de shader ao usar a mesma geometria OR,
    você precisará apenas fazer a WebGL1 e não usar
    VAOs e sempre configurar atributos no tempo de renderização, o que é lento.

    NOTA: dos 2 métodos acima, eu me inclino para usar o 
    `gl.bindAttribLocation`  porque é fácil tê-lo em um lugar no meu código onde,
    o método de usar layout `layout(location = ?)` deve
    estar em todos os shaders, então, no interesse de DRY `gl.bindAttribLocation`
    parece melhor. Talvez, se eu estivesse usando um gerador de shader, não haveria diferença.

2.  Sempre desvincular o VAO quando terminar

        gl.bindVertexArray(null);

    Isso só vem da minha própria experiência. Se você olhar acima, o
    estado `ELEMENT_ARRAY_BUFFER` faz parte de uma Vertex Array.

    Então, encontrei esse problema. Eu criei uma geometria, então
    criei um VAO para essa geometria e configurei os atributos
    e `ELEMENT_ARRAY_BUFFER`. Então criei mais
    geometria. Quando essa geometria configurou seus índices, porque
    eu ainda tinha o anterior VAO ligado configuração os índices
    efectuados a `ELEMENT_ARRAY_BUFFER` vinculativo para o anterior
    VAO. Levei várias horas para depurar.

    Então, minha sugestão nunca é deixar um link VAO se você terminar
    com isso. Ou vincule imediatamente o próximo VAO que você vai
    usar ou, se tiver terminado, vincule `null`

Essa é minha pequena lista pessoal de coisas a serem conhecidas ao mudar
de WebGL1 para WebGL2. [Há ainda mais coisas que você pode fazer no WebGL2 embora](webgl2-whats-new.html).

<div class="webgl_bottombar">
<h3>Fazendo as extensões WebGL1 parecer WebGL2</h3>
<p>As funções que estavam em extensões no WebGL1 estão agora no contexto principal
no WebGL2. Por exemplo, no WebGL</p>
<pre class="prettyprint">
var ext = gl.getExtension("OES_vertex_array_object");
if (!ext) {
  // Diga ao usuário que ele não têm a extensão necessária ou trabalhar em torno dela
} else {
  var someVAO = ext.createVertexArrayOES();
}
</pre>
<p>
vs em webgl2
</p>
<pre class="prettyprint">
var someVAO = gl.createVertexArray();
</pre>
<p>Acomo você pode ver se você deseja que seu código seja executado tanto no WebGL1 quanto no WebGL2,
que pode apresentar alguns desafios.</p>
<p>Uma solução seria copiar extensões WebGL1 ao contexto WebGL em tempo de inicialização.
Dessa forma, o resto do seu código pode permanecer o mesmo. Exemplo:</p>
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
      // remover sufixo (ex: bindVertexArrayOES -> bindVertexArray)
      var unsuffixedKey = key.replace(suffixRE, '');
      if (key.substing)
      gl[unprefixedKey] = ext[key].bind(ext);
    } else {
      var unprefixedKey = key.replace(prefixRE, '');
      gl[unprefixedKey] = ext[key];
    }
  }
</pre>
<p>Agora, seu código pode funcionar da mesma forma em ambos. Exemplo:</p>
<pre class="prettyprint">
if (haveVAOs) {
  var someVAO = gl.createVertexArray();
  ...
} else {
  ... do whatever for no VAOs.
}
</pre>
<p>A alternativa seria ter que fazer algo assim</p>
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
<p>Nota: No caso dos objetos Vertex Array em particular, sugiro que você <a href="https://github.com/greggman/oes-vertex-array-object-polyfill">use a polyfill</a>
para que você os tenha em todos os lugares. Os VAOs estão disponíveis na maioria dos sistemas.
Aqueles poucos sistemas onde eles não estão disponíveis o polyfill irá lidar com você e seu código
pode ficar simples.</p>
</div>
