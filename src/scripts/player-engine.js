// player-engine.js — motor do player de música (YouTube IFrame API, áudio
// invisível, UI customizada). Transplante do nucleo/js/player-engine.js vanilla:
// o MOTOR é preservado (não se reescreve). O que muda é o ciclo de vida — a
// entrada `window.inicializarPlayer` virou `export iniciarPlayer(config)` com
// checagem de página, guarda por nó e teardown do player órfão, para conviver
// com as View Transitions. Os controles seguem em window.* (a casca os chama por
// onclick, como no vanilla) e o onYouTubeIframeAPIReady/click-fora ficam globais.
//
// SEM persistência entre páginas por ora (decisão [040]): ao reentrar na Recepção
// por VT, o player reinicia (novo #yt-player). Persistência (transition:persist)
// e a UI nova são a F3.

let ytPlayer;
let indiceFaixa = 0;
let playlistAtual = [];
let playerPronto = false;

/** Ponto de entrada, religado a cada astro:page-load pela Recepção. */
export function iniciarPlayer(config) {
  const raiz = document.getElementById("corredor-player");
  if (!raiz) return; // checagem de página
  if (raiz.dataset.playerLigado) return; // idempotência por nó
  raiz.dataset.playerLigado = "1";

  // teardown de um player órfão de uma Recepção anterior (VT descartou o iframe)
  if (ytPlayer && ytPlayer.destroy) {
    try {
      ytPlayer.destroy();
    } catch {}
    ytPlayer = null;
    playerPronto = false;
  }

  const modoShuffle = config.shuffle !== undefined ? config.shuffle : true;
  playlistAtual = modoShuffle
    ? embaralhar([...config.playlist])
    : [...config.playlist];
  indiceFaixa = 0;

  renderizarLista();

  const btnPlay = document.getElementById("player-btn-play");
  if (btnPlay) btnPlay.classList.add("loading");

  // Injeta o script do YouTube (uma vez); se já carregado, cria o player direto
  if (!document.getElementById("yt-api-script")) {
    const tag = document.createElement("script");
    tag.id = "yt-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  } else if (window.YT && window.YT.Player) {
    criarPlayer();
  }
}

// YouTube chama esta função quando está 100% pronto (global, uma vez)
window.onYouTubeIframeAPIReady = function () {
  if (playlistAtual.length > 0) {
    criarPlayer();
  }
};

function criarPlayer() {
  const container = document.getElementById("yt-player");
  if (!container) return;

  ytPlayer = new YT.Player("yt-player", {
    height: "1", // tamanho mínimo para evitar erro 153
    width: "1",
    videoId: playlistAtual[0].id,
    playerVars: {
      autoplay: 0,
      controls: 0,
      enablejsapi: 1,
      origin: window.location.origin,
      widget_referrer: window.location.origin,
    },
    events: {
      onReady: function () {
        playerPronto = true;
        const btnPlay = document.getElementById("player-btn-play");
        if (btnPlay) btnPlay.classList.remove("loading");
        atualizarInterface(0);
      },
      onStateChange: function (e) {
        const btn = document.getElementById("player-btn-play");
        if (e.data === YT.PlayerState.BUFFERING) {
          if (btn) btn.classList.add("loading");
        } else if (e.data === YT.PlayerState.PLAYING) {
          if (btn) {
            btn.classList.remove("loading");
            btn.textContent = "⏸";
            btn.dataset.estado = "tocando";
          }
        } else {
          if (btn) {
            btn.classList.remove("loading");
            btn.textContent = "▶";
            btn.dataset.estado = "pausado";
          }
        }

        if (e.data === YT.PlayerState.ENDED) {
          window.proximaFaixa();
        }
      },
      onError: function (e) {
        // erro 150 = embed bloqueado pelo dono → pula a faixa
        console.warn("Erro na faixa, pulando...", e.data);
        window.proximaFaixa();
      },
    },
  });
}

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── controles (window.* — chamados por onclick na casca, como no vanilla) ────
window.togglePlay = function () {
  if (!playerPronto) return;
  const estado = ytPlayer.getPlayerState();
  const btn = document.getElementById("player-btn-play");
  if (estado === YT.PlayerState.PLAYING) {
    ytPlayer.pauseVideo();
    btn.dataset.estado = "pausado";
    btn.textContent = "▶";
  } else {
    ytPlayer.playVideo();
    btn.dataset.estado = "tocando";
    btn.textContent = "⏸";
  }
};

window.proximaFaixa = function () {
  if (!playerPronto) return;
  indiceFaixa = (indiceFaixa + 1) % playlistAtual.length;
  window.tocarFaixa(indiceFaixa);
};

window.faixaAnterior = function () {
  if (!playerPronto) return;
  indiceFaixa = (indiceFaixa - 1 + playlistAtual.length) % playlistAtual.length;
  window.tocarFaixa(indiceFaixa);
};

window.toggleLista = function () {
  const lista = document.getElementById("player-lista");
  if (lista) lista.classList.toggle("active");
};

window.tocarFaixa = function (indice) {
  if (!playerPronto) return;
  indiceFaixa = indice;
  ytPlayer.loadVideoById(playlistAtual[indice].id);
  ytPlayer.playVideo();
  const btn = document.getElementById("player-btn-play");
  if (btn) {
    btn.dataset.estado = "tocando";
    btn.textContent = "⏸";
  }
  atualizarInterface(indice);
};

// ── interface ────────────────────────────────────────────────────────────────
function atualizarInterface(indice) {
  const f = playlistAtual[indice];
  const texto = `${f.titulo} — ${f.artista} (${f.ano})`;
  const ticker = document.getElementById("player-ticker-content");
  if (ticker) {
    const separador =
      '&nbsp;&nbsp;&nbsp;&nbsp;<img src="/assets/images/favicon/disc.gif">&nbsp;&nbsp;&nbsp;&nbsp;';
    ticker.innerHTML = `<span>${texto}${separador}</span><span>${texto}${separador}</span>`;
  }
  document.querySelectorAll(".lista-item").forEach((item, i) => {
    item.classList.toggle("active", i === indice);
  });
}

function renderizarLista() {
  const container = document.getElementById("player-lista");
  if (!container) return;
  container.innerHTML = "";
  playlistAtual.forEach((f, i) => {
    const item = document.createElement("div");
    item.className = "lista-item";
    item.textContent = f.titulo;
    item.onclick = function () {
      window.tocarFaixa(i);
      window.toggleLista();
    };
    container.appendChild(item);
  });
}

// Fecha o popup da playlist ao clicar fora (global, uma vez — re-consulta os nós)
document.addEventListener("click", function (e) {
  const lista = document.getElementById("player-lista");
  const btnLista = e.target.closest('[onclick="toggleLista()"]');
  if (!lista) return;
  if (!lista.contains(e.target) && !btnLista) {
    lista.classList.remove("active");
  }
});
