//required or github actions fetch fails
import 'cross-fetch/polyfill';

import * as core from '@actions/core';

import { runParams } from './main';
import { IGithubContext } from './types';

async function run(): Promise<void> {
  const ANALYTICA_TOKEN: string = core.getInput('ANALYTICA_TOKEN');
  const gcString: string = core.getInput('GITHUB_CONTEXT');
  const github = JSON.parse(gcString) as IGithubContext;
  if (!ANALYTICA_TOKEN || !github?.repository) {
    core.warning('missing values');
    return;
  }

  return runParams({ ANALYTICA_TOKEN, github });
}

void run();
