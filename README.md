# 1円 — protótipo

Jogo de uma tela em HTML/CSS/JS puro, sem dependência nenhuma, pronto para ser
empacotado com Capacitor.

**A mecânica:** a moeda de 1 iene é de alumínio puro e boia na água por tensão
superficial — mas só se encostar deitada. Em pé, corta a superfície e afunda.
A moeda gira no ar; você toca para soltar. Círculo cheio = em pé (afunda),
risco fino = deitada (flutua). Três afundadas e acabou. O placar é em ienes,
então a piada é que o jogo existe para você recuperar o 1 iene que pagou nele.

## Rodar agora, sem instalar nada

Abra `www/index.html` direto no navegador (duplo clique funciona — o script é
clássico, não é módulo, então não esbarra em CORS de `file://`).

Para testar em tamanho de celular, abra o DevTools (F12) e ligue o modo
dispositivo. Teclado: espaço ou enter fazem o mesmo que o toque.

## Estrutura

```
jogo-1-iene/
├── capacitor.config.json    appId, nome e webDir
├── package.json
├── tools/
│   ├── coin-sheet.html      folha de inspeção da moeda (fora do app)
│   └── scene-sheet.html     inspeção da cena, com o loop sob controle
└── www/                     <- é isso que vira o app; nada de build
    ├── index.html
    ├── css/style.css
    └── js/
        ├── coin.js          só o desenho da moeda
        └── game.js          física, estado e cena
```

Não há bundler, npm run build nem framework. O Capacitor copia `www/` para
dentro do projeto Android como está. `tools/` fica fora de `www/`, então não
entra no APK.

## A moeda

`www/js/coin.js` desenha a moeda sozinho, seguindo a 一円硬貨 real: 20&nbsp;mm de
diâmetro por 1,5&nbsp;mm de espessura (a proporção está na constante `THICK`, e é
o que dá a faixa lateral visível quando ela tomba), 1,00&nbsp;g, alumínio 100%,
**borda lisa** — sem serrilha, diferente da maioria das moedas, por isso a
lateral é um degradê contínuo sem nenhum entalhe.

As duas faces são desenhadas de verdade e alternam conforme ela gira:

- **Anverso** — o broto (若木): caule curvo, dois ramos em alturas diferentes e
  três folhas lanceoladas, com 日本国 curvado na borda de cima e 一円 na de baixo.
- **Verso** — o "1" grande com o ano da era logo abaixo. O ano é calculado da
  data do sistema (`reiwaKanji`), então em 2026 sai 令和八年 e vira sozinho na
  virada do ano.

Geometricamente a moeda é um cilindro inclinado: duas faces elípticas
deslocadas pela espessura aparente, com a faixa lateral entre elas. É isso que
faz a leitura do jogo funcionar — **disco cheio = em pé = afunda; risco fino =
deitada = boia**.

Para mexer no desenho sem ter que acertar o timing no jogo, abra
`tools/coin-sheet.html`: ela renderiza o giro completo em tamanho grande e no
tamanho real do jogo, as duas faces de frente em fundo claro e escuro, e uma
moeda ao vivo com controles de raio, velocidade e halo. Ela importa
`../www/js/coin.js`, então precisa ser servida da raiz do projeto:

```bash
python -m http.server 5175
```

Aí `localhost:5175/tools/coin-sheet.html` é a folha e
`localhost:5175/www/` é o jogo.

## A água

A superfície **não é uma reta**: `surfaceY(x)` soma três senoides e, por cima
delas, a covinha que cada moeda boiando cava por tensão superficial. Tudo que
toca a água lê daí — o contorno, o preenchimento, os anéis do impacto e a
posição das próprias moedas — então nada fica flutuando fora do lugar quando a
onda passa.

Dois detalhes que custaram uma correção cada:

- **Covinhas vizinhas não somam.** Na primeira versão elas se acumulavam, e
  seis moedas juntas cavavam um buraco de seis vezes a profundidade — uma
  cratera no meio da tela. Agora vale a mais funda (`max`, não soma): duas
  moedas lado a lado afundam a água tanto quanto uma.
