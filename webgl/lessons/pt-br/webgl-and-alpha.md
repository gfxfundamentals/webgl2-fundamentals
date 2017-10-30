Title: Alfa e a WebGL
Description: Como o alfa no WebGL é diferente do alfa no OpenGL

Eu notei que alguns desenvolvedores do OpenGL têm problemas com a forma como a WebGL
trata o alfa no backbuffer (ou seja, a tela), então eu pensei,
pode ser bom analisar algumas das diferenças entre a WebGL e a OpenGL
em relação ao alfa.

A maior diferença entra a OpenGL e a WebGL é que a OpenGL
rendezira em um backbuffer que não está composto por nada,
ou então, não está composto com nada pelo gerenciador de janelas do
sistema operacional, sendo assim, não importa qual o valor do seu alfa.

A WebGL é composta pelo navegador com a página Web e o
padrão é usar o alfa pré-multiplicado igualmente como as tags
de imagens com arquivos .png `<img>` que possuem transparência e tags
de canvas em 2D.

A WebGL tem várias maneiras de tornar isso mais parecido com a OpenGL.

### #1) Diga a WebGL que você deseja que ela seja composta com alfa não pré-multiplicado

    gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false  // Ask for non-premultiplied alpha
    });

O padrão é true.

Claro que o resultado ainda será composto na página com qualquer que seja a cor
de fundo, ela vai acabar indo para debaixo da tela (a cor do background, 
a cor de background do container, o background da página,
inclusive as coisas que estiverem por trás do canvas, caso possuam um z-index > 0, etc ....)
em outras palavras, a cor no CSS irá definir essa área da página.

Uma boa maneira de encontrar se você tem algum problema com o alfa é configurar o
fundo da tela para uma cor brilhante como o vermelho. Você verá imediatamente
o que está acontecendo.

    <canvas style="background: red;"><canvas>

Você também pode configurá-lo como preto, o que irá ocultar quaisquer problemas com o alfa que você tenha.

### #2) Diga a WebGL que você não deseja o alpha no backbuffer

    gl = canvas.getContext("webgl", { alpha: false }};

Isso fará com que ele atue mais como a OpenGL, já que o backbuffer só terá
RGB. Esta é provavelmente a melhor opção porque um bom navegador pode ver que
você não tem um valor alfa e então, otimiza a forma como a WebGL é composto. Claro,
isso também significa que na verdade não terá alfa no backbuffer, então, se você estiver
usando alpha no backbuffer para algum propósito isso pode não funcionar para você.
Poucos aplicativos que eu conheço usam alpha no backbuffer. Eu acho que isso
deveria ter sido definido como o padrão.

### #3) Limpar o alfa no final da sua renderização

    ..
    renderScene();
    ..
    // Set the backbuffer's alpha to 1.0 by

    // Setting the clear color to 1
    gl.clearColor(1, 1, 1, 1);

    // Telling WebGL to only affect the alpha channel
    gl.colorMask(false, false, false, true);

    // clear
    gl.clear(gl.COLOR_BUFFER_BIT);

Limpar é geralmente muito rápido, já que há um tratamento especial para ele na maioria dos
hardwares. Eu fiz isso em muitos das minhas primeiras demonstrações da WebGL. Se eu fosse inteligente, eu teria mudado para o
método # 2 acima. Talvez eu faça isso logo depois de publicar isso. Parece que
a maioria das bibliotecas WebGL deve usar esse método como padrão. Esses poucos desenvolvedores,
que realmente estão usando alfa para efeitos de composição podem pedir isso. o
O resto apenas obterá o melhor desempenho e menos surpresas.

### #4) Limpe o alfa uma vez, então, não o renderize mais

    // At init time. Clear the back buffer.
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Turn off rendering to alpha
    gl.colorMask(true, true, true, false);

Claro que, se você estiver processando seus próprios quadros, você precisará girar
renderizando para o alfa novamente e depois desligar ele novamente quando você mudar para
renderização do canvas.

### #5) Manipulação de imagens

Por padrão, se você estiver carregando imagens com alfa na WebGL, a WebGL irá
forneces os valores como estão no arquivo, com os valores das cores não
pré-multiplicados. Isso geralmente é o que eu costumava usar para programas OpenGL
porque é 100% sem perdas, enquanto pré-multiplicado tem perdas.

    1, 0.5, 0.5, 0  // RGBA

É um possível valor não pré-multiplicado, enquanto um valor pré-multiplicado é um
valor impossível porque `a = 0` que significa `r`, `g` e `b` têm
de ser zero.

Ao carregar uma imagem, você pode fazer com que a WebGL pré-multiplique o alfa, se desejar.
Você pode fazer isso configurando `UNPACK_PREMULTIPLY_ALPHA_WEBGL` para true, por exemplo

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

O padrão é false.

Esteja ciente de que a maioria, senão todas as implementações de Canvas 2D, funcionam com
o alfa pré-multiplicado. Isso significa que quando você os transfere para a WebGL e
`UNPACK_PREMULTIPLY_ALPHA_WEBGL` é falso, a WebGL os converterá
de volta a um valor não pré-multiplicado.

### #6) Usando uma equação blending que funciona com alfa pré-multiplicado.

Quase todas as aplicações OpenGL que escrevi ou trabalharei, usam

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

Isso funciona para texturas alfa não pré-multiplicadas.

Se você realmente quiser trabalhar com texturas alfa pré-multiplicadas, então o que você
provavelmente quer é

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

Esses são os métodos que conheço. Se você souber de mais, por favor, publique-os abaixo.



