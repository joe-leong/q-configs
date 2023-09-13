import { LinterOptions } from 'stylelint';
import { Config, PKG, ScanOptions } from '../../types';
import path from 'path';
import fs from 'fs-extra';
import { STYLELINT_IGNORE_PATTERN } from '../../utils/constants';
import glob from 'glob';

export function getStyleLintConfig(options: ScanOptions, pkg: PKG, config: Config): LinterOptions {
  const { cwd, fix } = options;

  if (config.enableStylelint === false) return {} as any;
  const lintConfig: any = {
    fix: Boolean(fix),
    allowEmptyInput: true,
  };

  if (config.stylelintOptions) {
    Object.assign(lintConfig, config.stylelintOptions);
  } else {
    // 根据扫描目录下有无lintrc文件，若无则使用默认的 lint 配置
    const lintConfigFiles = glob.sync('.stylelintrc?(.@(js|yaml|yml|json))', { cwd });
    if (lintConfigFiles.length === 0 && !pkg.stylelint) {
      lintConfig.config = {
        extends: 'q-stylelint-config',
      };
    }

    // 根据扫描目录下有无lintignore文件，若无则使用默认的 ignore 配置
    const ignoreFilePath = path.resolve(cwd, '.stylelintignore');
    if (!fs.existsSync(ignoreFilePath)) {
      lintConfig.ignorePattern = STYLELINT_IGNORE_PATTERN;
    }
  }
  return lintConfig;
}
