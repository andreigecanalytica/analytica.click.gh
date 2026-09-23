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
    github.event?.deployment_status?.description.trim() ||
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

  return `${github.repository}/GH/${getWorkflowName(github)}/${github.event_name}/${job.status}`;
};

const getRepository = (github: IGithubContext): string =>
  github.repository || process.env.GITHUB_REPOSITORY || '';

const WORKFLOW_FILE_EXTENSION = /\.ya?ml$/i;

/**
 * Workflow name used to group builds. GitHub reports the workflow's `name:` when
 * set and otherwise the workflow file path (`.github/workflows/PR.yml`); the
 * path is reduced to its basename so rows read `PR` rather than the full path.
 */
const getWorkflowName = (github: IGithubContext): string => {
  const workflow = github.workflow || process.env.GITHUB_WORKFLOW || 'unknown';
  const segments = workflow.split('/');
  const basename = segments[segments.length - 1] ?? workflow;
  return basename.replace(WORKFLOW_FILE_EXTENSION, '') || 'unknown';
};

const getGithubEventName = (github: IGithubContext): string =>
  github.event_name || process.env.GITHUB_EVENT_NAME || 'unknown';

const getRunId = (github: IGithubContext): string | undefined =>
  github.run_id || process.env.GITHUB_RUN_ID;

const getRunAttempt = (github: IGithubContext): string =>
  github.run_attempt || process.env.GITHUB_RUN_ATTEMPT || '1';

const getVercelDeploymentId = (github: IGithubContext): string | undefined => {
  const deploymentId = github.event?.deployment?.id;
  if (typeof deploymentId === 'number' && Number.isFinite(deploymentId)) {
    return String(deploymentId);
  }
  const deploymentUrl = github.event?.deployment_status?.deployment_url;
  if (typeof deploymentUrl === 'string' && deploymentUrl.length > 0) {
    return deploymentUrl.split('/').pop();
  }
  return undefined;
};

/**
 * Stable id shared by the start and finish notifications of one build so the
 * collector can correlate them. GitHub and Vercel ids are namespaced to avoid
 * collisions. `run_attempt` keeps re-runs of the same GitHub run distinct.
 */
export const getBuildId = ({ github }: { github: IGithubContext }): string | undefined => {
  if (isVercelEvent(github)) {
    const deploymentId = getVercelDeploymentId(github);
    if (deploymentId) {
      return `vercel:${deploymentId}`;
    }
  }
  const runId = getRunId(github);
  return runId ? `github:${runId}:${getRunAttempt(github)}` : undefined;
};

export const getStartEventName = (github: IGithubContext): string =>
  `${getRepository(github)}/GH/${getWorkflowName(github)}/${getGithubEventName(github)}/in_progress`;

/** Emitted by the action's `pre` hook, before the job's first step runs. */
export const runStart = async ({
  ANALYTICA_TOKEN,
  github,
}: {
  ANALYTICA_TOKEN: string;
  github: IGithubContext;
}) => {
  try {
    if (isVercelEvent(github)) {
      // Vercel already reports queued/in_progress deployment_status states, so
      // emitting a synthetic start here would duplicate them.
      return;
    }
    const buildId = getBuildId({ github });
    if (!buildId) {
      core.warning('no build id calculated for start event');
      return;
    }
    const eventName = getStartEventName(github);
    const e = await event({ analyticaToken: ANALYTICA_TOKEN, buildId, eventName });
    if (e.error) {
      core.error('Unexpected tracking error:' + e.error);
    } else {
      core.info(`Tracked build start to analytica.click successfully:${eventName}`);
    }
  } catch {
    //never fail
  }
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
    const buildId = getBuildId({ github });
    const e = await event({
      analyticaToken: ANALYTICA_TOKEN,
      eventName,
      ...(buildId ? { buildId } : {}),
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
