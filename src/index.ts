//required or github actions fetch fails
import 'cross-fetch/polyfill';

import * as core from '@actions/core';

import { runParams } from './main';

async function run(): Promise<void> {
  const ANALYTICA_TOKEN: string = core.getInput('ANALYTICA_TOKEN');
  const GITHUB_CONTEXT: string = core.getInput('GITHUB_CONTEXT');
  if (!ANALYTICA_TOKEN || !GITHUB_CONTEXT) {
    core.warning('missing values');
    return;
  }
  // return runParams({ ANALYTICA_TOKEN, GITHUB_CONTEXT });
  console.log('gc1=', GITHUB_CONTEXT);
  console.log('gc=', (GITHUB_CONTEXT as any).token);
}

void run();
