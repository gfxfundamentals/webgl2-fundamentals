Title: WebGLの仕組み
Description: WebGLが実際に何をしているか
TOC: WebGLの仕組み

この記事は[WebGL2の基本](webgl-fundamentals.html)からの続きです。
続きを始める前にWebGLとGPUがどのように動作してるか、説明する必要があります。
GPUには2つの基本的な動作があります。
1つ目は頂点データ（頂点座標に限らず与えられたバッファ上のデータストリーム）をクリップ空間の座標データに変換します。
2つ目は1つ目の処理結果を元にピクセルを描画します。

以下のコードでは

    gl.drawArrays(gl.TRIANGLES, 0, 9);

第3引数は9つの頂点を処理するという意味でGPUに対する命令です。

<div class="webgl_center"><img src="resources/vertex-shader-anim.gif" /></div>

図の左列は「元となる頂点情報」であなたが用意したデータです。
図の中央は「頂点シェーダー」で[GLSL](webgl-shaders-and-glsl.html)で書いた関数です。
「頂点シェーダー」は元となる頂点1つにつき1回呼び出されます。
「元となる頂点情報」に対応する「クリップ空間上の値」（図の右列）を何らかの計算を行い、その値を特別な変数 `gl_Position` に設定します。
GPUはその結果を取得し、内部で管理している専用の領域に保存します。

gl.drawArraysの第1引数に `TRIANGLES` を指定したので、GPUは3つの頂点を生成するたびに「クリップ空間上の値」3つを使い三角形を作ります。
三角形の3点がどのピクセルに対応しているかを計算し、三角形を描画します。
各ピクセルに対してフラグメントシェーダーを呼び出すと、そのピクセルをどんな色にするかを尋ねてきます。
フラグメントシェーダーは、そのピクセルに必要な色のvec4を出力します。

描画とフラグメントシェーダーの仕組みは非常に興味深いですが、ここまでの例を見て頂ければわかるように、
フラグメントシェーダーは1ピクセルあたりの情報量が非常に少ないのです。
幸いな事にもっと多くの情報を渡す事ができます。
頂点シェーダーからフラグメントシェーダーに渡すそれぞれの値のヴァリイング（varying）を定義します。

簡単な例として、頂点シェーダーから直接計算したクリップ空間の座標データをフラグメントシェーダーに渡してみましょう。

簡単な三角形を描画していきます。
[前回の例](webgl-2d-matrices.html)に引き続き、長方形を三角形に変更してみましょう。

    // Fill the buffer with the values that define a triangle.
    function setGeometry(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
                 0, -100,
               150,  125,
              -175,  100]),
          gl.STATIC_DRAW);
    }

頂点数が3つになったので、シェーダーの呼び出し部分のcountも3にします。

    // Draw the scene.
    function drawScene() {
      ...
      // Draw the geometry.
    *  gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

頂点シェーダーでは、フラグメントシェーダーにデータを渡すために *varying* のv_colorを `out` で定義します。

    out vec4 v_color;
    ...
    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // Convert from clip space to color space.
      // Clip space goes -1.0 to +1.0
      // Color space goes from 0.0 to 1.0
    *  v_color = gl_Position * 0.5 + 0.5;
    }

フラグメントシェーダーでも同じ *varying* のv_colorを `in` で定義します。

    #version 300 es

    precision highp float;

    in vec4 v_color;

    out vec4 outColor;

    void main() {
    *  outColor = v_color;
    }

頂点シェーダーのvaryingをフラグメントシェーダーの同名・同型のvaryingに接続します。

以下が動くサンプルコードです。

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

上記のサンプルコードでスライダーを動かし、平行移動・回転・拡大縮小してみましょう。
色はクリップ空間から計算されているので、三角形と一緒に移動してない事に気づくと思います。
色は背景に張り付いたような動きをしています。

ちょっと考えてみましょう。
頂点シェーダーで扱ったのは頂点3つだけです。
頂点シェーダーは3回だけ呼び出され色も3つの色を計算しただけですが、三角形はたくさんの色で描画されています。
これは *varying* に秘密があります。

各頂点に対して計算した3つの値を取り三角形を描画する時、頂点に対して計算した値の間を補間します。
各ピクセルでは、補間された値を持つフラグメントシェーダーを呼び出します。

