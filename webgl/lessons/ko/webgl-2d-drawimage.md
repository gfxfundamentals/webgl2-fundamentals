Title: WebGL2 DrawImage 구현
Description: WebGL로 캔버스 2D의 drawImage 함수를 구현하는 방법
TOC: 2D - DrawImage

이 글은 [WebGL orthographic 3D](webgl-3d-orthographic.html)에서 이어지는 내용입니다.
만약 아직 해당 글을 읽지 않았다면 [여기부터](webgl-3d-orthographic.html) 시작하시길 추천합니다.
또한, 텍스쳐와 텍스쳐 좌표가 어떻게 동작하는지에 대해서 알고 싶으시면 [WebGL 3D textures](webgl-3d-textures.html)
를 읽어보시길 바랍니다.

대부분의 2D 게임 구현은 이미지를 그리기 위한 함수를 요구합니다. 물론 몇몇 2D 게임들은 선 같은 걸
이용해서 멋진 일을 해내곤 합니다. 하지만 오직 2D 이미지를 화면에 그리는 방법만 있다면 대부분의 2D
게임은 충분히 만들 수 있습니다.

캔버스 2D API 는 매우 이미지를 그리기 위한 매우 유연한 `drawImage` 함수를 가지고 있습니다. 이 함수는
세 가지 버전이 있습니다.

    ctx.drawImage(image, dstX, dstY);
    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

여태까지 배운 것들로 이 함수를 WebGL로 어떻게 구현할까요? 첫번째 접근 방식은 아마 이 사이트의
첫번째 글에서 했던 것 처럼 정점들을 생성하는 것이 될 겁니다. GPU로  정점 정보를 보내는 것은
일반적으로 느린 작업입니다(물론 이게 더 빠른 경우들도 있긴 합니다만).

이것이 WebGL을 사용하는 기본적인 방법입니다. 중요한 것은 셰이더를 작성하고 해당 세이더를 창의적
으로 활용해서 문제를 푸는 것이죠.

우선 첫번째 버전부터 시작해봅시다.

    ctx.drawImage(image, x, y);

이 함수는 이미지를 `x, y` 좌표에 원본 사이즈대로 그리는 것입니다.
비슷한 함수를 WebGL 버전으로 만들기 위해서 `x,y`, `x + width, y`, `x, y + height`, `x  + width, y + height` 좌표를
가진 정점을 업로드해서 각의 이미지를 각각의 업로드한 정점 위치에 그릴 수 있습니다.
사실 이게 우리가 [첫 번째  게시물에서 했던 작업이었죠](webgl-fundamentals.html).

좀 더 일반적인 방법은 단순히 단위 정점을 이용하는 것입니다. 1 유닛 크기의 단순한 사각형을 업로드한 뒤
[행렬 수학](webgl-2d-matrices.html)을 이용해 크기를 조절하고 위치를 이동해서 원하는 곳에 이미지를
표시하는 것이죠.

코드는 아래와 같습니다.

먼저 단순한 vertex shader가 필요합니다.

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = a_texcoord;
    }

그리고 간단한 fragment shader도 있어야겠죠.

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       outColor = texture(texture, v_texcoord);
    }

이제 함수를 봅시다.

    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
      gl.useProgram(program);

      // 사각형을 위한 속성을 설정합니다.
      gl.bindVertexArray(vao);

      var textureUnit = 0;
			// 쉐이더에게 우리가 사용할 텍스쳐가 0번 유닛에 있다고 알려줍니다.
      gl.uniform1i(textureLocation, textureUnit);

			// 텍스쳐를 0번 유닛에 할당합니다.
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

			// 픽셀 좌표를 클립 스페이스 좌표로 변환하는 행렬입니다.
      var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

			// 우리의 사각형을 dstX, dstY 로 이동합니다.
      matrix = m4.translate(matrix, dstX, dstY, 0);

			// 1 유닛 크기의 사각형을 texWidth, texHeight 유닛 크기로 조정합니다.
      matrix = m4.scale(matrix, texWidth, texHeight, 1);

			// 행렬을 넘겨줍니다.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

			// 사각형을 그립니다(2개의 삼각형, 6개의 정점)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

이미지들을 좀 텍스쳐로 로딩해봅시다.

    // 텍스쳐 정보를 생성합니다. { width: w, height: h, texture: tex }
		// 텍스쳐는 우선 1x1 픽셀 크기로 생성된 뒤
		// 이미지 로딩이 완료되면 업데이트됩니다.
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var textureInfo = {
        width: 1,   // 우리는 로딩이 완료될 때까지 실제 사이즈를 알 수가 없습니다.
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      });

      return textureInfo;
    }

    var textureInfos = [
      loadImageAndCreateTextureInfo('resources/star.jpg'),
      loadImageAndCreateTextureInfo('resources/leaves.jpg'),
      loadImageAndCreateTextureInfo('resources/keyboard.jpg'),
    ];

