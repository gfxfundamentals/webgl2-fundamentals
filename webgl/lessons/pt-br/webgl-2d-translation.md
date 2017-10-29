Title: Translação 2D WebGL2
Description: Como transladar em 2d

Antes de passar para o 3D vamos ficar com 2D para um pouco mais.
Vem comigo, por favor. Este artigo pode parecer extremamente óbvio para
alguns, mas vou construir até um certo ponto em alguns artigos.

Este artigo é uma continuação de uma série que começa com os
[Fundamentos da WebGL2](webgl-fundamentals.html). Se você não os leu,
sugiro que você leia pelo menos o primeiro, então volte aqui.

A translação é um nome de matemática extravagante que basicamente significa "mover"
algo. Suponho que a mudança de uma frase do inglês para o japonês também
se ajuste, mas neste caso estamos falando sobre a geometria em movimento. Usando
o código de exemplo que fizemos [no primeiro post](webgl-fundamentals.html)
você poderia facilmente transladar nosso retângulo apenas mudando os valores
passados para `setRectangle` certo? Aqui está uma amostra baseada em nossa
[amostra anterior](webgl-fundamentals.html).

```
+  // Primeiro vamos fazer algumas variáveis
+  // para manter a translação, largura e altura do retângulo
+  var translation = [0, 0];
+  var width = 100;
+  var height = 30;
+  var color = [Math.random(), Math.random(), Math.random(), 1];
+
+  // Então vamos fazer uma função para
+  // recomeçar tudo. Podemos chamar essa
+  // função depois de atualizar a translação.

  // Desenhe uma cena.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Diga a WebGL como converter do clip space para pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Limpe a tela
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Diga para usar nosso programa (par de shaders)
    gl.useProgram(program);

    // Vincule o conjunto de atributos/buffers que queremos.
    gl.bindVertexArray(vao);

    // Passe na resolução da tela para que possamos converter de
    // pixels para clipspace no shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Atualize o buffer de posição com posições do retângulo
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
*    setRectangle(gl, translation[0], translation[1], width, height);

    // Defina a cor.
    gl.uniform4fv(colorLocation, color);

    // Desenhe o retângulo.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

No exemplo abaixo, anexei um par de controladores que atualizarão
`translation[0]` e `translation[1]` e chama `drawScene` sempre que mudarem.
Arraste os controladores para transladar o retângulo.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

Por enquanto, tudo bem. Mas agora imagine que queríamos fazer o mesmo com uma
forma mais complicada.

Digamos que queríamos desenhar um 'F' que consiste em 6 triângulos como este.

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

Bem, seguindo nosso código atual, teríamos que mudar o `setRectangle`
para algo mais parecido com isso.

```
// Preencha o atual buffer ARRAY_BUFFER com os valores que definem uma letra 'F'.
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // top rung
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // middle rung
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3]),
      gl.STATIC_DRAW);
}
```

Você pode ver que não vai se dimensionar bem. Se quisermos
desenhar uma geometria muito complexa com centenas ou milhares de linhas,
teríamos que escrever um código bastante complexo. Além disso, cada vez que
desenhamos, o JavaScript tem que atualizar todos os pontos.

Há uma maneira mais simples. Basta carregar a geometria e fazer a translação
no shader.

Aqui está o novo shader

```
#version 300 es

// um atributo é um input (in) para um vertex shader.
// Ele receberá dados de um buffer
in vec4 a_position;

// Usado para passar na resolução da tela
uniform vec2 u_resolution;

+// translação para adicionar à posição
+uniform vec2 u_translation;

// todos os shaders têm uma função principal
void main() {
+  // Adicionar na translação
+  vec2 position = a_position + u_translation;

  // converta a posição de pixels de 0,0 a 1,0
*  vec2 zeroToOne = position / u_resolution;

  // converter de 0-> 1 para 0-> 2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // converter de 0-> 2 para -1 -> + 1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
```

and we'll restructure the code a little. For one we only need to set
the geometry once.

```
// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90]),
      gl.STATIC_DRAW);
}
```

Then we just need to update `u_translation` before we draw with the
translation that we desire.

```
  ...

+  var translationLocation = gl.getUniformLocation(
+             program, "u_translation");

  ...

+  // Set Geometry.
+  setGeometry(gl);

  ...

  // Draw scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Set the color.
    gl.uniform4fv(colorLocation, color);

+    // Set the translation.
+    gl.uniform2fv(translationLocation, translation);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Notice `setGeometry` is called only once. It is no longer inside `drawScene`.

And here's that example. Again, drag the sliders to update the translation.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

Now when we draw, WebGL is doing practically everything. All we are doing is
setting a translation and asking it to draw. Even if our geometry had tens
of thousands of points the main code would stay the same.

If you want you can compare <a target="_blank" href="../webgl-2d-geometry-translate.html">
the version that uses the complex JavaScript
above to update all the points</a>.

I hope this example was not too obvious. In the [next article we'll move
on to rotation](webgl-2d-rotation.html).


