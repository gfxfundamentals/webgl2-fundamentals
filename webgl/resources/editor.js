console.log("--start--");
var query = {};
window.location.search.substring(1).split('&').forEach(function(pair) {
    var parts = pair.split('=').map(decodeURIComponent);
    query[parts[0]] = parts[1];
});

console.log("url:", query.url);

var req = new XMLHttpRequest();
req.open("GET", query.url, true);
req.onreadystatechange = function () {
  if (req.readyState != 4 || req.status != 200) return;
  runEditor(fixSourceLinks(query.url, req.responseText));
};
req.send("");

var blobUrl;
function getSourceBlob(source) {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
  var blob = new Blob([source], {type: 'text/html'});
  blobUrl = URL.createObjectURL(blob);
  return blobUrl;
}

function dirname(path) {
  var ndx = path.lastIndexOf("/");
  return path.substring(0, ndx + 1);
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

function runEditor(source) {

  require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});
//  require(['vs/editor/editor.main'], function() {
//      var editor = monaco.editor.create(document.querySelector(".editor>div"), {
//          value: source,
//          language: 'javascript'
//      });
//  });
  var iframe = document.querySelector(".result>iframe");
  iframe.src = getSourceBlob(source);
}

//console.log("ran");

//var html = `
//  <h1>this</h1>
//  <h2>is</h2>
//  <h3>a</h3>
//  <h4>test</h4>
//`;
//var blob = new Blob([html], { type: 'text/html'});
//var url = URL.createObjectURL(blob);
//var iframe = document.createElement('iframe');
//iframe.src = url;
//document.body.appendChild(iframe);
