// ============================================================
// [EFEITO: TICKER]
// Duplica o conteúdo do letreiro para preencher o container infinitamente
// ============================================================
const ticker = document.getElementById('frase-ticker');

if (ticker) {
    const conteudoOriginal = ticker.innerHTML;
    ticker.innerHTML = conteudoOriginal.repeat(30);

    // Função para aplicar a animação com velocidade constante
    window.addEventListener('load', () => {
        const larguraTotal = ticker.scrollWidth;
        const velocidadeNormal = 150; // pixels por segundo
        const duracaoNormal = larguraTotal / velocidadeNormal;
        const duracaoSlow = larguraTotal / (velocidadeNormal / 2); // Metade da velocidade

        // Define as variáveis no elemento
        ticker.style.setProperty('--duracao-normal', `${duracaoNormal}s`);
        ticker.style.setProperty('--duracao-slow', `${duracaoSlow}s`);
        
        // Inicia a animação usando a variável
        ticker.style.animation = `ticker var(--duracao-normal) linear infinite`;
    });
}



// ============================================================
// [SISTEMA: CONTAGEM DE DIAS APÓS OCORRÊNCIA]
// IMPORTANTE: Altere os valores abaixo para atualizar a data do incidente
// ============================================================
const dataIncidente = new Date(2026, 4, 1); // alterar seguindo o formato: (ano, mês-1, dia)
const hoje = new Date();

// Cálculo da diferença
const diffMs = Math.abs(hoje - dataIncidente); // diferença em milissegundos
const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // converte para dias

// Seletores do contador
const boxNumero = document.querySelector('.contador-numero');
const labelTexto = document.querySelector('.contador-label');

// Atualiza o número no elemento
boxNumero.textContent = dias.toString().padStart(3, '0');

// Ajusta o plural da frase lateral
if (dias === 1) {
    labelTexto.innerHTML = 'dia desde o<br>último incidente.';
} else {
    labelTexto.innerHTML = 'dias desde o<br>último incidente.';
}



// ============================================================
// [SISTEMA: CONTAGEM DE VISITAS DO USUÁRIO]
// Rastreamento de visitas via LocalStorage do navegador
// ============================================================

// Recupera o valor de visitas-corredor do armazenamento local,
// converte para número inteiro ou define como 0 se não existir.
let visitasCorredor = parseInt(localStorage.getItem('visitas-corredor')) || 0;

visitasCorredor++; // incrementa o contador de visitas

// Salva o novo valor atualizado de volta no armazenamento local do navegador.
localStorage.setItem('visitas-corredor', visitasCorredor); 

const pVisita = document.getElementById('ocor-visita'); // seleciona o parágrafo onde a frase será exibida
const vezOuVezes = visitasCorredor === 1 ? "vez" : "vezes"; // define o plural com base no número de visitas

// Monta a frase dentro do parágrafo 
pVisita.innerHTML = `<span>Você percorreu esses corredores <span id="visita-counter">${visitasCorredor}</span> ${vezOuVezes}.</span>`;



// ============================================================
// [EFEITO: STROBO]
// Ativa/desativa classes de filtro baseando-se na velocidade do mouse
// ============================================================
const linhas = document.querySelectorAll('.painel tr'); // seleciona todas as linhas dentro dos painéis

linhas.forEach(linha => {
    // Última posição do mouse para calcular a velocidade
    let lastX = 0;
    let lastY = 0;

    // Evento de movimento do mouse dentro da linha
    linha.addEventListener('mousemove', (e) => {
        // Calcula a distância percorrida desde o último movimento usando Pitágoras
        const deltaX = Math.abs(e.clientX - lastX);
        const deltaY = Math.abs(e.clientY - lastY);
        const velocidade = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Atualiza a última posição
        lastX = e.clientX;
        lastY = e.clientY;

        // Lógica de Strobo:
        // Se a velocidade ultrapassar o limiar de probabilidade, alterna o strobo
        if (Math.random() < (velocidade * 0.1)) { // gera um multiplicador aleatório para controlar a sensibilidade
            linha.classList.toggle('strobo-painel'); // alterna a classe de strobo se a condição (ser menor que a velocidade multiplicada por 0.1.) for atendida
        }
    });

    // Remove o efeito ao sair da linha para não travar no estado invertido
    linha.addEventListener('mouseleave', () => { // detector para quando o mouse sai da área da linha
        linha.classList.remove('strobo-painel'); // remove a classe de strobo para resetar o estado visual da linha
    });
});

