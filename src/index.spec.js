import { Base } from '@dword-design/base'
import { execaCommand } from 'execa'
import fs from 'fs-extra'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  async afterEach() {
    await this.resetWithLocalTmpDir()
  },
  async beforeEach() {
    this.resetWithLocalTmpDir = await withLocalTmpDir()
  },
  private: async () => {
    await fs.outputFile('package.json', JSON.stringify({ private: true }))
    await new Base({ name: '../src/index.js' }).prepare()
    expect(await fs.exists('ecosystem.json')).toBe(false)
  },
  async works() {
    await execaCommand('git init')
    await execaCommand(
      'git remote add origin git@github.com:dword-design/foo.git',
    )
    await fs.outputFile('package.json', JSON.stringify({ name: 'foo' }))
    await new Base({ name: '../src/index.js' }).prepare()
    expect(await fs.readJson('ecosystem.json')).toMatchSnapshot(this)
  },
}
