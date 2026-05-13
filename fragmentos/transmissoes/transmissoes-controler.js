/**
 * transmissoes-controler.js
 * Engine de navegação e efeitos CRT para a seção Transmissões.
 * Adaptado ao layout: #tela-tubo, #monitor-target, #boot-loader.
 *
 * Modos de injeção disponíveis:
 *   navegarPara(secao)              → inject: substitui #monitor-target
 *   abrirCollapse(url, elemento)    → collapse: expande conteúdo inline
 *   abrirModal(url)                 → modal: popup centralizado na tela
 *   abrirFullscreen(url)            → fullscreen: override total + botão voltar
 *   iniciarSequenciaSerpente()      → transição para s10.html
 */

'use strict';


/* ══════════════════════════════════════════════════════════════
   MODOS DE INJEÇÃO
══════════════════════════════════════════════════════════════ */

/* ── inject: substitui #monitor-target inteiro ──────────────── */
async function navegarPara(secao) {
    const target     = document.getElementById(CONFIG.targetId);
    const breadcrumb = document.getElementById(CONFIG.breadcrumbId);
    const status     = document.getElementById(CONFIG.statusId);

    Estado.secaoAtiva = secao;
    Estado.historico  = [];
    atualizarNavAtiva(secao);

    const label = CONFIG.labels[secao] || secao;
    if (breadcrumb) breadcrumb.innerText = `CORREDOR 777 // TRANSMISSÕES // ${label.toUpperCase()}`;
    if (status)     status.innerText = 'STATUS: CARREGANDO';

    await transicaoTarget(target, async () => {
        try {
            const html = await fetchFragmento(`./${secao}/index.html`);
            target.innerHTML = html;
            target.setAttribute('data-secao', secao);
            vincularEventos(target);

            if (secao === 'diario') await montarNavDiario();
            if (secao === 'notas')  await montarNotas();

        } catch (err) {
            console.error('[TRANSMISSÕES] Falha ao carregar seção:', err);
            target.innerHTML = `<p class="foco-vermelho">ERRO 404: SEGMENTO ${secao.toUpperCase()} NÃO ENCONTRADO.</p>`;
        }
    });

    if (status) setTimeout(() => { status.innerText = 'STATUS: EM VIGÍLIA'; }, 800);
}

async function montarNotas() {
    await montarListaNotas();
    await montarDefinicoes();
    await montarAnalises();
}

async function montarListaNotas() {
    const lista = document.getElementById('notas-lista');
    if (!lista) return;
    try {
        const res  = await fetch('./notas/arquivos/index.json');
        const itens = await res.json();
        // formato: [{ slug: "nota-slug", titulo: "Título da nota" }, ...]

        itens.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'nota-item';

            wrapper.innerHTML = `
                <div class="nota-titulo" data-url="./notas/arquivos/${item.slug}.html">
                    <span>${item.titulo}</span>
                    <span class="nota-indicador">▸</span>
                </div>
                <div class="nota-conteudo"></div>
            `;
            lista.appendChild(wrapper);
        });

        vincularEventos(lista);
    } catch (err) {
        console.error('[NOTAS] Falha ao carregar lista:', err);
    }
}

async function montarDefinicoes() {
    const slider = document.getElementById('definicoes-slider');
    if (!slider) return;
    try {
        const res   = await fetch('./notas/definicoes/index.json');
        const itens = await res.json();
        // formato: [{ slug: "termo-slug", termo: "Nome do Termo" }, ...]

        let atual = 0;

        const render = () => {
            const item = itens[atual];
            slider.innerHTML = `
                <button class="def-termo" data-url="./notas/definicoes/${item.slug}.html">
                    <span class="def-termo-label">TERMO</span>
                    <span class="def-termo-texto">${item.termo}</span>
                </button>
                <div class="def-nav">
                    <button class="def-prev" ${atual === 0 ? 'disabled' : ''}>←</button>
                    <span class="def-contador">${atual + 1} / ${itens.length}</span>
                    <button class="def-next" ${atual === itens.length - 1 ? 'disabled' : ''}>→</button>
                </div>
            `;
            vincularEventos(slider);
            slider.querySelector('.def-prev')?.addEventListener('click', () => {
                if (atual > 0) { atual--; render(); }
            });
            slider.querySelector('.def-next')?.addEventListener('click', () => {
                if (atual < itens.length - 1) { atual++; render(); }
            });
        };

        render();
    } catch (err) {
        console.error('[DEFINIÇÕES] Falha ao carregar lista:', err);
    }
}

