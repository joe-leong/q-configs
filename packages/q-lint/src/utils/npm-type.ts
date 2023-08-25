import { sync as commandExistSync } from 'command-exists';

/**
 * 检查npm类型
 */
const promise: Promise<'pnpm' | 'npm'> = new Promise((resolve) => {
  if (!commandExistSync('pnpm')) return resolve('npm');
  resolve('pnpm');
});

export default promise;
