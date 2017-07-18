Title: WebGL2 이미지 처리
Description: WebGL에서 이미지는 처리 방법

WebGL에서 이미지 처리는 쉽습니다. 얼마나 쉽냐고요? 아래를 읽어 보면 됩니다.

이 글은 [WebGL2 기초](webgl-fundamentals.html)에서 이어지는 글입니다.
만약에 아직 읽어 보지 않았다면 [먼저 읽어 보는 것](webgl-fundamentals.html)이 좋습니다.

WebGL에서 이미지를 그리려면 텍스처를 사용 해야 합니다. WebGL은 픽셀 대신 렌더링 할 때 클립 공간 좌표를 예상하는 것과 마찬가지로 일반적으로 텍스처를 읽을 때 텍스처 좌표를 예상합니다. 텍스쳐 좌표는 텍스처의 크기에 상관없이 0.0에서 1.0을 이동합니다.

<!-- 검수 필요 -->
WebGL2는 텍스처 좌표를 사용하여 텍스처를 읽을수 있는 기능이 추가합니다.
가장 좋은 방법은 사용하는 것에 달려 있습니다. 픽셀 좌표 보단 텍스처 좌표를 사용하는 것이 더 일반적이라고 생각 합니다.

오직 하나의 사각형(2개의 삼각형)을 그리기 때문에 WebGL에 직사각형의 각 점이 텍스처의 어느 위치에 해당하는지 알려주는게 필요합니다. 이 정보를 버텍스 쉐이더에서 프래그먼트 쉐이더로 'varying'이라 불리는 특별한 변수를 사용하여 전달합니다. 그것은 변하기 때문에 varying이라고 불립니다. WebGL은 프래그먼트 쉐이더를 사용하여 각 픽셀을 그릴때 버텍스 쉐이더에서 제공 한 [값을 보간합니다](webgl-how-it-works.html).

[이전 글의 끝에 있는 버텍스 쉐이더](webgl-fundamentals.html)를 사용하여 텍스처 좌표로 전달할 속성을 추가 한 다음 프래그먼트 쉐이더로 전달 해야합니다.

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // 프래그먼트 쉐이더로 texCoord 전달
    +   // GPU가 이 값들을 점 사이로 보간 할 것입니다.
    +   v_texCoord = a_texCoord;
    }

그런 다음 텍스처에서 색상을 찾기 위해 프래그먼트 쉐이더를 제공합니다.

    #version 300 es
    precision mediump float;

    // 사용할 텍스처
    uniform sampler2D u_image;

    // texCoords는 버텍스 쉐이더에서 전달된 것입니다.
    in vec2 v_texCoord;

    // 프래그먼트 쉐이더에서 출력을 선언해야합니다.
    out vec4 outColor;

    void main() {
       // 텍스처에서 색상을 찾습니다.
       outColor = texture(u_image, v_texCoord);
    }

