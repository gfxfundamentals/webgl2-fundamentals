
function getQuery(s) {
  var query = {};
  s = s === undefined ? window.location.search.substring(1) : s;
  s.split('&').forEach(function(pair) {
      var parts = pair.split('=').map(decodeURIComponent);
      query[parts[0]] = parts[1];
  });
  return query;
}

function getHTML(url, callback) {
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.addEventListener('load', function() {
    var success = req.status == 200 || req.status == 0;
    callback(success ? null : 'could not load: ' + url, req.responseText);
  });
  req.addEventListener('timeout', function() {
    callback("timeout get: " + url);
  });
  req.addEventListener('error', function() {
    callback("error getting: " + url);
  });
  req.send("");
}

function fixSourceLinks(url, source) {
  var srcRE = /src="/g;
  var linkRE = /href="/g
  var imageSrcRE = /image\.src = "/g;
  var loadImagesRE = /loadImages(\s*)\((\s*)\[([^]*?)\](\s*),/g;
  var quoteRE = /"(.*?)"/g;

  var u = new URL(window.location.origin + url);
  var prefix = u.origin + dirname(u.pathname);
  source = source.replace(srcRE, 'src="' + prefix);
  source = source.replace(linkRE, 'href="' + prefix);
  source = source.replace(imageSrcRE, 'image.src = "' + prefix);
  source = source.replace(loadImagesRE, function(match, p1, p2, p3, p4) {
      p3 = p3.replace(quoteRE, '"' + prefix + '$1"');
      return `loadImages${p1}(${p2}[${p3}]${p4},`;
  });

  return source;
}

var g = {
  html: '',
};

var htmlParts = {
  js: {
    language: 'javascript',
  },
  css: {
    language: 'css',
  },
  html: {
    language: 'html',
  }
};

function forEachHTMLPart(fn) {
  Object.keys(htmlParts).forEach(function(name, ndx) {
    var info = htmlParts[name];
    fn(info, ndx, name);
  });
}


function getHTMLPart(re, obj, tag) {
  var part = '';
  obj.html = obj.html.replace(re, function(p0, p1) {
    part = p1;
    return tag;
  });
  return part.replace(/\s*/, '');
}

function parseHTML(url, html) {
  html = fixSourceLinks(url, html);

  html = html.replace(/<div class="description">[^]*?<\/div>/, '');

  var styleRE = /<style>([^]*?)<\/style>/i;
  var bodyRE = /<body>([^]*?)<\/body>/i;
  var inlineScriptRE = /<script>([^]*?)<\/script>/i;
  var externalScriptRE = /<script\s*src\s*=\s*"(.*?)"\s*>\s*<\/script>/ig;

  var obj = { html: html };
  htmlParts.css.source = getHTMLPart(styleRE, obj, '<style>${css}</style>');
  htmlParts.html.source = getHTMLPart(bodyRE, obj, '<body>${html}</body>');
  htmlParts.js.source = getHTMLPart(inlineScriptRE, obj, '<script>${js}</script>');
  html = obj.html;

  var scripts = ''
  html = html.replace(externalScriptRE, function(p0, p1) {
    scripts += '\n<script src="' + p1 + '"></script>';
    return '';
  });

  htmlParts.html.source += scripts + '\n';
  g.html = html;
}

function cantGetHTML(e) {
  console.log(e);
  console.log("TODO: don't run editor if can't get HTML");
}

function main() {
  var query = getQuery();
  getHTML(query.url, function(err, html) {
    if (err) {
      console.log(err);
      return;
    }
    parseHTML(query.url, html);
    setupEditor(query.url);
  });
}


var blobUrl;
function getSourceBlob() {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
  var source = g.html;
  source = source.replace('${html}', htmlParts.html.editor.getValue());
  source = source.replace('${css}', htmlParts.css.editor.getValue());
  source = source.replace('${js}', htmlParts.js.editor.getValue());
  var blob = new Blob([source], {type: 'text/html'});
  blobUrl = URL.createObjectURL(blob);
  return blobUrl;
}

function dirname(path) {
  var ndx = path.lastIndexOf("/");
  return path.substring(0, ndx + 1);
}

function resize() {
  forEachHTMLPart(function(info) {
    info.editor.layout();
  });
}

function setupEditor() {

  forEachHTMLPart(function(info, ndx, name) {
    info.parent = document.querySelector(".panes>." + name);
    info.editor = runEditor(info.parent, info.source, info.language);
    info.button = document.querySelector(".button-" + name);
    info.button.addEventListener('click', function() {
      toggleSourcePane(info.button);
      run();
    });
  });

  g.run = document.querySelector(".button-run");
  g.run.addEventListener('click', run);

  g.iframe = document.querySelector(".result>iframe");
  g.other = document.querySelector(".panes .other");

  g.result = document.querySelector(".panes .result");
  g.resultButton = document.querySelector(".button-result");
  g.resultButton.addEventListener('click', function() {
     toggleResultPane();
     run();
  });
  g.result.style.display = "none";
  toggleResultPane();

  if (window.innerWidth > 1200) {
    toggleSourcePane(htmlParts.js.button);
  }

  window.addEventListener('resize', resize);

  showOtherIfAllPanesOff();

  resize();
  run();
}

function run() {
  g.iframe.src = getSourceBlob();
}

function addClass(elem, className) {
  var parts = elem.className.split(" ");
  if (parts.indexOf(className) < 0) {
    elem.className = elem.className + " " + className;
  }
}

function removeClass(elem, className) {
  var parts = elem.className.split(" ");
  var numParts = parts.length;
  for(;;) {
    var ndx = parts.indexOf(className);
    if (ndx < 0) {
      break;
    }
    parts.splice(ndx, 1);
  }
  if (parts.length !== numParts) {
    elem.className = parts.join(" ");
  }
}

function addRemoveClass(elem, className, add) {
  if (add) {
    addClass(elem, className);
  } else {
    removeClass(elem, className);
  }
}

function toggleSourcePane(pressedButton) {
  forEachHTMLPart(function(info) {
    var pressed = pressedButton === info.button;
    if (pressed && !info.showing) {
      addClass(info.button, "show");
      info.parent.style.display = "block";
      info.showing = true;
    } else {
      removeClass(info.button, "show");
      info.parent.style.display = "none";
      info.showing = false;
    }
  });
  showOtherIfAllPanesOff();
  resize();
}

function showingResultPane() {
  return g.result.style.display !== "none";
}
function toggleResultPane() {
  var showing = showingResultPane();
  g.result.style.display = showing ? "none" : "block";
  addRemoveClass(g.resultButton, "show", !showing);
  showOtherIfAllPanesOff();
  resize();
}

function showOtherIfAllPanesOff() {
  var paneOn = showingResultPane();
  forEachHTMLPart(function(info) {
    paneOn = paneOn || info.showing;
  });
  g.other.style.display = paneOn ? "none" : "block";
}

function runEditor(parent, source, language) {
  return monaco.editor.create(parent, {
    value: source,
    language: language,
    lineNumbers: false,
    theme: 'vs-dark',
    disableTranslate3d: true,
 //   model: null,
    scrollBeyondLastLine: false,
  });
}

require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], main);



