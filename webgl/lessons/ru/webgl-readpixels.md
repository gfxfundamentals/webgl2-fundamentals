Title: WebGL2 readPixels
Description: Детали о readPixels
TOC: readPixels

В WebGL вы передаете пару format/type в `readPixels`. Для данного
внутреннего формата текстуры (прикрепленной к framebuffer), только 2 комбинации
format/type являются действительными.

Из спецификации:

> Для нормализованных поверхностей рендеринга с фиксированной точкой принимается комбинация format `RGBA` и type
`UNSIGNED_BYTE`. Для поверхностей рендеринга со знаковыми целыми числами принимается комбинация
format `RGBA_INTEGER` и type `INT`. Для поверхностей рендеринга с беззнаковыми целыми числами
принимается комбинация format `RGBA_INTEGER` и type `UNSIGNED_INT`.

Вторая комбинация определяется реализацией
<span style="color:red;">что, вероятно, означает, что вы не должны использовать ее в WebGL, если хотите, чтобы ваш код был переносимым</span>.
Вы можете спросить, какая комбинация format/type, запросив

```js
// предполагая, что framebuffer привязан с текстурой для чтения
const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

Также обратите внимание, что форматы текстур, которые являются рендерируемыми, что означает, что вы можете прикрепить их к framebuffer и рендерить в них,
также в некоторой степени определяются реализацией.
WebGL2 перечисляет [много форматов](webgl-data-textures.html), но некоторые являются опциональными (`LUMINANCE`, например) и некоторые
не являются рендерируемыми по умолчанию, но могут быть сделаны рендерируемыми через расширение. (`RGBA32F`, например).

**Таблица ниже живая**. Вы можете заметить, что она дает разные результаты в зависимости от машины, ОС, GPU или даже
браузера. Я знаю, что на моей машине Chrome и Firefox дают разные результаты для некоторых значений, определяемых реализацией.

<div class="webgl_center" data-diagram="formats"></div>

<script src="../resources/twgl-full.min.js"></script>
<script src="resources/webgl-readpixels.js"></script> 