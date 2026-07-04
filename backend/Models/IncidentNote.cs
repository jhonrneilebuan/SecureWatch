namespace SecureWatch.Api.Models;

public sealed class IncidentNote
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public Guid UserId { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
