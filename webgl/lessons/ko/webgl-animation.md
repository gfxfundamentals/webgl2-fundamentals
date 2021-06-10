Title: WebGL2 - 애니메이션
Description: WebGL에서 애니메이션을 구현하는 법
TOC: 애니메이션


이 글은 WebGL 시리즈에서 이어지는 글입니다.
첫 글은 [WebGL2 기초](webgl-fundamentals.html)이며 이 전 글은 [3D 카메라](webgl-3d-camera.html) 입니다.
아직 위 글들을 읽지 않았다면 먼저 읽어 보시기 바랍니다.

WebGL에서 애니메이션은 어떻게 구현할까요?

사실 WebGL에만 국한된 것은 아니고, 일반적으로 자바스크립트에서 무언가를 애니메이션하고 싶을때는 
시간의 흐름에 따라 무언가를 변화시킨 뒤에 다시 그리도록 해야 합니다.

이전 예제들 중에 하나를 골라서 아래와 같이 애니메이션을 해 보겠습니다.

    *var fieldOfViewRadians = degToRad(60);
    *var rotationSpeed = 1.2;

    *requestAnimationFrame(drawScene);

    // 장면을 그립니다.
    function drawScene() {
    *  // 매 프레임마다 회전값을 약간씩 늘립니다.
    *  rotation[1] += rotationSpeed / 60.0;

      ...
    *  // 다음 프레임의 drawScene을 다시 호출합니다.
    *  requestAnimationFrame(drawScene);
    }

결과는 아래와 같습니다.

{{{example url="../webgl-animation-not-frame-rate-independent.html" }}}

그런데 약간의 문제가 있습니다. 위 코드에는 `rotationSpeed / 60.0`가 포함되어 있습니다.
60.0으로 나눈 이유는 브라우저가 1초마다 requestAnimationFrame에 60번 응답한다고 가정하였는데, 일반적으로 그렇긴 합니다.

하지만 이 가정은 유효하지 않습니다.
사용자는 오래된 스마트폰처럼 낮은 성능의 장비를 사용하고 있을수도 있습니다.
아니면 백그라운드에 무거운 프로그램을 실행하고 있을수도 있죠.
브라우저가 1초에 60번 화면을 새로 그리지 못하게 만드는 여러가지 이유가 있을 수 있습니다.
지금은 2020년이니, 모든 장비가 1초에 240프레임으로 동작할 수도 있습니다.
어쩌면 사용자가 게이머라서 초당 90프레임의 CRT 모니터를 사용하고 있을수도 있습니다.

아래 예제에서 문제를 눈으로 확인할 수 있습니다.

{{{diagram url="../webgl-animation-frame-rate-issues.html" }}}

이 예제에서는 모든 'F'를 동일한 속도로 회전하도록 하고 싶습니다.
가운데 'F'는 최대 속도로 동작하지만 프레임 갱신 속도에 독립적으로 동작합니다.
왼쪽과 오른쪽은 브라우저가 1/8속도로 동작하는 상황을 시뮬레이션 한것입니다.
왼쪽은 프레임 속도에 독립적이지 **않습니다**. 오른쪽은 프레임 속도에 **독립적입니다**.

왼쪽의 경우에는 프레임 갱신 속도가 느린 상황을 가정하고 있지 않기 때문에 같은 속도를 유지하지 못합니다.
하지만 오른쪽의 경우 1/8 프레임 갱신 속도에도 불구하고 가운데의 최대 속도와 동일한 속도를 유지하고 있습니다.

애니메이션을 프레임 갱신 속도에 독립적으로 만드는 방법은 프레임간 소요된 시간을 계산하고 
이를 현재 프레임에서 애니메이션을 얼마나 진행해야 하는지를 계산하는 데 사용하는 것입니다.

먼저 시간을 얻어와야 합니다. 다행히 `requestAnimationFrame`는 페이지가 로드된 시점으로부터의 시간을 전달해 줍니다.

`requestAnimationFrame`는 시간을 밀리세컨드(1/1000초) 단위로 전달해주지만 

