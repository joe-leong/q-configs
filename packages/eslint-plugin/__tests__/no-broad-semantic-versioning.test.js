const rule = require('../rules/no-broad-semantic-versioning');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester();

ruleTester.run('no-broad-senmantic-versioning', rule, {
  valid: [
    {
      filename: 'package.json',
      code: `module.exports = ${JSON.stringify({
        devDependencies: { 'eslint-plugin': '^0.0.5' },
      })}`,
    },
    {
      filename: 'package.js',
      code: 'var t = 1',
    },
  ],
  invalid: [
     {
      filename: 'package.json',
      code: `module.exports = ${JSON.stringify({
        devDependencies: { 'eslint-plugin': '*' },
      })}`,
      errors: [
        {
          message: 'The "eslint-plugin" is not recommended to use "*"',
        },
      ],
    },
     {
      filename: 'package.json',
      code: `module.exports = ${JSON.stringify({
        devDependencies: { 'eslint-plugin': '2.x' },
      })}`,
      errors: [
        {
          message: 'The "eslint-plugin" is not recommended to use "2.x"',
        },
      ],
    },
  ],
});
