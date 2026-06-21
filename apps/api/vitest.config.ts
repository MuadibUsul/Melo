import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// SWC handles NestJS decorators + emitDecoratorMetadata reliably under vitest.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    setupFiles: ["reflect-metadata"],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
