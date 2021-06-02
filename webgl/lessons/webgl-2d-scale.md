Title: WebGL2 2D Scale
Description: How to scale in 2D
TOC: 2D Scale


This post is a continuation of a series of posts about WebGL.
The first [started with fundamentals](webgl-fundamentals.html) and
the previous was [about rotating geometry](webgl-2d-rotation.html).

Scaling is just as [easy as translation](webgl-2d-translation.html).

We multiply the position by our desired scale. Here are the changes
from our [previous sample](webgl-2d-rotation.html).

```
#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // Scale the position
+  vec2 scaledPosition = a_position * u_scale;

  // Rotate the position
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Add in the translation.
  vec2 position = rotatedPosition + u_translation;
```

and we add the JavaScript needed to set the scale when we draw.

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];


   // Draw the scene.
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

     // Set the color.
     gl.uniform4fv(colorLocation, color);

     // Set the translation.
     gl.uniform2fv(translationLocation, translation);

     // Set the rotation.
     gl.uniform2fv(rotationLocation, rotation);

+     // Set the scale.
+     gl.uniform2fv(scaleLocation, scale);

     // Draw the rectangle.
     var primitiveType = gl.TRIANGLES;
     var offset = 0;
     var count = 18;
     gl.drawArrays(primitiveType, offset, count);
   }
```

And now we have scale. Drag the sliders.

{{{example url="../webgl-2d-geometry-scale.html" }}}

One thing to notice is that scaling by a negative value flips our geometry.

Another thing to notice is it scales from 0, 0 which for our F is the
top left corner. That makes sense since we're multiplying the positions
by the scale they will move away from 0, 0. You can probably
imagine ways to fix that. For example you could add another translation
before you scale, a *pre scale* translation. Another solution would be
to change the actual F position data. We'll go over another way soon.

I hope these last 3 posts were helpful in understanding
[translation](webgl-2d-translation.html), [rotation](webgl-2d-rotation.html)
and scale. Next we'll go over [the magic that is matrices](webgl-2d-matrices.html)
that combines all 3 of these into a much simpler and often more useful form.

<div class="webgl_bottombar">
<h3>Why an 'F'?</h3>
<p>
The first time I saw someone use an 'F' was on a texture.
The 'F' itself is not important. What is important is that
you can tell its orientation from any direction. If we
used a heart ❤ or a triangle △ for example we couldn't
tell if it was flipped horizontally. A circle ○ would be
even worse. A colored rectangle would arguably work with
different colors on each corner but then you'd have to remember
which corner was which. An F's orientation is instantly recognizable.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
Any shape that you can tell the orientation of would work,
I've just used 'F' ever since I was 'F'irst introduced to the idea.
</p>
</div>




