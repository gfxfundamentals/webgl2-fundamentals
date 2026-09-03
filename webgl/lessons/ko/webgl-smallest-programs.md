Title: WebGL2 가장 작은 프로그램들
Description: WebGL2 가장 작은 프로그램들
TOC: WebGL2 가장 작은 프로그램들

이 글은 [기초](webgl-fundamentals.html)부터 시작하는 여러 글을 이미 읽었다고 가정합니다. 아직 읽지 않으셨다면 기초 문서부터 먼저 읽어보세요.

이 글을 어떤 카테고리로 분류해야 할지 고민이 많았는데, 여기에는 두 가지 목적이 있기 때문입니다.

1. 가장 작은 WebGL 프로그램을 보여주기 위함입니다.

   이러한 기법은 무언가를 테스트하거나, [스택 오버플로를 위한 MCVE(최소 완성 기능 예제)](https://meta.stackoverflow.com/questions/349789/how-do-i-create-a-minimal-complete-verifiable-example/349790#349790)를 작성하거나, 버그 범위를 좁히려 할 때 매우 유용합니다.

2. 틀에서 벗어난 사고방식을 배우기 위함입니다.

   단순히 흔히 쓰이는 패턴에 갇히지 않고 더 큰 그림을 볼 수 있도록 돕기 위해, 이와 관련된 글을 몇 편 더 작성하고자 합니다. [여기](webgl-drawing-without-data.html)도 그중 하나입니다.

## 화면 지우기만 수행하기

실제로 어떤 동작을 수행하는 가장 작은 WebGL 프로그램은 다음과 같습니다.

    const gl = document.querySelector('canvas').getContext('webgl2');
    gl.clearColor(1, 0, 0, 1); // 빨간색
    gl.clear(gl.COLOR_BUFFER_BIT);

이 프로그램이 하는 일이라곤 캔버스를 빨간색으로 지우는 것뿐이지만, 실제로 무언가를 수행하긴 했습니다.

자세히 생각해 보면, 단지 이것만으로도 몇 가지 항목을 테스트해 볼 수 있습니다. 예를 들어 [텍스처로 렌더링하기](webgl-render-to-texture.html)를 시도 중인데 제대로 동작하지 않는 상황이라고 가정해 봅시다. [해당 문서](webgl-render-to-texture.html)의 예제처럼 1개 이상의 3D 객체를 텍스처로 렌더링한 다음 그 결과를 큐브에 렌더링하고 있습니다.

그런데 화면에 아무것도 보이지 않습니다. 이때 간단한 테스트로 셰이더를 사용해 텍스처에 렌더링하는 것을 멈추고, 텍스처를 식별 가능한 특정 색상으로 지워보는 것입니다.

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferWithTexture);
    gl.clearColor(1, 0, 1, 1); // 마젠타색
    gl.clear(gl.COLOR_BUFFER_BIT);

이제 해당 프레임버퍼의 텍스처로 렌더링을 진행해 보세요. 큐브가 마젠타색으로 변합니까? 그렇지 않다면 문제는 텍스처로 렌더링하는 파트가 아니라 다른 곳에 있는 것입니다.

## `SCISSOR_TEST`와 `gl.clear` 활용하기

`SCISSOR_TEST`는 그리거나 지우는 작업을 캔버스(또는 현재 프레임버퍼)의 특정 직사각형 영역으로 클리핑합니다.

시저 테스트(scissor test)는 다음과 같이 활성화합니다.

    gl.enable(gl.SCISSOR_TEST);

그리고 좌측 하단 모서리를 기준으로 시저 사각형을 픽셀 단위로 설정합니다. 매개변수는 `gl.viewport`와 동일합니다.

    gl.scissor(x, y, width, height);

이를 활용하면 `SCISSOR_TEST`와 `gl.clear`만을 사용해 사각형들을 그릴 수 있습니다.

