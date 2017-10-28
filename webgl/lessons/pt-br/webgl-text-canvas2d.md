Title: Texto - Canvas 2D WebGL
Description: Como exibir um texto usando uma tela 2D que está em sincronia com a WebGL

Este artigo é uma continuação dos [artigos anteriores da WebGL sobre desenho de texto](webgl-text-html.html).
Se você não os leu, sugiro que você comece lá e depois volte para cá.

Em vez de usar elementos HTML para texto, também podemos usar outro canvas, mas com
um contexto 2D. Sem realizar profiling, é apenas um palpite imaginar que isso seria mais rápido
do que usar o DOM. Claro que também é menos flexível. Você não obtém todos os estilos
sofisticados do CSS. Mas, não há elementos HTML para criar e ficar informando.

Semelhante aos outros exemplos, criamos um container, mas desta vez
nós colocamos 2 canvas nele.

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <canvas id="text" width="400" height="300"></canvas>
    </div>

Em seguida, configure o CSS para que o canvas e o HTML para que eles possam se sobrepor

    .container {
        position: relative;
    }

    #text {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10;
    }

Agora procure o canvas de texto no tempo de inicialização e crie um contexto 2D.

    // procura o canvas de texto.
    var textCanvas = document.getElementById("text");

    // cria um contexto 2D
    var ctx = textCanvas.getContext("2d");

Ao desenhar, assim como na WebGL, precisamos limpar o canvas 2D em cada quadro.

    function drawScene() {
        ...

        // Limpa o canvas 2D
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

E então, simplesmenta chamamos `fillText` para desenhar o texto

        ctx.fillText(someMsg, pixelX, pixelY);

E aqui está o exemplo

{{{example url="../webgl-text-html-canvas2d.html" }}}

Por que o texto está menor? Porque esse é o tamanho padrão para o Canvas 2D.
Se você deseja outros tamanhos [verifique a Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text).

Outra razão para usar o Canvas 2D é que é fácil desenhar outras coisas. Por exemplo
vamos adicionar uma seta

    // desenha uma seta e um texto.

    // salva todas as configurações do canvas
    ctx.save();

    // translate the canvas origin so 0, 0 is at
    // the top front right corner of our F
    ctx.translate(pixelX, pixelY);

    // draw an arrow
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.stroke();

    // draw the text.
    ctx.fillText(someMessage, 20, 20);

    // restore the canvas to its old settings.
    ctx.restore();

E aqui estamos nós, tirando proveito da função de translação do Canvas 2D, portanto, não precisamos fazer nenhum
cálculo extra ao desenhar nossa seta. Nós apenas pretendemos desenhar na origem e a translação cuida de mover
essa origem para o canto do nosso F.

{{{example url="../webgl-text-html-canvas2d-arrows.html" }}}

Eu acho que este artigo comtempla o uso do Canvas 2D. [verifique a Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
para mais ideias e exemplos. [Em seguida, nós vamos renderizar um texto na WebGL](webgl-text-texture.html).

