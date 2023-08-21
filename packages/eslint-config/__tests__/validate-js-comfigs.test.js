/**
 * 验证 JS
 */

const eslint = require('eslint');
const path = require('path');
const sumBy = require('lodash/sumBy');
const assert = require('assert');

function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

describe('Validate Js configs', () => {
  it('validate js base config', async () => {
    const configPath = './index.js';
    const filePath = path.resolve(__dirname, './fixtures/index.js');

    const cli = new eslint.ESLint({
      overrideConfigFile: configPath,
      useEslintrc: false,
      ignore: false,
    });

    // 计算配置文件
    const config = await cli.calculateConfigForFile(filePath);
    assert.ok(isObject(config));

    const results = await cli.lintFiles([filePath]);
    assert.equal(sumBy(results, 'fatalErrorCount'), 0);
    assert.notEqual(sumBy(results, 'errorCount'), 0);
    assert.notEqual(sumBy(results, 'warningCount'), 0);
  });
});