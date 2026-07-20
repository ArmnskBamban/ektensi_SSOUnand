module.exports = {
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
    node: true
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly'
  },
  rules: {
    'no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'smart'],
    'no-eval': 'error',
    'no-implied-eval': 'error'
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/']
};