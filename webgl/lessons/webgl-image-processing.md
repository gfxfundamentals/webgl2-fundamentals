Title: WebGL2 Image Processing
Description: How to image process in WebGL
TOC: Image Processing


Image processing is easy in WebGL. How easy? Read below.

This is a continuation from [WebGL2 Fundamentals](webgl-fundamentals.html).
If you haven't read that I'd suggest [going there first](webgl-fundamentals.html).

To draw images in WebGL we need to use textures. Similarly to the way
WebGL expects clip space coordinates when rendering instead of pixels,
WebGL generally expects texture coordinates when reading a texture.
Texture coordinates go from 0.0 to 1.0 no matter the dimensions of the texture.

WebGL2 adds the ability to read a texture using pixel coordinates as well.
Which way is best is up to you. I feel like it's more common to use
texture coordinates than pixel coordinates.

Since we are only drawing a single rectangle (well, 2 triangles)
we need to tell WebGL which place in the texture each point in the
rectangle corresponds to. We'll pass this information from the vertex
shader to the fragment shader using a special kind of variable called
a 'varying'. It's called a varying because it varies. [WebGL will
interpolate the values](webgl-how-it-works.html) we provide in the
vertex shader as it draws each pixel using the fragment shader.

Using [the vertex shader from the end of the previous post](webgl-fundamentals.html)
we need to add an attribute to pass in texture coordinates and then
pass those on to the fragment shader.

    ...

    +in vec2 a_texCoord;

    ...

    +out vec2 v_texCoord;

    void main() {
       ...
    +   // pass the texCoord to the fragment shader
    +   // The GPU will interpolate this value between points
    +   v_texCoord = a_texCoord;
    }

Then we supply a fragment shader to look up colors from the texture.

    #version 300 es
    precision highp float;

    // our texture
    uniform sampler2D u_image;

    // the texCoords passed in from the vertex shader.
    in vec2 v_texCoord;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
       // Look up a color from the texture.
       outColor = texture(u_image, v_texCoord);
    }

Finally we need to load an image, create a texture and copy the image
into the texture. Because we are in a browser images load asynchronously
so we have to re-arrange our code a little to wait for the texture to load.
Once it loads we'll draw it.

    +function main() {
    +  var image = new Image();
    +  image.src = "https://someimage/on/our/server";  // MUST BE SAME DOMAIN!!!
    +  image.onload = function() {
    +    render(image);
    +  }
    +}

    function render(image) {
      ...
      // look up where the vertex data needs to go.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    +  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

      // lookup uniforms
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    +  var imageLocation = gl.getUniformLocation(program, "u_image");

      ...

    +  // provide texture coordinates for the rectangle.
    +  var texCoordBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    +      0.0,  0.0,
    +      1.0,  0.0,
    +      0.0,  1.0,
    +      0.0,  1.0,
    +      1.0,  0.0,
    +      1.0,  1.0]), gl.STATIC_DRAW);
    +  gl.enableVertexAttribArray(texCoordAttributeLocation);
    +  var size = 2;          // 2 components per iteration
    +  var type = gl.FLOAT;   // the data is 32bit floats
    +  var normalize = false; // don't normalize the data
    +  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    +  var offset = 0;        // start at the beginning of the buffer
    +  gl.vertexAttribPointer(
    +      texCoordAttributeLocation, size, type, normalize, stride, offset)
    +
    +  // Create a texture.
    +  var texture = gl.createTexture();
    +
    +  // make unit 0 the active texture unit
    +  // (i.e, the unit all other texture commands will affect.)
    +  gl.activeTexture(gl.TEXTURE0 + 0);
    +
    +  // Bind texture to 'texture unit '0' 2D bind point
    +  gl.bindTexture(gl.TEXTURE_2D, texture);
    +
    +  // Set the parameters so we don't need mips and so we're not filtering
    +  // and we don't repeat
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    +  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    +
    +  // Upload the image into the texture.
    +  var mipLevel = 0;               // the largest mip
    +  var internalFormat = gl.RGBA;   // format we want in the texture
    +  var srcFormat = gl.RGBA;        // format of data we are supplying
    +  var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
    +  gl.texImage2D(gl.TEXTURE_2D,
    +                mipLevel,
    +                internalFormat,
    +                srcFormat,
    +                srcType,
    +                image);

      ...

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      // Pass in the canvas resolution so we can convert from
      // pixels to clip space in the shader
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    +  // Tell the shader to get the texture from texture unit 0
    +  gl.uniform1i(imageLocation, 0);

    +  // Bind the position buffer so gl.bufferData that will be called
    +  // in setRectangle puts data in the position buffer
    +  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    +
    +  // Set a rectangle the same size as the image.
    +  setRectangle(gl, 0, 0, image.width, image.height);

    }

