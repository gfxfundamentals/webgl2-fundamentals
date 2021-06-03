Title: WebGL 3D - 카메라
Description: WebGL에서 카메라의 원리
TOC: 3D - 카메라


이 글은 몇 가지 WebGL 글에서 이어지는 글입니다.
첫 번째는 [기초로 시작하기](webgl-fundamentals.html)이며
 이 전 글은 [3D 원근 투영](webgl-3d-perspective.html)입니다.
아직 위 글들을 읽지 않았다면 먼저 읽어 보시기 바랍니다.

이전 글에서 F를 절두체 앞으로 옮겨야만 했습니다.
그 이유는 `m4.perspective`함수는 관찰자가 (0, 0, 0)에 있고 절두체 안의 
`-zNear`과 `-zFar` 사이에 있는 물체를 그리기 때문입니다.

물체를 시야 앞으로 가져와야만 한다는 것이 맞는 것일까요?
실제 세계에서는 건물의 사진을 찍기 위해서는 카메라를 움직이는 것이 맞을 것입니다. 

{{{diagram url="resources/camera-move-camera.html?mode=0" caption="moving the camera to the objects" }}}

카메라 앞에 오도록 건물을 옮기는 경우는 흔치 않겠죠.

{{{diagram url="resources/camera-move-camera.html?mode=1" caption="moving the objects to the camera" }}}

하지만 지난 번 글에서 우리의 투영 방법은 원점에서 -Z축 방향으로 물체가 앞에 있어야 하는 조건이었습니다.
이를 만족하기 위해서 우리에게 필요한 것은 카메라를 원점으로 옮기고, 나머지 모든 물체를 적절한 양만큼 이동시켜 *카메라에 상대적으로* 모든 물체가 그 자리에 있도록 하면 됩니다.

{{{diagram url="resources/camera-move-camera.html?mode=2" caption="moving the objects to the view" }}}

실제로는 세계를 카메라 앞으로 이동시키는 것입니다.
가장 간단한 방법은 "역(inverse)" 행렬을 사용하는 것입니다.
역행렬을 계산하는 일반적인 방법은 복잡하지만 개념적으로는 간단합니다.
역이란 다른 어떤 값의 반대 방향 값입니다. 예를 들어, X 방향으로 123만큼 이동하는 행렬의 역은 
X방향으로 -123만큼 이동하는 행렬입니다. 5배로 크기를 증가하는 행렬의 역행렬은 크기를 1/5 또는 0.2만큼 감소하는 행렬입니다.
X축을 기준으로 30&deg;만큼 회전하는 행렬의 역행렬은 X축을 기준으로 -30&deg;만큼 회전하는 행렬입니다.

지금까지는 'F'의 위치화 방향을 바꾸기 위해 이동 회전과 크기 변환을 사용했습니다.
모든 행렬을 곱하여 만든 하나의 행렬은 'F'를 원점에서부터 우리가 원하는 위치로 이동하고 그 크기와 방향을 바꾸었습니다.
카메라에 대해서도 똑같이 할 수 있습니다. 원점에서부터 우리가 원하는 위치와 방향으로 이동하고 회전하는 행렬을 얻으면, 그 역행렬을 사용해 나머지 모든 물체를 그 반대 방향으로 이동하고 회전하여 마치 카메라가 (0, 0, 0)위치에 있는 것처럼 할 수 있습니다.

위에 있는 그림처럼 'F'들이 둥그렇게 모여있는 3D 장면을 만들어 봅시다.

코드는 아래와 같습니다.

```
function drawScene() {
  var numFs = 5;
  var radius = 200;

  ...

  // 행렬 계산
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zNear = 1;
  var zFar = 2000;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

  // 카메라 행렬로부터 뷰(view) 행렬 계산
  var viewMatrix = m4.inverse(cameraMatrix);

  // 투영 동산을 뷰 공간(카메라 앞의 공간)으로 변환
  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  // 둥그렇게 놓여있는 'F'들 그리기
  for (var ii = 0; ii < numFs; ++ii) {
    var angle = ii * Math.PI * 2 / numFs;

    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    // F를 위한 이동 행렬 추가
    var matrix = m4.translate(viewProjectionMatrix, x, 0, z);

    // 행렬 설정
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // geometry 그리기.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}
```

투영 행렬을 계산하고 나서 위 다이어그램처럼 'F'들 주위를 이동하는 카메라를 계산한다는 것을 볼 수 있습니다.


```
  // 카메라 행렬 계산
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
```

그러고 나서 카메라 행렬을 가지고 "뷰 행렬"을 계산합니다.
"뷰 행렬"은 모든 것들을 카메라의 반대로 이동하여 실제로는 나머지 것들이 원점 (0,0,0)에 위치한 카메라에 상대적으로 이동하는 것처럼 만듭니다.


```
  // 카메라 행렬로 뷰 행렬 계산.
  var viewMatrix = m4.inverse(cameraMatrix);
```

