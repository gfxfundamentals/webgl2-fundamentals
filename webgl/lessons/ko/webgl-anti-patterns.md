Title: WebGL2 안티패턴
Description: WebGL에서 하지 말아야 할 것과, 하지 말아야 하는 이유, 그리고 그 대신에 해야 할 것
TOC: 안티패턴


이건 WebGL의 안티패턴 목록입니다.
안티패턴은 하지 말아야 할 것들입니다.

1.  <a id="viewportwidth"></a>`WebGLRenderingContext`에 `viewportWidth` 및 `viewportHeight` 값 설정

    일부 코드는 뷰포트 너비와 높이에 대한 속성을 추가하고 이를 `WebGLRenderingContext`에 다음과 같이 추가합니다.

        gl = canvas.getContext("webgl2");
        gl.viewportWidth = canvas.width;    // 나쁨!!!
        gl.viewportHeight = canvas.height;  // 나쁨!!!

    그리고 아래와 같이 호출하는 경우가 있습니다.

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    **나쁜 이유:**

    이제 캔버스의 크기를 바꿀 때마다 2개의 속성을 갱신해줘야 하기 때문에 객관적으로 좋지 않습니다.
    예를 들어 사용자가 창의 크기를 조정할 때 캔버스의 크기를 바꾼다면 `gl.viewportWidth`와 `gl.viewportHeight`는 값을 다시 설정해주기 전까지는 잘못된 값을 갖고있게 됩니다.

    어느 새로운 프로그래머가 코드를 훑어보고 `gl.viewportWidth`와 `gl.viewportHeight`를 WebGL 명세서의 일부라고 
    몇개월동안 오해할 수도 있기 때문에 주관적으로도 나쁘다고 생각합니다.

    **대신 할 일:**

    왜 괜히 일을 복잡하게 만들어야 할까요?
    WebGL 컨텍스트는 해당 컨텍스트가 적용될 캔버스의 참조를 가지고 있으며 그 캔버스는 크기를 갖고 있습니다.

    <pre class="prettyprint">
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    </pre>

    컨텍스트 자체도 너비와 높이를 가지고 있습니다.

        // 뷰포트를 캔버스 drawingBuffer의 크기와 일치하도록 해야 할 때는
        // 아래 코드가 항상 올바른 결과를 냅니다.
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    위 코드가 극단적인 경우도 처리할 수 있는 반면 `gl.canvas.width`와 `gl.canvas.height`를 사용하는 코드는 그렇지 않습니다.
    그 이유는 [여기](#drawingbuffer)를 보시면 됩니다.

2.  <a id="canvaswidth"></a>종횡비에 `canvas.width` 및 `canvas.height` 사용

    종종 코드에 이런식으로 종횡비에 대해 `canvas.width`와 `canvas.height`를 사용하는 경우가 있습니다.

        var aspect = canvas.width / canvas.height;
        perspective(fieldOfView, aspect, zNear, zFar);

    **나쁜 이유:**

    캔버스의 너비와 높이는 캔버스가 표시되는 크기와 관련이 없습니다.
    CSS가 캔버스의 표시되는 크기를 결정합니다.

    **대신 할 일:**

    `canvas.clientWidth`와 `canvas.clientHeight`를 사용하십시오.
    이 값들이 캔버스가 실제로 화면에 표시되는 크기를 알려줍니다.
    이 값들을 사용하면 CSS 설정에 관계없이 항상 올바른 종횡비를 얻을 수 있습니다.

        var aspect = canvas.clientWidth / canvas.clientHeight;
        perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    다음 예제들은 drawingbuffer 크기(`width="400" height="300"`)를 모두 동일하지만 
    CSS를 사용하여 브라우저에는 다른 크기로 캔버스를 표시하도록 만든 예제입니다.
    두 예제 모두 올바른 종횡비로 'F'를 표시한다는 점에 주목하세요.

    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="400" height="150" }}}

    `canvas.width`와 `canvas.height`를 사용했다면 그렇지 않을 겁니다.

    {{{diagram url="../webgl-canvas-width-height.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-width-height.html" width="400" height="150" }}}

