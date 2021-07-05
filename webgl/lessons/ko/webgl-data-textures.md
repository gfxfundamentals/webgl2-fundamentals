Title: WebGL2 3D - 데이터 텍스처
Description: 텍스처에 데이터 공급하기
TOC: 데이터 텍스처


이 글은 WebGL2 시리즈에서 이어지는 글입니다.
첫 번째 글은 [WebGL2 기초](webgl-fundamentals.html)였고, 이전 글은 [텍스처](webgl-3d-textures.html)입니다.

지난 글에서 텍스처가 작동하는 방법과 이를 적용하는 방법에 대해 살펴봤습니다.
다운로드된 이미지로 텍스처를 생성했는데요,
이번 글에서는 이미지 대신 자바스크립트에서 직접 데이터를 생성할 겁니다.

자바스크립트로 텍스처로 사용할 데이터를 만드는 것은 텍스처 포맷을 보시면 대부분 명확합니다.
WebGL2는 아주 많은 텍스처 포맷을 지원합니다.
WebGL2에서는 WebGL1의 모든 *un-sized* 포맷을 지원합니다.

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>Format</td><td>Type</td><td>Channels</td><td>Bytes per pixel</td></tr>
    </thead>
    <tbody>
      <tr><td>RGBA</td><td>UNSIGNED_BYTE</td><td>4</td><td>4</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_BYTE</td><td>3</td><td>3</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_4_4_4_4</td><td>4</td><td>2</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_5_5_5_1</td><td>4</td><td>2</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_SHORT_5_6_5</td><td>3</td><td>2</td></tr>
      <tr><td>LUMINANCE_ALPHA</td><td>UNSIGNED_BYTE</td><td>2</td><td>2</td></tr>
      <tr><td>LUMINANCE</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
      <tr><td>ALPHA</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
    </tbody>
  </table>
</div>

