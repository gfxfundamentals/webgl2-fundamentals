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

4. Varyings

   As Varyings são uma maneira de um vertex shader passar dados para um fragment shader. Dependendo
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

Isso diz para a WebGL que o clip space -1 +1 mapeia para o 0 &lt;-&gt; `gl.canvas.width` para x e 0 &lt;-&gt; `gl.canvas.height`
para y.

Agora, nós limpamos nosso canvas. `0, 0, 0, 0` são vermelho, verde, azul, alpha, respectivamente, então, nesse caso, estamos definindo o canvas como transparente.

    // Limpar o canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

Em seguida, precisamos dizer ao WebGL qual shader é executado.

    // Fala para usar nosso program (par de shaders)
    gl.useProgram(program);

Então precisamos informar qual é o conjunto de buffers usar e como obter os dados desses buffers
e então fornecer os dados aos atributos

    // Vincule o atributo/buffer que desejamos.
    gl.bindVertexArray(vao);


Depois de tudo o que fizeemos, finalmente, podemos pedir a WebGL que execute o nosso programa GLSL.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

Como a contagem é 3, isso executará o nosso vertex shader 3 vezes. A primeira vez `a_position.x` e `a_position.y`
em nosso atributo vertex shader será configurado para os dois primeiros valores do positionBuffer.
A segunda vez `a_position.xy` será configurado para os dois segundos valores. Na última vez, ele será
configurado para os últimos 2 valores.

Como definimos `primitiveType` para `gl.TRIANGLES`, cada vez que nosso vertex shader é executado 3 vezes,
a WebGL desenhará um triângulo com base nos 3 valores que definimos em `gl_Position`. Não importa o tamanho da
nossa tela, esses valores estão nas coordenadas do nosso clip space que vão de -1 a 1 em cada direção.

Como o nosso vertex shader está simplesmente copiando os valores do nosso positionbuffer para a `gl_Position`, o
o triângulo será desenhado nas coordenadas do clip space

      0, 0,
      0, 0.5,
      0.7, 0,

Convertendo do clip space para o espaço da tela se o tamanho da tela
passasse ser 400x300, nós teríamos algo assim

     clip space      screen space
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

A WebGL agora renderizará esse triângulo. Para cada pixel que está prestes a desenhar, a WebGL chamará o nosso fragment shader.
Nosso fragment shader apenas define a `outColor` para `1, 0, 0.5, 1`. Como o Canvas é um canvas de 8bits
por canal, significa que, a WebGL vai escrever os seguintes valores `[255, 0, 127, 255]` na tela.

Aqui está um exemplo já pronto

{{{example url="../webgl-fundamentals.html" }}}

No caso acima, você pode ver que o nosso vertex shader não está fazendo nada
além de passar nossos dados de posição diretamente. Como os dados da posição já
estão no clipspace, não há trabalho a fazer. *Se você quer objetos 3D, só depende de você
fornecer shaders que convertam de 3D para clipspace porque a WebGL é, apenas,
uma API de rasterização*.

Você pode estar se perguntando por que o triângulo começa no meio e vai para o canto superior direito.
O clip space em `x` vai de -1 a +1. Isso significa que o 0 está no centro e os valores positivos
irão para à direita dele.

Quanto ao porquê está no topo, o clip space -1 está na parte inferior e +1 está no topo.
Isso significa que, o 0 está no centro e os números positivos estarão acima do centro.

Para coisas 2D, você provavelmente iria preferir trabalhar em pixels do que com o clipspace
então vamos mudar o shader para que possamos fornecer a posição em pixels e
convertê-lo em um clipspace para nós. Aqui está o novo vertex shader

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // converte a posição dos pixels de 0.0 para 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // converte de 0->1 para 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // converte de 0->2 para -1->+1 (clipspace)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

Algumas coisas que devemos notar sobre as mudanças. Nós mudamos a `a_position` para um `vec2` já que nós
estamos apenas usando `x` e `y`. Um `vec2` é semelhante a um `vec4`, porém, possui apenas `x` e `y`.

Em seguida, adicionamos um `uniform` chamado `u_resolution`. Para definir que precisamos procurar por sua localização.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

O reste deve estar claro a partir dos comentários. Ao configurar `u_resolution` para a resolução
do nosso canvas, o shader vai agora tomar as posições que colocamos no `positionBuffer` fornecido
nas coordenadas dos pixels e convertê-los em clip space.

Agora podemos alterar os valores da nossa posição do clip space para pixels. Desta vez,
vamos desenhar um retângulo feito de 2 triângulos, 3 pontos, cada.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