3.  <a id="innerwidth"></a>`window.innerWidth`와 `window.innerHeight`를 무언가를 계산하는 데 사용

    많은 WebGL 프로그램 여러 곳에서 `window.innerWidth`와 `window.innerHeight`를 사용하곤 합니다.
    예를 들어:

        canvas.width = window.innerWidth;                    // 나쁨!!
        canvas.height = window.innerHeight;                  // 나쁨!!

    **나쁜 이유:**

    포터블하지 않습니다.
    캔버스가 화면 전체를 채우는 WebGL 페이지에서는 문제가 없을 수 있습니다.
    그렇지 않은 경우엔 문제가 발생합니다.
    이 튜토리얼과 같은 글을 만들기로 한 경우라면 캔버스는 큰 페이지 안에 있는 작은 다이어그램일 뿐입니다.
    또는 옆에 속성 편집기나 게임을 위한 점수판이 필수할 수도 있습니다.
    물론 이런 경우를 처리하도록 코드를 수정할 수도 있지만 처음부터 이러한 경우에 대해서도 제대로 동작하도록 작성하는게 더 좋지 않을까요?
    그러면 새로운 프로젝트에 코드를 복사하거나 기존 프로젝트를 다시 작성할 때 코드를 변경하지 않아도 될 겁니다.

    **대신 할 일:**

    웹 플랫폼과 싸우는 대신, 설계된 대로 웹 플랫폼을 사용하세요.
    CSS와 `clientWidth`, `clientHeight`를 사용하세요.

        var width = gl.canvas.clientWidth;
        var height = gl.canvas.clientHeight;

        gl.canvas.width = width;
        gl.canvas.height = height;

    여기 9가지 경우가 있습니다.
    모두 똑같은 코드를 사용하고 있습니다.
    어떤 코드도 `window.innerWidth`나 `window.innerHeight`를 참조하지 않는다는 점에 주목하세요.

    <a href="../webgl-same-code-canvas-fullscreen.html" target="_blank">CSS를 사용한 전체 화면 캔버스만 있는 페이지</a>

    <a href="../webgl-same-code-canvas-partscreen.html" target="_blank">캔버스가 너비의 70%만 차지하고 편집기를 위한 공간이 별도로 있는 페이지</a>

    <a href="../webgl-same-code-canvas-embedded.html" target="_blank">단락 중간에 캔버스가 포함된 페이지</a>

    <a href="../webgl-same-code-canvas-embedded-border-box.html" target="_blank"><code>box-sizing: border-box;</code>를 사용하여 단락 중간에 캔버스가 포함된 페이지</a>

    <code>box-sizing: border-box;</code>는 border와 padding이 외부가 아닌 정의된 요소의 공간을 차지하도록 합니다.
    다시 말해 `box-sizing: normal` 모드에서 15픽셀 border를 가진 400x300 픽셀 크기의 요소는 15픽셀 너비의 border에 둘러싸인 400x300 픽셀 컨텐츠 공간을 가지며 따라서 전체 크기는 430x330px이 됩니다.
    `box-sizing: border-box` 모드에서는 border가 내부로 들어가므로, 동일한 요소가 400x300 픽셀 크기를 유지하며 컨텐츠 공간은 370x270이 됩니다.
    이것이 `clientWidth`와 `clientHeight`를 사용하는 또 다른 중요한 이유입니다.
    border를 `1em`으로 설정하면 캔버스의 크기를 알아낼 방법이 없습니다.
    다른 컴퓨터 혹은 다른 브라우저의 다른 글꼴에 따라 달라질 수도 있습니다.

    <a href="../webgl-same-code-container-fullscreen.html" target="_blank">CSS를 사용하여 전체 화면으로 표시할 컨테이너와 그 곳에 캔버스를 삽입할 코드만 있는 페이지</a>

    <a href="../webgl-same-code-container-partscreen.html" target="_blank">화면의 70% 너비를 차지할 컨테이너만 있어서 캔버스를 삽입할 코드와 편집기 공간이 있는 페이지</a>

    <a href="../webgl-same-code-container-embedded.html" target="_blank">단락에 캔버스를 삽입할 컨테이너와 그 곳에 캔버스를 삽입할 코드만 있는 페이지</a>

    <a href="../webgl-same-code-container-embedded-border-box.html" target="_blank"><code>box-sizing: border-box;</code>를 사용하여 단락에 컨테이너를 삽입하고 그 곳에 팬버스를 삽입할 코드만 있는 페이지</a>

    <a href="../webgl-same-code-body-only-fullscreen.html" target="_blank">전체 화면으로 표시할 CSS 요소가 없고 코드로 캔버스를 삽입하는 페이지</a>

    다시 말하지만 요점은, 웹을 받아들이고 위의 기술들을 사용하여 코드를 작성한다면 다른 방식으로 사용할 때에도 코드를 수정할 필요가 없게 된다는 것입니다.

