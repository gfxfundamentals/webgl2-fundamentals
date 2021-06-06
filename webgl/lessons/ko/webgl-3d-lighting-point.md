Title: WebGL2 3D - 점 조명 효과(Point Lighting)
Description: WebGL에서 점 조명 효과를 구현하는 방법
TOC: 점 조명 효과(Point Lighting)


이 글은 [WebGL 3D 방향성 조명 효과](webgl-3d-lighting-directional.html)에서 이어지는 글입니다.
이전 글을 아직 읽지 않았다면 [먼저 읽어 보시길 권장합니다.](webgl-3d-lighting-directional.html).

지난번 글에서 우리는 빛이 항상 같은 방향에서 들어오는 방향성 조명 효과에 대해 다루어 보았습니다.
렌더링을 수행하기 이전에 빛이 들어오는 방향을 설정했었습니다.

대신에 빛의 방향을 설정하기 위해 3차원 공간상의 한 점에 존재하는 조명을 가정하고
셰이더에서는 모델 표면 위의 어느 위치에서건 조명의 방향을 계산하도록 하면 어떨까요?
그렇게 하면 우리는 점 조명(point light)를 표현할 수 있게 됩니다.

{{{diagram url="resources/point-lighting.html" width="500" height="400" className="noborder" }}}

표면을 돌려보면 표면 위의 각 점의 *표면에서 조명을 향하는* 벡터가 어떻게 달라지는지를 보실 수 있을겁니다.
표면 법선과 각 조명 벡터를 내적하면 각각 표면 위치에서는 다른 결과값이 계산됩니다.

한번 해 봅시다.

먼저 조명의 위치가 필요합니다.

    uniform vec3 u_lightWorldPosition;

그리고 표면의 월드 공간산의 위치를 계산할 수 있는 방법이 필요합니다.
그러려면 위치값을 월드 행렬로 곱하면 됩니다 따라서...

    uniform mat4 u_world;

    ...

    // 표면의 월드 공간상 위치를 계산
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

이어서 이전과 유사하게 표면에서 조명을 향하는 벡터를 계산할 수 있습니다.
이번에는 표면위의 모든 위치값마다 점 (조명)까지의 방향을 계산한다는 것이 다릅니다.

    v_surfaceToLight = u_lightPosition - surfaceWorldPosition;

전체적으로 보면 아래와 같습니다.

    #version 300 es

    in vec4 a_position;
    in vec3 a_normal;

    +uniform vec3 u_lightWorldPosition;

    +uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    out vec3 v_normal;
    +out vec3 v_surfaceToLight;

    void main() {
      // 위치값을 행렬과 곱해줍니다
      gl_Position = u_worldViewProjection * a_position;

      // 법선의 방향을 바꾸어 프래그먼트 셰이더로 전달합니다.
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

    +  // 표면의 월드 공간상 위치를 계산합니다.
    +  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    +
    +  // 표면에서 조명을 향하는 벡터를 계산하고 프래그먼트 셰이더로 전달합니다.
    +  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    }

이제 프래그먼트 셰이더에서는 표면에서 조명을 향하는 벡터가 단위 벡터가 아니기 때문에 정규화해야 합니다.
정점 셰이더에서 정규화를 할 수도 있지만 *varying*이기 때문에 각 위치마다 값이 선형 보간되고,
프래그먼트 셰이더에서는 그 보간된 벡터는 단위 벡터가 아닙니다.

    #version 300 es
    precision highp float;

    // 정점 셰이더에서 넘어온 값
    in vec3 v_normal;
    +in vec3 v_surfaceToLight;

    -uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    // 프래그먼트 셰이더에서는 출력값을 선언해야 합니다.
    out vec4 outColor;

    void main() {
      // v_normal은 보간되는 varying 이기 때문에 단위 벡터가 아닙니다.
      // 정규화를 해야 다시 단위 벡터가 됩니다.
      vec3 normal = normalize(v_normal);

      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

    -  float light = dot(v_normal, u_reverseLightDirection);
    +  float light = dot(v_normal, surfaceToLightDirection);

      outColor = u_color;

      // 알파를 제외한 색상 부분만 light값을 곱해줍니다.
      outColor.rgb *= light;
    }

`u_world`와 `u_lightWorldPosition`의 위치를 찾아야 합니다.

```
-  var reverseLightDirectionLocation =
-      gl.getUniformLocation(program, "u_reverseLightDirection");
+  var lightWorldPositionLocation =
+      gl.getUniformLocation(program, "u_lightWorldPosition");
+  var worldLocation =
+      gl.getUniformLocation(program, "u_world");
```

그리고 값을 설정해 줍니다.

