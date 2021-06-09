Title: WebGL2 3D - 스팟 조명 효과(Spot Lighting)
Description: WebGL에서 스팟 조명 효과를 구현하는 방법
TOC: 스팟 조명 효과(Spot Lighting)


이 글은 [WebGL 3D 점 조명 효과](webgl-3d-lighting-point.html)에서 이어지는 글입니다.
이전 글을 아직 읽지 않았다면 [먼저 읽어 보시길 권장합니다](webgl-3d-lighting-point.html).

지난 글에서는 물체의 모든 점마다 빛이 그 점을 향하는 방향 벡터를 계산하는 점 조명 효과에 대해 다뤘습니다.
그 이후 과정은 [방향성 조명 효과](webgl-3d-lighting-directional.html)와 동일한데, 
표면의 법선(표면이 바라보는 방향)과 조명 방향을 내적하는 것이었습니다.
두 방향이 동일한 경우 값이 1이되고, 완전히 비춰지게(fully lit) 됩니다. 
만일 두 방향이 수직하다면 0이 되고, 반대라면 -1이 됩니다. 
우리는 이 값을 표면의 색상에 직접 곱해서 조명 효과를 얻었습니다.

스팟 조명 효과(spot lighting)는 아주 약간 다를 뿐입니다.
사실 지금까지 해온 내용에 여러분이 약간의 창의력만 더하면 스스로 구현하는 방법을 찾으실 수 있을 겁니다.

점 조명은 어떤 위치에서 모든 방향으로 빛이 뻗어나가는 조명으로 생각할 수 있습니다.
스팟 조명을 구현하기 위해서는 위치를 중심으로 빛이 향하는 특정 방향을 정해야 합니다.
그리고 빛이 향하는 방향마다 그 방향과 우리가 정한 특정 방향와의 내적을 해 줍니다.
임의로 어떤 제한값을 정해서 제한값 이내이면 빛을 비추고, 제한값 밖이면 빛을 비추지 않도록 하는겁니다.

{{{diagram url="resources/spot-lighting.html" width="500" height="400" className="noborder" }}}

다이어그램에서 모든 방향으로 뻗어나가는 광선을 볼 수 있고, 각 광선에는 특정 방향과의 내적값이 표시되어 있습니다.
특정 **방향**은 스팟 조명의 방향입니다.
제한값을 정하면 (위쪽에 degree 단위로 나타내고 있습니다.) 그 제한값으로부터 *내적 제한값*을 계산하는데, 이는 제한값의 코사인 값입니다. 
스팟 조명의 방향과 광선 방향을 내적했을 때 내적 제한값보다 크다면 빛을 비춥니다. 그렇지 않으면 비추지 않습니다.

다른 방식으로 설명해 보자면, 예를 들어 제한값이 20도라고 합시다. 
이를 라디안으로 변환하고 코사인을 취해 -1과 1사이의 값으로 변환합니다. 
이를 내적 공간이라고 합시다. 
다시말해 아래 표와 같은 제한값이 있다고 합시다.

              limits in
     degrees | radians | dot space
     --------+---------+----------
        0    |   0.0   |    1.0
        22   |    .38  |     .93
        45   |    .79  |     .71
        67   |   1.17  |     .39
        90   |   1.57  |    0.0
       180   |   3.14  |   -1.0

그러면 아래와 같은 체크를 하기만 하면 됩니다.

    dotFromDirection = dot(surfaceToLight, -lightDirection)
    if (dotFromDirection >= limitInDotSpace) {
       // 조명 효과 계산
    }

한번 해 봅시다.

먼저 지난 [지난 글](webgl-3d-lighting-point.html)의 프래그먼트 셰이더를 수정합시다.

```glsl
#version 300 es
precision highp float;

// 정점 셰이더에서 넘어온 값
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_limit;          // 내적 공간에서의 값

// 프래그먼트 셰이더에서는 출력값을 선언해야 합니다.
out vec4 outColor;

void main() {
  // v_normal은 보간되는 varying 이기 때문에 단위 벡터가 아닙니다.
  // 정규화를 해야 다시 단위 벡터가 됩니다.
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

-  float light = dot(normal, surfaceToLightDirection);
+  float light = 0.0;
  float specular = 0.0;

+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  if (dotFromDirection >= u_limit) {
*    light = dot(normal, surfaceToLightDirection);
*    if (light > 0.0) {
*      specular = pow(dot(normal, halfVector), u_shininess);
*    }
+  }

  outColor = u_color;

  // 알파를 제외한 색상 부분만 light값을 곱해줍니다.
  outColor.rgb *= light;

  // specular 값을 더해줍니다.
  outColor.rgb += specular;
}
```

