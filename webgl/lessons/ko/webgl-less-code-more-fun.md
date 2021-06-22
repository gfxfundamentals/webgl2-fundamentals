Title: WebGL2 - 더 적은 코드로 즐겁게 코딩하기
Description: WebGL 프로그래밍 코드를 줄이는 방법
TOC: 더 적은 코드로 즐겁게 코딩하기


이 글은 WebGL 시리즈에서 이어지는 글입니다.
첫 번째는 [WebGL 기초](webgl-fundamentals.html)입니다.
아직 위 글을 읽지 않았다면 먼저 읽어 보시기 바랍니다.

WebGL 프로그래밍을 위해서 여러분은 셰이더 프로그램을 작성한뒤 컴파일과 링킹을 수행해야 하고,
그 셰이더에 필요한 입력값의 location을 찾아야 합니다.
이러한 입력값들은 uniform과 attribute라고 하고 이를 위한 location을 찾는 코드를 작성하는 것은 길고 지루합니다.

<a href="webgl-boilerplate.html">셰이더 프로그램의 컴파일과 링킹을 위한 기본적인 boilerplate WebGL코드</a>가 이미 있다고 가정하고,
아래와 같은 셰이더를 작성했다고 해 보죠.

정점 셰이더:

```
#version 300 es

uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

out vec4 v_position;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
}
```

프래그먼트 셰이더:

```
#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

out vec4 outColor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  outColor = vec4((
    u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
    diffuseColor.a);
}
```

그러면 화면에 그릴 때 필요한 다양한 값들을 찾고 설정하기 위해서는 아래와 같은 코드를 작성해야만 할 겁니다.

```
// 초기화 시점에
var u_worldViewProjectionLoc   = gl.getUniformLocation(program, "u_worldViewProjection");
var u_lightWorldPosLoc         = gl.getUniformLocation(program, "u_lightWorldPos");
var u_worldLoc                 = gl.getUniformLocation(program, "u_world");
var u_viewInverseLoc           = gl.getUniformLocation(program, "u_viewInverse");
var u_worldInverseTransposeLoc = gl.getUniformLocation(program, "u_worldInverseTranspose");
var u_lightColorLoc            = gl.getUniformLocation(program, "u_lightColor");
var u_ambientLoc               = gl.getUniformLocation(program, "u_ambient");
var u_diffuseLoc               = gl.getUniformLocation(program, "u_diffuse");
var u_specularLoc              = gl.getUniformLocation(program, "u_specular");
var u_shininessLoc             = gl.getUniformLocation(program, "u_shininess");
var u_specularFactorLoc        = gl.getUniformLocation(program, "u_specularFactor");

var a_positionLoc              = gl.getAttribLocation(program, "a_position");
var a_normalLoc                = gl.getAttribLocation(program, "a_normal");
var a_texCoordLoc              = gl.getAttribLocation(program, "a_texcoord");

// 모든 버퍼와 attribute를 설정 (이미 버퍼는 생성되어 있다고 가정합니다.)
var vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(a_positionLoc);
gl.vertexAttribPointer(a_positionLoc, positionNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.enableVertexAttribArray(a_normalLoc);
gl.vertexAttribPointer(a_normalLoc, normalNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.enableVertexAttribArray(a_texcoordLoc);
gl.vertexAttribPointer(a_texcoordLoc, texcoordNumComponents, gl.FLOAT, 0, 0);

// (사용 방식에 따라서)초기화 시점 또는 그리는 시점에
var someWorldViewProjectionMat = computeWorldViewProjectionMatrix();
var lightWorldPos              = [100, 200, 300];
var worldMat                   = computeWorldMatrix();
var viewInverseMat             = computeInverseViewMatrix();
var worldInverseTransposeMat   = computeWorldInverseTransposeMatrix();
var lightColor                 = [1, 1, 1, 1];
var ambientColor               = [0.1, 0.1, 0.1, 1];
var diffuseTextureUnit         = 0;
var specularColor              = [1, 1, 1, 1];
var shininess                  = 60;
var specularFactor             = 1;

// 그리는 시점에
gl.useProgram(program);
gl.bindVertexArray(vao);

// 사용할 텍스처 설정
gl.activeTexture(gl.TEXTURE0 + diffuseTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);

// uniform 설정
gl.uniformMatrix4fv(u_worldViewProjectionLoc, false, someWorldViewProjectionMat);
gl.uniform3fv(u_lightWorldPosLoc, lightWorldPos);
gl.uniformMatrix4fv(u_worldLoc, worldMat);
gl.uniformMatrix4fv(u_viewInverseLoc, viewInverseMat);
gl.uniformMatrix4fv(u_worldInverseTransposeLoc, worldInverseTransposeMat);
gl.uniform4fv(u_lightColorLoc, lightColor);
gl.uniform4fv(u_ambientLoc, ambientColor);
gl.uniform1i(u_diffuseLoc, diffuseTextureUnit);
gl.uniform4fv(u_specularLoc, specularColor);
gl.uniform1f(u_shininessLoc, shininess);
gl.uniform1f(u_specularFactorLoc, specularFactor);

gl.drawArrays(...);
```

