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

**Ordem de execução (revista em 2026-07-17): F0 → F1 → F2 → F4 → F3 → F5 → F6.** Os números das fases são estáveis (o log de Estado os referencia); o que mudou é a ordem em que se executam. A F3 (player) fica pulada até o layout fechar no Figma, e a F4 vem antes dela para que o player seja o único portão restante antes do switch (F5).

### F0 — Fundação *(Claude Code)*
Branch `refundacao` a partir da `main`. Scaffold do Astro + integração React. Estrutura de pastas da arquitetura alvo. Assets movidos para `public/`. Workflow de deploy criado mas **inerte** — o site publicado continua sendo o vanilla da `main` até a F5. Desenvolvimento local via `npm run dev`.
**Saída:** `npm run dev` mostra uma página com as fontes, a paleta (`#cdcdcd`/`#000`/`#ff0037`), a seleção invertida e o cursor customizado funcionando.

### F1 — Casca e Recepção *(par)*
`Base.astro` com tudo que é global. Porte do `cursor-manager` como script vanilla — **gotcha central:** com View Transitions, scripts não re-executam a cada navegação; efeitos precisam se religar no evento `astro:page-load`. Resolver esse padrão aqui, uma vez, vale para todos os efeitos. Entrada (`index`, sorteio arcano+frase com `localStorage`) e Recepção (contadores, logs, painel, pendências).
**Saída:** Entrada → Recepção indistinguíveis do site atual, cursor incluso.

### F2 — Transmissões *(par, com conversão em lote pelo Claude Code)*

Arquitetura consolidada (2026-07-17, ver [025]): **página única com injeção client-side por dentro; três URLs reais no build; casca transplantada do vanilla.** O spike F2a fechou a decisão de navegação — View Transitions ficam no site, mas a navegação *interna* da seção volta ao modelo do vanilla, agora que a restrição das três URLs tirou o benefício de páginas por entrada.

**a. Conteúdo em collections MDX.** Diário e os três núcleos de notas viram collections em **MDX** (facilidade de conteúdo é prioridade declarada: **entrada nova = um arquivo `.mdx`**, sem tocar em HTML nem rodar `gerar-indice.py`). Casos especiais são recorrentes — a intenção é explorar cada vez mais WebGL e inserções de código —, então toda entrada nasce podendo importar componente. Inserção visual = componente `.astro`/vanilla importado no MDX; `math`/`webgl` no frontmatter dizem ao controle o que carregar. `vesica-piscis` é o piloto. Conversão das entradas HTML atuais: Claude Code escreve e roda o script de conversão em lote; **Bruno revisa entrada por entrada** — o conteúdo é a obra, conversão automática não se aprova sozinha.

**b. Build gera fragmentos + índices.** Cada entrada é compilada num **fragmento** (o HTML interno, sem casca) e os índices das subseções vêm embutidos do `getCollection()`. Nada de `index.json` gerado por script.

**c. Controle enxuto client-side.** Um módulo de ~100 linhas — herdeiro assumido do `transmissoes-controle.js` (638 linhas), enxugado — injeta os fragmentos no `#monitor-target`, monta os índices, cuida de breadcrumb/status/boot e do `reexecutarScripts` (rehidratar `<script>` de fragmento injetado, para WebGL/inserções voltarem a rodar — mecanismo já provado no vanilla). Navegação interna **não recarrega** e **não re-boota** (paridade com o vanilla).

**d. Casca transplantada, não reconstruída.** A carcaça CRT (`fragmentos/transmissoes/main.html` + `style.css`/`componentes.css`) é **transplantada** do vanilla, não reescrita — a casca é parte do efeito, então vale a exceção do método (adaptar em vez de reconstruir; princípio 1). Isso resolve de vez a vinheta forte e o posicionamento que divergiam no spike. Base do transplante: o `CRT.astro` e o `crt-effects.js` já adaptados no spike (F2a). O `crt-effects` religa via `astro:page-load` ao ENTRAR na seção pelo site (View Transitions); a navegação interna não o toca.

**e. Três rotas reais + pushState.** O build publica exatamente três URLs para entrada por link direto: **`/transmissoes`, `/transmissoes/diario`, `/transmissoes/notas`** (entradas e notas individuais **não** têm URL própria — restrição autoral). A navegação interna troca a URL entre as três via `history.pushState` **sem navegar** (mantém o CRT vivo e a música tocando). O permalink publicado **`/fragmentos/transmissoes/main.html`** vira **stub de redirect** para `/transmissoes`.

