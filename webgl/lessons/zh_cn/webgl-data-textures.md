Title: WebGL2 三维数据纹理
Description: 向纹理种传入数据
TOC: 数据纹理

此文上接 WebGL2 系列文章，第一篇是[基础概念](webgl-fundamentals.html)，
上一篇是[纹理](webgl-3d-textures.html)。

上节中讲到了纹理的工作原理以及如何使用，我们用下载的图像创建纹理，
在这篇文章中我们将直接用 JavaScript 创建数据。

根据纹理格式，用 JavaScript 为纹理创建数据是比较直接的。 WebGL2 支持大量纹理格式。
WebGL2 支持所有在 WebGL1 中 _未定义大小_ 的格式

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>格式</td><td>数据类型</td><td>通道数</td><td>单像素字节数</td></tr>
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

它们被称为 _未定义大小_ 因为它们在内部的实际表示方式在 WebGL1 中是未定义的。
它们在 WebGL2 中被定义。 除了那些未定义大小的格式之外，还有许多定义了大小的格式，包括

<div class="webgl_center">
  <table class="tabular-data tabular-data2">
    <thead>
      <tr>
        <td>大小<br/>格式</td>
        <td>基础<br/>格式</td>
        <td>R<br/>位</td>
        <td>G<br/>位</td>
        <td>B<br/>位</td>
        <td>A<br/>位</td>
        <td>共享<br/>位</td>
        <td>可渲染<br/>颜色</td>
        <td>纹理<br/>可过滤</td>
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

还有这些深度和模板格式
And these depth and stencil formats as well

<div class="webgl_center">
  <table class="tabular-data tabular-data3">
    <thead>
      <tr>
        <td>大小<br/>格式</td>
        <td>基本<br/>格式</td>
        <td>深度<br/>位</td>
        <td>模板<br/>位</td>
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

-   单个数字比如 `8` 表示 8 位将归一化为 0 到 1
-   前面有 `s` 的数字比如 `s8` 表示一个有符号的 8 位数字，将归一化为 -1 到 1
-   前面有 `f` 的数字比如 `f16` 表示浮点数。
-   前面有 `i` 的数字比如 `i8` 表示整数。
-   前面有 `ui` 的数字比如 `ui8` 表示无符号整数。

我们不会在此处使用此信息， 但我 <span class="tabular-highlight">突出显示</span>
了 half 和 float 纹理格式以显示与 WebGL1 的不同，它们始终在 WebGL2 中可用，
但默认情况下它们未标记为可渲染颜色和/或可过滤纹理。
不可渲染意味着它们不能被渲染。 [渲染到纹理将在另一课中介绍](webgl-render-to-texture.html)。不可过滤纹理意味着它们必须仅用于 `gl.NEAREST` 。这两个特性都可以作为 WebGL2 中的可选扩展。

对于每种格式，你都指定 _内部格式_ (GPU 将在内部使用的格式)以及您提供给 WebGL 的数据的 _格式_ 和 _类型_ 。这是你提供给内部格式的数据的 _格式_ 和 _类型_

<div class="webgl_center">
  <table class="tabular-data tabular-data4">
    <thead>
      <tr>
        <td>内部<br/>格式</td>
        <td>格式</td>
        <td>类型</td>
        <td>每像素<br/>源字节数</td>
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

让我们创建一个 3×2 像素的 `R8` 纹理， 因为是 `R8` 纹理，
所以在红色通道里每个像素只有一个值

我们继续使用[上篇文章](webgl-3d-textures.html)中的例子，首先修改纹理坐标，每个面使用整个纹理

```
// 填充立方体纹理坐标的缓冲
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // 正面
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

然后修改代码创建一个纹理

```
// 创建一个纹理
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// 用 1x1 的蓝色像素填充纹理
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// 用 3x2 的像素填充纹理
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

// 设置筛选器，我们不需要使用贴图所以就不用筛选器了
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// 异步加载图像
-...
```

这是结果

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

哦！为什么不管用？！？！！

查看 JavaScript 控制台看到这样的错误信息

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

结果是 WebGL 中有一种首次创建 OpenGL 后的模糊设定，
计算机有时在数据为某些特定大小时速度会快一些，
例如一次拷贝 2，4 或 8 个字节比一次拷贝 1 个字节要快，
WebGL 默认使用 4 字节长度，所以它期望每一行数据是多个 4 字节数据（最后一行除外）。

我们之前的数据每行只有 3 个字节，总共为 6 字节，
但是 WebGL 试图在第一行获取 4 个字节，第二行获取 3 个字节，
总共 7 个字节，所以会出现这样的报错。

我们可以告诉 WebGL 一次处理 1 个字节

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

有效参数为 1，2，4 和 8.

我觉得你可能无法计算出对齐数据和非对齐数据的速度区别，
所以希望默认值是 1 而不是 4， 这样这个问题就不会困扰新手，
但是为了适配 OpenGL，所以要保留相同的默认设置，这样移植应用就不用改变行数，
然后可以为新的应用在需要的地方设置属性为 1。

有了这个设置后就能正常运行了

{{{example url="../webgl-data-texture-3x2.html" }}}

有着这些基础就可以讲[渲染到材质](webgl-render-to-texture.html)了。

<div class="webgl_bottombar">
<h3>Pixel vs Texel</h3>
<p>有时纹理上的像素叫 texels，像素是图片元素的简写，Texel 是纹理元素的简写。
</p>
<p>我知道我可能会收到一些图形学大师的牢骚，但是我所说的 "texel" 是一种行话。
我通常在使用纹理的元素时不假思索的使用了“像素”这个词。 &#x1f607;
</p>
</div>
