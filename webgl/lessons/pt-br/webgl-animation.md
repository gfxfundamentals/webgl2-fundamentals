Title: WebGL - Animção
Description: Como fazer animação na WebGL

Esta publicação é uma continuação de uma série de artigos sobre a WebGL.
O primeiro [começou com os fundamentos] (webgl-fundals.html).
e o anterior era sobre [câmeras 3D] (webgl-3d-camera.html).
Se você ainda não leu eles, veja-os primeiro.

Como animamos algo no WebGL?

Na verdade, isso não é algo específico para a WebGL, mas geralmente se você quiser
para animar algo em JavaScript, você precisa mudar algo
ao longo do tempo e desenhar novamente.

Podemos tirar um dos nossos exemplos anteriores e animá-la da seguinte forma.

    *var fieldOfViewRadians = degToRad(60);
    *var rotationSpeed = 1.2;

    *requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene() {
    *  // Every frame increase the rotation a little.
    *  rotation[1] += rotationSpeed / 60.0;

      ...
    *  // Call drawScene again next frame
    *  requestAnimationFrame(drawScene);
    }

E aqui está

{{{example url="../webgl-animation-not-frame-rate-independent.html" }}}

Porém, há um problema sutil. O código acima tem um
`rotationSpeed / 60.0`. Nós dividimos por 60.0 porque assumimos que o navegador
responderá a requestAnimationFrame 60 vezes por segundo, o que é bem comum.

No entanto, essa não é uma suposição válida. Talvez o usuário esteja com um dispositivo com
baixa potência, como um smartphone antigo. Ou talvez o usuário esteja executando algum programa pesado em
background. Há todos os tipos de razões pelas quais o navegador pode não estar exibindo
quadros a 60 frames por segundo. Talvez seja o ano 2020 e todas as máquinas funcionem a 240
frames por segundo, agora. Talvez o usuário seja um jogador e tenha um monitor CRT ativo em 90
quadros por segundos.

Você pode ver o problema neste exemplo

{{{diagram url="../webgl-animation-frame-rate-issues.html" }}}

No exemplo acima, queremos rodar todos os 'F's na mesma velocidade.
O 'F' no meio está em alta velocidade e é independente da taxa de quadros. O que está
à esquerda e à direita simulam se o navegador só estava em 1/8 da
velocidade máxima da máquina atual. O da esquerda **NÃO** é independete da taxa de quadros.
O direito **É** independente da taxa de quadros.

Observe que, devido o do lado esquerdo não levar em consideração que a taxa de quadros
pode ser lenta, ele não está se mantendo. Aquele no lado direito, no entanto, embora seja
executado a 1/8 da taxa de quadros, ele faz com que o do meio seja executado em
velocidade máxima.

A maneira de tornar a taxa de quadros de animação independente é calcular o tempo que demorou
entre quadros e usar isso para calcular o quanto esse quadro deve ser animado.

Em primeiro lugar, precisamos ter o tempo. Felizmente, `requestAnimationFrame` passa à
nós a hora desde que a página foi carregada.

Acho mais fácil se nós obtermos o tempo em segundos, mas já que o `requestAnimationFrame`
nos passa o tempo em milissegundos, precisamos multiplicar por 0.001
para obter os segundos.

Então, podemos então calcular o tempo do delta da seguinte maneira

    *var then = 0;

    requestAnimationFrame(drawScene);

    // Draw the scene.
    *function drawScene(now) {
    *  // Convert the time to seconds
    *  now *= 0.001;
    *  // Subtract the previous time from the current time
    *  var deltaTime = now - then;
    *  // Remember the current time for the next frame.
    *  then = now;

       ...

Uma vez que obtermos o `deltaTime` em segundos, todos os nossos cálculos podem ser em como
em muitas unidades por segundo quando queremos que algo aconteça. Nesse caso
`rotationSpeed` é 1.2, o que significa que queremos girar 1,2 graus radianos por segundo.
Isso é cerca de 1/5 de volta ou, em outras palavras, levará cerca de 5 segundos para
virar completamente, independentemente da taxa de quadros.

    *    rotation[1] += rotationSpeed * deltaTime;

Aqui está aquele funcionando.

{{{example url="../webgl-animation.html" }}}

Não é provável que você veja uma diferença daquele que está
no topo desta página, a menos que você esteja em uma máquina lenta, mas se você não estiver,
fazer sua taxa de quadros de animação seja independente, fará com que você, provavelmente, tenha alguns usuários
que estejam tendo uma experiência muito diferente daquela que você planejou.

Em seguinda, [como aplicar texturas](webgl-3d-textures.html).

<div class="webgl_bottombar">
<h3>Não use setInterval ou setTimeout!</h3>
<p>Se você já programou animação em JavaScript anteriormente,
você pode ter usado <code>setInterval</code> ou <code>setTimeout</code> para chamar a sua
função que irá realizar o desenho.
</p><p>
Os problemas com o uso de <code>setInterval</code> ou <code>setTimeout</code> para fazer animação
são duas. Primeiro, os dois <code>setInterval</code> e <code>setTimeout</code> não têm nenhuma relação
com o navegador para exibir qualquer coisa. Eles não são sincronizados quando o navegador
vai desenhar um novo frame e, portanto, pode estar sem sincronia com a máquina do usuário.
Se você usar <code>setInterval</code> ou <code>setTimeout</code> e assumir 60 quadros
por segundo e a máquina do usuário está realmente executando alguma outra taxa de quadros, você irá
estar fora de sincronia com a máquina deles.
</p><p>
O outro problema é que o navegador não tem ideia de por que você está usando <code>setInterval</code> ou
<code>setTimeout</code>. Por exemplo, mesmo quando sua página não está visível,
como quando a aba não está ativa, o navegador ainda precisa executar seu código.
Talvez você esteja usando <code>setTimeout</code> ou <code>setInterval</code> para verificar
se há novas mensagens ou tweets. Não há nenhuma maneira do navegador saber. Tudo bem se
você está apenas verificando a cada poucos segundos por novas mensagens, mas não é nada bom se
você está tentando desenhar 1000 objetos na WebGL. Você estará, efetivamente, DOSando a
máquina do usuário com desenhos invisíveis na ava que eles nem sequer conseguem ver.
</p><p>
<code>requestAnimationFrame</code> resolve esses dois problemas. Ela o chama
no momento certo para sincronizar a sua animação com a tela e também só chama se a
sua aba estiver visível.
</p>
</div>



