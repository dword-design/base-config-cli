import { createRequire } from 'node:module';
import pathLib from 'node:path';

import type { Base } from '@dword-design/base';
import { defineBaseConfig } from '@dword-design/base';
import packageName from 'depcheck-package-name';
import endent from 'endent';
import fs from 'fs-extra';
import outputFiles from 'output-files';
import { readPackageSync } from 'read-pkg';

import build from './build';
import getEcosystemConfig from './get-ecosystem-config';
import prepublishOnly from './prepublish-only';

const resolver = createRequire(import.meta.url);

export default defineBaseConfig(function (this: Base) {
  const packageConfig = readPackageSync({ cwd: this.cwd });
  return {
    editorIgnore: packageConfig.private
      ? []
      : ['ecosystem.json', 'playbook.yml', 'requirements.yml'],
    gitignore: ['/.output'],
    isLockFileFixCommitType: true,
    ...(!packageConfig.private && {
      deployPlugins: [
        [
          packageName`@semantic-release/exec`,
          { publishCmd: 'ansible-playbook playbook.yml -i .inventory' },
        ],
      ],
      preDeploySteps: [
        { name: 'Build project', run: 'pnpm build' },
        {
          name: 'Create deploy artifact',
          run: `tar -czf deploy.tgz .output${fs.existsSync(pathLib.join(this.cwd, '.env.schema.json')) ? ' .env.schema.json' : ''} ecosystem.json`,
        },
        {
          name: 'Install Python',
          uses: 'actions/setup-python@v4',
          with: { 'python-version': '3.x' },
        },
        {
          name: 'Install ansible',
          run: endent`
            python -m pip install --upgrade pip
            pip install ansible
          `,
        },
        {
          name: 'Install requirements',
          run: 'ansible-galaxy install -r requirements.yml',
        },
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: { 'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}' },
        },
        { run: 'ssh-keyscan -H sebastianlandwehr.com >> ~/.ssh/known_hosts' },
        {
          run: endent`
            cat <<EOF > .inventory
            [servers]
            sebastianlandwehr.com ansible_user=\${{ secrets.SSH_USER }} ansible_become=True
            EOF
          `,
        },
      ],
      prepare: async () => {
        const [playbookYml, requirementsYml] = await Promise.all([
          fs.readFile(resolver.resolve('./playbook.yml'), 'utf8'),
          fs.readFile(resolver.resolve('./requirements.yml'), 'utf8'),
        ]);

        await outputFiles(this.cwd, {
          'ecosystem.json': `${JSON.stringify(getEcosystemConfig(packageConfig, { cwd: this.cwd }), undefined, 2)}\n`,
          'playbook.yml': playbookYml,
          'requirements.yml': requirementsYml,
        });
      },
      renovateConfig: { ignorePaths: ['requirements.yml'] },
    }),
    commands: { build, prepublishOnly },
  };
});
