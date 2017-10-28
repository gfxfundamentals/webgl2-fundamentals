Title: Configuração e Instalação da WebGL
Description: Como desenvolver para a WebGL

Tecnicamente, você não precisa de nada além um navegador para trabalhar com a WebGL.
Vá para [jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/) ou [jsbin.com](http://jsbin.com)
ou [codepen.io](http://codepen.io/greggman/pen/YGQjVV) e simplesmente comece a aplicar as lições que você vê aqui.

Em todos eles você pode referenciar scripts externos adicionando as tags `<script src="..."></script>`
se você quiser usar scripts externos.

Ainda assim, existem limites. O WebGL possui restrições mais fortes do que o Canvas2D para carregar imagens,
o que significa que você não pode acessar facilmente imagens da Web para o seu projeto da WebGL.
Além disso, é rápido trabalhar com tudo localmente.

Vamos supor que você deseja executar e editar as amostras neste site. A primeira coisa que você deve
 fazer é o download do site. [Você pode baixar aqui](https://github.com/greggman/webgl2-fundamentals/tree/gh-pages).

{{{image url="resources/download-webglfundamentals.gif" }}}

Descompacte os arquivos em alguma pasta.

## Usando um pequeno e simples servidor Web simples

Em seguida, você deve instalar um pequeno servidor web. Eu sei que o "servidor web" parece assustador, mas a verdade é que [web
servers são extremamente simples](http://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

Se você estiver usando o Chrome, aqui está uma solução simples.
[Aqui está uma pequena extensão do Chrome que é um servidor web](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en)

{{{image url="resources/chrome-webserver.png" }}}

Basta apontá-lo para a pasta onde você descompactou os arquivos e clicar em uma das URLs do servidor web.

Se você não estiver usando o Chrome ou se não quiser usar a extensão, outra maneira é usar o [node.js](https://nodejs.org).
Faça o download, instale-o e abra uma janela do prompt de comando / console / terminal. Se você estiver no Windows, o instalador
irá adicionar o "Node Command Prompt", use-o.

Em seguida, instale o [`http-server`](https://github.com/indexzero/http-server) com o seguinte comando

    npm -g install http-server

Se estiver usando o OSX, use

    sudo npm -g install http-server

Depois de ter feito isso, digite

    http-server path/to/folder/where/you/unzipped/files

Deve imprimir algo como

{{{image url="resources/http-server-response.png" }}}

Então, no seu navegador, vá para [`http://localhost:8080`](http://localhost:8080).

Se você não especificar um caminho, o servidor http irá hospedar a pasta atual.

## Usando as Ferramento de Desenvolvedor do Seu Navegador

A maioria dos navegadores possui ferramentas extensas para desenvolvedores incorporadas.

{{{image url="resources/chrome-devtools.png" }}}

[A documentação do Chrome se encontra aqui](https://developers.google.com/web/tools/chrome-devtools/),
[E aqui está a do Firefox](https://developer.mozilla.org/en-US/docs/Tools).

Aprenda como usá-los. Sempre verifique o console de JavaScript. Se houver um problema, muitas vezes terá
uma mensagem de erro. Leia a mensagem de erro atentamente e você deve obter uma pista de onde o problema está.

{{{image url="resources/javascript-console.gif" }}}

## WebGL Helpers

Há muitos Inspectors / Helpers na WebGL. [Aqui está um para o Chrome](https://benvanik.github.io/WebGL-Inspector/).

{{{image url="https://benvanik.github.io/WebGL-Inspector/images/screenshots/1-Trace.gif" }}}

[O Firefox também possui um similar](https://hacks.mozilla.org/2014/03/introducing-the-canvas-debugger-in-firefox-developer-tools/).
Ele precisa ser ativado em `about:flags` e talvez seja necessário o [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/).

Nota: No momento da criação deste artigo, as ferramentas acima não funcionam com a WebGL2.

Eles podem ou não serem úteis. A maioria deles é projetada para exemplos animados e irão capturar um quadro
e permitem que você veja todas as chamadas da WebGL responsáveis por criar aquele quadro. Isso é ótimo se você
já tiver algum projeto funcionando ou se você tinha algo que funcionava e parou. Mas não é tão bom se o seu 
problema for durante a inicialização já que nenhuma captura é realizada ou, se você não está usando animação, como
desenhar algo em cada quadro.
Ainda assim, eles podem ser muito úteis. Muitas vezes, eu irei clicar nas chamadas que irão realizar os desenhos e
verificar os uniforms. Se eu vejo um monte de `NaN` (NaN = Not a Number), então eu geralmente consigo rastrear a
parte do código aonde esse uniform foi definido e encontrar o bug.

## Inspecionar o Código

Também lembre-se sempre de que você pode inspecionar o código. Você geralmente pode simplesmente escolher a fonte de visualização

{{{image url="resources/view-source.gif" }}}

Mesmo que você não seja capaz de clicar com o botão direito do mouse em uma página ou se o código fonte está em
um arquivo separado, você sempre poderá ver o código fonte nas ferramentas do desenvolvedor

{{{image url="resources/devtools-source.gif" }}}

## Iniciando

Espero que isso te ajude a começar. [Agora de volta às lições](/).
