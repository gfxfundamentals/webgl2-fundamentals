Title: Показать ночной вид против дневного вида на 3D сфере Земли
Description: Показать ночной вид против дневного вида на 3D сфере Земли
TOC: Показать ночной вид против дневного вида на 3D сфере Земли

## Вопрос:

Я использую Three.js как фреймворк для разработки космического симулятора и пытаюсь, но не могу заставить работать ночные огни.

Симулятор доступен здесь:

[orbitingeden.com][1]

и страница, запускающая фрагмент кода ниже, находится здесь:

[orbitingeden.com/orrery/soloearth.html][2]

Код для примера страницы здесь. Я даже не знаю, с чего начать. Я пытался рендерить два глобуса на несколько единиц друг от друга, один ближе к солнцу (дневная версия) и один дальше (ночная версия), но есть много проблем, не в последнюю очередь то, что они начинают перекрывать друг друга странными додекаэдрическими способами. Я принял идею tDiffuse2 из этого [оррери][3], но не смог заставить её работать.

    <!doctype html>
    <html lang="en">
     <head>
      <title>three.js webgl - earth</title>
      <meta charset="utf-8">
      <script src="three.js/Detector.js"></script>
      <script src="three.js/Three.js"></script>
     </head>
     <body>
      <script>
       if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
    
       var radius = 6371;
       var tilt = 0.41;
       var rotationSpeed = 0.02;
       var cloudsScale = 1.005;
       var SCREEN_HEIGHT = window.innerHeight;
       var SCREEN_WIDTH  = window.innerWidth;
       var container, camera, scene, renderer;
       var meshPlanet, meshClouds, dirLight, ambientLight;
       var clock = new THREE.Clock();
    
       init();
       animate();
    
       function init() {
        container = document.createElement( 'div' );
        document.body.appendChild( container );
    
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );
    
        camera = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 1e7 );
        camera.position.z = radius * 5;
        scene.add( camera );
    
        dirLight = new THREE.DirectionalLight( 0xffffff );
        dirLight.position.set( -20, 0, 2 ).normalize();
        scene.add( dirLight );
    
        ambientLight = new THREE.AmbientLight( 0x000000 );
        scene.add( ambientLight );
    
        //initialize the earth
        var planetTexture = THREE.ImageUtils.loadTexture( "textures/earth-day.jpg" ),
        nightTexture      = THREE.ImageUtils.loadTexture( "textures/earthNight.gif" ),
        cloudsTexture     = THREE.ImageUtils.loadTexture( "textures/clouds.gif" ),
        normalTexture     = THREE.ImageUtils.loadTexture( "textures/earth-map.jpg" ),
        specularTexture   = THREE.ImageUtils.loadTexture( "textures/earth-specular.jpg" );
        var shader = THREE.ShaderUtils.lib[ "normal" ];
        var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
        uniforms[ "tNormal" ].texture = normalTexture;
        uniforms[ "uNormalScale" ].value = 0.85;
        uniforms[ "tDiffuse" ].texture = planetTexture;
        uniforms[ "tDiffuse2" ].texture = nightTexture;
        uniforms[ "tSpecular" ].texture = specularTexture;
        uniforms[ "enableAO" ].value = false;
        uniforms[ "enableDiffuse" ].value = true;
        uniforms[ "enableSpecular" ].value = true;
        uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff );
        uniforms[ "uSpecularColor" ].value.setHex( 0x333333 );
        uniforms[ "uAmbientColor" ].value.setHex( 0x000000 );
        uniforms[ "uShininess" ].value = 15;
        var parameters = {
         fragmentShader: shader.fragmentShader,
         vertexShader: shader.vertexShader,
         uniforms: uniforms,
         lights: true,
         fog: true
        };
        var materialNormalMap = new THREE.ShaderMaterial( parameters );
        geometry = new THREE.SphereGeometry( radius, 100, 50 );
        geometry.computeTangents();
        meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
        meshPlanet.rotation.y = 0;
        meshPlanet.rotation.z = tilt;
        scene.add( meshPlanet );
    
        // clouds
        var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, map: cloudsTexture, transparent: true } );
        meshClouds = new THREE.Mesh( geometry, materialClouds );
        meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
        meshClouds.rotation.z = tilt;
        scene.add( meshClouds );
    
        renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1 } );
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.sortObjects = false;
        renderer.autoClear = false;
        container.appendChild( renderer.domElement );
       };
    
       function animate() {
        requestAnimationFrame( animate );
        render();
       };
    
       function render() {
        // rotate the planet and clouds
        var delta = clock.getDelta();
        meshPlanet.rotation.y += rotationSpeed * delta;
        meshClouds.rotation.y += 1.25 * rotationSpeed * delta;
        //render the scene
        renderer.clear();
        renderer.render( scene, camera );
       };
      </script>
     </body>
    </html>


  [1]: http://orbitingeden.com
  [2]: http://orbitingeden.com/orrery/soloearth.html
  [3]: http://www.esfandiarmaghsoudi.com/Apps/SolarSystem/