E depois de definirmos qual programa usar, podemos definir o valor do uniform que criamos.
`gl.useProgram` é como `gl.bindBuffer` acima, em que ele define o programa atual.
Depois de tudo, as funções `gl.uniformXXX` definem os uniforms no programa atual.

    gl.useProgram(program);

	// Passa a resolução do canvas, assim nós podemos converter
	// de pixels para clipspace no shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

E, claro, para desenhar dois triângulos, precisamos que a WebGL chame nosso vertex shader 6 vezes,
para isso, precisamos mudar o `count` para `6`.

    // desenha
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

E aqui está

Nota: Este exemplo e todos os exemplos a seguir usam [`webgl-utils.js`](/webgl/resources/webgl-utils.js)
que contém funções para compilar e vincular os shaders. Não há nenhuma razão para desordenar os
exemplos com o [boilerplate](webgl-boilerplate.html).

{{{example url="../webgl-2d-rectangle.html" }}}

Novamente, você pode notar que o retângulo está perto do fundo dessa área. A WebGL considera que o canto 
inferior esquerdo é 0,0. Para que ele seja o tradicional canto superior esquerdo, usado nas APIS de gráficos
2D, nós podemos simplesmente virar a coordenada y do clipspace.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

E agora o nosso retângulo está aonde esperavamos.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Vamos fazer o código que define um retângulo em uma função para
podermos chamá-lo para retângulos de diferentes tamanhos. Enquanto estamos nisso,
nós tornaremos a cor ajustável.

Primeiro fazemos o fragment shader pegar uma color uniform input.

    #version 300 es

    precision mediump float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

E aqui está o novo código que desenha 50 retângulos com cores e locais aleatórios.

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // desenha 50 retângulos com cores e locais aleatórios
      for (var ii = 0; ii < 50; ++ii) {
        // Define um retângulo aleatório
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Define uma cor aleatória.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Desenha o retângulo.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // Retorna um inteiro aleatório entre o intervalo de 0 e - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Preenche o buffer com os valores que definem um retângulo.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTA: gl.bufferData(gl.ARRAY_BUFFER, ...) afetará
      // qualquer buffer que esteja vinculado ao `ARRAY_BUFFER`,
      // mas até agora temos apenas um buffer. Se tivessémos mais de um
      // buffer, gostaríamos de vincular este buffer a `ARRAY_BUFFER` primeiro.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

E aqui está os retângulos.

{{{example url="../webgl-2d-rectangles.html" }}}

Espero que você veja que a WebGL é realmente uma API bastante simples.
Tudo bem, simples pode ser a palavra errada. Mas o que ela faz é simples. Ela apenas
executa 2 funções fornecidas pelo usuário, um vertex shader e um fragment shader e
desenha triângulos, linhas ou pontos.
Embora possa ser mais complicado fazer uma abordagem 3D, essa complicação é
definida por você, o programador, sob a forma de shaders mais complexos.
A própria API da WebGL é apenas um rasterizador e, conceitualmente, bastante simples.

Cobrimos um pequeno exemplo que mostrou como fornecer dados em um atributo e 2 uniforms.
É comum ter múltiplos atributos e muitos uniforms. Perto do topo deste artigo
também mencionamos *varyings* e *texturas*. Isso aparecerá em lições subsequentes.

Antes de avançarmos, quero mencionar que para *a maioria das* aplicações em atualização
os dados em um buffer, como fizemos em `setRectangle`, não são comuns. Usei esso
exemplo porque pensei que era mais fácil de explicar porque mostra coordenadas de pixels
como entrada e demonstra como fazer uma pequena quantidade de cálculos na GLSL. Não é errado, há
muitos os casos em que isso é o certo a se fazer, mas você deve [continuar lendo para descobrir
a maneira mais comum de posicionar, orientar e dimensionar coisas na WebGL](webgl-2d-translation.html).

Se você é 100% leigo na WebGL e não tem ideia do que é GLSL ou shaders ou o que a GPU faz, então,
em seguida, verifique [os conceitos básicos de como a WebGL realmente funciona] (webgl-how-it-works.html).(webgl-how-it-works.html).

Você também deve, pelo menos, ler brevemente sobre [o código boilerplate usado aqui](webgl-boilerplate.html)
que é usado na maioria dos exemplos. Você também deve, pelo menos ver
[como desenhar múltiplas coisas](webgl-drawing-multiple-things.html) para ter uma ideia de como
as aplicações em WebGL são estruturadas porque, infelizmente, apenas desenha algo e, portanto, não mostra essa estrutura.

Caso contrário, a partir daqui você pode ir em duas direções. Se você está interessado em processar imagens
Vou lhes mostrar [como fazer algum processamento de imagem 2D](webgl-image-processing.html).
Se você está interessado em aprender sobre translação, rotação e escala, então,
[comece aqui](webgl-2d-translation.html).