```
  // 행렬값을 설정
+  gl.uniformMatrix4fv(
+      worldLocation, false,
+      worldMatrix);
  gl.uniformMatrix4fv(
      worldViewProjectionLocation, false,
      worldViewProjectionMatrix);

  ...

-  // 조명 방향을 설정
-  gl.uniform3fv(reverseLightDirectionLocation, normalize([0.5, 0.7, 1]));
+  // 조명 위치를 설정
+  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 50]);
```

결과는 이렇게 됩니다.

{{{example url="../webgl-3d-lighting-point.html" }}}

이제 점 조명이 있으니 반사 하이라이트(specular highlighting)라 불리는 효과를 추가할 수 있습니다.

실제 세상에서 물체를 볼 때, 물체가 밝게 빛나는 것은 표면에서 빛을 당신쪽으로 직접 반사하기 때문입니다. 마치 거울처럼요.

<img class="webgl_center" src="resources/specular-highlights.jpg" />

빛이 눈에 직접 반사되는지를 계산하여 이 효과를 모사할 수 있습니다.
여기서도 *내적*을 활용할 수 있습니다.

무엇을 확인해야 하는걸까요? 생각해 봅시다.
빛이 표면에 닿으면 동일한 각도로 반사되기 때문에, 표면-빛의 각도와 표면-눈의 각도가 같으면 그 각도는 빛이 표면에서 눈으로 직접 반사되는 완전한 반사 각도입니다.

{{{diagram url="resources/surface-reflection.html" width="500" height="400" className="noborder" }}}

모델의 표면에서 조명을 향하는 방향을 알 수 있다면(위에서 보셨다시피 이미 우리는 이 값을 계산할 수 있었습니다.),
그리고 표면에서 뷰/눈/카메라를 향하는 방향을 할 수 있다면(이 값은 우리가 계산할 수 있는 값입니다.), 이 두 벡터를 더하고 정규화해서
`halfVector`라 불리는 벡터를 얻을 수 있습니다. 이 벡터는 두 벡터의 중간에 위치한 벡터입니다. 
halfVector와 표면의 법선이 동일하면 빛이 뷰/눈/카메라로 완벽히 반사되는 각도라는 뜻입니다.
동일하다는 것은 어떻게 알 수 있을까요? 전에 한것처럼 *내적*하면 됩니다.
1이면 동일하다는 뜻이고, 0이면 수직하다는 뜻입니다. -1이면 반대 방향이라는 뜻이고요.

{{{diagram url="resources/specular-lighting.html" width="500" height="400" className="noborder" }}}

그러니 우선 해야 할 일은 뷰/눈/카메라 위치를 전달하고, 표면에서 뷰를 향하는 벡터를 계산하여 프래그먼트 셰이더로 넘기는 것입니다.

    #version 300 es

    in vec4 a_position;
    in vec3 a_normal;

    uniform vec3 u_lightWorldPosition;
    +uniform vec3 u_viewWorldPosition;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    out vec3 v_surfaceToLight;
    +out vec3 v_surfaceToView;

    void main() {
      // 위치값을 행렬과 곱해줍니다
      gl_Position = u_worldViewProjection * a_position;

      // 법선의 방향을 바꾸어 프래그먼트 셰이더로 전달합니다.
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

      // 표면의 월드 공간상 위치를 계산합니다.
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;

      // 표면에서 조명을 향하는 벡터를 계산하고 프래그먼트 셰이더로 전달합니다.
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    +  // 표면에서 뷰/카메라를 향하는 벡터를 계산하고 프래그먼트 셰이더로 전달합니다.
    +  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }

다음으로 프래그먼트 셰이더에서는 표면에서 뷰를 향하는 벡터와 표면에서 조명을 향하는 벡터의 사이 벡터인 
`halfVector`를 계산해야 합니다. 그리고 `halfVector`와 법선 벡터의 내적을 통해
빛이 뷰 방향으로 반사되는지를 알아내야 합니다.


    // 정점 셰이더에서 넘어온 값
    in vec3 v_normal;
    in vec3 v_surfaceToLight;
    +in vec3 v_surfaceToView;

    uniform vec4 u_color;

    out vec4 outColor;

    void main() {
      // v_normal은 보간되는 varying 이기 때문에 단위 벡터가 아닙니다.
      // 정규화를 해야 다시 단위 벡터가 됩니다.
      vec3 normal = normalize(v_normal);

    +  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    +  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    +  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

      float light = dot(normal, surfaceToLightDirection);
    +  float specular = dot(normal, halfVector);

      outColor = u_color;

	  // 알파를 제외한 색상 부분만 light값을 곱해줍니다.
      outColor.rgb *= light;

    +  // specular 값을 더해줍니다.
    +  outColor.rgb += specular;
    }

