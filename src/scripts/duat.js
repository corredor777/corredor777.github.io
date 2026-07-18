// duat.js — overlay do Duat na Recepção: canvas de partículas, entrada glitch,
// #duat-777 crescendo/sumindo com blur no scroll, fechamento SÓ ao completar o
// scroll, easter egg Tiamat. Adaptado do nucleo/js/main.js vanilla ao padrão de
// efeitos ([006]): export iniciarDuat(), checagem de página (#duat-overlay),
// guarda de idempotência por nó, religação via astro:page-load. A lógica (curvas
// de scroll, partículas, congelamento do 777) é cópia fiel do vanilla — é a obra.

"use strict";

// Refs e estado do módulo. Reatribuídos a cada montagem (View Transitions
// recriam o DOM da Recepção); por isso as refs vivem no escopo do módulo e não
// em captura de listener antigo.
let overlay, canvas, ctx, conteudo, s777;
let particulas = [];
let rafId = 0;
let progressoAtual = 0;
let settecentoCongelado = false;
let jaFechando = false;
let stroboAbrir = null; // strobo do 777 enquanto aberto
let globaisLigados = false; // resize + strobo contínuo: uma vez só

/* ── partículas ─────────────────────────────────────────── */
function criarParticulas() {
  particulas = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.3,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    opacidade: Math.random() * 0.2 + 0.05,
  }));
}

