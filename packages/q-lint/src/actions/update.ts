import ora from 'ora';
import { PKG_NAME, PKG_VERSION } from '../utils/constants';
import npmType from '../utils/npm-type';
import { execSync } from 'child_process';
import log from '../utils/log';

/**
 * 检查最新版本
 */
const checkLatestVersion = async (): Promise<string | null> => {
  const npm = await npmType;
  const latestVersion = execSync(`${npm} view ${PKG_NAME} version`).toString('utf-8').trim();

  if (latestVersion === PKG_VERSION) return null;

  // 本地=版本号
  const compareArr = PKG_VERSION.split('.').map(Number);
  // 最新版本号
  const beCompareArr = latestVersion.split('.').map(Number);

  for (let i = 0; i < compareArr.length; i++) {
    if (compareArr[i] > beCompareArr[i]) {
      return null;
    } else if (compareArr[i] < beCompareArr[i]) {
      return latestVersion;
    }
  }
};

/**
 * 检查包版本
 * @param install - 自动安装最新包
 */
export default async (install = false) => {
  const checking = ora(`[${PKG_NAME}] 正在检查最新版本...`);
  checking.start();
  try {
    const npm = await npmType;
    const latestVersion = await checkLatestVersion();
    checking.stop();
    if (latestVersion && install) {
      const update = ora(`[${PKG_NAME}] 存在新版本，请升级至 ${latestVersion}`);
      update.start();
      execSync(`${npm} i -g ${PKG_NAME}`);
      update.stop();
    } else if (latestVersion) {
      log.warn(
        `最新版本为 ${latestVersion}，本地版本为 ${PKG_VERSION}，请尽快升级到最新版本。\n你可以执行 ${npm} install -g ${PKG_NAME}@latest 来安装此版本\n`,
      );
    } else if (install) {
      log.info(`当前没有可用的更新`);
    }
  } catch (e) {
    checking.stop();
    log.error(e);
  }
};
