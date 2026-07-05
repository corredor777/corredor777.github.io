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
│   ├── data/            dados reutilizáveis: identidade.json (Zelador, Virgílio,
│   │                    Tiamat, dados do dev), arcanos, playlists
│   ├── styles/          CSS reconstruído pelo Bruno, fiel ao original
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

## Divisão de trabalho e método

**Método central (revisto em 2026-07-04): reconstrução manual.** O Bruno reconstrói o site do zero na stack nova — páginas, componentes, CSS, dados — digitando ele mesmo, com o site antigo (`main`) aberto como gabarito. O Claude Code atua como **revisor e professor**, não como executor: quando o Bruno travar, o pedido é "me explique como resolver e revise o que eu escrever", nunca "escreva para mim". O checklist de paridade da F5 continua sendo o portão — reconstruir com liberdade, comparar com rigor.

**Exceção — os efeitos:** cursor-manager, glitch, CRT, canvas do Duat, WebGL não se reescrevem do zero; o código vanilla existente já É o comportamento exato da obra, e reescrever de memória arrisca deriva sutil. Para esses, adaptar o arquivo original (com o Claude Code explicando linha a linha), preservando o comportamento (princípio 1 acima do aprendizado, só aqui).

**Claude Code (terminal):** todo o git (commits `tipo(escopo):`, merge), configuração, conversões em lote de conteúdo (F2), debugging de build, revisão do código do Bruno, explicação de conceitos — sempre assumindo que o Bruno sabe HTML/CSS e está aprendendo o resto.

**Dados reutilizáveis em `src/data/`:** identidade (Zelador, Virgílio, Tiamat, dados do dev Bruno Oliveira Marrega), arcanos+frases, playlists. JSON importado direto nas páginas — nome muda uma vez, muda em todo lugar.

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
[004] Método revisto (2026-07-04): reconstrução manual pelo Bruno, Claude Code como revisor/professor. src/data/ adicionado à arquitetura. Efeitos: adaptar, nunca reescrever.
[005] Landing da F1 concluída (2026-07-04): Entrada reconstruída (index.astro + intro.css) com sorteio arcano+frase via localStorage, chuva de sangue, strobo, cursores e favicon animado; build estático gerando index.html na raiz de dist/.
[006] Padrão de efeitos estabelecido: módulo em src/scripts/ + export iniciar*() + guarda de idempotência + religação via astro:page-load + checagem de página no browser antes de fechar.
[007] Próximo: main.astro (Recepção) — contadores, logs, painel, pendências.
[008] Strobo unificado (2026-07-04): strobo.js exporta stroboGlobal (página inteira, Entrada), stroboVelocidade (proporcional à velocidade do mouse, painel) e stroboFlash (liga/desliga probabilístico, texto e scrollbar do log). Dois bugs corrigidos: estado invertido persistindo na volta via bfcache (pageshow limpa) e scrollbars fantasma na landing (overflow travado no intro.css). Módulo commitado; usos nas páginas e CSS aguardam o commit da Recepção em reconstrução.
[009] Incidente (2026-07-04): o .git da cópia de trabalho foi corrompido por bytes nulos — causa: sincronização de nuvem por cima do .git na localização antiga (Documents). Working tree intacto; os dois commits que só existiam localmente (f793ac6, 1e5ca83) foram empurrados ao remoto antes da recuperação.
[010] Repositório refundado em clone limpo (2026-07-04): endereço definitivo C:\dev\corredor777.github.io, fora de qualquer área sincronizada. A cópia corrompida virou C:\dev\corredor777-backup-corrompido. Transplantados o trabalho em andamento (Recepção + ajustes) e os arquivos fora do versionamento (CLAUDE.md, configs locais); fsck, npm install e build limpos no destino.
[011] Recepção componentizada (2026-07-04): Linha, BotaoGrandeStrobo e BotaoFooter extraídos; Painel reduzido à tabela+leitura com CSS no componente. Dois bugs pegos na revisão: onclick com ${} em atributo estático (Astro não interpola — virou expressão com template literal) e .strobo-texto morto em <style> escopado do Painel (a classe é ligada por JS em nós do log, fora do subtree — voltou ao main.css). Lição registrada: regra CSS de classe manipulada por JS só funciona escopada se os nós-alvo forem renderizados pelo próprio componente.
[012] Strobo da Entrada corrigido (2026-07-04): o filtro volta ao elemento raiz (html.negativo), como no vanilla — filtro na raiz alcança o canvas inteiro, filtro no body deixava frestas de #cdcdcd sem inversão nas bordas (medido por pixel em screenshot headless: bordas 205 → 4-5, igual ao site publicado). O background explícito do html (workaround do arranjo anterior) saiu junto.
[013] Ocorrências portadas (2026-07-04): contadores de dias e visitas em src/scripts/contadores.js (padrão de efeitos), dataIncidente em src/data/ocorrencias.json, chave visitas-corredor preservada. HTML da seção fica direto na main.astro (uso único, decisão do Bruno). Verificado headless: 052 dias, visitante antigo 41→42.
[014] Falta da F1 (ordem proposta): Logs (registro.json), Pendências (pendencias.json), casca do player (sem motor — motor é F3), Chatbox (iframe Cbox). Bruno digita HTML/CSS/componentes; Claude orienta e adapta lógica.
[015] _
```
