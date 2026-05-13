/**
 * TRANSMISSÕES ∴ CORREDOR 777
 * transmissoes.js
 *
 * Engine de fetch universal com três modos de injeção:
 *   'inject'    → substitui #monitor-target completo
 *   'collapse'  → expande conteúdo dentro de .nota-conteudo
 *   'modal'     → abre conteúdo em #modal-box
 *   'fullscreen'→ override total da tela com layout próprio
 */

'use strict';

/* ══════════════════════════════════════════════════════════════
   1. ESTADO GLOBAL
══════════════════════════════════════════════════════════════ */
const Estado = {
    ligado:          false,
    secaoAtiva:      null,      // 'diario' | 'notas' | 'serpente'
    historico:       [],        // pilha para o botão Voltar
    notasAbertasMap: new Map(), // id → html cacheado (collapse)
    fetchCache:      new Map(), // url → html cacheado (todos os modos)
};

/* ══════════════════════════════════════════════════════════════
   2. REFERÊNCIAS DOM
══════════════════════════════════════════════════════════════ */
const DOM = {
    screen:       () => document.getElementById('monitor-screen'),
    target:       () => document.getElementById('monitor-target'),
    navBack:      () => document.getElementById('nav-back'),
    navBtns:      () => document.querySelectorAll('.nav-btn[data-section]'),
    btnPower:     () => document.getElementById('btn-power'),
    ledPower:     () => document.querySelector('.led-power'),
    ledHdd:       () => document.querySelector('.led-hdd'),
    modalOverlay: () => document.getElementById('modal-overlay'),
    modalContent: () => document.getElementById('modal-content'),
    modalClose:   () => document.getElementById('modal-close'),
    cursor:       () => document.getElementById('cursor'),
};

/* ══════════════════════════════════════════════════════════════
   3. CURSOR CUSTOMIZADO
══════════════════════════════════════════════════════════════ */
function initCursor() {
    const el = document.createElement('div');
    el.id = 'cursor';
    document.body.appendChild(el);
 
    document.addEventListener('mousemove', e => {
        el.style.left = e.clientX + 'px';
        el.style.top  = e.clientY + 'px';
    });
}

/* ══════════════════════════════════════════════════════════════
   4. FETCH UNIVERSAL
   Único ponto de entrada para qualquer carregamento de fragmento.
   Parâmetros:
     url       — caminho do fragmento HTML
     modo      — 'inject' | 'collapse' | 'modal' | 'fullscreen'
     alvo      — elemento DOM destino (para collapse)
     callback  — função chamada após injeção (opcional)
══════════════════════════════════════════════════════════════ */
async function fetchFragmento(url, modo = 'inject', alvo = null, callback = null) {
    piscarHDD(true);

    let html;
    if (Estado.fetchCache.has(url)) {
        html = Estado.fetchCache.get(url);
    } else {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            html = await res.text();
            Estado.fetchCache.set(url, html);
        } catch (err) {
            html = `<p class="err">[ ERRO ] Fragmento não encontrado: <em>${url}</em></p>`;
        }
    }

    piscarHDD(false);

    switch (modo) {
        case 'inject':
            await injetarTarget(html);
            break;
        case 'collapse':
            await injetarCollapse(html, alvo);
            break;
        case 'modal':
            await injetarModal(html);
            break;
        case 'fullscreen':
            await injetarFullscreen(html);
            break;
        default:
            console.warn('[Transmissões] modo desconhecido:', modo);
    }

    if (typeof callback === 'function') callback(html);
}

/* ── 4a. Inject — substitui #monitor-target ──────────────── */
async function injetarTarget(html) {
    const target = DOM.target();

    // Fade out
    target.classList.add('fade-out');
    await esperar(150);

    target.innerHTML = html;
    vincularEventos(target); // re-bind de eventos nos novos elementos

    target.classList.remove('fade-out');
    target.classList.add('fade-in');
    await esperar(250);
    target.classList.remove('fade-in');
}

/* ── 4b. Collapse — expande conteúdo em-linha ────────────── */
async function injetarCollapse(html, alvo) {
    if (!alvo) return;

    const jaAberto = alvo.classList.contains('aberta');

    if (jaAberto) {
        alvo.classList.remove('aberta');
        return;
    }

    if (!alvo.innerHTML.trim()) {
        alvo.innerHTML = html;
        vincularEventos(alvo);
    }

    alvo.classList.add('aberta');
}

