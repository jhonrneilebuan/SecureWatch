namespace SecureWatch.Api.Models;

public enum IncidentPriority
{
    Low,
    Medium,
    High,
    Critical
}

public enum IncidentStatus
{
    Open,
    Investigating,
    Resolved,
    Closed
}

public sealed class Incident
{
    public Guid Id { get; set; }
    public Guid ThreatId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IncidentPriority Priority { get; set; }
    public IncidentStatus Status { get; set; } = IncidentStatus.Open;
    public Guid? AssignedTo { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAt { get; set; }
    public ICollection<IncidentNote> Notes { get; set; } = [];
}
