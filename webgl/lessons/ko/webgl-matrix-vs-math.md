Title: WebGL2 행렬 vs 수학에서의 행렬
Description: WebGL 관례롸 수학에서의 관례의 차이점
TOC: WebGL2 행렬 vs 수학에서의 행렬


이 글은 행렬을 이야기하는 여러 글, 특히 [행렬을 소개하는 글](webgl-2d-matrices.html)뿐만 아니라 [3D를 소개하는 글](webgl-3d-orthographic.html), [원근 투영에 관한 글](webgl-3d-perspective.html), [카메라에 관한 글](webgl-3d-camera.html)과는 별개로 행렬에 대해 이야기하는 글입니다.

프로그래밍에서는 일반적으로 행은 좌에서 우로, 열은 위에서 아래로 정의합니다.

> ## col·umn
> /ˈkäləm/
>
> *명사*
> 1. 일반적으로 원통형이고 돌이나 콘크리트로 만들어진 수직 기둥으로, 엔태블러처, 아치, 또는 기타 구조물을 지지하거나 기념비로써 홀로 서 있습니다.
>
>    *동의어*:	pillar, post, pole, upright, vertical, ...
>
> 2. 페이지나 텍스트의 수직 분할.

> ## row
> /rō/
>
> *명사*
> * 테이블에 있는 항목들의 수평선.

우리가 사용하는 소프트웨어들에서 예시를 볼 수 있습니다.
예를 들어 제 텍스트 편집기는 줄과 열을 표시하는데, 열은 이미 사용되었고, 줄은 행을 대신해 사용합니다.

<div class="webgl_center"><img src="resources/editor-lines-and-columns.gif" class="gman-border-bshadow" style="width: 372px;"></div>

왼쪽 하단 영역에 있는 상태 바가 줄과 열을 표시하고 있습니다.

스프레드시트 소프트웨어에서는 행이 가로 방향입니다.

<div class="webgl_center"><img src="resources/spreadsheet-row.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

열은 아래 방향입니다.

<div class="webgl_center"><img src="resources/spreadsheet-column.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

따라서, 자바스크립트에서 WebGL용 3x3 혹은 4x4 행렬을 만들 때 아래와 같이 만듭니다.

```js
const m3x3 = [
  0, 1, 2,  // 행 0
  3, 4, 5,  // 행 1
  6, 7, 8,  // 행 2
];

const m4x4 = [
   0,  1,  2,  3,  // 행 0 
   4,  5,  6,  7,  // 행 1
   8,  9, 10, 11,  // 행 2
  12, 13, 14, 15,  // 행 3
];
```

위 규칙에 따라 `m3x3`의 첫 행은 `0, 1, 2`이고 `m4x4`의 마지막 행은 `12, 13, 14, 15`입니다.

[행렬에 관한 첫 번째 글](webgl-2d-matrices.html)에서 볼 수 있듯이 아주 기본적인 WebGL 3x3 2차원 이동 행렬을 만들기 위해서 이동 값인 `tx`와 `ty`는 6과 7 위치에 들어가야 합니다.

```js
const some3x3TranslationMatrix = [
   1,  0,  0,
   0,  1,  0,
  tx, ty,  1,
];
```

또는 [3D에 관한 첫 번째 글](webgl-3d-orthographic.html)에서 소개된 4x4 행렬의 경우 이동 값은 12, 13, 14에 위치해야 합니다.

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

하지만, 한 가지 이슈가 있습니다.
수학에서 행렬 표현에 관한 관례는 일반적으로 열을 기반으로합니다.
수학자라면 3x3 이동 행렬을 아래와 같이 적을 겁니다.

<div class="webgl_center"><img src="resources/3x3-math-translation-matrix.svg" style="width: 120px;"></div>

그리고 4x4 이동 행렬이라면 아래와 같이 적을 겁니다.

<div class="webgl_center"><img src="resources/4x4-math-translation-matrix.svg" style="width: 150px;"></div>

