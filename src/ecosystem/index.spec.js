import proxyquire from '@dword-design/proxyquire'
import execa from 'execa'
import { outputFile } from 'fs-extra'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  'git https url': () =>
    withLocalTmpDir(async () => {
      await outputFile('package.json', JSON.stringify({ name: 'foo' }))
      await execa.command('git init')
      await execa.command(
        'git remote add origin https://github.com/dword-design/foo.git'
      )

      const self = proxyquire('.', {})
      expect(self.deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git'
      )
    }),
  'git ssh url': () =>
    withLocalTmpDir(async () => {
      await outputFile('package.json', JSON.stringify({ name: 'foo' }))
      await execa.command('git init')
      await execa.command(
        'git remote add origin git@github.com:dword-design/foo.git'
      )

      const self = proxyquire('.', {})
      expect(self.deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git'
      )
    }),
}
