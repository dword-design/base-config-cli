import fs from 'fs-extra';
import hostedGitInfo from 'hosted-git-info';
import loadPkg from 'load-pkg';
import parseGitConfig from 'parse-git-config';
import parsePackagejsonName from 'parse-packagejson-name';

export default () => {
  const repositoryUrl = fs.existsSync('.git')
    ? parseGitConfig.sync()['remote "origin"']?.url
    : undefined;

  const gitInfo = hostedGitInfo.fromUrl(repositoryUrl) || {};

  if (repositoryUrl !== undefined && gitInfo.type !== 'github') {
    throw new Error('Only GitHub repositories are supported.');
  }

  const packageConfig = loadPkg.sync();
  const packageName = parsePackagejsonName(packageConfig.name).fullName;
  return {
    deploy: {
      production: {
        host: ['sebastianlandwehr.com'],
        path: `/var/www/${packageName}`,
        user: 'root',
        ...(repositoryUrl && {
          repo: `git@github.com:${gitInfo.user}/${gitInfo.project}.git`,
        }),
        'post-deploy':
          'source ~/.nvm/nvm.sh && yarn --frozen-lockfile && yarn prepublishOnly',
        ref: 'origin/master',
      },
    },
  };
};
