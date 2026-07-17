// crt-effects.js — efeitos analógicos do monitor CRT: noise de fósforo,
// rolo variável, jitter e curvatura de bordas.
//
// Adaptado do nucleo/js/crt-effects.js vanilla ao padrão de efeitos da
// refundação ([006]): export iniciar*(), guarda de idempotência, checagem
// de página, teardown. A MATEMÁTICA dos efeitos (noise, curvatura, rolo)
// é cópia fiel do vanilla — o comportamento é canônico e não se reescreve.
// O que muda é só o CICLO DE VIDA: no vanilla o motor subia uma vez no
// DOMContentLoaded e vivia para sempre; aqui ele precisa conviver com a
// navegação por View Transitions (a página troca sem reload), então ganhou
// um ponto de entrada re-chamável e um desligamento limpo.

"use strict";

const CFG = {
  noiseIntensity: 2,
  noiseFrameRate: 12,
  jitterMax: 20,
  jitterChance: 0.06,
  rollSpeedMin: 5000,
  rollSpeedMax: 13000,
  rollPauseChance: 0.25,
  grainR: 20,
  grainG: 253,
  grainB: 206,
  // Curvatura de bordas
  bordaCurva: 22, // px de curvatura das bordas (aumenta para mais efeito)
  bordaEscuridao: 0.82, // opacidade máxima do escurecimento radial (0-1)
};

// Estado do módulo. No vanilla isto vivia dentro de um IIFE (CRTEffects);
// num módulo ES o próprio escopo do arquivo já é privado, então as mesmas
// variáveis viram `let` de topo — visíveis só aqui dentro.
let canvas, ctx, tela, roll;
let canvasBorda, ctxBorda;
let w = 0,
  h = 0;
let running = false;
let lastNoise = 0;

// Handles dos laços vivos — guardados para poder DESLIGAR tudo no teardown.
// O vanilla nunca precisou disto (a página nunca era descartada sem reload);
// com View Transitions, uma navegação SEM persist troca o DOM por baixo e,
// se não desligarmos, os laços antigos continuam rodando apontando para nós
// mortos — vazamento (critério d do spike: nada pode acumular).
let rafId = 0; // requestAnimationFrame do noise
let jitterId = 0; // setInterval do jitter
let roloId = 0; // setTimeout encadeado do rolo
let ro = null; // ResizeObserver da tela

const noiseInterval = 1000 / CFG.noiseFrameRate;

/* ── Redimensiona ambos os canvas ──────────────────────── */
function redimensionar() {
  const r = tela.getBoundingClientRect();
  w = Math.round(r.width);
  h = Math.round(r.height);

  canvas.width = w;
  canvas.height = h;
  canvasBorda.width = w;
  canvasBorda.height = h;

  // Redesenha a curvatura sempre que o tamanho mudar
  desenharCurvaturaBordas();
}

/* ── Loop: só o noise roda em animação contínua ────────── */
function loop(ts) {
  if (!running) return; // teardown zera `running` → o laço morre no próximo quadro
  if (ts - lastNoise >= noiseInterval) {
    desenharNoise();
    lastNoise = ts;
  }
  rafId = requestAnimationFrame(loop);
}

/* ── Noise de fósforo ──────────────────────────────────── */
// Pinta ruído por pixel num ImageData do tamanho da tela. A amplitude cresce
// do centro (0.3) para as bordas (até 1.4), imitando um tubo que "chia" mais
// nos cantos; os canais R/G/B são puxados para o verde-menta do fósforo e o
// alfa é esparso (só ~45% dos pixels acendem) para dar granulado, não névoa.
function desenharNoise() {
  if (!ctx || w === 0) return;
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const amp = CFG.noiseIntensity * 255;
  const cx = w / 2,
    cy = h / 2;

  for (let i = 0; i < data.length; i += 4) {
    const px = (i / 4) % w;
    const py = Math.floor(i / 4 / w);
    const dx = (px - cx) / cx;
    const dy = (py - cy) / cy;
    const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    const localAmp = amp * (0.3 + dist * 1.1);
    const v = (Math.random() * 2 - 1) * localAmp;
    data[i] = Math.max(0, CFG.grainR * 0.03 + v * 0.04);
    data[i + 1] = Math.max(0, CFG.grainG * 0.1 + v * 0.85);
    data[i + 2] = Math.max(0, CFG.grainB * 0.14 + v * 0.82);
    data[i + 3] = Math.random() < 0.45 ? Math.round(Math.abs(v) * 1.6) : 0;
  }
  ctx.putImageData(img, 0, 0);
}

