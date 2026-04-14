import pathLib from 'node:path';

import * as babel from '@babel/core';
import packageName from 'depcheck-package-name';
import fs from 'fs-extra';
import { globby } from 'globby';

export default async ({ cwd = '.' } = {}) => {
  const babelConfig = {
    plugins: [
      [
        packageName`babel-plugin-module-resolver`,
        { alias: { '@/src': './dist' }, cwd },
      ],
      packageName`babel-plugin-add-import-extension`,
    ],
  };

  const paths = await globby('**/*.js', {
    absolute: true,
    cwd: pathLib.join(cwd, 'dist'),
  });

  await Promise.all(
    paths.map(async path => {
      const source = await fs.readFile(path, 'utf8');

      const result = await babel.transformAsync(source, {
        ...babelConfig,
        cwd,
        filename: path,
      });

      if (result?.code) {
        await fs.outputFile(path, result.code);
      }
    }),
  );
};
