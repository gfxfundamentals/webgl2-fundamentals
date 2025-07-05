Title: WebGL2 - Скининг
Description: Как выполнить скининг меша в WebGL
TOC: Скининг


Скининг в графике - это название, данное перемещению набора вершин на основе
взвешенного влияния множественных матриц. Это довольно абстрактно.

Это называется *скинингом*, потому что он обычно используется для создания 3D персонажей
с "скелетом", сделанным из "костей", где "кость" - это другое название для матрицы,
и затем **для каждой вершины** устанавливается влияние каждой кости на эту вершину.

Так, например, кость руки будет иметь почти 100% влияние на вершины
около руки персонажа, тогда как кость стопы будет иметь нулевое влияние
на те же вершины. Вершины вокруг запястья будут иметь некоторое влияние от кости руки и также некоторое от кости руки.

Основная часть заключается в том, что вам нужны кости (что является просто причудливым способом сказать
иерархию матриц) и веса. Веса - это значения для каждой вершины, которые идут
от 0 до 1, чтобы сказать, насколько конкретная кость-матрица влияет на позицию
этой вершины. Веса чем-то похожи на цвета вершин с точки зрения данных.
Один набор весов на вершину. Другими словами, веса помещаются в
буфер и предоставляются через атрибуты.

Обычно вы ограничиваете количество весов на вершину отчасти потому, что
иначе это было бы слишком много данных. Персонаж может иметь откуда угодно
от 15 костей (Virtua Fighter 1) до 150-300 костей (некоторые современные игры).
Если бы у вас было 300 костей, вам понадобилось бы 300 весов НА вершину НА кость. Если бы ваш
персонаж имел 10000 вершин, это потребовало бы 3 миллиона весов.

Итак, вместо этого большинство систем скиннинга в реальном времени ограничивают это ~4 весами на вершину.
Обычно это достигается в экспортере/конвертере, который берет данные из
3D пакетов, таких как blender/maya/3dsmax, и для каждой вершины находит 4
кости с наивысшими весами, а затем нормализует эти веса

Чтобы дать псевдо-пример, не-скинированная вершина обычно вычисляется так

    gl_Position = projection * view * model * position;

Скинированная вершина эффективно вычисляется так

    gl_Position = projection * view *
                  (bone1Matrix * position * weight1 +
                   bone2Matrix * position * weight2 +
                   bone3Matrix * position * weight3 +
                   bone4Matrix * position * weight4);

Как вы можете видеть, это как если бы мы вычисляли 4 разные позиции для каждой вершины, а затем смешивали их обратно в одну, применяя веса.

Предполагая, что вы сохранили матрицы костей в uniform массиве, и вы
передали веса и к какой кости применяется каждый вес как
атрибуты, вы могли бы сделать что-то вроде

    #version 300 es
    in vec4 a_position;
    in vec4 a_weights;         // 4 веса на вершину
    in uvec4 a_boneNdx;        // 4 индекса костей на вершину
    uniform mat4 bones[MAX_BONES];  // 1 матрица на кость

    gl_Position = projection * view *
                  (a_bones[a_boneNdx[0]] * a_position * a_weight[0] +
                   a_bones[a_boneNdx[1]] * a_position * a_weight[1] +
                   a_bones[a_boneNdx[2]] * a_position * a_weight[2] +
                   a_boneS[a_boneNdx[3]] * a_position * a_weight[3]);


Есть еще одна проблема. Допустим, у вас есть модель человека с
началом координат (0,0,0) на полу прямо между их ногами.

<div class="webgl_center"><img src="resources/bone-head.svg" style="width: 500px;"></div>

Теперь представьте, что вы поместили матрицу/кость/сустав у их головы, и вы хотите использовать
эту кость для скиннинга. Чтобы держать это простым, представьте, что вы просто установили
веса так, что вершины головы имеют вес 1.0 для кости головы, и никакие другие суставы не влияют на эти вершины.

<div class="webgl_center"><img src="resources/bone-head-setup.svg" style="width: 500px;"></div>

Есть проблема.
Вершины головы находятся на 2 единицы выше начала координат. Кость головы также на 2
единицы выше начала координат. Если бы вы фактически умножили эти вершины головы на
матрицу кости головы, вы получили бы вершины на 4 единицы выше начала координат. Оригинальные
2 единицы вершин + 2 единицы матрицы кости головы.

<div class="webgl_center"><img src="resources/bone-head-problem.svg" style="width: 500px;"></div>

Решение заключается в сохранении "привязочной позы", которая является дополнительной матрицей на сустав
того, где каждая матрица была до того, как вы использовали ее для влияния на вершины. В этом
случае привязочная поза матрицы головы была бы на 2 единицы выше начала координат.
Итак, теперь вы можете использовать обратную матрицу, чтобы вычесть дополнительные 2
единицы.

Другими словами, матрицы костей, переданные в шейдер, каждая была
умножена на их обратную привязочную позу, чтобы сделать их влияние только
настолько, насколько они изменились от своих оригинальных позиций относительно начала координат
меша.

Давайте создадим небольшой пример. Мы будем анимировать в 2d сетку, подобную этой

<div class="webgl_center"><img src="resources/skinned-mesh.svg" style="width: 400px;"></div>

* Где `b0`, `b1` и `b2` - это матрицы костей.
* `b1` является дочерним элементом `b0`, а `b2` является дочерним элементом `b1`
* Вершины `0,1` получат вес 1.0 от кости b0
* Вершины `2,3` получат вес 0.5 от костей b0 и b1
* Вершины `4,5` получат вес 1.0 от кости b1
* Вершины `6,7` получат вес 0.5 от костей b1 и b2
* Вершины `8,9` получат вес 1.0 от кости b2

Мы будем использовать утилиты, описанные в [меньше кода больше веселья](webgl-less-code-more-fun.html).

Сначала нам нужны вершины и для каждой вершины индекс
каждой кости, которая влияет на нее, и число от 0 до 1
того, насколько сильно влияет эта кость.

