Title: Что такое локальное начало координат 3D модели?
Description: Что такое локальное начало координат 3D модели?
TOC: Что такое локальное начало координат 3D модели?

## Вопрос:

В этом коде я не могу понять, почему вращение не происходит по круговой траектории. Это может быть базовая логика, но я не понимаю, почему траектория такая случайная.

Я вращаю камеру по орбитальному движению, но она не следует за ним.

Насколько я понимаю, я создал орбитальную камеру, и обратная к ней — это матрица вида. Значит, матрица вида будет трансформировать мировое пространство для этого результата. Есть ли ошибка в моём мышлении?

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    const vertexShader = `#version 300 es

     in vec4 a_position;
     in vec4 a_color;

     out vec4 v_color;

     uniform mat4 u_matrix;

     void main(){
      gl_Position = u_matrix*a_position;
      v_color = a_color;
     }
    `;


    const fragShader = `#version 300 es

     precision highp float;

      in vec4 v_color;
      out vec4 frag_color;

      void main(){
       frag_color = v_color;
      }
    `;

    var cameraAngleDegree = 0;
    var  cameraAngle = 0;
    const radius = 100;
    var increment = 1;
    var numFs = 5;
    function main() {

        var canvas = document.querySelector("#canvas");
        var gl = canvas.getContext("webgl2");
        if (!gl) {
            return;
        }
        requestAnimationFrame(function() {
            init(gl);
        });
    }

    function init(gl) {


        const program = webglUtils.createProgramFromSources(gl, [vertexShader, fragShader]);

        const apositionLoc = gl.getAttribLocation(program, 'a_position');
        const acolorLoc = gl.getAttribLocation(program, 'a_color');
        const umatrixLoc = gl.getUniformLocation(program, 'u_matrix');

        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        setGeometry(gl);
        gl.enableVertexAttribArray(apositionLoc);

        let size = 3;
        let type = gl.FLOAT;
        let normalize = false;
        let stride = 0;
        let offset = 0;
        gl.vertexAttribPointer(apositionLoc, size, type, normalize, stride, offset);

        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        setColor(gl);
        gl.enableVertexAttribArray(acolorLoc);

        size = 3;
        type = gl.UNSIGNED_BYTE;
        normalize = true;
        stride = 0;
        offset = 0;
        gl.vertexAttribPointer(acolorLoc, size, type, normalize, stride, offset);

        let fov = degreeToRadian(60);
        cameraAngle = degreeToRadian(cameraAngleDegree);

        function degreeToRadian(deg) {
            return deg * Math.PI / 180;
        }

        function radToDegree(rad) {
            return rad * (180) / Math.PI;
        }

        drawScene();

        // webglLessonsUI.setupSlider("#cameraAngle", { value: radToDegree(cameraAngle), slide: updateCameraAngle, min: -360, max: 360 });

        // function updateCameraAngle(event, ui) {
        //     cameraAngle = degreeToRadian(ui.value);
        //     drawScene();
        // }


        function drawScene() {

            webglUtils.resizeCanvasToDisplaySize(gl.canvas);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.enable(gl.CULL_FACE);

            gl.enable(gl.DEPTH_TEST);

            gl.useProgram(program);

            let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

            let projection = m4.perspective(fov, aspect, 1, 1000);

            const fPosition = [radius, 0, 0];

            cameraAngleDegree += increment;

            cameraAngle =degreeToRadian(cameraAngleDegree);
            
            let camera = m4.yRotation(cameraAngle);
            camera = m4.translate(camera, 0, 100, 300);

            let cameraPosition = [camera[12], camera[13], camera[14]];

            // let up = [0, 1, 0];

            // camera = m4.lookAt(cameraPosition, fPosition, up);

            let viewMatrix = m4.inverse(camera);

            let viewProjection = m4.multiply(projection, viewMatrix);

            for (var ii = 0; ii < numFs; ++ii) {
                var angle = ii * Math.PI * 2 / numFs;

                var x = Math.cos(angle) * radius - 50;
                var z = Math.sin(angle) * radius - 15;
                var matrix = m4.translate(viewProjection, x, 0, z);

                // Set the matrix.
                gl.uniformMatrix4fv(umatrixLoc, false, matrix);

                // Draw the geometry.
                var primitiveType = gl.TRIANGLES;
                var offset = 0;
                var count = 16 * 6;
                gl.drawArrays(primitiveType, offset, count);
            }
            //     gl.uniformMatrix4fv(umatrixLoc, false, viewProjection);

            //     var primitives = gl.TRIANGLES;
            //     var count = 16 * 6;
            //     var offset = 0;
            //     gl.drawArrays(primitives, offset, count);

            // }

            requestAnimationFrame(function() {
                init(gl)
            });

        }
    }

    function setGeometry(gl) {

        let positions = new Float32Array([

            0, 0, 0,
            0, 150, 0,
            30, 0, 0,
            0, 150, 0,
            30, 150, 0,
            30, 0, 0,

            // top rung front
            30, 0, 0,
            30, 30, 0,
            100, 0, 0,
            30, 30, 0,
            100, 30, 0,
            100, 0, 0,

            // middle rung front
            30, 60, 0,
            30, 90, 0,
            67, 60, 0,
            30, 90, 0,
            67, 90, 0,
            67, 60, 0,

            // left column back
            0, 0, 30,
            30, 0, 30,
            0, 150, 30,
            0, 150, 30,
            30, 0, 30,
            30, 150, 30,

            // top rung back
            30, 0, 30,
            100, 0, 30,
            30, 30, 30,
            30, 30, 30,
            100, 0, 30,
            100, 30, 30,

            // middle rung back
            30, 60, 30,
            67, 60, 30,
            30, 90, 30,
            30, 90, 30,
            67, 60, 30,
            67, 90, 30,

            // top
            0, 0, 0,
            100, 0, 0,
            100, 0, 30,
            0, 0, 0,
            100, 0, 30,
            0, 0, 30,

            // top rung right
            100, 0, 0,
            100, 30, 0,
            100, 30, 30,
            100, 0, 0,
            100, 30, 30,
            100, 0, 30,

            // under top rung
            30, 30, 0,
            30, 30, 30,
            100, 30, 30,
            30, 30, 0,
            100, 30, 30,
            100, 30, 0,

            // between top rung and middle
            30, 30, 0,
            30, 60, 30,
            30, 30, 30,
            30, 30, 0,
            30, 60, 0,
            30, 60, 30,

            // top of middle rung
            30, 60, 0,
            67, 60, 30,
            30, 60, 30,
            30, 60, 0,
            67, 60, 0,
            67, 60, 30,

            // right of middle rung
            67, 60, 0,
            67, 90, 30,
            67, 60, 30,
            67, 60, 0,
            67, 90, 0,
            67, 90, 30,

            // bottom of middle rung.
            30, 90, 0,
            30, 90, 30,
            67, 90, 30,
            30, 90, 0,
            67, 90, 30,
            67, 90, 0,

            // right of bottom
            30, 90, 0,
            30, 150, 30,
            30, 90, 30,
            30, 90, 0,
            30, 150, 0,
            30, 150, 30,

            // bottom
            0, 150, 0,
            0, 150, 30,
            30, 150, 30,
            0, 150, 0,
            30, 150, 30,
            30, 150, 0,

            // left side
            0, 0, 0,
            0, 0, 30,
            0, 150, 30,
            0, 0, 0,
            0, 150, 30,
            0, 150, 0,

        ]);

        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    }

    function setColor(gl) {
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Uint8Array([
                // left column front
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,

                // top rung front
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,

                // middle rung front
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,
                200, 70, 120,

                // left column back
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,

                // top rung back
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,

                // middle rung back
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,
                80, 70, 200,

                // top
                70, 200, 210,
                70, 200, 210,
                70, 200, 210,
                70, 200, 210,
                70, 200, 210,
                70, 200, 210,

                // top rung right
                200, 200, 70,
                200, 200, 70,
                200, 200, 70,
                200, 200, 70,
                200, 200, 70,
                200, 200, 70,

                // under top rung
                210, 100, 70,
                210, 100, 70,
                210, 100, 70,
                210, 100, 70,
                210, 100, 70,
                210, 100, 70,

                // between top rung and middle
                210, 160, 70,
                210, 160, 70,
                210, 160, 70,
                210, 160, 70,
                210, 160, 70,
                210, 160, 70,

                // top of middle rung
                70, 180, 210,
                70, 180, 210,
                70, 180, 210,
                70, 180, 210,
                70, 180, 210,
                70, 180, 210,

                // right of middle rung
                100, 70, 210,
                100, 70, 210,
                100, 70, 210,
                100, 70, 210,
                100, 70, 210,
                100, 70, 210,

                // bottom of middle rung.
                76, 210, 100,
                76, 210, 100,
                76, 210, 100,
                76, 210, 100,
                76, 210, 100,
                76, 210, 100,

                // right of bottom
                140, 210, 80,
                140, 210, 80,
                140, 210, 80,
                140, 210, 80,
                140, 210, 80,
                140, 210, 80,

                // bottom
                90, 130, 110,
                90, 130, 110,
                90, 130, 110,
                90, 130, 110,
                90, 130, 110,
                90, 130, 110,

                // left side
                160, 160, 220,
                160, 160, 220,
                160, 160, 220,
                160, 160, 220,
                160, 160, 220,
                160, 160, 220,
            ]),
            gl.STATIC_DRAW);
    }

    main();

