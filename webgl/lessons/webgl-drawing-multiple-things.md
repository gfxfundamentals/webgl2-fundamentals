Title: WebGL2 - Drawing Multiple Things
Description: How to draw multiple different kinds of things in WebGL
TOC: Drawing Multiple Things


This article is a continuation of [previous WebGL articles](webgl-fundamentals.html).
If you haven't read them I suggest you start there.

One of the most common questions after first getting something up in WebGL is how
do I draw multiple things.

The first thing to realize is that with few exceptions, WebGL is like having a function
someone wrote where instead of passing lots of parameters to the function you instead
have a single function that draws stuff and 70+ functions that set up the state for
that one function. So for example imagine you had a function that draws a circle. You
could program it like this

    function drawCircle(centerX, centerY, radius, color) { ... }

Or you could code it like this

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL works this second way. Functions like `gl.createBuffer`, `gl.bufferData`, `gl.createTexture`,
and `gl.texImage2D` let you upload data to buffers (vertex data) and data to textures (color, etc..).
`gl.createProgram`, `gl.createShader`, `gl.compileShader`, and `gl.linkProgram` let you create
your GLSL shaders. Nearly all the rest of the functions of WebGL are setting up these global
variables or *state* that is used when `gl.drawArrays` or `gl.drawElements` is finally called.

Knowing this a typical WebGL program basically follows this structure

At Init time

*   create all shaders and programs and look up locations
*   create buffers and upload vertex data
*   create a vertex array for each thing you want to draw
    *   for each attribute call `gl.bindBuffer`, `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`
    *   bind any indices to `gl.ELEMENT_ARRAY_BUFFER`
*   create textures and upload texture data

At Render Time

*   clear and set the viewport and other global state (enable depth testing, turn on culling, etc..)
*   For each thing you want to draw
    *   call `gl.useProgram` for the program needed to draw.
    *   bind the vertex array for that thing.
        *   call `gl.bindVertexArray`
    *   setup uniforms for the thing you want to draw
        *   call `gl.uniformXXX` for each uniform
        *   call `gl.activeTexture` and `gl.bindTexture` to assign textures to texture units.
    *   call `gl.drawArrays` or `gl.drawElements`

That's basically it. It's up to you how to organize your code to accomplish that task.

Some things like uploading texture data (and maybe even vertex data) might happen asynchronously because
you need to wait for them to download over the net.

Let's make a simple app to draw 3 things. A cube, a sphere, and a cone.

I'm not going to go into the details of how to compute cube, sphere, and cone data. Let's just
assume we have functions to create them and they return [bufferInfo objects as described in
the previous article](webgl-less-code-more-fun.html).

So here's the code. Our shader is the same simple shader from our [perspective example](webgl-3d-perspective.html)
except we've added a `u_colorMult` to multiply the vertex colors by.

    #version 300 es
    precision highp float;

    // Passed in from the vertex shader.
    in vec4 v_color;

    +uniform vec4 u_colorMult;

    out vec4 outColor;

    void main() {
    *   outColor = v_color * u_colorMult;
    }


At init time

    // Our uniforms for each thing we want to draw
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // The translation for each object.
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

At draw time

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ Draw the sphere --------

    gl.useProgram(programInfo.program);

    // Setup all the needed attributes.
    gl.bindVertexArray(sphereVAO);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, sphereUniforms);

    twgl.drawBufferInfo(gl, sphereBufferInfo);

    // ------ Draw the cube --------

    // Setup all the needed attributes.
    gl.bindVertexArray(cubeVAO);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, cubeUniforms);

    twgl.drawBufferInfo(gl, cubeBufferInfo);

    // ------ Draw the cone --------

    // Setup all the needed attributes.
    gl.bindVertexArray(coneVAO);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, coneUniforms);

    twgl.drawBufferInfo(gl, coneBufferInfo);

And here's that

{{{example url="../webgl-multiple-objects-manual.html" }}}

One thing to notice is since we only have a single shader program we only called `gl.useProgram`
once. If we had different shader programs you'd need to call `gl.useProgram` before um...
using each program.

This is another place where it's a good idea to simplify. There are effectively 4 main things to combine.

1.  A shader program (and its uniform and attribute info)
2.  A vertex array (that contains attribute settings)
3.  The uniforms needed to draw that thing with the given shader.
4.  The count to pass to gl.drawXXX and whether or not to call gl.drawArrays or gl.drawElements

So, a simple simplification would be to make an array of things to draw and in that array
put the 4 things together

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        vertexArray: sphereVAO,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: cubeVAO,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        vertexArray: coneVAO,
        uniforms: coneUniforms,
      },
    ];

At draw time we still need to update the matrices

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // Compute the matrices for each object.
    sphereUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewMatrix,
        projectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

But the drawing code is now just a simple loop

    // ------ Draw the objects --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;

      gl.useProgram(programInfo.program);

      // Setup all the needed attributes.
      gl.bindVertexArray(object.vertexArray);

      // Set the uniforms.
      twgl.setUniforms(programInfo, object.uniforms);

      // Draw
      twgl.drawBufferInfo(gl, bufferInfo);
    });


And this is arguably the main rendering loop of most 3D engines in existence. Somewhere
some code or codes decide what goes into the list of `objectsToDraw` and the number
of options they need might be larger but most of them separate out computing what
goes in that list with actually calling the `gl.draw___` functions.

