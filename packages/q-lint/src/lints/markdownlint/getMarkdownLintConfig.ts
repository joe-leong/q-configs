import { Config, PKG, ScanOptions } from '../../types';
import markdownLint from 'markdownlint';
import markdownLintConfig from 'q-markdownlint-config';
import glob from 'glob';
import path from 'path';

type LintOptions = markdownLint.Options & { fix?: boolean };

export function getMarkdownLintConfig(options: ScanOptions, pkg: PKG, config: Config): LintOptions {
  const { cwd } = options;
  const lintConfig: LintOptions = {
    fix: Boolean(options.fix),
    resultVersion: 3,
  };
  if (config.markdownlintOptions) {
    // 若用户传入了 markdownlintOptions，则用用户的
    Object.assign(lintConfig, config.markdownlintOptions);
  } else {
    const lintConfigFiles = glob.sync('.markdownlint(.@(yaml|yml|json))', { cwd });
    if (lintConfigFiles.length === 0) {
      lintConfig.config = markdownLintConfig;
    } else {
      lintConfig.config = markdownLint.readConfigSync(path.resolve(cwd, lintConfigFiles[0]));
    }
  }
  return lintConfig;
}
