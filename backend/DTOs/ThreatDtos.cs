namespace SecureWatch.Api.DTOs;

public sealed record ThreatDto(
    Guid Id,
    Guid? SecurityLogId,
    string ThreatType,
    string Severity,
    string SourceIP,
    int FailedAttempts,
    int RiskScore,
    string Description,
    string Recommendation,
    string MitreTechniqueId,
    string MitreTechniqueName,
    string? AiExplanation,
    string? AiImpact,
    string? AiPreventionSteps,
    DateTimeOffset CreatedAt);

public sealed record SecurityEngineResult(
    bool ThreatDetected,
    string? ThreatType,
    string? Severity,
    string? SourceIp,
    int FailedAttempts,
    int SuccessfulLogins,
    int RiskScore,
    IReadOnlyCollection<string>? TopSourceIps,
    string? MitreTechniqueId,
    string? MitreTechniqueName,
    string? Description,
    string? Recommendation);

public sealed record IngestSecurityEventRequest(
    string SourceSystem,
    string EventType,
    string SourceIp,
    string? Username,
    string? Route,
    int Count,
    string? Message,
    DateTimeOffset? OccurredAt);

public sealed record IngestSecurityEventResponse(
    bool ThreatDetected,
    Guid? ThreatId,
    Guid? IncidentId,
    string Message);

public sealed record AiRecommendationRequest(
    string ThreatType,
    string Severity,
    string SourceIp,
    int FailedAttempts,
    int RiskScore,
    string? LogSample);

public sealed record AiRecommendationResponse(
    string ThreatExplanation,
    string PossibleImpact,
    string RecommendedActions,
    string PreventionSteps);
