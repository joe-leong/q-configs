'use strict';

const rule = require('../rules/no-http-url');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester();

ruleTester.run('no-http-url', rule, {
  valid: [
    {
      code: "var test = 'https://joe.com'",
    },
  ],

  invalid: [
    {
      code: "var test = 'http://joe.com'",
      output: "var test = 'http://joe.com'",
      errors: [
        {
          message: 'Recommended "http://joe.com" switch to HTTPS',
        },
      ],
    },
    {
      code: "<img src='http://joe.com' />",
      output: "<img src='http://joe.com' />",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      errors: [
        {
          message: 'Recommended "http://joe.com" switch to HTTPS',
        },
      ],
    },
  ],
});