예제

    const gl = document.querySelector('#c').getContext('webgl2');

    gl.enable(gl.SCISSOR_TEST);

    function drawRect(x, y, width, height, color) {
        gl.scissor(x, y, width, height);
        gl.clearColor(...color);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    for (let i = 0; i < 100; ++i) {
        const x = rand(0, 300);
        const y = rand(0, 150);
        const width = rand(0, 300 - x);
        const height = rand(0, 150 - y);
        drawRect(x, y, width, height, [rand(1), rand(1), rand(1), 1]);
    }

    function rand(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.random() * (max - min) + min;
    }

{{{example url="../webgl-simple-scissor.html" }}}

이 방식 자체가 실무에서 엄청나게 유용하다고는 할 수 없지만, 알아두면 매우 유용한 기법입니다.

## 하나의 큰 `gl.POINTS` 사용하기

대부분의 예제에서 볼 수 있듯이, WebGL에서 가장 일반적인 작업은 버퍼를 만들고 정점 데이터를 채워 넣는 것입니다. 그런 다음 어트리뷰트(attribute)가 선언된 셰이더를 만들고, 해당 버퍼에서 데이터를 가져오도록 어트리뷰트를 설정합니다. 마지막으로 셰이더에서 사용할 유니폼(uniform)과 텍스처를 포함해 드로우 콜을 실행합니다.

하지만 때로는 그저 테스트만 해보고 싶을 때가 있습니다. 화면에 무언가 그려지는지 단순히 확인하고 싶다고 가정해 봅시다.

다음 셰이더 코드를 살펴봅시다.

    #version 300 es
    // 정점 셰이더
    void main() {
        gl_Position = vec4(0, 0, 0, 1); // 중심
        gl_PointSize = 120.0;
    }

<!---->

    #version 300 es
    // 프래그먼트 셰이더
    precision highp float;

    out vec4 outColor;

    void main() {
        outColor = vec4(1, 0, 0, 1); // 빨간색
    }

그리고 이를 실행하는 코드입니다.

    // GLSL 프로그램 설정
    const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

    gl.useProgram(program);

    const offset = 0;
    const count = 1;
    gl.drawArrays(gl.POINTS, offset, count);

생성해야 할 버퍼도 없고 설정할 유니폼도 없지만, 캔버스 한가운데에 하나의 점을 그릴 수 있습니다.

{{{example url="../webgl-simple-point.html" }}}

`gl.POINTS`에 관하여: `gl.drawArrays`에 `gl.POINTS`를 전달할 때는 정점 셰이더에서 `gl_PointSize`를 픽셀 단위 크기로 반드시 설정해야 합니다. 이때 GPU/드라이버마다 지원하는 최대 포인트 크기가 다르다는 점에 주의해야 합니다. 최대 크기는 다음과 같이 조회할 수 있습니다.

    const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

WebGL 명세상 요구되는 최댓값은 1.0에 불과하지만, 다행히도 [거의 모든 GPU와 드라이버가 훨씬 더 큰 크기를 지원합니다.](https://web3dsurvey.com/webgl/parameters/ALIASED_POINT_SIZE_RANGE)

`gl_PointSize`를 설정하면 정점 셰이더가 종료될 때 `gl_Position`에 지정한 값이 화면/캔버스 공간의 픽셀 단위로 변환되고, 해당 위치를 중심으로 사방으로 +/- gl_PointSize / 2 크기의 정사각형이 생성됩니다.

"점 하나 그리는 게 뭐가 대수냐"라고 생각할 수 있습니다.

하지만 점은 자동으로 [텍스처 좌표](webgl-3d-textures.html)를 무료로 얻습니다. 프래그먼트 셰이더 내에서 특수 변수인 `gl_PointCoord`를 통해 이 좌표에 접근할 수 있습니다. 이 점에 텍스처를 한 번 그려봅시다.

먼저 프래그먼트 셰이더를 수정해 보겠습니다.

    #version 300 es
    // 프래그먼트 셰이더
    precision highp float;

    +uniform sampler tex;

    out vec4 outColor;

    void main() {
        - outColor = vec4(1, 0, 0, 1);  // 빨간색
        + outColor = texture(tex, gl_PointCoord.xy);
    }

이제 단순함을 유지하기 위해, [데이터 텍스처 관련 글](webgl-data-textures.html)에서 다루었던 것처럼 원시 데이터로 텍스처를 만듭시다.

    // 2x2 픽셀 데이터
    const pixels = new Uint8Array([
        0xFF, 0x00, 0x00, 0xFF, // 빨간색
        0x00, 0xFF, 0x00, 0xFF, // 초록색
        0x00, 0x00, 0xFF, 0xFF, // 파란색
        0xFF, 0x00, 0xFF, 0xFF, // 마젠타색
    ]);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,                // 레벨
        gl.RGBA,          // 내부 포맷
        2,                // 너비
        2,                // 높이
        0,                // 테두리
        gl.RGBA,          // 포맷
        gl.UNSIGNED_BYTE, // 타입
        pixels,           // 데이터
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

WebGL은 기본적으로 텍스처 유닛 0을 사용하도록 되어 있고 유니폼 기본값도 0이므로, 추가로 설정할 것이 전혀 없습니다.

{{{example url="../webgl-simple-point-w-texture.html" }}}

이 방식은 텍스처 관련 문제를 디버깅할 때 아주 유용합니다. 여전히 버퍼나 어트리뷰트를 일절 사용하지 않으며 유니폼을 조회하고 설정할 필요조차 없습니다. 예를 들어 이미지를 로드했는데 화면에 나타나지 않는 상황을 가정해 봅시다. 위 셰이더를 사용해 보면 해당 포인트에 이미지가 제대로 표시될까요? 텍스처에 렌더링한 후 그 텍스처의 내용을 확인하고 싶을 때, 보통은 버퍼와 어트리뷰트를 통해 기하체(geometry)를 구성해야 하지만, 단순히 이 단일 점 위에 띄우는 것만으로도 텍스처를 렌더링할 수 있습니다.

## 여러 개의 단일 `POINTS` 사용하기

위 예제를 약간 변형해 보겠습니다. 정점 셰이더를 다음과 같이 변경합니다.

    #version 300 es
    // 정점 셰이더

    +in vec4 position;

    void main() {
        -gl_Position = vec4(0, 0, 0, 1);
        +gl_Position = position;
        gl_PointSize = 120.0;
    }

어트리뷰트의 기본값은 `0, 0, 0, 1`이므로 이 변경 사항만으로는 이전 예제가 그대로 동작합니다. 하지만 이제 원하는 대로 위치를 직접 설정할 수 있는 유연성이 생깁니다.

    +const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
    const positionLoc = gl.getAttribLocation(program, 'position');

    // ...

    +const numPoints = 5;
    +for (let i = 0; i < numPoints; ++i) {
    +   const u = i / (numPoints - 1); // 0 ~ 1
    +   const clipspace = u * 1.6 - 0.8; // -0.8 ~ +0.8
    +   gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

    *   const offset = 0;
    *   const count = 1;
    *   gl.drawArrays(gl.POINTS, offset, count);
    +}

실행하기 전에 점의 크기를 좀 더 줄여보겠습니다.

    // 정점 셰이더

    in vec4 position;

    void main() {
        gl_Position = position;

    -   gl_PointSize = 120.0;
    +   gl_PointSize = 20.0;
    }

그리고 점의 색상을 직접 지정할 수 있도록 수정합니다. (참고: 텍스처가 없는 코드로 되돌렸습니다.)

    precision highp float;

    +uniform vec4 color;

    out vec4 outColor;

    void main() {
    -   outColor = vec4(1, 0, 0, 1);   // 빨간색
    +   outColor = color;
    }

색상 위치를 조회하고,

    // GLSL 프로그램 설정
    const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
    const positionLoc = gl.getAttribLocation(program, 'position');
    +const colorLoc = gl.getUniformLocation(program, 'color');

이를 사용합니다.

    gl.useProgram(program);

    const numPoints = 5;
    for (let i = 0; i < numPoints; ++i) {
        const u = i / (numPoints - 1); // 0 ~ 1
        const clipspace = u * 1.6 - 0.8; // -0.8 ~ +0.8
        gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

    +   gl.uniform4f(colorLoc, u, 0, 1 - u, 1);

        const offset = 0;
        const count = 1;
        gl.drawArrays(gl.POINTS, offset, count);
    }

이제 버퍼나 어트리뷰트를 설정하지 않고도 각각의 색상을 가진 5개의 점을 화면에 렌더링할 수 있습니다.

{{{example url="../webgl-simple-points.html" }}}

물론 이것이 WebGL에서 많은 점을 그리는 **올바른 방식은 아닙니다.** 점을 대량으로 그리려면 각 점의 위치와 색상을 어트리뷰트로 구성하고 단일 드로우 콜로 모든 점을 한 번에 그려야 합니다.

**하지만** 테스트나 디버깅, [MCVE](https://meta.stackoverflow.com/questions/349789/how-do-i-create-a-minimal-complete-verifiable-example/349790#349790)를 작성할 때는 코드를 **최소화할 수 있는** 훌륭한 방법입니다. 또 다른 예로 후처리 효과(post-processing)를 위해 텍스처에 렌더링하고 이를 시각적으로 확인하고 싶을 때, 이 예제와 이전의 텍스처 예제를 조합하여 각각 큰 점 하나로 표시해 볼 수 있습니다. 버퍼와 어트리뷰트를 다루는 복잡한 과정이 필요 없으므로 디버깅에 매우 이상적입니다.
