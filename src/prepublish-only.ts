import type { Base, PartialCommandOptions } from '@dword-design/base';

export default async function (
  this: Base,
  options: PartialCommandOptions = {},
) {
  await this.lint(options);
  await this.typecheck(options);
  return this.run('build', options);
}
