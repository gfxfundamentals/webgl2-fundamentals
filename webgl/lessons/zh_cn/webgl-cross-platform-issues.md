Title: WebGL2 跨平台问题
Description: Things to be aware of when trying to make your WebGL app work everywhere.
TOC: 跨平台问题

你也许早就知道，并不所有 WebGL 程序都能在所有设备或浏览器上运行。

以下是我脑海中能想到的大多数可能遇到的问题列表。

## 性能

高端 GPU 的运行速度可能是低端 GPU 的 100 倍。
我知道的唯一解决方法是要么把目标定得低一些，要么像大多数桌面程序那样提供性能与画质的选项供用户选择。

## 内存

同样，高端 GPU 可能拥有 12 到 24 GB 的内存，  
而低端 GPU 可能不到 1 GB。  
（我年纪大了，觉得“低端 = 1GB”已经很神奇了，  
因为我最初是在只有 16K 到 64K 内存的机器上编程的 😜）

## 设备限制

WebGL 规定了各种最低支持特性，但你本地的设备可能支持  
> 高于这个最低标准的能力，这意味着代码可能会在其他支持较少的设备上运行失败。

一些示例包括：

* 允许的最大纹理尺寸

  2048 或 4096 被认为是比较合理的限制。至少截至 2020 年，  
  看起来[99% 的设备支持 4096，但只有 50% 支持大于 4096 的尺寸](https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE)。

  注意：最大纹理尺寸是 GPU 可以处理的最大维度。  
  它并不意味着 GPU 有足够的内存来存储该维度平方（对于 2D 纹理）或立方（对于 3D 纹理）大小的数据。  
  例如，某些 GPU 最大尺寸为 16384，但一个每边都是 16384 的 3D 纹理将需要 16 TB 的内存！！！

* 单个程序中支持的最大顶点属性数量

  在 WebGL1 中，最低支持为 8 个；在 WebGL2 中为 16 个。  
  如果你使用的数量超过这些，那么在只有最小支持能力的设备上，代码就会失败。

* 支持的最大 uniform 向量数量

  这些数量在顶点着色器和片段着色器中是分别指定的。

  WebGL1 中，顶点着色器为 128，片段着色器为 16  
  WebGL2 中，顶点着色器为 256，片段着色器为 224

  注意，uniform 是可以被“打包(packed)”的，上面的数字表示你可以使用的 `vec4` 数量。  
  理论上你可以使用 4 倍数量的 `float` 类型 uniform，  
  但这依赖于打包算法。你可以将这个空间想象成一个 4 列的数组，  
  每一行对应一个最大 uniform 向量。

     ```
     +-+-+-+-+
     | | | | |   <- one vec4
     | | | | |   |
     | | | | |   |
     | | | | |   V
     | | | | |   max uniform vectors rows
     | | | | |
     | | | | |  
     | | | | |
     ...

     ```

  首先会分配 `vec4`，其中一个 `mat4` 占用 4 个 `vec4`。  
  然后是将 `vec3` 填入剩余空间，接着是 `vec2`，最后是 `float`。
  所以假设我们有：1 个 `mat4`，2 个 `vec3`，2 个 `vec2` 和 3 个 `float`

     ```
     +-+-+-+-+
     |m|m|m|m|   <- the mat4 takes 4 rows
     |m|m|m|m|
     |m|m|m|m|
     |m|m|m|m|
     |3|3|3| |   <- the 2 vec3s take 2 rows
     |3|3|3| |
     |2|2|2|2|   <- the 2 vec2s can squeeze into 1 row 
     |f|f|f| |   <- the 3 floats fit in one row
     ...

     ```

  此外，uniform 数组总是按“垂直”方式分布的，例如如果最大允许的 uniform 向量是 16，那么你就不能拥有一个 17 元素的 `float` 数组。  
  实际上，如果你有一个 `vec4`，它将占据整整一行，也就是说只剩下 15 行，因此你最多只能拥有 15 个元素的数组。

  不过我的建议是：不要指望完美的打包。尽管规范中说明上面那个打包算法是必须支持的，  
  但组合太多，无法测试所有驱动都正确实现了它。  
  只要你知道自己正在接近上限即可。

  注意：varyings 和 attributes 是无法打包的。

* 最大 varying 向量数

  WebGL1 的最小值是 8，WebGL2 是 16。

  如果你使用的数量超过了这个限制，那么代码将在只支持最低值的设备上无法运行。

