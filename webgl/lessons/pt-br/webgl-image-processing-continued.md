Title: Processamento de Imagem Continuada WebGL2
Description: Como aplicar várias técnicas de processamento de imagens em imagens na WebGL

Este artigo é uma continuação do [Processamento de imagem WebGL2](webgl-image-processing.html).
Se você não leu, eu sugiro [que você comece por lá](webgl-image-processing.html).

A próxima pergunta mais óbvia para o processamento de imagens é, como aplicar múltiplos efeitos?

Bem, você poderia tentar gerar shaders em tempo real. Fornecer uma interface que permite
ao usuário selecionar os efeitos que ele quer usar, em seguida, gerar um shader que faz
todos os efeitos. Isso nem sempre é possível, embora essa técnica seja
usada frequentemente para [criar efeitos para gráficos em tempo real](http://www.youtube.com/watch?v=cQUn0Zeh-0Q).

Uma maneira mais flexível é usar mais 2 texturas *work* e renderizar
a cada textura por sua vez, fazendo um ping-pong para frente e para trás
e aplicando o próximo efeito a cada vez.

<blockquote><pre>Imagem original -&gt; [Blur]        -&gt; Textura 1
Textura 1      -&gt; [Sharpen]     -&gt; Textura 2
Textura 2      -&gt; [Edge Detect] -&gt; Textura 1
Textura 1      -&gt; [Blur]        -&gt; Textura 2
Textura 2      -&gt; [Normal]      -&gt; Tela</pre></blockquote>

Para fazer isso precisamos criar framesbuffers. Na WebGL e OpenGL, um Framebuffer
é realmente um nome ruim. Uma WebGL / OpenGL Framebuffer é realmente apenas
uma lista de anexos e não realmente um buffer de qualquer tipo. Mas, ao
anexar uma textura a um framebuffer, podemos renderizar essa textura.

Primeiro, vamos transformar [o antigo código de criação de textura](webgl-image-processing.html) em uma função

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Configure a textura para que possamos renderizar qualquer imagem de tamanho e, portanto estamos
    // trabalhando com pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // Crie uma textura e coloque a imagem nela.
  var originalImageTexture = createAndSetupTexture(gl);

  // Carregue a imagem para a textura.
  var mipLevel = 0;               // o maior mip
  var internalFormat = gl.RGBA;   // formato que queremos na textura
  var srcFormat = gl.RGBA;        // formato de dados que estamos fornecendo
  var srcType = gl.UNSIGNED_BYTE  // tipo de dados que estamos fornecendo
  gl.texImage2D(gl.TEXTURE_2D,
                mipLevel,
                internalFormat,
                srcFormat,
                srcType,
                image);
```

E agora vamos usar essa função para criar mais 2 texturas e anexá-las a 2 framebuffers.

```
  // crie 2 texturas e anexe-as a framesbuffers.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // faça a textura do mesmo tamanho que a imagem
    var mipLevel = 0;               // o maior mip
    var internalFormat = gl.RGBA;   // formato que queremos na textura
    var border = 0;                 // deve ser 0
    var srcFormat = gl.RGBA;        // formato de dados que estamos fornecendo
    var srcType = gl.UNSIGNED_BYTE  // tipo de dados que estamos fornecendo
    var data = null;                // sem dados = crie uma textura em branco
    gl.texImage2D(
        gl.TEXTURE_2D, mipLevel, internalFormat, image.width, image.height, border,
        srcFormat, srcType, data);

    // Crie um framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Anexe uma textura a ele.
    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }
```

Agora vamos fazer um conjunto de kernels e, em seguida, uma lista deles para se inscrever.

```
  // Definir vários kernels convolution
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
  };

  // Lista de efeitos a serem aplicados.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

E, finalmente, vamos aplicar a cada um, o ping ponging de qual texturas estamos renderizando também 