## Ответ:

Если я правильно понимаю ваш вопрос....

Я не знаю three.js, но в общем я бы сделал это, имея шейдер, которому передаются и дневная, и ночная текстуры, а затем выбирая одну или другую в шейдере. Например:

    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    varying vec3 v_surfaceToLight;  // assumes this gets passed in from vertex shader
    varying vec4 v_normal;          // assumes this gets passed in from vertex shader
    varying vec2 v_texCoord;        // assumes this gets passed in from vertex shader

    void main () {
       vec3 normal = normalize(v_normal);
       vec3 surfaceToLight = normalize(v_surfaceToLight);
       float angle = dot(normal, surfaceToLight);
       vec4 dayColor = texture2D(dayTexture, v_texCoords);
       vec4 nightColor = texture2D(nightTexture, v_texCoord);
       vec4 color = angle < 0.0 ? dayColor : nightColor;

       ...
   
       gl_FragColor = color * ...;
    }

В основном вы берёте расчёт освещения и вместо использования его для освещения используете его для выбора текстуры. Расчёт освещения обычно использует скалярное произведение между нормалью поверхности и направлением света (солнца) от поверхности. Это даёт вам косинус угла между этими двумя векторами. Косинус идёт от -1 до 1, так что если значение от -1 до 0, это обращено от солнца, если от 0 до +1, это обращено к солнцу.

Строка

       vec4 color = angle < 0.0 ? dayColor : nightColor;

выбирает день или ночь. Это будет резкий переход. Вы можете поэкспериментировать с чем-то более размытым, например:

    
       // convert from -1 <-> +1 to 0 <-> +1
       float lerp0To1 = angle * 0.5 + 0.5; 

       // mix between night and day
       vec4 color = mix(nightColor, dayColor, lerp0to1);


Это даст вам 100% день в точке, прямо обращённой к солнцу, и 100% ночь в точке, прямо противоположной солнцу, и смесь между ними. Вероятно, не то, что вы хотите, но вы можете поиграть с числами. Например:

       // sharpen the mix
       angle = clamp(angle * 10.0, -1.0, 1.0);

       // convert from -1 <-> +1 to 0 <-> +1
       float lerp0To1 = angle * 0.5 + 0.5; 

       // mix between night and day
       vec4 color = mix(nightColor, dayColor, lerp0to1);


Надеюсь, это имело смысл.

----

Так что я потратил немного времени на создание примера Three.js, отчасти чтобы изучить Three.js. Пример здесь.

{{{example url="../webgl-qna-show-a-night-view-vs-a-day-view-on-a-3d-earth-sphere-example-1.html"}}}

Шейдер, который я использовал, это:

    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;

    uniform vec3 sunDirection;

    varying vec2 vUv;
    varying vec3 vNormal;

    void main( void ) {
        vec3 dayColor = texture2D( dayTexture, vUv ).rgb;
        vec3 nightColor = texture2D( nightTexture, vUv ).rgb;

        // compute cosine sun to normal so -1 is away from sun and +1 is toward sun.
        float cosineAngleSunToNormal = dot(normalize(vNormal), sunDirection);

        // sharpen the edge beween the transition
        cosineAngleSunToNormal = clamp( cosineAngleSunToNormal * 10.0, -1.0, 1.0);

        // convert to 0 to 1 for mixing
        float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;

        // Select day or night texture based on mixAmount.
        vec3 color = mix( nightColor, dayColor, mixAmount );

        gl_FragColor = vec4( color, 1.0 );

        // comment in the next line to see the mixAmount
        //gl_FragColor = vec4( mixAmount, mixAmount, mixAmount, 1.0 );
    }

Большая разница от предыдущего в том, что поскольку солнце обычно считается направленным источником света, поскольку оно так далеко, то всё, что вам нужно — это его направление. Другими словами, в какую сторону оно указывает относительно земли.

<div class="so">
  <div>Вопрос и цитируемые части взяты по лицензии CC BY-SA 3.0 у
    <a data-href="http://orbitingeden.com">Orbiting Eden</a>
    с сайта
    <a data-href="https://stackoverflow.com/questions/10644236">stackoverflow</a>
  </div>
</div> 