import * as core from '@actions/core';
import { event } from 'analytica.click/dist/helpers/server';

import { getFailureDescription, truncateDescription } from './annotations';
import type { IGithubContext, IJobContext } from './types';

// Vercel notifies GitHub via the Deployments API (deployment_status event,
// creator https://github.com/apps/vercel) and via repository_dispatch
// (vercel.deployment.*). Both must map onto the same event-name shape the
// analytica.click backend classifies as a build failure, otherwise the push
// notification never fires.
const VERCEL_CREATOR_URL = 'https://github.com/apps/vercel';

export const getVercelState = (github: IGithubContext): string | undefined => {
  if (github.event?.deployment_status?.state) {
    return github.event.deployment_status.state;
  }
  const payloadState = github.event?.client_payload?.state?.type;
  if (payloadState) {
    return payloadState;
  }
  const action = github.event?.action;
  if (github.event_name === 'repository_dispatch' && action?.startsWith('vercel.deployment.')) {
    return action.slice('vercel.deployment.'.length);
  }
  return undefined;
};

export const getVercelEnvironment = (github: IGithubContext): string | undefined => {
  const environment =
    github.event?.deployment_status?.environment ?? github.event?.client_payload?.environment;
  return typeof environment === 'string' && environment.trim().length > 0
    ? environment.trim()
    : undefined;
};

export const isVercelEvent = (github: IGithubContext): boolean => {
  if (github.event?.deployment_status) {
    return true;
  }
  if (github.event_name !== 'repository_dispatch') {
    return false;
  }
  return (
    typeof github.event?.action === 'string' && github.event.action.startsWith('vercel.deployment.')
  );
};

export const isVercelFailureState = (state: string | undefined): boolean => {
  if (!state) {
    return false;
  }
  const normalized = state.trim().toLowerCase();
  // deployment_status uses failure/error; repository_dispatch uses
  // failed/error. Anything else (success, ready, pending, ...) is not a failure.
  return normalized === 'failure' || normalized === 'failed' || normalized === 'error';
};

export const getVercelFailureDescription = (github: IGithubContext): string | undefined => {
  const state = getVercelState(github);
  const environment = getVercelEnvironment(github);
  const description =
    github.event?.deployment_status?.description?.trim() ||
    github.event?.client_payload?.error?.trim() ||
    github.event?.client_payload?.state?.detail?.trim() ||
    '';
  const parts = [
    environment ? `environment: ${environment}` : undefined,
    state ? `state: ${state}` : undefined,
    description || undefined,
  ].filter((part): part is string => Boolean(part));
  if (parts.length === 0) {
    return 'vercel deployment failed';
  }
  return truncateDescription(`vercel deploy failed: ${parts.join(' | ')}`);
};

export const getEventName = ({ github, job }: { github: IGithubContext; job: IJobContext }) => {
  const vercelState = getVercelState(github);
  if (vercelState || isVercelEvent(github)) {
    const environment = getVercelEnvironment(github) ?? 'production';
    // Normalize all failure spellings to `failure` so the backend
    // `isBuildFailureEventName` suffix match always fires.
    const state = isVercelFailureState(vercelState) ? 'failure' : (vercelState ?? 'unknown');
    return `${github.repository}/VERCEL/${environment}/deploy/${state}`;
  }

  return `${github.repository}/GH/${github.job}/${github.event_name}/${job.status}`;
};
export const runParams = async ({
  ANALYTICA_TOKEN,
  GITHUB_TOKEN,
  github,
  job,
}: {
  ANALYTICA_TOKEN: string;
  GITHUB_TOKEN?: string;
  github: IGithubContext;
  job: IJobContext;
}) => {
  try {
    const eventName = getEventName({ github, job });
    if (!eventName) {
      core.error('no event name calculated');
      return;
    }
    if (isVercelEvent(github)) {
      const creator = github.event?.deployment_status?.creator as
        | { html_url?: unknown; login?: unknown }
        | undefined;
      const creatorUrl = typeof creator?.html_url === 'string' ? creator.html_url : undefined;
      const creatorLogin = typeof creator?.login === 'string' ? creator.login : undefined;
      core.info(
        `vercel event detected: event=${github.event_name} actor=${github.actor} creator=${creatorLogin ?? creatorUrl ?? 'unknown'} state=${getVercelState(github) ?? 'unknown'}`,
      );
      if (
        github.event?.deployment_status &&
        creatorUrl &&
        creatorUrl !== VERCEL_CREATOR_URL &&
        creatorLogin !== 'vercel[bot]'
      ) {
        core.warning(
          `deployment_status creator is ${creatorUrl}, expected ${VERCEL_CREATOR_URL}. tracking anyway.`,
        );
      }
    }
    const vercelFailed = isVercelEvent(github) && isVercelFailureState(getVercelState(github));
    const description = vercelFailed
      ? getVercelFailureDescription(github)
      : job.status === 'failure'
        ? await getFailureDescription({ GITHUB_TOKEN, eventName, github, job })
        : undefined;
    const e = await event({
      analyticaToken: ANALYTICA_TOKEN,
      eventName,
      ...(description ? { description } : {}),
    });
    if (e.error) {
      core.error('Unexpected tracking error:' + e.error);
    } else if (description) {
      core.info(
        `Tracked event to analytica.click successfully:${eventName} description:${description}`,
      );
    } else {
      core.info(`Tracked event to analytica.click successfully:${eventName} (no description)`);
    }
  } catch {
    //never fail
    //if (error instanceof Error) core.setFailed(error.message);
  }
};
