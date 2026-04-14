import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import pathLib from 'node:path';

import type { Base, PartialCommandOptions } from '@dword-design/base';
import { nodeFileTrace } from '@vercel/nft';
import { execaCommand } from 'execa';

import resolveAliases from './resolve-aliases';

export default async function (
  this: Base,
  options: PartialCommandOptions = {},
) {
  options = {
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  const result = await execaCommand(
    'mkdist --dist=.output --pattern=** --pattern=!**/*.spec.ts --pattern=!**/*-snapshots',
    {
      ...(options.log && { stdout: 'inherit' }),
      cwd: this.cwd,
      stderr: options.stderr,
    },
  );

  await resolveAliases({ cwd: this.cwd });
  const outDir = pathLib.resolve(this.cwd, '.output');
  const entry = pathLib.resolve(outDir, 'cli.mjs');
  const { fileList } = await nodeFileTrace([entry], { base: this.cwd });
  fileList.delete(pathLib.join('.output', 'cli.mjs'));
  fileList.delete('package.json');

  for (const file of fileList) {
    const src = pathLib.resolve(this.cwd, file);
    const dest = pathLib.resolve(outDir, file);
    await mkdir(pathLib.dirname(dest), { recursive: true });
    await copyFile(src, dest);
  }

  await writeFile(
    pathLib.join(outDir, 'package.json'),
    `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
  );

  return result;
}
