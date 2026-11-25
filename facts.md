# Product facts

## Build reports

Decided 2026-11-26.

- The action reports each job as a build to `POST /site/event` (`data.build`) with the site admin key, before the job's first step and when it ends. It never fails the job.
- A job is a deploy only when it sets `DEPLOY_NAME`. `DEPLOY_VERSION` is optional: analytica.click uses the date and time without one.
- Vercel deployment events are not supported.
