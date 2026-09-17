//required or github actions fetch fails
import 'cross-fetch/polyfill';
import * as core from '@actions/core';

import { runStart } from './main';
import type { IGithubContext } from './types';

async function run(): Promise<void> {
  const ANALYTICA_TOKEN: string = core.getInput('ANALYTICA_TOKEN');
  const gcString: string = core.getInput('GITHUB_CONTEXT');
  // Inputs and the github context may be unavailable in `pre`; runStart falls
  // back to the GITHUB_* environment variables the runner always provides.
  const github = gcString ? (JSON.parse(gcString) as IGithubContext) : ({} as IGithubContext);

  if (!ANALYTICA_TOKEN) {
    core.warning('missing ANALYTICA_TOKEN');
    return;
  }

  return runStart({ ANALYTICA_TOKEN, github });
}

void run();
