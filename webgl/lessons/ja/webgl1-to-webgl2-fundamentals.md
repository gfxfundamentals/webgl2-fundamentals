Title: WebGLFundamentals.orgからの違い
Description: WebGLFundamentals.orgとWebGL2Fundamentals.orgの違い
TOC: WebGLFundamentals.orgとWebGL2Fundamentals.orgの違い

[webglfundamentals.org](https://webglfundamentals.org)を読んだ方は、いくつかの違いがあるので注意して下さい。

## 複数行のテンプレートリテラル

webglfundamentals.orgでは、ほとんど全てのスクリプトはjavascriptではない `<script>` タグに格納されています。

    <script id="vertexshader" type="not-js">;
    shader
    goes
    here
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

webgl2fundamentals.orgでは、複数行のテンプレートリテラルに切り替えました。

    var vertexShaderSource = `
    shader
    goes
    here
    `;

複数行のテンプレートリテラルは、IE11を除く全てのWebGL対応ブラウザでサポートされています。
IE11をターゲットにする場合は、[babel](https://babeljs.io)のようなトランスパイラの使用を検討して下さい。

## 全てのシェーダーでGLSL 300 esを使用しています

シェーダーを全てGLSL 300 esに切り替えました。
WebGL2のシェーダーを使わない場合、WebGL2を使う必要がないと考えました。

## 全てのサンプルで頂点配列オブジェクトを使用しています

頂点配列オブジェクトはWebGL1ではオプションの機能ですが、WebGL2の標準機能です。
[WebGL2では常に使われるべきだと思います](webgl1-to-webgl2.html#Vertex-Array-Objects)。
webglfundamentals.orgでは、頂点配列オブジェクトが利用するために[ポリフィルを使う必要があります](https://github.com/greggman/oes-vertex-array-object-polyfill)。
ほぼ全てのケースでマイナス面がゼロで、コードがもっと簡単で効率的になる事は間違いありません。

## その他の細かい変更点

* 多くのサンプルを少しだけ再構成し、一般的なパターンにしてみました

   ほとんどのアプリでは、レンダリングループの中でブレンディング、カリング、デプステストなどのグローバルなWebGLの状態を設定するのが一般的です。webglfundamentals.orgでは初期化時に設定していました。

* 全てのサンプルでビューポートを設定しました

   webglfundamentals.orgでは、ビューポートを省きました。
   実際には必要ないですが、現実の世界ではこのコードで必要です。

* jqueryを削除しました

   私が始めた頃はまだ `<input type="range">` をサポートする事は一般的でなかったですが、今ではどこでもサポートされています。

* 全てのヘルパー関数にプレフィックスをつけるようにしました

   以前はこのようなコードです。

       var program = createProgramFromScripts(...)

   今はこうなりました。

       webglUtils.createProgramFromSources(...);

   これでどんな機能か、どこにあるのか明確になるかと思います。

## 次は何をするか

webglfundamentalsの例にマッチするように、変更すべきかしないかを議論しました。
既存の事例や記事全てを編集するのに数週間かかりましたが、しっかりとした作業ができました。
ブラウザは自動更新なので、12ヶ月以内にWebGL1はWebGL2に置き換えられると感じています。
FirefoxとChromeは、デスクトップとAndroidのユーザーの大部分でWebGL2をカバーする予定です。
AppleとMicrosoftがSafari macOS、Safari iOS、EdgeにWebGL2のサポートを追加すれば、
大多数の人がカバーされて開発者もWebGL2に移行できるでしょう。

時間を見つけて記事を増やしていきたいと思います。
上記の点で、今後は新しい記事は全てWebGL2のみになると思います。
