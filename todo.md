TO DO
=====

Fix articles

*   webgl-text-glyphs.html
*   add clear to all examples?
*   remove image flipping from examples

List Changes to site

*   math under m3, m4, v3
*   utilties all under name spaces, webglUtils, webglLessonsHelper
*   mostly no jquery
*   multiply order swapped
*   simplifed trans/rot/scale functions added
*   using template strings instead of script tags
*   all shaders using #version 300 es
*   all examples using vertex array objects

Cover WebGL1->2

*  getContext("webgl2")
*  #version es 300
*  attribute -> in
*  varying -> in/out
*  gl_FragColor -> out vec4 someName; (not gl_FragColor)
*  texture2D/textureCube -> texture
*  mod to %
*  npot no longer an issue
*  many extensions not needed
   *  depth texture
   *  floating point textures
   *  vertex array objects
   *  standard deviations
   *  instanced drawing
   *  textures in vertex shaders (were optional)
   *  compressed textures

*  instancing
*  use vertex array objects
*  use uniform buffer objects

New Features

*  integer textures/attributes and math
*  transform feedback
*  samplers (what's the point?)
*  lots of texture formats
*  3d textures
*  texture arrays
*  common compressed textures
*  compressed vertices (what's the point?)
*  loop restrictions in shaders removed only in 300 es (GL more secure?)
*  indexing sampler arrays restiction removed
*  ubo's
*  vbo's always
*  indices
*  float always
*  integer textures
*  integer manip
*  pixel lookup (no math)
*  texture size in GLSL

Misc

*   move scripts to bottom
*   remove on window
*   add `gl.viewport` to all samples?
*   make all samples call getWebGLContext({resize: true});
*   move gl.enable to render loop


DONE
----

*   webgl-fundamentals.html
*   webgl-how-it-works.html
*   webgl-shaders-and-glsl.html
*   webgl-image-processing.html
*   webgl-image-processing-continued.html
*   webgl-2d-translation.html
*   webgl-2d-rotation.html
*   webgl-2d-scale.html
*   webgl-2d-matrices.html
*   webgl-3d-orthographic.html
*   webgl-3d-perspective.html
*   webgl-3d-camera.html
*   webgl-3d-lighting-directional.html
*   webgl-3d-lighting-point.html
*   webgl-less-code-more-fun.html
*   webgl-drawing-multiple-things.html
*   webgl-scene-graph.html
*   webgl-2d-drawimage.html
*   webgl-2d-matrix-stack.html
*   webgl-text-html.html
*   webgl-text-canvas2d.html
*   webgl-text-texture.html
*   webgl-boilerplate.html
*   webgl-resizing-the-canvas.html
*   webgl-animation.html
*   webgl-and-alpha.html
*   webgl-2d-vs-3d-library.html
*   webgl-2-textures.html
*   webgl-anti-patterns.html
*   webgl-3d-textures.html

