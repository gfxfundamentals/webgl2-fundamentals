Title: Как читать один компонент с помощью readPixels
Description: Как читать один компонент с помощью readPixels
TOC: Как читать один компонент с помощью readPixels

## Вопрос:

Я конвертировал RGBA изображение в оттенки серого с помощью WebGL.

При чтении пикселей с помощью `gl.readPixels()` с форматом `gl.RGBA` получаю значения для каждого пикселя как YYYA, потому что RGBA пиксель конвертируется в YYYA и присваивается `gl_FragColor`. Я хочу только 1 байт Y-компонента для каждого пикселя вместо 4 байт.

Попробовал читать пиксели с форматом `gl.RED` (вместо `gl.RGBA`)

```
gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RED, gl.UNSIGNED_BYTE, pixels);
```

но получаю следующую ошибку в Chrome и только нули:

```
WebGL: INVALID_ENUM: readPixels: invalid format
```

1. Можно ли заставить `gl_FragColor` выводить 1 байт на пиксель в режиме LUMINANCE вместо RGBA, но входная текстура должна быть RGBA?
2. Если формат рендеринга gl нельзя изменить, можно ли читать только первый байт каждого 4-байтового пикселя при вызове `gl.readPixels()`?

Примечание:
3. Я уже делаю копию вывода `gl.readPixels()` в другой массив, перепрыгивая каждые 4 байта. Но хочу избежать этой копии, так как это занимает больше времени.
4. Также нужно, чтобы решение было совместимо с мобильными браузерами (iOS Safari и Android Chrome).

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function webGL() {
        var gTexture;
        var gFramebuffer;
        var srcCanvas = null;
        var programs = {};
        var program;
        var pixels;

        this.convertRGBA2Gray = function(inCanvas, inArray) {
            // Y компонент из YCbCr
            const shaderSourceRGB2GRAY = `
                    precision mediump float;

                    uniform sampler2D u_image;
                    uniform vec2 u_textureSize;
                    vec4 scale = vec4(0.299,  0.587,  0.114, 0.0);
                    void main() {
                        vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
                        gl_FragColor = vec4(vec3(dot(color,scale)), color.a);
                    }`;

            if (srcCanvas === null) {
                console.log('Setting up webgl');
                srcCanvas = inCanvas;
                _initialize(srcCanvas.width, srcCanvas.height);
                program = _createProgram("rgb2grey", shaderSourceRGB2GRAY);
            }
            pixels = inArray;
            _run(program);
        }

        ///////////////////////////////////////
        // Приватные функции

        var _getWebGLContext = function(canvas) {
            try {
                return (canvas.getContext("webgl", {premultipliedAlpha: false, preserveDrawingBuffer: true}) || canvas.getContext("experimental-webgl", {premultipliedAlpha: false, preserveDrawingBuffer: true}));
            }
            catch(e) {
                console.log("ERROR: %o", e);
            }
            return null;
        }

        var gl = _getWebGLContext(document.createElement('canvas'));

        var _initialize = function(width, height) {
            var canvas = gl.canvas;
            canvas.width = width;
            canvas.height = height;

            if (this.originalImageTexture) {
                return;
            }

            this.originalImageTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, gTexture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, null);

            gFramebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, gFramebuffer);

            var positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1.0,  1.0,
                1.0,  1.0,
                1.0, -1.0,

                -1.0,  1.0,
                1.0, -1.0,
                -1.0, -1.0
                ]), gl.STATIC_DRAW);

            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gTexture, 0);

            gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
        }

        var _createProgram = function(name, fragmentSource, vertexSource) {
            shaderProgram = programs[name];

            if (shaderProgram){
                console.log('Reusing program');
                gl.useProgram(shaderProgram);
                return shaderProgram;
            }

            function createShader(type, source){
                var shader = gl.createShader(type);

                gl.shaderSource(shader, source);

                gl.compileShader(shader);  

                return shader;
            }

            var vertexShader, fragmentShader;

            if (!vertexSource){
                vertexShader = createShader(gl.VERTEX_SHADER,   `attribute vec2 a_position;
                                                                void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`
                                                                );
            } else {
                vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
            }
            fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            gl.useProgram(shaderProgram);
            return shaderProgram;
        }

        var _render = function(gl, program){
      var positionLocation = gl.getAttribLocation(program, "a_position"); 

      var u_imageLoc = gl.getUniformLocation(program, "u_image");
      var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLocation);

      var width = gl.canvas.width,
       height = gl.canvas.height;

      gl.bindFramebuffer(gl.FRAMEBUFFER, gFramebuffer);

      gl.uniform2f(textureSizeLocation, width, height);
      
      gl.uniform1i(u_imageLoc, 0);

      gl.viewport(0, 0, width, height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

     }

        var _run = function(program){
            let t0 = performance.now();
            _render(gl, program);
            gl.bindTexture(gl.TEXTURE_2D, gTexture);
            let t1 = performance.now();

            // gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RED, gl.UNSIGNED_BYTE, pixels);

            let t2 = performance.now();
            console.log('_render dur = ' + Number((t1-t0).toFixed(3)) + ' ms');
            console.log('_run dur = ' + Number((t2-t0).toFixed(3)) + ' ms');
        }

    };


