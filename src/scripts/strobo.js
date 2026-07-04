// Strobo: inverte as cores da página conforme o movimento do mouse.
let ligado = false; // guarda de idempotência: liga uma vez só

export function iniciarStrobo() {
  if (ligado) return;
  ligado = true;

  const htmlElement = document.documentElement;
  let isNegative = false;

  // Ajuste o 0.7 para mais ou menos agressividade (0.9 = menos flash, 0.5 = muito flash)
  document.addEventListener("mousemove", () => {
    if (Math.random() > 0.7) {
      if (!isNegative) {
        htmlElement.classList.add("negativo");
        isNegative = true;
      } else {
        htmlElement.classList.remove("negativo");
        isNegative = false;
      }
    }
  });

  // Limpa o estado invertido se o mouse sair ou a página for abandonada
  document.addEventListener("mouseleave", () => {
    htmlElement.classList.remove("negativo");
    isNegative = false;
  });
  window.addEventListener("beforeunload", () => {
    htmlElement.classList.remove("negativo");
  });
}
