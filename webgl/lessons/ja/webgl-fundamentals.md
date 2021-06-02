Title: WebGL2の基本
Description: 基礎から始めるWebGL2の最初のレッスン
TOC: 基本

まず最初に、この記事はWebGL2に関するものです。
WebGL1.0に興味のある方は[こちらを見て下さい](https://webglfundamentals.org)。
WebGL2は[ほぼ100% WebGL1との下位互換性があります](webgl1-to-webgl2.html)。
WebGL2を有効にし、そのまま使う事ができるかもしれません。
これらのチュートリアルはそのパスに従っています。

WebGLは3D APIと思われがちです。
「WebGLを使えば、*魔法* のように簡単にカッコ良い3Dを手に入れられる」と思ってしまう人も多いです。
実際には、WebGLはただのピクセルを描くエンジンです。
与えたコードによって[点、線、三角形](webgl-points-lines-triangles.html)を描画します。
WebGLで何かしたい場合、点、線、三角形を使用したコードを追加する必要があります。

WebGLはGPU上で動作します。
つまり、GPUで動作するコードが必要です。
「頂点シェーダー」と「フラグメントシェーダー」と呼ばれる2つの関数が必要です。
2つとも[GLSL](webgl-shaders-and-glsl.html)と呼ばれる非常に厳密に型付けされたC/C++のような言語で書かれています(GLシェーダー言語)。
その2つの組み合わせたものは *プログラム* と呼びます。

頂点シェーダーの役割は、頂点の位置計算です。
頂点シェーダーの結果で[点、線、三角形](webgl-points-lines-triangles.html)を含む様々な種類のプリミティブを描きます。
このプリミティブを描画する際に、フラグメントシェーダーを呼び出します。
フラグメントシェーダーの役割は、現在描画されてるプリミティブの各ピクセルごとの色を計算します。

上記2つの関数を起動する前に、WebGL APIでその関数の[状態の設定](resources/webgl-state-diagram.html)する必要があります。
様々な状態の設定を行い、`gl.drawArrays` または `gl.drawElements` を呼び出してGPU上でシェーダーを実行します。

シェーダーに渡したいデータはGPUにアップロードが必要です。
シェーダーがデータを受け取る方法は4つあります。

1. 属性（Attribute）、バッファ(Buffer）、頂点配列（Vertex Array）

   バッファはGPUにアップロードするバイナリデータの配列です。
   通常はバッファには位置、法線、テクスチャ座標、頂点の色などが含まれますが、好きなデータを自由に入れられます。

   属性はバッファからデータを取り出し、頂点シェーダーに与える設定です。
   例えばあるバッファに位置ごとに3つの32ビット数字が入っており、属性にどのバッファから位置を取り出すか、どのようなデータを取り出すか（3つの32ビット浮動小数点数）、開始位置がバッファ内のどのオフセットであるか、1つの位置から次の位置への取得バイト数を伝えられます。

   バッファから自由にデータ取得は出来ないですが、頂点シェーダーを呼び出す回数を設定し、呼び出す毎に次のデータをバッファからよむと属性にそのデータが入ります。

   属性の状態、どのバッファを使うか、バッファからどのようにデータを引き出すかなどを頂点配列オブジェクト（VAO）に集約しています。

2. ユニフォーム（Uniform）

   ユニフォームはシェーダープログラムの実行前に設定するグローバル変数です。

3. テクスチャ（Texture）

   テクスチャはシェーダープログラムで自由に読み込めるデータ配列です。
   よくテクスチャには画像データを入れますが、ただのデータ配列なので色以外のデータを入れる事も簡単です。

4. ヴァリイング（Varying）

   ヴァリイングは頂点シェーダーからフラグメントシェーダーにデータを渡す方法です。
   レンダリングされるデータ（点、線、三角形）によって、頂点シェーダーでヴァリイングに設定する値は異なり、フラグメントシェーダー実行中に補間されます。

## WebGLでHello World

WebGLは2つの事だけ関心があります。それはクリップ空間と色です。
プログラマーの役割は、この2つをWebGLに渡す事です。
これを行うために2つの「シェーダー」を用意します。
クリップ空間の頂点座標を与える頂点シェーダー、色を与えるフラグメントシェーダーです。

キャンバスのサイズに関係なく、クリップ空間の頂点座標は常に -1 〜 +1 になります。
以下は一番単純なWebGLの例です。

まず頂点シェーダーから始めましょう。

    #version 300 es

    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }

GLSLではなく、JavaScriptで書かれていたとしたら以下のように動くと想像できます（疑似コードです）

    // *** PSEUDO CODE!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
         // copy the next 4 values from positionBuffer to the a_position attribute
         const start = offset + i * stride;
         attributes.a_position = positionBuffer.slice(start, start + size);
         runVertexShader();
         ...
         doSomethingWith_gl_Position();
    }