그럼 이제 랜덤한 곳에 이것들을 그려봅시다.

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var ii = 0; ii < numToDraw; ++ii) {
      var drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      };
      drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
      drawInfos.forEach(function(drawInfo) {
        drawInfo.x += drawInfo.dx * speed * deltaTime;
        drawInfo.y += drawInfo.dy * speed * deltaTime;
        if (drawInfo.x < 0) {
          drawInfo.dx = 1;
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1;
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1;
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1;
        }
      });
    }

    function draw() {
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);

			// WebGL에게 클립 스페이스를 픽셀로 어떻게 변환할 지 알려줍니다.
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // 캔버스를 지웁니다.
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      drawInfos.forEach(function(drawInfo) {
        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          drawInfo.x,
          drawInfo.y);
      });
    }

    var then = 0;
    function render(time) {
      var now = time * 0.001;
      var deltaTime = Math.min(0.1, now - then);
      then = now;

      update(deltaTime);
      draw();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

아래에서 동작하는 모습을 볼 수 있습니다.

{{{example url="../webgl-2d-drawimage-01.html" }}}

이제 원본 `drawImage` 함수의 두 번째 버전을 다뤄봅시다.

    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);

실제로 별로 다를 것도 없습니다. 그저 `dstWidth` 와 `dstHeight`를 
`texWidth`와 `texHeight` 대신 사용하면 됩니다.

    *function drawImage(tex, texWidth, texHeight, dstX, dstY, dstWidth, dstHeight) {
    +  if (dstWidth === undefined) {
    +    dstWidth = texWidth;
    +  }
    +
    +  if (dstHeight === undefined) {
    +    dstHeight = texHeight;
    +  }

      gl.useProgram(program);

      // Setup the attributes for the quad
      gl.bindVertexArray(vao);

      var textureUnit = 0;
      // the shader we're putting the texture on texture unit 0
      gl.uniform1i(textureLocation, textureUnit);

      // Bind the texture to texture unit 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // this matrix will convert from pixels to clip space
      var matrix = m4.orthographic(0, canvas.width, canvas.height, 0, -1, 1);

      // translate our quad to dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // scale our 1 unit quad
    *  // from 1 unit to dstWidth, dstHeight units
    *  matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // draw the quad (2 triangles, 6 vertices)
      var offset = 0;
      var count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);
    }

여러가지 크기를 사용하도록 코드를 수정했습니다.

{{{example url="../webgl-2d-drawimage-02.html" }}}

아주 간단합니다. 그럼 `drawImage`의 세 번째 버전은 어떨까요?

    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

텍스쳐의 특정한 부분을 선택하기 위해서는 텍스쳐 좌표를 능숙하게 다뤄야 합니다. 텍스쳐 좌표
의 동작 방식은 [이 게시물에서 설명하고 있습니다](webgl-3d-textures.html).
해당 게시물에서는 흔한 방식으로 텍스쳐 좌표를 손수 생성했습니다. 하지만 행렬 연산으로 현재 
위치를 조절한 것처럼 즉석에서 다른 행렬 연산을 사용해서 텍스쳐 좌표를 생성할 수도 있습니다. 

정점 셰이더에 텍스쳐 행렬을 추가하고 텍스쳐 좌표를 이 텍스쳐 행렬과 곱해줍시다.

    #version 300 es

    in vec4 a_position;
    in vec2 a_texcoord;

    uniform mat4 u_matrix;
    +uniform mat4 u_textureMatrix;

    out vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
    *   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

이제 텍스쳐 행렬의 위치를 찾아야 합니다.

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    +var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");

