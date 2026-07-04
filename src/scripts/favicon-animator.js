// Anima o favicon GIF nos browsers que só renderizam o primeiro frame
// (Chrome, Edge). O truque: decodificar os frames do GIF via WebCodecs e
// trocar o href do <link rel="icon"> no ritmo de cada frame.

// Delay mínimo por frame: browsers historicamente tratam delays de GIF
// menores que isso como 100ms; abaixo de 20ms a troca vira ruído.
const DELAY_MINIMO_MS = 20;
const TAMANHO_FAVICON = 32;

// Flag de módulo: sobrevive às navegações do ClientRouter, então o loop
// de animação só nasce uma vez por sessão.
let animando = false;

/**
 * Ponto de entrada público: idempotente — pode ser chamado a cada
 * astro:page-load sem duplicar o loop de animação.
 *
 * Não faz nada quando: o browser é Firefox (ele anima GIF no favicon
 * nativamente), não há suporte a ImageDecoder (Safari — fica o frame
 * estático), ou o favicon atual não é um GIF.
 */
export async function iniciarFaviconAnimado() {
  if (animando) return;

  if (navigator.userAgent.includes("Firefox")) return;
  if (typeof ImageDecoder === "undefined") return;

  const link = document.querySelector('link[rel="icon"]');
  if (!link || !new URL(link.href).pathname.toLowerCase().endsWith(".gif")) {
    return;
  }

  let frames;
  try {
    frames = await decodificarFrames(link.href);
  } catch {
    // Qualquer falha (fetch, GIF corrompido): favicon estático, em silêncio
    return;
  }
  if (frames.length < 2) return;

  animando = true;
  animar(frames);
}

// Decodifica o GIF inteiro para uma lista de { url, delay }, com cada
// frame já composto e redimensionado para o tamanho de favicon.
async function decodificarFrames(url) {
  const resposta = await fetch(url);
  const decoder = new ImageDecoder({
    data: await resposta.arrayBuffer(),
    type: "image/gif",
  });
  await decoder.tracks.ready;

  const canvas = document.createElement("canvas");
  canvas.width = TAMANHO_FAVICON;
  canvas.height = TAMANHO_FAVICON;
  const ctx = canvas.getContext("2d");

  const frames = [];
  const total = decoder.tracks.selectedTrack.frameCount;
  for (let i = 0; i < total; i++) {
    const { image } = await decoder.decode({ frameIndex: i });
    ctx.clearRect(0, 0, TAMANHO_FAVICON, TAMANHO_FAVICON);
    ctx.drawImage(image, 0, 0, TAMANHO_FAVICON, TAMANHO_FAVICON);
    frames.push({
      url: canvas.toDataURL("image/png"),
      // duration vem em microssegundos; 0 = GIF sem delay declarado
      delay: Math.max(image.duration / 1000 || 100, DELAY_MINIMO_MS),
    });
    image.close();
  }
  decoder.close();
  return frames;
}

function animar(frames) {
  let indice = 0;
  let timer;

  const proximoFrame = () => {
    // Aba oculta: os timers já são estrangulados a 1/s pelo browser —
    // pausar aqui evita trabalho inútil; visibilitychange retoma abaixo
    if (document.hidden) return;

    // Reconsulta o <link> a cada frame: o ClientRouter pode substituir
    // o <head> na navegação, invalidando qualquer referência guardada
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = frames[indice].url;

    timer = setTimeout(proximoFrame, frames[indice].delay);
    indice = (indice + 1) % frames.length;
  };

  proximoFrame();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      clearTimeout(timer);
      proximoFrame();
    }
  });
}