// ============================================================
// [EFEITO: STROBO] — TEXTO DO LOG
// ============================================================
const logBox = document.querySelector('.log-box'); // seleciona a caixa de log

logBox.addEventListener('mousemove', () => { // gatilho de movimento do mouse dentro da caixa de log
    // Seleciona todos os spans com classes de foco dentro do log
    const alertas = document.querySelectorAll('.foco-vermelho,.foco-amarelo,.foco-azul');
    
    // Com uma chance de 20%, inverte as cores dos alertas
    if (Math.random() > 0.8) {
        alertas.forEach(alerta => {
            alerta.style.filter = 'invert(100%) brightness(200%)'; // aplica o efeito
        });
    } else {
        alertas.forEach(alerta => {
            alerta.style.filter = 'none'; // reseta o efeito para o estado normal
        });
    }
});

// Reseta o estado quando o mouse sai da log-box
logBox.addEventListener('mouseleave', () => { // gatilho para quando o mouse sai da caixa de log
    const alertas = document.querySelectorAll('.foco-vermelho, .foco-amarelo, .foco-azul');
    alertas.forEach(alerta => {
        alerta.style.filter = 'none'; // reseta o efeito para o estado normal
    });
});



// ============================================================
// [SISTEMA: DUAT ENGINE]
// Controla o comportamento visual do overlay durante o scroll.
// ============================================================

// Configurações iniciais do canvas
const duatOverlay  = document.getElementById('duat-overlay'); // seleciona o elemento de overlay para o pop-up
const duatCanvas   = document.getElementById('duat-canvas'); // seleciona o elemento canvas para as partículas
const duatConteudo = document.getElementById('duat-content'); // seleciona o elemento de conteúdo dentro do overlay para aplicar os efeitos de blur e opacidade

// Variáveis para controle de estado
let settecentoCongelado = false; // controla se o 777 já está congelado no centro
const duat777      = document.getElementById('duat-777'); // seleciona o elemento do 777 para aplicar os efeitos de entrada e saída
const ctx          = duatCanvas.getContext('2d'); // contexto 2D para desenhar as partículas

duatCanvas.width  = window.innerWidth; // define a largura do canvas para preencher a tela
duatCanvas.height = window.innerHeight; // define a altura do canvas para preencher a tela


// --- partículas ---
const particulas = Array.from({ length: 120 }, () => ({ // Geração aleatória de propriedades para cada partícula
    x:         Math.random() * duatCanvas.width, // posição horizontal aleatória
    y:         Math.random() * duatCanvas.height, // posição vertical aleatória

    r:         Math.random() * 1.2 + 0.3, // raio aleatório entre 0.3 e 1.5 para variação de tamanho

    vx:        (Math.random() - 0.5) * 0.2, // velocidade horizontal aleatória, suavizada
    vy:        (Math.random() - 0.5) * 0.2, // velocidade vertical aleatória, suavizada
    
    opacidade: Math.random() * 0.2 + 0.05 // opacidade aleatória entre 0.05 e 0.25
}));

let animacaoParticulas = null; // variável para armazenar o ID da animação