그러고 나서 viewProjection 행렬을 만들기 위해서 행렬을 합칩니다(곱합니다).


```
  // viewProjection 행렬을 만듭니다. 이 행렬은 투영과 
  // 월드의 이동을 동시에 수행하여 실제로 카메라가 원점에 있는 것처럼 만듭니다.
  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
```

마지막으로 해당 공간을 'F'를 배치하기 위한 공간처럼 사용합니다.


```
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var matrix = m4.translate(viewProjectionMatrix, x, 0, z);
```

다시 말해, viewProjection는 모든 `F`에 대해 동일합니다.
동일한 카메라로, 동일한 투영을 사용해 보고 있습니다.

그러면 짜잔! 둥그렇게 놓여있는 'F'들 주위를 돌고 있는 카메라입니다.
`cameraAngle` 슬라이더를 드래그래서 카메라를 움직여 보십시오.

{{{example url="../webgl-3d-camera.html" }}}

다 좋습니다만, 우리가 원하는 위치와 방향으로 카메라를 배치해서 어떤 점을 바라보도록 만드는 것이 항상 간단하지는 않습니다.
예를 들어 카메라가 어떤 특정 'F'를 항상 바라보도록 하려면 주위를 돌면서 'F'의 어떤 점을 바라보도록 카메라의 위치와 방향을 계산해야 하는데 이는 매우 복잡한 계산이 필요합니다.

다행히 더 쉬운 방법이 있습니다. 단지 카메라의 위치를 정하고 그 카메라가 바라보는 점을 가지고 행렬을 계산할 수 있습니다.
이 행렬이 동작하는 원리는 아주 쉽습니다.

일단 우리가 원하는 카메라의 위치를 알아야 합니다. 이를 `cameraPosition`이라고 하겠습니다.
그러고 나서 우리가 바라볼 위치를 알아야 합니다. 이를 `target`이라고 하겠습니다.
`target`에서 `cameraPosition`를 빼면 카메라로부터 `target`을 행하는 벡터를 구할 수 있습니다. 그 벡터를 `zAxis`라 합시다.
카메라가 -Z방향을 바라보아야 한다는 것을 알고 있기 때문에 반대로 빼겠습니다. `cameraPosition - target`로요. 
이 벡터를 정규화해서 행렬의 `z` 위치에 놓겠습니다.

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
| Zx | Zy | Zz |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
</pre></div>

행렬의 이 부분이 Z축을 표현합니다. 이 경우 카메라의 Z축입니다.
벡터를 정규화하는 것은 1.0을 표현하는 벡터를 만든다는 의미입니다.
[2D 회전 글](webgl-2d-rotation.html)을 보면, 단위 원에 대해 이야기하면서 그것이 어떻게 2D 회전에 사용되는지 설명했습니다. 
3D에서는 단위 구가 필요하고, 정규화된 벡터는 단위 구 위의 한 점을 정의합니다.

{{{diagram url="resources/cross-product-diagram.html?mode=0" caption="the <span class='z-axis'>z axis</span>" }}}

아직은 정보가 충분치 않습니다. 하나의 벡터는 단위 구 위의 한 점을 정의하지만 어떤 방향을 바라보아야 할까요?
행렬의 다른 부분을 채워야 할 필요가 있습니다. 특히 X축과 Y축에 해당하는 부분 말입니다.
일반적으로 그 3개의 축은 서로 직교한다는 것을 알고 있습니다. 또한 "일반적으로" 카메라가 항상 위를 향하지는 않는다는 것을 알고 있습니다.
이러한 사실로부터, 어디가 위쪽 방향인지 안다면(이 경우 (0,1,0),) 그 사실을 사용해 "외적(cross product)"을 통해 행렬의 X축과 Y축 부분을 계산할 수 있습니다.

저는 외적이 수학적으로 어떤 의미를 갖는지는 모릅니다.
제가 아는 것은 2개의 단위 덱터가 있고, 두 벡터의 외적을 계산하면 그 두 벡터에 직교하는 벡터를 얻을 수 있다는 사실입니다.
다시 말해, 북동쪽을 가리키고 있는 벡터와 위쪽 방향을 가리키는 벡터가 있어서 외적을 계산하면, 북서쪽 또는 남동쪽을 가리키는 벡터를 얻을 수 있다는 것입니다.
그 두 방향이 북동쪽과 위쪽과 모두 직교하기 때문이죠. 어떠한 순서로 외적을 계산하느냐에 따라 두 개의 벡터(북서쪽 또는 남동쪽) 중 어떤 벡터를 얻느냐가 결정됩니다.

어떤 경우든지간에 카메라의 <span class="z-axis">`zAxis`</span>와 <span style="color: gray;">`up`</span>의 외적을 계산하면, 
<span class="x-axis">xAxis</span>을 얻을 수 있습니다.

{{{diagram url="resources/cross-product-diagram.html?mode=1" caption="<span style='color:gray;'>up</span> cross <span class='z-axis'>zAxis</span> = <span class='x-axis'>xAxis</span>" }}}

