namespace SecureWatch.Api.DTOs;

public sealed record DashboardSummaryDto(
    int TotalLogs,
    int ThreatsDetected,
    int HighRiskAlerts,
    int CriticalAlerts,
    int ActiveIncidents,
    int ResolvedIncidents,
    int MaliciousIps,
    int FailedLoginAttempts,
    IReadOnlyCollection<SeverityCountDto> ThreatSeverity,
    IReadOnlyCollection<TimelinePointDto> AttackTimeline,
    IReadOnlyCollection<IpCountDto> TopAttackingIps,
    IReadOnlyCollection<StatusCountDto> IncidentStatus);

public sealed record SeverityCountDto(string Severity, int Count);
public sealed record TimelinePointDto(string Date, int Threats);
public sealed record IpCountDto(string IpAddress, int Count);
public sealed record StatusCountDto(string Status, int Count);
