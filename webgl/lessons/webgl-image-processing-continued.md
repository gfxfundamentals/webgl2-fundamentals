Title: WebGL2 Image Processing Continued
Description: How to apply multiple image processing techniques to images in WebGL
TOC: Image Processing Continued


This article is a continuation of [WebGL Image Processing](webgl-image-processing.html).
If you haven't read that I suggest [you start there](webgl-image-processing.html).

The next most obvious question for image processing is how to apply multiple effects?

Well, you could try to generate shaders on the fly. Provide a UI that lets the
user select the effects he wants to use then generate a shader that does
all of the effects. That might not always be possible though that technique
is often used to [create effects for real time graphics](https://www.youtube.com/watch?v=cQUn0Zeh-0Q).

A more flexible way is to use 2 more *work* textures and
render to each texture in turn, ping-ponging back and forth
and applying the next effect each time.

<blockquote><pre>Original Image -&gt; [Blur]        -&gt; Texture 1
Texture 1      -&gt; [Sharpen]     -&gt; Texture 2
Texture 2      -&gt; [Edge Detect] -&gt; Texture 1
Texture 1      -&gt; [Blur]        -&gt; Texture 2
Texture 2      -&gt; [Normal]      -&gt; Canvas</pre></blockquote>

To do this we need to create framebuffers. In WebGL and OpenGL, a Framebuffer
is actually a poor name. A WebGL/OpenGL Framebuffer is really just a
list of attachments and not actually a buffer of any kind. But, by
attaching a texture to a framebuffer we can render into that texture.

First let's turn [the old texture creation code](webgl-image-processing.html) into a function

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set up texture so we can render any size image and so we are
    // working with pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // Create a texture and put the image in it.
  var originalImageTexture = createAndSetupTexture(gl);

  // Upload the image into the texture.
  var mipLevel = 0;               // the largest mip
  var internalFormat = gl.RGBA;   // format we want in the texture
  var srcFormat = gl.RGBA;        // format of data we are supplying
  var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
  gl.texImage2D(gl.TEXTURE_2D,
                mipLevel,
                internalFormat,
                srcFormat,
                srcType,
                image);
```

And now let's use that function to make 2 more textures and attach them to 2 framebuffers.

```
  // create 2 textures and attach them to framebuffers.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // make the texture the same size as the image
    var mipLevel = 0;               // the largest mip
    var internalFormat = gl.RGBA;   // format we want in the texture
    var border = 0;                 // must be 0
    var srcFormat = gl.RGBA;        // format of data we are supplying
    var srcType = gl.UNSIGNED_BYTE  // type of data we are supplying
    var data = null;                // no data = create a blank texture
    gl.texImage2D(
        gl.TEXTURE_2D, mipLevel, internalFormat, image.width, image.height, border,
        srcFormat, srcType, data);

    // Create a framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Attach a texture to it.
    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }
```

Now let's make a set of kernels and then a list of them to apply.

```
  // Define several convolution kernels
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
  };

  // List of effects to apply.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

And finally let's apply each one, ping ponging which texture we are rendering too

```
  function drawEffects() {
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // start with the original image on unit 0
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(imageLocation, 0);

    // don't y flip images while drawing to the textures
    gl.uniform1f(flipYLocation, 1);

    // loop through each effect we want to apply.
    var count = 0;
    for (var ii = 0; ii < tbody.rows.length; ++ii) {
      var checkbox = tbody.rows[ii].firstChild.firstChild;
      if (checkbox.checked) {
        // Setup to draw into one of the framebuffers.
        setFramebuffer(framebuffers[count % 2], image.width, image.height);

        drawWithKernel(checkbox.value);

        // for the next draw, use the texture we just rendered to.
        gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

        // increment count so we use the other texture next time.
        ++count;
      }
    }

    // finally draw the result to the canvas.
    gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas

    setFramebuffer(null, gl.canvas.width, gl.canvas.height);

    drawWithKernel("normal");
  }

  function setFramebuffer(fbo, width, height) {
    // make this the framebuffer we are rendering to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Tell the shader the resolution of the framebuffer.
    gl.uniform2f(resolutionLocation, width, height);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // set the kernel and it's weight
    gl.uniform1fv(kernelLocation, kernels[name]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

Here's a working version with a slightly more flexible UI. Check the effects
to turn them on. Drag the effects to reorder how they are applied.

{{{example url="../webgl-2d-image-processing.html" }}}

Some things I should go over.

Calling `gl.bindFramebuffer` with `null` tells WebGL you want to render
to the canvas instead of to one of your framebuffers.

Also framebuffers may or may not work depending on which attachments you
put on them. There's a list of which types and combinations of attachments
are supposed to always work. The one used here, one `RGBA`/`UNSIGNED_BYTE` texture
assigned to the `COLOR_ATTACHMENT0` attachment point, is always supposed to work.
More exotic texture formats and or combinations of attachments might not work.
In that case you're supposed to bind the framebuffer and then call
`gl.checkFramebufferStatus` and see if it returns `gl.FRAMEBUFFER_COMPLETE`.
If it does you're good to go. If not you'll need to tell the user to fallback
to something else. Fortunately WebGL2 supports many formats and combinations.

WebGL has to convert from [clip space](webgl-fundamentals.html) back into pixels.
It does this based on the settings of `gl.viewport`. Since the framebuffers
we are rendering into are a different size than the canvas we need to set the
viewport appropriately depending if we are rendering to a texture or the canvas.

Finally in the [original example](webgl-fundamentals.html) we flipped the Y
coordinate when rendering because WebGL displays the canvas with 0,0 being the
bottom left corner instead of the more traditional for 2D top left. That's not
needed when rendering to a framebuffer. Because the framebuffer is never
displayed, which part is top and bottom is irrelevant. All that matters is
that pixel 0,0 in the framebuffer corresponds to 0,0 in our calculations.
To deal with this I made it possible to set whether to flip or not by
adding one more uniform input into the shader call `u_flipY`.

```
...
+uniform float u_flipY;
...

void main() {
  ...
+   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
  ...
}
```

And then we can set it when we render with

```
  ...
+  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

+  // don't flip
+  gl.uniform1f(flipYLocation, 1);

  ...

+  // flip
+  gl.uniform1f(flipYLocation, -1);
```

I kept this example simple by using a single GLSL program that can achieve
multiple effects. If you wanted to do full on image processing you'd probably
need many GLSL programs. A program for hue, saturation and luminance adjustment.
Another for brightness and contrast. One for inverting, another for adjusting
levels, etc. You'd need to change the code to switch GLSL programs and update
the parameters for that particular program. I'd considered writing that example
but it's an exercise best left to the reader because multiple GLSL programs each
with their own parameter needs probably means some major refactoring to keep it
all from becoming a big mess of spaghetti.

I hope this and the preceding examples have made WebGL seem a little more
approachable and I hope starting with 2D helps make WebGL a little easier to
understand. If I find the time I'll try to write [a few more articles](webgl-2d-translation.html)
about how to do 3D as well as more details on [what WebGL is really doing under the hood](webgl-how-it-works.html).
For a next step consider learning [how to use 2 or more textures](webgl-2-textures.html).


