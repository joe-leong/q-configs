module.exports = {
  "extends": ["q-eslint-config/typescript/node", "prettier"],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  "rules": {
    "@typescript-eslint/no-require-imports": 1,
    "no-console": 0
  }
}