*un-sized*라고 부르는 이유는 WebGL1에서는 이들이 내부적으로 어떻게 표현될지가 정해져 있지 않기 때문입니다.
WebGL2에서는 정해져 있습니다. 이러한 un-sized포맷 이외에도 다수의 sized포맷들이 있습니다.
1
<div class="webgl_center">
  <table class="tabular-data tabular-data2">
    <thead>
      <tr>
        <td>Sized<br/>Format</td>
        <td>Base<br/>Format</td>
        <td>R<br/>bits</td>
        <td>G<br/>bits</td>
        <td>B<br/>bits</td>
        <td>A<br/>bits</td>
        <td>Shared<br/>bits</td>
        <td>Color<br/>renderable</td>
        <td>Texture<br/>filterable</td>
      </tr>
    </thead>
    <tbody>
      <!--    sized                   base          r             g             b            a            shared        renderable        filterable     -->
      <tr><td>R8             </td><td>RED  </td><td>8    </td><td>     </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>R8_SNORM       </td><td>RED  </td><td>s8   </td><td>     </td><td>    </td><td>    </td><td>     </td><td>         </td><td>&#x25cf;</td></tr>
      <tr><td>RG8            </td><td>RG   </td><td>8    </td><td>8    </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>RG8_SNORM      </td><td>RG   </td><td>s8   </td><td>s8   </td><td>    </td><td>    </td><td>     </td><td>         </td><td>&#x25cf;</td></tr>
      <tr><td>RGB8           </td><td>RGB  </td><td>8    </td><td>8    </td><td>8   </td><td>    </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>RGB8_SNORM     </td><td>RGB  </td><td>s8   </td><td>s8   </td><td>s8  </td><td>    </td><td>     </td><td>         </td><td>&#x25cf;</td></tr>
      <tr><td>RGB565         </td><td>RGB  </td><td>5    </td><td>6    </td><td>5   </td><td>    </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>RGBA4          </td><td>RGBA </td><td>4    </td><td>4    </td><td>4   </td><td>4   </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>RGB5_A1        </td><td>RGBA </td><td>5    </td><td>5    </td><td>5   </td><td>1   </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>RGBA8          </td><td>RGBA </td><td>8    </td><td>8    </td><td>8   </td><td>8   </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>RGBA8_SNORM    </td><td>RGBA </td><td>s8   </td><td>s8   </td><td>s8  </td><td>s8  </td><td>     </td><td>         </td><td>&#x25cf;</td></tr>
      <tr><td>RGB10_A2       </td><td>RGBA </td><td>10   </td><td>10   </td><td>10  </td><td>2   </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>RGB10_A2UI     </td><td>RGBA </td><td>ui10 </td><td>ui10 </td><td>ui10</td><td>ui2 </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>SRGB8          </td><td>RGB  </td><td>8    </td><td>8    </td><td>8   </td><td>    </td><td>     </td><td>         </td><td>&#x25cf;</td></tr>
      <tr><td>SRGB8_ALPHA8   </td><td>RGBA </td><td>8    </td><td>8    </td><td>8   </td><td>8   </td><td>     </td><td>&#x25cf; </td><td>&#x25cf;</td></tr>
      <tr><td>R16F           </td><td>RED  </td><td>f16  </td><td>     </td><td>    </td><td>    </td><td>     </td><td class="tabular-highlight">         </td><td>&#x25cf;</td></tr>
      <tr><td>RG16F          </td><td>RG   </td><td>f16  </td><td>f16  </td><td>    </td><td>    </td><td>     </td><td class="tabular-highlight">         </td><td>&#x25cf;</td></tr>
      <tr><td>RGB16F         </td><td>RGB  </td><td>f16  </td><td>f16  </td><td>f16 </td><td>    </td><td>     </td><td class="tabular-highlight">         </td><td>&#x25cf;</td></tr>
      <tr><td>RGBA16F        </td><td>RGBA </td><td>f16  </td><td>f16  </td><td>f16 </td><td>f16 </td><td>     </td><td class="tabular-highlight">         </td><td>&#x25cf;</td></tr>
      <tr><td>R32F           </td><td>RED  </td><td>f32  </td><td>     </td><td>    </td><td>    </td><td>     </td><td class="tabular-highlight">         </td><td class="tabular-highlight">        </td></tr>
      <tr><td>RG32F          </td><td>RG   </td><td>f32  </td><td>f32  </td><td>    </td><td>    </td><td>     </td><td class="tabular-highlight">         </td><td class="tabular-highlight">        </td></tr>
      <tr><td>RGB32F         </td><td>RGB  </td><td>f32  </td><td>f32  </td><td>f32 </td><td>    </td><td>     </td><td class="tabular-highlight">         </td><td class="tabular-highlight">        </td></tr>
      <tr><td>RGBA32F        </td><td>RGBA </td><td>f32  </td><td>f32  </td><td>f32 </td><td>f32 </td><td>     </td><td class="tabular-highlight">         </td><td class="tabular-highlight">        </td></tr>
      <tr><td>R11F_G11F_B10F </td><td>RGB  </td><td>f11  </td><td>f11  </td><td>f10 </td><td>    </td><td>     </td><td>         </td><td>&#x25cf;</td></tr>
      <tr><td>RGB9_E5        </td><td>RGB  </td><td>9    </td><td>9    </td><td>9   </td><td>    </td><td>5    </td><td>         </td><td>&#x25cf;</td></tr>
      <tr><td>R8I            </td><td>RED  </td><td>i8   </td><td>     </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>R8UI           </td><td>RED  </td><td>ui8  </td><td>     </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>R16I           </td><td>RED  </td><td>i16  </td><td>     </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>R16UI          </td><td>RED  </td><td>ui16 </td><td>     </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>R32I           </td><td>RED  </td><td>i32  </td><td>     </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>R32UI          </td><td>RED  </td><td>ui32 </td><td>     </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RG8I           </td><td>RG   </td><td>i8   </td><td>i8   </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RG8UI          </td><td>RG   </td><td>ui8  </td><td>ui8  </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RG16I          </td><td>RG   </td><td>i16  </td><td>i16  </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RG16UI         </td><td>RG   </td><td>ui16 </td><td>ui16 </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RG32I          </td><td>RG   </td><td>i32  </td><td>i32  </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RG32UI         </td><td>RG   </td><td>ui32 </td><td>ui32 </td><td>    </td><td>    </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RGB8I          </td><td>RGB  </td><td>i8   </td><td>i8   </td><td>i8  </td><td>    </td><td>     </td><td>         </td><td>        </td></tr>
      <tr><td>RGB8UI         </td><td>RGB  </td><td>ui8  </td><td>ui8  </td><td>ui8 </td><td>    </td><td>     </td><td>         </td><td>        </td></tr>
      <tr><td>RGB16I         </td><td>RGB  </td><td>i16  </td><td>i16  </td><td>i16 </td><td>    </td><td>     </td><td>         </td><td>        </td></tr>
      <tr><td>RGB16UI        </td><td>RGB  </td><td>ui16 </td><td>ui16 </td><td>ui16</td><td>    </td><td>     </td><td>         </td><td>        </td></tr>
      <tr><td>RGB32I         </td><td>RGB  </td><td>i32  </td><td>i32  </td><td>i32 </td><td>    </td><td>     </td><td>         </td><td>        </td></tr>
      <tr><td>RGB32UI        </td><td>RGB  </td><td>ui32 </td><td>ui32 </td><td>ui32</td><td>    </td><td>     </td><td>         </td><td>        </td></tr>
      <tr><td>RGBA8I         </td><td>RGBA </td><td>i8   </td><td>i8   </td><td>i8  </td><td>i8  </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RGBA8UI        </td><td>RGBA </td><td>ui8  </td><td>ui8  </td><td>ui8 </td><td>ui8 </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RGBA16I        </td><td>RGBA </td><td>i16  </td><td>i16  </td><td>i16 </td><td>i16 </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RGBA16UI       </td><td>RGBA </td><td>ui16 </td><td>ui16 </td><td>ui16</td><td>ui16</td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RGBA32I        </td><td>RGBA </td><td>i32  </td><td>i32  </td><td>i32 </td><td>i32 </td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
      <tr><td>RGBA32UI       </td><td>RGBA </td><td>ui32 </td><td>ui32 </td><td>ui32</td><td>ui32</td><td>     </td><td>&#x25cf; </td><td>        </td></tr>
    </tbody>
  </table>
