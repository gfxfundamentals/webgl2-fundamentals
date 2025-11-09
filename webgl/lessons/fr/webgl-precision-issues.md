Title: WebGL2 Precision Issues
Description: Precision Issues in WebGL2
TOC: Precision Issues

This article is about various precision issues in WebGL2

## `lowp`, `mediump`, `highp`

In [the first article on this site](webgl-fundamentals.html) we created
a vertex shader and a fragment shader. When we created the fragment
shader it was mentioned almost in passing that a fragment shader
doesn't have a default precision and so we needed to set one by adding
the line

```glsl
precision highp float;
```

What that heck was that about?

`lowp`, `mediump`, and `highp` are precision settings. Precision in this case
effectively means how many bits are used to store a value. A number in
Javascript uses 64bits. Most numbers in WebGL are only 32bits. Less bits =
faster, more bits = more accurate and/or larger range.

I don't know if I can explain this well. You can search for 
[double vs float](https://www.google.com/search?q=double+vs+float)
for other examples of precision issues but one way to explain it is like the
difference between a byte and a short or in JavaScript a `Uint8Array` vs a
`Uint16Array`.

* A `Uint8Array` is an array of unsigned 8bit integers. 8bits can hold 2<sup>8</sup> values from 0 to 255.
* A `Uint16Array` is an array of unsigned 16bit integers. 16bits can hold 2<sup>16</sup> values from 0 to 65535.
* A `Uint32Array` is an array of unsigned 32bit integers. 32bits can hold 2<sup>32</sup> values from 0 to 4294967295.

`lowp`, `mediump`, and `highp` are similar.

* `lowp` is at least an 9 bit value. For floating point values they can range 
  from: -2 to +2, for integer values they are similar to `Uint8Array` or `Int8Array`

* `mediump` is at least a 16 bit value. For floating point values they can range
  from: -2<sup>14</sup> to +2<sup>14</sup>, for integer values they are similar to
  `Uint16Array` or `Int16Array`

* `highp` is at least a 32 bit value. For floating point values they can range
  from: -2<sup>62</sup> to +2<sup>62</sup>, for integer values they are similar to
  `Uint32Array` or `Int32Array`

It's important to note that not every value inside the range can be represented.
The easiest to understand is probably `lowp`. There are only 9 bits and so only
512 unique values can be represented. Above it says the range is -2 to +2 but
there are an infinite number of values between -2 and +2. For example 1.9999999
and 1.999998 are 2 values between -2 and +2. With only 9 bits `lowp` can't
represent those 2 values. So for example, if you want do some math on color and
you used `lowp` you might see a some banding. Without actually digging into what
actual values can be represented, we know colors go from 0 to 1. If `lowp`
goes from -2 to +2 and can only represent 512 unique values then it seems likely
only 128 of those values fit between 0 and 1. That would also suggest if you have
a value that is 4/128ths and I try to add 1/512th to it, nothing will happen
because 1/512th can't be represented by `lowp` so it's effectively 0.

We could just use `highp` everywhere and ignore this issue completely
but on devices that do actually use 9 bits for `lowp` and/or 16bits for
`mediump` they are usually faster than `highp`. Often significantly faster.

To that last point, unlike values in a `Uint8Array` or `Uint16Array`, a `lowp`
or `mediump` value or for that matter even a `highp` value is allowed to use
higher precision (more bits). So for example on a desktop GPU if you put
`mediump` in your shader it will still most likely use 32bits internally. This
has the problem of making it hard to test your shaders if you use `lowp` or
`mediump`. To see if the your shaders actually work correctly with `lowp` or
`mediump` you have to test on a device that actually uses 8bits for `lowp` and
16bits for `highp`.

If you do want to try to use `mediump` for speed here are some of the issues
that come up.

A good example is probably the example of [point lights](webgl-3d-lighting-point.html),
in particular the specular highlight calculation, passes values in world or view space to the fragment shader,
those values can easily get out of range for a `mediump` value. So, maybe on
a `mediump` device you could just leave out the specular highlights. For example here
is the point light shader from [the article on point lights](webgl-3d-lighting-point.html)
modified to for `mediump`.

```glsl
#version 300 es

-precision highp float;
+precision mediump float;

// Passed in and varied from the vertex shader.
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a uint vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

  // compute the light by taking the dot product
  // of the normal to the light's reverse direction
  float light = dot(normal, surfaceToLightDirection);
-  float specular = 0.0;
-  if (light > 0.0) {
-    specular = pow(dot(normal, halfVector), u_shininess);
-  }

  outColor = u_color;

  // Lets multiply just the color portion (not the alpha)
  // by the light
  outColor.rgb *= light;

-  // Just add in the specular
-  outColor.rgb += specular;
}
```

Note: Even that is not really enough. In the vertex shader we have

```glsl
  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
```

So let's say the light is 1000 units away from the surface.
We then get to the fragment shader and this line

```glsl
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
```

seems innocent enough. Except that the normal way to normalize vector
is to divide by its length and the normal way to compute a length is

```
  float length = sqrt(v.x * v.x + v.y * v.y * v.z * v.z);
```

If one of those x, y, or z is 1000 then 1000*1000 is 1000000. 1000000
is out of range for `mediump`.

One solution here is to normalize in the vertex shader.

```
  // compute the vector of the surface to the light
  // and pass it to the fragment shader
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+  v_surfaceToLight = normalize(u_lightWorldPosition - surfaceWorldPosition);
```

Now the values assigned to `v_surfaceToLight` are between -1 and +1 which
is in range for `mediump`.

Note that normalizing in the vertex shader will not actually give the
same results but they might be close enough that no one will notice
unless compared side by side.

Functions like `normalize`, `length`, `distance`, `dot` all have this
issue that if the values are too large they're going to go out of range
for `mediump`.

But, you actually be to test on a device for which `mediump` is 16 bits.
On desktop `mediump` is 32bits, the same as `highp` and so any issues
will not be visible.

## Detecting support for 16bit `mediump`

You call `gl.getShaderPrecisionFormat`,
you pass in the shader type, `VERTEX_SHADER` or `FRAGMENT_SHADER` and you
pass in one of `LOW_FLOAT`, `MEDIUM_FLOAT`, `HIGH_FLOAT`,
`LOW_INT`, `MEDIUM_INT`, `HIGH_INT`, and it
[returns the precision info].

{{{example url="../webgl-precision-lowp-mediump-highp.html"}}}

`gl.getShaderPrecisionFormat` returns a object with three values, `precision`, `rangeMin`, and `rangeMax`.

For `LOW_FLOAT` and `MEDIUM_FLOAT` `precision` will 23 if they are really
just `highp`. Otherwise they'll likely be 8 and 15 respectively or
at least they will be less than 23. For `LOW_INT` and `MEDIUM_INT`
if they're the same as `highp` then `rangeMin` will be 31. If they're
less than 31 then a `mediump int` is actually more efficient than a
`highp int` for example.

My Pixel 2 XL uses 16 bits for `mediump` it also uses 16 bits for `lowp`. I'm not sure I've ever used a device that uses 9 bits for `lowp` so I'm not sure what issues commonly come up if any.

Throughout these articles we've specified a default precision
in the fragment shader. We can also specify the precision of any individual
variable. For example

```glsl
uniform mediump vec4 color;  // a uniform
in lowp vec4 normal;         // an attribute or varying input
out lowp vec4 texcoord;      // a fragment shader output or varying output
lowp float foo;              // a variable
```

## Texture Formats

Textures are another place where the spec says the actual precision
used can be greater then the precision requested.

As an example you can ask for 16 bit, 4bits per channel texture like this

```
gl.texImage2D(
  gl.TEXTURE_2D,               // target
  0,                           // mip level
  gl.RGBA4,                    // internal format
  width,                       // width
  height,                      // height
  0,                           // border
  gl.RGBA,                     // format
  gl.UNSIGNED_SHORT_4_4_4_4,   // type
  null,
);
```

But the implementation might actually use a higher resolution format internally.
I believe most desktops do this and most mobile GPUs do not.

We can test. First we'll request a 4bit per channel texture like above.
Then we'll [render to it](webgl-render-to-texture.html) by rendering
some 0 to 1 gradient.

We'll then render that texture to the canvas. If the texture really is 4 bits
per channel internally there will only be 16 levels of color from the gradient
we drew. If the texture is really 8bits per channel we'll see 256 levels of
colors.

{{{example url="../webgl-precision-textures.html"}}}

Running it on my smartphone I see the texture is using 4bits per channel
(or at least 4 bits in red since I didn't test the other channels).

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

Where as on my desktop I can see the texture is actually using 8bits per
channel even though I only asked for 4.

<div class="webgl_center"><img src="resources/desktop-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

One thing to note is that by default WebGL can dither its results to make
gradations like this look smoother. You can turn off dithering with

```js
gl.disable(gl.DITHER);
```

If I don't turn off dithering then my smartphone produces this.

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

Off the top of my head the only place this would really come up is if you
used some lower bit resolution format texture as a render target and didn't
test on a device where that texture is actually that lower resolution.
If you only tested on desktop any issues it causes might not be apparent.