{{{example url="../webgl-multiple-objects-list.html" }}}

In general it's considered *best practice* to not call WebGL redundantly.
In other words, if some state of WebGL is already set to what you need it to
be set to then don't set it again. In that vain we could check, if the 
shader program we need to draw the current object is the same shader program
as the previous object then there's no need to call `gl.useProgram`. Similarly,
if we're drawing with the same shape/geometry/vertices there's no need to call
`gl.bindVertexArray`

So, very simple optimization might look like this

```js
+var lastUsedProgramInfo = null;
+var lastUsedVertexArray = null;

objectsToDraw.forEach(function(object) {
  var programInfo = object.programInfo;
  var vertexArray = object.vertexArray;

+  if (programInfo !== lastUsedProgramInfo) {
+    lastUsedProgramInfo = programInfo;
    gl.useProgram(programInfo.program);
+  }

  // Setup all the needed attributes.
+  if (lastUsedVertexArray !== vertexArray) {
+    lastUsedVertexArray = vertexArray;
    gl.bindVertexArray(vertexArray);
+  }

  // Set the uniforms.
  twgl.setUniforms(programInfo, object.uniforms);

  // Draw
  twgl.drawBufferInfo(gl, object.bufferInfo);
});
```

This time let's draw a lot more objects. Instead of just 3 like before let's make
the list of things to draw larger

```js
// put the shapes in an array so it's easy to pick them at random
var shapes = [
  { bufferInfo: sphereBufferInfo, vertexArray: sphereVAO, },
  { bufferInfo: cubeBufferInfo,   vertexArray: cubeVAO, },
  { bufferInfo: coneBufferInfo,   vertexArray: coneVAO, },
];

var objectsToDraw = [];
var objects = [];

// Make infos for each object for each object.
var baseHue = rand(360);
var numObjects = 200;
for (var ii = 0; ii < numObjects; ++ii) {
  // pick a shape
  var shape = shapes[rand(shapes.length) | 0];

  // make an object.
  var object = {
    uniforms: {
      u_colorMult: chroma.hsv(emod(baseHue + rand(120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
  objects.push(object);

  // Add it to the list of things to draw.
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shape.bufferInfo,
    vertexArray: shape.vertexArray,
    uniforms: object.uniforms,
  });
}
```

At render time

```js
// Compute the matrices for each object.
objects.forEach(function(object) {
  object.uniforms.u_matrix = computeMatrix(
      viewProjectionMatrix,
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});
```

Then draw the objects using the loop above.

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

> Note: I originally cut the section above from this WebGL2 version of the article.
> [The original WebGL1 version of this article](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html) had a section on optimization. The reason I cut it
> is with vertex array objects I'm not so sure the optimizations matter that much.
> In WebGL1 without vertex arrays, drawing a single object will often take
> 9 to 16 calls to setup the attributes to draw the object. In WebGL2 all of that
> happens at init time by setting up a vertex array per object and then at render
> time it's a single call to `gl.bindVertexArray` per object.
>
> Further, in general, most WebGL apps aren't pushing the limit of drawing. They
> need to run across an array of machines, from some 8yr old low end Intel
> integrated graphics GPU up to some top end machine. The optimizations mentioned
> in the section above are unlikely to make the difference between performant
> and not performant. Rather, to get performance requires reducing the number of
> draw calls, for example by using [instancing](webgl-instanced-drawing.html) and
> other similar techniques.
>
> The reason I added the section back in is, it was pointed out
> in a bug report that the last example, drawing 200 objects, is
> referenced in [the article on picking](webgl-picking.html). 😅

## Drawing Transparent Things and Multiple Lists

In the example above there is just one list to draw. This works because all the objects
are opaque. If we want to draw transparent objects though they must be drawn back to front
with the furthest objects getting drawn first. On the other hand, for speed, for opaque
objects we want to draw front to back, that's because the DEPTH_TEST means that the GPU
will not execute our fragment shader for any pixels that would be behind other things.
so we want to draw the stuff in front first.

Most 3D engines handle this by having 2 or more lists of objects to draw. One list for opaque things.
Another list for transparent things. The opaque list is sorted front to back.
The transparent list is sorted by back to front. There might also be separate lists for other
things like overlays or post processing effects.

## Consider using a library

It's important to notice that you can't draw just any geometry with just any shader.
For example a shader that requires normals will not function with geometry that has no
normals. Similarly a shader that requires textures will not work without textures.

This is one of the many reasons it's great to choose a 3D Library like [Three.js](https://threejs.org)
because it handles all of this for you. You create some geometry, you tell three.js how you want it
rendered and it generates shaders at runtime to handle the things you need. Pretty much all 3D engines
do this from Unity3D to Unreal to Source to Crytek. Some generate them offline but the important
thing to realize is they *generate* shaders.

Of course the reason you're reading these articles is you want to know what's going on deep down.
That's great and it's fun to write everything yourself. It's just important to be aware
[WebGL is super low level](webgl-2d-vs-3d-library.html)
so there's a ton of work for you to do if you want to do it yourself and that often includes
writing a shader generator since different features often require different shaders.

You'll notice I didn't put `computeMatrix` inside the loop. That's because rendering should
arguably be separated from computing matrices. It's common to compute matrices from a
[scene graph and we'll go over that in another article](webgl-scene-graph.html).

Now that we have a framework for drawing multiple objects [lets draw some text](webgl-text-html.html).