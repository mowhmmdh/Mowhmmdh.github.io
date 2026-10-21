# AI Company — Phase 1 Foundation

A local-first, safety-first control plane for a multi-agent workflow supporting the bilingual professional website. This folder is isolated on the `ai-company/phase-1-foundation` branch; it does not alter the published website on `main`.

## Current status

**Foundation / prototype only.** The dashboard is a static bilingual UI. No autonomous agents are running yet, no model provider is connected, and no production changes are made by this prototype.

## Principles

- Persian and English UI with correct RTL/LTR behavior.
- Local-first operation for a Windows computer with 8 GB RAM and no discrete GPU.
- Agents work on tasks and proposals, not directly on production.
- Least privilege; no secrets in prompts, logs, commits, or reports.
- Human approval for merges, publishing, credentials, destructive operations, and material changes.
- Tests and security/quality checks must pass before a change can be proposed for release.
- Every task records its owner, input, output, changed files, validation results, and status.
- Failed validation means stop, preserve logs, and provide a rollback path.
- Weekly bilingual activity report.

## Planned roles

1. **Orchestrator / AI manager** — assigns scoped tasks and coordinates dependencies.
2. **SEO & analytics** — audits technical SEO and measures results; never fabricates metrics.
3. **Content** — drafts Persian and English content for review; no automatic publishing.
4. **Engineering** — proposes changes in isolated branches.
5. **Security & QA** — independently checks changes and blocks unsafe releases.
6. **Repair / regression agent** — reproduces defects, proposes a fix, and runs regression checks.
7. **Reporting** — compiles activity, evidence, blockers, costs, and next steps.

## Safe rollout

1. Review this isolated foundation.
2. Create a **separate private repository** for the company application when repository-creation access is available. Keep this prototype folder out of the public site’s production deployment.
3. Develop the local API and task queue with SQLite; add an authenticated local dashboard.
4. Add model provider support with explicit local/API selection and cost limits.
5. Add branch-per-task automation and CI checks. Never give agents direct write access to `main`.
6. Run in observe/draft mode first; evaluate quality before enabling any bounded automation.
7. Only publish through a reviewed pull request and explicit approval.

## Local development target

- Python 3.11+ / FastAPI for the local API
- SQLite for task and audit metadata
- Static HTML/CSS/JS dashboard initially
- Optional local model runtime; API providers are opt-in
- GitHub Actions for deterministic quality checks

Do not put API keys in this repository. Use environment variables or a local secrets manager. Do not expose the local API to the public internet.
