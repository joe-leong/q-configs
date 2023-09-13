/*
 * @Author: joeaaa zdnf_lgq@163.com
 * @Date: 2023-09-08 21:03:31
 * @LastEditors: joeaaa zdnf_lgq@163.com
 * @LastEditTime: 2023-09-12 12:32:08
 * @FilePath: /q-configs/packages/q-lint/src/utils/print-report.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import chalk from 'chalk';
import table from 'text-table';
import stripAnsi from 'strip-ansi';
import terminalLink from 'terminal-link';
import isDocker from 'is-docker';
import { ScanResult } from '../types';
import { PKG_NAME, UNICODE } from './constants';

/**
 * @description: 在控制台打印扫描报告
 * @param {ScanResult} results
 * @param {boolean} fix
 * @return {*}
 */
export default (results: ScanResult[], fix: boolean): void => {
  let output = '\n';
  let errorCount = 0;
  let warningCount = 0;
  let fixableErrorCount = 0;
  let fixableWarningCount = 0;
  let summaryColor = 'yellow';

  const transformMessage = ({ line, column, rule, url, message, errored }) => {
    if (errored) summaryColor = 'red';
    let text = '';
    if (rule && url) {
      text = terminalLink(chalk.blue(rule), chalk.dim(` ${url} `), { fallback: !isDocker() });
    } else if (rule) {
      text = chalk.blue(rule);
    }

    return [
      '',
      chalk.dim(`${line}:${column}`),
      errored ? chalk.red('error') : chalk.yellow('warning'),
      message,
      text,
    ];
  };

  for (const result of results) {
    if (result.messages.length === 0) continue;
    const { messages } = result;

    errorCount += result.errorCount;
    warningCount += result.warningCount;
    fixableErrorCount += result.fixableErrorCount;
    fixableWarningCount += result.fixableWarningCount;

    output += `${chalk.underline(result.filePath)}\n`;
    output += `${table(messages.map(transformMessage), {
      align: ['.', 'r', 'l'],
      stringLength: (str) => stripAnsi(str).length,
    })}\n\n`;
  }
  const total = errorCount + warningCount;
  // 修复日志
  if (fix) output += chalk.green('代码规范问题自动修复完成，请通过 git diff 确认修复效果 :D\n');
  if (fix && total > 0) {
    output += chalk.green('ps. 以上显示的是无法被自动修复的问题，需要手动进行修复\n');
  }

  const pluralize = (word, count) => (count === 1 ? word : `${word}s`);

  if (!fix && total > 0) {
    output += chalk[summaryColor].bold(
      [
        `${UNICODE.failure} `,
        total,
        pluralize(' problem', total),
        ' (',
        errorCount,
        pluralize(' error', errorCount),
        ', ',
        warningCount,
        pluralize(' warning', warningCount),
        ')\n',
      ].join(''),
    );
    if (fixableErrorCount > 0 || fixableWarningCount > 0) {
      output += chalk[summaryColor].bold(
        [
          '  ',
          fixableErrorCount,
          pluralize(' error', fixableErrorCount),
          ' and ',
          fixableWarningCount,
          pluralize(' warning', fixableWarningCount),
          ` potentially fixable with the \`${PKG_NAME} fix\``,
        ].join(''),
      );
    }
  }

  if (!fix && total === 0) output = chalk.green.bold(`${UNICODE.success} no problems`);

  console.log(chalk.reset(output));
};