And here's the image rendered in WebGL.

{{{example url="../webgl-2d-image.html" }}}

Not too exciting so let's manipulate that image. How about just
swapping red and blue?

    ...
    outColor = texture(u_image, v_texCoord).bgra;
    ...

And now red and blue are swapped.

{{{example url="../webgl-2d-image-red2blue.html" }}}

What if we want to do image processing that actually looks at other
pixels? Since WebGL references textures in texture coordinates which
go from 0.0 to 1.0 then we can calculate how much to move for 1 pixel
 with the simple math <code>onePixel = 1.0 / textureSize</code>.

Here's a fragment shader that averages the left and right pixels of
each pixel in the texture.

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
+  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
+
+  // average the left, middle, and right pixels.
+  outColor = (
+      texture(u_image, v_texCoord) +
+      texture(u_image, v_texCoord + vec2( onePixel.x, 0.0)) +
+      texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
}
```

Compare to the un-blurred image above.

{{{example url="../webgl-2d-image-blend.html" }}}

Now that we know how to reference other pixels let's use a convolution kernel
to do a bunch of common image processing. In this case we'll use a 3x3 kernel.
A convolution kernel is just a 3x3 matrix where each entry in the matrix represents
how much to multiply the 8 pixels around the pixel we are rendering. We then
divide the result by the weight of the kernel (the sum of all values in the kernel)
or 1.0, whichever is greater. [Here's a pretty good article on it](https://docs.gimp.org/2.6/en/plug-in-convmatrix.html).
And [here's another article showing some actual code if
you were to write this by hand in C++](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

In our case we're going to do that work in the shader so here's the new fragment shader.

```
#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

// the convolution kernel data
uniform float u_kernel[9];
uniform float u_kernelWeight;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));

  vec4 colorSum =
      texture(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
      texture(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
      texture(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
      texture(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
      texture(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
      texture(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
  outColor = vec4((colorSum / u_kernelWeight).rgb, 1);
}
```

In JavaScript we need to supply a convolution kernel and its weight

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];

     // set the kernel and it's weight
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

And voila... Use the drop down list to select different kernels.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

I hope this article has convinced you image processing in WebGL is pretty simple. Next up
I'll go over [how to apply more than one effect to the image](webgl-image-processing-continued.html).

<div class="webgl_bottombar">
<h3>What are texture units?</h3>
When you call <code>gl.draw???</code> your shader can reference textures. Textures are bound
to texture units. While the user's machine might support more all WebGL2 implementations are
required to support at least 16 texture units. Which texture unit each sampler uniform
references is set by looking up the location of that sampler uniform and then setting the
index of the texture unit you want it to reference.

For example:
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

To set textures on different units you call gl.activeTexture and then bind the texture you want on that unit. Example

<pre class="prettyprint showlinemods">
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

This works too

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
</div>

<div class="webgl_bottombar">
<h3>What's with the a_, u_, and v_ prefixes in front of variables in GLSL?</h3>
<p>
That's just a naming convention. They are not required but for me it makes it easier to see at a glance
where the values are coming from. a_ for attributes which is the data provided by buffers. u_ for uniforms
which are inputs to the shaders, v_ for varyings which are values passed from a vertex shader to a
fragment shader and interpolated (or varied) between the vertices for each pixel drawn.
See <a href="webgl-how-it-works.html">How it works</a> for more details.
</p>
</div>


