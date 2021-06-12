Title: WebGL2 Attributes
Description: WebGL의 attribute란 무엇일까요?
TOC: Attributes


이 글은 WebGL에서 attribute 상태(state)가 어떻게 구성되는지에 대한 개념의 이해를 돕기 위해 작성되었습니다. [텍스처 유닛](webgl-texture-units.html) 및 [프레임버퍼](webgl-framebuffers.html)에 대해서도 유사한 글이 있으니 참고 하세요.

이 내용을 이해하기 위해서는 먼저 [WebGL 작동 원리](webgl-how-it-works.html)와 [WebGL 셰이더와 GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)을 먼저 읽으셔야 합니다.

## Attributes

WebGL의 attribute는 버퍼로부터 데이터를 읽어와서 정점 셰이더의 입력으로 주어지는 데이터를 말합니다.
WebGL에서는 `gl.drawArrays` 또는 `gl.drawElements`가 호출되면 사용자가 작성한 정점 셰이더를 N번 실행합니다.
각 iteration마다 attribute는 바인딩 되어있는 버퍼로부터 어떻게 데이터를 가져올지를 정의하고 그 데이터를 정점 셰이더 내의 attribute로 넘겨줍니다.

이러한 동작이 만약 자바스크립트로 구현되었다면 아마 아래와 같이 쓰여졌을 겁니다.

```js
// pseudo code
const gl = {
  arrayBuffer: null,
  vertexArray: {
    attributes: [
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0 },
    ],
    elementArrayBuffer: null,
  },
}
```

위에서 볼 수 있듯이 16개의 attribute가 있습니다.

`gl.enableVertexAttribArray(location)` 또는 `gl.disableVertexAttribArray`를 호출하는 것은 아래와 같은 상황으로 생각하시면 됩니다.

```js
// pseudo code
gl.enableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = true;
};

gl.disableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = false;
};
```

다시말해, location은 attribute의 인덱스를 직접 참조하는 값입니다.

비슷하게, `gl.vertexAttribPointer`는 attribute의 나머지 값들을 세팅하기 위해 사용됩니다. 
아래와 같은 방식으로 구현될 수 있을겁니다.

```js
// pseudo code
gl.vertexAttribPointer = function(location, size, type, normalize, stride, offset) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.size = size;
  attrib.type = type;
  attrib.normalize = normalize;
  attrib.stride = stride ? stride : sizeof(type) * size;
  attrib.offset = offset;
  attrib.buffer = gl.arrayBuffer;  // !!!! <-----
};
```

`gl.vertexAttribPointer`를 호출하면 `attrib.buffer`는 현재 활성화 상태인 `gl.arrayBuffer`로 설정되게 됩니다.
위 의사 코드(pseudo code)에서 `gl.arrayBuffer`는 `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)`를 호출함으로써 설정됩니다.

```js
// pseudo code
gl.bindBuffer = function(target, buffer) {
  switch (target) {
    case ARRAY_BUFFER:
      gl.arrayBuffer = buffer;
      break;
    case ELEMENT_ARRAY_BUFFER;
      gl.vertexArray.elementArrayBuffer = buffer;
      break;
  ...
};
```

다음으로, 정점 셰이더를 봅시다. 정점 셰이더에서는 attribute를 선언할 수 있습니다.
예를들어:

```glsl
#version 300 es
in vec4 position;
in vec2 texcoord;
in vec3 normal;

...

void main() {
  ...
}
```

`gl.linkProgram(someProgram)`를 호출해서 정점 셰이더와 프래그먼트 셰이더를 링크하면 
WebGL (드라이버/GPU/브라우저)은 어떤 인덱스/location을 각 attibute에 대해 사용할지를 결정합니다. 추후에 보여드릴 코드처럼 직접 location을 할당해 주지 않는 한, WebGL에서 각 attribute에 대해 어떤 인덱스를 고를지 알 수 없습니다.
그러니 position, texcoord, normal에 대해 어떤 attibute를 사용하기로 결정했는지 물어봐야겠죠?
`gl.getAttribLocation`를 호출해서 물어볼 수 있습니다.

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

`positionLoc` = `5`라고 가정해봅시다. 그 말은 정점 셰이더가 실행될 때(여러분이 `gl.drawArrays` 또는 ` gl.drawElements`를 호출했을 때) 정점 셰이더는 여러분이 attribute 5에 대해 올바른 type, size, offset, stride, buffer 등등을 설정했다고 가정한다는 것입니다.

프로그램을 링크하기 *전에* `gl.bindAttribLocation(program, location, nameOfAttribute)`를 호출해서 location을 직접 선택할 수 있습니다. 예를들어:

```js
// `gl.linkProgram`에게 `position`에 대해 attribute 7번을 사용하도록 명시
gl.bindAttribLocation(program, 7, 'position');
```

GLSL ES 3.00 셰이더를 사용한다면 셰이더 내에서 직접적으로 어떤 location을 사용할지 아래와 같이 명시해 줄 수도 있습니다.

```glsl
layout(location = 0) in vec4 position;
layout(location = 1) in vec2 texcoord;
layout(location = 2) in vec3 normal;

...
```

