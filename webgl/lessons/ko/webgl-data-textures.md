Title: WebGL2 3D - 데이터 텍스처
Description: 텍스처에 데이터 공급하기
TOC: 데이터 텍스처


이 포스트는 WebGL2 관련 시리즈에서 이어집니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했고, 이전에는 [텍스처](webgl-3d-textures.html)에 관한 것이었습니다.

지난 포스트에서 텍스처가 작동하는 방법과 이를 적용하는 방법에 대해 살펴봤습니다.
다운로드된 이미지로 텍스처를 생성했는데요.
이번 글에서는 이미지 대신 JavaScript에서 직접 데이터를 생성할 겁니다.

Creating data for a texture in JavaScript is mostly straight forward depending
on the texture format. WebGL2 supports a ton of texture formats though.
WebGL2 supports all the *un-sized* formats from WebGL1

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

They're called *un-sized* because how they are actually represented internally is undefined in WebGL1.
It is defined in WebGL2. In addition to those un-sized formats there are a slew of sized formats including

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

And these depth and stencil formats as well

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

Legend:

* a single number like `8` means 8bits that will be normalized from 0 to 1
* a number preceded by an `s` like `s8` means a signed 8bit number that will be normalized from -1 to 1
* a number preceded by an `f` like `f16` means a floating point number.
* a number preceded by in `i` like `i8` means an integer number.
* a number preceded by in `ui` like `ui8` means an unsigned integer number.

We won't use this info here but I <span class="tabular-highlight">highlighted</span>
the half and float texture formats to show unlike WebGL1 they are always available in WebGL2
but they are not marked as either color renderable and/or texture filterable by default.
Not being color renderable means they can not be rendered to. [Rendering to a texture is
covered in another lesson](webgl-render-to-texture.html). Not texture filterable means they
must be used with `gl.NEAREST` only. Both of those features are available as optional
extensions in WebGL2.

For each of the formats you specify both the *internal format* (the format the GPU will use internally)
and the *format* and *type* of the data you're supplying to WebGL. Here is a table showing which format
and type you must supply data for a given internal format

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


Let's create a 3x2 pixel `R8` texture. Because it's an `R8` texture
there is only 1 value per pixel in the red channel.

[지난 글](webgl-3d-textures.html)에서 샘플을 가져올 겁니다.
먼저 큐브의 각 면에 전체 텍스처를 사용하기 위해 텍스처 좌표를 수정합시다.

```
// 큐브의 텍스처 좌표로 버퍼 채우기
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

그런 다음 텍스처 생성 코드를 수정하는데

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

// 필터링을 설정했으므로 mip은 필요없으며 필터링되지 않습니다.
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// 비동기적으로 이미지 로드
-...
```

그리고 여기 결과입니다.

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

이런! 왜 작동하지 않죠?!?!?

JavaScript console을 확인하면 이런 오류가 표시됩니다.

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

WebGL에는 OpenGL이 처음 만들어졌을 때의 모호한 설정들이 남아있는데요.
데이터가 어떤 크기일 때 가끔씩 컴퓨터가 더 빨라집니다.
예를 들어 한 번에 1byte가 아닌 2, 4, 8 byte를 복사하는 것이 더 빠를 수 있습니다.
WebGL은 기본적으로 한 번에 4byte를 사용하므로 각 데이터 행을 4byte의 배수로 생각합니다.

위의 데이터는 행마다 3byte, 총 6byte에 불과하지만, WebGL은 첫 번째 행에 대해 4byte, 두 번째 행에 대해 3byte, 총 7byte를 읽습니다.

다음과 같이 한 번에 1byte를 처리하도록 WebGL에 지시할 수 있습니다.

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

1, 2, 4, 8이 alignment에 유효한 값입니다.

WebGL에서 정렬된 데이터와 비정렬 데이터 사이의 속도 차이를 측정할 수 없다고 생각합니다.
이 문제가 새로운 사용자들에게 영향을 주지 않도록 4가 아닌 1을 기본값으로 하고 싶지만, OpenGL과의 호환성을 유지하기 위해 기본값은 유지되어야 했습니다.
이렇게 하면 포팅된 앱이 패딩된 행을 제공하는 경우 변경없이 작동될 겁니다.
동시에 새 앱에서 항상 `1`로 설정한 다음 끝낼 수 있습니다.

{{{example url="../webgl-data-texture-3x2.html" }}}

이 부분을 다뤘으니 이제 [텍스처 렌더링](webgl-render-to-texture.html)으로 넘어갑시다.

<div class="webgl_bottombar">
<h3>Pixel vs Texel</h3>
<p>
가끔씩 texture의 pixel이 texel로 불리는데요.
Pixel은 Picture Element의 줄임말입니다.
Texel은 Texture Element의 줄임말이죠.
</p>
<p>
물론 그래픽 전문가들의 말에 귀 기울일 것이지만, 제가 아는 한 "texel"은 전문 용어의 한 예시입니다.
개인적으로 저는 별생각 없이 texture element를 언급할 때 일반적으로 "pixel"을 사용합니다 &#x1f607;
</p>
</div>

