Title: WebGL1からWebGL2への移行
Description: WebGL1からWebGL2への移行の仕方
TOC: WebGL1からWebGL2への移行

WebGL2はWebGL1と **ほぼ** 100%の下位互換性を持っています。
WebGL1を使用してる場合、**主な**違いは2つだけです。

1. `getContext` を呼び出す際に `"webgl"` の代わりに `"webgl2"` を使用します

        var gl = someCanvas.getContext("webgl2");

    注意: "experimental-webgl2" はありません。
    プレフィックスに依存するためブラウザベンダーが集まり、
    これ以上プレフィックスをつけるのはやめようという事になりました。

2. 多くの拡張機能はWebGL2の標準的な部分で拡張機能としては利用できません

    例えば頂点配列オブジェクトの `OES_vertex_array_object` はWebGL2の標準機能です。
    例えばWebGL1では次のようになります。

        var ext = gl.getExtension("OES_vertex_array_object");
        if (!ext) {
          // tell user they don't have the required extension or work around it
        } else {
          var someVAO = ext.createVertexArrayOES();
        }

    WebGL2では次のようにします。

        var someVAO = gl.createVertexArray();

    WebGL2ではこの関数が存在しています。

WebGL2の機能を利用するためには、いくつか変更を行う必要があります。

## GLSL 300 esへの切り替え

最大の変更点はシェーダーをGLSL 3.00 ESにアップグレードです。
そのため、シェーダーの最初の行に以下を追加します。

    #version 300 es

**注意：これは最初の行でなければなりません。コメントも空白もこの行の前にありません。**

言い換えると以下は良くないです。

    // BAD!!!!                +---There's a new line here!
    // BAD!!!!                V
    var vertexShaderSource = `
    #version 300 es
    ..
    `;

これもヤバいです。

    <!-- BAD!!                   V<- there's a new line here
    <script id="vs" type="notjs">
    #version 300 es
    ...
    </script>

これはOKです。

    var vertexShaderSource = `#version 300 es
    ...
    `;

これもOKです。

    <script id="vs" type="notjs">#version 300 es
    ...
    </script>

または、シェーダーのコンパイル関数で最初の空白行を取り除く事もできます。

### GLSL 100からGLSL 300 esへの変更点

上記のバージョン文字列を追加するだけでなく、シェーダーにいくつかの変更を加える必要があります。

#### `attribute` は `in` へ

GLSL 100では以下でした。

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec3 a_normal;

GLSL 300 esでは次のようになります。

    in vec4 a_position;
    in vec2 a_texcoord;
    in vec3 a_normal;

#### `varying` から `in` / `out` へ

GLSL 100では頂点シェーダーとフラグメントシェーダーの両方でヴァリイングを宣言しました。

    varying vec2 v_texcoord;
    varying vec3 v_normal;

GLSL 300 es の頂点シェーダーでの次のようになります。

    out vec2 v_texcoord;
    out vec3 v_normal;

フラグメントシェーダーは次のようになります。

    in vec2 v_texcoord;
    in vec3 v_normal;

#### もう `gl_FragColor` はありません

GLSL 100ではフラグメントシェーダーは特別な変数 `gl_FragColor` でシェーダーの出力しました。

    gl_FragColor = vec4(1, 0, 0, 1);  // red

GLSL 300 esでは出力変数を自分で宣言し、シェーダーの出力を設定します。

    out vec4 myOutputColor;

    void main() {
       myOutputColor = vec4(1, 0, 0, 1);  // red
    }

注意点: 好きな変数名を選べますが、`gl_` で始まる変数名は**できない**ので `out vec4 gl_FragColor` とする事はできません。

#### `texture2D` -> `texture` etc.

GLSL 100では次のようにテクスチャから色を取得できます。

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture2D(u_some2DTexture, ...);
    vec4 color2 = textureCube(u_someCubeTexture, ...);

GLSL 300esではテクスチャ関数はサンプラーのタイプで何をすべきかを知っています。
そのため、今はただの `texture` になりました。

    uniform sampler2D u_some2DTexture;
    uniform samplerCube u_someCubeTexture;

    ...

    vec4 color1 = texture(u_some2DTexture, ...);
    vec4 color2 = texture(u_someCubeTexture, ...);

