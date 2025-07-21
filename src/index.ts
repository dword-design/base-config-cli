import pathLib from 'node:path';

import type { Base, Config } from '@dword-design/base';
import { defineBaseConfig } from '@dword-design/base';
import baseConfigNode from '@dword-design/base-config-node';
import deepmerge from 'deepmerge';
import packageName from 'depcheck-package-name';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import loadPkg from 'load-pkg';

import getEcosystemConfig from './get-ecosystem-config';

export default defineBaseConfig(function (this: Base, config: Config) {
  const packageConfig = loadPkg.sync(this.cwd);
  return deepmerge(baseConfigNode.call(this, config), {
    allowedMatches: ['ecosystem.json'],
    editorIgnore: ['ecosystem.json'],
    isLockFileFixCommitType: true,
    npmPublish: false,
    ...(!packageConfig.private && {
      deployPlugins: [
        [
          packageName`@semantic-release/exec`,
          { publishCmd: `${packageName`pm2`} deploy production --force` },
        ],
      ],
      preDeploySteps: [
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: { 'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}' },
        },
        { run: 'ssh-keyscan sebastianlandwehr.com >> ~/.ssh/known_hosts' },
      ],
      prepare: () =>
        fs.outputFile(
          pathLib.join(this.cwd, 'ecosystem.json'),
          `${JSON.stringify(getEcosystemConfig(packageConfig, { cwd: this.cwd }), undefined, 2)}\n`,
        ),
    }),
    commands: {
      setupDeploy: {
        handler: () =>
          execaCommand(`${packageName`pm2`} deploy production setup`, {
            cwd: this.cwd,
            stdio: 'inherit',
          }),
      },
    },
  });
});
