Title: WebGLFundamentals.org과 다른 점
Description: WebGLFundamentals.org과 WebGL2Fundamentals.org의 차이점
TOC: WebGLFundamentals.org과 WebGL2Fundamentals.org의 차이점


전에 [webglfundamentals.org](https://webglfundamentals.org)를 읽어보셨다면,
아셔야 할 몇 가지 다른 점이 있습니다.

## 템플릿 리터럴

webglfundamentals.org 에서는 거의 모든 코드들이 javascript가 아닌 `<script>`에 적혔습니다.

    <script id="vertexshader" type="not-js">;
    shader
    goes
    here
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

webgl2fundamentals.org 에서는 이것을 템플릿 리터럴(template literals)을 사용하도록 변경했습니다.

    var vertexShaderSource = `
    shader
    goes
    here
    `;

템플릿 리터럴(template literals)은 WebGL과 호환되는 모든 브라우저에서 지원됩니다 (인터넷 익스프로러 11버전은 제외). 만약에 IE11에서 돌아가야 한다면, [babel](https://babeljs.io)와 같은 트랜스파일러를 사용하셔야 합니다.

## 셰이더의 버전은 전부 GLSL 300 es

모든 셰이더의 버전을 GLSL 300 es로 바꿨습니다. I figured what's the point
of using WebGL2 if you're not going to use WebGL2 shaders.

## 모든 예제에서 Vertex Array Objects를 씁니다

WebGL1에서는 Vertex Array Objects가 선택적인 기능이었지만, WebGL2에서는 표준 기능이 되었습니다. [제 생각에 이건 모든 곳에서 쓰일 겁니다](webgl1-to-webgl2.html#Vertex-Array-Objects).
실제로 webglfundamentals.org로 돌아가서 전부 다 [polyfill을 쓰게](https://github.com/greggman/oes-vertex-array-object-polyfill) 바꾸고 싶지만, 일부분은 그렇게 하기 어렵습니다.
얘기할 필요도 없이, 코드도 더 쉬워지고, 코드 크기도 더 줄어들고, 모든 케이스에서 더 효율적으로 됩니다.

## 그 외 변경들

*  가장 일반적인 패턴을 보여주기 위해서, 많은 샘플들을 재구성해봤습니다.

   예를 들면, 대부분의 예시들이 blending, culling, depth testing 같은 전역 WebGL 상태를 렌더 루프(render loop)에서 설정합니다. 설정이 여러 번 바뀔 수도 있기 때문입니다. 반면, webglfundamentals.org에서는 초기화 과정에서만 필요했기 때문에 한 번만 설정했는데, 그건 일반적이지 않은 패턴이죠.

*  모든 샘플에 뷰 포트(viewport)를 설정했습니다.

   webglfundamentals.org의 샘플에는 별로 필요하지 않아서 그대로 두었습니다. 하지만 실무에서는 설정이 필요하죠.

*  jquery를 안 씁니다.

   당시에는, `<input type="range">`가 지원되지 않아서였는데, 이제는 모든 곳에서
   지원하기 때문에 더 이상 jquery를 사용하지 않습니다.

*  모든 헬퍼 함수들(helper functions)에 접두사를 붙였습니다.

   아래와 같았던 코드들이

       var program = createProgramFromScripts(...)

   이제는 이렇게 바뀌었습니다.

       webglUtils.createProgramFromSources(...);

   무슨 함수인지, 어디에 있는 함수인지 명확하게 알 수 있으면 좋겠습니다.



