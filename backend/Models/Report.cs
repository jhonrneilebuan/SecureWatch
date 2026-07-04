namespace SecureWatch.Api.Models;

public sealed class Report
{
    public Guid Id { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public string ExecutiveSummary { get; set; } = string.Empty;
    public Guid GeneratedBy { get; set; }
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
}
