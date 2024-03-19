import baseConfigNode from '@dword-design/base-config-node'
import deepmerge from 'deepmerge'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import fs from 'fs-extra'
import loadPkg from 'load-pkg'

import getEcosystemConfig from './get-ecosystem-config/index.js'

export default config => {
  const packageConfig = loadPkg.sync()

  return deepmerge(baseConfigNode(config), {
    allowedMatches: ['ecosystem.json'],
    editorIgnore: ['ecosystem.json'],
    isLockFileFixCommitType: true,
    npmPublish: false,
    packageConfig: {
      main: 'dist/index.js',
    },
    ...(!packageConfig.private && {
      deployPlugins: [
        [
          packageName`@semantic-release/exec`,
          {
            publishCmd: `${packageName`pm2`} deploy production --force`,
          },
        ],
      ],
      preDeploySteps: [
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: {
            'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}',
          },
        },
        { run: 'ssh-keyscan sebastianlandwehr.com >> ~/.ssh/known_hosts' },
      ],
      prepare: () =>
        fs.outputFile(
          'ecosystem.json',
          JSON.stringify(getEcosystemConfig(), undefined, 2),
        ),
    }),
    commands: {
      setupDeploy: {
        handler: () =>
          execa.command('pm2 deploy production setup', { stdio: 'inherit' }),
      },
    },
  })
}