```
const arrays = {
  position: {
    numComponents: 2,
    data: [
    0,  1,  // 0
    0, -1,  // 1
    2,  1,  // 2
    2, -1,  // 3
    4,  1,  // 4
    4, -1,  // 5
    6,  1,  // 6
    6, -1,  // 7
    8,  1,  // 8
    8, -1,  // 9
    ],
  },
  boneNdx: {
    numComponents: 4,
    data: new Uint8Array([
      0, 0, 0, 0,  // 0
      0, 0, 0, 0,  // 1
      0, 1, 0, 0,  // 2
      0, 1, 0, 0,  // 3
      1, 0, 0, 0,  // 4
      1, 0, 0, 0,  // 5
      1, 2, 0, 0,  // 6
      1, 2, 0, 0,  // 7
      2, 0, 0, 0,  // 8
      2, 0, 0, 0,  // 9
    ]),
  },
  weight: {
    numComponents: 4,
    data: [
    1, 0, 0, 0,  // 0
    1, 0, 0, 0,  // 1
    .5,.5, 0, 0,  // 2
    .5,.5, 0, 0,  // 3
    1, 0, 0, 0,  // 4
    1, 0, 0, 0,  // 5
    .5,.5, 0, 0,  // 6
    .5,.5, 0, 0,  // 7
    1, 0, 0, 0,  // 8
    1, 0, 0, 0,  // 9
    ],
  },

  indices: {
    numComponents: 2,
    data: [
      0, 1,
      0, 2,
      1, 3,
      2, 3, //
      2, 4,
      3, 5,
      4, 5,
      4, 6,
      5, 7, //
      6, 7,
      6, 8,
      7, 9,
      8, 9,
    ],
  },
};
// вызывает gl.createBuffer, gl.bindBuffer, gl.bufferData
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
const skinVAO = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);
```

Мы можем определить наши uniform значения, включая матрицу для каждой кости

```
// 4 матрицы, одна для каждой кости
const numBones = 4;
const boneArray = new Float32Array(numBones * 16);

var uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
  bones: boneArray,
  color: [1, 0, 0, 1],
}; 

Мы можем создать представления в boneArray, одно для каждой матрицы

```
// создаем представления для каждой кости. Это позволяет всем костям
// существовать в 1 массиве для загрузки, но как отдельные
// массивы для использования с математическими функциями
const boneMatrices = [];  // данные uniform
const bones = [];         // значение до умножения на обратную привязочную матрицу
const bindPose = [];      // привязочная матрица
for (let i = 0; i < numBones; ++i) {
  boneMatrices.push(new Float32Array(boneArray.buffer, i * 4 * 16, 16));
  bindPose.push(m4.identity());  // просто выделяем память
  bones.push(m4.identity());     // просто выделяем память
}
```

И затем некоторый код для манипуляции с матрицами костей. Мы просто будем вращать
их в иерархии, как кости пальца.

```
// вращаем каждую кость на угол и симулируем иерархию
function computeBoneMatrices(bones, angle) {
  const m = m4.identity();
  m4.zRotate(m, angle, bones[0]);
  m4.translate(bones[0], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[1]);
  m4.translate(bones[1], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[2]);
  // bones[3] не используется
}
```

Теперь вызовем это один раз, чтобы сгенерировать их начальные позиции, и используем результат
для вычисления обратных привязочных матриц.

```
// вычисляем начальные позиции каждой матрицы
computeBoneMatrices(bindPose, 0);

// вычисляем их обратные
const bindPoseInv = bindPose.map(function(m) {
  return m4.inverse(m);
});
```

Теперь мы готовы к рендерингу

Сначала мы анимируем кости, вычисляя новую мировую матрицу для каждой

```
const t = time * 0.001;
const angle = Math.sin(t) * 0.8;
computeBoneMatrices(bones, angle);
```

Затем мы умножаем результат каждой на обратную привязочную позу, чтобы решить
проблему, упомянутую выше

```
// умножаем каждую на ее bindPoseInverse
bones.forEach((bone, ndx) => {
  m4.multiply(bone, bindPoseInv[ndx], boneMatrices[ndx]);
});
```

Затем все обычные вещи: настройка атрибутов, установка uniform значений и отрисовка.

```
gl.useProgram(programInfo.program);

gl.bindVertexArray(skinVAO);

// вызывает gl.uniformXXX, gl.activeTexture, gl.bindTexture
twgl.setUniforms(programInfo, uniforms);

// вызывает gl.drawArrays или gl.drawIndices
twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
```

И вот результат

{{{example url="../webgl-skinning.html" }}}

Красные линии - это *скинированный* меш. Зеленые и синие линии представляют
x-ось и y-ось каждой кости или "сустава". Вы можете видеть, как вершины,
которые находятся под влиянием множественных костей, перемещаются между костями, которые влияют на них.
Мы не покрыли, как рисуются кости, так как это не важно для объяснения того, как работает скининг.
Смотрите код, если вам любопытно.

ПРИМЕЧАНИЕ: кости против суставов сбивает с толку. Есть только 1 вещь, *матрицы*.
Но в 3D пакете моделирования они обычно рисуют gizmo (UI виджет)
между каждой матрицей. Это выглядит как кость. Суставы
- это где находятся матрицы, и они рисуют линию или конус от каждого сустава
к следующему, чтобы это выглядело как скелет.

<div class="webgl_center">
  <img src="resources/bone-display.png" style="width: 351px;">
  <div class="caption"><a href="https://www.blendswap.com/blends/view/66412">LowPoly Man</a> by <a href="https://www.blendswap.com/user/TiZeta">TiZeta</a></div>
</div>

Одна вещь, которую стоит отметить, что мы, возможно, не делали раньше, мы создали атрибут `uvec4`, который является атрибутом, который получает беззнаковые целые числа. Если бы мы не использовали twgl,
нам пришлось бы вызвать `gl.vertexAttribIPointer` для его настройки вместо более
обычного `gl.vertexAttibPointer`.

К сожалению, есть ограничение на количество uniform значений, которые вы можете использовать в шейдере.
Нижний предел в WebGL составляет 64 vec4, что составляет только 8 mat4, и вам, вероятно,
нужны некоторые из этих uniform значений для других вещей, например, у нас есть `color`
в фрагментном шейдере, и у нас есть `projection` и `view`, что означает, что если
мы были на устройстве с лимитом 64 vec4, мы могли бы иметь только 5 костей! Проверяя
[WebGLStats](https://web3dsurvey.com/webgl/parameters/MAX_VERTEX_UNIFORM_VECTORS)
большинство устройств поддерживают 128 vec4, и 70% из них поддерживают 256 vec4, но с
нашим примером выше это все еще только 13 костей и 29 костей соответственно. 13
даже недостаточно для персонажа в стиле Virtua Fighter 1 начала 90-х, и 29 не
близко к числу, используемому в большинстве современных игр.

Несколько способов обойти это. Один - предварительно обработать модели офлайн и разбить их
на несколько частей, каждая из которых использует не более N костей. Это довольно сложно
и приносит свой собственный набор проблем.

Другой - хранить матрицы костей в текстуре. Это важное напоминание
о том, что текстуры - это не просто изображения, они эффективно являются 2D массивами данных с произвольным доступом,
которые вы можете передать в шейдер, и вы можете использовать их для всех видов вещей,
которые не просто чтение изображений для текстурирования.

Давайте передадим наши матрицы в текстуре, чтобы обойти лимит uniform значений. Чтобы сделать это
легко, мы будем использовать текстуры с плавающей точкой.

Давайте обновим шейдер, чтобы получить матрицы из текстуры.
Мы сделаем текстуру с одной матрицей на строку. Каждый пиксель текстуры
имеет R, G, B и A, это 4 значения, поэтому нам нужно только 4 пикселя на матрицу,
один пиксель для каждой строки матрицы.
Текстуры обычно могут быть по крайней мере 2048 пикселей в определенном измерении, поэтому
это даст нам место для по крайней мере 2048 матриц костей, что достаточно.

```
#version 300 es
in vec4 a_position;
in vec4 a_weight;
in uvec4 a_boneNdx;

