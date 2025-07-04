Title: Применение карты смещения и карты бликов
Description: Применение карты смещения и карты бликов
TOC: Применение карты смещения и карты бликов

## Вопрос:

Я пытаюсь применить как карту смещения, так и карту бликов для Земли, и только карту смещения для Луны.

Я мог бы преобразовать карту высот в карту нормалей, но если я использую ту же карту высот для применения карты смещения, это не работает так, как я ожидал.

Вот пример изображения:

[![Пример 1][1]][1]

как вы можете видеть, неровности вокруг Земли и Луны, но нет реальных различий в высоте.

Если я применяю карту бликов к Земле, Земля становится такой:

[![Пример 2][2]][2]

Я хочу, чтобы только океан Земли блестел, но мой код превращает Землю в полностью черную, я вижу только некоторые белые точки на Земле...

Эти текстуры взяты с этого [сайта][3]

Вот мой код вершинного шейдера и фрагментного шейдера:

    "use strict";
    const loc_aPosition = 3;
    const loc_aNormal = 5;
    const loc_aTexture = 7;
    const VSHADER_SOURCE =
    `#version 300 es
    layout(location=${loc_aPosition}) in vec4 aPosition;
    layout(location=${loc_aNormal}) in vec4 aNormal;
    layout(location=${loc_aTexture}) in vec2 aTexCoord;
    
    
    uniform mat4 uMvpMatrix;
    uniform mat4 uModelMatrix;    // Матрица модели
    uniform mat4 uNormalMatrix;   // Матрица преобразования нормали
    
    uniform sampler2D earth_disp;
    uniform sampler2D moon_disp;
    
    //uniform float earth_dispScale;
    //uniform float moon_dispScale;
    
    //uniform float earth_dispBias;
    //uniform float moon_dispBias;
    
    uniform bool uEarth;
    uniform bool uMoon;
    
    
    out vec2 vTexCoord;
    out vec3 vNormal;
    out vec3 vPosition;
    
    
    void main() 
    {
      
      float disp;
      
      if(uEarth)
        disp = texture(earth_disp, aTexCoord).r; //Извлечение цветовой информации из изображения
      else if(uMoon)
        disp = texture(moon_disp, aTexCoord).r; //Извлечение цветовой информации из изображения
      
      vec4 displace = aPosition;
      
      float displaceFactor = 2.0;
      float displaceBias = 0.5;
      
      if(uEarth || uMoon) //Использование карты смещения
      {
        displace += (displaceFactor * disp - displaceBias) * aNormal;
        gl_Position = uMvpMatrix * displace;
      }
      else //Не используем карту смещения
        gl_Position = uMvpMatrix * aPosition;
      
      // Вычисляем позицию вершины в мировой системе координат
      vPosition = vec3(uModelMatrix * aPosition);
      
      vNormal = normalize(vec3(uNormalMatrix * aNormal));
      vTexCoord = aTexCoord;
      
    }`;
    
    // Программа фрагментного шейдера
    const FSHADER_SOURCE =
    `#version 300 es
    precision mediump float;
    
    uniform vec3 uLightColor;     // Цвет света
    uniform vec3 uLightPosition;  // Позиция источника света
    uniform vec3 uAmbientLight;   // Цвет окружающего света
    
    uniform sampler2D sun_color;
    uniform sampler2D earth_color;
    uniform sampler2D moon_color;
    
    uniform sampler2D earth_bump;
    uniform sampler2D moon_bump;
    
    uniform sampler2D specularMap;
    
    
    in vec3 vNormal;
    in vec3 vPosition;
    in vec2 vTexCoord;
    out vec4 fColor;
    
    uniform bool uIsSun;
    uniform bool uIsEarth;
    uniform bool uIsMoon;
    
    
    
    vec2 dHdxy_fwd(sampler2D bumpMap, vec2 UV, float bumpScale)
    {
        vec2 dSTdx = dFdx( UV );
      vec2 dSTdy = dFdy( UV );
      float Hll = bumpScale * texture( bumpMap, UV ).x;
      float dBx = bumpScale * texture( bumpMap, UV + dSTdx ).x - Hll;
      float dBy = bumpScale * texture( bumpMap, UV + dSTdy ).x - Hll;
      return vec2( dBx, dBy );
    }
    
    vec3 pertubNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy)
    {
        vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
      vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
      vec3 vN = surf_norm;  // нормализованная
      vec3 R1 = cross( vSigmaY, vN );
      vec3 R2 = cross( vN, vSigmaX );
      float fDet = dot( vSigmaX, R1 );
      fDet *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );
      vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
      return normalize( abs( fDet ) * surf_norm - vGrad );
    }
    
    
    
    void main() 
    {
        vec2 dHdxy;
        vec3 bumpNormal;
        float bumpness = 1.0;
        if(uIsSun)
          fColor = texture(sun_color, vTexCoord);
        else if(uIsEarth)
        {
          fColor = texture(earth_color, vTexCoord);
          dHdxy = dHdxy_fwd(earth_bump, vTexCoord, bumpness);
        }
        else if(uIsMoon)
        {
          fColor = texture(moon_color, vTexCoord);
          dHdxy = dHdxy_fwd(moon_bump, vTexCoord, bumpness);
        }
    
    
    
        // Нормализуем нормаль, потому что она интерполируется и больше не имеет длину 1.0
        vec3 normal = normalize(vNormal);
    
        
        // Вычисляем направление света и делаем его длину равной 1.
        vec3 lightDirection = normalize(uLightPosition - vPosition);
    
    
    
        // Скалярное произведение направления света и ориентации поверхности (нормали)
        float nDotL;
        if(uIsSun)
          nDotL = 1.0;
        else
          nDotL = max(dot(lightDirection, normal), 0.0);
    
    
    
        // Вычисляем финальный цвет из диффузного отражения и окружающего отражения
        vec3 diffuse = uLightColor * fColor.rgb * nDotL;
        vec3 ambient = uAmbientLight * fColor.rgb;
        float specularFactor = texture(specularMap, vTexCoord).r; //Извлечение цветовой информации из изображения
    
        
        
        
        vec3 diffuseBump;
        if(uIsEarth || uIsMoon)
        {
          bumpNormal = pertubNormalArb(vPosition, normal, dHdxy);
          diffuseBump = min(diffuse + dot(bumpNormal, lightDirection), 1.1);
        }
    
        vec3 specular = vec3(0.0);
        float shiness = 12.0;
        vec3 lightSpecular = vec3(1.0);
    
        if(uIsEarth && nDotL > 0.0)
        {
          vec3 v = normalize(-vPosition); // Позиция глаза
          vec3 r = reflect(-lightDirection, bumpNormal); // Отражение от поверхности
          specular = lightSpecular * specularFactor * pow(dot(r, v), shiness);
        }
        
        //Обновляем финальный цвет
        if(uIsEarth)
          fColor = vec4( (diffuse * diffuseBump * specular) + ambient, fColor.a); // Блики
        else if(uIsMoon)
          fColor = vec4( (diffuse * diffuseBump) + ambient, fColor.a);
        else if(uIsSun)
          fColor = vec4(diffuse + ambient, fColor.a);
    }`;


