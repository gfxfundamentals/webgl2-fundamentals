Title: WebGL2 相机可视化技术
Description: 如何绘制相机视锥体
TOC: 可视化相机

本文假设您已阅读[多视图文章](webgl-multiple-views.html)。若尚未阅读，请[先阅读该文章](webgl-multiple-views.html)。

本文同时假设您已阅读[码少趣多](webgl-less-code-more-fun.html)一文，
因示例中使用了该文提及的库以保持代码简洁。若您不理解缓冲区(buffer)、
顶点数组(vertex array)和属性(attribute)等概念，或对`twgl.setUniforms`
函数设置uniform变量的含义等等存在疑问，建议您先[基本原理](webgl-fundamentals.html)。

可视化相机视锥体（frustum）通常很有用，实现起来却出奇简单。
如[正交投影](webgl-3d-orthographic.html)和[透视投影](webgl-3d-perspective.html)文章所述，
这些投影矩阵将特定空间转换到裁剪空间的-1到+1范围。
而相机矩阵本质上只是表示相机在世界空间中的位置和方向的矩阵。

首先显而易见的是：若直接使用相机矩阵绘制物体，
我们将得到一个代表相机自身的对象。问题在于相机无法观察自身，
但通过[多视图文章](webgl-multiple-views.html)的技术方案，
我们可以设置两个视图系统，每个视图使用独立相机。第二视图将观察第一个视图，从而能看见我们绘制的、代表另一视图相机的对象。

首先创建表示相机的几何数据：构建一个立方体并在末端添加圆锥体，使用线段模式绘制。我们将通过[顶点索引](webgl-indexed-vertices.html)连接这些顶点。

[相机](webgl-3d-camera.html)默认朝向-Z方向观察，因此我们将立方体与圆锥体置于+Z侧，并使圆锥开口朝向-Z轴。

首先绘制立方体线框：

```js
// create geometry for a camera
function createCameraBufferInfo(gl) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0.
  const positions = [
    -1, -1,  1,  // cube vertices
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

接着添加圆锥体线框：

```js
// create geometry for a camera
function createCameraBufferInfo(gl) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0.
+  // We'll put a cone in front of this cube opening
+  // toward -Z
  const positions = [
    -1, -1,  1,  // cube vertices
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
+     0,  0,  1,  // cone tip
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
+  // add cone segments
+  const numSegments = 6;
+  const coneBaseIndex = positions.length / 3; 
+  const coneTipIndex =  coneBaseIndex - 1;
+  for (let i = 0; i < numSegments; ++i) {
+    const u = i / numSegments;
+    const angle = u * Math.PI * 2;
+    const x = Math.cos(angle);
+    const y = Math.sin(angle);
+    positions.push(x, y, 0);
+    // line from tip to edge
+    indices.push(coneTipIndex, coneBaseIndex + i);
+    // line from point on edge to next point on edge
+    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
+  }
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

最后添加缩放因子：由于字母F模型高150单位，而相机仅2-3单位大小，直接绘制会显得过小。可通过绘制时乘以缩放矩阵，或在此直接缩放几何数据实现。


```js
-function createCameraBufferInfo(gl) {
+function createCameraBufferInfo(gl, scale = 1) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0.
  // We'll put a cone in front of this cube opening
  // toward -Z
  const positions = [
    -1, -1,  1,  // cube vertices
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // cone tip
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // add cone segments
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3; 
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // line from tip to edge
    indices.push(coneTipIndex, coneBaseIndex + i);
    // line from point on edge to next point on edge
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }
+  positions.forEach((v, ndx) => {
+    positions[ndx] *= scale;
+  });
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

当前着色器程序使用顶点颜色绘制。现创建另一个使用纯色绘制的着色器程序。

```js
const colorVS = `#version 300 es
in vec4 a_position;

uniform mat4 u_matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
}
`;

const colorFS = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
</script>  
```

现在使用这两个着色器程序绘制场景：一个相机观察另一个场景。

```js
// setup GLSL programs
// compiles shaders, links program, looks up locations
-const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
+const vertexColorProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
+const solidColorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS]);

// create buffers and fill with data for a 3D 'F'
const fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
const fVAO = twgl.createVAOFromBufferInfo(gl, vertexColorProgramInfo, fBufferInfo);

...

+const cameraScale = 20;
+const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);
+const cameraVAO = twgl.createVAOFromBufferInfo(
+    gl, solidColorProgramInfo, cameraBufferInfo);

...

const settings = {
  rotation: 150,  // in degrees
+  cam1FieldOfView: 60,  // in degrees
+  cam1PosX: 0,
+  cam1PosY: 0,
+  cam1PosZ: -200,
};


function render() {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // we're going to split the view in 2
  const effectiveWidth = gl.canvas.clientWidth / 2;
  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // Compute a perspective projection matrix
  const perspectiveProjectionMatrix =
-      m4.perspective(fieldOfViewRadians), aspect, near, far);
+      m4.perspective(degToRad(settings.cam1FieldOfView), aspect, near, far);

  // Compute the camera's matrix using look at.
-  const cameraPosition = [0, 0, -75];
+  const cameraPosition = [
+      settings.cam1PosX, 
+      settings.cam1PosY,
+      settings.cam1PosZ,
+  ];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // center the 'F' around its origin
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // draw on the left with orthographic camera
  gl.viewport(0, 0, leftWidth, height);
  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0.8, 0.8, 1);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

  // draw on right with perspective camera
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0.8, 0.8, 1, 1);

  // compute a second projection matrix and a second camera
