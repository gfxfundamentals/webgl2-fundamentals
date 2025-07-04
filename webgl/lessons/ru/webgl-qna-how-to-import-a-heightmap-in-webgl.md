Title: Как импортировать карту высот в WebGL
Description: Как импортировать карту высот в WebGL
TOC: Как импортировать карту высот в WebGL

## Вопрос:

Я знаю, что в теории нужно сначала найти координаты на карте высот, например (x = `ширина HM / ширина Terrain * x Terrain`) и y координату (`y = высота HM / высота Terrain * y Terrain`), и после получения местоположения на карте высот мы получаем реальную высоту по формуле `min_height + (colorVal / (max_color - min_color) * *max_height - min_height`), возвращая Z значение для конкретного сегмента.

Но как я могу реально импортировать карту высот и получить её параметры? Я пишу на JavaScript без дополнительных библиотек (three, babylon).

**edit**

Сейчас я жёстко кодирую Z значения на основе диапазонов x и y:

        Plane.prototype.modifyGeometry=function(x,y){
        if((x>=0&&x<100)&&(y>=0&&y<100)){
            return 25;
        }
        else if((x>=100&&x<150)&&(y>=100&&y<150)){
            return 20;
        }
        else if((x>=150&&x<200)&&(y>=150&&y<200)){
            return 15;
        }
        else if((x>=200&&x<250)&&(y>=200&&y<250)){
            return 10;
        }
        else if((x>=250&&x<300)&&(y>=250&&y<300)){
            return 5;
        }
        else{
            return 0;
        }

** edit **

Я могу получить плоскую сетку (или с случайно сгенерированными высотами), но как только я добавляю данные изображения, получаю пустой экран (хотя ошибок нет). Вот код (я немного изменил его):


    
    var gl;
    var canvas;
    
    var img = new Image();
    // img.onload = run;
    img.crossOrigin = 'anonymous';
    img.src = 'https://threejsfundamentals.org/threejs/resources/images/heightmap-96x64.png';
    
    
    var gridWidth;
    var gridDepth;
    var gridPoints = [];
    var gridIndices = [];
    var rowOff = 0;
    var rowStride = gridWidth + 1;
    var numVertices = (gridWidth * 2 * (gridDepth + 1)) + (gridDepth * 2 * (gridWidth + 1));
    
    
    //создание плоскости
    function generateHeightPoints() {
    
        var ctx = document.createElement("canvas").getContext("2d"); //используем 2d canvas для чтения изображения
        ctx.canvas.width = img.width;
        ctx.canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        gridWidth = imgData.width - 1;
        gridDepth = imgData.height - 1;
    
        for (var z = 0; z <= gridDepth; ++z) {
            for (var x = 0; x <= gridWidth; ++x) {
                var offset = (z * imgData.width + x) * 4;
                var height = imgData.data[offset] * 10 / 255;
                gridPoints.push(x, height, z);
            }
        }
    }

    function generateIndices() {
    for (var z = 0; z<=gridDepth; ++z) {
        rowOff = z*rowStride;
        for(var x = 0; x<gridWidth; ++x) {
            gridIndices.push(rowOff+x,rowOff+x+1);
        }
    }
    
    for (var x = 0; x<=gridWidth; ++x) {
        for(var z = 0; z<gridDepth; ++z) {
            rowOff = z * rowStride;
            gridIndices.push(rowOff+x,rowOff+x+rowStride);
        }
    }
    }
    //init
    
    //инициализация программы
    window.onload = function init()
    { 
    canvas = document.getElementById( "gl-canvas" );
    
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

   


    generateHeightPoints();
    generateIndices();


    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridPoints), 
    gl.STATIC_DRAW);
        
        var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(gridIndices), 
     gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var matrixLoc = gl.getUniformLocation(program, 'matrix');

    var m4 = twgl.m4;
    var projection = m4.perspective(60 * Math.PI / 180, gl.canvas.clientWidth / 
    gl.canvas.clientHeight, 0.1, 100);
    var cameraPosition = [-18, 15, -10];
    var target = [gridWidth / 2, -10, gridDepth / 2];
    var up = [0, 1, 0];
    var camera = m4.lookAt(cameraPosition, target, up);
    var view = m4.inverse(camera);
    var mat = m4.multiply(projection, view);

    gl.uniformMatrix4fv(matrixLoc, false, mat);


  

     render();

   


    }
    
    
    
    function render() {

   
    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_SHORT, 0);



    gl.drawElements(gl.LINES,numVertices,gl.UNSIGNED_SHORT,0);
    requestAnimFrame(render);
    }










## Ответ:

Вы просто создаёте сетку точек и изменяете Z значения.

Сначала плоская сетка

{{{example url="../webgl-qna-how-to-import-a-heightmap-in-webgl-example-1.html"}}}

Сетка с картой высот.

Вот серое изображение, которое мы можем использовать как карту высот

<img src="https://threejsfundamentals.org/threejs/resources/images/heightmap-96x64.png" width="486">

Читайте его, загружая изображение, рисуя на 2D canvas, вызывая getImageData. Затем просто читайте красные значения для высоты.

{{{example url="../webgl-qna-how-to-import-a-heightmap-in-webgl-example-2.html"}}}

Затем вместо создания сетки линий создайте сетку треугольников. Есть много способов это сделать. Вы можете поставить 2 треугольника на квадрат сетки. Этот код ставит 4. Вам также нужно генерировать нормали. Я скопировал код для генерации нормалей из [этой статьи](https://webglfundamentals.org/webgl/lessons/webgl-3d-geometry-lathe.html), который является довольно универсальным кодом генерации нормалей. Будучи сеткой, вы можете создать генератор нормалей, специфичный для сетки, который будет быстрее, поскольку будучи сеткой вы знаете, какие вершины общие.

Этот код также использует [twgl](https://twgljs.org), потому что WebGL слишком многословен, но должно быть понятно, как сделать это в обычном WebGL, читая названия функций twgl.

{{{example url="../webgl-qna-how-to-import-a-heightmap-in-webgl-example-3.html"}}}



<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/7088515">cosmo</a>
    из
    <a data-href="https://stackoverflow.com/questions/59253917">здесь</a>
  </div>
</div> 