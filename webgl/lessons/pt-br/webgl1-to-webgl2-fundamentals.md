Title: Diferenças da WebGL2Fundamentals.org
Description: As diferenças entre a WebGLFundamentals.org e a WebGL2Fundamentals.org

Se você leu anteriormente [webglfundamentals.org](http://webglfundamentals.org)
há algumas diferenças que você deve estar ciente.

## Literais de Templates Multilinhas

Em webglfundamentals.org quase todos os scripts são armazenados
em tags non-javascript `<script>`.

    <script id="vertexshader" type="not-js">;
    shader
    goes
    here
    </script>;

    ...

    var vertexShaderSource = document.getElementById("vertexshader").text;

Na WebGL2fundamentals.org, eu mudei completamente para permitir o uso de
literais de templates multilinhas

    var vertexShaderSource = `
    shader
    goes
    here
    `;

literais de templates multilinhas são suportados em todos os navegadores
compatíveis com a WebGL, exceto o IE11. Se você precisa de suporte para o IE11, considere utilizar
um transpilador como o [babel](http://babeljs.io).

## Todos os Shaders usam a versão GLSL 300 es

Troquei todos os shaders para GLSL 300 es. Eu pensei...qual é o ponto
de se usar a WebGL2 se você não pretende usar os Shaders da WebGL2?

## Todos os exemplos utilizam objetos Vertex Array

Os objetos Vertex Array são um recurso opcional na WebGL21, mas
eles são uma característica padrão da WebGL2. [Eu acho
que eles deveriam ser usados em todos os lugares] (webgl1-to-webgl2.html #Vertex-Array-Objects).
Na verdade, quase acho que deveria voltar para o
webglfundamentals.org e usá-los em todos os lugares
[usando um polyfill](https://github.com/greggman/oes-vertex-array-object-polyfill)
para os poucos lugares em que eles não estão disponíveis. Existe indiscutivelmente uma desvantagem zero
e seu código fica mais fácil e eficiente em quase todos os casos.

## Outras pequenas mudanças

*  Eu tentei reestruturar algumas amostras para demonstrar um pouco os padrões mais comuns

   Por exemplo, a maioria dos aplicativos geralmente configura o estado global da WebGL2 como mesclagem (blending), eliminação (culling), teste de profundidade (depth testing)
   no seu loop de renderização, uma vez que, essas configurações geralmente mudam várias vezes como no
   webglfundamentals.org eu os defini no tempo de inicialização, porque eles só precisavam ser
   definidos uma vez, mas esse não é um padrão comum.

*  Eu configurei a viewport em todas as amostras

   Deixei isso de fora na WebGL2fundamentals.org porque as amostras
   realmente não precisam disso, mas isso é necessário em praticamente todo o código do mundo real.

*  Eu removi o jquery.

   Voltando para quando eu iniciei, talvez ainda não fosse comum
   o suporte à templates strings `<input type="range">`, mas agora é suportado
   em qualquer lugar.

*  Eu fiz todas as funções auxiliares (helpers) com um prefixo

   códigos como

       var program = createProgramFromScripts(...)

   se transformaram em

       webglUtils.createProgramFromSources(...);

   Eu espero que isso faça com que seja mais claro o que
   essas funções são e onde encontrá-las.

## O que vem por aí

Eu estou discutindo se devo ou não mudar qualquer um dos exemplos da WebGL2fundamentals
para que venham a coincidirem. Demorou algumas semanas de trabalho duro para editar
todos os exemplos existentes e artigos. Eu sinto que com 12 meses a
WebGL1 será, consideravelmente, substituída pela WebGL2, porque todos os navegadores
estão num processo de auto-update. Firefox e Chrome irão entregar a WebGL2 em breve, cobrindo
uma grande porcentagem de usuário no desktop e no Android. Se a Apple e a Microsoft
adicionarem suporte a WebGL2 no Safari macOS, Safari iOS e Edge, respectivamente,
então, provavelmente, a maioria das pessoas terão um navegador com suporte
e todos nós poderemos simplesmente avançar para a WebGL2.

Espero que eu encontre tempo suficiente para adicionar mais artigos.
Dito isso, a partir de agora, novos artigos serão sobre a WebGL2, apenas.
Eu acho.



