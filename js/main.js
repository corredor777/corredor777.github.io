// Efeito ticker superior
const ticker = document.getElementById('frase-ticker');
const conteudoOriginal = ticker.innerHTML;

// 1. Repete a frase várias vezes para preencher a largura da tela
ticker.innerHTML = conteudoOriginal.repeat(10);

// 2. Clona o bloco inteiro e coloca ao lado (lado a lado mesmo)
//      O display: flex no CSS do pai (.ticker) garante que fiquem na mesma linha
const clone = ticker.innerHTML;
ticker.innerHTML += clone;



// Contador de dias após última ocorrência
const dataIncidente = new Date(2026, 3, 20); // Ajustar quando necessário (formato: ano, mês-1, dia)
const hoje = new Date();

// Cálculo da diferença
const diffMs = Math.abs(hoje - dataIncidente);
const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

// Seletores baseados no seu HTML
const boxNumero = document.querySelector('.contador-numero');
const labelTexto = document.querySelector('.contador-label');

// Atualiza o número no quadrado (mantendo os dois dígitos)
boxNumero.textContent = dias < 10 ? '0' + dias : dias;

// Ajusta o plural da frase lateral
if (dias === 1) {
    labelTexto.innerHTML = 'dia desde o<br>último incidente.';
} else {
    labelTexto.innerHTML = 'dias desde o<br>último incidente.';
}



// Contador de visitas
let visitasCorredor = parseInt(localStorage.getItem('visitas-corredor')) || 0;
visitasCorredor++;
localStorage.setItem('visitas-corredor', visitasCorredor);

const pVisita = document.getElementById('ocor-visita');
const vezOuVezes = visitasCorredor === 1 ? "vez" : "vezes";

// Aqui o script monta a frase do zero dentro do seu parágrafo
pVisita.innerHTML = `<span>Você percorreu esses corredores <span id="visita-counter">${visitasCorredor}</span> ${vezOuVezes}.</span>`;




// Efeito strobo
// Painel
const linhas = document.querySelectorAll('.painel tr');

// Variáveis para rastrear a posição anterior do mouse
let lastX = 0;
let lastY = 0;

linhas.forEach(linha => {
    linha.addEventListener('mousemove', (e) => {
        // Calcula a distância percorrida desde o último movimento
        const deltaX = Math.abs(e.clientX - lastX);
        const deltaY = Math.abs(e.clientY - lastY);
        const velocidade = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Atualiza a última posição
        lastX = e.clientX;
        lastY = e.clientY;

        // Lógica de Strobo:
        // Se a velocidade for alta, a chance de toggle aumenta.
        // O valor '0.15' é um multiplicador de sensibilidade.
        if (Math.random() < (velocidade * 0.1)) {
            linha.classList.toggle('strobo-painel');
        }
    });

    // Remove o efeito ao sair da linha para não travar no estado invertido
    linha.addEventListener('mouseleave', () => {
        linha.classList.remove('strobo-painel');
    });
});

// Texto de entrada dos logs
const logBox = document.querySelector('.log-box');

logBox.addEventListener('mousemove', () => {
    // Seleciona todos os spans com classes de foco dentro do log
    const alertas = document.querySelectorAll('.foco-vermelho,.foco-amarelo,.foco-azul');
    
    if (Math.random() > 0.8) {
        alertas.forEach(alerta => {
            alerta.style.filter = 'invert(100%) brightness(200%)';
        });
    } else {
        alertas.forEach(alerta => {
            alerta.style.filter = 'none';
        });
    }
});

// Reseta o estado quando o mouse sai da log-box
logBox.addEventListener('mouseleave', () => {
    const alertas = document.querySelectorAll('.foco-vermelho, .foco-amarelo, .foco-azul');
    alertas.forEach(alerta => {
        alerta.style.filter = 'none';
    });
});