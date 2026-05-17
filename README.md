# Corredor 777

[**corredor777.github.io**](https://corredor777.github.io/)


## O que é
 
O Corredor 777 é um projeto artístico de literatura ficcional-biográfica em formato de site. Não é um blog, nem um portfólio. É uma espécie de instalação mental navegável onde o vivido e o inventado dividem o mesmo espaço.


## Conceito
 
A metáfora estruturante é arquitetônica: o site se mostra como um edifício. As seções são cômodos, galerias, câmaras, andares. O eu lírico é Tiamat, O Zelador, que guia o usuário através dos fragmentos de conteúdo presentes ali.
 
A interface é mais do que suporte para o conteúdo, ela é parte do conteúdo também. As mecânicas de navegação são decisões narrativas, adicionando mais significado através da experiência. O visitante aprende a topologia pelo movimento, pelos detalhes e dinâmicas durante a travessia. Alguns links levam a loops, outros se fecham de formas específicas.
 
O Corredor mistura referências a esoterismo e psicologia junguiana; estética de terminal e old web; texto pessoal e texto iniciático. A ficção é um modo de narrar o real sem o peso do relato confessional direto.
 
O projeto é propositalmente construído para telas grandes/desktop para resgatar a experiência imersiva e intencional da internet clássica. A interface exige do usuário um momento dedicado de atenção, em contraste com o consumo fragmentado e scroll infinito dos dispositivos móveis, substituindo por um ecossistema que prioriza a exploração e exercício da curiosidade.


## Engenharia e estrutura técnica
 
Stack inteiramente estático: HTML, CSS e JavaScript puro, com eventuais scripts Python para geração de dados. Hospedado no GitHub Pages. Sem frameworks, sem backend, sem dependências externas além da YouTube IFrame API para o player de música.
 
O repositório central de planejamento e conteúdo é o Notion. O código vive no GitHub.
 
```
/
├── index.html                      — splash: sorteio de frases + redirect
├── main.html                       — Recepção (hub principal)
├── nucleo/
│   ├── css/
│   │   ├── global.css              — variáveis, tipografia, base
│   │   ├── main.css                — estilos da Recepção
│   │   └── efeitos/
│   └── js/
│       ├── main.js
│       ├── player-engine.js        — motor do player (módulo reutilizável)
│       ├── main-playlist.js
│       ├── cursor-manager.js       — gerenciamento dos cursores (módulo reutilizável)
│       └── crt-effects.js          — distorções cromáticas e efeitos de monitor crt para Transmissões
├── assets/
├── fragmentos/
│   ├── transmissoes/               — hub das Transmissões
│   │   ├── diario/                 — entradas pessoais (HTMLs individuais)
│   │   └── notas/                  — arquivos, definições, ensaios
│   ├── juramento/
│   │   └── index.html              — Juramento do Abismo
│   ├── travessia/                  — Caminho da Serpente (em construção)
│   ├── galeria/                    — planejado
│   └── visitas/                    — planejado
└── _ferramentas/
    ├── gerar-indice.py             — gera JSONs de índice por subseção
    └── galeria-setup.py
```


## Detalhamentos

### Splash (`index.html`)
 
Exibe uma frase sorteada e redireciona automaticamente para a Recepção. As frases estão correlacionadas com os arcanos maiores do tarot.
 
### Recepção (`main.html`)
 
Hub principal. Sidebar fixa à esquerda com logo, bio e player de música. Conteúdo rolável à direita em cinco seções: Monitoramento das Instalações, Ocorrências, Registro de Eventos, Transmissões Externas (chatbox) e Pendências.
 
O Monitoramento das Instalações é uma tabela de 8 sistemas com leituras atualizadas manualmente — cada sistema mede um estado interno do autor em vocabulário de instalação:
 
| Sistema | Mede |
|---------|------|
| Condição dos andares inferiores | estado mental |
| Temperatura dos corredores | energia física |
| Ressonância das paredes | estado emocional |
| Trânsito interno | nível de isolamento |
| Atividade das galerias | produtividade criativa |
| Permeabilidade dos acessos | fome simbólica |
| Integridade da fundação | estabilidade geral |
| Registro dos subsolos | intensidade onírica |
 
O Registro de Eventos é um log estilo terminal. Entradas seguem o padrão `[índice] TÍTULO texto.` — frases curtas, verbos no particípio, ausência de sujeito.
 
### Overlay Duat
 
Ativado pelo logo e por links `.link-duat` espalhados pelo site. Ocupa a tela inteira, com fundo escuro, canvas de partículas e texto iniciático. Fecha apenas ao completar o scroll — o visitante não pode pular. A entrada usa animação glitch com `steps(1)`. Contém easter egg: uma palavra no texto é um link oculto para o Juramento do Abismo.
 
### O Caminho da Serpente (`/fragmentos/travessia/`)
 
Hipertexto não-linear de 32 páginas baseado na Árvore da Vida cabalística: 10 sefirót, 1 Da'at e 22 caminhos. Cada página é um HTML autônomo com texto conceitual e links de saída. A sequência primária (subida da serpente) vai de Malkuth a Kether e segue a lógica: Links primários `[S]` seguem essa subida em sentido único, sem retorno. Links discretos `[D]` são túneis secretos de mão dupla entre pontos não adjacentes.
 
Da'at (`0.html`) tem comportamento condicional por `sessionStorage`: a página se comporta de formas diferentes dependendo da origem do acesso — passagem parcial, passagem completa, spoiler rápido ou redirecionamento imediato. O visitante não recebe um mapa.
 
### Grimório (`/fragmentos/grimorio/`)
 
Seção de conteúdo ocultista, em construção. A entrada da página irá mostrar um grimório fechado. Ao passar o mouse, o grimório desliza e os títulos das seções aparecem. Barreira simbólica de entrada a definir.
 
---
 
## Mecânicas implementadas
 
**Player de música** — `player-engine.js` é um módulo reutilizável que opera sobre a YouTube IFrame API com o player de vídeo invisível. Cada página instancia o player com sua própria playlist via `inicializarPlayer({ shuffle: true, playlist: [...] })`. Customizável por página via variáveis CSS (`--player-cor`, `--player-cor-ativa`, etc.).
 
**Overlay Duat** — sistema de overlay com efeito de entrada glitch via `@keyframes`, e lógica de fechamento atrelada ao scroll completo do container.
 
**Painel de monitoramento** — tabela com efeito strobo nas linhas via `mousemove`. Leituras atualizadas manualmente no Notion e transcritas para o HTML.
 
**Registro de Eventos** — log de terminal com efeito strobo nos spans `.foco-*` via `mousemove` e efeito power-on no hover. Cursor piscante no último item via CSS `blink`.
 
**Sistema de injeção de conteúdo (Transmissões)** — cada entrada das subseções é um arquivo HTML individual. Um script Python mantém um JSON por subseção; o JavaScript da página lê esse JSON e injeta os HTMLs dentro do layout do monitor CRT sem tocar no HTML principal.
 
**Gerenciador de cursores** — permite trocar o cursor da página via classe no elemento `<html>`. Suporta GIFs animados cross-platform sem delay de carregamento.
 
---
 
## Estado atual
 
A Recepção está publicada e operacional. O Caminho da Serpente tem estrutura de navegação definida e está com conteúdo sendo escrito. O Juramento do Abismo está online, acessível via easter egg. A seção Transmissões está online, mas escondida para adição de conteúdo e testagem de inserções de webGL. As seções Grimório, Galeria e Guestbook estão em planejamento.
 
---
 
## Próximos passos
 
- Finalizar conteúdo das 32 páginas do Caminho da Serpente
- Disponibilizar link na `main.html` para as Transmissões
- Desenvolver o Grimório
- Galeria em grid masonry + comportamento procedural
- Desenvolver o Guestbook
---
 
*Bruno Oliveira Marrega, 2026–*
