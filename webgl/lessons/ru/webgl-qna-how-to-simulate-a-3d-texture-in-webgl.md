Title: Как симулировать 3D текстуру в WebGL
Description: Как симулировать 3D текстуру в WebGL
TOC: Как симулировать 3D текстуру в WebGL

## Вопрос:

Итак, в WebGL я могу хранить текстуру максимум в 2 измерениях и читать её в шейдере с помощью texture2D(whatever);

Если я хочу хранить 3-мерную текстуру, чтобы читать 3-мерные данные в шейдере, как это сделать?

Вот мои идеи — и я хочу знать, правильно ли я подхожу к этому:

В JavaScript:

    var info = [];
    
    for (var x = 0; x < 1; x+=.1) {
         for (var y = 0; y < 1; y+=.1) {
              for (var z = 0; z < 1; z+=.1) {
    
                   info.push (x*y*z); 
                   info.push(0);
                   info.push(0);
                   info.push(0);

              }
         }
    }
    
    //bind texture here- whatever
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 10, 100, 0,
                      gl.RGBA, gl.FLOAT, data_on_shader);
    
    //other texture stuff

В шейдере:

    uniform sampler data_on_shader;
    x= texture.r//
    y = texture.g//
    z = texture.b//
    
    xfixed = floor(x*10.)/10. + .5;
    yfixed = floor(y*10.)/10. + .5;
    zfixed = floor(z*10.)/10. + .5;
    
    float data_received = texture2D(data_on_shader, vec2(xfixed, yfixed*10. + zfixed)).r;

Что-то вроде использования row major order в 2D текстуре?
Мысли?

Спасибо заранее!

## Ответ:

Вы можете симулировать 3D текстуру, сохраняя каждую плоскость 3D текстуры в 2D текстуре

Затем функция вроде этой позволит вам использовать её как 3D текстуру:

    vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size) {
        float sliceSize = 1.0 / size;                         // пространство 1 среза
        float slicePixelSize = sliceSize / size;              // пространство 1 пикселя
        float sliceInnerSize = slicePixelSize * (size - 1.0); // пространство size пикселей
        float zSlice0 = min(floor(texCoord.z * size), size - 1.0);
        float zSlice1 = min(zSlice0 + 1.0, size - 1.0);
        float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
        float s0 = xOffset + (zSlice0 * sliceSize);
        float s1 = xOffset + (zSlice1 * sliceSize);
        vec4 slice0Color = texture2D(tex, vec2(s0, texCoord.y));
        vec4 slice1Color = texture2D(tex, vec2(s1, texCoord.y));
        float zOffset = mod(texCoord.z * size, 1.0);
        return mix(slice0Color, slice1Color, zOffset);
     }

Если ваша 3D текстура была 8x8x8, то вы создаёте 2D текстуру 64x8 и помещаете каждую плоскость 3D текстуры в вашу 2D текстуру. Затем, зная, что изначально было 8x8x8, вы передаёте `8.0` для размера в `sampleAs3DTexture`

    precision mediump float;
    uniform sampler2D u_my3DTexture;
    varying vec3 v_texCoord;

    ...

    #define CUBE_SIZE 8.0

    void main() {
      gl_FragColor = sampleAs3DTexture(u_my3DTexture, v_texCoord, CUBE_SIZE);
    }

Примечание: функция выше предполагает, что вы хотите билинейную фильтрацию между плоскостями. Если не хотите, можете упростить функцию.

Есть [видео-объяснение этого кода здесь][1], которое взято из [этого примера][2].


  [1]: http://www.youtube.com/watch?v=rfQ8rKGTVlg#t=26m00s
  [2]: http://webglsamples.googlecode.com/hg/color-adjust/color-adjust.html

<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 3.0 от
    <a data-href="https://stackoverflow.com/users/1840804">Skorpius</a>
    из
    <a data-href="https://stackoverflow.com/questions/19939557">здесь</a>
  </div>
</div> 