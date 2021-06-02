Title: WebGL2 Shadows
Description: How to compute shadows
TOC: Shadows

Lets draw some shadows!

## Prerequisites

Computing basic shadows is not *that* hard but it does require
a lot of background knowledge. To understand this article
you need to already understand the following topics.

* [Orthographic Projection](webgl-3d-orthographic.html)
* [Perspective Projection](webgl-3d-perspective.html)
* [Spot Lighting](webgl-3d-lighting-spot.html)
* [Textures](webgl-3d-textures.html)
* [Render to Texture](webgl-render-to-texture.html)
* [Projecting textures](webgl-planar-projection-mapping.html)
* [Visualizing the Camera](webgl-visualizing-the-camera.html)

So if you haven't read those please go read them first.

On top of that this article assumes you've read the article on
[less code more fun](webgl-less-code-more-fun.html)
as it uses the library mentioned there so as to
unclutter the example. If you don't understand
what buffers, vertex arrays, and attributes are or when
a function named `twgl.setUniforms` what it means
to set uniforms, etc... then you should probably to go further back and
[read the fundamentals](webgl-fundamentals.html).

So first off there is more than one way to draw shadows.
Every way has it's tradeoffs. The most common way to draw
shadows is to use shadow maps

Shadow maps work by combining the techniques from all the prerequisite
articles above.

In [the article on planar projection mapping](webgl-planar-projection-mapping.html)
we saw how to project an image on to objects

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

Recall that we didn't draw that image on top of the objects in the scene,
rather, as the objects were rendered, for each pixel we checked if the
projected texture was in range, if so we sampled the appropriate color from
the projected texture, if not we sampled a color from a different texture
who's color was looked up using texture coordinates that mapped a texture
to the object.

What if the projected texture instead contained depth data from the point
of view of a light. In other words assume there was a light at the tip of
the frustum shown in that example above and the projected texture had depth
info from the light's point of view. The sphere would have depth values closer
to the light, the plane would have depth values further
from the light. 

<div class="webgl_center"><img class="noinvertdark" src="resources/depth-map-generation.svg" style="width: 600px;"></div>

If we had that data then when choosing a color to render
we could get a depth value from the projected texture and check if the
depth of the pixel we're about to draw is closer or further from the light.
If it's further from the light that
means something was else was closer to the light. In other words,
something is blocking the light, therefore this pixel is in a shadow.

<div class="webgl_center"><img class="noinvertdark" src="resources/projected-depth-texture.svg" style="width: 600px;"></div>

Here the depth texture is projected through light space inside the frustum from the point of view of the light.
When we are drawing the pixels of the floor we compute that pixel's depth from the point of view 
of the light (0.3 in the diagram above). We then look at the corresponding depth in
the projected depth map texture. From the point of view of the light the depth value
in the texture will be 0.1 because it hit the sphere. Seeing that 0.1 &lt; 0.3 we
know the floor at that position must be in shadow.

First let's draw the shadow map. We'll take the last example from
[the article on planar projection mapping](webgl-planar-projection-mapping.html)
but instead of loading a texture we'll [render to a texture](webgl-render-to-texture.html)
so we create a depth texture and attach it to a framebuffer as the `DEPTH_ATTACHMENT`.

```js
const depthTexture = gl.createTexture();
const depthTextureSize = 512;
gl.bindTexture(gl.TEXTURE_2D, depthTexture);
gl.texImage2D(
    gl.TEXTURE_2D,      // target
    0,                  // mip level
    gl.DEPTH_COMPONENT32F, // internal format
    depthTextureSize,   // width
    depthTextureSize,   // height
    0,                  // border
    gl.DEPTH_COMPONENT, // format
    gl.FLOAT,           // type
    null);              // data
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const depthFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,       // target
    gl.DEPTH_ATTACHMENT,  // attachment point
    gl.TEXTURE_2D,        // texture target
    depthTexture,         // texture
    0);                   // mip level
```

