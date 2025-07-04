Title: FPS-подобное движение камеры с базовыми матричными трансформациями
Description: FPS-подобное движение камеры с базовыми матричными трансформациями
TOC: FPS-подобное движение камеры с базовыми матричными трансформациями

## Вопрос:

У меня простая сцена в WebGL, где я храню каждую трансформацию (для камеры и моделей) в одной модели/видовой матрице и устанавливаю их, вращая и перемещая эту матрицу.

Я хочу иметь возможность вращать камеру вокруг и когда я "двигаюсь вперёд", двигаться в направлении, куда указывает камера.

Пока что я изменил [этот][1] код на это:

        mat4.identity(mvMatrix);    
        mat4.rotateX(mvMatrix, degToRad(elev), mvMatrix);   
        mat4.rotateY(mvMatrix, degToRad(ang), mvMatrix);   
        mat4.rotateZ(mvMatrix, degToRad(-roll), mvMatrix);  
        mat4.translate(mvMatrix, [-px, -py, -pz], mvMatrix);
поскольку это не работало как было, и это вроде работает, пока вы не делаете экстремальное вращение (больше 90 градусов).

Это не критично для того, что я делаю, но я хочу знать. Это лучшее, что я могу получить, не отходя от расчёта ориентации камеры таким образом?

  [1]: https://stackoverflow.com/questions/18463868/webgl-translation-after-rotation-of-the-camera-as-an-fps

## Ответ:

WebGL камеры обычно указывают по оси -Z, так что чтобы двигаться в направлении, куда смотрит камера, вы просто добавляете Z-ось камеры (элементы 8, 9, 10) к позиции камеры, умноженной на некоторую скорость.

{{{example url="../webgl-qna-fps-like-camera-movement-with-basic-matrix-transformations-example-1.html"}}}



<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 3.0 у
    <a data-href="https://stackoverflow.com/users/3990721">George Daskalakis</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/47849579">stackoverflow</a>
  </div>
</div> 