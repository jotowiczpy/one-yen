/* Desenho da moeda de 1 iene (一円硬貨), isolado do jogo.
 *
 * Referencia da moeda real:
 *   20,0 mm de diametro, 1,5 mm de espessura, 1,00 g, aluminio 100%.
 *   Borda LISA -- nao tem serrilha, diferente da maioria das moedas; por isso
 *   a faixa lateral aqui e um degrade continuo, sem nenhum entalhe.
 *   Anverso: o broto (若木), com 日本国 curvado em cima e 一円 curvado embaixo.
 *   Verso:   o "1" grande, com o ano da era logo abaixo.
 *
 * Expoe window.Coin.draw(ctx, x, y, r, theta, opts).
 * theta e a rotacao em torno do eixo horizontal: |cos| = 1 a moeda esta de
 * frente (em pe, de perfil para a agua), |cos| = 0 ela esta deitada.
 */
window.Coin = (function () {
  'use strict';

  var TAU   = Math.PI * 2;
  var THICK = 1.5 / 20;          // espessura / diametro, a proporcao real
  var INK   = '#79838a';
  var JP    = '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif';

  var ctx = null;                // definido a cada draw()

  // O ano vem gravado na era corrente: 2026 -> 令和八年.
  function reiwaKanji(year) {
    var n = (year || new Date().getFullYear()) - 2018;   // Reiwa 1 = 2019
    if (n < 1) return '';
    var d = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    var s;
    if (n === 1)     s = '元';                           // o 1o ano se escreve 元年
    else if (n < 10) s = d[n];
    else if (n < 20) s = '十' + (n % 10 ? d[n % 10] : '');
    else             s = d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : '');
    return '令和' + s + '年';
  }

  var ANO = reiwaKanji();

  function leaf(x, y, len, wid, ang) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wid, -len * 0.55, 0, -len);
    ctx.quadraticCurveTo(-wid, -len * 0.55, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  // legenda curvada acompanhando a borda, como no original
  function arcText(txt, r, size, up) {
    ctx.font = '500 ' + size.toFixed(1) + 'px ' + JP;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var step = 0.36;
    var a0 = -step * (txt.length - 1) / 2;
    for (var i = 0; i < txt.length; i++) {
      ctx.save();
      ctx.rotate((up ? 1 : -1) * (a0 + i * step));
      ctx.translate(0, up ? -r * 0.77 : r * 0.77);
      ctx.fillText(txt.charAt(i), 0, 0);
      ctx.restore();
    }
  }

  function faceBroto(r) {                     // anverso: o broto
    ctx.fillStyle   = INK;
    ctx.strokeStyle = INK;
    ctx.lineCap     = 'round';

    // caule: sobe da base ate o pe da folha central, com uma curva leve
    ctx.lineWidth = r * 0.062;
    ctx.beginPath();
    ctx.moveTo(-r * 0.02, r * 0.50);
    ctx.quadraticCurveTo(r * 0.05, r * 0.16, 0, -r * 0.14);
    ctx.stroke();

    // dois ramos saindo em alturas diferentes, como no original
    ctx.lineWidth = r * 0.045;
    ctx.beginPath();
    ctx.moveTo(r * 0.015, r * 0.21);
    ctx.quadraticCurveTo(-r * 0.17, r * 0.11, -r * 0.27, -r * 0.07);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.015, r * 0.06);
    ctx.quadraticCurveTo(r * 0.20, -r * 0.02, r * 0.29, -r * 0.17);
    ctx.stroke();

    // tres folhas lanceoladas, presas na ponta de cada ramo e no alto do caule
    leaf(-r * 0.27, -r * 0.07, r * 0.33, r * 0.135, -0.62);
    leaf(r * 0.29, -r * 0.17, r * 0.33, r * 0.135, 0.62);
    leaf(0, -r * 0.14, r * 0.40, r * 0.145, 0.03);

    ctx.globalAlpha *= 0.65;                  // as legendas sao gravacao fina
    arcText('日本国', r, r * 0.185, true);
    arcText('一円', r, r * 0.185, false);
  }

  function faceUm(r) {                        // verso: o "1" e o ano
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 ' + (r * 0.95).toFixed(1) + 'px Georgia, "Times New Roman", serif';
    ctx.fillText('1', 0, -r * 0.09);
    if (ANO) {
      ctx.globalAlpha *= 0.6;
      ctx.font = '500 ' + (r * 0.165).toFixed(1) + 'px ' + JP;
      ctx.fillText(ANO, 0, r * 0.66);
    }
  }

  /* A moeda e um cilindro inclinado: duas faces elipticas deslocadas uma da
   * outra pela espessura aparente, com a faixa lateral entre as duas.
   *
   * opts: { glow: bool, flatTol: number, heatFrom: number }
   *   glow     acende um halo conforme a moeda se deita, para dar tempo de
   *            antecipar o toque em vez de so confirmar que ja passou
   *   flatTol  o |cos| a partir do qual ela conta como deitada (o pico do halo)
   */
  function draw(c2d, x, y, r, theta, opts) {
    ctx = c2d;
    opts = opts || {};
    var tol  = opts.flatTol || 0.28;
    var from = opts.heatFrom || 0.55;

    var c    = Math.cos(theta);
    var open = Math.abs(c);                                   // 1 de frente, 0 deitada
    var fry  = Math.max(0.6, r * open);                       // meia altura da face
    var edge = Math.max(1.3, 2 * r * THICK * Math.sqrt(1 - open * open));
    var fy   = -edge / 2;                                     // a face da frente sobe meia espessura

    ctx.save();
    ctx.translate(x, y);

    if (opts.glow && open < from) {
      var heat = Math.min(1, (from - open) / (from - tol));
      ctx.beginPath();
      ctx.ellipse(0, 0, r + 4 + 7 * heat, fry + edge / 2 + 4 + 7 * heat, 0, 0, TAU);
      ctx.fillStyle = 'rgba(184, 134, 11, ' + (0.05 + 0.18 * heat).toFixed(3) + ')';
      ctx.fill();
    }

    // face de tras: so aparece a lasca que escapa por baixo da da frente
    ctx.beginPath();
    ctx.ellipse(0, edge / 2, r, fry, 0, 0, TAU);
    ctx.fillStyle = '#868f96';
    ctx.fill();

    // faixa da espessura, lisa de ponta a ponta
    var eg = ctx.createLinearGradient(0, -edge / 2, 0, edge / 2);
    eg.addColorStop(0, '#c4cace');
    eg.addColorStop(1, '#7b848b');
    ctx.fillStyle = eg;
    ctx.fillRect(-r, -edge / 2, r * 2, edge);
    if (edge > 2.2) {                      // o fio de luz no topo da lateral
      ctx.fillStyle = 'rgba(255, 255, 255, .45)';
      ctx.fillRect(-r, -edge / 2, r * 2, Math.max(0.8, edge * 0.16));
    }

    // face da frente
    var gh = Math.max(1, fry);
    var fg = ctx.createLinearGradient(-r * 0.4, fy - gh, r * 0.4, fy + gh);
    fg.addColorStop(0,    '#fdfdfe');
    fg.addColorStop(0.38, '#e2e7ea');
    fg.addColorStop(0.72, '#c3cace');
    fg.addColorStop(1,    '#9aa3aa');
    ctx.beginPath();
    ctx.ellipse(0, fy, r, fry, 0, 0, TAU);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.lineWidth   = 1;
    ctx.strokeStyle = 'rgba(70, 82, 92, .6)';
    ctx.stroke();

    // o relevo some junto com a face quando ela se fecha
    var ink = (open - 0.12) / 0.30;
    if (ink > 0.02) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, fy, r, fry, 0, 0, TAU);
      ctx.clip();
      ctx.translate(0, fy);
      ctx.scale(1, open);
      ctx.globalAlpha *= Math.min(1, ink);

      // o aro levantado, tambem liso
      ctx.lineWidth   = r * 0.045;
      ctx.strokeStyle = 'rgba(255, 255, 255, .55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.90, r * 0.90, 0, 0, TAU);
      ctx.stroke();
      ctx.lineWidth   = r * 0.018;
      ctx.strokeStyle = 'rgba(90, 102, 112, .35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.86, r * 0.86, 0, 0, TAU);
      ctx.stroke();

      var a = ctx.globalAlpha;
      if (c >= 0) faceUm(r); else faceBroto(r);
      ctx.globalAlpha = a;

      // brilho fosco: o aluminio reflete pouco e espalhado
      var sp = ctx.createLinearGradient(-r, -r, r * 0.3, r * 0.6);
      sp.addColorStop(0,   'rgba(255, 255, 255, .34)');
      sp.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sp;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r, 0, 0, TAU);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  return { draw: draw, ano: ANO, reiwaKanji: reiwaKanji, THICK: THICK };
})();