/* ── 4c. Modal — abre popup de definição ─────────────────── */
async function injetarModal(html) {
    const overlay = DOM.modalOverlay();
    const content = DOM.modalContent();

    content.innerHTML = html;
    vincularEventos(content);

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('modal-hidden');
}

/* ── 4d. Fullscreen — override total do monitor ──────────── */
async function injetarFullscreen(html) {
    const target = DOM.target();

    // Salva estado anterior na pilha de histórico
    Estado.historico.push({
        html:   target.innerHTML,
        secao:  Estado.secaoAtiva,
    });
    atualizarBotaoVoltar();

    target.classList.add('fade-out');
    await esperar(150);

    // Envolve em container fullscreen
    target.innerHTML = `<div id="analise-full">${html}</div>`;
    vincularEventos(target);

    target.classList.remove('fade-out');
    target.classList.add('fade-in');
    await esperar(250);
    target.classList.remove('fade-in');

    // Injeta botão de voltar dentro do layout fullscreen
    const full = document.getElementById('analise-full');
    if (full) {
        const btnVoltar = document.createElement('button');
        btnVoltar.id = 'analise-voltar';
        btnVoltar.textContent = '← voltar às notas';
        btnVoltar.addEventListener('click', voltarHistorico);

        const header = full.querySelector('#analise-full-header');
        if (header) {
            header.prepend(btnVoltar);
        } else {
            full.prepend(btnVoltar);
        }
    }
}

/* ══════════════════════════════════════════════════════════════
   5. NAVEGAÇÃO E HISTÓRICO
══════════════════════════════════════════════════════════════ */

/* Carrega uma seção completa */
async function carregarSecao(secao) {
    if (!Estado.ligado) return;

    // Limpa histórico ao trocar de seção
    Estado.historico = [];
    Estado.secaoAtiva = secao;
    atualizarBotaoVoltar();
    destacarNavBtn(secao);

    const baseUrl = './'; // relativo ao main.html

    switch (secao) {
        case 'diario':
            await fetchFragmento(`${baseUrl}diario/index.html`, 'inject');
            break;
        case 'notas':
            await fetchFragmento(`${baseUrl}notas/index.html`, 'inject');
            break;
        case 'serpente':
            // Redireciona para o caminho da serpente (fora do monitor-target)
            window.location.href = '../../serpente/s10.html';
            break;
    }
}

/* Volta um passo no histórico */
async function voltarHistorico() {
    if (Estado.historico.length === 0) return;

    const anterior = Estado.historico.pop();
    atualizarBotaoVoltar();

    const target = DOM.target();
    target.classList.add('fade-out');
    await esperar(150);

    target.innerHTML = anterior.html;
    Estado.secaoAtiva = anterior.secao;
    destacarNavBtn(anterior.secao);
    vincularEventos(target);

    target.classList.remove('fade-out');
    target.classList.add('fade-in');
    await esperar(250);
    target.classList.remove('fade-in');
}

function atualizarBotaoVoltar() {
    const btn = DOM.navBack();
    btn.disabled = Estado.historico.length === 0;
}

function destacarNavBtn(secao) {
    DOM.navBtns().forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === secao);
    });
}

/* ══════════════════════════════════════════════════════════════
   6. VINCULAÇÃO DE EVENTOS (recursiva, chamada após injeção)
   Identifica e conecta todos os elementos interativos
   dentro do nó injetado.
══════════════════════════════════════════════════════════════ */
function vincularEventos(raiz) {
    /* Bolinhas do diário */
    raiz.querySelectorAll('.diario-bolinha').forEach(bolinha => {
        bolinha.addEventListener('click', () => {
            const url = bolinha.dataset.url;
            const entrada = raiz.querySelector('#diario-entrada') || document.getElementById('diario-entrada');

            raiz.querySelectorAll('.diario-bolinha').forEach(b => b.classList.remove('ativa'));
            bolinha.classList.add('ativa');

            if (entrada) {
                entrada.classList.add('carregando');
                fetchFragmento(url, 'collapse', entrada, () => {
                    entrada.classList.remove('carregando');
                });
            }
        });
    });

    /* Títulos de notas (collapse) */
    raiz.querySelectorAll('.nota-titulo').forEach(titulo => {
        titulo.addEventListener('click', () => {
            const url      = titulo.dataset.url;
            const notaItem = titulo.closest('.nota-item');
            const conteudo = notaItem ? notaItem.querySelector('.nota-conteudo') : null;

            if (!conteudo) return;

            titulo.classList.toggle('aberta');
            fetchFragmento(url, 'collapse', conteudo);
        });
    });

    /* Termos de definições (modal) */
    raiz.querySelectorAll('.def-termo').forEach(termo => {
        termo.addEventListener('click', () => {
            const url = termo.dataset.url;
            fetchFragmento(url, 'modal');
        });
    });

    /* Links de análises (fullscreen) */
    raiz.querySelectorAll('.analise-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const url = link.dataset.url || link.href;
            if (url) fetchFragmento(url, 'fullscreen');
        });
    });

    /* Botão voltar dentro de fullscreen (se existir no fragmento) */
    const btnVoltarInline = raiz.querySelector('[data-acao="voltar"]');
    if (btnVoltarInline) {
        btnVoltarInline.addEventListener('click', voltarHistorico);
    }
}