4.  <a id="resize"></a>캔버스 크기 변경을 위해 `'resize'` 이벤트 사용

    일부 앱은 캔버스의 크기 조정을 위해 다음과 같은 윈도우 `'resize'` 이벤트를 확인합니다.

        window.addEventListener('resize', resizeTheCanvas);

    또는 아래와 같이요.

        window.onresize = resizeTheCanvas;

    **나쁜 이유:**

    그 자체로 나쁘진 않지만, *대부분*의 WebGL 프로그램을 고려하면 사용에 적합하지는 않습니다.
    특히 `'resize'`는 윈도우의 크기가 바뀔 때만 동작합니다. 어떠한 이유로 캔버스의 크기가 바뀔 때는 동작하지 않습니다.
    예를 들어 3D 에디터를 만들고 있다고 가정해 봅시다. 캔버스는 왼쪽에 있고 설정 창은 오른쪽에 있습니다.
    두 부분을 분리하는 드래그할 수 있는 바가 있도록 만들었고 바를 드래그하여 설정 창을 크거나 작게 만들 수 있습니다.
    이 경우 `'resize'` 이벤트가 발생하지 않습니다.
    마찬가지로 다른 컨텐츠가 추가되거나 제거되는 페이지가 있고 브라우저가 레이아웃을 변경함에 따라 캔버스의 크기가 변한다면 resize 이벤트가 발생하지 않습니다.

    **대신 할 일:**

    안티패턴에 대한 위의 여러 해결법과 마찬가지로 대부분의 경우에 작동하도록 코드를 작성할 수 있습니다.
    모든 프레임을 끊임없이 그리는 WebGL 앱의 경우 해결법은 다음과 같이 매번 크기 조정이 필요한지 확인하는 겁니다.

        function resizeCanvasToDisplaySize() {
          var width = gl.canvas.clientWidth;
          var height = gl.canvas.clientHeight;
          if (gl.canvas.width != width ||
              gl.canvas.height != height) {
             gl.canvas.width = width;
             gl.canvas.height = height;
          }
        }

        function render() {
           resizeCanvasToDisplaySize();
           drawStuff();
           requestAnimationFrame(render);
        }
        render();

    이제 위와 같은 경우에도 캔버스가 올바른 크기로 조정됩니다.
    다른 경우를 고려하려 코드를 바꿀 필요가 없습니다.
    예시로 위의 #3에서 동일한 코드를 사용하여 에디터 부분의 크기 변경이 가능하도록 한 코드입니다.

    {{{example url="../webgl-same-code-resize.html" }}}

    위와 같은 경우나 페이지에 있는 다른 동적 요소의 크기에 따라 캔버스의 크기가 바뀌는 다른 경우에도 resize 이벤트는 필요하지 않습니다.

    모든 프레임을 다시 그리지 않는 WebGL 앱의 경우에도 위 코드는 여전히 유효하며, 캔버스의 크기가 바뀔 수 있는 모든 경우에 다시 그리기를 작동시키면 됩니다.
    한 가지 쉬운 방법은 `ResizeObserver`를 사용하는 것입니다.

    <pre class="prettyprint">
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(gl.canvas, {box: 'content-box'});
    </pre>

