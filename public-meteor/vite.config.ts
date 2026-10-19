import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
// Versioned once, at the root (the workspace package.json files stay 0.0.0).
import { version } from '../package.json'

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: 'community-cafe-public-meteor',
      release: { name: `community-cafe-public-meteor@${version}` },
      sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
      // Only active when uploading source maps in CI (both token and org present).
      disable: !process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG,
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