/* ══════════════════════════════════════════════════════════════
   7. SEQUÊNCIA DE BOOT
══════════════════════════════════════════════════════════════ */
const BOOT_MESSAGES = [
  // --- SEGMENTO 1: POST DA BIOS (Hardware) ---
  { texto: 'BIOS ROM PCI/ISA (v2A59CF08)',              classe: 'dim',   delay: 0 },
  { texto: 'Direitos Reservados (C) 1997-2026, Abzu & Co.', classe: 'dim',   delay: 80 },
  { texto: 'Instalação: Unidade de Transmissão Corredor 777', classe: 'dim', delay: 160 },
  { texto: '',                                          classe: '',      delay: 200 },
  { texto: 'CPU: PROCESSADOR TIAMAT-CORE @ 777MHz',     classe: '',      delay: 350 },
  { texto: 'Teste de Memória: 299792K OK',              classe: '',      delay: 600 },
  { texto: 'BUS: Verificando integridade dos pilares...', classe: 'dim', delay: 750 },
  { texto: '',                                          classe: '',      delay: 800 },
  
  // --- SEGMENTO 2: DETECÇÃO DE UNIDADES (BIOS) ---
  { texto: 'Detectando Disco Rígido Principal... [CORREDOR_777.DAT]', classe: 'dim', delay: 950 },
  { texto: 'Detectando Unidade Secundária... Nenhuma',  classe: 'dim',   delay: 1050 },
  { texto: 'Monitor: Fósforo P31 (Verde Esmeralda) ... [OK]', classe: 'ok', delay: 1150 },
  { texto: '',                                          classe: '',      delay: 1250 },

  // --- SEGMENTO 3: CARREGAMENTO DO NÚCLEO (SISTEMA) ---
  { texto: 'Iniciando Núcleo CORREDOR v7.7.7...',       classe: 'ok',    delay: 1400 },
  { texto: 'Sinal Liminar: Detectado e Sincronizado.',     classe: 'ok',    delay: 1550 },
  { texto: '',                                          classe: '',      delay: 1650 },
  
  // --- SEGMENTO 4: CONFIG.SYS (Controladores de Sistema) ---
  { texto: 'MEM_ALTA: Testando memória estendida... pronto.', classe: 'dim', delay: 1800 },
  { texto: 'DEVICE=C:\\DOS\\TRANSMISSOES.SYS', classe: '',      delay: 1950 },
  { texto: 'DEVICE=C:\\DOS\\FRAGMENTOS.SYS',    classe: '',      delay: 2100 },
  { texto: 'SND: Driver de Ressonância Estática ... [OK]', classe: 'ok',  delay: 2250 },
  
  // --- SEGMENTO 5: AUTOEXEC.BAT (Rotina de Partida) ---
  { texto: 'C:\\>DEFINIR CAMINHO=C:\\SISTEMA;C:\\FRAGMENTOS\\SERPENTE', classe: 'dim', delay: 2400 },
  { texto: 'C:\\>CARREGAR_ALTO /SISTEMA/FILTRO_TIAMAT', classe: '',      delay: 2600 },
  { texto: 'C:\\>FIAT_LUX.EXE --acesso_total',          classe: 'ok',    delay: 2800 },
  
  // --- SEGMENTO 6: O TERMINAL FINAL ---
  { texto: '',                                          classe: '',      delay: 2950 },
  { texto: 'C:\\> [ PRONTO ] _',                        classe: 'blink', delay: 3100 },
];

