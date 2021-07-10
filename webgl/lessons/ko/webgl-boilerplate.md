Title: WebGL2 보일러플레이트(Boilerplate)
Description: 모든 WebGL 프로그램의 작성에 필요한 일부 코드
TOC: 보일러플레이트(Boilerplate)


이 글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다.
대부분의 WebGL 강의들은 모든걸 한 번에 다루기 때문에 배우기 복잡해 보이기도 합니다.
가능 가능한 한 그것을 피하기 위해 작은 단위로 나누려고 합니다.

WebGL을 복잡해 보이도록 만드는 것들 중 하나는 정점 셰이더와 프래그먼트 셰이더의 두 가지 작은 함수가 있다는 겁니다.
이 두 함수가 GPU에서 실행되기 때문에 빠른 계산이 가능합니다.
그러한 이유로 GPU가 해석할 수 있는 특수한 언어를 사용해 작성하는 것입니다.
이 두 함수는 컴파일되고 링크되어야 하는데, 이러한 처리는 모든 WebGL 프로그램에서 99% 동일합니다.

다음은 셰이더를 컴파일하는 보일러플레이트(boilerplate) 코드입니다.

    /**
     * 셰이더를 생성하고 컴파일합니다.
     *
     * @param {!WebGLRenderingContext} gl WebGL 컨텍스트
     * @param {string} shaderSource 셰이더의 GLSL 소스코드
     * @param {number} shaderType 셰이더의 타입, VERTEX_SHADER 또는 FRAGMENT_SHADER
     * @return {!WebGLShader} 셰이더
     */
    function compileShader(gl, shaderSource, shaderType) {
      // 셰이더 객체 생성
      var shader = gl.createShader(shaderType);

      // 셰이더 소스 코드 설정
      gl.shaderSource(shader, shaderSource);

      // 셰이더 컴파일
      gl.compileShader(shader);

      // 컴파일 여부 확인
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // 컴파일하는 동안 문제 발생. 오류를 얻어옴
        throw ("could not compile shader:" + gl.getShaderInfoLog(shader));
      }

      return shader;
    }

