Title: WebGL2 설정 및 설치
Description: WebGL 개발 방법
TOC: 설정 및 설치


사실, WebGL개발을 위해서는 웹 브라우저 말고 다른 것은 필요 없습니다.
[jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/) 또는 [jsbin.com](https://jsbin.com)
또는 [codepen.io](https://codepen.io/greggman/pen/YGQjVV) 에 방문하여 여기서 배운 내용을 적용해 보십시오,

모든 사이트에서 `<script src="..."></script>` 태그를 사용해서, 필요한 경우 외부 스크립트를 참조할 수 있습니다. 

하지만, 제약 사항도 있습니다. WebGL은 Canvas2D보다 이미지를 로딩하는 데 있어서 강한 제약이 있으므로
당신이 만든 WebGL에 웹에 존재하는 아무 이미지를 사용할 수는 없습니다.
또한 로컬에서 모든 작업을 수행하는 것이 더 빠르다는 장점도 있습니다.

당신이 이 사이트에 있는 샘플들을 실행해 보거나 수정해 보고 싶다고하면,
우선 이 사이트를 다운로드 해야 합니다. [여기에서 다운로드 할 수 있습니다](https://github.com/gfxfundamentals/webgl2-fundamentals/tree/gh-pages).

{{{image url="resources/download-webglfundamentals.gif" }}}

파일의 압축을 푸십시오.

## 작고 간단한 웹 서버 사용하기

다음으로, 작은 웹 서버를 설치해야 합니다. "웹 서버"라는 말이 조금 무섭게 들릴수도 있지만 사실 [웹서버는 굉장히 간단합니다.](https://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

인터페이스를 제공하는 간단한 웹 서버가 있습니다. [Servez](https://greggman.github.io/servez).

{{{image url="resources/servez.gif" }}}

압축을 푼 파일들이 있는 경로를 지정하고, "Start"를 클릭하십시오. 그리고 브라우저를 통해 
[`http://localhost:8080/webgl/`]()`http://localhost:8080/webgl/)에 접속해 샘플을 선택하세요.

명령줄을 사용하는 것을 선호한다면 [node.js](https://nodejs.org)를 사용하셔도 됩니다.
다운로드하고 설치한 뒤 명령 프롬프트/콘솔/터미널 창을 여십시오.
윈도우즈를 사용 중이라면 인스톨러가 "Node Command Prompt"를 추가로 설치할 테니 그것을 사용하시면 됩니다.

그리고 아래와 같이 입력하여 [`servez`](https://github.com/greggman/servez-cli)를 설치하십시오.

    npm -g install servez

OSX라면 아래 명령어를 사용하세요.

    sudo npm -g install servez

다 되었다면 아래와 같이 입력하세요.

    servez path/to/folder/where/you/unzipped/files

그러면 아래와 같이 출력될겁니다.

{{{image url="resources/servez-response.png" }}}

그리고 브라우저를 통해[`http://localhost:8080/webgl/`](http://localhost:8080/webgl/)에 접속하세요.

경로를 입력하지 않는다면 servez에서 현재 폴더를 server로 지정할겁니다.

## 브라우저 개발자 도구 사용하기

대부분의 브라우저는 많은 개발자 도구가 포함되어 있습니다.

{{{image url="resources/chrome-devtools.png" }}}

[크롬 개발자 도구 문서](https://developers.google.com/web/tools/chrome-devtools/),
[파이어폭스 개발자 도구 문서](https://developer.mozilla.org/en-US/docs/Tools).

사용하는 방법을 배워 보세요. 특별한 경우가 아니면 자바스크립트 콘솔만 확인하시면 됩니다.
문제가 있다면 대개 오류 메시지가 있을겁니다.
오류 메시지를 자세히 읽어보시면 어디가 문제인지 알아챌 수 있을겁니다.

{{{image url="resources/javascript-console.gif" }}}

## WebGL Lint

[여기](https://greggman.github.io/webgl-lint/)에 WebGL 오류를 확인할 수 있는 스크립트가 있습니다.
다른 스크립트 전에 이 스크립트를 페이지에 추가하세요.

```
<script src="https://greggman.github.io/webgl-lint/webgl-lint.js"></script>
```

그러면 프로그램에서 WebGL 오류가 발생할 때 예외를 발생기키고 운이 좋으면 많은 정보들이 출력 될겁니다.

[또한 WebGL 리소스들에 이름을 추가할 수 있는데](https://github.com/greggman/webgl-lint#naming-your-webgl-objects-buffers-textures-programs-etc)
(buffer, textures, shaders, programs, ...), 그러면 오류 메시지와 관련된 리소스의 이름을 에러 메시지에 포함하여 출력할 수 있습니다. 

## 확장

다양한 WebGL Inspector가 있습니다.
[크롬과 파이어폭스 용은 여기 있습니다.](https://spector.babylonjs.com/).

{{{image url="https://camo.githubusercontent.com/5bbc9caf2fc0ecc2eebf615fa8348146b37b08fe/68747470733a2f2f73706563746f72646f632e626162796c6f6e6a732e636f6d2f70696374757265732f7469746c652e706e67" }}}

주의: [문서를 읽어 보세요!](https://github.com/BabylonJS/Spector.js/blob/master/readme.md)!

spector.js의 확장 버전은 프레임을 캡처합니다.
그 말은 당신의 WebGL 앱이 성공적으로 초기화되고 `requestAnimationFrame`에서 렌더링 될때에만 제대로 동작한다는 이야기입니다.
"record" 버튼을 누르면 한 "프레임"에 호출된 모든 WebGL API들을 캡처합니다.

다시말해, 초기화 시점에 발생하는 문제 해결에는 다른 방법이 필요합니다.

방법은 두가지가 있습니다.

1. 확장이 아닌 라이브러리로서 사용하기. 

   [문서](https://github.com/BabylonJS/Spector.js/blob/master/readme.md)를 보세요.
   이렇게 하면 "지금 시점의 WebGL API 명령어를 캡처해!"라고 할 수 있습니다.

2. 앱을 수정하여 버튼을 클릭하면 시작하도록 수정하기.

   이렇게 하면 확장으로 가서 "record"를 하고 난 뒤에 앱을 시작할 수 있습니다.
   앱이 작동하지 않으면 몇 개의 가짜 프레임을 집어넣으세요. 예를 들어:
   
```html
<button type="button">start</button>
<canvas id="canvas"></canvas>
```

```js
function main() {
  // WebGL context 가져오기
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const startElem = document.querySelector('button');
  startElem.addEventListener('click', start, {once: true});

  function start() {
    // spector는 rAF 이벤트 내의 동작만 캡처하므로, 초기화를 rAF안에서 실행    
    requestAnimationFrame(() => {
      // 초기화 실행
      init(gl);
    });
    // spector가 살펴볼 수 있도록 몇 개의 프레임 생성
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
  }
}

main();
```

이제 spector.js 확장에서 "record"를 누르고 페이지 내의 "start"를 클릭하면 spector가 초기화 과정을 기록할 수 있습니다.

사파리 또한 [비슷한 문제와 해결 방법이 있습니다.](https://stackoverflow.com/questions/62446483/debugging-in-webgl). 

제가 이런 헬퍼 기능을 사용할 때는 draw call에 클릭하고 uniform을 살펴봅니다.
`NaN`(NaN = Not a Number)이 많이 보인다면 uniform을 설정하는 부분으로 가서 버그를 찾습니다.
 
## 코드 확인하기

코드를 확인할 수 있다는 사실을 항상 기억하십시오. 일반적으로는 그냥 소스를 보시면 됩니다.

{{{image url="resources/view-source.gif" }}}

페이지를 우클릭 할 수 없는 경우나 소스가 별도에 파일에 있는 경우에도 개발자 도구에서는 소스를 볼 수 있습니다.

{{{image url="resources/devtools-source.gif" }}}

## 시작하기

위 내용들이 시작하는데 도움이 되었기를 바랍니다. [강의로 다시 돌아갑시다.](index.html).
