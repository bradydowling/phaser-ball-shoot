module.exports = {
    root: true,
    env: {
      browser: true,
      node: true
    },
    parserOptions: {
      parser: 'babel-eslint',
      ecmaVersion: 2018,
      sourceType: 'module'
    },
    extends: [
      'plugin:prettier/recommended'
    ],
    plugins: [],
    ignorePatterns: ['node_modules/'],
    // add your custom rules here
    rules: {}
  }
