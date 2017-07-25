Title: WebGL 이미지 처리 심화
Description: WebGL에 있는 여러 이미지 처리 기술을 적용하는 방법

이 글은 [WebGL 이미지 처리](webgl-image-processing.html)에서 이어집니다. 만약에 아직 보지 않았다면 [먼저 읽기](webgl-image-processing.html)를 권장합니다.

다음 이미지 처리를 위한 가장 분명한 질문은 여러 효과들을 어떻게 적용할 것 인가 입니다.

아마도 바로 쉐이더를 생성하는 것을 시도하는것 입니다. UI를 제공하여 사용자가 사용하고자 하는 효과를 선택하고 모든 효과를 내는 쉐이더를 생성할 수 있게 하는것 입니다. 이 기술은 종종 [실시간 그래픽을위한 효과 만들기] (http://www.youtube.com/watch?v=cQUn0Zeh-0Q)에도 사용되지만 항상 가능하지는 않습니다.

더 유연한 방법은 2개 이상의 *work* 텍스처를 사용하고 각 텍스처를 차례로 렌더링 하고 앞 뒤로 핑퐁(?)한다음 매번 다음 효과를 적용하는 것 입니다.

<blockquote><pre>원본 이미지 -&gt; [Blur]        -&gt; 텍스처 1
텍스처 1      -&gt; [Sharpen]     -&gt; 텍스처 2
텍스처 2      -&gt; [Edge Detect] -&gt; 텍스처 1
텍스처 1      -&gt; [Blur]        -&gt; 텍스처 2
텍스처 2      -&gt; [Normal]      -&gt; 캔버스</pre></blockquote>

이렇게 하려면 프레임 버퍼(Framebuffer)를 만들어야합니다. 사실 WebGL이나 OpenGL에서 프레임 버퍼는 좋은 이름이 아닙니다. WebGL/OpenGL 프레임 버퍼는 실제로 첨부 목록일뿐 실제로 다른 종류 버퍼가 아닙니다. 그러나 텍스처를 프레임 버퍼에 첨부하여 해당 텍스처로 랜더링할 수 있습니다.

우선 [오래된 텍스처 생성 코드](webgl-image-processing.html)를 함수로 바꿔봅시다.

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 텍스처를 설정하여 어떤 크기의 이미지를 렌더링 할 수 있으므로 픽셀들로 작업을 합니다.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // 텍스처를 생성하고 이미지를 넣습니다.
  var originalImageTexture = createAndSetupTexture(gl);

  // 텍스처에 이미지를 업로드 합니다.
  var mipLevel = 0;               // 가장 큰 mip
  var internalFormat = gl.RGBA;   // 텍스처에서 원하는 포맷
  var srcFormat = gl.RGBA;        // 제공되는 데이터 포맷
  var srcType = gl.UNSIGNED_BYTE  // 제공되는 데이터 타입
  gl.texImage2D(gl.TEXTURE_2D,
                mipLevel,
                internalFormat,
                srcFormat,
                srcType,
                image);
```

이제 함수를 사용하여 2개의 텍스처를 만들고 두개의 프레임 버퍼에 첨부해 봅시다.

```
  // 2개의 텍스처를 만들고 프레임버퍼에 첨부합니다.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // make the texture the same size as the image
    var mipLevel = 0;               // 가장 큰 mip
    var internalFormat = gl.RGBA;   // 텍스처에서 원하는 포맷
    var border = 0;                 // 0으로 설정해야함
    var srcFormat = gl.RGBA;        // 제공되는 데이터 포맷
    var srcType = gl.UNSIGNED_BYTE  // 제공되는 데이터 타입
    var data = null;                // null = 빈 텍스처 만들기
    gl.texImage2D(
        gl.TEXTURE_2D, mipLevel, internalFormat, image.width, image.height, border,
        srcFormat, srcType, data);

    // 프레임 버퍼 생성
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // 텍스처 첨부 하기
    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }
```

이제 커널 집합을 만든 다음 이를 적용할 목록을 만들어 보겠습니다.

```
  // 몇가지 컨밴션 커널들 정의
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

  // 적용할 효과 목록.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

그리고 마지막으로 하나씩 적용하고, 렌더링할 텍스처를 핑퐁(ping-ponging?)합니다.

