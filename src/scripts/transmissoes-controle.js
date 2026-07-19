// transmissoes-controle.js — controle da navegação interna das Transmissões
// (F2d/d3). Herdeiro ENXUTO do transmissoes-controle.js vanilla (638 linhas):
// o comportamento é canônico (fades de 150ms, boot, collapse, modal, fullscreen,
// slider randomizado), a implementação é que enxuga. Três diferenças de fundo
// em relação ao vanilla:
//   1. as seções são montadas dos ÍNDICES EMBUTIDOS no build (<script
//      id="indice-transmissoes">), não de fetch de index.json;
//   2. os fragmentos de cada entrada vêm do duto /sinais/{colecao}/{slug}.html
//      (d1), não de ./{secao}/entradas/...;
//   3. a matemática já vem RENDERIZADA do build (rehype-katex) — não há KaTeX
//      em runtime; a flag math só decidiu o CSS na casca.
//
// Ciclo de vida (padrão de efeitos [006]): export iniciarControle(), religado
// via astro:page-load pela casca. O boot roda uma vez por ENTRADA; a navegação
// interna é client-side (pushState), sem reload.

const BASE = "/fragmentos/transmissoes";
const SINAIS = `${BASE}/sinais`;
const LABELS = { diario: "Diário", notas: "Minhas Notas" };

// ── estado do módulo ────────────────────────────────────────────────────────
const cache = new Map(); // url → html (evita fetch duplicado)
const historico = []; // pilha do fullscreen → voltar
let indice = null; // índices embutidos (lidos uma vez)
let secaoAtiva = null;
let globaisLigados = false; // popstate/Esc ligam uma vez só (window/document)

// ── índice embutido ─────────────────────────────────────────────────────────
function lerIndice() {
  if (indice) return indice;
  const el = document.getElementById("indice-transmissoes");
  indice = el
    ? JSON.parse(el.textContent)
    : { diario: [], definicoes: [], ensaios: [], arquivos: [] };
  return indice;
}

// ── fetch de fragmento com cache em memória ─────────────────────────────────
async function fetchFragmento(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  const html = await res.text();
  cache.set(url, html);
  return html;
}

// Forma de diretório (build.format:"directory"): o fragmento vira
// .../{slug}/index.html; fetch da URL de pasta serve esse index.
const urlEntrada = (colecao, slug) =>
  `${SINAIS}/${colecao}/${encodeURIComponent(slug)}/`;

// ── utilitários de casca ────────────────────────────────────────────────────
async function transicaoTarget(el, fn) {
  el.style.opacity = "0";
  el.style.transition = "opacity 0.15s";
  await new Promise((r) => setTimeout(r, 150));
  await fn();
  el.style.opacity = "1";
}

// Re-executa os <script> de um fragmento injetado: innerHTML não roda scripts,
// então recriamos cada um (mecanismo do vanilla). É o que faz as inserções
// WebGL (vesica no modal, vórtice no diário) voltarem a rodar após a injeção.
function reexecutarScripts(container) {
  container.querySelectorAll("script").forEach((antigo) => {
    const novo = document.createElement("script");
    if (antigo.src) novo.src = antigo.src;
    else novo.textContent = antigo.textContent;
    document.body.appendChild(novo);
    document.body.removeChild(novo);
  });
}

const setStatus = (txt) => {
  const s = document.getElementById("topo-status");
  if (s) s.innerText = `STATUS: ${txt}`;
};

function setBreadcrumb(secao) {
  const b = document.getElementById("topo-breadcrumb");
  if (!b) return;
  const label = LABELS[secao];
  b.innerText = label
    ? `CORREDOR 777 // TRANSMISSÕES // ${label.toUpperCase()}`
    : "CORREDOR 777 // TRANSMISSÕES";
}

function atualizarNavAtiva(secao) {
  document
    .querySelectorAll(".nav-bloco-link")
    .forEach((b) => b.classList.remove("nav-ativo"));
  document
    .querySelector(`.nav-bloco-link[data-secao="${secao}"]`)
    ?.classList.add("nav-ativo");
}

const erro = (msg) => `<p class="foco-vermelho">${msg}</p>`;

