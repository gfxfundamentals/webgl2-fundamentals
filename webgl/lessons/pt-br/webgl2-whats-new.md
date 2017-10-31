Title: WebGL2 O que há de novo
Description: O que há de novo no WebGL2

WebGL2 é uma atualização bastante significativa da WebGL1.
Se você está vindo da WebGL1 e quer saber
como ajustar seu código para que você possa aproveitar
da WebGL2 [veja este artigo](webgl1-to-webgl2.html).

Aqui está uma pequena lista sem uma ordem específica

## Objetos Vertex Array sempre disponiveis 

Eu acho que isso é bastante importante mesmo que
estava opcionalmente disponível na WebGL1 e agora que é
sempre disponível na WebGL2 [acho que você provavelmente deveria
sempre usá-lo] (webgl1-to-webgl2.html # Vertex-Array-Objects).

## O tamanho de uma textura está disponível para shaders.

Na WebGL1 se o seu shader precisasse conhecer o tamanho 
de uma textura, que você precisava passar do tamanho
em uniformente. Na WebGL2 você pode chamar

    vec2 size = textureSize(sampler, lod)

Para obter o tamanho de qualquer lod de uma textura

## Pesquisa Direta Texel

Muitas vezes, é conveniente armazenar grandes matrizes de dados em uma textura.
Na WebGL1 você poderia fazer isso, mas você só poderia abordar as texturas
com cooridados de textura (0,0 a 1,0). Na WebGL2 você pode olhar
valores de uma textura por pixel / texel coordenadas diretamente
tornando o acesso à rede ligeiramente mais fácil

    vec4 values = texelFetch(sampler, ivec2Position, lod);

## Muitos formatos de textura

A WebGL1 tinha apenas alguns formatos de textura. WebGL2 tem TONELADAS!

*   `RGBA32I`
*   `RGBA32UI`
*   `RGBA16I`
*   `RGBA16UI`
*   `RGBA8`
*   `RGBA8I`
*   `RGBA8UI`
*   `SRGB8_ALPHA8`
*   `RGB10_A2`
*   `RGB10_A2UI`
*   `RGBA4`
*   `RGB5_A1`
*   `RGB8`
*   `RGB565`
*   `RG32I`
*   `RG32UI`
*   `RG16I`
*   `RG16UI`
*   `RG8`
*   `RG8I`
*   `RG8UI`
*   `R32I`
*   `R32UI`
*   `R16I`
*   `R16UI`
*   `R8`
*   `R8I`
*   `R8UI`
*   `RGBA32F`
*   `RGBA16F`
*   `RGBA8_SNORM`
*   `RGB32F`
*   `RGB32I`
*   `RGB32UI`
*   `RGB16F`
*   `RGB16I`
*   `RGB16UI`
*   `RGB8_SNORM`
*   `RGB8I`
*   `RGB8UI`
*   `SRGB8`
*   `R11F_G11F_B10F`
*   `RGB9_E5`
*   `RG32F`
*   `RG16F`
*   `RG8_SNORM`
*   `R32F`
*   `R16F`
*   `R8_SNORM`
*   `DEPTH_COMPONENT32F`
*   `DEPTH_COMPONENT24`
*   `DEPTH_COMPONENT16`

## Texturas 3D

A textura 3D é exatamente isso. Texturas que têm 3 dimensões.

## Arrays de textura

Uma matriz de textura é muito semelhante a uma textura 3D, exceto que
cada fatia é considerada uma textura separada. Todas as fatias
tem que ser do mesmo tamanho, mas esta é uma ótima maneira de dar
um acesso de shader a centenas de texturas, embora
apenas tem um número relativamente pequeno de unidades de textura. Você pode
selecione a fatia em seu shader

    vec4 color = texture(someSampler2DArray, vec3(u, v, slice));

## Non-Power de 2 formatos de textura

Nas texturas WebGL1 que não eram um poder de 2 não podiam ter mips.
Na WebGL2, esse limite é removido. A Non-power de textura 2 funciona exatamente
o mesmo que o poder de 2 texturas.

## Restrições de loop em shaders removidas

Na WebGL1, um loop em um shader precisava usar uma expressão de inteiro constante.
WebGL2 remove esse limite (em GLSL 300 es)

## Funções da matriz no GLSL

Na WebGL1 se necessário para obter o inverso de uma matriz que você precisava
passe-o como um uniforme. No WebGL2 GLSL 300 é existe o construído em
função `inverse`, bem como `transpose`.

## Texturas comprimidas comuns

Na WebGL1 existem vários formatos de textura comprimida
que dependem de hardware. O S3TC era basicamente apenas de desktop.
PVTC era apenas iOS. Etc ..

Na WebGL2, esses formatos devem ser suportados em todos os lugares

*   `COMPRESSED_R11_EAC RED`
*   `COMPRESSED_SIGNED_R11_EAC RED`
*   `COMPRESSED_RG11_EAC RG`
*   `COMPRESSED_SIGNED_RG11_EAC RG`
*   `COMPRESSED_RGB8_ETC2 RGB`
*   `COMPRESSED_SRGB8_ETC2 RGB`
*   `COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 RGBA`
*   `COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 RGBA`
*   `COMPRESSED_RGBA8_ETC2_EAC RGBA`
*   `COMPRESSED_SRGB8_ALPHA8_ETC2_EAC`

## Objetos de Buffer Uniform

Objetos de Buffer Uniform permitem que você especifique um monte de uniformes
de um buffer. As vantagens são

1. Você pode manipular todos os uniformes no buffer
   fora da WebGL

   Na WebGL1, se você tivesse 16 uniformes que exigiriam
   16 chamadas para `gl.uinformXXX`. Isso é relativamente lento.
   Na WebGL2 se você usar
   Um Objeto de Buffer Uniform, você pode definir os valores em
   uma matriz digitada tudo dentro do JavaScript, o que significa que é
   muito mais rápido. Quando todos os valores estiverem configurados
   você carrega todos eles com 1 chamada para `gl.bufferData`
   ou `gl.bufferSubData` e depois diga ao programa
   usar esse buffer com `gl.bindBufferRange` para que apenas
   2 chamadas.

2. Você pode ter diferentes conjuntos de uniformes de objetos buffer

   Primeiro, alguns termos. Um bloco uniforme é uma coleção
   de uniformes definidos em um shader. Um Objeto de Buffer Uniform
   é um buffer que contém os valores de um bloco uniforme
   usará. Você pode criar tantos Objetos de Buffer Uniform
   como você deseja e vincular um deles a um determinado bloco uniforme
   quando você desenha.

   Por exemplo, você poderia ter 4 blocos uniformes definidos
   em um sombreador.

   * Um bloco uniforme de matriz global que contém
     matrizes que são iguais para todas as chamadas de desenho como a
     matriz de projeção, matriz de exibição, etc.

   * Um bloco modelo uniforme que contém matrizes que são
     diferentes por modelo, por exemplo, a matriz mundial e
     matriz normal.

   * Um bloco de material uniforme que contém as configurações de material
     como difusa, ambiente, especular, etc.

   * Um bloco uniforme de iluminação que contém os dados de iluminação
     como a cor clara, a posição da luz, etc.

   Em seguida, em tempo de execução, você poderia criar um objeto buffer
   uniforme global, um modelo de objeto de buffer uniforme por modelo, um
   objeto de buffer uinformado leve por luz e um objeto buffer uniforme
   por material.

   Para desenhar qualquer item em particular, assumindo que todos os valores
   já estão atualizados, tudo o que você precisa fazer é vincular os
   4 objetos de buffer uniformes desejados

       gl.bindBufferRange(..., globalBlockIndx, globalMatrixUBO, ...);
       gl.bindBufferRange(..., modelBlockIndx, someModelMatrixUBO, ...);
       gl.bindBufferRange(..., materialBlockIndx, someMaterialSettingsUBO, ...);
       gl.bindBufferRange(..., lightBlockIndx, someLightSettingsUBO, ...);

## Texturas inteiras, atributos e matemática

Na WebGL2 você pode ter texturas baseadas em números inteiros onde, como
na WebGL1, todas as texturas representavam valores de ponto flutuante
mesmo que não fossem representados por valores de ponto flutuante.

Você também pode ter atributos inteiros.

Além disso, o GLSL 300 es permite que você faça manipulações de bits
de inteiros nos shaders.

## Transformar feedback

WebGL2 permite que seu vertex shader escreva seus resultados de volta
para um buffer.

##  Amostras

Na WebGL1, todos os parâmetros de textura foram por textura.
Na WebGL2 você pode opcionalmente usar objetos de amostras. Com
amostras, todos os parâmetros de filtragem e repetição/aperto
que faziam parte de um movimento de textura para o amostrador. Isso significa
uma única textura pode ser amostrada de maneiras diferentes. recorrente
ou clamada. Filtrado ou não filtrado.

Um mini-side rant: Eu escrevi 6 motores de jogo. Eu nunca,
pessoalmente, de um artista precisasse filtrar texturas em
de várias maneiras. Eu ficaria curioso para saber se algum outro jogo
os desenvolvedores de motores tiveram uma experiência diferente.

## Texturas de profundidade

As texturas de profundidade foram opcionais no WebGL1 e PITA para trabalhar. Agora eles são padrão.
Comumente usado para computação de mapas de sombra

## Derivados Padrão

Estes são agora padrão. Os usos comuns incluem padrões de computação nos shaders em vez de passá-los

## Instanciado Desenho

Agora Padrão, usos comuns estão desenhando muitas árvores, arbustos ou grama rapidamente.

## UNSIGNED_INT índices

Ser capaz de usar entradas de 32 bits para índices remove o limite de tamanho da geometria indexada

## Configuração `gl_FragDepth`

Permitindo que você escreva seus próprios valores personalizados para o buffer de profundidade / z-buffer.

## Equação de mistura MIN / MAX

Podendo levar o mínimo ou máximo de 2 cores ao misturar

## Multiplos desenhos Buffers

Ser capaz de desenhar vários buffers de uma só vez a partir de um shader. Isso é comumente usado
para várias técnicas de renderização diferida.

## Acesso à textura em sombreadores de vértices

Na WebGL1, essa era uma característica opcional. Houve uma contagem de quantas texturas
você poderia acessar em um vertex shader e essa contagem permitia ser 0. Mais
os dispositivos os apoiaram. Na WebGL2, a contagem é necessária para ser pelo menos 16.

## Multi-amostras de renderbuffers

Na WebGL1, a tela em si poderia ser anti-aliased com o GPU incorporamdo
sistema multi-amostras, mas não houve suporte para mutli-amostragem controlada pelo usuário. No WebGL2
agora você pode fazer várias multi-amostras de renderbuffers.

## Consultas de oclusão

As consultas de oclusão permitem que você pergunte a GPU para verificar se deve renderizar algo
que qualquer pixel realmente seria desenhado.

## Texturas de ponto flutuante sempre disponíveis

As texturas de ponto flutuante são usadas para muitos efeitos especiais
e cálculos. Na WebGL1 eles eram opcionais. Na WebGL2
eles apenas existem.

Nota: Infelizmente eles ainda estão restritos naquela filtragem e a renderização,
para texturas de pontos flutuantes ainda é opcional. Veja
[`OES_texture_float_linear`](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/)
 e [`EXT_color_buffer_float`](https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/).