그리고 `drawImage` 내에서 우리가 원하는 텍스쳐의 특정 부분을 선택하도록 설정해야 합니다.
텍스쳐 좌표들도 우리가 이미 위치 좌표에 했던 것처럼 단위 크기 사각형인 편이 효과적입니다.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    srcX, srcY, srcWidth, srcHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstX === undefined) {
    +    dstX = srcX;
    +    srcX = 0;
    +  }
    +  if (dstY === undefined) {
    +    dstY = srcY;
    +    srcY = 0;
    +  }
    +  if (srcWidth === undefined) {
    +    srcWidth = texWidth;
    +  }
    +  if (srcHeight === undefined) {
    +    srcHeight = texHeight;
    +  }
      if (dstWidth === undefined) {
    *    dstWidth = srcWidth;
    +    srcWidth = texWidth;
      }
      if (dstHeight === undefined) {
    *    dstHeight = srcHeight;
    +    srcHeight = texHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      // this matrix will convert from pixels to clip space
      var matrix = m4.orthographic(
          0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

      // translate our quad to dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // scale our 1 unit quad
      // from 1 unit to dstWidth, dstHeight units
      matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

    +  // Because texture coordinates go from 0 to 1
    +  // and because our texture coordinates are already a unit quad
    +  // we can select an area of the texture by scaling the unit quad
    +  // down
    +  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    +  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
    +
    +  // Set the texture matrix.
    +  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

      // draw the quad (2 triangles, 6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

텍스쳐의 특정 부분들을 선택하도록 코드를 수정했습니다. 결과물은 아래와 같습니다.

{{{example url="../webgl-2d-drawimage-03.html" }}}

캔버스 2D API 와 달리 우리의 WebGL 버전은 캔버스 버전의 `drawImage`가 다루지 않는 각각의 경우
처리하고 있습니다.

예를 들어 우리는 원본이나 대상의 가로 세로 크기에 음수를 제공할 수 있습니다. `srcWidth`에 음수를
전달하면 `srcX`로부터 왼쪽의 픽셀들을 선택하게 됩니다. `dstWidth`가 음수인 경우 `dstX`의 왼쪽으로
그리게 됩니다.
캔버스 2D API 는 이런 경우에 에러가 발생(그나마 나은 경우)하거나, 정의되지 않은 동작(최악의 상황)을 하게 됩니다.

{{{example url="../webgl-2d-drawimage-04.html" }}}

또 다른 점이라면, 우리는 행렬을 사용하기 때문에 [행렬로 할 수 있는 것들](webgl-2d-matrices.html)을 뭐든 할 수 있다는 것입니다.

예를 들면 텍스쳐의 가운데를 중심으로 텍스쳐를 회전시킬 수 있습니다.

텍스쳐 행렬 코드를 이렇게 바꿔봅시다.

    *  // just like a 2d projection matrix except in texture space (0 to 1)
    *  // instead of clip space. This matrix puts us in pixel space.
    *  var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);
    *
    *  // We need to pick a place to rotate around
    *  // We'll move to the middle, rotate, then move back
    *  var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
    *  var texMatrix = m4.zRotate(texMatrix, srcRotation);
    *  var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);
    *
    *  // because were in pixel space
    *  // the scale and translation are now in pixels
    *  var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    *  var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

      // Set the texture matrix.
      gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

그럼 이렇게 됩니다.

{{{example url="../webgl-2d-drawimage-05.html" }}}

보시다시피 한 가지 문제가 있습니다. 회전 때문에 간혹 텍스쳐 경계 바깥쪽이 이상하게 그려지는데,
이건 `CLAMP_TO_EDGE`로 설정했기 때문에 텍스쳐의 모서리 부분이 반복되어서 그렇습니다.

이는 셰이더 내에서 0과 1 사이에 있지 않은 픽셀을 무시하는 것으로 해결이 가능합니다.
`discard`를 사용하면 픽셀을 표시하지 않고 즉각적으로 셰이더를 종료하게 됩니다.

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
    +   if (v_texcoord.x < 0.0 ||
    +       v_texcoord.y < 0.0 ||
    +       v_texcoord.x > 1.0 ||
    +       v_texcoord.y > 1.0) {
    +     discard;
    +   }
       outColor = texture(texture, v_texcoord);
    }

이제 테두리 바깥쪽은 사라집니다.

{{{example url="../webgl-2d-drawimage-06.html" }}}

혹은 좌표 범위 바깥쪽에 대해 특정한 단색을 그려주고 싶을 수도 있겠죠.

    #version 300 es
    precision highp float;

    in vec2 v_texcoord;

    uniform sampler2D texture;

    out vec4 outColor;

    void main() {
       if (v_texcoord.x < 0.0 ||
           v_texcoord.y < 0.0 ||
           v_texcoord.x > 1.0 ||
           v_texcoord.y > 1.0) {
    *     outColor = vec4(0, 0, 1, 1); // blue
    +     return;
       }
       outColor = texture(texture, v_texcoord);
    }

{{{example url="../webgl-2d-drawimage-07.html" }}}

뭐든지 가능합니다. 창의적으로 셰이더를 사용하기만 한다면요.

다음에는 [캔버스 2D의 행렬 스택을 구현해보겠습니다](webgl-2d-matrix-stack.html).

<div class="webgl_bottombar">
<h3>사소한 최적화</h3>
<p>
이 최적화를 딱히 추천하진 않습니다. 오히려 더 많은 기능을 창의적으로 사용하는 것이
WebGL을 창의적으로 사용하기 위한 것이라는 점을 강조하고 싶습니다.
</p>
<p>
혹시 눈치챘을지 모르지만 우리는 위치 좌표에 사용한 단위 사각형은 정확히 텍스쳐 좌표의 단위
사각형과 크기가 일치합니다. 따라서 우리는 위치좌표를 바로 텍스쳐 좌표로 사용할 수 있습니다.
</p>
<pre class="prettyprint showlinemods">
#version 300 es
in vec4 a_position;
-in vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
*   v_texcoord = (u_textureMatrix * a_position).xy;
}
</pre>
<p>
이제 텍스쳐 좌표를 설정하는 코드를 삭제해도 됩니다. 삭제하더라도 이전과 완전히 동일하게 동작할 것입니다.
</p>
{{{example url="../webgl-2d-drawimage-08.html" }}}
</div>


