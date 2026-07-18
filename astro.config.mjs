// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Saída 100% estática servível pelo GitHub Pages (restrição dura do projeto).
export default defineConfig({
  site: "https://corredor777.github.io",
  integrations: [react(), mdx()],
  markdown: {
    // Smartypants LIGADO (decisão autoral): digita reto, sai curvo — aspas
    // curvas e travessões automáticos; a divergência tipográfica com o vanilla
    // é aceita. (É o default do Astro; explicitado aqui como decisão.)
    smartypants: true,
    // GFM DESLIGADO: sem autolink de URL crua nem strikethrough por ~. Links
    // sempre explícitos [texto](url).
    gfm: false,
    // Matemática renderizada no BUILD: remark-math lê $…$ / $$…$$ e
    // rehype-katex gera o HTML do KaTeX. A flag `math: true` do frontmatter
    // passa a controlar só a inclusão do CSS do KaTeX pelo layout (F2d).
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  build: {
    // Uma página = um .html (main.astro → /main.html, não /main/):
    // permalinks do site vanilla são parte da obra (REFUNDACAO.md, princípio 4).
    format: "file",
  },
});
