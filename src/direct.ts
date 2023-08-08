import { runParams } from './main';
import type { IGithubContext, IJobContext } from './types';

void runParams({
  ANALYTICA_TOKEN: 'xxx',
  github: { repository: 'xxx' } as IGithubContext,
  job: { status: 'success' } as IJobContext,
});
