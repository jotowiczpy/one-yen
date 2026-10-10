/* Service worker do 1円.
 *
 * E o que permite instalar o jogo na tela de inicio e jogar sem internet.
 *
 * Estrategia: REDE PRIMEIRO, cache como rede de seguranca. O contrario
 * (cache primeiro) e o padrao em jogos grandes, onde evita baixar dezenas de
 * megabytes a cada abertura -- aqui o jogo inteiro tem ~11 KB, entao a
 * economia seria irrisoria e o preco seria servir uma versao velha depois de
 * cada publicacao. Offline continua funcionando porque toda resposta boa vai
 * para o cache.
 *
 * Ao publicar uma versao nova, suba o numero de CACHE: o activate apaga os
 * caches antigos.
 */
var CACHE = 'ichien-v2';

var ESSENCIAIS = [
  './',
  './index.html',
  './css/style.css',
  './js/coin.js',
  './js/game.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ESSENCIAIS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (nomes) {
        return Promise.all(nomes.map(function (n) {
          return n === CACHE ? null : caches.delete(n);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(function (resp) {
        if (resp && resp.ok) {
          var copia = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return resp;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          // navegacao sem rede e sem a URL exata no cache cai na raiz
          return hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
        });
      })
  );
});
