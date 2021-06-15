Title: WebGL2 텍스처에 렌더링하기
Description: 텍스처에 렌더링하는 방법
TOC: 텍스처에 렌더링하기


이 글은 WebGL2 시리즈에서 이어지는 글입니다.
가장 첫 글은 [WebGL2 기초](webgl-fundamentals.html) 이고 바로 이전 글은 
[텍스처에 데이터를 전달하는 법](webgl-data-textures.html)에 관한 글입니다.
이 글들을 아직 읽지 않으셨다면 먼저 읽고 오세요.

지난번 글에서는 자바스크립트에서 텍스처로 데이터를 전달하는 방법을 알아보았습니다.
이 글에서는 WebGL2를 사용해 텍스처에 렌더링 하는 방법을 알아볼겁니다.
참고로 이 주제는 [이미지 처리](webgl-image-processing-continued.html)에서 이미 
간략하게 다루긴 했습니다만 여기서는 좀 더 자세히 알아볼겁니다.

텍스처에 렌더링하는것은 꽤 간단합니다. 우선 특정한 크기의 텍스처를 만듭니다.

    // create to render to
    const targetTextureWidth = 256;
    const targetTextureHeight = 256;
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    {
      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

`data`가 `null`인 것에 주목하세요. 우리는 데이터를 전달할 필요가 없습니다.
여기서는 단지 WebGL이 텍스처를 할당하기만 하면 됩니다.

다음으로 프레임버퍼를 만듭니다. [프레임버퍼란 단지 어떤 데이터들의 집합입니다(collection of attachments)](webgl-framebuffers.html).
여기서 어떤 데이터란 텍스처 또는 렌더버퍼(renderbuffer)입니다.
텍스처에 대해서는 이미 알아보았고, 렌더버퍼란 텍스처와 아주 유사하지만 텍스처는 
지원하지 않은 몇몇 포맷과 옵션을 지원한다는 점이 다릅니다.
또한 텍스처와는 다르게 렌더버퍼는 셰이더의 입력으로 직접 사용할 수 없습니다.

이제 프레임버를 만들고 우리의 텍스처를 붙여줍시다.

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

텍스처나 버퍼와 동일하게, 프레임버퍼를 만들고 나서 `FRAMEBUFFER`라는 
바인드 포인트에 바인딩 해주어야 합니다. 이렇게 하고나면 프레임버퍼와 관련된 
다른 모는 함수는 바인드 포인트에 바인딩된 프레임버퍼를 참조하게 됩니다.

프레임버퍼가 바인딩되면, 우리가  `gl.clear`, `gl.drawArrays`, 
`gl.drawElements`를 호출할 때마다 WebGL은 캔버스 대신 우리의 텍스처에 렌더링을 수행하게 됩니다.

```
function drawCube(aspect) {
  // 우리의 프로그램(셰이더 쌍)을 사용할 것입니다.
  gl.useProgram(program);

  // 사용하고자 하는 attribute/buffer 셋을 바인딩합니다.
  gl.bindVertexArray(vao);

  // 투영 행렬을 계산합니다.
  -  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 0, 2];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // look at을 사용해 카메라 행렬을 계산합니다.
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // 카메라 행렬로부터 뷰 행렬을 만듭니다.
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
  matrix = m4.yRotate(matrix, modelYRotationRadians);

  // 행렬을 설정합니다.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // u_texture에는 0번 텍스처 유닛을 사용하도록 셰이더에 알려줍니다.
  gl.uniform1i(textureLocation, 0);

  // geometry를 그립니다.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6 * 6;
  gl.drawArrays(primitiveType, offset, count);
}
```

참고로 투영 행렬을 계산하기 위해 `aspect`를 전달해 주어야 하는데 
우리의 대상 텍스처가 카메라와는 종횡비가 다르기 때문입니다.

아래는 호출 방법입니다.

```
// 장면을 그립니다.
function drawScene(time) {

  ...

  {
    // 프레임버퍼를 바인딩하여 우리의 targetTexture에 그리도록 합니다.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // 3x2 텍스처를 사용하여 정육면체를 그립니다.
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 클립 공간에서 픽셀로 변환하는 법을 알려줍니다.
    gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

    // 캔버스와 깊이 버퍼를 지웁니다.
    gl.clearColor(0, 0, 1, 1);   // 파란색으로 지웁니다.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = targetTextureWidth / targetTextureHeight;
    drawCube(aspect)
  }

  {
    // 캔버스에 그리도록 합니다.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 방금 전에 렌더링한 텍스처를 적용해 정육면체를 그리도록 할 것입니다.
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    // 클립 공간에서 픽셀로 변환하는 법을 알려줍니다.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 캔버스와 깊이 버퍼를 지웁니다.
    gl.clearColor(1, 1, 1, 1);   // 흰 색으로 지웁니다.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    drawCube(aspect)
  }

  requestAnimationFrame(drawScene);
}
```

결과는 아래와 같습니다.

{{{example url="../webgl-render-to-texture.html" }}}

`gl.viewport`를 호출해서 여러분이 렌더링하려는 크기에 맞추어야 한다는 것을 **반드시 기억하세요**.
예제의 경우 먼저 텍스처에 렌더링을 하기 때문에 뷰포트를 텍스처의 크기로 설정했습니다.
두 번째로는 캔버스에 렌더링을 하기 때문에 뷰포트를 캔버스의 크기로 설정했습니다.

투영 행렬을 계산할 때도 유사한데, 우리가 렌더링하려는 대상의 종횡비에 맞는 값을 사용해야 합니다.
저도 결과가 이상하거나 렌더링이 되지 않는 경우에 대해 디버깅하느라 수많은 시간을 보낸 적이 있습니다. 
결국에는 `gl.viewport`를 호출하지 않거나 올바른 종횡비를 설정하지 않은것을 발견하곤 했습니다.
잊어버리기가 쉽기 때문에 저는 `gl.bindFramebuffer`를 직접 호출하지 않고, 아래와 같은 함수를 만들어서 호출합니다.

    function bindFramebufferAndSetViewport(fb, width, height) {
       gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
       gl.viewport(0, 0, width, height);
    }

그리고 렌더링 대상을 변경할 때는 이 함수만을 사용합니다. 그러면 잊어버리지 않을 겁니다.

주의하셔야 할 것중 하나는 우리의 프레임버퍼에는 깊이 버퍼(depth buffer)가 없다는 것입니다. 오직 텍스처만 갖고 있습니다.
즉 깊이 테스팅을 수행하지 않기 때문에 3D 가 제대로 동작하지 않는다는 것입니다.
정육면체 3개를 그린다면 결과는 아래와 같아집니다.

{{{example url="../webgl-render-to-texture-3-cubes-no-depth-buffer.html" }}}

가운데 정육면체를 보시면 세로로 놓여진 세 개의 정육면체가 하나는 뒤쪽에, 하나는 중간에, 하나는 앞쪽에 그려지는 것을 보실 수 있습니다.
하지만 우리는 세 개의 육면체를 모두 같은 깊이에 그렸습니다.
반면 캔버스에 보이는 세 개의 가로로 놓여진 육면체들은 서로 올바르게 교차하는 것을 보실 수 있습니다.
왜냐하면 캔버스에는 깊이 버퍼가 있지만, 우리가 사용한 프레임버퍼에는 깊이 버퍼가 없기 떄문입니다.

<img class="webgl_center" src="resources/cubes-without-depth-buffer.jpg" width="100%" height="100%" />

깊이 버퍼를 추가하기 위해서는 깊이 텍스처를 만들고 프레임버퍼에 붙여줘야 합니다.

```
// create a depth texture
const depthTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, depthTexture);

// make a depth buffer and the same size as the targetTexture
{
  // define size and format of level 0
  const level = 0;
  const internalFormat = gl.DEPTH_COMPONENT24;
  const border = 0;
  const format = gl.DEPTH_COMPONENT;
  const type = gl.UNSIGNED_INT;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // attach the depth texture to the framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);
}
```

그렇게 하면 결과는 이렇게 됩니다.

{{{example url="../webgl-render-to-texture-3-cubes-with-depth-buffer.html" }}}

이제 프레임버퍼에 깊이 버퍼가 추가되었기 때문에 안쪽의 육면체들도 올바르게 교차하는 것을 보실 수 있습니다.

<img class="webgl_center" src="resources/cubes-with-depth-buffer.jpg" width="100%" height="100%" />

WebGL은 특정 조합의 attachment들만 사용할 수 있다는 점에 주의하십시오.
[명세에 따르면](https://www.khronos.org/registry/webgl/specs/latest/1.0/#FBO_ATTACHMENTS) 동작이 보장되어 있는 attachment 조합은:

* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` 텍스처
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` 텍스처 + `DEPTH_ATTACHMENT` = `DEPTH_COMPONENT16` 렌더버퍼
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` 텍스처 + `DEPTH_STENCIL_ATTACHMENT` = `DEPTH_STENCIL` 렌더버퍼

다른 조합에 대해서는 사용자의 시스템/GPU/드라이버/브라우저가 해당 조합을 지원하는지를 확인하셔야만 합니다.
확인하려면 프레임버퍼를 만들고 attachment를 추가한 뒤에 아래 함수를 호출하세요.

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

status가 `FRAMEBUFFER_COMPLETE`면 attachment 조합이 사용 가능한 상태입니다.
그렇지 않으면 사용자에게 당신은 운이 없었다는 것을 알려주거나 다른 방식으로 처리하도록 구현해야 합니다.

아직 [WebGL을 단순화해서 더 적은 코드로 즐기기](webgl-less-code-more-fun.html)를 읽지 않으셨다면 한번 읽어 보세요.

<div class="webgl_bottombar">
<h3>캔버스는 사실 텍스처 입니다.</h3>
<p>
중요한 건 아니지만 브라우저는 위에 언급한 기술을 사용해 캔버스를 구현하고 있습니다.
뒤쪽에서 색상 텍스처(color texture), 깊이 버퍼, 프레임버퍼를 만들고 현재 프레임버퍼로 바인딩합니다.
여러분이 렌더링을 수행하면 그 텍스처로 그려지게 됩니다.
그리고 그 텍스처는 캔버스를 웹 페이지에 그리는 데 사용됩니다.
</p>
</div>


