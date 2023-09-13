import { extname, join } from 'path';
import { Config, PKG, ScanOptions } from '../../types';
import { MARKDOWN_LINT_FILE_EXT, MARKDOWN_LINT_IGNORE_PATTERN } from '../../utils/constants';
import fg from 'fast-glob';
import markdownlint, { LintError } from 'markdownlint';
import { getMarkdownLintConfig } from './getMarkdownLintConfig';
import { readFile, writeFile } from 'fs-extra';
import markdownLintRuleHelpers from 'markdownlint-rule-helpers';
import { formatMarkdownLintResults } from './formatMarkdownLintResults';

export interface DoMarkdownLintOptions extends ScanOptions {
  pkg: PKG;
  config?: Config;
}
export async function doMarkdownLint(options: DoMarkdownLintOptions) {
  let files: string[];
  if (options.files) {
    files = options.files.filter((name) => MARKDOWN_LINT_FILE_EXT.includes(extname(name)));
  } else {
    const pattern = join(
      options.include,
      `**/*.{${MARKDOWN_LINT_FILE_EXT.map((t) => t.replace(/^\./, '')).join(',')}}`,
    );
    files = await fg(pattern, {
      cwd: options.cwd,
      ignore: MARKDOWN_LINT_IGNORE_PATTERN,
    });
  }
  const results = await markdownlint.promises.markdownlint({
    files,
    ...getMarkdownLintConfig(options, options.pkg, options.config),
  });

  if (options.fix) {
    await Promise.all(
      Object.keys(results).map((filename) => formatMarkdownFile(filename, results[filename])),
    );
  }
  return formatMarkdownLintResults(results, options.quiet);
}

async function formatMarkdownFile(filename: string, errors: LintError[]) {
  const fixes = errors?.filter((error) => error.fixInfo);

  if (fixes?.length > 0) {
    const originalText = await readFile(filename, 'utf8');
    const fixedText = markdownLintRuleHelpers.applyFixes(originalText, fixes);
    if (originalText !== fixedText) {
      await writeFile(filename, fixedText, 'utf8');
      return errors.filter((error) => !error.fixInfo);
    }
  }
  return errors;
}
