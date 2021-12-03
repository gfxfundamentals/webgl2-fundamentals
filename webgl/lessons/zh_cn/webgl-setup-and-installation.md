Title: WebGL2 设置和安装
Description: 如何进行 WebGL 的开发
TOC: 设置和安装

事实上，开发 WebGL 只需要一个网页浏览器。
你可以用[jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/)、[jsbin.com](https://jsbin.com)或[codepen.io](https://codepen.io/greggman/pen/YGQjVV)当本教程的学习环境。

如果你想在之前的网站里引用外部脚本，只需要添加一对`<script src="..."></script>`标签。

但这么做有一些限制。WebGL 在使用图片上有着比 Canvas2D 更强的限制，就是说 WebGL 不能随意使用网络获图像，
还有一点需要注意的是 WebGL 读取本地数据的速度很快。

如果你想运行和编辑本站示例，首先下载本网站。[你可以从这里下载](https://github.com/gfxfundamentals/webgl2-fundamentals/tree/gh-pages).

{{{image url="resources/download-webglfundamentals.gif" }}}

解压缩文件到任一文件夹。

## 使用一个简单易用的 Web Server

下一步你需要搭建一个简单的 web 服务器。我知道“web 服务器”听起来很吓人，但搭建[web 服务器实际上是非常简单的](https://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

如果你使用的是 Chrome 浏览器，这有一个扩展[Servez](https://greggman.github.io/servez).

{{{image url="resources/servez.gif" }}}

只需选择解压后的文件夹，点击“Start”，然后在地址 [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/) 中选择例子。

如果你更喜欢使用命令行，另一种方法是使用[node.js](https://nodejs.org)。
在下载并安装后，打开命令行/控制台/终端窗口。
如果你是 Windows 系统，安装过程会提示你额外安装“Node Command Prompt”，同意就可以了。

然后通过输入如下内容安装 [`servez`](https://github.com/greggman/servez-cli)

    npm -g install servez

如果你用的是 OSX 系统

    sudo npm -g install servez

完成安装后接着输入

    servez 你/的/文/件/解/压/地/址

然后应该显示类似的东西

{{{image url="resources/servez-response.png" }}}

最后你就可以在你的网页浏览器里访问 [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/).

如果你不指定路径，servez 会使用当前所在文件夹。

## 使用浏览器中的开发者工具

大多数浏览器都内置了大量的开发者工具。

{{{image url="resources/chrome-devtools.png" }}}

[Chrome 浏览器的使用文档在这里](https://developers.google.com/web/tools/chrome-devtools/),
[Firefox 浏览器的在这](https://developer.mozilla.org/en-US/docs/Tools).

这有个简单的使用技巧：若是没有显示任何内容就查看 JavaScript 控制台，如果有什么问题的话控制台上面通常都有错误信息。
通过仔细的阅读错误信息可以帮你确定问题的根源。

{{{image url="resources/javascript-console.gif" }}}

## WebGL Lint

[这](https://greggman.github.io/webgl-lint/) 是一个可以检查几个 webgl 错误的脚本。只需要在其他脚本之前把它添加到页面中

```
<script src="https://greggman.github.io/webgl-lint/webgl-lint.js"></script>
```

如果它捕捉到了 WebGL 错误，你的程序会抛出异常，你可以打印更多的消息

[您还可以为 webgl 资源命名](https://github.com/greggman/webgl-lint#naming-your-webgl-objects-buffers-textures-programs-etc)
(缓冲区、纹理、着色器、程序...) 以便在收到错误消息时包含与错误相关的资源名称。

## 扩展

有各种 WebGL 检查器。
[这是 Chrome 和 Firefox 的一个](https://spector.babylonjs.com/)。

{{{image url="https://camo.githubusercontent.com/5bbc9caf2fc0ecc2eebf615fa8348146b37b08fe/68747470733a2f2f73706563746f72646f632e626162796c6f6e6a732e636f6d2f70696374757265732f7469746c652e706e67" }}}

注意：[阅读文档](https://github.com/BabylonJS/Spector.js/blob/master/readme.md)！

spector.js 的扩展版本捕获帧。 这意味着它只有在您的 WebGL 应用程序成功初始化自身然后在
`requestAnimationFrame` 循环中呈现时才有效 。 您单击“记录”按钮， 它会捕获一“帧”的所有 WebGL API 调用。

这意味着如果没有一些工作，它将无法帮助您在初始化期间发现问题。

要解决这个问题，有 2 种方法。

1. 将其用作库，而不是扩展。

    请参阅 [文档](https://github.com/BabylonJS/Spector.js/blob/master/readme.md)。 通过这种方式，您可以告诉它“立即捕获 WebGL API 命令！”

2. 更改您的应用程序，使其在您单击按钮之前不会启动。

    这样您就可以转到扩展程序并选择“记录”，然后启动您的应用程序。如果您的应用没有动画，那么只需添加一些假框架。例子：

```html
<button type="button">开始</button> <canvas id="canvas"></canvas>
```

```js
function main() {
    // 获取 WebGL 上下文
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector('#canvas')
    const gl = canvas.getContext('webgl')
    if (!gl) {
        return
    }

    const startElem = document.querySelector('button')
    startElem.addEventListener('click', start, { once: true })

    function start() {
        // 在 RAF 中运行初始化，因为 spector 只捕获内部 RAF 事件
        requestAnimationFrame(() => {
            // 做所有的初始化
            init(gl)
        })
        // 制作更多帧，以便 spector 可以查看。
        requestAnimationFrame(() => {})
        requestAnimationFrame(() => {})
        requestAnimationFrame(() => {})
    }
}

main()
```

现在您可以在 spector.js 扩展中点击“记录”，然后在您的页面中点击“开始”，spector 将记录您的初始化。

Safari 也有一个类似的内置功能， [类似的解决方法类似的问题](https://stackoverflow.com/questions/62446483/debugging-in-webgl)。

我经常会在绘制中加调试断点，用来查看 uniform 变量。
如果我看到一堆`NaN`(NaN = 不是一个数字) 就会跟踪设置 uniform 变量的部分以便找到错误代码。

## 检查代码

还有永远记住你可以检查代码。您通常可以选择查看源

{{{image url="resources/view-source.gif" }}}

即使您无法右键单击页面或源文件位于单独的文件中，您也始终可以在开发者工具中查看源文件

{{{image url="resources/devtools-source.gif" }}}

## 开始学习

希望这有助于你完成准备工作以便开始接下来的学习。[现在回到教程](index.html).
