Title: WebGL Texto - HTML
Description: Como usar o HTML para exibir o texto que está posicionado para corresponder a WebGL

Este artigo é uma continuação de artigos anteriores da WebGL.
Se você não os leu, sugiro [que comece por lá](webgl-3d-perspective.html)
e então, volte para este artigo.

Uma pergunta comum é "como eu desenho texto na WebGL". A primeira coisa a se perguntar é,
qual é o seu propósito ao desenhar o texto. Você está em um navegador, o navegador
exibe texto. Portanto, sua primeira resposta deve ser usar HTML para exibir texto.

Vamos primeiro fazer o exemplo mais fácil: você só quer desenhar algum texto sobre
sua WebGL. Podemos chamar isso de uma sobreposição de texto. Basicamente, este é um texto que permanece
na mesma posição.

A maneira simples é fazer um elemento HTML ou elementos e usar o CSS para que eles se sobreponham.

Por exemplo: primeiro, crie um container e coloque uma tela e algum HTML para ser
sobreposto dentro do container.

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <div id="overlay">
        <div>Time: <span id="time"></span></div>
        <div>Angle: <span id="angle"></span></div>
      </div>
    </div>

Em seguida, configure o CSS para que a tela e o HTML se sobrepõem

    .container {
        position: relative;
    }
    #overlay {
        position: absolute;
        left: 10px;
        top: 10px;
    }

Agora, procure esses elementos no tempo de inicialização e crie ou procure as áreas que deseja
realizar a mudança.

    // look up the elements we want to affect
    var timeElement = document.getElementById("time");
    var angleElement = document.getElementById("angle");

    // Create text nodes to save some time for the browser
    // and avoid allocations.
    var timeNode = document.createTextNode("");
    var angleNode = document.createTextNode("");

    // Add those text nodes where they need to go
    timeElement.appendChild(timeNode);
    angleElement.appendChild(angleNode);

Finalmente atualize os nós ao renderizar

    function drawScene(time) {
        var now = time * 0.001;  // convert to seconds

        ...

        // convert rotation from radians to degrees
        var angle = radToDeg(rotation[1]);

        // only report 0 - 360
        angle = angle % 360;

        // set the nodes
        angleNode.nodeValue = angle.toFixed(0);  // no decimal place
        timeNode.nodeValue = now.toFixed(2);   // 2 decimal places

E aqui está esse exemplo

{{{example url="../webgl-text-html-overlay.html" }}}

Observe como eu coloco espaços dentro dos divs especificamente para as partes que eu queria mudar. Estou fazendo o
pressuposto aqui que é mais rápido do que apenas usar os divs sem extensões e fazer algo como

    timeNode.nodeValue = "Time " + clock.toFixed(2);

Também estou usando text nodes chamando `node = document.createTextNode()` e depois `node.nodeValue = someMsg`.
Eu também poderia usar `someElement.innerHTML = someHTML`. Isso seria mais flexível porque você poderia
inserir string HTML arbitrárias, embora possa ser um pouco mais lento, já que o navegador precisa criar
e destruir os nós cada vez que você os configura. Bom, você decide o que é melhor.

O ponto importante para sair da técnica de sobreposição é que a WebGL é executada em um navegador. Lembrar de
usar os recursos do navegador quando apropriado. Muitos programadores OpenGL costumam ter que renderizar
cada parte de suas aplicações 100% do zero, mas já que a WebGL é executada em um navegador, ela já
tem toneladas de recursos. Use-os. Isso tem muitos benefícios. Por exemplo, você pode usar estilos CSS para
facilmente dá a essa sobreposição um estilo interessante.

Por exemplo, este é o mesmo exemplo, mas adicionado de algum estilo. O fundo é arredondado, as letras têm
um brilho ao redor delas. Há uma borda vermelha. Você obtém tudo isso, essencialmente de graça, usando o HTML.

{{{example url="../webgl-text-html-overlay-styled.html" }}}

A próxima coisa mais comum a querer fazer é posicionar algum texto em relação a algo que você está renderizando.
Nós também podemos fazer isso em HTML.

Neste caso, voltaremos a criar um container com o canvas e outro container para o nosso HTML em movimento

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <div id="divcontainer"></div>
    </div>

E vamos configurar o CSS

    .container {
        position: relative;
        overflow: none;
    }

    #divcontainer {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 400px;
        height: 300px;
        z-index: 10;
        overflow: hidden;

    }

    .floating-div {
        position: absolute;
    }

