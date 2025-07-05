Title: WebGL2 - Граф сцены
Description: Что такое граф сцены и для чего он используется
TOC: Графы сцен


Эта статья является продолжением [предыдущих статей WebGL](webgl-fundamentals.html).
Предыдущая статья была о [рисовании множественных объектов](webgl-drawing-multiple-things.html).
Если вы их не читали, я предлагаю начать с них.

Я уверен, что какой-нибудь гуру CS или графики даст мне нагоняй, но...
Граф сцены обычно представляет собой древовидную структуру, где каждый узел в дереве генерирует
матрицу... хм, это не очень полезное определение. Может быть, несколько примеров будут
полезны.

Большинство 3D движков используют граф сцены. Вы помещаете объекты, которые хотите видеть в сцене,
в граф сцены. Движок затем обходит граф сцены и составляет список объектов для рисования.
Графы сцен иерархичны, поэтому, например, если вы хотели бы создать симуляцию вселенной,
вы могли бы иметь граф, который выглядит так

{{{diagram url="resources/planet-diagram.html" height="500" }}}

В чем смысл графа сцены? Главная особенность графа сцены заключается в том, что он обеспечивает
родительско-дочерние отношения для матриц, как [мы обсуждали в 2D матричной математике](webgl-2d-matrices.html).
Так, например, в простой (но нереалистичной) симуляции вселенной звезды (дети) движутся вместе со своей
галактикой (родитель). Аналогично луна (ребенок) движется вместе со своей планетой (родитель).
Если вы переместите Землю, луна будет двигаться с ней. Если вы переместите галактику,
все звезды внутри будут двигаться с ней. Перетащите имена в диаграмме выше
и, надеюсь, вы сможете увидеть их отношения.

Если вы вернетесь к [2D матричной математике](webgl-2d-matrices.html), вы можете вспомнить, что мы
умножаем много матриц для перемещения, поворота и масштабирования объектов. Граф
сцены предоставляет структуру для помощи в решении, какую матричную математику применять к объекту.

Обычно каждый `Node` в графе сцены представляет *локальное пространство*. При правильной
матричной математике все в этом *локальном пространстве* может игнорировать все выше него. Другой
способ выразить то же самое - луна должна заботиться только об орбите вокруг Земли.
Ей не нужно заботиться об орбите вокруг Солнца. Без этой структуры графа сцены
вам пришлось бы делать гораздо более сложную математику для вычисления, как заставить луну
орбитировать вокруг Солнца, потому что ее орбита вокруг Солнца выглядит примерно так

{{{diagram url="resources/moon-orbit.html" }}}

С графом сцены вы просто делаете луну дочерним элементом Земли, а затем орбитируете
вокруг Земли, что просто. Граф сцены заботится о том факте, что Земля
орбитирует вокруг Солнца. Он делает это, обходя узлы и умножая
матрицы по мере обхода

    worldMatrix = greatGrandParent * grandParent * parent * self(localMatrix)

В конкретных терминах нашей симуляции вселенной это было бы

    worldMatrixForMoon = galaxyMatrix * starMatrix * planetMatrix * moonMatrix;

Мы можем сделать это очень просто с рекурсивной функцией, которая эффективно

    function computeWorldMatrix(currentNode, parentWorldMatrix) {
        // вычисляем нашу мировую матрицу, умножая нашу локальную матрицу на
        // мировую матрицу нашего родителя.
        var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localMatrix);

        // теперь делаем то же самое для всех наших детей
        currentNode.children.forEach(function(child) {
            computeWorldMatrix(child, worldMatrix);
        });
    }

Это поднимает некоторую терминологию, которая довольно распространена для 3D графов сцен.

*   `localMatrix`: Локальная матрица для текущего узла. Она трансформирует его и его детей в локальном пространстве с
    самим собой в качестве начала координат.

*    `worldMatrix`: Для данного узла она берет объекты в локальном пространстве этого узла
     и трансформирует их в пространство корневого узла графа сцены. Или другими словами, размещает их
     в мире. Если мы вычислим worldMatrix для луны, мы получим ту забавную орбиту, которую вы видите выше.

