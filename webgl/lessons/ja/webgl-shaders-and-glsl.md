Title: WebGLシェーダーとGLSL
Description: シェーダーとGLSLとは？
TOC: シェーダーとGLSL

この記事は[WebGL2の基本](webgl-fundamentals.html)からの続きです。
WebGLの仕組みを読んでいない場合は[まずこれを読んでみて下さい](webgl-how-it-works.html)。

シェーダーやGLSLの話はしましたが、詳細な話はしていませんでした。
これまでのサンプルコードで雰囲気を掴めたと思いますが、念のために明確に理解できるように説明します。

[WebGLの仕組み](webgl-how-it-works.html)で説明したように何か描画する度に2つのシェーダーが必要です。
2つのシェーダーとは *頂点シェーダー* と *フラグメントシェーダー* の事です。
それぞれのシェーダーは *関数* です。
頂点シェーダーとフラグメントシェーダーはシェーダープログラム（またはプログラムとも呼ぶ）にリンクされています。
一般的なWebGLアプリでは複数のシェーダープログラムを持ちます。

## 頂点シェーダー（Vertex Shader）

頂点シェーダーの役割はクリップ空間座標を生成する事です。頂点シェーダーは常に以下のようなコードになります。

    #version 300 es
    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

シェーダーは頂点ごとに1回呼び出されます。
呼び出されたらグローバル変数の `gl_Position` にクリップ空間座標を設定します。

頂点シェーダーは入力データが必要です。頂点シェーダーがデータを受け取る方法は3種類あります。