코드가 정말 기네요.

이를 단순화 하기위한 다양한 방법이 있습니다.
추천하는 방법 중 하나는 WebGL에 필요한 uniform, attribute들과 그 location을 요청하고 값을 설정하는 함수를 만드는 것입니다.
그리는 자바스크립트 객체를 그 함수로 넘김으로써 그 작업을 훨씬 쉽게 수행할 수 있습니다.
잘 이해가 안되신다면, 아래 코드 예제를 한번 보십시오.

```
// 초기화 시점에
var uniformSetters = twgl.createUniformSetters(gl, program);
var attribSetters  = twgl.createAttributeSetters(gl, program);

// 모든 버퍼와 attribute 설정
var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};
var vao = twgl.createVAOAndSetAttributes(
    gl, attribSetters, attribs);

// (사용 방식에 따라서)초기화 시점 또는 그리는 시점에
var uniforms = {
  u_worldViewProjection:   computeWorldViewProjectionMatrix(...),
  u_lightWorldPos:         [100, 200, 300],
  u_world:                 computeWorldMatrix(),
  u_viewInverse:           computeInverseViewMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
  u_lightColor:            [1, 1, 1, 1],
  u_ambient:               [0.1, 0.1, 0.1, 1],
  u_diffuse:               diffuseTexture,
  u_specular:              [1, 1, 1, 1],
  u_shininess:             60,
  u_specularFactor:        1,
};

// 그리기 시점에
gl.useProgram(program);

// 모든 버퍼와 attribute 설정을 갖고있는 VAO를 바인딩
gl.bindAttribArray(vao);

// 사용할 uniform과 텍스처들을 설정
twgl.setUniforms(uniformSetters, uniforms);

gl.drawArrays(...);
```

아까보다 훨씬 짧고, 간결해 보입니다.

편의에 따라 여러 개의 자바스크립트 객체를 사용할 수도 있습니다.
예를들어,