<!-- language: lang-html -->

    <!DOCTYPE html>
    <html>

    <head>
        <title>Traingle Webgl 2</title>
        <style type="text/css">
        @import url("https://webglfundamentals.org/webgl/resources/webgl-tutorials.css");

        body {
            margin: 0;
        }

        button {
            position: absolute;
        }

        canvas {
            width: 100vw;
            height: 100vh;
            display: block;
        }
        </style>
    </head>

    <body>
        <canvas id="canvas"></canvas>
        <div id="uiContainer">
            <div id="ui">
                <div id="cameraAngle"></div>
            </div>
        </div>
        <!--
    for most samples webgl-utils only provides shader compiling/linking and
    canvas resizing because why clutter the examples with code that's the same in every sample.
    See https://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
    and https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    for webgl-utils, m3, m4, and webgl-lessons-ui.
    -->
        <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
        <script src="https://webglfundamentals.org/webgl/resources/webgl-lessons-ui.js"></script>
        <script src="https://webglfundamentals.org/webgl/resources/m4.js"></script>
        <script src="https://greggman.github.io/webgl-helpers/webgl-gl-error-check.js"></script>
        <script type="text/javascript" src="js/lookat.js"></script>
        <!-- <script type="text/javascript" src="js/camera.js"></script> -->
    </body>

    </html>