実際には、`positionBuffer` をバイナリデータに変換する必要があり（下記参照）、
バッファからデータを取り出すための計算とは少し異なります。
これで頂点シェーダーがどのように実行されるか理解できると思います。

次にフラグメントシェーダーが必要です。

    #version 300 es

    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      // Just set the output to a constant reddish-purple
      outColor = vec4(1, 0, 0.5, 1);
    }

上記でフラグメントシェーダーの出力として `outColor` を宣言しました。
`outColor` を `1, 0, 0.5, 1` にすると、赤＝1、緑＝0、青＝0.5、アルファ＝1になります。
WebGLでは色は0〜1の間を指定します。

2つのシェーダー関数を書いたのでWebGLで使ってみましょう。

まず、HTMLのcanvas要素が必要です。

     <canvas id="c"></canvas>

JavaScriptでそのcanvas要素を探します。

     var canvas = document.querySelector("#c");

これでWebGL2RenderingContextを作成できるようになりました。

     var gl = canvas.getContext("webgl2");
     if (!gl) {
        // no webgl2 for you!
        ...

次にシェーダーをコンパイルしてGPU上にアップロードする必要があるので、シェーダーコードを文字列にします。
GLSLを文字列にする方法はいくつかあります。
例えば文字列を連結したり、AJAXでダウンロードしたり、scriptタグのtypeがjavascript以外のタグです。
今回は複数行のテンプレート文字列に入れます。

    var vertexShaderSource = `#version 300 es

    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      // Just set the output to a constant reddish-purple
      outColor = vec4(1, 0, 0.5, 1);
    }
    `;

ほとんどの3Dエンジンでは様々なタイプのテンプレートや文字列の連結を使用し、動的にGLSLシェーダーを生成しています。
このサイトのサンプルでは、複雑でないので実行時に動的にGLSLを生成する必要はありません。

> 注意: `#version 300 es` **必ずシェーダーの最初の行にして下さい**。
> 最初の行にコメントや空行を入れてはいけません。
> `version 300 es` はWebGL2にGLSL ES 3.00と呼ばれるシェーダー言語を使う事を伝えます。
> この記述がない場合、シェーダー言語のデフォルトはWebGL 1.0のGLSL ES 1.00になります。

次にシェーダーを作成しGLSLソースをアップロードして、シェーダーをコンパイルする関数が必要です。
関数名から何をしているか明らかなのでコメントは書いてません。

    function createShader(gl, type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }

この関数を呼び出すと2つのシェーダーを作成できます。

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

この2つのシェーダーを *プログラム* に *リンク* します。

    function createProgram(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

そして、上記の関数を呼び出します。

    var program = createProgram(gl, vertexShader, fragmentShader);

GPU上でGLSLプログラムを作成したのでデータを送ります。
WebGL APIの大部分は、GLSLプログラムにデータを送り状態を設定します。
この場合、GLSLプログラムへの入力は `a_position` でこれが属性です。
最初にgl.getAttribLocationで作成したプログラムの属性の位置を調べます。

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

属性の位置（およびユニフォームの位置）を調べるコードは、描画ループ内でなく初期化中に行うべきです。

属性はバッファからデータを取得し、バッファを作成します。

    var positionBuffer = gl.createBuffer();

WebGLでは、グローバルバインドポイント上で多くのWebGLリソースを操作できます。
バインドポイントとは、WebGL内部のグローバル変数と考えて下さい。
まず、リソースをバインドポイントにバインドします。
他の全ての関数はバインドポイントを通してリソースを参照します。
そこでpositionBufferをバインドしてみましょう。

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

バインドポイントを参照し、バッファにデータを入れました。

    // three 2d points
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

ここでは様々な事が行われています。
まず、JavaScriptの配列の `positions` があります。
WebGLでは型付けのデータが必要です。
`new Float32Array(positions)` は32ビットの浮動小数点数の新しい配列を作成し、 `positions` の値をコピーします。
`gl.bufferData` はデータをGPU上の `positionBuffer` にコピーします。
positionBufferは上記の `ARRAY_BUFFER` でバインドポイントにバインドしています。

gl.bufferDataの最後の引数  `gl.STATIC_DRAW` は、データをどのように使用するかのWebGLへのヒントです。
WebGLは、このヒントを使って特定のものを最適化できます。
`gl.STATIC_DRAW` はこのデータはあまり更新しない意味です。

データをバッファに入れたので、バッファからデータを取り出す方法を属性に伝えます。
まず、頂点配列オブジェクトと呼ばれる属性状態のコレクションを作成する必要があります。

    var vao = gl.createVertexArray();

createVertexArrayで頂点配列を作成します。
これで全ての属性の設定がその属性状態に適用されます。

    gl.bindVertexArray(vao);

ここで頂点配列の属性を設定します。まず、属性を有効にします。
そして、バッファからデータを取得します。
もしこの属性を有効にしない場合、この属性は定数になります。

    gl.enableVertexAttribArray(positionAttributeLocation);

次にデータを取り出す方法を指定します。

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

`gl.vertexAttribPointer` の隠された部分は、現在の `ARRAY_BUFFER` を属性にバインドします。
言い換えると、この属性は `positionBuffer` にバインドされます。
つまり、`ARRAY_BUFFER` のバインドポイントに何か他のものを自由にバインドできます。
属性は `positionBuffer` を使い続けます。

GLSLの頂点シェーダーでは `a_position` 属性は `vec4` です。

    in vec4 a_position;

`vec4` は4つの浮動小数点値です。
JavaScriptでは `a_position = {x: 0, y. 0, z: 0, w: 0}` です。
上記では `size = 2` としてます。
属性のデフォルトは `0, 0, 0, 1` で、この属性はバッファから最初の2つの値(xとy)を取得します。
zとwはそれぞれデフォルトの0と1になります。

描画前にキャンバスの表示サイズに合わせて、サイズを変更しておきましょう。
画像のようなキャンバスには2つのサイズがあります。
実際に入っているピクセル数と表示されるサイズを分けて表示しています。
**キャンバスを表示するサイズはCSS** で必ず設定して下さい。
CSSは他の方法よりも柔軟性があります。

キャンバスのピクセル数と表示サイズを一致させるために[こちらで紹介しているヘルパー関数を使っています](webgl-resizing-the-canvas.html)。

サンプルをブラウザの別ウィンドウで開いて実行した場合、キャンバスサイズは400 x 300ピクセルです。
このページのようにiframeの中にある場合はiframeのサイズに合わされます。

CSSでサイズを調整し、この2つの場合を簡単に対応できます。

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

クリップ空間の値から `gl_Position ` を設定し、ピクセルに変換します。
そして、 `gl.viewport` を呼び出し、キャンバスの現在のサイズを渡します。

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

これは -1 〜 +1 のクリップ空間で、X軸が「0 〜 `gl.canvas.width`」、y軸が「0 〜 `gl.canvas.height`」になるように設定しています。

そして、キャンバスをクリアします。
`0, 0, 0, 0` はそれぞれ赤、緑、青、アルファです。

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

次にどのシェーダープログラムを実行するか指定します。

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

どのバッファセットを使用するか、バッファからどのようにしてデータを取り出して属性に指定するか伝える必要があります。

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

これでようやくWebGLでGLSLプログラムを実行できるようになりました。

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

カウントが3なので頂点シェーダーが3回実行されます。
頂点シェーダーの属性の最初の `a_position.x` と `a_position.y` は、positionBufferに2つの値が設定されます。
`a_position.xy` には2回目の2つの値が設定されます。
3回目は最後の2つの値が設定されます。

`primitiveType` で `gl.TRIANGLES` を設定してるので、
頂点シェーダーが3回実行される毎に `gl_Position` に設定した3つの値で三角形を描画します。
キャンバスのサイズに関係なく、クリップ空間の座標は -1 〜 +1 の範囲になります。

頂点シェーダーは単にpositionBufferの値を `gl_Position` にコピーしているだけで三角形はクリップ空間座標に描画されます。

      0, 0,
      0, 0.5,
      0.7, 0,

クリップ空間からスクリーン空間に変換すると、キャンバスのサイズが400 x 300の場合は以下のようになります。

     clip space      screen space
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

この座標で三角形をレンダリングします。
ピクセルごとにフラグメントシェーダーを呼び出します。
フラグメントシェーダーの `outColor` を `1, 0, 0.5, 1` に設定します。
キャンバスの色はRGBの各チャンネルにつき8ビットなので、`[255, 0, 127, 255]` をキャンバスに書き込みます。

こちらが動いてるサンプルコードです。

{{{example url="../webgl-fundamentals.html" }}}

上記の例は頂点シェーダーは何もしてませんが、位置データを直接渡しています。
既にクリップ空間に位置データが入っているので修正作業は必要ありません。
*WebGLは描画APIに過ぎないので、3Dを必要とする場合はクリップ空間に変換するシェーダーを与える必要があります*。

なぜ三角形が真ん中から始まり、右上に向かっていくのか不思議に思うかもしれません。
`x` のクリップ空間は -1 〜 +1 です。
つまり、0が中心で正の値はその右側になります。

なぜ上にあるのかと言うとクリップ空間では-1が下にあり、+1が上になります。
つまり、0が中心にあるので正の数が中心より上になります。

2Dの場合、クリップ空間よりもピクセル空間で作業したいと思うでしょう。
シェーダーを変更してピクセルで位置を指定し、クリップ空間に変換してみましょう。
これが変更した頂点シェーダーです。

    -  in vec4 a_position;
    +  in vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // convert the position from pixels to 0.0 to 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // convert from 0->1 to 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // convert from 0->2 to -1->+1 (clip space)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

変更点について、いくつか注意点があります。
`a_position` を `vec2` に変更したのは `x` と `y` を使うからです。
`vec2` は `vec4` に似ていますが、`x` と `y` だけを使っています。

次に `u_resolution` という `uniform` を追加しました。
これを設定するには、ロケーションを指定する必要があります。

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

あとはコメントを見れば一目瞭然でしょう。
`u_resolution` にキャンバスの解像度を設定すると、シェーダーは `positionBuffer` で指定した位置をピクセル座標で受け取りクリップ空間に変換します。

これで位置の値をクリップ空間からピクセルに変更できるようになりました。
今回は3点ずつの2つの三角形で作った長方形を描きます。

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

どのプログラムを使用するかを作成したユニフォームの値を設定します。
`gl.useProgram` は上記の `gl.bindBuffer` と同様に現在のプログラムを設定します。
全ての `gl.uniformXXX` 関数は現在のプログラムにユニフォームを設定します。

    gl.useProgram(program);

    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

2つの三角形を描画するために頂点シェーダーを6回呼び出し、`count` を `6` に変更します。

    // draw
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

そして、これがそのコードです。

注意: この例と全ての例はシェーダーをコンパイルしてリンクする関数を含む [`webgl-utils.js`](/webgl/resources/webgl-utils.js) を使用しています。
サンプルを煩雑にさせたくないので、[ボイラーテンプレート](webgl-boilerplate.html)にしました。

{{{example url="../webgl-2d-rectangle.html" }}}

もう1度言いますが、長方形がその領域の下の方にあります。
WebGLではYが正の場合は上、Yが負の場合は下となります。
クリップ空間で左下隅 -1, -1です。
コードを変えていないので、0が左下になります。
2DグラフィックスAPIで使用されているように左上を0, 0にしたければ、クリップ空間のy座標を反転させます。

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

四角形は期待通りの位置になります。

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

四角形を定義してる部分を関数にし、呼び出す時にサイズと色の変更ができるようにします。

まず、フラグメントシェーダーに色のユニフォームを渡します。

    #version 300 es

    precision highp float;

    +  uniform vec4 u_color;

    out vec4 outColor;

    void main() {
    -  outColor = vec4(1, 0, 0.5, 1);
    *  outColor = u_color;
    }

50個の四角形をランダムな位置と色で描画するコードは以下の通りです。

      var colorLocation = gl.getUniformLocation(program, "u_color");
      ...

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fills the buffer with the values that define a rectangle.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
      // whatever buffer is bound to the `ARRAY_BUFFER` bind point
      // but so far we only have one buffer. If we had more than one
      // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

そして、これがその四角形です。

{{{example url="../webgl-2d-rectangles.html" }}}

WebGLは、かなり単純なAPIだと気づくと思います。
単純という言葉は間違っているかもしれませんが、何をするかは簡単です。
ただ、頂点シェーダーとフラグメントシェーダーの両方を実行し、三角形、線、点を描画するだけです。
3Dを行うために複雑になりますが、その複雑さはプログラマがもっと複雑なシェーダーで追加したものです。
WebGLはただ単純に描画するAPIです。

今回は、1つの属性と2つのユニフォームでデータをシェーダーに渡す方法を取り上げました。
複数の属性を持ち、ユニフォームが多く使う事はよくあります。
この記事の始めの方で *ヴァリイング* と *テクスチャ* についても触れました。
これらは後のレッスンで説明します。

次に進む前に `setRectangle` で行ったようにバッファ内のデータを更新する事は、 *ほとんどの* アプリケーションでは一般的ではないです。
この例を使ったのはピクセル座標を入力とし、GLSLで少しだけ計算をしている説明が一番簡単だと思ったからです。
それは駄目な方法ではないはずです。
この方法が適切である場合もありますが、
[WebGLで移動、回転、拡大縮小する、一般的な方法も読んでみて下さい](webgl-2d-translation.html)。

WebGLの知識が全くなくて、GLSLやシェーダー、GPUが何をしているのかわからない場合は、
[WebGLの仕組み](webgl-how-it-works.html)をチェックしてみて下さい。

また、WebGLの基本的な動き方を理解する別の方法として、
この[インタラクティブな状態図](/webgl/lessons/resources/webgl-state-diagram.html)を見るのもいいかもしれません。

また、サンプルで使用している [ボイラープレートコード](webgl-boilerplate.html)も簡単に読んでおきましょう。
通常のWebGLアプリの構造を理解するために[複数のものを描画する方法](webgl-drawing-multiple-things.html)も読んでおくと良いです。

それ以外の場合は、ここからは2つの方向に進む事ができます。
画像処理に興味がある方は、[2D画像を処理する方法](webgl-image-processing.html)を見て下さい。
もし移動・回転・拡大縮小の学習に興味があれば[ここから始めて下さい](webgl-2d-translation.html)。
