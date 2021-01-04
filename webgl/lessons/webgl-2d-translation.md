Title: WebGL2 2D Translation
Description: How to translate in 2D
TOC: 2D Translation


Before we move on to 3D let's stick with 2D for a little while longer.
Bear with me please. This article might seem exceedingly obvious to
some but I'll build up to a point in a few articles.

This article is a continuation of a series starting with
[WebGL Fundamentals](webgl-fundamentals.html). If you haven't read them
I suggest you read at least the first one, then come back here.

Translation is some fancy math name that basically means "to move"
something. I suppose moving a sentence from English to Japanese fits
as well but in this case we're talking about moving geometry. Using
the sample code we ended up with in [the first post](webgl-fundamentals.html)
you could easily translate our rectangle just by changing the values
passed to `setRectangle` right? Here's a sample based on our
[previous sample](webgl-fundamentals.html).

```
+  // First let's make some variables
+  // to hold the translation, width and height of the rectangle
+  var translation = [0, 0];
+  var width = 100;
+  var height = 30;
+  var color = [Math.random(), Math.random(), Math.random(), 1];
+
+  // Then let's make a function to
+  // re-draw everything. We can call this
+  // function after we update the translation.

  // Draw a the scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Update the position buffer with rectangle positions
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
*    setRectangle(gl, translation[0], translation[1], width, height);

    // Set a the color.
    gl.uniform4fv(colorLocation, color);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

In the example below I've attached a couple of sliders that will update
`translation[0]` and `translation[1]` and call `drawScene` anytime they change.
Drag the sliders to translate the rectangle.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

So far so good. But now imagine we wanted to do the same thing with a
more complicated shape.

Let's say we wanted to draw an 'F' that consists of 6 triangles like this.

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

Well, following our current code we'd have to change `setRectangle`
to something more like this.

```
// Fill the current ARRAY_BUFFER buffer with the values that define a letter 'F'.
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // top rung
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // middle rung
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3]),
      gl.STATIC_DRAW);
}
```

You can hopefully see that's not going to scale well. If we want to
draw some very complex geometry with hundreds or thousands of lines we'd
have to write some pretty complex code. On top of that, every time we
draw JavaScript has to update all the points.

There's a simpler way. Just upload the geometry and do the translation
in the shader.

Here's the new shader

```
#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

+// translation to add to position
+uniform vec2 u_translation;

// all shaders have a main function
void main() {
+  // Add in the translation
+  vec2 position = a_position + u_translation;

  // convert the position from pixels to 0.0 to 1.0
*  vec2 zeroToOne = position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
```

and we'll restructure the code a little. For one we only need to set
the geometry once.

```
// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90]),
      gl.STATIC_DRAW);
}
```

Then we just need to update `u_translation` before we draw with the
translation that we desire.

```
  ...

+  var translationLocation = gl.getUniformLocation(
+             program, "u_translation");

  ...

+  // Set Geometry.
+  setGeometry(gl);

  ...

  // Draw scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Set the color.
    gl.uniform4fv(colorLocation, color);

+    // Set the translation.
+    gl.uniform2fv(translationLocation, translation);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Notice `setGeometry` is called only once. It is no longer inside `drawScene`.

And here's that example. Again, drag the sliders to update the translation.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

Now when we draw, WebGL is doing practically everything. All we are doing is
setting a translation and asking it to draw. Even if our geometry had tens
of thousands of points the main code would stay the same.

If you want you can compare <a target="_blank" href="../webgl-2d-geometry-translate.html">
the version that uses the complex JavaScript
above to update all the points</a>.

I hope this example was not too obvious. In the [next article we'll move
on to rotation](webgl-2d-rotation.html).