<!-- end snippet -->



## Ответ:

Если я правильно понимаю ваш вопрос, проблема в том, что кажется, будто камера то приближается к F, то удаляется от них.

Проблема в том, что данные вершин для F построены так, что верхний левый передний угол находится в 0,0,0, оттуда они идут +X на 100 единиц (ширина 100 единиц), +Y на 150 единиц (высота 150 единиц), и +Z на 30 единиц (глубина 30 единиц).

Поэтому когда вы рисуете их вокруг круга радиусом 100 единиц, их начало координат — это та часть, которую вы позиционируете, и получается это:

[![enter image description here][1]][1]

Изображение сверху, так что F — это просто прямоугольники. Зелёный круг — это локальное начало координат каждой F, её локальные 0,0,0. Другие вершины F относительно этого локального начала, поэтому они ближе к внешнему кругу (орбите камеры) с одной стороны и дальше с другой.

Можно исправить, сдвинув F на -50 по X и -15 по Z. Другими словами:

```
            var angle = ii * Math.PI * 2 / numFs;

            var x = Math.cos(angle) * radius - 50;
            var z = Math.sin(angle) * radius - 15;
```

Что даёт такую ситуацию:

[![enter image description here][2]][2]

Локальное начало координат каждой F больше не на круге.

Также можно исправить, центрировав данные вершин F — пройти по всем вершинам и вычесть 50 из X и 15 из Z. Это даст такую ситуацию:

[![enter image description here][3]][3]

Теперь начало координат каждой F центрировано, и её локальное начало на круге.

Ещё один способ исправить — вычислить экстенты группы F, вычислить центр экстентов, переместить центр орбиты камеры туда, что даст такую ситуацию:

[![enter image description here][4]][4]

  [1]: https://i.stack.imgur.com/bW9Xo.png
  [2]: https://i.stack.imgur.com/CejYi.png
  [3]: https://i.stack.imgur.com/MiQ6Z.png
  [4]: https://i.stack.imgur.com/oysVQ.png

<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 4.0 у
    <a data-href="https://stackoverflow.com/users/5676603">pravin poudel</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/62557253">stackoverflow</a>
  </div>
</div> 