그리고 두 셰이더를 링크하여 프로그램으로 만드는 보일러플레이트 코드는 아래와 같습니다.

    /**
     * 두 셰이더로 프로그램을 생성합니다.
     *
     * @param {!WebGLRenderingContext) gl WebGL 컨텍스트
     * @param {!WebGLShader} vertexShader 정점 셰이더
     * @param {!WebGLShader} fragmentShader 프래그먼트 셰이더
     * @return {!WebGLProgram} 프로그램
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // 프로그램 생성
      var program = gl.createProgram();

      // 셰이더 부착(attach)
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // 프로그램 링크
      gl.linkProgram(program);

      // 링크 여부 확인
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
        // 링크하는 동안 문제 발생
        throw ("program failed to link:" + gl.getProgramInfoLog (program));
      }

      return program;
    };

물론 어떻게 오류를 처리할지는 여러분에게 달려 있습니다.
예외를 던지는(throw) 것이 오류를 처리하는 최고의 방법인 것은 아닙니다.
그럼에도 불구하고 거의 모든 WebGL 프로그램에서 이 코드는 거의 비슷합니다.

아래와 같은 멀티라인 템플릿 리터럴은 대부분의 모던 브라우저에서 지원됩니다.
이를 통해 셰이더를 저장하는 것이 제가 선호하는 방식입니다. 그냥 아래와 같이 셰이더 코드를 작성합니다.

    var vertexShaderSource = `#version 300 es

    in vec4 a_position;
    uniform mat4 u_matrix;

    void main() {
       gl_Position = u_matrix * a_position;
    }
    `;

이렇게 하면 셰이더의 수정이 쉬워집니다.
IE처럼 오래된 브라우저는 이러한 문법을 좋아하지 않지만 어차피 WebGL을 만들기 때문에 IE는 신경쓰지 않습니다.
IE 지원과 WebGL 지원 여부까지 고려한다면 [Babel](https://babeljs.io/)과 같은 라이브러리를 사용해 
빌드를 수행해 IE가 이해할 수 있는 코드로 변환할 겁니다.

전에는 저는 셰이더를 자바스크립트가 아닌 &lt;script&gt; 태그에 저장하는 것을 선호했습니다.
이 방식도 셰이더 수정이 쉽고, 이런 경우 아래 코드를 사용합니다.

    /**
     * 스크립트 태그의 내용으로 셰이더를 생성합니다.
     *
     * @param {!WebGLRenderingContext) gl WebGL 컨텍스트
     * @param {string} scriptId 스크립트 태그의 id
     * @param {string} opt_shaderType 생성할 셰이더의 타입.
     *                 전달되지 않으면 스크립트 태그의 타입 속성을 사용합니다.
     * @return {!WebGLShader} 셰이더
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // id로 스크립트 태그 탐색
      var shaderScript = document.getElementById(scriptId);
        
      if (!shaderScript) {
        throw("*** Error: unknown script element" + scriptId);
      }

      // 스크립트 태그의 컨텐츠 추출
      var shaderSource = shaderScript.text;

      // 타입을 넘기지 않으면, 스크립트 태그의 'type' 사용
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

이제 셰이더를 컴파일하려면 아래와 같이 하면 됩니다.

    var shader = compileShaderFromScript(gl, "someScriptTagId");

한 걸음 더 나아가서 스크립트 태그의 두 셰이더를 컴파일하고, 하나의 프로그램에 부착해 링킹을 수행하는 함수를 만들겁니다.

    /**
     * 두 개의 스크립트 태그로부터 프로그램을 생성합니다.
     *
     * @param {!WebGLRenderingContext} gl WebGL 컨텍스트
     * @param {string} vertexShaderId 정점 셰이더 스크립트 태그의 id
     * @param {string} fragmentShaderId 프래그먼트 셰이더 스크립트 태그의 id
     * @return {!WebGLProgram} 프로그램
     */
    function createProgramFromScripts(
        gl, vertexShaderId, fragmentShaderId) {
      var vertexShader = createShaderFromScriptTag(gl, vertexShaderId, gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScriptTag(gl, fragmentShaderId, gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

거의 모든 WebGL 프로그램에서 공통적으로 사용하는 다른 코드는 캔버스의 크기를 조정하는 코드입니다.
[여기](webgl-resizing-the-canvas.html)에서 해당 함수가 어떻게 구현되었는지 볼 수 있습니다.

모든 예제에서는 아래 라인을 통해 이 두 함수가 포함(include)되었습니다.

    <script src="resources/webgl-utils.js"></script>

그리고 아래와 같이 사용합니다.

    var program = webglUtils.createProgramFromScripts(gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

여러 줄의 동일한 코드로 복잡해시면
특정 예제가 설명하려는 내용을 전달하는 데 방해가 됩니다.

대부분의 예제에서 사용된 실제 보일러플레이트 API는 아래와 같습니다.

    /**
     * 2개의 소스로부터 프로그램을 생성합니다.
     *
     * @param {WebGLRenderingContext} gl 사용할 WebGLRenderingContext
     * @param {string[]} shaderSources 셰이더 소스코드의 배열.
     *        배열의 첫 번째 요소는 정점 셰이더이고, 두 번째는 프래그먼트 셰이더로 가정합니다.
     * @param {string[]} [opt_attribs] attribute 이름의 배열.
     *        따로 전달되지 않는다면 location은 인덱스로 할당됩니다.
     * @param {number[]} [opt_locations] attribute location의 배열.
     *        opt_attribs와 함께 전달되는 location 할당을 위한 배열.
     * @param {module:webgl-utils.ErrorCallback} opt_errorCallback 에러 콜백.
     *        기본적으로는 오류를 콘솔에 출력합니다.
     *        다른 방식의 동작을 원한다면 콜백을 전달할 수 있습니다.
     *        콜백은 오류 메시지를 전달 받습니다.
     * @return {WebGLProgram} 생성된 프로그램.
     * @memberOf module:webgl-utils
     */
    function createProgramFromSources(gl,
                                      shaderSources,
                                      opt_attribs,
                                      opt_locations,
                                      opt_errorCallback)

`shaderSources`는 GLSL 소스코드인 문자열의 배열입니다.
배열의 첫 번째 문자열은 정점 셰이더의 소스코드이고 두 번째 인자는 프래그먼트 셰이더의 소스코드 입니다.

여기까지가 최소한의 WebGL 보일러플레이드 코드입니다.
`webgl-utils.js` 코드는 [여기](../resources/webgl-utils.js)에서 보실 수 있습니다.
좀 더 정리된 것을 원하신다면 [TWGL.js](https://twgljs.org)를 확인해주세요.

WebGL을 복잡하게 보이게 만드는 다른 부분은 셰이더에 입력 데이터를 설정하는 부분입니다.
[작동 원리](webgl-how-it-works.html)를 봐주세요.

또한 [더 적은 코드로 즐겁게](webgl-less-code-more-fun.html)를 읽고 [TWGL](https://twgljs.org)를 확인해 보시길 바랍니다.

참고로 비슷한 목적으로 사용되는 몇 가지 스크립트가 더 있습니다.

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    이건 슬라이더를 드래그하면 그 값이 갱신되어 표시되는 슬라이더를 만드는 코드를 제공합니다.
    마찬가지로 이러한 코드가 파일을 복잡하게 만드는 것이 싫어서 한 곳에 모아뒀습니다.

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    이 스크립트는 webgl2fundmentals.org 이외의 곳에서는 필요하지 않습니다.
    live editor 내부에서 사용되어 화면에 에러 메세지 출력하는 걸 도와줍니다.

*   [`m3.js`](../resources/m3.js)

    2d 수학 함수 묶음입니다.
    행렬 수학에 대한 첫 글을 시작했을 때는 inline으로 만들기 시작했지만 
    결국 너무 길어져서 이후 예제에서는 이 스크립트를 포함하여 사용하고 있습니다.

*   [`m4.js`](../resources/m4.js)

    3d 수학 함수 묶음입니다.
    3d에 대한 첫 글을 시작했을 때는 inline으로 만들기 시작했지만 
    결국 너무 길어져서 3d에 관한 두 번째 글부터는 이 스크립트를 포함하여 사용하고 있습니다.

