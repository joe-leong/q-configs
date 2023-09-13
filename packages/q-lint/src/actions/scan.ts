import path from 'path';
import fs from 'fs-extra';
import type { Config, PKG, ScanOptions, ScanReport, ScanResult } from '../types';
import { PKG_NAME } from '../utils/constants';
import { doESLint, doPrettier } from '../lints';

export default async (options: ScanOptions): Promise<ScanReport> => {
  const { cwd, fix, outputReport, config: scanConfig } = options;

  const readConfigFile = (pth: string): any => {
    const localPath = path.resolve(cwd, pth);
    return fs.existsSync(localPath) ? require(localPath) : {};
  };
  const pkg: PKG = readConfigFile('package.json');
  const config: Config = scanConfig || readConfigFile(`${PKG_NAME}.config.js`);

  const runErrors: Error[] = [];
  let results: ScanResult[] = [];

  // prettier
  if (fix && config.enablePrettier !== false) {
    await doPrettier(options);
  }

  // eslint
  if (config.enableESLint !== false) {
    try {
      const eslintResults = await doESLint({ ...options, pkg, config });
      results = results.concat(eslintResults);
      console.log(results);
    } catch (e) {
      runErrors.push(e);
    }
  }
  return {
    results,
    errorCount: results.reduce((count, { errorCount }) => count + errorCount, 0),
    warningCount: results.reduce((count, { warningCount }) => count + warningCount, 0),
    runErrors,
  };
};
