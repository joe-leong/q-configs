import markdownlint from 'markdownlint';
import { ScanResult } from '../../types';

export function formatMarkdownLintResults(
  results: markdownlint.LintResults,
  quiet: boolean,
): ScanResult[] {
  const parsedResults = [];

  for (const file in results) {
    if (!Object.prototype.hasOwnProperty.call(results, file) || quiet) continue;

    let warningCount = 0;
    let fixableWarningCount = 0;
    const messages = results[file].map(
      ({ lineNumber, ruleNames, ruleDescription, ruleInformation, errorRange, fixInfo }) => {
        if (fixInfo) fixableWarningCount++;
        warningCount++;

        return {
          line: lineNumber,
          column: Array.isArray(errorRange) ? errorRange[0] : 1,
          rule: ruleNames[0],
          url: ruleInformation,
          message: ruleDescription,
          errored: false,
        };
      },
    );
    parsedResults.push({
      filePath: file,
      messages,
      errorCount: 0,
      warningCount,
      fixableErrorCount: 0,
      fixableWarningCount,
    });
  }
  return parsedResults;
}
