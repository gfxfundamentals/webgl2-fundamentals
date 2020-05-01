Title: How to use WebGL2
Description: Getting a WebGL2 capable browser
TOC: How to use WebGL2

As of May 2020, WebGL2 is available in the latest versions of Chrome, Edge,
Firefox and Opera.

This accounts for over 70% of all internet users, according to
[Can I use...](https://caniuse.com/#feat=webgl2)

Note that Safari claims to have WebGL2 as an experiment but that is mostly
an exaggeration. AFAICT all Safari did was enable GLSL ES 3.00 shaders. Looking
at [the WebKit source code](https://svn.webkit.org/repository/webkit/trunk/Source/WebCore/html/canvas/WebGL2RenderingContext.cpp)
pretty much all of the WebGL2 specific API functions
are marked as **NOT IMPLEMENTED** as of November 2019.

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
