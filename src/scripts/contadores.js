// Contadores das Ocorrências — dias desde o incidente e visitas por
// navegador. Adaptado do main.js vanilla; as chaves de localStorage são as
// originais para que visitantes antigos não percam a contagem. A contagem
// de visitas é local ao navegador (localStorage), sem qualquer noção de IP.

/**
 * Preenche o contador de dias e o de visitas da seção Ocorrências.
 * Sem guarda de módulo: não liga listeners — cada chamada só escreve no DOM
 * da página atual e registra a visita, então pode rodar a cada
 * astro:page-load. A checagem de página é a presença dos nós da seção.
 *
 * @param {Object} opcoes
 * @param {string} opcoes.dataIncidente Data no formato "AAAA-MM-DD"
 *   (editável em src/data/ocorrencias.json).
 */
export function iniciarContadores({ dataIncidente }) {
  // Checagem de página: sem os nós das Ocorrências, não há o que contar
  const boxNumero = document.querySelector(".contador-numero");
  const labelTexto = document.querySelector(".contador-label");
  const pVisita = document.getElementById("ocor-visita");
  if (!boxNumero || !labelTexto || !pVisita) return;

  // [CONTAGEM DE DIAS APÓS OCORRÊNCIA]
  // "AAAA-MM-DD" desmontado à mão para construir a data no fuso LOCAL,
  // como o new Date(ano, mes-1, dia) do vanilla — new Date("AAAA-MM-DD")
  // interpretaria UTC e erraria a contagem por um dia conforme o fuso
  const [ano, mes, dia] = dataIncidente.split("-").map(Number);
  const incidente = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  const diffMs = Math.abs(hoje - incidente); // diferença em milissegundos
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // converte para dias

  boxNumero.textContent = dias.toString().padStart(3, "0");
  labelTexto.innerHTML =
    dias === 1
      ? "dia desde o<br>último incidente."
      : "dias desde o<br>último incidente.";

  // [CONTAGEM DE VISITAS DO USUÁRIO]
  // Recupera o total do armazenamento local (0 se for a primeira vez),
  // soma esta visita e persiste de volta — mesma chave do site vanilla
  let visitasCorredor = parseInt(localStorage.getItem("visitas-corredor")) || 0;
  visitasCorredor++;
  localStorage.setItem("visitas-corredor", visitasCorredor);

  const vezOuVezes = visitasCorredor === 1 ? "vez" : "vezes";
  pVisita.innerHTML = `<span>Você percorreu esses corredores <span id="visita-counter">${visitasCorredor}</span> ${vezOuVezes}.</span>`;
}
