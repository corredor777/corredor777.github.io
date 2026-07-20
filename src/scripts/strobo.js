// Strobo — inversões e flashes guiados pelo movimento do mouse.
// Três texturas da mesma família:
//   stroboGlobal     — a página inteira alterna (gabarito: intro.js do vanilla)
//   stroboVelocidade — chance proporcional à velocidade do mouse, alterna
//                      (gabarito: main.js, painel de monitoramento)
//   stroboFlash      — liga com probabilidade fixa, senão desliga
//                      (gabarito: main.js, texto do log)

// Guarda do strobo global: os listeners vivem em document/window e
// sobrevivem às navegações do ClientRouter — registram uma vez só.
let globalLigado = false;
let invertido = false;

/**
 * Inversão da página inteira por movimento de mouse.
 * Idempotente: pode ser chamada a cada astro:page-load — a limpeza roda em
 * toda visita, os listeners registram uma única vez.
 *
 * @param {Object} [opcoes]
 * @param {string} [opcoes.classe="negativo"] Classe aplicada no <html>.
 * @param {number} [opcoes.limiar=0.7] Agressividade do flash
 *   (0.9 = menos flash, 0.5 = muito flash).
 */
export function stroboGlobal({ classe = "negativo", limiar = 0.7 } = {}) {
  const raiz = document.documentElement;

  // Limpeza ANTES da guarda, em toda visita: cobre a volta via
  // bfcache/histórico com a página congelada em estado invertido —
  // beforeunload não dispara nesse tipo de saída
  raiz.classList.remove(classe);
  invertido = false;

  if (globalLigado) return;
  globalLigado = true;

  document.addEventListener("mousemove", () => {
    if (Math.random() > limiar) {
      if (!invertido) {
        raiz.classList.add(classe);
        invertido = true;
      } else {
        raiz.classList.remove(classe);
        invertido = false;
      }
    }
  });

  const limpar = () => {
    raiz.classList.remove(classe);
    invertido = false;
  };

  // Garante que o estado negativo seja limpo se o mouse sair da janela
  document.addEventListener("mouseleave", limpar);

  // pageshow dispara no load normal E na restauração via bfcache (voltar
  // pelo histórico) — o caminho em que o estado invertido persistiria
  window.addEventListener("pageshow", limpar);
}

/**
 * Alternância com chance proporcional à velocidade do mouse: quanto mais
 * rápido o movimento sobre o alvo, mais frenético o strobo.
 *
 * Liga listeners no próprio elemento — que morre junto com a página na
 * navegação, então não precisa de guarda.
 *
 * @param {Element} alvo Elemento que recebe o efeito.
 * @param {Object} opcoes
 * @param {string} opcoes.classe Classe alternada no alvo.
 * @param {number} [opcoes.sensibilidade=0.1] Multiplicador da velocidade.
 */
export function stroboVelocidade(alvo, { classe, sensibilidade = 0.1 } = {}) {
  // Última posição do mouse para calcular a velocidade
  let ultimoX = 0;
  let ultimoY = 0;

  alvo.addEventListener("mousemove", (e) => {
    // Distância percorrida desde o último movimento, por Pitágoras
    const deltaX = Math.abs(e.clientX - ultimoX);
    const deltaY = Math.abs(e.clientY - ultimoY);
    const velocidade = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    ultimoX = e.clientX;
    ultimoY = e.clientY;

    // Se a velocidade ultrapassar o limiar de probabilidade, alterna
    if (Math.random() < velocidade * sensibilidade) {
      alvo.classList.toggle(classe);
    }
  });

  // Remove o efeito ao sair para não travar no estado invertido
  alvo.addEventListener("mouseleave", () => {
    alvo.classList.remove(classe);
  });
}

/**
 * A cada movimento sobre o alvo: com probabilidade `chance` LIGA a classe,
 * senão DESLIGA. Liga/desliga, não alternância — na maior parte do tempo o
 * estado é re-forçado a "desligado", produzindo flashes curtos (textura
 * intencionalmente diferente do vaivém do stroboVelocidade).
 *
 * @param {Element} alvo Elemento que dispara o efeito (recebe os listeners).
 * @param {Object} opcoes
 * @param {string} opcoes.classe Classe ligada/desligada.
 * @param {string|null} [opcoes.seletorFilhos=null] Se passado, a classe vai
 *   nos filhos do alvo que casarem com o seletor; senão, no próprio alvo.
 * @param {number} [opcoes.chance=0.2] Probabilidade de LIGAR a cada evento.
 */
export function stroboFlash(
  alvo,
  { classe, seletorFilhos = null, chance = 0.2 } = {},
) {
  const alvos = () =>
    seletorFilhos ? alvo.querySelectorAll(seletorFilhos) : [alvo];

  alvo.addEventListener("mousemove", () => {
    const ligar = Math.random() < chance;
    for (const el of alvos()) {
      el.classList.toggle(classe, ligar);
    }
  });

  // Reseta o estado quando o mouse sai do alvo
  alvo.addEventListener("mouseleave", () => {
    for (const el of alvos()) {
      el.classList.remove(classe);
    }
  });
}
