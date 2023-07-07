import * as core from '@actions/core';
import { track } from 'analytica.click';

import { IGithubContext } from './types';

const getEventName = (github: IGithubContext) => {
  if (github.event.deployment_status && github.actor === 'vercel[bot]') {
    return `${github.repository}/VERCEL/${github.event.deployment_status.environment}/deploy/${github.event.deployment_status.state}`;
  }

  return `${github.repository}/GH/${github.job}/${github.event_name}`;
};
export const runParams = async ({
  ANALYTICA_TOKEN,
  github,
}: {
  ANALYTICA_TOKEN: string;
  github: IGithubContext;
}) => {
  try {
    const eventName = getEventName(github);
    if (!eventName) {
      core.error('no event name calculated');
      return;
    }
    const e = await track({
      analyticaToken: ANALYTICA_TOKEN,
      eventName,
    });
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
