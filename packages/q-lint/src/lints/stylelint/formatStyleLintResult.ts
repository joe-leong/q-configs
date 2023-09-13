import { LintResult } from 'stylelint';
import { ScanResult } from '../../types';
import { getStyleLintRuleDocUrl } from './getStyleLineRuleDocUrl';

export function formatStyleLintResult(results: LintResult[], quiet: boolean): ScanResult[] {
  return results.map(({ source, warnings }) => {
    let errorCount = 0;
    let warningCount = 0;
    const messages = warnings
      .filter((item) => !quiet || item.severity === 'error')
      .map((item) => {
        const { line = 0, column = 0, rule, severity, text } = item;
        if (severity === 'error') {
          errorCount++;
        } else {
          warningCount++;
        }

        return {
          line,
          column,
          rule,
          url: getStyleLintRuleDocUrl(rule),
          message: text.replace(/([^ ])\.$/u, '$1').replace(new RegExp(`\\(${rule}\\)`), ''),
          errored: severity === 'error',
        };
      });
    return {
      filePath: source,
      messages,
      errorCount,
      warningCount,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
    };
  });
}
