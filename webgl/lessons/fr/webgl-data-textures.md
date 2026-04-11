Title: WebGL2 3D - Textures de données
Description: Fournir des données à une texture.
TOC: Textures de données


Cet article est la suite d'une série d'articles sur WebGL2.
Le premier [a commencé par les bases](webgl-fundamentals.html)
et le précédent portait sur les [textures](webgl-3d-textures.html).

Dans le dernier article, nous avons vu comment fonctionnent les textures et comment les appliquer.
Nous les avons créées à partir d'images téléchargées. Dans cet article, au lieu d'utiliser
une image, nous allons créer les données directement en JavaScript.

Créer des données pour une texture en JavaScript est assez simple selon le format de texture.
WebGL2 supporte énormément de formats de textures.
WebGL2 supporte tous les formats *non dimensionnés* de WebGL1

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>Format</td><td>Type</td><td>Canaux</td><td>Octets par pixel</td></tr>
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

Ils sont appelés *non dimensionnés* car la façon dont ils sont réellement représentés en interne n'est pas définie dans WebGL1.
Elle l'est dans WebGL2. En plus de ces formats non dimensionnés, il existe une foule de formats dimensionnés, notamment

<div class="webgl_center">
  <table class="tabular-data tabular-data2">
    <thead>
      <tr>
        <td>Format<br/>dimensionné</td>
        <td>Format<br/>de base</td>
        <td>bits<br/>R</td>
        <td>bits<br/>G</td>
        <td>bits<br/>B</td>
        <td>bits<br/>A</td>
        <td>bits<br/>partagés</td>
        <td>Rendu<br/>couleur</td>
        <td>Filtrage<br/>texture</td>
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

Et également ces formats de profondeur et de stencil

<div class="webgl_center">
  <table class="tabular-data tabular-data3">
    <thead>
      <tr>
        <td>Format<br/>dimensionné</td>
        <td>Format<br/>de base</td>
        <td>bits<br/>de profondeur</td>
        <td>bits<br/>de stencil</td>
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

Légende :

* un seul nombre comme `8` signifie 8 bits qui seront normalisés de 0 à 1
* un nombre précédé d'un `s` comme `s8` signifie un nombre signé de 8 bits qui sera normalisé de -1 à 1
* un nombre précédé d'un `f` comme `f16` signifie un nombre à virgule flottante
* un nombre précédé d'un `i` comme `i8` signifie un nombre entier
* un nombre précédé de `ui` comme `ui8` signifie un entier non signé

Nous n'utiliserons pas ces informations ici, mais j'ai <span class="tabular-highlight">mis en évidence</span>
les formats de textures à demi-précision et flottants pour montrer que contrairement à WebGL1, ils sont toujours disponibles dans WebGL2,
mais ils ne sont pas marqués comme rendables en couleur et/ou filtrables par texture par défaut.
Ne pas être rendable en couleur signifie qu'on ne peut pas faire de rendu vers eux. [Le rendu vers une texture est
couvert dans une autre leçon](webgl-render-to-texture.html). Ne pas être filtrable par texture signifie qu'ils
doivent être utilisés avec `gl.NEAREST` uniquement. Ces deux fonctionnalités sont disponibles comme extensions optionnelles dans WebGL2.

Pour chacun des formats, vous spécifiez à la fois le *format interne* (le format que le GPU utilisera en interne)
et le *format* et le *type* des données que vous fournissez à WebGL. Voici un tableau indiquant quel format
et type vous devez fournir pour un format interne donné

<div class="webgl_center">
  <table class="tabular-data tabular-data4">
    <thead>
      <tr>
        <td>Format<br/>interne</td>
        <td>Format</td>
        <td>Type</td>
        <td>Octets<br/>source<br/>par pixel</td>
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


Créons une texture `R8` de 3x2 pixels. Comme c'est une texture `R8`,
il n'y a qu'une seule valeur par pixel dans le canal rouge.

Nous allons partir de l'exemple du [dernier article](webgl-3d-textures.html). D'abord, nous allons modifier
les coordonnées de texture pour utiliser toute la texture sur chaque face du cube.

```
// Remplir le buffer avec les coordonnées de texture du cube.
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // face avant
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

Puis, nous allons modifier le code qui crée une texture

```
// Créer une texture.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// Remplir la texture avec un pixel bleu 1x1.
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// remplir la texture avec 3x2 pixels
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

// définir le filtrage pour ne pas avoir besoin de mips et qu'il ne soit pas filtré
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// Charger une image de façon asynchrone
-...
```

Et voilà le résultat

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

Oups ! Pourquoi ça ne fonctionne pas ?!?!?

En vérifiant la console JavaScript, nous voyons une erreur comme celle-ci

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

Il s'avère qu'il y a un paramètre quelque peu obscur dans WebGL hérité
du moment où OpenGL a été créé. Les ordinateurs vont parfois plus vite quand les données
ont une certaine taille. Par exemple, il peut être plus rapide de copier 2, 4 ou 8 octets à la fois plutôt qu'un seul.
WebGL utilise par défaut 4 octets à la fois, donc il s'attend à ce que chaque
ligne de données soit un multiple de 4 octets (sauf pour la dernière ligne).

Nos données ci-dessus font seulement 3 octets par ligne, 6 octets au total, mais WebGL
va essayer de lire 4 octets pour la première ligne et 3 octets
pour la 2ème ligne pour un total de 7 octets, c'est pourquoi il se plaint.

Nous pouvons indiquer à WebGL de traiter 1 octet à la fois comme ceci

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

Les valeurs d'alignement valides sont 1, 2, 4 et 8.

Je soupçonne que dans WebGL, vous ne pourrez pas mesurer de différence
de vitesse entre des données alignées et non alignées. Je souhaiterais que la valeur par défaut
soit 1 plutôt que 4 pour que ce problème ne surprenne pas les nouveaux utilisateurs, mais, afin de
rester compatible avec OpenGL, la valeur par défaut devait rester la même.
Ainsi, si une application portée fournit des lignes avec du rembourrage (padding), elle fonctionnera sans modification.
En même temps, dans une nouvelle application, vous pouvez simplement toujours le définir à `1` et
en avoir fini.

Avec ce paramètre, les choses devraient fonctionner

{{{example url="../webgl-data-texture-3x2.html" }}}

Avec ceci couvert, passons au [rendu vers une texture](webgl-render-to-texture.html).

<div class="webgl_bottombar">
<h3>Pixel vs Texel</h3>
<p>Parfois, les pixels d'une texture sont appelés texels. Pixel est l'abréviation de Picture Element (élément d'image).
Texel est l'abréviation de Texture Element (élément de texture).
</p>
<p>Je suis sûr que je recevrai des critiques de certains gourous de la programmation graphique, mais pour autant que je puisse en juger, "texel" est un exemple de jargon.
Personnellement, j'utilise généralement "pixel" pour désigner les éléments d'une texture sans y penser. &#x1f607;
</p>
</div>
