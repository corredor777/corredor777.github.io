/**
 * crt-effects.js
 * Efeitos analógicos: noise de fósforo, rolo variável, jitter, curvatura de bordas.
 */

"use strict";

const CRTEffects = (() => {
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

  let canvas, ctx, tela, roll;
  let canvasBorda, ctxBorda;
  let w = 0,
    h = 0;
  let running = false;
  let lastNoise = 0;
  const noiseInterval = 1000 / CFG.noiseFrameRate;

  /* ── Init ──────────────────────────────────────────────── */
  function init() {
    const telaId = typeof CONFIG !== "undefined" ? CONFIG.telaId : "tela-tubo";
    tela = document.getElementById(telaId);
    if (!tela) return;

    // Canvas de noise (existente)
    canvas = document.getElementById("crt-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "crt-canvas";
      tela.appendChild(canvas);
    }

    // Canvas de curvatura de bordas (novo, separado)
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
    new ResizeObserver(redimensionar).observe(tela);
    agendarRolo();
    iniciarJitter();
    running = true;
    requestAnimationFrame(loop);
  }

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

  /* ── Loop: só noise roda em animação ───────────────────── */
  function loop(ts) {
    if (!running) return;
    if (ts - lastNoise >= noiseInterval) {
      desenharNoise();
      lastNoise = ts;
    }
    requestAnimationFrame(loop);
  }

  /* ── Noise de fósforo ──────────────────────────────────── */
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
  function agendarRolo() {
    if (!roll) return;
    const dur =
      CFG.rollSpeedMin + Math.random() * (CFG.rollSpeedMax - CFG.rollSpeedMin);
    roll.style.animationDuration = dur + "ms";
    if (Math.random() < CFG.rollPauseChance) {
      const pausa = 600 + Math.random() * 2000;
      roll.style.animationPlayState = "paused";
      setTimeout(() => {
        roll.style.animationPlayState = "running";
        setTimeout(agendarRolo, dur * 0.7);
      }, pausa);
    } else {
      setTimeout(agendarRolo, dur + Math.random() * 1500);
    }
  }

  /* ── Jitter ────────────────────────────────────────────── */
  function iniciarJitter() {
    const target = document.getElementById("monitor-target");
    if (!target) return;
    setInterval(() => {
      if (!running) return;
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

  function pausar() {
    running = false;
  }
  function retomar() {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  return { init, pausar, retomar, CFG };
})();

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    CRTEffects.init();
  }, 400);
});
