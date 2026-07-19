// juramento.js — interatividade do Juramento do Abismo: preenche a data, sorteia
// o número de registro (com chances de "especiais": repetidos/palíndromos) e o
// canvas de assinatura (rastro colorido → fixa em preto → dispara impressão e
// redireciona). Adaptado do script vanilla ao padrão de efeitos ([006]): export
// iniciarJuramento(), checagem de página (#canva canvas), guarda por nó,
// religação via astro:page-load.
//
// O sistema de cursor PRÓPRIO do vanilla (.cur-draw/.cur-default) foi REMOVIDO:
// agora vem do cursor-manager global — .cur-draw (caneta) e .cur-default
// (skeleton-hand, fallback por página via classe na raiz) estão no globalCursorMap.

"use strict";

// Estado do módulo — reatribuído a cada entrada (View Transitions recriam o DOM).
let canvas, ctx, bCanvas, bCtx;
let desenhando = false;
let rastro = []; // "cauda" temporária do traço
const tamanhoCauda = 20;
let windowLigado = false; // mousemove/mouseup/resize em window: uma vez só

/* ── número de registro (com chance de especial) ────────── */
function gerarNumeroEspecial() {
  const spans = document.querySelectorAll("#regnum, #protocolo-fim");
  const chanceEspecial = 0.3;
  let resultado = "";

  if (Math.random() < chanceEspecial) {
    const tipo = Math.floor(Math.random() * 2);
    if (tipo === 0) {
      // repetidos (ex.: 55555)
      resultado = Math.floor(Math.random() * 10)
        .toString()
        .repeat(5);
    } else {
      // espelhados/palíndromos (ex.: 12521)
      const d1 = Math.floor(Math.random() * 10);
      const d2 = Math.floor(Math.random() * 10);
      const d3 = Math.floor(Math.random() * 10);
      resultado = `${d1}${d2}${d3}${d2}${d1}`;
    }
  } else {
    resultado = Math.floor(10000 + Math.random() * 90000).toString();
  }

  spans.forEach((span) => (span.textContent = resultado));
}

/* ── canvas de assinatura ───────────────────────────────── */
function configurarCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  bCanvas.width = canvas.width;
  bCanvas.height = canvas.height;

  bCtx.strokeStyle = "rgba(0, 0, 0, 1)";
  bCtx.lineWidth = 2.5;
  bCtx.lineCap = "round";
  bCtx.lineJoin = "round";
}

function adicionarPonto(x, y) {
  rastro.push({ x, y });
  // quando a cauda excede o tamanho, o ponto mais antigo vira preto fixo
  if (rastro.length > tamanhoCauda) {
    const p1 = rastro[0];
    const p2 = rastro[1];
    bCtx.beginPath();
    bCtx.moveTo(p1.x, p1.y);
    bCtx.lineTo(p2.x, p2.y);
    bCtx.stroke();
    rastro.shift();
  }
}

function desenhar(e) {
  if (!desenhando) return;
  if (e.cancelable) e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const clienteX = e.touches ? e.touches[0].clientX : e.clientX;
  const clienteY = e.touches ? e.touches[0].clientY : e.clientY;
  adicionarPonto(clienteX - rect.left, clienteY - rect.top);

  requestAnimationFrame(renderizarFrame);
}

function renderizarFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // rastro preto permanente
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(bCanvas, 0, 0);

  // cauda colorida (escurece do cursor para trás: branco → amarelo → vermelho)
  if (rastro.length < 2) return;
  for (let i = 1; i < rastro.length; i++) {
    const p1 = rastro[i - 1];
    const p2 = rastro[i];
    const progresso = i / rastro.length; // 0 (antigo) → 1 (cursor)

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    let cor;
    if (progresso > 0.98) {
      cor = "rgb(255, 255, 255)";
      ctx.lineWidth = 4;
    } else if (progresso > 0.93) {
      cor = "rgb(255, 228, 54)";
      ctx.lineWidth = 3.5;
    } else if (progresso > 0.8) {
      cor = "rgb(202, 1, 1)";
      ctx.lineWidth = 3.5;
    } else if (progresso > 0.6) {
      cor = "rgb(171, 0, 0)";
      ctx.lineWidth = 3.5;
    } else {
      cor = "rgb(128, 0, 0)";
      ctx.lineWidth = 3;
    }

    ctx.strokeStyle = cor;
    ctx.stroke();
  }
}

function iniciar(e) {
  desenhando = true;
  rastro = [];
  const rect = canvas.getBoundingClientRect();
  const clienteX = e.touches ? e.touches[0].clientX : e.clientX;
  const clienteY = e.touches ? e.touches[0].clientY : e.clientY;
  rastro.push({ x: clienteX - rect.left, y: clienteY - rect.top });
}

function parar() {
  if (!desenhando) return;
  desenhando = false;

  // fixa o rastro no buffer preto
  for (let i = 1; i < rastro.length; i++) {
    bCtx.beginPath();
    bCtx.moveTo(rastro[i - 1].x, rastro[i - 1].y);
    bCtx.lineTo(rastro[i].x, rastro[i].y);
    bCtx.stroke();
  }
  rastro = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bCanvas, 0, 0);

  prepararImpressao();
}

/* ── impressão + saída do ritual ────────────────────────── */
function prepararImpressao() {
  const agora = new Date();
  const dataFormatada =
    agora.toLocaleDateString("pt-BR") + " - " + agora.toLocaleTimeString("pt-BR");
  const campoData = document.getElementById("data-hora-fim");
  if (campoData) campoData.innerText = dataFormatada;

  document.body.classList.add("modo-impressao");

  const finalizarEIrEmbora = () => {
    // 500ms para o Firefox processar o fechamento do print
    setTimeout(() => window.location.replace("/main/"), 500);
  };

  window.onafterprint = null;
  window.onafterprint = finalizarEIrEmbora;

  const monitorarVolta = () => {
    if (document.visibilityState === "visible") {
      finalizarEIrEmbora();
      document.removeEventListener("visibilitychange", monitorarVolta);
    }
  };
  document.addEventListener("visibilitychange", monitorarVolta);

  setTimeout(() => window.print(), 100);
}

/**
 * Ponto de entrada, religado a cada astro:page-load. Sem o canvas de assinatura
 * não é o Juramento: sai. Guarda por nó evita religar; numa entrada nova (via
 * corte seco / reload) o canvas é novo e religa. Os listeners de window ligam
 * uma vez (usam sempre o canvas/rastro atuais do módulo); os do canvas religam
 * a cada entrada (nó novo).
 */
export function iniciarJuramento() {
  canvas = document.querySelector("#canva canvas");
  if (!canvas) return; // checagem de página
  if (canvas.dataset.juramentoLigado) return; // idempotência por nó
  canvas.dataset.juramentoLigado = "1";

  const spanData = document.getElementById("data-atual");
  if (spanData) {
    spanData.textContent = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  gerarNumeroEspecial();

  ctx = canvas.getContext("2d");
  bCanvas = document.createElement("canvas");
  bCtx = bCanvas.getContext("2d");
  configurarCanvas();

  canvas.addEventListener("mousedown", iniciar);
  canvas.addEventListener("touchstart", iniciar, { passive: false });
  canvas.addEventListener("touchmove", desenhar, { passive: false });
  canvas.addEventListener("touchend", parar);

  if (!windowLigado) {
    windowLigado = true;
    window.addEventListener("mousemove", desenhar, { passive: false });
    window.addEventListener("mouseup", parar);
    window.addEventListener("resize", configurarCanvas);
  }
}
