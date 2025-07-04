Title: Отличия от WebGLFundamentals.org
Description: Различия между WebGLFundamentals.org и WebGL2Fundamentals.org
TOC: Отличия от WebGLFundamentals.org до WebGL2Fundamentals.org

Если вы ранее читали [webglfundamentals.org](https://webglfundamentals.org),
есть некоторые различия, о которых стоит знать.

## Многострочные шаблонные литералы

На webglfundamentals.org почти все скрипты хранятся
в не-javascript тегах `<script>`.

    <script id="vertexshader" type="not-js">;
    шейдер
    здесь
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

На webgl2fundamentals.org я перешёл на использование
многострочных шаблонных литералов.

    var vertexShaderSource = `
    шейдер
    здесь
    `;

Многострочные шаблонные литералы поддерживаются во всех браузерах с WebGL,
кроме IE11. Если нужно поддерживать IE11, рассмотрите использование
транспайлера типа [babel](https://babeljs.io).

## Все шейдеры используют версию GLSL 300 es

Я перевёл все шейдеры на GLSL 300 es. Я подумал, в чём смысл
использовать WebGL2, если не использовать шейдеры WebGL2.

## Все примеры используют Vertex Array Objects

Vertex Array Objects — это опциональная функция в WebGL1, но
стандартная функция WebGL2. [Я думаю, их следует использовать везде](webgl1-to-webgl2.html#Vertex-Array-Objects).
Фактически я почти думаю, что стоит вернуться
к webglfundamentals.org и использовать их везде [с помощью
полифилла](https://github.com/greggman/oes-vertex-array-object-polyfill)
для тех немногих мест, где они недоступны. Аргументированно нулевой
недостаток, а ваш код становится проще и эффективнее почти
во всех случаях.

## Другие мелкие изменения

*  Я попытался немного переструктурировать многие примеры, чтобы показать наиболее распространённые паттерны.

   Например, большинство приложений обычно устанавливают глобальное состояние WebGL типа blending, culling и depth testing
   в их рендер-цикле, поскольку эти настройки часто меняются несколько раз, тогда как на
   webglfundamentals.org я устанавливал их при инициализации, потому что они нужны были
   только один раз, но это не распространённый паттерн.

*  Я устанавливаю viewport во всех примерах

   Я пропускал это на webglfundamentals.org, потому что примеры
   не нуждаются в этом, но это нужно почти во всём реальном коде.

*  Я убрал jquery.

   Когда я начинал, `<input type="range">` возможно ещё не был широко
   поддерживаем, но теперь поддерживается везде.

*  Я сделал префикс для всех вспомогательных функций

   Код типа

       var program = createProgramFromScripts(...)

   теперь

       webglUtils.createProgramFromSources(...);

   Я надеюсь, это делает более ясным, что это за функции
   и где их найти. 