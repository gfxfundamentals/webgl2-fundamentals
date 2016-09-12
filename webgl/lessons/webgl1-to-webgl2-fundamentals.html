Title: Differences from WebGLFundamentals.org
Description: The differences between WebGLFundamentals.org and WebGL2Fundamentals.org

If you previously read [webglfundamentals.org](http://webglfundamentals.org)
there are some differences that you should be aware of.

## Matrix Math

The biggest difference is the a change to the 2d and 3d math libraries.
On webglfundamentals.org the libraries were standalone functions like

    makeTranslation
    makeScale

On webgl2fundamentals.org the libraries have been changed
to be more library like as in

    m4.translation
    m4.scale

The most important difference though is the order of multiplication
has changed. On webglfundamentals.org you might see multiplication like
this

    var matrix = makeIdentity();
    matrix = matrixMultiply(matrix, worldMatrix);
    matrix = matrixMultiply(matrix, viewMatrix);
    matrix = matrixMultiply(matrix, projectionMatrix);

On webgl2fundamentals.org that has order has changed

    var matrix = m4.identity();
    matrix = m4.multiply(matrix, projectionMatrix);
    matrix = m4.multiply(matrix, viewMatrix);
    matrix = m4.multiply(matrix, worldMatrix);

It was pointed out to me this is the more common
order.

On top of that I've added multiply in place style
functions. In other words, on webglfundamentals.org
you might see this

    var translationMatrix = makeTranslation(tx, ty, tz);
    var rotationMatrix = makeZRotation(angle);
    var scaleMatrix = makeScale(sx, sy, sz);

    var worldMatrix = makeIdentity();
    worldMatrix = matrixMultiply(matrix, scaleMatrix);
    worldMatrix = matrixMultiply(matrix, rotationMatrix);
    worldMatrix = matrixMultiply(matrix, translationMatrix);

On webgl2fundamentals.org that would be shortened to this

    var worldMatrix = m4.identity();
    worldMatrix = m4.translate(worldMatrix, tx, ty, tz);
    worldMatrix = m4.zRotate(worldMatrix, angle);
    worldMatrix = m4.scale(worldMatrix, sx, sy, sz);

Note the difference in the names of the functions.
The functions `m4.translation`, `m4.zRotation`, `m4.scaling`
repectively make a translation, z rotation, and scaling matrix.
Where as, the functions `m4.translate`, `m4.zRotate`, `m4.scale`
are verbs and translate, z rotate, and scale the matrix
passed into them.

## Multiline Template Literals

On webglfundamentals.org nearly all scripts are stored
in non-javascript `<script>` tags.

    &lt;script id="vertexshader" type="not-js"&gt;
    shader
    goes
    here
    &lt;/script&gt;

    ...

    var vertexShaderSource = document.getElementById("vertexshader").text;

On webgl2fundamentals.org I've switched to using
multiline template literals

    var vertexShaderSource = `
    shader
    goes
    here
    `;

multiline template literals are supported on all WebGL capable
browsers except IE11. If you need to target IE11 consider using a
transpiler like [babel](http://babeljs.io).

## All Shaders use version GLSL 300 es

I switched all the shaders to GLSL 300 es. I figured What's the point
of using WebGL2 if you're not going to use WebGL2 shaders.

## All examples use Vertex Array Objects

Vertex Array Objects are an optional feature on WebGL1 but
they are a standard feature of WebGL2. [I think they should
be used everywhere](webgl1-to-webgl2.html#Vertex-Array-Objects).
In fact I almost think I should go back
to webglfundamentals.org and use them everywhere [using a
a polyfill](https://github.com/greggman/oes-vertex-array-object/)
for those few places they are not available. There is arguably zero
downside and your code gets easier and more efficient in almost
all cases.

## Other minor changes

*  I tried to re-structure many samples just slight to show the most common patterns

   For example most apps generally set global WebGL state like blending, culling, depth testing
   in their render loop since those settings often change several times.

   On webglfundamentals.org I set them at init time because for the example
   they only needed to be set once but that's not a common pattern.

*  I set the viewport in all samples

   I left this out in webglfundamentals.org because the samples
   don't actually need it but it's needed in just about all real world code.

*  I removed jquery.

   Back when I started it was still maybe still not common to
   support `&lt;input type="range"&gt;` but now it's supported
   everywhere.

*  I made all helper functions have a prefix

   code like

       setupLesson(canvas);
       var program = createProgramFromScripts(...)

   is now

       webglLessonHelper.setupLesson(canvas);
       webglUtils.createProgramFromSources(...);

   I hope this makes it more clear what those functions
   are and where to find them.

## What's next

I'm debating whether or not to change any of the webglfundamentals
examples to match. It took a couple of weeks of solid work to edit
all the existing examples and articles. I mostly feel within 12 months
WebGL1 will be mostly replaced by WebGL2 because all the browsers
are on auto update. Firefox and Chrome will ship WebGL2 soon covering
a large percentage of users on desktop and Android. If Apple and Microsoft
add WebGL2 support to Safari macOS, Safari iOS and Edge respectively
then probably the majority of people will be covered by WebGL1
and we can all just move on to WebGL2.

Hopefully I'll find time to add more articles.
Given the point above, from now on all new articles will be WebGL2 only
I think.


