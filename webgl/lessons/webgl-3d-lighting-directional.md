Title: WebGL2 3D - Directional Lighting
Description: How to implement directional lighting in WebGL
TOC: Directional Lighting


This article is a continuation of [WebGL 3D Cameras](webgl-3d-camera.html).
If you haven't read that I suggest [you start there](webgl-3d-camera.html).

There are many ways to implement lighting. Probably the simplest is *directional lighting*.

Directional lighting assumes the light is coming uniformly from one direction. The sun
on a clear day is often considered a directional light. It's so far way that its rays
can be considered to be hitting the surface of an object all in parallel.

Computing directional lighting is actually pretty simple. If we know what direction
the light is traveling and we know what direction the surface of the object is facing
we can take the *dot product* of the 2 directions and it will give us the cosine of
the angle between the 2 directions.

Here's an example

{{{diagram url="resources/dot-product.html" caption="drag the points"}}}

Drag the points around, if you get them exactly opposite of each other you'll see the dot product
is -1. If they are at the same spot exactly the dot product is 1.

How is that useful? Well if we know what direction the surface of our 3d object is facing
and we know the direction the light is shining then we can just take the dot product
of them and it will give us a number 1 if the light is pointing directly at the
surface and -1 if they are pointing directly opposite.

{{{diagram url="resources/directional-lighting.html" caption="rotate the direction" width="500" height="400"}}}

We can multiply our color by that dot product value and boom! Light!

One problem, how do we know which direction the surfaces of our 3d object are facing.

## Introducing Normals

I have no idea why they are called *normals* but at least in 3D graphics a normal
is the word for a unit vector that describes the direction a surface is facing.

Here are some normals for a cube and a sphere.

{{{diagram url="resources/normals.html"}}}

The lines sticking out of the objects represent normals for each vertex.

Notice the cube has 3 normals at each corner. That's because you need
3 different normals to represent the way each face of the cube is um, .. facing.

Here the normals are also colored based on their direction with
positive x being <span style="color: red;">red</span>, up being
<span style="color: green;">green</span> and positive z being
<span style="color: blue;">blue</span>.

So, let's go add normals to our `F` from [our previous examples](webgl-3d-camera.html)
so we can light it. Since the `F` is very boxy and its faces are aligned
to the x, y, or z axis it will be pretty easy. Things that are facing forward
have the normal `0, 0, 1`. Things that are facing away are `0, 0, -1`. Facing
left is `-1, 0, 0`, Facing right is `1, 0, 0`. Up is `0, 1, 0` and down is `0, -1, 0`.

```
function setNormals(gl) {
  var normals = new Float32Array([
          // left column front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // top rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // middle rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // left column back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // middle rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // top rung right
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // under top rung
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // between top rung and middle
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // top of middle rung
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // right of middle rung
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom of middle rung.
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // right of bottom
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // left side
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```

and set them up. While we're at it let's remove the vertex colors
so it's easier to see the lighting.

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// Create a buffer for colors.
    -var buffer = gl.createBuffer();
    -gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    -gl.enableVertexAttribArray(colorLocation);
    -
    -// We'll supply RGB as bytes.
    -gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    -
    -// Set Colors.
    -setColors(gl);

    // Create a buffer for normals.
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    // Set normals.
    setNormals(gl);

Now we need to make our shaders use them

First the vertex shader we just pass the normals through to
the fragment shader

```
#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
-in vec4 a_color;
+in vec3 a_normal;

// A matrix to transform the positions by
uniform mat4 u_matrix;

-// a varying to pass the color to the fragment shader
-out vec4 v_color;

+// varying to pass the normal to the fragment shader
+out vec3 v_normal;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

-  // Pass the color to the fragment shader.
-  v_color = a_color;

+  // Pass the normal to the fragment shader
+  v_normal = a_normal;
}
```

And the fragment shader we'll do the math using the dot product
of the direction of the light and the normal

```
#version 300 es

precision highp float;

-// the varied color passed from the vertex shader
-in vec4 v_color;

+// Passed in and varied from the vertex shader.
+in vec3 v_normal;
+
+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
-  outColor = v_color;
+  // because v_normal is a varying it's interpolated
+  // so it will not be a unit vector. Normalizing it
+  // will make it a unit vector again
+  vec3 normal = normalize(v_normal);
+
+  // compute the light by taking the dot product
+  // of the normal to the light's reverse direction
+  float light = dot(normal, u_reverseLightDirection);
+
+  outColor = u_color;
+
+  // Lets multiply just the color portion (not the alpha)
+  // by the light
+  outColor.rgb *= light;
}
```

Then we need to lookup the locations of `u_color` and `u_reverseLightDirection`.

```
  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```

and we need to set them

```
  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

+  // Set the color to use
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
+
+  // set the light direction.
+  gl.uniform3fv(reverseLightDirectionLocation, normalize([0.5, 0.7, 1]));
```

`normalize`, which we went over before, will make whatever values we put in there
into a unit vector. The specific values in the sample are
`x = 0.5` which is positive `x` means the light is on the right pointing left.
`y = 0.7` which is positive `y` means the light is above pointing down.
`z = 1` which is positive `z` means the light is in front pointing into the scene.
the relative values means the direction is mostly pointing into the scene
and pointing more down then right.

