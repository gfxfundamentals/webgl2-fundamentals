Title: WebGL2の使い方
Description: WebGL2対応ブラウザの取得
TOC: WebGL2の使い方

2020年5月現在、WebGL2はChrome、Edge、Firefox、Operaの最新バージョンで利用可能です。

[Can I use...](https://caniuse.com/#feat=webgl2)によるとインターネット利用者の7割以上を占めています。

Safariは実験的な機能でWebGL2を持っていると主張していますが、それはほとんどが誇張です。
私に言える事は、SafariがGLSL ES 3.00のシェーダーを有効にしただけです。
[WebKitのソースコード](https://svn.webkit.org/repository/webkit/trunk/Source/WebCore/html/canvas/WebGL2RenderingContext.cpp)を見ると、ほとんどのWebGL2固有のAPI関数は2019年11月現在、**NOT IMPLEMENTED** とマークされています。

```js
void WebGL2RenderingContext::texStorage3D(GC3Denum, GC3Dsizei, GC3Denum, GC3Dsizei, GC3Dsizei, GC3Dsizei)
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] texStorage3D()");
}

void WebGL2RenderingContext::texImage3D(GC3Denum, GC3Dint, GC3Dint, GC3Dsizei, GC3Dsizei, GC3Dsizei, GC3Dint, GC3Denum, GC3Denum, GC3Dint64)
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] texImage3D()");
}

...

void WebGL2RenderingContext::uniform1ui(WebGLUniformLocation*, GC3Duint)
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] uniform1ui()");
}

void WebGL2RenderingContext::uniform2ui(WebGLUniformLocation*, GC3Duint, GC3Duint)
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] uniform2ui()");
}

...

void WebGL2RenderingContext::vertexAttribI4uiv(GC3Duint, Uint32List&&)
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] vertexAttribI4uiv()");
}

void WebGL2RenderingContext::vertexAttribIPointer(GC3Duint, GC3Dint, GC3Denum, GC3Dsizei, GC3Dint64)
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] vertexAttribIPointer()");
}

...

void WebGL2RenderingContext::beginQuery(GC3Denum, WebGLQuery&)
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] beginQuery()");
}

RefPtr<WebGLSampler> WebGL2RenderingContext::createSampler()
{
    LOG(WebGL, "[[ NOT IMPLEMENTED ]] createSampler()");
    return nullptr;
}
```
