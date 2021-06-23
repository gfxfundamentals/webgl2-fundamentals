Title: WebGL2 이미지 처리
Description: WebGL에서의 이미지 처리 방법
TOC: 이미지 처리


WebGL에서 이미지 처리는 쉽습니다. 얼마나 쉽냐고요? 아래를 읽어 보면 됩니다.

이 글은 [WebGL2 기초](webgl-fundamentals.html)에서 이어지는 글입니다.
만약에 아직 읽어 보지 않았다면 [먼저 읽어 보는 것](webgl-fundamentals.html)이 좋습니다.

WebGL에서 이미지를 그리려면 텍스처를 사용 해야 합니다. 렌더링 할 때 픽셀 좌표 대신 클립 공간 좌표를 예상하는 것과 마찬가지로 일반적으로 텍스처를 읽을 때 텍스처 좌표를 예상합니다. 텍스쳐 좌표는 텍스처의 크기에 상관없이 0.0에서 1.0의 크기를 가집니다.

WebGL2에서는 픽셀 좌표를 사용하여 텍스처를 읽을수 있는 기능이 추가 되었습니다.
어떤 방법이 더 좋은지는 사람마다 다릅니다. 하지만 픽셀 좌표 보단 텍스처 좌표를 사용하는 것이 더 일반적이라고 생각 합니다.

지금은 하나의 사각형(2개의 삼각형)을 그리기 때문에 WebGL에 직사각형의 각 점이 텍스처의 어느 위치에 해당하는지 알려주어야 합니다. 이 정보를 정점 셰이더에서 프래그먼트 셰이더로 'varying'이라 불리는 특별한 변수를 사용하여 전달합니다. varying은 값이 변하기 때문에 varying이라고 불립니다. 프래그먼트 셰이더를 사용하여 각 픽셀을 그릴때 마다 WebGL은 정점 셰이더에서 제공 한 [값을 보간합니다](webgl-how-it-works.html).

[이전 글의 마지막 부분에서 작성한 정점 셰이더](webgl-fundamentals.html)에서부터, 텍스처 좌표로 전달할 attribute를 추가 한 다음 이를 프래그먼트 셰이더로 전달 해야합니다.

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // 프래그먼트 셰이더로 texCoord 전달
    +   // GPU가 이 값들을 점 사이에서 보간 할 것입니다.
    +   v_texCoord = a_texCoord;
    }

그런 다음 텍스처에서 색상을 찾기 위한 프래그먼트 셰이더를 작성합니다.

    #version 300 es
    precision highp float;

    // 사용할 텍스처
    uniform sampler2D u_image;

    // texCoord는 정점 셰이더에서 전달된 것입니다.
    in vec2 v_texCoord;

    // 프래그먼트 셰이더는 출력값을 선언해야합니다.
    out vec4 outColor;

    void main() {
       // 텍스처에서 색상을 찾습니다.
       outColor = texture(u_image, v_texCoord);
    }