이제 <span class="x-axis">`xAxis`</span>를 얻었기 때문에 <span class="z-axis">`zAxis`</span>와 <span class="x-axis">`xAxis`</span>를 외적하면
카메라의 <span class="y-axis">`yAxis`</span>를 얻을 수 있습니다.

{{{diagram url="resources/cross-product-diagram.html?mode=2" caption="<span class='z-axis'>zAxis</span> cross <span class='x-axis'>xAxis</span> = <span class='y-axis'>yAxis</span>"}}}

이제 남은 것은 이 3축을 행렬에 집어넣는 것입니다. 이 행렬은 `cameraPosition`으로부터 `target`을 가리키는 방향으로 자세를 변경합니다.
추가적으로 `position`만 더해주면 됩니다.

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
| <span class="x-axis">Xx</span> | <span class="x-axis">Xy</span> | <span class="x-axis">Xz</span> |  0 |  <- <span class="x-axis">x axis</span>
+----+----+----+----+
| <span class="y-axis">Yx</span> | <span class="y-axis">Yy</span> | <span class="y-axis">Yz</span> |  0 |  <- <span class="y-axis">y axis</span>
+----+----+----+----+
| <span class="z-axis">Zx</span> | <span class="z-axis">Zy</span> | <span class="z-axis">Zz</span> |  0 |  <- <span class="z-axis">z axis</span>
+----+----+----+----+
| Tx | Ty | Tz |  1 |  <- camera position
+----+----+----+----+
</pre></div>

아래는 두 벡터의 외적을 계산하는 코드입니다.


```
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
```

아래는 두 벡터를 빼는 코드입니다.


```
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
```

아래는 벡터를 정규화(normalize)하는 코드입니다 (단위 벡터로 바꿈).


```
function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // 0으로 나누지 않는지 확인.
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}
```

아래는 "lookAt" 행렬을 계산하는 코드입니다.


```
var m4 = {
  lookAt: function(cameraPosition, target, up) {
    var zAxis = normalize(
        subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));

    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  },
```


아래는 이 행렬을 사용하여 카메라가 움직이면서 특정 'F'를 계속 바라보도록 하는 방법입니다.


```
  ...

  // 첫 번째 F의 위치를 계산
  var fPosition = [radius, 0, 0];

  // 원 위의 위치를 계산하기 위해 행렬 계산을 활용함
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 50, radius * 1.5);

  // 우리가 계산한 행렬로부터 카메라 위치를 얻어옴
  var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];

  var up = [0, 1, 0];

  // look at을 사용하여 카메라 행렬을 계산
  var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

  // 카메라 행렬로부터 뷰 행렬을 계산
  var viewMatrix = m4.inverse(cameraMatrix);

  ...
```

아래는 결과입니다.

{{{example url="../webgl-3d-camera-look-at.html" }}}

슬라이더를 움직여 카메라가 특정 'F'를 따라가는 것을 확인하세요.

참고로 "lookAt" 계산은 카메라 이외에 다른 곳에도 사용할 수 있습니다. 자주 활용되는 예는 캐릭터의 머리를 무언가를 따라가도록 하는 것입니다.
또는 터렛이 대상을 조준하도록 하는 것도 있습니다. 또는 물체가 어떤 경로를 따라가는 것도 있습니다. 대상이 경로 위의 어느 위치에 있는지 우선 계산합니다.
그리고 얼마 뒤에 대상이 경로 위의 어느 위치에 있을지를 계산합니다. 그 두 위치를 `lookAt`함수에 넘겨주면 객체가 경로를 따라가면서 자신이 향할 방향을 바라보도록 하는 행렬을 구할 수 있습니다.

넘어가기 전에 [행렬의 이름에 대한 짧은 노트](webgl-matrix-naming.html)를 보면 좋습니다.

아니면 넘어가서 [애니메이션에 대해 배워봅시다](webgl-animation.html).


<div class="webgl_bottombar">
<h3>lookAt 표준</h3>
<p>대부분의 3D 수학 라이브러리에는 <code>lookAt</code> 함수가 있습니다. 
대부분 그 함수는 "카메라 행렬"이 아닌 "뷰 행렬"을 계산하도록 설계됩니다.
다시 말해, 카메라 자체를 움직이는 행렬이 아닌, 다른 물체를 카메라 앞으로 이동시키는 행렬을 계산합니다.
</p>
<p>
저는 그것이 덜 유용하다고 생각합니다. 언급했듯이, lookAt 함수는 다양한 사용 예가 있습니다.
뷰 행렬이 필요할 때 <code>inverse</code>를 호출하는 편이 편리합니다.
캐릭터의 머리를 움직이거나, 터렛의 조준 방향을 계산하거나 하는 데에는 <code>lookAt</code>이 월드 공간에서 객체의 위치와 방향을 반환하는 것이 훨씬 편리하다는 것이 제 생각입니다.
</p>
{{{example url="../webgl-3d-camera-look-at-heads.html" }}}
</div>