function desenharParticulas() { // função para desenhar e animar as partículas
    // Limpa o canvas a cada frame para evitar rastros
    ctx.clearRect(0, 0, duatCanvas.width, duatCanvas.height);
    
    particulas.forEach(p => { // atualiza a posição de cada partícula com base em sua velocidade
        p.x += p.vx; // atualiza a posição horizontal
        p.y += p.vy; // atualiza a posição vertical

        // Faz as partículas "darem a volta" quando saem da tela
        if (p.x < 0) p.x = duatCanvas.width;
        if (p.x > duatCanvas.width) p.x = 0;
        if (p.y < 0) p.y = duatCanvas.height;
        if (p.y > duatCanvas.height) p.y = 0;

        // Desenha a partícula como um círculo preenchido
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        // Efeito brilho/desfoque ao redor da partícula
        ctx.shadowBlur = 4; // intensidade do desfoque
        ctx.shadowColor = "white"; // cor do desfoque
        
        // Cor reage ao progresso — branco no início, invertendo conforme o fundo some
        const r = Math.round(255 * progressoAtual);
        const b = Math.round(255 * (1 - progressoAtual));
        ctx.fillStyle = `rgba(${r}, 0, ${b}, ${p.opacidade})`;
        ctx.shadowColor = `rgba(${r}, 0, ${b}, 0.8)`;
        ctx.fill();
        
        // Reseta o efeito de brilho para que não afete outros elementos
        ctx.shadowBlur = 0; 
    });

    // Loop contínup — solicita ao navegador o próximo quadro da animação
    animacaoParticulas = requestAnimationFrame(desenharParticulas);
}

// Função para parar a animação das partículas e limpar o canvas
function pararParticulas() {
    if (animacaoParticulas) {
        cancelAnimationFrame(animacaoParticulas);
        animacaoParticulas = null; // reseta a variável de controle
        ctx.clearRect(0, 0, duatCanvas.width, duatCanvas.height); // limpa o canvas para remover as partículas restantes
    }
}

// Variável global para controle do strobo do 777
let strobo777Global = null;

// --- abrir ---
function abrirDuat() {
    duatOverlay.scrollTop = 0; // reseta o scroll para o topo toda vez que abrir

    duat777.style.opacity  = 0; // 777 começa invisível para o efeito de fade-in
    duat777.style.fontSize = '1em';
    duat777.style.filter   = 'blur(0px)'; // 777 começa sem desfoque para o efeito de entrada suave
    
    // Aplica o fundo com transparência imediatamente
    // para evitar o "flash" de preto sólido e permitir ver o canvas atrás
    duatOverlay.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';

    // Limpa filtros residuais do conteúdo
    duatConteudo.style.filter  = '';
    duatConteudo.style.opacity = '';
    
    // Reseta estados de controle
    duat777.classList.remove('congelado');
    settecentoCongelado = false;
    jáFechando = false; 

    // Dispara as animações de entrada
    duatOverlay.classList.remove('fechando');
    duatOverlay.classList.add('ativo');
    
    // Ativa o canvas e inicia o desenho
    duatCanvas.classList.add('ativo');
    desenharParticulas();

    // Inicia o strobo do 777
    if (!strobo777Global) {
        strobo777Global = setInterval(() => {
            if (Math.random() > 0.95) {
                duat777.classList.toggle('strobo-painel');
            }
        }, 80);
    }
}


// --- fechar ---
function fecharDuat() {
    duatOverlay.classList.add('fechando');
    
    // Adicione esta linha aqui para as partículas sumirem suavemente
    duatCanvas.classList.remove('ativo'); 

    setTimeout(() => {
        duat777.style.opacity  = 0;
        duat777.style.fontSize = '1em';
        duat777.style.filter   = 'blur(0px)';

        duatOverlay.classList.remove('ativo', 'fechando');
        duatOverlay.style.opacity = '';
        duatOverlay.style.backgroundColor = '#0a0a0a';

        duat777.classList.remove('congelado');
        settecentoCongelado = false;

        duatConteudo.style.filter  = '';
        duatConteudo.style.opacity = '';

        // Para o strobo do 777 (Passo 5)
        clearInterval(strobo777Global);
        strobo777Global = null;

        pararParticulas();
        // Você pode remover a linha duatCanvas.classList.remove('ativo') daqui de dentro
    }, 500);
}

let jáFechando = false;
let progressoAtual = 0;

// --- scroll ---