To use it we need to able to render the scene more than once with different
shaders. Once with a simple shader just to render to the depth texture and
then again with our current shader that projects a texture.

So first let's change `drawScene` so we can pass it the program we want
to render with

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix) {
+function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix);

-  gl.useProgram(textureProgramInfo.program);
+  gl.useProgram(programInfo.program);

  // set uniforms that are the same for both the sphere and plane
  // note: any values with no corresponding uniform in the shader
  // are ignored.
-  twgl.setUniforms(textureProgramInfo, {
+  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
*    u_textureMatrix: textureMatrix,
-    u_projectedTexture: imageTexture,
+    u_projectedTexture: depthTexture,
  });

  // ------ Draw the sphere --------

  // Setup all the needed attributes.
  gl.bindVertexArray(sphereVAO);

  // Set the uniforms unique to the sphere
-  twgl.setUniforms(textureProgramInfo, sphereUniforms);
+  twgl.setUniforms(programInfo, sphereUniforms);

  // calls gl.drawArrays or gl.drawElements
  twgl.drawBufferInfo(gl, sphereBufferInfo);

  // ------ Draw the plane --------

  // Setup all the needed attributes.
  gl.bindVertexArray(planeVAO);

  // Set the uniforms we just computed
-  twgl.setUniforms(textureProgramInfo, planeUniforms);
+  twgl.setUniforms(programInfo, planeUniforms);

  // calls gl.drawArrays or gl.drawElements
  twgl.drawBufferInfo(gl, planeBufferInfo);
}
```

Now that we're going to be using the same vertex arrays with multiple
shader programs we need to make sure those programs use the same attributes.
This was brought up before when talking about vertex arrays (VAOs in the code above)
but I think this is the first example on this site that actually runs into this
issue. In other words we're going to draw the sphere and the plane with both
the projected texture shader program and the solid color shader program.
The projected texture shader program has 2 attributes, `a_position` and
`a_texcoord`. The solid color shader program just was one, `a_position`.
If we don't tell WebGL what attribute locations to use it's possible
it would `a_position` location = 0 for shader and location = 1 for the other
(or really WebGL could pick any arbitrary location). If that happens
then the attributes we setup in `sphereVAO` and `planeVAO` won't match
both programs. 

We can solve this 2 ways.

1. In GLSL add `layout(location = 0)` in front of each attribute 

  ```glsl
  layout(location = 0) in vec4 a_position;
  layout(location = 1) in vec4 a_texcoord;
  ```

  If we had 150 shaders we'd have to repeat those locations across all of them
  and track which shaders use which locations

2. call `gl.bindAttribLocation` before linking shaders

   In this case before we call `gl.linkProgram` we'd call `gl.bindAttribLocation`.
   (see [first article](webgl-fundamentals.html))

  ```js
  gl.bindAttribLocation(program, 0, "a_position");
  gl.bindAttribLocation(program, 1, "a_texcoord");
  gl.linkProgram(program);
  ...
  ```

We'll use this second way since it's more [D.R.Y](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

The library we're using to compile and link our shaders as the option to do this
for us. We just pass it the names of the attributes and their locations and it
will call `gl.bindAttribLocation` for us

```js
// setup GLSL programs
+// note: Since we're going to use the same VAO with multiple
+// shader programs we need to make sure all programs use the
+// same attribute locations. There are 2 ways to do that.
+// (1) assign them in GLSL. (2) assign them by calling `gl.bindAttribLocation`
+// before linking. We're using method 2 as it's more. D.R.Y.
+const programOptions = {
+  attribLocations: {
+    'a_position': 0,
+    'a_normal':   1,
+    'a_texcoord': 2,
+    'a_color':    3,
+  },
+};
-const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
-const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS],);
+const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs], programOptions);
+const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS], programOptions);
```

Now let's use `drawScene` to draw the scene from the point of view of the light
and then again with the depth texture

```js
function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // first draw from the POV of the light
-  const textureWorldMatrix = m4.lookAt(
+  const lightWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
-  const textureProjectionMatrix = settings.perspective
+  const lightProjectionMatrix = settings.perspective
      ? m4.perspective(
          degToRad(settings.fieldOfView),
          settings.projWidth / settings.projHeight,
          0.5,  // near
          10)   // far
      : m4.orthographic(
          -settings.projWidth / 2,   // left
           settings.projWidth / 2,   // right
          -settings.projHeight / 2,  // bottom
           settings.projHeight / 2,  // top
           0.5,                      // near
           10);                      // far

+  // draw to the depth texture
+  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
+  gl.viewport(0, 0, depthTextureSize, depthTextureSize);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

-  drawScene(textureProjectionMatrix, textureWorldMatrix, m4.identity());
+  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);