上記の例では3つの頂点を使っていました。

<style>
table.vertex_table {
  border: 1px solid black;
  border-collapse: collapse;
  font-family: monospace;
  font-size: small;
}

table.vertex_table th {
  background-color: #88ccff;
  padding-right: 1em;
  padding-left: 1em;
}

table.vertex_table td {
  border: 1px solid black;
  text-align: right;
  padding-right: 1em;
  padding-left: 1em;
}
</style>
<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">頂点</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

頂点シェーダーに行列を適用し、移動・回転・拡大縮小してクリップ空間への変換を行います。
移動・回転・拡大縮小のデフォルト値は、移動 = 200, 150、回転 = 0、拡大縮小＝1, 1 なので移動しただけです。
バックバッファが 400 x 300 である事を考えると、頂点シェーダーは行列を適用し次の3つのクリップ空間座標に変換して、gl_Positionに書き込みます。

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">gl_Positionに書き込まれる値</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

さらにクリップ空間座標を色空間座標に変換して、その値を *varying* のv_colorに書き込みます。

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">v_colorに書き込まれる値</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

v_colorに書き込まれたこれら3つの値が補間され、各ピクセルのフラグメントシェーダーに渡されます。

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_colorは頂点v0, v1, v2の間で補間される" }}}

もっと多くのデータを頂点シェーダーに渡して、それをフラグメントシェーダーに渡す事もできます。
例えば、2つの三角形で構成される長方形を2色で描いてみましょう。
まず頂点シェーダーに別の属性を追加し、もっと多くのデータを渡せるようにします。
そして、そのデータを直接フラグメントシェーダーに渡します。

    in vec2 a_position;
    +in vec4 a_color;
    ...
    out vec4 v_color;

    void main() {
       ...
      // Copy the color from the attribute to the varying.
    *  v_color = a_color;
    }

使いたい色のデータをWebGLに伝えます。

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");
    +  var colorLocation = gl.getAttribLocation(program, "a_color");
      ...
    +  // Create a buffer for the colors.
    +  var buffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    +
    +  // Set the colors.
    +  setColors(gl);

      // setup attributes
      ...
    +  // tell the color attribute how to pull data out of the current ARRAY_BUFFER
    +  gl.enableVertexAttribArray(colorLocation);
    +  var size = 4;
    +  var type = gl.FLOAT;
    +  var normalize = false;
    +  var stride = 0;
    +  var offset = 0;
    +  gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);

      ...

    +// Fill the buffer with colors for the 2 triangles
    +// that make the rectangle.
    +function setColors(gl) {
    +  // Pick 2 random colors.
    +  var r1 = Math.random();
    +  var b1 = Math.random();
    +  var g1 = Math.random();
    +
    +  var r2 = Math.random();
    +  var b2 = Math.random();
    +  var g2 = Math.random();
    +
    +  gl.bufferData(
    +      gl.ARRAY_BUFFER,
    +      new Float32Array(
    +        [ r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1]),
    +      gl.STATIC_DRAW);
    +}

そして、その結果がこちらです。

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

2つの単色カラーの三角形ができました。
*varying* で値を渡しているので、各頂点の色のデータを頂点間で補間しています。
今回は各三角形の3つの頂点に同じ色を指定したため、各三角形は単色になっています。
それぞれの頂点色を違う色にすると、頂点の間で補間された色になります。

    // Fill the buffer with colors for the 2 triangles
    // that make the rectangle.
    function setColors(gl) {
      // Make every vertex a different color.
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(
    *        [ Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1]),
          gl.STATIC_DRAW);
    }

これで *varying* で色が補間されてグラデーションとして見えるようなりました。

{{{example url="../webgl-2d-rectangle-with-random-colors.html" }}}

あまり面白い結果ではなかったかもしれないが、複数の属性を使用して頂点シェーダーからフラグメントシェーダーにデータを渡す事ができるようになりました。
[2D画像を処理する方法](webgl-image-processing.html)では、属性にテクスチャ座標を渡しているので興味があればチェックして見て下さい。

## バッファや属性のコマンドは何をしているのか？

バッファは、GPUが頂点データや各頂点と1対1で結びついたデータを取り組むための仕組みです。
`gl.createBuffer` でバッファを作成します。
`gl.bindBuffer` は操作対象のバッファを設定します。
`gl.bufferData` は現在のバッファにデータをコピーします。

