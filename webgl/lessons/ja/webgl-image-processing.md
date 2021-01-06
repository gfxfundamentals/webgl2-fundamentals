Title: WebGL2における画像処理
Description: WebGL2で画像処理する方法
TOC: WebGL2における画像処理

WebGLでは画像処理が簡単です。どのくらい簡単かはこの記事を読んで下さい。

この記事は[WebGL2の基本](webgl-fundamentals.html)からの続きです。
もし読んでいない場合は[まずはWebGL2の基本を読んでみて下さい](webgl-fundamentals.html)。

WebGLで画像を描画する場合はテクスチャを使用します。
WebGLのレンダリング時にはピクセルの代わりにクリップ空間座標を使いましたが、テクスチャ読込時はテクスチャ座標を使用します。
テクスチャ座標はテクスチャサイズに関係なく、0.0 〜 1.0の値になります。

WebGL2ではピクセル座標を使用し、テクスチャ読込機能も追加されています。
どちらの方法が良いかはあなたが選んで下さい。
個人的には、ピクセル座標よりテクスチャ座標の方が一般的なような気がします。

長方形を1つだけ描画（正確には2つの三角形）する場合、長方形の各頂点がテクスチャのどの位置に対応しているかWebGLに伝える必要があります。
頂点シェーダーからフラグメントシェーダーにこの位置情報を渡すには、varingと呼ばれる特別な変数を使用します。
varyingは変化するという意味です。
頂点シェーダーから渡すvaringの値によって、フラグメントシェーダーで各ピクセル描画時に[頂点の間の色が補完されます](webgl-how-it-works.html)。

[前回の記事の最後にあった頂点シェーダー](webgl-fundamentals.html)を使い、テクスチャ座標を渡すための属性を追加します。
そして、属性をフラグメントシェーダーに渡します。

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // pass the texCoord to the fragment shader
    +   // The GPU will interpolate this value between points
    +   v_texCoord = a_texCoord;
    }

次にテクスチャの色を調べるためのフラグメントシェーダーを修正します。

    #version 300 es
    precision highp float;

    // our texture
    uniform sampler2D u_image;

    // the texCoords passed in from the vertex shader.
    in vec2 v_texCoord;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
       // Look up a color from the texture.
       outColor = texture(u_image, v_texCoord);
    }

2つのシェーダーが用意できたら、画像を読込してテクスチャを生成してテクスチャに画像をコピーします。
ブラウザでは画像は非同期で読込されるため、読込完了するまでコードを少しアレンジする必要があります。テクスチャの読込完了後に描画します。

    +function main() {
    +  var image = new Image();
    +  image.src = "https://someimage/on/our/server";  // MUST BE SAME DOMAIN!!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // look up where the vertex data needs to go.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // lookup uniforms
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // provide texture coordinates for the rectangle.
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
    +  var size = 2;          // 2 components per iteration
    +  var type = gl.FLOAT;   // the data is 32bit floats
    +  var normalize = false; // don't normalize the data
    +  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    +  var offset = 0;        // start at the beginning of the buffer
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // Create a texture.
    +  var texture = gl.createTexture();
    +
    +  // make unit 0 the active texture uint
    +  // (ie, the unit all other texture commands will affect
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // Bind it to texture unit 0' 2D bind point
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // Set the parameters so we don't need mips and so we're not filtering
    +  // and we don't repeat
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // Upload the image into the texture.
    +  var mipLevel = 0;               // the largest mip
    +  var internalFormat = gl.RGBA;   // format we want in the texture
    +  var srcFormat = gl.RGBA;        // format of data we are supplying
    +  var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      // Pass in the canvas resolution so we can convert from
      // pixels to clip space in the shader
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // Tell the shader to get the texture from texture unit 0
    +  gl.uniform1i(imageLocation, 0);

    +  // Bind the position buffer so gl.bufferData that will be called
    +  // in setRectangle puts data in the position buffer
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // Set a rectangle the same size as the image.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

以下がWebGLでレンダリングされた画像です。

{{{example url="../webgl-2d-image.html" }}}

これではあまり面白くない？
では、その画像処理をしてみましょう。
例えば赤と青を入れ替えてみるのはどうでしょうか？

    ...
    outColor = texture(u_image, v_texCoord).bgra;
    ...

これで赤と青が入れ替わりましたね。

{{{example url="../webgl-2d-image-red2blue.html" }}}

他のピクセルを参照する画像処理の場合はどうすれば良いでしょうか？
WebGLはテクスチャ座標を参照しているので、
0.0〜1.0に移動した場合は単純な数学 <code>onePixel = 1.0 / textureSize</code> で1ピクセルの移動量で計算できます。

以下はテクスチャ内の左右のピクセルを正規化したフラグメントシェーダーです。

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

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

これでぼかし表現できました。ぼやけていない上記画像と比較してみて下さい。

{{{example url="../webgl-2d-image-blend.html" }}}

他のピクセル参照できたので今度は畳み込み行列（convolution kernel）を使い、もっと汎用的な画像処理をしてみましょう。
今回は3 x 3の行列を使います。
畳み込み行列とは 3 x 3の行列です。
行列の各値はレンダリングするピクセルの周りの8つのピクセルにどれだけ乗算するかを表します。
その結果を行列のウェイト（行列内の全ての値の合計）、または1.0のいずれか大きい方で割ります。
畳み込み行列の詳細な説明は[ここに良い記事があります](https://docs.gimp.org/2.6/en/plug-in-convmatrix.html)。
[C++で書く場合はこちらの実際のコードを参照して下さい](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx)。

フラグメントシェーダーで畳み込み行列を実装すると以下のようになります。

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

// the convolution kernel data
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

JavaScriptからは、畳み込み行列とそのウェイトをシェーダーに送ります。

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

これで完成ですね。ドロップダウンで別の行列も選択できるようにしました。

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

この記事を読んで、WebGLでの画像処理はとても簡単と納得できたと思います。
次は[複数の画像にエフェクトをかける方法](webgl-image-processing-continued.html)を説明します。

<div class="webgl_bottombar">
<h3>テクスチャユニットとは？</h3>
<code>gl.draw???</code>を呼び出すとシェーダーからテクスチャを参照できます。
テクスチャはテクスチャユニットにバインドされています。
ユーザーのPCがそれ以上に対応している場合もありますが、全てのWebGL2の実装では少なくとも16のテクスチャユニットをサポートしてる必要があります。
各サンプラーユニフォームが参照するテクスチャユニットを設定するには、そのサンプラーユニフォームの位置を調べて参照したいテクスチャユニットのインデックスを指定します。

例:
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

異なるユニットにテクスチャを設定する場合は、gl.activeTextureを呼び出して、ユニットに必要なテクスチャをバインドします。
例:

<pre class="prettyprint showlinemods">
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

以下で動作します。

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>GLSLのa_、u_、v_の接頭辞は何ですか？</h3>
<p>
これは私が採用してる命名規則です。
必須でなく、私にとってはこの接頭辞を付けると一目でわかるようになりました。
バッファが提供するデータである属性用のa_です。
u_はシェーダーへの入力のユニフォーム、v_は頂点シェーダーからフラグメントシェーダーに渡された値です。
描画された各ピクセルの頂点間で補間（または変化）された値です。
詳細は<a href="webgl-how-it-works.html">WebGLの仕組み</a>を参照して下さい。
</p>
</div>
