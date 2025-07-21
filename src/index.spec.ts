import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { test } from '@playwright/test';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import { expect } from 'playwright-expect-snapshot';

test('private', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'package.json'),
    JSON.stringify({ private: true }),
  );

  await new Base('../../src', { cwd }).prepare();
  expect(await fs.exists(pathLib.join(cwd, 'ecosystem.json'))).toBe(false);
});

test('works', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();
  await execaCommand('git init', { cwd });

  await execaCommand(
    'git remote add origin git@github.com:dword-design/foo.git',
    { cwd },
  );

  await fs.outputFile(
    pathLib.join(cwd, 'package.json'),
    JSON.stringify({ name: 'foo' }),
  );

  await new Base('../../src', { cwd }).prepare();

  expect(
    await fs.readJson(pathLib.join(cwd, 'ecosystem.json')),
  ).toMatchSnapshot();
});
