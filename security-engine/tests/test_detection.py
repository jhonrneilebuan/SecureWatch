from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_brute_force_detection_after_five_failed_attempts():
    log = "\n".join(
        f"Jul 05 sshd[100{i}]: Failed password for admin from 192.168.1.10 port 22"
        for i in range(5)
    )

    response = client.post(
        "/analyze-log",
        files={"file": ("auth.log", log.encode("utf-8"), "text/plain")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["threatDetected"] is True
    assert body["threatType"] == "Brute Force Attack"
    assert body["severity"] == "High"
    assert body["sourceIp"] == "192.168.1.10"
    assert body["failedAttempts"] == 5


def test_clean_log_returns_no_threat():
    log = "Jul 05 sshd[2000]: Accepted password for analyst from 10.0.0.5 port 22"

    response = client.post(
        "/analyze-log",
        files={"file": ("auth.log", log.encode("utf-8"), "text/plain")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["threatDetected"] is False
    assert body["successfulLogins"] == 1
