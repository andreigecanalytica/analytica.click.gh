import * as core from '@actions/core';

import type { IAnnotation, IGithubContext } from './types';

export const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_ANNOTATIONS_PER_RUN = 100;
const MAX_CHECK_RUNS = 100;
const MAX_DESCRIPTIONS = 3;
const MAX_CHECK_RUNS_TO_SCAN = 5;

interface ICheckRun {
  id: number;
  name?: string;
  conclusion?: string;
}

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const formatAnnotation = (
  annotation: IAnnotation,
  checkRunName?: string,
): string | undefined => {
  const path = typeof annotation.path === 'string' ? annotation.path.trim() : '';
  const title = typeof annotation.title === 'string' ? annotation.title.trim() : '';
  const level =
    typeof annotation.annotation_level === 'string' ? annotation.annotation_level.trim() : '';
  const rawMessage =
    typeof annotation.message === 'string'
      ? annotation.message
      : typeof annotation.raw_details === 'string'
        ? annotation.raw_details
        : '';
  const detail = normalize(rawMessage);
  if (!detail) {
    return undefined;
  }

  const location =
    path && annotation.start_line
      ? `${path}#L${annotation.start_line}${
          annotation.end_line && annotation.end_line !== annotation.start_line
            ? `-L${annotation.end_line}`
            : ''
        }`
      : path || undefined;
  const label = title && title !== detail ? `${title}: ` : '';
  const runPrefix = checkRunName ? `${checkRunName}: ` : '';
  const levelPrefix = level && level !== 'failure' ? `${level}: ` : '';
  return normalize(`${levelPrefix}${runPrefix}${label}${location ? `${location} ` : ''}${detail}`);
};

export const truncateDescription = (description: string): string => {
  const normalized = normalize(description);
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
};

const githubRequest = async <T>({
  GITHUB_TOKEN,
  github,
  path,
}: {
  GITHUB_TOKEN: string;
  github: IGithubContext;
  path: string;
}): Promise<T | undefined> => {
  try {
    // cross-fetch/polyfill (imported in index.ts) provides global fetch on node16
    const response = await fetch(`${github.api_url}/repos/${github.repository}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      core.warning(`GitHub annotations request failed: ${response.status} ${path}`);
      return undefined;
    }
    return (await response.json()) as T;
  } catch (error) {
    core.warning(`GitHub annotations request failed: ${String(error)}`);
    return undefined;
  }
};

const listFailedCheckRuns = async ({
  GITHUB_TOKEN,
  github,
}: {
  GITHUB_TOKEN: string;
  github: IGithubContext;
}): Promise<ICheckRun[]> => {
  if (!github.sha) {
    return [];
  }
  const data = await githubRequest<{ check_runs?: ICheckRun[] }>({
    GITHUB_TOKEN,
    github,
    path: `/commits/${github.sha}/check-runs?filter=latest&per_page=${MAX_CHECK_RUNS}`,
  });
  return (data?.check_runs ?? []).filter((run) => run.conclusion === 'failure');
};

const listAnnotations = async ({
  GITHUB_TOKEN,
  checkRunId,
  github,
}: {
  GITHUB_TOKEN: string;
  checkRunId: number;
  github: IGithubContext;
}): Promise<IAnnotation[]> => {
  const data = await githubRequest<IAnnotation[]>({
    GITHUB_TOKEN,
    github,
    path: `/check-runs/${checkRunId}/annotations?per_page=${MAX_ANNOTATIONS_PER_RUN}`,
  });
  return Array.isArray(data) ? data : [];
};

export const getFailureDescription = async ({
  GITHUB_TOKEN,
  eventName,
  github,
}: {
  GITHUB_TOKEN?: string;
  eventName: string;
  github: IGithubContext;
}): Promise<string | undefined> => {
  if (!GITHUB_TOKEN) {
    core.info('Skipping failure description: no GITHUB_TOKEN provided');
    return undefined;
  }
  // Check-run names match the workflow job name (github.job), so prefer runs
  // for this job but fall back to every failed run on the sha.
  const checkRuns = await listFailedCheckRuns({ GITHUB_TOKEN, github });
  const forThisJob = checkRuns.filter((run) => run.name === github.job);
  const relevant = [...forThisJob, ...checkRuns.filter((run) => run.name !== github.job)];
  const scanned = relevant.slice(0, MAX_CHECK_RUNS_TO_SCAN);
  const annotationsByRun = await Promise.all(
    scanned.map(async (checkRun) => ({
      checkRun,
      annotations: await listAnnotations({
        GITHUB_TOKEN,
        checkRunId: checkRun.id,
        github,
      }),
    })),
  );
  const descriptions: string[] = [];
  for (const { annotations, checkRun } of annotationsByRun) {
    for (const annotation of annotations) {
      if (annotation.annotation_level === 'notice') {
        continue;
      }
      const formatted = formatAnnotation(annotation, checkRun.name);
      if (formatted && !descriptions.includes(formatted)) {
        descriptions.push(formatted);
      }
      if (descriptions.length >= MAX_DESCRIPTIONS) {
        break;
      }
    }
    if (descriptions.length >= MAX_DESCRIPTIONS) {
      break;
    }
  }
  if (descriptions.length === 0) {
    core.info(`No failure annotations found for ${eventName}`);
    return undefined;
  }
  return truncateDescription(descriptions.join(' | '));
};