</div>

아래와 같은 깊이와 스텐실을 위한 포맷도 있습니다.

<div class="webgl_center">
  <table class="tabular-data tabular-data3">
    <thead>
      <tr>
        <td>Sized<br/>Format</td>
        <td>Base<br/>Format</td>
        <td>Depth<br/>bits</td>
        <td>Stencil<br/>bits</td>
      </tr>
    </thead>
    <tbody>
      <!--    sized                       base                     d            s         -->
      <tr><td>DEPTH_COMPONENT16  </td><td>DEPTH_COMPONENT </td><td>16  </td><td>   </td></tr>
      <tr><td>DEPTH_COMPONENT24  </td><td>DEPTH_COMPONENT </td><td>24  </td><td>   </td></tr>
      <tr><td>DEPTH_COMPONENT32F </td><td>DEPTH_COMPONENT </td><td>f32 </td><td>   </td></tr>
      <tr><td>DEPTH24_STENCIL8   </td><td>DEPTH_STENCIL   </td><td>24  </td><td>ui8</td></tr>
      <tr><td>DEPTH32F_STENCIL8  </td><td>DEPTH_STENCIL   </td><td>f32 </td><td>ui8</td></tr>
    </tbody>
  </table>
</div>

범례:

* `8`과 같은 숫자는 0과 1사이로 정규화되는 8비트를 의미합니다.
* `s8`과 같이 숫자 앞에 `s`가 붙으면 부호가 있는(signed) 8비트 숫자로 -1에서 1 사이로 정규화됩니다.
* `f16`과 같이 숫자 앞에 `f`가 붙으면 부동소수점 수를 의미합니다.
* `i8`과 같이 숫자 앞에 `i`가 붙으면 정수형 수를 의미합니다.
* `ui8`과 같이 숫자 앞에 `ui`가 붙으면 부호가 없는(unsigned) 정수형 수를 의미합니다.

여기서 사용할 것은 아니지만 half와 float 텍스처 포맷에 <span class="tabular-highlight">하이라이트</span>를 해 두었습니다. 
WebGL1과 달리 WebGL2에서는 이러한 포맷이 항상 사용은 가능하지만 기본적으로는 color renderable이나 texture filterable이 아니라는 것을 강조하기 위함입니다.
color renderable이 아니라는 뜻은 렌더링 대상이 되지 않는다는 뜻입니다. [텍스처에 렌더링하는 법은 다른 글에 설명되어 있습니다](webgl-render-to-texture.html).
texture filterable이 아니라는 것은 `gl.NEAREST` 옵션으로만 사용해야 한다는 뜻입니다.
이 기능들은 WebGL2에서는 선택적 확장 기능(optional extension)으로 제공됩니다.

이러한 포맷들에 대해서 여러분은 *내부(internal) 포맷* (GPU 내부에서 사용할 포맷)과 *포맷* 그리고 데이터의 *타입*을 명시해 주어야 합니다.
아래 표는 내부 포맷에 대해 어떠한 포맷과 타입을 제공해야 하는지를 나타낸 표 입니다.

