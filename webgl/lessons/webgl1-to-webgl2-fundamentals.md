Title: Differences from WebGLFundamentals.org
Description: The differences between WebGLFundamentals.org and WebGL2Fundamentals.org
TOC: Differences from WebGLFundamentals.org to WebGL2Fundamentals.org


If you previously read [webglfundamentals.org](https://webglfundamentals.org)
there are some differences that you should be aware of.

## Multiline Template Literals

On webglfundamentals.org nearly all scripts are stored
in non-javascript `<script>` tags.

    <script id="vertexshader" type="not-js">;
    shader
    goes
    here
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

On webgl2fundamentals.org I've switched to using
multiline template literals.

    var vertexShaderSource = `
    shader
    goes
    here
    `;

Multiline template literals are supported on all WebGL capable
browsers except IE11. If you need to target IE11 consider using a
transpiler like [babel](https://babeljs.io).

## All Shaders use version GLSL 300 es

I switched all the shaders to GLSL 300 es. I figured what's the point
of using WebGL2 if you're not going to use WebGL2 shaders.

## All examples use Vertex Array Objects

Vertex Array Objects are an optional feature in WebGL1, but
they are a standard feature of WebGL2. [I think they should
be used everywhere](webgl1-to-webgl2.html#Vertex-Array-Objects).
In fact I almost think I should go back
to webglfundamentals.org and use them everywhere [using
a polyfill](https://github.com/greggman/oes-vertex-array-object-polyfill)
for those few places they are not available. There is arguably zero
downside and your code gets easier and more efficient in almost
all cases.

## Other minor changes

*  I tried to re-structure many samples slightly to show the most common patterns.

   For example most apps generally set global WebGL state like blending, culling, and depth testing
   in their render loop since those settings often change several times whereas on
   webglfundamentals.org I set them at init time because they only needed to be
   set once, but that's not a common pattern.

*  I set the viewport in all samples

   I left this out in webglfundamentals.org because the samples
   don't actually need it, but it's needed in just about all real world code.

*  I removed jquery.

   Back when I started, `<input type="range">` was maybe still not commonly
   supported, but now it's supported everywhere.

*  I made all helper functions have a prefix

   Code like

       var program = createProgramFromScripts(...)

   is now

       webglUtils.createProgramFromSources(...);

   I hope this makes it more clear what these functions
   are and where to find them.

## What's next

I'm debating whether or not to change any of the webglfundamentals
examples to match. It took a couple of weeks of solid work to edit
all the existing examples and articles. I mostly feel within 12 months
WebGL1 will be mostly replaced by WebGL2 because all the browsers
are on auto update. Firefox and Chrome will ship WebGL2 soon, covering
a large percentage of users on desktop and Android. If Apple and Microsoft
add WebGL2 support to Safari macOS, Safari iOS, and Edge respectively,
then probably the majority of people will be covered
and we can all just move on to WebGL2.

Hopefully I'll find time to add more articles.
Given the point above, all new articles will be WebGL2 only from now on,
I think.


