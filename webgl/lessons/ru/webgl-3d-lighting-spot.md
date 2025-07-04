Title: WebGL2 3D - Прожекторное освещение
Description: Как реализовать прожекторное освещение в WebGL
TOC: Прожекторное освещение


Эта статья является продолжением [WebGL 3D Точечное освещение](webgl-3d-lighting-point.html). Если вы не читали это, я предлагаю [начать там](webgl-3d-lighting-point.html).

В последней статье мы рассмотрели точечное освещение, где для каждой точки
на поверхности нашего объекта мы вычисляем направление от света
к этой точке на поверхности. Затем мы делаем то же самое, что делали для
[направленного освещения](webgl-3d-lighting-directional.html), что
мы взяли скалярное произведение нормали поверхности (направление, в котором обращена поверхность)
и направления света. Это дало нам значение
1, если два направления совпадали и поэтому должны быть полностью освещены. 0, если
два направления были перпендикулярны, и -1, если они были противоположны.
Мы использовали это значение напрямую для умножения цвета поверхности,
что дало нам освещение.

Прожекторное освещение - это только очень небольшое изменение. На самом деле, если вы думаете
творчески о том, что мы сделали до сих пор, вы могли бы
вывести собственное решение.

Вы можете представить точечный свет как точку со светом, идущим во всех
направлениях от этой точки.
Чтобы сделать прожектор, все, что нам нужно сделать, это выбрать направление от
этой точки, это направление нашего прожектора. Затем, для каждого
направления, в котором идет свет, мы могли бы взять скалярное произведение
этого направления с нашим выбранным направлением прожектора. Мы бы выбрали какой-то произвольный
предел и решили, если мы в пределах этого предела, мы освещаем. Если мы не в пределах
предела, мы не освещаем.

{{{diagram url="resources/spot-lighting.html" width="500" height="400" className="noborder" }}}

В диаграмме выше мы можем видеть свет с лучами, идущими во всех направлениях, и
напечатанными на них их скалярными произведениями относительно направления.
Затем у нас есть конкретное **направление**, которое является направлением прожектора.
Мы выбираем предел (выше он в градусах). Из предела мы вычисляем *dot limit*, мы просто берем косинус предела. Если скалярное произведение нашего выбранного направления прожектора к
направлению каждого луча света выше dot limit, то мы делаем освещение. Иначе нет освещения.

Чтобы сказать это по-другому, скажем, предел составляет 20 градусов. Мы можем преобразовать
это в радианы и от этого к значению от -1 до 1, взяв косинус. Давайте назовем это dot space.
Другими словами, вот небольшая таблица для значений предела

              пределы в
     градусах | радианах | dot space
     --------+---------+----------
        0    |   0.0   |    1.0
        22   |    .38  |     .93
        45   |    .79  |     .71
        67   |   1.17  |     .39
        90   |   1.57  |    0.0
       180   |   3.14  |   -1.0

Затем мы можем просто проверить

    dotFromDirection = dot(surfaceToLight, -lightDirection)
    if (dotFromDirection >= limitInDotSpace) {
       // делаем освещение
    }

Давайте сделаем это

Сначала давайте изменим наш фрагментный шейдер из
[последней статьи](webgl-3d-lighting-point.html).

```glsl
#version 300 es
precision highp float;

// Переданный из вершинного шейдера.
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_limit;          // в dot space

// нам нужно объявить выход для фрагментного шейдера
out vec4 outColor;

void main() {
  // потому что v_normal - это varying, он интерполируется
  // поэтому он не будет единичным вектором. Нормализация его
  // сделает его снова единичным вектором
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

-  float light = dot(normal, surfaceToLightDirection);
+  float light = 0.0;
  float specular = 0.0;

+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  if (dotFromDirection >= u_limit) {
*    light = dot(normal, surfaceToLightDirection);
*    if (light > 0.0) {
*      specular = pow(dot(normal, halfVector), u_shininess);
*    }
+  }

  outColor = u_color;

  // Давайте умножим только цветовую часть (не альфа)
  // на свет
  outColor.rgb *= light;

  // Просто добавляем блик
  outColor.rgb += specular;
}
```

Конечно, нам нужно найти местоположения uniform переменных, которые мы
только что добавили.

```js
  var lightDirection = [?, ?, ?];
  var limit = degToRad(20);

  ...

  var lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
  var limitLocation = gl.getUniformLocation(program, "u_limit");
```

и нам нужно их установить

```js
    gl.uniform3fv(lightDirectionLocation, lightDirection);
    gl.uniform1f(limitLocation, Math.cos(limit));
```

И вот это

{{{example url="../webgl-3d-lighting-spot.html" }}}

