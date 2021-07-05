Title: WebGL2 - 교차 출처 이미지(Cross Origin Image)
Description: 도메인 간의 이미지 사용
TOC: 교차 출처 이미지(Cross Origin Image)


이 글은 WebGL 관련 시리즈의 글입니다.
[이전 글](webgl-fundamentals.html)을 아직 읽지 않으셨으면 먼저 읽어보시는 것이 좋습니다.

WebGL에서는 텍스처로 사용하기 위해 이미지를 다운로드한 다음 GPU에 업로드하는 일이 자주 있습니다.
이 사이트에도 이러한 작업을 하는 여러 예제가 있습니다.
예를 들어 [이미지 처리](webgl-image-processing.html)에 관한 글, [텍스처](webgl-3d-textures.html)에 관한 글, [2D drawImage 구현](webgl-2d-drawimage.html)에 관한 글 등이 있습니다.

일반적으로 아래와 같이 이미지를 다운로드합니다.

    // 텍스처 정보 { width: w, height: h, texture: tex }를 생성합니다.
    // 텍스처는 1x1 픽셀로 시작해서 이미지가 로드 완료되면 갱신됩니다.
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // 텍스처를 1x1 파랑 픽셀로 채우기
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 255, 255]));

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var textureInfo = {
        width: 1,   // 로드가 완료될 때까지는 크기를 모릅니다.
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      });
      img.src = url;

      return textureInfo;
    }

문제는 이미지에 개인 데이터(에를 들어 캡차, 서명, 노출 사진, ...)가 있을 수 있다는 겁니다.
웹 페이지에는 페이지에서 직접 제어하지 않는 광고와 기타 요소들이 있으므로 
브라우저는 이러한 개인 이미지의 내용을 해당 요소들이 볼 수 없도록 해야 합니다.

이미지가 브라우저에 표시되더라도 스크립트에서 이미지 내부의 데이터를 볼 수는 없기 때문에 `<img src="private.jpg">`를 사용하는 것은 괜찮습니다.
[Canvas2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)에는 이미지 내부를 볼 수 있는 방법이 있습니다.
먼저 캔버스에 이미지를 그립니다.

    ctx.drawImage(someImg, 0, 0);

그런 다음 데이터를 가져옵니다.

    var data = ctx.getImageData(0, 0, width, heigh);

하지만 이미지가 다른 도메인에서 가져와 그린 이미지라면 브라우저는 캔버스를 *오염*되었다고 표시하고 `ctx.getImageData`를 호출할 때 보안 오류를 발생시킵니다.

WebGL은 한 단계 더 나아갑니다.
WebGL에서 `gl.readPixels`는 `ctx.getImageData`와 동일하니 이를 발지하면 충분하다고 생각하실지 모르겠지만, 
픽셀 데이터를 직접적으로 읽지 못해도 이미지 내의 색상 데이터를 가지고 좀 더 오래 동작되는 셰이더를 만들 수 있다는 것이 알려져 있습니다.
해당 정보를 사용해서 타이밍 기능으로 간접적으로 이미지 내부를 살펴보고 이미지의 내용을 확인할 수 있습니다.

따라서 WebGL은 같은 도메인 출처가 아닌 모든 이미지를 금지합니다.
예를 들어 다음은 다른 도메인의 텍스처를 가지고 회전하는 사각형을 그리는 예제입니다.
텍스처가 로드되지 않고 오류가 발생하는 것을 보십시오.

{{{example url="../webgl-cors-permission-bad.html" }}}

어떻게 이를 해결해야 할까요?

## CORS 입력

CORS = 교차 출처 리소스 공유(Cross Origin Resource Sharing) 입니다.
CORS는 웹 페이지가 이미지 사용 권한을 이미지 서버에 요청하는 방법입니다.

이를 위해 `crossOrigin` 속성을 무언가로 설정하면 브라우저가 서버에서 이미지를 가져오려고 시도할 때, 동일한 도메인이 아닌 경우 브라우저는 CORS 권한을 요청합니다.


    ...
    +    img.crossOrigin = "";   // CORS 권한 요청
        img.src = url;

`crossOrigin`에 할당한 문자열이 서버로 보내집니다.
서버에서는 해당 문자열을 보고 권한을 부여할지 여부를 결정합니다.
CORS를 지원하는 대부분의 서버는 문자열을 확인하지 않고 그냥 권한을 줍니다.
그래서 빈 문자열로 할당해도 동작하는 것입니다.
위 예제의 경우 단순히 "권한을 요청"하는 것이고 `img.crossOrigin = "bob"` 라고 했다면 "'bob'에게 권한을 요청"하게 되는 것입니다.

그냥 항상 권한을 요청하지 않는 이유는 뭘까요? 왜냐하면 권한을 요청하는 데에는 2개의 HTTP 요청이 필요하고 여기에 시간이 소요되기 때문입니다.
동일한 도메인 내의 이미지이거나 해당 이미지를 img 태그 또는 canvas2D 안에 사용하기만 할 것이라면 `crossOrigin`를 설정해서 느리게 동작하도록 만들 이유가 없습니다.

로드하려는 이미지가 동일한 출처에 있는지 확인하고 그렇지 않은 경우에만 `crossOrigin` 속성을 설정하는 함수를 만들 수 있습니다.

    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

함수는 아래와 같이 사용할 수 있습니다.

    ...
    +requestCORSIfNotSameOrigin(img, url);
    img.src = url;


{{{example url="../webgl-cors-permission-good.html" }}}

권한을 요청한다고 해서 항상 권한이 부여되는 것은 **아닙니다**.
권한을 부여할지 여부는 서버에 달려있습니다.
Github page, flickr.com, imgur.com 등은 권한을 부여하지만, 대부분의 웹 사이트는 그렇지 않습니다.

<div class="webgl_bottombar">
<h3>Apache에 CORS 권한 부여</h3>
<p>Apache로 웹 사이트를 운영하고 mod_rewrite 플러그인이 설치되어 있다면 아래와 같은 코드로 전체적인 CORS 지원을 허용할 수 있습니다.</p>
<pre class="prettyprint">
    Header set Access-Control-Allow-Origin "*"
</pre>
<p>적당한 <code>.htaccess</code> 파일에 삽입하면 됩니다.</p>
</div>