마지막으로 이미지를 로드하고 텍스처를 생성한 뒤, 이미지를 텍스처로 복사해야 합니다. 우리는 브라우저를 사용하고 있기 때문에 이미지가 비동기적으로 로딩되고, 이를 위해 텍스처가 로드 될 때까지를 기다리도록 코드를 약간 변경해야 합니다. 일단 로드가 완료되면 그 이후에 그릴 것입니다.


    +function main() {
    +  var image = new Image();
    +  image.src = "https://someimage/on/our/server";  // 반드시 같은 도메인 이어야 합니다!!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // 정점 데이터가 가야할 location을 찾습니다.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // uniform 찾기
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // 직사각형의 텍스처 좌표를 제공합니다.
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
    +  var size = 2;          // iteration마다 2개의 구성요소 사용
    +  var type = gl.FLOAT;   // 데이터는 32비트 부동소수점
    +  var normalize = false; // 데이터를 정규화하지 않음
    +  var stride = 0;        // 0 = 반복할때마다 다음 위치를 얻기 위해 size * sizeof(type)씩 앞으로 이동
    +  var offset = 0;        // 버퍼의 맨 앞부터 시작
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // 텍스처를 생성합니다.
    +  var texture = gl.createTexture();
    +
    +  // 텍스처 유닛 0을 활성화합니다.
    +  // (이후 호출하는 텍스처 명령들이 영향을 주게 될 텍스처 유닛)
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // 텍스처 유닛 0에 텍스처를 바인딩합니다.
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // 매개 변수를 설정하여 우리는 밉맵이 필요 없으며 
    +  // 필터링 하지 않을 것이고 텍스처 반복(repeat)도 필요 없다고 알립니다.
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // 텍스처로 이미지를 업로드
    +  var mipLevel = 0;               // 가장큰 밉맵
    +  var internalFormat = gl.RGBA;   // 텍스처로 사용하길 원하는 포맷
    +  var srcFormat = gl.RGBA;        // 우리가 제공하는 데이터의 포맷
    +  var srcType = gl.UNSIGNED_BYTE  // 우리가 제공하는 데이터의 타입
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // 프로그램(셰이더 쌍)을 사용하도록 합니다.
      gl.useProgram(program);

      // 셰이더에서 픽셀에서 클립공간으로 변환 할수 있도록
      // 캔버스 해상도를 전달합니다.
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // 셰이더에 텍스처 유닛 0에서 텍스처를 가져오라고 알려줍니다.
    +  gl.uniform1i(imageLocation, 0);

    +  // position 버퍼를 바인딩하여 setRectangle에서 호출 될
    +  // gl.bufferData가 position 버퍼에 데이터를 넣습니다.
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // 사각형의 크기를 이미지와 같은 크기로 설정합니다.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

여기에 WebGL로 렌더링한 이미지가 있습니다.

{{{example url="../webgl-2d-image.html" }}}

아직 그렇게 신기하지는 않으니까 한번 이미지를 조작해봅시다. 빨간색이랑 파란색을 바꾸는 건 어떨까요?

    ...
    outColor = texture(u_image, v_texCoord).bgra;
    ...

이제 빨간색과 파란색이 바뀌었습니다.

{{{example url="../webgl-2d-image-red2blue.html" }}}

다른 픽셀들의 값을 사용하는 이미치 처리를 하고 싶다면 어떻게 해야 할까요?
WebGL은 0.0에서 1.0까지인 텍스처 좌표에서 텍스처들을 참조하므로 1픽셀 거리가 텍스처 좌표로 얼만큼인지를 <code>onePixel = 1.0 / textureSize</code>를 사용해 계산할 수 있습니다.

아래는 각 픽셀의 왼쪽, 오른쪽 픽셀값을 사용해 평균을 내는 프래그먼트 셰이더 입니다.

```
#version 300 es

// 프래그먼트 셰이더는 정밀도 기본값이 없으므로 우리가 선택해야 합니다.
// highp가 대개 괜찮습니다. "높은 정밀도"를 의미합니다.
precision highp float;

// 텍스처
uniform sampler2D u_image;

// texCoord는 정점 셰이더에서 전달됩니다.
in vec2 v_texCoord;

// 프래그먼트 셰이더는 출력을 선언 해야합니다.
out vec4 outColor;

void main() {
+  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
+
+  // 왼쪽, 중간, 오른쪽 픽셀의 평균을 계산합니다.
+  outColor = (
+      texture(u_image, v_texCoord) +
+      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
+      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
```

블러(blur)시키지 않은 위 예제와 비교해 보세요.

{{{example url="../webgl-2d-image-blend.html" }}}

이제 다른 픽셀을 참조하는 방법을 알았으니 컨볼루션 커널(convolution kernel)을 사용하여 몇 가지 일반적인 이미지 처리를 해보겠습니다. 
여기에서는 3x3 커널을 사용할 것입니다. 
컨볼루션 커널은 단순히 3x3 행렬이며 여기서 행렬의 각 요소는 렌더링할 픽셀 주위에 있는 8개의 픽셀에 어떤 값을 곱할 것인지를 나타냅니다. 
그 다음 그 결과를 커널 가중치(커널의 모든 값들의 합) 또는 1.0 중 큰 값으로 나눕니다. [여기 꽤 좋은 읽을거리가 있습니다](https://docs.gimp.org/2.6/en/plug-in-convmatrix.html). 그리고 [C++로 직접 작성하려면 어떻게 해야하는지를 실제 코드를 통해 보여주는 다른 읽을거리가 있습니다](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

우리의 경우 셰이더에서 이 작업을 수행할 것이므로 아래와 같이 새로운 프래그먼트 셰이더를 작성합니다.

```
#version 300 es

// 프래그먼트 셰이더는 정밀도 기본값이 없으므로 우리가 선택해야 합니다.
// highp가 대개 괜찮습니다. "높은 정밀도"를 의미합니다.
precision highp float;

// 텍스처
uniform sampler2D u_image;

// 컨볼루션 커널 데이터
uniform float u_kernel[9];
uniform float u_kernelWeight;

// texCoord는 정점 셰이더에서 전달됩니다.
in vec2 v_texCoord;

// 프래그먼트 셰이더는 출력을 선언 해야합니다.
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

자바스크립트에서 컨볼루션 커널과 커널의 가중치를 제공해야 합니다.

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

     // 커널과 커널의 가중치를 설정합니다.
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

그리고 짠... 드랍 다운 리스트를 사용해서 다른 커널을 선택해 보세요.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

이 글을 통해 WebGL에서의 이미지 처리가 매우 간단하다는 것을 이해하셨길 바랍니다. 다음으로 [이미지에 두가지 이상의 효과를 적용하는 방법](webgl-image-processing-continued.html)을 살펴 보겠습니다.

<div class="webgl_bottombar">
<h3>텍스쳐 유닛(texture unit)이란 무엇 입니까?</h3>
<code>gl.draw???</code>를 호출할때 셰이더는 텍스처를 참조 할 수 있습니다. 텍스처들은 텍스처 유닛에 바인딩됩니다. 사용자의 디바이스에 따라 더 지원할 수도 있지만 기본적으로 WebGL2 스펙에서는 적어도 16개의 텍스처 유닛을 지원하도록 하고 있습니다. 각 샘플러 유닛이 참조하는 텍스쳐 유닛을 설정하기 위해서는 샘플러 uniform의 location을 찾고, 참조하길 원하는 텍스처 유닛의 인덱스를 설정하면 됩니다. 예를 들어:
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // 텍스쳐 유닛 6 사용
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

다른 텍스쳐들을 다른 유닛에 설정하기 위해 gl.activeTexture를 호출하고 원하는 유닛에 텍스처를 바인딩 하면 됩니다. 예를들어,

<pre class="prettyprint showlinemods">
// 텍스처를 텍스쳐 유닛 6에 바인딩 합니다.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

아래와 같이 해도 됩니다.

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // 텍스쳐 유닛 6 사용.
// 텍스처를 텍스쳐 유닛 6에 바인드 합니다.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>GLSL 변수에서 a_, u_, v_ 접두어는 무엇입니까?</h3>
<p>
이는 단지 네이밍 컨벤션입니다. 꼭 필요하지는 않지만 어디서 값이 오는지 한눈에 보기 쉽게 해줍니다. a_는 버퍼에서 제공된 데이터를 나타내는 attribute에서 따왔습니다. u_는 셰이더의 입력으로 제공되는 uniform에서 따왔습니다. v_는 정점 셰이더에서 프래그먼트 셰이더로 전달되고, 각 픽셀이 그려지기 전에 정점 사이에서 보간 (또는 변화)되는 값을 나타내는 varying에서 따왔습니다. 더 자세한 내용은 <a href="webgl-how-it-works.html">작동 원리</a>에서 확인하세요.
</p>
</div>
