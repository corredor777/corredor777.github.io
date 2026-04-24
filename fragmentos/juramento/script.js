const spanData = document.getElementById('data-atual');
const dataHoje = new Date();

// Formata para: 24 de abril de 2026
const dataFormatada = dataHoje.toLocaleDateString('pt-BR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
});
spanData.textContent = dataFormatada;


function gerarNumeroEspecial() {
    const spans = document.querySelectorAll('#regnum, #protocolo-fim');
    const chanceEspecial = 0.4; // 40% de chance de ser um número especial
    let resultado = "";

    if (Math.random() < chanceEspecial) {
        // Sorteia qual tipo de especial: 0 = repetido (77777), 1 = espelhado (12321)
        const tipo = Math.floor(Math.random() * 2);

        if (tipo === 0) {
            // Gera repetidos (ex: 55555)
            const digito = Math.floor(Math.random() * 10);
            resultado = digito.toString().repeat(5);
        } else {
            // Gera espelhados/palíndromos (ex: 12521)
            const d1 = Math.floor(Math.random() * 10);
            const d2 = Math.floor(Math.random() * 10);
            const d3 = Math.floor(Math.random() * 10);
            resultado = `${d1}${d2}${d3}${d2}${d1}`;
        }
    } else {
        // Gera um número aleatório comum de 5 dígitos
        resultado = Math.floor(10000 + Math.random() * 90000).toString();
    }

    // Aplica o resultado em todos os elementos encontrados na NodeList
    spans.forEach(span => {
        span.textContent = resultado;
    });
}

// Executa ao carregar a página
window.addEventListener('load', gerarNumeroEspecial);


// Canva para a assinatura
const canvas = document.querySelector('#canva canvas');
const ctx = canvas.getContext('2d');

const bCanvas = document.createElement('canvas');
const bCtx = bCanvas.getContext('2d');

let desenhando = false;
let rastro = []; // Armazena a "cauda" temporária
const tamanhoCauda = 20; // Aumente este número para uma cauda ainda mais longa

function configurarCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    bCanvas.width = canvas.width;
    bCanvas.height = canvas.height;
    
    bCtx.strokeStyle = "rgba(0, 0, 0, 1)";
    bCtx.lineWidth = 2.5;
    bCtx.lineCap = "round";
    bCtx.lineJoin = "round";
}

window.addEventListener('resize', configurarCanvas);
configurarCanvas();

function adicionarPonto(x, y) {
    rastro.push({ x, y });
    
    // Quando a cauda excede o tamanho, o ponto mais antigo vira preto fixo
    if (rastro.length > tamanhoCauda) {
        const p1 = rastro[0];
        const p2 = rastro[1];
        
        bCtx.beginPath();
        bCtx.moveTo(p1.x, p1.y);
        bCtx.lineTo(p2.x, p2.y);
        bCtx.stroke();
        
        rastro.shift(); // Remove o ponto antigo que já foi fixado
    }
}

function desenhar(e) {
    if (!desenhando) return;
    
    // Previne qualquer comportamento padrão do navegador IMEDIATAMENTE
    if (e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const clienteX = e.touches ? e.touches[0].clientX : e.clientX;
    const clienteY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clienteX - rect.left;
    const y = clienteY - rect.top;

    adicionarPonto(x, y);
    
    // Uso de requestAnimationFrame para sincronizar com a taxa de atualização do monitor
    requestAnimationFrame(renderizarFrame);
}

function renderizarFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Desenha o rastro preto permanente
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(bCanvas, 0, 0);

    // 2. Desenha a cauda colorida
    if (rastro.length < 2) return;

    for (let i = 1; i < rastro.length; i++) {
        const p1 = rastro[i - 1];
        const p2 = rastro[i];
        const progresso = i / rastro.length; // 0 (antigo) a 1 (cursor)

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        // Transição de cor: Preto -> Vermelho Escuro -> Vermelho Sangue -> Amarelo
        let cor;
        if (progresso > 0.98) {
            cor = `rgb(255, 255, 255)`; // Ponta amarela (fogo)
            ctx.lineWidth = 4;
        } else if (progresso > 0.93) {
            cor = `rgb(255, 228, 54)`; // Ponta amarela (fogo)
            ctx.lineWidth = 3.5;
        } else if (progresso > 0.8) {
            cor = `rgb(202, 1, 1)`; // Vermelho vivo
            ctx.lineWidth = 3.5;
        } else if (progresso > 0.6) {
            cor = `rgb(171, 0, 0)`; // Vermelho vivo
            ctx.lineWidth = 3.5;
        } else {
            cor = `rgb(128, 0, 0)`; // Escurecendo até sumir
            ctx.lineWidth = 3;
        }

        ctx.strokeStyle = cor;
        ctx.stroke();
    }
}

