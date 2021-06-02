/*
 * Copyright 2021, GFXFundamentals.
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
 *     * Neither the name of GFXFundamentals. nor the names of his
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

/* global define */

(function(root, factory) {  // eslint-disable-line
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function() {
      return factory.call(root);
    });
  } else {
    // Browser globals
    root.webglLessonsHelper = factory.call(root);
  }
}(this, function() {
  "use strict";

  const topWindow = this;

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
        // eslint-disable-line
      }
      try {
        document.body.className = "iframe";
      } catch (e) {
        // eslint-disable-line
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
    const doc = canvas.ownerDocument;
    if (doc) {
      let div = doc.createElement("div");
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

  const origConsole = {};

  function setupConsole() {
    const parent = document.createElement("div");
    parent.className = "console";
    let numLinesRemaining = 100;
    let added = false;

    function addLine(type, str) {
      const div = document.createElement("div");
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
      const oldFn = obj[funcName];
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
   * @param {module:webgl-utils.GetWebGLContextOptions} [opt_options] options
   * @memberOf module:webgl-utils
   */
  let setupLesson = function(canvas, opt_options) {
    // only once
    setupLesson = function() {};

    const options = opt_options || {};

    if (canvas) {
      canvas.addEventListener('webglcontextlost', function() {
          const div = document.createElement("div");
          div.className = "contextlost";
          div.innerHTML = '<div>Context Lost: Click To Reload</div>';
          div.addEventListener('click', function() {
              window.location.reload();
          });
          document.body.appendChild(div);
      });
      /* we can't do this because of bug in Firefox
      canvas.addEventListener('webglcontextrestored', function() {
          // just reload the page. Easiest.
          window.location.reload();
      });
      */
    }

    if (isInIFrame()) {
      updateCSSIfInIFrame();
    } else if (!options.noTitle && options.title !== false) {
      const titleElem = document.querySelector("title");
      if (titleElem && titleElem.getAttribute("addtitletodoc") !== "false") {
        const title = document.title;
        const h1 = document.createElement("h1");
        h1.innerText = title;
        document.body.insertBefore(h1, document.body.children[0]);
      }
    }
  };

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
    const iframes = window.parent.document.getElementsByTagName("iframe");
    for (let ii = 0; ii < iframes.length; ++ii) {
      const iframe = iframes[ii];
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
      const iframe = getIFrameForWindow(window);
      if (!iframe) {
        return true;
      }

      const bounds = iframe.getBoundingClientRect();
      const isVisible = bounds.top < window.parent.innerHeight && bounds.bottom >= 0 &&
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
    let isVisible = true;

    if (element) {
      const bounds = element.getBoundingClientRect();
      isVisible = bounds.top < topWindow.innerHeight && bounds.bottom >= 0;
    }

    return isVisible && isFrameVisible(topWindow);
  }

  // Replace requestAnimationFrame.
  if (topWindow.requestAnimationFrame) {
    topWindow.requestAnimationFrame = (function(oldRAF) {

      return function(callback, element) {
        const handler = function() {
          return oldRAF(isOnScreen(element) ? callback : handler, element);
        };
        return handler();
      };

    }(topWindow.requestAnimationFrame));
  }

  updateCSSIfInIFrame();

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
   * Types of contexts we have added to map
   */
  const mappedContextTypes = {};

  /**
   * Map of numbers to names.
   * @type {Object}
   */
  const glEnums = {};

  /**
   * Map of names to numbers.
   * @type {Object}
   */
  const enumStringToValue = {};

  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  function addEnumsForContext(ctx, type) {
    if (!mappedContextTypes[type]) {
      mappedContextTypes[type] = true;
      for (const propertyName in ctx) {
        if (typeof ctx[propertyName] === 'number') {
          glEnums[ctx[propertyName]] = propertyName;
          enumStringToValue[propertyName] = ctx[propertyName];
        }
      }
    }
  }

  function enumArrayToString(enums) {
    const enumStrings = [];
    if (enums.length) {
      for (let i = 0; i < enums.length; ++i) {
        enums.push(glEnumToString(enums[i]));  // eslint-disable-line
      }
      return '[' + enumStrings.join(', ') + ']';
    }
    return enumStrings.toString();
  }

  function makeBitFieldToStringFunc(enums) {
    return function(value) {
      let orResult = 0;
      const orEnums = [];
      for (let i = 0; i < enums.length; ++i) {
        const enumValue = enumStringToValue[enums[i]];
        if ((value & enumValue) !== 0) {
          orResult |= enumValue;
          orEnums.push(glEnumToString(enumValue));  // eslint-disable-line
        }
      }
      if (orResult === value) {
        return orEnums.join(' | ');
      } else {
        return glEnumToString(value);  // eslint-disable-line
      }
    };
  }

  const destBufferBitFieldToString = makeBitFieldToStringFunc([
    'COLOR_BUFFER_BIT',
    'DEPTH_BUFFER_BIT',
    'STENCIL_BUFFER_BIT',
  ]);

  /**
   * Which arguments are enums based on the number of arguments to the function.
   * So
   *    'texImage2D': {
   *       9: { 0:true, 2:true, 6:true, 7:true },
   *       6: { 0:true, 2:true, 3:true, 4:true },
   *    },
   *
   * means if there are 9 arguments then 6 and 7 are enums, if there are 6
   * arguments 3 and 4 are enums. Maybe a function as well in which case
   * value is passed to function and returns a string
   *
   * @type {!Object.<number, (!Object.<number, string>|function)}
   */
  const glValidEnumContexts = {
    // Generic setters and getters

    'enable': {1: { 0:true }},
    'disable': {1: { 0:true }},
    'getParameter': {1: { 0:true }},

    // Rendering

    'drawArrays': {3:{ 0:true }},
    'drawElements': {4:{ 0:true, 2:true }},
    'drawArraysInstanced': {4: { 0:true }},
    'drawElementsInstanced': {5: {0:true, 2: true }},
    'drawRangeElements': {6: {0:true, 4: true }},

    // Shaders

    'createShader': {1: { 0:true }},
    'getShaderParameter': {2: { 1:true }},
    'getProgramParameter': {2: { 1:true }},
    'getShaderPrecisionFormat': {2: { 0: true, 1:true }},

    // Vertex attributes

    'getVertexAttrib': {2: { 1:true }},
    'vertexAttribPointer': {6: { 2:true }},
    'vertexAttribIPointer': {5: { 2:true }},  // WebGL2

    // Textures

    'bindTexture': {2: { 0:true }},
    'activeTexture': {1: { 0:true }},
    'getTexParameter': {2: { 0:true, 1:true }},
    'texParameterf': {3: { 0:true, 1:true }},
    'texParameteri': {3: { 0:true, 1:true, 2:true }},
    'texImage2D': {
       9: { 0:true, 2:true, 6:true, 7:true },
       6: { 0:true, 2:true, 3:true, 4:true },
       10: { 0:true, 2:true, 6:true, 7:true },  // WebGL2
    },
    'texImage3D': {
      10: { 0:true, 2:true, 7:true, 8:true },  // WebGL2
      11: { 0:true, 2:true, 7:true, 8:true },  // WebGL2
    },
    'texSubImage2D': {
      9: { 0:true, 6:true, 7:true },
      7: { 0:true, 4:true, 5:true },
      10: { 0:true, 6:true, 7:true },  // WebGL2
    },
    'texSubImage3D': {
      11: { 0:true, 8:true, 9:true },  // WebGL2
      12: { 0:true, 8:true, 9:true },  // WebGL2
    },
    'texStorage2D': { 5: { 0:true, 2:true }},  // WebGL2
    'texStorage3D': { 6: { 0:true, 2:true }},  // WebGL2
    'copyTexImage2D': {8: { 0:true, 2:true }},
    'copyTexSubImage2D': {8: { 0:true }},
    'copyTexSubImage3D': {9: { 0:true }},  // WebGL2
    'generateMipmap': {1: { 0:true }},
    'compressedTexImage2D': {
      7: { 0: true, 2:true },
      8: { 0: true, 2:true },  // WebGL2
    },
    'compressedTexSubImage2D': {
      8: { 0: true, 6:true },
      9: { 0: true, 6:true },  // WebGL2
    },
    'compressedTexImage3D': {
      8: { 0: true, 2: true, },  // WebGL2
      9: { 0: true, 2: true, },  // WebGL2
    },
    'compressedTexSubImage3D': {
      9: { 0: true, 8: true, },  // WebGL2
      10: { 0: true, 8: true, },  // WebGL2
    },

    // Buffer objects

    'bindBuffer': {2: { 0:true }},
    'bufferData': {
      3: { 0:true, 2:true },
      4: { 0:true, 2:true },  // WebGL2
      5: { 0:true, 2:true },  // WebGL2
    },
    'bufferSubData': {
      3: { 0:true },
      4: { 0:true },  // WebGL2
      5: { 0:true },  // WebGL2
    },
    'copyBufferSubData': {
      5: { 0:true },  // WeBGL2
    },
    'getBufferParameter': {2: { 0:true, 1:true }},
    'getBufferSubData': {
      3: { 0: true, },  // WebGL2
      4: { 0: true, },  // WebGL2
      5: { 0: true, },  // WebGL2
    },

    // Renderbuffers and framebuffers

    'pixelStorei': {2: { 0:true, 1:true }},
    'readPixels': {
      7: { 4:true, 5:true },
      8: { 4:true, 5:true },  // WebGL2
    },
    'bindRenderbuffer': {2: { 0:true }},
    'bindFramebuffer': {2: { 0:true }},
    'blitFramebuffer': {10: { 8: destBufferBitFieldToString, 9:true }},  // WebGL2
    'checkFramebufferStatus': {1: { 0:true }},
    'framebufferRenderbuffer': {4: { 0:true, 1:true, 2:true }},
    'framebufferTexture2D': {5: { 0:true, 1:true, 2:true }},
    'framebufferTextureLayer': {5: {0:true, 1:true }},  // WebGL2
    'getFramebufferAttachmentParameter': {3: { 0:true, 1:true, 2:true }},
    'getInternalformatParameter': {3: {0:true, 1:true, 2:true }},  // WebGL2
    'getRenderbufferParameter': {2: { 0:true, 1:true }},
    'invalidateFramebuffer': {2: { 0:true, 1: enumArrayToString, }},  // WebGL2
    'invalidateSubFramebuffer': {6: {0: true, 1: enumArrayToString, }},  // WebGL2
    'readBuffer': {1: {0: true}},  // WebGL2
    'renderbufferStorage': {4: { 0:true, 1:true }},
    'renderbufferStorageMultisample': {5: { 0: true, 2: true }},  // WebGL2

    // Frame buffer operations (clear, blend, depth test, stencil)

    'clear': {1: { 0: destBufferBitFieldToString }},
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

    'blendEquationEXT': {1: { 0:true }},

    // Multiple Render Targets

    'drawBuffersWebGL': {1: {0: enumArrayToString, }},  // WEBGL_draw_bufers
    'drawBuffers': {1: {0: enumArrayToString, }},  // WebGL2
    'clearBufferfv': {
      4: {0: true },  // WebGL2
      5: {0: true },  // WebGL2
    },
    'clearBufferiv': {
      4: {0: true },  // WebGL2
      5: {0: true },  // WebGL2
    },
    'clearBufferuiv': {
      4: {0: true },  // WebGL2
      5: {0: true },  // WebGL2
    },
    'clearBufferfi': { 4: {0: true}},  // WebGL2

    // QueryObjects

    'beginQuery': { 2: { 0: true }},  // WebGL2
    'endQuery': { 1: { 0: true }},  // WebGL2
    'getQuery': { 2: { 0: true, 1: true }},  // WebGL2
    'getQueryParameter': { 2: { 1: true }},  // WebGL2

    //  Sampler Objects

    'samplerParameteri': { 3: { 1: true }},  // WebGL2
    'samplerParameterf': { 3: { 1: true }},  // WebGL2
    'getSamplerParameter': { 2: { 1: true }},  // WebGL2

    //  Sync objects

    'clientWaitSync': { 3: { 1: makeBitFieldToStringFunc(['SYNC_FLUSH_COMMANDS_BIT']) }},  // WebGL2
    'fenceSync': { 2: { 0: true }},  // WebGL2
    'getSyncParameter': { 2: { 1: true }},  // WebGL2

    //  Transform Feedback

    'bindTransformFeedback': { 2: { 0: true }},  // WebGL2
    'beginTransformFeedback': { 1: { 0: true }},  // WebGL2

    // Uniform Buffer Objects and Transform Feedback Buffers
    'bindBufferBase': { 3: { 0: true }},  // WebGL2
    'bindBufferRange': { 5: { 0: true }},  // WebGL2
    'getIndexedParameter': { 2: { 0: true }},  // WebGL2
    'getActiveUniforms': { 3: { 2: true }},  // WebGL2
    'getActiveUniformBlockParameter': { 3: { 2: true }},  // WebGL2
  };

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
    const name = glEnums[value];
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
    const funcInfos = glValidEnumContexts[functionName];
    if (funcInfos !== undefined) {
      const funcInfo = funcInfos[numArgs];
      if (funcInfo !== undefined) {
        const argType = funcInfo[argumentIndex];
        if (argType) {
          if (typeof argType === 'function') {
            return argType(value);
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
    const argStrs = [];
    const numArgs = args.length;
    for (let ii = 0; ii < numArgs; ++ii) {
      argStrs.push(glFunctionArgToString(functionName, numArgs, ii, args[ii]));
    }
    return argStrs.join(", ");
  }

  function makePropertyWrapper(wrapper, original, propertyName) {
    wrapper.__defineGetter__(propertyName, function() {  // eslint-disable-line
      return original[propertyName];
    });
    // TODO(gmane): this needs to handle properties that take more than
    // one value?
    wrapper.__defineSetter__(propertyName, function(value) {  // eslint-disable-line
      original[propertyName] = value;
    });
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
    const errCtx = options.errCtx || ctx;
    const onFunc = options.funcFunc;
    const sharedState = options.sharedState || {
      numDrawCallsRemaining: options.maxDrawCalls || -1,
      wrappers: {},
    };
    options.sharedState = sharedState;

    const errorFunc = options.errorFunc || function(err, functionName, args) {
      console.error("WebGL error " + glEnumToString(err) + " in " + functionName +  // eslint-disable-line
          "(" + glFunctionArgsToString(functionName, args) + ")");
    };

    // Holds booleans for each GL error so after we get the error ourselves
    // we can still return it to the client app.
    const glErrorShadow = { };
    const wrapper = {};

    function removeChecks() {
      Object.keys(sharedState.wrappers).forEach(function(name) {
        const pair = sharedState.wrappers[name];
        const wrapper = pair.wrapper;
        const orig = pair.orig;
        for (const propertyName in wrapper) {
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
      const check = functionName.substring(0, 4) === 'draw' ? checkMaxDrawCalls : noop;
      return function() {
        if (onFunc) {
          onFunc(functionName, arguments);
        }
        const result = ctx[functionName].apply(ctx, arguments);
        const err = errCtx.getError();
        if (err !== 0) {
          glErrorShadow[err] = true;
          errorFunc(err, functionName, arguments);
        }
        check();
        return result;
      };
    }

    function makeGetExtensionWrapper(ctx, wrapped) {
      return function() {
        const extensionName = arguments[0];
        let ext = sharedState.wrappers[extensionName];
        if (!ext) {
          ext = wrapped.apply(ctx, arguments);
          if (ext) {
            const origExt = ext;
            ext = makeDebugContext(ext, options);
            sharedState.wrappers[extensionName] = { wrapper: ext, orig: origExt };
            addEnumsForContext(origExt, extensionName);
          }
        }
        return ext;
      };
    }

    // Make a an object that has a copy of every property of the WebGL context
    // but wraps all functions.
    for (const propertyName in ctx) {
      if (typeof ctx[propertyName] === 'function') {
        if (propertyName !== 'getExtension') {
          wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
        } else {
          const wrapped = makeErrorWrapper(ctx, propertyName);
          wrapper[propertyName] = makeGetExtensionWrapper(ctx, wrapped);
        }
      } else {
        makePropertyWrapper(wrapper, ctx, propertyName);
      }
    }

    // Override the getError function with one that returns our saved results.
    if (wrapper.getError) {
      wrapper.getError = function() {
        for (const err in glErrorShadow) {
          if (glErrorShadow.hasOwnProperty(err)) {
            if (glErrorShadow[err]) {
              glErrorShadow[err] = false;
              return err;
            }
          }
        }
        return ctx.NO_ERROR;
      };
    }

    if (wrapper.bindBuffer) {
      sharedState.wrappers["webgl"] = { wrapper: wrapper, orig: ctx };
      addEnumsForContext(ctx, ctx.bindBufferBase ? "WebGL2" : "WebGL");
    }

    return wrapper;
  }

  //------------

  function captureJSErrors() {
    // capture JavaScript Errors
    window.addEventListener('error', function(e) {
      const msg = e.message || e.error;
      const url = e.filename;
      let lineNo = e.lineno || 1;
      const colNo = e.colno || 1;
      const isUserScript = (url === window.location.href);
      if (isUserScript) {
        try {
          lineNo = window.parent.getActualLineNumberAndMoveTo(lineNo, colNo);
        } catch (ex) {
          origConsole.error(ex);
        }
      }
      console.error("line:", lineNo, ":", msg);  // eslint-disable-line
      origConsole.error(e.error);
    });
  }

  // adapted from http://stackoverflow.com/a/2401861/128511
  function getBrowser() {
    const userAgent = navigator.userAgent;
    let m = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(m[1])) {
      m = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
      return {
        name: 'IE',
        version: m[1],
      };
    }
    if (m[1] === 'Chrome') {
      const temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
      if (temp) {
        return {
          name: temp[1].replace('OPR', 'Opera'),
          version: temp[2],
        };
      }
    }
    m = m[2] ? [m[1], m[2]] : [navigator.appName, navigator.appVersion, '-?'];
    const version = userAgent.match(/version\/(\d+)/i);
    if (version) {
      m.splice(1, 1, version[1]);
    }
    return {
      name: m[0],
      version: m[1],
    };
  }

  const isWebGLRE = /^(webgl|webgl2|experimental-webgl)$/i;
  function installWebGLLessonSetup() {
    HTMLCanvasElement.prototype.getContext = (function(oldFn) {
      return function() {
        const type = arguments[0];
        const isWebGL = isWebGLRE.test(type);
        if (isWebGL) {
          setupLesson(this);
        }
        const ctx = oldFn.apply(this, arguments);
        if (!ctx && isWebGL) {
          showNeedWebGL2(this);
        }
        return ctx;
      };
    }(HTMLCanvasElement.prototype.getContext));
  }

  function installWebGLDebugContextCreator() {
    // capture GL errors
    HTMLCanvasElement.prototype.getContext = (function(oldFn) {
      return function() {
        let ctx = oldFn.apply(this, arguments);
        // Using bindTexture to see if it's WebGL. Could check for instanceof WebGLRenderingContext
        // but that might fail if wrapped by debugging extension
        if (ctx && ctx.bindTexture) {
          ctx = makeDebugContext(ctx, {
            maxDrawCalls: 100,
            errorFunc: function(err, funcName, args) {
              const numArgs = args.length;
              const enumedArgs = [].map.call(args, function(arg, ndx) {
                let str = glFunctionArgToString(funcName, numArgs, ndx, arg);
                // shorten because of long arrays
                if (str.length > 200) {
                  str = str.substring(0, 200) + "...";
                }
                return str;
              });

              const browser = getBrowser();
              let lineNdx;
              let matcher;
              if ((/chrome|opera/i).test(browser.name)) {
                lineNdx = 3;
                matcher = function(line) {
                  const m = /at ([^(]+)*\(*(.*?):(\d+):(\d+)/.exec(line);
                  if (m) {
                    let userFnName = m[1];
                    let url = m[2];
                    const lineNo = parseInt(m[3]);
                    const colNo = parseInt(m[4]);
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
                  return undefined;
                };
              } else if ((/firefox|safari/i).test(browser.name)) {
                lineNdx = 2;
                matcher = function(line) {
                  const m = /@(.*?):(\d+):(\d+)/.exec(line);
                  if (m) {
                    const url = m[1];
                    const lineNo = parseInt(m[2]);
                    const colNo = parseInt(m[3]);
                    return {
                      url: url,
                      lineNo: lineNo,
                      colNo: colNo,
                    };
                  }
                  return undefined;
                };
              }

              let lineInfo = '';
              if (matcher) {
                try {
                  const error = new Error();
                  const lines = error.stack.split("\n");
                  // window.fooLines = lines;
                  // lines.forEach(function(line, ndx) {
                  //   origConsole.log("#", ndx, line);
                  // });
                  const info = matcher(lines[lineNdx]);
                  if (info) {
                    let lineNo = info.lineNo;
                    const colNo = info.colNo;
                    const url = info.url;
                    const isUserScript = (url === window.location.href);
                    if (isUserScript) {
                      lineNo = window.parent.getActualLineNumberAndMoveTo(lineNo, colNo);
                    }
                    lineInfo = ' line:' + lineNo + ':' + colNo;
                  }
                } catch (e) {
                  origConsole.error(e);
                }
              }

              console.error(  // eslint-disable-line
                  "WebGL error" + lineInfo, glEnumToString(err), "in",
                  funcName, "(", enumedArgs.join(", "), ")");

            },
          });
        }
        return ctx;
      };
    }(HTMLCanvasElement.prototype.getContext));
  }

  installWebGLLessonSetup();

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
    makeDebugContext: makeDebugContext,
    glFunctionArgsToString: glFunctionArgsToString,
  };

}));