```
// 초기화 시점에
var uniformSetters = twgl.createUniformSetters(gl, program);
var attribSetters  = twgl.createAttributeSetters(gl, program);

// 모든 버퍼와 attribute 설정
var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};
var vao = twgl.createVAOAndSetAttributes(gl, attribSetters, attribs);

// (사용 방식에 따라서)초기화 시점 또는 그리는 시점에
var uniformsThatAreTheSameForAllObjects = {
  u_lightWorldPos:         [100, 200, 300],
  u_viewInverse:           computeInverseViewMatrix(),
  u_lightColor:            [1, 1, 1, 1],
};

var uniformsThatAreComputedForEachObject = {
  u_worldViewProjection:   perspective(...),
  u_world:                 computeWorldMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
};

var objects = [
  { translation: [10, 50, 100],
    materialUniforms: {
      u_ambient:               [0.1, 0.1, 0.1, 1],
      u_diffuse:               diffuseTexture,
      u_specular:              [1, 1, 1, 1],
      u_shininess:             60,
      u_specularFactor:        1,
    },
  },
  { translation: [-120, 20, 44],
    materialUniforms: {
      u_ambient:               [0.1, 0.2, 0.1, 1],
      u_diffuse:               someOtherDiffuseTexture,
      u_specular:              [1, 1, 0, 1],
      u_shininess:             30,
      u_specularFactor:        0.5,
    },
  },
  { translation: [200, -23, -78],
    materialUniforms: {
      u_ambient:               [0.2, 0.2, 0.1, 1],
      u_diffuse:               yetAnotherDiffuseTexture,
      u_specular:              [1, 0, 0, 1],
      u_shininess:             45,
      u_specularFactor:        0.7,
    },
  },
];

// 그리는 시점에
gl.useProgram(program);

// 모든 객체에 대해 공통적으로 사용되는 값들을 설정

// 모든 버퍼와 attribute 설정을 갖고있는 VAO를 바인딩
gl.bindAttribArray(vao);
twgl.setUniforms(uniformSetters, uniformThatAreTheSameForAllObjects);

objects.forEach(function(object) {
  computeMatricesForObject(object, uniformsThatAreComputedForEachObject);
  twgl.setUniforms(uniformSetters, uniformThatAreComputedForEachObject);
  twgl.setUniforms(uniformSetters, objects.materialUniforms);
  gl.drawArrays(...);
});
```

위의 헬퍼 함수를 사용한 예제는 아래와 같습니다.

{{{example url="../webgl-less-code-more-fun.html" }}}

여기서 조금 더 나아가 봅시다. 
위 코드에서는 `attribs` 변수를 우리가 생성한 버퍼를 기반으로 설정해 주었습니다.
위에서는 버퍼를 설정하는 코드를 보여드리진 않았습니다.
예를들어 정점 위치, 법선과 텍스처 좌표를 만들고 싶다면 아래와 같은 코드가 필요할겁니다.

    // 한 개의 삼각형
    var positions = [0, -10, 0, 10, 10, 0, -10, 10, 0];
    var texcoords = [0.5, 0, 1, 1, 0, 1];
    var normals   = [0, 0, 1, 0, 0, 1, 0, 0, 1];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

패턴을 보면 이 역시 아래와 같이 단순화 할 수 있습니다.

    // 한 개의 삼각형
    var arrays = {
       position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
       texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1],               },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
    };

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    var vao = twgl.createVAOFromBufferInfo(gl, setters, bufferInfo);

훨씬 간결하네요!

아래는 그 결과입니다.

{{{example url="../webgl-less-code-more-fun-triangle.html" }}}

이러한 방식은 우리가 인덱스를 사용할때도 마찬가지입니다.
`createVAOFromBufferInfo`가 모든 attribute를 설정하고 여러분의 `indices`에 대해 
`ELEMENT_ARRAY_BUFFER`를 설정해 주기 때문에 해당 VAO를 바인딩하고 `gl.drawElements`를 호출하면 됩니다.

    // 인덱스를 사용해 정의한 사각형
    var arrays = {
       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
    };

    var bufferInfo = twgl.createBufferInfoFromTypedArray(gl, arrays);
    var vao = twgl.createVAOFromBufferInfo(gl, setters, bufferInfo);

렌더링 시점에서 `gl.drawArrays` 대신에 `gl.drawElements`를 호출하면 됩니다.

    ...

    // geometry를 그립니다.
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

아래는 그 결과입니다.

{{{example url="../webgl-less-code-more-fun-quad.html" }}}

