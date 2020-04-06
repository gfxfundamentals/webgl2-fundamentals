Title: Unterschiede zu WebGLFundamentals.org
Description: Unterschiede zwischen WebGLFundamentals.org und WebGL2Fundamentals.org
TOC: Unterschiede zwischen WebGLFundamentals.org und WebGL2Fundamentals.org


Wenn du [webglfundamentals.org](https://webglfundamentals.org) bereits
gelesen hast, wird es dür dich einige Änderungen geben die dir bewusst sein sollten.

## Multiline Template Literals

Auf webglfundamentals.org werden fast alle Skripte in nicht-javascript
`script` Tags gehalten. 


    <script id="vertexshader" type="not-js">;
    shader
    goes
    here
    </script>;

    ...

    var vertexShaderSource = document.querySelector("#vertexshader").text;

Auf webgl2fundamentals.org bin ich zu multiline template literals übergegangen

    var vertexShaderSource = `
    shader
    goes
    here
    `;

multiline template literals werden von allen WebGL-fähigen Browsern unterstützt,
den IE11 ausgenommen. Wenn du IE11 benutzen möchtest, solltest du einen Transpiler 
wie [babel](https://babeljs.io) in Erwägung ziehen.

## Alle Shader benutzen die Version GLSL 300 es

Ich habe alle Shader auf GLSL 300 es umgestellt. Ich dachte mir,
wozu WebGL2 benutzen wenn man keine WebGL2 Shader benutzt?

## Alle Beispiele nutzen Vertex Array Objects

Vertex Array Objects sind ein optionales Feature in WebGL1, in WebGL2 sind sie 
ein standard Feature. [Ich finde man sollte sie überall benutzen](webgl1-to-webgl2.html#Vertex-Array-Objects).
Eigentlich sollte ich wohl zu webglfundamentals.org zurückkehren und sie, an den wenigen Stellen and den sie nicht verfügbar sind, [mit Hilfe von polyfill](https://github.com/greggman/oes-vertex-array-object-polyfill) einsetzen. Es gibt absolut keine Nachteile, der Code wird unkomplizierter und in fast allen Fällen effizienter.

## Andere kleine Änderungen

* Ich habe versucht die Beispiele leicht anzupassen um die gängigsten Muster zu demonstrieren

  Die meisten Apps setzen globale WebGL Status wie Blending, Culling oder Depth Testing in
  der Render-Schleife, weil diese Einstellungen sich oft mehrmals ändern. Auf webglfundamentals.org
  setze ich diese Werte zur Initialisierungszeit, weil sie nur einmalig gesetzt werden müssen,
  diese Methode ist jedoch nicht gängig.

* Ich setze den Viewport in allen Beispielen

  Das habe ich auf webglfundamentals.org ausgelassen, weil es für die Beispiele
  nicht notwendig war. Es wird jedoch in nahezu allen echten Anwendungen nötig sein.

* Ich habe jquery entfernt

  Als ich anfing war es nicht üblich `<input type="range">` zu unterstützen. Jetzt 
  wird es überall unterstützt.

* Ich habe allen Hilfsfuntionen einen Prefix angefügt

  Code wie

       var program = createProgramFromScripts(...)

   wurde zu

       webglUtils.createProgramFromSources(...);

   Ich hoffe dadurch wird klarer was diese Funktionen sind und 
   wo man sie finden kann.

## Was nun

Ich überlege ob ich nicht manche der Beispiele auf webglfundamentals
entsprechend anpassen sollte. Es hat einige Wochen harter Arbeit gekostet 
um alle bestehenden Beispiele und Artikel zu überarbeiten. Ich habe das Gefühl, 
dass WebGL1 innerhalb der nächsten zwölf Monate zum größten Teil durch WebGL2 ersetzt 
werden wird, weil alle Browser auf Autoupdates eingestellt sind. Firefox und 
Chrome werden dann mit WebGL2 ausgeliefert und somit einen hohen Anteil von 
Benutzern auf Dektop und Android abdecken. Wenn Apple und Microsoft Safari macOS, 
Safari iOS und Edge WebGL2 fähig machen, sollten die meisten Benutzer abgedeckt 
sein und wir können alle mit WebGL2 weiter machen.

Hoffentlich finde ich die Zeit mehr Artikel zu schreiben.
Angesichts der oben beschriebenen Tatsachen, werden alle Artikel ab nun 
nur noch WebGL2 benutzen.
Galube ich zumindest.
