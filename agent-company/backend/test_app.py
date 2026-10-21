import app as service


def test_health_is_explicit_about_prototype_mode(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "DB_PATH", tmp_path / "test.sqlite3")
    result = service.health()
    assert result["status"] == "ok"
    assert result["agents_running"] is False
    assert result["model_connected"] is False
    assert result["production_write_access"] is False


def test_task_queue_and_review_gate(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "DB_PATH", tmp_path / "test.sqlite3")
    task = service.create_task(service.TaskCreate(
        title="Audit broken links",
        description="Scan the site and report broken internal links.",
        agent_role="qa",
        risk="low",
    ))
    assert task["status"] == "queued"
    approved = service.decide_task(task["id"], "approve")
    assert approved["status"] == "approved"
    assert service.list_tasks(limit=10)[0]["id"] == task["id"]


def test_high_risk_task_is_not_auto_approved(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "DB_PATH", tmp_path / "test.sqlite3")
    task = service.create_task(service.TaskCreate(
        title="Change production deployment",
        description="Propose a deployment configuration change for review.",
        agent_role="engineering",
        risk="high",
    ))
    assert task["status"] == "queued"
