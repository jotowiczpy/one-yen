/* 1円 (ichien)
 *
 * A moeda japonesa de 1 iene e de aluminio puro e boia na agua por tensao
 * superficial -- mas so se encostar deitada. Em pe, ela corta a superficie
 * e afunda.
 *
 * A moeda gira no ar: circulo cheio = em pe, risco fino = deitada.
 * Toque no instante em que ela estiver fina.
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  // ---------------------------------------------------------------- ajuste
  var FLAT_TOL = 0.28;   // |cos(theta)| abaixo disso conta como "deitada"
  var LIVES    = 3;
  var GRAVITY  = 2200;   // px/s^2
  var SPIN_0   = 1.8;    // rad/s no comeco
  var SPIN_UP  = 0.14;   // aceleracao por moeda flutuada
  var SPIN_MAX = 5.0;

  // ---------------------------------------------------------------- textos
  // O idioma sai do aparelho. Ingles e o padrao de quem nao bater com nenhum,
  // por ser o publico majoritario das lojas web. O chines distingue escrita
  // tradicional (TW/HK/MO ou -hant) da simplificada.
  var LANG = (function () {
    var L = (navigator.language || 'en').toLowerCase();
    if (L.indexOf('zh') === 0) {
      return /hant|tw|hk|mo/.test(L) ? 'zhHant' : 'zhHans';
    }
    var base = L.split('-')[0];
    return ({ pt: 1, es: 1, fr: 1, de: 1, it: 1, ja: 1, ko: 1, en: 1 })[base] ? base : 'en';
  })();

  var T = {
    en: {
      sub:   'Pure aluminium, 1 gram.<br>Land it flat and it floats.',
      tap:   'tap to start',
      over:  'it sank',
      again: 'tap to play again',
      best:  'best \u00a5',
      paid:  'you made your yen back'
    },
    pt: {
      sub:   'Alum\u00ednio puro, 1 grama.<br>Se cair deitada, ela boia.',
      tap:   'toque para come\u00e7ar',
      over:  'afundou',
      again: 'toque para jogar de novo',
      best:  'recorde \u00a5',
      paid:  'voc\u00ea recuperou o 1 iene'
    },
    es: {
      sub:   'Aluminio puro, 1 gramo.<br>Si cae plana, flota.',
      tap:   'toca para empezar',
      over:  'se hundi\u00f3',
      again: 'toca para jugar otra vez',
      best:  'r\u00e9cord \u00a5',
      paid:  'recuperaste tu yen'
    },
    fr: {
      sub:   'Aluminium pur, 1 gramme.<br>\u00c0 plat, elle flotte.',
      tap:   'touchez pour commencer',
      over:  'coul\u00e9e',
      again: 'touchez pour rejouer',
      best:  'record \u00a5',
      paid:  'vous avez r\u00e9cup\u00e9r\u00e9 votre yen'
    },
    de: {
      sub:   'Reines Aluminium, 1 Gramm.<br>Flach gelandet, schwimmt sie.',
      tap:   'tippen zum Starten',
      over:  'versunken',
      again: 'tippen f\u00fcr neue Runde',
      best:  'Bestwert \u00a5',
      paid:  'du hast deinen Yen wieder'
    },
    it: {
      sub:   'Alluminio puro, 1 grammo.<br>Se cade piatta, galleggia.',
      tap:   'tocca per iniziare',
      over:  'affondata',
      again: 'tocca per rigiocare',
      best:  'record \u00a5',
      paid:  'hai recuperato il tuo yen'
    },
    ja: {
      sub:   '\u30a2\u30eb\u30df100%\u30011\u30b0\u30e9\u30e0\u3002<br>\u5e73\u3089\u306b\u843d\u3061\u308c\u3070\u6c34\u306b\u6d6e\u304f\u3002',
      tap:   '\u30bf\u30c3\u30d7\u3057\u3066\u30b9\u30bf\u30fc\u30c8',
      over:  '\u3057\u305a\u3093\u3060',
      again: '\u30bf\u30c3\u30d7\u3057\u3066\u3082\u3046\u4e00\u5ea6',
      best:  '\u30d9\u30b9\u30c8 \u00a5',
      paid:  '\u5143\u304c\u53d6\u308c\u305f'
    },
    ko: {
      sub:   '\uc21c\uc218 \uc54c\ub8e8\ubbf8\ub284, 1\uadf8\ub7a8.<br>\ub0a9\uc9dd\ud558\uac8c \ub5a8\uc5b4\uc9c0\uba74 \ub730\ub2e4.',
      tap:   '\ud0ed\ud574\uc11c \uc2dc\uc791',
      over:  '\uac00\ub77c\uc549\uc558\ub2e4',
      again: '\ud0ed\ud574\uc11c \ub2e4\uc2dc \ud558\uae30',
      best:  '\ucd5c\uace0 \u00a5',
      paid:  '1\uc5d4\uc744 \ub418\ucc3e\uc558\ub2e4'
    },
    zhHans: {
      sub:   '\u7eaf\u94dd\uff0c1 \u514b\u3002<br>\u5e73\u7740\u843d\u4e0b\u5c31\u80fd\u6d6e\u8d77\u6765\u3002',
      tap:   '\u70b9\u51fb\u5f00\u59cb',
      over:  '\u6c89\u4e86',
      again: '\u70b9\u51fb\u518d\u73a9\u4e00\u6b21',
      best:  '\u6700\u9ad8 \u00a5',
      paid:  '\u4f60\u628a\u8fd9 1 \u65e5\u5143\u8d5a\u56de\u6765\u4e86'
    },
    zhHant: {
      sub:   '\u7d14\u92c1\uff0c1 \u516c\u514b\u3002<br>\u5e73\u8457\u843d\u4e0b\u5c31\u80fd\u6d6e\u8d77\u4f86\u3002',
      tap:   '\u9ede\u64ca\u958b\u59cb',
      over:  '\u6c89\u4e86',
      again: '\u9ede\u64ca\u518d\u73a9\u4e00\u6b21',
      best:  '\u6700\u9ad8 \u00a5',
      paid:  '\u4f60\u628a\u9019 1 \u65e5\u5713\u8cfa\u56de\u4f86\u4e86'
    }
  }[LANG];

  // ---------------------------------------------------------------- DOM
  var cv  = document.getElementById('game');
  var ctx = cv.getContext('2d');
  var elScore = document.getElementById('score');
  var elLives = document.getElementById('lives');
  var elTitle = document.getElementById('title');
  var elOver  = document.getElementById('over');

  document.getElementById('t-sub').innerHTML = T.sub;
  document.getElementById('t-tap').textContent = T.tap;
  document.getElementById('o-label').textContent = T.over;
  document.getElementById('o-again').textContent = T.again;

  // o <html lang> correto faz o navegador escolher a variante de glifo
  // certa do CJK (o mesmo caractere difere entre ja, zh-Hans e zh-Hant)
  document.documentElement.lang =
    LANG === 'zhHans' ? 'zh-Hans' : (LANG === 'zhHant' ? 'zh-Hant' : LANG);

  elLives.innerHTML = '<i></i><i></i><i></i>';

  // ---------------------------------------------------------------- layout
  var W = 0, H = 0, waterY = 0, R = 24, dropX = 0, dropY = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    waterY = Math.round(H * 0.60);
    R      = Math.max(22, Math.min(W, H) * 0.095);
    dropX  = W / 2;
    dropY  = Math.round(H * 0.17);
  }

  // ---------------------------------------------------------------- estado
  var TITLE = 0, PLAY = 1, OVER = 2;
  var mode = TITLE;

  var theta = 0, spin = SPIN_0;
  var score = 0, lives = LIVES, best = loadBest();
  var falling = null;
  var floaters = [], sinkers = [], ripples = [], drops = [];
  var shake = 0, overAt = 0, waveT = 0;

  function loadBest() {
    try { return parseInt(localStorage.getItem('ichien.best'), 10) || 0; }
    catch (e) { return 0; }
  }
  function saveBest(v) {
    try { localStorage.setItem('ichien.best', String(v)); } catch (e) {}
  }
  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  // ---------------------------------------------------------------- fluxo
  function start() {
    mode    = PLAY;
    score   = 0;
    lives   = LIVES;
    spin    = SPIN_0;
    falling = null;
    floaters.length = 0;
    sinkers.length  = 0;
    ripples.length  = 0;
    drops.length    = 0;
    elTitle.classList.add('hidden');
    elOver.classList.add('hidden');
    paintHud();
  }

  function drop() {
    falling = { x: dropX, y: dropY, vy: 0, theta: theta };
  }

  function land() {
    var open = Math.abs(Math.cos(falling.theta));
    var x = falling.x;

    if (open < FLAT_TOL) {
      ripples.push({ x: x, r: R * 0.4, max: R * 2.6, a: 0.5, d: 0 });
      splash(x, 3, 150);
      score++;
      floaters.push({ x: x + (Math.random() - 0.5) * R * 0.8,
                      phase: Math.random() * TAU, dip: 0 });
      spin = Math.min(SPIN_MAX, SPIN_0 + score * SPIN_UP);
      buzz(12);
    } else {
      ripples.push({ x: x, r: R * 0.4, max: R * 4.4, a: 0.6, d: 0 });
      ripples.push({ x: x, r: R * 0.3, max: R * 2.8, a: 0.45, d: 0.13 });
      splash(x, 9, 340);
      lives--;
      sinkers.push({ x: x, y: waterY, vy: 70, theta: falling.theta, a: 1,
                     seed: Math.random() * TAU });
      shake = 11;
      buzz(70);
      if (lives <= 0) gameOver();
    }

    falling = null;
    paintHud();
  }

  function gameOver() {
    mode   = OVER;
    overAt = performance.now();
    if (score > best) { best = score; saveBest(best); }
    document.getElementById('o-score').textContent = '¥' + score;
    document.getElementById('o-note').textContent  = score >= 1 ? T.paid : '';
    document.getElementById('o-best').textContent  = T.best + best;
    elOver.classList.remove('hidden');
  }

  function paintHud() {
    elScore.textContent = '¥' + score;
    var dots = elLives.children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('off', i >= lives);
    }
  }

  // ---------------------------------------------------------------- update
  function update(dt) {
    waveT += dt;
    theta += (mode === PLAY ? spin : 1.1) * dt;
    if (theta > TAU) theta -= TAU;

    if (shake > 0) shake = Math.max(0, shake - dt * 42);

    if (falling) {
      falling.vy += GRAVITY * dt;
      falling.y  += falling.vy * dt;
      if (falling.y >= waterY) land();
    }

    // moedas na superficie se empurram de leve para nao empilhar no mesmo x
    for (var i = 0; i < floaters.length; i++) {
      // a covinha da tensao superficial afunda ate o fundo em ~0.2 s
      floaters[i].dip += (R * 0.34 - floaters[i].dip) * Math.min(1, dt * 7);
      for (var j = i + 1; j < floaters.length; j++) {
        var d = floaters[j].x - floaters[i].x;
        // 2R e a largura da moeda; um pouco mais que isso deixa um fio
        // de agua entre elas, senao viram um trilho continuo
        var min = R * 2.15;
        if (Math.abs(d) < min) {
          var push = ((min - Math.abs(d)) * (d < 0 ? -1 : 1)) * dt * 3.5;
          floaters[i].x -= push;
          floaters[j].x += push;
        }
      }
      // folga nas bordas para a covinha caber inteira na tela
      floaters[i].x = Math.max(R * 1.4, Math.min(W - R * 1.4, floaters[i].x));
    }

    for (var s = sinkers.length - 1; s >= 0; s--) {
      var k = sinkers[s];
      k.vy += 160 * dt;
      k.y  += k.vy * dt;
      k.x  += Math.sin(k.y * 0.045 + k.seed) * 16 * dt;   // bamboleia descendo
      k.theta += 1.4 * dt;
      k.a -= dt * 0.55;
      if (k.a <= 0 || k.y > H + R) sinkers.splice(s, 1);
    }

    for (var p = ripples.length - 1; p >= 0; p--) {
      var w = ripples[p];
      if (w.d > 0) { w.d -= dt; continue; }               // o segundo anel atrasa
      w.r += (w.max - w.r) * dt * 3.2;
      w.a -= dt * 0.9;
      if (w.a <= 0) ripples.splice(p, 1);
    }

    for (var g = drops.length - 1; g >= 0; g--) {
      var o = drops[g];
      o.vy += 2000 * dt;
      o.x  += o.vx * dt;
      o.y  += o.vy * dt;
      if (o.vy > 0 && o.y >= surfaceY(o.x)) drops.splice(g, 1);
    }
  }

  // gotas saltando do ponto de impacto
  function splash(x, n, forca) {
    for (var i = 0; i < n; i++) {
      drops.push({
        x: x + (Math.random() - 0.5) * R * 0.7,
        y: waterY - 2,
        vx: (Math.random() - 0.5) * forca * 0.8,
        vy: -forca * (0.55 + Math.random() * 0.75),
        r: 1.1 + Math.random() * 2.0
      });
    }
  }

  // ------------------------------------------------------------------ moeda
  // O desenho da moeda vive em coin.js, para poder ser inspecionado e
  // ajustado sozinho (veja tools/coin-sheet.html).
  function drawCoin(x, y, r, th, glow) {
    Coin.draw(ctx, x, y, r, th, { glow: glow, flatTol: FLAT_TOL });
  }

  // ------------------------------------------------------------------ cena
  // A superficie e uma funcao de x, nao uma reta: ondas somadas mais a
  // covinha que cada moeda boiando cava por tensao superficial. Tudo que
  // toca a agua -- o contorno, o preenchimento, as ondas do impacto, as
  // proprias moedas -- le daqui, entao nada fica flutuando fora do lugar.
  function waveAt(x) {
    return Math.sin(x * 0.022 + waveT * 1.5) * 2.0
         + Math.sin(x * 0.051 - waveT * 2.3) * 1.1
         + Math.sin(x * 0.009 + waveT * 0.7) * 1.7;
  }

  function surfaceY(x) {
    // Covinhas que se encostam nao somam: duas moedas lado a lado afundam
    // a agua tanto quanto uma, nao o dobro. Vale a mais funda.
    var cava = 0;
    for (var i = 0; i < floaters.length; i++) {
      var d = (x - floaters[i].x) / (R * 0.85);
      if (d > -3 && d < 3) {
        var c = floaters[i].dip * Math.exp(-d * d);
        if (c > cava) cava = c;
      }
    }
    return waterY + waveAt(x) + cava;
  }

  function surfacePath(fechar) {
    ctx.beginPath();
    ctx.moveTo(-14, surfaceY(-14));
    for (var x = -10; x <= W + 14; x += 4) ctx.lineTo(x, surfaceY(x));
    if (fechar) {
      ctx.lineTo(W + 14, H + 14);
      ctx.lineTo(-14, H + 14);
      ctx.closePath();
    }
  }

  function draw() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    // papel
    var sky = ctx.createLinearGradient(0, 0, 0, waterY);
    sky.addColorStop(0, '#faf5ec');
    sky.addColorStop(1, '#efe6d6');
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, W + 40, waterY + 30);

    // As moedas que afundaram vao ANTES da agua: o preenchimento e
    // translucido, entao ele mesmo as tinge e as apaga com a profundidade.
    for (var s = 0; s < sinkers.length; s++) {
      ctx.globalAlpha = Math.max(0, sinkers[s].a);
      drawCoin(sinkers[s].x, sinkers[s].y, R, sinkers[s].theta, false);
      ctx.globalAlpha = 1;
    }

    // corpo da agua
    var wat = ctx.createLinearGradient(0, waterY - 10, 0, H);
    wat.addColorStop(0,    'rgba(139, 183, 195, .72)');
    wat.addColorStop(0.35, 'rgba(86,  140, 161, .86)');
    wat.addColorStop(1,    'rgba(27,  62,  83, .96)');
    surfacePath(true);
    ctx.fillStyle = wat;
    ctx.fill();

    ctx.save();
    surfacePath(true);
    ctx.clip();

    // feixes de luz escorrendo no fundo
    for (var b = 0; b < 3; b++) {
      var bx = (Math.sin(waveT * (0.19 + b * 0.07) + b * 2.3) * 0.5 + 0.5) * W;
      var bw = W * 0.26;
      var bg = ctx.createLinearGradient(bx - bw, 0, bx + bw, 0);
      bg.addColorStop(0,   'rgba(255, 255, 255, 0)');
      bg.addColorStop(0.5, 'rgba(255, 255, 255, .085)');
      bg.addColorStop(1,   'rgba(255, 255, 255, 0)');
      ctx.fillStyle = bg;
      ctx.fillRect(bx - bw, waterY - 10, bw * 2, H);
    }

    // claridade logo abaixo da superficie
    ctx.save();
    ctx.translate(0, 4);
    surfacePath(false);
    ctx.lineWidth   = 7;
    ctx.strokeStyle = 'rgba(226, 243, 247, .22)';
    ctx.stroke();
    ctx.restore();

    // sombra de contato de cada moeda, no fundo da covinha
    for (var c = 0; c < floaters.length; c++) {
      var cf = floaters[c];
      var cy = surfaceY(cf.x);
      ctx.save();
      ctx.translate(cf.x, cy + R * 0.30);
      ctx.scale(1, 0.38);
      var sg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.3);
      sg.addColorStop(0, 'rgba(14, 42, 60, .38)');
      sg.addColorStop(1, 'rgba(14, 42, 60, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();   // fim do recorte da agua

    // linha da superficie: um halo largo e um fio nitido por cima
    surfacePath(false);
    ctx.lineWidth   = 3.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, .22)';
    ctx.stroke();
    surfacePath(false);
    ctx.lineWidth   = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, .62)';
    ctx.stroke();

    // Realce na curva de cada covinha, so FORA da moeda: a agua desce,
    // some atras dela e volta a subir do outro lado. E esse corte que faz
    // a moeda parecer encaixada na superficie em vez de pousada nela.
    ctx.lineWidth   = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, .8)';
    for (var m = 0; m < floaters.length; m++) {
      var mx = floaters[m].x;
      for (var lado = -1; lado <= 1; lado += 2) {
        ctx.beginPath();
        for (var t2 = 0; t2 <= 1.0001; t2 += 0.07) {
          var sx = mx + lado * (R * 0.95 + t2 * R * 1.45);
          if (t2 === 0) ctx.moveTo(sx, surfaceY(sx)); else ctx.lineTo(sx, surfaceY(sx));
        }
        ctx.stroke();
      }
    }

    // aneis do impacto, acompanhando a ondulacao
    for (var p = 0; p < ripples.length; p++) {
      var w = ripples[p];
      if (w.d > 0) continue;
      ctx.beginPath();
      ctx.ellipse(w.x, surfaceY(w.x), w.r, w.r * 0.24, 0, 0, TAU);
      ctx.lineWidth   = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + Math.max(0, w.a).toFixed(3) + ')';
      ctx.stroke();
    }

    // as moedas que boiam, assentadas no fundo da propria covinha
    for (var f = 0; f < floaters.length; f++) {
      var fl = floaters[f];
      drawCoin(fl.x, surfaceY(fl.x) - R * 0.05 + Math.sin(waveT * 1.7 + fl.phase) * 0.8,
               R, Math.PI / 2, false);
    }

    // respingos
    ctx.fillStyle = 'rgba(232, 244, 248, .85)';
    for (var g = 0; g < drops.length; g++) {
      ctx.beginPath();
      ctx.arc(drops[g].x, drops[g].y, drops[g].r, 0, TAU);
      ctx.fill();
    }

    // a moeda que esta caindo, ou a que gira esperando o toque
    if (falling) {
      drawCoin(falling.x, falling.y, R, falling.theta, false);
    } else if (mode === PLAY) {
      ctx.save();
      ctx.setLineDash([3, 7]);
      ctx.lineWidth   = 1;
      ctx.strokeStyle = 'rgba(46, 42, 36, .14)';
      ctx.beginPath();
      ctx.moveTo(dropX, dropY + R + 14);
      ctx.lineTo(dropX, waterY - 12);
      ctx.stroke();
      ctx.restore();
      drawCoin(dropX, dropY, R, theta, true);
    } else {
      drawCoin(dropX, dropY, R, theta, false);
    }

    ctx.restore();
  }


  // ---------------------------------------------------------------- entrada
  function tap() {
    if (mode === TITLE) start();
    else if (mode === PLAY) { if (!falling) drop(); }
    else if (performance.now() - overAt > 450) start();
  }

  document.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); }
  });
  window.addEventListener('resize', resize);

  // ---------------------------------------------------------------- loop
  var last = 0;
  function frame(now) {
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);  // trava o dt se a aba congelar
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () { last = 0; });

  resize();
  paintHud();
  requestAnimationFrame(frame);
})();
