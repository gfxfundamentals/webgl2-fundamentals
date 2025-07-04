Title: WebGL2 Boilerplate
Description: Часть кода, которая нужна для всех WebGL программ
TOC: Boilerplate


Это продолжение статьи [WebGL Fundamentals](webgl-fundamentals.html).
WebGL иногда кажется сложным для изучения, потому что большинство уроков
охватывают все сразу. Я постараюсь избежать этого где возможно
и разбить на более мелкие части.

Одна из вещей, которая делает WebGL сложным, это то, что у вас есть эти 2
крошечные функции - вершинный шейдер и фрагментный шейдер. Эти две
функции выполняются на вашем GPU, откуда и берется вся скорость.
Поэтому они написаны на специальном языке, языке, который
соответствует тому, что может делать GPU. Эти 2 функции нужно скомпилировать и
связать. Этот процесс в 99% случаев одинаков во всех WebGL
программах.

Вот boilerplate код для компиляции шейдера.

    /**
     * Создает и компилирует шейдер.
     *
     * @param {!WebGLRenderingContext} gl WebGL контекст.
     * @param {string} shaderSource GLSL исходный код для шейдера.
     * @param {number} shaderType Тип шейдера, VERTEX_SHADER или
     *     FRAGMENT_SHADER.
     * @return {!WebGLShader} Шейдер.
     */
    function compileShader(gl, shaderSource, shaderType) {
      // Создаем объект шейдера
      var shader = gl.createShader(shaderType);

      // Устанавливаем исходный код шейдера.
      gl.shaderSource(shader, shaderSource);

      // Компилируем шейдер
      gl.compileShader(shader);

      // Проверяем, скомпилировался ли он
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // Что-то пошло не так во время компиляции; получаем ошибку
        throw ("could not compile shader:" + gl.getShaderInfoLog(shader));
      }

      return shader;
    }