async function sequenciaBoot() {
    const screen    = DOM.screen();
    const bootLines = document.getElementById('boot-lines');

    // Inicia animação de power-on
    screen.classList.remove('screen-off');
    screen.classList.add('screen-boot');

    await esperar(400); // espera o flash inicial

    // Exibe mensagens de boot
    for (const msg of BOOT_MESSAGES) {
        await esperar(msg.delay === 0 ? 0 : msg.delay - (BOOT_MESSAGES[BOOT_MESSAGES.indexOf(msg) - 1]?.delay ?? 0));
        const linha = document.createElement('div');
        linha.className = `boot-line ${msg.classe}`;
        linha.textContent = msg.texto || '\u00A0'; // nbsp para linhas vazias
        linha.style.animationDelay = '0s';
        bootLines.appendChild(linha);
        bootLines.scrollTop = bootLines.scrollHeight;
    }

    await esperar(600);

    // Transição para tela operacional
    await injetarTarget(`
        <div class="section-header">
            <div class="section-title">
                Transmissões <span>∴</span> Corredor 777
            </div>
        </div>
        <p style="color:var(--tela-dim); font-size:12px; line-height:1.8;">
            Selecione uma seção abaixo para iniciar a transmissão.<br>
            <span style="color:var(--tela-dim); opacity:0.5;">▸ diário &nbsp; ▸ notas &nbsp; ▸ o caminho da serpente</span>
        </p>
    `);

    screen.classList.remove('screen-boot');
    screen.classList.add('screen-on');
    Estado.ligado = true;
    DOM.ledPower().classList.add('active');
}

/* ══════════════════════════════════════════════════════════════
   8. CONTROLE DE ENERGIA
══════════════════════════════════════════════════════════════ */
function togglePower() {
    if (!Estado.ligado) {
        sequenciaBoot();
    } else {
        desligarMonitor();
    }
}

async function desligarMonitor() {
    const screen = DOM.screen();
    const target = DOM.target();

    // Flash breve antes de apagar
    screen.style.filter = 'brightness(3) saturate(0)';
    await esperar(80);
    screen.style.filter = '';
    screen.classList.remove('screen-on', 'screen-boot');
    screen.classList.add('screen-off');

    await esperar(800);
    target.innerHTML = `
        <div id="boot-screen">
            <div id="boot-lines"></div>
            <div id="boot-prompt">
                <span class="prompt-path">C:\\CORREDOR\\TRANSMISSOES&gt;</span>
                <span class="prompt-cursor">█</span>
            </div>
        </div>
    `;

    Estado.ligado     = false;
    Estado.secaoAtiva = null;
    Estado.historico  = [];
    DOM.ledPower().classList.remove('active');
    DOM.navBtns().forEach(b => b.classList.remove('active'));
    atualizarBotaoVoltar();
}

/* ══════════════════════════════════════════════════════════════
   9. HDD LED — pisca durante fetch
══════════════════════════════════════════════════════════════ */
function piscarHDD(ativo) {
    DOM.ledHdd().classList.toggle('blink', ativo);
}

/* ══════════════════════════════════════════════════════════════
   10. MODAL
══════════════════════════════════════════════════════════════ */
function fecharModal() {
    const overlay = DOM.modalOverlay();
    overlay.classList.add('modal-hidden');
    overlay.setAttribute('aria-hidden', 'true');
}

/* ══════════════════════════════════════════════════════════════
   11. UTILITÁRIOS
══════════════════════════════════════════════════════════════ */
function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ══════════════════════════════════════════════════════════════
   12. INICIALIZAÇÃO
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    initCursor();

    /* Botão power */
    DOM.btnPower().addEventListener('click', togglePower);

    /* Nav de seções */
    DOM.navBtns().forEach(btn => {
        btn.addEventListener('click', () => carregarSecao(btn.dataset.section));
    });

    /* Botão voltar */
    DOM.navBack().addEventListener('click', voltarHistorico);

    /* Modal: fechar */
    DOM.modalClose().addEventListener('click', fecharModal);
    DOM.modalOverlay().addEventListener('click', e => {
        if (e.target === DOM.modalOverlay()) fecharModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') fecharModal();
    });

    /* Liga automaticamente ao hover no monitor (conforme memorial) */
    const screen = DOM.screen();
    screen.addEventListener('mouseenter', () => {
        if (!Estado.ligado) sequenciaBoot();
    });

    /* Console log do desenvolvedor */
    console.log('%cCORREDOR 777 — Transmissões', 'color:#c8c8b0; background:#0d0d0d; padding:4px 8px; font-family:monospace; font-size:12px;');
    console.log('%cEngine de injeção: inject | collapse | modal | fullscreen', 'color:#5a5a45; font-family:monospace; font-size:11px;');
    console.log('%cSe você está aqui, já sabe o que está fazendo.', 'color:#ff0037; font-family:monospace; font-size:11px;');
});