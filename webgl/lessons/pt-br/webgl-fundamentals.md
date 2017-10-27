Title: Fundamentos da WebGL2
Description: Sua primeira lição da WebGL2: começando com os fundamentos

Primeiramente, esses artigos são sobre a WebGL2. Se você está interessado na WebGL 1.0
[por favor, vá aqui](http://webglfundamentals.org). Observe que a WebGL2 é [quase 100% compatível
com a WebGL1](webgl1-backward-compatibility.html). Dito isto, uma vez que você habilita a
WebGL2, você também pode usá-la como ela deveria ser usada. Esses tutoriais seguem esse raciocínio.

[test](#日本語のテクスト)

Normalmente, a WebGL é vista como uma API 3D. As pessoas pensam: "eu irei usar a WebGL e como uma mágica,
eu vou obter efeitos 3D super legais". Na realidade não é nada disso, a WebGL é apenas um mecanismo de rasterização. Ela desenha
pontos, linhas e triângulos com base no código que você fornece. Colocar a WebGL para fazer qualquer outra coisa depende de você
fornecer o código de modo que o uso dos pontos, linhas e triângulos sejam capazes de realizar sua tarefa.

## 日本語のテクスト

A WebGL é executada diretamente na GPU do seu computador. Como tal, você precisa indicar o código a ser executado na GPU.
Você pode indicar o código na forma de pares de funções. Essas 2 funções são chamadas de vexter shader
e fragment shader e cada uma delas está escrita em linguagem no estilo C/C++ estritamente tipada chamada
[GLSL](webgl-shaders-and-glsl.html). (GL Shader Language). Juntas, elas são chamadas de *programa*.

O trabalho da vertex shader é calcular as posições dos vértices. Com base nas posições que a função retornar,
o WebGL pode então rasterizar vários tipos de primitivas, incluindo pontos, linhas ou triângulos.
Ao rasterizar essas primitivas, ele chama uma segunda função fornecida pelo usuário chama fragment shader (sombreador de fragmento).
O trabalho do fragment shader é calcula uma cor para cada pixel da primitiva sendo atualmente desenhada.

Quase toda a API da WebGL se resume em configurar o estado para esses pares de funções a serem executadas.
Para cada coisa que você deseja desenhar, configure um grupo de estados e execute um par de funções, chamando
`gl.drawArrays` ou `gl.drawElements` que executa seus shaders (sombreadores) na GPU.

Todos os dados que você deseja que essas funções tenham acesso devem ser fornecidas à GPU.
Há quatro maneiras de como um shader é capaz de obter dados.

1. Atributos, Buffers, e Vertex Arrays

   Buffers são arrays de dados binários que você carrega na GPU. Normalmente, os buffers contêm
   coisas como posições, normals, coordenadas de textura, cores de vértices, etc.
   embora você esteja livre para colocar tudo o que quiser neles.

   Os atributos são usados para especificar como   tirar dados dos seus buffers e fornecê-los para o seu vertex shader.
   Por exemplo, você pode colocar posições em um buffer como 3 floats de 32bits
   por posição. Você poderia dizer a um determinado atributo qual buffer irá extrair as posições, que tipo de
   ele deve retirar (3 componentes de números de pontos flutuantes de 32 bits), qual offset
   no buffer as posições se iniciam, e quantos bytes são necessários para obter de um a posição para o próximo.

   Buffers não possuem acesso aleatórrio. Em vez disso, um vertex shaders é executado um número específico
   de vezes. Cada vez que é executado, o próximo valor de cada buffer especificado é puxado
   , e o seu valor é atribuído a um atributo.

   O estado dos atributos, quais buffers usar para cada um e como extrair dados
   desses buffers, é coletado em um vertex array object (VAO).

2. Uniforms

   Uniforms são, efetivamente, variáveis globais que você configurou antes de executar o seu shader.

3. Texturas

   As texturas são matrizes de dados que você pode acessar aleatoriamente no seu programa de sombreamento. A coisa mais
   para se colocar em uma textura são dados de imagem, mas as apenas dados e podem facilmente
   conter algo diferente das cores.

4. Variáveis

   As variáveis são uma maneira de um vertex shader passar dados para um fragment shader. Dependendo
   do que está sendo renderizado, pontos, linhas, ou triângulos, os valores definidos em uma variável
   por um vertex shader serão interpolados enquanto o fragment shader é executado.

## WebGL Hello World

A WebGL se preocupa apenas com 2 coisas. Coordenadas do Clispace e cores.
Seu trabalho como programador usando a WebGL é fornecer WebGL com essas 2 coisas.
Você fornece seus 2 "shaders" para fazer isso. Um vexter shader que fornece fornece as
coordenadas do Clispace e um fragment shader que fornece a cor.

As coordenadas do Clispace sempre vão de -1 a +1, independentemente do tamanho do seu canvas.
Aqui está um simples exemplo da WebGL que a mostra em sua forma mais simples.

Vamos começar com um vertex shader

    #version 300 es

    // um atributo é um input (in) para um vertex shader.
    // ele receberá dados de um buffer
    in vec4 a_position;

    // todos os shaders possuem uma função main
    void main() {

      // gl_Position é uma variável especial de um vertex shader
      // é responsável pela configuração
      gl_Position = a_position;
    }

Quando executada, se toda a coisa fosse escrita em JavaScript em vez de GLSL
você poderia imaginar que isso seria utilizado como o exemplo abaixo

    // *** PSUEDO CÓDIGO!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
         // copia os 4 próximos valores do positionBuffer para o atributo a_position
         attributes.a_position = positionBuffer.slice((offset + i) * stide, size);
         runVertexShader();
         ...
         doSomethingWith_gl_Position();
    }