uniform mat4 projection;
uniform mat4 view;
*uniform sampler2D boneMatrixTexture;

+mat4 getBoneMatrix(uint boneNdx) {
+  return mat4(
+    texelFetch(boneMatrixTexture, ivec2(0, boneNdx), 0),
+    texelFetch(boneMatrixTexture, ivec2(1, boneNdx), 0),
+    texelFetch(boneMatrixTexture, ivec2(2, boneNdx), 0),
+    texelFetch(boneMatrixTexture, ivec2(3, boneNdx), 0));
+}

void main() {

  gl_Position = projection * view *
*                (getBoneMatrix(a_boneNdx[0]) * a_position * a_weight[0] +
*                 getBoneMatrix(a_boneNdx[1]) * a_position * a_weight[1] +
*                 getBoneMatrix(a_boneNdx[2]) * a_position * a_weight[2] +
*                 getBoneMatrix(a_boneNdx[3]) * a_position * a_weight[3]);

}
```

Обратите внимание, что мы используем `texelFetch` вместо `texture` для получения данных из
текстуры. `texelFetch` извлекает один пиксель из текстуры.
Он принимает как входные данные sampler, ivec2 с координатами x,y текстуры
в пикселях, и уровень mip как в

```
vec4 data = texelFetch(sampler2D, ivec2(x, y), lod);
```

Теперь мы настроим текстуру, в которую можем поместить матрицы костей

```
// подготавливаем текстуру для матриц костей
const boneMatrixTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
// поскольку мы хотим использовать текстуру для чистых данных, мы отключаем
// фильтрацию
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

И мы передадим эту текстуру как uniform.

```
const uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
*  boneMatrixTexture,
  color: [1, 0, 0, 1],
};
```

Затем единственное, что нам нужно изменить, это обновить текстуру с
последними матрицами костей при рендеринге

```
// обновляем текстуру текущими матрицами
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,          // уровень
    gl.RGBA32F, // внутренний формат
    4,          // ширина 4 пикселя, каждый пиксель имеет RGBA, поэтому 4 пикселя - это 16 значений
    numBones,   // одна строка на кость
    0,          // граница
    gl.RGBA,    // формат
    gl.FLOAT,   // тип
    boneArray);
```

Результат тот же, но мы решили проблему, что недостаточно
uniform значений для передачи матриц через uniform.

{{{example url="../webgl-skinning-bone-matrices-in-texture.html" }}}

Итак, это основы скиннинга. Не так сложно написать код для отображения
скинированного меша. Более сложная часть - это фактически получение данных. Вам обычно нужно
какое-то 3D программное обеспечение, такое как blender/maya/3d studio max, а затем либо написать
свой собственный экспортер, либо найти экспортер и формат, который предоставит все необходимые данные. Вы увидите, когда мы пройдемся по этому, что в загрузке скина в 10 раз больше кода, чем в его отображении, и это не включает, вероятно, в 20-30 раз больше кода в экспортере для получения данных из программы 3D моделирования. Кстати, это одна из вещей, которую часто упускают люди, пишущие свой собственный 3D движок. Движок - это легкая часть 😜

Будет много кода, поэтому давайте сначала попробуем просто отобразить не-скинированную модель.