## WebGL2の標準機能

WebGL1では多くの機能はオプションの拡張機能でした。
WebGL2では以下の機能は全て標準機能です。

* 深度テクスチャ ([WEBGL_depth_texture](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/))
* 浮動小数点テクスチャ ([OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/)/[OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/))
* ハーフ浮動小数点テクスチャ ([OES_texture_half_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/)/[OES_texture_half_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float_linear/))
* 頂点配列オブジェクト ([OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/))
* 標準的なデリバティブ ([OES_standard_derivatives](https://www.khronos.org/registry/webgl/extensions/OES_standard_derivatives/))
* インスタンス描画 ([ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/))
* UNSIGNED_INTインデックス ([OES_element_index_uint](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/))
* `gl_FragDepth` の設定 ([EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/))
* ブレンド式 MIN/MAX ([EXT_blend_minmax](https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/))
* ダイレクトテクスチャLODアクセス ([EXT_shader_texture_lod](https://www.khronos.org/registry/webgl/extensions/EXT_shader_texture_lod/))
* 複数の描画バッファ ([WEBGL_draw_buffers](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/))
* 頂点シェーダーのテクスチャアクセス

## 2のべき乗以外のテクスチャサポート

WebGL1では、2のべき乗でないテクスチャはミップマップを持てませんでした。
WebGL2ではこの制限は削除されています。
2のべき乗でないテクスチャも2のべき乗のテクスチャと同じように動作します。

## 浮動小数点フレームバッファアタッチメント

WebGL1では浮動小数点テクスチャへのレンダリングのサポートをチェックするために、
まず `OES_texture_float` エクステンションをチェックして有効にします。
そして、浮動小数点テクスチャを作成してフレームバッファにアタッチし、`gl.checkFramebufferStatus` を呼び出して `gl.FRAMEBUFFER_COMPLETE` が返されたかどうかを確認します。

WebGL2では `EXT_color_buffer_float` をチェックして有効にしないと浮動小数点テクスチャに対して `gl.checkFramebufferStatus` が `gl.FRAMEBUFFER_COMPLETE` を返さなくなります。

これは `HALF_FLOAT` フレームバッファアタッチメントにも当てはまる事に注意して下さい。

> これはWebLG1仕様の*バグ*でした。
> 何が起こったかというとWebGL1に `OES_texture_float` が追加されブラウザに実装されました。
> レンダリングに使用するための正しい方法はテクスチャを作成しフレームバッファにアタッチし、その状態をチェックする事だと思われていました。
> その後、仕様書によるとフラグメントシェーダーに書かれた色は常に0〜1にクランプされているので、それでは十分ではないとある人が指摘しました。
> `EXT_color_buffer_float` はその制限を解除しますが、WebGLはすでに1年ほど前からブラウザに実装されてたので、
> 制限を強制するために多くのWebサイトが壊れていたでしょう。
> WebGL2でこれを修正できたので、浮動小数点テクスチャをフレームバッファアタッチメントとして使うには `EXT_color_buffer_float` を有効にする必要があります。
>
> 注意点：私の知る限りで2017年3月現在、浮動小数点テクスチャのレンダリングをサポートしているモバイルデバイスは非常に少ないです。

## 頂点配列オブジェクト

上記の全ての機能の中で、個人的に常に使用すべき機能は頂点配列オブジェクトです。
何をしようとしているのかによりますが、特に頂点配列オブジェクトは常に使用されるべき基本的な機能に思えます。

頂点配列オブジェクトのないWebGL1では、属性に関するデータは全てグローバルなWebGLの状態でした。
それはこのように想像できます。

    var glState = {
      attributeState: {
        ELEMENT_ARRAY_BUFFER: null,
        attributes: [
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
          { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
        ],
      },
    }

`gl.vertexAttribPointer` や `gl.enableVertexAttribArray`、`gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ??)` のような関数を呼び出すと、
グローバル状態に影響を与えます。
描画前に全ての属性を設定する必要があります。
また、インデックスデータを描画する場合は `ELEMENT_ARRAY_BUFFER` を設定します。

頂点配列オブジェクトでは上記の `attributeState` 全体が *頂点配列* です。

つまり

    var someVAO = gl.createVertexArray();

`attributeState` と呼ばれるものの新しいインスタンスを作成します。

    gl.bindVertexArray(someVAO);

以下に相当するものです。

    glState.attributeState = someVAO;

つまり、初期化時に全ての属性を設定する必要があります。

    // at init time
    for each model / geometry / ...
      var vao = gl.createVertexArray()
      gl.bindVertexArray(vao);
      for each attribute
        gl.enableVertexAttribArray(...);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferForAttribute);
        gl.vertexAttribPointer(...);
      if indexed geometry
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);

レンダリング時に特定のジオメトリを使用するために必要なのは次の通りです。

    gl.bindVertexArray(vaoForGeometry);

WebGL1では上記の初期化ループはレンダリング時にありました。
これは大幅なスピードアップです。

しかし、いくつかの注意点があります。

1. 属性のロケーションはプログラムに依存します

    複数のプログラムで同じジオメトリを使用する場合は、属性のロケーションを手動で割り当てる事を検討して下さい。
    GLSL 300 esではシェーダーでこれができます。

    例:

        layout(location = 0) in vec4 a_position;
        layout(location = 1) in vec2 a_texcoord;
        layout(location = 2) in vec3 a_normal;
        layout(location = 3) in vec4 a_color;

    4つの属性のロケーションを設定します。

    また、`gl.linkProgram` を呼び出す前に `gl.bindAttribLocation` を呼び出す事でWebGL1でも行う事もできます。

    例:

        gl.bindAttribLocation(someProgram, 0, "a_position");
        gl.bindAttribLocation(someProgram, 1, "a_texcoord");
        gl.bindAttribLocation(someProgram, 2, "a_normal");
        gl.bindAttribLocation(someProgram, 3, "a_color");

    つまり、複数のシェーダープログラム間で強制的に互換性を持たせる事ができます。
    プログラムが全ての属性を必要としない場合でも、必要な属性は同じロケーションに割り当てられます。

    同じジオメトリを使用している場合、またはWebGL1でVAOを使用しない場合、レンダリング時に常に属性を設定する必要があります。
    これを行わないとシェーダープログラムごとに異なるVAOが必要です。

    注意点: 上記の2つのメソッドでは、私は `gl.bindAttribLocation` を使う事にしています。
    私のコードでは `layout(location = ? )` を使用するメソッドは全てのシェーダーで使用しなければならないので、
    D.R.Y.の観点から `gl.bindAttribLocation` の方が良いように思います。
    シェーダージェネレーターを使っていたら違いはないかもしれません。

2. 使い終わったらVAOをアンバインドする

        gl.bindVertexArray(null);

    これは私の経験から来たものです。
    上記を見ると `ELEMENT_ARRAY_BUFFER` の状態は頂点配列の一部です。

    そこでこの問題にぶつかりました。
    ジオメトリを作成し、そのジオメトリ用のVAOを作成して、属性と `ELEMENT_ARRAY_BUFFER` を設定しました。
    そして、さらにいくつかのジオメトリを作成しました。
    そのジオメトリがインデックスを設定すると、前のVAOバインドが残っていたため、
    インデックスを設定すると前のVAOの `ELEMENT_ARRAY_BUFFER` バインドに影響が出てしまいました。
    デバッグに数時間かかりました。

    だから私からの提案はVAOバウンドが終わったら絶対に放置しない事です。
    次のVAOをすぐにバインドするか、バインドが終わったら `null` をバインドします。

上記で述べたようにWebGL1の拡張機能の多くはWebGL2の標準機能です。
WebGL1で拡張機能を使用していた場合は、WebGL2の拡張機能としてではなく、コードを変更する必要があります。
以下を参照して下さい。

2つの特別な対応が必要です。

1. `OES_texture_float` と浮動小数点テクスチャ

    浮動小数点テクスチャはWebGL2の標準機能ですが

    * 浮動小数点テクスチャをフィルタリング可能になったのは、拡張機能の `OES_texture_float_linear` です。

    * 浮動小数点テクスチャにレンダリング可能になったのは、拡張機能の `EXT_color_buffer_float` です。

    * 浮遊点テクスチャの作成は別物です。
      WebGL2の内部フォーマットである `RGBA32F` や `R32F` などのいずれかを使用する必要があります。
      WebGL1の `OES_texture_float` 拡張モジュールとは異なり、内部フォーマットは `texImage2D` に渡された `type` から推測されます。

2. `WEBGL_depth_texture` と深度テクスチャ

    先ほどの違いと同様にWebGL2で深度テクスチャを作成するには、内部フォーマット `DEPTH_COMPONENT16`、`DEPTH_COMPONENT24` のいずれかを使用しなければなりません。
    `DEPTH_COMPONENT32F`、`DEPTH24_STENCIL8`、`DEPTH32F_STENCIL8` のように WEBGL1の `WEBGL_depth_texture` エクステンションでは `DEPTH_COMPONENT` と `DEPTH_STENCIL_COMPONENT` を使用していました。

以上、個人的にWebGL1からWebGL2に切り替える際に注意すべきショートリストでした。
[WebGL2でできる事はもっとたくさんあります](webgl2-whats-new.html)。

<div class="webgl_bottombar">
<h3>WebGL1の拡張機能をWebGL2のように見せる</h3>
<p>WebGL1での拡張機能はWebGL2ではメインコンテキスト上になりました。例えばWebGLでは以下のようになります。</p>
<pre class="prettyprint">
var ext = gl.getExtension("OES_vertex_array_object");
if (!ext) {
  // tell user they don't have the required extension or work around it
} else {
  var someVAO = ext.createVertexArrayOES();
}
</pre>
<p>
それに対してWebGL2では以下のようになります。
</p>
<pre class="prettyprint">
var someVAO = gl.createVertexArray();
</pre>
<p>WebGL1とWebGL2の両方で実行したい場合は、いくつかの課題があります。</p>
<p>1つの回避策は、初期化時にWebGL1の拡張機能をWebGLコンテキストにコピーする事です。そうすると残りのコードをそのままにできます。以下が例です。
</p>
<pre class="prettyprint">
const gl = someCanvas.getContext("webgl");
const haveVAOs = getAndApplyExtension(gl, "OES_vertex_array_object");

function getAndApplyExtension(gl, name) {
  const ext = gl.getExtension(name);
  if (!ext) {
    return null;
  }
  const fnSuffix = name.split("_")[0];
  const enumSuffix = '_' + fnSuffix;
  for (const key in ext) {
    const value = ext[key];
    const isFunc = typeof (value) === 'function';
    const suffix = isFunc ? fnSuffix : enumSuffix;
    let name = key;
    // examples of where this is not true are WEBGL_compressed_texture_s3tc
    // and WEBGL_compressed_texture_pvrtc
    if (key.endsWith(suffix)) {
      name = key.substring(0, key.length - suffix.length);
    }
    if (gl[name] !== undefined) {
      if (!isFunc && gl[name] !== value) {
        console.warn("conflict:", name, gl[name], value, key);
      }
    } else {
      if (isFunc) {
        gl[name] = function(origFn) {
          return function() {
            return origFn.apply(ext, arguments);
          };
        }(value);
      } else {
        gl[name] = value;
      }
    }
  }
  return ext;
}
</pre>
<p>コードが両方で同じように動作するようになりました。例:</p>
<pre class="prettyprint">
if (haveVAOs) {
  var someVAO = gl.createVertexArray();
  ...
} else {
  ... do whatever for no VAOs.
}
</pre>
<p>代替案は次のような事をしなければならないでしょう。</p>
<pre class="prettyprint">
if (haveVAOs) {
  if (isWebGL2)
     someVAO = gl.createVertexArray();
  } else {
     someVAO = vaoExt.createVertexArrayOES();
  }
  ...
} else {
  ... do whatever for no VAOs.
}
</pre>
<p>注意点： 特に頂点配列オブジェクトの場合、<a href="https://github.com/greggman/oes-vertex-array-object-polyfill">ポリフィルを使用する</a>事をお勧めします。
VAOはほとんどのシステムで利用可能です。
VAOが利用可能ではない場合、ポリフィルが処理しコードがシンプルになります。
</p>
</div>
