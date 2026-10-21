# Local Control Plane (Prototype)

This is the first runnable backend slice for the AI Company project. It is deliberately **not an autonomous agent runner yet**.

## What works
- FastAPI health endpoint.
- SQLite-backed task queue.
- Task role/risk validation.
- Explicit approve/reject decision record.
- Automated tests for the queue and safety defaults.

## What does not work yet
- No model/provider is connected.
- No agents execute tasks.
- Approving a task only records a decision; it does not execute anything.
- No website files are read or changed.
- No publishing, deployments, external integrations, or credentials are used.

## Windows setup
Run from this directory in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest -q
uvicorn app:app --host 127.0.0.1 --port 8787
```

Open http://127.0.0.1:8787/docs for the local API. Keep the host set to `127.0.0.1`; do not expose this prototype to the public internet.

SQLite database defaults to `agent_company.sqlite3` in this folder. Set `AGENT_COMPANY_DB` to use a different path.

## API examples
- `GET /health`
- `GET /api/tasks`
- `POST /api/tasks` with JSON body such as:
  `{"title":"Audit broken links","description":"Scan internal links and report failures.","agent_role":"qa","risk":"low"}`
- `POST /api/tasks/{id}/decision?decision=approve` or `decision=reject`

## Next gates
Before connecting a model: add authentication even for any LAN use, resource/cost limits, audit logs, and tool allowlists. Before agents can change files: use isolated worktrees/branches, read-only baseline tests, secret scanning, dependency/security scans, and human-reviewed PRs. Production publication remains a separate explicit release gate.
