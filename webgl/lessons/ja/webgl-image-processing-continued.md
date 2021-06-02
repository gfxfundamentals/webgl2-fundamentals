Title: WebGL2における画像処理の続き
Description: 複数の画像にエフェクトをかける方法
TOC: WebGL2における画像処理の続き

この記事は[WebGL2における画像処理](webgl-image-processing.html)からの続きです。
もし読んでいない場合は[まずは前回の記事を読んでみて下さい](webgl-image-processing.html)。

画像処理で次の問題は、複数のエフェクトを適用する方法です。

もちろん、色んな処理を行う専用シェーダーを生成する事もできます。
使用したいエフェクトを選択するUIを用意し、全てのエフェクトを実行するシェーダーを生成する事もできます。
この方法は万能ではないですが、[リアルタイムグラフィックスのエフェクト作成](https://www.youtube.com/watch?v=cQUn0Zeh-0Q)では実際に使われています。

もっと柔軟な方法は、2枚のテクスチャを交互に使って次々に別のエフェクトをかけていく事です。

<blockquote><pre>Original Image -&gt; [Blur]        -&gt; Texture 1
Texture 1      -&gt; [Sharpen]     -&gt; Texture 2
Texture 2      -&gt; [Edge Detect] -&gt; Texture 1
Texture 1      -&gt; [Blur]        -&gt; Texture 2
Texture 2      -&gt; [Normal]      -&gt; Canvas</pre></blockquote>

これを行うにはフレームバッファを作成する必要があります。
WebGLやOpenGLではフレームバッファは貧弱な名称です。
WebGL/OpenGLのフレームバッファは、単なるアタッチメントのリストで実際にはどのような種類のバッファでもありません。
フレームバッファにテクスチャをアタッチするとそのテクスチャをレンダリングできます。

まずは[前回のテクスチャ作成コード](webgl-image-processing.html)を関数にしてみましょう。

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set up texture so we can render any size image and so we are
    // working with pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // Create a texture and put the image in it.
  var originalImageTexture = createAndSetupTexture(gl);

  // Upload the image into the texture.
  var mipLevel = 0;               // the largest mip
  var internalFormat = gl.RGBA;   // format we want in the texture
  var srcFormat = gl.RGBA;        // format of data we are supplying
  var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
  gl.texImage2D(gl.TEXTURE_2D,
                mipLevel,
                internalFormat,
                srcFormat,
                srcType,
                image);
```

この関数を使い2枚のテクスチャを作成し、2つのフレームバッファにアタッチしてみます。

```
  // create 2 textures and attach them to framebuffers.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // make the texture the same size as the image
    var mipLevel = 0;               // the largest mip
    var internalFormat = gl.RGBA;   // format we want in the texture
    var border = 0;                 // must be 0
    var srcFormat = gl.RGBA;        // format of data we are supplying
    var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
    var data = null;                // no data = create a blank texture
    gl.texImage2D(
        gl.TEXTURE_2D, mipLevel, internalFormat, image.width, image.height, border,
        srcFormat, srcType, data);

    // Create a framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Attach a texture to it.
    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }
```

色々なエフェクトを畳み込み行列で定義し、エフェクトリストを作ってみます。

```
  // Define several convolution kernels
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

  // List of effects to apply.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

最後に2つのテクスチャを交互に使い、エフェクトを次々に適用してみます。

