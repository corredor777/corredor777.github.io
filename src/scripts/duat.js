// duat.js — overlay do Duat na Recepção: entrada glitch, #duat-777
// crescendo/sumindo com blur no scroll, fechamento SÓ ao completar o scroll,
// easter egg Tiamat. Adaptado do nucleo/js/main.js vanilla ao padrão de efeitos
// ([006]): export iniciarDuat(), checagem de página (#duat-overlay), guarda de
// idempotência por nó, religação via astro:page-load.
//
// As PARTÍCULAS (poeira cósmica) foram DESCARTADAS ([039], cláusula de descarte
// do Bruno — julgadas de olho, não somaram). O #duat-canvas segue no HTML, mas
// inerte; se algum dia outra coisa usar a camada, o canvas já está lá.

"use strict";

// Refs e estado do módulo. Reatribuídos a cada montagem (View Transitions
// recriam o DOM da Recepção); por isso as refs vivem no escopo do módulo e não
// em captura de listener antigo.
let overlay, conteudo, s777;
let progressoAtual = 0;
let settecentoCongelado = false;
let jaFechando = false;
let stroboAbrir = null; // strobo do 777 enquanto aberto
let globaisLigados = false; // strobo contínuo + limpeza de hash: uma vez só

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

  if (!stroboAbrir) {
    stroboAbrir = setInterval(() => {
      if (Math.random() > 0.95) s777.classList.toggle("strobo-painel");
    }, 80);
  }
}

function fecharDuat() {
  overlay.classList.add("fechando");

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

/* ── globais (uma vez): strobo contínuo do 777 + limpeza de hash ─── */
function ligarGlobais() {
  if (globaisLigados) return; // window sobrevive à navegação do Astro
  globaisLigados = true;

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
 * novos.
 */
export function iniciarDuat() {
  const el = document.getElementById("duat-overlay");
  if (!el) return; // checagem de página
  if (el.dataset.duatLigado) return; // idempotência por nó
  el.dataset.duatLigado = "1";

  overlay = el;
  conteudo = document.getElementById("duat-content");
  s777 = document.getElementById("duat-777");

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
