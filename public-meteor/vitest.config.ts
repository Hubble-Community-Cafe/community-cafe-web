import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // The form tests type whole forms through userEvent, which can pass the 5 s default on a busy
    // machine or CI runner; a real hang still fails, just later.
    testTimeout: 15_000,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // json-summary feeds the CI job summary. include lists every source file, so files no test
      // imports show up as 0% instead of being left out of the report.
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/main.tsx'],
    },
  },
})