Na realidade, não é tão simples porque o `positionBuffer` precisa ser convertido em dados
binários (veja abaixo) e, portanto, o cálculo real para obter os dados do buffer
seria um pouco diferente, mas espero que isso lhe dê uma ideia de como um vertex shader
será executado.

Em seguida, nós precisamos de um fragment shader

    #version 300 es

    // fragment shaders não tem uma precisão padrão, então nós precisamos
    // escolher uma. mediump é um bom valor padrão. Do Inglês "medium precision", significa "precisão média"
    precision mediump float;

    // precisamos declarar um output para o fragment shader
    out vec4 outColor;

    void main() {
      // Simplesmente defina o output para um constante com uma cor avermelhada-roxa
      outColor = vec4(1, 0, 0.5, 1);
    }

Acima, nós declaramos `outColor` como um output do nosso fragment shader. Estamos definindo `outColor` com os valores `1, 0, 0.5, 1`
sendo 1 para vermelho, 0 para verde, 0.5 para azul, 1 para alpha. As cores na WebGL vão de 0 a 1.

Agora que nós escrevemos as duas funções shaders, vamos iniciar com a WebGL

Primeiro precisaremos de um elemento canvas do HTML

     <canvas id="c"></canvas>

Então, em JavaScript, podemos obtê-lo da seguinte forma

     var canvas = document.getElementById("c");

