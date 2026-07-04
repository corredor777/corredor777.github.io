// Objeto de cursores (adicione todos aqui)
const globalCursorMap = {
  ".cur-skeleton-hand": "/assets/images/cursor/skeleton-hand.cur",
  ".cur-draw": "/assets/images/cursor/caneta.cur",
  ".cur-chama": "/assets/images/cursor/blueflame.gif",
  ".cur-lupa": "/assets/images/cursor/lupa.gif",
  ".cur-blocked-default": "not-allowed",
  ".cur-none": "none",
  ".cur-help": "help",
  ".cur-pointer-default": "pointer",
  ".cur-eye": "/assets/images/cursor/eye.gif",
  ".cur-vscroll": "row-resize",
  ".cur-doubt": "/assets/images/cursor/doubt.gif",
  ".cur-angel": "/assets/images/cursor/angel-wings.gif",
};

// Referência viva ao <img> do cursor falso. Vive fora da função para que os
// listeners (ligados uma única vez) sempre enxerguem o elemento atual, mesmo
// quando uma troca de página descarta o <body> antigo junto com o <img>.
let fakeCursor = null;

// Listeners em document/window sobrevivem à navegação do Astro; religá-los a
// cada página os duplicaria. Esta flag garante que só ligam na primeira vez.
let listenersLigados = false;

function gerenciarCursoresGeral(mapa) {
  // 1. Cria o elemento para GIFs — ou reaproveita, se a página já tem um
  fakeCursor = document.getElementById("fake-cursor");
  if (!fakeCursor) {
    fakeCursor = document.createElement("img");
    fakeCursor.id = "fake-cursor";
    Object.assign(fakeCursor.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "99999",
      display: "none",
      width: "auto",
      height: "auto",
    });
    document.body.appendChild(fakeCursor);
  }

  // 2. CSS Global (Esconde por padrão) — injeta uma única vez
  if (!document.getElementById("cursor-manager-estilo")) {
    const estilo = document.createElement("style");
    estilo.id = "cursor-manager-estilo";
    estilo.innerHTML = `* { cursor: none !important; } html, body { cursor: none !important; min-height: 100vh; }`;
    document.head.appendChild(estilo);
  }

  // 1. Monitora quando o mouse entra em qualquer iframe
  // (a marca no dataset evita listener duplicado num iframe que
  // persistir entre navegações)
  document.querySelectorAll("iframe").forEach((iframe) => {
    if (iframe.dataset.cursorMonitorado) return;
    iframe.dataset.cursorMonitorado = "true";
    iframe.addEventListener("mouseover", () => {
      const fakeCursor = document.getElementById("fake-cursor");
      if (fakeCursor) {
        fakeCursor.style.display = "none";
      }
    });
  });

  // Daqui para baixo tudo é ligado em document/window: uma vez só
  if (listenersLigados) return;
  listenersLigados = true;

  // 2. Correção específica para o Firefox (Perda de foco da janela)
  window.addEventListener("blur", () => {
    const fakeCursor = document.getElementById("fake-cursor");
    if (fakeCursor) {
      fakeCursor.style.display = "none";
    }
  });

  // 3. Reset agressivo no mousemove (Caso o mouse passe rápido demais)
  document.addEventListener(
    "mousemove",
    (e) => {
      const fakeCursor = document.getElementById("fake-cursor");
      if (!fakeCursor) return;

      // Se o mouse estiver sobre um iframe, o Firefox às vezes ainda
      // dispara um último evento. Checamos o target aqui.
      if (e.target.tagName === "IFRAME") {
        fakeCursor.style.display = "none";
      }
    },
    { passive: true },
  );

  document.addEventListener("mousemove", (e) => {
    if (e.target.tagName === "IFRAME") {
      const fakeCursor = document.getElementById("fake-cursor");
      if (fakeCursor) fakeCursor.style.display = "none";
      return;
    }

    let valor = null;

    for (const seletor in mapa) {
      if (e.target.closest(seletor)) {
        valor = mapa[seletor];
        break;
      }
    }

    if (valor) {
      // Verifica se é um arquivo (tem ponto no nome) ou nativo
      const ehArquivo = valor.includes(".");
      const ehGIF = valor.toLowerCase().endsWith(".gif");

      if (ehArquivo) {
        if (ehGIF) {
          if (!fakeCursor.src.endsWith(valor)) fakeCursor.src = valor;
          fakeCursor.style.display = "block";
          fakeCursor.style.left = e.clientX + "px";
          fakeCursor.style.top = e.clientY + "px";
          document.documentElement.style.cursor = "none";
        } else {
          // .cur ou .png
          fakeCursor.style.display = "none";
          e.target.style.setProperty(
            "cursor",
            `url('${valor}'), auto`,
            "important",
          );
        }
      } else {
        // CURSOR NATIVO (wait, help, pointer, etc)
        fakeCursor.style.display = "none";
        e.target.style.setProperty("cursor", valor, "important");
      }
    } else {
      fakeCursor.style.display = "none";
      document.documentElement.style.cursor = "none";
    }
  });
}

// Ponto de entrada público: idempotente — pode ser chamado a cada
// astro:page-load sem duplicar o fake cursor, o estilo nem os listeners.
export function iniciarCursores() {
  gerenciarCursoresGeral(globalCursorMap);
}
