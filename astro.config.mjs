// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Saída 100% estática servível pelo GitHub Pages (restrição dura do projeto).
export default defineConfig({
  site: "https://corredor777.github.io",
  integrations: [react()],
});