A parte `position: absolute;` faz com que o `#divcontainer` seja posicionado em termos absolutos, relativo
ao primeiro nó pai com outro estilo `position: relative` ou `position: absolute`. Nesse caso
esse é o recipiente que tanto o canvas como o `#divcontainer` estão dentro.

O `left: 0px; topo: 0px` faz com que o `#divcontainer` se alinhe com tudo. O `z-index: 10` o faz
flutuae sobre o canvas. E o `overflow: hidden` faz com que seus filhos sejam cortados.

Finalmente, `.floating-div` será usado para a div posicionável que criamos.

Então, agora precisamos procurar o divcontainer, criar um div e anexá-lo.

    // look up the divcontainer
    var divContainerElement = document.getElementById("divcontainer");

    // make the div
    var div = document.createElement("div");

    // assign it a CSS class
    div.className = "floating-div";

    // make a text node for its content
    var textNode = document.createTextNode("");
    div.appendChild(textNode);

    // add it to the divcontainer
    divContainerElement.appendChild(div);


Agora podemos posicionar a div através da configuração do seu estilo.

    div.style.left = Math.floor(x) + "px";
    div.style.top  = Math.floor(y) + "px";
    textNode.nodeValue = now.toFixed(2);

Aqui está um exemplo em que nos limitamos ao div.

{{{example url="../webgl-text-html-bouncing-div.html" }}}

Então, o próximo passo que queremos é, colocá-lo em relação a algo na cena 3D.
Como fazemos isso? Nós fazemos exatamente como pedimos ao GPU para fazê-lo quando nós falavamos sobre
[projeção em perspectiva 3D](webgl-3d-perspective.html).

Com esse exemplo aprendemos a usar matrizes, como multiplicá-las,
e como aplicar uma matriz de projeção para convertê-los em um clipspace. Passamos tudo
para o nosso shader e ele multiplica vértices no espaço local e os converte
para clipspace. Nós também podemos fazer todas os cálculos em JavaScript.
Então, podemos multiplicar o clipspace (-1 a +1) em pixels e então, usar
para posicionar a div.

    gl.drawArrays(...);

    // We just got through computing a matrix to draw our
    // F in 3D.

    // choose a point in the local space of the 'F'.
    //             X  Y  Z  W
    var point = [100, 0, 0, 1];  // this is the front top right corner

    // compute a clipspace position
    // using the matrix we computed for the F
    var clipspace = m4.transformVector(matrix, point);

    // divide X and Y by W just like the GPU does.
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];

    // convert from clipspace to pixels
    var pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
    var pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

    // position the div
    div.style.left = Math.floor(pixelX) + "px";
    div.style.top  = Math.floor(pixelY) + "px";
    textNode.nodeValue = now.toFixed(2);

E voila, o canto superior esquerdo da nossa div está perfeitamente alinhado
com o canto superior direito do F.

{{{example url="../webgl-text-html-div.html" }}}

Claro, se você quiser mais texto, faça mais divs.

{{{example url="../webgl-text-html-divs.html" }}}

Você pode ver a fonte desse último exemplo para ver os
detalhes. Um ponto importante é que estou apenas adivinhando que
criando, adicionando e removendo elementos HTML do DOM
é lento, então o exemplo acima os cria e os mantém
por aí. Ele esconde os inutilizados em vez de removê-los
do DOM. Você teria que analisar com mais detalhes para saber se isso é mais rápido.
Esse foi apenas o método que eu escolhi.

Esperemos que esteja claro como usar o HTML para inserir texto. [Em seguida, vamos
aprender sobre o uso do Canvas 2D para texto](webgl-text-canvas2d.html).