/* ── Curvatura de bordas — roda só uma vez / no resize ─── */
// Ao contrário do noise, isto é estático: desenha uma vinheta radial + linhas
// quadráticas escuras nas quatro bordas + reforço nos cantos, fingindo a
// superfície convexa do vidro. Só é redesenhado quando a tela muda de tamanho.
function desenharCurvaturaBordas() {
  if (!ctxBorda || w === 0) return;
  ctxBorda.clearRect(0, 0, w, h);

  const c = CFG.bordaCurva;
  const esc = CFG.bordaEscuridao;

  // Escurecimento radial: reforça ilusão de superfície convexa
  const grad = ctxBorda.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.28,
    w / 2,
    h / 2,
    Math.min(w, h) * 0.88,
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.55, "rgba(0,0,0,0)");
  grad.addColorStop(0.78, `rgba(0,0,0,${esc * 0.4})`);
  grad.addColorStop(1, `rgba(0,0,0,${esc})`);
  ctxBorda.fillStyle = grad;
  ctxBorda.fillRect(0, 0, w, h);

  // Bordas curvadas escuras (linhas quadráticas)
  ctxBorda.strokeStyle = "rgba(0,0,0,0.9)";
  ctxBorda.lineWidth = c * 1.8;
  ctxBorda.lineCap = "round";

  // Superior
  ctxBorda.beginPath();
  ctxBorda.moveTo(0, 0);
  ctxBorda.quadraticCurveTo(w / 2, c, w, 0);
  ctxBorda.stroke();

  // Inferior
  ctxBorda.beginPath();
  ctxBorda.moveTo(0, h);
  ctxBorda.quadraticCurveTo(w / 2, h - c, w, h);
  ctxBorda.stroke();

  // Esquerda
  ctxBorda.beginPath();
  ctxBorda.moveTo(0, 0);
  ctxBorda.quadraticCurveTo(c, h / 2, 0, h);
  ctxBorda.stroke();

  // Direita
  ctxBorda.beginPath();
  ctxBorda.moveTo(w, 0);
  ctxBorda.quadraticCurveTo(w - c, h / 2, w, h);
  ctxBorda.stroke();

  // Cantos: reforço extra de escurecimento
  const corners = [
    [0, 0, w * 0.22, h * 0.22],
    [w, 0, w * 0.78, h * 0.22],
    [0, h, w * 0.22, h * 0.78],
    [w, h, w * 0.78, h * 0.78],
  ];
  corners.forEach(([x1, y1, x2, y2]) => {
    const gCanto = ctxBorda.createRadialGradient(x1, y1, 0, x1, y1, w * 0.28);
    gCanto.addColorStop(0, `rgba(0,0,0,${esc * 0.7})`);
    gCanto.addColorStop(0.5, `rgba(0,0,0,${esc * 0.2})`);
    gCanto.addColorStop(1, "rgba(0,0,0,0)");
    ctxBorda.fillStyle = gCanto;
    ctxBorda.fillRect(0, 0, w, h);
  });
}

/* ── Rolo ──────────────────────────────────────────────── */
// Uma faixa horizontal (.crt-roll, animada em CSS) que desce a tela. Aqui só
// variamos a DURAÇÃO da animação e, com 25% de chance, inserimos uma pausa —
// dá o ritmo irregular de sincronia vertical falhando. É um setTimeout que se
// reagenda; a guarda `running` corta a corrente no teardown.
function agendarRolo() {
  if (!running || !roll) return;
  const dur =
    CFG.rollSpeedMin + Math.random() * (CFG.rollSpeedMax - CFG.rollSpeedMin);
  roll.style.animationDuration = dur + "ms";
  if (Math.random() < CFG.rollPauseChance) {
    const pausa = 600 + Math.random() * 2000;
    roll.style.animationPlayState = "paused";
    roloId = setTimeout(() => {
      roll.style.animationPlayState = "running";
      roloId = setTimeout(agendarRolo, dur * 0.7);
    }, pausa);
  } else {
    roloId = setTimeout(agendarRolo, dur + Math.random() * 1500);
  }
}

