import * as core from '@actions/core';
import { track } from 'analytica.click';

async function run(): Promise<void> {
  try {
    const analyticaToken: string = core.getInput('analyticaToken');
    const eventName: string = core.getInput('eventName');
    if (!analyticaToken || !eventName) {
      throw new Error('missing values');
    }

    const e = await track({ analyticaToken, eventName });
    if (e.error) {
      core.error('Unexpected tracking error:' + e.error);
    } else {
      core.info('Tracked event to analytica.click successfully:' + eventName);
    }
  } catch (error) {
    //never fail
    //if (error instanceof Error) core.setFailed(error.message);
  }
}

void run();
