// ============================================================
// PLAYER ENGINE
// ============================================================

let ytPlayer;
let indiceFaixa = 0;
let playlistAtual = [];
let playerPronto = false;
// let configPendente = null; // guarda a config até o YouTube estar pronto

window.inicializarPlayer = function(config) {
    const modoShuffle = config.shuffle !== undefined ? config.shuffle : true;
    playlistAtual = modoShuffle ? embaralhar([...config.playlist]) : [...config.playlist];

    // MELHORIA: Só renderiza quando o DOM estiver 100% pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderizarLista);
    } else {
        renderizarLista();
    }
    
    // Adiciona classe de carregando no botão inicial
    const btnPlay = document.getElementById('player-btn-play');
    if (btnPlay) btnPlay.classList.add('loading');

    // Injeta o script do YouTube
    if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    } else if (window.YT && window.YT.Player) {
        criarPlayer();
    }
};

// YouTube chama esta função quando está 100% pronto
window.onYouTubeIframeAPIReady = function() {
    if (playlistAtual.length > 0) {
        criarPlayer();
    }
};

function criarPlayer() {
    const container = document.getElementById('yt-player');
    if (!container) return;

    ytPlayer = new YT.Player('yt-player', {
        height: '1', // Tamanho mínimo para evitar erro 153
        width: '1',
        videoId: playlistAtual[0].id,
        playerVars: {
            autoplay: 0,
            controls: 0,
            enablejsapi: 1,
            origin: window.location.origin,
            widget_referrer: window.location.origin // Ajuda na validação de origem
        },
        events: {
            onReady: function() {
                playerPronto = true;
                // Remove estado de carregando
                const btnPlay = document.getElementById('player-btn-play');
                if (btnPlay) btnPlay.classList.remove('loading');
                
                atualizarInterface(0);
            },
            onStateChange: function(e) {
                const btn = document.getElementById('player-btn-play');
                if (e.data === YT.PlayerState.BUFFERING) {
                    if (btn) btn.classList.add('loading'); // Feedback durante buffer
                } else if (e.data === YT.PlayerState.PLAYING) {
                    if (btn) { 
                        btn.classList.remove('loading');
                        btn.textContent = '⏸'; 
                        btn.dataset.estado = 'tocando'; 
                    }
                } else {
                    if (btn) {
                        btn.classList.remove('loading');
                        btn.textContent = '▶'; 
                        btn.dataset.estado = 'pausado'; 
                    }
                }
                
                if (e.data === YT.PlayerState.ENDED) {
                    window.proximaFaixa();
                }
            },
            onError: function(e) {
                console.warn('Erro na faixa, pulando...', e.data);
                window.proximaFaixa(); // Pulo automático em caso de erro[cite: 4]
            }
        }
    });
}

function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ============================================================
// CONTROLES
// ============================================================

window.togglePlay = function() {
    if (!playerPronto) return;
    const estado = ytPlayer.getPlayerState();
    const btn = document.getElementById('player-btn-play');
    // Estado 1 = PLAYING, qualquer outro = não está tocando
    if (estado === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
        btn.dataset.estado = 'pausado';
        btn.textContent = '▶';
    } else {
        ytPlayer.playVideo();
        btn.dataset.estado = 'tocando';
        btn.textContent = '⏸';
    }
};

window.proximaFaixa = function() {
    if (!playerPronto) return;
    indiceFaixa = (indiceFaixa + 1) % playlistAtual.length;
    tocarFaixa(indiceFaixa);
};

window.faixaAnterior = function() {
    if (!playerPronto) return;
    indiceFaixa = (indiceFaixa - 1 + playlistAtual.length) % playlistAtual.length;
    tocarFaixa(indiceFaixa);
};

window.toggleLista = function() {
    const lista = document.getElementById('player-lista');
    if (lista) lista.classList.toggle('active');
};

window.tocarFaixa = function(indice) {
    if (!playerPronto) return;
    indiceFaixa = indice;
    ytPlayer.loadVideoById(playlistAtual[indice].id);
    ytPlayer.playVideo();
    const btn = document.getElementById('player-btn-play');
    if (btn) {
        btn.dataset.estado = 'tocando';
        btn.textContent = '⏸';
    }
    atualizarInterface(indice);
};



// ============================================================
// INTERFACE
// ============================================================

function atualizarInterface(indice) {
    const f = playlistAtual[indice];
    const texto = `${f.titulo} — ${f.artista} (${f.ano})`;
    const ticker = document.getElementById('player-ticker-content');
    if (ticker) {
        // const separador = '&nbsp;&nbsp;&nbsp;∴&nbsp;&nbsp;&nbsp;';
        const separador = '&nbsp;&nbsp;&nbsp;&nbsp;<img src="/assets/images/favicon/disc.gif">&nbsp;&nbsp;&nbsp;&nbsp;';
        ticker.innerHTML = `<span>${texto}${separador}</span><span>${texto}${separador}</span>`;
    }
    document.querySelectorAll('.lista-item').forEach((item, i) => {
        item.classList.toggle('active', i === indice);
    });
}

function renderizarLista() {
    const container = document.getElementById('player-lista');
    if (!container) return;
    container.innerHTML = '';
    playlistAtual.forEach((f, i) => {
        const item = document.createElement('div');
        item.className = 'lista-item';
        item.textContent = f.titulo;
        item.onclick = function() {
            window.tocarFaixa(i);
            window.toggleLista();
        };
        container.appendChild(item);
    });
}

// Fecha o popup da playlist ao clicar fora
document.addEventListener('click', function(e) {
    const lista = document.getElementById('player-lista');
    const btnLista = e.target.closest('[onclick="toggleLista()"]');

    if (!lista) return;

    if (!lista.contains(e.target) && !btnLista) {
        lista.classList.remove('active');
    }
});