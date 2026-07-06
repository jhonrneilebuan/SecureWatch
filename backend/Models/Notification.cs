namespace SecureWatch.Api.Models;

public enum NotificationSeverity
{
    Info,
    Warning,
    Critical
}

public sealed class Notification
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationSeverity Severity { get; set; } = NotificationSeverity.Info;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