// ── HOME (mensagem de recepção — o "welcome" do vanilla) ────────────────────
const HOME_HTML = `
  <div class="boot-pronto">
    <p>Olá! Você acessou uma zona de memória persistente.</p>
    <p class="dim">Estava mantendo as luzes acesas para caso alguém aparecesse.</p>
    <br>
    <p>O que deixei espalhado por aqui é o que sobrou das minhas tentativas de dar ordem ao caos. São registros honestos, alguns sobre o que estudo, outros sobre o que sinto, todos partes de um mesmo corpo que ainda estou tentando construir.</p>
    <br>
    <p>Escolha um dos acessos abaixo para começar. Não tenha pressa, o tempo aqui dentro corre em outra frequência.</p>
    <p class="dim">Estarei por perto, ajustando as engrenagens. Pode entrar.</p>
  </div>`;

async function mostrarHome({ push = true } = {}) {
  const target = document.getElementById("monitor-target");
  secaoAtiva = "home";
  historico.length = 0;
  atualizarNavAtiva("home");
  setBreadcrumb("home");
  await transicaoTarget(target, () => {
    target.innerHTML = HOME_HTML;
    target.setAttribute("data-secao", "home");
  });
  if (push) history.pushState({ secao: "home" }, "", `${BASE}/`);
  setStatus("EM VIGÍLIA");
}

// ── navegação de seção ──────────────────────────────────────────────────────
async function navegarPara(secao, { push = true } = {}) {
  if (secao === "home") return mostrarHome({ push });
  const target = document.getElementById("monitor-target");
  secaoAtiva = secao;
  historico.length = 0;
  atualizarNavAtiva(secao);
  setBreadcrumb(secao);
  setStatus("CARREGANDO");

  await transicaoTarget(target, () => {
    if (secao === "diario") montarDiario(target);
    else if (secao === "notas") montarNotas(target);
  });

  if (push) history.pushState({ secao }, "", `${BASE}/${secao}/`);
  setTimeout(() => setStatus("EM VIGÍLIA"), 800);
}

// ── DIÁRIO: lista datada (esquerda) + entrada aberta (direita) ───────────────
function montarDiario(target) {
  const { diario } = lerIndice();
  target.setAttribute("data-secao", "diario");
  target.innerHTML = `
    <div class="diario-wrapper">
      <div class="diario-coluna-esquerda">
        <div class="section-header"><div class="section-title">Diário&nbsp;&there4;</div></div>
        <div id="diario-nav"></div>
      </div>
      <div class="diario-coluna-direita">
        <div id="diario-entrada"><p class="diario-placeholder">Selecione uma entrada.</p></div>
      </div>
    </div>`;

  const nav = target.querySelector("#diario-nav");
  const entrada = target.querySelector("#diario-entrada");

  diario.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "diario-data";
    btn.dataset.slug = item.slug;
    btn.textContent = item.data.replace(/-/g, "."); // 2026-06-05 → 2026.06.05
    btn.addEventListener("click", () => abrirEntradaDiario(nav, btn, entrada));
    nav.appendChild(btn);
  });
  // Sem abrir automático: fica o placeholder "Selecione uma entrada." do
  // shell (decisão do Bruno) até o primeiro clique.
}

async function abrirEntradaDiario(nav, btn, entrada) {
  nav.querySelectorAll(".diario-data").forEach((b) => b.classList.remove("ativa"));
  btn.classList.add("ativa");

  entrada.style.opacity = "0";
  entrada.style.transition = "opacity 0.12s";
  await new Promise((r) => setTimeout(r, 120));
  try {
    entrada.innerHTML = await fetchFragmento(urlEntrada("diario", btn.dataset.slug));
    reexecutarScripts(entrada); // vórtice WebGL da 2026-05-15
    entrada.scrollTop = 0;
  } catch {
    entrada.innerHTML = erro("ERRO: entrada não encontrada.");
  }
  entrada.style.opacity = "1";
}

// ── NOTAS: três núcleos ─────────────────────────────────────────────────────
function montarNotas(target) {
  target.setAttribute("data-secao", "notas");
  target.innerHTML = `
    <div class="notas-wrapper">
      <div class="notas-coluna-esquerda">
        <div class="section-header">Notas&nbsp;&there4;</div>
        <div id="notas-lista"></div>
      </div>
      <div class="notas-coluna-direita">
        <div class="notas-definicoes-wrapper">
          <div id="definicoes-slider"></div>
        </div>
        <div class="notas-ensaios-wrapper">
          <div class="section-header" style="top: -10px; bottom: -20px !important">Ensaios&nbsp;&there4;</div>
          <div id="ensaios-lista"></div>
        </div>
      </div>
    </div>`;

  montarListaArquivos(target.querySelector("#notas-lista"));
  montarDefinicoes(target.querySelector("#definicoes-slider"));
  montarEnsaios(target.querySelector("#ensaios-lista"));
}

