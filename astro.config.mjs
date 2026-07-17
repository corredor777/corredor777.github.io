// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import mdx from "@astrojs/mdx";

// Saída 100% estática servível pelo GitHub Pages (restrição dura do projeto).
export default defineConfig({
  site: "https://corredor777.github.io",
  integrations: [react(), mdx()],
  build: {
    // Uma página = um .html (main.astro → /main.html, não /main/):
    // permalinks do site vanilla são parte da obra (REFUNDACAO.md, princípio 4).
    format: "file",
  },
});