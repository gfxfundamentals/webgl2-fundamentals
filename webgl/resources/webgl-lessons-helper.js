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
      document.getElementsByTagName("html")[0].className = "iframe";
      document.body.className = "iframe";
    }
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
             <a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>
          </div>
        </div>
      `;
      div = div.querySelector("div");
      doc.body.appendChild(div);
    }
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
      if (!options.dontResize && options.resize !== false) {
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

  return {
    setupLesson: setupLesson,
    showNeedWebGL2: showNeedWebGL2,
    setupSlider: setupSlider,
  };

}));

