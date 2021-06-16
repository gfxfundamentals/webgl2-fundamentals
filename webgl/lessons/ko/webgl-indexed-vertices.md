Title: WebGL2 정점 인덱스
Description: gl.drawElements를 사용하는 방법
TOC: 정점 인덱스 (gl.drawElements)

이 글은 여러분이 최소한 [이 글](webgl-fundamentals.html)을 읽었다고 가정하고 쓰여졌습니다.
아직 읽지 않으셨으면 먼저 읽고 오십시오.

이 글은 `gl.drawElements`를 설명하는 짧은 글입니다.
WebGL에는 두 개의 기본적인 드로잉 함수가 있습니다.
`gl.drawArrays`와 `gl.drawElements`입니다.
이 사이트의 대부분의 글에서는 `gl.drawArrays`를 사용하는데, 이 함수가 더 직관적이기 때문입니다.

`gl.drawElements`는 정점 인덱스로 채워진 버퍼를 사용하여 그 값을 기반으로 화면을 그리게 됩니다.

[첫번째 글](webgl-fundamentals.html)의 직사각형을 그리는 예제를 가지고
`gl.drawElements`를 사용하도록 바꾸어 봅시다.

해당 코드에서 각각 3개의 정점으로 이루어진 2개의 삼각형으로 직사각형을 그렸습니다.
각 직사각형은 6개의 정점을 가지고 있습니다.

6개 정점 위치를 정의하는 코드는 아래와 같았습니다.

```js
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,   // vertex 0
     x2, y1,   // vertex 1
     x1, y2,   // vertex 2
     x1, y2,   // vertex 3
     x2, y1,   // vertex 4
     x2, y2,   // vertex 5
  ]), gl.STATIC_DRAW);
```

이렇게 하는 대신, 4개의 정점 데이터만 사용할 수 있습니다.

```js
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,  // vertex 0
     x2, y1,  // vertex 1
     x1, y2,  // vertex 2
     x2, y2,  // vertex 3
  ]), gl.STATIC_DRAW);
```

하지만 그러려면 인덱스가 들어있는 버퍼가 필요한데, WebGL은 여전히 최종적으로 2개의 삼각형을 그려야 하기 때문에 
총 6개의 정점을 그려야 한다고 우리가 알려주어야 하기 때문입니다.

이를 위해서 또다른 버퍼를 만들건데, 이번에는 다른 바인딩 포인트를 사용합니다.
`ARRAY_BUFFER`대신 `ELEMENT_ARRAY_BUFFER` 바인딩 포인트를 사용하는데 
인덱스를 위해서는 항상 이 바인드 포인트를 사용합니다.

```js
// 버퍼 생성
const indexBuffer = gl.createBuffer();

// 이 버퍼를 현재 'ELEMENT_ARRAY_BUFFER'로 설정
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

// 현재 element array를 데이터로 채움
const indices = [
  0, 1, 2,   // first triangle
  2, 1, 3,   // second triangle
];
gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
);
```

WebGL의 모든 다른 데이터처럼 인덱스를 위해서도 특정한 표현 방법이 필요합니다.
우리는 인덱스 데이터를 `new Uint16Array(indices)`를 사용해 
부호가 없는 16비트 정수형으로 변환하였고 이후 버퍼에 업로드 하였습니다.

주의하셔야 할 사항은 전역 상태인 `ARRAY_BUFFER` 바인딩 포인트와는 달리, 
`ELEMENT_ARRAY_BUFFER` 바인딩 포인트는 현재 vertex array의 일부라는 것입니다.

코드에서는 우리가 vertex array를 만든 뒤 바인딩하고 인덱스 버퍼를 설정했습니다.
그 말은, attribute와 동일하게 우리가 vertex array를 바인딩하는 시점에 인덱스 버퍼도 함께 바인딩 된다는 것입니다.
더 자세한 정보는 [attribute에 관한 글](webgl-attributes.html)을 보시면 됩니다.

그리는 시점에서는 `drawElements`를 호출합니다.

```js
// Draw the rectangle.
var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 6;
-gl.drawArrays(primitiveType, offset, count);
+var indexType = gl.UNSIGNED_SHORT;
+gl.drawElements(primitiveType, count, indexType, offset);
```

동일한 화면이 나타나지만 지금은 6개가 아닌 4개의 정점 정보만 전달했습니다.
여전히 WebGL에게 6개의 정점을 그리라고 명령하고 있긴 하지만 지금은 인덱스를 활용해서 4개의 정점 데이터를 재사용하고 있습니다.

{{{example url="../webgl-2d-rectangles-indexed.html"}}}

인덱스를 사용할 것인지 말지는 여러분에게 달려 있습니다.

주의하셔야 할 사항은 인덱스를 사용하는 정점의 경우 보통 육면체를 만드는데 
8개의 정점 위치 정보만을 사용하지 않는다는 것입니다. 왜냐하면 각 정점의 데이터가 
그 정점 위치가 사용되는 면(face)에 연관되어 있기 때문입니다.
예를 들어 육면체의 각 면에 다른 색상값을 주고 싶다면 위치와 함께 색상 정보를 전달해 주어야 합니다.
그러니 같은 위치가 세번씩 사용되고 있을지라도, 각 면에 속하는 정점을 정의할 때 
위치값을 중복해서 정의하되 만일 속한 면이 다르다면 다른 색상값을 주어야 합니다.
즉 육면체를 위해서는 각 면에 대해서 4개씩 해서 총 24개의 정점이 필요하고, 
12개의 삼각형을 그리기 위해 36개의 인덱스가 필요하다는 뜻입니다.

`indexType`에 유효한 타입은 0에서 255사이의 값을 갖는 `gl.UNSIGNED_BYTE`와 65535까지를 사용할 수 있는 `gl.UNSIGNED_SHORT` (`new Uint8Array(indices)` 사용) 그리고 4294967296까지를 사용할 수 있는 `gl.UNSIGNED_INT` (`new Uint32Array(indices)` 사용)가 있습니다.

