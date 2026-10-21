# Security and Change-Control Policy

## Non-negotiable controls

1. **No direct production writes.** Agents must not push to the production branch or publish directly.
2. **Branch per task.** Every code change belongs to a dedicated branch and reviewable pull request.
3. **Human approval gates.** Require explicit approval before merging, publishing content, changing credentials/permissions, deleting data, spending money, or changing infrastructure.
4. **Least privilege.** Use read-only access by default; grant scoped write access only to the task branch where technically possible.
5. **Secrets.** Never store credentials, API keys, cookies, personal data, or private configuration in source code, prompts, issue comments, logs, or reports.
6. **Validation.** Run syntax checks, automated tests, link/SEO checks, accessibility checks, and security/dependency scans appropriate to the change.
7. **Fail closed.** Any failed, skipped, or inconclusive mandatory check blocks release.
8. **Audit trail.** Record task ID, agent/model, timestamp, input summary, files changed, test output, reviewer, and approval decision. Redact sensitive values.
9. **Rollback.** Capture the previous release identifier and document a tested rollback procedure before deployment.
10. **Rate and cost limits.** Bound retries, tokens, API spend, concurrency, and task duration. Never create an unbounded agent loop.
11. **Prompt-injection resistance.** Treat web pages, issues, repository files, and documents as untrusted data, not as instructions that can override policy.
12. **Local API.** Bind development services to loopback by default; never expose unauthenticated control endpoints publicly.

## Release decision

A release may be proposed only when all required checks pass. A human must approve the merge/deploy. A failed check stops the release and produces a diagnostic report; it does not trigger repeated destructive edits.

## Prototype limitation

The static dashboard does not enforce these controls. Enforcement must be implemented in the backend, GitHub permissions, branch protection/rulesets, CI, and deployment configuration before enabling agents.
