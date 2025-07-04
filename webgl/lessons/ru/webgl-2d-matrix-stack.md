Title: WebGL2 Реализация Стекла Матриц
Description: Как реализовать функции translate/rotate/scale из Canvas 2D в WebGL
TOC: 2D - Стек Матриц


Эта статья является продолжением [WebGL 2D DrawImage](webgl-2d-drawimage.html).
Если вы не читали её, я рекомендую [начать оттуда](webgl-2d-drawimage.html).

В той последней статье мы реализовали WebGL эквивалент функции `drawImage` из Canvas 2D,
включая её способность указывать как исходный прямоугольник, так и прямоугольник назначения.

Что мы ещё не сделали - это позволить нам вращать и/или масштабировать изображение из любой произвольной точки. Мы могли бы сделать это, добавив больше аргументов, как минимум нам нужно было бы указать центральную точку, поворот и масштаб по x и y.
К счастью, есть более универсальный и полезный способ. Способ, которым Canvas 2D API делает это - это стек матриц.
Функции стека матриц Canvas 2D API: `save`, `restore`, `translate`, `rotate` и `scale`.

Стек матриц довольно прост в реализации. Мы создаём стек матриц. Мы создаём функции для
умножения верхней матрицы стека на матрицу перевода, поворота или масштабирования,
[используя функции, которые мы создали ранее](webgl-2d-matrices.html).

Вот реализация

Сначала конструктор и функции `save` и `restore`

```
function MatrixStack() {
  this.stack = [];

  // поскольку стек пуст, это поместит начальную матрицу в него
  this.restore();
}

// Извлекает верхний элемент стека, восстанавливая ранее сохранённую матрицу
MatrixStack.prototype.restore = function() {
  this.stack.pop();
  // Никогда не позволяем стеку быть полностью пустым
  if (this.stack.length < 1) {
    this.stack[0] = m4.identity();
  }
};

// Помещает копию текущей матрицы в стек
MatrixStack.prototype.save = function() {
  this.stack.push(this.getCurrentMatrix());
};
```

Нам также нужны функции для получения и установки верхней матрицы

```
// Получает копию текущей матрицы (верх стека)
MatrixStack.prototype.getCurrentMatrix = function() {
  return this.stack[this.stack.length - 1].slice();  // создаёт копию
};

// Позволяет нам установить текущую матрицу
MatrixStack.prototype.setCurrentMatrix = function(m) {
  return this.stack[this.stack.length - 1] = m;
};

```

Наконец, нам нужно реализовать `translate`, `rotate` и `scale`, используя наши
предыдущие матричные функции.

