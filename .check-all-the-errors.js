module.exports = {
  followLinks: 'both',
  output: 'webgl2fundamentals.check.json',
  expectedErrors: [
    {
      filter: "webgl-3d-textures.html",
      errors: [
        { type: 'msg', test: "gl.INVALID_OPERATION in generateMipmap", },
      ],
    },
    {
      filter: "webgl-data-textures.html",
      errors: [
        { type: 'msg', test: "gl.INVALID_OPERATION in texImage2D", },
      ],
    },
    {
      filter: "webgl-cors-permission.html",
      errors: [
        { type: 'msg', test: /Uncaught SecurityError.*?cross-origin data/, },
        { type: 'msg', test: "JSHandle@error", },
        { type: 'pageerror', test: "DOMException: Failed to execute 'texImage2D'", },
      ],
    },
    {
      filter: "webgl-cors-permission-bad.html",
      errors: [
        { type: 'pageerror', test: "DOMException: Failed to execute 'texImage2D", },
      ],
    },
    {
      filter: "webgl-3d-geometry-lathe.html",
      errors: [
        { type: 'badlink', test: 'www.maxon.net' },
      ],
    },
    {
      filter: /\/webgl\/$/,
      errors: [
        { type: 'badResponse', test: ''},
        { type: 'msg', test: 'Failed to load resource'},
      ],
    },
    {
      filter: 'webgl-setup-and-installation.html',
      errors: [
        { type: 'badlink', test: 'https://codepen.io/greggman/pen/YGQjVV', }
      ],
    },
  ]
};
