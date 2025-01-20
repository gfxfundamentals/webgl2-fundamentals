
/* global gl */

import {
  addElem,
  createTable,
  createTemplate,
  getColorForWebGLObject,
  helpToMarkdown,
  setName,
  updateElem,
} from './utils.js';

import {
  formatWebGLObject,
  getWebGLObjectInfo,
} from './context-wrapper.js';

import {
  createExpander,
  expand,
  makeDraggable,
} from './ui.js';

import {
  globals,
} from './globals.js';

import {arrowManager} from './arrows.js';

export function createTransformFeedbackDisplay(parent, name /*, transformFeedback*/) {
  const tfElem = createTemplate(parent, '#transform-feedback-template');
  setName(tfElem, name);
  const tfNote = helpToMarkdown(`
    A transform feedback is an object that contains a set of outputs from a vertex shader.
    It is the opposite of a vertex array. A vertex array lists the inputs to a vertex shader.
    A transform feedback lists the outputs.

    In your shader you declare outputs. Before linking the shaders into a program
    you call --gl.transformFeedbackVaryings-- to tell it which shader outputs will
    be written. You then use a transform feedback to set which buffers the outputs
    will be written to.

    The current transform feedback is set with --gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, someTransformFeedback)--.

    You create a transform feedback with --gl.createTransformFeedback()--

    You bind it as above, and then use --gl.bufferBindBase-- or --gl.bufferBindRange-- to
    tell it which buffers to write to and where in those buffers to write.

  `);
  const attrExpander = createExpander(tfElem.querySelector('.state-table'), 'varyings');
  expand(attrExpander);
  const attrsElem = createTable(attrExpander, ['offset', 'size', 'buffer']);
  const arrows = [];
  const maxAttribs = globals.isWebGL2 ? gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS) : 0;

  for (let i = 0; i < maxAttribs; ++i) {
    const tr = addElem('tr', attrsElem);

    addElem('td', tr, {
      textContent: '0',
      dataset: {
        help: helpToMarkdown(`
        where in the buffer to start writing data.

        ---js
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, someTransformFeedback)
        // if using the entire buffer (sets OFFSET to 0)
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, ${i}, someBuffer)
        // else, if using a portion of a buffer
        gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, ${i}, someBuffer, OFFSET, size);
        ----

        ${tfNote}`),
      },
    });
    addElem('td', tr, {
      textContent: '0',
      dataset: {
        help: helpToMarkdown(`
        how much of the buffer to use

        ---js
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, someTransformFeedback)
        // if using the entire buffer (sets SIZE to the size of someBuffer)
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, ${i}, someBuffer)
        // else, if using a portion of a buffer
        gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, ${i}, someBuffer, offset, SIZE);
        ----

        ${tfNote}`),
      },
    });
    addElem('td', tr, {
      textContent: 'null',
      dataset: {
        help: helpToMarkdown(`
        The buffer that will receive data

        ---js
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, someTransformFeedback)
        // if using the entire buffer (sets BUFFER to someBuffer)
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, ${i}, someBuffer)
        // else, if using a portion of a BUFFER to someBuffer
        gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, ${i}, someBuffer, offset, size);
        ----


        ${tfNote}`),
      },
    });
  }

  // note: size = -1 means use entire buffer
  const updateUnit = (target, index, buffer, offset, size) => {
    const rowElem = attrsElem.rows[index];
    updateElem(rowElem.cells[0], offset || 0);
    updateElem(rowElem.cells[1], size === undefined ? 'all' : size);
    updateElem(rowElem.cells[2], formatWebGLObject(buffer));
    const oldArrow = arrows[index];
    if (oldArrow) {
      arrowManager.remove(oldArrow);
      arrows[index] = null;
    }
    if (buffer) {
      const targetInfo = getWebGLObjectInfo(buffer);
      if (!targetInfo.deleted) {
        arrows[index] = arrowManager.add(
            rowElem.cells[2],
            targetInfo.ui.elem.querySelector('.name'),
            getColorForWebGLObject(buffer, targetInfo.ui.elem, index / maxAttribs));
      }
    }
  };

  makeDraggable(tfElem);

  return {
    elem: tfElem,
    updateUnit,
  };
}