당연히 방금 추가한 uniform들의 위치를 가지고 있어야 합니다.

```js
  var lightDirection = [?, ?, ?];
  var limit = degToRad(20);

  ...

  var lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
  var limitLocation = gl.getUniformLocation(program, "u_limit");
```

그리고 값을 설정해 주어야 합니다.

```js
    gl.uniform3fv(lightDirectionLocation, lightDirection);
    gl.uniform1f(limitLocation, Math.cos(limit));
```

결과는 아래와 같습니다.

{{{example url="../webgl-3d-lighting-spot.html" }}}

몇 가지 주의사항입니다: 먼저 위 코드에서 `u_lightDirection`의 방향을 뒤집었다는 것입니다.
구현하는 방법은 두 가지가 있습니다. 우리가 필요한 건 비교하는 두 개의 방향이 동일하도록 맞춰주는 것입니다.
즉, surfaceToLightDirection과 스팟 조명의 반대 방향을 비교해야 한다는 것입니다.
여러가지 다른 방식으로 구현할 수 있는데, uniform 값을 설정할때 방향을 뒤집어서 전달해 줄 수도 있습니다.
저라면 이렇게 하겠지만 uniform을 `u_lightDirection`라고 이름짓는 것이 
`u_reverseLightDirection` 또는 `u_negativeLightDirection`보다 덜 헷갈릴 것으로 생각됩니다.

다른 하나는 개인 선호도에 달린 것이긴 한데, 저는 가능하면 셰이더에 조건문을 사용하지 않으려 합니다.
아마도 그 이유는 실제로는 셰이더에 조건문이 없기 때문입니다.
셰이더에 조건문을 사용하게 되면 셰이더 컴파일러가 코드를 여기저기 0과 1을 곱하는 식으로 확장해서 실제로는 조건문이 없는 형태로 바꿉니다. 
그 말은 조건문을 사용하면 조합하는 만큼 코드가 길어진다는 뜻입니다.
지금도 그런지는 확실하진 않지만 어쨋든 몇 가지 기술을 보여드리는 겸 해서 조건문을 없애 보겠습니다.
조건문을 사용할지 말지는 여러분이 스스로 결정하시면 됩니다.

GLSL에는 `step`이라는 함수가 있습니다. 
2개의 값을 인자로 받는데 두 번째 값이 첫 번째 값보다 크거나 같으면 1.0을 반환합니다.
그렇지 않으면 0을 반환합니다. 아래 자바스크립트 코드처럼요.

    function step(a, b) {
       if (b >= a) {
           return 1;
       } else {
           return 0;
       }
    }

조건문을 없애기 위해 `step`을 사용해 봅시다.

```glsl
  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
  // spotLight 영역 안이면 inLight는 1이되고 아니면 0이 됩니다.
  float inLight = step(u_limit, dotFromDirection);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);
```

보기에는 결과가 동일하지만 결과는 아래와 같습니다.

{{{example url="../webgl-3d-lighting-spot-using-step.html" }}}

다른 하나는 스팟 라이트의 경계가 매우 거칠다는 것입니다. 
스팟 라이트 영역 안에 있거나 밖에 있거나 둘 중 하나고 밖에 있다면 완전히 어둡습니다.

이것을 수정하기 위해서 하나의 경계값 대신 안쪽 경계값과 바깥쪽 경계값, 두 개의 경계값을 사용할 수 있습니다.
안쪽 경계값 안에 있으면 1.0을 사용합니다. 그리고 바깥쪽 경계값 밖에 있으면 0.0을 사용합니다.
안쪽 경계값과 바깥쪽 경계값 사이라면 1.0과 0.0 사이의 값을 lerp(linear interpolation)합니다.

아래는 구현 방법 중 하나입니다.