Давайте попробуем загрузить файл glTF. [glTF](https://www.khronos.org/gltf/) как бы разработан для WebGL. Поискав в сети, я нашел [этот файл кита-убийцы blender](https://www.blendswap.com/blends/view/65255) от [Junskie Pastilan](https://www.blendswap.com/user/pasilan)

<div class="webgl_center"><img src="../resources/models/killer_whale/thumbnail.jpg"></div>

Есть 2 формата верхнего уровня для glTF. Формат `.gltf` - это JSON файл, который обычно ссылается на файл `.bin`, который является бинарным файлом, содержащим обычно только геометрию и возможно данные анимации. Другой формат - это `.glb`, который является бинарным форматом. Это в основном просто JSON и любые другие файлы, объединенные в один бинарный файл с коротким заголовком и секцией размера/типа между каждым
объединенным куском. Для JavaScript я думаю, что формат `.gltf` немного проще для начала, поэтому давайте попробуем загрузить его.

Сначала [я скачал файл .blend](https://www.blendswap.com/blends/view/65255), установил [blender](https://blender.org), установил [экспортер gltf](https://github.com/KhronosGroup/glTF-Blender-IO), загрузил файл в blender и экспортировал.

<div class="webgl_center"><img src="resources/blender-killer-whale.png" style="width: 700px;" class="nobg"></div>

> Быстрая заметка: 3D программное обеспечение, такое как Blender, Maya, 3DSMax - это чрезвычайно сложное программное обеспечение с тысячами опций. Когда я впервые изучил 3DSMax в 1996 году, я проводил 2-3 часа в день, читая 1000+ страничное руководство и работая с учебниками около 3 недель. Я сделал что-то подобное, когда изучал Maya несколько лет спустя. Blender так же сложен, и более того, у него очень другой интерфейс от практически всего другого программного обеспечения. Это просто короткий способ сказать, что вы должны ожидать потратить значительное время на изучение любого 3D пакета, который решите использовать.

После экспорта я загрузил файл .gltf в мой текстовый редактор и посмотрел вокруг. Я использовал [эту шпаргалку](https://www.khronos.org/files/gltf20-reference-guide.pdf), чтобы разобраться в формате.

Я хочу сделать ясным, что код ниже не является идеальным загрузчиком glTF. Это просто достаточно кода, чтобы заставить кита отображаться. Я подозреваю, что если бы мы попробовали разные файлы, мы столкнулись бы с областями, которые нужно изменить.

Первое, что нам нужно сделать, это загрузить файл. Чтобы сделать это проще, давайте используем [async/await](https://javascript.info/async-await) JavaScript. Сначала давайте напишем некоторый код для загрузки файла `.gltf` и любых файлов, на которые он ссылается.

```
async function loadGLTF(url) {
  const gltf = await loadJSON(url);

  // загружаем все ссылающиеся файлы относительно файла gltf
  const baseURL = new URL(url, location.href);
  gltf.buffers = await Promise.all(gltf.buffers.map((buffer) => {
    const url = new URL(buffer.uri, baseURL.href);
    return loadBinary(url.href);
  }));

  ...

async function loadFile(url, typeFunc) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`could not load: ${url}`);
  }
  return await response[typeFunc]();
}

async function loadBinary(url) {
  return loadFile(url, 'arrayBuffer');
}

async function loadJSON(url) {
  return loadFile(url, 'json');
}
```

Теперь нам нужно пройтись по данным и соединить вещи.

Сначала давайте обработаем то, что glTF считает мешем. Меш - это коллекция примитивов. Примитив - это эффективно буферы и атрибуты, необходимые для рендеринга чего-то. Давайте используем библиотеку [twgl](https://twgljs.org), которую мы покрыли в [меньше кода больше веселья](webgl-less-code-more-fun.html). Мы пройдемся по мешам и для каждого создадим `BufferInfo`, который мы можем передать в `twgl.createVAOFromBufferInfo`. Напомним, что `BufferInfo` - это эффективно просто информация об атрибутах, индексы, если они есть, и количество элементов для передачи в `gl.drawXXX`. Например, куб только с позициями и нормалями может иметь BufferInfo с такой структурой

```
const cubeBufferInfo = {
  attribs: {
    'a_POSITION': { buffer: WebGLBuffer, type: gl.FLOAT, numComponents: 3, },
    'a_NORMAL': { buffer: WebGLBuffer, type: gl.FLOAT, numComponents: 3, },
  },
  numElements: 24,
  indices: WebGLBuffer,
  elementType: gl.UNSIGNED_SHORT,
}
```

Итак, мы пройдемся по каждому примитиву и сгенерируем BufferInfo как этот.

Примитивы имеют массив атрибутов, каждый атрибут ссылается на accessor. Accessor говорит, какой тип данных там есть, например `VEC3`/`gl.FLOAT` и ссылается на bufferView. BufferView указывает некоторое представление в буфер. Учитывая индекс accessor, мы можем написать некоторый код, который возвращает WebGLBuffer с загруженными данными, accessor и stride, указанный для bufferView.

```
// Учитывая индекс accessor, возвращаем accessor, WebGLBuffer и stride
function getAccessorAndWebGLBuffer(gl, gltf, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  if (!bufferView.webglBuffer) {
    const buffer = gl.createBuffer();
    const target = bufferView.target || gl.ARRAY_BUFFER;
    const arrayBuffer = gltf.buffers[bufferView.buffer];
    const data = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    bufferView.webglBuffer = buffer;
  }
  return {
    accessor,
    buffer: bufferView.webglBuffer,
    stride: bufferView.stride || 0,
  };
}
```

Нам также нужен способ конвертировать из типа glTF accessor в количество компонентов

```
function throwNoKey(key) {
  throw new Error(`no key: ${key}`);
}

const accessorTypeToNumComponentsMap = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4,
  'MAT2': 4,
  'MAT3': 9,
  'MAT4': 16,
};

function accessorTypeToNumComponents(type) {
  return accessorTypeToNumComponentsMap[type] || throwNoKey(type);
}
```

Теперь, когда мы создали эти функции, мы можем использовать их для настройки наших мешей

Примечание: файлы glTF могут якобы определять материалы, но экспортер не поместил никаких материалов в файл, даже хотя экспорт материалов был отмечен. Я могу только догадываться, что экспортер не обрабатывает каждый вид материала в blender, что неудачно. Мы будем использовать материал по умолчанию, если в файле нет материала. Поскольку в этом файле нет материалов, здесь нет кода для использования материалов glTF.

```
const defaultMaterial = {
  uniforms: {
    u_diffuse: [.5, .8, 1, 1],
  },
};

// настраиваем меши
gltf.meshes.forEach((mesh) => {
  mesh.primitives.forEach((primitive) => {
    const attribs = {};
    let numElements;
    for (const [attribName, index] of Object.entries(primitive.attributes)) {
      const {accessor, buffer, stride} = getAccessorAndWebGLBuffer(gl, gltf, index);
      numElements = accessor.count;
      attribs[`a_${attribName}`] = {
        buffer,
        type: accessor.componentType,
        numComponents: accessorTypeToNumComponents(accessor.type),
        stride,
        offset: accessor.byteOffset | 0,
      };
    }

    const bufferInfo = {
      attribs,
      numElements,
    };

    if (primitive.indices !== undefined) {
      const {accessor, buffer} = getAccessorAndWebGLBuffer(gl, gltf, primitive.indices);
      bufferInfo.numElements = accessor.count;
      bufferInfo.indices = buffer;
      bufferInfo.elementType = accessor.componentType;
    }

    primitive.bufferInfo = bufferInfo;

    // создаем VAO для этого примитива
    primitive.vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, primitive.bufferInfo);

    // сохраняем информацию о материале для этого примитива
    primitive.material = gltf.materials && gltf.materials[primitive.material] || defaultMaterial;
  });
});
```

Теперь каждый примитив будет иметь свойство `bufferInfo` и `material`.

Для скиннинга нам почти всегда нужен какой-то граф сцены. Мы создали граф сцены в [статье о графах сцены](webgl-scene-graph.html), поэтому давайте используем тот.

```
class TRS {
  constructor(position = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }
  getMatrix(dst) {
    dst = dst || new Float32Array(16);
    m4.compose(this.position, this.rotation, this.scale, dst);
    return dst;
  }
}

class Node {
  constructor(source, name) {
    this.name = name;
    this.source = source;
    this.parent = null;
    this.children = [];
    this.localMatrix = m4.identity();
    this.worldMatrix = m4.identity();
    this.drawables = [];
  }
  setParent(parent) {
    if (this.parent) {
      this.parent._removeChild(this);
      this.parent = null;
    }
    if (parent) {
      parent._addChild(this);
      this.parent = parent;
    }
  }
  updateWorldMatrix(parentWorldMatrix) {
    const source = this.source;
    if (source) {
      source.getMatrix(this.localMatrix);
    }

    if (parentWorldMatrix) {
      // была передана матрица, поэтому делаем математику
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // матрица не была передана, поэтому просто копируем локальную в мировую
      m4.copy(this.localMatrix, this.worldMatrix);
    }

    // теперь обрабатываем всех детей
    const worldMatrix = this.worldMatrix;
    for (const child of this.children) {
      child.updateWorldMatrix(worldMatrix);
    }
  }
  traverse(fn) {
    fn(this);
    for (const child of this.children) {
      child.traverse(fn);
    }
  }
  _addChild(child) {
    this.children.push(child);
  }
  _removeChild(child) {
    const ndx = this.children.indexOf(child);
    this.children.splice(ndx, 1);
  }
}
```

Есть несколько заметных изменений от кода в [статье о графе сцены](webgl-scene-graph.html).

* Этот код использует функцию `class` из ES6.

  Гораздо приятнее использовать синтаксис `class`, чем старый стиль определения класса.

* Мы добавили массив drawables в `Node`

  Это будет список вещей для отрисовки из этого Node. Мы поместим
  экземпляры класса в этот список, которые отвечают за выполнение
  фактической отрисовки. Таким образом, мы можем универсально рисовать разные вещи,
  используя разные классы.

  Примечание: Не ясно для меня, что помещение массива drawables в Node
  является лучшим решением. Я чувствую, что сам граф сцены, возможно,
  вообще не должен содержать drawables. Вещи, которые нужно рисовать, могли бы вместо этого
  просто ссылаться на узел в графе, где получить их данные.
  Этот способ с drawables в графе распространен, поэтому давайте начнем с этого.

* Мы добавили метод `traverse`.

  Он вызывает функцию, передавая ей текущий узел, а затем рекурсивно делает то же
  самое для всех дочерних узлов.

* Класс `TRS` использует кватернион для вращения

  Мы не покрыли кватернионы, и, честно говоря, я не думаю, что понимаю их
  достаточно хорошо, чтобы объяснить их. К счастью, нам не нужно знать, как они
  работают, чтобы использовать их. Мы просто берем данные из файла gltf и вызываем
  функцию, которая строит матрицу из этих данных, и используем матрицу.

Узлы в файле glTF хранятся как плоский массив.
Мы конвертируем данные узлов в glTF в экземпляры `Node`. Мы сохраняем старый массив
данных узлов как `origNodes`, так как он понадобится нам позже.

```
const origNodes = gltf.nodes;
gltf.nodes = gltf.nodes.map((n) => {
  const {name, skin, mesh, translation, rotation, scale} = n;
  const trs = new TRS(translation, rotation, scale);
  const node = new Node(trs, name);
  const realMesh =　gltf.meshes[mesh];
  if (realMesh) {
    node.drawables.push(new MeshRenderer(realMesh));
  }
  return node;
});
```

Выше мы создали экземпляр `TRS` для каждого узла, экземпляр `Node` для каждого узла, и, если было свойство `mesh`, мы искали данные меша, которые мы настроили раньше, и создавали `MeshRenderer` для его отрисовки.

Давайте создадим `MeshRenderer`. Это просто инкапсуляция кода, который мы использовали в [меньше кода больше веселья](webgl-less-code-more-fun.html) для рендеринга одной модели. Все, что он делает, это держит ссылку на меш, а затем для каждого примитива настраивает программу, атрибуты и uniform значения и в конечном итоге вызывает `gl.drawArrays` или `gl.drawElements` через `twgl.drawBufferInfo`;

```
class MeshRenderer {
  constructor(mesh) {
    this.mesh = mesh;
  }
  render(node, projection, view, sharedUniforms) {
    const {mesh} = this;
    gl.useProgram(meshProgramInfo.program);
    for (const primitive of mesh.primitives) {
      gl.bindVertexArray(primitive.vao);
      twgl.setUniforms(meshProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
      }, primitive.material.uniforms, sharedUniforms);
      twgl.drawBufferInfo(gl, primitive.bufferInfo);
    }
  }
}
```

Мы создали узлы, теперь нам нужно фактически расположить их в графе сцены. Это делается на 2 уровнях в glTF.
Сначала каждый узел имеет необязательный массив детей, которые также являются индексами в массив узлов, поэтому мы можем пройти все
узлы и родить их детей

```
function addChildren(nodes, node, childIndices) {
  childIndices.forEach((childNdx) => {
    const child = nodes[childNdx];
    child.setParent(node);
  });
}

// располагаем узлы в граф
gltf.nodes.forEach((node, ndx) => {
  const children = origNodes[ndx].children;
  if (children) {
    addChildren(gltf.nodes, node, children);
  }
});
```

Затем есть массив сцен. Сцена ссылается на
массив узлов по индексу в массив узлов, которые находятся внизу сцены. Не ясно для меня, почему они не просто начали с одного корневого узла, но что бы то ни было, это то, что в файле glTF, поэтому мы создаем корневой узел и родим всех детей сцены к этому узлу

```
  // настраиваем сцены
  for (const scene of gltf.scenes) {
    scene.root = new Node(new TRS(), scene.name);
    addChildren(gltf.nodes, scene.root, scene.nodes);
  }

  return gltf;
}
```

и мы закончили с загрузкой, по крайней мере, только мешей. Давайте
отметим основную функцию как `async`, чтобы мы могли использовать ключевое слово `await`.

```
async function main() {
```

и мы можем загрузить файл gltf так

```
const gltf = await loadGLTF('resources/models/killer_whale/whale.CYCLES.gltf');
```

Для рендеринга нам нужен шейдер, который соответствует данным в файле gltf. Давайте посмотрим на данные в файле gltf для примитива, который в нем есть

```
{
    "name" : "orca",
    "primitives" : [
        {
            "attributes" : {
                "JOINTS_0" : 5,
                "NORMAL" : 2,
                "POSITION" : 1,
                "TANGENT" : 3,
                "TEXCOORD_0" : 4,
                "WEIGHTS_0" : 6
            },
            "indices" : 0
        }
    ]
}
```

Глядя на это, для рендеринга давайте просто используем `NORMAL` и `POSITION`. Мы добавили `a_` в начало каждого атрибута, поэтому вершинный шейдер, подобный этому, должен работать

```
#version 300 es
in vec4 a_POSITION;
in vec3 a_NORMAL;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec3 v_normal;

void main() {
  gl_Position = u_projection * u_view * u_world * a_POSITION;
  v_normal = mat3(u_world) * a_NORMAL;
}
```

и для фрагментного шейдера давайте используем простое направленное освещение

```
#version 300 es
precision highp float;

int vec3 v_normal;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

out vec4 outColor;

void main () {
  vec3 normal = normalize(v_normal);
  float light = dot(u_lightDirection, normal) * .5 + .5;
  outColor = vec4(u_diffuse.rgb * light, u_diffuse.a);
}
```

Обратите внимание, что мы берем скалярное произведение, как мы покрыли в [статье о направленном освещении](webgl-3d-lighting-directional.html), но в отличие от того, здесь скалярное произведение умножается на .5 и мы добавляем .5. При нормальном направленном освещении поверхность освещена на 100%, когда она направлена прямо на свет, и затухает до 0%, когда поверхность перпендикулярна свету. Это означает, что вся 1/2 модели, обращенная от света, черная. Умножая на .5 и добавляя .5, мы берем скалярное произведение от -1 &lt;-&gt; 1 к 0 &lt;-&gt; 1, что означает, что оно будет черным только когда направлено в полную противоположную сторону. Это дает дешевое, но приятное освещение для простых тестов.

Итак, нам нужно скомпилировать и связать шейдеры.

```
// компилирует и связывает шейдеры, ищет расположения атрибутов и uniform значений
const meshProgramInfo = twgl.createProgramInfo(gl, [meshVS, fs]);
```

и затем для рендеринга все, что отличается от раньше, это это

```
const sharedUniforms = {
  u_lightDirection: m4.normalize([-1, 3, 5]),
};

function renderDrawables(node) {
  for(const drawable of node.drawables) {
      drawable.render(node, projection, view, sharedUniforms);
  }
}

for (const scene of gltf.scenes) {
  // обновляем все мировые матрицы в сцене.
  scene.root.updateWorldMatrix();
  // проходим сцену и рендерим все рендерируемые объекты
  scene.root.traverse(renderDrawables);
}
```

Оставшееся от раньше (не показано выше) - это наш код для вычисления матрицы проекции, матрицы камеры и матрицы вида. Затем мы просто проходим каждую сцену, вызываем `scene.root.updateWorldMatrix`, который обновит мировую
матрицу всех узлов в том графе. Затем мы вызываем `scene.root.traverse` с `renderDrawables`.

`renderDrawables` вызывает метод render всех drawables на том узле, передавая проекцию, вид и информацию об освещении через `sharedUniforms`.

{{{example url="../webgl-skinning-3d-gltf.html" }}}

Теперь, когда это работает, давайте обработаем скины.

Сначала давайте создадим класс для представления скина. Он будет управлять списком суставов, что является другим словом для узлов в графе сцены, которые применяются к скину. Он также будет иметь обратные привязочные матрицы и будет управлять текстурой, в которую мы помещаем матрицы суставов.

```
class Skin {
  constructor(joints, inverseBindMatrixData) {
    this.joints = joints;
    this.inverseBindMatrices = [];
    this.jointMatrices = [];
    // выделяем достаточно места для одной матрицы на сустав
    this.jointData = new Float32Array(joints.length * 16);
    // создаем представления для каждого сустава и inverseBindMatrix
    for (let i = 0; i < joints.length; ++i) {
      this.inverseBindMatrices.push(new Float32Array(
          inverseBindMatrixData.buffer,
          inverseBindMatrixData.byteOffset + Float32Array.BYTES_PER_ELEMENT * 16 * i,
          16));
      this.jointMatrices.push(new Float32Array(
          this.jointData.buffer,
          Float32Array.BYTES_PER_ELEMENT * 16 * i,
          16));
    }
    // создаем текстуру для хранения матриц суставов
    this.jointTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  update(node) {
    const globalWorldInverse = m4.inverse(node.worldMatrix);
    // проходим каждый сустав и получаем его текущую мировую матрицу
    // применяем обратные привязочные матрицы и сохраняем
    // весь результат в текстуре
    for (let j = 0; j < this.joints.length; ++j) {
      const joint = this.joints[j];
      const dst = this.jointMatrices[j];
      m4.multiply(globalWorldInverse, joint.worldMatrix, dst);
      m4.multiply(dst, this.inverseBindMatrices[j], dst);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 4, this.joints.length, 0,
                  gl.RGBA, gl.FLOAT, this.jointData);
  }
}
```

И как у нас был `MeshRenderer`, давайте создадим `SkinRenderer`, который использует `Skin` для рендеринга скинированного меша.

```
class SkinRenderer {
  constructor(mesh, skin) {
    this.mesh = mesh;
    this.skin = skin;
  }
  render(node, projection, view, sharedUniforms) {
    const {skin, mesh} = this;
    skin.update(node);
    gl.useProgram(skinProgramInfo.program);
    for (const primitive of mesh.primitives) {
      gl.bindVertexArray(primitive.vao);
      twgl.setUniforms(skinProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
        u_jointTexture: skin.jointTexture,
        u_numJoints: skin.joints.length,
      }, primitive.material.uniforms, sharedUniforms);
      twgl.drawBufferInfo(gl, primitive.bufferInfo);
    }
  }
}
```

Вы можете видеть, что это очень похоже на `MeshRenderer`. У него есть ссылка на `Skin`, которую он использует для обновления всех матриц, необходимых для рендеринга. Затем он следует стандартному шаблону для рендеринга, используя программу, настраивая атрибуты, устанавливая все uniform значения с помощью `twgl.setUniforms`, который также привязывает текстуры, а затем рендерит.

Нам также нужен вершинный шейдер, который поддерживает скининг

```
const skinVS = `#version 300 es
in vec4 a_POSITION;
in vec3 a_NORMAL;
in vec4 a_WEIGHTS_0;
in uvec4 a_JOINTS_0;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform sampler2D u_jointTexture;
uniform float u_numJoints;

out vec3 v_normal;

mat4 getBoneMatrix(uint jointNdx) {
  return mat4(
    texelFetch(u_jointTexture, ivec2(0, jointNdx), 0),
    texelFetch(u_jointTexture, ivec2(1, jointNdx), 0),
    texelFetch(u_jointTexture, ivec2(2, jointNdx), 0),
    texelFetch(u_jointTexture, ivec2(3, jointNdx), 0));
}

void main() {
  mat4 skinMatrix = getBoneMatrix(a_JOINTS_0[0]) * a_WEIGHTS_0[0] +
                    getBoneMatrix(a_JOINTS_0[1]) * a_WEIGHTS_0[1] +
                    getBoneMatrix(a_JOINTS_0[2]) * a_WEIGHTS_0[2] +
                    getBoneMatrix(a_JOINTS_0[3]) * a_WEIGHTS_0[3];
  mat4 world = u_world * skinMatrix;
  gl_Position = u_projection * u_view * world * a_POSITION;
  v_normal = mat3(world) * a_NORMAL;
}
`;
```

Это в значительной степени то же самое, что и наш скининг шейдер выше. Мы переименовали атрибуты, чтобы они соответствовали тому, что в файле gltf.

Самое большое изменение - это создание `skinMatrix`. В нашем предыдущем скининг шейдере мы умножали позицию на каждую отдельную матрицу сустава/кости и умножали их на вес влияния для каждого сустава. В этом случае мы вместо этого складываем матрицы, умноженные на веса, и просто умножаем на позицию один раз. Это дает тот же результат, но мы можем использовать `skinMatrix` для умножения нормали, что нам нужно делать, иначе нормали не будут соответствовать скину.

Также обратите внимание, что мы умножаем на матрицу `u_world` здесь. Мы вычли ее в `Skin.update` с этими строками

```
*const globalWorldInverse = m4.inverse(node.worldMatrix);
// проходим каждый сустав и получаем его текущую мировую матрицу
// применяем обратные привязочные матрицы и сохраняем
// весь результат в текстуре
for (let j = 0; j < this.joints.length; ++j) {
  const joint = this.joints[j];
  const dst = this.jointMatrices[j];
*  m4.multiply(globalWorldInverse, joint.worldMatrix, dst);
```

Делаете ли вы это или нет - зависит от вас. Причина для этого в том, что это позволяет вам инстанцировать скин. Другими словами, вы можете рендерить скинированный меш в точно такой же позе в более чем
одном месте в том же кадре. Идея в том, что если есть много суставов, то выполнение всей матричной математики для скинированного меша медленно, поэтому
вы делаете эту математику один раз, а затем можете отобразить этот скинированный
меш в разных местах, просто перерендерив с другой мировой матрицей.

Это может быть полезно для отображения толпы персонажей. К сожалению, все персонажи будут в точно такой же позе, поэтому не ясно для меня, действительно ли это так полезно или нет. Как часто такая ситуация действительно возникает? Вы можете убрать умножение на обратную мировую матрицу узла в `Skin` и убрать умножение на `u_world` в шейдере, и результат будет выглядеть так же, вы просто не можете *инстанцировать* этот скинированный меш. Конечно, вы можете рендерить тот же скинированный меш столько раз, сколько хотите, в разных позах. Вам понадобится другой объект `Skin`, указывающий на разные узлы, которые находятся в какой-то другой ориентации.

Вернувшись к нашему коду загрузки, когда мы создаем экземпляры `Node`, если есть свойство `skin`, мы запомним его, чтобы мы могли создать `Skin` для него.

```
+const skinNodes = [];
const origNodes = gltf.nodes;
gltf.nodes = gltf.nodes.map((n) => {
  const {name, skin, mesh, translation, rotation, scale} = n;
  const trs = new TRS(translation, rotation, scale);
  const node = new Node(trs, name);
  const realMesh =　gltf.meshes[mesh];
+  if (skin !== undefined) {
+    skinNodes.push({node, mesh: realMesh, skinNdx: skin});
+  } else if (realMesh) {
    node.drawables.push(new MeshRenderer(realMesh));
  }
  return node;
});
```

После создания `Node` нам нужно создать `Skin`. Скины ссылаются на узлы через массив `joints`, который является списком индексов узлов, которые поставляют матрицы для суставов.
Скин также ссылается на accessor, который ссылается на обратные привязочные матрицы, сохраненные в файле.

```
// настраиваем скины
gltf.skins = gltf.skins.map((skin) => {
  const joints = skin.joints.map(ndx => gltf.nodes[ndx]);
  const {stride, array} = getAccessorTypedArrayAndStride(gl, gltf, skin.inverseBindMatrices);
  return new Skin(joints, array);
});
```

Код выше вызвал `getAccessorTypedArrayAndStride` с индексом accessor. Нам нужно предоставить этот код. Для данного accessor мы вернем представление [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) правильного типа, чтобы получить доступ к данным в буфере.

```
const glTypeToTypedArrayMap = {
  '5120': Int8Array,    // gl.BYTE
  '5121': Uint8Array,   // gl.UNSIGNED_BYTE
  '5122': Int16Array,   // gl.SHORT
  '5123': Uint16Array,  // gl.UNSIGNED_SHORT
  '5124': Int32Array,   // gl.INT
  '5125': Uint32Array,  // gl.UNSIGNED_INT
  '5126': Float32Array, // gl.FLOAT
}

// Учитывая GL тип, возвращаем нужный TypedArray
function glTypeToTypedArray(type) {
  return glTypeToTypedArrayMap[type] || throwNoKey(type);
}

// учитывая индекс accessor, возвращаем и accessor, и
// TypedArray для правильной части буфера
function getAccessorTypedArrayAndStride(gl, gltf, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const TypedArray = glTypeToTypedArray(accessor.componentType);
  const buffer = gltf.buffers[bufferView.buffer];
  return {
    accessor,
    array: new TypedArray(
        buffer,
        bufferView.byteOffset + (accessor.byteOffset || 0),
        accessor.count * accessorTypeToNumComponents(accessor.type)),
    stride: bufferView.byteStride || 0,
  };
}
```

Что-то стоит отметить о коде выше - мы создали таблицу с жестко закодированными константами WebGL. Это первый раз, когда мы это делаем. Константы не изменятся, поэтому это безопасно делать.

Теперь, когда у нас есть скины, мы можем вернуться и добавить их к узлам, которые на них ссылались.

```
// Добавляем SkinRenderers к узлам со скинами
for (const {node, mesh, skinNdx} of skinNodes) {
  node.drawables.push(new SkinRenderer(mesh, gltf.skins[skinNdx]));
}
```

Если бы мы рендерили так, мы могли бы не увидеть никакой разницы. Нам нужно анимировать некоторые из узлов. Давайте просто пройдемся по каждому узлу в `Skin`, другими словами, каждый сустав, и повернем его плюс минус немного на локальной X оси.

Чтобы сделать это, мы сохраним оригинальную локальную матрицу для каждого сустава. Затем мы будем вращать эту оригинальную матрицу на некоторое количество каждый кадр, и используя специальную функцию, `m4.decompose`, мы конвертируем матрицу обратно в позицию, вращение, масштаб в сустав.

```
const origMatrix = new Map();
function animSkin(skin, a) {
  for(let i = 0; i < skin.joints.length; ++i) {
    const joint = skin.joints[i];
    // если нет сохраненной матрицы для этого сустава
    if (!origMatrix.has(joint)) {
      // сохраняем матрицу для сустава
      origMatrix.set(joint, joint.source.getMatrix());
    }
    // получаем оригинальную матрицу
    const origMatrix = origRotations.get(joint);
    // вращаем ее
    const m = m4.xRotate(origMatrix, a);
    // разлагаем обратно в позицию, вращение, масштаб
    // в сустав
    m4.decompose(m, joint.source.position, joint.source.rotation, joint.source.scale);
  }
}
```

и затем прямо перед рендерингом мы вызовем это

```
animSkin(gltf.skins[0], Math.sin(time) * .5);
```

Примечание: `animSkin` в основном хак. В идеале мы бы загрузили анимацию, которую создал какой-то художник, ИЛИ мы бы знали имена конкретных суставов, которыми мы хотим манипулировать в коде каким-то образом. В этом случае мы просто хотим увидеть, работает ли наш скининг, и это казалось самым легким способом сделать это.

{{{example url="../webgl-skinning-3d-gltf-skinned.html" }}}

Еще несколько заметок перед тем, как мы двинемся дальше

Когда я впервые попытался заставить это работать, как и с большинством программ, вещи не появлялись на экране.

Итак, первое, что я сделал, это пошел в конец скининг шейдера и добавил эту строку

```
  gl_Position = u_projection * u_view *  a_POSITION;
```

Во фрагментном шейдере я изменил его, чтобы просто рисовать сплошной цвет, добавив это в конце

```
outColor = vec4(1, 0, 0, 1);
```

Это убирает весь скининг и просто рисует меш в начале координат. Я настроил позицию камеры, пока у меня не было хорошего вида.

```
const cameraPosition = [5, 0, 5];
const target = [0, 0, 0];
```

Это показало силуэт кита-убийцы, поэтому я знал, что по крайней мере некоторые из данных работают.

<div class="webgl_center"><img src="resources/skinning-debug-01.png"></div>

Затем я сделал фрагментный шейдер, показывающий нормали

```
outColor = vec4(normalize(v_normal) * .5 + .5, 1);
```

Нормали идут от -1 до 1, поэтому `* .5 + .5` корректирует их от 0 до 1 для просмотра как цветов.

Вернувшись в вершинный шейдер, я просто передал нормаль через

```
v_normal = a_NORMAL;
```

Что дало мне вид, подобный этому

<div class="webgl_center"><img src="resources/skinning-debug-02.png"></div>

Я не ожидал, что нормали будут плохими, но было хорошо начать с чего-то, что я ожидал, что будет работать, и подтвердить, что это действительно работает.

Затем я подумал, что проверю веса. Все, что мне нужно было сделать, это
передать веса как нормали из вершинного шейдера

```
v_normal = a_WEIGHTS_0.xyz * 2. - 1.;
```

Веса идут от 0 до 1, но поскольку фрагментный шейдер ожидает нормали, я просто заставил веса идти от -1 до 1

Это изначально производило своего рода беспорядок цветов. Как только я выяснил ошибку, я получил изображение, подобное этому

<div class="webgl_center"><img src="resources/skinning-debug-03.png"></div>

Не совсем очевидно, что это правильно, но это имеет смысл. Вы бы ожидали, что вершины, ближайшие к каждой кости, имеют сильный цвет, и вы бы ожидали увидеть кольца этого цвета в вершинах вокруг кости, поскольку веса в этой области, вероятно, 1.0 или по крайней мере все похожие.

Поскольку оригинальное изображение было таким беспорядочным, я также попробовал отобразить индексы суставов с

```
v_normal = vec3(a_JOINTS_0.xyz) / float(textureSize(u_jointTexture, 0).y - 1) * 2. - 1.;
```

Индексы идут от 0 до numJoints - 1, поэтому код выше дал бы значения от -1 до 1.

Как только вещи заработали, я получил изображение, подобное этому

<div class="webgl_center"><img src="resources/skinning-debug-04.png"></div>

Снова это изначально было беспорядком цветов. Изображение выше - это то, как это выглядело после исправления. Это в значительной степени то, что вы бы ожидали увидеть для весов кита-убийцы. Кольца цвета вокруг каждой кости.

Ошибка была связана с тем, как `twgl.createBufferInfoFromArrays`, который я использовал вместо twgl, когда я начал делать этот пример, выяснял количество компонентов. Были случаи, когда он игнорировал указанный, пытался угадать, и угадывал неправильно. Как только ошибка была исправлена, я убрал эти изменения из шейдеров. Обратите внимание, что я оставил их в коде выше закомментированными, если вы хотите поиграть с ними.

Я хочу сделать ясным, что код выше предназначен для помощи в объяснении скиннинга. Он не предназначен для того, чтобы быть готовым к продакшену движком скиннинга. Я думаю, что если бы мы попытались сделать движок продакшен качества, мы столкнулись бы со многими вещами, которые мы, вероятно, захотели бы изменить, но я надеюсь, что прохождение через этот пример помогает немного демистифицировать скининг.
```