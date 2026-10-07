import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Separado do vite.config.ts: os testes cobrem só funções puras de src/lib e não precisam dos
// plugins do TanStack Start/Nitro.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