<!-- language: lang-html -->

    <div>
        <canvas id="source"></canvas>
    </div>

    <script src="webgl.js" type="text/javascript"></script>

    <script>
        window.addEventListener('load', function(e) {
            var srcImg = new Image();
            srcImg.crossOrigin = "anonymous";
            srcImg.src = "https://i.picsum.photos/id/17/480/480.jpg";
            srcImg.width = 480;
            srcImg.height = 480;

            srcImg.onload = function(){
                // изображение загружено
                let srcCanvas = document.getElementById("source");
                srcCanvas.width = srcImg.width;
                srcCanvas.height = srcImg.height;

                let ctx = srcCanvas.getContext('2d');
                ctx.drawImage(srcImg, 0, 0, srcImg.width, srcImg.height);

                var webgl = new webGL();
                let pixels = new Uint8Array(srcCanvas.width * srcCanvas.height * 4);
                webgl.convertRGBA2Gray(srcCanvas, pixels);

                var outData = ctx.createImageData(srcCanvas.width, srcCanvas.height);

                console.log('\n');
                for (let k = 0; k < 12; ++k) {
                    console.log(pixels[k] + ', ');
                }
                console.log('\n');

                // График яркости
                for (let i = 0, j = 0; i < (srcCanvas.width * srcCanvas.height * 4); i+=4, ++j ) {
                    outData.data[i] = outData.data[i+1] = outData.data[i+2] = pixels[j];
                    outData.data[i+3] = 255;
                }

                // RGB график
                // for ( let i = 0; i < (srcCanvas.width * srcCanvas.height * 4); ++i ) {
                //     outData.data[i] = pixels[i];
                // }

                srcCanvas.getContext('2d').putImageData(outData, 0, 0);

            };

        }, true);

    </script>


<!-- end snippet -->



## Ответ:

> Можно ли заставить gl_FragColor выводить 1 байт на пиксель в режиме LUMINANCE вместо RGBA, но входная текстура должна быть RGBA?

Не переносимо. Спецификация WebGL1 говорит, что рендеринг в текстуру должен поддерживаться только для gl.RGBA / gl.UNSIGNED_BYTE. Все остальные форматы опциональны.

> Если формат рендеринга gl нельзя изменить, можно ли читать только первый байт каждого 4-байтового пикселя при вызове gl.readPixels()?

Нет, [Спецификация](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf) раздел 4.3.1 говорит, что поддерживается только `gl.RGBA`, `gl.UNSIGNED_BYTE`. Все остальные форматы опциональны и зависят от реализации. То же самое в WebGL2. Даже если вы создадите R8 текстуру (только красный, 8 бит), зависит от реализации, можете ли вы читать её как `gl.RED`/`gl.UNSIGNED_BYTE`.

Смотрите [Webgl1](https://webglfundamentals.org/webgl/lessons/webgl-readpixels.html) и [Webgl2](https://webgl2fundamentals.org/webgl/lessons/webgl-readpixels.html)

<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/7718655">rayen</a>
    из
    <a data-href="https://stackoverflow.com/questions/60796680">здесь</a>
  </div>
</div> 