- **A covinha precisa de curvatura para ser vista.** Com 9 px de profundidade
  espalhados por 80 px ela existia (dá para medir) mas não se enxergava.
  Estreitar e aprofundar resolveu, somado ao realce: um fio branco que desce
  pela curva, **some atrás da moeda e reaparece do outro lado**. É esse corte
  que faz a moeda parecer encaixada na superfície em vez de pousada nela.

O resto da cena: feixes de luz escorrendo no fundo, claridade logo abaixo da
linha, sombra de contato sob cada moeda, respingos com gravidade no impacto e
anéis duplos quando uma afunda. As moedas que afundam são desenhadas **antes**
do preenchimento da água — como ele é translúcido, ele mesmo as tinge e as
apaga conforme descem, de graça.

`tools/scene-sheet.html` carrega o `www/index.html` de verdade (mesmo HTML,
mesmo `game.js`, nada duplicado) com o `requestAnimationFrame` e o relógio sob
controle, e tem botões para encher a água de moedas ou forçar um afundamento.
Serve para parar a cena em estados difíceis de alcançar jogando.

## Idiomas

O jogo escolhe o idioma por `navigator.language`, em `www/js/game.js` (objeto
`T`). São 10: **en, pt, es, fr, de, it, ja, ko, zh-Hans, zh-Hant**. Quem não
bater com nenhum cai no inglês, não no japonês.

O chinês distingue escrita simplificada de tradicional (`zh-TW`, `zh-HK`,
`zh-MO` e `-hant` vão para a tradicional). O jogo também grava o
`document.documentElement.lang` correto: sem isso o navegador renderiza o
chinês com as variantes de glifo japonesas, porque vários caracteres são o
mesmo ponto Unicode com desenho diferente por idioma.

Para acrescentar um idioma, basta mais uma entrada em `T` com as seis chaves
(`sub`, `tap`, `over`, `again`, `best`, `paid`) e incluir o código na lista de
aceitos em `LANG`.

## Publicar no itch.io (web)

O jogo roda no navegador sem nenhuma adaptação — é o mesmo `www/` do APK.
Para gerar o pacote:

```bash
cd C:\dev\jogo-1-iene && powershell -NoProfile -File tools\build-web.ps1
```

Sai em `dist/ichien-web.zip` (~10 KB), com `index.html` na **raiz** do zip,
que é o que o itch.io exige. O script usa `ZipArchive` em vez de
`Compress-Archive` de propósito: o `Compress-Archive` do PowerShell 5.1 grava
os caminhos com barra invertida (`css\style.css`) e alguns descompactadores
não aceitam.

No itch.io, em **Create new project**:

| Campo | Valor |
|---|---|
| Kind of project | **HTML** |
| Upload | `ichien-web.zip`, marcado como **"This file will be played in the browser"** |
| Embed options | Manually set size: **375 × 812** |
| | ✔ Mobile friendly · ✔ Fullscreen button |
| Pricing | $0 or donate, ou preço fixo — o itch aceita valores que a Play Store não |

O placar usa `localStorage`. Dentro do iframe do itch isso pode vir bloqueado
por restrições de cookies de terceiros, então as leituras e escritas estão em
`try/catch` e o jogo funciona sem recorde se falhar.

## Instalar no celular (PWA)

O `www/` tambem e um PWA: com `manifest.json`, `sw.js` e os icones, o
navegador oferece "Adicionar a tela de inicio" e o jogo vira um icone que abre
em tela cheia, sem barra de navegador, e funciona **offline**. Vale para
Android e iPhone, sem loja e sem APK.

Duas condicoes:

1. **HTTPS e uma URL propria.** Service worker nao roda em `file://`, e
   dentro do `<iframe>` do itch.io o navegador nao oferece instalacao para o
   conteudo embutido. Suba o `www/` em GitHub Pages, Netlify ou Cloudflare
   Pages (todos gratuitos, todos com HTTPS) e instale a partir dessa URL.
   O itch continua sendo a vitrine.
2. **Suba o `CACHE` em `sw.js` a cada publicacao.** O `activate` apaga os
   caches antigos; sem trocar o numero, quem ja instalou pode continuar com a
   versao anterior por um tempo.