* 最大纹理单元数

  这里有三个相关值：

  1. 一共有多少个纹理单元
  2. 顶点着色器最多可以引用多少个纹理单元
  3. 片段着色器最多可以引用多少个纹理单元

  <table class="tabular-data">
    <thead>
      <tr><th></th><th>WebGL1</th><th>WebGL2</th></tr>
    </thead>
    <tbody>
      <tr><td>最少存在的纹理单元数量</td><td>8</td><td>32</td></tr>
      <tr><td>顶点着色器最少可引用的纹理单元数量</td><th style="color: red;">0！</th><td>16</td></tr>
      <tr><td>片段着色器最少可引用的纹理单元数量</td><td>8</td><td>16</td></tr>
    </tbody>
  </table>

  需要特别注意的是，WebGL1 中顶点着色器的纹理单元数量是 **0**。  
  不过这可能并不是什么致命问题。  
  显然，[大约 97% 的设备至少支持 4 个](https://web3dsurvey.com/webgl/parameters/MAX_VERTEX_TEXTURE_IMAGE_UNITS)。  
  尽管如此，你可能还是希望进行检测，以便在不兼容时提醒用户应用无法运行，  
  或者退回到其他着色器方案。

此外还有其他一些限制。要查看这些限制，你可以使用以下参数调用 `gl.getParameter`。


<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_TEXTURE_SIZE                </td><td>纹理的最大尺寸</td></tr>
    <tr><td>MAX_VERTEX_ATTRIBS              </td><td>可用的顶点属性数量</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_VECTORS      </td><td>顶点着色器中可用的 vec4 uniform 数量</td></tr>
    <tr><td>MAX_VARYING_VECTORS             </td><td>可用的 varying 数量</td></tr>
    <tr><td>MAX_COMBINED_TEXTURE_IMAGE_UNITS</td><td>存在的纹理单元总数</td></tr>
    <tr><td>MAX_VERTEX_TEXTURE_IMAGE_UNITS  </td><td>顶点着色器可引用的纹理单元数</td></tr>
    <tr><td>MAX_TEXTURE_IMAGE_UNITS         </td><td>片段着色器可引用的纹理单元数</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_VECTORS    </td><td>片段着色器中可用的 vec4 uniform 数量</td></tr>
    <tr><td>MAX_CUBE_MAP_TEXTURE_SIZE       </td><td>立方体贴图的最大尺寸</td></tr>
    <tr><td>MAX_RENDERBUFFER_SIZE           </td><td>渲染缓冲区的最大尺寸</td></tr>
    <tr><td>MAX_VIEWPORT_DIMS               </td><td>视口的最大尺寸</td></tr>
  </tbody>
</table>
</div>


这并不是完整的列表。例如最大点大小和最大线宽也有限制，但你基本可以假设最大线宽就是 1.0，而 POINTS 通常只适用于不在意[裁剪问题](#points-lines-viewport-scissor-behavior)的简单演示。


WebGL2 增加了更多限制。几个常见的如下：

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_3D_TEXTURE_SIZE                </td><td>3D 纹理的最大尺寸</td></tr>
    <tr><td>MAX_DRAW_BUFFERS              </td><td>可用的颜色附件数量</td></tr>
    <tr><td>MAX_ARRAY_TEXTURE_LAYERS      </td><td>2D 纹理数组中的最大图层数</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS             </td><td>使用 transform feedback 时可输出到独立缓冲区的 varying 数量</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS</td><td>当输出到单个缓冲区时可输出的 varying 总数</td></tr>
    <tr><td>MAX_COMBINED_UNIFORM_BLOCKS  </td><td>所有着色器中可使用的 uniform block 总数</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_BLOCKS         </td><td>顶点着色器中可用的 uniform block 数量</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_BLOCKS    </td><td>片段着色器中可用的 uniform block 数量</td></tr>
  </tbody>
</table>
</div>

## 深度缓冲区分辨率

一些非常老旧的移动设备使用 16 位深度缓冲区。除此之外，据我所知，99% 的设备都使用 24 位深度缓冲区，  
所以你大概率无需担心这个问题。

## readPixels 的 format/type 组合

只有某些格式/类型组合是强制支持的，其他组合是可选的。  
这个问题在[这篇文章](webgl-readpixels.html)中有详细介绍。

## framebuffer 附件组合

帧缓冲可以附加一个或多个纹理和渲染缓冲对象作为附件。

在 WebGL1 中，只有以下三种附件组合是被保证支持的：

1. 将格式为RGBA、类型为UNSIGNED_BYTE的纹理附加为COLOR_ATTACHMENT0
2. 将格式为RGBA、类型为UNSIGNED_BYTE的纹理附加为COLOR_ATTACHMENT0，同时将格式为DEPTH_COMPONENT的渲染缓冲区附加为DEPTH_ATTACHMENT
3. 将格式为RGBA、类型为UNSIGNED_BYTE的纹理附加为COLOR_ATTACHMENT0，同时将格式为DEPTH_STENCIL的渲染缓冲区附加为DEPTH_STENCIL_ATTACHMENT

所有其他组合都由具体实现决定是否支持。你可以通过调用
`gl.checkFramebufferStatus` 并检查是否返回 `FRAMEBUFFER_COMPLETE` 来验证支持情况。

WebGL2 保证可以写入更多格式，但依然存在**任何组合都有可能失败！**的限制。  
如果你附加了多个颜色附件，最稳妥的方法是确保它们都使用相同的格式。

## 扩展（Extensions）

WebGL1 和 WebGL2 中的许多功能都是可选的。  
`getExtension` 这个 API 的意义就在于它可能失败（如果扩展不存在），  
所以你应该检查它是否返回了有效扩展，而不是盲目假设它总能成功。

在 WebGL1 和 WebGL2 中，最常见缺失的扩展之一是  
`OES_texture_float_linear`，它允许对浮点纹理进行过滤，  
也就是说可以把 `TEXTURE_MIN_FILTER` 和 `TEXTURE_MAG_FILTER`  
设置为除 `NEAREST` 之外的值。很多移动设备并不支持这个扩展。

在 WebGL1 中另一个常缺失的扩展是 `WEBGL_draw_buffers`，  
这个扩展允许将多个颜色附件绑定到一个帧缓冲上。  
在桌面平台上支持率大约是 70%，而在智能手机上几乎没有支持（虽然这听起来不太对）。  
基本上，任何能运行 WebGL2 的设备应该也支持 WebGL1 的 `WEBGL_draw_buffers`，  
但这显然仍然是个潜在问题。  
如果你需要一次性渲染到多个纹理，很可能你的网站就是为高端 GPU 设计的。  
不过你仍应检测用户设备是否支持，并在不支持时给出友好的提示说明。

对于 WebGL1，以下 3 个扩展几乎被所有设备支持，  
所以即使你希望在缺失时警告用户页面无法正常运行，  
这些用户通常是极其老旧的设备，原本也跑不动你的页面：

- `ANGLE_instanced_arrays`：支持[实例化绘制](webgl-instanced-drawing.html)
- `OES_vertex_array_object`：支持将所有 attribute 状态存入对象中，  
  从而通过一次函数调用切换所有状态，见 [这里](webgl-attributes.html)
- `OES_element_index_uint`：允许使用 `UNSIGNED_INT` 类型的 32 位索引，  
  与 [`drawElements`](webgl-indexed-vertices.html) 配合使用

## attribute 位置（attribute locations）

一个较常见的 bug 是没有正确获取 attribute 的位置。

例如你有一个顶点着色器如下：

```glsl
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = matrix * position;
   v_texcoord = texcoord;
}
```

你的代码假设 `position` 是 attribute 0，`texcoord` 是 attribute 1，  
但这是**没有保证的**。所以它在你这能运行，在别人那可能就失败了。  
这类问题往往是因为你没有明确这么指定位置，  
但由于某些代码错误，恰好在你这里按预期的方式分配了位置。

有三种解决方案：

1. 始终使用 `gl.getAttribLocation` 显式查询位置
2. 在调用 `gl.linkProgram` 之前，使用 `gl.bindAttribLocation` 显式绑定位置
3. 仅限 WebGL2：可以直接在 shader 中设置 attribute 的位置，例如：

   ```glsl
   #version 300 es
   layout(location = 0) vec4 position;
   latout(location = 1) vec2 texcoord;
   ...
   ```

  方案 2 看起来是最符合 [D.R.Y. 原则](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) 的，  
  而方案 3 则是最 [W.E.T.（重复）](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself#DRY_vs_WET_solutions) 的——  
  除非你是在运行时生成 shader。

## GLSL 未定义行为

一些 GLSL 函数具有未定义行为。例如，当 `x < 0` 时，`pow(x, y)` 的结果是未定义的。  
更详细的列表见[这篇关于聚光灯照明的文章底部](webgl-3d-lighting-spot.html)。

## Shader 精度问题

截至 2020 年，这方面最大的问题是：  
如果你在着色器中使用了 `mediump` 或 `lowp`，在桌面端 GPU 实际会使用 `highp`，  
但在移动设备上它们真的就是 `mediump` 或 `lowp`。  
这意味着你在桌面开发时可能不会发现任何问题。

详细内容见[这篇文章](webgl-precision-issues.html)。

## 点、线、视口和剪裁行为

在 WebGL 中，`POINTS` 和 `LINES` 的最大尺寸可能就是 1，  
实际上对于 `LINES` 来说，这已成为最常见的限制。  
另外，当点的中心在视口外时是否会被裁剪，是由实现决定的，  
见[这篇文章底部](webgl-drawing-without-data.html#pointissues)。

类似地，视口是否只裁剪顶点、还是同时裁剪像素，也是未定义的。  
但剪裁测试（scissor test）始终裁剪像素。  
因此，如果你设置了比目标区域更小的视口，并且正在绘制 LINES 或 POINTS，  
你应该开启剪裁测试并设置合适的剪裁区域。