그러면 아래와 같이 소요 시간(delta time)을 계산할 수 있게 됩니다.

    *var then = 0;

    requestAnimationFrame(drawScene);

    // 장면을 그립니다.
    *function drawScene(now) {
    *  // 시간을 초 단위로 변환합니다.
    *  now *= 0.001;
    *  // 현재 시간에서 이전 시간을 빼 줍니다.
    *  var deltaTime = now - then;
    *  // 다음 프레임의 현재 시간을 저장해 둡니다.
    *  then = now;

       ...

초 단위의 `deltaTime`을 얻게 되면 이제 모든 계산은 1초당 얼마나 많은 변화가 일어나야 하는지를 기준으로 계산됩니다.
`rotationSpeed`의 경우 값이 1.2였는데 그 말은 초당 1.2 라디안만큼 회전하겠다는 뜻이 됩니다.
1.2 라디안은 1/5회전쯤 되고, 그 말은 프레임 속도와 상관없이 대략 5초가 지나면 한 바퀴를 회전하게 된다는 뜻입니다.

    *    rotation[1] += rotationSpeed * deltaTime;

동작 결과는 아래와 같습니다.

{{{example url="../webgl-animation.html" }}}

여러분이 아주 속도가 느린 장치를 사용하고 있지 않으시다면 이 페이지 맨 위의 예제와 다른 점을 눈치채시기 어려울겁니다.
하지만 여러분이 애니메이션을 프레임 갱신 속도에 독립적으로 만들지 않으면 여러분이 계획한 것과는 매우 다른 경험을 하는 사용자가 생길겁니다.

다음은 [텍스처 적용 방법](webgl-3d-textures.html) 입니다.

<div class="webgl_bottombar">
<h3>setInterval이나 setTimeout은 사용하지 마세요!</h3>
<p>여러분이 자바스트립트에서 애니메이션 프로그래밍을 해 보신 적이 있다면 
<code>setInterval</code>이나 <code>setTimeout</code>을 사용해 드로잉 함수를 호출한 적이 있으실겁니다.
</p><p>
애니메이션을 위해 <code>setInterval</code>이나 <code>setTimeout</code>를 사용할 때의 문제점은 두 가지입니다.
먼저 <code>setInterval</code>과 <code>setTimeout</code> 둘 다 브라우저가 화면을 표시하는 것과는 무관하다는 것입니다.
이 함수들은 브라우저가 새 프레임을 그리는 것과 동기화되어있지 않아서 사용자의 환경에서는 동기화가 틀어질 수 있습니다.
<code>setInterval</code>이나 <code>setTimeout</code>을 사용하면서 초당 60프레임을 가정했는데 
실제 사용자의 환경은 다른 프레임 갱신 속도로 동작한다면 장치와의 동기화가 틀어질 겁니다.
</p><p>
또다른 문제는 브라우저는 여러분이 언제 <code>setInterval</code>이나
<code>setTimeout</code>를 사용하는지 모른다는 것입니다.
예를 들어 페이지가 다른 탭에 있어서 여러분의 페이지가 화면에 보이지 않는 상태여도 브라우저는 여전히 코드를 실행할 겁니다.
<code>setTimeout</code>이나 <code>setInterval</code>를 새 메일이나 트윗을 체크하기 위해 사용하고 있을 수 있습니다.
브라우저는 여러분이 어떤 목적으로 그 함수들을 사용하는지 알 수 없습니다.
몇 초에 한번씩 새 메시지를 확인하는 것이라면 문제가 없지만 WebGL을 사용해 1000개의 물체를 그리려고 하는 것이라면 문제가 발생합니다.
그렇게 되면 여러분은 보고 있지도 않은 화면을 위해 사용자의 장치에 부하를 주고 있는 겁니다.
</p><p>
<code>requestAnimationFrame</code>은 이 두가지 문제를 모두 해결해줍니다.
스크린과 애니메이션이 동기화되도록 적절한 시간에 여러분의 함수를 호출해주고 또한 탭이 화면에 표시되고 있을때만 호출합니다.
</p>
</div>