Граф сцены довольно легко создать. Давайте определим простой объект `Node`.
Есть миллион способов организовать граф сцены, и я не уверен, какой
способ лучше. Самый распространенный - иметь опциональное поле объекта для рисования

    var node = {
       localMatrix: ...,  // "локальная" матрица для этого узла
       worldMatrix: ...,  // "мировая" матрица для этого узла
       children: [],      // массив детей
       thingToDraw: ??,   // объект для рисования в этом узле
    };

Давайте создадим граф сцены солнечной системы. Я не буду использовать причудливые текстуры или
что-то подобное, так как это загромоздит пример. Сначала давайте создадим несколько функций
для помощи в управлении узлами. Сначала мы создадим класс узла

    var Node = function() {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    };

Давайте дадим ему способ установить родителя узла.

    Node.prototype.setParent = function(parent) {
      // удаляем нас из нашего родителя
      if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }

      // Добавляем нас к нашему новому родителю
      if (parent) {
        parent.children.push(this);
      }
      this.parent = parent;
    };

И вот код для вычисления мировых матриц из локальных матриц на основе их родительско-дочерних
отношений. Если мы начнем с родителя и рекурсивно посетим детей, мы сможем вычислить
их мировые матрицы. Если вы не понимаете матричную математику,
[проверьте эту статью о них](webgl-2d-matrices.html).

    Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
      if (parentWorldMatrix) {
        // была передана матрица, поэтому делаем математику и
        // сохраняем результат в `this.worldMatrix`.
        m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
      } else {
        // матрица не была передана, поэтому просто копируем.
        m4.copy(this.localMatrix, this.worldMatrix);
      }

      // теперь обрабатываем всех детей
      var worldMatrix = this.worldMatrix;
      this.children.forEach(function(child) {
        child.updateWorldMatrix(worldMatrix);
      });
    };

Давайте просто сделаем Солнце, Землю и Луну, чтобы держать это простым. Мы, конечно, будем использовать
фальшивые расстояния, чтобы вещи помещались на экране. Мы просто будем использовать одну модель сферы
и окрасим ее желтоватой для Солнца, сине-зеленоватой для Земли и сероватой для Луны.
Если `drawInfo`, `bufferInfo` и `programInfo` вам не знакомы, [см. предыдущую статью](webgl-drawing-multiple-things.html).

    // Давайте создадим все узлы
    var sunNode = new Node();
    sunNode.localMatrix = m4.translation(0, 0, 0);  // солнце в центре
    sunNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0, 1], // желтый
        u_colorMult:   [0.4, 0.4, 0, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

    var earthNode = new Node();
    earthNode.localMatrix = m4.translation(100, 0, 0);  // земля в 100 единицах от солнца
    earthNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.5, 0.8, 1],  // сине-зеленый
        u_colorMult:   [0.8, 0.5, 0.2, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

    var moonNode = new Node();
    moonNode.localMatrix = m4.translation(20, 0, 0);  // луна в 20 единицах от земли
    moonNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0.6, 1],  // серый
        u_colorMult:   [0.1, 0.1, 0.1, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    };

Теперь, когда мы создали узлы, давайте соединим их.

    // соединяем небесные объекты
    moonNode.setParent(earthNode);
    earthNode.setParent(sunNode);

Мы снова создадим список объектов и список объектов для рисования.

    var objects = [
      sunNode,
      earthNode,
      moonNode,
    ];

    var objectsToDraw = [
      sunNode.drawInfo,
      earthNode.drawInfo,
      moonNode.drawInfo,
    ];

Во время рендеринга мы будем обновлять локальную матрицу каждого объекта, слегка поворачивая его.

    // обновляем локальные матрицы для каждого объекта.
    m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);

Теперь, когда локальные матрицы обновлены, мы обновим все мировые матрицы

    sunNode.updateWorldMatrix();

Наконец, теперь, когда у нас есть мировые матрицы, нам нужно умножить их, чтобы получить [матрицу worldViewProjection](webgl-3d-perspective.html) для каждого объекта.

    // Вычисляем все матрицы для рендеринга
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

Рендеринг - это [тот же цикл, который мы видели в нашей последней статье](webgl-drawing-multiple-things.html).

{{{example url="../webgl-scene-graph-solar-system.html" }}}

Вы заметите, что все планеты одинакового размера. Давайте попробуем сделать Землю больше

    // земля в 100 единицах от солнца
    earthNode.localMatrix = m4.translation(100, 0, 0));

    // делаем землю в два раза больше
    earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);

{{{example url="../webgl-scene-graph-solar-system-larger-earth.html" }}}

