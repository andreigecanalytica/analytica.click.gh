//required or github actions fetch fails
import 'cross-fetch/polyfill';

import * as core from '@actions/core';

import { runParams } from './main';
import type { IGithubContext, IJobContext } from './types';

async function run(): Promise<void> {
  const ANALYTICA_TOKEN: string = core.getInput('ANALYTICA_TOKEN');
  const gcString: string = core.getInput('GITHUB_CONTEXT');
  const github = JSON.parse(gcString) as IGithubContext;

  const jString: string = core.getInput('JOB_CONTEXT');
  const job = JSON.parse(jString) as IJobContext;

  if (!ANALYTICA_TOKEN) {
    core.warning('missing ANALYTICA_TOKEN');
    return;
  }

  if (!github.repository) {
    core.warning('missing github context');
    return;
  }

  return runParams({ ANALYTICA_TOKEN, github, job });
}

void run();