function iniciar(e) {
    desenhando = true;
    rastro = [];
    const rect = canvas.getBoundingClientRect();
    
    // Captura imediata da posição
    const clienteX = e.touches ? e.touches[0].clientX : e.clientX;
    const clienteY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clienteX - rect.left;
    const y = clienteY - rect.top;
    
    rastro.push({ x, y });
}

function parar() {
    desenhando = false;
    // Fixa o restante da cauda no preto quando o usuário solta o cursor
    for (let i = 1; i < rastro.length; i++) {
        bCtx.beginPath();
        bCtx.moveTo(rastro[i-1].x, rastro[i-1].y);
        bCtx.lineTo(rastro[i].x, rastro[i].y);
        bCtx.stroke();
    }
    rastro = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bCanvas, 0, 0);
}

canvas.addEventListener('mousedown', iniciar);
window.addEventListener('mousemove', desenhar, { passive: false });
window.addEventListener('mouseup', parar);

canvas.addEventListener('touchstart', iniciar, { passive: false });
canvas.addEventListener('touchmove', desenhar, { passive: false });
canvas.addEventListener('touchend', parar);



// Adicione esta função ao final do seu script
function prepararImpressao() {
    // Pequeno delay para garantir que a última parte da "cauda" seja fixada no preto
    setTimeout(() => {
        window.print();
    }, 500);
}

// O redirecionamento ocorre após fechar o diálogo de impressão
// GATILHOS DE IMPRESSÃO E REDIRECIONAMENTO
// GATILHOS DE IMPRESSÃO E REDIRECIONAMENTO
function prepararImpressao() {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + " - " + agora.toLocaleTimeString('pt-BR');

    const campoData = document.getElementById('data-hora-fim');
    if (campoData) campoData.innerText = dataFormatada;

    setTimeout(() => {
        window.print();

        const redirecionar = () => {
            document.body.classList.remove('modo-impressao');
            // Usamos replace com a URL completa para não haver erro de caminho
            window.location.replace("https://corredor777.github.io/main.html");
            window.removeEventListener('focus', redirecionar);
        };

        // Redundância tripla para garantir o redirecionamento
        window.onafterprint = redirecionar;
        
        // O evento 'focus' detecta quando o usuário fecha o PDF e volta para a aba
        window.addEventListener('focus', () => {
            setTimeout(redirecionar, 200);
        }, { once: true });

    }, 500);
}


// Esta função deve ser chamada dentro do seu evento de 'mouseup' ou 'touchend'
function parar() {
    if (!desenhando) return;
    desenhando = false;

    // Fixa o rastro no buffer (conforme códigos anteriores)
    for (let i = 1; i < rastro.length; i++) {
        bCtx.beginPath();
        bCtx.moveTo(rastro[i-1].x, rastro[i-1].y);
        bCtx.lineTo(rastro[i].x, rastro[i].y);
        bCtx.stroke();
    }
    
    rastro = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bCanvas, 0, 0);

    // Dispara o processo
    prepararImpressao();
}