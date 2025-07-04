Title: Как реализовать зум от мыши в 2D WebGL
Description: Как реализовать зум от мыши в 2D WebGL
TOC: Как реализовать зум от мыши в 2D WebGL

## Вопрос:

Я сейчас делаю 2D-рисовалку на WebGL. Хочу реализовать зум к точке под курсором мыши, как в [этом примере](https://stackoverflow.com/a/53193433/2594567). Но не могу понять, как применить решение из того ответа в своём случае.

Я сделал базовый зум через масштабирование матрицы камеры. Но он увеличивает к левому верхнему углу canvas, потому что это начало координат (0,0), заданное проекцией (насколько я понимаю).

Базовый пан и зум реализованы:
![img](https://i.imgur.com/asRTm1e.gif)

### Моя функция draw (включая вычисления матриц) выглядит так:

```javascript
var projection = null;
var view = null;
var viewProjection = null;

function draw(gl, camera, sceneTree){
  // projection matrix
  projection = new Float32Array(9);
  mat3.projection(projection, gl.canvas.clientWidth, gl.canvas.clientHeight);
  
  // camera matrix
  view = new Float32Array(9);
  mat3.fromTranslation(view, camera.translation);
  mat3.rotate(view, view, toRadians(camera.rotation));
  mat3.scale(view, view, camera.scale);
  // view matrix
  mat3.invert(view, view)

  // VP matrix
  viewProjection = new Float32Array(9);
  mat3.multiply(viewProjection, projection, view);

  // go through scene tree:
  //  - build final matrix for each object
  //      e.g: u_matrix = VP x Model (translate x rotate x scale)  
  
  // draw each object in scene tree
  // ... 
}
```

### Вершинный шейдер:
```
attribute vec2 a_position;

uniform mat3 u_matrix;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
```

### Функция зума:

```javascript

function screenToWorld(screenPos){
  // normalized screen position 
  let nsp = [
     2.0 * screenPos[0] / this.gl.canvas.width - 1,
     - 2.0 * screenPos[1] / this.gl.canvas.height + 1
  ];
    
  let inverseVP = new Float32Array(9);
  mat3.invert(inverseVP, viewProjection);

  let worldPos = [0, 0];
  return vec2.transformMat3(worldPos, nsp, inverseVP);
}

var zoomRange = [0.01, 2];

canvas.addEventListener('wheel', (e) => {
  let oldZoom = camera.scale[0];
  let zoom = Math.min(Math.max(oldZoom + e.deltaX / 100, zoomRange[0]), zoomRange[1]);

  camera.scale = [zoom, zoom];

  let zoomPoint = screenToWorld([e.clientX, e.clientY]);
  // totally breaks if enable this line 
  //vec2.copy(camera.translation, zoomPoint);
  
  // call draw function again
  draw();

}, false); 
```


Если я применяю `zoomPoint` к трансляции камеры, значения `zoomPoint` (и позиция камеры соответственно) начинают неуправляемо расти при каждом событии зума (неважно, увеличиваю я или уменьшаю), и объекты в сцене сразу выходят из вида.

Буду очень благодарен за любые идеи или подсказки, что я делаю не так. Спасибо.

## Ответ:

Поскольку вы не выложили **минимальный воспроизводимый пример** в самом вопросе, я не мог проверить с вашей библиотекой матриц. Используя свою, я смог реализовать зум так:

```
  const [clipX, clipY] = getClipSpaceMousePosition(e);
  
  // позиция до зума
  const [preZoomX, preZoomY] = m3.transformPoint(
      m3.inverse(viewProjectionMat), 
      [clipX, clipY]);
    
  // умножаем движение колеса на текущий уровень зума
  // чтобы зумить меньше при большом увеличении и больше при малом
  const newZoom = camera.zoom * Math.pow(2, e.deltaY * -0.01);
  camera.zoom = Math.max(0.02, Math.min(100, newZoom));
  
  updateViewProjection();
  
  // позиция после зума
  const [postZoomX, postZoomY] = m3.transformPoint(
      m3.inverse(viewProjectionMat), 
      [clipX, clipY]);

  // камеру нужно сдвинуть на разницу до и после
  camera.x += preZoomX - postZoomX;
  camera.y += preZoomY - postZoomY;  
```

Обратите внимание, что зум — это противоположность scale. Если zoom = 2, то я хочу, чтобы всё выглядело в 2 раза больше. Для этого нужно *уменьшить* пространство камеры, то есть масштабировать его на 1 / zoom.

Пример:

{{{example url="../webgl-qna-how-to-implement-zoom-from-mouse-in-2d-webgl-example-1.html"}}}

Обратите внимание, что я добавил camera.rotation, чтобы убедиться, что всё работает и при повороте. Похоже, работает. [Вот пример с зумом, панорамой и вращением](https://jsfiddle.net/greggman/mdpxw3n6/)

<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 4.0 у
    <a data-href="https://stackoverflow.com/users/2594567">nicktgn</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/57892652">stackoverflow</a>
  </div>
</div> 