**f. React restrito ao player.** Em Transmissões, React aparece só no player (F3, vivendo na casca com `transition:persist`). Inserções de conteúdo são componentes `.astro`/vanilla — não islands. (O slider das definições, antes cogitado como island React, cabe em vanilla dentro do controle.)

Ordem interna da F2: **(a)** ~~spike CRT × View Transitions~~ **concluído ([024]/[025])**; **(b)** schema das collections + `content.config` MDX (Bruno digita, Claude revisa); **(c)** conversão em lote + revisão entrada por entrada; **(d)** transplante da casca + controle enxuto (fragmentos, índices, pushState nas três rotas, `reexecutarScripts`); **(e)** stub de redirect do permalink antigo + paridade (fades 150ms, status CARREGANDO→EM VIGÍLIA, nav bloqueada até o boot, mensagens de erro no vocabulário, modal Esc/clique-fora, fullscreen com voltar, Serpente bloqueada).

**Saída:** Transmissões completas em três URLs, navegação interna fluida sem reload, CRT idêntico ao vanilla, matemática renderizando; entrar/sair da seção por View Transitions preservando o player.

### F3 — Player como island React *(Bruno escreve, Claude revisa)*
O primeiro componente React de verdade. YouTube IFrame API dentro do componente, UI customizada, `client:load` + `transition:persist`. O `player-engine.js` atual serve de referência de lógica — mas o componente é escrito do zero, à mão, pelo Bruno. É a peça de aprendizado central da migração. O layout novo do player está em desenho no Figma (2026-07-06) — a casca adiada ([019]) destrava quando ele fechar. Duas instâncias previstas: Recepção e **Transmissões** (decisão de 2026-07-06) — a música não recarrega ao entrar/sair da seção via `transition:persist` (View Transitions do site, ver [025]); *dentro* de Transmissões a persistência é trivial, porque a navegação interna é página única (não navega, só injeta — não há o que recarregar).
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
- ~~**View Transitions vs. MPA puro.**~~ ~~**View Transitions vs. página única.**~~ **Resolvido (2026-07-17, spike F2a — [024]/[025]):** View Transitions no site (Entrada↔Recepção↔Transmissões, de onde vem o `transition:persist` do player); navegação **interna** de Transmissões em **página única** com injeção client-side (a restrição das três URLs tirou o benefício de páginas por entrada). MPA puro segue descartado.
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
[015] Logs (Registro de Eventos) concluído (2026-07-05): bloco inline virou <LogBox /> + src/data/registro.json. Schema { indice, label?, texto }: HTML embutido no texto (renderizado com set:html, só conteúdo autoral) e label opcional como moldura — o componente formata [NNN] com padStart, envolve o label em .foco-vermelho e acrescenta " :"; entradas fora do padrão "[i] LABEL : texto" (a [003] DUAT, que precisa do <a><span> por disputa de cor com .log-box:hover a) usam label:null e carregam tudo no texto. Sintaxe data-modal='nome' reservada para modais futuros, sem handler por ora. Cursor _ é moldura, último elemento, fora do JSON. Scroll inicial ao fundo via .log-content (o .log-box tem overflow:hidden) — anima por causa do scroll-behavior:smooth; comportamento novo vs. vanilla, confirmado deliberado. CSS dos focos/strobos fica no main.css (nós de set:html não recebem escopamento — lição [011]). Fidelidade ao gabarito conferida: 4 correções ([003] link DUAT, [009]/[010] texto, [012] "do Zelador"). Strobo verificado headless (44/44 flashes nos spans injetados, resíduo 0). astro check: LogBox/registro/main-log limpos; 2 erros remanescentes são do index.astro (import morto iniciarStrobo + JSON.parse sem guarda de null), pré-existentes e fora do escopo. build estático OK.
[016] Pendências concluída (2026-07-05): bloco .to-do inline virou <Pendencias /> + src/data/pendencias.json ({ texto, feito }, texto em HTML via set:html para itens com link). Conceito novo aplicado: atributo booleano condicional (checked={item.feito}). ids item-NN gerados do índice (padStart 2). CSS .to-do/.todo-list mantido no main.css (a regra .todo-list a estiliza link de set:html — não pode escopar, lição [011]). Duas revisões autorais vs. vanilla, confirmadas pelo Bruno ("Organizar" no lugar de "Disponibilizar"; "entreaberta" sem ponto). astro check 0/0, build OK.
[017] Falso alarme de corrupção (2026-07-05): investigada suspeita de segunda corrupção do repo em C:\dev. Não havia corrupção — git fsck limpo, git status limpo, 0 bytes nulos reais em toda a árvore (o alarme veio de um grep $'\x00' que em bash vira grep '' e casa todas as linhas). Confirmado de quebra que C:\dev está fora do Google Drive (roots de backup do Drive são todos sob Documents\, nenhum aponta pra cá) — o endereço definitivo é seguro.
[018] Chatbox concluído (2026-07-05): embed do Cbox virou componente reutilizável <Chatbox boxid boxtag altura? titulo? /> (src montado com template literal). CSS co-localizado no componente (sem set:html, escopar é seguro): iframe modernizado — saíram os 4 atributos obsoletos (frameborder/marginheight/marginwidth/scrolling, que geravam ts(6385)), border:none + display:block no lugar; hover autocontido .chat-container:hover (era .chatbox:hover .chat-container). Limite cross-origin registrado: não dá para estilizar o conteúdo nem a scrollbar interna do Cbox pelo nosso CSS (same-origin policy) — só pelo painel do Cbox (Bruno já ajustou lá); controle total só com o guestbook próprio (Sinetes). Removido CSS morto (#line-pos-chat órfã, hover comentado). astro check 0/0, build OK.
[019] Casca do player ADIADA (2026-07-05, decisão do Bruno): vai mudar o layout do player em breve, então a casca (CSS + limpeza dos onclicks mortos) espera para não virar retrabalho. Marcação segue inline na sidebar da main.astro, sem estilo e com onclicks que apontam para funções da F3 (jogam ReferenceError se clicados).
[020] Próximo da F1: retomar a casca do player quando o layout novo estiver decidido; depois fechar o critério de saída da F1 lado a lado com o vanilla e resolver View Transitions vs. MPA.
[021] Planejamento da F2 (2026-07-06, sessão Cowork): três decisões do Bruno — (1) comportamento, transições e efeitos preservados acima de tudo; (2) conteúdo das collections em MDX, prevendo inserções WebGL/componentes como caso recorrente (vesica-piscis é o piloto do padrão "inserção = componente importado no MDX"); (3) player em Transmissões com música ininterrupta na navegação interna (depende da F3). Consequência: MPA puro descartado; fallback das View Transitions passa a ser página única. Seções F2, F3 e Decisões em aberto atualizadas. Pendente: commit desta revisão pelo Claude Code.
[022] Sequência linear do que falta: fechar critério de saída da F1 (casca do player segue adiada aguardando o layout do Figma — não bloqueia) → spike CRT × View Transitions → schema das collections + content.config (MDX) → conversão em lote + revisão entrada por entrada → reconstrução das páginas de Transmissões → paridade F2 → F3 player (layout do Figma → componente React pelo Bruno → instâncias na Recepção e em Transmissões com persistência) → F4 → F5.
[023] Ordem das fases revista (2026-07-17, sessão Cowork): passa a ser F2 → F4 → F3 → F5 → F6. A F3 (player) fica pulada até o layout fechar no Figma; a F4 (Duat/Juramento/Colapso) vem logo após a F2 para que, ao fim dela, o player seja o único portão restante antes do switch. Grimório permanece na F6. Player aguardando o Figma (o brief solo virou player-ui-brief.md, agora gitignorado — gabarito de design, não publicado). HANDOFF.md reduzido a stub (o conteúdo antigo descrevia a "segunda corrupção", que foi falso alarme [017] — obsoleto). Ao chegar na F5, este REFUNDACAO.md sai do versionamento e vira arquivo só-local (como o CLAUDE.md), preservando via git o histórico até lá. Seção Fases reordenada para refletir a nova ordem.
[024] Spike F2a concluído — VIEW TRANSITIONS ESCOLHIDA, página única descartada (2026-07-17). Adaptado o crt-effects ao ciclo de vida do Astro (export iniciarCRT + teardown + checagem de página) e montada uma casca CRT mínima (CRT.astro) com a camada de efeito em transition:persist e duas páginas dummy (src/pages/spike/a,b). Teste de olho + probe do Bruno na navegação A↔B: sem flash branco; noise e curvatura contínuos (canvas é imune à reparentagem — pixels e RAF independem da posição do nó na árvore); o rolo, que é animação CSS declarativa, reiniciava do topo no swap (reinserir no DOM rebobina animações CSS) — resolvido reancorando a fase via animation-delay negativo no astro:after-swap (roloTempo espelha o currentTime, congelado nas pausas); RAF estável ~120/s (monitor 120Hz, um único loop são, zero acúmulo em 10 navegações); cursor customizado e voltar/avançar do histórico OK. Bug de revisão corrigido: no caminho feliz do iniciarCRT o ResizeObserver seguia no #tela-tubo morto — re-aponta para a tela viva. Consequência para a F3: o transition:persist do player (música ininterrupta entre páginas) vem de graça — é comportamento nativo, não gambiarra. Decisão em aberto "View Transitions vs. página única" resolvida. Falta do spike: fidelidade da casca (o CRT.astro enxuto não portou overlay-vidro, geometria e fundo do vanilla — efeito idêntico por diff, divergência era só de casca) — em andamento; as páginas spike/ e o CRT.astro seguem descartáveis até a reconstrução real da F2 (etapa d).
[025] Revisão do [024] — navegação INTERNA de Transmissões volta a página única; View Transitions ficam no resto do site (2026-07-17, Cowork). Motivo duplo: (1) restrição autoral nova — Transmissões vive em no máximo TRÊS URLs (/transmissoes, /transmissoes/diario, /transmissoes/notas); entradas e notas individuais NÃO ganham URL própria. Sem páginas por entrada, o benefício central das View Transitions dentro da seção (navegar entre permalinks preservando o CRT) desaparece e sobra só o custo — a pilha de remendos do spike (fase do rolo, re-aponte do RO, fundo piscando no swap, posicionamento entre páginas ainda divergente do vanilla no teste de olho). (2) A casca fiel ainda mostrou divergências (posicionamento, vinheta forte, fundo piscando). Decisão: navegação interna = página única com injeção client-side (o fallback já previsto no [021]/[024]), com history.pushState trocando a URL entre as três rotas sem navegar. As View Transitions PERMANECEM no site (Entrada↔Recepção↔Transmissões) — é delas que vem o transition:persist do player na F3 (música ininterrupta ao entrar/sair da seção). O spike NÃO foi desperdício: a adaptação do crt-effects (padrão [006], teardown, re-aponte do RO, ciclo de vida) vale para ENTRAR e SAIR da seção via VT e para o transplante da casca; o que muda é só a navegação de dentro. F2 reescrita com a arquitetura consolidada abaixo.
[026] Fundo das Transmissões otimizado (2026-07-17, decisão de olho do Bruno no compare.html): a textura tv-noise-background-3 na stack nova passou de PNG 4000×3200 / 21 MB para WebP q88 2000×1600 / 590 KB (−97%) — velocidade é prioridade declarada da F2. Vive em public/assets/images/backgrounds/tv-noise-background-3.webp; referência atualizada no CRT.astro. A cópia vanilla (fragmentos/transmissoes/assets/tv-noise-background-3.png) fica intacta — gabarito da casca até a F5, e o blob já está no histórico. Candidatas de compressão geradas em _candidatas-fundo/ (local, agora gitignorada).
[027] F2b — schema das collections (2026-07-17). Integração MDX adicionada (npx astro add mdx → @astrojs/mdx 7.0.3). src/content.config.ts escrito pelo Claude Code (exceção ao método: infra escrita uma vez): quatro collections com glob loader do astro/loaders (API do Astro 5+, confirmada no Astro 7.0.6) — diario (data com z.coerce.date, sem título), definicoes (termo), ensaios e arquivos (titulo); campos comuns math/webgl/rascunho (bool default false) num objeto camposBase espalhado em cada schema. Pastas criadas com .gitkeep (src/content/diario, src/content/notas/{arquivos,definicoes,ensaios}). astro sync + check + build limpos com collections vazias (0 erros; só WARN esperado de "no files found"). Piloto de conversão digitado pelo Bruno à mão (src/content/diario/2026-06-05.mdx — o gesto de cada publicação; resolveu a discrepância de data do vanilla a favor do 06-05 exibido). Hint 'z' is deprecated corrigido: o import do Zod saiu de astro:content → astro:schema → e enfim astro/zod, o caminho recomendado no Astro 7 (astro:schema também está deprecado, com JSDoc apontando astro/zod; os virtual-modules serão removidos). astro check 0 erros / 0 warnings, build limpo. **F2b concluída (2026-07-17).**
[028] _
```