5.  <a id="properties"></a>`WebGLObject`에 속성 추가

    `WebGLObject`는 `WebGLBuffer`나 `WebGLTexture`처럼 WebGL의 다양한 유형의 리소스입니다.
    일부 앱들은 이런 객체에 속성을 추가하는 경우가 있습니다.
    예시 코드:

        var buffer = gl.createBuffer();
        buffer.itemSize = 3;        // 나쁨!!
        buffer.numComponents = 75;  // 나쁨!!

        var program = gl.createProgram();
        ...
        program.u_matrixLoc = gl.getUniformLocation(program, "u_matrix");  // 나쁨!!

    **나쁜 이유:**

    이게 나쁜 이유는 WebGL이 "컨텍스트를 잃을" 수 있기 때문입니다.
    어떤 이유로든 발생할 수 있지만 가장 일반적인 원인으로 브라우저가 너무 많은 GPU 리소스를 사용하고 있다고 판단하면 여유 공간 확보를 위해 일부 `WebGLRenderingContext`의 컨텍스트를 의도적으로 없앨 수 있습니다.
    WebGL 프로그램이 항상 작동하길 바란다면 이를 처리해야 하는데요.
    구글 맵에서는 이를 처리하고 있습니다.

    위 코드의 문제점은 컨텍스트가 없어졌을 때 위의 `gl.createBuffer()`같은 WebGL 생성 함수가 `null`을 반환한다는 것입니다.
    그러면 사실상 코드가 이렇게 됩니다.

        var buffer = null;
        buffer.itemSize = 3;        // 오류!
        buffer.numComponents = 75;  // 오류!

    다음과 같은 오류가 발생하면서 앱이 죽어버립니다.

        TypeError: Cannot set property 'itemSize' of null

    많은 앱들이 컨텍스트를 잃어버린 경우에는 앱이 죽어도 상관하지 않는데, 
    컨텍스트 손실 이벤트를 처리하도록 앱을 업데이트하기로 결정했을 경우에는 결국 수정해야 할 코드를 
    미리 작성하는 것은 안 좋은 생각인 것 같습니다.

    **대신 할 일:**

    `WebGLObject`와 이에 관한 정보를 함께 유지하고 싶다면 한 가지 방법은 자바스크립트 객체를 사용하는 겁니다.
    예시:

        var bufferInfo = {
          id: gl.createBuffer(),
          itemSize: 3,
          numComponents: 75,
        };

        var programInfo = {
          id: program,
          u_matrixLoc: gl.getUniformLocation(program, "u_matrix"),
        };

    개인적으로 [WebGL 작성을 훨씬 간단히 만들어주는 간단한 헬퍼](webgl-less-code-more-fun.html)를 사용하는 것을 추천합니다.

위의 내용이 제가 인터넷에서 본 코드 중 WebGL 안티패턴이라고 생각하는 것들의 일부입니다.
피해야 하는 이유와 그에 대한 쉽고 유용한 해결책이 전달되었기를 바랍니다.