```
  function drawEffects() {
    // 사용할 프로그램(쉐이더 쌍) 전달
    gl.useProgram(program);

    // 설정하기 원하는 attribute/buffer 바인드
    gl.bindVertexArray(vao);

    // 원본 이미지를 유닛 0에서 시작
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // 쉐이더에 텍스처 유닛 0에서 텍스처를 얻기 위해 전달
    gl.uniform1i(imageLocation, 0);

    // 텍스처를 그리는 동안 y축 뒤집기를 하지 않게 합니다.
    gl.uniform1f(flipYLocation, 1);

    // 적용하려는 각 효과를 반복합니다.
    var count = 0;
    for (var ii = 0; ii < tbody.rows.length; ++ii) {
      var checkbox = tbody.rows[ii].firstChild.firstChild;
      if (checkbox.checked) {
        // 프레임 버퍼 중 하나를 그리기 위한 설정을 합니다.
        setFramebuffer(framebuffers[count % 2], image.width, image.height);

        drawWithKernel(checkbox.value);

        // 다음 드로잉을 위해 방금 렌더링 한 텍스처를 사용합니다.
        gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

        // 다음번에 다른 텍스처를 사용할 수 있도록 카운트를 증가시킵니다.
        ++count;
      }
    }

    // 마지막으로 캔버스에 결과를 그립니다.
    gl.uniform1f(flipYLocation, -1);  // 캔버스를 뒤집을 필요가 있습니다.

    setFramebuffer(null, gl.canvas.width, gl.canvas.height);

    drawWithKernel("normal");
  }

  function setFramebuffer(fbo, width, height) {
    // 랜더링할 프레임버퍼를 만듭니다.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // 쉐이더에 프레임버퍼의 해상도를 전달합니다.
    gl.uniform2f(resolutionLocation, width, height);

    // WebGL에 클립 공간에서 픽셀로 변환하는 방법을 전달합니다.
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // 커널을 설정하고 가중치를 설정합니다.
    gl.uniform1fv(kernelLocation, kernels[name]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

    // 사각형 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

여기에 약간 더 유연한 UI 버전이 있습니다. 껏다 켜서 효과를 확인하거나 효과를 드래그하여 재 정렬하면 어떻게 되는지 확인하세요.

{{{example url="../webgl-2d-image-processing.html" }}}

여기에 몇 가지 봐야할게 있습니다.

`gl.bindFramebuffer`를 `null`로 호출하는 것은 WebGL에 프레임 버퍼중 하나에 프레임 버퍼 중 하나 대신에 캔버스에 렌더링 되길 원하는것을 의미합니다.

또한 프레임버퍼는 무엇을 첨부 하냐에 따라서 작동하지 않을 수 있습니다. 항상 작동 해야하는 첨부물의 타입과 조합 목록이 있습니다. 여기서 사용된 `RGBA`/`UNSIGNED_BYTE` 텍스처는 `COLOR_ATTACHMENT0` 첨부 포인터에 할당되어 항상 작동한다고 가정합니다.
더 실험적인 텍스처 포맷 및 첨부물 조합들은 작동하지 않을 수 있습니다. 이러한 경우 프레임 버퍼를 바인드 한 다음`gl.checkFramebufferStatus`를 호출하고`gl.FRAMEBUFFER_COMPLETE`를 리턴하는지 확인해야합니다. 작동이 한다면 그대로 사용하면 되고 만약 작동하지 않는다면 사용자에게 이를 알릴 필요가 있습니다. 다행히도 WebGL2는 다양한 포맷과 조합을 지원합니다.

WebGL은 (클립 공간)[webgl-fundamentals.html]에서 픽셀로 변환을 합니다. 이 작업은`gl.viewport` 설정을 기반으로합니다. 프레임 버퍼는 캔버스와 크기가 다르기 때문에 텍스처 또는 캔버스에 랜더링할 것인지에 따라
 뷰표트를 적절히 설정이 필요합니다.

Finally in the [original example](webgl-fundamentals.html) we flipped the Y
coordinate when rendering because WebGL displays the canvas with 0,0 being the
bottom left corner instead of the more traditional for 2D top left. That's not
needed when rendering to a framebuffer. Because the framebuffer is never
displayed, which part is top and bottom is irrelevant. All that matters is
that pixel 0,0 in the framebuffer corresponds to 0,0 in our calculations.
To deal with this I made it possible to set whether to flip or not by
adding one more uniform input into the shader call `u_flipY`.

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

And then we can set it when we render with

```
  ...
+  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

+  // don't flip
+  gl.uniform1f(flipYLocation, 1);

  ...

+  // flip
+  gl.uniform1f(flipYLocation, -1);
```

I kept this example simple by using a single GLSL program that can achieve
multiple effects. If you wanted to do full on image processing you'd probably
need many GLSL programs. A program for hue, saturation and luminance adjustment.
Another for brightness and contrast. One for inverting, another for adjusting
levels, etc. You'd need to change the code to switch GLSL programs and update
the parameters for that particular program. I'd considered writing that example
but it's an exercise best left to the reader because multiple GLSL programs each
with their own parameter needs probably means some major refactoring to keep it
all from becoming a big mess of spaghetti.

I hope this and the preceding examples have made WebGL seem a little more
approachable and I hope starting with 2D helps make WebGL a little easier to
understand. If I find the time I'll try to write [a few more articles](webgl-2d-translation.html)
about how to do 3D as well as more details on [what WebGL is really doing under the hood](webgl-how-it-works.html).
For a next step consider learning [how to use 2 or more textures](webgl-2-textures.html).
