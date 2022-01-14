import baseConfigNode from '@dword-design/base-config-node'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import { outputFile } from 'fs-extra'
import loadPkg from 'load-pkg'

import ecosystem from './ecosystem'

const packageConfig = loadPkg.sync()

export default {
  ...baseConfigNode,
  allowedMatches: [...baseConfigNode.allowedMatches, 'ecosystem.json'],
  editorIgnore: [...baseConfigNode.editorIgnore, 'ecosystem.json'],
  isLockFileFixCommitType: true,
  npmPublish: false,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: () =>
    outputFile('ecosystem.json', JSON.stringify(ecosystem, undefined, 2)),
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
  }),
  commands: {
    ...baseConfigNode.commands,
    setupDeploy: {
      handler: () =>
        execa.command('pm2 deploy production setup', { stdio: 'inherit' }),
    },
  },
}