// arquivos → lista com collapse inline
function montarListaArquivos(lista) {
  const { arquivos } = lerIndice();
  arquivos.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "nota-item";
    wrapper.innerHTML = `
      <div class="nota-titulo" data-slug="${item.slug}">
        <span>${item.titulo}</span>
        <span class="nota-indicador">▸</span>
      </div>
      <div class="nota-conteudo"></div>`;
    const titulo = wrapper.querySelector(".nota-titulo");
    const conteudo = wrapper.querySelector(".nota-conteudo");
    titulo.addEventListener("click", () => {
      titulo.classList.toggle("aberta");
      abrirCollapse(urlEntrada("arquivos", item.slug), conteudo, titulo);
    });
    lista.appendChild(wrapper);
  });
}

// definições → slider randomizado (Fisher-Yates), clique abre modal
function montarDefinicoes(slider) {
  let itens = lerIndice().definicoes.slice();
  for (let i = itens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [itens[i], itens[j]] = [itens[j], itens[i]];
  }
  let atual = 0;

  const render = () => {
    const item = itens[atual];
    slider.innerHTML = `
      <button class="def-termo" data-slug="${item.slug}">
        <span class="def-termo-label">TERMO</span>
        <span class="def-termo-texto">${item.termo}</span>
      </button>
      <div class="def-nav">
        <button class="def-prev" ${atual === 0 ? "disabled" : ""}>««</button>
        <button class="def-next" ${atual === itens.length - 1 ? "disabled" : ""}>»»</button>
      </div>`;
    slider
      .querySelector(".def-termo")
      .addEventListener("click", () => abrirModal(urlEntrada("definicoes", item.slug)));
    slider.querySelector(".def-prev")?.addEventListener("click", () => {
      if (atual > 0) atual--, render();
    });
    slider.querySelector(".def-next")?.addEventListener("click", () => {
      if (atual < itens.length - 1) atual++, render();
    });
  };
  if (itens.length) render();
}

// ensaios → menu pela `chamada` (rótulo curto), corpo com o `titulo` pleno
function montarEnsaios(lista) {
  const { ensaios } = lerIndice();
  ensaios.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "ensaio-link";
    btn.textContent = item.chamada || item.titulo;
    btn.addEventListener("click", () =>
      abrirFullscreen(urlEntrada("ensaios", item.slug)),
    );
    lista.appendChild(btn);
  });
}

// ── collapse (arquivos) ─────────────────────────────────────────────────────
async function abrirCollapse(url, conteudo, titulo) {
  if (conteudo.classList.contains("collapse-aberto")) {
    conteudo.style.maxHeight = "0";
    conteudo.classList.remove("collapse-aberto");
    titulo?.classList.remove("aberta");
    return;
  }
  // fecha qualquer outro aberto
  document.querySelectorAll(".nota-conteudo.collapse-aberto").forEach((a) => {
    a.style.maxHeight = "0";
    a.classList.remove("collapse-aberto");
    a.closest(".nota-item")?.querySelector(".nota-titulo")?.classList.remove("aberta");
  });
  // carrega uma vez
  if (!conteudo.dataset.carregado) {
    try {
      conteudo.innerHTML = await fetchFragmento(url);
      conteudo.dataset.carregado = "true";
      reexecutarScripts(conteudo);
    } catch {
      conteudo.innerHTML = erro("ERRO: fragmento não encontrado.");
    }
  }
  conteudo.classList.add("collapse-aberto");
  conteudo.style.maxHeight = conteudo.scrollHeight + "px";
  titulo?.classList.add("aberta");
}