```
// Переводит текущую матрицу
MatrixStack.prototype.translate = function(x, y, z) {
  if (z === undefined) {
    z = 0;
  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

// Вращает текущую матрицу вокруг Z
MatrixStack.prototype.rotateZ = function(angleInRadians) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.zRotate(m, angleInRadians));
};

// Масштабирует текущую матрицу
MatrixStack.prototype.scale = function(x, y, z) {
  if (z === undefined) {
    z = 1;
  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

Обратите внимание, что мы используем 3D матричные математические функции. Мы могли бы просто использовать `0` для `z` при переводе и `1`
для `z` при масштабировании, но я обнаружил, что я так привык использовать 2D функции из Canvas 2D,
что часто забываю указать `z`, и тогда код ломается, поэтому давайте сделаем `z` необязательным

```
// Переводит текущую матрицу
MatrixStack.prototype.translate = function(x, y, z) {
  if (z === undefined) {
    z = 0;
  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

...

// Масштабирует текущую матрицу
MatrixStack.prototype.scale = function(x, y, z) {
  if (z === undefined) {
    z = 1;
  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

Используя наш [`drawImage` из предыдущего урока](webgl-2d-drawimage.html), у нас были эти строки

```
// эта матрица будет конвертировать из пикселей в пространство отсечения
var matrix = m4.orthographic(
    0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

// переводим наш четырёхугольник в dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// масштабируем наш четырёхугольник размером в 1 единицу
// от 1 единицы до dstWidth, dstHeight единиц
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

Нам просто нужно создать стек матриц

```
var matrixStack = new MatrixStack();
```

и умножить на верхнюю матрицу из нашего стека в

```
// эта матрица будет конвертировать из пикселей в пространство отсечения
var matrix = m4.orthographic(
    0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

// Стек матриц находится в пикселях, поэтому он идёт после проекции
// выше, которая конвертировала наше пространство из пространства отсечения в пространство пикселей
matrix = m4.multiply(matrix, matrixStack.getCurrentMatrix());

// переводим наш четырёхугольник в dstX, dstY
matrix = m4.translate(matrix, dstX, dstY, 0);

// масштабируем наш четырёхугольник размером в 1 единицу
// от 1 единицы до dstWidth, dstHeight единиц
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

И теперь мы можем использовать это так же, как мы использовали бы это с Canvas 2D API.

Если вы не знаете, как использовать стек матриц, вы можете думать об этом как о
перемещении и ориентации начала координат холста. Так, например, по умолчанию в 2D холсте начало координат (0,0)
находится в левом верхнем углу.

Например, если мы переместим начало координат в центр холста, то рисование изображения в точке 0,0
будет рисовать его, начиная с центра холста

Давайте возьмём [наш предыдущий пример](webgl-2d-drawimage.html) и просто нарисуем одно изображение

```
var textureInfo = loadImageAndCreateTextureInfo('resources/star.jpg');

function draw(time) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  matrixStack.save();
  matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
  matrixStack.rotateZ(time);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

  matrixStack.restore();
}
```

И вот это.

{{{example url="../webgl-2d-matrixstack-01.html" }}}

вы можете видеть, что хотя мы передаём `0, 0` в `drawImage`, поскольку мы используем
`matrixStack.translate` для перемещения начала координат в центр холста,
изображение рисуется и вращается вокруг этого центра.

Давайте переместим центр вращения в центр изображения

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);
matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
```

И теперь оно вращается вокруг центра изображения в центре холста

{{{example url="../webgl-2d-matrixstack-02.html" }}}

Давайте нарисуем то же изображение в каждом углу, вращаясь на разных углах

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);

matrixStack.save();
{
  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

}
matrixStack.restore();

matrixStack.save();
{
  // Мы находимся в центре центрального изображения, поэтому переходим в левый верхний угол
  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
  matrixStack.rotateZ(Math.sin(time * 2.2));
  matrixStack.scale(0.2, 0.2);
  // Теперь мы хотим правый нижний угол изображения, которое мы собираемся нарисовать
  matrixStack.translate(-textureInfo.width, -textureInfo.height);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

}
matrixStack.restore();

matrixStack.save();
{
  // Мы находимся в центре центрального изображения, поэтому переходим в правый верхний угол
  matrixStack.translate(textureInfo.width / 2, textureInfo.height / -2);
  matrixStack.rotateZ(Math.sin(time * 2.3));
  matrixStack.scale(0.2, 0.2);
  // Теперь мы хотим левый нижний угол изображения, которое мы собираемся нарисовать
  matrixStack.translate(0, -textureInfo.height);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

}
matrixStack.restore();

matrixStack.save();
{
  // Мы находимся в центре центрального изображения, поэтому переходим в левый нижний угол
  matrixStack.translate(textureInfo.width / -2, textureInfo.height / 2);
  matrixStack.rotateZ(Math.sin(time * 2.4));
  matrixStack.scale(0.2, 0.2);
  // Теперь мы хотим правый верхний угол изображения, которое мы собираемся нарисовать
  matrixStack.translate(-textureInfo.width, 0);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

}
matrixStack.restore();

matrixStack.save();
{
  // Мы находимся в центре центрального изображения, поэтому переходим в правый нижний угол
  matrixStack.translate(textureInfo.width / 2, textureInfo.height / 2);
  matrixStack.rotateZ(Math.sin(time * 2.5));
  matrixStack.scale(0.2, 0.2);
  // Теперь мы хотим левый верхний угол изображения, которое мы собираемся нарисовать
  matrixStack.translate(0, 0);  // 0,0 означает, что эта строка на самом деле ничего не делает

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

}
matrixStack.restore();
```

И вот это

{{{example url="../webgl-2d-matrixstack-03.html" }}}

Если вы думаете о различных функциях стека матриц, `translate`, `rotateZ` и `scale`
как о перемещении начала координат, то способ, которым я думаю об установке центра вращения, это
*куда мне нужно переместить начало координат, чтобы когда я вызываю drawImage, определённая часть
изображения была **в** предыдущем начале координат?*

Другими словами, допустим, на холсте 400x300 я вызываю `matrixStack.translate(210, 150)`.
В этот момент начало координат находится в точке 210, 150, и всё рисование будет относительно этой точки.
Если мы вызовем `drawImage` с `0, 0`, это то место, где будет нарисовано изображение.

<img class="webgl_center" width="400" src="resources/matrixstack-before.svg" />

Допустим, мы хотим, чтобы центром вращения был правый нижний угол. В этом случае
куда нам нужно переместить начало координат, чтобы когда мы вызываем `drawImage`,
точка, которую мы хотим сделать центром вращения, была в текущем начале координат?
Для правого нижнего угла текстуры это было бы `-textureWidth, -textureHeight`,
так что теперь когда мы вызываем `drawImage` с `0, 0`, текстура будет нарисована здесь,
и её правый нижний угол находится в предыдущем начале координат.

<img class="webgl_center" width="400" src="resources/matrixstack-after.svg" />

В любой момент то, что мы делали до этого в стеке матриц, не имеет значения. Мы сделали кучу
вещей, чтобы переместить или масштабировать или повернуть начало координат, но прямо перед тем, как мы вызываем
`drawImage`, где бы ни находилось начало координат в данный момент, это не имеет значения.
Это новое начало координат, поэтому нам просто нужно решить, куда переместить это начало координат
относительно того места, где текстура была бы нарисована, если бы у нас ничего не было перед ней в стеке.

Вы можете заметить, что стек матриц очень похож на [граф сцены, который мы
рассматривали ранее](webgl-scene-graph.html). Граф сцены имел дерево узлов,
и когда мы проходили по дереву, мы умножали каждый узел на узел его родителя.
Стек матриц - это эффективно другая версия того же процесса. 