import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // The app intentionally hydrates local/API state from effects.
      'react-hooks/set-state-in-effect': 'off',
      // Navigation helpers are safe to use from effects before their declaration.
      'react-hooks/immutability': 'off',
      // These effects run on session/navigation boundaries, not helper identity.
      'react-hooks/exhaustive-deps': 'off',
      // Toasts.tsx keeps a component and its tightly-coupled hook together.
      'react-refresh/only-export-components': 'off',
    },
  },
])