function desenharParticulas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particulas.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.shadowBlur = 4;
    // Cor reage ao progresso do scroll — branco/azul no início, vermelho no fim
    const r = Math.round(255 * progressoAtual);
    const b = Math.round(255 * (1 - progressoAtual));
    ctx.fillStyle = `rgba(${r}, 0, ${b}, ${p.opacidade})`;
    ctx.shadowColor = `rgba(${r}, 0, ${b}, 0.8)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  rafId = requestAnimationFrame(desenharParticulas);
}

function pararParticulas() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/* ── abrir / fechar ─────────────────────────────────────── */
function abrirDuat() {
  overlay.scrollTop = 0;
  s777.style.opacity = 0;
  s777.style.fontSize = "1em";
  s777.style.filter = "blur(0px)";
  // fundo semitransparente já na abertura (evita flash de preto sólido)
  overlay.style.backgroundColor = "rgba(10, 10, 10, 0.95)";
  conteudo.style.filter = "";
  conteudo.style.opacity = "";

  s777.classList.remove("congelado");
  settecentoCongelado = false;
  jaFechando = false;

  overlay.classList.remove("fechando");
  overlay.classList.add("ativo");
  canvas.classList.add("ativo");
  desenharParticulas();

  if (!stroboAbrir) {
    stroboAbrir = setInterval(() => {
      if (Math.random() > 0.95) s777.classList.toggle("strobo-painel");
    }, 80);
  }
}

function fecharDuat() {
  overlay.classList.add("fechando");
  canvas.classList.remove("ativo");

  setTimeout(() => {
    s777.style.opacity = 0;
    s777.style.fontSize = "1em";
    s777.style.filter = "blur(0px)";

    overlay.classList.remove("ativo", "fechando");
    overlay.style.opacity = "";
    overlay.style.backgroundColor = "#0a0a0a";

    s777.classList.remove("congelado");
    settecentoCongelado = false;
    conteudo.style.filter = "";
    conteudo.style.opacity = "";

    clearInterval(stroboAbrir);
    stroboAbrir = null;
    pararParticulas();
  }, 500);
}

/* ── scroll: fundo/777/conteúdo reagem ao progresso ─────── */
function aoScroll() {
  const scrollado = overlay.scrollTop;
  const total = overlay.scrollHeight - overlay.clientHeight;
  const progresso = total > 0 ? scrollado / total : 0;
  progressoAtual = progresso;

  // fundo esmaece com curva quadrática (começa a sumir de verdade após ~50%)
  const curvaOpacidade = Math.pow(progresso, 2);
  const fundoOpacidade = Math.max(0, 0.95 - curvaOpacidade * 0.95);
  overlay.style.backgroundColor = `rgba(10, 10, 10, ${fundoOpacidade})`;

  // 777: some (<30%) → aparece e cresce (30–70%) → sai com blur crescendo (>70%)
  if (progresso < 0.3) {
    s777.style.opacity = 0;
    s777.style.fontSize = "1em";
    s777.style.filter = "blur(0px)";
  } else if (progresso < 0.7) {
    const entrada = (progresso - 0.3) / 0.4;
    s777.style.opacity = entrada;
    s777.style.fontSize = `${1 + entrada * 1.5}em`;
    s777.style.filter = "blur(0px)";
  } else {
    const saida = (progresso - 0.7) / 0.3;
    s777.style.opacity = Math.max(0, 1 - saida);
    s777.style.fontSize = `${2.5 + saida * 2}em`;
    s777.style.filter = `blur(${saida * 20}px)`;
  }

  // conteúdo desfoca e some a partir de 70%
  if (progresso > 0.7) {
    const intensidade = (progresso - 0.7) / 0.3;
    conteudo.style.filter = `blur(${intensidade * 16}px)`;
    conteudo.style.opacity = Math.max(0, 1 - intensidade);
  } else {
    conteudo.style.filter = "";
    conteudo.style.opacity = "";
  }

  // congela o 777 ao chegar ao centro da tela
  if (!settecentoCongelado) {
    const rect = s777.getBoundingClientRect();
    const meio777 = rect.top + rect.height / 2;
    if (meio777 <= window.innerHeight / 2 + 2) {
      s777.classList.add("congelado");
      settecentoCongelado = true;
    }
  }

  // encerramento automático SÓ ao completar o scroll
  if (progresso >= 0.99 && !jaFechando) {
    jaFechando = true;
    fecharDuat();
    setTimeout(() => (jaFechando = false), 1200);
  }
}

/* ── globais (uma vez): resize + strobo contínuo do 777 ─── */
function ligarGlobais() {
  if (globaisLigados) return; // window sobrevive à navegação do Astro
  globaisLigados = true;

  window.addEventListener("resize", () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // strobo contínuo (re-consulta o nó — na volta à Recepção o #duat-777 é novo)
  setInterval(() => {
    const el = document.getElementById("duat-777");
    if (el && Math.random() > 0.85) el.classList.toggle("strobo-painel");
  }, 80);

  // limpa qualquer '#' da URL ao carregar
  if (window.location.hash) {
    history.replaceState(
      "",
      document.title,
      window.location.pathname + window.location.search,
    );
  }
}

/**
 * Ponto de entrada, religado a cada astro:page-load. Sem #duat-overlay não é a
 * Recepção: sai. A guarda por nó (dataset) evita religar o mesmo overlay; numa
 * volta via View Transitions o overlay é novo (sem a marca) e religa nos nós
 * novos. Cancela qualquer RAF órfão de uma montagem anterior por segurança.
 */
export function iniciarDuat() {
  const el = document.getElementById("duat-overlay");
  if (!el) return; // checagem de página
  if (el.dataset.duatLigado) return; // idempotência por nó
  el.dataset.duatLigado = "1";

  pararParticulas(); // encerra RAF de uma Recepção anterior, se houver
  overlay = el;
  canvas = document.getElementById("duat-canvas");
  conteudo = document.getElementById("duat-content");
  s777 = document.getElementById("duat-777");
  ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  criarParticulas();

  overlay.addEventListener("scroll", aoScroll);

  // qualquer .link-duat / .duat-link abre a travessia
  document.querySelectorAll(".link-duat, .duat-link").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      abrirDuat();
    });
  });

  // strobo glitch no hover do Tiamat (easter egg) e nos parágrafos de foco
  document.querySelectorAll("#easter-tiamat, .duat-focus").forEach((elem) => {
    let intervalo = null;
    elem.addEventListener("mouseenter", () => {
      intervalo = setInterval(() => {
        if (Math.random() > 0.6) elem.classList.toggle("strobo-painel");
      }, 50);
    });
    elem.addEventListener("mouseleave", () => {
      clearInterval(intervalo);
      elem.classList.remove("strobo-painel");
    });
  });

  ligarGlobais();
}
