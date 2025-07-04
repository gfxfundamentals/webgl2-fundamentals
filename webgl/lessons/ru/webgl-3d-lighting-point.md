Title: WebGL2 3D - Точечное освещение
Description: Как реализовать точечное освещение в WebGL
TOC: Точечное освещение


Эта статья является продолжением [WebGL 3D Направленное освещение](webgl-3d-lighting-directional.html).
Если вы не читали это, я предлагаю [начать там](webgl-3d-lighting-directional.html).

В последней статье мы рассмотрели направленное освещение, где свет идет
универсально с одного направления. Мы установили это направление перед рендерингом.

Что если вместо установки направления для света мы выберем точку в 3d пространстве для света
и вычислим направление от любого места на поверхности нашей модели в нашем шейдере?
Это дало бы нам точечный свет.

{{{diagram url="resources/point-lighting.html" width="500" height="400" className="noborder" }}}

Если вы повернете поверхность выше, вы увидите, как каждая точка на поверхности имеет другой
вектор *поверхность к свету*. Получение скалярного произведения нормали поверхности и каждого отдельного
вектора поверхности к свету дает нам другое значение в каждой точке поверхности.

Итак, давайте сделаем это.

Сначала нам нужна позиция света

    uniform vec3 u_lightWorldPosition;

И нам нужен способ вычислить мировую позицию поверхности. Для этого мы можем умножить
наши позиции на мировую матрицу, так что ...

    uniform mat4 u_world;

    ...

    // вычисляем мировую позицию поверхности
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

И мы можем вычислить вектор от поверхности к свету, который похож на
направление, которое у нас было раньше, за исключением того, что на этот раз мы вычисляем его для каждой позиции на
поверхности к точке.

    v_surfaceToLight = u_lightPosition - surfaceWorldPosition;

Вот все это в контексте

    #version 300 es

    in vec4 a_position;
    in vec3 a_normal;

    +uniform vec3 u_lightWorldPosition;

    +uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    out vec3 v_normal;
    +out vec3 v_surfaceToLight;

    void main() {
      // Умножаем позицию на матрицу.
      gl_Position = u_worldViewProjection * a_position;

      // ориентируем нормали и передаем в фрагментный шейдер
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

    +  // вычисляем мировую позицию поверхности
    +  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    +
    +  // вычисляем вектор поверхности к свету
    +  // и передаем его в фрагментный шейдер
    +  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    }

Теперь в фрагментном шейдере нам нужно нормализовать вектор поверхности к свету,
поскольку это не единичный вектор. Обратите внимание, что мы могли бы нормализовать в вершинном шейдере,
но поскольку это *varying*, он будет линейно интерполироваться между нашими позициями
и поэтому не будет полным единичным вектором

    #version 300 es
    precision highp float;

    // Переданный из вершинного шейдера.
    in vec3 v_normal;
    +in vec3 v_surfaceToLight;

    -uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    // нам нужно объявить выход для фрагментного шейдера
    out vec4 outColor;

    void main() {
      // потому что v_normal - это varying, он интерполируется
      // поэтому он не будет единичным вектором. Нормализация его
      // сделает его снова единичным вектором
      vec3 normal = normalize(v_normal);

      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

    -  float light = dot(normal, u_reverseLightDirection);
    +  float light = dot(normal, surfaceToLightDirection);

      outColor = u_color;

      // Давайте умножим только цветовую часть (не альфа)
      // на свет
      outColor.rgb *= light;
    }


Затем нам нужно найти местоположения `u_world` и `u_lightWorldPosition`

```
-  var reverseLightDirectionLocation =
-      gl.getUniformLocation(program, "u_reverseLightDirection");
+  var lightWorldPositionLocation =
+      gl.getUniformLocation(program, "u_lightWorldPosition");
+  var worldLocation =
+      gl.getUniformLocation(program, "u_world");
```

и установить их

