"""Local-only control plane prototype. It queues work; it does not run agents or touch the production site."""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

APP_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("AGENT_COMPANY_DB", str(APP_DIR / "agent_company.sqlite3")))

app = FastAPI(
    title="AI Company Control Plane",
    version="0.1.0",
    description=(
        "Local-only prototype. Tasks are recorded for review; this API does not call an LLM, "
        "execute code, publish content, or modify the production website."
    ),
    docs_url="/docs",
    redoc_url=None,
)

# Permit only the local dashboard origins used by the documented dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8788", "http://localhost:8788"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

TaskStatus = Literal["queued", "approved", "rejected", "completed", "failed"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                agent_role TEXT NOT NULL,
                risk TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )"""
        )
        conn.commit()
        yield conn
    finally:
        conn.close()


class TaskCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=5, max_length=4000)
    agent_role: Literal["ceo", "seo", "content", "engineering", "security", "analytics", "qa"]
    risk: Literal["low", "medium", "high"] = "low"


class TaskRecord(BaseModel):
    id: str
    title: str
    description: str
    agent_role: str
    risk: str
    status: TaskStatus
    created_at: str
    updated_at: str


def row_to_task(row: sqlite3.Row) -> dict:
    return {key: row[key] for key in row.keys()}


@app.get("/health")
def health():
    with db() as conn:
        conn.execute("SELECT 1").fetchone()
    return {
        "status": "ok",
        "service": "ai-company-control-plane",
        "mode": "local-prototype",
        "agents_running": False,
        "model_connected": False,
        "production_write_access": False,
        "timestamp": now_iso(),
    }


@app.get("/api/tasks", response_model=list[TaskRecord])
def list_tasks(limit: int = Query(default=50, ge=1, le=200)):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [row_to_task(row) for row in rows]


@app.post("/api/tasks", response_model=TaskRecord, status_code=201)
def create_task(payload: TaskCreate):
    # High-risk work is recorded, but never implicitly approved or executed.
    stamp = now_iso()
    task_id = str(uuid4())
    with db() as conn:
        conn.execute(
            """INSERT INTO tasks
               (id, title, description, agent_role, risk, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)""",
            (
                task_id, payload.title.strip(), payload.description.strip(),
                payload.agent_role, payload.risk, stamp, stamp,
            ),
        )
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return row_to_task(row)


@app.post("/api/tasks/{task_id}/decision", response_model=TaskRecord)
def decide_task(task_id: str, decision: Literal["approve", "reject"]):
    with db() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        if row["status"] != "queued":
            raise HTTPException(status_code=409, detail="Only queued tasks can be reviewed")
        # Approval is a review record only. It does not launch work or grant production access.
        status = "approved" if decision == "approve" else "rejected"
        conn.execute(
            "UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?",
            (status, now_iso(), task_id),
        )
        updated = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return row_to_task(updated)
