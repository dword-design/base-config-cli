import { execaCommand } from 'execa'
import fs from 'fs-extra'
import withLocalTmpDir from 'with-local-tmp-dir'

import self from './index.js'

export default {
  'git https url': () =>
    withLocalTmpDir(async () => {
      await fs.outputFile('package.json', JSON.stringify({ name: 'foo' }))
      await execaCommand('git init')
      await execaCommand(
        'git remote add origin https://github.com/dword-design/foo.git',
      )
      expect(self().deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git',
      )
    }),
  'git ssh url': () =>
    withLocalTmpDir(async () => {
      await fs.outputFile('package.json', JSON.stringify({ name: 'foo' }))
      await execaCommand('git init')
      await execaCommand(
        'git remote add origin git@github.com:dword-design/foo.git',
      )
      expect(self().deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git',
      )
    }),
}