+  const perspectiveProjectionMatrix2 =
+      m4.perspective(degToRad(60), aspect, near, far);
+
+  // Compute the camera's matrix using look at.
+  const cameraPosition2 = [-600, 400, -400];
+  const target2 = [0, 0, 0];
+  const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

-  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
+  drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

+  // draw object to represent first camera
+  {
+    // Make a view matrix from the 2nd camera matrix.
+    const viewMatrix = m4.inverse(cameraMatrix2);
+
+    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
+    // use the first's camera's matrix as the matrix to position
+    // the camera's representative in the scene
+    mat = m4.multiply(mat, cameraMatrix);
+
+    gl.useProgram(solidColorProgramInfo.program);
+
+    // ------ Draw the Camera Representation --------
+
+    // Setup all the needed attributes.
+    gl.bindVertexArray(cameraVAO);
+
+    // Set the uniforms
+    twgl.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    // calls gl.drawArrays or gl.drawElements
+    twgl.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);
+  }
}
render();
```

现在可以在右侧场景中看到用于渲染左侧场景的相机。

{{{example url="../webgl-visualize-camera.html"}}}

同时绘制表示相机视锥体的几何体。

由于视锥体表示到裁剪空间的转换，我们可以创建代表裁剪空间的立方体，并运用投影矩阵的逆矩阵将其定位到场景中。

首先需要创建裁剪空间线框立方体。

```js
function createClipspaceCubeBufferInfo(gl) {
  // first let's add a cube. It goes from 1 to 3
  // because cameras look down -Z so we want
  // the camera to start at Z = 0. We'll put a
  // a cone in front of this cube opening
  // toward -Z
  const positions = [
    -1, -1, -1,  // cube vertices
     1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
    -1, -1,  1,
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return twgl.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

随后创建该立方体并进行绘制。

```js
const cameraScale = 20;
const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);
const cameraVAO = twgl.createVAOFromBufferInfo(
    gl, solidColorProgramInfo, cameraBufferInfo);

+const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl);
+const clipspaceCubeVAO = twgl.createVAOFromBufferInfo(
+    gl, solidColorProgramInfo, clipspaceCubeBufferInfo);
...

  // draw object to represent first camera
  {
    // Make a view matrix from the camera matrix.
    const viewMatrix = m4.inverse(cameraMatrix2);

    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
    // use the first's camera's matrix as the matrix to position
    // the camera's representative in the scene
    mat = m4.multiply(mat, cameraMatrix);

    gl.useProgram(solidColorProgramInfo.program);

    // ------ Draw the Camera Representation --------

    // Setup all the needed attributes.
    gl.bindVertexArray(cameraVAO);

    // Set the uniforms
    twgl.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);

+    // ----- Draw the frustum -------
+
+    mat = m4.multiply(mat, m4.inverse(perspectiveProjectionMatrix));
+
+    // Setup all the needed attributes.
+    gl.bindVertexArray(clipspaceCubeVAO);
+
+    // Set the uniforms
+    twgl.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    // calls gl.drawArrays or gl.drawElements
+    twgl.drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES);
  }
}
```

同时实现可调节第一相机近/远裁切面参数的功能。


```js
const settings = {
  rotation: 150,  // in degrees
  cam1FieldOfView: 60,  // in degrees
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
+  cam1Near: 30,
+  cam1Far: 500,
};

...

  // Compute a perspective projection matrix
  const perspectiveProjectionMatrix =
      m4.perspective(degToRad(settings.cam1FieldOfView),
      aspect,
-      near,
-      far);
+      settings.cam1Near,
+      settings.cam1Far);
```

现在可以同时观察到视锥体。

{{{example url="../webgl-visualize-camera-with-frustum.html"}}}

当调整近/远裁切面或视野角度至截断字母F时，可见视锥体与之匹配。

无论左侧相机采用透视投影还是正交投影均适用，因为投影矩阵始终将空间转换至裁剪空间，其逆矩阵总能正确地将我们的+1到-1立方体进行变形。

```js
const settings = {
  rotation: 150,  // in degrees
  cam1FieldOfView: 60,  // in degrees
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
  cam1Near: 30,
  cam1Far: 500,
+  cam1Ortho: true,
+  cam1OrthoUnits: 120,
};

...

// Compute a projection matrix
const perspectiveProjectionMatrix = settings.cam1Ortho
    ? m4.orthographic(
        -settings.cam1OrthoUnits * aspect,  // left
         settings.cam1OrthoUnits * aspect,  // right
        -settings.cam1OrthoUnits,           // bottom
         settings.cam1OrthoUnits,           // top
         settings.cam1Near,
         settings.cam1Far)
    : m4.perspective(degToRad(settings.cam1FieldOfView),
        aspect,
        settings.cam1Near,
        settings.cam1Far);
```

{{{example url="../webgl-visualize-camera-with-orthographic.html"}}}

此类可视化效果对于使用过[Blender](https://blender.org)等3D建模软件，
或[Unity](https://unity.com)、[Godot](https://godotengine.org/)等
带场景编辑工具的3D游戏引擎的用户应当非常熟悉。

该技术亦对调试工作极具实用价值。