```
  // Set the matrices
+  gl.uniformMatrix4fv(
+      worldLocation, false,
+      worldMatrix);
  gl.uniformMatrix4fv(
      worldViewProjectionLocation, false,
      worldViewProjectionMatrix);

  ...

-  // set the light direction.
-  gl.uniform3fv(reverseLightDirectionLocation, normalize([0.5, 0.7, 1]));
+  // set the light position
+  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 50]);
```

И вот это

{{{example url="../webgl-3d-lighting-point.html" }}}

Теперь, когда у нас есть точка, мы можем добавить что-то, называемое бликовым освещением.

Если вы посмотрите на объект в реальном мире, если он хоть немного блестящий, то если он случайно
отражает свет прямо на вас, это почти как зеркало

<img class="webgl_center" src="resources/specular-highlights.jpg" />

Мы можем симулировать этот эффект, вычисляя, отражается ли свет в наши глаза. Снова *скалярное произведение*
приходит на помощь.

Что нам нужно проверить? Ну, давайте подумаем об этом. Свет отражается под тем же углом, под которым он попадает на поверхность,
поэтому если направление от поверхности к свету - это точное отражение от поверхности к глазу,
то это под идеальным углом для отражения

{{{diagram url="resources/surface-reflection.html" width="500" height="400" className="noborder" }}}

Если мы знаем направление от поверхности нашей модели к свету (что мы знаем, поскольку мы только что это сделали).
И если мы знаем направление от поверхности к виду/глазу/камере, которое мы можем вычислить, то мы можем добавить
эти 2 вектора и нормализовать их, чтобы получить `halfVector`, который является вектором, который находится на полпути между ними.
Если halfVector и нормаль поверхности совпадают, то это идеальный угол для отражения света в
вид/глаз/камеру. И как мы можем сказать, когда они совпадают? Возьмите *скалярное произведение*, как мы делали
раньше. 1 = они совпадают, то же направление, 0 = они перпендикулярны, -1 = они противоположны.

{{{diagram url="resources/specular-lighting.html" width="500" height="400" className="noborder" }}}

Итак, первое, что нам нужно, это передать позицию вида/камеры/глаза, вычислить вектор поверхности к виду
и передать его в фрагментный шейдер.

    #version 300 es

    in vec4 a_position;
    in vec3 a_normal;

    uniform vec3 u_lightWorldPosition;
    +uniform vec3 u_viewWorldPosition;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    out vec3 v_surfaceToLight;
    +out vec3 v_surfaceToView;

    void main() {
      // Умножаем позицию на матрицу.
      gl_Position = u_worldViewProjection * a_position;

      // ориентируем нормали и передаем в фрагментный шейдер
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

      // вычисляем мировую позицию поверхности
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;

      // вычисляем вектор поверхности к свету
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    +  // вычисляем вектор поверхности к виду/камере
    +  // и передаем его в фрагментный шейдер
    +  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }

Далее в фрагментном шейдере нам нужно вычислить `halfVector` между
векторами поверхности к виду и поверхности к свету. Затем мы можем взять скалярное
произведение `halfVector` и нормали, чтобы выяснить, отражается ли свет
в вид.

    // Переданный из вершинного шейдера.
    in vec3 v_normal;
    in vec3 v_surfaceToLight;
    +in vec3 v_surfaceToView;

    uniform vec4 u_color;

    out vec4 outColor;

    void main() {
      // потому что v_normal - это varying, он интерполируется
      // поэтому он не будет единичным вектором. Нормализация его
      // сделает его снова единичным вектором
      vec3 normal = normalize(v_normal);

    +  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    +  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    +  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

      float light = dot(normal, surfaceToLightDirection);
    +  float specular = dot(normal, halfVector);

      outColor = u_color;

      // Давайте умножим только цветовую часть (не альфа)
      // на свет
      outColor.rgb *= light;

    +  // Просто добавляем блик
    +  outColor.rgb += specular;
    }

