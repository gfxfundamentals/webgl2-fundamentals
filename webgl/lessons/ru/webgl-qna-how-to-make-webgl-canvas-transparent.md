Title: Как сделать canvas WebGL прозрачным
Description: Как сделать canvas WebGL прозрачным
TOC: Как сделать canvas WebGL прозрачным

## Вопрос:

Можно ли сделать **WebGL canvas** с прозрачным фоном?
Я хочу, чтобы содержимое веб-страницы было видно сквозь canvas.

Вот что у меня сейчас: http://i50.tinypic.com/2vvq7h2.png

Как видно, текст за WebGL canvas не виден. Когда я меняю стиль элемента Canvas в CSS и добавляю

    opacity: 0.5;

Страница выглядит так:
https://imgur.com/BMgHWsZ

Что почти то, что мне нужно, но не совсем — цвет текста из-за CSS alpha, конечно, не такой же черный, а цвет синей фигуры не такой же синий, как на первом изображении.

Спасибо за любую помощь!
https://imgur.com/hSu5tyM

## Ответ:

WebGL по умолчанию поддерживает прозрачность. Вот пример

{{{example url="../webgl-qna-how-to-make-webgl-canvas-transparent-example-1.html"}}}

Обратите внимание, что браузер предполагает, что пиксели в canvas представлены в формате PRE-MULTIPLIED-ALPHA. Это значит, например, если вы измените цвет очистки на (1, 0, 0, 0.5), вы получите то, что не увидите больше нигде в HTML.

Я имею в виду, что pre-multiplied alpha означает, что RGB-части уже умножены на alpha. То есть если у вас 1,0,0 для RGB и alpha 0.5, то после умножения RGB на alpha получится 0.5, 0, 0 для RGB. Именно это браузер ожидает по умолчанию.

Если пиксели в WebGL — 1,0,0,0.5, это не имеет смысла для браузера, и вы получите странные эффекты.  

Смотрите, например:

{{{example url="../webgl-qna-how-to-make-webgl-canvas-transparent-example-2.html"}}}

Обратите внимание, что черный текст стал красным, хотя вы могли бы подумать, что alpha 0.5 = 50% черного текста и 50% красного WebGL canvas. Это потому, что красный не был pre-multiplied.

Вы можете решить это, убедившись, что значения, которые вы создаете в WebGL, представляют собой pre-multiplied значения, или вы можете сказать браузеру, что ваши пиксели WebGL не pre-multiplied, когда создаете контекст webgl так:

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });

Теперь пиксели 1,0,0,0.5 снова работают. Пример:

{{{example url="../webgl-qna-how-to-make-webgl-canvas-transparent-example-3.html"}}}

Какой способ использовать — зависит от вашего приложения. Многие GL-программы ожидают не pre-multiplied alpha, тогда как все остальные части HTML5 ожидают pre-multiplied alpha, поэтому WebGL дает вам оба варианта.




<div class="so">
  <div>Вопрос и процитированные части являются 
    CC BY-SA 3.0 от
    <a data-href="https://stackoverflow.com/users/1647738">Jack Sean</a>
    из
    <a data-href="https://stackoverflow.com/questions/12273858">здесь</a>
  </div>
</div> 