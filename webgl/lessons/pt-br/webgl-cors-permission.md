Title: WebGL - Cross Origin Images
Description: Usando imagens em vários domínios

Este artigo é um de uma série de artigos sobre a WebGL. Se você não leu
eles te sugiro [iniciar com uma lição anterior](webgl-fundamentals.html).

Na WebGL é comum baixar imagens e depois carregá-las para a GPU para serem
usadas como texturas. Há vários exemplos aqui que fazem isso. Por
exemplo, o artigo sobre [processamento de imagem](webgl-image-processing.html), o
artigo sobre [texturas](webgl-3d-textures.html) e o artigo
[implementando 2d drawImage](webgl-2d-drawimage.html).

Normalmente, baixamos uma imagem da forma abaixo

    // creates a texture info { width: w, height: h, texture: tex }
    // The texture will start with 1x1 pixels and be updated
    // when the image has loaded
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // Fill the texture with a 1x1 blue pixel.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 255, 255]));

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var textureInfo = {
        width: 1,   // we don't know the size until it loads
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      });
      img.src = url;

      return textureInfo;
    }

O problema é que as imagens podem ter dados privados nelas (por exemplo, um captcha, uma assinatura, uma imagem nua, ...).
Uma página da web muitas vezes tem anúncios e outras coisas que não estão no controle direto da página e, portanto, o navegador precisa prevenir
que essas coisas vejam o conteúdo dessas imagens privadas.

Apenas usando `<img src ="private.jpg">` não é um problema porque, embora a imagem seja exibida pelo
navegador, um script não pode ver os dados dentro da imagem. [A API Canvas2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
possui uma maneira de ver dentro da imagem. Primeiro, você desenha a imagem na tela

    ctx.drawImage(someImg, 0, 0);

E então, você obtêm os dados

    var data = ctx.getImageData(0, 0, width, heigh);

Mas, se a imagem que você desenhou veio de um domínio diferente, o navegador marcará o canvas como *tainted* e
você receberá um erro de segurança ao chamar `ctx.getImageData`

a WebGL tem que levá-la até mesmo um passo adiante. Na WebGL `gl.readPixels` é uma chamada equivocada para `ctx.getImageData`,
então você pensaria que talvez apenas bloqueando isso seria suficiente, mas isso acontece mesmo que você não consiga ler os pixels
diretamente, você pode criar sombreadores, que levam mais tempo para serem executados com base nas cores da imagem. Usando essa informação
você pode usar o tempo para efetivamente olhar dentro da imagem indiretamente e descobrir seus conteúdos.

Assim, a WebGL simplesmente proíbe todas as imagens que não são do mesmo domínio. Por exemplo, aqui está uma amostra curta
que desenha um retângulo rotativo com uma textura de outro domínio.
Observe que a textura nunca carrega e nós recebemos um erro

{{{example url="../webgl-cors-permission-bad.html" }}}

Como podemos resolver isso?

## Usando CORS

CORS = Cross Origin Resource Sharing. É uma maneira para a página web solicitar permissão ao servidor de imagem
para usar a imagem.

Para fazer isso, definimos o atributo `crossOrigin` com algo, em seguida, quando o navegador tenta obter a
imagem do servidor, se não for o mesmo domínio, o navegador pedirá permissão CORS.


    ...
    +    img.crossOrigin = "";   // ask for CORS permission
        img.src = url;

A string em que você define `crossOrigin` é enviada para o servidor. O servidor pode ver essa string e decidir
se irá lhe dar permissão. A maioria dos servidores que oferecem suporte a CORS não olham para a string, eles apenas
dão permissão a todos. É por isso que definir a string como vazia funciona. Tudo que isso significa, neste caso,
é "pedir permissão" vs dizer `img.crossOrigin = "bob"` significaria "pedir permissão para 'bob'".

Por que não vemos sempre essa permissão? Porque pedir permissão realizaria 2 requisições HTTP, então é
mais lento do que não perguntar. Se sabemos que estamos no mesmo domínio ou sabemos que não usaremos a imagem para nada,
exceto img tags e/ou canvas2d, então não há motivos para configurar o `crossDomain` porque ele
vai tornar as coisas muito mais lentas.

Podemos fazer uma função que verifique se a imagem que estamos tentando carregar está na mesma origem e se não estiver,
então, define o atributo `crossOrigin`.

    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

E podemos usá-lo assim

    ...
    +requestCORSIfNotSameOrigin(img, url);
    img.src = url;


{{{example url="../webgl-cors-permission-good.html" }}}

É importante notar que pedir permissão NÃO significa que você terá permissão.
Isso depende do servidor. As páginas do Github dão permissão, o flickr.com dá permissão,
imgur.com dá permissão, mas a maioria dos sites não.

<div class="webgl_bottombar">
<h3>Fazendo o Apache conceder permissão CORS</h3>
<p>Se você estiver executando um site com o Apache e você tiver o plugin mod_rewrite instalado
cocê pode conceder apoio CORS geral ao colocar</p>
<pre class="prettyprint">
    Header set Access-Control-Allow-Origin "*"
</pre>
<p>
No arquivo, <code>.htaccess</code>, apropriado.
</p>
</div>

