import os
import re
from collections import Counter
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

app = FastAPI(title="SecureWatch Security Engine", version="1.0.0")

FAILED_LOGIN_PATTERNS = (
    "failed password",
    "failed login",
    "authentication failure",
    "invalid user",
    "login failed",
)

SUCCESS_LOGIN_PATTERNS = (
    "accepted password",
    "successful login",
    "login success",
    "session opened",
)

SENSITIVE_ROUTE_PATTERNS = (
    "/admin",
    "/wp-admin",
    "/login",
    "/api/auth",
    "/settings",
)

KNOWN_MALICIOUS_IPS = {"185.220.101.1", "45.95.147.10"}

IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


class AnalyzeLogResponse(BaseModel):
    threatDetected: bool
    threatType: str | None = None
    severity: str | None = None
    sourceIp: str | None = None
    failedAttempts: int = 0
    successfulLogins: int = 0
    riskScore: int = 0
    topSourceIps: list[str] = []
    description: str | None = None
    recommendation: str | None = None


class AiRecommendationRequest(BaseModel):
    threatType: str
    severity: str
    sourceIp: str
    failedAttempts: int = 0
    riskScore: int = 0
    logSample: str | None = None


class AiRecommendationResponse(BaseModel):
    threatExplanation: str
    possibleImpact: str
    recommendedActions: str
    preventionSteps: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/analyze-log", response_model=AnalyzeLogResponse)
async def analyze_log(file: UploadFile = File(...)) -> AnalyzeLogResponse:
    content = (await file.read()).decode("utf-8", errors="ignore")
    failed_attempts_by_ip: Counter[str] = Counter()
    successful_logins = 0
    sensitive_route_hits: Counter[str] = Counter()
    all_ips: Counter[str] = Counter()

    for line in content.splitlines():
        normalized = line.lower()
        ips = IP_PATTERN.findall(line)
        if ips:
            all_ips.update([ips[0]])

        if any(pattern in normalized for pattern in SUCCESS_LOGIN_PATTERNS):
            successful_logins += 1

        if ips and any(route in normalized for route in SENSITIVE_ROUTE_PATTERNS):
            sensitive_route_hits.update([ips[0]])

        if not any(pattern in normalized for pattern in FAILED_LOGIN_PATTERNS):
            continue

        # Cybersecurity logic: repeated authentication failures from the same
        # source IP are a common brute-force indicator. Risk increases when the
        # same source also touches sensitive routes or is on a known bad list.
        if ips:
            failed_attempts_by_ip.update([ips[0]])

    if not failed_attempts_by_ip and not sensitive_route_hits:
        return AnalyzeLogResponse(
            threatDetected=False,
            successfulLogins=successful_logins,
            topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
        )

    source_ip, attempts = failed_attempts_by_ip.most_common(1)[0] if failed_attempts_by_ip else sensitive_route_hits.most_common(1)[0]
    risk_score = min(100, attempts * 15 + sensitive_route_hits[source_ip] * 8 + (30 if source_ip in KNOWN_MALICIOUS_IPS else 0))
    threat_detected = attempts >= 3 or sensitive_route_hits[source_ip] >= 5
    severity = "Low"
    threat_type = "Suspicious IP Activity"

    if attempts >= 10 or source_ip in KNOWN_MALICIOUS_IPS:
        severity = "Critical"
        threat_type = "Critical Brute Force Attack"
        risk_score = max(risk_score, 95)
    elif attempts >= 5:
        severity = "High"
        threat_type = "Brute Force Attack"
        risk_score = max(risk_score, 85)
    elif attempts >= 3 or sensitive_route_hits[source_ip] >= 5:
        severity = "Medium"
        threat_type = "Multiple Failed Login Attempts"
        risk_score = max(risk_score, 55)

    if threat_detected:
        return AnalyzeLogResponse(
            threatDetected=True,
            threatType=threat_type,
            severity=severity,
            sourceIp=source_ip,
            failedAttempts=attempts,
            successfulLogins=successful_logins,
            riskScore=risk_score,
            topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
            description=f"{attempts} failed login attempts and {sensitive_route_hits[source_ip]} sensitive route hits were detected from {source_ip}.",
            recommendation="Block or rate-limit the IP address, enable MFA, reset affected credentials, and review authentication logs.",
        )

    return AnalyzeLogResponse(threatDetected=False, successfulLogins=successful_logins, topSourceIps=[ip for ip, _ in all_ips.most_common(5)])


@app.post("/ai-recommendation", response_model=AiRecommendationResponse)
async def ai_recommendation(request: AiRecommendationRequest) -> AiRecommendationResponse:
    # The service is OpenAI-ready through OPENAI_API_KEY. For local defensive
    # development without a key, deterministic guidance keeps the workflow usable.
    if not os.getenv("OPENAI_API_KEY"):
        return AiRecommendationResponse(
            threatExplanation=f"{request.threatType} was detected from {request.sourceIp} with risk score {request.riskScore}.",
            possibleImpact="The activity can lead to account takeover, credential exposure, and unauthorized access to sensitive systems.",
            recommendedActions="Block or rate-limit the source IP, force password resets for targeted accounts, enable MFA, and preserve logs for investigation.",
            preventionSteps="Apply account lockout thresholds, monitor authentication failures, restrict admin portals, and alert on repeated source IP activity.",
        )

    return AiRecommendationResponse(
        threatExplanation=f"AI key configured. Generate guidance for {request.threatType}.",
        possibleImpact="Use OpenAI SDK integration here for production recommendations.",
        recommendedActions="Keep API keys server-side and log recommendation generation in audit records.",
        preventionSteps="Validate prompts and avoid sending secrets or unnecessary PII to external AI services.",
    )
