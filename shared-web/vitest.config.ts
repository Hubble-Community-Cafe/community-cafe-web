import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    env: {
      VITE_PUBLIC_API_URL: 'http://localhost:8080',
    },
    coverage: {
      provider: 'v8',
      // json-summary feeds the CI job summary. include lists every source file, so files no test
      // imports show up as 0% instead of being left out of the report.
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,spec}.{ts,tsx}', '**/*.d.ts'],
    },
  },
})
