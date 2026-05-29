import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Pure-logic unit tests run in Node — no DOM, no DB. Anything that touches
    // the database lives behind integration tests we don't run in CI yet.
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Keep CI honest: a test file that imports the db client would try to open a
    // connection. We intentionally only cover side-effect-free modules here.
  },
});
