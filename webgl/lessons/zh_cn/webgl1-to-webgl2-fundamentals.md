Title: 相较于WebGLFundamentals.org的不同之处
Description: WebGLFundamentals.org和WebGL2Fundamentals.org的区别
TOC: WebGLFundamentals.org和WebGL2Fundamentals.org的区别


如果你之前阅读过[webglfundamentals.org](https://webglfundamentals.org)你应该意识到有一些差异。

## 多行模版字面量

webglfundamentals.org上所有的着色器代码都是用非javascript `<script>` 标签存储的。

    <script id="vertexshader" type="not-js">;
    shader
    在这里
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

webgl2fundamentals.org上，我已经改用多行模版字面量

    var vertexShaderSource = `
    shader
    在这里
    `;

所有支持WebGL的浏览器除了IE11都支持多行模版字面量。如果你需要针对IE11，考虑使用[babel](https://babeljs.io)转移。

## 所有着色器使用GLSL 300 es版本

我转换所有的着色器到GLSL 300 es版本。如果你不打算使用WebGL2着色器，我找不到使用WebGL2有什么意义。

## 所有的例子都使用顶点数组对象

顶点数组对象是WebGL1的可选特性，但是是WebGL2的标准特性。 [我认为它们应该使用在任何地方](webgl1-to-webgl2.html#Vertex-Array-Objects).
事实上，我甚至想我应该回到webglfundamentals.org，在任何地方使用他们，用[polyfill](https://github.com/greggman/oes-vertex-array-object-polyfill)
对于少数不支持它们的地方。这让你的代码在所有情况下，更简单，更高效。

## 另一些小的变化

*  我尝试稍微重构了我的例子，来展示最常见的模式。

   例如，许多程序通常在渲染循环中设置像混合，剔除，深度检测这些全局WebGL状态，因为这些状态通常变化许多次，webglfundamentals.org上我在初始阶段设置它们，因为它们只需要设置一次，但是这不是一个常见的模式。

*  我在所有例子中设置视口。

   在webglfundamentals.org中没有这样做，因为例子实际上不需要这么做，但几乎所有现实世界的代码都需要它。

*  我移除了jquery。

   回到当我开始写它时，对于`<input type="range">`的支持不是很常见，但是现在任何地方都支持它。 

*  我让所有的帮助函数都有一个前缀代码，就像


       var program = createProgramFromScripts(...)

   现在是

       webglUtils.createProgramFromSources(...);

   我希望这能更明确地说明这些函数，和在哪里能找到它们。

## 下一步是什么

我怀疑要不要更改所有的webglfundamentals的例子来匹配。这花费了几周时间来编辑现有的例子和文章。我感觉12个月内，WebGL1大部分会被WebGL2取代，因为所有浏览器都正在自动更新。Firefox和Chrome会很快推出支持WebGL2版本，覆盖大部分的桌面用户和Android。如果Apple和Microsoft增加WebGL2支持到Safari macOS， Safari iOS和Edge，之后绝大多数的用户都被覆盖，我们可以只使用WebGL2。

希望我能抽出时间添加更多的文章。鉴于上述观点，我认为现在开始的新文章都只用WebGL2。