// ── modal (definições) ──────────────────────────────────────────────────────
async function abrirModal(url) {
  let overlay = document.getElementById("transmissoes-modal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "transmissoes-modal";
    overlay.innerHTML = `
      <div id="transmissoes-modal-box">
        <button id="transmissoes-modal-fechar" aria-label="Fechar">✕</button>
        <div id="transmissoes-modal-content"></div>
      </div>`;
    document.getElementById("tela-tubo").appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fecharModal();
    });
    overlay
      .querySelector("#transmissoes-modal-fechar")
      .addEventListener("click", fecharModal);
  }
  const content = overlay.querySelector("#transmissoes-modal-content");
  try {
    content.innerHTML = await fetchFragmento(url);
    reexecutarScripts(content); // vesica WebGL + $\sqrt{3}$ (KaTeX já renderizado)
  } catch {
    content.innerHTML = erro("ERRO: definição não encontrada.");
  }
  overlay.classList.add("modal-visivel");
  overlay.setAttribute("aria-hidden", "false");
}

function fecharModal() {
  const overlay = document.getElementById("transmissoes-modal");
  if (overlay) {
    overlay.classList.remove("modal-visivel");
    overlay.setAttribute("aria-hidden", "true");
  }
}

// ── fullscreen (ensaios) — override total do target + botão voltar ──────────
async function abrirFullscreen(url) {
  const target = document.getElementById("monitor-target");
  historico.push({ html: target.innerHTML, secao: secaoAtiva });

  await transicaoTarget(target, async () => {
    try {
      const corpo = await fetchFragmento(url);
      // a estrutura #ensaio-full-* (título, tese, corpo, referências) já vem no
      // próprio fragmento (MDX); aqui só o wrapper de fullscreen + o voltar
      target.innerHTML = `<div class="fullscreen-wrapper">${corpo}</div>`;
      reexecutarScripts(target);
      const btn = document.createElement("button");
      btn.className = "fullscreen-voltar";
      btn.textContent = "← voltar";
      btn.addEventListener("click", voltarHistorico);
      target.querySelector(".fullscreen-wrapper").prepend(btn);
    } catch {
      target.innerHTML = erro("ERRO: análise não encontrada.");
    }
  });
}

async function voltarHistorico() {
  if (!historico.length) return;
  const anterior = historico.pop();
  const target = document.getElementById("monitor-target");
  await transicaoTarget(target, () => {
    target.innerHTML = anterior.html;
    secaoAtiva = anterior.secao;
    // religa os cliques dos elementos restaurados (nós novos)
    religarSecaoRestaurada(target);
  });
}

// Ao restaurar o innerHTML salvo (voltar do fullscreen), os nós são novos e
// perdem os listeners; religa o essencial da seção ativa.
function religarSecaoRestaurada(target) {
  if (secaoAtiva === "diario") {
    const nav = target.querySelector("#diario-nav");
    const entrada = target.querySelector("#diario-entrada");
    nav?.querySelectorAll(".diario-data").forEach((btn) =>
      btn.addEventListener("click", () => abrirEntradaDiario(nav, btn, entrada)),
    );
  } else if (secaoAtiva === "notas") {
    // remonta os núcleos de notas (mais simples e fiel que reconciliar)
    montarNotas(target);
  }
}