И boilerplate код для связывания 2 шейдеров в программу

    /**
     * Создает программу из 2 шейдеров.
     *
     * @param {!WebGLRenderingContext) gl WebGL контекст.
     * @param {!WebGLShader} vertexShader Вершинный шейдер.
     * @param {!WebGLShader} fragmentShader Фрагментный шейдер.
     * @return {!WebGLProgram} Программа.
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // создаем программу.
      var program = gl.createProgram();

      // прикрепляем шейдеры.
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // связываем программу.
      gl.linkProgram(program);

      // Проверяем, связалась ли она.
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
          // что-то пошло не так со связыванием; получаем ошибку
          throw ("program failed to link:" + gl.getProgramInfoLog(program));
      }

      return program;
    };

Конечно, то, как вы решите обрабатывать ошибки, может быть другим. Выбрасывание
исключений может быть не лучшим способом обработки. Тем не менее, эти несколько
строк кода практически одинаковы почти во всех WebGL программах.

Теперь, когда многострочные шаблонные литералы поддерживаются во всех современных браузерах,
это мой предпочтительный способ хранения шейдеров. Я могу просто сделать что-то вроде

    var vertexShaderSource = `#version 300 es

    in vec4 a_position;
    uniform mat4 u_matrix;

    void main() {
       gl_Position = u_matrix * a_position;
    }
    `;

И иметь легко редактируемый шейдер. Некоторые старые браузеры, как IE, не понравится
это, но во-первых, я использую WebGL, поэтому мне все равно на IE. Если бы я
заботился и имел fallback без WebGL, я бы использовал какой-то этап сборки с чем-то вроде
[Babel](https://babeljs.io/) для преобразования кода выше во что-то, что IE
понимает.

В прошлом мне нравилось хранить мои шейдеры в не-javascript &lt;script&gt; тегах.
Это также делает их легкими для редактирования, поэтому я бы использовал код вроде этого.

    /**
     * Создает шейдер из содержимого тега script.
     *
     * @param {!WebGLRenderingContext} gl WebGL контекст.
     * @param {string} scriptId id тега script.
     * @param {string} opt_shaderType. Тип шейдера для создания.
     *     Если не передан, будет использован атрибут type из
     *     тега script.
     * @return {!WebGLShader} Шейдер.
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // ищем тег script по id.
      var shaderScript = document.getElementById(scriptId);
      if (!shaderScript) {
        throw("*** Error: unknown script element" + scriptId);
      }

      // извлекаем содержимое тега script.
      var shaderSource = shaderScript.text;

      // Если мы не передали тип, используем 'type' из
      // тега script.
      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          opt_shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          opt_shaderType = gl.FRAGMENT_SHADER;
        } else if (!opt_shaderType) {
          throw("*** Error: shader type not set");
        }
      }

      return compileShader(gl, shaderSource, opt_shaderType);
    };

Теперь для компиляции шейдера я могу просто сделать

    var shader = compileShaderFromScript(gl, "someScriptTagId");

Я обычно иду на шаг дальше и делаю функцию для компиляции двух шейдеров
из тегов script, прикрепляю их к программе и связываю их.

    /**
     * Создает программу из 2 тегов script.
     *
     * @param {!WebGLRenderingContext} gl WebGL контекст.
     * @param {string} vertexShaderId id вершинного шейдера тега script.
     * @param {string} fragmentShaderId id фрагментного шейдера тега script.
     * @return {!WebGLProgram} Программа
     */
    function createProgramFromScripts(
        gl, vertexShaderId, fragmentShaderId) {
      var vertexShader = createShaderFromScriptTag(gl, vertexShaderId, gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScriptTag(gl, fragmentShaderId, gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

Другая часть кода, которую я использую почти в каждой WebGL программе - это что-то для
изменения размера canvas. Вы можете увидеть [как эта функция реализована здесь](webgl-resizing-the-canvas.html).

В случае всех образцов эти 2 функции включены с помощью

    <script src="resources/webgl-utils.js"></script>

и используются так

    var program = webglUtils.createProgramFromScripts(
      gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

Кажется лучшим не засорять все образцы многими строками одного и того же кода,
так как они просто мешают тому, о чем этот конкретный пример.

Фактический boilerplate API, используемый в большинстве этих образцов

    /**
     * Создает программу из 2 источников.
     *
     * @param {WebGLRenderingContext} gl WebGLRenderingContext
     *        для использования.
     * @param {string[]} shaderSources Массив источников для
     *        шейдеров. Первый предполагается вершинным шейдером,
     *        второй фрагментным шейдером.
     * @param {string[]} [opt_attribs] Массив имен атрибутов.
     *        Локации будут назначены по индексу, если не переданы
     * @param {number[]} [opt_locations] Локации для атрибутов.
     *        Параллельный массив к opt_attribs, позволяющий назначить локации.
     * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback для ошибок.
     *        По умолчанию просто выводит ошибку в консоль
     *        при ошибке. Если вы хотите что-то другое, передайте callback.
     *        Ему передается сообщение об ошибке.
     * @return {WebGLProgram} Созданная программа.
     * @memberOf module:webgl-utils
     */
    function createProgramFromSources(gl,
                                      shaderSources,
                                      opt_attribs,
                                      opt_locations,
                                      opt_errorCallback)

где `shaderSources` - это массив строк, содержащий GLSL исходный код.
Первая строка в массиве - это исходный код вершинного шейдера. Вторая - это
исходный код фрагментного шейдера.

Это большая часть моего минимального набора WebGL boilerplate кода.
[Вы можете найти код `webgl-utils.js` здесь](../resources/webgl-utils.js).
Если вы хотите что-то немного более организованное, проверьте [TWGL.js](https://twgljs.org).

Остальное, что делает WebGL сложным - это настройка всех входов
для ваших шейдеров. Смотрите [как это работает](webgl-how-it-works.html).

Я также предлагаю вам прочитать о [меньше кода больше веселья](webgl-less-code-more-fun.html) и проверить [TWGL](https://twgljs.org).

Примечание, пока мы об этом, есть еще несколько скриптов по аналогичным причинам

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    Это предоставляет код для настройки слайдеров, которые имеют видимое значение, которое обновляется при перетаскивании слайдера.
    Снова я не хотел засорять все файлы этим кодом, поэтому он в одном месте.

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    Этот скрипт не нужен, кроме как на webgl2fundamentals.org. Он помогает выводить сообщения об ошибках на
    экран при использовании внутри live editor среди других вещей.

*   [`m3.js`](../resources/m3.js)

    Это куча 2d математических функций. Они создаются, начиная с первой статьи о
    матричной математике, и когда они создаются, они встроены, но в конце концов их слишком много для засорения,
    поэтому после нескольких примеров они используются путем включения этого скрипта.

*   [`m4.js`](../resources/m4.js)

    Это куча 3d математических функций. Они создаются, начиная с первой статьи о 3d
    и когда они создаются, они встроены, но в конце концов их слишком много для засорения, поэтому после
    второй статьи о 3d они используются путем включения этого скрипта. 