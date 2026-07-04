# Refundação — Corredor 777 em Astro + React

Documento vivo da migração. É lido tanto pelo Bruno quanto pelo Claude Code no início de cada sessão de trabalho na branch `refundacao`. Atualizar a seção **Estado** ao fim de cada sessão. Quando a branch virar `main`, este arquivo morre e o CLAUDE.md é reescrito para a nova stack.

## Princípios

1. **Os efeitos são linguagem, não decoração.** Cursores customizados, CRT, glitch, ruído, WebGL, o popup do Colapso, a usabilidade deliberadamente estranha — são mecanismos da obra. A migração nunca "limpa", "moderniza" ou "suaviza" um efeito. Paridade de comportamento é critério de aceitação; melhorar a execução técnica de um efeito só é permitido se a experiência percebida permanecer idêntica ou mais intensa.
2. **Astro para estrutura e conteúdo; React só onde há estado real.** Player, sliders, futuras interações da galeria e da Serpente. Os subsistemas imperativos (cursor-manager, crt-effects, canvas do Duat, WebGL) permanecem vanilla, vivendo em `src/scripts/` e carregados pelos layouts — não serão traduzidos para React.
3. **Refundação, não tradução.** O objetivo não é portar arquivo por arquivo, é reconstruir o ecossistema: collections em vez de `index.json` gerados por script, layouts em vez de HTML duplicado, dados em vez de páginas repetidas. Mas o resultado final precisa passar no checklist de paridade (F5).
4. **URLs preservadas.** Permalinks são parte da obra; links de entrada existentes não podem quebrar. `src/pages/` espelha a estrutura atual de URLs.
5. **Restrição dura mantida:** saída 100% estática, servível pelo GitHub Pages, sem backend.

## Arquitetura alvo

```
/
├── astro.config.mjs
├── src/
│   ├── pages/           espelha as URLs atuais (index, main, fragmentos/…)
│   ├── layouts/         Base.astro (fontes, paleta, seleção, cursores),
│   │                    CRT.astro (Transmissões), Escuro.astro (Colapso etc.)
│   ├── components/      *.astro (estáticos) e *.jsx (islands React)
│   ├── scripts/         cursor-manager, crt-effects, duat — vanilla preservado
│   ├── styles/          CSS atual realocado, sem reescrita estética
│   └── content/         collections: diario, arquivos, definicoes, ensaios
│                        (futuro: serpente como grafo de dados, obras da galeria)
├── public/              assets/ como está hoje
└── .github/workflows/   deploy.yml (Actions → Pages, ativado só no switch)
```

### Ganhos estruturais que justificam a refundação

- **Content collections aposentam `gerar-indice.py`.** Frontmatter + `getCollection()` geram os índices em build, com schema validado (datas, títulos, flags). Publicar conteúdo novo = criar um arquivo. Nada de rodar script nem editar JSON.
- **View Transitions substituem `transmissoes-controle.js`** (638 linhas — o maior arquivo do site). A navegação sem reload das Transmissões vira comportamento nativo; breadcrumb e status viram componentes.
- **`transition:persist` no player:** a música continua tocando ao navegar entre páginas. Hoje impossível; na nova stack, um atributo.
- **KaTeX e WebGL sob demanda via frontmatter** (`math: true`, `webgl: true`) — o layout decide o que carregar.
- **Serpente nasce como dados:** grafo de sefirót e caminhos em um arquivo + um componente de página, em vez de 32 HTMLs com lógica de `sessionStorage` duplicada.
- **Galeria:** `galeria-obras.json` vira collection; masonry como componente React; repositórios satélites continuam como planejado.

## Fases

Cada fase tem um critério de saída verificável. Não avançar com a anterior quebrada.

### F0 — Fundação *(Claude Code)*
Branch `refundacao` a partir da `main`. Scaffold do Astro + integração React. Estrutura de pastas da arquitetura alvo. Assets movidos para `public/`. Workflow de deploy criado mas **inerte** — o site publicado continua sendo o vanilla da `main` até a F5. Desenvolvimento local via `npm run dev`.
**Saída:** `npm run dev` mostra uma página com as fontes, a paleta (`#cdcdcd`/`#000`/`#ff0037`), a seleção invertida e o cursor customizado funcionando.

### F1 — Casca e Recepção *(par)*
`Base.astro` com tudo que é global. Porte do `cursor-manager` como script vanilla — **gotcha central:** com View Transitions, scripts não re-executam a cada navegação; efeitos precisam se religar no evento `astro:page-load`. Resolver esse padrão aqui, uma vez, vale para todos os efeitos. Entrada (`index`, sorteio arcano+frase com `localStorage`) e Recepção (contadores, logs, painel, pendências).
**Saída:** Entrada → Recepção indistinguíveis do site atual, cursor incluso.