마지막은 조금 지나치게 간략화 했다고도 보일 수 있습니다. 
`position`을 보면 거의 항상 세개의 컴포넌트인 (x, y, z)로 정의되고, 
`texcoords`의 경우 거의 항상 두개, 인덱스는 세개, 법선은 세개의 값으로 정의됩니다.
따라서 알아서 컴포넌트의 갯수를 추정하도록 할 수도 있습니다.

    // 인덱스를 사용해 정의한 사각형
    var arrays = {
       position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
       texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
       normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
       indices:  [0, 1, 2, 1, 2, 3],
    };

이러한 경우의 결과는 아래와 같습니다.

{{{example url="../webgl-less-code-more-fun-quad-guess.html" }}}

개인적으로 이렇게 하는것이 더 좋은지 모르겠습니다.
알아서 추정한다는 것이 신경쓰이는데 추정된 값이 틀릴 수도 있기 때문입니다.
예를들어 제가 texcoord attribute에 추가적인 텍스처 좌표를 사용하기로 생각했는데 
컴포넌트가 2개라고 가정하면 그건 틀린 겁니다.
물론 이러한 경우 그 전 예제처럼 여러분이 직접 값을 명시해 줄 수 있습니다.
제가 걱정되는 것은 알아서 추정하는 코드를 수정하면 이전에 작동하던 것이 작동하지 않게 될 수 있기 때문인 것 같습니다.
어떻게 할지는 여러분에게 달려 있습니다. 어떤 사람들은 가능한한 단순하게 만드는 것이 더 좋다고 생각할 수도 있습니다.

셰이더 프로그램을 통해 attribute가 몇 개의 컴포넌트를 사용하는지 알아보는 건 어떨까요?
그렇게 하지않는 이유는 세개의 컴포넌트 (x, y, z)를 버퍼에서 전달하면서도 셰이더 코드에서는 `vec4`를 사용하는 경우가 흔하기 때문입니다.
이러한 경우 WebGL에서는 `w = 1`로 설정합니다.
사용자가 셰이더에 선언한 내용과 제공하는 컴포넌트의 개수가 일치하지 않을 수 있으므로 사용자의 의도를 쉽게 알 수 없다는 뜻입니다.

다른 패턴들을 좀 더 살펴보겠습니다.

    var program = twgl.createProgramFromSources(gl, [vs, fs]);
    var uniformSetters = twgl.createUniformSetters(gl, program);
    var attribSetters  = twgl.createAttributeSetters(gl, program);

위 코드도 아래와 같이 단순화 할 수 있습니다.

    var programInfo = twgl.createProgramInfo(gl, ["vertexshader", "fragmentshader"]);

반환되는 객체는 아래와 같습니다.

    programInfo = {
       program: WebGLProgram,  // 우리가 컴파일한 프로그램
       uniformSetters: ...,    // createUniformSetters의 반환과 같은 setter
       attribSetters: ...,     // createAttribSetters의 반환과 같은 setter
    }

이상으로 또 다른 간략화 예시였습니다.
이러한 방식은 여러 개의 프로그램을 사용할때 편리한데, 각 프로그램와 관련된  setter들을 자동적으로 가지고 있도록 하기 때문입니다.

{{{example url="../webgl-less-code-more-fun-quad-programinfo.html" }}}

하나 더 하자면, 어떤 데이터의 경우 인덱스를 사용하지 않아서 `gl.drawArrays`를 호출하는 경우가 있습니다. 어떤 데이터는 `gl.drawElements`를 사용하고요.
주어지는 데이터에 대해 `bufferInfo.indices`를 보고 어떤 경우인지 쉽게 알 수 있습니다.
만일 저 값이 있다면 `gl.drawElements`를 호출하고 아니라면 `gl.drawArrays`를 호출해야 합니다.
이러한 역할을 수행하는 `twgl.drawBufferInfo`함수가 있습니다.
이는 아래와 같이 사용됩니다.

    twgl.drawBufferInfo(gl, bufferInfo);

프리미티브의 타입을 명시하는 세 번째 인자를 생략하고 호출하면 `gl.TRIANGLES`로 가정합니다.

