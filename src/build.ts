import pathLib from 'node:path';

import type { Base, PartialCommandOptions } from '@dword-design/base';
import { execaCommand } from 'execa';
import { traceNodeModules } from 'nf3';

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

  await traceNodeModules([entry], {
    outDir: '.output',
    rootDir: this.cwd,
    writePackageJson: true,
  });

  return result;
}
