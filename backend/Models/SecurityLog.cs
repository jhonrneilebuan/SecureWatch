namespace SecureWatch.Api.Models;

public enum SecurityLogStatus
{
    Uploaded,
    Analyzed,
    ThreatDetected,
    Failed
}

public sealed class SecurityLog
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public Guid UploadedBy { get; set; }
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
    public SecurityLogStatus Status { get; set; } = SecurityLogStatus.Uploaded;
    public int FailedLoginAttempts { get; set; }
    public int SuccessfulLogins { get; set; }
}
