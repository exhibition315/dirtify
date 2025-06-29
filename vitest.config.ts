import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      include: ["src/*"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
})