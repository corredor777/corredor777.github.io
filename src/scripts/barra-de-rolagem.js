// Barra de rolagem de DOM: substitui a scrollbar nativa de um container.
// Sobre scrollbar nativa o browser sempre desenha a seta do sistema — o CSS
// `cursor` é ignorado ali, mesmo estilizada. Trilho e polegar como elementos
// reais respondem ao cursor-manager como qualquer outro nó da página.
// Cores por variável CSS: --barra-cor (polegar) e --barra-fundo (trilho).

const LARGURA = 5; // px — equivalente visual do scrollbar-width: thin
const ALTURA_MINIMA_POLEGAR = 80; // px — polegar clicável mesmo em conteúdo longo

// Referências vivas ao container e à barra atuais. Vivem fora das funções
// para que os listeners de document (ligados uma vez) sempre enxerguem a
// página atual, mesmo quando o ClientRouter descarta o <body> antigo.
let alvo = null;
let trilho = null;
let polegar = null;
let observador = null;

// Estado do arrasto — lido pelos listeners de document
let arrastando = false;
let arrastoInicioY = 0;
let arrastoInicioScroll = 0;

let listenersLigados = false;

/**
 * Ponto de entrada público: cria (ou recria) a barra para o container
 * indicado. Idempotente — pode ser chamado a cada astro:page-load; a barra
 * e o observador da página anterior são descartados antes de recriar.
 *
 * @param {string} seletor Container rolável (ex.: ".content"). A scrollbar
 *   nativa dele deve estar escondida via CSS (scrollbar-width: none).
 */
export function iniciarBarraDeRolagem(seletor) {
  const novoAlvo = document.querySelector(seletor);
  if (!novoAlvo) return;

  observador?.disconnect();
  if (trilho?.isConnected) trilho.remove();
  arrastando = false;

  alvo = novoAlvo;
  injetarEstilo();
  montarBarra();
  ligarListenersGlobais();
  atualizar();
}

function injetarEstilo() {
  if (document.getElementById("barra-rolagem-estilo")) return;
  const estilo = document.createElement("style");
  estilo.id = "barra-rolagem-estilo";
  estilo.innerHTML = `
    .barra-rolagem {
      position: absolute;
      width: ${LARGURA}px;
      background: var(--barra-fundo, transparent);
      z-index: 10;
    }
    .barra-rolagem-polegar {
      width: 100%;
      background: transparent;
      box-shadow: 0 0 30px var(--barra-cor-glow);
      transition: box-shadow .2s;
      
    }
    .barra-rolagem-polegar:hover, .barra-rolagem-polegar:active {
      background: var(--barra-cor, #cccccc);
      box-shadow: 0 0 10px transparent;
    }
  `;
  document.head.appendChild(estilo);
}

function montarBarra() {
  // O trilho é irmão do container, posicionado sobre a borda direita dele —
  // dentro do container ele rolaria junto com o conteúdo
  const pai = alvo.parentElement;
  if (getComputedStyle(pai).position === "static") {
    pai.style.position = "relative";
  }

  trilho = document.createElement("div");
  trilho.className = "barra-rolagem";
  polegar = document.createElement("div");
  polegar.className = "barra-rolagem-polegar cur-none";
  trilho.appendChild(polegar);
  pai.appendChild(trilho);

  alvo.addEventListener("scroll", atualizar, { passive: true });

  // Segue mudanças de tamanho do container e do conteúdo (imagens
  // carregando, seções crescendo) sem depender do evento load
  observador = new ResizeObserver(atualizar);
  observador.observe(alvo);
  if (alvo.firstElementChild) observador.observe(alvo.firstElementChild);

  polegar.addEventListener("mousedown", (e) => {
    e.preventDefault(); // sem seleção de texto durante o arrasto
    arrastando = true;
    arrastoInicioY = e.clientY;
    arrastoInicioScroll = alvo.scrollTop;
    // Arrasto precisa ser 1:1 — o scroll-behavior: smooth do CSS
    // transformaria cada movimento em animação atrasada
    alvo.style.scrollBehavior = "auto";
  });

  trilho.addEventListener("mousedown", (e) => {
    if (e.target === polegar) return;
    // Salto: centra o polegar no ponto clicado (o smooth do CSS anima)
    const caixa = trilho.getBoundingClientRect();
    const curso = alvo.clientHeight - polegar.offsetHeight;
    if (curso <= 0) return;
    const y = e.clientY - caixa.top - polegar.offsetHeight / 2;
    const rolavel = alvo.scrollHeight - alvo.clientHeight;
    alvo.scrollTop = (Math.min(Math.max(y, 0), curso) / curso) * rolavel;
  });
}

function ligarListenersGlobais() {
  if (listenersLigados) return;
  listenersLigados = true;

  document.addEventListener("mousemove", (e) => {
    if (!arrastando || !alvo) return;
    const rolavel = alvo.scrollHeight - alvo.clientHeight;
    const curso = alvo.clientHeight - polegar.offsetHeight;
    if (curso <= 0) return;
    alvo.scrollTop =
      arrastoInicioScroll + ((e.clientY - arrastoInicioY) / curso) * rolavel;
  });

  document.addEventListener("mouseup", () => {
    if (!arrastando) return;
    arrastando = false;
    alvo.style.scrollBehavior = "";
  });

  window.addEventListener("resize", atualizar);
}

function atualizar() {
  if (!alvo || !trilho?.isConnected) return;

  const rolavel = alvo.scrollHeight - alvo.clientHeight;
  trilho.style.display = rolavel > 0 ? "block" : "none";
  if (rolavel <= 0) return;

  // Trilho colado à borda direita do container, na altura visível dele
  trilho.style.left = alvo.offsetLeft + alvo.offsetWidth - LARGURA + "px";
  trilho.style.top = alvo.offsetTop + "px";
  trilho.style.height = alvo.clientHeight + "px";

  const alturaPolegar = Math.max(
    (alvo.clientHeight / alvo.scrollHeight) * alvo.clientHeight,
    ALTURA_MINIMA_POLEGAR,
  );
  const curso = alvo.clientHeight - alturaPolegar;
  polegar.style.height = alturaPolegar + "px";
  polegar.style.transform = `translateY(${(alvo.scrollTop / rolavel) * curso}px)`;
}