Упс. Луна тоже стала больше. Чтобы исправить это, мы могли бы вручную уменьшить луну. Лучшее решение, однако,
заключается в добавлении большего количества узлов в наш граф сцены. Вместо просто

      солнце
       |
      земля
       |
      луна

Мы изменим это на

     солнечнаяСистема
       |    |
       |   солнце
       |
     орбитаЗемли
       |    |
       |  земля
       |
      орбитаЛуны
          |
         луна

Это позволит Земле вращаться вокруг солнечной системы, но мы можем отдельно вращать и масштабировать Солнце, и это не будет
влиять на Землю. Аналогично Земля может вращаться отдельно от Луны. Давайте создадим больше узлов для
`solarSystem`, `earthOrbit` и `moonOrbit`.

    var solarSystemNode = new Node();
    var earthOrbitNode = new Node();

    // орбита Земли в 100 единицах от Солнца
    earthOrbitNode.localMatrix = m4.translation(100, 0, 0);
    var moonOrbitNode = new Node();

     // луна в 20 единицах от Земли
    moonOrbitNode.localMatrix = m4.translation(20, 0, 0);

Те расстояния орбит были удалены из старых узлов

    var earthNode = new Node();
    -// земля в 100 единицах от солнца
    -earthNode.localMatrix = m4.translation(100, 0, 0));

    -// делаем землю в два раза больше
    -earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);
    +earthNode.localMatrix = m4.scaling(2, 2, 2);

    var moonNode = new Node();
    -moonNode.localMatrix = m4.translation(20, 0, 0);  // луна в 20 единицах от земли

Соединение их теперь выглядит так

    // соединяем небесные объекты
    sunNode.setParent(solarSystemNode);
    earthOrbitNode.setParent(solarSystemNode);
    earthNode.setParent(earthOrbitNode);
    moonOrbitNode.setParent(earthOrbitNode);
    moonNode.setParent(moonOrbitNode);

И нам нужно только обновить орбиты

    // обновляем локальные матрицы для каждого объекта.
    -m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);

    // Обновляем все мировые матрицы в графе сцены
    -sunNode.updateWorldMatrix();
    +solarSystemNode.updateWorldMatrix();

И теперь вы можете видеть, что Земля в два раза больше, а Луна нет.

{{{example url="../webgl-scene-graph-solar-system-larger-earth-fixed.html" }}}

Вы также можете заметить, что Солнце и Земля больше не вращаются на месте. Теперь это независимо.

Давайте настроим еще несколько вещей.

    -sunNode.localMatrix = m4.translation(0, 0, 0);  // солнце в центре
    +sunNode.localMatrix = m4.scaling(5, 5, 5);

    ...

    *moonOrbitNode.localMatrix = m4.translation(30, 0, 0);

    ...

    +moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);

    ...
    // обновляем локальные матрицы для каждого объекта.
    m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);
    +// вращаем солнце
    +m4.multiply(m4.yRotation(0.005), sunNode.localMatrix, sunNode.localMatrix);
    +// вращаем землю
    +m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    +// вращаем луну
    +m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

{{{example url="../webgl-scene-graph-solar-system-adjusted.html" }}}

В настоящее время у нас есть `localMatrix`, и мы изменяем его каждый кадр. Однако есть проблема
в том, что каждый кадр наша математика будет накапливать небольшую ошибку. Есть способ исправить математику,
который называется *ортогональная нормализация матрицы*, но даже это не всегда работает. Например, давайте
представим, что мы масштабировали до нуля и обратно. Давайте просто сделаем это для одного значения `x`

    x = 246;       // кадр #0, x = 246

    scale = 1;
    x = x * scale  // кадр #1, x = 246

    scale = 0.5;
    x = x * scale  // кадр #2, x = 123

    scale = 0;
    x = x * scale  // кадр #3, x = 0

    scale = 0.5;
    x = x * scale  // кадр #4, x = 0  УПС!

    scale = 1;
    x = x * scale  // кадр #5, x = 0  УПС!

