import * as core from '@actions/core';
import { track } from 'analytica.click';

import type { IGithubContext, IJobContext } from './types';

const getEventName = ({
  github,
  job,
}: {
  github: IGithubContext;
  job: IJobContext;
}) => {
  if (github.event.deployment_status && github.actor === 'vercel[bot]') {
    return `${github.repository}/VERCEL/${github.event.deployment_status.environment}/deploy/${github.event.deployment_status.state}`;
  }

  return `${github.repository}/GH/${github.job}/${github.event_name}/${job.status}`;
};
export const runParams = async ({
  ANALYTICA_TOKEN,
  github,
  job,
}: {
  ANALYTICA_TOKEN: string;
  github: IGithubContext;
  job: IJobContext;
}) => {
  try {
    const eventName = getEventName({ github, job });
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
