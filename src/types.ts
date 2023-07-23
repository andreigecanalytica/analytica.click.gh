export interface IJobContext {
  status: 'failure' | 'success';
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
  event: Event;
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

export interface Event {
  action?: string;
  check_run: any;
  deployment?: Deployment;
  deployment_status?: DeploymentStatus;
  repository: Repository;
  sender: Sender;
  workflow?: string;
  workflow_run: any;
  inputs?: Inputs;
  ref?: string;
}

export interface Deployment {
  created_at: string;
  creator: Creator;
  description: any;
  environment: string;
  id: number;
  node_id: string;
  original_environment: string;
  // payload: Payload;
  performed_via_github_app: any;
  production_environment: boolean;
  ref: string;
  repository_url: string;
  sha: string;
  statuses_url: string;
  task: string;
  transient_environment: boolean;
  updated_at: string;
  url: string;
}

export interface Creator {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;
}

export interface DeploymentStatus {
  created_at: string;
  creator: Creator2;
  deployment_url: string;
  description: string;
  environment: string;
  environment_url: string;
  id: number;
  log_url: string;
  node_id: string;
  performed_via_github_app: any;
  repository_url: string;
  state: string;
  target_url: string;
  updated_at: string;
  url: string;
}

export interface Creator2 {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;
}

export interface Repository {
  allow_forking: boolean;
  archive_url: string;
  archived: boolean;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  clone_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  created_at: string;
  default_branch: string;
  deployments_url: string;
  description: any;
  disabled: boolean;
  downloads_url: string;
  events_url: string;
  fork: boolean;
  forks: number;
  forks_count: number;
  forks_url: string;
  full_name: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  has_discussions: boolean;
  has_downloads: boolean;
  has_issues: boolean;
  has_pages: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  homepage?: string;
  hooks_url: string;
  html_url: string;
  id: number;
  is_template: boolean;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  language: string;
  languages_url: string;
  license: any;
  merges_url: string;
  milestones_url: string;
  mirror_url: any;
  name: string;
  node_id: string;
  notifications_url: string;
  open_issues: number;
  open_issues_count: number;
  owner: Owner;
  private: boolean;
  pulls_url: string;
  pushed_at: string;
  releases_url: string;
  size: number;
  ssh_url: string;
  stargazers_count: number;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  svn_url: string;
  tags_url: string;
  teams_url: string;
  topics: any[];
  trees_url: string;
  updated_at: string;
  url: string;
  visibility: string;
  watchers: number;
  watchers_count: number;
  web_commit_signoff_required: boolean;
}

export interface Owner {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;
}

export interface Sender {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;
}

export interface Inputs {
  analyticaToken: string;
}
