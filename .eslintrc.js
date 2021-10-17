module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    '@typescript-eslint/no-explicit-any': ['error'],
    'require-jsdoc': 'off',
    'no-trailing-spaces': 'off',
    'max-len': ['error', {'code': 90}],
  },
};
