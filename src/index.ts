import * as core from '@actions/core';

import { runParams } from './main';

async function run(): Promise<void> {
  const analyticaToken: string = core.getInput('analyticaToken');
  const eventName: string = core.getInput('eventName');
  if (!analyticaToken || !eventName) {
    throw new Error('missing values');
  }
  return runParams({ analyticaToken, eventName });
}

void run();
