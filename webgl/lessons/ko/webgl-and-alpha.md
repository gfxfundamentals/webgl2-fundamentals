Title: WebGL2 알파(Alpha)
Description: WebGL 알파가 OpenGL 알파와 다른 점
TOC: WebGL2 알파(Alpha)


WebGL이 백버퍼(ie, 캔버스)에서 알파를 처리하는 방법 때문에 일부 OpenGL 개발자들이 어려움을 겪는 것을 알게 되었습니다.
알파와 관련한 WebGL과 OpenGL의 차이점을 살펴보는 것이 좋을 것 같습니다.

OpenGL과 WebGL의 가장 큰 차이점으로 OpenGL에서는 백버퍼에 렌더링한 내용이 어떤 것과도 합성되지 않습니다.
정확히 얘기하자면 OS의 윈도우 매니저에 의해 합성되지 않습니다. 따라서 백버퍼에 쓰여진 알파값이 중요하지 않습니다.

WebGL은 브라우저에 의해 웹 페이지와 합성될 때 미리 곱하는 알파(pre-multiplied alpha)를 수행하는 것이 기본값입니다.
이는 투명도가 있는 .png `<img>` 태그, 2D 캔버스 태그와 동일합니다.

WebGL에는 OpenGL처럼 동작하도록 하기위한 여러 방법들이 있습니다.

### #1) WebGL에 알파를 미리 곱하지 않고(non-premultiplied alpha) 합성하도록 설정

    gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false  // 알파를 미리 곱하지 않도록 요청
    });

기본값은 true입니다.

물론 이렇게 해도 캔버스 아래에 있는 배경색(캔버스의 배경색, 캔버스 컨테이너의 배경색, 페이지의 배경색, 캔버스가 z-index > 0일 경우 캔버스 뒤에 있는 항목, 등등...)으로 페이지 위에 합성됩니다.
다시말해 CSS 색상이 웹 페이지의 해당 영역을 정의합니다.

알파값과 관련하여 문제가 발생하는지를 확인하는 좋은 방법은 캔버스의 배경을 빨강색같은 밝은 색상으로 설정하는 겁니다.
무슨 일이 일어나고 있는지 바로 보실 수 있습니다.

    <canvas style="background: red;"><canvas>

또한 알파값 관련 문제를 숨기기 위해 검은색으로 설정할 수도 있습니다.

### #2) WebGL에 백버퍼에 알파값을 사용하지 않도록 설정

    gl = canvas.getContext("webgl", { alpha: false }};

이렇게 하면 백버퍼는 RGB값만 가지기 때문에 좀 더 OpenGL과 비슷합니다.
잘 만들어진 브라우저는 이를 확인하여 WebGL이 합성하는 방식을 최적화할 수 있기 때문에 이 방법을 사용하는 것이 좋습니다.
물론 이렇게 되면 백버퍼에 알파값이 없을 것이므로 혹시 여러분이 다른 목적으로 백버퍼에 알파를 사용하고 있었다면 그 기능은 제대로 동작하지 않을겁니다.
백버퍼의 알파값을 사용하는 앱은 별로 없습니다. 제 생각에는 이것이(알파를 사용하지 않는 것이) 기본값이 되어야 한다고 생각합니다.

### #3) 렌더링의 마지막에 알파 지우기

    ..
    renderScene();
    ..

    // Clear 색상을 모두 1로 설정하여 백버퍼의 알파를 1.0으로 설정
    gl.clearColor(1, 1, 1, 1);

    // 알파 채널에만 영향을 주도록 WebGL 설정
    gl.colorMask(false, false, false, true);

    // 지우기
    gl.clear(gl.COLOR_BUFFER_BIT);

일반적으로 지우기는 하드웨어에에서 특별히 처리되기 때문에 매우 빠르게 실행됩니다.
제가 만든 초기의 WebGL 데모에서는 대부분 이런 방식으로 작성했습니다.
제가 더 똑똑했다면 위의 #2 방법으로 만들었을 것 같습니다.
이 글을 작성한 후에 바로 수정해야겠네요.
대부분의 WebGL 라이브러리는 이 방법(역주: #2를 일컫는 것 같습니다.)을 기본값으로 해야할 것처럼 보입니다.
실제로 알파값을 사용하는 경우에만 그렇게 설정하도록 하고, 나머지 경우에는 따로 처리를 하지 않아도
높은 성능과 더 적은 오류가 발생하도록요.

### #4) 알파를 지우고 이후에는 알파값을 렌더링하지 않도록 설정

    // 초기화할 때, 백버퍼 지우기
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 알파 렌더링 끄기
    gl.colorMask(true, true, true, false);

물론 여러분이 생성한 프레임 버퍼에 렌더링을 하는 경우라면 알파로 렌더링하도록 켰다가 캔버스 렌더링으로 전환할 때 다시 꺼야할 수 있습니다.

### #5) 이미지 처리

WebGL에 알파 채널이 있는 이미지를 로딩하는 경우
WebGL은 알파값을 곱하지 않은 파일에 있는 그대로의 값을 가져옵니다.
OpenGL에서는 이것이 일반적인데 왜냐하면 이렇게 해야 손실이 없기 때문입니다.
알파를 미리 곱하게 되면 손실이 발생합니다.

    1, 0.5, 0.5, 0  // RGBA

위는 알파를 미리 곱하지 않은 값을 겁니다. 왜냐하면 알파가 미리 곱해졌다면 
`a = 0`이기 때문에 `r`, `g`, `b`가 0이 되어야 합니다.

필요한 경우에는 이미지를 로딩할 때 WebGL이 알파를 미리 곱하도록 할 수 있습니다.
아래와 같이 `UNPACK_PREMULTIPLY_ALPHA_WEBGL`를 true로 설정하면 됩니다.

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

기본값은 알파를 미리 곱하지 않는 것입니다.

대부분의 Canvas 2D 구현은 알파를 미리 곱하는 방식으로로 작동한다는 점에 유의하세요.
따라서 캔버스를 WebGL로 전환할 때 `UNPACK_PREMULTIPLY_ALPHA_WEBGL`이 false라면 
WebGL은 데이터를 알파를 미리 곱하기 전의 값으로 다시 변환합니다.

### #6) 미리 곱해진 알파에 적용 가능한 블렌딩 함수 사용

제가 작성하거나 작업한 거의 모든 OpenGL 앱들은 아래 코드를 사용합니다.

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

위 함수는 알파라 미리 곱해지지 않은 경우에 제대로 작동합니다.

알파가 미리 곱해진 텍스처를 가지고 작업하시려면 아래와 같이 하셔야 할 겁니다.

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

여기까지가 제가 알고 있는 방법입니다. 더 알고 계신 내용이 있다면 아래에 글을 적어주세요.