async function montarAnalises() {
    const lista = document.getElementById('analises-lista');
    if (!lista) return;
    try {
        const res   = await fetch('./notas/analises/index.json');
        const itens = await res.json();
        // formato: [{ slug: "analise-slug", titulo: "Título da análise" }, ...]

        itens.forEach(item => {
            const btn = document.createElement('button');
            btn.className    = 'analise-link';
            btn.dataset.url  = `./notas/analises/${item.slug}.html`;
            btn.textContent  = item.titulo;
            lista.appendChild(btn);
        });

        vincularEventos(lista);
    } catch (err) {
        console.error('[ANÁLISES] Falha ao carregar lista:', err);
    }
}

async function montarNavDiario() {
    const nav = document.getElementById('diario-nav');
    if (!nav) return;

    try {
        const res   = await fetch('./diario/entradas/index.json');
        const lista = await res.json();

        nav.innerHTML = '';

        lista.forEach(slug => {
            const btn = document.createElement('button');
            btn.className    = 'diario-data';
            btn.dataset.url  = `./diario/entradas/${slug}.html`;
            btn.dataset.date = slug;
            btn.textContent  = slug.replace(/-/g, '.');
            nav.appendChild(btn);
        });

        vincularEventosDiario(nav);

    } catch (err) {
        console.error('[DIÁRIO] Falha ao carregar índice:', err);
        nav.innerHTML = `<p class="foco-vermelho">ERRO: índice não encontrado.</p>`;
    }
}

function vincularEventosDiario(nav) {
    const entrada = document.getElementById('diario-entrada');

    nav.querySelectorAll('.diario-data').forEach(btn => {
        btn.addEventListener('click', async () => {
            nav.querySelectorAll('.diario-data').forEach(b => b.classList.remove('ativa'));
            btn.classList.add('ativa');

            if (!entrada) return;
            entrada.style.opacity = '0';
            entrada.style.transition = 'opacity 0.12s';
            await new Promise(r => setTimeout(r, 120));

            try {
                const html = await fetchFragmento(btn.dataset.url);
                entrada.innerHTML = html;
                entrada.scrollTop = 0;
            } catch {
                entrada.innerHTML = `<p class="foco-vermelho">ERRO: entrada não encontrada.</p>`;
            }

            entrada.style.opacity = '1';
        });
    });
}

/* ── collapse: expande/fecha conteúdo inline ────────────────── */
async function abrirCollapse(url, elementoConteudo, tituloBotao) {
    const jaAberto = elementoConteudo.classList.contains('collapse-aberto');

    // Fecha o item atual imediatamente se clicou nele de novo
    if (jaAberto) {
        elementoConteudo.style.maxHeight = '0';
        elementoConteudo.classList.remove('collapse-aberto');
        tituloBotao?.classList.remove('aberta');
        return;
    }

    // Fecha qualquer outro item aberto antes de abrir o novo
    document.querySelectorAll('.nota-conteudo.collapse-aberto').forEach(aberto => {
        aberto.style.maxHeight = '0';
        aberto.classList.remove('collapse-aberto');
        aberto.closest('.nota-item')
              ?.querySelector('.nota-titulo')
              ?.classList.remove('aberta');
    });

    // Carrega conteúdo se ainda não foi
    if (!elementoConteudo.dataset.carregado) {
        try {
            const html = await fetchFragmento(url);
            elementoConteudo.innerHTML = html;
            elementoConteudo.dataset.carregado = 'true';
            vincularEventos(elementoConteudo);
        } catch {
            elementoConteudo.innerHTML = `<p class="foco-vermelho">ERRO: fragmento não encontrado.</p>`;
        }
    }

    // Abre com altura real medida
    elementoConteudo.classList.add('collapse-aberto');
    elementoConteudo.style.maxHeight = elementoConteudo.scrollHeight + 'px';
    tituloBotao?.classList.add('aberta');
}

/* ── modal: popup centralizado ──────────────────────────────── */
async function abrirModal(url) {
    let overlay = document.getElementById('transmissoes-modal');

    // Cria o modal se ainda não existe no DOM
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'transmissoes-modal';
        overlay.innerHTML = `
            <div id="transmissoes-modal-box">
                <button id="transmissoes-modal-fechar" aria-label="Fechar">✕</button>
                <div id="transmissoes-modal-content"></div>
            </div>`;
        document.getElementById(CONFIG.telaId).appendChild(overlay);

        overlay.addEventListener('click', e => {
            if (e.target === overlay) fecharModal();
        });
        overlay.querySelector('#transmissoes-modal-fechar')
               .addEventListener('click', fecharModal);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') fecharModal();
        });
    }

    const content = overlay.querySelector('#transmissoes-modal-content');

    try {
        const html = await fetchFragmento(url);
        content.innerHTML = html;
        vincularEventos(content);
    } catch (err) {
        content.innerHTML = `<p class="foco-vermelho">ERRO: definição não encontrada.</p>`;
    }

    overlay.classList.add('modal-visivel');
    overlay.setAttribute('aria-hidden', 'false');
}