+  // now draw scene to the canvas projecting the depth texture into the scene
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let textureMatrix = m4.identity();
  textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
  textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
-  textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+  textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
  // use the inverse of this world matrix to make
  // a matrix that will transform other positions
  // to be relative this this world space.
  textureMatrix = m4.multiply(
      textureMatrix,
-      m4.inverse(textureWorldMatrix));
+      m4.inverse(lightWorldMatrix));

  // Compute the projection matrix
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // Compute the camera's matrix using look at.
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix); 
+  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo); 
}
```

Note I renamed `textureWorldMatrix` to `lightWorldMatrix` and
`textureProjectionMatrix` to `lightProjectionMatrix`. They are really the
same thing but before we were projecting a texture through arbitrary space.
Now we're trying to project a shadow map from a light. The math is the same
but it seemed appropriate to rename the variables.

Above we first render the sphere and the plane to the depth texture
using the color shader we made to draw the frustum lines. That shader
just draws a solid color and does nothing else special which is all
we need when rendering to the depth texture.

After that, we render the scene again to the canvas just as we did before,
projecting the texture into the scene. 
When we reference the depth texture in a shader only the red
value is valid so we'll just repeat it for red, green, and blue.

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
+  // the 'r' channel has the depth values
+  vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
```

While we're at it let's add a cube to the scene

```js
+const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(
+    gl,
+    2,  // size
+);

...

+const cubeUniforms = {
+  u_colorMult: [0.5, 1, 0.5, 1],  // light green
+  u_color: [0, 0, 1, 1],
+  u_texture: checkerboardTexture,
+  u_world: m4.translation(3, 1, 0),
+};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {

    ...

+    // ------ Draw the cube --------
+
+    // Setup all the needed attributes.
+    gl.bindVertexArray(cubeVAO);
+
+    // Set the uniforms we just computed
+    twgl.setUniforms(programInfo, cubeUniforms);
+
+    // calls gl.drawArrays or gl.drawElements
+    twgl.drawBufferInfo(gl, cubeBufferInfo);

...
```

and let's tweak the settings. We'll move the camera
and widen the field of view for the texture projection to cover more of the scene

```js
const settings = {
-  cameraX: 2.5,
+  cameraX: 6,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
-  fieldOfView: 45,
+  fieldOfView: 120,
};
```

note: I moved the code that draws the line cube that shows the
frustum outside of the `drawScene` function.

{{{example url="../webgl-shadows-depth-texture.html"}}}

This is exactly the same as the top example except instead
of loading an image we're generating a depth texture by
rendering the scene to it. If you want to verify adjust `cameraX`
back to 2.5 and `fieldOfView` to 45 and it should look the same
as above except with our new depth texture being projected
instead of a loaded image.

Depth values go from 0.0 to 1.0 representing their position
through the frustum so 0.0 (dark) is close to the tip
of the frustum and 1.0 (light) is at the far open end.

