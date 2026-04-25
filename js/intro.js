// Redirecionamento automático:
const destino = 'main.html';

// 1. Redirecionamento automático após 3 segundos
const timer = setTimeout(() => {
    window.location.href = destino;
}, 5000);

// 2. Redirecionamento instantâneo via clique (interação)
document.addEventListener('click', () => {
    clearTimeout(timer); // Cancela o timer de 3s para evitar conflito
    window.location.href = destino;
});


// Sorteio de frases para a intro

// 1. O Banco de Dados associando Arcanos às frases do arquivo MD
const bancoDeDados = [
    { carta: "0 - O Louco", frase: " How does it feel to be inside a dream? " },
    { carta: "I - O Mago", frase: " Eu sou. " },
    { carta: "II - A Sacerdotisa", frase: " A natureza gosta de se esconder. " },
    { carta: "III - A Imperatriz", frase: " I desire violently — and I wait. " },
    { carta: "IV - O Imperador", frase: " Amor sob vontade " },
    { carta: "V - O Hierofante", frase: " V.I.T.R.I.O.L. " },
    { carta: "VI - Os Enamorados", frase: " Sou o corte, e sou a faca. " },
    { carta: "VII - O Carro", frase: " Sua alma está ferida pela covardia... " },
    { carta: "VIII - A Justiça", frase: " RAGE & FURY " },
    { carta: "IX - O Eremita", frase: " E ali permaneceu meu corpo, caído. " },
    { carta: "X - A Roda da Fortuna", frase: " Evolua ou repita " },
    { carta: "XI - A Força", frase: " Não trago a paz, mas a espada. " },
    { carta: "XII - O Pendurado", frase: " Nature chews on me. " },
    { carta: "XIII - A Morte", frase: " Aniquilar para criar. " },
    { carta: "XIV - A Temperança", frase: " Solve et coagula " },
    { carta: "XV - O Diabo", frase: " Você me consumiu o suficiente. " },
    { carta: "XVI - A Torre", frase: " All flesh rots, " },
    { carta: "XVII - A Estrela", frase: " Bless my darkness. Bless my light. " },
    { carta: "XVIII - A Lua", frase: " Per me si va ne l'etterno dolore. " },
    { carta: "XIX - O Sol", frase: " Ya no puedo morir. " },
    { carta: "XX - O Julgamento", frase: " Quitarse la piel, " },
    { carta: "XXI - O Mundo", frase: " E então saímos para rever as estrelas. " }
];

function selecionarFrase() {
    // 2. Busca no armazenamento do navegador a lista de frases já vistas e converte de texto (JSON) para Array
    let exibidas = JSON.parse(localStorage.getItem('frasesExibidas')) || [];

    // 3. Cria uma lista temporária contendo apenas os itens cujo índice ainda não consta na lista de exibidas
    let disponiveis = bancoDeDados.filter((_, index) => !exibidas.includes(index));

    // 4. Verificação de ciclo: se não houver mais frases disponíveis, limpa a memória para reiniciar o sorteio
    if (disponiveis.length === 0) {
        exibidas = [];
        disponiveis = bancoDeDados;
        console.log("A serpente morde sua própria cauda. A roda gira mais uma vez.");
    }

    // 5. Realiza o sorteio matemático escolhendo um item aleatório dentro do conjunto de frases disponíveis
    const itemSorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    
    // 6. Localiza a posição original (0-21) do item sorteado no banco de dados principal
    const indexOriginal = bancoDeDados.indexOf(itemSorteado);

    // 7. Adiciona o índice sorteado ao registro de frases já vistas para evitar repetição no próximo carregamento
    exibidas.push(indexOriginal);

    // 8. Salva a lista atualizada de frases vistas no LocalStorage do navegador em formato de texto
    localStorage.setItem('frasesExibidas', JSON.stringify(exibidas));

    // 9. Captura os elementos do HTML através de seus IDs para manipulação
    const elementoFrase = document.getElementById('frase-display');
    const elementoCarta = document.getElementById('carta-display');

    // 10. Insere o texto da frase sorteada no parágrafo correspondente
    if (elementoFrase) {
        elementoFrase.innerText = itemSorteado.frase;
    }

    // 11. Insere o nome da carta sorteada no parágrafo correspondente
    if (elementoCarta) {
        elementoCarta.innerText = itemSorteado.carta;
    }
}

// Inicializa automaticamente assim que a estrutura da página for carregada pelo navegador
window.onload = selecionarFrase;


// Efeito de chuva de sangue
// Créditos: Rainy Afternoon Effect  *  (c)2011-13 mf2fm web-design  *  http://www.mf2fm.com/rv

