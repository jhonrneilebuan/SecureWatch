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

SQL_INJECTION_PATTERNS = (
    "' or '1'='1",
    "union select",
    "drop table",
    "information_schema",
    "sql injection",
)

PRIVILEGE_ESCALATION_PATTERNS = (
    "privilege escalation",
    "role escalation",
    "role changed",
    "admin role granted",
    "sudo",
)

IMPOSSIBLE_TRAVEL_PATTERNS = (
    "impossible travel",
    "geo-velocity",
    "geovelocity",
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
    mitreTechniqueId: str | None = None
    mitreTechniqueName: str | None = None
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


def mitre_for(threat_type: str) -> tuple[str, str]:
    normalized = threat_type.lower()
    if "brute" in normalized or "failed login" in normalized:
        return "T1110", "Brute Force"
    if "sql injection" in normalized:
        return "T1190", "Exploit Public-Facing Application"
    if "privilege" in normalized:
        return "T1068", "Exploitation for Privilege Escalation"
    if "impossible travel" in normalized:
        return "T1078", "Valid Accounts"
    if "admin" in normalized:
        return "T1078", "Valid Accounts"
    return "T1087", "Account Discovery"


@app.post("/analyze-log", response_model=AnalyzeLogResponse)
async def analyze_log(file: UploadFile = File(...)) -> AnalyzeLogResponse:
    content = (await file.read()).decode("utf-8", errors="ignore")
    failed_attempts_by_ip: Counter[str] = Counter()
    successful_logins = 0
    sensitive_route_hits: Counter[str] = Counter()
    denied_admin_hits: Counter[str] = Counter()
    sql_injection_hits: Counter[str] = Counter()
    privilege_escalation_hits: Counter[str] = Counter()
    impossible_travel_hits: Counter[str] = Counter()
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

        if ips and "/admin" in normalized and any(code in normalized for code in ("401", "403", "denied", "forbidden")):
            denied_admin_hits.update([ips[0]])

        if ips and any(pattern in normalized for pattern in SQL_INJECTION_PATTERNS):
            sql_injection_hits.update([ips[0]])

        if ips and any(pattern in normalized for pattern in PRIVILEGE_ESCALATION_PATTERNS):
            privilege_escalation_hits.update([ips[0]])

        if ips and any(pattern in normalized for pattern in IMPOSSIBLE_TRAVEL_PATTERNS):
            impossible_travel_hits.update([ips[0]])

        if not any(pattern in normalized for pattern in FAILED_LOGIN_PATTERNS):
            continue

        # Cybersecurity logic: repeated authentication failures from the same
        # source IP are a common brute-force indicator. Risk increases when the
        # same source also touches sensitive routes or is on a known bad list.
        if ips:
            failed_attempts_by_ip.update([ips[0]])

    if not any((failed_attempts_by_ip, sensitive_route_hits, denied_admin_hits, sql_injection_hits, privilege_escalation_hits, impossible_travel_hits)):
        return AnalyzeLogResponse(
            threatDetected=False,
            successfulLogins=successful_logins,
            topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
        )

    if sql_injection_hits:
        source_ip, hits = sql_injection_hits.most_common(1)[0]
        mitre_id, mitre_name = mitre_for("SQL Injection Attempt")
        return AnalyzeLogResponse(
            threatDetected=True,
            threatType="SQL Injection Attempt",
            severity="High",
            sourceIp=source_ip,
            riskScore=max(88, min(100, hits * 22)),
            topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
            mitreTechniqueId=mitre_id,
            mitreTechniqueName=mitre_name,
            description=f"{hits} SQL injection-like request pattern(s) were detected from {source_ip}.",
            recommendation="Block or challenge the source IP, inspect affected routes, verify parameterized queries, and review WAF logs.",
        )

    if privilege_escalation_hits:
        source_ip, hits = privilege_escalation_hits.most_common(1)[0]
        mitre_id, mitre_name = mitre_for("Privilege Escalation Attempt")
        return AnalyzeLogResponse(
            threatDetected=True,
            threatType="Privilege Escalation Attempt",
            severity="Critical",
            sourceIp=source_ip,
            riskScore=max(95, min(100, hits * 30)),
            topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
            mitreTechniqueId=mitre_id,
            mitreTechniqueName=mitre_name,
            description=f"{hits} possible privilege escalation event(s) were detected from {source_ip}.",
            recommendation="Disable suspicious sessions, review role changes, rotate privileged credentials, and verify admin activity.",
        )

    if impossible_travel_hits:
        source_ip, hits = impossible_travel_hits.most_common(1)[0]
        mitre_id, mitre_name = mitre_for("Impossible Travel Login")
        return AnalyzeLogResponse(
            threatDetected=True,
            threatType="Impossible Travel Login",
            severity="High",
            sourceIp=source_ip,
            riskScore=max(90, min(100, hits * 25)),
            topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
            mitreTechniqueId=mitre_id,
            mitreTechniqueName=mitre_name,
            description=f"{hits} impossible-travel or geo-velocity event(s) were detected for {source_ip}.",
            recommendation="Invalidate active sessions, require MFA re-authentication, review location history, and verify the user's identity.",
        )

    if denied_admin_hits:
        source_ip, hits = denied_admin_hits.most_common(1)[0]
        if hits >= 3:
            mitre_id, mitre_name = mitre_for("Suspicious Admin Access")
            return AnalyzeLogResponse(
                threatDetected=True,
                threatType="Suspicious Admin Access",
                severity="High" if hits >= 5 else "Medium",
                sourceIp=source_ip,
                failedAttempts=hits,
                successfulLogins=successful_logins,
                riskScore=max(60, min(100, hits * 18)),
                topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
                mitreTechniqueId=mitre_id,
                mitreTechniqueName=mitre_name,
                description=f"{hits} denied admin-route request(s) were detected from {source_ip}.",
                recommendation="Review admin portal access, enforce MFA, restrict admin routes by IP, and inspect user sessions.",
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
        mitre_id, mitre_name = mitre_for(threat_type)
        return AnalyzeLogResponse(
            threatDetected=True,
            threatType=threat_type,
            severity=severity,
            sourceIp=source_ip,
            failedAttempts=attempts,
            successfulLogins=successful_logins,
            riskScore=risk_score,
            topSourceIps=[ip for ip, _ in all_ips.most_common(5)],
            mitreTechniqueId=mitre_id,
            mitreTechniqueName=mitre_name,
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
