# Corredor 777

[**corredor777.github.io**](https://corredor777.github.io/)



## O projeto
 
O Corredor 777 é um site pessoal construído como uma espécie de instalação em hipertexto: uma obra que usa os recursos técnicos da web não como suporte neutro, mas como linguagem. Navegação, comportamento de interface, estrutura de links são elementos narrativos tanto quanto o texto.
 
Defino o Corredor como uma instalação no sentido de ser uma obra que ocupa um espaço e exige que o visitante se mova dentro dela para experimentá-la. Aqui o espaço é navegável via hipertexto — não no sentido de enciclopédia ou de links informativos, mas por ser uma estrutura que se expande por dentro de si mesma, onde cada caminho altera a leitura dos outros, e onde a própria forma de navegar é parte do conteúdo.
 
Alguns links levam a loops. Alguns a lugar nenhum. Algumas páginas só se fecham de formas específicas. Nada é anunciado, o usuário precisa desbravar e aprender a se mover dentro da obra.

Faço uso de um alter ego como autor da pagina (Tiamat, O Zelador), e como easter egg, utilizo o `console.log` das páginas como uma quebra de quarta parede — uma voz que fala fora das metáforas do projeto, um recado do dev para quem abrir o console.

O Corredor 777 é desenvolvido em HTML, CSS e JavaScript (com uma pitada de python e webGL, aqui e ali). Hospedado no GitHub Pages. Sem frameworks, sem backend, sem dependências externas além da YouTube IFrame API para o player de música.

O projeto é propositalmente construído para telas grandes/desktop para resgatar a experiência imersiva e intencional da internet clássica. A interface exige do usuário um momento dedicado de atenção, em contraste com o consumo fragmentado e scroll infinito dos dispositivos móveis, substituindo por um ecossistema que prioriza a exploração e exercício da curiosidade.

---

## Estrutura
 
O site se organiza em duas camadas: páginas com presença direta na navegação, e pastas-mãe sem página própria que agrupam seções internas.
 
**Páginas principais**
 
A entrada é uma splash page que sorteia uma frase com base no IP do visitante. São 23 frases correspondentes aos arcanos maiores do Tarot, esgotadas em sequência antes de resetar — e redireciona automaticamente para a Recepção.

A Recepção (`main.html`) é o hub central: contém conteúdo que descreve estados internos do autor (energia física, mental, emocional, dentre outras) usando metáforas de localidade. Contém links para as seções do site, e links escondidos que levam ao Juramento do Abismo — uma página que brinca com a ideia de contrato com o diabo, solicita uma assinatura e imprime a página assinada antes de redirecionar de volta.
 
**`/fragmentos`** — pasta que contém as seções de texto do projeto:
 
- **Transmissões** — Interface visual de monitor CRT antigo. Agrupa quatro subseções: Diário (entradas pessoais com nomes codificados e experimentos visuais), Notas (textos técnicos sobre temas de interesse), Análises (textos em formato de essays) e Definições (termos diversos). Contém também o acesso ao Caminho da Serpente — estrutura de hipertexto não-linear baseada na Árvore da Vida cabalística, ainda sendo construída.
- **Juramento do Abismo** — online, acesso via link escondido na Recepção.
- **Grimório** — planejado, em construção. Seção de conteúdo ocultista organizado por temas.

**`/setores`** — pasta que contém as seções visuais e sociais, ainda não construídas:
 
- **Galeria** — artes em imagem e vídeo dispostas em grid procedural.
- **Guestbook** — mensagens de visitantes, respondidas pelo autor.

```
/
├── index.html                  — splash: sorteio de frases + redirect
├── main.html                   — Recepção (hub principal)
├── css/
├── js/
├── assets/
├── fragmentos/
│   ├── transmissoes/
│   │   ├── index.html          — hub das Transmissões
│   │   ├── diario/
│   │   ├── notas/
│   │   ├── analises/
│   │   ├── definicoes/
│   │   └── serpente/
│   └── juramento/
│       └── index.html
└── setores/
    ├── galeria/
    └── guestbook/
```
 
---

## Conceitos
 
**Metáfora espacial** — o site usa vocabulário de instalação arquitetônica para descrever tudo. Seções são cômodos, galerias, câmaras. Visitantes são presenças. O autor é O Zelador. Os estados internos são leituras de painel de monitoramento. O overlay de entrada só fecha ao completar o scroll, impondo uma duração, uma travessia obrigatória. O texto e a interface falam a mesma língua. Cada decisão de UX tem uma função dentro da obra.
 
**O Caminho da Serpente** — 32 páginas baseadas na Árvore da Vida cabalística: 10 sefirót, 1 Da'at e 22 caminhos. A navegação tem uma sequência primária (a subida da serpente, de Malkuth a Kether) e túneis discretos entre pontos não adjacentes. O visitante não recebe um mapa. Alguns nós têm comportamento condicional via `sessionStorage` dependendo da origem do acesso. A estrutura está definida; o conteúdo está sendo escrito.
 
**Restrição de dispositivo** — a experiência pressupõe tela grande. Não há versão mobile. Essa não é uma limitação técnica pendente de resolução, é uma decisão sobre o tipo de atenção que a obra exige.
 
---

## Mecânicas implementadas
 
**Sorteio por IP (splash)** — o algoritmo usa o IP do visitante como semente para percorrer as 23 frases dos arcanos maiores em sequência, resetando ao esgotar a tiragem. A splash redireciona automaticamente após alguns segundos.
 
**Engine do player de música** — `player-engine.js` é um módulo reutilizável que opera sobre a YouTube IFrame API com o player de vídeo invisível. Cada página instancia o player com sua própria playlist via `inicializarPlayer()`. Shuffle ativo por padrão. Customizável por página via variáveis CSS.
 
**Sistema de injeção de conteúdo (Transmissões)** — cada entrada das subseções de Transmissões é um arquivo HTML individual. Um script Python atualiza um JSON por subseção; esse JSON é lido pelo JavaScript da página, que injeta os HTMLs individuais dentro do layout principal já estilizado, o visual do monitor CRT. Isso permite adicionar e editar conteúdo sem tocar no HTML principal.
 
**Gerenciador de cursores** — sistema que permite trocar o cursor da página adicionando uma classe ao elemento HTML. Suporta GIFs animados cross-platform sem delay de carregamento.

---

## Estado atual

Em desenvolvimento ativo. As seções planejadas além da Recepção e do Caminho da Serpente — Grimório, Galeria, Guestbook — estão sendo construídas.

O projeto não tem versão final prevista. É um documento vivo.

---

*Bruno Oliveira Marrega, 2026–*