/* ── Jitter ────────────────────────────────────────────── */
// A cada 120ms, com 6% de chance, empurra o conteúdo (#monitor-target) alguns
// px na horizontal e devolve — o "tranco" de imagem instável.
// Adaptação de ciclo de vida: o vanilla capturava #monitor-target UMA vez no
// init. Aqui o alvo é buscado A CADA disparo, porque com persist a camada de
// efeito sobrevive à navegação mas o #monitor-target (conteúdo) é trocado —
// a referência antiga apontaria para um nó já descartado.
function iniciarJitter() {
  jitterId = setInterval(() => {
    if (!running) return;
    const target = document.getElementById("monitor-target");
    if (!target) return;
    if (Math.random() < CFG.jitterChance) {
      const offset = (Math.random() * 2 - 1) * CFG.jitterMax;
      target.style.transform = `translateX(${offset}px)`;
      setTimeout(
        () => {
          target.style.transform = "translateX(0)";
        },
        16 + Math.random() * 32,
      );
    }
  }, 120);
}

/* ── Montagem ──────────────────────────────────────────── */
// Era o `init()` do vanilla. Encontra (ou cria) os canvas e o rolo dentro da
// tela, mede, e liga os quatro laços. Pressupõe que `tela` já foi resolvida
// por iniciarCRT().
function montar() {
  // Canvas de noise — reaproveita o do HTML se existir (é o nosso caso, os
  // nós são estáticos no layout e persistidos); senão cria, como no vanilla.
  canvas = document.getElementById("crt-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "crt-canvas";
    tela.appendChild(canvas);
  }

  // Canvas de curvatura de bordas (separado)
  canvasBorda = document.getElementById("crt-canvas-borda");
  if (!canvasBorda) {
    canvasBorda = document.createElement("canvas");
    canvasBorda.id = "crt-canvas-borda";
    tela.appendChild(canvasBorda);
  }

  // Rolo
  roll = tela.querySelector(".crt-roll");
  if (!roll) {
    roll = document.createElement("div");
    roll.className = "crt-roll";
    tela.appendChild(roll);
  }

  ctx = canvas.getContext("2d");
  ctxBorda = canvasBorda.getContext("2d");

  redimensionar();
  // ResizeObserver dispara uma vez já na observação (corrige medidas se a
  // tela ainda estava com tamanho 0 na montagem) e a cada mudança depois —
  // por isso o setTimeout(400) do vanilla, que só existia para "esperar o
  // layout assentar", deixou de ser necessário.
  ro = new ResizeObserver(redimensionar);
  ro.observe(tela);

  running = true;
  requestAnimationFrame(loop); // primeiro quadro; loop() já regrava rafId
  agendarRolo();
  iniciarJitter();
}

/* ── Teardown ──────────────────────────────────────────── */
// Desliga tudo o que montar() ligou. Chamado antes de remontar quando a tela
// foi trocada sem persist (nós antigos descartados). Novo em relação ao
// vanilla, que nunca precisou parar.
function parar() {
  running = false;
  cancelAnimationFrame(rafId);
  clearInterval(jitterId);
  clearTimeout(roloId);
  if (ro) {
    ro.disconnect();
    ro = null;
  }
}

/**
 * Ponto de entrada público, idempotente — pode ser chamado a cada
 * astro:page-load.
 *
 * Três cenários:
 *  - página sem CRT → sai (checagem de página: sem #tela-tubo, nada a fazer);
 *  - CRT persistido (transition:persist) → a mesma tela e os mesmos canvas
 *    sobreviveram à navegação e os laços continuam vivos: NÃO faz nada, para
 *    o efeito não piscar (o ideal — critérios a/b/d do spike);
 *  - CRT recriado (sem persist) → há um #tela-tubo novo mas os laços antigos
 *    apontam para nós mortos: desliga (parar) e remonta na tela nova.
 */
export function iniciarCRT() {
  const t = document.getElementById("tela-tubo");
  if (!t) return; // checagem de página

  // `canvas` (nó da montagem anterior) ainda dentro da tela atual ⇒ persistiu:
  // laços vivos sobre nós vivos, não mexer.
  if (running && canvas && t.contains(canvas)) return;

  parar(); // encerra laços órfãos de uma tela que foi descartada
  tela = t;
  montar();
}
