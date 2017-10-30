Title: Processamento de imagem WebGL2
Description: Como processar imagens na WebGL

O processamento de imagens é fácil na WebGL. Quão fácil? Leia abaixo.

Esta é uma continuação de [Fundamentos da WebGL2](webgl-fundamentals.html).
Se você não leu, eu sugiro [ir lá primeiro](webgl-fundamentals.html).

Para desenhar imagens na WebGL precisamos usar texturas. Da mesma forma que a
WebGL espera coordenadas de clipspace ao renderizar em vez de pixels,
a WebGL geralmente espera coordenadas de textura ao ler uma textura.
As coordenadas da textura variam de 0,0 a 1,0 independentemente das dimensões da textura.

A WebGL2 adiciona a capacidade de ler uma textura usando coordenadas de pixels também.
Qual caminho é melhor depende de você. Sinto que é mais comum usar as 
coordenadas de textura do que as coordenadas de pixels.

Uma vez que estamos apenas desenhando um único retângulo (bem, 2 triângulos),
precisamos dizer a WebGL qual lugar na textura em que cada ponto do
retângulo corresponde. Vamos passar esta informação do vertex
para o fragmento shader usando um tipo especial de variável chamado
de 'varying'. É chamado de varying porque isso varia. [WebGL irá
interpolar os valores](webgl-how-it-works.html) que fornecemos no
vertex shader pois desenha cada pixel usando o fragmento shader.

Usando [o vertex shader do final da publicação anterior](webgl-fundamentals.html)
precisamos adicionar um atributo para passar em coordenadas de textura e depois
passar para o fragmento shader.

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // passe o texCoord para o fragmento shader
    +   // O GPU irá interpolar esse valor entre pontos
    +   v_texCoord = a_texCoord;
    }

Então, fornecemos um fragmento shader para procurar cores da textura.

    #version 300 es
    precision mediump float;

    // nossa textura
    uniform sampler2D u_image;

    // O texCoords passou do vertex shader.
    in vec2 v_texCoord;

    // precisamos declarar uma saída para o fragmento shader
    out vec4 outColor;

    void main() {
       // Procure uma cor da textura.
       outColor = texture(u_image, v_texCoord);
    }

Finalmente, precisamos carregar uma imagem, criar uma textura e copiar a imagem
para a textura. Como estamos em imagens de um navegador, carregamos de forma assíncrona,
então devemos reorganizar nosso código um pouco para aguardar o carregamento da textura.
Uma vez que carregada, vamos desenhá-la.

    +function main() {
    +  var image = new Image();
    +  image.src = "http://someimage/on/our/server";  // DEVE SER MESMO DOMÍNIO!!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // procure onde os dados do vértice precisam ir.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // uniforms de pesquisa
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // fornecer coordenadas de textura para o retângulo.
    +  var texCoordBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    +      0.0,  0.0,
    +      1.0,  0.0,
    +      0.0,  1.0,
    +      0.0,  1.0,
    +      1.0,  0.0,
    +      1.0,  1.0]), gl.STATIC_DRAW);
    +  gl.enableVertexAttribArray(texCoordAttributeLocation);
    +  var size = 2;          // 2 componentes por iteração
    +  var type = gl.FLOAT;   // os dados são floats de 32bit 
    +  var normalize = false; // não normalize os dados
    +  var stride = 0;        // 0 = mover para o tamanho * sizeof (tipo) cada iteração para obter a próxima posição
    +  var offset = 0;        // comece no início do buffer
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // faça da unidade 0 a unidade de textura ativa
    +  // (ie, the unit all other texture commands will affect
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // Vincule a unidade de textura 0' ponto de ligação 2D
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // Defina os parâmetros para que não precisemos de mips e por isso não estamos filtrando
    +  // e não repetindo
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // Carregue a imagem para a textura.
    +  var mipLevel = 0;               // the largest mip
    +  var internalFormat = gl.RGBA;   // format we want in the texture
    +  var srcFormat = gl.RGBA;        // format of data we are supplying
    +  var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // Diga para usar nosso programa (par de shaders)
      gl.useProgram(program);

      // Passe na resolução da tela para que possamos converter
      // pixels para clipspace no shader
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // Diga ao shader para obter a textura da unidade de textura 0
    +  gl.uniform1i(imageLocation, 0);

    +  // Vincule o buffer de posição para que gl.bufferData seja chamado
    +  // em setRectangle para colocar dados no buffer de posição
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // Defina um retângulo do mesmo tamanho que a imagem.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

E aqui está a imagem renderizada na WebGL.

{{{example url="../webgl-2d-image.html" }}}