`bindAttribLocation`을 사용하는 것이 훨씬 [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)한 것 같긴 하지만, 여러분이 원하는대로 하시면 됩니다.

## 전체 Attribute State

위의 설명 중 빠진 것 중 하나는, 각 attribute는 기본값이 있다는 것입니다. 
위에서 설명하지 않은 이유는 이를 활용하는 경우가 흔하지 않기 때문입니다.

```js
attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
     divisor: 0, value: [0, 0, 0, 1], },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
     divisor: 0, value: [0, 0, 0, 1], },
   ..
```

`gl.vertexAttribXXX`들을 사용해 각 attibute의 값을 설정해 줄 수 있습니다.
이 값들은 `enable`가 false일 때 사용됩니다. `enable`이 true라면 attribute의 데이터는 할당된 버퍼로부터 가져옵니다.

<a id="vaos"></a>
## Vertex Array Objects (VAO)s

```js
const vao = gl.createVertexArray();
```

이 코드는 위쪽 *의사 코드*의 `gl.vertexArray`에 할당될 객체를 만듭니다.
`gl.bindVertexArray(vao)`를 호출하면 생성된 vertex array object를 현재 vertex array로 만듭니다.

```js
// pseudo code
gl.bindVertexArray = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

이 코드는 현재 VAO에 있는 모든 attribute와 `ELEMENT_ARRAY_BUFFER`를 설정해서 여러분이 특정 형상을 화면에 그리고 싶을 때 `gl.bindVertexArray`만을 호출해서 모든 attibute를 설정할 수 있게 합니다.
그렇지 않으면 **각 attibute마다** `gl.bindBuffer`, `gl.vertexAttribPointer` (추가적으로 `gl.enableVertexAttribArray`까지)를 호출해야 합니다.

보시다시피 vertex array object를 사용하는 것이 훨씬 좋습니다.
하지만 그러려면 코드가 좀 더 구조화가 필요합니다. 
예를 들어 한 셰이더를 통해 `gl.TRIANGLES`로 정육면체를 그리고 다른 셰이더로 `gl.LINES`로 한번 더 그리고 싶다고 해봅시다.
삼각형들을 그릴 때는 조명 효과를 위해 법선을 사용하기 때문에 셰이더에서 attribute를 아래와 같이 선언했다고 해 봅시다:

```glsl
#version 300 es
// 조명 효과 셰이더
// 정육면체를 삼각형 기반으로 그릴 때 사용하는 셰이더

in vec4 a_position;
in vec3 a_normal;
```

이 위치와 법선값들을 [조명 효과 관련한 첫 글](webgl-3d-lighting-directional.html)에서처럼 사용한다고 합시다.

라인으로 그릴 때는 조명 효과가 필요 없고, 단일 색상으로 그려서 [첫 글](webgl-fundamentals.html)에서 사용한 셰이더와 유사한 효과를 얻고 싶다고 해 봅시다.
색상을 위한 uniform을 선언하고, 정점 셰이더에서는 위치값만 사용합니다.


```glsl
#version 300 es
// 단일 색상 셰이더
// 정육면체를 라인 기반으로 그릴 때 사용하는 셰이더

in vec4 a_position;
```

각 셰이더에 대해 attribute의 location이 어떻게 결정될지 알 수 없습니다.
예를 들어 조명 효과 셰이더에서는 location이 아래와 같이 되었다고 해 봅시다.

```
a_position location = 1
a_normal location = 0
```

그리고 단일 색상 셰이더에 대해서는 아래와 같다고 합시다.

```
a_position location = 0
```

셰이더를 바꾸면 attribute 설정이 달라져야 하는것이 자명합니다.
한 셰이더에서는 `a_position`의 데이터가 attribute 0에 들어와야 하고, 다른 셰이더에서는 attribute 1에 들어와야 합니다.

attribute를 다시 설정하는 추가적인 작업이 필요합니다. vertex array object를 사용하는 이유는 그 작업을 하지 않기 위해서였는데도 말입니다.
이 문제를 해결하기 위해서 셰이더 프로그램을 링크하기 전에 location을 바인딩해 줄겁니다.

WebGL에 아래와 같이 알려줍니다.

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

**gl.linkProgram을 호출하기 전에요**. 이렇게 하면 WebGL에게 셰이더를 링크하기 전에 어떤 location을 할당할지를 알려줄 수 있습니다.
이렇게 하면 두 셰이더에 대해서 동일한 VAO를 사용할 수 있습니다.

## Attribute 상한

WebGL2 명세에서는 최소 16개의 attibute를 지원하도록 되어 있지만 특정 컴퓨터/브라우저/구현/드라이버는 더 많은 attribute를 지원할 수 있습니다.
얼마나 많은 attribute를 지원하는지 아래 코드를 호출하여 확인할 수 있습니다.

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

16개 이상의 attribute를 사용하고자 하면 실제 지원하는 것이 몇개인지를 확인하는 것이 좋고,
사용자의 환경에서 그 만큼을 지원하지 않는다면 이를 사용자에게 알려주거나 다른 더 간단한 셰이더를 사용하도록 해야 합니다.