// ── BOOT (POST de BIOS falso) ───────────────────────────────────────────────
const BOOT_MSGS = [
  { texto: "BIOS ROM PCI/ISA (v2A59CF08)", classe: "dim", delay: 0 },
  { texto: "Direitos Reservados (C) 1997-2026, Abzu & Co.", classe: "dim", delay: 80, opacity: "0.4" },
  { texto: "Instalação: Unidade de Transmissão Corredor 777", classe: "dim", delay: 160 },
  { texto: "", classe: "", delay: 200 },
  { texto: "CPU: PROCESSADOR TIAMAT-CORE @ 777MHz", classe: "", delay: 350 },
  { texto: "Teste de Memória: 299792K OK", classe: "", delay: 600 },
  { texto: "BUS: Verificando integridade dos pilares...", classe: "dim", delay: 750, opacity: "0.4" },
  { texto: "", classe: "", delay: 800 },
  { texto: "Detectando Disco Rígido Principal... [CORREDOR_777.DAT]", classe: "dim", delay: 950 },
  { texto: "Detectando Unidade Secundária... Nenhuma", classe: "dim", delay: 1050 },
  { texto: "Monitor: Fósforo P39 (Verde Esmeralda) ... [OK]", classe: "ok", delay: 1150 },
  { texto: "", classe: "", delay: 1250 },
  { texto: "Iniciando Núcleo CORREDOR v7.7.7...", classe: "ok", delay: 1400 },
  { texto: "Sinal Liminar: Detectado e Sincronizado.", classe: "ok", delay: 1550, opacity: "0.4" },
  { texto: "", classe: "", delay: 1650 },
  { texto: "MEM_ALTA: Testando memória estendida... pronto.", classe: "dim", delay: 1800 },
  { texto: "DEVICE=C:\\DOS\\TRANSMISSOES.SYS", classe: "", delay: 1950 },
  { texto: "DEVICE=C:\\DOS\\FRAGMENTOS.SYS", classe: "", delay: 2100 },
  { texto: "SND: Driver de Ressonância Estática ... [OK]", classe: "ok", delay: 2250 },
  { texto: "C:\\>DEFINIR CAMINHO=C:\\SISTEMA;C:\\FRAGMENTOS\\SERPENTE", classe: "dim", delay: 2400 },
  { texto: "C:\\>CARREGAR_ALTO /SISTEMA/FILTRO_TIAMAT", classe: "", delay: 2600 },
  { texto: "C:\\>FIAT_LUX.EXE --acesso_total", classe: "ok", delay: 2800 },
  { texto: "", classe: "", delay: 2950 },
  { texto: "C:\\> [ PRONTO ] _", classe: "blink", delay: 3100 },
];

async function rodarBoot() {
  setStatus("CARREGANDO");
  const bootEl = document.getElementById("boot-loader");
  if (!bootEl) return;

  const fila = document.createElement("div");
  fila.style.cssText =
    "display:flex; flex-direction:column; justify-content:flex-end; height:100%; overflow:hidden;";
  bootEl.style.height = "100%";
  bootEl.style.overflow = "hidden";
  bootEl.appendChild(fila);

  for (let i = 0; i < BOOT_MSGS.length; i++) {
    const msg = BOOT_MSGS[i];
    const espera = i === 0 ? 0 : msg.delay - BOOT_MSGS[i - 1].delay;
    await new Promise((r) => setTimeout(r, espera));
    const linha = document.createElement("div");
    linha.className = `boot-linha ${msg.classe}`;
    linha.textContent = msg.texto || " ";
    linha.style.cssText = "opacity:0; transition: opacity 0.12s;";
    fila.appendChild(linha);
    linha.getBoundingClientRect(); // força reflow antes do fade-in
    linha.style.opacity = msg.opacity ?? "1";
  }
  await new Promise((r) => setTimeout(r, 600));
}

// ── qual seção a URL pede (entrada direta / popstate) ───────────────────────
function secaoDaURL() {
  const p = location.pathname;
  if (/\/diario\/?$/.test(p)) return "diario";
  if (/\/notas\/?$/.test(p)) return "notas";
  return "home";
}

function ligarNav() {
  document.querySelectorAll(".nav-bloco-link[data-secao]").forEach((btn) => {
    btn.addEventListener("click", () => navegarPara(btn.dataset.secao));
  });
}

function ligarGlobais() {
  if (globaisLigados) return; // window/document sobrevivem à navegação do Astro
  globaisLigados = true;
  // voltar/avançar do navegador navega as seções (sem push — a URL já mudou)
  window.addEventListener("popstate", () => {
    fecharModal();
    navegarPara(secaoDaURL(), { push: false });
  });
  // Esc fecha o modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
  });
}

/**
 * Ponto de entrada, religado a cada astro:page-load pela casca. Roda o boot uma
 * vez por entrada (guarda por nó em #boot-loader) e, ao fim, abre a seção que a
 * URL pede — hub → recepção, /diario/ ou /notas/ → já na seção (entrada direta).
 */
export async function iniciarControle() {
  const bootEl = document.getElementById("boot-loader");
  if (!bootEl || bootEl.dataset.booted) return; // checagem de página + idempotência
  bootEl.dataset.booted = "1";

  lerIndice();
  ligarGlobais();
  ligarNav();

  await rodarBoot();
  // nav acende ao fim do boot (dimmed durante, como no publicado)
  document.getElementById("terminal-nav-inferior")?.classList.remove("nav-bloqueada");

  await navegarPara(secaoDaURL(), { push: false });
}