So all that's left to do is instead of choosing between our projected
texture color and our texture mapped color we can use the depth from
the depth texture to check if the Z position from the depth texture
is closer or further from the light then the depth of the pixel we're
being asked to draw. If the depth from the depth texture is closer than something
was blocking the light and this pixel is in a shadow.

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+  float currentDepth = projectedTexcoord.z;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = vec4(texture(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
+  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
+  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
-  outColor = mix(texColor, projectedTexColor, projectedAmount);
+  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

Above if the `projectedDepth` is less than the `currentDepth` then
the from the point of view of the light something was closer to
the light so this pixel we're about to draw is in shadow.

If we run this we'll get a shadow

{{{example url="../webgl-shadows-basic.html" }}}

It's kind of working, we can see the shadow of the sphere on
the ground but what's with all these funky patterns where there
is supposed to be no shadow? These patterns
are called *shadow acne*. They come from the fact that the
depth data stored in the depth texture has been quantized both
in that it's a texture, a grid of pixels, it was projected from the
point of view of the light but we're comparing it to values from the point of view of the camera. That means the grid of values in the
depth map is not aligned with our camera and
so when we compute `currentDepth` there are times when one value
will be slightly more or slightly less than `projectedDepth`.

Let's add a bias. 

```glsl
...

+uniform float u_bias;

void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
-  float currentDepth = projectedTexcoord.z;
+  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

And we need to set it

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
  fieldOfView: 120,
+  bias: -0.006,
};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo, /**/u_lightWorldMatrix) {
  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // set uniforms that are the same for both the sphere and plane
  // note: any values with no corresponding uniform in the shader
  // are ignored.
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
  });

  ...
```

{{{example url="../webgl-shadows-basic-w-bias.html"}}}

slide the bias value and you can how it affects when and where
the patterns appear.

To get closer to completion this let's actually add in a spot light calculation
from [the article on spot lights](webgl-3d-lighting-spot.html).

First let's paste in the needed parts to the vertex shader directly
from [that article](webgl-3d-lighting-spot.html).

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
+in vec3 a_normal;

+uniform vec3 u_lightWorldPosition;
+uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
+out vec3 v_normal;

+out vec3 v_surfaceToLight;
+out vec3 v_surfaceToView;

void main() {
  // Multiply the position by the matrix.
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // Pass the texture coord to the fragment shader.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

+  // orient the normals and pass to the fragment shader
+  v_normal = mat3(u_world) * a_normal;
+
+  // compute the world position of the surface
+  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
+
+  // compute the vector of the surface to the light
+  // and pass it to the fragment shader
+  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+
+  // compute the vector of the surface to the view/camera
+  // and pass it to the fragment shader
+  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

Then the fragment shader

```glsl
#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;
+in vec3 v_normal;
+in vec3 v_surfaceToLight;
+in vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
+uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_innerLimit;          // in dot space
+uniform float u_outerLimit;          // in dot space

out vec4 outColor;

void main() {
+  // because v_normal is a varying it's interpolated
+  // so it will not be a unit vector. Normalizing it
+  // will make it a unit vector again
+  vec3 normal = normalize(v_normal);
+
+  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
+  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
+  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
+
+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
+  float light = inLight * dot(normal, surfaceToLightDirection);
+  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // the 'r' channel has the depth values
  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
-  outColor = vec4(texColor.rgb * shadowLight, texColor.a);
+  outColor = vec4(
+      texColor.rgb * light * shadowLight +
+      specular * shadowLight,
+      texColor.a);
}
```

Notice we just use `shadowLight` to adjust the affect of the `light` and
`specular`. If an object is in shadow than there is no light.

We just need to set the uniforms 

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
+function drawScene(
+    projectionMatrix,
+    cameraMatrix,
+    textureMatrix,
+    lightWorldMatrix,
+    programInfo) {
  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // set uniforms that are the same for both the sphere and plane
  // note: any values with no corresponding uniform in the shader
  // are ignored.
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
+    u_shininess: 150,
+    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
+    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
+    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
+    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
+    u_viewWorldPosition: cameraMatrix.slice(12, 15),
  });

...

function render() {
  ...

-  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);
+  drawScene(
+      lightProjectionMatrix,
+      lightWorldMatrix,
+      m4.identity(),
+      lightWorldMatrix,
+      colorProgramInfo);

  ...

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo);
+  drawScene(
+      projectionMatrix,
+      cameraMatrix,
+      textureMatrix,
+      lightWorldMatrix,
+      textureProgramInfo);

  ...
}
```

To go over a few of those uniform settings. Recall from the [spot light article](webgl-3d-lighting-spot.html)
the innerLimit and outerLimit settings are in dot space (cosine space) and that
we only need half the field of view since they extend around the direction of the light.
Also recall from [the camera article](webgl-3d-camera.html) the 3rd row of 4x4 matrix
is the Z axis so pulling out the first 3 values of the 3rd row from the `lightWorldMatrix`
gives us the -Z direction of the light. We want the positive direction so we flip it.
Similarly the same article tells us the 4th row is the world position so we can get
the lightWorldPosition and viewWorldPosition (also known as the camera world position)
by pulling them out of the their respective matrices. Of course we could have also
got them by exposing more settings or passing more variables.

Let's also clear the background to black and set the frustum lines to white

```js
function render() {

  ...

  // now draw scene to the canvas projecting the depth texture into the scene
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // ------ Draw the frustum ------
  {

    ...

          // Set the uniforms we just computed
    twgl.setUniforms(colorProgramInfo, {
-      u_color: [0, 0, 0, 1],
+      u_color: [1, 1, 1, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,
    });
```

And now we have a spot light with shadows.

{{{example url="../webgl-shadows-w-spot-light.html" }}}

For a directional light we'd copy the shader code from
[the article on directional lights](webgl-3d-lighting-directional.html)
and change our projection from perspective to orthographic.

First the vertex shader

```glsl
#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
+in vec3 a_normal;

-uniform vec3 u_lightWorldPosition;
-uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
out vec3 v_normal;

-out vec3 v_surfaceToLight;
-out vec3 v_surfaceToView;

void main() {
  // Multiply the position by the matrix.
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // Pass the texture coord to the fragment shader.
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

  // orient the normals and pass to the fragment shader
  v_normal = mat3(u_world) * a_normal;

-  // compute the world position of the surface
-  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
-
-  // compute the vector of the surface to the light
-  // and pass it to the fragment shader
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
-
-  // compute the vector of the surface to the view/camera
-  // and pass it to the fragment shader
-  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

Then the fragment shader

```glsl
#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;
in vec3 v_normal;
-in vec3 v_surfaceToLight;
-in vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
-uniform float u_shininess;
-uniform vec3 u_lightDirection;
-uniform float u_innerLimit;          // in dot space
-uniform float u_outerLimit;          // in dot space
+uniform vec3 u_reverseLightDirection;

out vec4 outColor;

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

+  float light = dot(normal, u_reverseLightDirection);

-  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
-
-  float dotFromDirection = dot(surfaceToLightDirection,
-                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
-  float light = inLight * dot(normal, surfaceToLightDirection);
-  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // the 'r' channel has the depth values
  float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
  outColor = vec4(
-      texColor.rgb * light * shadowLight +
-      specular * shadowLight,
+      texColor.rgb * light * shadowLight,
      texColor.a);
}
```

and the uniforms

```js
  // set uniforms that are the same for both the sphere and plane
  // note: any values with no corresponding uniform in the shader
  // are ignored.
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
-    u_shininess: 150,
-    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
-    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
-    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
-    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
-    u_viewWorldPosition: cameraMatrix.slice(12, 15),
+    u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
  });
```

I adjusted the camera to see more of the scene.

{{{example url="../webgl-shadows-w-directional-light.html"}}}

This points out something that should be obvious from the code above but our
shadow map is only so big so even though a directional light calculations
only have a direction, there is no position for the light itself, we still
have to choose a position in order to decide the area to compute and apply
the shadow map.

This article is getting long and there are still many things to cover related
to shadows so we'll leave the rest to [the next article](webgl-shadows-continued.html).
