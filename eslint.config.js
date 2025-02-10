import config from '@cycraft/eslint/config'
import globals from 'globals'

export default [
  {
    ignores: ['**/dist/*'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  ...config,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.mts', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
]
