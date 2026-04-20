// Efeito ticker superior
const ticker = document.getElementById('frase-ticker');
const conteudoOriginal = ticker.innerHTML;

// 1. Repete a frase várias vezes para preencher a largura da tela
// Isso evita que o ticker termine em branco
ticker.innerHTML = conteudoOriginal.repeat(10);

// 2. Clona o bloco inteiro e coloca ao lado (lado a lado mesmo)
// O display: flex no CSS do pai (.ticker) garante que fiquem na mesma linha
const clone = ticker.innerHTML;
ticker.innerHTML += clone;


// Contador de visitas
const visitas = parseInt(localStorage.getItem('visitas-corredor') || '0') + 1;
localStorage.setItem('visitas-corredor', visitas);
document.getElementById('visita-counter').textContent = visitas;