import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { test } from '@playwright/test';
import endent from 'endent';
import { globby } from 'globby';
import outputFiles from 'output-files';
import { expect } from 'playwright-expect-snapshot';

test('works', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'node_modules/foo/index.js': 'export default 1',
    'package.json': JSON.stringify({ dependencies: { foo: '*' }, name: 'foo' }),
    'src/cli.ts': endent`
      import foo from 'foo';
      console.log(foo);
    `,
  });

  await new Base('../../src', { cwd }).run('build');

  expect(
    new Set(await globby('**', { cwd: pathLib.join(cwd, '.output') })),
  ).toEqual(
    new Set([
      'node_modules/foo/index.js',
      'node_modules/foo/package.json',
      'cli.mjs',
      'package.json',
    ]),
  );
});