duatOverlay.addEventListener('scroll', () => {
    const scrollado = duatOverlay.scrollTop;
    const total     = duatOverlay.scrollHeight - duatOverlay.clientHeight;
    const progresso = total > 0 ? scrollado / total : 0;
    progressoAtual = progresso;

    // LÓGICA DE PERSISTÊNCIA:
    // Multiplicamos o progresso por 1.5 e limitamos a 1 para criar um "atraso".
    // O fundo começará a esmaecer significativamente apenas após 40-50% do scroll.
    let curvaOpacidade = Math.pow(progresso, 2); // Usa uma curva exponencial para suavizar o início
    const fundoOpacidade = Math.max(0, 0.95 - (curvaOpacidade * 0.95));
    
    // Escurecimento do fundo (curva quadrática para suavidade)
    duatOverlay.style.backgroundColor = `rgba(10, 10, 10, ${fundoOpacidade})`;

    // Desfoque progressivo (Blur) a partir de 70% do percurso
    if (progresso < 0.3) {
        // ainda não apareceu
        duat777.style.opacity = 0;
        duat777.style.fontSize = '1em';
        duat777.style.filter = 'blur(0px)';
    } else if (progresso >= 0.3 && progresso < 0.7) {
        // aparece e cresce
        const entrada = (progresso - 0.3) / 0.4;
        duat777.style.opacity = entrada;
        duat777.style.fontSize = `${1 + entrada * 1.5}em`; // cresce de 1em até 2.5em
        duat777.style.filter = 'blur(0px)';
    } else {
        // some com blur junto com o conteúdo
        const saida = (progresso - 0.7) / 0.3;
        duat777.style.opacity = Math.max(0, 1 - saida);
        duat777.style.fontSize = `${2.5 + saida * 2}em`; // continua crescendo
        duat777.style.filter = `blur(${saida * 20}px)`;
    }

    // blur e fade do conteúdo — começa em 70% do scroll
    if (progresso > 0.7) {
        const intensidade = (progresso - 0.7) / 0.3;
        const blur        = intensidade * 16;
        const fade        = Math.max(0, 1 - intensidade);

        duatConteudo.style.filter  = `blur(${blur}px)`;
        duatConteudo.style.opacity = fade;
    } else {
        duatConteudo.style.filter  = '';
        duatConteudo.style.opacity = '';
    }

    // congela o 777 no centro quando ele chega lá
    if (!settecentoCongelado) {
        const rect    = duat777.getBoundingClientRect();
        const centro  = window.innerHeight / 2;
        const meio777 = rect.top + rect.height / 2;

        if (meio777 <= centro + 2) {
            duat777.classList.add('congelado');
            settecentoCongelado = true;
        }
    }

    // Gatilho de encerramento automático
    if (progresso >= 0.99 && !jáFechando) {
        jáFechando = true;
        fecharDuat();
        setTimeout(() => { jáFechando = false; }, 1200);
    }
});


// --- triggers ---

// Unificação final dos disparadores do Duat
// Unificação dos disparadores do Duat
document.querySelectorAll('.duat-link, .link-duat').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        abrirDuat();
    });
});


// // abertura via URL: main.html#duat
// if (window.location.hash === '#duat') {
//     abrirDuat();
// }

// Remove qualquer '#' da URL assim que a página carrega
if (window.location.hash) {
    history.replaceState("", document.title, window.location.pathname + window.location.search);
}


// --- resize ---

window.addEventListener('resize', () => {
    duatCanvas.width  = window.innerWidth;
    duatCanvas.height = window.innerHeight;
});

// strobo contínuo no 777
setInterval(() => {
    if (Math.random() > 0.85) {
        duat777.classList.toggle('strobo-painel');
    }
}, 80);

// Strobo dinâmico para elementos do Duat (Link Tiamat e parágrafos de foco)
const elementosStroboDuat = document.querySelectorAll('#easter-tiamat, .duat-focus');
let intervaloStobroDuat = null;

elementosStroboDuat.forEach(el => {
    el.addEventListener('mouseenter', () => {
        intervaloStobroDuat = setInterval(() => {
            // Chance de 40% de trocar o estado a cada 50ms para efeito glitch
            if (Math.random() > 0.6) {
                el.classList.toggle('strobo-painel');
            }
        }, 50); 
    });

    el.addEventListener('mouseleave', () => {
        clearInterval(intervaloStobroDuat);
        el.classList.remove('strobo-painel');
    });
});