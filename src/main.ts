import * as core from '@actions/core';
import { track } from 'analytica.click';

export const runParams = async ({
  ANALYTICA_TOKEN,
  GITHUB_CONTEXT,
}: {
  ANALYTICA_TOKEN: string;
  GITHUB_CONTEXT: string;
}) => {
  try {
    const e = await track({ analyticaToken: ANALYTICA_TOKEN, eventName: '' });
    if (e.error) {
      core.error('Unexpected tracking error:' + e.error);
    } else {
      core.info('Tracked event to analytica.click successfully:' + '');
    }
  } catch (error) {
    //never fail
    //if (error instanceof Error) core.setFailed(error.message);
  }
};
