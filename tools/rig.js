/* Carrega o www/index.html de verdade dentro de um iframe -- mesmo HTML,
 * mesmo game.js, nada duplicado -- mas com o requestAnimationFrame e o
 * relogio sob controle, para dirigir a cena quadro a quadro.
 *
 * Usado por scene-sheet.html (inspecao) e press-kit.html (capturas).
 */
window.Rig = (function () {
  'use strict';

  function patch(lang) {
    return '<script>' +
      'window.__pending=null;' +
      'window.requestAnimationFrame=function(f){window.__pending=f;return 0;};' +
      'window.__clock=1000;' +
      'performance.now=function(){return window.__clock;};' +
      // forca o idioma das capturas, sem depender do idioma da maquina
      (lang ? 'Object.defineProperty(navigator,"language",{get:function(){return "'
              + lang + '";}});' : '') +
      '<\/script>';
  }

  function load(ifr, src, lang) {
    if (src && src.indexOf('.') < 0) { lang = src; src = null; }   // load(ifr, 'en')
    src = src || '../www/index.html';
    return fetch(src).then(function (r) { return r.text(); }).then(function (html) {
      // O <base> tem que vir ANTES do <link>/<script>, senao os caminhos
      // relativos resolvem contra tools/ e dao 404.
      // ?v= nos scripts do jogo: sem isso o navegador serve o coin.js/game.js
      // antigos do cache e as capturas saem de uma versao que nao existe mais
      var v = Date.now();
      html = html.replace('<head>', '<head><base href="../www/">')
                 .replace('js/coin.js', 'js/coin.js?v=' + v)
                 .replace('js/game.js', 'js/game.js?v=' + v)
                 .replace('css/style.css', 'css/style.css?v=' + v)
                 .replace('<script src="js/coin.js?v=' + v + '">',
                          patch(lang) + '<script src="js/coin.js?v=' + v + '">')
                 // nada de service worker na inspecao: ele so serviria para
                 // mascarar edicoes recentes por tras de um cache
                 .replace("navigator.serviceWorker.register('sw.js')",
                          'Promise.resolve()');
      var d = ifr.contentDocument;
      d.open(); d.write(html); d.close();
      return new Promise(function (res) {
        setTimeout(function () { res(montar(ifr)); }, 80);
      });
    });
  }

  function montar(ifr) {
    var W = ifr.contentWindow, D = ifr.contentDocument;
    var cv = D.getElementById('game');
    var cx = cv.getContext('2d');
    var k  = cv.width / cv.clientWidth;          // escala do DPR

    function step(n) {
      for (var i = 0; i < n; i++) {
        W.__clock += 16.7;
        var f = W.__pending;
        W.__pending = null;
        if (f) f(W.__clock);
      }
    }
    function tap()   { D.dispatchEvent(new W.PointerEvent('pointerdown', { bubbles: true })); }
    function score() { return parseInt(D.getElementById('score').textContent.slice(1), 10) || 0; }
    function vidas() {
      return [].filter.call(D.getElementById('lives').children,
                            function (e) { return !e.classList.contains('off'); }).length;
    }
    function over()  { return !D.getElementById('over').classList.contains('hidden'); }

    // Altura aparente da moeda que gira, lida dos pixels: o papel e bege
    // (r > b) e todo pixel da moeda e cinza neutro ou azulado (b >= r).
    // E assim que da para "mirar" sem acesso ao estado interno do jogo.
    function abertura() {
      var px = Math.round(cv.clientWidth / 2 * k);
      var y0 = Math.round((cv.clientHeight * 0.17 - 50) * k);
      var hh = Math.round(100 * k);
      var img = cx.getImageData(px, y0, 1, hh).data;
      var n = 0;
      for (var i = 0; i < hh; i++) if (img[i * 4 + 2] >= img[i * 4]) n++;
      return n / k;
    }

    // Solta no momento certo ate juntar `alvo` moedas boiando.
    function encher(alvo, limite) {
      limite = limite || 14;
      if (score() === 0 && !over()) { tap(); step(2); }
      var q = 0;
      while (score() < alvo && q < 2500 && !over()) {
        step(1); q++;
        if (abertura() < limite) { tap(); step(46); }
      }
      step(30);                                   // deixa as covinhas assentarem
      return score();
    }

    // Erra de proposito ate uma afundar; para logo apos o impacto.
    function afundar(quadros) {
      var v = vidas(), i = 0;
      while (vidas() === v && i < 80) { i++; tap(); step(44); step(3 + (i * 7) % 31); }
      step(quadros === undefined ? 6 : quadros);
      return vidas();
    }

    // Para a moeda que gira num grau de abertura escolhido (1 = de frente).
    function girarAte(alvo, tol) {
      tol = tol || 3;
      var q = 0, want = alvo * 2 * (cv.clientWidth * 0.095);
      while (q < 400) { step(1); q++; if (Math.abs(abertura() - want) < tol) return true; }
      return false;
    }

    function png() { return cv.toDataURL('image/png'); }

    return { win: W, doc: D, canvas: cv, step: step, tap: tap, score: score,
             vidas: vidas, over: over, abertura: abertura, encher: encher,
             afundar: afundar, girarAte: girarAte, png: png };
  }

  return { load: load };
})();