// <![CDATA[
var speed=22; // lower number for faster
var drops=100; // number of 'drops'
var colour="#a40000"; // colour of drops (generally grey!)

var flks=new Array();
var flkx=new Array();
var flky=new Array();
var fldy=new Array();
var swide, shigh, boddie;
var ie_version=(navigator.appVersion.indexOf("MSIE")!=-1)?parseFloat(navigator.appVersion.split("MSIE")[1]):false;

function addLoadEvent(funky) {
var oldonload=window.onload;
if (typeof(oldonload)!='function') window.onload=funky;
else window.onload=function() {
    if (oldonload) oldonload();
    funky();
}
}

addLoadEvent(storm);

function storm() { if (document.getElementById) {
    var r1, r2;
    boddie=document.createElement("div");
    boddie.style.position="fixed";
    boddie.style.top="0px";
    boddie.style.left="0px";
    boddie.style.width="1px";
    boddie.style.height="1px";
    boddie.style.overflow="visible";
    boddie.style.backgroundColor="transparent";
    document.body.appendChild(boddie);
    set_width();
    for (var i=0; i<drops; i++) {
        flks[i]=createDiv(16, 2, "transparent");
        r1=createDiv(6, 2, colour);
        r1.style.top="10px";
        r1.style.left="0px";
        flks[i].appendChild(r1);
        r2=createDiv(10, 2, colour);
        r2.style.top="0px";
        r2.style.left="0px";
        if (ie_version && ie_version<10) r2.style.filter="alpha(opacity=25)";
        else r2.style.opacity=0.25;
        flks[i].appendChild(r2);
        flkx[i]=2*Math.floor(Math.random()*swide/2);
        flky[i]=Math.floor(Math.random()*shigh);
        fldy[i]=2+Math.floor(Math.random()*4);
        flks[i].style.left=flkx[i]+"px";
        flks[i].style.top=flky[i]+"px";
        boddie.appendChild(flks[i]);
    }
    setInterval("cats_and_dogs()", speed);
}}

function createDiv(height, width, colour) {
    var div=document.createElement("div");
    div.style.position="absolute";
    div.style.height=height+"px";
    div.style.width=width+"px";
    div.style.overflow="hidden";
    div.style.backgroundColor=colour;
    return (div);
}

window.onresize=set_width;

function set_width() {
    var sw_min=999999;
    var sh_min=999999;
    if (document.documentElement && document.documentElement.clientWidth) {
        sw_min=document.documentElement.clientWidth;
        sh_min=document.documentElement.clientHeight;
    }
    if (typeof(self.innerWidth)!="undefined" && self.innerWidth) {
        if (self.innerWidth<sw_min) sw_min=self.innerWidth;
        if (self.innerHeight<sh_min) sh_min=self.innerHeight;
    }
    if (document.body.clientWidth) {
        if (document.body.clientWidth<sw_min) sw_min=document.body.clientWidth;
        if (document.body.clientHeight<sh_min) sh_min=document.body.clientHeight;
    }
    if (sw_min==999999 || sh_min==999999) {
        sw_min=800;
        sh_min=600;
    }
    swide=sw_min-2;
    shigh=sh_min;
}

function cats_and_dogs(c) {
    var i, x, o=0;
    for (i=0; i<drops; i++) {
        flky[i]+=fldy[i];
        if (flky[i]>=shigh-16) {
        flky[i]=-16;
        fldy[i]=2+Math.floor(Math.random()*4);
        flkx[i]=2*Math.floor(Math.random()*swide/2);
        flks[i].style.left=flkx[i]+"px";
        }
        flks[i].style.top=flky[i]+"px";
    }
}
// ]]>


const htmlElement = document.documentElement;
let isNegative = false;

// Função que gera o efeito visual baseado no movimento do mouse
document.addEventListener('mousemove', () => {
    // Ajuste o 0.7 para mais ou menos agressividade (0.9 = menos flash, 0.5 = muito flash)
    if (Math.random() > 0.7) {
        if (!isNegative) {
            htmlElement.classList.add('negativo');
            isNegative = true;
        } else {
            htmlElement.classList.remove('negativo');
            isNegative = false;
        }
    }
});

// Garante que o estado negativo seja limpo se o mouse parar de mover
// e evita que a página redirecione em estado invertido
document.addEventListener('mouseleave', () => {
    htmlElement.classList.remove('negativo');
    isNegative = false;
});

// Limpeza preventiva antes do redirecionamento
window.onbeforeunload = function() {
    htmlElement.classList.remove('negativo');
};