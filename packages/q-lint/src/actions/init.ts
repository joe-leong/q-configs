import path from 'path';
import type { InitOptions } from '../types';
import fs from 'fs-extra';
import update from './update';
import { PKG_NAME, PROJECT_TYPES } from '../utils/constants';
import inquirer from 'inquirer';
import log from '../utils/log';
import conflictResolve from '../utils/conflict-resolve';
import npmType from '../utils/npm-type';
import spawn from 'cross-spawn';
import generateTemplate from '../utils/generate-template';

let step = 0;

/**
 * 选择项目语言和框架
 */
const chooseEslintType = async (): Promise<string> => {
  const { type } = await inquirer.prompt({
    type: 'list',
    name: 'type',
    message: `Step ${++step}. 请选择项目的语言（JS/TS）和框架（React/Vue）类型：`,
    choices: PROJECT_TYPES,
  });

  return type;
};

/**
 * 选择是否启用 stylelint
 * @param defaultValue
 */
const chooseEnableStylelint = async (defaultValue: boolean): Promise<boolean> => {
  const { enable } = await inquirer.prompt({
    type: 'confirm',
    name: 'enable',
    message: `Step ${++step}. 是否需要使用 stylelint（若没有样式文件则不需要）：`,
    default: defaultValue,
  });

  return enable;
};

/**
 * 选择是否启用 markdownlint
 */
const chooseEnableMarkdownLint = async (): Promise<boolean> => {
  const { enable } = await inquirer.prompt({
    type: 'confirm',
    name: 'enable',
    message: `Step ${++step}. 是否需要使用 markdownlint（若没有 Markdown 文件则不需要）：`,
    default: true,
  });

  return enable;
};

/**
 * 选择是否启用 prettier
 */
const chooseEnablePrettier = async (): Promise<boolean> => {
  const { enable } = await inquirer.prompt({
    type: 'confirm',
    name: 'enable',
    message: `Step ${++step}. 是否需要使用 Prettier 格式化代码：`,
    default: true,
  });

  return enable;
};

export default async (options: InitOptions) => {
  const cwd = options.cwd || process.cwd();
  const isTest = process.env.NODE_ENV === 'test';
  const checkVersionUpdate = options.checkVersionUpdate || false;
  const disableNpmInstall = options.disableNpmInstall || false;
  const config: Record<string, any> = {};
  const pkgPath = path.resolve(cwd, 'package.json');
  let pkg = fs.readJSONSync(pkgPath);
  const npm = await npmType;

  // 版本检查
  if (!isTest && checkVersionUpdate) {
    await update(false);
  }

  // 初始化 `enableESLint`，默认为 true，无需让用户选择
  if (typeof options.enableESLint === 'boolean') {
    config.enableESLint = options.enableESLint;
  } else {
    config.enableESLint = true;
  }

  // 初始化 `eslintType`
  if (options.eslintType && PROJECT_TYPES.find((choice) => choice.value === options.eslintType)) {
    config.eslintType = options.eslintType;
  } else {
    config.eslintType = await chooseEslintType();
  }

  // 初始化 `enableStylelint`
  if (typeof options.enableStylelint === 'boolean') {
    config.enableStylelint = options.enableStylelint;
  } else {
    config.enableStylelint = await chooseEnableStylelint(!/node/.test(config.eslintType));
  }

  // 初始化 `enableMarkdownlint`
  if (typeof options.enableMarkdownlint === 'boolean') {
    config.enableMarkdownlint = options.enableMarkdownlint;
  } else {
    config.enableMarkdownlint = await chooseEnableMarkdownLint();
  }

  // 初始化 `enablePrettier`
  if (typeof options.enablePrettier === 'boolean') {
    config.enablePrettier = options.enablePrettier;
  } else {
    config.enablePrettier = await chooseEnablePrettier();
  }

  if (!isTest) {
    log.info(`Step ${++step}. 检查并处理项目中可能存在的依赖和配置冲突`);
    pkg = await conflictResolve(cwd, options.rewriteConfig);
    log.success(`Step ${step}. 已完成项目依赖和配置冲突检查处理 🚀`);
  }

  log.info(`Step ${++step}. 安装依赖`);
  spawn.sync('npm', ['i', 'commitlint', '-g'], {
    stdio: 'ignore',
  });
  const willInstallDeps = [
    `${!disableNpmInstall ? PKG_NAME : ''}`,
    'husky',
    'commitlint-config-q-commitlint-config',
    // config.enableESLint
    //   ? `eslint-config-prettier${
    //       config.eslintType.includes('typescript')
    //         ? ',@typescript-eslint/parser,@typescript-eslint/eslint-plugin,eslint-plugin-import'
    //         : ''
    //     }`
    //   : '',
    // config.eslintType.includes('react') ? 'eslint-plugin-react,eslint-plugin-react-hooks' : '',
    // config.eslintType.includes('vue') ? `eslint-plugin-vue,vue-eslint-parser` : '',
  ]
    .map((e) => e.split(','))
    .reduce((prev, curr) => {
      prev.push(...curr);
      return prev;
    }, [])
    .filter((e) => e);
  spawn.sync(npm, ['i', '-D', ...willInstallDeps], {
    stdio: 'inherit',
    cwd,
  });
  spawn.sync('npx', ['husky', 'install'], {
    stdio: 'inherit',
    cwd,
  });
  log.success(`Step ${step}. 安装依赖成功 :D`);

  // 更新 pkg.json
  pkg = fs.readJSONSync(pkgPath);
  // 在 `package.json` 中写入 `scripts`
  if (!pkg.scripts) {
    pkg.scripts = {};
  }
  pkg.scripts.prepare = 'husky install';
  if (!pkg.scripts[`${PKG_NAME}-scan`]) {
    pkg.scripts[`${PKG_NAME}-scan`] = `${PKG_NAME} scan`;
  }
  if (!pkg.scripts[`${PKG_NAME}-fix`]) {
    pkg.scripts[`${PKG_NAME}-fix`] = `${PKG_NAME} fix`;
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // 配置 commit 卡点
  log.info(`Step ${++step}. 配置 git commit 卡点`);
  spawn.sync('npx', ['husky', 'add', '.husky/commit-msg', `${PKG_NAME} commit-msg-scan`], {
    stdio: 'inherit',
    cwd,
  });
  spawn.sync('npx', ['husky', 'add', '.husky/pre-commit', `${PKG_NAME} commit-file-scan`], {
    stdio: 'inherit',
    cwd,
  });
  log.success(`Step ${step}. 配置 git commit 卡点成功 🚀`);

  log.info(`Step ${++step}. 写入配置文件`);
  generateTemplate(cwd, config);
  log.success(`Step ${step}. 写入配置文件成功 🚀`);

  // 完成信息
  const logs = [`${PKG_NAME} 初始化完成 🚀`].join('\r\n');
  log.success(logs);
};
