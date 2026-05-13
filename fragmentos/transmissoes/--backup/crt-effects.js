/**
 * TRANSMISSÕES ∴ CORREDOR 777
 * crt-effects.js
 *
 * Motor de efeitos analógicos via canvas.
 * Roda em requestAnimationFrame mas com throttle inteligente:
 * noise e aberração atualizam a ~12fps para parecer analógico,
 * não digital.
 *
 * Efeitos implementados:
 *   1. Noise analógico (grain de fósforo)
 *   2. Aberração cromática pixel-level nas bordas
 *   3. Variação estocástica do rolo de interferência
 *   4. Micro-jitter horizontal (instabilidade de sinal)
 */

'use strict';

const CRTEffects = (() => {

    /* ── Config ─────────────────────────────────────────────── */
    const CFG = {
        noiseIntensity:    0.04,   // 0–1: intensidade do grain
        noiseFrameRate:    12,      // fps do noise (analógico ≠ 60fps)
        jitterMax:         1.5,     // px máx de jitter horizontal
        jitterProbability: 0.08,    // chance de jitter por frame
        rollSpeedMin:      5000,    // ms por ciclo mínimo
        rollSpeedMax:      12000,   // ms por ciclo máximo
        rollPause:         true,    // pausa aleatória entre rolos
        rollPauseChance:   0.2,     // probabilidade de pausa
    };

    /* ── Estado interno ──────────────────────────────────────── */
    let canvas, ctx, screen, roll;
    let w = 0, h = 0;
    let running   = false;
    let lastNoise  = 0;
    let noiseInterval = 1000 / CFG.noiseFrameRate;
    let jitterOffset = 0;

    /* ── Init ────────────────────────────────────────────────── */
    function init() {
        canvas = document.getElementById('crt-canvas');
        screen = document.getElementById('monitor-screen');
        roll   = document.querySelector('.crt-roll');

        if (!canvas || !screen) return;

        ctx = canvas.getContext('2d');
        redimensionar();

        // Observa mudanças de tamanho (raro, mas seguro)
        new ResizeObserver(redimensionar).observe(screen);

        // Variação aleatória da velocidade do rolo
        agendarProximoRolo();

        running = true;
        requestAnimationFrame(loop);

        // Micro-jitter: CSS transform no monitor-target
        iniciarJitter();
    }

    function redimensionar() {
        const rect = screen.getBoundingClientRect();
        w = canvas.width  = Math.round(rect.width);
        h = canvas.height = Math.round(rect.height);
    }

    /* ── Loop principal ──────────────────────────────────────── */
    function loop(ts) {
        if (!running) return;

        // Noise: atualiza só na frequência alvo
        if (ts - lastNoise >= noiseInterval) {
            desenharNoise();
            lastNoise = ts;
        }

        requestAnimationFrame(loop);
    }

    /* ── Noise analógico ─────────────────────────────────────── */
    function desenharNoise() {
        if (!ctx || w === 0) return;

        const img  = ctx.createImageData(w, h);
        const data = img.data;
        const len  = data.length;
        const amp  = Math.round(CFG.noiseIntensity * 255);

        // Gera grain: pixels aleatórios com canal alpha variável
        // Concentra o grain nas bordas (simula degradação de fósforo)
        const cx = w / 2, cy = h / 2;

        for (let i = 0; i < len; i += 4) {
            const px  = (i / 4) % w;
            const py  = Math.floor((i / 4) / w);

            // Distância normalizada ao centro (0=centro, 1=borda)
            const dx  = (px - cx) / cx;
            const dy  = (py - cy) / cy;
            const dist = Math.min(1, Math.sqrt(dx*dx + dy*dy));

            // Grain mais intenso nas bordas
            const localAmp = amp * (0.4 + dist * 0.9);
            const v = (Math.random() * 2 - 1) * localAmp;

            // Grain monocromático com leve tint esverdeado (fósforo)
            data[i]   = Math.max(0, v * 0.85);       // R
            data[i+1] = Math.max(0, v * 1.05);       // G (ligeiramente mais)
            data[i+2] = Math.max(0, v * 0.70);       // B (menos)
            data[i+3] = Math.random() < 0.5 ? Math.round(Math.abs(v) * 1.8) : 0;
        }

        ctx.putImageData(img, 0, 0);
    }

    /* ── Rolo de interferência: velocidade variável ──────────── */
    function agendarProximoRolo() {
        if (!roll) return;

        // Velocidade aleatória dentro do range
        const dur = CFG.rollSpeedMin + Math.random() * (CFG.rollSpeedMax - CFG.rollSpeedMin);
        roll.style.animationDuration = dur + 'ms';

        // Pausa aleatória: suspende temporariamente
        if (CFG.rollPause && Math.random() < CFG.rollPauseChance) {
            const pausaMs = 800 + Math.random() * 2400;
            roll.style.animationPlayState = 'paused';
            setTimeout(() => {
                roll.style.animationPlayState = 'running';
                // Reagenda com novo delay
                setTimeout(agendarProximoRolo, dur * 0.6 + Math.random() * dur * 0.4);
            }, pausaMs);
        } else {
            setTimeout(agendarProximoRolo, dur + Math.random() * 2000);
        }
    }

    /* ── Micro-jitter horizontal ─────────────────────────────── */
    function iniciarJitter() {
        const target = document.getElementById('monitor-target');
        if (!target) return;

        setInterval(() => {
            if (!running) return;

            if (Math.random() < CFG.jitterProbability) {
                // Aplica jitter
                const offset = (Math.random() * 2 - 1) * CFG.jitterMax;
                target.style.transform = `translateX(${offset}px)`;

                // Remove após 1–3 frames (~16-48ms)
                const dur = 16 + Math.random() * 32;
                setTimeout(() => {
                    target.style.transform = 'translateX(0)';
                }, dur);
            }
        }, 100); // checa a cada 100ms
    }

    /* ── Controle externo ────────────────────────────────────── */
    function pausar() { running = false; }

    function retomar() {
        if (!running) {
            running = true;
            requestAnimationFrame(loop);
        }
    }

    /* ── Expõe API mínima ────────────────────────────────────── */
    return { init, pausar, retomar, CFG };

})();

// Inicializa quando o DOM estiver pronto
// (este script é carregado depois do transmissoes.js)
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda o monitor ligar antes de rodar os efeitos pesados
    // Usa MutationObserver para detectar quando .screen-on é adicionado
    const screen = document.getElementById('monitor-screen');
    if (!screen) return;

    const obs = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                if (screen.classList.contains('screen-on') ||
                    screen.classList.contains('screen-boot')) {
                    CRTEffects.init();
                    obs.disconnect(); // init uma só vez
                }
            }
        });
    });

    obs.observe(screen, { attributes: true });
});