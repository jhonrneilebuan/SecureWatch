namespace SecureWatch.Api.Models;

public enum ThreatSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public sealed class Threat
{
    public Guid Id { get; set; }
    public Guid? SecurityLogId { get; set; }
    public string ThreatType { get; set; } = string.Empty;
    public ThreatSeverity Severity { get; set; }
    public string SourceIP { get; set; } = string.Empty;
    public int FailedAttempts { get; set; }
    public int RiskScore { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
    public string MitreTechniqueId { get; set; } = string.Empty;
    public string MitreTechniqueName { get; set; } = string.Empty;
    public string? AiExplanation { get; set; }
    public string? AiImpact { get; set; }
    public string? AiPreventionSteps { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
