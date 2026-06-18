import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
import baseConfig from '@cafe/shared-web/eslint.config.base.js'

export default defineConfig([
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    rules: {
      // The admin legitimately fetches data on mount (loading state, no data-query
      // library), which this perf-oriented rule flags. Our fetch effects set state
      // only after the await; the pattern is intentional.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
