/*
 * Copyright 2012, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function (root, factory) {  // eslint-disable-line
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function() {
      return factory.call(root);
    });
  } else {
    // Browser globals
    root.webglLessonsHelper = factory.call(root);
  }
}(this, function () {
  var topWindow = this;

  function getQuery(s) {
    var query = {};
    s = s === undefined ? window.location.search : s;
    s = s.substring(1);
    s.split('&').forEach(function(pair) {
        var parts = pair.split('=').map(decodeURIComponent);
        query[parts[0]] = parts[1];
    });
    return query;
  }

  /**
   * Check if the page is embedded.
   * @param {Window?) w window to check
   * @return {boolean} True of we are in an iframe
   */
  function isInIFrame(w) {
    w = w || topWindow;
    return w !== w.top;
  }

  function updateCSSIfInIFrame() {
    if (isInIFrame()) {
      try {
        document.getElementsByTagName("html")[0].className = "iframe";
      } catch (e) {
      }
      try {
        document.body.className = "iframe";
      } catch (e) {
      }
    }
  }

  function isInEditor() {
    return window.location.href.substring(0, 4) === "blob";
  }

  /**
   * Creates a webgl context. If creation fails it will
   * change the contents of the container of the <canvas>
   * tag to an error message with the correct links for WebGL.
   * @param {HTMLCanvasElement} canvas. The canvas element to
   *     create a context from.
   * @param {WebGLContextCreationAttirbutes} opt_attribs Any
   *     creation attributes you want to pass in.
   * @return {WebGLRenderingContext} The created context.
   * @memberOf module:webgl-utils
   */
  function showNeedWebGL2(canvas) {
    var doc = canvas.ownerDocument;
    if (doc) {
      var div = doc.createElement("div");
      div.innerHTML = `
        <div style="
           position: absolute;
           left: 0;
           top: 0;
           background-color: #DEF;
           width: 100vw;
           height: 100vh;
           display: flex;
           flex-flow: column;
           justify-content: center;
           align-content: center;
           align-items: center;
        ">
          <div style="text-align: center;">
             It doesn't appear your browser supports WebGL2.<br/>
             <a href="http://webgl2fundamentals.org/webgl/lessons/webgl-getting-webgl2.html" target="_blank">Click here for more information.</a>
          </div>
        </div>
      `;
      div = div.querySelector("div");
      doc.body.appendChild(div);
    }
  }

  var origConsole = {};

  function setupConsole() {
    var parent = document.createElement("div");
    parent.className = "console";
    var numLinesRemaining = 100;
    var added = false;

    function addLine(type, str) {
      var div = document.createElement("div");
      div.textContent = str;
      div.className = type;
      parent.appendChild(div);
      if (!added) {
        added = true;
        document.body.appendChild(parent);
      }
    }

    function addLines(type, str) {
      if (numLinesRemaining) {
        --numLinesRemaining;
        addLine(type, str);
      }
    }

    function wrapFunc(obj, funcName) {
      var oldFn = obj[funcName];
      origConsole[funcName] = oldFn.bind(obj);
      return function() {
        addLines(funcName, [].join.call(arguments, ' '));
        oldFn.apply(obj, arguments);
      };
    }

    window.console.log = wrapFunc(window.console, 'log');
    window.console.warn = wrapFunc(window.console, 'warn');
    window.console.error = wrapFunc(window.console, 'error');
  }

  /**
   * @typedef {Object} GetWebGLContextOptions
   * @property {boolean} [dontResize] by default `getWebGLContext` will resize the canvas to match the size it's displayed.
   * @property {boolean} [noTitle] by default inserts a copy of the `<title>` content into the page
   * @memberOf module:webgl-utils
   */

  /**
   * Gets a WebGL context.
   * makes its backing store the size it is displayed.
   * @param {HTMLCanvasElement} canvas a canvas element.
   * @param {WebGLContextCreationAttirbutes} [opt_attribs] optional webgl context creation attributes
   * @param {module:webgl-utils.GetWebGLContextOptions} [opt_options] options
   * @memberOf module:webgl-utils
   */
  function setupLesson(canvas, opt_attribs, opt_options) {
    var attribs = opt_attribs || {};
    var options = opt_options || {};

    if (isInIFrame()) {
      updateCSSIfInIFrame();

      // make the canvas backing store the size it's displayed.
      if (canvas && !options.dontResize && options.resize !== false) {
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }
    } else if (!options.noTitle && options.title !== false) {
      var title = document.title;
      var h1 = document.createElement("h1");
      h1.innerText = title;
      document.body.insertBefore(h1, document.body.children[0]);
    }
  }

  /**
   * Get's the iframe in the parent document
   * that is displaying the specified window .
   * @param {Window} window window to check.
   * @return {HTMLIFrameElement?) the iframe element if window is in an iframe
   */
  function getIFrameForWindow(window) {
    if (!isInIFrame(window)) {
      return;
    }
    var iframes = window.parent.document.getElementsByTagName("iframe");
    for (var ii = 0; ii < iframes.length; ++ii) {
      var iframe = iframes[ii];
      if (iframe.contentDocument === window.document) {
        return iframe;  // eslint-disable-line
      }
    }
  }

  /**
   * Returns true if window is on screen. The main window is
   * always on screen windows in iframes might not be.
   * @param {Window} window the window to check.
   * @return {boolean} true if window is on screen.
   */
  function isFrameVisible(window) {
    try {
      var iframe = getIFrameForWindow(window);
      if (!iframe) {
        return true;
      }

      var bounds = iframe.getBoundingClientRect();
      var isVisible = bounds.top < window.parent.innerHeight && bounds.bottom >= 0 &&
                      bounds.left < window.parent.innerWidth && bounds.right >= 0;

      return isVisible && isFrameVisible(window.parent);
    } catch (e) {
      return true;  // We got a security error?
    }
  }

  /**
   * Returns true if element is on screen.
   * @param {HTMLElement} element the element to check.
   * @return {boolean} true if element is on screen.
   */
  function isOnScreen(element) {
    var isVisible = true;

    if (element) {
      var bounds = element.getBoundingClientRect();
      isVisible = bounds.top < topWindow.innerHeight && bounds.bottom >= 0;
    }

    return isVisible && isFrameVisible(topWindow);
  }

  // Replace requestAnimationFrame.
  if (topWindow.requestAnimationFrame) {
    topWindow.requestAnimationFrame = (function(oldRAF) {

      return function(callback, element) {
        var handler = function() {
          if (isOnScreen(element)) {
            oldRAF(callback, element);
          } else {
            oldRAF(handler, element);
          }
        };
        handler();
      };

    }(topWindow.requestAnimationFrame));
  }

  updateCSSIfInIFrame();

  function setupSlider(selector, options) {
    var precision = options.precision || 0;
    var min = options.min || 0;
    var step = options.step || 1;
    var value = options.value || 0;
    var max = options.max || 1;
    var fn = options.slide;

    min /= step;
    max /= step;
    value /= step;

    var parent = document.querySelector(selector);
    if (!parent) {
      return; // like jquery don't fail on a bad selector
    }
    parent.innerHTML = `
      <div class="gman-slider-outer">
        <div class="gman-slider-label">${selector.substring(1)}</div>
        <div class="gman-slider-value"></div>
        <input class="gman-slider-slider" type="range" min="${min}" max="${max}" value="${value}" />
      </div>
    `;
    var valueElem = parent.querySelector(".gman-slider-value");
    var sliderElem = parent.querySelector(".gman-slider-slider");

    function updateValue(value) {
      valueElem.textContent = (value * step).toFixed(precision);
    }

    updateValue(value);

    function handleChange(event) {
      var value = parseInt(event.target.value);
      updateValue(value);
      fn(event, { value: value * step });
    }

    sliderElem.addEventListener('input', handleChange);
    sliderElem.addEventListener('change', handleChange);
  }

  //------------ [ from https://github.com/KhronosGroup/WebGLDeveloperTools ]

  /*
  ** Copyright (c) 2012 The Khronos Group Inc.
  **
  ** Permission is hereby granted, free of charge, to any person obtaining a
  ** copy of this software and/or associated documentation files (the
  ** "Materials"), to deal in the Materials without restriction, including
  ** without limitation the rights to use, copy, modify, merge, publish,
  ** distribute, sublicense, and/or sell copies of the Materials, and to
  ** permit persons to whom the Materials are furnished to do so, subject to
  ** the following conditions:
  **
  ** The above copyright notice and this permission notice shall be included
  ** in all copies or substantial portions of the Materials.
  **
  ** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  ** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  ** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  ** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  ** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  ** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  ** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
  */

  /**
   * Which arguments are enums based on the number of arguments to the function.
   * So
   *    'texImage2D': {
   *       9: { 0:true, 2:true, 6:true, 7:true },
   *       6: { 0:true, 2:true, 3:true, 4:true },
   *    },
   *
   * means if there are 9 arguments then 6 and 7 are enums, if there are 6
   * arguments 3 and 4 are enums
   *
   * @type {!Object.<number, !Object.<number, string>}
   */
  var glValidEnumContexts = {
    // Generic setters and getters

    'enable': {1: { 0:true }},
    'disable': {1: { 0:true }},
    'getParameter': {1: { 0:true }},

    // Rendering

    'drawArrays': {3:{ 0:true }},
    'drawElements': {4:{ 0:true, 2:true }},

    // Shaders

    'createShader': {1: { 0:true }},
    'getShaderParameter': {2: { 1:true }},
    'getProgramParameter': {2: { 1:true }},
    'getShaderPrecisionFormat': {2: { 0: true, 1:true }},

    // Vertex attributes

    'getVertexAttrib': {2: { 1:true }},
    'vertexAttribPointer': {6: { 2:true }},

    // Textures

    'bindTexture': {2: { 0:true }},
    'activeTexture': {1: { 0:true }},
    'getTexParameter': {2: { 0:true, 1:true }},
    'texParameterf': {3: { 0:true, 1:true }},
    'texParameteri': {3: { 0:true, 1:true, 2:true }},
    'texImage2D': {
       9: { 0:true, 2:true, 6:true, 7:true },
       6: { 0:true, 2:true, 3:true, 4:true }
    },
    'texSubImage2D': {
      9: { 0:true, 6:true, 7:true },
      7: { 0:true, 4:true, 5:true }
    },
    'copyTexImage2D': {8: { 0:true, 2:true }},
    'copyTexSubImage2D': {8: { 0:true }},
    'generateMipmap': {1: { 0:true }},
    'compressedTexImage2D': {7: { 0: true, 2:true }},
    'compressedTexSubImage2D': {8: { 0: true, 6:true }},

    // Buffer objects

    'bindBuffer': {2: { 0:true }},
    'bufferData': {3: { 0:true, 2:true }},
    'bufferSubData': {3: { 0:true }},
    'getBufferParameter': {2: { 0:true, 1:true }},

    // Renderbuffers and framebuffers

    'pixelStorei': {2: { 0:true, 1:true }},
    'readPixels': {7: { 4:true, 5:true }},
    'bindRenderbuffer': {2: { 0:true }},
    'bindFramebuffer': {2: { 0:true }},
    'checkFramebufferStatus': {1: { 0:true }},
    'framebufferRenderbuffer': {4: { 0:true, 1:true, 2:true }},
    'framebufferTexture2D': {5: { 0:true, 1:true, 2:true }},
    'getFramebufferAttachmentParameter': {3: { 0:true, 1:true, 2:true }},
    'getRenderbufferParameter': {2: { 0:true, 1:true }},
    'renderbufferStorage': {4: { 0:true, 1:true }},

    // Frame buffer operations (clear, blend, depth test, stencil)

    'clear': {1: { 0: { 'enumBitwiseOr': ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT'] }}},
    'depthFunc': {1: { 0:true }},
    'blendFunc': {2: { 0:true, 1:true }},
    'blendFuncSeparate': {4: { 0:true, 1:true, 2:true, 3:true }},
    'blendEquation': {1: { 0:true }},
    'blendEquationSeparate': {2: { 0:true, 1:true }},
    'stencilFunc': {3: { 0:true }},
    'stencilFuncSeparate': {4: { 0:true, 1:true }},
    'stencilMaskSeparate': {2: { 0:true }},
    'stencilOp': {3: { 0:true, 1:true, 2:true }},
    'stencilOpSeparate': {4: { 0:true, 1:true, 2:true, 3:true }},

    // Culling

    'cullFace': {1: { 0:true }},
    'frontFace': {1: { 0:true }},

    // ANGLE_instanced_arrays extension

    'drawArraysInstancedANGLE': {4: { 0:true }},
    'drawElementsInstancedANGLE': {5: { 0:true, 2:true }},

    // EXT_blend_minmax extension

    'blendEquationEXT': {1: { 0:true }}

//    // WebGL2
//  // WebGL2:
//  void bufferData(GLenum target, ArrayBufferView srcData, GLenum usage, GLuint srcOffset,
//                  optional GLuint length = 0);
//  void bufferSubData(GLenum target, GLintptr dstByteOffset, ArrayBufferView srcData,
//                     GLuint srcOffset, optional GLuint length = 0);
//
//  void copyBufferSubData(GLenum readTarget, GLenum writeTarget, GLintptr readOffset,
//                         GLintptr writeOffset, GLsizeiptr size);
//  // MapBufferRange, in particular its read-only and write-only modes,
//  // can not be exposed safely to JavaScript. GetBufferSubData
//  // replaces it for the purpose of fetching data back from the GPU.
//  void getBufferSubData(GLenum target, GLintptr srcByteOffset, ArrayBufferView dstData,
//                        optional GLuint dstOffset = 0, optional GLuint length = 0);
//
//  /* Framebuffer objects */
//  void blitFramebuffer(GLint srcX0, GLint srcY0, GLint srcX1, GLint srcY1, GLint dstX0, GLint dstY0,
//                       GLint dstX1, GLint dstY1, GLbitfield mask, GLenum filter);
//  void framebufferTextureLayer(GLenum target, GLenum attachment, WebGLTexture? texture, GLint level,
//                               GLint layer);
//  void invalidateFramebuffer(GLenum target, sequence<GLenum> attachments);
//  void invalidateSubFramebuffer(GLenum target, sequence<GLenum> attachments,
//                                GLint x, GLint y, GLsizei width, GLsizei height);
//  void readBuffer(GLenum src);
//
//  /* Renderbuffer objects */
//  any getInternalformatParameter(GLenum target, GLenum internalformat, GLenum pname);
//  void renderbufferStorageMultisample(GLenum target, GLsizei samples, GLenum internalformat,
//                                      GLsizei width, GLsizei height);
//
//  /* Texture objects */
//  void texStorage2D(GLenum target, GLsizei levels, GLenum internalformat, GLsizei width,
//                    GLsizei height);
//  void texStorage3D(GLenum target, GLsizei levels, GLenum internalformat, GLsizei width,
//                    GLsizei height, GLsizei depth);
//
//  // WebGL1 legacy entrypoints:
//  void texImage2D(GLenum target, GLint level, GLint internalformat,
//                  GLsizei width, GLsizei height, GLint border, GLenum format,
//                  GLenum type, ArrayBufferView? pixels);
//  void texImage2D(GLenum target, GLint level, GLint internalformat,
//                  GLenum format, GLenum type, TexImageSource? source); // May throw DOMException
//
//  void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset,
//                     GLsizei width, GLsizei height,
//                     GLenum format, GLenum type, ArrayBufferView? pixels);
//  void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset,
//                     GLenum format, GLenum type, TexImageSource? source); // May throw DOMException
//
//  // WebGL2 entrypoints:
//  void texImage2D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height,
//                  GLint border, GLenum format, GLenum type, GLintptr pboOffset);
//  void texImage2D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height,
//                  GLint border, GLenum format, GLenum type,
//                  TexImageSource source); // May throw DOMException
//  void texImage2D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height,
//                  GLint border, GLenum format, GLenum type, ArrayBufferView srcData,
//                  GLuint srcOffset);
//
//  void texImage3D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height,
//                  GLsizei depth, GLint border, GLenum format, GLenum type, GLintptr pboOffset);
//  void texImage3D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height,
//                  GLsizei depth, GLint border, GLenum format, GLenum type,
//                  TexImageSource source); // May throw DOMException
//  void texImage3D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height,
//                  GLsizei depth, GLint border, GLenum format, GLenum type, ArrayBufferView? srcData);
//  void texImage3D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height,
//                  GLsizei depth, GLint border, GLenum format, GLenum type, ArrayBufferView srcData,
//                  GLuint srcOffset);
//
//  void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width,
//                     GLsizei height, GLenum format, GLenum type, GLintptr pboOffset);
//  void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width,
//                     GLsizei height, GLenum format, GLenum type,
//                     TexImageSource source); // May throw DOMException
//  void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width,
//                     GLsizei height, GLenum format, GLenum type, ArrayBufferView srcData,
//                     GLuint srcOffset);
//
//  void texSubImage3D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLint zoffset,
//                     GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type,
//                     GLintptr pboOffset);
//  void texSubImage3D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLint zoffset,
//                     GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type,
//                     TexImageSource source); // May throw DOMException
//  void texSubImage3D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLint zoffset,
//                     GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type,
//                     ArrayBufferView srcData, optional GLuint srcOffset = 0);
//
//  void copyTexSubImage3D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLint zoffset,
//                         GLint x, GLint y, GLsizei width, GLsizei height);
//
//  void compressedTexImage2D(GLenum target, GLint level, GLenum internalformat, GLsizei width,
//                            GLsizei height, GLint border, GLintptr offset);
//  void compressedTexImage2D(GLenum target, GLint level, GLenum internalformat, GLsizei width,
//                            GLsizei height, GLint border, ArrayBufferView srcData,
//                            optional GLuint srcOffset = 0);
//
//  void compressedTexImage3D(GLenum target, GLint level, GLenum internalformat, GLsizei width,
//                            GLsizei height, GLsizei depth, GLint border, GLintptr offset);
//  void compressedTexImage3D(GLenum target, GLint level, GLenum internalformat, GLsizei width,
//                            GLsizei height, GLsizei depth, GLint border, ArrayBufferView srcData,
//                            optional GLuint srcOffset = 0);
//
//  void compressedTexSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset,
//                               GLsizei width, GLsizei height, GLenum format, GLintptr offset);
//  void compressedTexSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset,
//                               GLsizei width, GLsizei height, GLenum format,
//                               ArrayBufferView srcData, optional GLuint srcOffset = 0);
//
//  void compressedTexSubImage3D(GLenum target, GLint level, GLint xoffset, GLint yoffset,
//                               GLint zoffset, GLsizei width, GLsizei height, GLsizei depth,
//                               GLenum format, GLintptr offset);
//  void compressedTexSubImage3D(GLenum target, GLint level, GLint xoffset, GLint yoffset,
//                               GLint zoffset, GLsizei width, GLsizei height, GLsizei depth,
//                               GLenum format, ArrayBufferView srcData,
//                               optional GLuint srcOffset = 0);
//
//  /* Programs and shaders */
//  [WebGLHandlesContextLoss] GLint getFragDataLocation(WebGLProgram? program, DOMString name);
//
//  /* Uniforms */
//  void uniform1ui(WebGLUniformLocation? location, GLuint v0);
//  void uniform2ui(WebGLUniformLocation? location, GLuint v0, GLuint v1);
//  void uniform3ui(WebGLUniformLocation? location, GLuint v0, GLuint v1, GLuint v2);
//  void uniform4ui(WebGLUniformLocation? location, GLuint v0, GLuint v1, GLuint v2, GLuint v3);
//
//  void uniform1fv(WebGLUniformLocation? location, Float32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform2fv(WebGLUniformLocation? location, Float32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform3fv(WebGLUniformLocation? location, Float32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform4fv(WebGLUniformLocation? location, Float32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//
//  void uniform1iv(WebGLUniformLocation? location, Int32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform2iv(WebGLUniformLocation? location, Int32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform3iv(WebGLUniformLocation? location, Int32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform4iv(WebGLUniformLocation? location, Int32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//
//  void uniform1uiv(WebGLUniformLocation? location, Uint32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform2uiv(WebGLUniformLocation? location, Uint32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform3uiv(WebGLUniformLocation? location, Uint32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//  void uniform4uiv(WebGLUniformLocation? location, Uint32List data, optional GLuint srcOffset = 0,
//                  optional GLuint srcLength = 0);
//
//  void uniformMatrix2fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                        optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//  void uniformMatrix3x2fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                          optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//  void uniformMatrix4x2fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                          optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//
//  void uniformMatrix2x3fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                          optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//  void uniformMatrix3fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                        optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//  void uniformMatrix4x3fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                          optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//
//  void uniformMatrix2x4fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                          optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//  void uniformMatrix3x4fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                          optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//  void uniformMatrix4fv(WebGLUniformLocation? location, GLboolean transpose, Float32List data,
//                        optional GLuint srcOffset = 0, optional GLuint srcLength = 0);
//
//  /* Vertex attribs */
//  void vertexAttribI4i(GLuint index, GLint x, GLint y, GLint z, GLint w);
//  void vertexAttribI4iv(GLuint index, Int32List values);
//  void vertexAttribI4ui(GLuint index, GLuint x, GLuint y, GLuint z, GLuint w);
//  void vertexAttribI4uiv(GLuint index, Uint32List values);
//  void vertexAttribIPointer(GLuint index, GLint size, GLenum type, GLsizei stride, GLintptr offset);
//
//  /* Writing to the drawing buffer */
//  void vertexAttribDivisor(GLuint index, GLuint divisor);
//  void drawArraysInstanced(GLenum mode, GLint first, GLsizei count, GLsizei instanceCount);
//  void drawElementsInstanced(GLenum mode, GLsizei count, GLenum type, GLintptr offset, GLsizei instanceCount);
//  void drawRangeElements(GLenum mode, GLuint start, GLuint end, GLsizei count, GLenum type, GLintptr offset);
//
//  /* Reading back pixels */
//  // WebGL1:
//  void readPixels(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type,
//                  ArrayBufferView? dstData);
//  // WebGL2:
//  void readPixels(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type,
//                  GLintptr offset);
//  void readPixels(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type,
//                  ArrayBufferView dstData, GLuint dstOffset);
//
//  /* Multiple Render Targets */
//  void drawBuffers(sequence<GLenum> buffers);
//
//  void clearBufferfv(GLenum buffer, GLint drawbuffer, Float32List values,
//                     optional GLuint srcOffset = 0);
//  void clearBufferiv(GLenum buffer, GLint drawbuffer, Int32List values,
//                     optional GLuint srcOffset = 0);
//  void clearBufferuiv(GLenum buffer, GLint drawbuffer, Uint32List values,
//                      optional GLuint srcOffset = 0);
//
//  void clearBufferfi(GLenum buffer, GLint drawbuffer, GLfloat depth, GLint stencil);
//
//  /* Query Objects */
//  WebGLQuery? createQuery();
//  void deleteQuery(WebGLQuery? query);
//  [WebGLHandlesContextLoss] GLboolean isQuery(WebGLQuery? query);
//  void beginQuery(GLenum target, WebGLQuery? query);
//  void endQuery(GLenum target);
//  WebGLQuery? getQuery(GLenum target, GLenum pname);
//  any getQueryParameter(WebGLQuery? query, GLenum pname);
//
//  /* Sampler Objects */
//  WebGLSampler? createSampler();
//  void deleteSampler(WebGLSampler? sampler);
//  [WebGLHandlesContextLoss] GLboolean isSampler(WebGLSampler? sampler);
//  void bindSampler(GLuint unit, WebGLSampler? sampler);
//  void samplerParameteri(WebGLSampler? sampler, GLenum pname, GLint param);
//  void samplerParameterf(WebGLSampler? sampler, GLenum pname, GLfloat param);
//  any getSamplerParameter(WebGLSampler? sampler, GLenum pname);
//
//  /* Sync objects */
//  WebGLSync? fenceSync(GLenum condition, GLbitfield flags);
//  [WebGLHandlesContextLoss] GLboolean isSync(WebGLSync? sync);
//  void deleteSync(WebGLSync? sync);
//  GLenum clientWaitSync(WebGLSync? sync, GLbitfield flags, GLint64 timeout);
//  void waitSync(WebGLSync? sync, GLbitfield flags, GLint64 timeout);
//  any getSyncParameter(WebGLSync? sync, GLenum pname);
//
//  /* Transform Feedback */
//  WebGLTransformFeedback? createTransformFeedback();
//  void deleteTransformFeedback(WebGLTransformFeedback?);
//  [WebGLHandlesContextLoss] GLboolean isTransformFeedback(WebGLTransformFeedback?);
//  void bindTransformFeedback (GLenum target, WebGLTransformFeedback? id);
//  void beginTransformFeedback(GLenum primitiveMode);
//  void endTransformFeedback();
//  void transformFeedbackVaryings(WebGLProgram? program, sequence<DOMString> varyings, GLenum bufferMode);
//  WebGLActiveInfo? getTransformFeedbackVarying(WebGLProgram? program, GLuint index);
//  void pauseTransformFeedback();
//  void resumeTransformFeedback();
//
//  /* Uniform Buffer Objects and Transform Feedback Buffers */
//  void bindBufferBase(GLenum target, GLuint index, WebGLBuffer? buffer);
//  void bindBufferRange(GLenum target, GLuint index, WebGLBuffer? buffer, GLintptr offset, GLsizeiptr size);
//  any getIndexedParameter(GLenum target, GLuint index);
//  sequence<GLuint>? getUniformIndices(WebGLProgram? program, sequence<DOMString> uniformNames);
//  any getActiveUniforms(WebGLProgram? program, sequence<GLuint> uniformIndices, GLenum pname);
//  GLuint getUniformBlockIndex(WebGLProgram? program, DOMString uniformBlockName);
//  any getActiveUniformBlockParameter(WebGLProgram? program, GLuint uniformBlockIndex, GLenum pname);
//  DOMString? getActiveUniformBlockName(WebGLProgram? program, GLuint uniformBlockIndex);
//  void uniformBlockBinding(WebGLProgram? program, GLuint uniformBlockIndex, GLuint uniformBlockBinding);
//
//  /* Vertex Array Objects */
//  WebGLVertexArrayObject? createVertexArray();
//  void deleteVertexArray(WebGLVertexArrayObject? vertexArray);
//  [WebGLHandlesContextLoss] GLboolean isVertexArray(WebGLVertexArrayObject? vertexArray);
//  void bindVertexArray(WebGLVertexArrayObject? array);
  };

  /**
   * Map of numbers to names.
   * @type {Object}
   */
  var glEnums = null;

  /**
   * Map of names to numbers.
   * @type {Object}
   */
  var enumStringToValue = null;

  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  function init(ctx) {
    if (glEnums == null) {
      glEnums = { };
      enumStringToValue = { };
      for (var propertyName in ctx) {
        if (typeof ctx[propertyName] == 'number') {
          glEnums[ctx[propertyName]] = propertyName;
          enumStringToValue[propertyName] = ctx[propertyName];
        }
      }
    }
  }

  /**
   * Checks the utils have been initialized.
   */
  function checkInit() {
    if (glEnums == null) {
      throw 'WebGLDebugUtils.init(ctx) not called';
    }
  }

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  function mightBeEnum(value) {
    checkInit();
    return (glEnums[value] !== undefined);
  }

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  function glEnumToString(value) {
    checkInit();
    var name = glEnums[value];
    return (name !== undefined) ? ("gl." + name) :
        ("/*UNKNOWN WebGL ENUM*/ 0x" + value.toString(16) + "");
  }

  /**
   * Returns the string version of a WebGL argument.
   * Attempts to convert enum arguments to strings.
   * @param {string} functionName the name of the WebGL function.
   * @param {number} numArgs the number of arguments passed to the function.
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   */
  function glFunctionArgToString(functionName, numArgs, argumentIndex, value) {
    var funcInfo = glValidEnumContexts[functionName];
    if (funcInfo !== undefined) {
      var funcInfo = funcInfo[numArgs];
      if (funcInfo !== undefined) {
        if (funcInfo[argumentIndex]) {
          if (typeof funcInfo[argumentIndex] === 'object' &&
              funcInfo[argumentIndex]['enumBitwiseOr'] !== undefined) {
            var enums = funcInfo[argumentIndex]['enumBitwiseOr'];
            var orResult = 0;
            var orEnums = [];
            for (var i = 0; i < enums.length; ++i) {
              var enumValue = enumStringToValue[enums[i]];
              if ((value & enumValue) !== 0) {
                orResult |= enumValue;
                orEnums.push(glEnumToString(enumValue));
              }
            }
            if (orResult === value) {
              return orEnums.join(' | ');
            } else {
              return glEnumToString(value);
            }
          } else {
            return glEnumToString(value);
          }
        }
      }
    }
    if (value === null) {
      return "null";
    } else if (value === undefined) {
      return "undefined";
    } else {
      return value.toString();
    }
  }

  /**
   * Converts the arguments of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} args The arguments.
   * @return {string} The arguments as a string.
   */
  function glFunctionArgsToString(functionName, args) {
    // apparently we can't do args.join(",");
    var argStr = "";
    var numArgs = args.length;
    for (var ii = 0; ii < numArgs; ++ii) {
      argStr += ((ii == 0) ? '' : ', ') +
          glFunctionArgToString(functionName, numArgs, ii, args[ii]);
    }
    return argStr;
  };


  function makePropertyWrapper(wrapper, original, propertyName) {
    //log("wrap prop: " + propertyName);
    wrapper.__defineGetter__(propertyName, function() {
      return original[propertyName];
    });
    // TODO(gmane): this needs to handle properties that take more than
    // one value?
    wrapper.__defineSetter__(propertyName, function(value) {
      //log("set: " + propertyName);
      original[propertyName] = value;
    });
  }

  // Makes a function that calls a function on another object.
  function makeFunctionWrapper(original, functionName) {
    //log("wrap fn: " + functionName);
    var f = original[functionName];
    return function() {
      //log("call: " + functionName);
      var result = f.apply(original, arguments);
      return result;
    };
  }

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not gl.NO_ERROR.
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to
   *        wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc
   *        The function to call when gl.getError returns an
   *        error. If not specified the default function calls
   *        console.log with a message.
   * @param {!function(funcName, args): void} opt_onFunc The
   *        function to call when each webgl function is called.
   *        You can use this to log all calls for example.
   * @param {!WebGLRenderingContext} opt_err_ctx The webgl context
   *        to call getError on if different than ctx.
   */
  function makeDebugContext(ctx, options) {
    options = options || {};
    var errCtx = options.errCtx || ctx;
    var onFunc = options.funcFunc;
    var sharedState = options.sharedState || {
      numDrawCallsRemaining: options.maxDrawCalls || -1,
      wrappers: {},
    };
    options.sharedState = sharedState;

    init(ctx);
    var errorFunc = options.errorFunc || function(err, functionName, args) {
          // apparently we can't do args.join(",");
          var argStr = "";
          var numArgs = args.length;
          for (var ii = 0; ii < numArgs; ++ii) {
            argStr += ((ii == 0) ? '' : ', ') +
                glFunctionArgToString(functionName, numArgs, ii, args[ii]);
          }
          console.error("WebGL error "+ glEnumToString(err) + " in "+ functionName +
              "(" + argStr + ")");
        };

    // Holds booleans for each GL error so after we get the error ourselves
    // we can still return it to the client app.
    var glErrorShadow = { };
    var wrapper = {};

    function removeChecks() {
      Object.keys(sharedState.wrappers).forEach(function(name) {
        var pair = sharedState.wrappers[name];
        var wrapper = pair.wrapper;
        var orig = pair.orig;
        for (var propertyName in wrapper) {
          if (typeof wrapper[propertyName] === 'function') {
            wrapper[propertyName] = orig[propertyName].bind(orig);
          }
        }
      });
    }

    function checkMaxDrawCalls() {
      if (sharedState.numDrawCallsRemaining === 0) {
        removeChecks();
      }
      --sharedState.numDrawCallsRemaining;
    }

    function noop() {
    }

    // Makes a function that calls a WebGL function and then calls getError.
    function makeErrorWrapper(ctx, functionName) {
      var check = functionName.substring(0, 4) === 'draw' ? checkMaxDrawCalls : noop;
      return function() {
        if (onFunc) {
          onFunc(functionName, arguments);
        }
        var result = ctx[functionName].apply(ctx, arguments);
        var err = errCtx.getError();
        if (err != 0) {
          glErrorShadow[err] = true;
          errorFunc(err, functionName, arguments);
        }
        check();
        return result;
      };
    }

    // Make a an object that has a copy of every property of the WebGL context
    // but wraps all functions.
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] === 'function') {
        if (propertyName !== 'getExtension') {
          wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
        } else {
          var wrapped = makeErrorWrapper(ctx, propertyName);
          wrapper[propertyName] = function () {
            var extensionName = arguments[0];
            var ext = sharedState.wrappers[extensionName];
            if (!ext) {
              ext = wrapped.apply(ctx, arguments);
              if (ext) {
                var origExt = ext;
                ext = makeDebugContext(ext, options);
                sharedState.wrappers[extensionName] = { wrapper: ext, orig: origExt };
              }
            }
            return ext;
          };
        }
      } else {
        makePropertyWrapper(wrapper, ctx, propertyName);
      }
    }

    // Override the getError function with one that returns our saved results.
    wrapper.getError = function() {
      for (var err in glErrorShadow) {
        if (glErrorShadow.hasOwnProperty(err)) {
          if (glErrorShadow[err]) {
            glErrorShadow[err] = false;
            return err;
          }
        }
      }
      return ctx.NO_ERROR;
    };

    if (wrapper.bindBuffer) {
      sharedState.wrappers["webgl"] = { wrapper: wrapper, orig: ctx };
    }

    return wrapper;
  }

  //------------

  function captureJSErrors() {
    // capture JavaScript Errors
    window.addEventListener('error', function(e) {
      var msg = e.message || e.error;
      var url = e.filename;
      var lineNo = e.lineno || 1;
      var colNo = e.colno || 1;
      var isUserScript = (url === window.location.href);
      if (isUserScript) {
        try {
          lineNo = window.parent.getActualLineNumberAndMoveTo(lineNo, colNo);
        } catch (e) {
          origConsole.error(e);
        }
      }
      console.log("line:", lineNo, ":", msg);
      origConsole.error(e.error);
    });
  }

  function installWebGLDebugContextCreator() {
    // capture GL errors
    HTMLCanvasElement.prototype.getContext = (function(oldFn) {
      return function() {
        var ctx = oldFn.apply(this, arguments);
        // Using bindTexture to see if it's WebGL. Could check for instanceof WebGLRenderingContext
        // but that might fail if wrapped by debugging extension
        if (ctx && ctx.bindTexture) {
          ctx = makeDebugContext(ctx, {
            maxDrawCalls: 100,
            errorFunc: function(err, funcName, args) {
              var numArgs = args.length;
              var enumedArgs = [].map.call(args, function(arg, ndx) {
                var str = glFunctionArgToString(funcName, numArgs, ndx, arg);
                // shorten because of long arrays
                if (str.length > 200) {
                  str = str.substring(0, 200) + "...";
                }
                return str;
              });

              // Kinda from http://stackoverflow.com/a/9851769/128511
              // Opera 8.0+
              var isOpera = (!!window.opr) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
              // Firefox 1.0+
              var isFirefox = typeof window.InstallTrigger !== 'undefined';
              // Safari <= 9 "[object HTMLElementConstructor]"
              var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
              // Internet Explorer 6-11
              var isIE = /*@cc_on!@*/false || !!document.documentMode;
              // Edge 20+
              var isEdge = !isIE && !!window.StyleMedia;
              // Chrome 1+
              var isChrome = !!window.chrome && !!window.chrome.webstore;

              var lineNdx;
              var matcher;
              if (isOpera || isChrome) {
                lineNdx = 3;
                matcher = function(line) {
                  var m = /at ([^(]+)*\(*(.*?):(\d+):(\d+)/.exec(line);
                  if (m) {
                    var userFnName = m[1];
                    var url = m[2];
                    var lineNo = parseInt(m[3]);
                    var colNo = parseInt(m[4]);
                    if (url === '') {
                      url = userFnName;
                      userFnName = '';
                    }
                    return {
                      url: url,
                      lineNo: lineNo,
                      colNo: colNo,
                      funcName: userFnName,
                    };
                  }
                };
              } else if (isFirefox) {
                lineNdx = 2;
                matcher = function(line) {
                  var m = /@(.*?):(\d+):(\d+)/.exec(line);
                  if (m) {
                    var url = m[1];
                    var lineNo = parseInt(m[2]);
                    var colNo = parseInt(m[3]);
                    return {
                      url: url,
                      lineNo: lineNo,
                      colNo: colNo,
                    };
                  }
                };
              }

  // TODO: stop checking after 100 drawCalls
              var lineInfo = '';
              if (matcher) {
                try {
                  var error = new Error();
                  var lines = error.stack.split("\n");
                  // window.fooLines = lines;
                  // lines.forEach(function(line, ndx) {
                  //   origConsole.error("#", ndx, line);
                  // });
                  var info = matcher(lines[lineNdx]);
                  if (info) {
                    var lineNo = info.lineNo;
                    var colNo = info.colNo;
                    var url = info.url;
                    var isUserScript = (url === window.location.href);
                    if (isUserScript) {
                      lineNo = window.parent.getActualLineNumberAndMoveTo(lineNo, colNo);
                    }
                    lineInfo = ' line:' + lineNo + ':' + colNo;
                  }
                } catch (e) {
                  origConsole.error(e);
                }
              }

              console.error(
                  "WebGL error" + lineInfo, glEnumToString(err), "in",
                  funcName, "(", enumedArgs.join(", "), ")");

            },
          });
        }
        return ctx;
      };
    }(HTMLCanvasElement.prototype.getContext));
  }

  if (isInEditor()) {
    setupConsole();
    captureJSErrors();
    if (window.webglLessonSettings === undefined || window.webglLessonSettings.glDebug !== false) {
      installWebGLDebugContextCreator();
    }
  }

  return {
    setupLesson: setupLesson,
    showNeedWebGL2: showNeedWebGL2,
    setupSlider: setupSlider,
    makeDebugContext: makeDebugContext,
  };

}));