Наконец, нам нужно найти `u_viewWorldPosition` и установить его

    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    +var viewWorldPositionLocation =
    +    gl.getUniformLocation(program, "u_viewWorldPosition");

    ...

    // Вычисляем матрицу камеры
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = makeLookAt(camera, target, up);

    ...

    +// устанавливаем позицию камеры/вида
    +gl.uniform3fv(viewWorldPositionLocation, camera);


И вот это

{{{example url="../webgl-3d-lighting-point-specular.html" }}}

**БОЖЕ, ЭТО ЯРКО!**

Мы можем исправить яркость, возведя результат скалярного произведения в степень. Это сожмет
бликовое освещение от линейного затухания до экспоненциального затухания.

{{{diagram url="resources/power-graph.html" width="300" height="300" className="noborder" }}}

Чем ближе красная линия к верху графика, тем ярче будет наше бликовое добавление.
Возведя в степень, это сжимает диапазон, где он становится ярким, вправо.

Давайте назовем это `shininess` и добавим в наш шейдер.

    uniform vec4 u_color;
    +uniform float u_shininess;

    ...

    -  float specular = dot(normal, halfVector);
    +  float specular = 0.0;
    +  if (light > 0.0) {
    +    specular = pow(dot(normal, halfVector), u_shininess);
    +  }

Скалярное произведение может быть отрицательным. Возведение отрицательного числа в степень не определено в WebGL,
что было бы плохо. Итак, если скалярное произведение может быть отрицательным, то мы просто оставляем specular на 0.0.

Конечно, нам нужно найти местоположение и установить его

    +var shininessLocation = gl.getUniformLocation(program, "u_shininess");

    ...

    // устанавливаем блеск
    gl.uniform1f(shininessLocation, shininess);

И вот это

{{{example url="../webgl-3d-lighting-point-specular-power.html" }}}

Последняя вещь, которую я хочу рассмотреть в этой статье, это цвета света.

До этого момента мы использовали `light` для умножения цвета, который мы передаем для
F. Мы могли бы предоставить цвет света, если бы хотели цветные огни

    uniform vec4 u_color;
    uniform float u_shininess;
    +uniform vec3 u_lightColor;
    +uniform vec3 u_specularColor;

    ...

      // Давайте умножим только цветовую часть (не альфа)
      // на свет
    *  outColor.rgb *= light * u_lightColor;

      // Просто добавляем блик
    *  outColor.rgb += specular * u_specularColor;
    }

и конечно

    +  var lightColorLocation =
    +      gl.getUniformLocation(program, "u_lightColor");
    +  var specularColorLocation =
    +      gl.getUniformLocation(program, "u_specularColor");

и

    +  // устанавливаем цвет света
    +  gl.uniform3fv(lightColorLocation, normalize([1, 0.6, 0.6]));  // красный свет
    +  // устанавливаем цвет блика
    +  gl.uniform3fv(specularColorLocation, normalize([1, 0.2, 0.2]));  // красный свет

{{{example url="../webgl-3d-lighting-point-color.html" }}}

Далее [прожекторное освещение](webgl-3d-lighting-spot.html).

<div class="webgl_bottombar">
<h3>Почему <code>pow(negative, power)</code> не определено?</h3>
<p>Что это означает?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 2)</pre></div>
<p>Ну, вы можете смотреть на это как</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 = 25</pre></div>
<p>А что насчет</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 3)</pre></div>
<p>Ну, вы можете смотреть на это как</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 * 5 = 125</pre></div>
<p>Хорошо, а как насчет</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2)</pre></div>
<p>Ну, это могло бы быть</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 = 25</pre></div>
<p>И</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 3)</pre></div>
<p>Ну, вы можете смотреть на это как</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 * -5 = -125</pre></div>
<p>Как вы знаете, умножение отрицательного на отрицательное дает положительное. Умножение на отрицательное
снова делает это отрицательным.</p>
<p>Ну, тогда что это означает?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2.5)</pre></div>
<p>Как вы решаете, какой результат этого положительный или отрицательный? Это
земля <a href="https://betterexplained.com/articles/a-visual-intuitive-guide-to-imaginary-numbers/">мнимых чисел</a>.</p>
</div>