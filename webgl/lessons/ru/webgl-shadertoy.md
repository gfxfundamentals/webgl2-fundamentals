Title: WebGL2 Shadertoy
Description: Шейдеры Shadertoy
TOC: Shadertoy

Эта статья предполагает, что вы прочитали многие другие статьи,
начиная с [основ](webgl-fundamentals.html).
Если вы их не читали, пожалуйста, начните сначала там.

В [статье о рисовании без данных](webgl-drawing-without-data.html)
мы показали несколько примеров рисования вещей без данных, используя
вершинный шейдер. Эта статья будет о рисовании вещей без
данных, используя фрагментные шейдеры.

Мы начнем с простого шейдера сплошного цвета
без математики, используя код [из самой первой статьи](webgl-fundamentals.html).

Простой вершинный шейдер

```js
const vs = `#version 300 es
  // атрибут - это вход (in) в вершинный шейдер.
  // Он будет получать данные из буфера
  in vec4 a_position;

  // все шейдеры имеют главную функцию
  void main() {

    // gl_Position - это специальная переменная, за установку которой
    // отвечает вершинный шейдер
    gl_Position = a_position;
  }
`;
```

и простой фрагментный шейдер

```js
const fs = `#version 300 es
  precision highp float;

  // нам нужно объявить выход для фрагментного шейдера
  out vec4 outColor;

  void main() {
    outColor = vec4(1, 0, 0.5, 1); // возвращаем красно-фиолетовый
  }
`;
```

Затем нам нужно скомпилировать и связать шейдеры и найти местоположение атрибута position.

```js
function main() {
  // Получаем WebGL контекст
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // настройка GLSL программы
  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // ищем, куда должны идти вершинные данные.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
```

и затем создать вершинный массив,
заполнить буфер 2 треугольниками, которые создают прямоугольник в clip space, который
идет от -1 до +1 по x и y, чтобы покрыть canvas, и установить атрибуты.

```js
  // Создаем объект вершинного массива (состояние атрибутов)
  const vao = gl.createVertexArray();

  // и делаем его тем, с которым мы сейчас работаем
  gl.bindVertexArray(vao);

  // Создаем буфер для размещения трех 2d точек clip space
  const positionBuffer = gl.createBuffer();

  // Привязываем его к ARRAY_BUFFER (думайте об этом как ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // заполняем его 2 треугольниками, которые покрывают clip space
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // первый треугольник
     1, -1,
    -1,  1,
    -1,  1,  // второй треугольник
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  // Включаем атрибут
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Говорим атрибуту, как получать данные из positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
      positionAttributeLocation,
      2,          // 2 компонента на итерацию
      gl.FLOAT,   // данные - 32-битные float'ы
      false,      // не нормализуем данные
      0,          // 0 = двигаемся вперед на size * sizeof(type) каждую итерацию, чтобы получить следующую позицию
      0,          // начинаем с начала буфера
  );
```

И затем мы рисуем

```js
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Говорим WebGL, как конвертировать из clip space в пиксели
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Говорим использовать нашу программу (пару шейдеров)
  gl.useProgram(program);

  // Привязываем набор атрибутов/буферов, который мы хотим.
  gl.bindVertexArray(vao);

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // смещение
      6,     // количество вершин для обработки
  );
```

И конечно, мы получаем сплошной цвет, который покрывает canvas.

{{{example url="../webgl-shadertoy-solid.html"}}}

В [статье о том, как работает WebGL](webgl-how-it-works.html) мы добавили больше
цвета, предоставляя цвет для каждой вершины. В [статье о текстурах](webgl-3d-textures.html)
мы добавили больше цвета, предоставляя текстуры и координаты текстуры.
Так как же мы получаем что-то большее, чем сплошной цвет, без дополнительных данных?
WebGL предоставляет переменную, называемую `gl_FragCoord`, которая равна **пиксельной**
координате пикселя, который в данный момент рисуется.

Итак, давайте изменим наш фрагментный шейдер, чтобы использовать это для вычисления цвета

```js
const fs = `#version 300 es
  precision highp float;

  // нам нужно объявить выход для фрагментного шейдера
  out vec4 outColor;

  void main() {
    outColor = vec4(fract(gl_FragCoord.xy / 50.0), 0, 1);
  }
`;
```