Não muito emocionante, então vamos manipular essa imagem. Que tal simplesmente 
trocar vermelho e azul?

    ...
    outColor = texture2D(u_image, v_texCoord).bgra;
    ...

E agora vermelho e azul foram trocados.

{{{example url="../webgl-2d-image-red2blue.html" }}}

E se quisermos processar imagens que realmente olhem para outros
pixels? Uma vez que a WebGL faz referência a texturas em coordenadas de textura que
variam de 0,0 a 1,0, podemos calcular o quanto move 1 pixel
 com o simples math <code>onePixel = 1.0 / textureSize</code>.

Aqui está um fragmento que mede os pixels esquerdos e direitos de
cada pixel na textura.

```
#version 300 es

// fragmentos shaders não têm uma precisão padrão, então precisamos
// para escolher um. O médio é um bom padrão. Significa "precisão média"
precision mediump float;

// nossa textura
uniform sampler2D u_image;

// o texCoords passou do vertex shader.
in vec2 v_texCoord;

// precisamos declarar uma saída para o fragmento shader
out vec4 outColor;

void main() {
+  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
+
+  // média dos pixels esquerdo, médio e direito.
+  outColor = (
+      texture(u_image, v_texCoord) +
+      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
+      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
```

Compare com a imagem não borrada acima.

{{{example url="../webgl-2d-image-blend.html" }}}

Agora que sabemos como fazer referência a outros pixels, vamos usar um convolution kernel
para fazer varios processamentos de imagem comum. Neste caso, usaremos um kernel 3x3.
Um convolution kernel é apenas uma matriz de 3x3, onde cada entrada na matriz representa
o quanto para multiplicar os 8 pixels ao redor do pixel que estamos renderizando. Em seguida,
dividimos o resultado pelo peso do kernel (a soma de todos os valores no kernel)
ou 1,0, o que for maior. [Aqui está um artigo muito bom sobre isso](http://docs.gimp.org/en/plug-in-convmatrix.html).
E [aqui está outro artigo que mostra algum código real se
você escrevesse isso manualmente em C ++](http://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

No nosso caso, vamos fazer isso funcionar no shader, então aqui está o novo fragment shader.

```
#version 300 es

// fragmentos shaders não têm uma precisão padrão, então precisamos
// para escolher um. O médio é um bom padrão. Significa "precisão média"
precision mediump float;

// nossa textura
uniform sampler2D u_image;

// os dados do convolution kernal
uniform float u_kernel[9];
uniform float u_kernelWeight;

// o texCoords passou do vertex shader.
in vec2 v_texCoord;

// precisamos declarar uma saída para o fragmento shader
out vec4 outColor;

void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

  vec4 colorSum =
      texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
      texture(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
      texture(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
  outColor = vec4((colorSum / u_kernelWeight).rgb, 1);
}
```

Em JavaScript, precisamos fornecer um convolution kernel e seu peso

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];

    // definir o kernel e seu peso
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

Aí está... Use a lista suspensa para selecionar diferentes kernels.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

Espero que este artigo tenha o convencido de que o processamento de imagens na WebGL é bastante simples. Em seguida,
falarei como [aplicar mais de um efeito à imagem](webgl-image-processing-continued.html).

<div class="webgl_bottombar">
<h3>O que são unidades de textura?</h3>
Quando você chama <code>gl.draw???</code> seu shader pode fazer referência a texturas. Texturas estão vinculadas
com unidades de texturas. Embora a máquina do usuário possa suportar, todas as implementações WebGL2 
são necessárias suportar pelo menos 16 unidades de textura. Qual unidade de textura cada referência
uniforme de amostras é definida procurando a localização dessa amostra uniforme e, em seguida, ajuste o
índice da unidade de textura que você deseja que ela faça referência.

Por exemplo:
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use a unidade de textura 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

Para definir texturas em diferentes unidades, chame gl.activeTexture e, em seguida, vincule a textura desejada nessa unidade. Exemplo

<pre class="prettyprint showlinemods">
// Vincule someTexture à unidade de textura 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

Isso também funciona

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use a unidade de textura 6.
// Vincule someTexture à unidade de textura 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>O que são os prefixos a_, u_ e v_ de variáveis no GLSL?</h3>
<p>
Isso é apenas uma convenção de nomeação. Eles não são necessários, mas para mim é mais fácil ver de relance de onde
os valores estão vindo. a_ para atributos que são os dados fornecidos por buffers. u_ para uniforms
que são inputs para os shaders, v_ para variações que são valores passados de um vertex shader para um
fragmento shader e interpolados (ou variados) entre os vértices para cada pixel desenhado.
Veja <a href="webgl-how-it-works.html">Como funciona</a> para mais detalhes.
</p>
</div>