And here it is

{{{example url="../webgl-3d-lighting-directional.html" }}}

If you rotate the F you might notice something. The F is rotating
but the lighting isn't changing. As the F rotates we want whatever part
is facing the direction of the light to be the brightest.

To fix this we need to re-orient the normals as the object is re-oriented.
Like we did for positions we can multiply the normals by some matrix. The most obvious
matrix would be the `world` matrix. As it is right now we're only passing in
1 matrix called `u_matrix`. Let's change it to pass in 2 matrices. One called
`u_world` which will be the world matrix. Another called `u_worldViewProjection`
which will be what we're currently passing in as `u_matrix`

```
#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
*  gl_Position = u_worldViewProjection * a_position;

*  // orient the normals and pass to the fragment shader
*  v_normal = mat3(u_world) * a_normal;
}
```

Notice we are multiplying `a_normal` by `mat3(u_world)`. That's
because normals are a direction so we don't care about translation.
The orientation portion of the matrix is only in the top 3x3
area of the matrix.

Now we have to look those uniforms up

```
  // lookup uniforms
-  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
*  var worldViewProjectionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

And we have to change the code that updates them

```
*var worldMatrix = m4.yRotation(fRotationRadians);
*var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix,
                                             worldMatrix);

*// Set the matrices
*gl.uniformMatrix4fv(
*    worldViewProjectionLocation, false,
*    worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

and here's that

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

Rotate the F and notice which ever side is facing the light direction gets lit.

There is one problem which I don't know how to show directly so I'm
going to show it in a diagram. We're multiplying the `normal` by
the `u_world` matrix to re-orient the normals.
What happens if we scale the world matrix?
It turns out we get the wrong normals.

{{{diagram url="resources/normals-scaled.html" caption="click to toggle normals" width="600" }}}

I've never bothered to understand
the solution but it turns out you can get the inverse of the world matrix,
transpose it, which means swap the columns for rows, and use that instead
and you'll get the right answer.

In the diagram above the <span style="color: #F0F;">purple</span> sphere
is unscaled. The <span style="color: #F00;">red</span> sphere on the left
is scaled and the normals are being multiplied by the world matrix. You
can see something is wrong. The <span style="color: #00F;">blue</span>
sphere on the right is using the world inverse transpose matrix.

Click the diagram to cycle through different representations. You should
notice when the scale is extreme it's very easy to see the normals
on the left (world) are **not** staying perpendicular to the surface of the sphere
where as the ones on the right (worldInverseTranspose) are staying perpendicular
to the sphere. The last mode makes them all shaded red. You should see the lighting
on the 2 outer spheres is very different based on which matrix is used.
It's hard to tell which is correct which is why this is a subtle issue but
based on the other visualizations it's clear using the worldInverseTranspose
is correct.

To implement this in our example let's change the code like this. First we'll update
the shader. Technically we could just update the value of `u_world`
but it's best if we rename things so they're named what they actually are
otherwise it will get confusing.

```
#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_worldViewProjection;
-uniform mat4 u_world
+uniform mat4 u_worldInverseTranspose;

// varyings to pass the normal and color to the fragment shader
out vec4 v_color;
out vec3 v_normal;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_worldViewProjection * a_position;

  // orient the normals and pass to the fragment shader
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```

Then we need to look that up

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

And we need to compute and set it

```
var worldMatrix = m4.yRotation(fRotationRadians);
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
+var worldInverseMatrix = m4.inverse(worldMatrix);
+var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// Set the matrices
gl.uniformMatrix4fv(
    worldViewProjectionLocation, false,
    worldViewProjectionMatrix);
-gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+    worldInverseTransposeLocation, false,
+    worldInverseTransposeMatrix);
```

and here's the code to transpose a matrix

```
var m4 = {
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },
  ...
```

Because the effect is subtle and because we aren't scaling anything
there's no noticeable difference but at least now we're prepared.

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

I hope this first step into lighting was clear. Next up [point lighting](webgl-3d-lighting-point.html).

<div class="webgl_bottombar">
<h3>Alternatives to mat3(u_worldInverseTranspose) * a_normal</h3>
<p>In our shader above there's a line like this</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>We could have done this</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p>Because we set <code>w</code> to 0 before multiplying that would
end up multiplying the translation from the matrix by 0 effectively removing it. I think that's
the more common way to do it. The mat3 way looked cleaner to me but
I've often done it this way too.</p>
<p>Yet another solution would be to make <code>u_worldInverseTranspose</code> a <code>mat3</code>.
There are 2 reasons not to do that. One is we might have
other needs for the full <code>u_worldInverseTranspose</code> so passing the entire
<code>mat4</code> means we can use with for those other needs.
Another is that all of our matrix functions in JavaScript
make 4x4 matrices. Making a whole other set for 3x3 matrices
or even converting from 4x4 to 3x3 is work we'd rather
not do unless there was a more compelling reason.</p>
</div>