1. [属性](#attributes) (バッファから取得されるデータ)
2. [ユニフォーム](#uniforms) (1回の描画の間で全ての頂点で共通の値を持つデータ)
3. [テクスチャ](#textures-in-vertex-shaders) (ピクセル/テクセルから読み込まれるデータ)

### 属性（attribute）

頂点シェーダーでデータを取得する最も一般的な方法は、バッファと *属性* を使う方法です。
バッファと属性については[WebGL2の基本](webgl-how-it-works.html)で説明しました。
まずはバッファを作成します。

    var buf = gl.createBuffer();

次にバッファにデータを入れます。

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

そして、作ったシェーダープログラムから属性のロケーションを調べます。

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

最後にバッファからデータをどのように属性に渡すか指定します。

    // turn on getting data out of a buffer for this attribute
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;
    var normalize = false;  // leave the values as they are
    var offset = 0;         // start at the beginning of the buffer
    var stride = 0;         // how many bytes to move to the next vertex
                            // 0 = use the correct stride for type and numComponents

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

[WebGL2の基本](webgl-fundamentals.html)ではシェーダーで計算せずに直接データを渡していました。

    #version 300 es

    in vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

バッファにクリップ空間の頂点を入れておけば動作するでしょう。

属性の型として `float`、`vec2`、`vec3`、`vec4`、`mat2`、`mat3`、`mat4`、`int`、`ivec2`、`ivec3`、`ivec4`、`uint`、`uvec2`、`uvec3`、`uvec4` を利用できます。

### ユニフォーム（uniform）

頂点シェーダーのユニフォームは頂点シェーダーに渡される値です。
描画呼び出し（ドローコール）中の全ての頂点に対して同じ値を持ちます。
簡単な例として上記の頂点シェーダーにオフセットを追加できます。

    #version 300 es

    in vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

これで全ての頂点で同じオフセットが加算でき図形が平行移動します。
最初にユニフォームのロケーションを調べます。

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

そして、描画する前にユニフォームを設定します。

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // offset it to the right half the screen

ユニフォームには多くの種類があります。
データをセットする際には、シェーダープログラム側のユニフォームの定義に合う適切な関数を呼び出す必要があります。

    gl.uniform1f (floatUniformLoc, v);                 // for float
    gl.uniform1fv(floatUniformLoc, [v]);               // for float or float array
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // for vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // for vec2 or vec2 array
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // for vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // for vec3 or vec3 array
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // for vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // for vec4 or vec4 array

    gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // for mat2 or mat2 array
    gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // for mat3 or mat3 array
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // for mat4 or mat4 array

    gl.uniform1i (intUniformLoc,   v);                 // for int
    gl.uniform1iv(intUniformLoc, [v]);                 // for int or int array
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // for ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // for ivec2 or ivec2 array
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // for ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // for ivec3 or ivec3 array
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // for ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // for ivec4 or ivec4 array

    gl.uniform1u (intUniformLoc,   v);                 // for uint
    gl.uniform1uv(intUniformLoc, [v]);                 // for uint or uint array
    gl.uniform2u (ivec2UniformLoc, v0, v1);            // for uvec2
    gl.uniform2uv(ivec2UniformLoc, [v0, v1]);          // for uvec2 or uvec2 array
    gl.uniform3u (ivec3UniformLoc, v0, v1, v2);        // for uvec3
    gl.uniform3uv(ivec3UniformLoc, [v0, v1, v2]);      // for uvec3 or uvec3 array
    gl.uniform4u (ivec4UniformLoc, v0, v1, v2, v4);    // for uvec4
    gl.uniform4uv(ivec4UniformLoc, [v0, v1, v2, v4]);  // for uvec4 or uvec4 array

    // for sampler2D, sampler3D, samplerCube, samplerCubeShader, sampler2DShadow,
    // sampler2DArray, sampler2DArrayShadow
    gl.uniform1i (samplerUniformLoc,   v);
    gl.uniform1iv(samplerUniformLoc, [v]);

上記以外にも `bool`、`bvec2`、`bvec3`、`bvec4` という型もあります。
これは `gl.uniform?f?` や `gl.uniform?i?`、`gl.uniform?u?` で使う事ができます。

ユニフォームが配列で定義されている場合、その値を1度にセットできます。例えば以下のようになります。

    // in shader
    uniform vec2 u_someVec2[3];

    // in JavaScript at init time
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // at render time
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // set the entire array of u_someVec2

しかし、配列の要素を個別に設定したい場合、各要素のロケーションを個別に調べる必要があります。

    // in JavaScript at init time
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // at render time
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // set element 0
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // set element 1
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // set element 2

また、構造体を利用する事もできます。

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

構造体を使う場合、ロケーションの取得は構造体の要素1つずつに行えます。

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### 頂点シェーダーでのテクスチャの利用

テクスチャの利用は[フラグメントシェーダーでのテクスチャの利用](#textures-in-fragment-shaders)で説明します。

## フラグメントシェーダー（Fragment Shader）

フラグメントシェーダーの役割は描画対象のピクセルの色を決定する事です。
フラグメントシェーダーは常に以下のようなコードになります。

    #version 300 es
    precision highp float;

    out vec4 outColor;  // you can pick any name

    void main() {
       outColor = doMathToMakeAColor;
    }

フラグメントシェーダーは1ピクセルごとに1回呼び出されます。
呼び出される度にout変数に何らかの色を設定します。

フラグメントシェーダーもデータが必要です。データを取得する方法は3つあります。

1. [ユニフォーム](#uniforms) (1回の描画の間で全てのピクセルで共通の値を持つデータ)
2. [テクスチャ](#textures-in-fragment-shaders) (ピクセル/テクセルから読み込まれるデータ)
3. [ヴァリイング](#varyings) (頂点シェーダーから渡されるデータ。必要に応じて補間される)

### フラグメントシェーダーのユニフォーム

仕組みは共通で[頂点シェーダーのユニフォーム](#uniforms)を参照して下さい。

### フラグメントシェーダーのテクスチャ

シェーダーでテクスチャから値を取得するには、`sampler2D` ユニフォームを作成してGLSL関数 `texture` で値を取得します。

    precision highp float;

    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5)  // get a value from the middle of the texture
       outColor = texture(u_texture, texcoord);
    }

テクスチャから得られるデータは[様々なWebGLの設定](webgl-3d-textures.html)に依存します。
最低限、テクスチャにデータを作成して配置する必要があります。例えば

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var internalFormat = gl.RGBA,
    var width = 2;
    var height = 1;
    var border = 0; // MUST ALWAYS BE ZERO
    var format = gl.RGBA;
    var type = gl.UNSIGNED_BYTE;
    var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D,
                  level,
                  internalFormat,
                  width,
                  height,
                  border,
                  format,
                  type,
                  data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

次にシェーダープログラムでユニフォームのロケーションを調べます。

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

そして、テクスチャユニットにバインドします。

    var unit = 5;  // Pick some texture unit
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

シェーダーにどのテクスチャユニットを指定したかの情報を渡します。

    gl.uniform1i(someSamplerLoc, unit);

### ヴァリイング（Varying）

ヴァリイングとは頂点シェーダーからフラグメントシェーダーに値を渡す方法です。
これは[WebGLの仕組み](webgl-how-it-works.html)で説明しました。

ヴァリイングを使用するには、頂点シェーダーとフラグメントシェーダーの両方で同じヴァリイングを宣言する必要があります。
頂点シェーダーでヴァリイングの *out* を頂点ごとに値を設定しています。
ピクセル描画時、オプションでこれらの値の間を補間してフラグメントシェーダーでヴァリイングの *in* に渡します。

頂点シェーダー：

    #version 300 es

    in vec4 a_position;

    uniform vec4 u_offset;

    +out vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

フラグメントシェーダー：

    #version 300 es
    precision highp float;

    +in vec4 v_positionWithOffset;

    out vec4 outColor;

    void main() {
    +  // convert from clipsapce (-1 <-> +1) to color space (0 -> 1).
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5;
    +  outColor = color;
    }

上記のコード例は実用的でないです。
一般的には、クリップ空間座標の値を直接フラグメントシェーダーにコピーして色として使う事はありません。
それにも関わらずそれは動作して色を生成します。

## GLSL

GLSLは[Graphics Library Shader Language](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf)の略です。
シェーダーが書かれている言語の事です。
GLSLにはJavaScriptにない独特な特殊機能があります。
グラフィクスのラスタライズで必要となる計算に特化した設計になっています。
例えば `vec2` や `vec3` や `vec4` のような型が組み込まれています。
それぞれ2つの値、3つの値、4つの値を表します。
同様に2 x 2、3 x 3、4 x 4の行列を表す `mat2`、`mat3`、`mat4` もGLSLに組み込まれています。
`vec` をスカラで乗算できます。

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b is now vec4(2, 4, 6, 8);

同様に行列の乗算とベクトルから行列の乗算を行えます。

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

また、vecのための様々なセレクタを持っています。例えばvec4の場合

    vec4 v;

*   `v.x` は `v.s` や `v.r` や `v[0]` と同じ意味です。
*   `v.y` は `v.t` や `v.g` や `v[1]` と同じ意味です。
*   `v.z` は `v.p` や `v.b` や `v[2]` と同じ意味です。
*   `v.w` は `v.q` や `v.a` や `v[3]` と同じ意味です。

これにより、vecのコンポーネントの入れ替え(swizzleなどと表現される)は容易です。
入れ替えだけでなく同じ要素を繰り返すこともできます。例えば

    v.yyyy

と

    vec4(v.y, v.y, v.y, v.y)

は同じ値です。同様に

    v.bgra

は

    vec4(v.b, v.g, v.r, v.a)

と同じ値になります。
vecやmatの値を定義する際には複数の要素を一度に記述する事もできます。例えば

    vec4(v.rgb, 1)

と書けば

    vec4(v.r, v.g, v.b, 1)

という意味になります。また

    float f = 1;  // ERROR 1 is an int. You can't assign an int to a float

は

    float f = 1.0;      // use float
    float f = float(1)  // cast the integer to a float

と同じ意味です。

上記の `vec4(v.rgb, 1)` の例では、`float(1)` と同様に `vec4` が内部のものをキャストしているので `1` でエラーは出ません。

GLSLには多くのビルトイン関数があります。
それらの多くは1度に複数のコンポーネントで動作します。
例えば、角度(angle)から正弦(sine)を計算する関数は

    T sin(T angle)

T は `float`、`vec2`、`vec3`、`vec4` のいずれかである事を意味します。
`vec4` を渡すと `vec4` が返ってきます。言い換えれば `v` が `vec4` であれば

    vec4 s = sin(v);

は、以下と同じに解釈されます。

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

1つの引数がfloatで残りが `T` という場合もあります。
この場合はfloatが全体に適用されます。
例えばv1とv2がvec4型、fがfloat型だとして

    vec4 m = mix(v1, v2, f);

以下と同じです。

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

[OpenGL ES 3.0リファレンスカード](https://www.khronos.org/files/opengles3-quick-reference-card.pdf)の最後の3ページにあるGLSLの全関数リストが見れます。
本当に辛口で冗長なものが好きな方は[GLSL ES 3.00 spec](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf)を試してみて下さい。

## まとめ

WebGLは様々なシェーダーを作成しシェーダーにデータを供給します。
`gl.drawArrays` や `gl.drawElements` を呼び出して、各頂点に対して現在の頂点シェーダーを呼び出して頂点を処理し、
各ピクセルに対して現在のフラグメントシェーダーを呼び出しピクセルをレンダリングします。

実際にシェーダーを作成するには数行のコードが必要です。
これらの行のほとんどはWebGLプログラムで同じで1度書けばほとんど無視できます。
[GLSLシェーダーをコンパイルしてシェーダプログラムにリンクする方法はこちら](webgl-boilerplate.html)を参照してみて下さい。

ここからスタートするなら2つの方向に行けます。
画像処理に興味がある方には[二次元画像処理の仕方](webgl-image-processing.html)を読んで下さい。
もしあなたが移動、回転、拡大縮小に興味があれば[ここから始めて下さい](webgl-2d-translation.html)。