データをバッファに入ったらどのようにデータを取り出し、頂点シェーダーの属性に渡すか指定する必要があります。

これはまず、属性に割り当てたロケーションを確認します。
例えば上記のコードでは

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

の部分でロケーション確認をしています。
属性のロケーションが分かったら、2つのコマンドを発行します。

    gl.enableVertexAttribArray(location);

このコマンドは、データはバッファから渡す事をWebGLに伝えます。

    gl.vertexAttribPointer(
        location,
        numComponents,
        typeOfData,
        normalizeFlag,
        strideToNextPieceOfData,
        offsetIntoBuffer);

このコマンドは、最後にgl.bindBufferでバインドされたバッファからデータを取得するようにWebGLに指定します。
numComponents = 頂点あたりのコンポーネント数 (1 〜 4)、
typeOfData = データの型 (`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT` など)、
strideToNextPieceOfData = 次のデータまで何バイトあるかストライド、
offsetIntoBuffer = データがバッファのどこまであるかを表すオフセット
などを指定します。

numComponentsは常に1〜4個です。

データの型ごとに1つのバッファを割り当てる場合は、ストライドとオフセットの両方は常に0にできます。
ストライド = 0は「データの型とサイズに合ったストライドを使う」という意味です。
オフセット = 0はバッファの先頭からの開始という意味です。
これらを0以外の値に設定すると処理が複雑になりますが、パフォーマンスの面ではメリットがあるかもしれません。
しかし、パフォーマンスを限界まで引き出す必要がなければ複雑にする価値はありません。

以上の説明でバッファと属性が明確になると良いと思います。

WebGLの仕組みを理解する別の方法として、
この[インタラクティブな状態図](/webgl/lessons/resources/webgl-state-diagram.html)を見てみるのもいいかもしれません。

次は[シェーダーとGLSL](webgl-shaders-and-glsl.html)を見てみましょう。

<div class="webgl_bottombar"><h3>vertexAttribPointer関数のnormalizeFlagは何のためにある？</h3>
<p>
正規化フラグ（normalizeFlag）は、浮動小数点ではない全ての型のためのものです。
falseにした場合、各データ型がそのまま解釈されます。
具体的には、BYTE型なら-128 ～ 127、UNSIGNED_BYTE型なら0 ～ 255、SHORT型なら-32768 ～ 32767……となります。
</p>
<p>
trueにした場合、BYTE型 (-128 〜 127) なら-1.0 〜 +1.0 、UNSIGNED_BYTE型 (0 〜 255) なら0.0 〜 +1.0になります。
正規化されたSHORT型も-1.0 〜 +1.0になり、BYTEよりもデータの解像度が高くなります。
</p>
<p>
正規化フラグを使う典型的な例は色情報のデータです。
ほとんどの場合、色は0.0 ～ 1.0で指定されます。
赤、緑、青、アルファにそれぞれfloat型を使用すると、１頂点あたりの色情報は16バイトになります。
複雑な形状をしているとバイト数が多くなってしまいます。
ここで代わりに色をUNSIGNED_BYTE型に変換し、0は0.0を、255は1.0を表します。
これで頂点ごとに1色につき4バイトしか必要なくなり、75%の節約になります。
</p>
<p>実際にコーディングしてみましょう。データの取り出し方を指定する部分は以下のコードになります。</p>
<pre class="prettyprint showlinemods">
  var size = 4;
*  var type = gl.UNSIGNED_BYTE;
*  var normalize = true;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);
</pre>
<p>バッファを色で塗りつぶす時は次のようにします。</p>
<pre class="prettyprint showlinemods">
// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
function setColors(gl) {
  // Pick 2 random colors.
  var r1 = Math.random() * 256; // 0 to 255.99999
  var b1 = Math.random() * 256; // these values
  var g1 = Math.random() * 256; // will be truncated
  var r2 = Math.random() * 256; // when stored in the
  var b2 = Math.random() * 256; // Uint8Array
  var g2 = Math.random() * 256;

  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(   // Uint8Array
        [ r1, b1, g1, 255,
          r1, b1, g1, 255,
          r1, b1, g1, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255]),
      gl.STATIC_DRAW);
}
</pre>
<p>
実行結果はこのようになります。
</p>

{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}
</div>


