export interface IJobContext {
  status: 'failure' | 'success' | 'cancelled';
  check_run_id?: number;
}
export interface IAnnotation {
  path?: string;
  start_line?: number;
  end_line?: number;
  annotation_level?: string;
  title?: string;
  message?: string;
  raw_details?: string;
}
export interface IGithubContext {
  token: string;
  job: string;
  ref: string;
  sha: string;
  repository: string;
  repository_owner: string;
  repository_owner_id: string;
  repositoryUrl: string;
  run_id: string;
  run_number: string;
  retention_days: string;
  run_attempt: string;
  artifact_cache_size_limit: string;
  repository_visibility: string;
  'repo-self-hosted-runners-disabled': boolean;
  repository_id: string;
  actor_id: string;
  actor: string;
  triggering_actor: string;
  workflow: string;
  head_ref: string;
  base_ref: string;
  event_name: string;
  server_url: string;
  api_url: string;
  graphql_url: string;
  ref_name: string;
  ref_protected: boolean;
  ref_type: string;
  secret_source: string;
  workflow_ref: string;
  workflow_sha: string;
  workspace: string;
  action: string;
  event_path?: string;
  action_repository?: string;
  action_ref?: string;
  path?: string;
  env?: string;
  step_summary?: string;
  state?: string;
  output?: string;
}

/** What a deploying job puts live, such as `web`, and optionally which version. */
export interface IDeploy {
  name: string;
  version?: string;
}