Можете ли вы сказать мне, где мне нужно проверить?

  [1]: https://i.stack.imgur.com/eJgLg.png
  [2]: https://i.stack.imgur.com/zRSZu.png
  [3]: http://planetpixelemporium.com/earth.html

## Ответ:

Если бы это был я, я бы сначала упростил шейдер до самой простой вещи и посмотрел, получаю ли я то, что хочу. Вы хотите блики, так получаете ли вы блики только с расчетами бликов в ваших шейдерах?

Обрезка ваших шейдеров до простого рисования плоского освещения по Фонгу не дала правильных результатов.

Эта строка:

```
fColor = vec4( (diffuse * specular) + ambient, fColor.a);
```

должна была быть:

```
fColor = vec4( (diffuse + specular) + ambient, fColor.a);
```

Вы добавляете блики, а не умножаете на них.

{{{example url="../webgl-qna-apply-a-displacement-map-and-specular-map-example-1.html"}}}

Теперь мы можем добавить карту бликов:

{{{example url="../webgl-qna-apply-a-displacement-map-and-specular-map-example-2.html"}}}

Затем вам, возможно, не стоит использовать много булевых условий в вашем шейдере. Либо создайте разные шейдеры, либо найдите способ сделать это без булевых значений. Так, например, нам не нужны:

```
uniform sampler2D earth_disp;
uniform sampler2D moon_disp;

uniform sampler2D sun_color;
uniform sampler2D earth_color;
uniform sampler2D moon_color;

uniform sampler2D earth_bump;
uniform sampler2D moon_bump;

uniform bool uIsSun;
uniform bool uIsEarth;
uniform bool uIsMoon;
```

мы можем просто иметь:

```
uniform sampler2D displacementMap;
uniform sampler2D surfaceColor;
uniform sampler2D bumpMap;
```

Затем мы можем установить `displacementMap` и `bumpMap` на текстуру одного пикселя 0,0,0,0, и не будет ни смещения, ни неровностей.

Что касается разного освещения для солнца, учитывая, что солнце не использует ни карту неровностей, ни карту смещения, ни даже освещение вообще, возможно, было бы лучше использовать другой шейдер, но мы также можем просто добавить значение `maxDot` так:

```
uniform float maxDot;

...

   nDotL = max(dot(lightDirection, normal), maxDot)
```

Если `maxDot` равен нулю, мы получим нормальное скалярное произведение. Если `maxDot` равен единице, мы не получим освещения.

{{{example url="../webgl-qna-apply-a-displacement-map-and-specular-map-example-3.html"}}}

Что касается смещения, смещение работает только на вершинах, поэтому вам нужно много вершин в вашей сфере, чтобы увидеть любое смещение.

Также была ошибка, связанная со смещением. Вы передаете нормали как vec4, и эта строка:

    displace += (displaceFactor * disp - displaceBias) * aNormal;

В итоге добавляет смещение vec4. Другими словами, допустим, вы начали с `a_Position` равным `vec4(1,0,0,1)`, что было бы на левой стороне сферы. `aNormal`, потому что вы объявили его как `vec4`, вероятно, тоже `vec4(1,0,0,1)`. Предполагая, что вы фактически передаете данные vec3 нормали через атрибуты из вашего буфера, значение по умолчанию для W равно 1. Допустим, `disp` равен 1, `displaceFactor` равен 2, а `displaceBias` равен 0.5, что у вас было. Вы получаете:

    displace = vec4(1,0,0,1) + (2 * 1 + 0.5) * vec4(1,0,0,1)
    displace = vec4(1,0,0,1) + (1.5) * vec4(1,0,0,1)
    displace = vec4(1,0,0,1) + vec4(1.5,0,0,1.5)
    displace = vec4(2.5,0,0,2.5)

Но вы не хотите, чтобы W был 2.5. Одно исправление - просто использовать xyz часть нормали:

    displace.xyz += (displaceFactor * disp - displaceBias) * aNormal.xyz;

Более нормальное исправление - объявить атрибут нормали только как vec3:

    in vec3 aNormal;

    displace.xyz += (displaceFactor * disp - displaceBias) * aNormal;

В моем примере выше сферы имеют только радиус = 1, поэтому мы хотим только немного скорректировать это смещение. Я установил `displaceFactor` равным 0.1 и `displaceBias` равным 0.

<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 4.0 от
    <a data-href="https://stackoverflow.com/users/12203820">ZeroFive005</a>
    из
    <a data-href="https://stackoverflow.com/questions/59349723">здесь</a>
  </div>
</div> 