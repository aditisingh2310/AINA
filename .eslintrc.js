module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'plugin:node/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  rules: {
    'no-console': 'off',
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    'node/no-unpublished-require': 'off',
    'prettier/prettier': 'error',
  },
  plugins: ['prettier'],
  overrides: [
    {
      files: ['**/*.js'],
      excludedFiles: ['components/**/*.js', 'screens/**/*.js', 'App.js'],
    },
  ],
};
