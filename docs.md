WebGL2Fundamentals API Docs
==========================

These docs are an attempt to help explain some of the helper function
used in the articles on [webgl2fundamentals.org](https://webgl2fundamentals.org).

The main ones are in [webgl-utils.js](/webgl/resources/webgl-utils.js) and basically include
just 2 commonly used functions. One is `webglUtils.createProgramsFromScripts`. How it works
[is described here](/webgl/lessons/webgl-boilerplate.html). The other common function is
`webglUtils.resizeCanvasToDisplaySize` which [is described in this lesson](/webgl/lessons/webgl-resizing-the-canvas.html).

There's also another library in a few examples called TWGL. You can find [that library and its documentation
here](https://twgljs.org).

If you're using WebGL to do 2D or 3D you'll likely need many math helper functions
in JavaScript as well.

[Functions for 2D math are here](/docs/module-webgl-2d-math.html).

[Functions for 3D math are here](/docs/module-webgl-3d-math.html).

#JSDoc3 Plea

These docs are generated with [JSDoc3](https://usejsdoc.org/). I find them very confusing to look at
and in some places frustratingly verbose. If you have any experience with JSDoc3 and know how to
make the docs more approachable and useful please [submit a pull request](https://github.com/gfxfundamentals/webgl2-fundamentals)
or [file an issue with details](https://github.com/gfxfundamentals/webgl2-fundamentals/issues).