```glsl
-uniform float u_limit;          // 내적 공간에서의 값
+uniform float u_innerLimit;     // 내적 공간에서의 값
+uniform float u_outerLimit;     // 내적 공간에서의 값

...

  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
-  float inLight = step(u_limit, dotFromDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

```

잘 동작하네요.

{{{example url="../webgl-3d-lighting-spot-falloff.html" }}}

이제 좀 더 스팟 라이트처럼 보이는 결과를 얻었습니다!

하나 주의해야 할 것은 `u_innerLimit`와 `u_outerLimit`값이 같으면 `limitRange`값이 0.0이 된다는 것입니다.
이후 계산에서 `limitRange`로 나누는데, 0으로 나누는 것은 나쁜/정의되지 않은 결과가 도출됩니다.
셰이더 코드 안에서 우리가 무언가 할 수 있는것은 없고, 자바스크립트 코드 안에서 `u_innerLimit`와 `u_outerLimit`가 같은 값이 되지 않도록 해야 합니다. (주의: 예제 코드에서 이 작업을 하고 있지는 앖습니다.)

GLSL에도 이러한 작업을 약간 간단한게 할 수 있는 함수가 있습니다.
`smoothstep`이라는 함수인데 `step`처럼 0과 1 사이의 값을 반환하지만 하한값과 상한값을 모두 인자로 받아서 그 범위 안에서 lerp한 값을 반환합니다.

     smoothstep(lowerBound, upperBound, value)

사용해 봅시다.

```glsl
  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
  float inLight = smoothstep(u_outerLimit, u_innerLimit, dotFromDirection);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);
```

마찬가지로 잘 동작합니다.

{{{example url="../webgl-3d-lighting-spot-falloff-using-smoothstep.html" }}}

차이점이라면 `smoothstep`은 선형 보간 대신 hermite 보간을 한다는 것입니다.
그 말은 `lowerBound`와 `upperBound` 사이 값을 아래 오른쪽 그림처럼 보간한다는 것입니다.
반면 선형 보간은 아래 왼쪽 그림처럼 보간합니다.

<img class="webgl_center invertdark" src="resources/linear-vs-hermite.png" />

그 차이에 신경쓸 것인지 아닌지는 여러분에게 달려 있습니다.

하나 더 주의해야 할 것은 `smoothstep`함수는 `lowerBound`가 `upperBound`보다 크거나 같으면 정의되지 않은 결과가 도출됩니다.
두 값이 동일하면 위에서 언급한 것과 같은 동일한 문제가 발생합니다.
추가로 `lowerBound`가 `upperBound`보다 클 때 새로운 이슈가 발생하지만 스팟 조명의 목적상 이러한 경우는 없어야 합니다.

<div class="webgl_bottombar">
<h3>GLSL에서 정의되지 않은 동작에 주의하세요</h3>
<p>
GLSL의 몇몇 함수는 특정한 값에 대해 정의되지 않은 동작을 불러일으킵니다.
<code>pow</code>함수를 사용하여 음수를 거듭제곱하려고 하는 것이 하나의 예인데, 결과가 허수가 될 수 있기 떄문입니다.
위 글에서 <code>smoothstep</code>에 대한 예도 살펴봤습니다.
</p>
<p>
이러한 경우를 주의해야 하는데 여러분의 셰이더가 다른 머신에서 다른 결과를 도출할 수 있기 때문입니다.
<a href="https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf">명세의 섹션 8</a>에 모든 내장 함수와 그것들의 기능, 정의되지 않은 동작을 불러일으킬 수 있는지 여부가 나열되어 있습니다.
</p>
<p>아래는 정의되지 않은 동작들의 리스트입니다. <code>genType</code>은 <code>float</code>, <code>vec2</code>, <code>vec3</code>, 또는 <code>vec4</code>를 의미압니다.</p>
  <pre class="prettyprint"><code>genType asin (genType x)</code></pre><p>
  아크사인 입니다. 사인을 취하면 x가 되는 각도를 반환합니다.
이 함수에 의해 반환되는 값의 범위는 [−π/2, π/2]입니다.
만일 ∣x∣ > 1이라면 정의되지 않은 동작을 불러일으킵니다.</p>