Как мы упомянули выше, `gl_FragCoord` - это **пиксельная** координата, поэтому она будет
считаться поперек и вверх canvas. Разделив на 50, мы получим значение, которое идет
от 0 до 1, когда `gl_FragCoord` идет от 0 до 50. Используя `fract`, мы
сохраним только *дробную* часть, так что, например, когда `gl_FragCoord` равен 75.
75 / 50 = 1.5, fract(1.5) = 0.5, поэтому мы получим значение, которое идет от 0 до 1
каждые 50 пикселей.

{{{example url="../webgl-shadertoy-gl-fragcoord.html"}}}

Как вы можете видеть выше, каждые 50 пикселей поперек красный идет от 0 до 1,
и каждые 50 пикселей вверх зеленый идет от 0 до 1.

С нашей настройкой теперь мы могли бы сделать более сложную математику для более причудливого изображения.
но у нас есть одна проблема в том, что мы не знаем, насколько велик canvas,
поэтому нам пришлось бы жестко кодировать для конкретного размера. Мы можем решить эту проблему,
передав размер canvas, а затем разделив `gl_FragCoord` на
размер, чтобы дать нам значение, которое идет от 0 до 1 поперек и вверх canvas
независимо от размера.

```js
const fs = `#version 300 es
  precision highp float;

  uniform vec2 u_resolution;

  // нам нужно объявить выход для фрагментного шейдера
  out vec4 outColor;

  void main() {
    outColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
  }
`;
```

и найти и установить uniform

```js
// ищем, куда должны идти вершинные данные.
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

// ищем местоположения uniforms
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
```

и установить uniform

```js
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
```

что позволяет нам сделать наш разброс красного и зеленого всегда подходящим для canvas независимо
от разрешения

{{{example url="../webgl-shadertoy-w-resolution.html"}}}

Давайте также передадим позицию мыши в пиксельных координатах.

```js
const fs = `#version 300 es
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  // нам нужно объявить выход для фрагментного шейдера
  out vec4 outColor;

  void main() {
    outColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
  }
`;
```

И затем нам нужно найти местоположение uniform,

```js
// ищем местоположения uniforms
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const mouseLocation = gl.getUniformLocation(program, "u_mouse");
```

отслеживать мышь,

```js
let mouseX = 0;
let mouseY = 0;

function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // низ равен 0 в WebGL
  render();
}

canvas.addEventListener('mousemove', setMousePosition);
```

и установить uniform.

```js
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
gl.uniform2f(mouseLocation, mouseX, mouseY);
```

Нам также нужно изменить код, чтобы мы рендерили, когда позиция мыши изменяется

```js
function setMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // низ равен 0 в WebGL
  render();
}

function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // смещение
      6,     // количество вершин для обработки
  );
}
render();
```

и пока мы этим занимаемся, давайте также обработаем касание

```js
canvas.addEventListener('mousemove', setMousePosition);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
}, {passive: false});
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  setMousePosition(e.touches[0]);
}, {passive: false});
```

и теперь вы можете видеть, что если вы двигаете мышь над примером, это влияет на наше изображение.

{{{example url="../webgl-shadertoy-w-mouse.html"}}}

Финальная основная часть - мы хотим иметь возможность анимировать что-то, поэтому мы передаем еще одну
вещь, значение времени, которое мы можем использовать для добавления к нашим вычислениям.

Например, если бы мы сделали это

```js
const fs = `#version 300 es
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;

  // нам нужно объявить выход для фрагментного шейдера
  out vec4 outColor;

  void main() {
    outColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), fract(u_time), 1);
  }
`;
```

И теперь синий канал будет пульсировать в такт времени. Нам просто нужно
найти uniform и установить его в цикле [requestAnimationFrame](webgl-animation.html).

```js
// ищем местоположения uniforms
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const mouseLocation = gl.getUniformLocation(program, "u_mouse");
const timeLocation = gl.getUniformLocation(program, "u_time");

...

function render(time) {
  time *= 0.001;  // конвертируем в секунды

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  ...

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(mouseLocation, mouseX, mouseY);
  gl.uniform1f(timeLocation, time);

  gl.drawArrays(
      gl.TRIANGLES,
      0,     // смещение
      6,     // количество вершин для обработки
  );

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

Также нам больше не нужно рендерить при движении мыши, поскольку мы рендерим непрерывно.

```js
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;  // низ равен 0 в WebGL
});
```

И мы получаем простую, но скучную анимацию.

{{{example url="../webgl-shadertoy-w-time.html"}}}

Итак, теперь со всем этим мы можем взять шейдер с [Shadertoy.com](https://shadertoy.com). В шейдерах Shadertoy вы предоставляете функцию, называемую `mainImage`, в этой форме

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{	
}
```

