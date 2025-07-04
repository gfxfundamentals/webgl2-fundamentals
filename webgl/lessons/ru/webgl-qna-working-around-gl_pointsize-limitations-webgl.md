Title: Обход ограничений gl_PointSize в WebGL
Description: Как обойти ограничения gl_PointSize в WebGL
TOC: Обход ограничений gl_PointSize в WebGL

## Вопрос:

Я использую three.js для создания интерактивной визуализации данных. В этой визуализации рендерится 68000 узлов, каждый из которых имеет свой размер и цвет.

Сначала я пытался делать это через рендеринг мешей, но это оказалось слишком дорого по производительности. Сейчас я использую систему частиц three.js, где каждая точка — это узел визуализации.

Я могу управлять цветом и размером точки, но только до определённого предела. На моей видеокарте максимальный размер точки gl равен 63. Когда я увеличиваю масштаб визуализации, точки становятся больше — до определённого момента, а затем остаются 63 пикселя.

Я использую собственные vertex и fragment шейдеры:

vertex shader:

    attribute float size;
    attribute vec3 ca;
    varying vec3 vColor;

    void main() {
        vColor = ca;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
        gl_Position = projectionMatrix * mvPosition;
    }

fragment shader:

    uniform vec3 color;
    uniform sampler2D texture;

    varying vec3 vColor;

    void main() {
        gl_FragColor = vec4( color * vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
    }

Эти шейдеры почти дословно скопированы из одного из примеров three.js.

Я совсем новичок в GLSL, но ищу способ рисовать точки больше 63 пикселей. Могу ли я, например, рисовать меш для точек больше определённого размера, а для остальных использовать gl_point? Есть ли другие способы обойти это ограничение и рисовать точки больше 63 пикселей?

## Ответ:

Вы можете сделать свою собственную систему точек, используя массивы unit quad'ов + центральную точку, а затем масштабировать их по размеру в GLSL.

То есть, у вас будет 2 буфера. Один буфер — это просто 2D unitQuad, повторённый столько раз, сколько точек вы хотите нарисовать.

    var unitQuads = new Float32Array([
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    ]);

Второй буфер — это ваши точки, но позиции каждой точки нужно повторить 4 раза:

    var points = new Float32Array([
      p1.x, p1.y, p1.z, p1.x, p1.y, p1.z, p1.x, p1.y, p1.z, p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z, p2.x, p2.y, p2.z, p2.x, p2.y, p2.z, p2.x, p2.y, p2.z,
      p3.x, p3.y, p3.z, p3.x, p3.y, p3.z, p3.x, p3.y, p3.z, p3.x, p3.y, p3.z,
      p4.x, p4.y, p4.z, p4.x, p4.y, p4.z, p4.x, p4.y, p4.z, p4.x, p4.y, p4.z,
      p5.x, p5.y, p5.z, p5.x, p5.y, p5.z, p5.x, p5.y, p5.z, p5.x, p5.y, p5.z,
    ]);

Настройте ваши буферы и атрибуты:

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, unitQuads, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(unitQuadLoc);
    gl.vertexAttribPointer(unitQuadLoc, 2, gl.FLOAT, false, 0, 0);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(pointLoc);
    gl.vertexAttribPointer(pointLoc, 3, gl.FLOAT, false, 0, 0);

В вашем GLSL-шейдере вычисляйте нужный gl_PointSize, затем умножайте unitQuad на этот размер в view space или screen space. Screen space будет вести себя как обычный gl_Point, но часто хочется, чтобы точки масштабировались в 3D, как обычные объекты — тогда используйте view space.

    attribute vec2 a_unitQuad;
    attribute vec4 a_position;
    uniform mat4 u_view;
    uniform mat4 u_viewProjection;

    void main() {
       float fake_gl_pointsize = 150;
       
       // Получаем xAxis и yAxis во view space
       // это unit-векторы, то есть направления, перпендикулярные взгляду
       vec3 x_axis = view[0].xyz;
       vec3 y_axis = view[1].xyz;
       
       // умножаем их на нужный размер
       x_axis *= fake_gl_pointsize;
       y_axis *= fake_gl_pointsize;

       // умножаем на unitQuad, чтобы получить quad вокруг центра
       vec3 local_point = vec3(x_axis * a_unitQuad.x + y_axis * a_unitQuad.y);

       // добавляем позицию, где хотим разместить quad
       local_point += a_position;

       // обычная математика для шейдера
       gl_Position = u_viewProjection * local_point;
    }

Возможно, это звучит сложно, но есть рабочий пример [здесь][1]

  [1]: https://www.khronos.org/registry/webgl/sdk/demos/google/particles/

<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 3.0 у
    <a data-href="http://tech-foo.net">Thomi</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/15371940">stackoverflow</a>
  </div>
</div> 