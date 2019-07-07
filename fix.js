/* eslint-disable no-inner-declarations */
/* eslint-disable no-use-before-define */
/* global require */
/* eslint no-undef: "error" */
/* eslint no-console: "off" */
/* eslint no-loop-func: "off" */

'use strict';

const cache      = new (require('inmemfilecache'))();
const fs         = require('fs');
const glob       = require('glob');
const hanson     = require('hanson');
const JSDOM      = require('jsdom').JSDOM;
const path       = require('path');

const settings = {
  rootFolder: 'webgl',
};

function readFile(fileName) {
  return cache.readFileSync(fileName, 'utf-8');
}

function writeFileIfChanged(fileName, content) {
  if (fs.existsSync(fileName)) {
    const old = readFile(fileName);
    if (content === old) {
      return;
    }
  }
  fs.writeFileSync(fileName, content);
  console.log('Wrote: ' + fileName);  // eslint-disable-line
}

const extractHeader = (function() {
  const headerRE = /([A-Z0-9_-]+): (.*?)$/i;

  return function(content) {
    const metaData = { };
    const lines = content.split('\n');
    for (;;) {
      const line = lines[0].trim();
      const m = headerRE.exec(line);
      if (!m) {
        break;
      }
      metaData[m[1].toLowerCase()] = m[2];
      lines.shift();
    }
    return {
      content: lines.join('\n'),
      headers: metaData,
    };
  };
}());

function parseMD(content) {
  return extractHeader(content);
}

function loadMD(contentFileName) {
  const content = cache.readFileSync(contentFileName, 'utf-8');
  return parseMD(content);
}

const readdirs = function(dirpath) {
  const dirsOnly = function(filename) {
    const stat = fs.statSync(filename);
    return stat.isDirectory();
  };

  const addPath = function(filename) {
    return path.join(dirpath, filename);
  };

  return fs.readdirSync(`${settings.rootFolder}/lessons`)
      .map(addPath)
      .filter(dirsOnly);
};

const isLangFolder = function(dirname) {
  const filename = path.join(dirname, 'langinfo.hanson');
  return fs.existsSync(filename);
};

const pathToLang = function(filename) {
  const lang = path.basename(filename);
  const lessonBase = `${settings.rootFolder}/lessons`;
  const lessons = `${lessonBase}/${lang}`;
  return {
    lang,
    toc: `${settings.rootFolder}/lessons/${lang}/toc.html`,
    lessons: `${lessonBase}/${lang}`,
    template: 'build/templates/lesson.template',
    examplePath: `/${lessonBase}/`,
    home: `/${lessons}/`,
  };
};

let langs = [
  // English is special (sorry it's where I started)
  {
    template: 'build/templates/lesson.template',
    lessons: `${settings.rootFolder}/lessons`,
    lang: 'en',
    toc: `${settings.rootFolder}/lessons/toc.html`,
    examplePath: `/${settings.rootFolder}/lessons/`,
    home: '/',
  },
];

langs = langs.concat(readdirs(`${settings.rootFolder}/lessons`)
    .filter(isLangFolder)
    .map(pathToLang));


const englishTitleToCategory = {
  'Fundamentals': 'fundamentals',
  'Image Processing': 'image-processing',
  '2D translation, rotation, scale, matrix math': 'matrices',
  '3D': '3d',
  'Lighting': 'lighting',
  'Structure and Organization': 'organization',
  'Geometry': 'geometry',
  'Textures': 'textures',
  'Rendering To A Texture': 'rendertargets',
  'Techniques': 'techniques',
  '2D': '2d',
  'Text': 'text',
  'Misc': 'misc',
  'Reference': 'reference',
};

let g_mdToCategory;

for (const lang of langs) {
  const mds = glob.sync(path.join(lang.lessons, '*.md'))
      .filter(a => !a.endsWith('index.md'));
  const dom = new JSDOM(readFile(lang.toc)).window.document;
  const top = dom.body.children[0];
  const mdToCategory = {};
  const mdToLangCategory = {};
  const mdToTOC = {};
  const toc = parse(top);

  writeFileIfChanged(lang.toc, `{{{tocHtml}}}
${dom.body.children[1].outerHTML}`);

  function parse(top, catPrefix = '', prefix = '') {
    const toc = {};
    let currentCat;
    let currentName;
    for (const cat of top.children) {
      switch (cat.tagName) {
        case 'LI':
          currentCat = {};
          currentName = cat.textContent;
          toc[currentName] = currentCat;
          break;
        case 'UL': {
          const sub = cat.querySelector('ul>ul');
          if (sub) {
            toc[currentName] = [parse(cat, `${catPrefix}${englishTitleToCategory[currentName]}|`, `${prefix}${currentName}|`)];
          } else {
            [...cat.querySelectorAll('a')].forEach((a) => {
              const name = path.basename(a.href).replace('.html', '.md');
              currentCat[name] = a.textContent;
              mdToCategory[name] = `${catPrefix}${englishTitleToCategory[currentName]}`;
              mdToLangCategory[name] = `${prefix}${currentName}`;
              mdToTOC[name] = a.textContent;
            });
          }
          break;
        }
      }
    }
    return toc;
  }

  //console.log(JSON.stringify(mdToLangCategory, null, 2));
  //process.exit(0);

  if (!g_mdToCategory) {
    g_mdToCategory = mdToCategory;
    const newToc = convertTOC(toc);

    function convertTOC(toc) {
      const newToc = {};
      for (const [cat, articles] of Object.entries(toc)) {
        const newCat = englishTitleToCategory[cat];
        if (Array.isArray(articles)) {
          newToc[newCat] = convertTOC(articles[0]);
        } else {
          newToc[newCat] = Object.keys(articles);
        }
      }
      return newToc;
    }

    writeFileIfChanged('toc.hanson', JSON.stringify(newToc, null, 2));
  }

  //console.log(JSON.stringify(toc, null, 2));

  const langFile = path.join(lang.lessons, 'langinfo.hanson');
  const langJS = readFile(langFile);
  const lastBraceNdx = langJS.lastIndexOf('}');
  const categoryMapping = {};
  for (const [md, langCategory] of Object.entries(mdToLangCategory)) {
    const eng = g_mdToCategory[md].split('|');
    const local = langCategory.split('|');
    eng.forEach((engCat, ndx) => {
      categoryMapping[engCat] = local[ndx];
    });
  }
  const newJS = `${langJS.substr(0, lastBraceNdx)}  categoryMapping: {
    ${Object.entries(categoryMapping).map(([key, value]) => {
      return `'${key}': ${JSON.stringify(value)},`;
    }).join('\n    ')}
  },
}`;
  writeFileIfChanged(langFile, newJS);

  for (const filename of mds) {
    const data = loadMD(filename);
    const basename = path.basename(filename);
    data.headers['Title'] = data.headers.title;
    data.headers['Description'] = data.headers.description;
    delete data.headers['title'];
    delete data.headers['description'];
    data.headers['Category'] = g_mdToCategory[basename].split('|').pop();
    data.headers['TOC'] = mdToTOC[basename];
    writeFileIfChanged(filename, `${Object.entries(data.headers).map(([key, value]) => `${key}: ${value}`).join('\n')}

${data.content}`);

  }
}