Agora podemos criar um WebGL2RenderingContext

     var gl = canvas.getContext("webgl2");
     if (!gl) {
        // sem webgl2 pra você!
        ...

Agora precisamos compilar esses shaders para colocá-los na GPU, então primeiro precisaremos inseri-los em strings.
Você criar suas strings GLSL da maneira que você normalmente cria strings em JavaScript. Por exemplo, concatenando,
usando AJAX para obtê-las, colocando-as em tags de script non-javascript, ou neste caso,
em literais de templates multilinha.

    var vertexShaderSource = `#version 300 es

    // um atributo é um input (in) para um vertex shader.
    // ele receberá dados de um buffer
    in vec4 a_position;
	
	// todos os shaders possuem uma função main
    void main() {

    // gl_Position é uma variável especial de um vertex shader
    // é responsável pela configuração
    gl_Position = a_position;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    // fragment shaders não tem uma precisão padrão, então nós precisamos
    // escolher uma. mediump é um bom valor padrão. Do Inglês "medium precision", significa "precisão média"
    precision mediump float;

    // precisamos declarar um output para o fragment shader
    out vec4 outColor;

    void main() {
      // Simplesmente defina o output para um constante com uma cor avermelhada-roxa
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

Na verdade, a maioria dos motores 3D geram shaders GLSL com case em vários tipos de templates, concatenação, etc.
Para as amostras neste site, nenhuma delas é suficientemente complexa para precisar
gerar GLSL em tempo de execução.

> NOTE: `#version 300 es` **DEVE SER A PRIMEIRA LINHA DO SEUS SHADER**. Nenhum comentário ou
> linhas em branco são permitidas antes dele! `#version 300 es` diz para a WebGL2 que você deseja
> usar a linguagem de shader da WebGL2, chamada GLSL ES 3.00. Se você não colocar isso como a primeira linha, a linguagem padrão
> do shader será definida para a da WebGL 1.0, a GLSL ES 1.00 que possui muitas diferenças e bem menos recursos.

Em seguida, precisamos de uma função que irá criar uma shader, faça o upload da fonte GLSL e compile o shader.
Note que eu não escrevi nenhum comentários visto que através do nome das funções é fácil
compreender o que está acontecendo.

    function createShader(gl, type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }

Agora podemos chamar essa função para criar os 2 shaders

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

Nós, então, precisamos *linkar* aqueles 2 shaders em um *program*

    function createProgram(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

E chame isso

    var program = createProgram(gl, vertexShader, fragmentShader);

Agora que criamos um programa GLSL na GPU, precisamos fornecer dados para ele.
A maioria da API da WebGL se trata de configurar o estado para fornecer dados aos nossos programas GLSL.
Nesse caso, nossa única entrada para o nosso programa GLSL é `a_position`, que por sua vez, é um atributo.
A primeira coisa que devemos fazer é procurar a localização do atributo para o programa
que nós acabamos de criar

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

Procurar posições de atributos (e locais uniformes) é algo que você deve
fazer durante a inicialização, e não no seu loop de renderização.

Atributos obtêm seus dados através de buffers, então, nós precisamos criar um buffer

    var positionBuffer = gl.createBuffer();

A WebGL nos permite manipular muitos recursos da WebGL em pontos de consolidação global.
Você pode pensar em pontos de ligação como variáveis internas globais dentro da WebGL.
Primeiro, você vincula um recurso a um ponto de ligação. E então, todas as outras funções
ao recurso através do ponto de ligação. Então, vamos vincular o buffer de posição.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

Agora podemos colocar dados nesse buffer, referenciando-o através do ponto de ligação

    // três pontos 2d
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

Há muita coisa acontecendo aqui. A primeira coisa que temos é `positions`, que é um
array em JavaScript. A WebGL, por outro lado, precisa de dados fortemente tipados, e então
a parte `new Float32Array(position)` cria uma nova matriz de números de pontos flutuantes de 32 bits
e copia os valores de `positions`. Então, `gl.bufferData` copia esses dados para o `positionBuffer` na GPU. O
buffer de posição está sendo usado porque nós o vinculamos ao ponto de ligação `ARRAY_BUFFER` acima.

O último argumento, `gl.STATIC_DRAW` é uma dica para a WebGL sobre como usaremos os dados.
A WebGL pode tentar usar essa sugestão para otimizar certas coisas. `gl.STATIC_DRAW` diz para a WebGL
que não é provável que mudemos muito esses dados.

Agora que colocamos dados em um buffer, precisamos mostrar ao atributo como obter os dados dele.
Primeiro, precisamos criar uma coleção do estado do atributo denominada Vertex Array Object.

    var vao = gl.createVertexArray();

E precisamos fazer com que ele seja o vertex array atual para que todas as nossas
configurações de atributos se apliquem a esse conjunto de estado de atributos

    gl.bindVertexArray(vao);

Finalmente, nós configuramos os atributos no vertex array. Em primeiro lugar, precisamos ativar o atributo.
Isso fala para a WebGL que queremos tirar dados de um buffer. Se não ativarmos o atributo, então, o atributo
terá um valor constante.

    gl.enableVertexAttribArray(positionAttributeLocation);

Então, nós precisamos especificar como obter os dados

    var size = 2;          // 2 componentes por iteração
    var type = gl.FLOAT;   // os dados são floats de 32bits
    var normalize = false; // não normalize os dados
    var stride = 0;        // 0 = mover para frente size * sizeof(type) cada iteração para obter a próxima posição
    var offset = 0;        // comece no início do buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

Uma parte oculta da `gl.vertexAttribPointer` é que ela vincula o atual `ARRAY_BUFFER`
ao atributo. Em outras palavras, agora esse atributo é obrigado a vincular o `positionBuffer`.
Isso significa que estamos livres para ligar outra coisa ao ponto de ligação `ARRAY_BUFFER`;
O atributo continuará usando o `positionBuffer`.

Observe que, do ponto de vista do nosso GLSL vertex shader, o atributo `a_position` é um `vec4`

    in vec4 a_position;

`vec4` é um 4 float value. Em JavaScript, você poderia pensar em algo como
`a_position = {x: 0, y: 0, z: 0, w: 0}`. Acima, nós definimos `size = 2`. Atributos
padrão para `0, 0, 0, 1` então esse atributo receberá seus primeiros 2 valores (x e y)
do nosso buffer. O z e o w, será o padrão 0 e 1, respectivamente.

Antes de desenharmos, devemos redimensionar nosso canvas (ou nossa tela) para corresponder com o nosso tamanho de exibição. As telas, como as imagens, possuem 2 tamanhos.
O número real de pixels em si e separadamente o tamanho que eles são exibidos.
O CSS determina o tamanho que o canvas é exibido. **Você sempre deve definir o tamanho que deseja
uma tela com o CSS**, pois é muito mais flexível do que qualquer outro método.

Para fazer com que o número de pixels na tela coincida com o tamanho exibido
[eu faço o uso de um helper, mais detalhes aqui](webgl-resizing-the-canvas.html).

Em quase todas essas amostras, o tamanho da tela é de 400x300 pixels se a anistra for executada 
em sua própria janela, mas ela se estende para preencher o espaço disponível se estiver dentro de um iframe
como ele está nesta página.
Ao permitir que o CSS determine o tamanho e, em seguida, ajuste seus tamanho para  corresponder ao da tela,
nós facilmente manipulamos ambos os casos.

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

Precisamos dizer ao WebGL como converter valores do clip space,
nós vamos configurar o `gl_Position` de volta para pixels, muitas vezes chamado de screen space.
Para isso, chamamos `gl.viewport` e passamos o tamanho atual da tela (canvas).

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

This tells WebGL the -1 +1 clip space maps to 0 &lt;-&gt; `gl.canvas.width` for x and 0 &lt;-&gt; `gl.canvas.height`
for y.

We clear the canvas. `0, 0, 0, 0` are red, green, blue, alpha respectively so in this case we're making the canvas transparent.

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

Next we need to tell WebGL which shader program to execute.

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

Then we need to tell it which set of buffers use and how to pull data out of those buffers to
supply to the attributes

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

After all that we can finally ask WebGL to execute our GLSL program.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

Because the count is 3 this will execute our vertex shader 3 times. The first time `a_position.x` and `a_position.y`
in our vertex shader attribute will be set to the first 2 values from the positionBuffer.
The 2nd time `a_position.xy` will be set to the 2nd two values. The last time it will be
set to the last 2 values.

Because we set `primitiveType` to `gl.TRIANGLES`, each time our vertex shader is run 3 times
WebGL will draw a triangle based on the 3 values we set `gl_Position` to. No matter what size
our canvas is those values are in clip space coordinates that go from -1 to 1 in each direction.

Because our vertex shader is simply copying our positionBuffer values to `gl_Position` the
triangle will be drawn at clip space coordinates

      0, 0,
      0, 0.5,
      0.7, 0,

Converting from clip space to screen space if the canvas size
happned to be 400x300 we'd get something like this

     clip space      screen space
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL will now render that triangle. For every pixel it is about to draw WebGL will call our fragment shader.
Our fragment shader just sets `outColor` to `1, 0, 0.5, 1`. Since the Canvas is an 8bit
per channel canvas that means WebGL is going to write the values `[255, 0, 127, 255]` into the canvas.

Here's a live version

{{{example url="../webgl-fundamentals.html" }}}

In the case above you can see our vertex shader is doing nothing
but passing on our position data directly. Since the position data is
already in clipspace there is no work to do. *If you want 3D it's up to you
to supply shaders that convert from 3D to clipspace because WebGL is only
a rasterization API*.

You might be wondering why does the triangle start in the middle and go to toward the top right.
Clip space in `x` goes from -1 to +1. That means 0 is in the center and positive values will
be to the right of that.

As for why it's on the top, in clip space -1 is at the bottom and +1 is at the top. That means
0 is in the center and so positive numbers will be above the center.

For 2D stuff you would probably rather work in pixels than clipspace so
let's change the shader so we can supply the position in pixels and have
it convert to clipspace for us. Here's the new vertex shader

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // convert the position from pixels to 0.0 to 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // convert from 0->1 to 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // convert from 0->2 to -1->+1 (clipspace)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

Some things to notice about the changes. We changed `a_position` to a `vec2` since we're
only using `x` and `y` anyway. A `vec2` is similar to a `vec4` but only has `x` and `y`.

Next we added a `uniform` called `u_resolution`. To set that we need to look up its location.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

The rest should be clear from the comments. By setting `u_resolution` to the resolution
of our canvas the shader will now take the positions we put in `positionBuffer` supplied
in pixels coordinates and convert them to clip space.

Now we can change our position values from clip space to pixels. This time we're going to draw a rectangle
made from 2 triangles, 3 points each.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

And after we set which program to use we can set the value for the uniform we created.
`gl.useProgram` is like `gl.bindBuffer` above in that it sets the current program. After
that all the `gl.uniformXXX` functions set uniforms on the current program.

    gl.useProgram(program);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

And of course to draw 2 triangles we need to have WebGL call our vertex shader 6 times
so we need to change the `count` to `6`.

    // draw
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

And here it is

Note: This example and all following examples use [`webgl-utils.js`](/webgl/resources/webgl-utils.js)
which contains functions to compile and link the shaders. No reason to clutter the examples
with that [boilerplate](webgl-boilerplate.html) code.

{{{example url="../webgl-2d-rectangle.html" }}}

Again you might notice the rectangle is near the bottom of that area. WebGL considers the bottom left
corner to be 0,0. To get it to be the more traditional top left corner used for 2d graphics APIs
we can just flip the clip space y coordinate.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

And now our rectangle is where we expect it.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Let's make the code that defines a rectangle into a function so
we can call it for different sized rectangles. While we're at it
we'll make the color settable.

First we make the fragment shader take a color uniform input.

    #version 300 es

    precision mediump float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

And here's the new code that draws 50 rectangles in random places and random colors.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fills the buffer with the values that define a rectangle.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
      // whatever buffer is bound to the `ARRAY_BUFFER` bind point
      // but so far we only have one buffer. If we had more than one
      // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

And here's the rectangles.

{{{example url="../webgl-2d-rectangles.html" }}}

I hope you can see that WebGL is actually a pretty simple API.
Okay, simple might be the wrong word. What it does is simple. It just
executes 2 user supplied functions, a vertex shader and fragment shader and
draws triangles, lines, or points.
While it can get more complicated to do 3D that complication is
added by you, the programmer, in the form of more complex shaders.
The WebGL API itself is just a rasterizer and conceptually fairly simple.

We covered a small example that showed how to supply data in an attribute and 2 uniforms.
It's common to have multiple attributes and many uniforms. Near the top of this article
we also mentioned *varyings* and *textures*. Those will show up in subsequent lessons.

Before we move on I want to mention that for *most* applications updating
the data in a buffer like we did in `setRectangle` is not common. I used that
example because I thought it was easiest to explain since it shows pixel coordinates
as input and demonstrates doing a small amount of math in GLSL. It's not wrong, there
are plenty of cases where it's the right thing to do, but you should [keep reading to find out
the more common way to position, orient and scale things in WebGL](webgl-2d-translation.html).

If you're 100% new to WebGL and have no idea what GLSL is or shaders or what the GPU does
then checkout [the basics of how WebGL really works](webgl-how-it-works.html).

You should also, at least briefly read about [the boilerplate code used here](webgl-boilerplate.html)
that is used in most of the examples. You should also at least skim
[how to draw mulitple things](webgl-drawing-multiple-things.html) to give you some idea
of how more typical WebGL apps are structured because unfortunately nearly all the examples
only draw one thing and so do not show that structure.

Otherwise from here you can go in 2 directions. If you are interested in image procesing
I'll show you [how to do some 2D image processing](webgl-image-processing.html).
If you are interesting in learning about translation,
rotation and scale then [start here](webgl-2d-translation.html).
