import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"]
  }
});
