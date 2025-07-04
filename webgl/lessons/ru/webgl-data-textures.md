Title: WebGL2 3D - Data Textures
Description: Предоставление данных для текстуры.
TOC: Data Textures


Этот пост является продолжением серии постов о WebGL2.
Первый [начался с основ](webgl-fundamentals.html)
и предыдущий был о [текстурах](webgl-3d-textures.html).

В последнем посте мы рассмотрели, как работают текстуры и как их применять.
Мы создавали их из изображений, которые загружали. В этой статье вместо
использования изображения мы создадим данные в JavaScript напрямую.

Создание данных для текстуры в JavaScript в основном простое в зависимости
от формата текстуры. WebGL2 поддерживает тонну форматов текстур.
WebGL2 поддерживает все *неразмерные* форматы из WebGL1

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

Они называются *неразмерными*, потому что то, как они фактически представлены внутренне, не определено в WebGL1.
Это определено в WebGL2. В дополнение к этим неразмерным форматам есть куча размерных форматов, включая

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

И эти форматы глубины и трафарета также

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

Легенда:

* одно число как `8` означает 8 бит, которые будут нормализованы от 0 до 1
* число, предшествующее `s` как `s8` означает знаковое 8-битное число, которое будет нормализовано от -1 до 1
* число, предшествующее `f` как `f16` означает число с плавающей точкой.
* число, предшествующее `i` как `i8` означает целое число.
* число, предшествующее `ui` как `ui8` означает беззнаковое целое число.

Мы не будем использовать эту информацию здесь, но я <span class="tabular-highlight">выделил</span>
половинные и float форматы текстур, чтобы показать, в отличие от WebGL1, они всегда доступны в WebGL2,
но они не отмечены как color renderable и/или texture filterable по умолчанию.
Не быть color renderable означает, что они не могут быть отрендерены. [Рендеринг в текстуру покрыт
в другом уроке](webgl-render-to-texture.html). Не texture filterable означает, что они
должны использоваться только с `gl.NEAREST`. Обе эти функции доступны как опциональные
расширения в WebGL2.

Для каждого из форматов вы указываете как *internal format* (формат, который GPU будет использовать внутренне),
так и *format* и *type* данных, которые вы предоставляете WebGL. Вот таблица, показывающая, какой format
и type вы должны предоставить данные для данного internal format

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


Давайте создадим 3x2 пиксельную `R8` текстуру. Поскольку это `R8` текстура,
есть только 1 значение на пиксель в красном канале.

Мы возьмем образец из [последней статьи](webgl-3d-textures.html). Сначала мы изменим
координаты текстуры, чтобы использовать всю текстуру на каждой грани куба.

```
// Заполняем буфер координатами текстуры куба.
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // передняя грань
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

Затем мы изменим код, который создает текстуру

```
// Создаем текстуру.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// Заполняем текстуру 1x1 синим пикселем.
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// заполняем текстуру 3x2 пикселями
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

// устанавливаем фильтрацию, чтобы нам не нужны были мипы и она не фильтровалась
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// Асинхронно загружаем изображение
-...
```

И вот это

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

Упс! Почему это не работает?!?!?

Проверяя JavaScript консоль, мы видим ошибку что-то вроде этого

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

Оказывается, есть своего рода неясная настройка в WebGL, оставшаяся
с тех пор, когда OpenGL был впервые создан. Компьютеры иногда
работают быстрее, когда данные определенного размера. Например, может
быть быстрее копировать 2, 4 или 8 байт за раз вместо 1 за раз.
WebGL по умолчанию использует 4 байта за раз, поэтому он ожидает, что каждая
строка данных будет кратна 4 байтам (кроме последней строки).

Наши данные выше только 3 байта на строку, 6 байт всего, но WebGL
собирается попытаться прочитать 4 байта для первой строки и 3 байта
для второй строки, всего 7 байт, поэтому он жалуется.

Мы можем сказать WebGL обрабатывать 1 байт за раз так

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

Допустимые значения alignment: 1, 2, 4 и 8.

Я подозреваю, что в WebGL вы не сможете измерить разницу
в скорости между выровненными данными и невыровненными данными. Я хотел бы, чтобы по умолчанию
было 1 вместо 4, чтобы эта проблема не кусала новых пользователей, но, чтобы
остаться совместимым с OpenGL, по умолчанию нужно было остаться тем же.
Таким образом, если портированное приложение предоставляет дополненные строки, оно будет работать без изменений.
В то же время, в новом приложении вы можете просто всегда устанавливать это в `1` и
затем покончить с этим.

С этим установленным вещи должны работать

{{{example url="../webgl-data-texture-3x2.html" }}}

И с этим покрытым давайте перейдем к [рендерингу в текстуру](webgl-render-to-texture.html).

<div class="webgl_bottombar">
<h3>Пиксель vs Тексель</h3>
<p>Иногда пиксели в текстуре называются текселями. Пиксель - это сокращение от Picture Element.
Тексель - это сокращение от Texture Element.
</p>
<p>Я уверен, что получу нагоняй от какого-нибудь гуру графики, но насколько я могу судить, "тексель" - это пример жаргона.
Лично я обычно использую "пиксель" при обращении к элементам текстуры, не думая об этом. &#x1f607;
</p>
</div> 