<div class="webgl_bottombar">
<a id="drawingbuffer"></a>
<h3>drawingBufferWidth와 drawingBufferHeight는 뭔가요?</h3>
<p>
GPU에는 지원할 수 있는 픽셀 사각형(texture, renderbuffer)의 크기에 대한 제한이 있습니다.
대개는 GPU가 제조될 당시에 흔히 사용되는 모니터 해상도의 다음 2의 배수 크기입니다.
예를 들어 GPU가 1280x1024 화면을 지원하도록 설계되었다면 2048의 크기로 제한되어 있을 수 있습니다.
2560x1600 화면을 지원하도록 설계되었다면 4096의 제한을 가질 겁니다.
</p>
<p>
합리적으로 보이지만 다중 모니터를 사용 중이라면 어떻게 될까요?
2048의 제한을 가지진 GPU를 사용 중이고 2개의 1920x1080 모니터가 있다고 가정해봅시다.
사용자가 WebGL 페이지가 있는 브라우저 창을 연 다음, 두 모니터에 걸쳐서 창을 확장합니다.
코드는 <code>canvas.width</code>를 3840인 <code>canvas.clientWidth</code>로 설정하려고 합니다.
어떤 일이 발생해야 할까요?
</p>
<p>머릿속에 떠오르는 세 가지 선택지가 있습니다.</p>
<ol>
<li>
<p>예외를 발생시킴</p>
<p>
안 좋은 것 같습니다.
대부분의 웹 앱은 예외를 처리하지 않으며 그러면 앱이 제대로 동작하지 않을겁니다.
만약 앱이 사용자 데이터를 가지고 있다면 사용자는 데이터를 잃어버리겠죠.
</p>
</li>
<li>
<p>캔버스 크기를 GPU 한도로 제한</p>
<p>
이 해결책의 문제점은 코드가 캔버스가 요청한 크기대로 될 것이라 예상하고, UI의 다른 부분들 및 페이지에 있는 요소들이 적절한 위치에 있을 것이라 생각하기 때문에, 충돌로 이어지거나 웹 페이지를 엉망으로 만들 수 있습니다.
</p>
</li>
<li>
<p>캔버스는 사용자가 요청한 크기가 되지만 drawingbuffer에 제한을 둠</p>
<p>
이게 WebGL이 사용하는 해결책입니다.
코드가 올바르게 작성되었다면 사용자가 알아차릴 수 있는 유일한 것은 캔버스에 표시된 이미지의 크기가 약간 변경된다는 것입니다.
다른 것들은 제대로 동작합니다.
최악의 경우 제대로 작성되지 않은 WebGL 프로그램은 화면을 약간 벗어나지만, 사용자가 창의 크기를 조정하면 정상으로 돌아올겁니다. 
</p>
</li>
</ol>
<p>
대다수의 사람이 다중 모니터를 가지고 있지는 않으므로 이 이슈는 흔하지 않습니다.
적어도 예전에는 그랬습니다.
2015년 1월 기준, 크롬과 사파리의 경우 캔버스 크기가 하드 코딩으로 4096으로 제한되어 있습니다.
애플의 5K iMac은 그 제한을 넘어섰습니다.
이러한 이유로 인해 많은 WebGL 앱이 화면에 이상하게 표시되었습니다.
마찬가지로 많은 사람들이 다중 모니터가 설치된 환경에서 WebGL을 사용하기 시작했으며 제한을 넘어섰습니다.
</p>
<p>
따라서 이런 경우를 처리하고 싶다면 위의 #1에서 보여드린 <code>gl.drawingBufferWidth</code>와 <code>gl.drawingBufferHeight</code>를 사용하세요.
대부분의 앱에서 위 모범 사례를 따르면 제대로 작동할 겁니다.
하지만 drawingBuffer의 실제 크기를 고려한 계산을 수행한다면 주의하셔야 합니다.
머리속에 떠오르는 예제는, [picking](webgl-picking.html), 즉 마우스 좌표를 캔버스 픽셀 좌표로 변환하는 계산입니다.
다른 하나는 drawingbuffer의 실제 크기를 알아야 하는 모든 종류의 후처리 효과의 계산입니다.
</p>
</div>

