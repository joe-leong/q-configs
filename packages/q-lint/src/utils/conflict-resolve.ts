import { fsyncSync, readJSONSync } from 'fs-extra';
import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';
import type { PKG } from '../types';
import log from './log';
import inquirer from 'inquirer';
import { PKG_NAME } from './constants';

/**
 * 查找已经存在的配置删掉，脚手架会提供
 * @param cwd
 * @returns string[]
 */
const checkUselessConfig = (cwd: string): string[] => {
  return []
    .concat(glob.sync('.eslintrc?(.@(yaml|yml|json))', { cwd }))
    .concat(glob.sync('.stylelintrc?(.@(yaml|yml|json))', { cwd }))
    .concat(glob.sync('.markdownlint@(rc|.@(yaml|yml|jsonc))', { cwd }))
    .concat(
      glob.sync('.prettierrc?(.@(cjs|config.js|config.cjs|yaml|yml|json|json5|toml))', { cwd }),
    )
    .concat(glob.sync('tslint.@(yaml|yml|json)', { cwd }))
    .concat(glob.sync('.kylerc?(.@(yaml|yml|json))', { cwd }));
};

/**
 * 待重写配置
 * @param cwd
 * @returns string[]
 */
const checkReWriteConfig = (cwd: string): string[] => {
  return glob
    .sync('**/*.ejs', { cwd: path.resolve(__dirname, '../config') })
    .map((name) => name.replace(/^_/, '.').replace(/\.ejs$/, ''))
    .filter((filename) => fs.existsSync(path.resolve(cwd, filename)));
};

// 精确移除依赖
const packageNamesToRemove = [
  '@babel/eslint-parser',
  '@commitlint/cli',
  '@iceworks/spec',
  'babel-eslint',
  'eslint',
  'husky',
  'markdownlint',
  'prettier',
  'stylelint',
  'tslint',
];

// 按前缀移除依赖
const packagePrefixesToRemove = [
  '@commitlint/',
  '@typescript-eslint/',
  'eslint-',
  'stylelint-',
  'markdownlint-',
  'commitlint-',
];
export default async (cwd: string, rewriteConfig?: boolean) => {
  const pkgPath = path.resolve(cwd, 'package.json');
  const pkg: PKG = readJSONSync(pkgPath);
  const dependencies = [].concat(
    Object.keys(pkg.dependencies || {}),
    Object.keys(pkg.devDependencies || {}),
  );
  const willRemovePackage = dependencies.filter(
    (name) =>
      packageNamesToRemove.includes(name) ||
      packagePrefixesToRemove.some((prefix) => name.startsWith(prefix)),
  );

  const uselessConfigs = checkUselessConfig(cwd);
  const reWriteConfigs = checkReWriteConfig(cwd);
  const willChangeCount = willRemovePackage.length + uselessConfigs.length + reWriteConfigs.length;

  if (willChangeCount > 0) {
    log.warn(`检测到项目中存在可能与 ${PKG_NAME} 冲突的依赖和配置，为保证正常运行将`);

    if (willRemovePackage.length > 0) {
      log.warn('删除以下依赖：');
      log.warn(JSON.stringify(willRemovePackage, null, 2));
    }

    if (uselessConfigs.length > 0) {
      log.warn('删除以下配置文件：');
      log.warn(JSON.stringify(uselessConfigs, null, 2));
    }

    if (reWriteConfigs.length > 0) {
      log.warn('覆盖以下配置文件：');
      log.warn(JSON.stringify(reWriteConfigs, null, 2));
    }

    if (typeof rewriteConfig === 'undefined') {
      const { isOverWrite } = await inquirer.prompt({
        type: 'confirm',
        name: 'isOverWrite',
        message: '请确认是否继续：',
      });

      if (!isOverWrite) process.exit(0);
    } else if (!rewriteConfig) {
      process.exit(0);
    }
  }

  // 删除配置文件
  for (const name of uselessConfigs) {
    fs.removeSync(path.resolve(cwd, name));
  }

  // 修正package.json
  delete pkg.eslintConfig;
  delete pkg.eslintIgnore;
  delete pkg.stylelint;

  for (const name of willRemovePackage) {
    delete (pkg.dependencies || {})[name];
    delete (pkg.devDependencies || {})[name];
  }

  fs.writeFileSync(path.resolve(cwd, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');

  return pkg;
};
