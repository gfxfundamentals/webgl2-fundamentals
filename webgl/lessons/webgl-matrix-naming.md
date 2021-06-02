Title: WebGL2 Matrix Naming
Description: Common names for matrices
TOC: 3D - Matrix Naming


This post is a continuation of a series of posts about WebGL. The first
[started with fundamentals](webgl-fundamentals.html) and the previous
was [about 3d cameras](webgl-3d-camera.html).

As the entire site has pointed out pretty much everything about WebGL is
100% up to you. Except for a few pre-defined names like `gl_Position`
almost everything about WebGL is defined by you, the programmer.

That said there are some common or semi-common naming conventions. Especially
when related to matrices. I don't know who first game up with these names. I
think I learned them [from NVidia's Standard Annotations and Semantics](https://www.nvidia.com/object/using_sas.html).
That's a little more formal as it was a way to try to make shaders work
in more situations by deciding on specific names. It's kind of out of date
but the basics are still around.

Here's the list from my head

*   world matrix (or sometimes model matrix)

    a matrix that takes the vertices of a model and moves them to world space

*   camera matrix

    a matrix that positions the camera in the world. Another way of saying
    that is it's the *world matrix* for the camera.

*   view matrix

    a matrix that moves everything else in the world in front of the camera.
    This is the inverse of the *camera matrix*.

*   projection matrix

    a matrix and converts a frustum of space into clip space or some orthographic
    space into clip space. Another way of thinking about this is it's the matrix
    returned by your matrix math library's `perspective` and/or `ortho` or
    `orthographic` function.

*   local matrix

    when using [a scene graph](webgl-scene-graph.html) the local matrix is the
    matrix at any particular node on the graph before multiplying with any other
    nodes.


If a shader needs a combination of these they are usually listed right to left
even though in the shader they'd be multiplied *on the right*. For example:

    worldViewProjection = projection * view * world

The other two common things to do with a matrix are to take the inverse

    viewMatrix = inverse(cameraMatrix)

And to transpose

    worldInverseTranspose = transpose(inverse(world))

Hopefully knowing these terms you can look at someone else's shader
and if you're lucky they used names that are close to or similar to
these ones. Then you can hopefully derive what those shaders are
actually doing.

Now let's [learn about animation next](webgl-animation.html).

