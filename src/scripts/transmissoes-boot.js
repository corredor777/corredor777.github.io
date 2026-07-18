// transmissoes-boot.js — sequência de boot do monitor CRT (POST de BIOS falso +
// mensagem de recepção). Portada verbatim do transmissoes-controle.js vanilla;
// só o ciclo de vida muda (padrão de efeitos [006]): export iniciarBoot(),
// checagem de página, guarda de idempotência por nó (data-booted), religação
// via astro:page-load feita na casca. O CONTROLE (navegação/injeção) é a d3 —
// aqui só o boot da ENTRADA.

const BOOT_MSGS = [
  // --- SEGMENTO 1: POST DA BIOS (Hardware) ---
  { texto: "BIOS ROM PCI/ISA (v2A59CF08)", classe: "dim", delay: 0 },
  {
    texto: "Direitos Reservados (C) 1997-2026, Abzu & Co.",
    classe: "dim",
    delay: 80,
    opacity: "0.4",
  },
  {
    texto: "Instalação: Unidade de Transmissão Corredor 777",
    classe: "dim",
    delay: 160,
  },
  { texto: "", classe: "", delay: 200 },
  { texto: "CPU: PROCESSADOR TIAMAT-CORE @ 777MHz", classe: "", delay: 350 },
  { texto: "Teste de Memória: 299792K OK", classe: "", delay: 600 },
  {
    texto: "BUS: Verificando integridade dos pilares...",
    classe: "dim",
    delay: 750,
    opacity: "0.4",
  },
  { texto: "", classe: "", delay: 800 },

  // --- SEGMENTO 2: DETECÇÃO DE UNIDADES (BIOS) ---
  {
    texto: "Detectando Disco Rígido Principal... [CORREDOR_777.DAT]",
    classe: "dim",
    delay: 950,
  },
  {
    texto: "Detectando Unidade Secundária... Nenhuma",
    classe: "dim",
    delay: 1050,
  },
  {
    texto: "Monitor: Fósforo P39 (Verde Esmeralda) ... [OK]",
    classe: "ok",
    delay: 1150,
  },
  { texto: "", classe: "", delay: 1250 },

  // --- SEGMENTO 3: CARREGAMENTO DO NÚCLEO (SISTEMA) ---
  { texto: "Iniciando Núcleo CORREDOR v7.7.7...", classe: "ok", delay: 1400 },
  {
    texto: "Sinal Liminar: Detectado e Sincronizado.",
    classe: "ok",
    delay: 1550,
    opacity: "0.4",
  },
  { texto: "", classe: "", delay: 1650 },

  // --- SEGMENTO 4: CONFIG.SYS (Controladores de Sistema) ---
  {
    texto: "MEM_ALTA: Testando memória estendida... pronto.",
    classe: "dim",
    delay: 1800,
  },
  { texto: "DEVICE=C:\\DOS\\TRANSMISSOES.SYS", classe: "", delay: 1950 },
  { texto: "DEVICE=C:\\DOS\\FRAGMENTOS.SYS", classe: "", delay: 2100 },
  {
    texto: "SND: Driver de Ressonância Estática ... [OK]",
    classe: "ok",
    delay: 2250,
  },

  // --- SEGMENTO 5: AUTOEXEC.BAT (Rotina de Partida) ---
  {
    texto: "C:\\>DEFINIR CAMINHO=C:\\SISTEMA;C:\\FRAGMENTOS\\SERPENTE",
    classe: "dim",
    delay: 2400,
  },
  {
    texto: "C:\\>CARREGAR_ALTO /SISTEMA/FILTRO_TIAMAT",
    classe: "",
    delay: 2600,
  },
  { texto: "C:\\>FIAT_LUX.EXE --acesso_total", classe: "ok", delay: 2800 },

  // --- SEGMENTO 6: O TERMINAL FINAL ---
  { texto: "", classe: "", delay: 2950 },
  { texto: "C:\\> [ PRONTO ] _", classe: "blink", delay: 3100 },
];

/* Fade de 150ms do #monitor-target (idêntico ao transicaoTarget do vanilla). */
async function transicaoTarget(el, fn) {
  el.style.opacity = "0";
  el.style.transition = "opacity 0.15s";
  await new Promise((r) => setTimeout(r, 150));
  await fn();
  el.style.opacity = "1";
}

async function rodarBoot() {
  const status = document.getElementById("topo-status");
  if (status) status.innerText = "STATUS: CARREGANDO";

  const bootEl = document.getElementById("boot-loader");
  if (!bootEl) return;

  // Container interno que vai subindo
  const fila = document.createElement("div");
  fila.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        height: 100%;
        overflow: hidden;
    `;
  bootEl.style.height = "100%";
  bootEl.style.overflow = "hidden";
  bootEl.appendChild(fila);

  for (let i = 0; i < BOOT_MSGS.length; i++) {
    const msg = BOOT_MSGS[i];
    const prev = BOOT_MSGS[i - 1];
    const espera = i === 0 ? 0 : msg.delay - prev.delay;

    await new Promise((r) => setTimeout(r, espera));

    const linha = document.createElement("div");
    linha.className = `boot-linha ${msg.classe}`;
    linha.textContent = msg.texto || " ";
    // Entra transparente e faz fade-in
    linha.style.cssText = "opacity:0; transition: opacity 0.12s;";
    fila.appendChild(linha);
    // Força reflow antes de animar
    linha.getBoundingClientRect();
    linha.style.opacity = msg.opacity ?? "1";
  }

  await new Promise((r) => setTimeout(r, 600));
  const target = document.getElementById("monitor-target");
  await transicaoTarget(target, () => {
    target.innerHTML = `
            <div class="boot-pronto">
                <p>Olá! Você acessou uma zona de memória persistente.</p>
                <p class="dim">Estava mantendo as luzes acesas para caso alguém aparecesse.</p>
                <br>
                <p>O que deixei espalhado por aqui é o que sobrou das minhas tentativas de dar ordem ao caos. São registros honestos, alguns sobre o que estudo, outros sobre o que sinto, todos partes de um mesmo corpo que ainda estou tentando construir.</p>
                <br>
                <p>Escolha um dos acessos abaixo para começar. Não tenha pressa, o tempo aqui dentro corre em outra frequência.</p>
                <p class="dim">Estarei por perto, ajustando as engrenagens. Pode entrar.</p>
            </div>`;
  });
  if (status) status.innerText = "STATUS: EM VIGÍLIA";

  // Nav acende ao fim do boot (durante o boot fica .nav-bloqueada — dimmed e
  // sem clique, como no publicado). Os destinos internos só ganham ação na d3.
  document
    .getElementById("terminal-nav-inferior")
    ?.classList.remove("nav-bloqueada");
}

/**
 * Ponto de entrada. Roda o boot uma vez por ENTRADA no hub. A guarda é por nó
 * (data-booted no #boot-loader): numa re-entrada via View Transitions o
 * #boot-loader é recriado (sem a marca) e o boot roda de novo — como no vanilla,
 * que bootava a cada carga vinda de fora. Sem #boot-loader, não é o hub: sai.
 */
export function iniciarBoot() {
  const bootEl = document.getElementById("boot-loader");
  if (!bootEl || bootEl.dataset.booted) return;
  bootEl.dataset.booted = "1";
  rodarBoot();
}
