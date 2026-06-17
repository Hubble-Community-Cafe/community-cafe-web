import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    env: {
      VITE_PUBLIC_API_URL: 'http://localhost:8080',
    },
  },
})
