import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    core.debug(new Date().toTimeString());

    core.setOutput('2time', new Date().toTimeString());
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

void run();
