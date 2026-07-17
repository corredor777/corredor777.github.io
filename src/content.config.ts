// Schema das collections de Transmissões (F2b). Este arquivo é infraestrutura
// — escrito uma vez pelo Claude Code, exceção ao método da reconstrução manual.
// Define, valida e tipa o frontmatter de cada entrada; os índices das
// subseções saem daqui em build (getCollection), aposentando o gerar-indice.py.

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Campos comuns a TODA entrada de Transmissões, espalhados (...) em cada
// schema. São flags que o boot/controle client-side (F2d) vai ler para decidir
// o que carregar por entrada. Todas com default → o frontmatter só precisa
// declará-las quando forem `true`.
const camposBase = {
  math: z.boolean().default(false), // usa KaTeX → o boot carrega a lib
  webgl: z.boolean().default(false), // tem canvas WebGL na entrada
  rascunho: z.boolean().default(false), // fica fora do build (filtro na F2d)
};

// Diário: entradas datadas. A data É o título (como no vanilla), então não há
// campo de título. z.coerce.date() aceita a data do frontmatter tanto como
// string "AAAA-MM-DD" quanto como Date já desserializado pelo YAML.
const diario = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/diario" }),
  schema: z.object({
    data: z.coerce.date(),
    ...camposBase,
  }),
});

// Minhas Notas — três núcleos, cada um em sua pasta.
// Definições: verbete curto identificado por um termo.
const definicoes = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/notas/definicoes" }),
  schema: z.object({
    termo: z.string(),
    ...camposBase,
  }),
});

// Ensaios e Arquivos: textos com título próprio.
const ensaios = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/notas/ensaios" }),
  schema: z.object({
    titulo: z.string(),
    ...camposBase,
  }),
});

const arquivos = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/notas/arquivos" }),
  schema: z.object({
    titulo: z.string(),
    ...camposBase,
  }),
});

// A chave de cada collection é o nome usado em getCollection("diario") etc.
export const collections = { diario, definicoes, ensaios, arquivos };