function fecharModal() {
    const overlay = document.getElementById('transmissoes-modal');
    if (overlay) {
        overlay.classList.remove('modal-visivel');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

/* ── fullscreen: override total com botão voltar ────────────── */
async function abrirFullscreen(url) {
    const target = document.getElementById(CONFIG.targetId);

    // Salva estado atual antes de substituir
    Estado.historico.push({
        html:  target.innerHTML,
        secao: Estado.secaoAtiva,
    });

    await transicaoTarget(target, async () => {
        try {
            const html = await fetchFragmento(url);

            // Injeta conteúdo dentro de wrapper fullscreen
            target.innerHTML = `<div class="fullscreen-wrapper">${html}</div>`;
            vincularEventos(target);

            // Injeta botão voltar
            const btnVoltar = document.createElement('button');
            btnVoltar.className = 'fullscreen-voltar';
            btnVoltar.textContent = '← voltar';
            btnVoltar.addEventListener('click', voltarHistorico);
            target.querySelector('.fullscreen-wrapper').prepend(btnVoltar);

        } catch (err) {
            target.innerHTML = `<p class="foco-vermelho">ERRO: análise não encontrada.</p>`;
        }
    });
}

async function voltarHistorico() {
    if (Estado.historico.length === 0) return;
    const anterior = Estado.historico.pop();
    const target   = document.getElementById(CONFIG.targetId);

    await transicaoTarget(target, () => {
        target.innerHTML = anterior.html;
        Estado.secaoAtiva = anterior.secao;
        vincularEventos(target);
    });
}

/* ══════════════════════════════════════════════════════════════
   SEQUÊNCIA DA SERPENTE
══════════════════════════════════════════════════════════════ */
function iniciarSequenciaSerpente() {
    const tela = document.getElementById(CONFIG.telaId);

    // Cria overlay de transição se não existir
    let transicao = document.getElementById('transicao-sequencia');
    if (!transicao) {
        transicao = document.createElement('div');
        transicao.id = 'transicao-sequencia';
        tela.appendChild(transicao);
    }

    transicao.classList.remove('oculto');
    transicao.classList.add('transicao-ativa');

    setTimeout(() => {
        window.location.href = '../serpente/s10.html';
    }, 2500);
}

/* ══════════════════════════════════════════════════════════════
   BOOT SEQUENCE
══════════════════════════════════════════════════════════════ */
const BOOT_MSGS = [
    // --- SEGMENTO 1: POST DA BIOS (Hardware) ---
    { texto: 'BIOS ROM PCI/ISA (v2A59CF08)',              classe: 'dim',   delay: 0 },
    { texto: 'Direitos Reservados (C) 1997-2026, Abzu & Co.', classe: 'dim',   delay: 80, opacity: '0.4' },
    { texto: 'Instalação: Unidade de Transmissão Corredor 777', classe: 'dim', delay: 160 },
    { texto: '',                                          classe: '',      delay: 200 },
    { texto: 'CPU: PROCESSADOR TIAMAT-CORE @ 777MHz',     classe: '',      delay: 350 },
    { texto: 'Teste de Memória: 299792K OK',              classe: '',      delay: 600 },
    { texto: 'BUS: Verificando integridade dos pilares...', classe: 'dim', delay: 750, opacity: '0.4' },
    { texto: '',                                          classe: '',      delay: 800 },
    
    // --- SEGMENTO 2: DETECÇÃO DE UNIDADES (BIOS) ---
    { texto: 'Detectando Disco Rígido Principal... [CORREDOR_777.DAT]', classe: 'dim', delay: 950 },
    { texto: 'Detectando Unidade Secundária... Nenhuma',  classe: 'dim',   delay: 1050 },
    { texto: 'Monitor: Fósforo P39 (Verde Esmeralda) ... [OK]', classe: 'ok', delay: 1150 },
    { texto: '',                                          classe: '',      delay: 1250 },

    // --- SEGMENTO 3: CARREGAMENTO DO NÚCLEO (SISTEMA) ---
    { texto: 'Iniciando Núcleo CORREDOR v7.7.7...',       classe: 'ok',    delay: 1400 },
    { texto: 'Sinal Liminar: Detectado e Sincronizado.',     classe: 'ok',    delay: 1550, opacity: '0.4' },
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

async function rodarBoot() {
    const status = document.getElementById(CONFIG.statusId);
    if (status) status.innerText = 'STATUS: CARREGANDO';

    const bootEl = document.getElementById(CONFIG.bootId);
    if (!bootEl) return;

    // Container interno que vai subindo
    const fila = document.createElement('div');
    fila.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        height: 100%;
        overflow: hidden;
    `;
    bootEl.style.height = '100%';
    bootEl.style.overflow = 'hidden';
    bootEl.appendChild(fila);

    for (let i = 0; i < BOOT_MSGS.length; i++) {
        const msg  = BOOT_MSGS[i];
        const prev = BOOT_MSGS[i - 1];
        const espera = i === 0 ? 0 : msg.delay - prev.delay;

        await new Promise(r => setTimeout(r, espera));

        const linha = document.createElement('div');
        linha.className = `boot-linha ${msg.classe}`;
        linha.textContent = msg.texto || '\u00A0';
        // Entra transparente e faz fade-in
        linha.style.cssText = 'opacity:0; transition: opacity 0.12s;';
        fila.appendChild(linha);
        // Força reflow antes de animar
        linha.getBoundingClientRect();
        linha.style.opacity = msg.opacity ?? '1';
    }

    await new Promise(r => setTimeout(r, 600));
    const target = document.getElementById(CONFIG.targetId);
    await transicaoTarget(target, () => {
        target.innerHTML = `
            <div class="boot-pronto">
                <p>Olá! Você acessou uma zona de memória persistente.</p>
                <p class="dim">Estava mantendo as luzes acesas para caso alguém aparecesse.</p>
                <br>
                <p>O que deixei espalhado por aqui é o que sobrou das minhas tentativas de dar ordem ao caos. São registros honestos, alguns sobre o que estudo, outros sobre o que sinto, todos partes de um mesmo corpo que ainda estou tentando construir.</p>
                <br>
                <p>Escolha um dos acessos abaixo para começar. Não tenha pressa, o tempo aqui dentro corre em outra frequência.</p>
                <p class="dim">Estarei por perto, ajustando as engrenagens. Pode entrar.</p>
            </div>`;
    });
    if (status) status.innerText = 'STATUS: EM VIGÍLIA';
    document.getElementById('terminal-nav-inferior')?.classList.remove('nav-bloqueada');
}

/* ══════════════════════════════════════════════════════════════
   VINCULAÇÃO DE EVENTOS (recursiva após cada injeção)
   Conecta automaticamente os elementos interativos
   dentro de qualquer fragmento injetado.
══════════════════════════════════════════════════════════════ */
function vincularEventos(raiz) {
    /* Títulos de notas (collapse) */
    raiz.querySelectorAll('.nota-titulo').forEach(titulo => {
        titulo.addEventListener('click', () => {
            const url      = titulo.dataset.url;
            const item     = titulo.closest('.nota-item');
            const conteudo = item?.querySelector('.nota-conteudo');
            if (!conteudo) return;
            titulo.classList.toggle('aberta');
            abrirCollapse(url, conteudo, titulo);
        });
    });

    /* Termos de definição (modal) */
    raiz.querySelectorAll('.def-termo').forEach(termo => {
        termo.addEventListener('click', () => abrirModal(termo.dataset.url));
    });

    /* Links de análise (fullscreen) */
    raiz.querySelectorAll('.analise-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            abrirFullscreen(link.dataset.url || link.href);
        });
    });

    /* Botão voltar inline (fragmentos que incluem data-acao="voltar") */
    raiz.querySelectorAll('[data-acao="voltar"]').forEach(btn => {
        btn.addEventListener('click', voltarHistorico);
    });
}

/* ══════════════════════════════════════════════════════════════
   UTILITÁRIOS
══════════════════════════════════════════════════════════════ */

/* Fade out → executa fn → fade in */
async function transicaoTarget(el, fn) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.15s';
    await new Promise(r => setTimeout(r, 150));
    await fn();
    el.style.opacity = '1';
}

// if (status) status.innerText = 'STATUS: EM VIGÍLIA';

/* Marca o botão da nav ativo */
function atualizarNavAtiva(secao) {
    document.querySelectorAll('.nav-bloco-link').forEach(btn => {
        btn.classList.remove('nav-ativo');
    });
    const mapa = { 'diario': 'icone-diario', 'notas': 'icone-notas' };
    const iconClass = mapa[secao];
    if (iconClass) {
        document.querySelector(`.${iconClass}`)
                ?.closest('.nav-bloco-link')
                ?.classList.add('nav-ativo');
    }
}

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    rodarBoot();
});