A estrategia do service worker e **rede primeiro, cache como reserva** -- o
contrario do usual em jogos. Num jogo de 11 KB a economia de cache-primeiro
seria irrisoria, e o preco seria servir versao velha depois de publicar.

Os icones sao gerados de `Coin.draw()` por `tools/icons.html`, entao
acompanham o desenho da moeda: mude `coin.js` e regere. O terceiro icone e
*maskable* (arte dentro do circulo seguro de 80%), porque o Android recorta o
icone na forma do sistema.

Nada disso atrapalha o APK: o registro do service worker e pulado quando
`window.Capacitor` existe, ja que la os arquivos sao locais e um cache extra
so serviria para segurar versao antiga.

## Gerar o APK

> **Importante:** não rode `npm install` na pasta de rede `W:`. Copie o projeto
> para o disco local primeiro (`C:\dev\jogo-1-iene`, por exemplo). Em rede, o
> `node_modules` e o Gradle ficam ordens de grandeza mais lentos.

Pré-requisitos: Node.js 20+, JDK 17 e Android Studio com o SDK instalado.

```bash
npm install
npx cap add android
npx cap sync
npx cap open android
```

O último comando abre o Android Studio. Dali, **Run** instala no emulador ou no
celular plugado. Para gerar o arquivo pela linha de comando:

```bash
cd android && gradlew.bat assembleDebug
```

O APK de teste sai em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Travar na vertical

Depois do `cap add android`, edite `android/app/src/main/AndroidManifest.xml` e
acrescente ao `<activity>` principal:

```xml
android:screenOrientation="portrait"
```

O jogo se adapta a qualquer proporção, mas em paisagem a água ocupa metade da
tela e fica feio.

## Ícone e splash

```bash
npm i -D @capacitor/assets
```

Coloque `assets/icon.png` (1024×1024) e `assets/splash.png` (2732×2732) e rode
`npx capacitor-assets generate --android`. Gera todas as densidades de uma vez.

## Para a Play Store

1. **`appId` é permanente.** Está em `capacitor.config.json` como
   `br.com.cfis.ichien`. Troque **antes** da primeira publicação — depois de
   publicado, mudar o appId significa um app novo, sem os downloads e sem as
   avaliações do anterior.
2. **A loja aceita AAB, não APK.** `cd android && gradlew.bat bundleRelease`
   gera `android/app/build/outputs/bundle/release/app-release.aab`.
3. **Guarde a keystore de assinatura** fora do repositório e com backup. Perder
   a chave é o erro mais caro desse processo. O `.gitignore` já ignora `*.jks`
   e `*.keystore` para não subirem sem querer.
4. **Conta pessoal nova precisa de teste fechado:** 12 testadores inscritos por
   14 dias seguidos antes de liberar produção. Se cair abaixo de 12 em qualquer
   momento, o prazo reinicia. Conta de organização não cai nessa regra.
5. **Preço:** o mínimo do Google Play no Japão é ¥7 — não dá para cobrar ¥1
   literalmente. Confirme a faixa atual na tela de preços do Play Console.
6. **Política de conteúdo:** jogo de uma tela é exatamente o perfil que o filtro
   de "minimum functionality" pega. Placar persistente, progressão de
   dificuldade e tela de fim (tudo já implementado) ajudam, mas não são
   garantia.

## Onde mexer

Tudo que define a dificuldade está no topo de `www/js/game.js`:

| Constante | Valor | O que faz |
|---|---|---|
| `FLAT_TOL` | `0.28` | Tolerância do "deitada". Maior = mais fácil |
| `LIVES` | `3` | Afundadas até o fim |
| `GRAVITY` | `2200` | px/s² da queda |
| `SPIN_0` | `1.8` | rad/s da rotação inicial |
| `SPIN_UP` | `0.14` | Quanto acelera por moeda flutuada |
| `SPIN_MAX` | `5.0` | Teto da rotação |

Com `FLAT_TOL = 0.28`, a janela de acerto é ~18% da volta — num toque cego
acerta-se ~14% das vezes, e o resto é leitura do ritmo. Os textos (japonês e
português, escolhidos por `navigator.language`) estão no objeto `T`, logo
abaixo das constantes.
