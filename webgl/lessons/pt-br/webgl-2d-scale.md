Title: Escala 2D WebGL
Description: Como escalar em 2D

Esta publicação é uma continuação de uma série de postagens sobre a WebGL.
O primeiro artigo [abordou os fundamentos](webgl-fundamentals.html) e o
e o anterior foi [sobre rotação 2D](webgl-2d-rotation.html).

Escalas em 2D é tão [fácil quanto translação](webgl-2d-translation.html).

Nós multiplicamos a posição pela escala desejada. Aqui estão algumas alterações
do nosso [exemplo anterior](webgl-2d-rotation.html).

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // Escala a posição
+  vec2 scaledPosition = a_position * u_scale;

  // Rotaciona a posição
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Adiciona a translação.
  vec2 position = rotatedPosition + u_translation;
```

e adicionamos o JavaScript necessário para definir a escala quando desenhamos.

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];


   // Desenha a cena.
   function drawScene() {
     webglUtils.resizeCanvasToDisplaySize(gl.canvas);

	 // Fala para a WebGL como converter de clip space para pixels
     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	 // Limpa o canvas
     gl.clearColor(0, 0, 0, 0);
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     // Fala para usar o nosso program (nosso par de shaders)
     gl.useProgram(program);

     // Vincula o conjunto atributo/buffer que desejamos.
     gl.bindVertexArray(vao);

	 // Passa a resolução do canvas, assim podemos converter de
	 // pixels para clipspace no shader
     gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

     // Define a cor.
     gl.uniform4fv(colorLocation, color);

     // Define a translação.
     gl.uniform2fv(translationLocation, translation);

     // Define a rotação.
     gl.uniform2fv(rotationLocation, rotation);

+     // Define a escala.
+     gl.uniform2fv(scaleLocation, scale);

     // Desenha o retângulo.
     var primitiveType = gl.TRIANGLES;
     var offset = 0;
     var count = 18;
     gl.drawArrays(primitiveType, offset, count);
   }
```

E agora temos uma escala. Arraste os sliders para mudar os efeitos.

{{{example url="../webgl-2d-geometry-scale.html" }}}

Uma coisa a notar é que a escala por um valor negativo vira a nossa forma geométrica.

Outra coisa a notar é que a escala 0, 0, que para nosso F é o
canto superior esquerdo. Isso faz sentido porque estamos multiplicando as posições
pela nossa escala, assim, eles vão se afastar de 0, 0. Você pode provavelmente
imaginar maneiras de corrigir isso. Por exemplo, você pode adicionar outra translação
antes de realizar uma escala, uma translação *pre scale*. Outra solução seria
alterar os dados reais da posição F. Demonstraremos outra solução em breve.

Espero que essas últimas 3 postagens tenham sido úteis na compreensão de
[translação](webgl-2d-translation.html), [rotação](webgl-2d-rotation.html)
e escala. Em seguida, vamos abordar [a mágica que são as matrizes](webgl-2d-matrices.html)
que combina todos estes 3 artigos em uma forma muito mais simples e mil vezes mais útil.

<div class="webgl_bottombar">
<h3>Por que um 'F'?</h3>
<p>
A primeira vez que vi alguém usar um 'F' foi em uma textura.
O 'F' em si não é importante. O que importa é que
você pode indicar sua orientação a partir de qualquer direção. Se nós
usássemos um coração ❤ ou um triângulo △, por exemplo, nós não poderíamos
se o objeto foi invertido horizontalmente. Um círculo então, seria
muito pior. Um retângulo colorido possivelmente funcionaria com
cores diferentes em cada canto, mas você teria que lembrar
quem é cada canto. Já a orientação de F é reconhencida instantaneamente.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
Qualquer forma que você pudesse dizer qual a sua orientação funcionaria,
eu simplesmente usei o 'F' desde que fui apresentado pela primeira vez à ideia.
</p>
</div>