아래는 인덱스를 사용하지 않는 삼각형과 인덱스를 사용하는 사각형을 동시에 사용하는 예제입니다.
`twgl.drawBufferInfo`를 사용하고 있기 때문에 데이터를 스위치할 때 다른 코드를 사용할 필요가 없어집니다.

{{{example url="../webgl-less-code-more-fun-drawbufferinfo.html" }}}

여기까지가 제가 WebGL 프로그램을 작성할 때 사용하는 코드 스타일이었습니다.
하지만 이 강의의 예제를 작성할 때는 표준적인 **긴 코드**로 작성해야 한다고 생각하는데 이는 여러분이 어떤 것이 WebGL이고 어떤것이 제 스타일로 작성한 코드인지 헷갈릴 수 있기 때문입니다.
하지만 어떤 시점에서는 전체 코드를 작성하는 것이 낭비가 되기 때문에 강의를 계속 보시다 보면 제 스타일로 작성한 코드를 보실 수 있을 겁니다.

여러분의 코드에서도 얼마든지 제 스타일을 사용하셔도 됩니다.
`twgl.createProgramInfo`,
`twgl.createVAOAndSetAttributes`, `twgl.createBufferInfoFromArrays`, `twgl.setUniforms` 등등이 제가 제 스타일에 기반해 작성한 라이브러리의 일부입니다.
[`TWGL`이라고 합니다](https://twgljs.org).
`Tiny WebGL`을 읽기 좋게 축약한 것입니다.

다음으로, [여러 물체를 그리는 법](webgl-drawing-multiple-things.html)을 알아보겠습니다.

<div class="webgl_bottombar">
<h3>setter들을 직접 호출해서 사용해도 되나요?</h3>
<p>
자바스크립트에 익숙하신 분은들 setter를 아래와 같이 직접 호출해서 사용할 수 있는지 궁금하실 겁니다.
</p>
<pre class="prettyprint">
// 초기화 시점에
var uniformSetters = twgl.createUniformSetters(program);

// 그리는 시점에
uniformSetters.u_ambient([1, 0, 0, 1]); // ambient color를 빨간색으로 설정.
</pre>
<p>이렇게 하는것이 좋지 않은 이유는 GLSL 프로그램을 작성할 때 셰이더를 변경하는 경우가 종종 생긴다는 겁니다. 주로 디버깅 목적으로요.
예를들어 프로그램을 사용했더니 화면에 아무것도 보이지 않는다고 합시다.
저같은 경우 이렇게 아무것도 나타나지 않을때 때 제일 먼저 하는 작업은 셰이더를 단순화 하는 것입니다.
예를들어 프래그먼트 셰이더의 출력을 아주 간단하게 바꿔봅니다.
</p>
<pre class="prettyprint showlinemods">
#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

out vec4 outColor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((
    u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
      diffuseColor.a);
*  outColor = vec4(0,1,0,1);  // &lt;!--- 단순한 초록색으로
}
</pre>
<p><code>outColor</code>를 단색으로 설정하는 라인을 추가한 것에 주목하세요.
대부분의 드라이버는 위쪽 라인의 코드들이 최종 결과에 영향을 주지 않는다는 것을 알아냅니다.
그래서 모든 uniform들을 최적화합니다. 프로그램을 다시 실행하여 <code>twgl.createUniformSetters</code>를 호출하면 <code>u_ambient</code>를 위한 setter를 생성하지 못하고 위 코드에서 <code>uniformSetters.u_ambient()</code>를 호출하는 부분이 실패하면서 아래와 같은 메시지가 나타납니다.
</p>
<pre class="prettyprint">
TypeError: undefined is not a function
</pre>
<p><code>twgl.setUniforms</code>은 이 문제를 해결해 줍니다.
이 함수는 실제로 존재하는 uniform들만 설정하도록 되어 있습니다.</p>
</div>