마지막으로 `u_viewWorldPosition`을 찾아서 값을 설정해야 합니다.

    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    +var viewWorldPositionLocation =
    +    gl.getUniformLocation(program, "u_viewWorldPosition");

    ...

    // 카메라 행렬을 계산
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = makeLookAt(camera, target, up);

    ...

    +// 카메라/뷰 위치를 설정
    +gl.uniform3fv(viewWorldPositionLocation, camera);


아래는 그 결과입니다.

{{{example url="../webgl-3d-lighting-point-specular.html" }}}

**으악 너무 밝습니다!**

밝기 문제를 내적값의 제곱을 통해 고칠 수 있습니다. 
이렇게 하면 반사 하이라이트의 감쇄를 선형 감쇄에서 지수 감쇄로 바꿀 수 있습니다.


{{{diagram url="resources/power-graph.html" width="300" height="300" className="noborder" }}}

빨간 선이 그래프 위쪽에 올수록 우리가 더하는 반사값이 더 밝아집니다.
제곱값을 키움으로써 밝아지는 범위를 오른쪽으로 줄일 수 있습니다.

그 값을 `shininess`라 하고, 셰이더에 추가 해주겠습니다.

    uniform vec4 u_color;
    +uniform float u_shininess;

    ...

    -  float specular = dot(normal, halfVector);
    +  float specular = 0.0;
    +  if (light > 0.0) {
    +    specular = pow(dot(normal, halfVector), u_shininess);
    +  }

내적값이 음수가 될 수도 있습니다. WebGL에서 음수값의 제곱은 정의되지 않은(undefined) 결과를 나타내고, 이는 좋지 않습니다.
따라서 내적값이 음수가 되면 우리는 그냥 specular를 0.0으로 설정할 것입니다.

당연히 해당 위치를 찾아서 값을 설정해 줘야겠죠.

    +var shininessLocation = gl.getUniformLocation(program, "u_shininess");

    ...

    // shininess 값을 설정
    gl.uniform1f(shininessLocation, shininess);

결과는 아래와 같습니다.

{{{example url="../webgl-3d-lighting-point-specular-power.html" }}}

이 글에서 마지막으로 이야기하고 싶은건 조명의 색상입니다.

지금까지는 `light`를 우리가 F에 설정한 색상에 곱하는 데에만 사용해 왔습니다.
만일 색상이 있는 조명 효과를 원한다면 조명 색상값을 줄 수도 있습니다.


    uniform vec4 u_color;
    uniform float u_shininess;
    +uniform vec3 u_lightColor;
    +uniform vec3 u_specularColor;

    ...

      // 알파를 제외한 색상 부분만 light값을 곱해줍니다.
    *  outColor.rgb *= light * u_lightColor;

      // specular 값을 더해줍니다.
    *  outColor.rgb += specular * u_specularColor;
    }

그리고 당연히 아래 코드와

    +  var lightColorLocation =
    +      gl.getUniformLocation(program, "u_lightColor");
    +  var specularColorLocation =
    +      gl.getUniformLocation(program, "u_specularColor");

아래 코드가 필요합니다.

    +  // 조명 색상을 설정
    +  gl.uniform3fv(lightColorLocation, normalize([1, 0.6, 0.6]));  // 빨간색 조명
    +  // 반사 색상을 설정
    +  gl.uniform3fv(specularColorLocation, normalize([1, 0.6, 0.6]));  // 빨간색 조명

{{{example url="../webgl-3d-lighting-point-color.html" }}}

다음 글은 [스팟 조명 효과(spot lighting)](webgl-3d-lighting-spot.html)입니다.

<div class="webgl_bottombar">
<h3>왜 <code>pow(negative, power)</code>가 정의되지 않음(undefined) 인가요?</h3>
<p>이게 무슨 의미일까요?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 2)</pre></div>
<p>아래처럼 생각할 수 있습니다.</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 = 25</pre></div>
<p>이건 어떤가요</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 3)</pre></div>
<p>아래처럼 생각할 수 있습니다.</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 * 5 = 125</pre></div>
<p>그럼 이건 어떤가요</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2)</pre></div>
<p>아래처럼 생각할 수 있습니다.</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 = 25</pre></div>
<p>그리고</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 3)</pre></div>
<p>아래처럼 생각할 수 있습니다.</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 * -5 = -125</pre></div>
<p>아시다시피 음수에 음수를 곱하면 양수가 되고, 여기에 다시 음수를 곱하면 음수가 됩니다.</p>
<p>그러면 아래는 어떤 의미일까요?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2.5)</pre></div>
<p>결과는 양수일까요 음수일까요? 그건 <a href="https://betterexplained.com/articles/a-visual-intuitive-guide-to-imaginary-numbers/">허수의 영역입니다</a>.</p>
</div>