이렇게 되면 문제가 생깁니다.
우리의 행렬이 수학에서의 행렬처럼 보이게 하려면 4x4 행렬을 아래와 같이 적어야 할겁니다.

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  tx,
   0,  1,  0,  ty,
   0,  0,  1,  tx,
   0,  0,  0,  1,
];
```

불행히도 이렇게 하면 문제가 있습니다.
[카메라에 관한 글](webgl-3d-camera.html)에서 언급했듯이 4x4 행렬의 각 열은 의미를 가집니다.

첫 번째, 두 번째, 세 번째 열들은 각각 x, y, z축으로 간주되며 마지막 열은 위치 또는 이동량을 의미합니다.

한 가지 문제는 코드에서 이런 부분을 개별적으로 가져오는 게 재미없다는 겁니다.
Z축을 얻어오려면?
이렇게 하셔야 합니다.

```js
const zAxis = [
  some4x4Matrix[2],
  some4x4Matrix[6],
  some4x4Matrix[10],
];
```

우웩!

따라서, WebGL과 WebGL의 기반이 된 OpenGL ES에서 이를 해결 하는 방법은 행을 "열"이라고 부르는 겁니다.

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,   // 이건 열 0
   0,  1,  0,  0,   // 이건 열 1
   0,  0,  1,  0,   // 이건 열 2
  tx, ty, tz,  1,   // 이건 열 3
];
```

이제 수학에서의 정의와 일치합니다.
Z축을 얻어오려면 아래 코드를 사용하면 됩니다.

```js
const zAxis = some4x4Matrix.slice(8, 11);
```

C++에 익숙하시다면, OpenGL 자체는 4x4 행렬의 16개의 값이 연속된 메모리에 저장되어 있어야 하므로, C++에서는 `Vec4` 구조체나 클래스를 만들어도 되고,

```c++
// C++
struct Vec4 {
  float x;
  float y;
  float z;
  float w;
};
```

`Vec4` 4개로 4x4 행렬을 만들 수도 있으며

```c++
// C++
struct Mat4x4 {
  Vec4 x_axis;
  Vec4 y_axis;
  Vec4 z_axis;
  Vec4 translation;
}
```

혹은 그냥 아래와 같이 해도 됩니다.

```c++
// C++
struct Mat4x4 {
  Vec4 column[4];
}
```

잘 동작할겁니다.

안타깝지만 실제로 코드에서 정적으로 선언하면 수학 버전과는 달라 보입니다.

```C++
// C++
Mat4x4 someTranslationMatrix = {
  {  1,  0,  0,  0, },
  {  0,  1,  0,  0, },
  {  0,  0,  1,  0, },
  { tx, ty, tz,  1, },
};
```

혹은 다시 C++과 달리 구조체가 없는 자바스크립트로 돌아와 보면 아래와 같습니다.

```js
const someTranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

따라서, 행을 "열"이라고 부르는 규칙으로 인해 어떤 것은 더 간단해지지만 수학에 익숙하시다면 더 혼란스러워질 수도 있습니다.

제 글들이 수학 전문가가 아닌 프로그래머의 관점으로 작성되었기 때문에 이 이야기를 하는 겁니다.
즉 2차원 배열로 취급될 수 있는 1차원 배열처럼 행을 기준으로 작성합니다.

```js
const someTranslationMatrix = [
   1,  0,  0,  0,  // 행 0
   0,  1,  0,  0,  // 행 1
   0,  0,  1,  0,  // 행 2
  tx, ty, tz,  1,  // 행 3
];
```

이런 식으로요.

```js
// 스마일 이미지
const dataFor7x8OneChannelImage = [
    0, 255, 255, 255, 255, 255,   0,  // 행 0
  255,   0,   0,   0,   0,   0, 255,  // 행 1
  255,   0, 255,   0, 255,   0, 255,  // 행 2
  255,   0,   0,   0,   0,   0, 255,  // 행 3
  255,   0, 255,   0, 255,   0, 255,  // 행 4
  255,   0, 255, 255, 255,   0, 255,  // 행 5
  255,   0,   0,   0,   0,   0, 255,  // 행 6
    0, 255, 255, 255, 255, 255,   0,  // 행 7
]
```

따라서 해당 글들에서는 행을 그냥 행으로 부를겁니다.

수학에 익숙하시다면 혼란스러울 수 있습니다. 특별한 방법이 없어서 죄송합니다.
3번째 행을 3번째 열이라고 부를 수도 있지만 일반적으로 프로그래밍에서는 그렇게 부르지 않기 때문에 그건 그것대로 헷갈릴 것입니다.

어찌됐든, 왜 이 사이트에서 코드의 행렬이 수학책에서 배우는 행렬과 다른지 이해하는데 도움이 되셨길 바랍니다.
대신에 그냥 코드의 일부이며 코드의 규칙을 따릅니니다.
이 설명으로 수학에 익숙하신 분들의 혼란과 무슨 일이 일어나고 있는건지에 대해 도움이 되었길 바랍니다.
