import * as core from '@actions/core';
import { track } from 'analytica.click';

export const runParams = async ({
  analyticaToken,
  eventName,
}: {
  analyticaToken: string;
  eventName: string;
}) => {
  try {
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
};