<pre class="prettyprint"><code>genType acos (genType x)</code></pre><p>
아크코사인입니다. 코사인을 취하면 x가 되는 각도를 반환합니다.
이 함수에 의해 반환되는 값의 범위는 [0, π]입니다.
만일 ∣x∣ > 1이라면 정의되지 않은 동작을 불러일으킵니다.</p>



<pre class="prettyprint"><code>genType atan (genType y, genType x)</code></pre><p>
아크탄젠트입니다. 탄젠트를 취하면 y/x가 되는 각도를 반환합니다.
x와 y의 부호가 반환되는 각도가 어느 사분면인지를 결정합니다.
이 함수에 의해 반환되는 값의 범위는 [−π,π]입니다.
만일 x와 y가 모두 0이라면 정의되지 않은 동작을 불러일으킵니다.</p>

<pre class="prettyprint"><code>genType acosh (genType x)</code></pre><p>
아크 쌍곡(hyperbolic) 코사인입니다. cosh의 음수가 아닌 역을 반환합니다.
만일 x < 1이라면 정의되지 않은 동작을 불러일으킵니다.</p>

<pre class="prettyprint"><code>genType atanh (genType x)</code></pre><p>
아크 쌍곡(hyperbolic) 탄젠트입니다. tanh의 음수가 아닌 역을 반환합니다.
만일 ∣x∣≥1이라면 정의되지 않은 동작을 불러일으킵니다.</p>

<pre class="prettyprint"><code>genType pow (genType x, genType y)</code></pre><p>
x를 y제곱한 결과를 반환합니다. 즉, x<sup>y</sup>입니다.
만일 x < 0이라면 정의되지 않은 동작을 불러일으킵니다.
만일 x = 0이고 y <= 0이라면 정의되지 않은 동작을 불러일으킵니다.</p>


<pre class="prettyprint"><code>genType log (genType x)</code></pre><p>
x의 자연로그를 반환합니다. 즉, x = e<sup>y</sup>를 만족하는 y를 반환합니다.
만일 x <= 0이라면 정의되지 않은 동작을 불러일으킵니다.</p>


<pre class="prettyprint"><code>genType log2 (genType x)</code></pre><p>
x의 밑이 2인 로그값을 반환합니다. 즉, x=2<sup>y</sup>를 만족하는 y를 반환합니다.
만일 x <= 0이라면 정의되지 않은 동작을 불러일으킵니다.</p>



<pre class="prettyprint"><code>genType sqrt (genType x)</code></pre><p>
√x를 반환합니다.
만일 x < 0이라면 정의되지 않은 동작을 불러일으킵니다.</p>


<pre class="prettyprint"><code>genType inversesqrt (genType x)</code></pre><p>
1/√x를 반환합니다.
만일 x <= 0이라면 정의되지 않은 동작을 불러일으킵니다.</p>


<pre class="prettyprint"><code>genType clamp (genType x, genType minVal, genType maxVal)
genType clamp (genType x, float minVal, float maxVal)</code></pre><p>
min (max (x, minVal), maxVal)를 반환합니다.
만일 minVal > maxVal이라면 정의되지 않은 동작을 불러일으킵니다.</p>



<pre class="prettyprint"><code>genType smoothstep (genType edge0, genType edge1, genType x)
genType smoothstep (float edge0, float edge1, genType x)</code></pre><p>
x <= edge0이면 0.0을, x >= edge1이면 1.0을 반환하고 edge0 < x < edge1이면 0과 1사이의 smooth Hermite interpolation 결과를 반환합니다.
부드러운 값의 전환을 문턱값과 함께 사용하고 싶을 때 유용합니다.
이는 아래 코드와 같습니다:
</p>
<pre class="prettyprint">
 genType t;
 t = clamp ((x – edge0) / (edge1 – edge0), 0, 1);
 return t * t * (3 – 2 * t);
</pre>
<p>edge0 >= edge1이라면 정의되지 않은 동작을 불러일으킵니다.</p>


<pre class="prettyprint"><code>mat2 inverse(mat2 m)
mat3 inverse(mat3 m)
mat4 inverse(mat4 m)</code></pre><p>
m의 역행렬을 반환합니다. 입력 행렬 m은 변하지 않습니다.
m이 특이(singular)행렬이거나 조건이 나쁜경우(특이행렬에 가까운 경우) 반환값은 정의되지 않습니다.
</p>


</div>

