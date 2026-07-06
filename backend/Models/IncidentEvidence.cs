namespace SecureWatch.Api.Models;

public sealed class IncidentEvidence
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public Guid AddedBy { get; set; }
    public string Title { get; set; } = string.Empty;
    public string EvidenceType { get; set; } = "Reference";
    public string Reference { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