Мы потеряли наше значение. Мы можем исправить это, добавив какой-то другой класс, который обновляет матрицу из
других значений. Давайте изменим определение `Node`, чтобы иметь `source`. Если он существует, мы
попросим `source` дать нам локальную матрицу.

    *var Node = function(source) {
      this.children = [];
      this.localMatrix = makeIdentity();
      this.worldMatrix = makeIdentity();
    +  this.source = source;
    };

    Node.prototype.updateWorldMatrix = function(matrix) {

    +  var source = this.source;
    +  if (source) {
    +    source.getMatrix(this.localMatrix);
    +  }

      ...

Теперь мы можем создать источник. Общий источник - это тот, который предоставляет перемещение, поворот и масштабирование,
что-то вроде этого

    var TRS = function() {
      this.translation = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.scale = [1, 1, 1];
    };

    TRS.prototype.getMatrix = function(dst) {
      dst = dst || new Float32Array(16);
      var t = this.translation;
      var r = this.rotation;
      var s = this.scale;

      // вычисляем матрицу из перемещения, поворота и масштабирования
      m4.translation(t[0], t[1], t[2], dst);
      m4.xRotate(dst, r[0], dst);
      m4.yRotate(dst, r[1], dst);
      m4.zRotate(dst, r[2], dst);
      m4.scale(dst, s[0], s[1], s[2]), dst);
      return dst;
    };

И мы можем использовать это так

    // во время инициализации создаем узел с источником
    var someTRS  = new TRS();
    var someNode = new Node(someTRS);

    // во время рендеринга
    someTRS.rotation[2] += elapsedTime;

Теперь нет проблем, потому что мы воссоздаем матрицу каждый раз.

Вы можете думать, я не создаю солнечную систему, так в чем смысл? Ну, если вы хотели бы
анимировать человека, вы могли бы иметь граф сцены, который выглядит так

{{{diagram url="resources/person-diagram.html" height="400" }}}

Сколько суставов вы добавляете для пальцев и пальцев ног, зависит от вас. Чем больше суставов у вас есть,
тем больше мощности требуется для вычисления анимаций и тем больше данных анимации требуется
для предоставления информации для всех суставов. Старые игры, такие как Virtua Fighter, имели около 15 суставов.
Игры в начале-середине 2000-х имели от 30 до 70 суставов. Если бы вы сделали каждый сустав в ваших руках,
их по крайней мере 20 в каждой руке, поэтому только 2 руки - это 40 суставов. Многие игры, которые хотят
анимировать руки, анимируют большой палец как один и 4 пальца как один большой палец, чтобы сэкономить
время (как CPU/GPU, так и время художника) и память.

В любом случае, вот блочный парень, которого я собрал. Он использует источник `TRS` для каждого
узла, упомянутого выше. Программистское искусство и программистская анимация FTW! 😂

{{{example url="../webgl-scene-graph-block-guy.html" }}}

Если вы посмотрите практически на любую 3D библиотеку, вы найдете граф сцены, похожий на этот.
Что касается построения иерархий, обычно они создаются в каком-то пакете моделирования
или пакете компоновки уровней.

<div class="webgl_bottombar">
<h3>SetParent vs AddChild / RemoveChild</h3>
<p>Многие графы сцен имеют функцию <code>node.addChild</code> и функцию <code>node.removeChild</code>,
тогда как выше я создал функцию <code>node.setParent</code>. Какой способ лучше
спорно является вопросом стиля, но я бы утверждал, что есть одна объективно лучшая причина,
почему <code>setParent</code> лучше, чем <code>addChild</code>, заключается в том, что это делает код, подобный
этому, невозможным.</p>
<pre class="prettyprint">{{#escapehtml}}
    someParent.addChild(someNode);
    ...
    someOtherParent.addChild(someNode);
{{/escapehtml}}</pre>
<p>Что это означает? Добавляется ли <code>someNode</code> к обоим <code>someParent</code> и <code>someOtherParent</code>?
В большинстве графов сцен это невозможно. Генерирует ли второй вызов ошибку?
<code>ERROR: Already have parent</code>. Удаляет ли он магически <code>someNode</code> из <code>someParent</code> перед
добавлением к <code>someOtherParent</code>? Если да, то это, конечно, не ясно из названия <code>addChild</code>.
</p>
<p><code>setParent</code> с другой стороны не имеет такой проблемы</p>
<pre class="prettyprint">{{#escapehtml}}
    someNode.setParent(someParent);
    ...
    someNode.setParent(someOtherParent);
{{/escapehtml}}</pre>
<p>
В этом случае на 100% очевидно, что происходит. Нулевая неоднозначность.
</p>
</div> 