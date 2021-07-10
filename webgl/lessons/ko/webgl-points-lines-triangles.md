Title: WebGL2 점, 선, 삼각형
Description: 점, 선, 삼각형 그리기에 대한 세부 사항
TOC: 점, 선, 삼각형


이 사이트의 대부분의 예제는 삼각형으로 모든 걸 그립니다.
WebGL 프로그램의 99%가 하는 일반적인 일입니다.
하지만 완전한 설명을 위해 몇 가지 다른 경우를 살펴 봅시다.

[첫 번째 글](webgl-fundamentals.html)에서 언급했듯이 WebGL은 점, 선, 그리고 삼각형을 그립니다.
`gl.drawArrays`나 `gl.drawElements`를 호출해서 그리게 됩니다.
우리는 클립 공간 좌표를 출력하는 정점 셰이더를 제공하고, 
`gl.drawArrays`나 `gl.drawElements`의 첫 번째 전달인자를 기반으로 WebGL은 점, 선, 또는 삼각형을 그립니다.

`gl.drawArrays`와 `gl.drawElements`의 첫 번째 전달인자로 유효한 값들은

* `POINTS`

   정점 셰이더가 출력하는 각 클립 공간 정점에 대해 해당 점의 중앙에 정사각형을 그립니다.
   정사각형의 크기는 정점 셰이더 내부의 특별 변수 `gl_PointSize`에 픽셀 단위로 원하는 크기를 설정하여 지정합니다.

   참고: 정사각형이 될 수 있는 최대(및 최소) 크기는 구현에 따라 다르며 아래 코드를 사용해 알 수 있습니다.

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

   [여기](webgl-drawing-without-data.html#pointsissues)에서 다른 이슈도 확인하세요.

* `LINES`

   정점 셰이더가 출력하는 두개의 클립 공간 정점에 대해 그 두 점을 연결하는 선을 그립니다.
   점 A,B,C,D,E,F가 있다면 세개의 선이 표시됩니다.

   <div class="webgl_center"><img src="resources/gl-lines.svg" style="width: 400px;" align="center"></div>
   
   명세에 따르면 `gl.lineWidth`를 호출하고 픽셀 너비를 지정하여 선의 두께를 설정할 수 있습니다.
   실제 최대 너비는 구현에 따라 다르지만 대부분의 구현에서 최대 너비는 1입니다.

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

   이는 주요 데스크탑 OpenGL에서 1보다 큰 값을 사용할 수 없다는 것을 따른 것입니다.

* `LINE_STRIP`

   정점 셰이더가 출력하는 각 클립 공간 정점에 대해 정점 셰이더가 출력한 이전 포인트에서 선을 그립니다.

   따라서 클립 공간 정점 A,B,C,D,E,F를 출력하면 다섯개의 선이 표시됩니다.

   <div class="webgl_center"><img src="resources/gl-line-strip.svg" style="width: 400px;"></div>

* `LINE_LOOP`

   `LINE_STRIP` 예제와 같지만 마지막 점에서 첫 번째 점으로 선을 하나 더 그립니다.

   <div class="webgl_center"><img src="resources/gl-line-loop.svg" style="width: 400px;"></div>

* `TRIANGLES`

   정점 셰이더가 출력하는 세개의 클립 공간 정점마다 그 점 세개로 삼각형을 그립니다.
   이게 가장 많이 사용되는 모드입니다.

   <div class="webgl_center"><img src="resources/gl-triangles.svg" style="width: 400px;"></div>

* `TRIANGLE_STRIP`

   정점 셰이더가 출력하는 각 클립 공간 정점에 대해 마지막 정점 세개로 삼각형을 그립니다.
   즉 여섯개의 점 A,B,C,D,E,F를 출력하면 삼각형 네개가 그려집니다.
   A,B,C 그리고 B,C,D 그리고 C,D,E 그리고 D,E,F 입니다.

   <div class="webgl_center"><img src="resources/gl-triangle-strip.svg" style="width: 400px;"></div>

* `TRIANGLE_FAN`

   정점 셰이더가 출력하는 각 클립 공간 정점에 대해 첫 번째 정점과 마지막 정점 두개로 삼각형을 그립니다.
   즉 여섯개의 점 A,B,C,D,E,F를 출력하면 삼각형 네개가 그려집니다.
   A,B,C 그리고 A,C,D 그리고 A,D,E 그리고 마지막으로 A,E,F 입니다.

   <div class="webgl_center"><img src="resources/gl-triangle-fan.svg" style="width: 400px;" align="center"></div>

동의하지 않는분도 있겠지만 저의 경험상 `TRIANGLE_FAN`과 `TRIANGLE_STRIP`은 피하는 게 좋습니다.
몇 가지 예외적인 경우에만 적합한 방식을, 이를 처리하기 위한 추가 코드를 작성하면서까지 그냥 Triangle을 사용하는 대신 사용할 이유가 없습니다.
특히 법선을 만들거나 텍스처 좌표를 생성하거나 이외에도 정점 데이터에 기반한 작업을 수행하는 도구가 포함된 경우엔 더 그렇습니다.
`TRIANGLES`만을 사용한다면 여러분이 만든 도구는 잘 동작할겁니다.
`TRIANGLE_FAN`과 `TRIANGLE_STRIP`을 추가하기 시작하면 더 많은 경우를 처리하기 위한 함수들이 추가로 필요해집니다.
제 의견에 동의하지 않고 원하는 방식으로 하셔도 됩니다.
저는 그저 제 경험과 제가 들은 일부 AAA 게임 개발자들의 경험을 말씀드리는 겁니다.

마찬가지로 `LINE_LOOP`와 `LINE_STRIP`은 그렇게 유용하지 않으며 비슷한 문제를 가지고 있습니다.
`TRIANGLE_FAN`과 `TRIANGLE_STRIP`처럼 이것들을 사용하는 상황은 드뭅니다.
예를 들어 각각 네개의 점으로 만들어진 연결된 선 네개를 그리고 싶다고 해 봅시다.

<div class="webgl_center"><img src="resources/4-lines-4-points.svg" style="width: 400px;" align="center"></div>

`LINE_STRIP`을 사용한다면 `gl.drawArrays`를 네 번 호출해야 하고 각 선에 대한 attribute를 설정하기 위해 더 많은 호출을 해야 합니다.
하지만 `LINES`를 사용하면 네 개의 선 집합을 위한 점들을 모두 입력한 후에 한 번의 `gl.drawArrays` 호출로 선 네개를 모두 그릴 수 있습니다.
그게 훨씬 빠를 겁니다.

추가로 `LINES`는 디버깅이나 간단한 효과에 사용하기는 좋지만, 대부분의 플랫폼에서 너비 제한이 1픽셀임을 고려해 볼 때 사용하지 않는 것이 좋습니다.
그래프의 격자(grid)를 그리거나 3D 모델링 프로그램에서 폴리곤의 윤곽선을 표시하려면 `LINES`를 사용하는 것이 좋을 수도 있지만, 
SVG나 Adobe Illustrator처럼 구조화된 그래픽을 그리려면 이 방식으로는 어렵습니다.
보통은 [삼각형을 사용하는 다른 방식으로 선을 렌더링](https://mattdesl.svbtle.com/drawing-lines-is-hard)해야 합니다.

