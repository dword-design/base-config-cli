import { expect, test } from '@playwright/test';
import { execaCommand } from 'execa';

import self from '.';

test('git https url', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();
  await execaCommand('git init', { cwd });

  await execaCommand(
    'git remote add origin https://github.com/dword-design/foo.git',
    { cwd },
  );

  expect(self({ name: 'foo' }, { cwd }).deploy.production.repo).toEqual(
    'git@github.com:dword-design/foo.git',
  );
});

test('git ssh url', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();
  await execaCommand('git init', { cwd });

  await execaCommand(
    'git remote add origin git@github.com:dword-design/foo.git',
    { cwd },
  );

  expect(self({ name: 'foo' }, { cwd }).deploy.production.repo).toEqual(
    'git@github.com:dword-design/foo.git',
  );
});