```
  function drawEffects() {
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // start with the original image on unit 0
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(imageLocation, 0);

    // don't y flip images while drawing to the textures
    gl.uniform1f(flipYLocation, 1);

    // loop through each effect we want to apply.
    var count = 0;
    for (var ii = 0; ii < tbody.rows.length; ++ii) {
      var checkbox = tbody.rows[ii].firstChild.firstChild;
      if (checkbox.checked) {
        // Setup to draw into one of the framebuffers.
        setFramebuffer(framebuffers[count % 2], image.width, image.height);

        drawWithKernel(checkbox.value);

        // for the next draw, use the texture we just rendered to.
        gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

        // increment count so we use the other texture next time.
        ++count;
      }
    }

    // finally draw the result to the canvas.
    gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas

    setFramebuffer(null, gl.canvas.width, gl.canvas.height);

    drawWithKernel("normal");
  }

  function setFramebuffer(fbo, width, height) {
    // make this the framebuffer we are rendering to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Tell the shader the resolution of the framebuffer.
    gl.uniform2f(resolutionLocation, width, height);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // set the kernel and it's weight
    gl.uniform1fv(kernelLocation, kernels[name]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

以下は少し手を加えて、柔軟なUIを追加したバージョンです。
チェックを入れたエフェクトが適用されます。
エフェクトの適用順はドラッグで並べ替えできます。

{{{example url="../webgl-2d-image-processing.html" }}}

まだ説明していない事がいくつかあります。

`gl.bindFramebuffer` を `null` で呼び出した場合、フレームバッファではなくキャンバスにレンダリングします。

また、フレームバッファはアタッチメントによっては動作しない場合があります。
ここに常に動作するアタッチメントの種類と組み合わせのリストがあります。
ここで使用したのは、`COLOR_ATTACHMENT0` アタッチメントポイントに割り当てられた `RGBA`/`UNSIGNED_BYTE` テクスチャで常に動作します。
もっとエキゾチックなテクスチャフォーマットやアタッチメントの組み合わせでは動作しない場合があります。
今回はフレームバッファをバインドしてから `gl.checkFramebufferStatus` で `gl.FRAMEBUFFER_COMPLETE` を返すか確認します。
gl.FRAMEBUFFER_COMPLETEを返すなら問題ないです。
そうでない場合、他のものにフォールバックするようにします。
幸いな事にWebGL2は多くのフォーマットや組み合わせをサポートしています。

WebGLは[クリップ空間](webgl-fundamentals.html)からピクセルに変換する必要があります。
この時に `gl.viewport` の設定を基準にします。
レンダリングに使ってるフレームバッファとキャンバスのサイズが異なるため、
フレームバッファとキャンバスにレンダリング時にそれぞれビューポートを適切に設定する必要があります。

最後に[オリジナルのサンプルコード](webgl-fundamentals.html)では、レンダリング時にY座標を反転させてます。
これはWebGLでは座標（0,0）がキャンバスの左下で、左上を基準とする従来の座標系とは違うためです。
この反転はフレームバッファにレンダリング時は不要です。
フレームバッファが表示されないので、どちらを上か下かにするかは無関係だからです。
重要なのはフレームバッファのピクセル(0, 0)が、エフェクトの計算上の(0, 0)と一致していれば良いです。
これに対応するため、反転させるかはシェーダーのユニフォームの `u_flipY` を使い設定できるようにしました。

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

反転するかどうかをレンダリング時に設定します。

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

今回はサンプルコードをシンプルにするために、GLSLプログラムを1つだけ使って複数のエフェクトを実現してみました。
本格的な画像処理をする場合は、GLSLプログラムが複数必要になるでしょう。
色相や彩度や輝度を調整するGLSLプログラム、明度やコントラストを調整するプGLSLログラム、反転したり量を調整するGLSLプログラムが必要な場合もあります。
また、GLSLプログラムを切り替えたりパラメーターを更新するために、コードを書き換える必要もあります。
今回のサンプルコードに書く事も考えましたが、スパゲッティコードで大混乱になるため読者の練習のために残して置く事にしました。
複数のGLSLプログラムやパラメーターを扱うのはなかなか大変です。
プログラムが混沌とするのを抑えるためのリファクタリング作業は、大掛かりなものになると思います。

今回のサンプルコードやこれまで登場したサンプルコードによって、 WebGLが読者にとって親しみやすいものとなれば良いです。
時間があれば3Dの扱い方の[いくつかの記事](webgl-2d-translation.html)や[WebGLの仕組み](webgl-how-it-works.html)の詳細を書く予定です。

次回は[2つ以上のテクスチャの使い方](webgl-2-textures.html)の学習を検討してみて下さい。
