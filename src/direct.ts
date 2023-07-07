import { runParams } from './main';
import { IGithubContext } from './types';

void runParams({
  ANALYTICA_TOKEN: 'xxx',
  github: { repository: 'xxx' } as IGithubContext,
});
