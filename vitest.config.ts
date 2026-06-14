import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      globals: true,
      // Playwright specs in e2e/ run via `pnpm test:e2e`, not Vitest.
      exclude: [...configDefaults.exclude, "e2e/**"],
    },
  }),
);