Где ваша задача - установить `fragColor` так же, как вы обычно устанавливали бы `gl_FragColor`, и
`fragCoord` - это то же самое, что и `gl_FragCoord`. Добавление этой дополнительной функции позволяет Shadertoy
наложить немного больше структуры, а также выполнить некоторую дополнительную работу до или после вызова
`mainImage`. Для нас, чтобы использовать это, нам просто нужно вызвать это так

```glsl
#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

out vec4 outColor;

//---вставьте код shadertoy здесь--

void main() {
  mainImage(outColor, gl_FragCoord.xy);
}
```

За исключением того, что Shadertoy использует имена uniforms `iResolution`, `iMouse` и `iTime`, поэтому давайте переименуем их.

```glsl
#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

//---вставьте код shadertoy здесь--

out vec4 outColor;

void main() {
  mainImage(outColor, gl_FragCoord.xy);
}
```

и найти их по новым именам

```js
// ищем местоположения uniforms
const resolutionLocation = gl.getUniformLocation(program, "iResolution");
const mouseLocation = gl.getUniformLocation(program, "iMouse");
const timeLocation = gl.getUniformLocation(program, "iTime");
```

Взяв [этот шейдер shadertoy](https://www.shadertoy.com/view/3l23Rh) и вставив его
в наш шейдер выше, где написано `//---вставьте код shadertoy здесь--`, мы получаем...

{{{example url="../webgl-shadertoy.html"}}}

Это необычайно красивое изображение для отсутствия данных!

Я сделал пример выше рендериться только когда мышь находится над canvas или когда касается.
Это потому, что математика, необходимая
для рисования изображения выше, сложна и медленна, и позволить ей работать непрерывно
сделало бы очень трудным взаимодействие с этой страницей. Если у вас
очень быстрый GPU, изображение выше может работать плавно. На моем ноутбуке
хотя оно работает медленно и рывками.

Это поднимает чрезвычайно важный момент. **Шейдеры на
shadertoy не являются лучшей практикой**. Shadertoy - это головоломка и
вызов *"Если у меня нет данных и только функция, которая
принимает очень мало входных данных, могу ли я сделать интересное или красивое
изображение"*. Это не способ сделать производительный WebGL.

Возьмите, например, [этот удивительный шейдер shadertoy](https://www.shadertoy.com/view/4sS3zG), который выглядит так

<div class="webgl_center"><img src="resources/shadertoy-dolphin.png" style="width: 639px;"></div>

Он красивый, но работает со скоростью около 19 кадров в секунду в крошечном
окне 640x360 на моем мощном ноутбуке. Расширьте окно до полного экрана, и оно работает около
2 или 3 кадров в секунду. Тестирование на моем более мощном настольном компьютере оно все еще достигает только 45 кадров в
секунду при 640x360 и может быть 10 в полноэкранном режиме.

Сравните это с этой игрой, которая также довольно красива и все же работает со скоростью 30-60 кадров в секунду
даже на менее мощных GPU

<iframe class="webgl_center" style="width:560px; height: 360px;" src="https://www.youtube-nocookie.com/embed/7v9gZK9HqqI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Это потому, что игра использует лучшие практики, рисуя вещи текстурированными
треугольниками вместо сложной математики.

Итак, пожалуйста, примите это близко к сердцу. Примеры на Shadertoy
просто удивительны отчасти потому, что теперь вы знаете, что они сделаны
под экстремальным ограничением почти отсутствия данных и являются сложными
функциями, которые рисуют красивые картины. Как таковые, они являются предметом
удивления.

Они также отличный способ изучить много математики.
Но они также никоим образом не являются способом получить производительное
WebGL приложение. Поэтому, пожалуйста, имейте это в виду.

В противном случае, если вы хотите запустить больше шейдеров Shadertoy, вам
потребуется предоставить еще несколько uniforms. Вот список
uniforms, которые предоставляет Shadertoy

<div class="webgl_center"><table  class="tabular-data tabular-data1">
<thead><tr><td>тип</td><td>имя</td><td>где</td><td>описание</td></tr></thead>
<tbody>
<tr><td><b>vec3</b></td><td><b>iResolution</b></td><td>image / buffer</td><td>Разрешение viewport (z - соотношение сторон пикселя, обычно 1.0)</td></tr>
<tr><td><b>float</b></td><td><b>iTime</b></td><td>image / sound / buffer</td><td>Текущее время в секундах</td></tr>
<tr><td><b>float</b></td><td><b>iTimeDelta</b></td><td>image / buffer</td><td>Время, необходимое для рендеринга кадра, в секундах</td></tr>
<tr><td><b>int</b></td><td><b>iFrame</b></td><td>image / buffer</td><td>Текущий кадр</td></tr>
<tr><td><b>float</b></td><td><b>iFrameRate</b></td><td>image / buffer</td><td>Количество кадров, рендеренных в секунду</td></tr>
<tr><td><b>float</b></td><td><b>iChannelTime[4]</b></td><td>image / buffer</td><td>Время для канала (если видео или звук), в секундах</td></tr>
<tr><td><b>vec3</b></td><td><b>iChannelResolution[4]</b></td><td>image / buffer / sound</td><td>Разрешение входной текстуры для каждого канала</td></tr>
<tr><td><b>vec4</b></td><td><b>iMouse</b></td><td>image / buffer</td><td>xy = текущие пиксельные координаты (если LMB нажата). zw = координаты клика</td></tr>
<tr><td><b>sampler2D</b></td><td><b>iChannel{i}</b></td><td>image / buffer / sound</td><td>Сэмплер для входных текстур i</td></tr>
<tr><td><b>vec4</b></td><td><b>iDate</b></td><td>image / buffer / sound</td><td>Год, месяц, день, время в секундах в .xyzw</td></tr>
<tr><td><b>float</b></td><td><b>iSampleRate</b></td><td>image / buffer / sound</td><td>Частота дискретизации звука (обычно 44100)</td></tr>
</tbody></table></div>

Обратите внимание, что `iMouse` и `iResolution` на самом деле должны быть
`vec4` и `vec3` соответственно, поэтому вам может потребоваться настроить
их, чтобы они соответствовали.

`iChannel` - это текстуры, поэтому если шейдер нуждается в них, вам нужно будет
предоставить [текстуры](webgl-3d-textures.html).

Shadertoy также позволяет вам использовать несколько шейдеров для рендеринга в
текстуры вне экрана, поэтому если шейдер нуждается в них, вам нужно будет настроить
[текстуры для рендеринга](webgl-render-to-texture.html).

Колонка "где" указывает, какие uniforms
доступны в каких шейдерах. "image" - это шейдер,
который рендерит в canvas. "buffer" - это шейдер,
который рендерит в текстуру вне экрана. "sound" - это
шейдер, где [ожидается, что ваш шейдер будет генерировать
звуковые данные в текстуру](https://stackoverflow.com/questions/34859701/how-do-shadertoys-audio-shaders-work).

Я надеюсь, это помогло объяснить Shadertoy. Это отличный сайт с удивительными работами,
но хорошо знать, что на самом деле происходит. Если вы хотите узнать больше о
техниках, используемых в этих видах шейдеров, 2 хороших ресурса -
[блог человека, который создал сайт shadertoy]("https://www.iquilezles.org/www/index.htm) и [The Book of Shaders](https://thebookofshaders.com/) (что немного вводит в заблуждение, поскольку на самом деле покрывает только виды шейдеров, используемых на shadertoy, а не виды, используемые в производительных приложениях и играх. Тем не менее, это отличный ресурс!

<div class="webgl_bottombar" id="pixel-coords">
<h3>Пиксельные координаты</h3>
<p>Пиксельные координаты в WebGL
ссылаются на их края. Так, например, если бы у нас был canvas размером 3x2 пикселя, то
значение для <code>gl_FragCoord</code> в пикселе 2
слева и 1 снизу
было бы 2.5, 1.5
</p>
<div class="webgl_center"><img src="resources/webgl-pixels.svg" style="width: 500px;"></div>
</div> 