/* global require module */
'use strict';

const fs = require('fs');

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  const s_ignoreRE = /\.(md|py|sh|enc)$/i;
  function noMds(filename) {
    return !s_ignoreRE.test(filename);
  }

  function notFolder(filename) {
    return !fs.statSync(filename).isDirectory();
  }

  function noMdsNoFolders(filename) {
    return noMds(filename) && notFolder(filename);
  }

  grunt.initConfig({
    eslint: {
      lib: {
        src: [
          'webgl/resources/webgl-utils.js',
          'webgl/resources/webgl-lessons-helper.js',
          'webgl/resources/flattened-primitives.js',
          'webgl/resources/2d-math.js',
          'webgl/resources/3d-math.js',
          'build/js/*.js',
        ],
      },
      examples: {
        src: [
          'webgl/*.html',
          // 'webgl/lessons/*.md',
        ],
      },
    },
    jsdoc: {
      docs: {
        src: [
          'webgl/resources/2d-math.js',
          'webgl/resources/3d-math.js',
          'webgl/resources/webgl-utils.js',
          'docs.md',
        ],
        options: {
          destination: 'out/docs',
          configure: 'build/conf/jsdoc.conf.json',
          template: './node_modules/minami',
        },
      },
    },
    copy: {
      main: {
        files: [
          { expand: false, src: '*', dest: 'out/', filter: noMdsNoFolders, },
          { expand: true, src: 'webgl/**', dest: 'out/', filter: noMds, },
          { expand: true, src: 'monaco-editor/**', dest: 'out/', },
          { expand: true, src: '3rdparty/**', dest: 'out/', },
        ],
      },
    },
    clean: [
      'out/**/*',
    ],
  });

  grunt.registerTask('buildlessons', function() {
    const buildStuff = require('./build/js/build');
    const finish = this.async();
    buildStuff({
      outDir: 'out',
      baseUrl: 'http://webgl2fundamentals.org',
      rootFolder: 'webgl',
      lessonGrep: 'webgl*.md',
      siteName: 'WebGL2Fundamentals',
      siteThumbnail: 'webgl2fundamentals.jpg',  // in rootFolder/lessons/resources
    }).then(function() {
        finish();
    }).done();
  });

  grunt.registerTask('build', ['clean', 'copy', 'buildlessons']);

  grunt.registerTask('default', ['eslint', 'build', 'jsdoc']);
};

