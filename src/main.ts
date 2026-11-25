import * as core from '@actions/core';

import { getFailureDescription } from './annotations';
import type { IDeploy, IGithubContext, IJobContext } from './types';

const BUILD_REPORT_URL = 'https://api.analytica.click/site/event';
const MAX_RELEASE_LENGTH = 64;
const WORKFLOW_FILE_EXTENSION = /\.ya?ml$/i;
const IN_PROGRESS = 'in_progress';

interface IBuildReport {
  id: string;
  status: IJobContext['status'] | typeof IN_PROGRESS;
  repository?: string;
  workflow: string;
  url?: string;
  description?: string;
  name?: string;
  version?: string;
}

const getRepository = (github: IGithubContext): string =>
  github.repository || process.env.GITHUB_REPOSITORY || '';

/**
 * Workflow name used to group builds. GitHub reports the workflow's `name:` when
 * set and otherwise the workflow file path (`.github/workflows/PR.yml`); the
 * path is reduced to its basename so rows read `PR` rather than the full path.
 */
export const getWorkflowName = (github: IGithubContext): string => {
  const workflow = github.workflow || process.env.GITHUB_WORKFLOW || 'unknown';
  const segments = workflow.split('/');
  const basename = segments[segments.length - 1] ?? workflow;
  return basename.replace(WORKFLOW_FILE_EXTENSION, '') || 'unknown';
};

const getRunId = (github: IGithubContext): string | undefined =>
  github.run_id || process.env.GITHUB_RUN_ID;

/** Only a job that names what it deploys reports one. */
export const getDeploy = (name: string, version: string): IDeploy | undefined => {
  const trimmed = name.trim().slice(0, MAX_RELEASE_LENGTH);
  if (!trimmed) {
    return undefined;
  }
  const trimmedVersion = version.trim().slice(0, MAX_RELEASE_LENGTH);
  return { name: trimmed, ...(trimmedVersion ? { version: trimmedVersion } : {}) };
};

/**
 * Shared by the start and finish reports of one build. The jobs of a run are one build, except a
 * deploying job: it is a build of its own, so another job failing does not undo the deploy.
 */
export const getBuildId = (github: IGithubContext, deploy?: IDeploy): string | undefined => {
  const runId = getRunId(github);
  if (!runId) {
    return undefined;
  }
  const attempt = github.run_attempt || process.env.GITHUB_RUN_ATTEMPT || '1';
  return ['github', runId, attempt, ...(deploy ? [deploy.name] : [])].join(':');
};

const toReport = (
  github: IGithubContext,
  status: IBuildReport['status'],
  deploy: IDeploy | undefined,
): IBuildReport | undefined => {
  const id = getBuildId(github, deploy);
  if (!id) {
    core.warning('no build id calculated');
    return undefined;
  }
  const repository = getRepository(github);
  const runId = getRunId(github);
  return {
    id,
    status,
    workflow: getWorkflowName(github),
    ...(repository ? { repository } : {}),
    ...(repository && github.server_url.startsWith('https://')
      ? { url: `${github.server_url}/${repository}/actions/runs/${runId}` }
      : {}),
  };
};

/** Reporting never fails the job: a refusal or a network error is only logged. */
const send = async (key: string, build: IBuildReport): Promise<void> => {
  try {
    const response = await fetch(BUILD_REPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data: { build } }),
    });
    if (!response.ok) {
      core.error(`analytica.click refused the build report: HTTP ${response.status}`);
      return;
    }
    core.info(
      `Reported build to analytica.click: ${build.workflow} ${build.status}${
        build.name ? ` (deploy ${build.name})` : ''
      }`,
    );
  } catch (error) {
    core.warning(`analytica.click build report failed: ${String(error)}`);
  }
};

/** Sent from the action's `pre` hook, before the job's first step runs. */
export const runStart = async ({
  ANALYTICA_TOKEN,
  github,
  deploy,
}: {
  ANALYTICA_TOKEN: string;
  github: IGithubContext;
  deploy?: IDeploy;
}) => {
  const report = toReport(github, IN_PROGRESS, deploy);
  if (report) {
    await send(ANALYTICA_TOKEN, report);
  }
};

export const runParams = async ({
  ANALYTICA_TOKEN,
  GITHUB_TOKEN,
  github,
  job,
  deploy,
}: {
  ANALYTICA_TOKEN: string;
  GITHUB_TOKEN?: string;
  github: IGithubContext;
  job: IJobContext;
  deploy?: IDeploy;
}) => {
  const report = toReport(github, job.status, deploy);
  if (!report) {
    return;
  }
  const description =
    job.status === 'failure'
      ? await getFailureDescription({ GITHUB_TOKEN, label: report.workflow, github, job }).catch(
          () => undefined,
        )
      : undefined;
  await send(ANALYTICA_TOKEN, {
    ...report,
    ...(description ? { description } : {}),
    ...deploy,
  });
};
