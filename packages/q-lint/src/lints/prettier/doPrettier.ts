import { extname, join } from 'path';
import type { ScanOptions } from '../../types';
import { PRETTIER_FILE_EXT, PRETTIER_IGNORE_PATTERN } from '../../utils/constants';
import fg from 'fast-glob';
import { readFile, writeFile } from 'fs-extra';
import prettier from 'prettier';

export interface DoPrettierOptions extends ScanOptions {}

async function formatFile(filePath: string) {
  const text = await readFile(filePath, 'utf-8');
  const options = await prettier.resolveConfig(filePath);
  const formatted = prettier.format(text, { ...options, filepath: filePath });
  await writeFile(filePath, formatted, 'utf8');
}

export async function doPrettier(options: DoPrettierOptions) {
  let files: string[] = [];
  if (options.files) {
    files = options.files.filter((file) => PRETTIER_FILE_EXT.includes(extname(file)));
  } else {
    const pattern = join(
      options.include,
      `**/*.{${PRETTIER_FILE_EXT.map((ext) => ext.replace(/^\./, '')).join(',')}}`,
    );
    files = await fg(pattern, {
      cwd: options.cwd,
      ignore: PRETTIER_IGNORE_PATTERN,
    });
  }
  await Promise.all(files.map(formatFile));
}