### F2 — Transmissões *(par, com conversão em lote pelo Claude Code)*
Collections para diário e os três núcleos de notas. Conversão das entradas HTML atuais: Claude Code escreve e roda o script de conversão em lote; **Bruno revisa entrada por entrada** — o conteúdo é a obra, conversão automática não se aprova sozinha. `CRT.astro` com `crt-effects` (religado via `astro:page-load`). Slider randomizado das definições como island React pequena. KaTeX condicional. Decisão embutida: se as View Transitions brigarem com o CRT ou o cursor, cair para MPA puro sem drama — o efeito ganha da conveniência, sempre (princípio 1).
**Saída:** Transmissões completas, navegação fluida, CRT idêntico, matemática renderizando.

### F3 — Player como island React *(Bruno escreve, Claude revisa)*
O primeiro componente React de verdade. YouTube IFrame API dentro do componente, UI customizada, `client:load` + `transition:persist`. O `player-engine.js` atual serve de referência de lógica — mas o componente é escrito do zero, à mão, pelo Bruno. É a peça de aprendizado central da migração.
**Saída:** player com paridade visual, cores por variável CSS como hoje, música ininterrupta entre páginas.

### F4 — Duat, Juramento, Colapso *(par)*
Overlay do Duat (canvas de partículas, scroll, glitch, 777 sticky, easter egg Tiamat), Juramento do Abismo, popup do Colapso em janela própria, iframe do Cbox. Vanilla preservado, adaptado ao ciclo de vida do Astro.
**Saída:** travessia do Duat pixel a pixel como hoje; Tiamat leva ao Juramento; Colapso abre em popup.

### F5 — Paridade e switch *(par)*
Checklist lado a lado, site antigo vs. novo:
- [ ] `localStorage`: `frasesExibidas` (anti-repetição), contador de visitas
- [ ] contador de dias desde `dataIncidente`
- [ ] popup Colapso em janela própria
- [ ] Cbox carregando; fake cursor some sobre iframes
- [ ] player: shuffle, cores por página, comportamento no erro 150
- [ ] Duat completo + Tiamat → Juramento
- [ ] todas as URLs antigas respondendo
- [ ] KaTeX e WebGL (`vesica-piscis`) nas notas
- [ ] viewport 1200 / experiência desktop intacta

Merge na `main`, ativar o deploy por Actions, **reescrever o CLAUDE.md** para a nova stack (obrigação registrada no próprio CLAUDE.md), arquivar este documento.

### F6 — O novo nasce nativo
Grimório (quatro núcleos como collections com layouts próprios), Trabalhos (galeria masonry + repositórios satélites), e então a Serpente como grafo de dados. Nenhuma dessas seções deve ser construída em vanilla na `main` enquanto a refundação estiver ativa — seria retrabalho garantido.

## Divisão de trabalho

**Claude Code (terminal):** todo o git (branch, commits `tipo(escopo):`, merge), scaffold e configuração, conversões em lote, movimentação de arquivos, debugging de build, refatorações que tocam muitos arquivos — sempre expondo o plano antes de executar, como manda o CLAUDE.md.

**Bruno sozinho:** os componentes React (começando pelo player na F3), os `.astro` simples, todo o CSS, e o ajuste fino de qualquer efeito — a mão autoral nos mecanismos de linguagem não se delega. Errar aqui é o método de aprendizado.

**Em par (qualquer ferramenta):** decisões de arquitetura no início de cada fase, revisão do código que o Bruno escreveu, os conceitos novos conforme aparecem (islands, diretivas `client:*`, ciclo de vida com View Transitions, collections/schemas).

**Ritual:** toda sessão começa lendo a seção Estado abaixo e termina atualizando-a. Uma fase por vez; commits enxutos dentro da fase.

## Decisões em aberto (resolver na F0/F1)

- ~~**TypeScript ou JavaScript.**~~ **Resolvido (2026-07-03): TypeScript** — valida os schemas das collections e ensina mais; `.astro` aceita JS comum no meio, o atrito fica contido.
- **View Transitions vs. MPA puro.** Testar cedo (F1, com o cursor). Se qualquer efeito degradar, MPA puro — perde-se o `transition:persist` do player, e só.
- **`-1.html` da Serpente** continua indefinido — decisão de conteúdo, não de stack.

## Estado

```
[000] Plano redigido.
[001] F0 concluída (2026-07-03). Branch refundacao criada; scaffold Astro 7 + React 19 em TypeScript; estrutura alvo montada; assets movidos para public/; workflow de deploy criado, inerte; página de validação respondendo em npm run dev.
[002] TypeScript escolhido (primeira decisão em aberto resolvida).
[003] Próximo: F1 — Base.astro, cursor-manager religado em astro:page-load, Entrada e Recepção.
[004] _
```
