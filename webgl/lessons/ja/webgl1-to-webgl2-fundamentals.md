Title: WebGLFundamentals.orgとの違い
Description: WebGLFundamentals.orgとWebGL2Fundamentals.orgとの違い
TOC: WebGLFundamentals.orgとWebGL2Fundamentals.orgとの違い

[webglfundamentals.org](https://webglfundamentals.org)を読んだ方はいくつかの違いがあるので注意して下さい。

## 複数行のテンプレートリテラル

webglfundamentals.orgでは、ほとんど全てのスクリプトはjavascriptではない `<script>` タグに格納されていました。

    <script id="vertexshader" type="not-js">;
    shader
    goes
    here
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

webgl2fundamentals.orgでは複数行のテンプレートリテラルに切り替えました。

    var vertexShaderSource = `
    shader
    goes
    here
    `;

複数行のテンプレートリテラルは、IE11以外の全てのWebGL対応ブラウザでサポートされています。
IE11をサポートする場合、[babel](https://babeljs.io)のようなトランスパイラの使用を検討して下さい。

## 全てのシェーダーでGLSL 300 esを使用

シェーダーを全てGLSL 300 esに切り替えました。
WebGL2のシェーダーを使わない場合、WebGL2を使う必要がないと考えました。

## 全てのサンプルで頂点配列オブジェクトを使用

頂点配列オブジェクトはWebGL1ではオプションですが、WebGL2では標準です。
[WebGL2では常に使われるべきだと思います](webgl1-to-webgl2.html#Vertex-Array-Objects)。
webglfundamentals.orgでは、頂点配列オブジェクトを利用するためには[ポリフィルが必要です](https://github.com/greggman/oes-vertex-array-object-polyfill)。
ほぼ全てのケースでマイナス要素がなく、コードが簡単で効率的になります。

## その他の細かい変更点

* 多くのサンプルを少し再構成し、一般的なパターンに変更

   ほとんどのアプリでは描画ループ処理の中でブレンディング、カリング、デプステストなどのグローバルなWebGLの状態を設定するのが一般的です。webglfundamentals.orgでは初期化時に設定していました。

* 全てのサンプルでビューポート（viewport）追加に変更

   webglfundamentals.orgではビューポートを省きました。
   実際には必要ないですが、現実の世界ではこのコードで必要です。

* jqueryを削除

   私が始めた頃はまだ `<input type="range">` をサポートする事は一般的でなかったですが、今ではどこでもサポートされています。

* 全てのヘルパー関数にプレフィックスをつけるように変更

   以前はこのようなコードです。

       var program = createProgramFromScripts(...)

   今はこうなりました。

       webglUtils.createProgramFromSources(...);

   これでどんな機能か、どこにあるのか明確になるかと思います。

## 次は何をするか

webglfundamentalsの例に合わせるように変更すべきかどうかを議論しました。
既存の事例や記事全てを編集するのに数週間かかりましたが、しっかりとした作業ができました。
ブラウザは自動更新なので、12ヶ月以内にWebGL1はWebGL2に置き換えられると思います。
FirefoxとChromeは、デスクトップとAndroidのユーザーの大部分でWebGL2をカバーする予定です。
AppleとMicrosoftがSafari macOS、Safari iOS、EdgeにWebGL2のサポートを追加すれば、
大多数の人々がカバーされて開発者もWebGL2に移行できるでしょう。

時間を見つけて記事を増やしていきたいと思います。
上記の点で、今後は新しい記事は全てWebGL2のみになると思います。