<div class="webgl_center">
  <table class="tabular-data tabular-data4">
    <thead>
      <tr>
        <td>Internal<br/>Format</td>
        <td>Format</td>
        <td>Type</td>
        <td>Source<br/>Bytes<br/>Per Pixel</td>
      </tr>
    </thead>
    <tbody>
      <tr><td>RGBA8<br/>RGB5_A1<br/>RGBA4<br/>SRGB8_ALPHA8    </td><td>RGBA            </td><td>UNSIGNED_BYTE                  </td><td>4  </td></tr>
      <tr><td>RGBA8_SNORM                                     </td><td>RGBA            </td><td>BYTE                           </td><td>4  </td></tr>
      <tr><td>RGBA4                                           </td><td>RGBA            </td><td>UNSIGNED_SHORT_4_4_4_4         </td><td>2  </td></tr>
      <tr><td>RGB5_A1                                         </td><td>RGBA            </td><td>UNSIGNED_SHORT_5_5_5_1         </td><td>2  </td></tr>
      <tr><td>RGB10_A2<br/>RGB5_A1                            </td><td>RGBA            </td><td>UNSIGNED_INT_2_10_10_10_REV    </td><td>4  </td></tr>
      <tr><td>RGBA16F                                         </td><td>RGBA            </td><td>HALF_FLOAT                     </td><td>8  </td></tr>
      <tr><td>RGBA32F<br/>RGBA16F                             </td><td>RGBA            </td><td>FLOAT                          </td><td>16 </td></tr>
      <tr><td>RGBA8UI                                         </td><td>RGBA_INTEGER    </td><td>UNSIGNED_BYTE                  </td><td>4  </td></tr>
      <tr><td>RGBA8I                                          </td><td>RGBA_INTEGER    </td><td>BYTE                           </td><td>4  </td></tr>
      <tr><td>RGBA16UI                                        </td><td>RGBA_INTEGER    </td><td>UNSIGNED_SHORT                 </td><td>8  </td></tr>
      <tr><td>RGBA16I                                         </td><td>RGBA_INTEGER    </td><td>SHORT                          </td><td>8  </td></tr>
      <tr><td>RGBA32UI                                        </td><td>RGBA_INTEGER    </td><td>UNSIGNED_INT                   </td><td>16 </td></tr>
      <tr><td>RGBA32I                                         </td><td>RGBA_INTEGER    </td><td>INT                            </td><td>16 </td></tr>
      <tr><td>RGB10_A2UI                                      </td><td>RGBA_INTEGER    </td><td>UNSIGNED_INT_2_10_10_10_REV    </td><td>4  </td></tr>
      <tr><td>RGB8<br/>RGB565<br/>SRGB8                       </td><td>RGB             </td><td>UNSIGNED_BYTE                  </td><td>3  </td></tr>
      <tr><td>RGB8_SNORM                                      </td><td>RGB             </td><td>BYTE                           </td><td>3  </td></tr>
      <tr><td>RGB565                                          </td><td>RGB             </td><td>UNSIGNED_SHORT_5_6_5           </td><td>2  </td></tr>
      <tr><td>R11F_G11F_B10F                                  </td><td>RGB             </td><td>UNSIGNED_INT_10F_11F_11F_REV   </td><td>4  </td></tr>
      <tr><td>RGB9_E5                                         </td><td>RGB             </td><td>UNSIGNED_INT_5_9_9_9_REV       </td><td>4  </td></tr>
      <tr><td>RGB16F<br/>R11F_G11F_B10F<br/>RGB9_E5           </td><td>RGB             </td><td>HALF_FLOAT                     </td><td>6  </td></tr>
      <tr><td>RGB32F<br/>RGB16F<br/>R11F_G11F_B10F<br/>RGB9_E5</td><td>RGB             </td><td>FLOAT                          </td><td>12 </td></tr>
      <tr><td>RGB8UI                                          </td><td>RGB_INTEGER     </td><td>UNSIGNED_BYTE                  </td><td>3  </td></tr>
      <tr><td>RGB8I                                           </td><td>RGB_INTEGER     </td><td>BYTE                           </td><td>3  </td></tr>
      <tr><td>RGB16UI                                         </td><td>RGB_INTEGER     </td><td>UNSIGNED_SHORT                 </td><td>6  </td></tr>
      <tr><td>RGB16I                                          </td><td>RGB_INTEGER     </td><td>SHORT                          </td><td>6  </td></tr>
      <tr><td>RGB32UI                                         </td><td>RGB_INTEGER     </td><td>UNSIGNED_INT                   </td><td>12 </td></tr>
      <tr><td>RGB32I                                          </td><td>RGB_INTEGER     </td><td>INT                            </td><td>12 </td></tr>
      <tr><td>RG8                                             </td><td>RG              </td><td>UNSIGNED_BYTE                  </td><td>2  </td></tr>
      <tr><td>RG8_SNORM                                       </td><td>RG              </td><td>BYTE                           </td><td>2  </td></tr>
      <tr><td>RG16F                                           </td><td>RG              </td><td>HALF_FLOAT                     </td><td>4  </td></tr>
      <tr><td>RG32F<br/>RG16F                                 </td><td>RG              </td><td>FLOAT                          </td><td>8  </td></tr>
      <tr><td>RG8UI                                           </td><td>RG_INTEGER      </td><td>UNSIGNED_BYTE                  </td><td>2  </td></tr>
      <tr><td>RG8I                                            </td><td>RG_INTEGER      </td><td>BYTE                           </td><td>2  </td></tr>
      <tr><td>RG16UI                                          </td><td>RG_INTEGER      </td><td>UNSIGNED_SHORT                 </td><td>4  </td></tr>
      <tr><td>RG16I                                           </td><td>RG_INTEGER      </td><td>SHORT                          </td><td>4  </td></tr>
      <tr><td>RG32UI                                          </td><td>RG_INTEGER      </td><td>UNSIGNED_INT                   </td><td>8  </td></tr>
      <tr><td>RG32I                                           </td><td>RG_INTEGER      </td><td>INT                            </td><td>8  </td></tr>
      <tr><td>R8                                              </td><td>RED             </td><td>UNSIGNED_BYTE                  </td><td>1  </td></tr>
      <tr><td>R8_SNORM                                        </td><td>RED             </td><td>BYTE                           </td><td>1  </td></tr>
      <tr><td>R16F                                            </td><td>RED             </td><td>HALF_FLOAT                     </td><td>2  </td></tr>
      <tr><td>R32F<br/>R16F                                   </td><td>RED             </td><td>FLOAT                          </td><td>4  </td></tr>
      <tr><td>R8UI                                            </td><td>RED_INTEGER     </td><td>UNSIGNED_BYTE                  </td><td>1  </td></tr>
      <tr><td>R8I                                             </td><td>RED_INTEGER     </td><td>BYTE                           </td><td>1  </td></tr>
      <tr><td>R16UI                                           </td><td>RED_INTEGER     </td><td>UNSIGNED_SHORT                 </td><td>2  </td></tr>
      <tr><td>R16I                                            </td><td>RED_INTEGER     </td><td>SHORT                          </td><td>2  </td></tr>
      <tr><td>R32UI                                           </td><td>RED_INTEGER     </td><td>UNSIGNED_INT                   </td><td>4  </td></tr>
      <tr><td>R32I                                            </td><td>RED_INTEGER     </td><td>INT                            </td><td>4  </td></tr>
      <tr><td>DEPTH_COMPONENT16                               </td><td>DEPTH_COMPONENT </td><td>UNSIGNED_SHORT                 </td><td>2  </td></tr>
      <tr><td>DEPTH_COMPONENT24<br/>DEPTH_COMPONENT16         </td><td>DEPTH_COMPONENT </td><td>UNSIGNED_INT                   </td><td>4  </td></tr>
      <tr><td>DEPTH_COMPONENT32F                              </td><td>DEPTH_COMPONENT </td><td>FLOAT                          </td><td>4  </td></tr>
      <tr><td>DEPTH24_STENCIL8                                </td><td>DEPTH_STENCIL   </td><td>UNSIGNED_INT_24_8              </td><td>4  </td></tr>
      <tr><td>DEPTH32F_STENCIL8                               </td><td>DEPTH_STENCIL   </td><td>FLOAT_32_UNSIGNED_INT_24_8_REV </td><td>8  </td></tr>

      <tr><td>RGBA                                            </td><td>RGBA            </td><td>UNSIGNED_BYTE                  </td><td>4  </td></tr>
      <tr><td>RGBA                                            </td><td>RGBA            </td><td>UNSIGNED_SHORT_4_4_4_4         </td><td>2  </td></tr>
      <tr><td>RGBA                                            </td><td>RGBA            </td><td>UNSIGNED_SHORT_5_5_5_1         </td><td>2  </td></tr>
      <tr><td>RGB                                             </td><td>RGB             </td><td>UNSIGNED_BYTE                  </td><td>3  </td></tr>
      <tr><td>RGB                                             </td><td>RGB             </td><td>UNSIGNED_SHORT_5_6_5           </td><td>2  </td></tr>
      <tr><td>LUMINANCE_ALPHA                                 </td><td>LUMINANCE_ALPHA </td><td>UNSIGNED_BYTE                  </td><td>2  </td></tr>
      <tr><td>LUMINANCE                                       </td><td>LUMINANCE       </td><td>UNSIGNED_BYTE                  </td><td>1  </td></tr>
      <tr><td>ALPHA                                           </td><td>ALPHA           </td><td>UNSIGNED_BYTE                  </td><td>1  </td></tr>

    </tbody>
  </table>
