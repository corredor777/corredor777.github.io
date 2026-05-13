

/* ══════════════════════════════════════════════════════════════
   CONFIGURAÇÃO — IDs do layout atual
══════════════════════════════════════════════════════════════ */
const CONFIG = {
    telaId:       'tela-tubo',
    targetId:     'monitor-target',
    bootId:       'boot-loader',
    breadcrumbId: 'topo-breadcrumb',
    statusId:     'topo-status',
    // slug usado na URL → label exibido ao usuário
    labels: {
        'diario':   'Diário',
        'notas':    'Minhas Notas',
        'serpente': 'Caminho da Serpente',
    }
};

/* ══════════════════════════════════════════════════════════════
   ESTADO
══════════════════════════════════════════════════════════════ */
const Estado = {
    secaoAtiva: null,
    historico:  [],           // pilha para fullscreen → voltar
    cache:      new Map(),    // url → html (evita fetch duplicado)
};

/* ══════════════════════════════════════════════════════════════
   FETCH UNIVERSAL
══════════════════════════════════════════════════════════════ */
async function fetchFragmento(url) {
    if (Estado.cache.has(url)) return Estado.cache.get(url);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    const html = await res.text();
    Estado.cache.set(url, html);
    return html;
}

// Correção de SVG da navbar
function injetarSVGs() {
    const imagens = document.querySelectorAll('.icon-vhs img');
    
    imagens.forEach(img => {
        const url = img.src;
        const classesOriginais = img.parentElement.className;

        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(data, 'image/svg+xml');
                const svg = xml.querySelector('svg');

                if (svg) {
                    // Remove atributos de cor fixos do arquivo original para o CSS dominar
                    svg.querySelectorAll('[fill]').forEach(el => el.removeAttribute('fill'));
                    svg.querySelectorAll('[stroke]').forEach(el => el.removeAttribute('stroke'));
                    
                    // Mantem a integridade das classes para o estilo VHS
                    svg.setAttribute('class', 'svg-injetado');
                    img.replaceWith(svg);
                }
            })
            .catch(err => console.error('Erro na transmissao do vetor:', err));
    });
}

// Inicia a injecao assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', injetarSVGs);