검사버튼 삭제버튼 마지막으로 이미지를 로드하고 텍스처를 생성해고 이미지를 텍스처로 복사해야 합니다. 브라우저 이미지를 비동기적으로 로드하기 때문에 코드를 다시 정렬하여 텍스처가 로드 될떄까지 약간 기다려야 합니다. 일단 로드되면 그릴 것입니다.


    +function main() {
    +  var image = new Image();
    +  image.src = "http://someimage/on/our/server";  // 반드시 같은 도메인 이여야 합니다!!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // 버텍스 데이터가 가야할 위치를 찾습니다.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // uniforms 찾기
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // 직사각형 텍스처 좌표를 제공합니다.
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
    +  var size = 2;          // 반복될떄 2개의 구성요소 사용
    +  var type = gl.FLOAT;   // 데이터는 32비트 부동소수점
    +  var normalize = false; // 정규화 되지 않은 데이터
    +  var stride = 0;        // 0 = 반복할때마다 다음 위치를 얻기 위해 size * sizeof(type)식 앞으로 이동
    +  var offset = 0;        // 버퍼의 시작 지점
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // 활성화된 텍스처 단위를 단위 0으로 만듭니다.
    +  // 즉 다른 모든 텍스처 명령에 영향을 미침니다.
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // 텍스처 단위0 2D 바인딩 포인트에 바인드 합니다.
     <!-- Bind it to texture unit 0' 2D bind point -->
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // 매개 변수를 설정하여 밉맵스가 필요 없으므로 필터링 하지 않고 반복도 하지 않습니다.
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // 텍스처로 이미지 업로드
    +  var mipLevel = 0;               // 가장큰 민맵
    +  var internalFormat = gl.RGBA;   // 텍스처에서 원하는 포맷
    +  var srcFormat = gl.RGBA;        // 제공하는 데이터의 포맷
    +  var srcType = gl.UNSIGNED_BYTE  // 제공하는 데이터의 타입
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // 프로그램을 사용하라고 알려줍니다.(쉐이더 쌍)
      gl.useProgram(program);

      // 캔버스에 쉐이더에서 픽셀에서 클립공간으로 변환 할수 있게 해상도를 전달합니다.
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // 쉐이더에 텍스처 유닛 0에서 텍스처를 가져오라고 알려줍니다.
    +  gl.uniform1i(imageLocation, 0);

    +  // position 버퍼를 바인딩하여 setRectangle에서 호출 될
    +  // gl.bufferData가 position 버퍼에 데이터를 넣습니다.
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // 사각형의 크기를 이미지와 같은 크기로 설정합니다.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

여기에 WebGL로 렌더된 이미지가 있습니다.

{{{example url="../webgl-2d-image.html" }}}

너무 과하지 않게 이미지를 조작해봅시다. 빨간색이랑 파란색을 바꾸는 건 어떨까요?

    ...
    outColor = texture2D(u_image, v_texCoord).bgra;
    ...

이제 빨간색과 파란색을 바꿨습니다.

{{{example url="../webgl-2d-image-red2blue.html" }}}

만약에 실제로 다른 픽셀들에서 다른 모양을 가지는 이미치 처리를 한다면 어떻까요? WebGL은 0.0에서 1.0까지인 텍스처 좌표에서 텍스처들을 참조하므로 간단한 계산 <code>onePixel = 1.0 / textureSize</code>을 통해 1픽셀에 얼마큼 이동하는지를 계산할 수 있습니다.


Here's a fragment shader that averages the left and right pixels of
each pixel in the texture.

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// our texture
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
+  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
+
+  // average the left, middle, and right pixels.
+  outColor = (
+      texture(u_image, v_texCoord) +
+      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
+      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
```

Compare to the un-blurred image above.

{{{example url="../webgl-2d-image-blend.html" }}}

Now that we know how to reference other pixels let's use a convolution kernel
to do a bunch of common image processing. In this case we'll use a 3x3 kernel.
A convolution kernel is just a 3x3 matrix where each entry in the matrix represents
how much to multiply the 8 pixels around the pixel we are rendering. We then
divide the result by the weight of the kernel (the sum of all values in the kernel)
or 1.0, whichever is greater. [Here's a pretty good article on it](http://docs.gimp.org/en/plug-in-convmatrix.html).
And [here's another article showing some actual code if
you were to write this by hand in C++](http://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

In our case we're going to do that work in the shader so here's the new fragment shader.

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// our texture
uniform sampler2D u_image;

// the convolution kernal data
uniform float u_kernel[9];
uniform float u_kernelWeight;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
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

In JavaScript we need to supply a convolution kernel and its weight

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

    // set the kernel and it's weight
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

And voila... Use the drop down list to select different kernels.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

I hope this article has convinced you image processing in WebGL is pretty simple. Next up
I'll go over [how to apply more than one effect to the image](webgl-image-processing-continued.html).

<div class="webgl_bottombar">
<h3>What are texture units?</h3>
When you call <code>gl.draw???</code> your shader can reference textures. Textures are bound
to texture units. While the user's machine might support more all WebGL2 implementations are
required to support at least 16 texture units. Which texture unit each sampler uniform
references is set by looking up the location of that sampler uniform and then setting the
index of the texture unit you want it to reference.

For example:
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

To set textures on different units you call gl.activeTexture and then bind the texture you want on that unit. Example

<pre class="prettyprint showlinemods">
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

This works too

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>What's with the a_, u_, and v_ prefixes in from of variables in GLSL?</h3>
<p>
That's just a naming convention. They are not required but for me it makes it easier to see at a glance
where the values are coming from. a_ for attributes which is the data provided by buffers. u_ for uniforms
which are inputs to the shaders, v_ for varyings which are values passed from a vertex shader to a
fragment shader and interpolated (or varied) between the vertices for each pixel drawn.
See <a href="webgl-how-it-works.html">How it works</a> for more details.
</p>
</div>