```
  function drawEffects() {
    // Diga para usar nosso programa (par de shaders)
    gl.useProgram(program);

    // Vincule o conjunto de atributo/buffer que queremos.
    gl.bindVertexArray(vao);

    // comece com a imagem original na unidade 0
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // Diga ao shader para obter a textura da unidade de textura 0
    gl.uniform1i(imageLocation, 0);

    // não toque as imagens enquanto desenha com as texturas
    gl.uniform1f(flipYLocation, 1);

    // faça um loop para cada efeito que queremos aplicar.
    var count = 0;
    for (var ii = 0; ii < tbody.rows.length; ++ii) {
      var checkbox = tbody.rows[ii].firstChild.firstChild;
      if (checkbox.checked) {
        // Configuração para desenhar em um dos framebuffers.
        setFramebuffer(framebuffers[count % 2], image.width, image.height);

        drawWithKernel(checkbox.value);

        // para o próximo desenho, use a textura que acabamos de renderizar.
        gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

        // contagem de incremento, então usamos a outra textura na próxima vez.
        ++count;
      }
    }

    // finalmente, desenhe o resultado para a tela.
    gl.uniform1f(flipYLocation, -1);  // precisa virar para tela

    setFramebuffer(null, gl.canvas.width, gl.canvas.height);

    drawWithKernel("normal");
  }

  function setFramebuffer(fbo, width, height) {
    // faça deste o framebuffer para o qual estamos renderizando.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Diga ao shader a resolução do framebuffer.
    gl.uniform2f(resolutionLocation, width, height);

    // Diga WebGL como converter do clip space para pixels
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // definir a kernel e seu peso
    gl.uniform1fv(kernelLocation, kernels[name]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

    // Desenhe o retângulo.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Aqui está uma versão de trabalho com uma interface um pouco mais flexível. Verifique os efeitos
para ativá-los. Arraste os efeitos para reordenar como eles são aplicados.

{{{example url="../webgl-2d-image-processing.html" }}}

Algumas coisas que devo passar.

Chamar `gl.bindFramebuffer` com `null` diz para a WebGL que você deseja renderizar
na tela em vez de em um de seus framebuffers.

Os framebuffers podem ou não funcionar, dependendo de quais anexos você
colocou sobre eles. Há uma lista de quais tipos e combinações de anexos
devem funcionar sempre. O utilizado aqui, um `RGBA`/`UNSIGNED_BYTE` textura
atribuída ao `COLOR_ATTACHMENT0` como ponto de ligação, é sempre suposto irá funcionar.
Formatos de textura mais exótica ou combinações de anexos podem não funcionar.
Nesse caso, você deve vincular o framebuffer e depois chamar
`gl.checkFramebufferStatus` e veja se ele retorna `gl.FRAMEBUFFER_COMPLETE`.
Se sim, você está pronto para ir. Caso contrário, você precisará dizer ao usuário que
recorra a outra coisa. Felizmente a WebGL2 suporta muitos formatos e combinações.

A WebGL tem que converter de [clipspace](webgl-fundamentals.html) novamente em pixels.
Ela faz isso com base nas configurações de `gl.viewport`. Uma vez que os framebuffers
em que estamos renderizando são de tamanho diferente da tela que precisamos para configurar
a viewport adequadamente, isso depende se estamos renderizando uma textura ou na tela.

Finalmente, no [exemplo original](webgl-fundamentals.html) nós invertemos a
coordenada Y ao renderizar porque a WebGL exibe a tela com 0,0 sendo o canto
inferior esquerdo em vez do mais tradicional do 2D no superior esquerda. Isso não é
necessário ao renderizar um framebuffer. Como o framebuffer nunca é exibido,
qual parte é superior e inferior é irrelevante. Tudo o que importa é
que o pixel 0,0 no framebuffer correspondam a 0,0 em nossos cálculos.
Para lidar com isso, eu tornei possível definir se deve virar ou não,
adicionando mais uma entrada uniforme na chamada do shader `u_flipY`.

```
...
+uniform float u_flipY;
...

void main() {
  ...
+   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
  ...
}
```

E então podemos configurá-lo quando renderizamos com

```
  ...
+  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

+  // não virar
+  gl.uniform1f(flipYLocation, 1);

  ...

+  // virar
+  gl.uniform1f(flipYLocation, -1);
```

Mantive esse exemplo simples usando um único programa GLSL que pode alcançar
múltiplos efeitos. Se você quisesse fazer tudo no processamento de imagem, você provavelmente 
precisaria de muitos programas GLSL. Um programa para ajuste de tonalidade, saturação e luminância.
Outro para brilho e contraste. Um para inverter, outro para ajustar
níveis, etc. Você precisaria alterar o código para trocar programas GLSL e atualizar
os parâmetros para esse programa específico. Eu considerei em escrever esse exemplo,
mas é melhor como um exercício para o leitor, porque vários programas GLSL, cada um
com seu próprio parâmetro, precisam provavelmente de uma grande refatoração para evitar
que tudo se torne uma grande bagunça.

Espero que este e os exemplos anteriores tenham tornado o WebGL um pouco mais
acessível e espero que começar com o 2D ajuda a tornar o WebGL um pouco mais fácil
de entender. Se eu encontrar tempo, vou tentar escrever [mais alguns artigos](webgl-2d-translation.html)
sobre como fazer em 3D, bem como mais detalhes sobre [O que o WebGL realmente está fazendo sob o capô](webgl-how-it-works.html).
Para um próximo passo, aprenda [como usar 2 ou mais texturas](webgl-2-textures.html).


