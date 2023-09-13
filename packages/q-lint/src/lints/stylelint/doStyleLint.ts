import { extname, join } from 'path';
import { PKG, ScanOptions } from '../../types';
import { STYLELINT_FILE_EXT, STYLELINT_IGNORE_PATTERN } from '../../utils/constants';
import fg from 'fast-glob';
import stylelint from 'stylelint';
import { getStyleLintConfig } from './getStyleLintConfig';
import { formatStyleLintResult } from './formatStyleLintResult';

export interface DoStyleLintOptions extends ScanOptions {
  pkg: PKG;
}
export async function doStyleLint(options: DoStyleLintOptions) {
  let files: string[];

  if (options.files) {
    files = options.files.filter((file) => STYLELINT_FILE_EXT.includes(extname(file)));
  } else {
    const pattern = join(
      options.include,
      `**/*.{${STYLELINT_FILE_EXT.map((t) => t.replace(/^\./, '')).join(',')}}`,
    );
    files = await fg(pattern, {
      cwd: options.cwd,
      ignore: STYLELINT_IGNORE_PATTERN,
    });
  }

  const data = await stylelint.lint({
    files,
    ...getStyleLintConfig(options, options.pkg, options.config),
  });

  return formatStyleLintResult(data.results, options.quiet);
}
