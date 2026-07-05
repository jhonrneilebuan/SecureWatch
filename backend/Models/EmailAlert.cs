namespace SecureWatch.Api.Models;

public enum EmailAlertStatus
{
    Sent,
    Failed,
    Skipped
}

public sealed class EmailAlert
{
    public Guid Id { get; set; }
    public Guid? ThreatId { get; set; }
    public string Recipients { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public EmailAlertStatus Status { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