</div>


3x2 픽셀 크기의 `R8` 텍스처를 만들어 봅시다.
`R8` 텍스처리므로 각 픽셀마다 Red 채널에 한 개의 값만 가집니다.

[지난 글](webgl-3d-textures.html)에서 샘플을 가져올 겁니다.
먼저 육면체의 각 면에 전체 텍스처를 사용하기 위해 텍스처 좌표를 수정합시다.

```
// 육면체의 텍스처 좌표로 버퍼 채우기
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // 앞면
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

그런 다음 텍스처 생성 코드를 수정합니다.

```
// 텍스처 생성
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// 1x1 파란색 픽셀로 텍스처 채우기
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// 3x2 픽셀로 텍스처 채우기
const level = 0;
const internalFormat = gl.R8;
const width = 3;
const height = 2;
const border = 0;
const format = gl.RED;
const type = gl.UNSIGNED_BYTE;
const data = new Uint8Array([
  128,  64, 128,
    0, 192,   0,
]);
gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
              format, type, data);

// 밉맵을 사용하지 않고 필터링을 수행하지 않도록 설정합니다.
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// 비동기적으로 이미지 로드
-...
```

그리고 여기 결과입니다.

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

이런! 왜 작동하지 않는걸까요?!?!?

자바스크립트 콘솔을 확인하면 이런 오류가 표시됩니다.

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

WebGL에는 OpenGL이 처음 만들어졌을 때의 모호한 설정들이 남아있습니다.
컴퓨터는 데이터가 특정 크기일 때 더 빠르게 동작합니다.
예를 들어 한 번에 1 바이트가 아닌 2, 4, 8 바이트를 복사하는 것이 더 빠를 수 있습니다.
WebGL은 기본적으로 한 번에 4바이트를 사용하므로 각 데이터 행을 4바이트의 배수로 가정합니다. (마지막 행을 제외하고)

위의 데이터는 행마다 3 바이트로, 총 6 바이트에 불과하지만, WebGL은 첫 번째 행에 대해 4 바이트, 두 번째 행에 대해 3 바이트로, 총 7 바이트를 읽으려 시도합니다. 그래서 오류가 발생하는 것입니다.

다음과 같이 한 번에 1 바이트씩 처리하도록 WebGL에 지시할 수 있습니다.

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

alignment로 사용할 수 있는 값은 1, 2, 4, 8입니다.

WebGL에서 정렬된 데이터와 비정렬 데이터 사이의 속도 차이는 측정할 수 없을 정도로 작을 것으로 생각됩니다.
이 문제가 초보자들을 헷갈리게 만들지 않으려면 4가 아닌 1을 기본값으로 하면 좋겠지만, 
OpenGL과의 호환성을 유지하기 위해 기본값은 동일해야만 했습니다.
이렇게 하면 포팅된 앱이 패딩된 행을 제공하는 경우 변경없이 작동될 겁니다.
아니면 새 앱에서 항상 alignment를 `1`로 설정하고 신경쓰지 않아도 됩니다.

이렇게 설정해 주었으니 잘 동작할겁니다.

{{{example url="../webgl-data-texture-3x2.html" }}}

이제 [텍스처에 렌더링하기](webgl-render-to-texture.html)로 넘어갑시다.

<div class="webgl_bottombar">
<h3>픽셀 vs 텍셀(Texel)</h3>
<p>
텍스처의 픽셀을 텍셀이라고 부르는 경우가 있습니다.
픽셀은 Picture Element의 줄임말입니다.
텍셀은 Texture Element의 줄임말이죠.
</p>
<p>
그래픽 전문가들은 뭐라고 하겠지만, 제가 생각에 "텍셀"은 그냥 복잡한 용어일 뿐입니다.
개인적으로 저는 texture element를 언급할 때 특별히 고민하지 않고 그냥 "픽셀"이라고 합니다. &#x1f607;
</p>
</div>