Несколько вещей для заметки: Одна в том, что мы отрицаем `u_lightDirection` выше.
Это [*шесть одного, полдюжины другого*](https://en.wiktionary.org/wiki/six_of_one,_half_a_dozen_of_the_other)
тип вещи. Мы хотим, чтобы 2 направления, которые мы сравниваем, указывали в
том же направлении, когда они совпадают. Это означает, что нам нужно сравнить
surfaceToLightDirection с противоположным направлением прожектора.
Мы могли бы сделать это многими разными способами. Мы могли бы передать отрицательное
направление при установке uniform. Это был бы мой 1-й выбор,
но я думал, что будет менее запутанно назвать uniform `u_lightDirection` вместо `u_reverseLightDirection` или `u_negativeLightDirection`

Другая вещь, и, возможно, это просто личное предпочтение, я не
люблю использовать условные операторы в шейдерах, если возможно. Я думаю, причина
в том, что раньше шейдеры на самом деле не имели условных операторов. Если вы добавляли
условный оператор, компилятор шейдера расширял код множеством
умножений на 0 и 1 здесь и там, чтобы сделать так, чтобы не было
никаких фактических условных операторов в коде. Это означало, что добавление условных операторов
могло заставить ваш код взорваться в комбинаторные расширения. Я не
уверен, что это все еще правда, но давайте избавимся от условных операторов в любом случае,
просто чтобы показать некоторые техники. Вы можете сами решить, использовать их или нет.

Есть функция GLSL, называемая `step`. Она принимает 2 значения, и если
второе значение больше или равно первому, она возвращает 1.0. Иначе она возвращает 0. Вы могли бы написать это так в JavaScript

    function step(a, b) {
       if (b >= a) {
           return 1;
       } else {
           return 0;
       }
    }

Давайте используем `step`, чтобы избавиться от условий

```glsl
  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
  // inLight будет 1, если мы внутри прожектора, и 0, если нет
  float inLight = step(u_limit, dotFromDirection);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);
```

Ничего не меняется визуально, но вот это

{{{example url="../webgl-3d-lighting-spot-using-step.html" }}}

Еще одна вещь в том, что сейчас прожектор очень резкий. Мы
либо внутри прожектора, либо нет, и вещи просто становятся черными.

Чтобы исправить это, мы могли бы использовать 2 предела вместо одного,
внутренний предел и внешний предел.
Если мы внутри внутреннего предела, то используем 1.0. Если мы снаружи внешнего
предела, то используем 0.0. Если мы между внутренним пределом и внешним пределом,
то интерполируем между 1.0 и 0.0.

Вот один способ, как мы могли бы сделать это

```glsl
-uniform float u_limit;          // в dot space
+uniform float u_innerLimit;     // в dot space
+uniform float u_outerLimit;     // в dot space

...

  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
-  float inLight = step(u_limit, dotFromDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

```

И это работает

{{{example url="../webgl-3d-lighting-spot-falloff.html" }}}

Теперь мы получаем что-то, что выглядит больше как прожектор!

Одна вещь, о которой нужно знать, это если `u_innerLimit` равен `u_outerLimit`,
то `limitRange` будет 0.0. Мы делим на `limitRange`, и деление на
ноль плохо/не определено. Здесь нечего делать в шейдере, нам просто
нужно убедиться в нашем JavaScript, что `u_innerLimit` никогда не равен
`u_outerLimit`. (примечание: пример кода этого не делает).

GLSL также имеет функцию, которую мы могли бы использовать для небольшого упрощения этого. Она
называется `smoothstep`, и как `step` она возвращает значение от 0 до 1, но
она принимает как нижнюю, так и верхнюю границу и интерполирует между 0 и 1 между
этими границами.

     smoothstep(lowerBound, upperBound, value)

Давайте сделаем это

```glsl
  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
  float inLight = smoothstep(u_outerLimit, u_innerLimit, dotFromDirection);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);
```

Это тоже работает

{{{example url="../webgl-3d-lighting-spot-falloff-using-smoothstep.html" }}}

Разница в том, что `smoothstep` использует интерполяцию Эрмита вместо
линейной интерполяции. Это означает, что между `lowerBound` и `upperBound`
она интерполирует, как изображение ниже справа, тогда как линейная интерполяция, как изображение слева.

<img class="webgl_center invertdark" src="resources/linear-vs-hermite.png" />

Вам решать, имеет ли значение разница.

Еще одна вещь, о которой нужно знать, это то, что функция `smoothstep` имеет неопределенные
результаты, если `lowerBound` больше или равен `upperBound`. Иметь
их равными - это та же проблема, что у нас была выше. Добавленная проблема не быть
определенным, если `lowerBound` больше `upperBound`, новая, но для
цели прожектора это никогда не должно быть правдой.

<div class="webgl_bottombar">
<h3>Будьте осторожны с неопределенным поведением в GLSL</h3>
<p>
Несколько функций в GLSL не определены для определенных значений.
Попытка возвести отрицательное число в степень с помощью <code>pow</code> - это один
пример, поскольку результат был бы мнимым числом. Мы рассмотрели
другой пример выше с <code>smoothstep</code>.</p>
<p>
Вам нужно попытаться быть в курсе этих или иначе ваши шейдеры будут
получать разные результаты на разных машинах. <a href="https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf">Спецификация, в разделе
8</a> перечисляет все встроенные функции, что они делают, и есть ли
какое-либо неопределенное поведение.</p>
<p>Вот список неопределенных поведений. Обратите внимание, <code>genType</code> означает <code>float</code>, <code>vec2</code>, <code>vec3</code> или <code>vec4</code>.</p>
  <pre class="prettyprint"><code>genType asin (genType x)</code></pre><p>Арксинус. Возвращает угол, синус которого равен x. Диапазон
значений, возвращаемых этой функцией, [−π/2, π/2]
Результаты не определены, если ∣x∣ > 1.</p>


<pre class="prettyprint"><code>genType acos (genType x)</code></pre><p>Арккосинус. Возвращает угол, косинус которого равен x. Диапазон
значений, возвращаемых этой функцией, [0, π].
Результаты не определены, если ∣x∣ > 1.</p>



<pre class="prettyprint"><code>genType atan (genType y, genType x)</code></pre><p>Арктангенс. Возвращает угол, тангенс которого равен y/x. Знаки
x и y используются для определения того, в каком квадранте находится
угол. Диапазон значений, возвращаемых этой
функцией, [−π,π]. Результаты не определены, если x и y
оба равны 0.</p>

<pre class="prettyprint"><code>genType acosh (genType x)</code></pre><p>Аркгиперболический косинус; возвращает неотрицательный обратный
к cosh. Результаты не определены, если x < 1.</p>

<pre class="prettyprint"><code>genType atanh (genType x)</code></pre><p>Аркгиперболический тангенс; возвращает обратный к tanh.
Результаты не определены, если ∣x∣≥1.</p>

<pre class="prettyprint"><code>genType pow (genType x, genType y)</code></pre><p>Возвращает x, возведенный в степень y, т.е. x<sup>y</sup>.
Результаты не определены, если x < 0.
Результаты не определены, если x = 0 и y <= 0.</p>


<pre class="prettyprint"><code>genType log (genType x)</code></pre><p>Возвращает натуральный логарифм x, т.е. возвращает значение
y, которое удовлетворяет уравнению x = e<sup>y</sup>.
Результаты не определены, если x <= 0.</p>


<pre class="prettyprint"><code>genType log2 (genType x)</code></pre><p>Возвращает логарифм по основанию 2 от x, т.е. возвращает значение
y, которое удовлетворяет уравнению x=2<sup>y</sup>.
Результаты не определены, если x <= 0.</p>



<pre class="prettyprint"><code>genType sqrt (genType x)</code></pre><p>Возвращает √x .
Результаты не определены, если x < 0.</p>


<pre class="prettyprint"><code>genType inversesqrt (genType x)</code></pre><p>
Возвращает 1/√x.
Результаты не определены, если x <= 0.</p>


<pre class="prettyprint"><code>genType clamp (genType x, genType minVal, genType maxVal)
genType clamp (genType x, float minVal, float maxVal)</code></pre><p>
Возвращает min (max (x, minVal), maxVal).
Результаты не определены, если minVal > maxVal</p>



<pre class="prettyprint"><code>genType smoothstep (genType edge0, genType edge1, genType x)
genType smoothstep (float edge0, float edge1, genType x)</code></pre><p>
Возвращает 0.0, если x <= edge0, и 1.0, если x >= edge1, и
выполняет плавную интерполяцию Эрмита между 0 и 1,
когда edge0 < x < edge1. Это полезно в случаях, когда
вы хотели бы пороговую функцию с плавным
переходом. Это эквивалентно:
</p>
<pre class="prettyprint">
 genType t;
 t = clamp ((x – edge0) / (edge1 – edge0), 0, 1);
 return t * t * (3 – 2 * t);
</pre>
<p>Результаты не определены, если edge0 >= edge1.</p>


<pre class="prettyprint"><code>mat2 inverse(mat2 m)
mat3 inverse(mat3 m)
mat4 inverse(mat4 m)</code></pre><p>
Возвращает матрицу, которая является обратной к m. Входная
матрица m не изменяется. Значения в возвращенной
матрице не определены, если m сингулярна или плохо обусловлена
(почти сингулярна).</p>


</div>